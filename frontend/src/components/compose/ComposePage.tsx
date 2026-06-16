// frontend/src/components/compose/ComposePage.tsx
import { useState, useCallback, useRef } from 'react'
import { Row, Col, Card, Steps, Button, Input, Select, Tag, Typography, Space, Flex, Divider, message, DatePicker, TimePicker, Form } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import WorkshopSelector from './WorkshopSelector'
import { EMAIL_TYPES } from './EmailTypeSelector'
import ImageUpload from './ImageUpload'
import ChatPanel from '../shared/ChatPanel'
import EmailPreview from '../shared/EmailPreview'
import { streamGenerateV1, streamChatEdit, postEmailDraft } from '../../api'
import { useEmailContext } from '../../contexts/EmailContext'
import type { Participant, Workshop, ChatMessage, EmailDraft, ImageEntry } from '../../types'

type GenState = 'idle' | 'generating' | 'ready' | 'editing'

const MEETING_ROOMS = [
  'Sài Gòn – Đà Nẵng Room, VNG Campus',
  'Đà Nẵng – Hà Nội Room, VNG Campus',
  'Shanghai Room, VNG Campus',
  'Rome Room, VNG Campus',
  'Atrium, VNG Campus',
  'Online (Microsoft Teams)',
]

const STEPS = [
  { title: 'Học viên' },
  { title: 'Nội dung' },
  { title: 'Loại email' },
  { title: 'Hình ảnh' },
]

const EMAIL_TYPE_OPTIONS = EMAIL_TYPES.map(t => ({ value: t.value, label: t.label }))

