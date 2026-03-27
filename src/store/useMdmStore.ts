import { create } from 'zustand'

export type MdmEntity = {
  id: string
  name: string
  owner: string
  description: string
  updateFrequency: string
  primaryKey: string
  goldenTable: string
}

export type MdmTable = {
  id: string
  entityId: string
  name: string
  type: 'golden' | 'xref' | 'source_std' | 'merge_log' | 'history' | 'quality_daily' | 'rel'
  grain: string
  pk: string
  rowCount: number
  lastUpdated: string
  sla: string
}

export type MdmSource = {
  id: string
  entityId: string
  systemName: string
  ingestion: 'CDC' | 'Batch' | 'API'
  tables: { name: string; keyField: string; note: string }[]
}

export type MdmDownstream = {
  id: string
  entityId: string
  name: string
  type: 'DW' | 'API' | 'Report' | 'App'
  owner: string
  last30dUsage: string
  critical: boolean
  note: string
}

const now = () => new Date().toISOString()

const entities: MdmEntity[] = [
  {
    id: 'E_CUSTOMER',
    name: '客户主数据',
    owner: '数据治理组',
    description: '统一 customer_id，融合 ERP/CRM/SFA 等多源系统，支撑全域客户识别、画像与分发。',
    updateFrequency: 'T+1（关键字段支持 CDC）',
    primaryKey: 'customer_id',
    goldenTable: 'mdm_customer_golden',
  },
  {
    id: 'E_PRODUCT',
    name: '商品主数据',
    owner: '数据治理组',
    description: '统一 product_id，融合 SKU/条码/规格/品牌等，支撑产销协同与分析口径一致。',
    updateFrequency: 'T+1',
    primaryKey: 'product_id',
    goldenTable: 'mdm_product_golden',
  },
]

const tables: MdmTable[] = [
  {
    id: 'T_CUS_GOLD',
    entityId: 'E_CUSTOMER',
    name: 'mdm_customer_golden',
    type: 'golden',
    grain: '一条黄金记录=一个客户',
    pk: 'customer_id',
    rowCount: 1283450,
    lastUpdated: now(),
    sla: 'T+1',
  },
  {
    id: 'T_CUS_XREF',
    entityId: 'E_CUSTOMER',
    name: 'mdm_customer_xref',
    type: 'xref',
    grain: '一条映射=一个来源系统ID -> 黄金ID',
    pk: 'source_system, source_customer_id',
    rowCount: 3689030,
    lastUpdated: now(),
    sla: 'T+1',
  },
  {
    id: 'T_CUS_LOG',
    entityId: 'E_CUSTOMER',
    name: 'mdm_customer_merge_log',
    type: 'merge_log',
    grain: '一次合并/拆分事件',
    pk: 'event_id',
    rowCount: 90342,
    lastUpdated: now(),
    sla: 'T+1',
  },
  {
    id: 'T_PROD_GOLD',
    entityId: 'E_PRODUCT',
    name: 'mdm_product_golden',
    type: 'golden',
    grain: '一条黄金记录=一个商品',
    pk: 'product_id',
    rowCount: 245600,
    lastUpdated: now(),
    sla: 'T+1',
  },
  {
    id: 'T_PROD_XREF',
    entityId: 'E_PRODUCT',
    name: 'mdm_product_xref',
    type: 'xref',
    grain: '来源系统SKU/条码 -> 黄金商品ID',
    pk: 'source_system, source_sku',
    rowCount: 820300,
    lastUpdated: now(),
    sla: 'T+1',
  },
]

const sources: MdmSource[] = [
  {
    id: 'S_ERP_CUS',
    entityId: 'E_CUSTOMER',
    systemName: 'ERP',
    ingestion: 'CDC',
    tables: [
      { name: 'ods_erp_customer', keyField: 'cust_id', note: '合同客户与收货客户，字段保真。' },
      { name: 'ods_erp_contact', keyField: 'contact_id', note: '联系人与地址明细。' },
    ],
  },
  {
    id: 'S_CRM_CUS',
    entityId: 'E_CUSTOMER',
    systemName: 'CRM',
    ingestion: 'Batch',
    tables: [{ name: 'ods_crm_account', keyField: 'account_id', note: '客户账户与线索转化结果。' }],
  },
  {
    id: 'S_PIM_PROD',
    entityId: 'E_PRODUCT',
    systemName: 'PIM',
    ingestion: 'Batch',
    tables: [{ name: 'ods_pim_sku', keyField: 'sku_id', note: 'SKU 主档与条码/规格。' }],
  },
]

const downstreams: MdmDownstream[] = [
  {
    id: 'D_DW_CUS',
    entityId: 'E_CUSTOMER',
    name: 'dwd_customer_profile',
    type: 'DW',
    owner: '数据平台组',
    last30dUsage: '12.4k',
    critical: true,
    note: '客户画像宽表，供标签圈选与营销使用。',
  },
  {
    id: 'D_API_CUS',
    entityId: 'E_CUSTOMER',
    name: 'api_customer_lookup',
    type: 'API',
    owner: '平台后端',
    last30dUsage: '8.1k',
    critical: true,
    note: '业务系统查客户接口（主键对齐）。',
  },
  {
    id: 'D_RPT_CUS',
    entityId: 'E_CUSTOMER',
    name: '客户覆盖率看板',
    type: 'Report',
    owner: 'BP',
    last30dUsage: '1.6k',
    critical: false,
    note: '运营指标体系客户域看板。',
  },
  {
    id: 'D_APP_PROD',
    entityId: 'E_PRODUCT',
    name: 'SFA 订货商品选择',
    type: 'App',
    owner: '渠道运营',
    last30dUsage: '3.2k',
    critical: true,
    note: '订货流程依赖主商品ID与规格。',
  },
]

type MdmState = {
  selectedEntityId: string
  setSelectedEntityId: (id: string) => void
  entities: MdmEntity[]
  tables: MdmTable[]
  sources: MdmSource[]
  downstreams: MdmDownstream[]
}

export const useMdmStore = create<MdmState>((set) => ({
  selectedEntityId: 'E_CUSTOMER',
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),
  entities,
  tables,
  sources,
  downstreams,
}))
