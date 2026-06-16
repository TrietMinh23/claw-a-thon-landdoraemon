// frontend/src/components/shared/EmailPreview.tsx
import { useState } from 'react'
import { Input, Space, Flex, Segmented } from 'antd'
import { EyeOutlined, CodeOutlined } from '@ant-design/icons'

interface Props {
  html: string
  isGenerating?: boolean
  onEmailChange?: (html: string) => void
  from?: string
  to?: string
  subject?: string
  onSubjectChange?: (s: string) => void
}

export default function EmailPreview({
  html,
  isGenerating,
  onEmailChange,
  from = 'toro@zalopay.vn',
  to,
  subject = '',
  onSubjectChange,
}: Props) {
  const [mode, setMode] = useState<'preview' | 'html'>('preview')

  if (!html && !isGenerating) {
    return (
      <div style={{
        minHeight: 300, border: '2px dashed #d9d9d9', borderRadius: 8,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#bfbfbf', fontSize: 14,
      }}>
        Email được soạn bởi Toro sẽ hiển thị tại đây.
      </div>
    )
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={10}>
      {/* Email meta */}
      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px' }}>
        <div style={{ fontSize: 13, marginBottom: 4 }}>
          <span style={{ color: '#6b7280', width: 60, display: 'inline-block' }}>From:</span>
          <span>{from}</span>
        </div>
        {to && (
          <div style={{ fontSize: 13, marginBottom: 4 }}>
            <span style={{ color: '#6b7280', width: 60, display: 'inline-block' }}>To:</span>
            <span>{to}</span>
          </div>
        )}
        <Flex align="center" gap={6}>
          <span style={{ color: '#6b7280', fontSize: 13, width: 60, flexShrink: 0 }}>Subject:</span>
          {onSubjectChange ? (
            <Input
              size="small"
              value={subject}
              onChange={e => onSubjectChange(e.target.value)}
              style={{ flex: 1, fontSize: 13 }}
            />
          ) : (
            <span style={{ fontSize: 13 }}>{subject}</span>
          )}
        </Flex>
      </div>

      {/* Preview / HTML toggle */}
      {html && !isGenerating && onEmailChange && (
        <Flex justify="flex-end">
          <Segmented
            size="small"
            value={mode}
            onChange={v => setMode(v as 'preview' | 'html')}
            options={[
              { value: 'preview', icon: <EyeOutlined />, label: 'Preview' },
              { value: 'html', icon: <CodeOutlined />, label: 'HTML' },
            ]}
          />
        </Flex>
      )}

      {/* Content */}
      {mode === 'html' && onEmailChange ? (
        <Input.TextArea
          value={html}
          onChange={e => onEmailChange(e.target.value)}
          autoSize={{ minRows: 14 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          spellCheck={false}
        />
      ) : (
        <div
          style={{
            minHeight: 300,
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            padding: '16px',
            background: isGenerating ? '#fafafa' : '#fff',
          }}
          dangerouslySetInnerHTML={{ __html: html || '<p style="color:#9ca3af;text-align:center;padding:60px 0">⏳ Toro đang soạn mail...</p>' }}
        />
      )}
    </Space>
  )
}
