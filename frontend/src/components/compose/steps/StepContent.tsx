// frontend/src/components/compose/steps/StepContent.tsx
import { Button, Flex, Form, Input, Select, Typography, DatePicker, TimePicker, Space } from 'antd'

const MEETING_ROOMS = [
  'Sài Gòn – Đà Nẵng Room, VNG Campus',
  'Đà Nẵng – Hà Nội Room, VNG Campus',
  'Shanghai Room, VNG Campus',
  'Rome Room, VNG Campus',
  'Atrium, VNG Campus',
  'Online (Microsoft Teams)',
]

interface Props {
  programName: string; setProgramName: (v: string) => void
  date: string; setDate: (v: string) => void
  timeStart: string; setTimeStart: (v: string) => void
  timeEnd: string; setTimeEnd: (v: string) => void
  location: string; setLocation: (v: string) => void
  hrbpName: string; setHrbpName: (v: string) => void
  additionalNotes: string; setAdditionalNotes: (v: string) => void
  onNext: () => void
  onBack: () => void
}

export default function StepContent({
  programName, setProgramName,
  date, setDate,
  timeStart, setTimeStart,
  timeEnd, setTimeEnd,
  location, setLocation,
  hrbpName, setHrbpName,
  additionalNotes, setAdditionalNotes,
  onNext, onBack,
}: Props) {
  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 4 }}>Nội dung workshop</Typography.Title>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24, fontSize: 13 }}>
        Thông tin sẽ được dùng để soạn email
      </Typography.Text>

      <Form layout="vertical" size="middle">
        <Form.Item label="Tên chương trình / Workshop" required>
          <Input
            value={programName}
            onChange={e => setProgramName(e.target.value)}
            placeholder="VD: Strengths-based Development Workshop"
          />
        </Form.Item>
        <Form.Item label="Thời gian">
          <Space.Compact style={{ width: '100%' }}>
            <DatePicker
              format="ddd DD/MM/YYYY"
              placeholder="Chọn ngày"
              onChange={(_, dateStr) => setDate(dateStr as string)}
              style={{ width: '46%' }}
            />
            <TimePicker
              format="HH:mm"
              placeholder="Bắt đầu"
              onChange={(_, timeStr) => setTimeStart(timeStr as string)}
              style={{ width: '27%' }}
            />
            <TimePicker
              format="HH:mm"
              placeholder="Kết thúc"
              onChange={(_, timeStr) => setTimeEnd(timeStr as string)}
              style={{ width: '27%' }}
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item label="Địa điểm">
          <Select
            value={location || undefined}
            onChange={setLocation}
            placeholder="Chọn phòng / hình thức"
            allowClear
            options={MEETING_ROOMS.map(r => ({ value: r, label: r }))}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Tên PIC">
          <Input
            value={hrbpName}
            onChange={e => setHrbpName(e.target.value)}
            placeholder="VD: Nguyễn Văn A"
          />
        </Form.Item>
        <Form.Item label="Ghi chú thêm">
          <Input.TextArea
            value={additionalNotes}
            onChange={e => setAdditionalNotes(e.target.value)}
            placeholder="Mục tiêu, nội dung, dress code, lưu ý..."
            rows={3}
          />
        </Form.Item>
      </Form>

      <Flex justify="space-between" style={{ marginTop: 8 }}>
        <Button size="large" type="text" onClick={onBack}>← Quay lại</Button>
        <Button
          type="primary"
          size="large"
          onClick={onNext}
          disabled={!programName.trim()}
          style={{ background: '#16a34a', borderColor: '#16a34a', minWidth: 120 }}
        >
          Tiếp theo →
        </Button>
      </Flex>
    </div>
  )
}
