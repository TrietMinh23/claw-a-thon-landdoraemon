// frontend/src/components/compose/steps/StepResult.tsx
import { useEffect, useRef, useState } from 'react'
import { Button, Flex, Space, Tag, message } from 'antd'
import { EditOutlined, CloseOutlined } from '@ant-design/icons'
import EmailPreview from '../../shared/EmailPreview'
import ChatPanel from '../../shared/ChatPanel'
import type { ChatMessage } from '../../../types'

type GenState = 'idle' | 'generating' | 'ready' | 'editing'

interface Props {
  genState: GenState
  emailHtml: string
  subject: string
  toLabel?: string
  chatHistory: ChatMessage[]
  isRefining: boolean
  quickChips: string[]
  onGenerate: () => void
  onChatSend: (msg: string, imageDataUrl?: string) => void
  onSendToQueue: () => void
  onEmailChange: (html: string) => void
  onSubjectChange: (subject: string) => void
  onBack: () => void
}

export default function StepResult({
  genState, emailHtml, subject, toLabel,
  chatHistory, isRefining, quickChips,
  onGenerate, onChatSend, onSendToQueue,
  onEmailChange, onSubjectChange, onBack,
}: Props) {
  const [chatOpen, setChatOpen] = useState(false)
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (genState === 'idle' && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true
      onGenerate()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const canEdit = genState === 'ready' || genState === 'editing'

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Button type="text" onClick={onBack}>← Quay lại</Button>
        <Space>
          {genState === 'editing' && (
            <Tag color="processing">Toro đang chỉnh sửa...</Tag>
          )}
          {genState === 'ready' && (
            <>
              <Button onClick={onSendToQueue}>Thêm vào hàng chờ duyệt</Button>
              <Button
                type="primary"
                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                onClick={() => message.info('Tính năng đang phát triển.')}
              >
                Gửi ngay
              </Button>
            </>
          )}
        </Space>
      </Flex>

      {/* Email preview — full width */}
      <EmailPreview
        html={emailHtml}
        isGenerating={genState === 'generating'}
        onEmailChange={onEmailChange}
        from="toro@zalopay.vn"
        to={toLabel}
        subject={subject}
        onSubjectChange={onSubjectChange}
      />

      {/* Floating chat widget — bottom-right */}
      {canEdit && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, zIndex: 200 }}>
          {/* Chat popup */}
          {chatOpen && (
            <div style={{
              position: 'absolute',
              bottom: 68,
              right: 0,
              width: 380,
              height: 500,
              background: '#fff',
              borderRadius: 16,
              boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              border: '1px solid #e5e7eb',
            }}>
              {/* Popup header */}
              <Flex
                align="center"
                justify="space-between"
                style={{
                  padding: '14px 16px',
                  borderBottom: '1px solid #f0f0f0',
                  background: '#f9fafb',
                  flexShrink: 0,
                }}
              >
                <Flex align="center" gap={8}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <EditOutlined style={{ color: '#fff', fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>Chỉnh sửa với Toro</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>Mô tả yêu cầu, Toro sẽ cập nhật email</div>
                  </div>
                </Flex>
                <Button
                  type="text"
                  size="small"
                  icon={<CloseOutlined />}
                  onClick={() => setChatOpen(false)}
                />
              </Flex>

              {/* Chat body */}
              <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', padding: '12px 16px 16px' }}>
                <ChatPanel
                  history={chatHistory}
                  onSend={onChatSend}
                  isRefining={isRefining}
                  disabled={genState === 'generating'}
                  quickChips={quickChips}
                  hideTitle
                />
              </div>
            </div>
          )}

          {/* Trigger button */}
          {chatOpen ? (
            <Button
              shape="circle"
              size="large"
              icon={<CloseOutlined />}
              onClick={() => setChatOpen(false)}
              style={{
                width: 52, height: 52,
                background: '#6b7280',
                borderColor: 'transparent',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              }}
            />
          ) : (
            <Button
              type="primary"
              shape="round"
              size="large"
              icon={<EditOutlined />}
              onClick={() => setChatOpen(true)}
              style={{
                background: '#16a34a',
                borderColor: 'transparent',
                boxShadow: '0 4px 16px rgba(22,163,74,0.4)',
                height: 48,
                paddingInline: 20,
                fontWeight: 500,
              }}
            >
              Chỉnh sửa với Toro
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
