// frontend/src/components/shared/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Space, Typography, Tag, Flex } from 'antd'
import { SendOutlined, PictureOutlined, CloseOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../../types'

interface Props {
  history: ChatMessage[]
  onSend: (message: string, imageDataUrl?: string) => void
  isRefining: boolean
  disabled: boolean
  quickChips?: string[]
}

export default function ChatPanel({ history, onSend, isRefining, disabled, quickChips = [] }: Props) {
  const [input, setInput] = useState('')
  const [attachedImage, setAttachedImage] = useState<string>()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [history])

  const handleSend = () => {
    const msg = input.trim()
    if (!msg || isRefining) return
    onSend(msg, attachedImage)
    setInput('')
    setAttachedImage(undefined)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const img = new Image()
      img.onload = () => {
        const MAX = 1500
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round((height * MAX) / width); width = MAX }
          else { width = Math.round((width * MAX) / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height)
        setAttachedImage(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = ev.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Flex align="center" gap={8}>
        <Typography.Title level={5} style={{ margin: 0 }}>💬 Chỉnh sửa với Toro</Typography.Title>
        {disabled && <Typography.Text type="secondary" style={{ fontSize: 12 }}>— soạn mail trước nhé</Typography.Text>}
      </Flex>

      {quickChips.length > 0 && !disabled && (
        <Flex gap={6} wrap="wrap">
          {quickChips.map(chip => (
            <Tag
              key={chip}
              style={{ cursor: 'pointer', fontSize: 12 }}
              onClick={() => setInput(chip)}
            >
              {chip}
            </Tag>
          ))}
        </Flex>
      )}

      <div style={{ maxHeight: 240, minHeight: 80, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
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
            <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, lineHeight: 1.5, background: msg.role === 'user' ? '#e6f4ff' : '#f5f5f5', whiteSpace: 'pre-wrap' }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isRefining && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
            <Tag style={{ marginBottom: 4 }}>Toro</Tag>
            <div style={{ padding: '8px 12px', borderRadius: 8, fontSize: 13, background: '#f5f5f5', color: '#8c8c8c' }}>đang chỉnh sửa...</div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {attachedImage && (
        <Flex align="center" gap={8} style={{ padding: '6px 8px', background: '#f0fdf4', borderRadius: 6 }}>
          <img src={attachedImage} alt="" style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 4 }} />
          <Typography.Text style={{ fontSize: 12, flex: 1 }}>Ảnh đính kèm</Typography.Text>
          <Button
            size="small" type="text" icon={<CloseOutlined />}
            onClick={() => setAttachedImage(undefined)}
          />
        </Flex>
      )}

      <Flex gap={8} align="flex-end">
        <input ref={imageInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageFile} />
        <Button
          size="small"
          icon={<PictureOutlined />}
          disabled={disabled || isRefining}
          onClick={() => imageInputRef.current?.click()}
        />
        <Input.TextArea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRefining}
          placeholder={disabled ? 'Soạn mail trước để chỉnh sửa' : 'Nhập yêu cầu... (Enter gửi)'}
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
