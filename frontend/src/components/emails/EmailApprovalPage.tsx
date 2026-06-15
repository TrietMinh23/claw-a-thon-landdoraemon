// frontend/src/components/emails/EmailApprovalPage.tsx
import { useState } from 'react'
import { Card, Tabs, Tag, Button, Space, Typography, Modal, Flex, Empty } from 'antd'
import { CheckOutlined, EyeOutlined } from '@ant-design/icons'
import { useEmailContext } from '../../contexts/EmailContext'
import type { EmailDraft } from '../../types'

const TYPE_COLORS: Record<string, string> = {
  invite: 'blue', remind: 'orange', setup: 'purple', followup: 'green', custom: 'default',
}

const TYPE_LABELS: Record<string, string> = {
  invite: 'Mời tham dự', remind: 'Remind', setup: 'Setup phòng', followup: 'Follow-up', custom: 'Tùy chỉnh',
}

function EmailCard({ email, onApprove }: { email: EmailDraft; onApprove: (id: string) => void }) {
  const [previewOpen, setPreviewOpen] = useState(false)
  const isApproved = email.status === 'approved'

  return (
    <Card
      size="small"
      style={{ marginBottom: 12, opacity: isApproved ? 0.7 : 1 }}
    >
      <Flex justify="space-between" align="flex-start">
        <div style={{ flex: 1 }}>
          <Flex align="center" gap={8} style={{ marginBottom: 4 }}>
            <Tag color={TYPE_COLORS[email.type] ?? 'default'} style={{ fontSize: 11 }}>
              {TYPE_LABELS[email.type] ?? email.type}
            </Tag>
            <Typography.Text strong style={{ fontSize: 14 }}>{email.label}</Typography.Text>
            <Tag color={isApproved ? 'success' : 'warning'} style={{ fontSize: 11 }}>
              {isApproved ? 'Đã duyệt' : 'Chờ duyệt'}
            </Tag>
          </Flex>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {email.date} · {email.count} người nhận · Tạo lúc {email.time}
          </Typography.Text>
          <Typography.Paragraph
            style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }}
            ellipsis={{ rows: 2 }}
          >
            {email.preview}
          </Typography.Paragraph>
        </div>
        <Space style={{ marginLeft: 16, flexShrink: 0 }}>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => setPreviewOpen(true)}
          >
            Xem
          </Button>
          {!isApproved && (
            <Button
              size="small"
              type="primary"
              icon={<CheckOutlined />}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={() => onApprove(email.id)}
            >
              Duyệt
            </Button>
          )}
        </Space>
      </Flex>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={640}
        title={email.label}
      >
        <div
          style={{ padding: 16, background: '#f9fafb', borderRadius: 8 }}
          dangerouslySetInnerHTML={{ __html: email.preview }}
        />
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8 }}>
          (Preview rút gọn — nội dung đầy đủ được tạo bởi Toro AI)
        </Typography.Paragraph>
      </Modal>
    </Card>
  )
}

export default function EmailApprovalPage() {
  const { emails, optimisticApprove } = useEmailContext()
  const [activeTab, setActiveTab] = useState('all')

  const filtered = activeTab === 'all'
    ? emails
    : activeTab === 'pending'
      ? emails.filter(e => e.status === 'pending')
      : emails.filter(e => e.status === 'approved')

  const pendingCount = emails.filter(e => e.status === 'pending').length
  const approvedCount = emails.filter(e => e.status === 'approved').length

  const tabItems = [
    { key: 'all', label: `Tất cả (${emails.length})` },
    { key: 'pending', label: `Chờ duyệt (${pendingCount})` },
    { key: 'approved', label: `Đã duyệt (${approvedCount})` },
  ]

  return (
    <Card title="Duyệt Email">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />
      {filtered.length === 0 ? (
        <Empty description="Không có email" />
      ) : (
        filtered.map(e => (
          <EmailCard key={e.id} email={e} onApprove={optimisticApprove} />
        ))
      )}
    </Card>
  )
}
