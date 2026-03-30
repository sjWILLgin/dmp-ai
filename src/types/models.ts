export type AssetCategory =
  | 'RAW'
  | 'CURATED'
  | 'MDM'
  | 'DIM'
  | 'SERVING'
  | 'METRIC'
  | 'SEMANTIC'
  | 'SANDBOX'

export type AssetType = 'TABLE' | 'METRIC' | 'API' | 'FILE'

export type AssetField = {
  name: string
  type: string
  comment: string
}

export type Asset = {
  id: string
  name: string
  displayName?: string // 中文显示名称
  type: AssetType
  assetCategory?: AssetCategory
  domain: string
  system: string
  owner: string
  description: string
  tags: string[]
  sensitivity: 'P0' | 'P1' | 'P2' | 'P3'
  status: 'ACTIVE' | 'DEPRECATED' | 'DRAFT'
  updateFreq: 'REALTIME' | 'DAILY' | 'WEEKLY' | 'ADHOC'
  qualityScore: number
  createdAt: string
  updatedAt: string
  fields: AssetField[]
  // 指标特有字段
  metricValue?: string // 指标价值
  calculationMethod?: string // 计算口径
  calculationLogic?: string // 计算逻辑
}

export type Application = {
  id: string
  assetId: string
  applicant: string
  permission: 'READ' | 'WRITE' | 'OWNER'
  useCase: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
}

export type Notification = {
  id: string
  title: string
  createdAt: string
  read: boolean
}

export type User = {
  name: string
  role: '业务' | '数据产品' | '数据开发' | 'BP' | '管理员'
}

export type Report = {
  id: string
  name: string
  description?: string
  tables: string[]
  dailyViews: number
  queriesPerDay: number
}

export type GovernanceRule = {
  id: string
  target: 'table' | 'field'
  tableName: string
  field?: string
  ruleType: string
  config?: Record<string, any>
  level: string
  owner: string
  enabled: boolean
}
