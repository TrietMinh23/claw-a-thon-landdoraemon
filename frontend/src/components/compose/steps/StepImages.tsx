// frontend/src/components/compose/steps/StepImages.tsx
import { Button, Flex, Typography } from 'antd'
import { ThunderboltOutlined } from '@ant-design/icons'
import ImageUpload from '../ImageUpload'
import type { ImageEntry } from '../../../types'

interface Props {
  images: ImageEntry[]
  setImages: (images: ImageEntry[]) => void
  onNext: () => void
  onBack: () => void
}

export default function StepImages({ images, setImages, onNext, onBack }: Props) {
  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>Hình ảnh</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
        Thêm hình ảnh để đính kèm trong email (không bắt buộc)
      </Typography.Text>

      <ImageUpload images={images} onChange={setImages} />

      <Flex justify="space-between" style={{ marginTop: 32 }}>
        <Button size="large" type="text" onClick={onBack}>← Quay lại</Button>
        <Button
          type="primary"
          size="large"
          icon={<ThunderboltOutlined />}
          onClick={onNext}
          style={{ background: '#16a34a', borderColor: '#16a34a', minWidth: 160 }}
        >
          ✨ Toro, soạn mail
        </Button>
      </Flex>
    </div>
  )
}
