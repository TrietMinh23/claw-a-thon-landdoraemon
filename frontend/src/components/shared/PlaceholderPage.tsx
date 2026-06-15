// frontend/src/components/shared/PlaceholderPage.tsx
import { Result } from 'antd'
import { ClockCircleOutlined } from '@ant-design/icons'

interface Props { title?: string }

export default function PlaceholderPage({ title = 'Sắp ra mắt' }: Props) {
  return (
    <div style={{ padding: '60px 0', display: 'flex', justifyContent: 'center' }}>
      <Result
        icon={<ClockCircleOutlined style={{ color: '#16a34a' }} />}
        title={title}
        subTitle="Tính năng này đang được phát triển. Toro sẽ sớm mang đến cho bạn!"
      />
    </div>
  )
}
