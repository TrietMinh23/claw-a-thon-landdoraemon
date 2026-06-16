import { useState } from 'react'
import {
  Row,
  Col,
  Table,
  Button,
  Tag,
  Avatar,
  Typography,
  Space,
  Alert,
  Card,
  Divider,
  message,
} from 'antd'
import type { TableColumnsType } from 'antd'
import type { TableRowSelection } from 'antd/es/table/interface'

const { Title, Text } = Typography

interface Attendee {
  key: string
  name: string
  email: string
  bu: string
  session: string
}

const ATTENDEES: Attendee[] = [
  { key: '1', name: 'Nguyễn Văn Minh',  email: 'minhNV@zalopay.vn',  bu: 'Engineering', session: 'Session 1' },
  { key: '2', name: 'Trần Thị Lan',     email: 'lanTT@zalopay.vn',   bu: 'Product',     session: 'Session 1' },
  { key: '3', name: 'Đỗ Thị Hoa',       email: 'hoaDT@zalopay.vn',   bu: 'Engineering', session: 'Session 3' },
  { key: '4', name: 'Bùi Quang Huy',    email: 'huyBQ@zalopay.vn',   bu: 'Finance',     session: 'Session 4' },
  { key: '5', name: 'Nguyễn Thị Mai',   email: 'maiNT@zalopay.vn',   bu: 'Marketing',   session: 'Session 2' },
  { key: '6', name: 'Lê Văn Dũng',      email: 'dungLV@zalopay.vn',  bu: 'Data',        session: 'Session 1' },
  { key: '7', name: 'Phạm Thu Hương',   email: 'huongPT@zalopay.vn', bu: 'Design',      session: 'Session 2' },
  { key: '8', name: 'Trần Minh Tuấn',   email: 'tuanTM@zalopay.vn',  bu: 'Engineering', session: 'Session 3' },
  { key: '9', name: 'Vũ Thị Hằng',      email: 'hangVT@zalopay.vn',  bu: 'BD',          session: 'Session 4' },
  { key: '10', name: 'Ngô Đức Thắng',   email: 'thangND@zalopay.vn', bu: 'Ops',         session: 'Session 1' },
]

