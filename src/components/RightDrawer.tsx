import { Drawer } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'
import AssetDetail from './asset/AssetDetail'
import ApplyAccessForm from './asset/ApplyAccessForm'
import ShareAssetPanel from './asset/ShareAssetPanel'

export default function RightDrawer() {
  const drawer = useAppStore((s) => s.drawer)
  const close = useAppStore((s) => s.closeDrawer)

  let title = '详情'
  let content: React.ReactNode = null

  if (drawer.mode === 'ASSET_DETAIL') {
    title = '资产详情'
    content = <AssetDetail assetId={drawer.payload?.assetId} />
  }

  if (drawer.mode === 'APPLY_ACCESS') {
    title = '申请使用'
    content = <ApplyAccessForm assetId={drawer.payload?.assetId} />
  }

  if (drawer.mode === 'SHARE_ASSET') {
    title = '分享与分发'
    content = <ShareAssetPanel assetId={drawer.payload?.assetId} />
  }

  return (
    <Drawer
      open={drawer.open}
      title={title}
      onClose={close}
      width={720}
      destroyOnClose
      styles={{ body: { padding: 16 } }}
    >
      {content}
    </Drawer>
  )
}
