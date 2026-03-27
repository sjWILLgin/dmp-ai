import React, { useMemo, useState } from 'react'
import { Card, Table, Tag, Space, Popover, Statistic, Row, Col, Button, Modal, List, Typography, Progress, Divider } from 'antd'
import { useAppStore } from '../store/useAppStore'
import type { Asset, Report as ReportType, GovernanceRule } from '../types/models'

const { Text, Title } = Typography

type Report = {
  id: string
  name: string
  description?: string
  tables: string[] // referenced result table names
  dailyViews: number
  queriesPerDay: number
}

function computeHealth(tables: string[], assets: Asset[]) {
  if (!tables.length) return { score: 0, tag: '未知' }
  const matched = tables.map((n) => assets.find((a) => a.name === n)).filter(Boolean) as Asset[]
  if (!matched.length) return { score: 0, tag: '未知' }
  const avg = Math.round(matched.reduce((s, a) => s + (a.qualityScore ?? 50), 0) / matched.length)
  const tag = avg >= 90 ? '优' : avg >= 75 ? '良' : avg >= 60 ? '中' : '差'
  return { score: avg, tag }
}

function aggregateFrequency(tables: string[], assets: Asset[]) {
  const freqOrder: Record<string, number> = { REALTIME: 4, DAILY: 3, WEEKLY: 2, ADHOC: 1 }
  const matched = tables.map((n) => assets.find((a) => a.name === n)).filter(Boolean) as Asset[]
  if (!matched.length) return '未知'
  const best = matched.sort((a, b) => (freqOrder[b.updateFreq] || 0) - (freqOrder[a.updateFreq] || 0))[0]
  return best.updateFreq
}

export default function ReportOverviewPage() {
  const assets = useAppStore((s) => s.assets)

  // use reports from store (demo seed in useAppStore)
  const reports = useAppStore((s) => s.reports)
  const governanceRules = useAppStore((s) => s.governanceRules)

  const [detail, setDetail] = useState<Report | null>(null)

  const data = reports.map((r) => {
    const health = computeHealth(r.tables, assets)
    const freq = aggregateFrequency(r.tables, assets)
    // rule summary for referenced tables
    const relatedRules = governanceRules.filter((g) => r.tables.includes(g.tableName))
    const disabledRules = relatedRules.filter((g) => !g.enabled).length
    const missingRulesTables = r.tables.filter((t) => !relatedRules.some((g) => g.tableName === t)).length
    return { ...r, health, freq, ruleSummary: { total: relatedRules.length, disabled: disabledRules, missingTables: missingRulesTables }, relatedRules }
  })

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            报表概览
          </Title>
          <Text type="secondary">展示报表所引用的结果表数量、健康度、使用情况与更新频率（示例演示）。</Text>
        </div>

        <Card size="small">
          <Table
            size="small"
            rowKey="id"
            dataSource={data}
            pagination={{ pageSize: 6 }}
            columns={[
              {
                title: '报表',
                dataIndex: 'name',
                render: (_: any, rec: any) => (
                  <Button type="link" onClick={() => setDetail(rec)}>{rec.name}</Button>
                ),
              },
              {
                title: '引用结果表数',
                dataIndex: 'tables',
                width: 160,
                render: (tables: string[]) => (
                  <Popover content={<List size="small" dataSource={tables} renderItem={(t) => <List.Item>{t}</List.Item>} />}>
                    <Tag>{tables.length}</Tag>
                  </Popover>
                ),
              },
              {
                title: '健康度',
                dataIndex: 'health',
                width: 220,
                render: (h: any) => (
                  <Space>
                    <Progress percent={h.score} size="small" strokeWidth={8} style={{ width: 120 }} />
                    <Tag>{h.tag}</Tag>
                  </Space>
                ),
              },
              {
                title: '使用情况',
                dataIndex: 'dailyViews',
                width: 200,
                render: (_: any, rec: any) => (
                  <Row>
                    <Col span={12}>
                      <Statistic title="日活" value={rec.dailyViews} />
                    </Col>
                    <Col span={12}>
                      <Statistic title="查询/日" value={rec.queriesPerDay} />
                    </Col>
                  </Row>
                ),
              },
              { title: '更新频率', dataIndex: 'freq', width: 120, render: (f) => <Tag>{f}</Tag> },
            ]}
          />
        </Card>

        <Modal open={!!detail} onCancel={() => setDetail(null)} footer={null} width={800} title={detail?.name}>
          {detail && (
            <div>
              <Text type="secondary">{detail.description}</Text>
              <Divider />
              <Title level={5}>引用的结果表</Title>
              <List
                dataSource={detail.tables}
                renderItem={(t) => {
                  const a = assets.find((x) => x.name === t)
                  const rulesForTable = governanceRules.filter((g) => g.tableName === t)
                  return (
                    <List.Item>
                      <List.Item.Meta
                        title={t}
                        description={a ? `${a.system} · owner: ${a.owner} · 质量分: ${a.qualityScore}` : '未注册结果表'}
                      />
                      <div style={{ minWidth: 260 }}>
                        <div style={{ marginBottom: 6 }}>
                          <Text type="secondary">规则数: </Text>
                          <Tag>{rulesForTable.length}</Tag>
                        </div>
                        <div>
                          <Text type="secondary">未启用规则: </Text>
                          <Tag color={rulesForTable.some((r) => !r.enabled) ? 'orange' : 'green'}>
                            {rulesForTable.filter((r) => !r.enabled).length}
                          </Tag>
                        </div>
                      </div>
                    </List.Item>
                  )
                }}
              />

              <Divider />
              <Title level={5}>规则摘要</Title>
              <div style={{ marginBottom: 12 }}>
                <Text>匹配到规则总数：{(detail as any).relatedRules?.length ?? 0}，未启用：{(detail as any).ruleSummary?.disabled ?? 0}，缺少规则的表：{(detail as any).ruleSummary?.missingTables ?? 0}</Text>
              </div>
              <List
                header={<Text strong>影响到的规则</Text>}
                dataSource={(detail as any).relatedRules ?? []}
                renderItem={(r: GovernanceRule) => (
                  <List.Item>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{r.ruleType} {r.target === 'field' ? `(${r.field})` : ''}</div>
                        <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.6)' }}>{r.tableName} · {r.owner} · {r.level}</div>
                      </div>
                      <div>
                        <Tag color={r.enabled ? 'green' : 'orange'}>{r.enabled ? '启用' : '未启用'}</Tag>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Modal>
      </Space>
    </div>
  )
}
