import {
  BellOutlined,
  CloudServerOutlined,
  DatabaseOutlined,
  DeploymentUnitOutlined,
  FileSearchOutlined,
  IdcardOutlined,
  RadarChartOutlined,
  SettingOutlined,
  TagsOutlined,
} from '@ant-design/icons'
import { Badge, Dropdown, Input, Layout, Menu, Select, Space, Typography } from 'antd'
import type { MenuProps } from 'antd'
import React from 'react'
import { Link } from 'react-router-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import RightDrawer from '../components/RightDrawer'
import { useAppStore } from '../store/useAppStore'

const { Header, Sider, Content } = Layout
const { Title, Text } = Typography
const menuItems: MenuProps['items'] = [
  { key: '/map', icon: <DeploymentUnitOutlined />, label: '数据地图' },
  { key: '/assets', icon: <DatabaseOutlined />, label: '数据资产列表' },
  { key: '/metrics', icon: <RadarChartOutlined />, label: '指标总览' },
  // ✅ 新增：数据源与注册中心（指向实现中的 SourceRegistryPage）
  { key: '/source-registry', icon: <DatabaseOutlined />, label: <Link to="/source-registry">数据源与注册中心</Link> },
  { key: '/reports', icon: <RadarChartOutlined />, label: <Link to="/reports">报表概览</Link> },
  // 主数据中心
  { key: '/mdm', icon: <IdcardOutlined />, label: '主数据中心' },

  { key: '/governance', icon: <SettingOutlined />, label: '数据治理中心' },
  { key: '/tags', icon: <TagsOutlined />, label: '标签与画像中心' },
  { key: '/delivery', icon: <FileSearchOutlined />, label: '申请交付中心' },
  { key: '/value', icon: <RadarChartOutlined />, label: '价值运营中心' },
  { key: '/monitoring', icon: <BellOutlined />, label: '监控与告警中心' }
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate()
  const loc = useLocation()

  const me = useAppStore((s) => s.me)
  const users = useAppStore((s) => s.users)
  const globalSearch = useAppStore((s) => s.globalSearch)
  const setGlobalSearch = useAppStore((s) => s.setGlobalSearch)
  const setMe = useAppStore((s) => s.setMe)

  const notifications = useAppStore((s) => s.notifications)
  const markRead = useAppStore((s) => s.markNotificationRead)
  const unread = notifications.filter((n) => !n.read).length

  const notifMenu: MenuProps = {
    items: notifications.slice(0, 8).map((n) => ({
      key: n.id,
      label: (
        <div style={{ maxWidth: 320 }}>
          <div style={{ fontWeight: 600 }}>{n.title}</div>
          <div className="small-muted">{new Date(n.createdAt).toLocaleString()}</div>
        </div>
      ),
    })),
    onClick: ({ key }) => markRead(String(key)),
  }

  const selectedKeys = (() => {
    const found = (menuItems ?? []).find((x) => x && typeof x.key === 'string' && loc.pathname.startsWith(String(x.key)))
    return found && found.key ? [String(found.key)] : []
  })()

  return (
    <Layout className="app-shell">
      <Sider width={240} theme="light" style={{ borderRight: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ padding: 16 }}>
          <Title level={5} style={{ margin: 0 }}>
            数据资产管理平台
          </Title>
          <Text className="small-muted">前端雏形（可联动）</Text>
        </div>

        <Menu mode="inline" selectedKeys={selectedKeys} items={menuItems} onClick={({ key }) => nav(String(key))} />
      </Sider>

      <Layout>
        <Header style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)', padding: '0 16px' }}>
          <div className="flex-between" style={{ height: '100%' }}>
            <Space size={12} style={{ width: 720, maxWidth: '60vw' }}>
              <Input.Search
                value={globalSearch}
                allowClear
                placeholder="全局检索：资产名 / 域 / 系统 / owner / 标签（影响列表&详情等）"
                onChange={(e) => setGlobalSearch(e.target.value)}
                onSearch={() => nav('/assets')}
              />
            </Space>

            <Space size={12}>
              <Dropdown menu={notifMenu} trigger={['click']}>
                <Badge count={unread} size="small">
                  <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
                </Badge>
              </Dropdown>

              <Select
                size="small"
                value={me.name}
                style={{ width: 140 }}
                onChange={(v) => setMe(String(v))}
                options={users.map((u) => ({ label: `${u.name}（${u.role}）`, value: u.name }))}
              />
            </Space>
          </div>
        </Header>

        <Content style={{ overflow: 'auto' }}>{children}</Content>
      </Layout>

      <RightDrawer />
    </Layout>
  )
}
