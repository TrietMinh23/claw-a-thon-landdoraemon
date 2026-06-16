// frontend/src/components/emails/EmailApprovalPage.tsx
import { useState } from 'react'
import { Card, Tabs, Tag, Button, Space, Typography, Modal, Flex, Empty, Segmented, Input, Popconfirm, message } from 'antd'
import { CheckOutlined, EyeOutlined, EditOutlined, DeleteOutlined, CodeOutlined } from '@ant-design/icons'
import { useEmailContext } from '../../contexts/EmailContext'
import GraphAuthModal from '../shared/GraphAuthModal'
import type { EmailDraft } from '../../types'

const TYPE_COLORS: Record<string, string> = {
  invite: 'blue', remind: 'orange', setup: 'purple', followup: 'green', custom: 'default',
}
const TYPE_LABELS: Record<string, string> = {
  invite: 'Mời tham dự', remind: 'Remind', setup: 'Setup phòng', followup: 'Follow-up', custom: 'Tùy chỉnh',
}

function PreviewModal({ email, open, onClose }: { email: EmailDraft; open: boolean; onClose: () => void }) {
  const body = email.body || `<p>${email.preview}</p>`
  return (
    <Modal open={open} onCancel={onClose} footer={null} width={680} title={email.label}>
      <div style={{ background: '#f9fafb', borderRadius: 8, padding: 16, marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
          <strong>To:</strong> {email.to?.join(', ') || '—'}
        </div>
        <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 12 }}>
          <strong>Subject:</strong> {email.subject || '—'}
        </div>
        <div dangerouslySetInnerHTML={{ __html: body }} />
      </div>
    </Modal>
  )
}

function EditModal({ email, open, onClose, onSave }: {
  email: EmailDraft; open: boolean; onClose: () => void; onSave: (body: string) => void
}) {
  const [mode, setMode] = useState<'preview' | 'html'>('preview')
  const [html, setHtml] = useState(email.body || '')

  const handleOk = () => { onSave(html); onClose() }

  return (
    <Modal
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Lưu"
      cancelText="Huỷ"
      width={740}
      title={
        <Flex align="center" justify="space-between" style={{ paddingRight: 40 }}>
          <span>{email.label}</span>
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
      }
    >
      {mode === 'html' ? (
        <Input.TextArea
          value={html}
          onChange={e => setHtml(e.target.value)}
          autoSize={{ minRows: 18 }}
          style={{ fontFamily: 'monospace', fontSize: 12 }}
          spellCheck={false}
        />
      ) : (
        <div
          style={{ minHeight: 300, border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, background: '#fff' }}
          dangerouslySetInnerHTML={{ __html: html || '<p style="color:#9ca3af;text-align:center;padding:40px 0">Chưa có nội dung</p>' }}
        />
      )}
    </Modal>
  )
}

function EmailCard({ email, onApprove }: { email: EmailDraft; onApprove: (id: string) => Promise<void> }) {
  const { deleteEmail, updateEmail } = useEmailContext()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [approving, setApproving] = useState(false)
  const isApproved = email.status === 'approved'

  const handleApprove = async () => {
    setApproving(true)
    try {
      await onApprove(email.id)
      message.success('Email đã được gửi!')
    } catch (err) {
      const msg = String(err)
      if (msg.includes('503')) {
        setAuthOpen(true)
      } else if (msg.includes('404')) {
        message.error('Email không tìm thấy trên server.')
      } else {
        message.error(`Gửi thất bại: ${msg}`)
      }
    } finally {
      setApproving(false)
    }
  }

  return (
    <Card size="small" style={{ marginBottom: 12, opacity: isApproved ? 0.7 : 1 }}>
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
          <Typography.Paragraph style={{ margin: '6px 0 0', fontSize: 13, color: '#6b7280' }} ellipsis={{ rows: 2 }}>
            {email.preview}
          </Typography.Paragraph>
        </div>

        <Space style={{ marginLeft: 16, flexShrink: 0 }}>
          <Button size="small" icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>Xem</Button>
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditOpen(true)}>Edit</Button>
          {!isApproved && (
            <Button
              size="small" type="primary"
              icon={<CheckOutlined />}
              loading={approving}
              style={{ background: '#16a34a', borderColor: '#16a34a' }}
              onClick={handleApprove}
            >
              Duyệt
            </Button>
          )}
          <Popconfirm
            title="Xoá email này?"
            okText="Xoá" cancelText="Huỷ"
            okButtonProps={{ danger: true }}
            onConfirm={() => deleteEmail(email.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      </Flex>

      <PreviewModal email={email} open={previewOpen} onClose={() => setPreviewOpen(false)} />
      <EditModal
        email={email}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={body => updateEmail(email.id, { body })}
      />
      <GraphAuthModal
        open={authOpen}
        onCancel={() => setAuthOpen(false)}
        onSuccess={() => { setAuthOpen(false); handleApprove() }}
      />
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

  return (
    <Card title="Duyệt Email">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'all', label: `Tất cả (${emails.length})` },
          { key: 'pending', label: `Chờ duyệt (${pendingCount})` },
          { key: 'approved', label: `Đã duyệt (${approvedCount})` },
        ]}
        style={{ marginBottom: 16 }}
      />
      {filtered.length === 0 ? (
        <Empty description="Không có email" />
      ) : (
        filtered.map(e => <EmailCard key={e.id} email={e} onApprove={(id) => optimisticApprove(id)} />)
      )}
    </Card>
  )
}
