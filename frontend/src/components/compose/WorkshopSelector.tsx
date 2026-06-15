// frontend/src/components/compose/WorkshopSelector.tsx
import { useEffect, useState } from 'react'
import { Select, Button, Space, Typography, Tag, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import type { Workshop, Participant } from '../../types'
import { fetchWorkshops, fetchAttendees, uploadRecipients } from '../../api'

interface Props {
  onRecipients: (attendees: Participant[], workshop: Workshop | null) => void
}

export default function WorkshopSelector({ onRecipients }: Props) {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [selectedId, setSelectedId] = useState<string>()
  const [selectedWorkshop, setSelectedWorkshop] = useState<Workshop | null>(null)
  const [recipientCount, setRecipientCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchWorkshops().then(setWorkshops).catch(() => {})
  }, [])

  const handleSelect = async (id: string) => {
    setSelectedId(id)
    setLoading(true)
    try {
      const workshop = workshops.find(w => w.id === id) ?? null
      const attendees = await fetchAttendees(id)
      setSelectedWorkshop(workshop)
      setRecipientCount(attendees.length)
      const participants: Participant[] = attendees.map(a => ({
        no: '', name: a.name, email: a.email,
        dept: a.bu, group: '', hrbp: '', session: String(a.session),
        title: '', line_manager: '',
      }))
      onRecipients(participants, workshop)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (file: File) => {
    setLoading(true)
    try {
      const result = await uploadRecipients(file)
      setSelectedWorkshop(null)
      setSelectedId(undefined)
      setRecipientCount(result.count)
      onRecipients(result.participants, null)
    } finally {
      setLoading(false)
    }
    return false // prevent antd auto-upload
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={8}>
      <Select
        style={{ width: '100%' }}
        placeholder="Chọn workshop..."
        value={selectedId}
        onChange={handleSelect}
        loading={loading}
        options={workshops.map(w => ({ value: w.id, label: w.name }))}
        allowClear
        onClear={() => { setSelectedId(undefined); setSelectedWorkshop(null); setRecipientCount(0) }}
      />
      {selectedWorkshop && (
        <Tag color="green">
          {recipientCount} học viên · {selectedWorkshop.sessions} sessions · {selectedWorkshop.short}
        </Tag>
      )}
      <Upload beforeUpload={handleFileUpload} accept=".xlsx,.xls,.csv" showUploadList={false}>
        <Button size="small" icon={<UploadOutlined />}>Upload danh sách Excel/CSV</Button>
      </Upload>
      {!selectedWorkshop && recipientCount > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>{recipientCount} học viên từ file</Typography.Text>
      )}
    </Space>
  )
}
