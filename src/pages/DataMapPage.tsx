import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Col, Divider, Progress, Row, Space, Statistic, Table, Tag, Tabs, Typography, Button } from 'antd'
import { useAppStore } from '../store/useAppStore'
import { assetCategoryTag, inferAssetCategory, assetCategoryLabels } from '../utils/assetCategory'
import type { AssetCategory } from '../types/models'
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'

const { Title, Text } = Typography

type MetricMode = 'Q7' | 'Q30' | 'DOWNSTREAM' | 'APPLY'
type AssetAny = any

function hashToInt(s: string) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h)
}

function fmtGB(gb: number) {
  if (!Number.isFinite(gb)) return '-'
  if (gb >= 1024) return `${(gb / 1024).toFixed(2)} TB`
  return `${gb.toFixed(1)} GB`
}

function fmtInt(n: number) {
  if (!Number.isFinite(n)) return '-'
  return n.toLocaleString()
}

/** 基于资产ID/名称做一套“可重复”的假指标，方便联动演示 */
function buildFakeMetrics(a: AssetAny, applyCount: number) {
  const key = `${a?.id ?? ''}-${a?.name ?? ''}-${a?.system ?? ''}-${a?.domain ?? ''}`
  const h = hashToInt(key)

  // 存储占用（GB）：0.3 ~ 180
  const storageGB = 0.3 + (h % 1800) / 10

  // 近7天查询/调用：80 ~ 12,000
  const q7 = 80 + (h % 12000)

  // 近30天查询/调用：q7 放大 + 波动
  const q30 = q7 * 4 + (h % 2200)

  // 下游依赖数：1 ~ 25
  const downstream = 1 + (h % 25)

  // 最近访问：0~120天前
  const lastAccessDays = h % 121

  // 热度分（演示用）
  const heatScore = Math.round(q7 * 0.55 + downstream * 45 + applyCount * 120)

  return { storageGB, q7, q30, downstream, lastAccessDays, heatScore }
}

