import React, { useState, useEffect } from 'react'
import {
  PageContainer,
  StatisticCard,
  ProCard,
  Trend,
  ProList,
  Tag,
  Space,
  Button,
} from '@ant-design/pro-components'
import { ArrowUpOutlined, ArrowDownOutlined, AppstoreOutlined, WarningOutlined, BugOutlined, RiseOutlined } from '@ant-design/icons'
import { Badge, Avatar, List } from 'antd'
import api from '../services/api'

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    online: 0,
    warning: 0,
    error: 0,
    tasks: 0,
  })

  const [recentAlerts, setRecentAlerts] = useState<any[]>([])
  const [recentApps, setRecentApps] = useState<any[]>([])

  // 获取统计数据
  const fetchStats = async () => {
    try {
      // 获取告警统计
      const alertStats = await api.get('/api/alert/stats')
      
      // 暂时模拟应用统计，后面对接真实API
      const agentStats = {
        total: 5,
        running: 4,
      }

      setStats({
        total: agentStats.total || 0,
        online: agentStats.running || 0,
        warning: alertStats.warning || 0,
        error: alertStats.critical || alertStats.error || 0,
        tasks: 1234,
      })
    } catch (error) {
      console.error('获取统计数据失败：', error)
    }
  }

  // 获取最近告警
  const fetchRecentAlerts = async () => {
    try {
      const alerts = await api.get('/api/alert/list', {
        params: {
          status: 'pending',
        },
      })
      setRecentAlerts((alerts as any[]).slice(0, 5))
    } catch (error) {
      console.error('获取最近告警失败：', error)
    }
  }

  // 获取最近接入的应用（模拟数据）
  const fetchRecentApps = () => {
    const mockApps = [
      {
        id: 'agent-1',
        name: '订单服务',
        ip: '192.168.1.101',
        status: 'online',
        time: '5分钟前',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=order',
      },
      {
        id: 'agent-2',
        name: '支付服务',
        ip: '192.168.1.102',
        status: 'online',
        time: '10分钟前',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=pay',
      },
      {
        id: 'agent-3',
        name: '用户服务',
        ip: '192.168.1.103',
        status: 'warning',
        time: '15分钟前',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=user',
      },
      {
        id: 'agent-4',
        name: '商品服务',
        ip: '192.168.1.104',
        status: 'error',
        time: '30分钟前',
        avatar: 'https://api.dicebear.com/7.x/identicon/svg?seed=product',
      },
    ]
    setRecentApps(mockApps)
  }

  // 页面加载时获取数据
  useEffect(() => {
    fetchStats()
    fetchRecentAlerts()
    fetchRecentApps()
    
    // 每隔30秒刷新一次
    const interval = setInterval(() => {
      fetchStats()
      fetchRecentAlerts()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  // 状态对应的颜色
  const statusColors: Record<string, string> = {
    online: 'success',
    offline: 'default',
    warning: 'warning',
    error: 'error',
  }

  return (
    <PageContainer
      header={{
        title: '总览',
        subTitle: '系统运行状态总览',
      }}
    >
      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatisticCard
          title="接入应用总数"
          value={stats.total}
          icon={<AppstoreOutlined />}
          suffix="个"
          trend={<Trend up>较昨日 +2</Trend>}
        />
        <StatisticCard
          title="在线应用"
          value={stats.online}
          valueStyle={{ color: '#3f8600' }}
          suffix="个"
          trend={<Trend up>在线率 {stats.total > 0 ? Math.round(stats.online / stats.total * 100) : 0}%</Trend>}
        />
        <StatisticCard
          title="告警数"
          value={stats.warning + stats.error}
          valueStyle={{ color: '#cf1322' }}
          icon={<WarningOutlined />}
          trend={<Trend down>较昨日 -3</Trend>}
        />
        <StatisticCard
          title="诊断任务数"
          value={stats.tasks}
          icon={<BugOutlined />}
          suffix="次"
          trend={<Trend up>今日 +156</Trend>}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 最近告警 */}
        <ProCard 
          title="最近告警" 
          extra={<Button type="link" onClick={() => window.location.href = '/alert'}>查看全部</Button>}
        >
          {recentAlerts.length > 0 ? (
            <List
              dataSource={recentAlerts}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button type="link" size="small" href={`/alert`}>处理</Button>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Badge status={statusColors[item.level]} />}
                    title={
                      <Space>
                        <span>{item.title}</span>
                        <Tag color={statusColors[item.level]} size="small">
                          {item.level === 'warning' ? '警告' : item.level === 'error' ? '错误' : '严重'}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div className="text-sm text-gray-500">
                        <span>{item.appName} ({item.agentId})</span>
                        <span className="ml-4">{item.alertTime}</span>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <div className="text-center py-8 text-gray-400">
              暂无未处理告警
            </div>
          )}
        </ProCard>

        {/* 最近接入应用 */}
        <ProCard 
          title="最近接入应用" 
          extra={<Button type="link" onClick={() => window.location.href = '/app'}>查看全部</Button>}
        >
          <ProList
            dataSource={recentApps}
            metas={{
              avatar: {},
              title: {},
              description: {},
              actions: {},
            }}
            renderItem={(item) => (
              <ProList.Item
                actions={[
                  <Button type="link" size="small" onClick={() => window.location.href = `/diagnose?agentId=${item.id}`}>诊断</Button>
                ]}
              >
                <ProList.Item.Meta
                  avatar={<Avatar src={item.avatar} size="small" />}
                  title={
                    <Space>
                      <span>{item.name}</span>
                      <Badge status={statusColors[item.status]} text={item.status === 'online' ? '在线' : item.status === 'warning' ? '警告' : '异常'} />
                    </Space>
                  }
                  description={
                    <div className="text-sm text-gray-500">
                      <span>{item.ip}</span>
                      <span className="ml-4">{item.time}接入</span>
                    </div>
                  }
                />
              </ProList.Item>
            )}
          />
        </ProCard>
      </div>

      {/* 资源使用趋势图（后续对接监控数据） */}
      <ProCard title="系统资源使用趋势" className="mt-4">
        <div className="h-64 flex items-center justify-center text-gray-400">
          <RiseOutlined className="text-4xl mr-2" />
          监控图表功能开发中，后续对接Prometheus指标
        </div>
      </ProCard>
    </PageContainer>
  )
}

export default Dashboard
