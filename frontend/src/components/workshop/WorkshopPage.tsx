// frontend/src/components/workshop/WorkshopPage.tsx
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Row,
  Col,
  Card,
  Tabs,
  Tag,
  Progress,
  Checkbox,
  Button,
  Typography,
  Badge,
  Timeline,
  Space,
  Statistic,
} from 'antd'
import {
  CalendarOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  UserOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

// ─── Mock Data ────────────────────────────────────────────────────────────────

const sessions = [
  {
    id: 1,
    date: '25/03/2026',
    time: '9:30-12:00',
    room: 'Đà Nẵng–Hà Nội',
    trainer: 'External Facilitator',
    attendees: 29,
    confirmed: 22,
  },
  {
    id: 2,
    date: '26/03/2026',
    time: '9:30-12:00',
    room: 'Đà Nẵng–Hà Nội',
    trainer: 'External Facilitator',
    attendees: 27,
    confirmed: 20,
  },
  {
    id: 3,
    date: '27/03/2026',
    time: '14:00-16:30',
    room: 'Sài Gòn–Đà Nẵng',
    trainer: 'Internal L&D',
    attendees: 22,
    confirmed: 18,
  },
  {
    id: 4,
    date: '31/03/2026',
    time: '9:30-12:00',
    room: 'Đà Nẵng–Hà Nội',
    trainer: 'External Facilitator',
    attendees: 26,
    confirmed: 18,
  },
]

interface ChecklistItem {
  id: number
  label: string
  done: boolean
  team: string
  deadline?: string
  note?: string
}

const checklistItems: ChecklistItem[] = [
  { id: 1,  label: 'Đặt phòng họp',                           done: true,  team: 'AF Team',  note: 'all sessions' },
  { id: 2,  label: 'Gửi email mời',                            done: true,  team: 'L&D Team' },
  { id: 3,  label: 'In tài liệu Strengths report',             done: true,  team: 'AF Team',  note: '110 bản' },
  { id: 4,  label: 'Chuẩn bị name card',                       done: true,  team: 'AF Team',  note: '110 cái' },
  { id: 5,  label: 'Setup projector & screen',                 done: true,  team: 'IT Team' },
  { id: 6,  label: 'Confirm catering',                         done: false, team: 'AF Team',  deadline: '22/03' },
  { id: 7,  label: 'Gửi remind 12h trước',                     done: false, team: 'L&D Team' },
  { id: 8,  label: 'Gửi remind 15m trước',                     done: false, team: 'L&D Team' },
  { id: 9,  label: 'Chuẩn bị feedback form',                   done: false, team: 'L&D Team' },
  { id: 10, label: 'Chuẩn bị certificate template',            done: false, team: 'L&D Team' },
  { id: 11, label: 'Brief facilitator về group composition',   done: true,  team: 'L&D Team' },
  { id: 12, label: 'Setup Teams link backup',                  done: false, team: 'IT Team',  deadline: '23/03' },
  { id: 13, label: 'Gửi pre-survey',                           done: true,  team: 'L&D Team', note: '92 responses' },
  { id: 14, label: 'Chuẩn bị post-survey link',                done: false, team: 'L&D Team' },
  { id: 15, label: 'Booking parking cho external facilitator', done: false, team: 'AF Team' },
]

const timelineEvents = [
  { date: '15/03', label: 'Kick-off planning meeting',          done: true,  current: false },
  { date: '16/03', label: 'Gửi email mời tham dự (104 người)', done: true,  current: false },
  { date: '18/03', label: 'Gửi pre-survey',                    done: true,  current: false },
  { date: '20/03', label: 'RSVP deadline reminder',            done: true,  current: false },
  { date: '22/03', label: 'Pre-survey closed (92 responses)',  done: true,  current: false },
  { date: '24/03', label: 'Gửi remind 12h trước Session 1',   done: false, current: true  },
  { date: '25/03', label: 'Session 1 (9:30-12:00)',            done: false, current: false },
  { date: '26/03', label: 'Session 2 (9:30-12:00)',            done: false, current: false },
  { date: '27/03', label: 'Session 3 (14:00-16:30)',           done: false, current: false },
  { date: '31/03', label: 'Session 4 (9:30-12:00)',            done: false, current: false },
  { date: '01/04', label: 'Gửi post-survey',                   done: false, current: false },
  { date: '05/04', label: 'Gửi certificates',                  done: false, current: false },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function confirmationTag(confirmed: number, attendees: number) {
  const pct = (confirmed / attendees) * 100
  if (pct > 80) return <Tag color="success">Tốt</Tag>
  if (pct >= 60) return <Tag color="warning">Trung bình</Tag>
  return <Tag color="error">Thấp</Tag>
}

function teamColor(team: string): string {
  switch (team) {
    case 'AF Team':  return 'blue'
    case 'L&D Team': return 'purple'
    case 'IT Team':  return 'cyan'
    default:         return 'default'
  }
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SessionPlannerTab() {
  return (
    <Row gutter={[16, 16]}>
      {sessions.map((s) => {
        const pct = Math.round((s.confirmed / s.attendees) * 100)
        return (
          <Col xs={24} sm={12} key={s.id}>
            <Card
              size="small"
              title={
                <Space>
                  <Badge
                    count={`Session ${s.id}`}
                    style={{ backgroundColor: '#1677ff' }}
                  />
                  <Text strong>{s.date}</Text>
                </Space>
              }
              extra={confirmationTag(s.confirmed, s.attendees)}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={6}>
                <Space>
                  <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                  <Text>{s.time}</Text>
                </Space>
                <Space>
                  <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                  <Text>{s.room}</Text>
                </Space>
                <Space>
                  <UserOutlined style={{ color: '#8c8c8c' }} />
                  <Text>{s.trainer}</Text>
                </Space>
                <div style={{ marginTop: 8 }}>
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 12 }}>Xác nhận tham dự</Text>
                    <Text strong>{s.confirmed}/{s.attendees}</Text>
                  </Row>
                  <Progress
                    percent={pct}
                    size="small"
                    strokeColor={pct > 80 ? '#52c41a' : pct >= 60 ? '#faad14' : '#ff4d4f'}
                    showInfo={false}
                    style={{ marginTop: 4 }}
                  />
                </div>
              </Space>
            </Card>
          </Col>
        )
      })}
    </Row>
  )
}

function LogisticsTab() {
  const totalDone = checklistItems.filter((i) => i.done).length
  const [selected, setSelected] = useState<number[]>([])

  function toggleSelect(id: number, checked: boolean) {
    setSelected((prev) =>
      checked ? [...prev, id] : prev.filter((x) => x !== id)
    )
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      {/* Summary bar */}
      <Card size="small">
        <Row justify="space-between" align="middle" style={{ marginBottom: 8 }}>
          <Text strong>{totalDone}/15 hoàn thành</Text>
          <Tag color={totalDone === 15 ? 'success' : 'processing'}>
            {totalDone === 15 ? 'Xong' : 'Đang tiến hành'}
          </Tag>
        </Row>
        <Progress
          percent={Math.round((totalDone / 15) * 100)}
          strokeColor="#1677ff"
          size="small"
        />
      </Card>

      {/* Checklist items */}
      <Card size="small" styles={{ body: { padding: '4px 16px' } }}>
        {checklistItems.map((item, idx) => (
          <Row
            key={item.id}
            align="middle"
            style={{
              padding: '10px 0',
              borderBottom:
                idx < checklistItems.length - 1 ? '1px solid #f0f0f0' : 'none',
            }}
            gutter={8}
          >
            <Col flex="none">
              <Checkbox
                checked={item.done || selected.includes(item.id)}
                disabled={item.done}
                onChange={(e) => toggleSelect(item.id, e.target.checked)}
              />
            </Col>
            <Col flex="auto">
              <Space wrap size={6}>
                <Text
                  style={{
                    textDecoration: item.done ? 'line-through' : 'none',
                    color: item.done ? '#8c8c8c' : 'inherit',
                  }}
                >
                  {item.label}
                </Text>
                {item.note && (
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    ({item.note})
                  </Text>
                )}
              </Space>
            </Col>
            <Col flex="none">
              <Space size={4}>
                <Tag color={teamColor(item.team)} style={{ margin: 0, fontSize: 11 }}>
                  {item.team}
                </Tag>
                {!item.done && item.deadline && (
                  <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>
                    Deadline: {item.deadline}
                  </Tag>
                )}
              </Space>
            </Col>
          </Row>
        ))}
      </Card>

      {/* Action button */}
      <Button
        type="primary"
        icon={<CheckCircleOutlined />}
        disabled={selected.length === 0}
        onClick={() => setSelected([])}
      >
        Đánh dấu hoàn thành ({selected.length} mục)
      </Button>
    </Space>
  )
}

function TimelineTab() {
  return (
    <Card size="small">
      <Timeline
        items={timelineEvents.map((ev) => ({
          dot: ev.current ? (
            <ClockCircleOutlined style={{ color: '#1677ff', fontSize: 16 }} />
          ) : ev.done ? (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
          ) : (
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#d9d9d9',
                marginTop: 3,
              }}
            />
          ),
          color: ev.current ? 'blue' : ev.done ? 'green' : 'gray',
          children: (
            <Space direction="vertical" size={0}>
              <Space size={8}>
                <Text
                  strong
                  style={{
                    color: ev.current ? '#1677ff' : ev.done ? '#595959' : '#bfbfbf',
                  }}
                >
                  {ev.date}
                </Text>
                <Text
                  style={{
                    color: ev.current ? '#1677ff' : ev.done ? 'inherit' : '#8c8c8c',
                    fontWeight: ev.current ? 600 : 'normal',
                  }}
                >
                  {ev.label}
                </Text>
              </Space>
              {ev.current && (
                <Tag color="blue" style={{ marginTop: 4 }}>
                  Sắp diễn ra
                </Tag>
              )}
            </Space>
          ),
        }))}
      />
    </Card>
  )
}