export default function DataMapPage() {
  const nav = useNavigate()

  const assets = useAppStore((s) => s.assets)
  const applications = useAppStore((s) => s.applications)
  const openDrawer = useAppStore((s) => s.openDrawer)

  const globalSearch = useAppStore((s) => s.globalSearch)
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch)

  const [mode, setMode] = React.useState<MetricMode>('Q7')

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  React.useEffect(() => {
    // Find ads_bigtable_organization and related assets for lineage (updated to include new metrics)
    const centerAsset = assets.find(a => a.name === 'ads_bigtable_organization')
    const upstreamAssets = assets.filter(a => ['ods_order_header', 'ods_order_item', 'ods_customer'].includes(a.name))
    const downstreamAssets = assets.filter(a => ['造旺本品盘价业绩（当时）', '盘价业绩目标达成率', '交易客户数', '客单价', '新客户数', '老客户数'].includes(a.name))

    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []

    // Center node
    if (centerAsset) {
      initialNodes.push({
        id: centerAsset.id,
        position: { x: 400, y: 200 },
        data: { label: centerAsset.name, asset: centerAsset },
        style: { background: '#faad14', color: 'white' },
      })
    }

    // Upstream nodes
    upstreamAssets.forEach((asset, index) => {
      initialNodes.push({
        id: asset.id,
        position: { x: 100 + index * 150, y: 100 },
        data: { label: asset.name, asset },
        style: { background: '#1890ff', color: 'white' },
      })
      if (centerAsset) {
        initialEdges.push({
          id: `e${asset.id}-${centerAsset.id}`,
          source: asset.id,
          target: centerAsset.id,
        })
      }
    })

    // Downstream nodes (metrics)
    downstreamAssets.forEach((asset, index) => {
      initialNodes.push({
        id: asset.id,
        position: { x: 200 + index * 120, y: 300 },
        data: { label: asset.name, asset },
        style: { background: '#52c41a', color: 'white' },
      })
      if (centerAsset) {
        initialEdges.push({
          id: `e${centerAsset.id}-${asset.id}`,
          source: centerAsset.id,
          target: asset.id,
        })
      }
    })

    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [assets, setNodes, setEdges])

  const onConnect = React.useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])

  const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.asset) {
      openDrawer('ASSET_DETAIL', { assetId: node.data.asset.id })
    }
  }, [openDrawer])

  /** 简单用全局检索过滤（影响地图&列表&治理等） */
  const filteredAssets = React.useMemo(() => {
    const kw = (globalSearch || '').trim().toLowerCase()
    if (!kw) return assets

    return (assets || []).filter((a: AssetAny) => {
      const blob = [
        a.name,
        a.domain,
        a.system,
        a.owner,
        a.description,
        ...(a.tags || []),
        a.type,
        a.sensitivity,
        a.status,
        a.updateFreq
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return blob.includes(kw)
    })
  }, [assets, globalSearch])

  /** 每个资产的申请次数（用于“申请榜”） */
  const applyCountMap = React.useMemo(() => {
    const m = new Map<string, number>()
    for (const ap of applications || []) {
      const id = String(ap.assetId)
      m.set(id, (m.get(id) || 0) + 1)
    }
    return m
  }, [applications])

  /** 给列表注入假指标（不改 store，不改数据结构） */
  const assetsWithMetrics = React.useMemo(() => {
    return (filteredAssets || []).map((a: AssetAny) => {
      const ac = applyCountMap.get(String(a.id)) || 0
      const metrics = buildFakeMetrics(a, ac)
      const cat: AssetCategory = a.assetCategory ?? inferAssetCategory(a)
      return { ...a, _cat: cat, _applyCount: ac, _m: metrics }
    })
  }, [filteredAssets, applyCountMap])

  /** KPI & 分布统计 */
  const overview = React.useMemo(() => {
    const total = assetsWithMetrics.length
    const tableCount = assetsWithMetrics.filter((a: AssetAny) => a.type === 'TABLE').length

    const storageGB = assetsWithMetrics.reduce((s: number, a: AssetAny) => s + a._m.storageGB, 0)
    const q30 = assetsWithMetrics.reduce((s: number, a: AssetAny) => s + a._m.q30, 0)

    const highFreqThreshold = total > 0 ? Math.max(2500, Math.floor(q30 / total / 1.2)) : 2500
    const highFreqCount = assetsWithMetrics.filter((a: AssetAny) => a._m.q30 >= highFreqThreshold).length

    const coldBig = assetsWithMetrics.filter(
      (a: AssetAny) => a._m.lastAccessDays >= 90 && a._m.storageGB >= 20
    ).length

    // domain 分布
    const domainMap = new Map<string, number>()
    for (const a of assetsWithMetrics) {
      const d = a.domain || '未分域'
      domainMap.set(d, (domainMap.get(d) || 0) + 1)
    }

    // category 分布
    const catMap = new Map<AssetCategory, number>()
    for (const a of assetsWithMetrics) {
      catMap.set(a._cat, (catMap.get(a._cat) || 0) + 1)
    }

    // 健康/风险（演示）
    const lowQuality = assetsWithMetrics.filter((a: AssetAny) => (a.qualityScore ?? 100) < 75).length
    const warnQuality = assetsWithMetrics.filter((a: AssetAny) => (a.qualityScore ?? 100) < 85).length
    const sensitiveHighFreq = assetsWithMetrics.filter((a: AssetAny) => {
      const s = String(a.sensitivity || '').toUpperCase()
      const isSensitive = s.includes('L3') || s.includes('HIGH') || s.includes('敏') || s.includes('P1')
      return isSensitive && a._m.q30 >= highFreqThreshold
    }).length

    return {
      total,
      tableCount,
      storageGB,
      q30,
      highFreqThreshold,
      highFreqCount,
      coldBig,
      domainMap,
      catMap,
      lowQuality,
      warnQuality,
      sensitiveHighFreq
    }
  }, [assetsWithMetrics])

  /** 热度榜/影响榜/申请榜 */
  const topHot = React.useMemo(() => {
    const list = [...assetsWithMetrics]
    list.sort((a: any, b: any) => {
      if (mode === 'Q7') return b._m.q7 - a._m.q7
      if (mode === 'Q30') return b._m.q30 - a._m.q30
      if (mode === 'DOWNSTREAM') return b._m.downstream - a._m.downstream
      return b._applyCount - a._applyCount
    })
    return list.slice(0, 10)
  }, [assetsWithMetrics, mode])

  /** 冷门/僵尸资产：低频 + 大占用 或 90天未访问 */
  const coldAssets = React.useMemo(() => {
    const list = [...assetsWithMetrics].filter((a: any) => a._m.lastAccessDays >= 60 || a._m.q30 < overview.highFreqThreshold)
    list.sort((a: any, b: any) => {
      // 优先：90天未访问，再按占用大
      const aScore = (a._m.lastAccessDays >= 90 ? 100000 : 0) + a._m.storageGB * 100 - a._m.q30 * 0.01
      const bScore = (b._m.lastAccessDays >= 90 ? 100000 : 0) + b._m.storageGB * 100 - b._m.q30 * 0.01
      return bScore - aScore
    })
    return list.slice(0, 10)
  }, [assetsWithMetrics, overview.highFreqThreshold])

  const hotColumns = [
    {
      title: '资产名',
      dataIndex: 'name',
      render: (_: any, r: any) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openDrawer('ASSET_DETAIL', { assetId: r.id })}>
          {r.name}
        </Button>
      )
    },
    { title: '大类', key: '_cat', width: 120, render: (_: any, r: any) => assetCategoryTag(r._cat) },
    { title: '域', dataIndex: 'domain', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '系统', dataIndex: 'system', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Owner', dataIndex: 'owner', width: 120 },
    {
      title:
        mode === 'Q7'
          ? '近7天调用'
          : mode === 'Q30'
          ? '近30天调用'
          : mode === 'DOWNSTREAM'
          ? '下游依赖数'
          : '申请次数',
      key: 'metric',
      width: 130,
      render: (_: any, r: any) => {
        if (mode === 'Q7') return fmtInt(r._m.q7)
        if (mode === 'Q30') return fmtInt(r._m.q30)
        if (mode === 'DOWNSTREAM') return fmtInt(r._m.downstream)
        return fmtInt(r._applyCount)
      }
    },
    { title: '占用', key: 'storage', width: 110, render: (_: any, r: any) => fmtGB(r._m.storageGB) }
  ]

  const coldColumns = [
    {
      title: '资产名',
      dataIndex: 'name',
      render: (_: any, r: any) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => openDrawer('ASSET_DETAIL', { assetId: r.id })}>
          {r.name}
        </Button>
      )
    },
    { title: '大类', key: '_cat', width: 120, render: (_: any, r: any) => assetCategoryTag(r._cat) },
    { title: '占用', key: 'storage', width: 110, render: (_: any, r: any) => fmtGB(r._m.storageGB) },
    { title: '近30天调用', key: 'q30', width: 120, render: (_: any, r: any) => fmtInt(r._m.q30) },
    { title: '最近访问', key: 'last', width: 120, render: (_: any, r: any) => `${r._m.lastAccessDays} 天前` },
    {
      title: '建议',
      key: 'action',
      width: 150,
      render: (_: any, r: any) => (
        <Space>
          <Tag color={r._m.lastAccessDays >= 90 ? 'red' : 'orange'}>
            {r._m.lastAccessDays >= 90 ? '建议下线评审' : '建议治理优化'}
          </Tag>
        </Space>
      )
    }
  ]

  const modeTabs = [
    { key: 'Q7', label: '热度榜（近7天）' },
    { key: 'Q30', label: '热度榜（近30天）' },
    { key: 'DOWNSTREAM', label: '影响榜（下游依赖）' },
    { key: 'APPLY', label: '申请榜（使用申请）' }
  ]

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            数据地图（增强版）
          </Title>
          <Text type="secondary">全局规模、热度/冷门资产、健康风险与快捷入口（支持与全局检索联动）</Text>
        </div>

        {/* KPI */}
        <Row gutter={12}>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="资产总数" value={overview.total} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="表资产数" value={overview.tableCount} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="总存储占用" value={fmtGB(overview.storageGB)} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="近30天调用" value={fmtInt(overview.q30)} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="高频资产数" value={overview.highFreqCount} />
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                阈值≈{fmtInt(overview.highFreqThreshold)}/30天
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card size="small">
              <Statistic title="低频大表" value={overview.coldBig} />
              <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>≥90天未访问 & ≥20GB</div>
            </Card>
          </Col>
        </Row>

        <Card size="small" title="数据地图拓扑图（Dashboard）- ads_order_kpi_daily 血缘">
          <div style={{ height: 400 }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              fitView
            >
              <MiniMap />
              <Controls />
              <Background />
            </ReactFlow>
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
            交互式拓扑图：点击节点查看资产详情。展示 ads_order_kpi_daily 的上游（ODS）和下游（MDM）血缘关系。
          </div>
        </Card>

        {/* 分布 + 健康 */}
        <Row gutter={12}>
          <Col xs={24} lg={14}>
            <Card size="small" title="分布概览（点击可跳转资产列表）">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>按域分布</div>
                  <Space wrap>
                    {Array.from(overview.domainMap.entries())
                      .sort((a, b) => b[1] - a[1])
                      .slice(0, 12)
                      .map(([d, c]) => (
                        <Tag
                          key={d}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setGlobalSearch(d)
                            nav('/assets')
                          }}
                        >
                          {d}：{c}
                        </Tag>
                      ))}
                  </Space>
                </div>

                <div>
                  <div style={{ fontWeight: 600, marginBottom: 6 }}>按资产大类分布</div>
                  <Space wrap>
                    {(Object.keys(assetCategoryLabels) as AssetCategory[])
                      .map((k) => [k, overview.catMap.get(k) || 0] as const)
                      .filter((x) => x[1] > 0)
                      .sort((a, b) => b[1] - a[1])
                      .map(([k, c]) => (
                        <Tag
                          key={k}
                          style={{ cursor: 'pointer' }}
                          onClick={() => {
                            setGlobalSearch(assetCategoryLabels[k].split(' ')[0]) // 如 RAW / 结果数据 / 主数据...
                            nav('/assets')
                          }}
                        >
                          {assetCategoryLabels[k]}：{c}
                        </Tag>
                      ))}
                  </Space>
                </div>
              </Space>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small" title="平台健康（演示）">
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <div>
                  <div className="small-muted">低质量资产（分数&lt;75）</div>
                  <Progress percent={overview.total ? Math.round((overview.lowQuality / overview.total) * 100) : 0} />
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    {overview.lowQuality} / {overview.total}
                  </div>
                </div>

                <div>
                  <div className="small-muted">质量预警资产（分数&lt;85）</div>
                  <Progress percent={overview.total ? Math.round((overview.warnQuality / overview.total) * 100) : 0} />
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    {overview.warnQuality} / {overview.total}
                  </div>
                </div>

                <div>
                  <div className="small-muted">敏感数据高频访问（演示）</div>
                  <Progress percent={overview.total ? Math.round((overview.sensitiveHighFreq / overview.total) * 100) : 0} />
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                    {overview.sensitiveHighFreq} / {overview.total}
                  </div>
                </div>

                <Divider style={{ margin: '8px 0' }} />

                <Space wrap>
                  <Button onClick={() => nav('/governance')}>去治理中心</Button>
                  <Button onClick={() => nav('/monitoring')}>去监控告警</Button>
                  <Button type="primary" onClick={() => nav('/assets')}>
                    去资产列表
                  </Button>
                </Space>
              </Space>
            </Card>
          </Col>
        </Row>

        {/* 热度榜/冷门榜 */}
        <Row gutter={12}>
          <Col xs={24} lg={14}>
            <Card
              size="small"
              title="热度/影响/申请排行"
              extra={
                <Tabs
                  activeKey={mode}
                  onChange={(k) => setMode(k as MetricMode)}
                  items={modeTabs.map((t) => ({ key: t.key, label: t.label }))}
                />
              }
            >
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={topHot}
                columns={hotColumns as any}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                点击资产名可打开详情抽屉；上述指标为“可重复的假数据”，后续可接入真实日志/元数据。
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={10}>
            <Card size="small" title="冷门/僵尸资产（低频 + 占用）">
              <Table size="small" rowKey="id" pagination={false} dataSource={coldAssets} columns={coldColumns as any} />
              <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                建议动作：下线评审 / 治理优化（后续可一键生成工单）。
              </div>
            </Card>
          </Col>
        </Row>

        {/* 快捷入口 */}
        <Card size="small" title="快捷入口">
          <Space wrap>
            <Button type="primary" onClick={() => nav('/assets')}>资产检索</Button>
            <Button onClick={() => nav('/mdm')}>主数据中心</Button>
            <Button onClick={() => nav('/governance')}>质量规则/治理</Button>
            <Button onClick={() => nav('/delivery')}>申请交付</Button>
            <Button onClick={() => nav('/tags')}>标签与画像</Button>
            <Button onClick={() => nav('/value')}>价值运营</Button>
            <Button onClick={() => nav('/monitoring')}>监控告警</Button>
            <Button
              onClick={() => {
                setGlobalSearch('')
              }}
            >
              清空全局检索
            </Button>
          </Space>
        </Card>
      </Space>
    </div>
  )
}
