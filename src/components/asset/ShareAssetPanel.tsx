import { Button, Card, Input, Space, Tag, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../../store/useAppStore'

const { Paragraph, Text } = Typography

export default function ShareAssetPanel({ assetId }: { assetId?: string }) {
  const assets = useAppStore((s) => s.assets)
  const addNotification = useAppStore((s) => s.addNotification)

  const asset = assets.find((a) => a.id === assetId)
  if (!assetId || !asset) return <Text type="secondary">未选择资产。</Text>

  const shareLink = `https://datahub.local/asset/${asset.id}`

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Card size="small" title="分享链接">
        <Space.Compact style={{ width: '100%' }}>
          <Input value={shareLink} readOnly />
          <Button
            onClick={() => {
              navigator.clipboard?.writeText(shareLink)
              addNotification(`已复制分享链接：${asset.name}`)
            }}
          >
            复制
          </Button>
        </Space.Compact>
        <Paragraph className="small-muted" style={{ marginBottom: 0, marginTop: 8 }}>
          雏形：后续可接入权限校验、外部分享有效期、审批流。
        </Paragraph>
      </Card>

      <Card size="small" title="中间分发（占位）">
        <Space wrap>
          <Tag>API 分发</Tag>
          <Tag>数据集订阅</Tag>
          <Tag>导出到文件</Tag>
          <Tag>下游系统推送</Tag>
        </Space>
        <Paragraph className="small-muted" style={{ marginBottom: 0, marginTop: 8 }}>
          你提到“别人怎么用我的数据做中间分发”，这里后续可以拆成：分发通道、权限策略、审计、SLA、回执。
        </Paragraph>
      </Card>
    </Space>
  )
}
