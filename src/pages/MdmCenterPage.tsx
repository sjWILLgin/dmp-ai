import { Card, Col, Divider, List, Row, Space, Statistic, Table, Tag, Typography } from 'antd'
import React from 'react'
import { useMdmStore } from '../store/useMdmStore'

const { Title, Text, Paragraph } = Typography

const typeTag = (t: string) => {
  const map: Record<string, { label: string; color?: string }> = {
    golden: { label: 'Golden 主表', color: 'gold' },
    xref: { label: '映射表', color: 'blue' },
    source_std: { label: '标准化来源表', color: 'geekblue' },
    merge_log: { label: '合并日志', color: 'purple' },
    history: { label: '历史快照', color: 'default' },
    quality_daily: { label: '质量日报', color: 'volcano' },
    rel: { label: '关系表', color: 'cyan' },
  }
  const v = map[t] ?? { label: t }
  return <Tag color={v.color}>{v.label}</Tag>
}

export default function MdmCenterPage() {
  const entities = useMdmStore((s) => s.entities)
  const tables = useMdmStore((s) => s.tables)
  const sources = useMdmStore((s) => s.sources)
  const downstreams = useMdmStore((s) => s.downstreams)
  const selectedEntityId = useMdmStore((s) => s.selectedEntityId)
  const setSelectedEntityId = useMdmStore((s) => s.setSelectedEntityId)

  const entity = React.useMemo(() => entities.find((e) => e.id === selectedEntityId)!, [entities, selectedEntityId])
  const trows = React.useMemo(() => tables.filter((t) => t.entityId === selectedEntityId), [tables, selectedEntityId])
  const srows = React.useMemo(() => sources.filter((s) => s.entityId === selectedEntityId), [sources, selectedEntityId])
  const drows = React.useMemo(() => downstreams.filter((d) => d.entityId === selectedEntityId), [downstreams, selectedEntityId])

  return (
    <div style={{ padding: 16 }}>
      <Row gutter={12}>
        <Col xs={24} lg={6}>
          <Card size="small" title="主数据对象" styles={{ body: { padding: 8 } }}>
            <List
              dataSource={entities}
              renderItem={(it) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    borderRadius: 8,
                    padding: 10,
                    background: it.id === selectedEntityId ? 'rgba(22,119,255,0.08)' : 'transparent',
                  }}
                  onClick={() => setSelectedEntityId(it.id)}
                >
                  <List.Item.Meta
                    title={<span style={{ fontWeight: 650 }}>{it.name}</span>}
                    description={<Text type="secondary">Owner: {it.owner}</Text>}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={18}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div>
              <Title level={4} style={{ margin: 0 }}>
                主数据中心（模块三）
              </Title>
              <Text type="secondary">
                目标：看清主数据对象、上游来源、主表/映射表/日志表、以及下游影响范围（哪些表/报表/API 在用）。
              </Text>
            </div>

            <Card size="small" title={entity.name}>
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Statistic title="来源系统数" value={srows.length} />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="下游数量" value={drows.length} />
                </Col>
                <Col xs={24} md={8}>
                  <Statistic title="表数量" value={trows.length} />
                </Col>
              </Row>

              <Divider style={{ margin: '12px 0' }} />

              <Paragraph style={{ marginBottom: 6 }}>{entity.description}</Paragraph>
              <div className="kv" style={{ marginTop: 8 }}>
                <Text type="secondary">主键</Text>
                <div style={{ fontWeight: 650 }}>{entity.primaryKey}</div>
                <Text type="secondary">黄金主表</Text>
                <div style={{ fontWeight: 650 }}>{entity.goldenTable}</div>
                <Text type="secondary">更新频率</Text>
                <div style={{ fontWeight: 650 }}>{entity.updateFrequency}</div>
              </div>
            </Card>

            <Card size="small" title="血缘概览（雏形）">
              <Row gutter={12}>
                <Col xs={24} md={8}>
                  <Card size="small" title="上游来源" styles={{ body: { paddingTop: 8 } }}>
                    {srows.length ? (
                      <List
                        size="small"
                        dataSource={srows}
                        renderItem={(s) => (
                          <List.Item>
                            <Space direction="vertical" size={2}>
                              <div style={{ fontWeight: 650 }}>{s.systemName}</div>
                              <Text type="secondary">采集方式：{s.ingestion}</Text>
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Text type="secondary">暂无</Text>
                    )}
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card size="small" title="主数据产物" styles={{ body: { paddingTop: 8 } }}>
                    <Space direction="vertical" size={6} style={{ width: '100%' }}>
                      {trows
                        .filter((t) => t.type === 'golden' || t.type === 'xref' || t.type === 'merge_log')
                        .map((t) => (
                          <div key={t.id} className="flex-between">
                            <span style={{ fontWeight: 650 }}>{t.name}</span>
                            {typeTag(t.type)}
                          </div>
                        ))}
                    </Space>
                    <Divider style={{ margin: '12px 0' }} />
                    <Text type="secondary">提示：后续可增加“匹配规则/合并策略/冲突解决/版本管理/审批”模块。</Text>
                  </Card>
                </Col>

                <Col xs={24} md={8}>
                  <Card size="small" title="下游影响" styles={{ body: { paddingTop: 8 } }}>
                    {drows.length ? (
                      <List
                        size="small"
                        dataSource={drows}
                        renderItem={(d) => (
                          <List.Item>
                            <Space>
                              <Tag color={d.critical ? 'red' : 'default'}>{d.type}</Tag>
                              <span style={{ fontWeight: 650 }}>{d.name}</span>
                            </Space>
                          </List.Item>
                        )}
                      />
                    ) : (
                      <Text type="secondary">暂无</Text>
                    )}
                  </Card>
                </Col>
              </Row>
            </Card>

            <Row gutter={12}>
              <Col xs={24} lg={12}>
                <Card size="small" title="主数据表清单">
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={trows}
                    columns={[
                      { title: '表名', dataIndex: 'name' },
                      { title: '类型', dataIndex: 'type', width: 120, render: (v) => typeTag(v) },
                      { title: '粒度', dataIndex: 'grain' },
                      { title: '主键', dataIndex: 'pk', width: 160 },
                      { title: '行数', dataIndex: 'rowCount', width: 100 },
                    ]}
                  />
                </Card>
              </Col>

              <Col xs={24} lg={12}>
                <Card size="small" title="来源系统与表（上游）">
                  <Table
                    size="small"
                    rowKey="id"
                    pagination={false}
                    dataSource={srows}
                    columns={[
                      { title: '系统', dataIndex: 'systemName', width: 120 },
                      { title: '采集方式', dataIndex: 'ingestion', width: 120 },
                      {
                        title: '来源表',
                        render: (_, r) => (
                          <Space direction="vertical" size={4}>
                            {r.tables.map((t: any) => (
                              <div key={t.name}>
                                <Tag>{t.name}</Tag>
                                <Text type="secondary">key: {t.keyField}</Text>
                                <div className="small-muted">{t.note}</div>
                              </div>
                            ))}
                          </Space>
                        ),
                      },
                    ]}
                  />
                </Card>
              </Col>
            </Row>

            <Card size="small" title="下游依赖（影响分析）">
              <Table
                size="small"
                rowKey="id"
                pagination={false}
                dataSource={drows}
                columns={[
                  { title: '下游对象', dataIndex: 'name' },
                  { title: '类型', dataIndex: 'type', width: 120, render: (v) => <Tag>{v}</Tag> },
                  { title: 'Owner', dataIndex: 'owner', width: 140 },
                  { title: '近30日使用量', dataIndex: 'last30dUsage', width: 140 },
                  {
                    title: '关键性',
                    dataIndex: 'critical',
                    width: 100,
                    render: (v) => (v ? <Tag color="red">关键</Tag> : <Tag>一般</Tag>),
                  },
                  { title: '备注', dataIndex: 'note' },
                ]}
              />
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  )
}