// ─── Workshop meta (mirrors mock_data.py) ────────────────────────────────────

const WORKSHOP_META: Record<string, { name: string; dates: string; status: string; trainer: string; room: string; total: number; sessionCount: number }> = {
  'wb-001': { name: 'Strengths-based Development Program', dates: '25/03 – 31/03/2026', status: 'Pre-workshop', trainer: 'External Facilitator / Internal L&D', room: 'Đà Nẵng–Hà Nội / Sài Gòn–Đà Nẵng', total: 104, sessionCount: 4 },
  'wb-002': { name: 'Leadership Mindset for Mid-level',    dates: '18/06/2026',          status: 'Pre-workshop', trainer: 'Internal L&D',                       room: 'Sài Gòn–Đà Nẵng Room',             total: 48,  sessionCount: 2 },
  'wb-003': { name: 'Onboarding Orientation Q3',           dates: '05/07/2026',          status: 'Planning',     trainer: 'HRBP',                               room: 'TBD',                               total: 22,  sessionCount: 1 },
}
const DEFAULT_META = WORKSHOP_META['wb-001']

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WorkshopPage() {
  const location = useLocation()
  const workshopId = (location.state as { workshopId?: string } | null)?.workshopId ?? 'wb-001'
  const meta = WORKSHOP_META[workshopId] ?? DEFAULT_META
  const totalConfirmed = sessions.reduce((sum, s) => sum + s.confirmed, 0)

  return (
    <div style={{ padding: '24px', maxWidth: 960, margin: '0 auto' }}>
      {/* Page Header */}
      <Card style={{ marginBottom: 24 }}>
        <Row justify="space-between" align="top" wrap>
          <Col>
            <Space direction="vertical" size={4}>
              <Title level={4} style={{ margin: 0 }}>
                {meta.name}
              </Title>
              <Space wrap size={8}>
                <Tag icon={<CalendarOutlined />} color="blue">
                  {meta.dates}
                </Tag>
                <Tag color="orange">{meta.status}</Tag>
                <Tag icon={<UserOutlined />}>{meta.trainer}</Tag>
                <Tag icon={<EnvironmentOutlined />}>{meta.room}</Tag>
              </Space>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Tổng participants"
              value={meta.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Đã xác nhận"
              value={totalConfirmed}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={<Text type="secondary" style={{ fontSize: 14 }}> / {meta.total}</Text>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card size="small">
            <Statistic
              title="Số sessions"
              value={meta.sessionCount}
              prefix={<CalendarOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs
        defaultActiveKey="sessions"
        items={[
          {
            key: 'sessions',
            label: (
              <Space>
                <CalendarOutlined />
                Session Planner
              </Space>
            ),
            children: <SessionPlannerTab />,
          },
          {
            key: 'logistics',
            label: (
              <Space>
                <CheckCircleOutlined />
                Logistics Checklist
              </Space>
            ),
            children: <LogisticsTab />,
          },
          {
            key: 'timeline',
            label: (
              <Space>
                <ClockCircleOutlined />
                Timeline
              </Space>
            ),
            children: <TimelineTab />,
          },
        ]}
      />
    </div>
  )
}
