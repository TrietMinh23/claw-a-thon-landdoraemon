import { Form, Input, Select, Button, Typography } from 'antd'
import { type EmailForm, type EmailType } from '../types'

const EMAIL_TYPE_OPTIONS: { value: EmailType; label: string }[] = [
  { value: 'invite', label: 'Mời tham dự' },
  { value: 'remind_12h', label: 'Remind 12 tiếng' },
  { value: 'remind_15m', label: 'Remind 15 phút' },
  { value: 'setup', label: 'Setup AF/IT' },
  { value: 'followup', label: 'Follow-up + Tài liệu' },
  { value: 'custom', label: 'Tùy chỉnh' },
]

interface Props {
  form: EmailForm
  onChange: (form: EmailForm) => void
  onSubmit: () => void
  isGenerating: boolean
}

export default function InputForm({ form, onChange, onSubmit, isGenerating }: Props) {
  const set = (key: keyof EmailForm, value: string) =>
    onChange({ ...form, [key]: value })

  return (
    <>
      <Typography.Title level={5} style={{ margin: '0 0 12px' }}>Thông tin chương trình</Typography.Title>
      <Form layout="vertical">
        <Form.Item label="Loại email">
          <Select
            value={form.email_type}
            onChange={val => set('email_type', val)}
            options={EMAIL_TYPE_OPTIONS}
          />
        </Form.Item>

        <Form.Item label="Tên chương trình / Workshop" required>
          <Input
            value={form.program_name}
            onChange={e => set('program_name', e.target.value)}
            placeholder="VD: Strengths-based Development Workshop"
          />
        </Form.Item>

        <Form.Item label="Mục đích">
          <Input
            value={form.purpose}
            onChange={e => set('purpose', e.target.value)}
            placeholder="VD: Phát triển kỹ năng cộng tác"
          />
        </Form.Item>

        <Form.Item label="Ngày giờ">
          <Input
            value={form.datetime}
            onChange={e => set('datetime', e.target.value)}
            placeholder="VD: 9:00 - 11:00, Thứ 4 ngày 18/06/2026"
          />
        </Form.Item>

        <Form.Item label="Địa điểm / Link Teams">
          <Input
            value={form.location}
            onChange={e => set('location', e.target.value)}
            placeholder="VD: Phòng Sài Gòn - Đà Nẵng, VNG Campus"
          />
        </Form.Item>

        <Form.Item label="Mô tả nội dung">
          <Input.TextArea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="VD: Workshop 3 tiếng, thực hành case study, chia sẻ kinh nghiệm thực tế"
            rows={4}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0 }}>
          <Button
            type="primary"
            onClick={onSubmit}
            loading={isGenerating}
            disabled={isGenerating || !form.program_name.trim()}
            block
            size="large"
          >
            {isGenerating ? 'Toro đang soạn mail...' : '✨ Toro, soạn mail'}
          </Button>
        </Form.Item>
      </Form>
    </>
  )
}
