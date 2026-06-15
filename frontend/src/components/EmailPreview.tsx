import { useState } from 'react'
import { Button, Select, Space, Tag, Typography, Flex, Input } from 'antd'
import { EditOutlined, EyeOutlined } from '@ant-design/icons'
import type { AppState, Participant } from '../types'

interface PersonalizedEmail {
  name: string
  email: string
  body: string
}

interface Props {
  emailText: string
  appState: AppState
  participants: Participant[]
  personalizedEmails: PersonalizedEmail[]
  selectedParticipant: string
  onSelectParticipant: (name: string) => void
  onEmailChange: (text: string) => void
  onPersonalize: () => void
}

const STATE_LABELS: Record<AppState, string> = {
  idle: '',
  generating: '⏳ Đang soạn...',
  ready: '✅ Sẵn sàng',
  editing: '✏️ Đang chỉnh sửa',
}

const STATE_COLORS: Record<AppState, string> = {
  idle: 'default',
  generating: 'gold',
  ready: 'success',
  editing: 'processing',
}

export default function EmailPreview({
  emailText,
  appState,
  participants,
  personalizedEmails,
  selectedParticipant,
  onSelectParticipant,
  onEmailChange,
  onPersonalize,
}: Props) {
  const [editMode, setEditMode] = useState(false)

  const displayText = selectedParticipant && personalizedEmails.length > 0
    ? (personalizedEmails.find(e => e.name === selectedParticipant)?.body ?? emailText)
    : emailText

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Flex justify="space-between" align="center">
        <Typography.Title level={5} style={{ margin: 0 }}>Email Preview</Typography.Title>
        <Space>
          {appState !== 'idle' && (
            <Tag color={STATE_COLORS[appState]}>{STATE_LABELS[appState]}</Tag>
          )}
          {appState === 'ready' && (
            <Button
              size="small"
              icon={editMode ? <EyeOutlined /> : <EditOutlined />}
              onClick={() => setEditMode(m => !m)}
            >
              {editMode ? 'Xem preview' : 'Sửa HTML'}
            </Button>
          )}
        </Space>
      </Flex>

      {participants.length > 0 && appState === 'ready' && (
        <Flex gap={8} align="center">
          <Button size="small" onClick={onPersonalize}>
            Cá nhân hóa ({participants.length} người)
          </Button>
          {personalizedEmails.length > 0 && (
            <Select
              value={selectedParticipant || undefined}
              onChange={val => onSelectParticipant(val ?? '')}
              placeholder="— Xem template —"
              size="small"
              style={{ minWidth: 160 }}
              allowClear
              options={personalizedEmails.map(e => ({ value: e.name, label: e.name }))}
            />
          )}
        </Flex>
      )}

      {appState === 'idle' ? (
        <div style={{
          minHeight: 300,
          border: '2px dashed #d9d9d9',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#bfbfbf',
          fontSize: 14,
        }}>
          Email được soạn bởi Toro sẽ hiển thị tại đây.
        </div>
      ) : editMode ? (
        <Input.TextArea
          value={displayText}
          onChange={e => onEmailChange(e.target.value)}
          autoSize={{ minRows: 14 }}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
          spellCheck={false}
        />
      ) : (
        <div
          style={{
            minHeight: 300,
            padding: '16px 20px',
            border: '1px solid #d9d9d9',
            borderRadius: 8,
            fontSize: 14,
            lineHeight: 1.8,
            background: appState === 'generating' ? '#fafafa' : '#fff',
          }}
          dangerouslySetInnerHTML={{ __html: displayText }}
        />
      )}
    </Space>
  )
}
