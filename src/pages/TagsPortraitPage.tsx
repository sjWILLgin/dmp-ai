import { Card, Space, Table, Tag, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'

const { Title, Text } = Typography

export default function TagsPortraitPage() {
  const assets = useAppStore((s) => s.assets)

  const tags = React.useMemo(() => {
    const m: Record<string, number> = {}
    assets.forEach((a) => a.tags.forEach((t) => (m[t] = (m[t] ?? 0) + 1)))
    return Object.entries(m)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([tag, count]) => ({ tag, count }))
  }, [assets])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            标签与画像中心
          </Title>
          <Text type="secondary">雏形：标签热度、资产关联，后续可扩展到人群画像/标签系统。</Text>
        </div>

        <Card size="small" title="热门标签（示例）">
          <Space wrap>
            {tags.map((t) => (
              <Tag key={t.tag}>
                {t.tag}（{t.count}）
              </Tag>
            ))}
          </Space>
        </Card>

        <Card size="small" title="标签-资产关联（示例）">
          <Table
            size="small"
            rowKey="tag"
            pagination={false}
            dataSource={tags}
            columns={[
              { title: '标签', dataIndex: 'tag', width: 160, render: (v) => <Tag>{v}</Tag> },
              { title: '关联资产数', dataIndex: 'count', width: 120 },
              {
                title: '关联示例',
                render: (_, r) => {
                  const related = assets.filter((a) => a.tags.includes(r.tag)).slice(0, 3)
                  return (
                    <Space size={4} wrap>
                      {related.map((a) => (
                        <Tag key={a.id}>{a.name}</Tag>
                      ))}
                    </Space>
                  )
                },
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  )
}
