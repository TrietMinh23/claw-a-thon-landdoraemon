import { useState } from 'react'
import { Form, Input, Button, Typography, Alert, Flex } from 'antd'
import { useAuth } from '../../contexts/AuthContext'

export default function LoginPage() {
  const { login } = useAuth()
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  function onFinish({ email, password }: { email: string; password: string }) {
    setLoading(true)
    setTimeout(() => {
      const ok = login(email, password)
      if (!ok) setError(true)
      setLoading(false)
    }, 400)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f7fb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 12,
        padding: '40px 40px 32px',
        width: 380,
        boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid #e8e8e8',
      }}>
        {/* Logo */}
        <Flex align="center" gap={10} style={{ marginBottom: 28 }}>
          <img src="/toro.png" alt="Toro" style={{ height: 40 }} />
          <div>
            <Typography.Title level={5} style={{ margin: 0, lineHeight: 1.2 }}>Toro L&D Ops</Typography.Title>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>Zalopay Learning & Development</Typography.Text>
          </div>
        </Flex>

        {error && (
          <Alert
            message="Email hoặc mật khẩu không đúng"
            type="error"
            showIcon
            style={{ marginBottom: 20 }}
            closable
            onClose={() => setError(false)}
          />
        )}

        <Form layout="vertical" onFinish={onFinish} requiredMark={false}>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Nhập email' }]}>
            <Input placeholder="ld@zalopay.vn" size="large" autoFocus />
          </Form.Item>
          <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Nhập mật khẩu' }]}>
            <Input.Password placeholder="••••••••" size="large" />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            size="large"
            block
            loading={loading}
            style={{ background: '#16a34a', borderColor: '#16a34a', marginTop: 4 }}
          >
            Đăng nhập
          </Button>
        </Form>
      </div>
    </div>
  )
}
