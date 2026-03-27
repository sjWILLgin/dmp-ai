import { Card, Col, Row, Space, Statistic, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'

const { Title, Text } = Typography

export default function ValueOpsPage() {
  const favorites = useAppStore((s) => s.favorites)
  const apps = useAppStore((s) => s.applications)
  const assets = useAppStore((s) => s.assets)

  const byCategory = React.useMemo(() => {
    const m: Record<string, number> = {}
    assets.forEach((a) => {
      const c = a.assetCategory ?? 'UNKNOWN'
      m[c] = (m[c] ?? 0) + 1
    })
    return m
  }, [assets])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            价值运营中心
          </Title>
          <Text type="secondary">雏形：资产使用/收藏/申请等运营指标。</Text>
        </div>

        <Row gutter={12}>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic title="收藏数" value={favorites.size} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic title="申请单总数" value={apps.length} />
            </Card>
          </Col>
          <Col xs={24} md={8}>
            <Card size="small">
              <Statistic title="资产总数" value={assets.length} />
            </Card>
          </Col>
        </Row>

        <Card size="small" title="按资产大类分布（示例）">
          <div className="kv">
            {Object.entries(byCategory).map(([k, v]) => (
              <React.Fragment key={k}>
                <Text type="secondary">{k}</Text>
                <div style={{ fontWeight: 650 }}>{v}</div>
              </React.Fragment>
            ))}
          </div>
        </Card>
      </Space>
    </div>
  )
}
