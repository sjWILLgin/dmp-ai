import { Button, Form, Input, Select, Space, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../../store/useAppStore'

const { Text } = Typography

export default function ApplyAccessForm({ assetId }: { assetId?: string }) {
  const me = useAppStore((s) => s.me)
  const assets = useAppStore((s) => s.assets)
  const createApplication = useAppStore((s) => s.createApplication)
  const addNotification = useAppStore((s) => s.addNotification)
  const closeDrawer = useAppStore((s) => s.closeDrawer)

  const asset = assets.find((a) => a.id === assetId)

  const [form] = Form.useForm()

  if (!assetId || !asset) {
    return <Text type="secondary">未选择资产。</Text>
  }

  return (
    <div>
      <Text type="secondary">申请资产：{asset.name}</Text>
      <Form
        layout="vertical"
        form={form}
        style={{ marginTop: 12 }}
        initialValues={{ permission: 'READ', useCase: '分析/看板' }}
        onFinish={(v) => {
          createApplication({
            assetId: asset.id,
            applicant: me.name,
            permission: v.permission,
            useCase: v.useCase,
            status: 'PENDING',
          })
          addNotification(`收到新的申请：${me.name} 申请 ${asset.name}（${v.permission}）`)
          closeDrawer()
        }}
      >
        <Form.Item name="permission" label="权限" rules={[{ required: true }]}>
          <Select
            options={[
              { label: '只读 READ', value: 'READ' },
              { label: '写入 WRITE', value: 'WRITE' },
              { label: 'Owner OWNER', value: 'OWNER' },
            ]}
          />
        </Form.Item>

        <Form.Item name="useCase" label="用途说明" rules={[{ required: true, message: '请填写用途' }]}>
          <Input.TextArea rows={4} placeholder="例如：运营日报看板 / 系统对齐 / 模型训练数据等" />
        </Form.Item>

        <Space>
          <Button onClick={() => closeDrawer()}>取消</Button>
          <Button type="primary" htmlType="submit">
            提交申请
          </Button>
        </Space>
      </Form>
    </div>
  )
}
