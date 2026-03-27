import React from 'react'
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  message,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tabs,
  Typography,
  Upload,
  Segmented
} from 'antd'
import { InboxOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { useOnboardingStore, type DataSource, type DiscoveredTable } from '../store/useOnboardingStore'
import { useAppStore } from '../store/useAppStore'
import { assetCategoryTag } from '../utils/assetCategory'
import type { AssetCategory } from '../types/models'
import { inferLayerByName, layerOptions, layerTag, type AssetLayer } from '../utils/assetLayer'
import { parseExcelFile, type ParsedExcel } from '../utils/excelParser'

const { Title, Text } = Typography

type AnyAsset = any

function nowISO() {
  return new Date().toISOString()
}

function makeFieldsForTable(name: string) {
  // 简单造一些字段，够演示即可
  const base = [
    { name: 'id', type: 'string', comment: '主键/业务ID' },
    { name: 'biz_date', type: 'string', comment: '业务日期' },
    { name: 'created_at', type: 'datetime', comment: '创建时间' },
    { name: 'updated_at', type: 'datetime', comment: '更新时间' },
    { name: 'amount', type: 'double', comment: '金额/数值' },
    { name: 'remark', type: 'string', comment: '备注' }
  ]
  // mdm/dim 稍微变一下
  if (name.startsWith('mdm_')) base.unshift({ name: 'mdm_id', type: 'string', comment: '统一主数据ID' })
  if (name.startsWith('dim_')) base.unshift({ name: 'dim_key', type: 'string', comment: '维度键' })
  return base
}

function appendAssetsToAppStore(newAssets: AnyAsset[]) {
  // 用 zustand 的 setState 直接追加（不依赖你现有 store 是否写了 addAssets action）
  const storeAny: any = useAppStore as any
  if (typeof storeAny.setState === 'function') {
    storeAny.setState((s: any) => ({ assets: [...(s.assets || []), ...newAssets] }))
    return true
  }
  return false
}

export default function SourceRegistryPage() {
  const [msgApi, ctx] = message.useMessage()

  const sources = useOnboardingStore((s) => s.sources)
  const discovered = useOnboardingStore((s) => s.discovered)
  const files = useOnboardingStore((s) => s.files)
  const selectedSourceId = useOnboardingStore((s) => s.selectedSourceId)

  const setSelectedSourceId = useOnboardingStore((s) => s.setSelectedSourceId)
  const addSource = useOnboardingStore((s) => s.addSource)
  const updateSource = useOnboardingStore((s) => s.updateSource)
  const removeSource = useOnboardingStore((s) => s.removeSource)
  const scanSource = useOnboardingStore((s) => s.scanSource)
  const updateDiscovered = useOnboardingStore((s) => s.updateDiscovered)
  const markRegistered = useOnboardingStore((s) => s.markRegistered)

  const addFile = useOnboardingStore((s) => s.addFile)
  const removeFile = useOnboardingStore((s) => s.removeFile)

  const assets = useAppStore((s) => s.assets)

  const [openAddSource, setOpenAddSource] = React.useState(false)
  const [formSource] = Form.useForm()

  const [selectedRowKeys, setSelectedRowKeys] = React.useState<React.Key[]>([])

  // 差异过滤与 Excel 解析状态
  const [diffFilter, setDiffFilter] = React.useState<'ALL' | 'NEW' | 'REGISTERED' | 'DUPLICATE'>('ALL')

  // Excel 解析结果
  const [excel, setExcel] = React.useState<ParsedExcel | null>(null)
  const [excelSheet, setExcelSheet] = React.useState<string | undefined>(undefined)
  const [excelFields, setExcelFields] = React.useState<any[]>([])

  // 列信息弹窗状态
  const [colOpen, setColOpen] = React.useState(false)
  const [colTitle, setColTitle] = React.useState('')
  const [colData, setColData] = React.useState<any[]>([])

  const selectedSource = React.useMemo(
    () => sources.find((x) => x.id === selectedSourceId),
    [sources, selectedSourceId]
  )

  const discoveredForSelected = React.useMemo(
    () => discovered.filter((t) => (!selectedSourceId ? true : t.sourceId === selectedSourceId)),
    [discovered, selectedSourceId]
  )
  // 差异计算（与资产库比较 & 扫描内重复检测）
  const discoveredWithDiff = React.useMemo(() => {
    const nameCount = new Map<string, number>()
    for (const t of discoveredForSelected) {
      nameCount.set(t.name, (nameCount.get(t.name) || 0) + 1)
    }

    const assetSameName = new Map<string, number>()
    for (const a of assets || []) {
      const k = `${a.system}::${a.name}`
      assetSameName.set(k, (assetSameName.get(k) || 0) + 1)
    }

    return discoveredForSelected.map((t: any) => {
      const sameInAssets = (assetSameName.get(`${t.system}::${t.name}`) || 0) > 0
      const dupInScan = (nameCount.get(t.name) || 0) > 1

      const diffStatus: 'REGISTERED' | 'NEW' | 'DUPLICATE' =
        sameInAssets ? 'REGISTERED' : dupInScan ? 'DUPLICATE' : 'NEW'

      return { ...t, _diffStatus: diffStatus }
    })
  }, [discoveredForSelected, assets])

  const discoveredFiltered = React.useMemo(() => {
    if (diffFilter === 'ALL') return discoveredWithDiff
    if (diffFilter === 'REGISTERED') return discoveredWithDiff.filter((x: any) => x._diffStatus === 'REGISTERED')
    if (diffFilter === 'DUPLICATE') return discoveredWithDiff.filter((x: any) => x._diffStatus === 'DUPLICATE')
    return discoveredWithDiff.filter((x: any) => x._diffStatus === 'NEW')
  }, [discoveredWithDiff, diffFilter])

  const domainOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const a of assets || []) {
      if (a.domain) set.add(a.domain)
    }
    ;['客户域', '交易域', '公共维', '财务域', '供应链域', '未分域'].forEach((d) => set.add(d))
    return Array.from(set).map((d) => ({ label: d, value: d }))
  }, [assets])

  const registerTables = (rows: DiscoveredTable[]) => {
    const existingKey = new Set((assets || []).map((a: AnyAsset) => `${a.system}::${a.name}`))

    const now = nowISO()
    const newAssets: AnyAsset[] = []

    for (const r of rows) {
      const key = `${r.system}::${r.name}`
      if (existingKey.has(key)) continue

      newAssets.push({
        id: `asset_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
        name: r.name,
        type: 'TABLE',
        assetCategory: r.assetCategory,
        domain: r.domain || '未分域',
        system: r.system || selectedSource?.name || 'UNKNOWN',
        db: (r as any).db,
        schema: (r as any).schema,
        owner: r.owner || selectedSource?.owner || '未指定',
        tags: [r.assetCategory, (r as any).schema, '注册'],
        sensitivity: r.sensitivity || 'L1',
        status: 'ACTIVE',
        updateFreq: r.updateFreq || 'T+1',
        layer: (r as any).layer || inferLayerByName(r.name),
        registrationMethod: 'MANUAL_DB',
        qualityScore: 80 + Math.floor(Math.random() * 15),
        createdAt: now,
        updatedAt: now,
        description: `从数据源「${selectedSource?.name || r.system}」扫描发现并注册：${r.comment || ''}`,
        fields: makeFieldsForTable(r.name)
      })
    }

    if (!newAssets.length) {
      msgApi.info('没有可注册的新表（可能已存在于资产库）')
      return
    }

    const ok = appendAssetsToAppStore(newAssets)
    if (!ok) {
      msgApi.error('注册失败：未能写入 assets（请确认 useAppStore 为 zustand store）')
      return
    }

    markRegistered(rows.map((x) => x.id))
    msgApi.success(`已注册 ${newAssets.length} 张表到「数据资产列表」`)
    setSelectedRowKeys([])
  }

  const sourceColumns = [
    { title: '名称', dataIndex: 'name' },
    { title: '类型', dataIndex: 'type', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '环境', dataIndex: 'env', width: 110, render: (v: string) => <Tag>{v}</Tag> },
    { title: '库/Schema', key: 'db', width: 200, render: (_: any, r: DataSource) => <Text code>{r.database}.{r.schema}</Text> },
    { title: 'Owner', dataIndex: 'owner', width: 120 },
    { title: '采集', dataIndex: 'ingestion', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '调度', dataIndex: 'schedule', width: 140 },
    { title: '状态', dataIndex: 'status', width: 110, render: (v: string) => <Tag color={v === 'OK' ? 'green' : v === 'ERROR' ? 'red' : 'default'}>{v}</Tag> },
    {
      title: '操作',
      key: 'op',
      width: 240,
      render: (_: any, r: DataSource) => (
        <Space>
          <Button size="small" icon={<ReloadOutlined />} onClick={() => scanSource(r.id)}>
            扫描库表
          </Button>
          <Button
            size="small"
            onClick={() => {
              setSelectedSourceId(r.id)
              msgApi.info(`已切换当前数据源：${r.name}`)
            }}
          >
            设为当前
          </Button>
          <Button
            size="small"
            danger
            onClick={() => {
              Modal.confirm({
                title: '删除数据源？',
                content: '将同时移除该数据源的发现结果（不会删除资产库已注册的资产）。',
                okText: '删除',
                okButtonProps: { danger: true },
                onOk: () => removeSource(r.id)
              })
            }}
          >
            删除
          </Button>
        </Space>
      )
    }
  ]

  const discoveredColumns = [
    { title: '表名', dataIndex: 'name', width: 220, render: (v: string) => <Text code>{v}</Text> },
    { title: '注释', dataIndex: 'comment' },
    {
      title: '差异状态',
      dataIndex: '_diffStatus',
      width: 120,
      render: (v: string) =>
        v === 'REGISTERED' ? <Tag color="green">已注册</Tag> :
        v === 'DUPLICATE' ? <Tag color="orange">疑似重复</Tag> :
        <Tag>未注册</Tag>
    },
    { title: '行数', dataIndex: 'rowCount', width: 120, render: (v: number) => v.toLocaleString() },
    { title: '最近更新', dataIndex: 'lastUpdated', width: 170, render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '大类',
      dataIndex: 'assetCategory',
      width: 120,
      render: (v: AssetCategory) => assetCategoryTag(v)
    },
    {
      title: '层级',
      dataIndex: 'layer',
      width: 120,
      render: (v: AssetLayer, r: any) => (
        <Select
          size="small"
          value={v || inferLayerByName(r.name)}
          style={{ width: 100 }}
          options={layerOptions}
          onChange={(val) => updateDiscovered(r.id, { layer: val })}
        />
      )
    },
    {
      title: '域',
      dataIndex: 'domain',
      width: 140,
      render: (v: string, r: DiscoveredTable) => (
        <Select
          size="small"
          value={v}
          style={{ width: 120 }}
          options={domainOptions}
          onChange={(val) => updateDiscovered(r.id, { domain: val })}
        />
      )
    },
    {
      title: 'Owner',
      dataIndex: 'owner',
      width: 140,
      render: (v: string, r: DiscoveredTable) => (
        <Input
          size="small"
          value={v}
          onChange={(e) => updateDiscovered(r.id, { owner: e.target.value })}
        />
      )
    },
    {
      title: '敏感级别',
      dataIndex: 'sensitivity',
      width: 120,
      render: (v: string, r: DiscoveredTable) => (
        <Select
          size="small"
          value={v}
          style={{ width: 100 }}
          options={[
            { label: 'L1', value: 'L1' },
            { label: 'L2', value: 'L2' },
            { label: 'L3', value: 'L3' }
          ]}
          onChange={(val) => updateDiscovered(r.id, { sensitivity: val })}
        />
      )
    },
    {
      title: '更新频率',
      dataIndex: 'updateFreq',
      width: 140,
      render: (v: string, r: DiscoveredTable) => (
        <Select
          size="small"
          value={v}
          style={{ width: 120 }}
          options={[
            { label: 'T+1', value: 'T+1' },
            { label: '小时级', value: '小时级' },
            { label: '实时/CDC', value: '实时/CDC' }
          ]}
          onChange={(val) => updateDiscovered(r.id, { updateFreq: val })}
        />
      )
    },
    {
      title: '已注册',
      dataIndex: 'registered',
      width: 110,
      render: (v: boolean) => (v ? <Tag color="green">是</Tag> : <Tag>否</Tag>)
    },
    {
      title: '操作',
      key: 'op',
      width: 110,
      render: (_: any, r: DiscoveredTable) => (
        <Button
          size="small"
          type="primary"
          disabled={r.registered}
          onClick={() => registerTables([r])}
        >
          注册
        </Button>
      )
    }
  ]

  const fileColumns = [
    { title: '文件名', dataIndex: 'fileName' },
    { title: '类型', dataIndex: 'fileType', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '大类', dataIndex: 'assetCategory', width: 120, render: (v: AssetCategory) => assetCategoryTag(v) },
    { title: '域', dataIndex: 'domain', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Owner', dataIndex: 'owner', width: 120 },
    { title: '敏感级别', dataIndex: 'sensitivity', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '更新频率', dataIndex: 'updateFreq', width: 120, render: (v: string) => <Tag>{v}</Tag> },
    { title: '备注', dataIndex: 'note' },
    { title: '登记时间', dataIndex: 'createdAt', width: 180, render: (v: string) => new Date(v).toLocaleString() },
    {
      title: '操作',
      key: 'op',
      width: 90,
      render: (_: any, r: any) => (
        <Button size="small" danger onClick={() => removeFile(r.id)}>
          删除
        </Button>
      )
    }
  ]

  const [fileForm] = Form.useForm()

  const registerFileAsAsset = (v: any) => {
    const now = nowISO()
    const asset: AnyAsset = {
      id: `asset_file_${Date.now()}_${Math.floor(Math.random() * 100000)}`,
      name: v.fileName,
      type: 'FILE',
      assetCategory: v.assetCategory,
      domain: v.domain || '未分域',
      system: 'ManualUpload',
      owner: v.owner || '未指定',
      tags: [v.fileType, v.assetCategory, '登记'],
      sensitivity: v.sensitivity,
      status: 'ACTIVE',
      updateFreq: v.updateFreq,
      qualityScore: 70 + Math.floor(Math.random() * 20),
      createdAt: now,
      updatedAt: now,
      description: v.note || `手工文件登记（${excel?.fileName || 'Excel/CSV'}${excelSheet ? ' / ' + excelSheet : ''}）`,
      fields: excelFields?.length ? excelFields : []
    }

    const ok = appendAssetsToAppStore([asset])
    if (!ok) {
      msgApi.error('登记失败：未能写入 assets（请确认 useAppStore 为 zustand store）')
      return
    }

    addFile({
      fileName: v.fileName,
      fileType: v.fileType,
      owner: v.owner,
      domain: v.domain,
      sensitivity: v.sensitivity,
      updateFreq: v.updateFreq,
      assetCategory: v.assetCategory,
      note: v.note || ''
    })

    msgApi.success('已登记文件，并同步到资产库（资产列表可见）')
    fileForm.resetFields()
    // 重置解析状态
    setExcel(null)
    setExcelSheet(undefined)
    setExcelFields([])
  }

  return (
    <div style={{ padding: 16 }}>
      {ctx}
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            数据源与注册中心
          </Title>
          <Text type="secondary">
            默认读取数据中台资产（应采尽采），同时支持“数据源配置→库表发现→手工注册”以及“Excel/CSV 文件登记”。
          </Text>
        </div>

        <Tabs
          items={[
            {
              key: 'sources',
              label: '数据源管理',
              children: (
                <Card
                  size="small"
                  title="数据源列表"
                  extra={
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenAddSource(true)}>
                      新增数据源
                    </Button>
                  }
                >
                  <Table size="small" rowKey="id" dataSource={sources} columns={sourceColumns as any} pagination={false} />
                </Card>
              )
            },
            {
              key: 'discover',
              label: '库表发现与批量注册',
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Card size="small" title="选择数据源并扫描">
                    <Space wrap>
                      <Select
                        style={{ width: 240 }}
                        value={selectedSourceId}
                        placeholder="选择数据源"
                        onChange={(v) => setSelectedSourceId(v)}
                        options={sources.map((s: DataSource) => ({ label: `${s.name}（${s.type}/${s.env}）`, value: s.id }))}
                      />
                      <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        disabled={!selectedSourceId}
                        onClick={() => {
                          if (!selectedSourceId) return
                          scanSource(selectedSourceId)
                          msgApi.success('已扫描并生成库表清单（演示数据）')
                        }}
                      >
                        扫描库表
                      </Button>
                      <Button
                        disabled={!selectedRowKeys.length}
                        onClick={() => {
                          const rows = discoveredForSelected.filter((x: any) => selectedRowKeys.includes(x.id) && !x.registered)
                          if (!rows.length) {
                            msgApi.info('没有可注册的选中表（可能已注册）')
                            return
                          }
                          registerTables(rows)
                        }}
                      >
                        批量注册
                      </Button>
                      <Text type="secondary">
                        当前源：{selectedSource?.name || '-'}，发现 {discoveredForSelected.length} 张表
                      </Text>
                    </Space>
                  </Card>

                  <Card size="small" title="发现结果（可编辑注册信息）">
                    <Space style={{ marginBottom: 8 }} wrap>
                      <Segmented
                        value={diffFilter}
                        onChange={(v) => setDiffFilter(v as any)}
                        options={[
                          { label: '全部', value: 'ALL' },
                          { label: '未注册', value: 'NEW' },
                          { label: '已注册', value: 'REGISTERED' },
                          { label: '疑似重复', value: 'DUPLICATE' }
                        ]}
                      />
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        差异逻辑：同系统同表名=已注册；同名不同 schema/扫描重复=疑似重复（演示版）
                      </Text>
                    </Space>

                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={discoveredFiltered}
                      columns={discoveredColumns as any}
                      pagination={{ pageSize: 8 }}
                      rowSelection={{
                        selectedRowKeys,
                        onChange: (ks) => setSelectedRowKeys(ks),
                        getCheckboxProps: (r: any) => ({ disabled: !!r.registered })
                      }}
                    />
                    <div style={{ marginTop: 8, fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                      说明：这里的扫描结果是演示数据。后续接真实实现：连接测试→拉取information_schema→同步字段→对比资产库差异→批量注册。
                    </div>
                  </Card>
                </Space>
              )
            },
            {
              key: 'files',
              label: '文件/Excel 登记',
              children: (
                <Row gutter={12}>
                  <Col xs={24} lg={10}>
                    <Card size="small" title="登记一个文件（会同步生成 FILE 资产）">
                      <Form
                        form={fileForm}
                        layout="vertical"
                        initialValues={{
                          fileType: 'EXCEL',
                          assetCategory: 'RAW',
                          domain: '未分域',
                          sensitivity: 'L1',
                          updateFreq: '不定期'
                        }}
                        onFinish={registerFileAsAsset}
                      >
                        <Form.Item label="上传并解析（Excel）">
                          <Upload.Dragger
                            name="file"
                            multiple={false}
                            accept=".xlsx,.xls"
                            beforeUpload={() => false}
                            onChange={async (info) => {
                              const f = info.file?.originFileObj as File | undefined
                              if (!f) return
                              const parsed = await parseExcelFile(f)
                              setExcel(parsed)
                              const first = parsed.sheets[0]?.sheetName
                              setExcelSheet(first)
                              setExcelFields(parsed.sheets[0]?.fields || [])
                              fileForm.setFieldValue('fileName', parsed.fileName)
                              msgApi.success(`已解析：${parsed.fileName}（${parsed.sheets.length} 个 sheet）`)
                            }}
                          >
                            <p className="ant-upload-drag-icon"><InboxOutlined /></p>
                            <p className="ant-upload-text">拖拽 Excel 到这里，或点击选择文件</p>
                            <p className="ant-upload-hint">解析后自动生成字段列表 fields（演示版：取第一行作为字段名）</p>
                          </Upload.Dragger>
                        </Form.Item>

                        <Form.Item name="fileName" label="文件名" rules={[{ required: true, message: '请输入文件名（或选择文件后自动填充）' }]}>
                          <Input placeholder="如：门店名单.xlsx / 客户映射表.csv" />
                        </Form.Item>

                        <Form.Item name="fileType" label="文件类型" rules={[{ required: true }]}>
                          <Select
                            options={[
                              { label: 'Excel', value: 'EXCEL' },
                              { label: 'CSV', value: 'CSV' },
                              { label: '其他', value: 'OTHER' }
                            ]}
                          />
                        </Form.Item>

                        {excel?.sheets?.length ? (
                          <Card size="small" style={{ marginBottom: 12 }} title="字段预览（可编辑）">
                            <Space wrap style={{ marginBottom: 8 }}>
                              <Text type="secondary">Sheet：</Text>
                              <Select
                                style={{ width: 240 }}
                                value={excelSheet}
                                options={excel.sheets.map((s) => ({ label: s.sheetName, value: s.sheetName }))}
                                onChange={(v) => {
                                  setExcelSheet(v)
                                  const sheet = excel.sheets.find((x) => x.sheetName === v)
                                  setExcelFields(sheet?.fields || [])
                                }}
                              />
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                字段数：{excelFields.length}
                              </Text>
                            </Space>

                            <Table
                              size="small"
                              rowKey="name"
                              pagination={false}
                              dataSource={excelFields}
                              columns={[
                                { title: '字段名', dataIndex: 'name' },
                                {
                                  title: '类型',
                                  dataIndex: 'type',
                                  width: 140,
                                  render: (v, r, idx) => (
                                    <Select
                                      size="small"
                                      value={v}
                                      style={{ width: 120 }}
                                      options={[
                                        { label: 'string', value: 'string' },
                                        { label: 'double', value: 'double' },
                                        { label: 'boolean', value: 'boolean' },
                                        { label: 'datetime', value: 'datetime' }
                                      ]}
                                      onChange={(nv) => {
                                        const next = [...excelFields]
                                        next[idx] = { ...next[idx], type: nv }
                                        setExcelFields(next)
                                      }}
                                    />
                                  )
                                },
                                {
                                  title: '说明',
                                  dataIndex: 'comment',
                                  render: (v, r, idx) => (
                                    <Input
                                      size="small"
                                      value={v}
                                      onChange={(e) => {
                                        const next = [...excelFields]
                                        next[idx] = { ...next[idx], comment: e.target.value }
                                        setExcelFields(next)
                                      }}
                                    />
                                  )
                                }
                              ]}
                            />
                          </Card>
                        ) : null}

                        <Form.Item name="assetCategory" label="资产大类" rules={[{ required: true }]}>
                          <Select
                            options={[
                              { label: 'RAW 原始', value: 'RAW' },
                              { label: '结果数据', value: 'CURATED' },
                              { label: '主数据', value: 'MDM' },
                              { label: '维度数据', value: 'DIM' },
                              { label: '服务交付', value: 'SERVING' },
                              { label: '指标资产', value: 'METRIC' },
                              { label: '语义资产', value: 'SEMANTIC' },
                              { label: '临时/实验', value: 'SANDBOX' }
                            ]}
                          />
                        </Form.Item>

                        <Form.Item name="domain" label="所属域" rules={[{ required: true }]}>
                          <Select options={domainOptions} />
                        </Form.Item>

                        <Form.Item name="owner" label="Owner" rules={[{ required: true, message: '请输入责任人' }]}>
                          <Input placeholder="如：数据平台组/某业务负责人" />
                        </Form.Item>

                        <Row gutter={12}>
                          <Col span={12}>
                            <Form.Item name="sensitivity" label="敏感级别" rules={[{ required: true }]}>
                              <Select options={[{ label: 'L1', value: 'L1' }, { label: 'L2', value: 'L2' }, { label: 'L3', value: 'L3' }]} />
                            </Form.Item>
                          </Col>
                          <Col span={12}>
                            <Form.Item name="updateFreq" label="更新频率" rules={[{ required: true }]}>
                              <Select options={[{ label: '不定期', value: '不定期' }, { label: '周更', value: '周更' }, { label: '月更', value: '月更' }]} />
                            </Form.Item>
                          </Col>
                        </Row>

                        <Form.Item name="note" label="备注">
                          <Input.TextArea rows={3} placeholder="用途、口径说明、有效期/TTL、共享范围等" />
                        </Form.Item>

                        <Button type="primary" htmlType="submit" block>
                          登记并生成资产
                        </Button>

                        <Divider style={{ margin: '12px 0' }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          说明：这里先做“登记入口 + 同步生成资产”，后续可接 OSS/网盘链接、版本管理、字段解析、TTL 到期提醒等。
                        </Text>
                      </Form>
                    </Card>
                  </Col>

                  <Col xs={24} lg={14}>
                    <Card size="small" title="已登记文件列表">
                      <Table size="small" rowKey="id" dataSource={files} columns={fileColumns as any} pagination={{ pageSize: 8 }} />
                    </Card>
                  </Col>
                </Row>
              )
            }
          ]}
        />

        {/* 新增数据源弹窗 */}
        <Modal
          open={openAddSource}
          title="新增数据源（演示）"
          onCancel={() => setOpenAddSource(false)}
          onOk={() => {
            formSource
              .validateFields()
              .then((v) => {
                addSource({
                  name: v.name,
                  type: v.type,
                  env: v.env,
                  host: v.host,
                  database: v.database,
                  schema: v.schema,
                  owner: v.owner,
                  ingestion: v.ingestion,
                  schedule: v.schedule
                })
                msgApi.success('已新增数据源（演示）')
                setOpenAddSource(false)
                formSource.resetFields()
              })
              .catch(() => {})
          }}
          okText="保存"
        >
          <Form
            form={formSource}
            layout="vertical"
            initialValues={{
              type: 'MYSQL',
              env: 'PROD',
              ingestion: 'FULL',
              schedule: 'T+1 02:00'
            }}
          >
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="name" label="数据源名称" rules={[{ required: true }]}>
                  <Input placeholder="如：CRM / OA / 供应链" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="type" label="类型" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: 'MySQL', value: 'MYSQL' },
                      { label: 'Postgres', value: 'POSTGRES' },
                      { label: 'SQLServer', value: 'SQLSERVER' },
                      { label: 'Oracle', value: 'ORACLE' },
                      { label: 'Hive', value: 'HIVE' },
                      { label: 'MaxCompute', value: 'MAXCOMPUTE' },
                      { label: 'Other', value: 'OTHER' }
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="env" label="环境" rules={[{ required: true }]}>
                  <Select options={[{ label: 'DEV', value: 'DEV' }, { label: 'TEST', value: 'TEST' }, { label: 'PROD', value: 'PROD' }]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="owner" label="Owner" rules={[{ required: true }]}>
                  <Input placeholder="如：数据平台组" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="host" label="Host/地址" rules={[{ required: true }]}>
              <Input placeholder="如：crm.db.internal 或 10.0.0.8" />
            </Form.Item>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="database" label="Database" rules={[{ required: true }]}>
                  <Input placeholder="如：crm" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="schema" label="Schema" rules={[{ required: true }]}>
                  <Input placeholder="如：dbo/public" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={12}>
              <Col span={12}>
                <Form.Item name="ingestion" label="采集方式" rules={[{ required: true }]}>
                  <Select options={[{ label: 'FULL 全量', value: 'FULL' }, { label: 'CDC 增量', value: 'CDC' }, { label: 'MIXED 混合', value: 'MIXED' }]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="schedule" label="调度/刷新" rules={[{ required: true }]}>
                  <Input placeholder="如：T+1 02:00 / 实时" />
                </Form.Item>
              </Col>
            </Row>

            <Text type="secondary" style={{ fontSize: 12 }}>
              注意：这里先做“登记与演示扫描”，真实实现会把账号/密码改为密钥引用，并补连接测试、网络配置、权限隔离等。
            </Text>
          </Form>
        </Modal>
      </Space>
    </div>
  )
}
