// 指标库-造旺指标库.xlsx mock 数据（部分示例）
// 实际可用 xlsx 解析工具批量生成
export const seedMetrics = [
  {
    id: 'metric_2', name: '实际仓库运费率', domain: '仓储管理', category: '费用', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '仓库运费/财务收入（去税）', desc: '运费和财务收入均不含调拨订单', tags: ['考核指标'], value: 2.1, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_3', name: '理论财务收入（去税）', domain: '仓储管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '元', calc: '标准盘价*箱数/（1+税率）', desc: '去除调拨订单', tags: ['一般指标'], value: 100000, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_4', name: '理论仓库运费率', domain: '仓储管理', category: '费用', level: '2级', type: '基础指标', status: '已上线', unit: '%', calc: '仓库运费/理论财务收入（去税）', desc: '运费和理论财务收入均不含调拨订单', tags: ['参考指标'], value: 1.8, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_8', name: '实际工厂运费率', domain: '仓储管理', category: '费用', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '集团分摊单箱运输成本*当月销售SKU箱数/财务收入（去税）', desc: '剔除调拨单、周边和文宣品，正向/逆向逻辑', tags: ['考核指标'], value: 2.5, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_14', name: '仓库平均发货时效', domain: '仓储管理', category: '服务', level: '2级', type: '基础指标', status: '已上线', unit: '小时', calc: '（订单发货时间-客户下单时间）的总和/当月发货订单总数', desc: '当月发货维度订单，去除未发货、已取消和交易关闭订单', tags: ['参考指标'], value: 12, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_19', name: '实际送货完美率', domain: '仓储管理', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '完美合单数/当月已发货总合单数', desc: '完美合单=未延误且无异常，去除取消/未收货/自提/快递/调拨订单', tags: ['考核指标'], value: 98.5, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_20', name: '理论送货完美率', domain: '仓储管理', category: '服务', level: '2级', type: '基础指标', status: '已上线', unit: '%', calc: '完美合单数/当月已发货总合单数', desc: '同上，延误原因不为不可抗力、客户原因、其他', tags: ['参考指标'], value: 97.2, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_21', name: '前端发货及时率', domain: '产销协调', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '交货单数量/采购单总数量', desc: '去除非食品：周边、文宣品、水神等', tags: ['一般指标'], value: 95.0, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_22', name: '供货达成率', domain: '产销协调', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '实际到货箱数/货需提报箱数', desc: '去除非食品：周边、文宣品、水神等', tags: ['一般指标'], value: 93.5, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_23', name: '周转天数', domain: '产销协调', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '天', calc: '在库库存箱数/滚动60天日均出库箱数', desc: '去除非食品：周边、文宣品、水神等', tags: ['一般指标'], value: 18, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_24', name: '上架率', domain: '产销协调', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '上架SKU数/总SKU数', desc: '常态库存箱数>常态日均销量或当日销量>常态日均销量', tags: ['一般指标'], value: 99.1, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_25', name: '订货到仓满足率', domain: '产销协调', category: '服务', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '按期到仓订单金额/订单总金额', desc: '去除非食品：周边、文宣品、水神等', tags: ['一般指标'], value: 92.8, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_27', name: 'A类品上架率', domain: '产销协调', category: '服务', level: '3级', type: '派生指标', status: '已上线', unit: '%', calc: 'A类品上架SKU数/总SKU数', desc: '去除标签为汰换的A类品', tags: ['一般指标'], value: 98.0, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_28', name: 'B类品上架率', domain: '产销协调', category: '服务', level: '2级', type: '派生指标', status: '已上线', unit: '%', calc: 'B类品上架SKU数/总SKU数', desc: '去除标签为A的B类品，去除当月新品', tags: ['一般指标'], value: 97.5, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_30', name: '造旺本品盘价业绩（当时）', domain: '营运管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '元', calc: '统计期内盘价业绩-关联到原订单的退货盘价业绩', desc: '造旺本品；现金业绩+旺金币业绩', tags: ['一般指标'], value: 500000, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_32', name: '盘价业绩目标达成率', domain: '营运管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '盘价业绩/盘价业绩目标', desc: '业绩与目标均不包含旺旺经典品项', tags: ['一般指标'], value: 88.6, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_33', name: '销售业绩', domain: '营运管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '元', calc: '合伙人售卖给客户的业绩', desc: '不含旺旺经典品项', tags: ['一般指标'], value: 600000, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_34', name: '利润额', domain: '营运管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '元', calc: '销售业绩-盘价业绩', desc: '不含旺旺经典品项', tags: ['一般指标'], value: 120000, updatedAt: '2026-03-31', warning: false
  },
  {
    id: 'metric_35', name: '订单去0利润率', domain: '营运管理', category: '销售', level: '1级', type: '基础指标', status: '已上线', unit: '%', calc: '利润额/盘价业绩', desc: '盘价业绩剔除整笔利润额为0的订单', tags: ['一般指标'], value: 20.5, updatedAt: '2026-03-31', warning: false
  }
]
