import { HeartFilled, HeartOutlined, ShareAltOutlined, SolutionOutlined } from '@ant-design/icons'
import { Button, Descriptions, Divider, Progress, Space, Table, Tabs, Tag, Typography } from 'antd'
import React from 'react'
import type { Asset } from '../../types/models'
import { useAppStore } from '../../store/useAppStore'
import LineageGraph from './LineageGraph'
import { assetCategoryTag } from '../../utils/assetCategory'

const { Paragraph, Text } = Typography

const typeTag = (t: Asset['type']) => {
  const m: Record<Asset['type'], string> = { TABLE: '表', METRIC: '指标', API: 'API', FILE: '文件' }
  return <Tag>{m[t]}</Tag>
}

export default function AssetDetail({ assetId }: { assetId?: string }) {
  const assets = useAppStore((s) => s.assets)
  const favorites = useAppStore((s) => s.favorites)
  const toggleFavorite = useAppStore((s) => s.toggleFavorite)
  const openDrawer = useAppStore((s) => s.openDrawer)
  const applications = useAppStore((s) => s.applications)

  const asset = React.useMemo(() => assets.find((a) => a.id === assetId), [assets, assetId])

  if (!asset) {
    return <Text type="secondary">请选择一个资产查看详情（可从“数据地图/资产列表”点击进入）。</Text>
  }

  const isFav = favorites.has(asset.id)
  const usage = applications.filter((x) => x.assetId === asset.id)

  return (
    <div>
      <div className="flex-between" style={{ marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 650 }}>{asset.name}</div>
          <div className="small-muted">
            {asset.domain} · {asset.system} · Owner: {asset.owner}
          </div>
        </div>

        <Space>
          <Button icon={isFav ? <HeartFilled /> : <HeartOutlined />} onClick={() => toggleFavorite(asset.id)}>
            {isFav ? '已收藏' : '收藏'}
          </Button>
          <Button type="primary" icon={<SolutionOutlined />} onClick={() => openDrawer('APPLY_ACCESS', { assetId: asset.id })}>
            申请使用
          </Button>
          <Button icon={<ShareAltOutlined />} onClick={() => openDrawer('SHARE_ASSET', { assetId: asset.id })}>
            分享
          </Button>
        </Space>
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <Tabs
        items={[
          {
            key: 'base',
            label: '基础信息',
            children: (
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="资产类型">{typeTag(asset.type)}</Descriptions.Item>
                <Descriptions.Item label="资产大类">{assetCategoryTag(asset)}</Descriptions.Item>

                <Descriptions.Item label="敏感级别">
                  <Tag>{asset.sensitivity}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag>{asset.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="更新频率">
                  <Tag>{asset.updateFreq}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="质量分">{asset.qualityScore}</Descriptions.Item>
                <Descriptions.Item label="标签">{asset.tags.map((t) => <Tag key={t}>{t}</Tag>)}</Descriptions.Item>
                <Descriptions.Item label="创建时间">{new Date(asset.createdAt).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{new Date(asset.updatedAt).toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>
                  <Paragraph style={{ margin: 0 }}>{asset.description}</Paragraph>
                </Descriptions.Item>
              </Descriptions>
            ),
          },
          {
            key: 'data',
            label: '数据详情',
            children: (
              <Table
                size="small"
                rowKey="name"
                pagination={false}
                dataSource={asset.fields}
                columns={[
                  { title: '字段名', dataIndex: 'name' },
                  { title: '类型', dataIndex: 'type', width: 140 },
                  { title: '说明', dataIndex: 'comment' },
                ]}
              />
            ),
          },
          {
            key: 'quality',
            label: '质量报告',
            children: (
              <div>
                <Space size={12} wrap>
                  <div>
                    <div className="small-muted">综合质量分</div>
                    <Progress type="circle" percent={asset.qualityScore} width={80} />
                  </div>
                  <div style={{ minWidth: 220 }}>
                    <div className="small-muted">规则覆盖率（示例）</div>
                    <Progress percent={Math.min(98, asset.qualityScore + 3)} />
                  </div>
                  <div>
                    <div className="small-muted">近7日异常次数（示例）</div>
                    <div style={{ fontSize: 18, fontWeight: 650 }}>{Math.max(0, 10 - Math.floor(asset.qualityScore / 10))}</div>
                  </div>
                </Space>

                <Divider />

                <Table
                  size="small"
                  rowKey="rule"
                  pagination={false}
                  dataSource={[
                    { rule: '唯一性: 主键不重复', status: asset.qualityScore > 85 ? 'PASS' : 'WARN', owner: asset.owner },
                    { rule: '完整性: 必填字段非空', status: asset.qualityScore > 80 ? 'PASS' : 'WARN', owner: asset.owner },
                    { rule: '范围: 金额>=0', status: asset.qualityScore > 75 ? 'PASS' : 'FAIL', owner: '陈敏' },
                  ]}
                  columns={[
                    { title: '规则', dataIndex: 'rule' },
                    {
                      title: '状态',
                      dataIndex: 'status',
                      width: 120,
                      render: (v) => <Tag color={v === 'PASS' ? 'green' : v === 'WARN' ? 'orange' : 'red'}>{v}</Tag>,
                    },
                    { title: '责任人', dataIndex: 'owner', width: 120 },
                  ]}
                />
              </div>
            ),
          },
          {
            key: 'lineage',
            label: '血缘图谱',
            children: <LineageGraph assetId={asset.id} />,
          },
          {
            key: 'usage',
            label: '使用记录',
            children: (
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={usage}
                columns={[
                  { title: '申请单', dataIndex: 'id', width: 150 },
                  { title: '申请人', dataIndex: 'applicant', width: 120 },
                  { title: '权限', dataIndex: 'permission', width: 120 },
                  { title: '用途', dataIndex: 'useCase' },
                  {
                    title: '状态',
                    dataIndex: 'status',
                    width: 120,
                    render: (v) => <Tag color={v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'blue'}>{v}</Tag>,
                  },
                ]}
              />
            ),
          },
          {
            key: 'metric',
            label: '指标详情',
            children: (asset.type === 'METRIC' || asset.metricValue || asset.calculationMethod || asset.calculationLogic) ? (
              <div>
                {asset.type === 'METRIC' ? (
                  <Text strong>指标资产</Text>
                ) : (
                  <Text type="secondary">当前资产非指标类型，已展示附加指标信息（示例数据）</Text>
                )}
                <Descriptions size="small" column={1} bordered style={{ marginTop: 8 }}>
                  <Descriptions.Item label="指标价值">
                    <Paragraph style={{ margin: 0 }}>{asset.metricValue || '暂无描述'}</Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label="计算口径">
                    <Paragraph style={{ margin: 0 }}>{asset.calculationMethod || '暂无描述'}</Paragraph>
                  </Descriptions.Item>
                  <Descriptions.Item label="计算逻辑">
                    <Paragraph style={{ margin: 0, fontFamily: 'monospace', backgroundColor: '#f6f8fa', padding: 8, borderRadius: 4 }}>
                      {asset.calculationLogic || '暂无描述'}
                    </Paragraph>
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : (
              <Text type="secondary">此资产不是指标类型</Text>
            ),
          },
        ]}
      />
    </div>
  )
}
