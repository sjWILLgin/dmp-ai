import { Card, Space, Tree, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../../store/useAppStore'
import ReactFlow, { MiniMap, Controls, Background, useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from 'reactflow'
import 'reactflow/dist/style.css'

const { Text } = Typography


const lineageMap: Record<string, { upstream: string[]; downstream: string[] }> = {
  a_ads_order: { upstream: ['a_ods_order', 'a_dim_calendar', 'a_mdm_customer'], downstream: ['a_metric_trade_cust'] },
  a_mdm_customer: { upstream: [], downstream: ['a_ads_order', 'a_api_customer'] },
  a_ods_order: { upstream: [], downstream: ['a_ads_order'] },
  a_dim_calendar: { upstream: [], downstream: ['a_ads_order', 'a_metric_trade_cust'] },
  a_metric_trade_cust: { upstream: ['a_ads_order'], downstream: [] },
  a_api_customer: { upstream: ['a_mdm_customer'], downstream: [] },
  // 新增血缘关系
  a_ads_bigtable_organization: { upstream: ['a_ods_order_header', 'a_ods_order_item', 'a_ods_customer'], downstream: ['metric_zw_benpin_panjiayeji', 'metric_panjiayeji_target_rate', 'metric_trading_customer_cnt_new', 'metric_avg_order_value', 'metric_new_customer_cnt', 'metric_old_customer_cnt'] },
  a_ods_order_header: { upstream: [], downstream: ['a_ads_bigtable_organization'] },
  a_ods_order_item: { upstream: [], downstream: ['a_ads_bigtable_organization'] },
  a_ods_customer: { upstream: [], downstream: ['a_ads_bigtable_organization'] },
  metric_zw_benpin_panjiayeji: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
  metric_panjiayeji_target_rate: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
  metric_trading_customer_cnt_new: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
  metric_avg_order_value: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
  metric_new_customer_cnt: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
  metric_old_customer_cnt: { upstream: ['a_ads_bigtable_organization'], downstream: [] },
}

export default function LineageGraph({ assetId }: { assetId: string }) {
  const assets = useAppStore((s) => s.assets)
  const openDrawer = useAppStore((s) => s.openDrawer)

  // flow state for interactive lineage
  const [nodes, setNodes, onNodesChange] = useNodesState<Node[]>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge[]>([])

  React.useEffect(() => {
    const data = lineageMap[assetId] ?? { upstream: [], downstream: [] }
    const centerAsset = assets.find((x) => x.id === assetId)
    const initialNodes: Node[] = []
    const initialEdges: Edge[] = []
    if (centerAsset) {
      initialNodes.push({
        id: centerAsset.id,
        position: { x: 400, y: 200 },
        data: { label: centerAsset.name, asset: centerAsset },
        style: { background: '#faad14', color: 'white' },
      })
    }
    data.upstream.forEach((id, idx) => {
      const a = assets.find((x) => x.id === id)
      if (a && centerAsset) {
        initialNodes.push({
          id: a.id,
          position: { x: 200 + idx * 150, y: 100 },
          data: { label: a.name, asset: a },
          style: { background: '#1890ff', color: 'white' },
        })
        initialEdges.push({
          id: `e${a.id}-${centerAsset.id}`,
          source: a.id,
          target: centerAsset.id,
        })
      }
    })
    data.downstream.forEach((id, idx) => {
      const a = assets.find((x) => x.id === id)
      if (a && centerAsset) {
        initialNodes.push({
          id: a.id,
          position: { x: 200 + idx * 150, y: 300 },
          data: { label: a.name, asset: a },
          style: { background: '#52c41a', color: 'white' },
        })
        initialEdges.push({
          id: `e${centerAsset.id}-${a.id}`,
          source: centerAsset.id,
          target: a.id,
        })
      }
    })
    setNodes(initialNodes)
    setEdges(initialEdges)
  }, [assetId, assets, setNodes, setEdges])

  const onConnect = React.useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges])
  const onNodeClick = React.useCallback((event: React.MouseEvent, node: Node) => {
    if (node.data.asset) {
      openDrawer('ASSET_DETAIL', { assetId: node.data.asset.id })
    }
  }, [openDrawer])

  const getTitle = (id: string) => {
    const a = assets.find((x) => x.id === id)
    return (
      <span style={{ cursor: 'pointer' }} onClick={() => openDrawer('ASSET_DETAIL', { assetId: id })}>
        {a ? a.name : id}
        <Text type="secondary" style={{ marginLeft: 8 }}>
          {a ? `${a.domain} / ${a.system}` : ''}
        </Text>
      </span>
    )
  }

  const data = lineageMap[assetId] ?? { upstream: [], downstream: [] }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card size="small" title="交互式血缘图谱">
        <div style={{ height: 300 }}>
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
          展示当前资产及其上下游血缘，点击节点可查看详情。
        </div>
      </Card>
      <Text type="secondary">
        说明：这里是雏形，用 ReactFlow 展示交互式血缘图。后续可替换为更完整的血缘组件。
      </Text>
    </Space>
  )
}
