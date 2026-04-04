import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Typography, Button, Tag } from 'antd'
import {
  DashboardOutlined,
  CloudServerOutlined,
  BugOutlined,
  SettingOutlined,
  NotificationOutlined,
} from '@ant-design/icons'

const { Header, Sider, Content } = Layout
const { Title } = Typography

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: '总览',
      onClick: () => navigate('/'),
    },
    {
      key: '/apps',
      icon: <CloudServerOutlined />,
      label: '应用管理',
      onClick: () => navigate('/apps'),
    },
    {
      key: '/diagnose',
      icon: <BugOutlined />,
      label: '诊断中心',
      onClick: () => navigate('/diagnose'),
    },
    {
      key: '/alert',
      icon: <NotificationOutlined />,
      label: '告警中心',
      onClick: () => navigate('/alert'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: '系统设置',
      onClick: () => navigate('/settings'),
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} theme="dark">
        <div className="h-16 flex items-center justify-center bg-blue-600">
          <Title level={4} className="text-white m-0">
            {collapsed ? 'B' : 'Bistoury'}
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
        />
      </Sider>
      <Layout>
        <Header className="bg-white px-6 flex items-center justify-between shadow-sm">
          <Button
            type="text"
            onClick={() => setCollapsed(!collapsed)}
            className="text-xl"
          >
            {collapsed ? '→' : '←'}
          </Button>
          <div className="flex items-center gap-4">
            <Tag color="green">v2.0.0 增强版</Tag>
            <span>admin</span>
          </div>
        </Header>
        <Content>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}