const SESSION_COLORS: Record<string, string> = {
  'Session 1': 'blue',
  'Session 2': 'green',
  'Session 3': 'orange',
  'Session 4': 'purple',
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const AVATAR_COLORS = ['#52c41a', '#1890ff', '#fa8c16', '#722ed1', '#eb2f96']
function getAvatarColor(key: string): string {
  return AVATAR_COLORS[parseInt(key, 10) % AVATAR_COLORS.length]
}

interface CertificatePreviewProps {
  attendee: Attendee
}

function CertificatePreview({ attendee }: CertificatePreviewProps) {
  return (
    <div
      style={{
        border: '3px solid #52c41a',
        borderRadius: 8,
        padding: '32px 28px',
        background: '#fff',
        position: 'relative',
        minHeight: 420,
        boxShadow: '0 2px 16px rgba(82,196,26,0.10)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 0,
      }}
    >
      {/* Decorative top accent */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #52c41a 100%)',
          borderRadius: '6px 6px 0 0',
        }}
      />
      {/* Decorative corner accents */}
      <div style={{ position: 'absolute', top: 12, left: 12, width: 20, height: 20, borderTop: '3px solid #52c41a', borderLeft: '3px solid #52c41a', borderRadius: '4px 0 0 0' }} />
      <div style={{ position: 'absolute', top: 12, right: 12, width: 20, height: 20, borderTop: '3px solid #52c41a', borderRight: '3px solid #52c41a', borderRadius: '0 4px 0 0' }} />
      <div style={{ position: 'absolute', bottom: 12, left: 12, width: 20, height: 20, borderBottom: '3px solid #52c41a', borderLeft: '3px solid #52c41a', borderRadius: '0 0 0 4px' }} />
      <div style={{ position: 'absolute', bottom: 12, right: 12, width: 20, height: 20, borderBottom: '3px solid #52c41a', borderRight: '3px solid #52c41a', borderRadius: '0 0 4px 0' }} />

      {/* ZaloPay logo */}
      <img
        src="/Zalopay_logo.png"
        alt="ZaloPay"
        style={{
          height: 40,
          marginTop: 8,
          marginBottom: 12,
          objectFit: 'contain',
        }}
      />

      <Text
        style={{
          fontSize: 11,
          letterSpacing: 3,
          textTransform: 'uppercase',
          color: '#52c41a',
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Certificate of Completion
      </Text>

      <Divider style={{ margin: '10px 0', borderColor: '#52c41a', minWidth: '60%', width: '60%' }} />

      <Text style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>Chứng nhận</Text>

      <Text
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#003087',
          textAlign: 'center',
          marginTop: 4,
          marginBottom: 6,
          fontFamily: 'Georgia, serif',
          letterSpacing: 0.5,
        }}
      >
        {attendee.name}
      </Text>

      <Text style={{ fontSize: 13, color: '#444', marginBottom: 2 }}>đã hoàn thành chương trình</Text>

      <Text
        style={{
          fontSize: 14,
          fontStyle: 'italic',
          color: '#52c41a',
          fontWeight: 600,
          marginBottom: 16,
          textAlign: 'center',
        }}
      >
        Strengths-based Development Program
      </Text>

      <Text style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>24/03 – 31/03/2026</Text>

      {/* Signature area */}
      <div
        style={{
          width: '100%',
          borderTop: '1px solid #d9d9d9',
          paddingTop: 12,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <div
          style={{
            fontFamily: 'cursive',
            fontSize: 20,
            color: '#003087',
            letterSpacing: 1,
          }}
        >
          L&amp;D Team
        </div>
        <Text style={{ fontSize: 11, color: '#888' }}>Trưởng bộ phận L&D</Text>
      </div>

      {/* Bottom accent */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 6,
          background: 'linear-gradient(90deg, #52c41a 0%, #73d13d 50%, #52c41a 100%)',
          borderRadius: '0 0 6px 6px',
        }}
      />
    </div>
  )
}

export default function CertificatesPage() {
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee>(ATTENDEES[0])
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

  const rowSelection: TableRowSelection<Attendee> = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
  }

  const columns: TableColumnsType<Attendee> = [
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Attendee) => (
        <Space>
          <Avatar
            size={32}
            style={{ backgroundColor: getAvatarColor(record.key), fontSize: 13, fontWeight: 700 }}
          >
            {getInitials(name)}
          </Avatar>
          <Text style={{ fontSize: 13 }}>{name}</Text>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text style={{ fontSize: 12, color: '#888' }}>{email}</Text>,
    },
    {
      title: 'BU',
      dataIndex: 'bu',
      key: 'bu',
      render: (bu: string) => <Text style={{ fontSize: 12 }}>{bu}</Text>,
    },
    {
      title: 'Session',
      dataIndex: 'session',
      key: 'session',
      render: (session: string) => (
        <Tag color={SESSION_COLORS[session] ?? 'default'} style={{ fontSize: 11 }}>
          {session}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'action',
      render: (_: unknown, record: Attendee) => (
        <Button
          size="small"
          type={selectedAttendee.key === record.key ? 'primary' : 'default'}
          style={
            selectedAttendee.key === record.key
              ? { background: '#52c41a', borderColor: '#52c41a', fontSize: 12 }
              : { fontSize: 12 }
          }
          onClick={() => setSelectedAttendee(record)}
        >
          Xem cert
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px 32px', background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0, color: '#1a1a2e' }}>
          Certificates
        </Title>
        <Text style={{ color: '#888', fontSize: 14 }}>
          Strengths-based Development Program · 78 học viên hoàn thành
        </Text>
      </div>

      {/* Action buttons */}
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          size="middle"
          style={{ background: '#52c41a', borderColor: '#52c41a', fontWeight: 600 }}
          onClick={() =>
            message.success('Đang gửi certificate cho 78 học viên qua email...')
          }
        >
          Gửi tất cả (78)
        </Button>
        <Button
          size="middle"
          onClick={() => message.info('Đang xuất PDF...')}
        >
          Export PDF (78)
        </Button>
      </Space>

      {/* Toro AI Alert */}
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 20, borderRadius: 8 }}
        message={
          <Space>
            <Text style={{ fontWeight: 600, color: '#1890ff' }}>Toro AI</Text>
            <Text>
              78 học viên đã hoàn thành workshop. Toro sẽ gửi certificate cá nhân hóa qua email
              cho từng người.
            </Text>
          </Space>
        }
      />

      {/* Main layout */}
      <Row gutter={24}>
        {/* LEFT: Table */}
        <Col span={14}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
            styles={{ body: { padding: '16px 16px 8px' } }}
          >
            <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontWeight: 600, fontSize: 15 }}>Danh sách học viên</Text>
              <Text style={{ fontSize: 12, color: '#888' }}>(hiển thị 10 / 78 người)</Text>
            </div>
            <Table<Attendee>
              rowSelection={rowSelection}
              columns={columns}
              dataSource={ATTENDEES}
              pagination={false}
              size="small"
              rowKey="key"
              onRow={(record) => ({
                style: {
                  background: selectedAttendee.key === record.key ? '#f6ffed' : undefined,
                  cursor: 'pointer',
                },
              })}
            />
          </Card>
        </Col>

        {/* RIGHT: Certificate preview */}
        <Col span={10}>
          <Card
            bordered={false}
            style={{ borderRadius: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}
            styles={{ body: { padding: 16 } }}
          >
            <Text style={{ fontWeight: 600, fontSize: 15, display: 'block', marginBottom: 14 }}>
              Xem trước certificate
            </Text>
            <CertificatePreview attendee={selectedAttendee} />
            <div style={{ textAlign: 'center', marginTop: 14 }}>
              <Button
                type="primary"
                size="small"
                style={{ background: '#52c41a', borderColor: '#52c41a' }}
                onClick={() => message.success('Đã gửi!')}
              >
                Gửi certificate này
              </Button>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  )
}
