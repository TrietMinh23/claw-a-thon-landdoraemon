// frontend/src/components/compose/steps/StepRecipients.tsx
import { Button, Flex, Typography } from 'antd'
import WorkshopSelector from '../WorkshopSelector'
import type { Participant, Workshop } from '../../../types'

interface Props {
  participants: Participant[]
  onRecipients: (participants: Participant[], workshop: Workshop | null) => void
  onNext: () => void
}

export default function StepRecipients({ participants, onRecipients, onNext }: Props) {
  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>Học viên nhận mail</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
        Chọn workshop hoặc upload danh sách học viên
      </Typography.Text>

      <WorkshopSelector onRecipients={onRecipients} />

      <Flex justify="flex-end" style={{ marginTop: 32 }}>
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
