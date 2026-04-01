import { Card, Typography, Space, Table, Button, Tag, Select, DatePicker, Tooltip, Drawer, Descriptions, Modal } from 'antd'
import React from 'react'

const { Title, Text } = Typography
import { seedMetrics } from '../mock/seedMetrics'

type Metric = (typeof seedMetrics)[number]

type MetricDetail = {
  sourceDb: string
  sourceTable: string
  atomicMetric: string
  businessConstraint: string
  businessCycle: string
}

const detailByMetricId: Record<string, MetricDetail> = {
  metric_2: {
    sourceDb: 'dwd',
    sourceTable: 'dwd_warehouse_shipping_cost_daily',
    atomicMetric: '仓库运费、财务收入（去税）',
    businessConstraint: '剔除调拨订单；仅统计有效发货订单',
    businessCycle: '月度（同月度逻辑）'
  },
  metric_3: {
    sourceDb: 'dwd',
    sourceTable: 'dwd_order_finance_daily',
    atomicMetric: '标准盘价、销售箱数、税率',
    businessConstraint: '去除调拨订单',
    businessCycle: '月度'
  },
  metric_30: {
    sourceDb: 'ads',
    sourceTable: 'ads_bigtable_organization',
    atomicMetric: '盘价业绩、退货盘价业绩',
    businessConstraint: '造旺本品；现金业绩+旺金币业绩',
    businessCycle: '实时（每半小时）'
  },
  metric_32: {
    sourceDb: 'ads',
    sourceTable: 'ads_bigtable_organization',
    atomicMetric: '盘价业绩、盘价业绩目标',
    businessConstraint: '不包含旺旺经典品项',
    businessCycle: '实时（每半小时）'
  }
}

