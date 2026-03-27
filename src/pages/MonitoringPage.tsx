import { Card, List, Space, Tag, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'

const { Title, Text } = Typography

export default function MonitoringPage() {
  const notifications = useAppStore((s) => s.notifications)

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            监控与告警中心
          </Title>
          <Text type="secondary">雏形：告警列表 + 读/未读。</Text>
        </div>

        <Card size="small" title="最新告警/通知">
          <List
            dataSource={notifications}
            renderItem={(n) => (
              <List.Item>
                <List.Item.Meta
                  title={
                    <Space>
                      {!n.read ? <Tag color="red">未读</Tag> : <Tag>已读</Tag>}
                      <span>{n.title}</span>
                    </Space>
                  }
                  description={<Text type="secondary">{new Date(n.createdAt).toLocaleString()}</Text>}
                />
              </List.Item>
            )}
          />
        </Card>
      </Space>
    </div>
  )
}