export default function ComposePage() {
  const { addEmail } = useEmailContext()

  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)

  // Structured step-2 fields
  const [programName, setProgramName] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [location, setLocation] = useState('')
  const [hrbpName, setHrbpName] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  const [emailType, setEmailType] = useState('invite')
  const [extraInstructions, setExtraInstructions] = useState('')
  const [images, setImages] = useState<ImageEntry[]>([])

  const [genState, setGenState] = useState<GenState>('idle')
  const [emailHtml, setEmailHtml] = useState('')
  const [subject, setSubject] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])

  // Throttle HTML re-renders during streaming
  const accRef = useRef('')
  const lastFlushRef = useRef(0)
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const stripFences = (s: string) =>
    s.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim()

  const flushHtml = useCallback(() => {
    flushTimerRef.current = null
    lastFlushRef.current = Date.now()
    setEmailHtml(stripFences(accRef.current))
  }, [])

  const onChunk = useCallback((chunk: string) => {
    accRef.current += chunk
    const now = Date.now()
    if (now - lastFlushRef.current >= 250) {
      if (flushTimerRef.current) clearTimeout(flushTimerRef.current)
      flushHtml()
    } else if (!flushTimerRef.current) {
      flushTimerRef.current = setTimeout(flushHtml, 250)
    }
  }, [flushHtml])
  const [isRefining, setIsRefining] = useState(false)

  const datetimeStr = [
    timeStart && timeEnd ? `${timeStart} - ${timeEnd}` : timeStart || timeEnd,
    date,
  ].filter(Boolean).join(', ')

  const workshopContext = [
    programName && `Tên chương trình: ${programName}`,
    datetimeStr && `Thời gian: ${datetimeStr}`,
    location && `Địa điểm: ${location}`,
    hrbpName && `Tên PIC: ${hrbpName}`,
    additionalNotes,
  ].filter(Boolean).join('\n')

  const currentStep = (() => {
    if (participants.length === 0) return 0
    if (!programName.trim()) return 1
    if (!emailType) return 2
    return 3
  })()

  const handleGenerate = useCallback(async () => {
    setGenState('generating')
    setEmailHtml('')
    setChatHistory([])
    accRef.current = ''
    lastFlushRef.current = 0
    if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
    try {
      await streamGenerateV1(
        { email_type: emailType, workshop_context: workshopContext, extra_instructions: extraInstructions, file_ids: images.map(i => i.fileId) },
        onChunk,
      )
      // Final flush — strip markdown fences model sometimes outputs
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
      setEmailHtml(stripFences(accRef.current))
      const typeLabel = EMAIL_TYPES.find(t => t.value === emailType)?.label ?? emailType
      setSubject(`[Toro] ${typeLabel} — ${selectedWorkshop?.short ?? programName}`)
      setGenState('ready')
    } catch (e) {
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
      message.error(String(e))
      setGenState('idle')
    }
  }, [emailType, workshopContext, extraInstructions, images, selectedWorkshop, programName, onChunk])

  const handleChatSend = useCallback(async (msg: string, imageDataUrl?: string) => {
    const userMsg: ChatMessage = { role: 'user', content: msg }
    const updatedHistory = [...chatHistory, userMsg]
    setChatHistory(updatedHistory)
    setIsRefining(true)
    setGenState('editing')
    accRef.current = ''
    lastFlushRef.current = 0
    if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
    try {
      await streamChatEdit(
        { current_email: emailHtml, message: msg, history: updatedHistory, image_data_url: imageDataUrl },
        onChunk,
      )
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
      setEmailHtml(stripFences(accRef.current))
      setChatHistory(h => [...h, { role: 'assistant', content: 'Email đã được cập nhật.' }])
      setGenState('ready')
    } catch (e) {
      message.error(String(e))
      setGenState('ready')
    } finally {
      setIsRefining(false)
    }
  }, [emailHtml, chatHistory])

  const handleSendToQueue = useCallback(async () => {
    const typeLabel = EMAIL_TYPES.find(t => t.value === emailType)?.label ?? emailType
    const preview = emailHtml.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)
    const now = new Date()
    const draft: EmailDraft = {
      id: `compose-${Date.now()}`,
      type: emailType,
      label: typeLabel,
      session: null,
      date: now.toLocaleDateString('vi-VN'),
      count: participants.length || 1,
      status: 'pending',
      time: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      preview,
      subject,
      body: emailHtml,
      to: participants.map(p => p.email).filter(Boolean),
    }
    try {
      await postEmailDraft(draft)
    } catch {
      message.warning('Không thể lưu lên server, email chỉ tồn tại trong session này.')
    }
    addEmail(draft)
    message.success('Email đã được thêm vào hàng chờ duyệt!')
  }, [emailType, emailHtml, participants, subject, addEmail])

  const selectedTypeConfig = EMAIL_TYPES.find(t => t.value === emailType)
  const toLabel = participants.length > 0
    ? `${participants.length} học viên${selectedWorkshop ? ` · ${selectedWorkshop.short}` : ''}`
    : undefined

  return (
    <Row gutter={20} style={{ height: '100%' }}>
      {/* LEFT: 4-step form */}
      <Col span={9}>
        <Card style={{ height: '100%' }}>
          <Space direction="vertical" style={{ width: '100%' }} size={20}>
            <Steps current={currentStep} size="small" items={STEPS} />

            <div>
              <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                1. Học viên nhận mail
              </Typography.Text>
              <WorkshopSelector
                onRecipients={(attendees, workshop) => {
                  setParticipants(attendees)
                  setSelectedWorkshop(workshop)
                }}
              />
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                2. Nội dung workshop
              </Typography.Text>
              <Form layout="vertical" size="small">
                <Form.Item label="Tên chương trình / Workshop" style={{ marginBottom: 10 }} required>
                  <Input
                    value={programName}
                    onChange={e => setProgramName(e.target.value)}
                    placeholder="VD: Strengths-based Development Workshop"
                  />
                </Form.Item>
                <Form.Item label="Thời gian" style={{ marginBottom: 10 }}>
                  <Space.Compact style={{ width: '100%' }}>
                    <DatePicker
                      format="ddd DD/MM/YYYY"
                      placeholder="Chọn ngày"
                      onChange={(_, dateStr) => setDate(dateStr as string)}
                      style={{ width: '46%' }}
                    />
                    <TimePicker
                      format="HH:mm"
                      placeholder="Bắt đầu"
                      onChange={(_, timeStr) => setTimeStart(timeStr as string)}
                      style={{ width: '27%' }}
                    />
                    <TimePicker
                      format="HH:mm"
                      placeholder="Kết thúc"
                      onChange={(_, timeStr) => setTimeEnd(timeStr as string)}
                      style={{ width: '27%' }}
                    />
                  </Space.Compact>
                </Form.Item>
                <Form.Item label="Địa điểm" style={{ marginBottom: 10 }}>
                  <Select
                    value={location || undefined}
                    onChange={setLocation}
                    placeholder="Chọn phòng / hình thức"
                    allowClear
                    options={MEETING_ROOMS.map(r => ({ value: r, label: r }))}
                    style={{ width: '100%' }}
                  />
                </Form.Item>
                <Form.Item label="Tên PIC" style={{ marginBottom: 10 }}>
                  <Input
                    value={hrbpName}
                    onChange={e => setHrbpName(e.target.value)}
                    placeholder="VD: Nguyễn Văn A"
                  />
                </Form.Item>
                <Form.Item label="Ghi chú thêm" style={{ marginBottom: 0 }}>
                  <Input.TextArea
                    value={additionalNotes}
                    onChange={e => setAdditionalNotes(e.target.value)}
                    placeholder="Mục tiêu, nội dung, dress code, lưu ý..."
                    rows={3}
                  />
                </Form.Item>
              </Form>
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                3. Loại email
              </Typography.Text>
              <Select
                value={emailType}
                onChange={setEmailType}
                options={EMAIL_TYPE_OPTIONS}
                style={{ width: '100%' }}
              />

              <div style={{ marginTop: 10 }}>
                <Typography.Text style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>
                  Tùy chỉnh thêm (không bắt buộc)
                </Typography.Text>
                <Flex gap={6} wrap="wrap" style={{ marginBottom: 6 }}>
                  {(selectedTypeConfig?.hintChips ?? []).map(chip => (
                    <Tag
                      key={chip}
                      style={{ cursor: 'pointer', fontSize: 11 }}
                      onClick={() => setExtraInstructions(prev => prev ? `${prev}, ${chip}` : chip)}
                    >
                      {chip}
                    </Tag>
                  ))}
                </Flex>
                <Input.TextArea
                  value={extraInstructions}
                  onChange={e => setExtraInstructions(e.target.value)}
                  placeholder="Yêu cầu thêm..."
                  rows={2}
                />
              </div>
            </div>

            <Divider style={{ margin: 0 }} />

            <div>
              <Typography.Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}>
                4. Hình ảnh (không bắt buộc)
              </Typography.Text>
              <ImageUpload images={images} onChange={setImages} />
            </div>

            <Button
              type="primary"
              size="large"
              block
              icon={<ThunderboltOutlined />}
              loading={genState === 'generating'}
              disabled={genState === 'generating' || !programName.trim()}
              onClick={handleGenerate}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
            >
              {genState === 'generating' ? 'Toro đang soạn...' : '✨ Toro, soạn mail'}
            </Button>
          </Space>
        </Card>
      </Col>

      {/* RIGHT: preview + chat */}
      <Col span={15}>
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          {genState === 'ready' || genState === 'editing' || genState === 'generating' ? (
            <>
              {genState === 'ready' && (
                <Card size="small" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Flex justify="space-between" align="center">
                    <Typography.Text style={{ color: '#166534', fontSize: 13 }}>
                      ✅ Toro hoàn thành! Email cho {participants.length > 0 ? `${participants.length} học viên` : 'workshop'}
                    </Typography.Text>
                    <Space>
                      <Button size="small" onClick={handleSendToQueue}>Thêm vào hàng chờ duyệt</Button>
                      <Button size="small" type="primary" style={{ background: '#16a34a', borderColor: '#16a34a' }}>Gửi ngay</Button>
                    </Space>
                  </Flex>
                </Card>
              )}
              <Card>
                <EmailPreview
                  html={emailHtml}
                  isGenerating={genState === 'generating'}
                  onEmailChange={setEmailHtml}
                  from="toro@zalopay.vn"
                  to={toLabel}
                  subject={subject}
                  onSubjectChange={setSubject}
                />
              </Card>
              <Card>
                <ChatPanel
                  history={chatHistory}
                  onSend={handleChatSend}
                  isRefining={isRefining}
                  disabled={genState === 'generating'}
                  quickChips={selectedTypeConfig?.hintChips ?? []}
                />
              </Card>
            </>
          ) : (
            <Card style={{ textAlign: 'center', padding: '60px 24px' }}>
              <ThunderboltOutlined style={{ fontSize: 48, color: '#d1d5db', marginBottom: 16 }} />
              <Typography.Title level={4} style={{ color: '#9ca3af', margin: 0 }}>
                Điền thông tin bên trái rồi bấm "Toro, soạn mail"
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                Toro sẽ soạn email HTML đẹp, cá nhân hóa cho từng học viên
              </Typography.Text>
            </Card>
          )}
        </Space>
      </Col>
    </Row>
  )
}
