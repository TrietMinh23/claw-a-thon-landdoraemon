// frontend/src/components/layout/AppLayout.tsx
import { Layout, Flex, Typography } from 'antd'
import { RobotOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const { Header, Sider, Content } = Layout

export default function AppLayout() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{
        background: '#fff',
        borderBottom: '1px solid #e8e8e8',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
      }}>
        <Flex align="center" gap={10}>
          <RobotOutlined style={{ fontSize: 20, color: '#16a34a' }} />
          <Typography.Title level={5} style={{ margin: 0 }}>Toro — L&D Ops Assistant</Typography.Title>
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