function hashToInt(input: string) {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildTrend(metric: Metric) {
  const seed = hashToInt(metric.id)
  const base = Number(metric.value) || 0
  const labels = ['T-6', 'T-5', 'T-4', 'T-3', 'T-2', 'T-1', 'T']
  return labels.map((label, idx) => {
    const ratio = 0.86 + ((seed + idx * 13) % 24) / 100
    const value = Number((base * ratio).toFixed(2))
    return { label, value }
  })
}

function enrichMetric(metric: Metric) {
  const defaults: MetricDetail = {
    sourceDb: metric.domain === '营运管理' ? 'ads' : 'dwd',
    sourceTable: metric.domain === '营运管理' ? 'ads_bigtable_organization' : 'dwd_metric_source',
    atomicMetric: metric.calc,
    businessConstraint: metric.desc,
    businessCycle: '月度'
  }

  const detail = detailByMetricId[metric.id] ? { ...defaults, ...detailByMetricId[metric.id] } : defaults
  return { ...metric, detail, trend: buildTrend(metric) }
}

export default function MetricsPage() {
  // 实际可从 store 获取指标数据
  const [metrics] = React.useState(seedMetrics)
  const [selectedCategory, setSelectedCategory] = React.useState<string | undefined>()
  const [dateRange, setDateRange] = React.useState<any>()
  const [detailMetric, setDetailMetric] = React.useState<ReturnType<typeof enrichMetric> | null>(null)
  const [trendMetric, setTrendMetric] = React.useState<ReturnType<typeof enrichMetric> | null>(null)

  const enhancedMetrics = React.useMemo(() => metrics.map(enrichMetric), [metrics])

  const filtered = React.useMemo(() => {
    if (!selectedCategory) return enhancedMetrics
    return enhancedMetrics.filter((metric) => metric.category === selectedCategory)
  }, [enhancedMetrics, selectedCategory])

  const activeTrend = trendMetric?.trend ?? []
  const maxTrendValue = activeTrend.length ? Math.max(...activeTrend.map((item) => item.value), 1) : 1

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div className="flex-between">
          <div>
            <Title level={4} style={{ margin: 0 }}>指标总览</Title>
            <Text type="secondary">为业务和老板提供核心指标趋势、预警、说明等信息。</Text>
          </div>
          <Space>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: 120 }}
              onChange={setSelectedCategory}
              options={Array.from(new Set(enhancedMetrics.map((metric) => metric.category))).map((category) => ({ label: category, value: category }))}
            />
            <DatePicker.RangePicker onChange={setDateRange} />
            <Button type="primary">导出数据</Button>
          </Space>
        </div>
        <Card size="small">
          <Table
            size="small"
            rowKey="id"
            dataSource={filtered}
            onRow={(record) => ({
              onClick: () => setDetailMetric(record)
            })}
            columns={[
              { title: '指标名', dataIndex: 'name', render: (value: string, record: ReturnType<typeof enrichMetric>) => <Tooltip title={record.desc}>{value}</Tooltip> },
              { title: '当前值', dataIndex: 'value', render: (value: number, record: ReturnType<typeof enrichMetric>) => <span>{value} {record.unit}</span> },
              { title: '分类', dataIndex: 'category' },
              { title: '标签', dataIndex: 'tags', render: (tags: string[]) => tags.map((tag) => <Tag key={tag}>{tag}</Tag>) },
              { title: '更新时间', dataIndex: 'updatedAt' },
              { title: '预警', dataIndex: 'warning', render: (warning: boolean) => warning ? <Tag color="red">异常</Tag> : <Tag color="green">正常</Tag> },
              {
                title: '操作',
                render: (_: unknown, record: ReturnType<typeof enrichMetric>) => (
                  <Button
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation()
                      setTrendMetric(record)
                    }}
                  >
                    趋势分析
                  </Button>
                )
              }
            ]}
          />
        </Card>
      </Space>

      <Drawer
        open={Boolean(detailMetric)}
        title={detailMetric ? `指标详情：${detailMetric.name}` : '指标详情'}
        width={760}
        onClose={() => setDetailMetric(null)}
        destroyOnClose
      >
        {detailMetric && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="业务域">{detailMetric.domain}</Descriptions.Item>
              <Descriptions.Item label="指标分类">{detailMetric.category}</Descriptions.Item>
              <Descriptions.Item label="指标等级">{detailMetric.level}</Descriptions.Item>
              <Descriptions.Item label="指标类型">{detailMetric.type}</Descriptions.Item>
              <Descriptions.Item label="状态">{detailMetric.status}</Descriptions.Item>
              <Descriptions.Item label="计量单位">{detailMetric.unit}</Descriptions.Item>
              <Descriptions.Item label="来源库">{detailMetric.detail.sourceDb}</Descriptions.Item>
              <Descriptions.Item label="来源表">{detailMetric.detail.sourceTable}</Descriptions.Item>
              <Descriptions.Item label="原子指标" span={2}>{detailMetric.detail.atomicMetric}</Descriptions.Item>
              <Descriptions.Item label="业务限定" span={2}>{detailMetric.detail.businessConstraint}</Descriptions.Item>
              <Descriptions.Item label="业务周期">{detailMetric.detail.businessCycle}</Descriptions.Item>
              <Descriptions.Item label="更新时间">{detailMetric.updatedAt}</Descriptions.Item>
              <Descriptions.Item label="计算逻辑" span={2}>{detailMetric.calc}</Descriptions.Item>
              <Descriptions.Item label="指标口径" span={2}>{detailMetric.desc}</Descriptions.Item>
            </Descriptions>

            <Space>
              {detailMetric.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </Space>

            <Button onClick={() => setTrendMetric(detailMetric)}>查看趋势分析</Button>
          </Space>
        )}
      </Drawer>

      <Modal
        open={Boolean(trendMetric)}
        title={trendMetric ? `${trendMetric.name} - 趋势分析` : '趋势分析'}
        width={780}
        onCancel={() => setTrendMetric(null)}
        onOk={() => setTrendMetric(null)}
        okText="关闭"
        cancelButtonProps={{ style: { display: 'none' } }}
      >
        {trendMetric && (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text type="secondary">展示近7个周期的指标变化（演示数据，基于当前值生成）。</Text>

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', height: 180, padding: '12px 8px', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8 }}>
              {activeTrend.map((point) => (
                <div key={point.label} style={{ flex: 1, textAlign: 'center' }}>
                  <div
                    style={{
                      width: '100%',
                      height: `${Math.max((point.value / maxTrendValue) * 130, 6)}px`,
                      background: '#1677ff',
                      borderRadius: 6,
                      transition: 'height .2s ease'
                    }}
                  />
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.65)', marginTop: 6 }}>{point.label}</div>
                </div>
              ))}
            </div>

            <Table
              size="small"
              rowKey="label"
              pagination={false}
              dataSource={activeTrend}
              columns={[
                { title: '周期', dataIndex: 'label' },
                { title: '指标值', dataIndex: 'value', render: (value: number) => `${value} ${trendMetric.unit}` }
              ]}
            />
          </Space>
        )}
      </Modal>
    </div>
  )
}
