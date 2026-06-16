// frontend/src/components/feedback/FeedbackPage.tsx
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Rate,
  Tag,
  Button,
  Space,
  Typography,
  Alert,
  List,
  Badge,
  message,
  Divider,
} from 'antd'
import {
  RobotOutlined,
  LikeOutlined,
  WarningOutlined,
  DownloadOutlined,
  ShareAltOutlined,
} from '@ant-design/icons'

const { Title, Text } = Typography

const workshopName = 'Strengths-based Development Program'

const stats = {
  totalAttendees: 104,
  responses: 56,
  avgScore: 4.6,
  nps: 72,
  satisfaction: 92,
}

const starDistribution: { star: number; count: number }[] = [
  { star: 5, count: 34 },
  { star: 4, count: 18 },
  { star: 3, count: 3 },
  { star: 2, count: 1 },
  { star: 1, count: 0 },
]

const criteriaScores: { label: string; score: number }[] = [
  { label: 'Nội dung chương trình', score: 4.7 },
  { label: 'Facilitator', score: 4.5 },
  { label: 'Tài liệu', score: 4.8 },
  { label: 'Thời lượng', score: 4.4 },
  { label: 'Địa điểm', score: 4.1 },
  { label: 'Tổ chức', score: 4.9 },
]

const strengths: { text: string; votes: number }[] = [
  { text: 'Facilitator kết nối tốt strengths report vào công việc thực tế', votes: 28 },
  { text: 'Hoạt động nhóm thú vị, tạo không gian chia sẻ tốt', votes: 22 },
  { text: 'Nội dung thực tiễn, có thể áp dụng ngay', votes: 19 },
  { text: 'Không khí workshop thoải mái, cởi mở', votes: 15 },
]

const improvements: { text: string; votes: number }[] = [
  { text: 'Thời lượng ngắn, cần thêm 30–45 phút thực hành nhóm', votes: 18 },
  { text: 'Muốn có thêm case study thực tế từ Zalopay', votes: 12 },
  { text: 'Handout chưa đủ bài tập để làm tiếp sau workshop', votes: 8 },
]

