// frontend/src/components/compose/ComposePage.tsx
import { useState, useCallback, useRef } from 'react'
import { Card, Steps, message } from 'antd'
import { streamGenerateV1, streamChatEdit, postEmailDraft } from '../../api'
import { useEmailContext } from '../../contexts/EmailContext'
import { EMAIL_TYPES } from './EmailTypeSelector'
import StepRecipients from './steps/StepRecipients'
import StepContent from './steps/StepContent'
import StepEmailType from './steps/StepEmailType'
import StepImages from './steps/StepImages'
import type { Participant, Workshop, ChatMessage, EmailDraft, ImageEntry } from '../../types'

type GenState = 'idle' | 'generating' | 'ready' | 'editing'

const STEP_TITLES = ['Học viên', 'Nội dung', 'Loại email', 'Hình ảnh', 'Kết quả']

const stripFences = (s: string) =>
  s.replace(/^```html\s*/i, '').replace(/^```\s*/, '').replace(/\s*```\s*$/, '').trim()

export default function ComposePage() {
  const { addEmail } = useEmailContext()

  // Wizard navigation
  const [currentStep, setCurrentStep] = useState(0)

  // Step 1
  const [participants, setParticipants] = useState<Participant[]>([])
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)

  // Step 2
  const [programName, setProgramName] = useState('')
  const [date, setDate] = useState('')
  const [timeStart, setTimeStart] = useState('')
  const [timeEnd, setTimeEnd] = useState('')
  const [location, setLocation] = useState('')
  const [hrbpName, setHrbpName] = useState('')
  const [additionalNotes, setAdditionalNotes] = useState('')

  // Step 3
  const [emailType, setEmailType] = useState('invite')
  const [extraInstructions, setExtraInstructions] = useState('')

  // Step 4
  const [images, setImages] = useState<ImageEntry[]>([])

  // Step 5 — generation
  const [genState, setGenState] = useState<GenState>('idle')
  const [emailHtml, setEmailHtml] = useState('')
  const [subject, setSubject] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [isRefining, setIsRefining] = useState(false)

  const accRef = useRef('')
  const lastFlushRef = useRef(0)
  const flushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
      setEmailHtml(stripFences(accRef.current))
      const typeLabel = EMAIL_TYPES.find(t => t.value === emailType)?.label ?? emailType
      setSubject(`[Toro] ${typeLabel} — ${selectedWorkshop?.short ?? programName}`)
      setGenState('ready')
    } catch (e) {
      if (flushTimerRef.current) { clearTimeout(flushTimerRef.current); flushTimerRef.current = null }
      message.error(e instanceof Error ? e.message : String(e))
      setGenState('idle')
    }
  }, [emailType, workshopContext, extraInstructions, images, selectedWorkshop, programName, onChunk])

  const handleChatSend = useCallback(async (msg: string, imageDataUrl?: string) => {
    const userMsg: ChatMessage = { role: 'user', content: msg }
    let updatedHistory: ChatMessage[] = []
    setChatHistory(h => {
      updatedHistory = [...h, userMsg]
      return updatedHistory
    })
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
      message.error(e instanceof Error ? e.message : String(e))
      setGenState('ready')
    } finally {
      setIsRefining(false)
    }
  }, [emailHtml, onChunk])

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
    try { await postEmailDraft(draft) } catch { message.warning('Không thể lưu lên server.') }
    addEmail(draft)
    message.success('Email đã được thêm vào hàng chờ duyệt!')
  }, [emailType, emailHtml, participants, subject, addEmail])

  const goToStep = (step: number) => {
    if (step > currentStep) { message.info('Hãy hoàn thành bước hiện tại trước.'); return }
    if (step === currentStep) return
    if (currentStep === 4) setGenState('idle')
    setCurrentStep(step)
  }

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 4))
  const goBack = () => {
    if (currentStep === 4) setGenState('idle')
    setCurrentStep(s => Math.max(s - 1, 0))
  }

  const toLabel = participants.length > 0
    ? `${participants.length} học viên${selectedWorkshop ? ` · ${selectedWorkshop.short}` : ''}`
    : undefined

  const selectedTypeConfig = EMAIL_TYPES.find(t => t.value === emailType)

  const stepItems = STEP_TITLES.map((title, i) => ({
    title,
    status: (i < currentStep ? 'finish' : i === currentStep ? 'process' : 'wait') as 'finish' | 'process' | 'wait',
  }))

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <Card>
        <Steps
          current={currentStep}
          items={stepItems}
          onChange={goToStep}
          style={{ marginBottom: 32 }}
          size="small"
        />

        {currentStep === 0 && (
          <StepRecipients
            participants={participants}
            onRecipients={(p, w) => { setParticipants(p); setSelectedWorkshop(w) }}
            onNext={goNext}
          />
        )}
        {currentStep === 1 && (
          <StepContent
            programName={programName} setProgramName={setProgramName}
            date={date} setDate={setDate}
            timeStart={timeStart} setTimeStart={setTimeStart}
            timeEnd={timeEnd} setTimeEnd={setTimeEnd}
            location={location} setLocation={setLocation}
            hrbpName={hrbpName} setHrbpName={setHrbpName}
            additionalNotes={additionalNotes} setAdditionalNotes={setAdditionalNotes}
            onNext={goNext} onBack={goBack}
          />
        )}
        {currentStep === 2 && (
          <StepEmailType
            emailType={emailType} setEmailType={setEmailType}
            extraInstructions={extraInstructions} setExtraInstructions={setExtraInstructions}
            onNext={goNext} onBack={goBack}
          />
        )}
        {currentStep === 3 && (
          <StepImages
            images={images} setImages={setImages}
            onNext={goNext} onBack={goBack}
          />
        )}
        {currentStep === 4 && (
          <div data-step="result">
            {/* StepResult — added in Task 4 */}
            <div>Step 5: Kết quả placeholder</div>
          </div>
        )}
      </Card>
    </div>
  )
}
