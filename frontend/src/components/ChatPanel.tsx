import { useState, useRef, useEffect } from 'react'
import { Input, Button, Space, Typography, Tag, Flex } from 'antd'
import { SendOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../types'

interface Props {
  history: ChatMessage[]
  onSend: (message: string) => void
  isRefining: boolean
  disabled: boolean
}

export default function ChatPanel({ history, onSend, isRefining, disabled }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || isRefining) return
    onSend(msg)
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Flex align="center" gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>💬 Chỉnh sửa với Toro</Typography.Title>
        {disabled && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            — soạn mail trước nhé
          </Typography.Text>
        )}
      </Flex>

      <div style={{
        maxHeight: 260,
        minHeight: 80,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '4px 0',
      }}>
        {history.length === 0 && !disabled && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Gõ yêu cầu chỉnh sửa, ví dụ: "đổi tone nhẹ nhàng hơn", "thêm link khảo sát"...
          </Typography.Text>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
            <Tag color={msg.role === 'user' ? 'blue' : 'default'} style={{ marginBottom: 4 }}>
              {msg.role === 'user' ? 'Bạn' : 'Toro'}
            </Tag>
            <div style={{
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              lineHeight: 1.5,
              background: msg.role === 'user' ? '#e6f4ff' : '#f5f5f5',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isRefining && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
            <Tag style={{ marginBottom: 4 }}>Toro</Tag>
            <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, background: '#f5f5f5', color: '#8c8c8c' }}>
              đang chỉnh sửa...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <Flex gap={8} align="flex-end">
        <Input.TextArea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRefining}
          placeholder={disabled ? 'Soạn mail trước để chỉnh sửa' : 'Nhập yêu cầu chỉnh sửa... (Enter gửi)'}
          autoSize={{ minRows: 2, maxRows: 4 }}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={handleSend}
          disabled={disabled || isRefining || !input.trim()}
        >
          Gửi
        </Button>
      </Flex>
    </Space>
  )
}
