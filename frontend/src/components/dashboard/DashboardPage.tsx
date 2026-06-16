// frontend/src/components/dashboard/DashboardPage.tsx
import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Row, Col, Card, Statistic, Typography, Progress, Tag, Space, Button, Input, Flex, Avatar } from 'antd'
import {
  AppstoreOutlined, MailOutlined, TeamOutlined, ExclamationCircleOutlined,
  SendOutlined, RobotOutlined,
} from '@ant-design/icons'
import { useEmailContext } from '../../contexts/EmailContext'
import type { Workshop } from '../../types'
import { fetchWorkshops, streamDashboardChat } from '../../api'

const COLOR_MAP: Record<string, string> = {
  purple: '#7c3aed', blue: '#2563eb', green: '#16a34a',
}

interface ChatMsg { role: 'user' | 'toro'; text: string }

function ToroWidget() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'toro', text: 'Xin chào! Tôi là Toro. Hỏi tôi về workshop, RSVP, email nhé!' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    const msg = input.trim()
    if (!msg || loading) return
    setInput('')
    const history = messages.map(m => ({ role: m.role === 'toro' ? 'assistant' : 'user', content: m.text }))
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)
    setMessages(prev => [...prev, { role: 'toro', text: '' }])
    try {
      await streamDashboardChat(
        [...history, { role: 'user', content: msg }],
        chunk => setMessages(prev => {
          const next = [...prev]
          next[next.length - 1] = { role: 'toro', text: next[next.length - 1].text + chunk }
          return next
        }),
      )
    } catch {
      setMessages(prev => {
        const next = [...prev]
        next[next.length - 1] = { role: 'toro', text: 'Đã có lỗi, vui lòng thử lại.' }
        return next
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title={<Flex align="center" gap={8}><RobotOutlined style={{ color: '#16a34a' }} /><span>Toro Chat</span></Flex>} size="small" style={{ flex: 1 }}>
      <div style={{ height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
            <div style={{
              padding: '6px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5,
              background: m.role === 'user' ? '#dcfce7' : '#f3f4f6',
              color: '#374151',
            }}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <Flex gap={8}>
        <Input
          size="small" value={input} onChange={e => setInput(e.target.value)}
          placeholder="Hỏi về rsvp, email, workshop..."
          onPressEnter={send}
        />
        <Button size="small" type="primary" icon={<SendOutlined />} onClick={send} loading={loading} disabled={loading} />
      </Flex>
    </Card>
  )
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const { emails, pendingCount } = useEmailContext()
  const [workshops, setWorkshops] = useState<Workshop[]>([])

  useEffect(() => {
    fetchWorkshops().then(setWorkshops).catch(() => {})
  }, [])

  const totalStudents = workshops.reduce((s, w) => s + w.total, 0)
  const runningCount = workshops.filter(w => w.status === 'pre-workshop').length
  const rsvpFollowup = workshops.reduce((s, w) => s + w.rsvp.none, 0)
  const pendingEmailItems = emails.filter(e => e.status === 'pending').slice(0, 3)

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Flex justify="space-between" align="center">
        <div>
          <Typography.Title level={4} style={{ margin: 0 }}>Dashboard</Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>
            {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </Typography.Text>
        </div>
        <Tag color="green" icon={<RobotOutlined />}>Toro AI · Online</Tag>
      </Flex>

      {/* Stats row */}
      <Row gutter={16}>
        {[
          { title: 'Workshop đang chạy', value: runningCount, icon: <AppstoreOutlined />, color: '#16a34a', onClick: () => navigate('/compose') },
          { title: 'Email chờ duyệt', value: pendingCount, icon: <MailOutlined />, color: '#f97316', onClick: () => navigate('/emails') },
          { title: 'Tổng học viên', value: totalStudents, icon: <TeamOutlined />, color: '#2563eb', onClick: () => navigate('/rsvp') },
          { title: 'RSVP cần follow-up', value: rsvpFollowup, icon: <ExclamationCircleOutlined />, color: '#dc2626', onClick: () => navigate('/rsvp') },
        ].map(stat => (
          <Col span={6} key={stat.title}>
            <Card hoverable onClick={stat.onClick} style={{ cursor: 'pointer' }}>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color, fontSize: 28 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Workshop list */}
      <Card title="Danh sách Workshop">
        <Space direction="vertical" style={{ width: '100%' }} size={12}>
          {workshops.map(w => (
            <div
              key={w.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 16, padding: '12px 0',
                borderBottom: '1px solid #f0f0f0', cursor: 'pointer',
              }}
              onClick={() => navigate('/workshop')}
            >
              <Avatar style={{ background: COLOR_MAP[w.color] ?? '#6b7280', fontWeight: 700 }}>
                {w.abbr}
              </Avatar>
              <div style={{ flex: 1 }}>
                <Flex justify="space-between" align="center">
                  <Typography.Text strong>{w.name}</Typography.Text>
                  <Space>
                    <Tag>{w.sessions} sessions</Tag>
                    <Tag color="blue">{w.rsvp.accept} accept</Tag>
                    {w.rsvp.none > 0 && <Tag color="orange">{w.rsvp.none} chưa phản hồi</Tag>}
                  </Space>
                </Flex>
                <Flex align="center" gap={12} style={{ marginTop: 6 }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{w.dates}</Typography.Text>
                  <Progress percent={w.progress} size="small" style={{ flex: 1, maxWidth: 200, margin: 0 }} strokeColor="#16a34a" />
                </Flex>
              </div>
            </div>
          ))}
        </Space>
      </Card>

      {/* Bottom row: email queue + toro chat */}
      <Row gutter={16} align="stretch">
        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
          <Card
            style={{ flex: 1 }}
            title="Email chờ duyệt"
            extra={<Button type="link" size="small" onClick={() => navigate('/emails')}>Xem tất cả</Button>}
          >
            <Space direction="vertical" style={{ width: '100%' }} size={8}>
              {pendingEmailItems.length === 0 && (
                <Typography.Text type="secondary">Không có email chờ duyệt</Typography.Text>
              )}
              {pendingEmailItems.map(e => (
                <div key={e.id} style={{ fontSize: 13 }}>
                  <Flex justify="space-between">
                    <Typography.Text strong>{e.label}</Typography.Text>
                    <Tag color="orange" style={{ fontSize: 11 }}>Chờ duyệt</Tag>
                  </Flex>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{e.preview.slice(0, 80)}...</Typography.Text>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12} style={{ display: 'flex', flexDirection: 'column' }}>
          <ToroWidget />
        </Col>
      </Row>
    </Space>
  )
}
