import React from 'react'
import { Tag } from 'antd'
import type { Asset, AssetCategory } from '../types/models'

export const assetCategoryLabels: Record<AssetCategory, string> = {
  RAW: 'RAW 原始',
  CURATED: '结果数据',
  MDM: '主数据',
  DIM: '维度数据',
  SERVING: '服务交付',
  METRIC: '指标资产',
  SEMANTIC: '语义资产',
  SANDBOX: '临时/实验',
}

export function inferAssetCategory(asset: Partial<Asset>): AssetCategory {
  const name = String(asset?.name ?? '').toLowerCase()
  const cat = asset?.assetCategory as AssetCategory | undefined
  if (cat) return cat

  // serving
  if (name.startsWith('api_') || name.includes('/api') || name.includes('http')) return 'SERVING'
  // mdm
  if (name.startsWith('mdm_') || name.includes('golden_') || name.includes('mdm')) return 'MDM'
  // raw
  if (name.startsWith('ods_') || name.includes('event_') || name.includes('log_')) return 'RAW'
  // dim
  if (name.startsWith('dim_') || name.endsWith('_dim')) return 'DIM'
  // metric/semantic/sandbox
  if (name.startsWith('metric_')) return 'METRIC'
  if (name.includes('dataset') || name.includes('semantic')) return 'SEMANTIC'
  if (name.startsWith('tmp_') || name.includes('sandbox')) return 'SANDBOX'

  return 'CURATED'
}

export function assetCategoryColor(cat: AssetCategory) {
  switch (cat) {
    case 'RAW':
      return 'blue'
    case 'CURATED':
      return 'green'
    case 'MDM':
      return 'gold'
    case 'DIM':
      return 'purple'
    case 'SERVING':
      return 'cyan'
    case 'METRIC':
      return 'volcano'
    case 'SEMANTIC':
      return 'geekblue'
    case 'SANDBOX':
    default:
      return 'default'
  }
}

export function assetCategoryTag(assetOrCat: Partial<Asset> | AssetCategory) {
  const cat: AssetCategory = typeof assetOrCat === 'string' ? assetOrCat : inferAssetCategory(assetOrCat)
  return <Tag color={assetCategoryColor(cat)}>{assetCategoryLabels[cat]}</Tag>
}

export const assetCategoryFilterOptions = (Object.keys(assetCategoryLabels) as AssetCategory[]).map((k) => ({
  text: assetCategoryLabels[k],
  value: k,
}))
