import { Button, Card, Space, Table, Tag, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'
import { assetCategoryFilterOptions, assetCategoryTag, inferAssetCategory } from '../utils/assetCategory'

const { Title, Text } = Typography

export default function AssetListPage() {
  const assets = useAppStore((s) => s.assets)
  const globalSearch = useAppStore((s) => s.globalSearch)
  const openDrawer = useAppStore((s) => s.openDrawer)

  const filtered = React.useMemo(() => {
    const q = globalSearch.trim().toLowerCase()
    if (!q) return assets
    return assets.filter((a) => {
      const blob = [a.name, a.domain, a.system, a.owner, ...a.tags].join(' ').toLowerCase()
      return blob.includes(q)
    })
  }, [assets, globalSearch])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div className="flex-between">
          <div>
            <Title level={4} style={{ margin: 0 }}>
              数据资产列表
            </Title>
            <Text type="secondary">支持全局检索、资产大类筛选、点击查看详情。</Text>
          </div>
          <Space>
            <Button onClick={() => openDrawer('ASSET_DETAIL', { assetId: 'a_mdm_customer' })}>快速查看：客户主数据</Button>
          </Space>
        </div>

        <Card size="small">
          <Table
            size="small"
            rowKey="id"
            dataSource={filtered}
            onRow={(record) => ({ onClick: () => openDrawer('ASSET_DETAIL', { assetId: record.id }) })}
            columns={[
              { 
                title: '资产名', 
                render: (_: any, record: any) => record.displayName || record.name 
              },
              {
                title: '是否指标',
                key: 'isMetric',
                width: 100,
                render: (_: any, record: any) =>
                  record.type === 'METRIC' || record.metricValue || record.calculationMethod || record.calculationLogic ? (
                    <Tag color="blue">是</Tag>
                  ) : (
                    <Tag color="default">否</Tag>
                  ),
              },
              {
                title: '资产大类',
                key: 'assetCategory',
                width: 120,
                filters: assetCategoryFilterOptions,
                onFilter: (value, record: any) => (record.assetCategory ?? inferAssetCategory(record)) === value,
                render: (_: any, record: any) => assetCategoryTag(record.assetCategory ?? inferAssetCategory(record)),
              },
              { title: '域', dataIndex: 'domain', width: 120 },
              { title: '系统', dataIndex: 'system', width: 120 },
              { title: 'Owner', dataIndex: 'owner', width: 120 },
              {
                title: '标签',
                render: (_: any, r: any) => (
                  <Space size={4} wrap>
                    {r.tags.slice(0, 4).map((t: string) => (
                      <Tag key={t}>{t}</Tag>
                    ))}
                  </Space>
                ),
              },
              { title: '质量分', dataIndex: 'qualityScore', width: 90 },
            ]}
          />
        </Card>
      </Space>
    </div>
  )
}
