// frontend/src/components/layout/AppLayout.tsx
import { Layout, Flex, Typography, Divider, Button, Avatar } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import Sidebar from './Sidebar'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  const { user, logout } = useAuth()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <Flex align="center" gap={0} style={{ width: '100%' }}>
          <img src="/Zalopay_logo.png" alt="Zalopay" style={{ height: 28, objectFit: 'contain' }} />
          <Divider type="vertical" style={{ height: 20, margin: '0 14px', borderColor: '#d9d9d9' }} />
          <Flex align="center" gap={8} style={{ flex: 1 }}>
            <img src="/toro.png" alt="Toro" style={{ height: 32, objectFit: 'contain' }} />
            <Typography.Text strong style={{ fontSize: 14 }}>Toro L&D Ops Assistant</Typography.Text>
          </Flex>
          <Flex align="center" gap={12}>
            <Avatar size={28} style={{ background: '#16a34a', fontSize: 12 }}>
              {user?.split('@')[0].slice(0, 2).toUpperCase()}
            </Avatar>
            <Typography.Text style={{ fontSize: 13, color: '#595959' }}>{user}</Typography.Text>
            <Button size="small" icon={<LogoutOutlined />} onClick={logout}>Đăng xuất</Button>
          </Flex>
        </Flex>
      </Header>
      <Layout>
        <Sider width={220} style={{ background: '#fff', borderRight: '1px solid #e8e8e8' }}>
          <Sidebar />
        </Sider>
        <Content style={{ background: '#f5f7fb', padding: 24, overflowY: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
