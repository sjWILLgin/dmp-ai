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
    displayName: '订单头表',
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
    displayName: '订单KPI日报表',
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
    displayName: '客户主数据黄金表',
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
    displayName: '日历维表',
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
    displayName: '客户查询API',
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
  // 新增 ODS 层资产
  {
    id: 'a_ods_order_header',
    name: 'ods_order_header',
    displayName: '订单头表',
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
    // 让表资产也可以带指标信息，避免“此资产不是指标类型”的提示阻塞业务场景
    metricValue: '订单头表用于计算订单类指标（如订单量、发货率）',
    calculationMethod: '按订单创建时间聚合，过滤状态=已完成；可关联订单明细计算GMV等指标',
    calculationLogic: 'SELECT COUNT(1) AS order_cnt, SUM(total_amount) AS order_gmv FROM ods_order_header WHERE order_status = "COMPLETED"',
  },
  {
    id: 'a_ods_order_item',
    name: 'ods_order_item',
    type: 'TABLE',
    assetCategory: 'RAW',
    domain: '交易域',
    system: 'ERP',
    owner: '王浩锦',
    description: '原始订单明细表（镜像），按小时增量采集，保留源字段。',
    tags: ['ODS', '订单明细', '应采尽采'],
    sensitivity: 'P1',
    status: 'ACTIVE',
    updateFreq: 'REALTIME',
    qualityScore: 90,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'order_id', type: 'string', comment: '订单ID' },
      { name: 'item_id', type: 'string', comment: '明细ID' },
      { name: 'product_id', type: 'string', comment: '产品ID' },
      { name: 'quantity', type: 'int', comment: '数量' },
      { name: 'price', type: 'decimal(10,2)', comment: '单价' },
    ],
    metricValue: '订单明细表用于计算细颗粒度订单指标，如单品数量、均价等',
    calculationMethod: '按明细拆分：SUM(quantity), SUM(price * quantity), AVG(price)，与订单头表JOIN获得完单率',
    calculationLogic: 'SELECT product_id, SUM(quantity) AS total_qty, SUM(price*quantity) AS total_amount FROM ods_order_item GROUP BY product_id',
  },
  {
    id: 'a_ods_customer',
    name: 'ods_customer',
    type: 'TABLE',
    assetCategory: 'RAW',
    domain: '客户域',
    system: 'CRM',
    owner: '陈敏',
    description: '原始客户表（镜像），按日增量采集，保留源字段。',
    tags: ['ODS', '客户', '应采尽采'],
    sensitivity: 'P1',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 88,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'customer_id', type: 'string', comment: '客户ID' },
      { name: 'name', type: 'string', comment: '客户名称' },
      { name: 'phone', type: 'string', comment: '手机号' },
      { name: 'registration_date', type: 'date', comment: '注册日期' },
    ],
  },
  // 新增 ADS 层资产
  {
    id: 'a_ads_bigtable_organization',
    name: 'ads_bigtable_organization',
    type: 'TABLE',
    assetCategory: 'CURATED',
    domain: '组织域',
    system: 'DataHub',
    owner: '王浩锦',
    description: '组织大宽表，整合订单、客户、产品等信息，用于业务分析。',
    tags: ['ADS', '大宽表', '组织'],
    sensitivity: 'P2',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 85,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'organization_id', type: 'string', comment: '组织ID' },
      { name: 'order_cnt', type: 'bigint', comment: '订单数' },
      { name: 'gmv', type: 'decimal(18,2)', comment: 'GMV' },
      { name: 'customer_cnt', type: 'bigint', comment: '客户数' },
      { name: 'new_customer_cnt', type: 'bigint', comment: '新客户数' },
      { name: 'old_customer_cnt', type: 'bigint', comment: '老客户数' },
      { name: 'avg_order_value', type: 'decimal(10,2)', comment: '客单价' },
    ],
  },
  // 新增指标资产
  {
    id: 'metric_zw_benpin_panjiayeji',
    name: '造旺本品盘价业绩（当时）',
    displayName: '造旺本品业绩',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '业绩域',
    system: 'Metrics',
    owner: '数据产品',
    description: '造旺本品盘价业绩指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '业绩', '造旺'],
    sensitivity: 'P2',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 82,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'performance_value', type: 'decimal(18,2)', comment: '业绩值' },
      { name: 'logic', type: 'string', comment: '计算逻辑：SUM(gmv) WHERE product_type = "造旺本品"' },
    ],
    metricValue: '关注造旺主营产品业绩达成，提升业绩体量',
    calculationMethod: '造旺本品；当时产品组；现金业绩+旺金币业绩',
    calculationLogic: '统计期内盘价业绩-关联到原订单的退货盘价业绩；造旺本品；现金业绩+旺金币业绩',
  },
  {
    id: 'metric_panjiayeji_target_rate',
    name: '盘价业绩目标达成率',
    displayName: '业绩达成率',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '业绩域',
    system: 'Metrics',
    owner: '数据产品',
    description: '盘价业绩目标达成率指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '业绩', '达成率'],
    sensitivity: 'P2',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 80,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'achievement_rate', type: 'decimal(5,2)', comment: '达成率（百分比）' },
      { name: 'logic', type: 'string', comment: '计算逻辑：actual_performance / target_performance' },
    ],
    metricValue: '时刻提醒业务总体目标达成情况，提升业绩',
    calculationMethod: '业绩与目标均不包含旺旺经典品项',
    calculationLogic: '盘价业绩/盘价业绩目标',
  },
  {
    id: 'metric_trading_customer_cnt_new',
    name: '交易客户数',
    displayName: '交易客户数',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '客户域',
    system: 'Metrics',
    owner: '数据产品',
    description: '交易客户数指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '客户', '交易'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 78,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'customer_cnt', type: 'bigint', comment: '交易客户数' },
      { name: 'logic', type: 'string', comment: '计算逻辑：COUNT(DISTINCT customer_id) WHERE order_cnt > 0' },
    ],
    metricValue: '分析当前交易客户数，改善客户开发及引导下单动作，增加客户数，提升业绩体量',
    calculationMethod: '1、盘价业绩>0；2、所有业务人员，不需筛选人员身份，取memberkey去重计数',
    calculationLogic: '统计期内业绩>0的业务人数；零食系统组和直营组客户指系统',
  },
  {
    id: 'metric_avg_order_value',
    name: '客单价',
    displayName: '客单价',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '交易域',
    system: 'Metrics',
    owner: '数据产品',
    description: '客单价指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '交易', '客单价'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 75,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'avg_value', type: 'decimal(10,2)', comment: '平均客单价' },
      { name: 'logic', type: 'string', comment: '计算逻辑：SUM(gmv) / COUNT(DISTINCT customer_id)' },
    ],
    metricValue: '提升客户下单金额、提升业绩体量',
    calculationMethod: '',
    calculationLogic: '盘价业绩/交易客户数；零食系统组和直营组客户指系统',
  },
  {
    id: 'metric_new_customer_cnt',
    name: '新客户数',
    displayName: '新客户数',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '客户域',
    system: 'Metrics',
    owner: '数据产品',
    description: '新客户数指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '客户', '新增'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 76,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'new_customer_cnt', type: 'bigint', comment: '新客户数' },
      { name: 'logic', type: 'string', comment: '计算逻辑：COUNT(DISTINCT customer_id) WHERE registration_date >= biz_date' },
    ],
    metricValue: '分析当前新客户数，改善客户开发动作，增加客户数，提升业绩体量',
    calculationMethod: '1、盘价业绩>0；2、所有业务人员，不需筛选人员身份，取memberkey去重计数；3、分组按照分组计算，全组按照不分组计算',
    calculationLogic: '统计期内首次下单，且之前未下过单的业务人数；零食系统组和直营组客户指系统',
  },
  {
    id: 'metric_old_customer_cnt',
    name: '老客户数',
    displayName: '老客户数',
    type: 'METRIC',
    assetCategory: 'METRIC',
    domain: '客户域',
    system: 'Metrics',
    owner: '数据产品',
    description: '老客户数指标，基于 ads_bigtable_organization 计算。',
    tags: ['指标', '客户', '存量'],
    sensitivity: 'P3',
    status: 'ACTIVE',
    updateFreq: 'DAILY',
    qualityScore: 77,
    createdAt: nowISO(),
    updatedAt: nowISO(),
    fields: [
      { name: 'biz_date', type: 'date', comment: '业务日期' },
      { name: 'old_customer_cnt', type: 'bigint', comment: '老客户数' },
      { name: 'logic', type: 'string', comment: '计算逻辑：COUNT(DISTINCT customer_id) WHERE registration_date < biz_date' },
    ],
    metricValue: '分析老客户开发维护经验，帮助新客户开发，提升业绩体量',
    calculationMethod: '1、盘价业绩>0；2、所有业务人员，不需筛选人员身份，取memberkey去重计数；3、分组按照分组计算，全组按照不分组计算',
    calculationLogic: '统计期内下单，且统计期内之前下过单的业务人数；零食系统组和直营组客户指系统',
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
