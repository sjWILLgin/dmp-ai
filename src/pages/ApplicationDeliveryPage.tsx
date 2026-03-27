import { Button, Card, Space, Table, Tag, Typography } from 'antd'
import React from 'react'
import { useAppStore } from '../store/useAppStore'

const { Title, Text } = Typography

export default function ApplicationDeliveryPage() {
  const applications = useAppStore((s) => s.applications)
  const assets = useAppStore((s) => s.assets)
  const setStatus = useAppStore((s) => s.setApplicationStatus)
  const addNotification = useAppStore((s) => s.addNotification)

  const rows = React.useMemo(() => {
    return applications.map((a) => {
      const asset = assets.find((x) => x.id === a.assetId)
      return { ...a, assetName: asset?.name ?? a.assetId, owner: asset?.owner ?? '-' }
    })
  }, [applications, assets])

  return (
    <div style={{ padding: 16 }}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>
            申请交付中心
          </Title>
          <Text type="secondary">雏形：申请单列表、审批动作（仅模拟）。</Text>
        </div>

        <Card size="small">
          <Table
            size="small"
            rowKey="id"
            dataSource={rows}
            columns={[
              { title: '申请单', dataIndex: 'id', width: 140 },
              { title: '资产', dataIndex: 'assetName' },
              { title: '申请人', dataIndex: 'applicant', width: 120 },
              { title: '权限', dataIndex: 'permission', width: 90 },
              { title: '资产Owner', dataIndex: 'owner', width: 120 },
              { title: '用途', dataIndex: 'useCase' },
              {
                title: '状态',
                dataIndex: 'status',
                width: 120,
                render: (v) => <Tag color={v === 'APPROVED' ? 'green' : v === 'REJECTED' ? 'red' : 'blue'}>{v}</Tag>,
              },
              {
                title: '操作',
                width: 200,
                render: (_, r) => (
                  <Space>
                    <Button
                      size="small"
                      disabled={r.status !== 'PENDING'}
                      onClick={() => {
                        setStatus(r.id, 'APPROVED')
                        addNotification(`申请单 ${r.id} 已批准`) 
                      }}
                    >
                      批准
                    </Button>
                    <Button
                      size="small"
                      danger
                      disabled={r.status !== 'PENDING'}
                      onClick={() => {
                        setStatus(r.id, 'REJECTED')
                        addNotification(`申请单 ${r.id} 已拒绝`)
                      }}
                    >
                      拒绝
                    </Button>
                  </Space>
                ),
              },
            ]}
          />
        </Card>
      </Space>
    </div>
  )
}
