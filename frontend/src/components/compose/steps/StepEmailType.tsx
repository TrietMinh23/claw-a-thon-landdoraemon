// frontend/src/components/compose/steps/StepEmailType.tsx
import { Button, Flex, Input, Tag, Typography } from 'antd'
import EmailTypeSelector, { EMAIL_TYPES } from '../EmailTypeSelector'

interface Props {
  emailType: string
  setEmailType: (v: string) => void
  extraInstructions: string
  setExtraInstructions: (v: string) => void
  onNext: () => void
  onBack: () => void
}

export default function StepEmailType({ emailType, setEmailType, extraInstructions, setExtraInstructions, onNext, onBack }: Props) {
  const selectedTypeConfig = EMAIL_TYPES.find(t => t.value === emailType)

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>Loại email</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
        Chọn loại email phù hợp với mục đích gửi
      </Typography.Text>

      <EmailTypeSelector selected={emailType} onSelect={setEmailType} />

      <div style={{ marginTop: 24 }}>
        <Typography.Text style={{ fontSize: 13, color: '#6b7280', display: 'block', marginBottom: 8 }}>
          Tùy chỉnh thêm (không bắt buộc)
        </Typography.Text>
        <Flex gap={6} wrap="wrap" style={{ marginBottom: 8 }}>
          {(selectedTypeConfig?.hintChips ?? []).map(chip => (
            <Tag
              key={chip}
              style={{ cursor: 'pointer', fontSize: 12 }}
              onClick={() => setExtraInstructions(extraInstructions ? `${extraInstructions}, ${chip}` : chip)}
            >
              {chip}
            </Tag>
          ))}
        </Flex>
        <Input.TextArea
          value={extraInstructions}
          onChange={e => setExtraInstructions(e.target.value)}
          placeholder="Yêu cầu thêm..."
          rows={2}
        />
      </div>

      <Flex justify="space-between" style={{ marginTop: 24 }}>
        <Button size="large" type="text" onClick={onBack}>← Quay lại</Button>
        <Button
          type="primary"
          size="large"
          onClick={onNext}
          style={{ background: '#16a34a', borderColor: '#16a34a', minWidth: 120 }}
        >
          Tiếp theo →
        </Button>
      </Flex>
    </div>
  )
}