export default function FeedbackPage() {
  const responseRate = Math.round((stats.responses / stats.totalAttendees) * 100)

  return (
    <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Title row */}
      <Space align="center" style={{ marginBottom: 4 }}>
        <Title level={3} style={{ margin: 0 }}>
          Feedback Report
        </Title>
        <Tag
          icon={<RobotOutlined />}
          color="purple"
          style={{ fontSize: 13, padding: '2px 10px', borderRadius: 12 }}
        >
          Toro AI
        </Tag>
      </Space>

      <Text type="secondary" style={{ display: 'block', marginBottom: 4, marginTop: 8 }}>
        {workshopName}
      </Text>
      <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
        {stats.totalAttendees} attendees &middot; {stats.responses} responses &middot;{' '}
        {responseRate}% response rate
      </Text>

      {/* Top 3 stat cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Avg Score"
              value={stats.avgScore}
              suffix={<Text type="secondary">/5</Text>}
              valueStyle={{ color: '#faad14', fontWeight: 700 }}
            />
            <Rate
              disabled
              allowHalf
              value={stats.avgScore}
              style={{ fontSize: 16, marginTop: 8 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Net Promoter Score"
              value={`+${stats.nps}`}
              valueStyle={{ color: '#1677ff', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Excellent &mdash; above industry average
            </Text>
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card>
            <Statistic
              title="Satisfaction"
              value={stats.satisfaction}
              suffix="%"
              valueStyle={{ color: '#52c41a', fontWeight: 700 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Rated 4 or 5 stars
            </Text>
          </Card>
        </Col>
      </Row>

      {/* Toro AI Summary */}
      <Alert
        icon={<RobotOutlined />}
        showIcon
        type="success"
        message={
          <Text strong style={{ color: '#389e0d' }}>
            Toro AI Insight
          </Text>
        }
        description="Toro phân tích: Workshop nhận phản hồi rất tích cực. Điểm nổi bật là chất lượng facilitator và tính ứng dụng thực tế. Điểm cần cải thiện: thời lượng và case study."
        style={{ marginBottom: 24, borderColor: '#b7eb8f' }}
      />

      {/* Star distribution + Criteria scores */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card title="Phân phối điểm" style={{ height: '100%' }}>
            {starDistribution.map(({ star, count }) => (
              <Row key={star} align="middle" gutter={8} style={{ marginBottom: 10 }}>
                <Col flex="40px">
                  <Text>{star}★</Text>
                </Col>
                <Col flex="auto">
                  <Progress
                    percent={Math.round((count / stats.responses) * 100)}
                    size="small"
                    strokeColor={star >= 4 ? '#52c41a' : star === 3 ? '#faad14' : '#ff4d4f'}
                    showInfo={false}
                  />
                </Col>
                <Col flex="36px">
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {count}
                  </Text>
                </Col>
              </Row>
            ))}
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Điểm theo tiêu chí" style={{ height: '100%' }}>
            {criteriaScores.map(({ label, score }) => {
              const color = score >= 4.5 ? '#52c41a' : '#fa8c16'
              return (
                <Row key={label} align="middle" gutter={8} style={{ marginBottom: 10 }}>
                  <Col flex="160px">
                    <Text style={{ fontSize: 13 }}>{label}</Text>
                  </Col>
                  <Col flex="auto">
                    <Progress
                      percent={Math.round((score / 5) * 100)}
                      size="small"
                      strokeColor={color}
                      format={() => (
                        <Text style={{ fontSize: 12, color }}>{score}</Text>
                      )}
                    />
                  </Col>
                </Row>
              )
            })}
          </Card>
        </Col>
      </Row>

      <Divider />

      {/* Strengths + Improvements */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <LikeOutlined style={{ color: '#52c41a' }} />
                <Text strong style={{ color: '#52c41a' }}>
                  Điểm mạnh
                </Text>
              </Space>
            }
            style={{ height: '100%', borderColor: '#b7eb8f' }}
            styles={{ header: { borderBottomColor: '#b7eb8f' } }}
          >
            <List
              dataSource={strengths}
              renderItem={({ text, votes }) => (
                <List.Item
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                  extra={
                    <Badge
                      count={votes}
                      style={{ backgroundColor: '#52c41a' }}
                      overflowCount={999}
                    />
                  }
                >
                  <Space align="start">
                    <LikeOutlined style={{ color: '#52c41a', marginTop: 3, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13 }}>{text}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title={
              <Space>
                <WarningOutlined style={{ color: '#fa8c16' }} />
                <Text strong style={{ color: '#fa8c16' }}>
                  Cần cải thiện
                </Text>
              </Space>
            }
            style={{ height: '100%', borderColor: '#ffd591' }}
            styles={{ header: { borderBottomColor: '#ffd591' } }}
          >
            <List
              dataSource={improvements}
              renderItem={({ text, votes }) => (
                <List.Item
                  style={{ paddingLeft: 0, paddingRight: 0 }}
                  extra={
                    <Badge
                      count={votes}
                      style={{ backgroundColor: '#fa8c16' }}
                      overflowCount={999}
                    />
                  }
                >
                  <Space align="start">
                    <WarningOutlined style={{ color: '#fa8c16', marginTop: 3, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13 }}>{text}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      {/* Action buttons */}
      <Space>
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={() => message.info('Đang xuất báo cáo PDF...')}
        >
          Export báo cáo PDF
        </Button>
        <Button
          icon={<ShareAltOutlined />}
          onClick={() => message.success('Đã chia sẻ báo cáo với Management!')}
        >
          Chia sẻ với Management
        </Button>
      </Space>
    </div>
  )
}
