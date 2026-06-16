// frontend/src/components/compose/steps/StepResult.tsx
import { useEffect, useState } from 'react'
import { Button, Flex, Space, Typography, message } from 'antd'
import { MessageOutlined, CloseOutlined } from '@ant-design/icons'
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

  useEffect(() => {
    if (genState === 'idle') onGenerate()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ position: 'relative' }}>
      {/* Header */}
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Button type="text" onClick={onBack}>← Quay lại</Button>
        {genState === 'ready' && (
          <Space>
            <Button onClick={onSendToQueue}>Thêm vào hàng chờ duyệt</Button>
            <Button type="primary" style={{ background: '#16a34a', borderColor: '#16a34a' }} onClick={() => message.info('Tính năng đang phát triển.')}>
              Gửi ngay
            </Button>
          </Space>
        )}
      </Flex>

      {/* Split container */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Email preview */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <EmailPreview
            html={emailHtml}
            isGenerating={genState === 'generating'}
            onEmailChange={onEmailChange}
            from="toro@zalopay.vn"
            to={toLabel}
            subject={subject}
            onSubjectChange={onSubjectChange}
          />
        </div>

        {/* Chat panel — slides in */}
        <div style={{
          width: chatOpen ? '45%' : 0,
          overflow: 'hidden',
          transition: 'width 0.3s ease',
          flexShrink: 0,
        }}>
          <div style={{ width: '100%', minWidth: 300 }}>
            <Flex justify="space-between" align="center" style={{ marginBottom: 12 }}>
              <Typography.Text strong>💬 Chỉnh sửa với Toro</Typography.Text>
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => setChatOpen(false)}
              />
            </Flex>
            <ChatPanel
              history={chatHistory}
              onSend={onChatSend}
              isRefining={isRefining}
              disabled={genState === 'generating'}
              quickChips={quickChips}
            />
          </div>
        </div>
      </div>

      {/* Floating chat button */}
      {!chatOpen && (
        <button
          onClick={() => setChatOpen(true)}
          title="Chỉnh sửa với Toro"
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: '#16a34a',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(22,163,74,0.35)',
            zIndex: 100,
          }}
        >
          <MessageOutlined style={{ fontSize: 22, color: '#fff' }} />
        </button>
      )}
    </div>
  )
}
