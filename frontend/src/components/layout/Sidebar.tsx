// frontend/src/components/layout/Sidebar.tsx
import { Link, useLocation } from 'react-router-dom'
import { Menu, Badge } from 'antd'
import {
  HomeOutlined, EditOutlined, MailOutlined, AppstoreOutlined,
  UserOutlined, MessageOutlined, TrophyOutlined, BarChartOutlined, HistoryOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useEmailContext } from '../../contexts/EmailContext'

const NAV: { key: string; icon: ReactNode; label: string; badge?: boolean }[] = [
  { key: '/', icon: <HomeOutlined />, label: 'Dashboard' },
  { key: '/compose', icon: <EditOutlined />, label: 'Soạn Email' },
  { key: '/emails', icon: <MailOutlined />, label: 'Duyệt Email', badge: true },
  { key: '/workshop', icon: <AppstoreOutlined />, label: 'Workshop Detail' },
  { key: '/rsvp', icon: <UserOutlined />, label: 'RSVP Tracker' },
  { key: '/feedback', icon: <MessageOutlined />, label: 'Feedback Report' },
  { key: '/certificates', icon: <TrophyOutlined />, label: 'Certificates' },
  { key: '/analytics', icon: <BarChartOutlined />, label: 'Analytics' },
  { key: '/history', icon: <HistoryOutlined />, label: 'History' },
]

export default function Sidebar() {
  const { pathname } = useLocation()
  const { pendingCount } = useEmailContext()

  const items = NAV.map(n => ({
    key: n.key,
    icon: n.icon,
    label: (
      <Link to={n.key}>
        {n.label}
        {n.badge && pendingCount > 0 && (
          <Badge count={pendingCount} size="small" style={{ marginLeft: 8 }} />
        )}
      </Link>
    ),
  }))

  return (
    <Menu
      mode="inline"
      selectedKeys={[pathname]}
      items={items}
      style={{ height: '100%', borderRight: 0 }}
    />
  )
}
