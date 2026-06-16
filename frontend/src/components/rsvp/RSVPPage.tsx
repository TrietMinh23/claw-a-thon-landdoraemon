// frontend/src/components/rsvp/RSVPPage.tsx
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Typography,
  Alert,
  message,
} from 'antd'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  QuestionCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  BellOutlined,
  ExportOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

// ─── Mock data ────────────────────────────────────────────────────────────────

const workshopInfo = {
  name: 'Strengths-based Development Program',
  sessions: 4,
  total: 104,
  accept: 78,
  decline: 8,
  tentative: 6,
  none: 12,
}

const sessions = [
  { id: 1, date: '25/03/2026', total: 29, accept: 22, decline: 2, tentative: 2, none: 3 },
  { id: 2, date: '26/03/2026', total: 27, accept: 20, decline: 3, tentative: 2, none: 2 },
  { id: 3, date: '27/03/2026', total: 22, accept: 18, decline: 1, tentative: 1, none: 2 },
  { id: 4, date: '31/03/2026', total: 26, accept: 18, decline: 2, tentative: 1, none: 5 },
]

type RSVPStatus = 'none' | 'tentative'

interface FollowUpPerson {
  key: string
  name: string
  email: string
  bu: string
  session: string
  status: RSVPStatus
}

const followUpList: FollowUpPerson[] = [
  { key: '1', name: 'Phạm Tuấn Anh',   email: 'anhPT@zalopay.vn',    bu: 'Data',      session: 'Session 2', status: 'none' },
  { key: '2', name: 'Ngô Thị Thu',     email: 'thuNT@zalopay.vn',    bu: 'BD',        session: 'Session 4', status: 'none' },
  { key: '3', name: 'Trần Văn Long',   email: 'longTV@zalopay.vn',   bu: 'Eng',       session: 'Session 1', status: 'none' },
  { key: '4', name: 'Hoàng Anh Kiệt',  email: 'kietHA@zalopay.vn',   bu: 'Product',   session: 'Session 3', status: 'none' },
  { key: '5', name: 'Vũ Minh Khoa',    email: 'khoaVM@zalopay.vn',   bu: 'Marketing', session: 'Session 3', status: 'tentative' },
  { key: '6', name: 'Lý Thị Bích',     email: 'bichLT@zalopay.vn',   bu: 'Finance',   session: 'Session 4', status: 'none' },
  { key: '7', name: 'Đặng Quốc Hưng',  email: 'hungDQ@zalopay.vn',   bu: 'Ops',       session: 'Session 2', status: 'none' },
  { key: '8', name: 'Mai Xuân Trường', email: 'truongMX@zalopay.vn',  bu: 'Eng',       session: 'Session 4', status: 'none' },
]

// ─── Stacked progress bar ──────────────────────────────────────────────────────

interface StackedBarProps {
  accept: number
  decline: number
  tentative: number
  none: number
  total: number
}

function StackedBar({ accept, decline, tentative, none, total }: StackedBarProps) {
  const pct = (n: number) => `${((n / total) * 100).toFixed(1)}%`
  return (
    <div style={{ display: 'flex', width: '100%', height: 12, borderRadius: 6, overflow: 'hidden', gap: 2 }}>
      <div style={{ width: pct(accept),    background: '#52c41a', borderRadius: '6px 0 0 6px', flexShrink: 0 }} title={`Accept: ${accept}`} />
      <div style={{ width: pct(decline),   background: '#ff4d4f', flexShrink: 0 }} title={`Decline: ${decline}`} />
      <div style={{ width: pct(tentative), background: '#fa8c16', flexShrink: 0 }} title={`Tentative: ${tentative}`} />
      <div style={{ width: pct(none),      background: '#d9d9d9', borderRadius: '0 6px 6px 0', flexShrink: 0 }} title={`No response: ${none}`} />
    </div>
  )
}

// ─── Page component ────────────────────────────────────────────────────────────

