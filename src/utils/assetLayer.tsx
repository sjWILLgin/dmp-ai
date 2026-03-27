import React from 'react'
import { Tag } from 'antd'

export type AssetLayer = 'ODS' | 'DWD' | 'DWS' | 'ADS' | 'MDM' | 'DIM' | 'OTHER'

export const layerOptions = [
  { label: 'ODS 原始层', value: 'ODS' },
  { label: 'DWD 明细层', value: 'DWD' },
  { label: 'DWS 汇总层', value: 'DWS' },
  { label: 'ADS 应用层', value: 'ADS' },
  { label: 'MDM 主数据', value: 'MDM' },
  { label: 'DIM 维度', value: 'DIM' },
  { label: 'OTHER 其他', value: 'OTHER' }
]

export function inferLayerByName(name?: string): AssetLayer {
  const n = (name || '').toLowerCase()
  if (n.startsWith('ods_')) return 'ODS'
  if (n.startsWith('dwd_')) return 'DWD'
  if (n.startsWith('dws_')) return 'DWS'
  if (n.startsWith('ads_')) return 'ADS'
  if (n.startsWith('mdm_')) return 'MDM'
  if (n.startsWith('dim_')) return 'DIM'
  return 'OTHER'
}

export function layerTag(layer?: AssetLayer) {
  const v = layer || 'OTHER'
  const color =
    v === 'ODS' ? 'blue' :
    v === 'DWD' ? 'geekblue' :
    v === 'DWS' ? 'cyan' :
    v === 'ADS' ? 'green' :
    v === 'MDM' ? 'gold' :
    v === 'DIM' ? 'purple' : 'default'
  return <Tag color={color}>{v}</Tag>
}
