// frontend/src/components/layout/AppLayout.tsx
import { Layout, Flex, Typography, Divider } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
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
          <img src="/Zalopay_logo.png" alt="ZaloPay" style={{ height: 28, objectFit: 'contain' }} />
          <Divider type="vertical" style={{ height: 20, margin: '0 14px', borderColor: '#d9d9d9' }} />
          <Flex align="center" gap={8}>
            <RobotOutlined style={{ fontSize: 16, color: '#16a34a' }} />
            <Typography.Text strong style={{ fontSize: 14 }}>Toro L&D Ops Assistant</Typography.Text>
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
