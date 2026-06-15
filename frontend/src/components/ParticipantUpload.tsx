import { Upload, Table, Typography, Spin } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import type { Participant } from '../types'

interface Props {
  participants: Participant[]
  onUpload: (file: File) => void
  isUploading: boolean
}

const COLUMNS = [
  { title: 'Tên', dataIndex: 'name', key: 'name', ellipsis: true },
  { title: 'Email', dataIndex: 'email', key: 'email', ellipsis: true },
  { title: 'Session', dataIndex: 'session', key: 'session' },
  { title: 'HRBP', dataIndex: 'hrbp', key: 'hrbp' },
]

export default function ParticipantUpload({ participants, onUpload, isUploading }: Props) {
  const uploadProps: UploadProps = {
    accept: '.xlsx,.xls,.csv',
    showUploadList: false,
    beforeUpload: (file) => {
      onUpload(file as File)
      return false
    },
  }

  const tableData = participants.slice(0, 5).map((p, i) => ({ ...p, key: i }))

  return (
    <div>
      <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
        Danh sách học viên (tuỳ chọn)
      </Typography.Text>

      <Spin spinning={isUploading}>
        <Upload.Dragger {...uploadProps}>
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text" style={{ fontSize: 13 }}>
            {participants.length > 0
              ? `✅ ${participants.length} học viên đã tải lên — kéo thả để đổi file`
              : 'Kéo thả hoặc click để upload Excel / CSV'}
          </p>
        </Upload.Dragger>
      </Spin>

      {participants.length > 0 && (
        <Table
          dataSource={tableData}
          columns={COLUMNS}
          pagination={false}
          size="small"
          style={{ marginTop: 8 }}
          footer={participants.length > 5
            ? () => `... và ${participants.length - 5} học viên khác`
            : undefined}
        />
      )}
    </div>
  )
}
