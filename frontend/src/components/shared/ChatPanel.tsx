// frontend/src/components/shared/ChatPanel.tsx
import { useState, useRef, useEffect } from 'react'
import { Input, Button, Typography, Tag, Flex } from 'antd'
import { SendOutlined, PictureOutlined, CloseOutlined } from '@ant-design/icons'
import type { ChatMessage } from '../../types'

interface Props {
  history: ChatMessage[]
  onSend: (message: string, imageDataUrl?: string) => void
  isRefining: boolean
  disabled: boolean
  quickChips?: string[]
  hideTitle?: boolean
}

export default function ChatPanel({ history, onSend, isRefining, disabled, quickChips = [], hideTitle = false }: Props) {
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
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 0 }}>
      {!hideTitle && (
        <Flex align="center" gap={8} style={{ marginBottom: 12, flexShrink: 0 }}>
          <Typography.Title level={5} style={{ margin: 0 }}>💬 Chỉnh sửa với Toro</Typography.Title>
          {disabled && <Typography.Text type="secondary" style={{ fontSize: 12 }}>— soạn mail trước nhé</Typography.Text>}
        </Flex>
      )}

      {quickChips.length > 0 && !disabled && (
        <Flex gap={6} wrap="wrap" style={{ marginBottom: 10, flexShrink: 0 }}>
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

      {/* Messages — fills remaining space */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10, minHeight: 0 }}>
        {history.length === 0 && !disabled && (
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            Gõ yêu cầu chỉnh sửa, ví dụ: "đổi tone nhẹ nhàng hơn", "thêm link khảo sát"...
          </Typography.Text>
        )}
        {history.map((msg, i) => (
          <div key={i} style={{ alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '90%' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2, textAlign: msg.role === 'user' ? 'right' : 'left' }}>
              {msg.role === 'user' ? 'Bạn' : 'Toro'}
            </div>
            <div style={{
              padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
              background: msg.role === 'user' ? '#16a34a' : '#f3f4f6',
              color: msg.role === 'user' ? '#fff' : '#111',
              whiteSpace: 'pre-wrap',
            }}>
              {msg.content}
            </div>
          </div>
        ))}
        {isRefining && (
          <div style={{ alignSelf: 'flex-start', maxWidth: '90%' }}>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 2 }}>Toro</div>
            <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, background: '#f3f4f6', color: '#8c8c8c' }}>
              đang chỉnh sửa...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area — pinned to bottom */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #f0f0f0', paddingTop: 10 }}>
        {attachedImage && (
          <Flex align="center" gap={8} style={{ padding: '6px 8px', background: '#f0fdf4', borderRadius: 6, marginBottom: 8 }}>
            <img src={attachedImage} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 4 }} />
            <Typography.Text style={{ fontSize: 12, flex: 1 }}>Ảnh đính kèm</Typography.Text>
            <Button size="small" type="text" icon={<CloseOutlined />} onClick={() => setAttachedImage(undefined)} />
          </Flex>
        )}
        <Flex gap={6} align="flex-end">
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
            autoSize={{ minRows: 1, maxRows: 3 }}
            style={{ flex: 1, fontSize: 13 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={disabled || isRefining || !input.trim()}
            style={{ background: '#16a34a', borderColor: '#16a34a' }}
          >
            Gửi
          </Button>
        </Flex>
      </div>
    </div>
  )
}