export default function RSVPPage() {
  const [messageApi, contextHolder] = message.useMessage()

  const handleSendRemind = () => {
    messageApi.success('Đã gửi remind cho 12 người!')
  }

  const handleExport = () => {
    messageApi.success('Đã export danh sách!')
  }

  const columns = [
    {
      title: 'Họ và tên',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (email: string) => <Text type="secondary">{email}</Text>,
    },
    {
      title: 'BU',
      dataIndex: 'bu',
      key: 'bu',
    },
    {
      title: 'Buổi',
      dataIndex: 'session',
      key: 'session',
    },
    {
      title: 'Trạng thái RSVP',
      dataIndex: 'status',
      key: 'status',
      render: (status: RSVPStatus) =>
        status === 'tentative' ? (
          <Tag color="orange">Có thể</Tag>
        ) : (
          <Tag color="default">Chưa phản hồi</Tag>
        ),
    },
    {
      title: 'Hành động',
      key: 'action',
      render: (_: unknown, record: FollowUpPerson) => (
        <Button
          size="small"
          icon={<BellOutlined />}
          onClick={() => messageApi.success(`Đã gửi remind cho ${record.name}!`)}
        >
          Remind
        </Button>
      ),
    },
  ]

  return (
    <div style={{ padding: '24px' }}>
      {contextHolder}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          RSVP Tracker — {workshopInfo.name}
        </Title>
        <Text type="secondary">{workshopInfo.sessions} buổi · {workshopInfo.total} người tham dự</Text>
      </div>

      {/* Toro AI Alert */}
      <Alert
        style={{ marginBottom: 24 }}
        type="info"
        showIcon
        icon={<RobotOutlined />}
        message={
          <Text>
            <Text strong>Toro AI: </Text>
            12 người chưa phản hồi. Toro đề xuất gửi remind ngay hôm nay để đảm bảo kịp thời gian.
          </Text>
        }
      />

      {/* Top stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: '#f6ffed', border: '1px solid #b7eb8f' }}>
            <Statistic
              title="Đã xác nhận"
              value={workshopInfo.accept}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<Text type="secondary" style={{ fontSize: 13 }}>/ {workshopInfo.total}</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: '#fff2f0', border: '1px solid #ffccc7' }}>
            <Statistic
              title="Từ chối"
              value={workshopInfo.decline}
              prefix={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: '#fff7e6', border: '1px solid #ffd591' }}>
            <Statistic
              title="Có thể tham dự"
              value={workshopInfo.tentative}
              prefix={<QuestionCircleOutlined style={{ color: '#fa8c16' }} />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card bordered={false} style={{ background: '#fafafa', border: '1px solid #d9d9d9' }}>
            <Statistic
              title="Chưa phản hồi"
              value={workshopInfo.none}
              prefix={<ClockCircleOutlined style={{ color: '#8c8c8c' }} />}
              valueStyle={{ color: '#8c8c8c' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Session breakdown */}
      <Title level={5} style={{ marginBottom: 12 }}>Chi tiết theo buổi</Title>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {sessions.map((s) => (
          <Col xs={24} sm={12} md={6} key={s.id}>
            <Card
              size="small"
              title={<Text strong>Session {s.id}</Text>}
              extra={<Text type="secondary" style={{ fontSize: 12 }}>{s.date}</Text>}
            >
              <div style={{ marginBottom: 12 }}>
                <StackedBar
                  accept={s.accept}
                  decline={s.decline}
                  tentative={s.tentative}
                  none={s.none}
                  total={s.total}
                />
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                <Tag color="success" style={{ margin: 0 }}>{s.accept} Accept</Tag>
                <Tag color="error"   style={{ margin: 0 }}>{s.decline} Decline</Tag>
                <Tag color="warning" style={{ margin: 0 }}>{s.tentative} Tentative</Tag>
                <Tag color="default" style={{ margin: 0 }}>{s.none} None</Tag>
              </div>
              <div style={{ marginTop: 8 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>Tổng: {s.total} người</Text>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { color: '#52c41a', label: 'Accept' },
          { color: '#ff4d4f', label: 'Decline' },
          { color: '#fa8c16', label: 'Tentative' },
          { color: '#d9d9d9', label: 'No response' },
        ].map(({ color, label }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
            <Text style={{ fontSize: 12 }}>{label}</Text>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <Space style={{ marginBottom: 24 }}>
        <Button type="primary" icon={<BellOutlined />} onClick={handleSendRemind}>
          Gửi remind cho 12 người chưa phản hồi
        </Button>
        <Button icon={<ExportOutlined />} onClick={handleExport}>
          Export danh sách decline
        </Button>
      </Space>

      {/* Follow-up table */}
      <Title level={5} style={{ marginBottom: 12 }}>Danh sách cần follow-up</Title>
      <Card bordered={false}>
        <Table<FollowUpPerson>
          dataSource={followUpList}
          columns={columns}
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  )
}
