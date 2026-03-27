import { create } from 'zustand'
import { inferAssetCategory } from '../utils/assetCategory'
import type { AssetCategory } from '../types/models'

export type DataSourceType = 'MYSQL' | 'POSTGRES' | 'SQLSERVER' | 'ORACLE' | 'HIVE' | 'MAXCOMPUTE' | 'OTHER'

export type DataSource = {
  id: string
  name: string
  type: DataSourceType
  env: 'DEV' | 'TEST' | 'PROD'
  host: string
  database: string
  schema: string
  owner: string
  ingestion: 'FULL' | 'CDC' | 'MIXED'
  schedule: string // e.g. "T+1 02:00" / "Real-time"
  status: 'OK' | 'ERROR' | 'UNKNOWN'
  updatedAt: string
}

export type DiscoveredTable = {
  id: string
  sourceId: string
  db: string
  schema: string
  name: string
  comment: string
  rowCount: number
  lastUpdated: string

  // 注册时要用的字段（可编辑）
  domain: string
  system: string
  owner: string
  sensitivity: string
  updateFreq: string
  assetCategory: AssetCategory

  registered: boolean
}

export type FileRegistry = {
  id: string
  fileName: string
  fileType: 'EXCEL' | 'CSV' | 'OTHER'
  owner: string
  domain: string
  sensitivity: string
  updateFreq: string
  assetCategory: AssetCategory
  note: string
  createdAt: string
}

type State = {
  sources: DataSource[]
  discovered: DiscoveredTable[]
  files: FileRegistry[]

  selectedSourceId?: string

  setSelectedSourceId: (id?: string) => void
  addSource: (s: Omit<DataSource, 'id' | 'updatedAt' | 'status'>) => void
  updateSource: (id: string, patch: Partial<DataSource>) => void
  removeSource: (id: string) => void

  scanSource: (sourceId: string) => void
  updateDiscovered: (id: string, patch: Partial<DiscoveredTable>) => void
  markRegistered: (ids: string[]) => void

  addFile: (f: Omit<FileRegistry, 'id' | 'createdAt'>) => void
  removeFile: (id: string) => void
}

function nowISO() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`
}

/** 生成可重复但看起来真实的行数 */
function fakeRows(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return 10_000 + (h % 5_000_000)
}

function genTablesForSource(src: DataSource): DiscoveredTable[] {
  const base = [
    { name: 'ods_order_header', comment: '订单头(原始)', domain: '交易域' },
    { name: 'ods_order_item', comment: '订单明细(原始)', domain: '交易域' },
    { name: 'ods_customer_base', comment: '客户基础(原始)', domain: '客户域' },
    { name: 'dwd_order_detail', comment: '订单明细明细层', domain: '交易域' },
    { name: 'dws_customer_trade_30d', comment: '客户近30天交易汇总', domain: '客户域' },
    { name: 'ads_order_kpi_daily', comment: '订单KPI日报(结果)', domain: '交易域' },
    { name: 'dim_calendar', comment: '日历维表', domain: '公共维' },
    { name: 'mdm_customer_golden', comment: '客户主数据黄金表', domain: '客户域' }
  ]

  return base.map((b) => {
    const assetCategory = inferAssetCategory({ name: b.name })
    return {
      id: uid('tbl'),
      sourceId: src.id,
      db: src.database,
      schema: src.schema,
      name: b.name,
      comment: b.comment,
      rowCount: fakeRows(b.name),
      lastUpdated: new Date(Date.now() - Math.floor(Math.random() * 20) * 86400000).toISOString(),

      domain: b.domain,
      system: src.name,
      owner: src.owner,
      sensitivity: assetCategory === 'RAW' ? 'L2' : assetCategory === 'MDM' ? 'L3' : 'L1',
      updateFreq: src.ingestion === 'CDC' ? '实时/小时级' : 'T+1',
      assetCategory,

      registered: false
    }
  })
}

export const useOnboardingStore = create<State>((set, get) => ({
  sources: [
    {
      id: 'src_datahub',
      name: 'DataHub',
      type: 'OTHER',
      env: 'PROD',
      host: 'datahub.internal',
      database: 'metadata',
      schema: 'public',
      owner: '数据平台组',
      ingestion: 'MIXED',
      schedule: '实时/准实时',
      status: 'OK',
      updatedAt: nowISO()
    },
    {
      id: 'src_erp',
      name: 'ERP',
      type: 'MYSQL',
      env: 'PROD',
      host: 'erp.db.internal',
      database: 'erp',
      schema: 'dbo',
      owner: '王浩锦',
      ingestion: 'CDC',
      schedule: 'CDC 实时',
      status: 'OK',
      updatedAt: nowISO()
    }
  ],
  discovered: [],
  files: [],
  selectedSourceId: 'src_erp',

  setSelectedSourceId: (id) => set({ selectedSourceId: id }),

  addSource: (s) =>
    set((st) => ({
      sources: [
        ...st.sources,
        {
          id: uid('src'),
          status: 'UNKNOWN',
          updatedAt: nowISO(),
          ...s
        }
      ]
    })),

  updateSource: (id, patch) =>
    set((st) => ({
      sources: st.sources.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowISO() } : x))
    })),

  removeSource: (id) =>
    set((st) => ({
      sources: st.sources.filter((x) => x.id !== id),
      discovered: st.discovered.filter((t) => t.sourceId !== id),
      selectedSourceId: st.selectedSourceId === id ? undefined : st.selectedSourceId
    })),

  scanSource: (sourceId) => {
    const src = get().sources.find((s) => s.id === sourceId)
    if (!src) return
    const gen = genTablesForSource(src)
    set((st) => ({
      discovered: [
        // 保留其他源的发现结果，替换当前源的
        ...st.discovered.filter((t) => t.sourceId !== sourceId),
        ...gen
      ],
      selectedSourceId: sourceId
    }))
  },

  updateDiscovered: (id, patch) =>
    set((st) => ({
      discovered: st.discovered.map((t) => (t.id === id ? { ...t, ...patch } : t))
    })),

  markRegistered: (ids) =>
    set((st) => ({
      discovered: st.discovered.map((t) => (ids.includes(t.id) ? { ...t, registered: true } : t))
    })),

  addFile: (f) =>
    set((st) => ({
      files: [
        { id: uid('file'), createdAt: nowISO(), ...f },
        ...st.files
      ]
    })),

  removeFile: (id) =>
    set((st) => ({
      files: st.files.filter((x) => x.id !== id)
    }))
}))
