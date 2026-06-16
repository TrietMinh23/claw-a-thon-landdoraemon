// frontend/src/components/shared/GraphAuthModal.tsx
import { useEffect, useRef, useState } from 'react'
import { Modal, Button, Typography, Space, Spin, Alert, Flex } from 'antd'
import { CopyOutlined, CheckCircleOutlined, LinkOutlined } from '@ant-design/icons'
import { startGraphAuth, pollGraphAuth } from '../../api'

interface Props {
  open: boolean
  onSuccess: () => void
  onCancel: () => void
}

type Step = 'start' | 'waiting' | 'done' | 'error'

export default function GraphAuthModal({ open, onSuccess, onCancel }: Props) {
  const [step, setStep] = useState<Step>('start')
  const [userCode, setUserCode] = useState('')
  const [verifyUrl, setVerifyUrl] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPoll = () => {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
  }

  useEffect(() => {
    if (!open) { stopPoll(); setStep('start'); setError('') }
  }, [open])

  useEffect(() => () => stopPoll(), [])

  const handleStart = async () => {
    stopPoll()
    setError('')
    setStep('waiting')
    try {
      const data = await startGraphAuth()
      setUserCode(data.user_code)
      setVerifyUrl(data.verification_uri)
      setMessage(data.message)
      pollRef.current = setInterval(async () => {
        try {
          const res = await pollGraphAuth()
          if (res.done) {
            stopPoll()
            setStep('done')
            setTimeout(onSuccess, 800)
          } else if (res.fatal_error) {
            stopPoll()
            setStep('error')
            setError(res.fatal_error)
          }
        } catch {
          // keep polling
        }
      }, 3000)
    } catch (e) {
      setStep('error')
      setError(String(e))
    }
  }

  const copyCode = () => navigator.clipboard.writeText(userCode)

  return (
    <Modal
      open={open}
      onCancel={() => { stopPoll(); onCancel() }}
      footer={null}
      width={480}
      title="Xác thực Microsoft để gửi email"
      maskClosable={false}
    >
      {step === 'start' && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert
            type="warning"
            message="Chưa kết nối Microsoft 365"
            description="Cần đăng nhập tài khoản Microsoft để gửi email qua Outlook."
            showIcon
          />
          <Button type="primary" onClick={handleStart} block style={{ background: '#0078d4', borderColor: '#0078d4' }}>
            Bắt đầu xác thực
          </Button>
        </Space>
      )}

      {step === 'waiting' && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert type="info" message={message || 'Mở link bên dưới và nhập mã để xác thực'} showIcon />
          <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '16px 20px' }}>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
              Mã xác thực của bạn:
            </Typography.Text>
            <Flex align="center" justify="space-between">
              <Typography.Text style={{ fontSize: 28, fontWeight: 700, letterSpacing: 4, color: '#0369a1' }}>
                {userCode}
              </Typography.Text>
              <Button size="small" icon={<CopyOutlined />} onClick={copyCode}>Sao chép</Button>
            </Flex>
          </div>
          <Button
            icon={<LinkOutlined />}
            href={verifyUrl}
            target="_blank"
            block
            style={{ borderColor: '#0078d4', color: '#0078d4' }}
          >
            Mở trang xác thực Microsoft
          </Button>
          <Flex align="center" gap={8} justify="center" style={{ color: '#6b7280', fontSize: 13 }}>
            <Spin size="small" />
            <span>Đang chờ xác thực...</span>
          </Flex>
        </Space>
      )}

      {step === 'done' && (
        <Flex vertical align="center" justify="center" style={{ padding: '24px 0', gap: 12 }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#16a34a' }} />
          <Typography.Text strong style={{ fontSize: 16 }}>Xác thực thành công!</Typography.Text>
          <Typography.Text type="secondary">Đang gửi email...</Typography.Text>
        </Flex>
      )}

      {step === 'error' && (
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Alert type="error" message="Lỗi xác thực" description={error} showIcon />
          <Button onClick={handleStart} block>Thử lại</Button>
        </Space>
      )}
    </Modal>
  )
}
