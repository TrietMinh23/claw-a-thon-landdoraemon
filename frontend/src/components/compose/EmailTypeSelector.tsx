// frontend/src/components/compose/EmailTypeSelector.tsx
import { Card, Typography } from 'antd'

export interface EmailTypeOption {
  value: string
  label: string
  description: string
  hintChips: string[]
}

export const EMAIL_TYPES: EmailTypeOption[] = [
  { value: 'invite', label: 'Mời tham dự', description: 'Invitation email cho workshop', hintChips: ['Thêm link khảo sát', 'Nhắc confirm lịch', 'Thêm dress code'] },
  { value: 'remind_12h', label: 'Remind 12h', description: 'Nhắc nhở trước 12 tiếng', hintChips: ['Thêm link Zoom', 'Nhắc mang theo gì', 'Tone khẩn hơn'] },
  { value: 'remind_15m', label: 'Remind 15 phút', description: 'Nhắc nhở trước 15 phút', hintChips: ['Rất ngắn gọn', 'Chỉ gửi phòng + giờ', 'Tone vui vẻ'] },
  { value: 'setup', label: 'Setup phòng', description: 'Yêu cầu AF & IT setup', hintChips: ['Thêm layout phòng', 'Nhắc micro + pointer', 'Thêm số điện thoại'] },
  { value: 'followup', label: 'Follow-up', description: 'Cảm ơn + tài liệu sau workshop', hintChips: ['Đính kèm slide', 'Thêm form feedback', 'Thêm IDP template'] },
  { value: 'custom', label: 'Tùy chỉnh', description: 'Email tùy chỉnh tự do', hintChips: ['Mô tả yêu cầu cụ thể', 'Tone tùy chọn'] },
]

interface Props {
  selected: string
  onSelect: (value: string) => void
}

export default function EmailTypeSelector({ selected, onSelect }: Props) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {EMAIL_TYPES.map(t => (
        <Card
          key={t.value}
          size="small"
          hoverable
          onClick={() => onSelect(t.value)}
          style={{
            cursor: 'pointer',
            border: selected === t.value ? '2px solid #16a34a' : '1px solid #e5e7eb',
            background: selected === t.value ? '#f0fdf4' : '#fff',
            borderRadius: 8,
          }}
          styles={{ body: { padding: '10px 12px' } }}
        >
          <Typography.Text strong style={{ fontSize: 13, display: 'block', color: selected === t.value ? '#16a34a' : '#111827' }}>
            {t.label}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>{t.description}</Typography.Text>
        </Card>
      ))}
    </div>
  )
}
