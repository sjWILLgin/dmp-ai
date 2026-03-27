import { create } from 'zustand'
import type { Application, Asset, Notification, User, Report, GovernanceRule } from '../types/models'

export type DrawerMode = 'NONE' | 'ASSET_DETAIL' | 'APPLY_ACCESS' | 'SHARE_ASSET'

export type DrawerState = {
  open: boolean
  mode: DrawerMode
  payload?: Record<string, any>
}

function nowISO() {
  return new Date().toISOString()
}

function id(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2, 10)}`
}

const seedAssets: Asset[] = [
  {
    id: 'a_ods_order',
    name: 'ods_order_header',
    type: 'TABLE',
    assetCategory: 'RAW',
    domain: '交易域',
    system: 'ERP',
    owner: '王浩锦',
    description: '原始订单头表（镜像），按小时增量采集，保留源字段。',
    tags: ['ODS', '订单', '应采尽采'],
    sensitivity: 'P1',
    status: 'ACTIVE',
    updateFreq: 'REALTIME',
    qualityScore: 92,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'order_id', type: 'string', comment: '订单ID' },
      { name: 'customer_id', type: 'string', comment: '客户ID' },
      { name: 'order_status', type: 'string', comment: '订单状态' },
      { name: 'order_time', type: 'timestamp', comment: '下单时间' },
    ],
  },
  {
    id: 'a_ads_order',
    name: 'ads_order_kpi_daily',
    type: 'TABLE',
    assetCategory: 'CURATED',
    domain: '交易域',
    system: 'DataHub',
    owner: '王浩锦',
    description: '每日订单 KPI 结果表，可直接用于看板/运营分析。',
    tags: ['ADS', 'KPI', '日报'],
    sensitivity: 'P2',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 88,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'order_cnt', type: 'bigint', comment: '订单数' },
      { name: 'gmv', type: 'decimal(18,2)', comment: 'GMV' },
      { name: 'paying_customer_cnt', type: 'bigint', comment: '付费客户数' },
    ],
  },
  {
    id: 'a_mdm_customer',
    name: 'mdm_customer_golden',
    type: 'TABLE',
    assetCategory: 'MDM',
    domain: '客户域',
    system: 'MDM',
    owner: '数据治理组',
    description: '客户主数据黄金表（统一 customer_id），带合并与存活规则。',
    tags: ['MDM', '黄金表', '客户'],
    sensitivity: 'P1',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 90,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'customer_id', type: 'string', comment: '主客户ID（黄金记录）' },
      { name: 'name', type: 'string', comment: '客户名称' },
      { name: 'phone', type: 'string', comment: '手机号（脱敏展示）' },
      { name: 'status', type: 'string', comment: '存活状态' },
    ],
  },
  {
    id: 'a_dim_calendar',
    name: 'dim_calendar',
    type: 'TABLE',
    assetCategory: 'DIM',
    domain: '公共维',
    system: 'DataHub',
    owner: '数据平台组',
    description: '日历维表（自然日/周/月/节假日等），供全域复用。',
    tags: ['DIM', '公共'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'WEEKLY',
    qualityScore: 95,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'dt', type: 'date', comment: '日期' },
      { name: 'week', type: 'int', comment: '周' },
      { name: 'month', type: 'int', comment: '月' },
      { name: 'is_holiday', type: 'int', comment: '是否节假日' },
    ],
  },
  {
    id: 'a_api_customer',
    name: 'api_customer_lookup',
    type: 'API',
    assetCategory: 'SERVING',
    domain: '客户域',
    system: 'Gateway',
    owner: '平台后端',
    description: '客户查询 API（用于业务系统/中台分发），支持按 customer_id 查询。',
    tags: ['API', '服务'],
    sensitivity: 'P1',
    status: 'ACTIVE',
    updateFreq: 'REALTIME',
    qualityScore: 85,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'customer_id', type: 'string', comment: '主客户ID' },
      { name: 'name', type: 'string', comment: '客户名称' },
      { name: 'phone_masked', type: 'string', comment: '脱敏手机号' },
    ],
  },
  {
    id: 'a_metric_trade_cust',
    name: 'metric_trading_customer_cnt',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '客户域',
    system: 'Metrics',
    owner: '数据产品',
    description: '交易客户数：当期发生至少一笔有效订单的客户数。',
    tags: ['指标', '口径'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 80,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'trading_customer_cnt', type: 'bigint', comment: '交易客户数' },
      { name: 'logic', type: 'string', comment: '口径说明/SQL' },
    ],
  },
]

const seedUsers: User[] = [
  { name: '王浩锦', role: '数据产品' },
  { name: '陈敏', role: 'BP' },
  { name: '刘洋', role: '数据开发' },
  { name: '管理员', role: '管理员' },
]

const seedReports: Report[] = [
  {
    id: 'r_001',
    name: '会员留存看板',
    description: '展示会员留存/活跃/新增情况',
    tables: ['mdm_customer_golden', 'ads_order_kpi_daily'],
    dailyViews: 420,
    queriesPerDay: 58,
  },
  {
    id: 'r_002',
    name: '交易监控日报',
    description: '交易量/GMV/退款等核心监控',
    tables: ['ods_order_header', 'ods_order_item', 'ads_order_kpi_daily'],
    dailyViews: 1200,
    queriesPerDay: 240,
  },
  {
    id: 'r_003',
    name: '维度同步校验',
    description: '检查维表一致性与覆盖率',
    tables: ['dim_calendar'],
    dailyViews: 32,
    queriesPerDay: 8,
  },
]

const seedRules: GovernanceRule[] = [
  {
    id: 'rule_1',
    target: 'table',
    tableName: 'mdm_customer_golden',
    ruleType: 'ROW_COUNT_GT',
    config: { min: 1 },
    level: 'P1',
    owner: '数据治理组',
    enabled: true,
  },
  {
    id: 'rule_2',
    target: 'field',
    tableName: 'mdm_customer_golden',
    field: 'customer_id',
    ruleType: 'UNIQUE',
    config: {},
    level: 'P0',
    owner: '数据治理组',
    enabled: true,
  },
  {
    id: 'rule_3',
    target: 'field',
    tableName: 'ads_order_kpi_daily',
    field: 'gmv',
    ruleType: 'RANGE_MIN',
    config: { min: 0 },
    level: 'P2',
    owner: '王浩锦',
    enabled: false,
  },
]

type AppState = {
  me: User
  users: User[]
  globalSearch: string
  setGlobalSearch: (v: string) => void
  setMe: (name: string) => void

  assets: Asset[]
  favorites: Set<string>
  toggleFavorite: (assetId: string) => void

  applications: Application[]
  createApplication: (input: Omit<Application, 'id' | 'createdAt'>) => void
  setApplicationStatus: (id: string, status: Application['status']) => void

  notifications: Notification[]
  addNotification: (title: string) => void
  markNotificationRead: (id: string) => void

  drawer: DrawerState
  openDrawer: (mode: DrawerMode, payload?: Record<string, any>) => void
  closeDrawer: () => void
  // reports & governance rules (demo)
  reports: Report[]
  addReport: (r: Omit<Report, 'id'>) => void
  updateReport: (id: string, patch: Partial<Report>) => void

  governanceRules: GovernanceRule[]
  addRule: (r: Omit<GovernanceRule, 'id'>) => void
  updateRule: (id: string, patch: Partial<GovernanceRule>) => void
  removeRule: (id: string) => void
  toggleRuleEnabled: (id: string) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  me: seedUsers[0],
  users: seedUsers,
  globalSearch: '',
  setGlobalSearch: (v) => set({ globalSearch: v }),
  setMe: (name) => {
    const u = get().users.find((x) => x.name === name)
    if (u) set({ me: u })
  },

  assets: seedAssets,
  favorites: new Set<string>(),
  toggleFavorite: (assetId) =>
    set((s) => {
      const next = new Set(s.favorites)
      if (next.has(assetId)) next.delete(assetId)
      else next.add(assetId)
      return { favorites: next }
    }),

  applications: [
    {
      id: 'APP_10001',
      assetId: 'a_ads_order',
      applicant: '陈敏',
      permission: 'READ',
      useCase: '运营日报看板',
      status: 'APPROVED',
      createdAt: nowISO(),
    },
    {
      id: 'APP_10002',
      assetId: 'a_mdm_customer',
      applicant: '刘洋',
      permission: 'READ',
      useCase: '下游系统客户对齐',
      status: 'PENDING',
      createdAt: nowISO(),
    },
  ],
  createApplication: (input) =>
    set((s) => {
      const app: Application = {
        id: id('APP'),
        createdAt: nowISO(),
        ...input,
      }
      return { applications: [app, ...s.applications] }
    }),
  setApplicationStatus: (appId, status) =>
    set((s) => ({
      applications: s.applications.map((a) => (a.id === appId ? { ...a, status } : a)),
    })),

  notifications: [
    { id: 'N_001', title: 'mdm_customer_golden 质量分下降：唯一性规则 WARN', createdAt: nowISO(), read: false },
    { id: 'N_002', title: 'ads_order_kpi_daily 已完成 T+1 更新', createdAt: nowISO(), read: true },
  ],
  addNotification: (title) =>
    set((s) => ({
      notifications: [{ id: id('N'), title, createdAt: nowISO(), read: false }, ...s.notifications],
    })),
  markNotificationRead: (nid) =>
    set((s) => ({
      notifications: s.notifications.map((n) => (n.id === nid ? { ...n, read: true } : n)),
    })),

  drawer: { open: false, mode: 'NONE' },
  openDrawer: (mode, payload) => set({ drawer: { open: true, mode, payload } }),
  closeDrawer: () => set({ drawer: { open: false, mode: 'NONE' } }),
  reports: seedReports,
  addReport: (r) =>
    set((s) => ({ reports: [{ id: id('r'), ...r }, ...s.reports] })),
  updateReport: (rid, patch) => set((s) => ({ reports: s.reports.map((x) => (x.id === rid ? { ...x, ...patch } : x)) })),

  governanceRules: seedRules,
  addRule: (r) => set((s) => ({ governanceRules: [{ id: id('rule'), ...r }, ...s.governanceRules] })),
  updateRule: (rid, patch) => set((s) => ({ governanceRules: s.governanceRules.map((x) => (x.id === rid ? { ...x, ...patch } : x)) })),
  removeRule: (rid) => set((s) => ({ governanceRules: s.governanceRules.filter((x) => x.id !== rid) })),
  toggleRuleEnabled: (rid) => set((s) => ({ governanceRules: s.governanceRules.map((x) => (x.id === rid ? { ...x, enabled: !x.enabled } : x)) })),
}))
