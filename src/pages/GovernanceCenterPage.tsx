import React, { useMemo, useState } from 'react'
import {
  Card,
  Space,
  Table,
  Tag,
  Typography,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Divider,
  List,
  Popconfirm,
  notification,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useAppStore } from '../store/useAppStore'
import { useOnboardingStore } from '../store/useOnboardingStore'
import type { Asset, GovernanceRule } from '../types/models'

const { Title, Text } = Typography

type RuleTarget = 'table' | 'field'

function genId(prefix = 'RULE') {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`
}

export default function GovernanceCenterPage() {
  const assets = useAppStore((s) => s.assets)
  const discovered = useOnboardingStore((s) => s.discovered)

  // pick tables source: prefer registered assets, fallback to discovered
  const tables: Asset[] = useMemo(() => assets.filter((a) => a.type === 'TABLE'), [assets])

  // governance rules persisted in app store
  const governanceRules = useAppStore((s) => s.governanceRules)
  const addRule = useAppStore((s) => s.addRule)
  const updateRule = useAppStore((s) => s.updateRule)
  const removeRuleStore = useAppStore((s) => s.removeRule)
  const toggleRuleEnabled = useAppStore((s) => s.toggleRuleEnabled)

  const [selectedTable, setSelectedTable] = useState<string | null>(tables[0]?.name ?? null)
  const [editing, setEditing] = useState<GovernanceRule | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [form] = Form.useForm()

  const tableList = tables.map((t) => ({ key: t.name, title: t.name, owner: t.owner, tags: t.tags, fields: t.fields }))

  const tableRules = useMemo(() => governanceRules.filter((r) => r.tableName === selectedTable), [governanceRules, selectedTable])

  function openCreate(target: RuleTarget, field?: string) {
    const base: GovernanceRule = {
      id: genId(),
      target,
      tableName: selectedTable || tableList[0]?.title || 'unknown',
      field,
      ruleType: target === 'table' ? 'ROW_COUNT_GT' : 'NOT_NULL',
      config: {},
      level: 'P2',
      owner: '数据治理组',
      enabled: true,
    }
    setEditing(base)
    form.setFieldsValue(base as any)
    setModalOpen(true)
  }

  function saveRule(values: any) {
    if (!editing) return
    const merged: GovernanceRule = { ...editing, ...values }
    // if exists -> update, else add (drop id)
    const exists = governanceRules.some((r) => r.id === merged.id)
    if (exists) updateRule(merged.id, merged)
    else {
      const { id: _drop, ...withoutId } = merged as any
      addRule(withoutId)
    }
    setModalOpen(false)
    notification.success({ message: '规则已保存' })
  }

  function removeRule(id: string) {
    removeRuleStore(id)
    notification.info({ message: '已删除规则' })
  }

  function toggleEnable(id: string) {
    toggleRuleEnabled(id)
  }

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            数据治理中心
          </Title>
          <Text type="secondary">示例：对表/字段配置治理规则（演示数据，未持久化）。</Text>
        </div>

        <Row gutter={12}>
          <Col span={10}>
            <Card size="small" title="资产表（示例）" extra={<Button size="small" onClick={() => setSelectedTable(tableList[0]?.title ?? null)}>选中第一个</Button>}>
              <Table
                size="small"
                rowKey="key"
                pagination={{ pageSize: 6 }}
                dataSource={tableList}
                columns={[
                  { title: '表名', dataIndex: 'title' },
                  { title: '责任人', dataIndex: 'owner', width: 100 },
                  {
                    title: '标签',
                    dataIndex: 'tags',
                    render: (v: string[]) => (
                      <Space>
                        {v?.slice(0, 3).map((t) => (
                          <Tag key={t}>{t}</Tag>
                        ))}
                      </Space>
                    ),
                  },
                  {
                    title: '操作',
                    width: 120,
                    render: (_: any, row: any) => (
                      <Space>
                        <Button size="small" onClick={() => setSelectedTable(row.title)}>
                          选择
                        </Button>
                        <Button size="small" onClick={() => openCreate('table')}>
                          新增表规则
                        </Button>
                      </Space>
                    ),
                  },
                ]}
              />
            </Card>
          </Col>

          <Col span={14}>
            <Card
              size="small"
              title={selectedTable ? `治理规则 - ${selectedTable}` : '治理规则'}
              extra={
                <Space>
                  <Button icon={<PlusOutlined />} type="primary" size="small" onClick={() => openCreate('table')}>
                    新增表规则
                  </Button>
                </Space>
              }
            >
              {!selectedTable ? (
                <Text type="secondary">请在左侧选择一个表进行规则管理。</Text>
              ) : (
                <>
                  <Table
                    size="small"
                    dataSource={tableRules}
                    rowKey="id"
                    pagination={false}
                    columns={[
                      { title: '目标', dataIndex: 'target', width: 80, render: (v) => (v === 'table' ? '表级' : '字段') },
                      { title: '字段', dataIndex: 'field', width: 150 },
                      { title: '规则类型', dataIndex: 'ruleType' },
                      { title: '级别', dataIndex: 'level', width: 80, render: (v) => <Tag>{v}</Tag> },
                      { title: '责任人', dataIndex: 'owner', width: 120 },
                      {
                        title: '启用',
                        dataIndex: 'enabled',
                        width: 80,
                        render: (_: any, rec: GovernanceRule) => (
                          <Switch checked={rec.enabled} size="small" onChange={() => toggleEnable(rec.id)} />
                        ),
                      },
                      {
                        title: '操作',
                        width: 140,
                        render: (_: any, rec: GovernanceRule) => (
                          <Space>
                            <Button size="small" icon={<EditOutlined />} onClick={() => { setEditing(rec); setModalOpen(true) }} />
                            <Popconfirm title="确认删除?" onConfirm={() => removeRule(rec.id)}>
                              <Button size="small" danger icon={<DeleteOutlined />} />
                            </Popconfirm>
                          </Space>
                        ),
                      },
                    ]}
                  />

                  <Divider />

                  <div>
                    <Text strong>字段清单</Text>
                    <List
                      size="small"
                      bordered
                      dataSource={
                        // prefer registered asset fields
              (assets.find((a) => a.name === selectedTable)?.fields ?? []) as any
                      }
                      renderItem={(f: any) => (
                        <List.Item actions={[<Button size="small" onClick={() => openCreate('field', f.name)}>为字段新增规则</Button>]}> 
                          <div style={{ width: '100%' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <div>
                                <Text>{f.name}</Text>
                                <div style={{ marginTop: 4 }}>
                                  <Text type="secondary" style={{ fontSize: 12 }}>{f.type ?? f.comment ?? ''}</Text>
                                </div>
                              </div>
                            </div>
                          </div>
                        </List.Item>
                      )}
                    />
                  </div>
                </>
              )}
            </Card>
          </Col>
        </Row>

        <Modal
          title={editing ? (editing.id ? '编辑规则' : '新增规则') : '新增规则'}
          open={modalOpen}
          onCancel={() => setModalOpen(false)}
          onOk={() => {
            form.submit()
          }}
        >
          {editing && (
            <Form form={form} layout="vertical" initialValues={editing as any} onFinish={(vals) => saveRule(vals)}>
              <Form.Item label="目标表" name="tableName">
                <Input />
              </Form.Item>
              <Form.Item label="目标类型" name="target">
                <Select>
                  <Select.Option value="table">表级</Select.Option>
                  <Select.Option value="field">字段</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="字段（字段规则时填写）" name="field">
                <Input />
              </Form.Item>
              <Form.Item label="规则类型" name="ruleType">
                <Select>
                  <Select.Option value="NOT_NULL">非空</Select.Option>
                  <Select.Option value="UNIQUE">唯一</Select.Option>
                  <Select.Option value="RANGE_MIN">最小值</Select.Option>
                  <Select.Option value="REGEX">正则匹配</Select.Option>
                  <Select.Option value="ROW_COUNT_GT">行数 {'>'} N</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="级别" name="level">
                <Select>
                  <Select.Option value="P0">P0</Select.Option>
                  <Select.Option value="P1">P1</Select.Option>
                  <Select.Option value="P2">P2</Select.Option>
                  <Select.Option value="P3">P3</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item label="责任人" name="owner">
                <Input />
              </Form.Item>
              <Form.Item label="启用" name="enabled" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Form>
          )}
        </Modal>
      </Space>
    </div>
  )
}
