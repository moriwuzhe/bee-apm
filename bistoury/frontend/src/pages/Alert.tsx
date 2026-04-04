import React, { useState, useEffect, useRef } from 'react'
import {
  PageContainer,
  ProCard,
  ProTable,
  ActionType,
  StatisticCard,
} from '@ant-design/pro-components'
import { Button, Tag, Space, Modal, Form, Input, Select, message, Badge, Alert as AntAlert } from 'antd'
import { CheckOutlined, CloseOutlined, BellOutlined, WarningOutlined } from '@ant-design/icons'
import api from '../services/api'
import type { ColumnType } from 'antd/es/table'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

// 告警类型定义
interface Alert {
  id: string
  level: 'info' | 'warning' | 'error' | 'critical'
  type: string
  title: string
  content: string
  agentId: string
  appName: string
  status: 'pending' | 'processing' | 'resolved' | 'ignored'
  alertTime: string
  resolveTime?: string
  resolveUser?: string
  remark?: string
  tags: string[]
}

// 告警级别对应的颜色
const levelColors = {
  info: 'blue',
  warning: 'gold',
  error: 'red',
  critical: 'purple',
}

// 状态对应的颜色
const statusColors = {
  pending: 'processing',
  processing: 'orange',
  resolved: 'success',
  ignored: 'default',
}

// 告警级别文字
const levelText = {
  info: '提示',
  warning: '警告',
  error: '错误',
  critical: '严重',
}

// 状态文字
const statusText = {
  pending: '待处理',
  processing: '处理中',
  resolved: '已解决',
  ignored: '已忽略',
}

const AlertPage: React.FC = () => {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [selectedLevel, setSelectedLevel] = useState<string>()
  const [selectedStatus, setSelectedStatus] = useState<string>()
  const [resolveModalVisible, setResolveModalVisible] = useState(false)
  const [ignoreModalVisible, setIgnoreModalVisible] = useState(false)
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null)
  const [form] = Form.useForm()
  const actionRef = useRef<ActionType>()
  const [stompClient, setStompClient] = useState<Client | null>(null)

  // 获取告警列表
  const fetchAlerts = async () => {
    try {
      const data = await api.get('/api/alert/list', {
        params: {
          level: selectedLevel,
          status: selectedStatus,
        },
      })
      setAlerts(data as Alert[])
    } catch (error) {
      message.error('获取告警列表失败：' + (error as Error).message)
    }
  }

  // 获取告警统计
  const fetchStats = async () => {
    try {
      const data = await api.get('/api/alert/stats')
      setStats(data as Record<string, number>)
    } catch (error) {
      console.error('获取告警统计失败：', error)
    }
  }

  // 初始化WebSocket连接，实时接收告警通知
  useEffect(() => {
    const socket = new SockJS('/api/ws')
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
    })

    client.onConnect = () => {
      console.log('告警WebSocket连接成功')
      // 订阅全局告警通知
      client.subscribe('/topic/notification', (message) => {
        message.info('新告警通知：' + message.body)
        fetchAlerts()
        fetchStats()
      })
    }

    client.activate()
    setStompClient(client)

    return () => {
      client.deactivate()
    }
  }, [])

  // 页面加载时获取数据
  useEffect(() => {
    fetchAlerts()
    fetchStats()
    // 每隔30秒刷新一次
    const interval = setInterval(() => {
      fetchAlerts()
      fetchStats()
    }, 30000)

    return () => clearInterval(interval)
  }, [selectedLevel, selectedStatus])

  // 处理告警
  const handleResolve = async (values: any) => {
    if (!currentAlert) return
    try {
      await api.post(`/api/alert/resolve/${currentAlert.id}`, null, {
        params: {
          resolveUser: values.resolveUser,
          remark: values.remark,
        },
      })
      message.success('告警已标记为已解决')
      setResolveModalVisible(false)
      form.resetFields()
      fetchAlerts()
      fetchStats()
    } catch (error) {
      message.error('操作失败：' + (error as Error).message)
    }
  }

  // 忽略告警
  const handleIgnore = async (values: any) => {
    if (!currentAlert) return
    try {
      await api.post(`/api/alert/ignore/${currentAlert.id}`, null, {
        params: {
          remark: values.remark,
        },
      })
      message.success('告警已忽略')
      setIgnoreModalVisible(false)
      form.resetFields()
      fetchAlerts()
      fetchStats()
    } catch (error) {
      message.error('操作失败：' + (error as Error).message)
    }
  }

  // 创建测试告警
  const handleCreateTestAlert = async () => {
    try {
      await api.post('/api/alert/test')
      message.success('测试告警创建成功')
      fetchAlerts()
      fetchStats()
    } catch (error) {
      message.error('创建失败：' + (error as Error).message)
    }
  }

  // 表格列定义
  const columns: ColumnType<Alert>[] = [
    {
      title: '级别',
      dataIndex: 'level',
      width: 80,
      render: (level) => (
        <Tag color={levelColors[level]}>
          {levelText[level]}
        </Tag>
      ),
      filters: Object.entries(levelText).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.level === value,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (status) => (
        <Tag color={statusColors[status]}>
          {statusText[status]}
        </Tag>
      ),
      filters: Object.entries(statusText).map(([value, text]) => ({ text, value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '应用名称',
      dataIndex: 'appName',
      width: 150,
    },
    {
      title: '告警标题',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: '告警内容',
      dataIndex: 'content',
      ellipsis: true,
    },
    {
      title: '标签',
      dataIndex: 'tags',
      width: 150,
      render: (tags) => (
        <>
          {tags?.map((tag) => (
            <Tag key={tag} size="small">{tag}</Tag>
          ))}
        </>
      ),
    },
    {
      title: '告警时间',
      dataIndex: 'alertTime',
      width: 180,
    },
    {
      title: '操作',
      width: 160,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<CheckOutlined />}
            onClick={() => {
              setCurrentAlert(record)
              setResolveModalVisible(true)
            }}
            disabled={record.status === 'resolved' || record.status === 'ignored'}
          >
            解决
          </Button>
          <Button
            type="link"
            size="small"
            danger
            icon={<CloseOutlined />}
            onClick={() => {
              setCurrentAlert(record)
              setIgnoreModalVisible(true)
            }}
            disabled={record.status === 'resolved' || record.status === 'ignored'}
          >
            忽略
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer
      header={{
        title: '告警中心',
        subTitle: '应用异常告警管理，实时接收和处理系统告警',
        extra: (
          <Space>
            <Button onClick={handleCreateTestAlert}>
              生成测试告警
            </Button>
            <Button type="primary" onClick={() => {
              fetchAlerts()
              fetchStats()
              message.success('刷新成功')
            }}>
              刷新
            </Button>
          </Space>
        ),
      }}
    >
      {/* 告警统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <StatisticCard
          title="总告警数"
          value={stats.total || 0}
          icon={<BellOutlined />}
          trend="up"
        />
        <StatisticCard
          title="待处理"
          value={stats.pending || 0}
          icon={<WarningOutlined />}
          valueStyle={{ color: stats.pending ? '#faad14' : undefined }}
        />
        <StatisticCard
          title="警告级别"
          value={stats.warning || 0}
          valueStyle={{ color: '#faad14' }}
        />
        <StatisticCard
          title="严重错误"
          value={stats.critical || 0}
          valueStyle={{ color: '#f5222d' }}
        />
      </div>

      {/* 告警列表 */}
      <ProCard>
        <ProTable<Alert>
          actionRef={actionRef}
          columns={columns}
          dataSource={alerts}
          rowKey="id"
          search={false}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
          }}
          toolBarRender={() => []}
        />
      </ProCard>

      {/* 解决告警弹窗 */}
      <Modal
        title="标记告警已解决"
        open={resolveModalVisible}
        onCancel={() => setResolveModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} onFinish={handleResolve} layout="vertical">
          <Form.Item
            name="resolveUser"
            label="处理人"
            rules={[{ required: true, message: '请输入处理人' }]}
          >
            <Input placeholder="请输入处理人姓名" />
          </Form.Item>
          <Form.Item
            name="remark"
            label="处理备注"
          >
            <Input.TextArea rows={3} placeholder="请输入处理说明（可选）" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 忽略告警弹窗 */}
      <Modal
        title="忽略告警"
        open={ignoreModalVisible}
        onCancel={() => setIgnoreModalVisible(false)}
        onOk={() => form.submit()}
      >
        <AntAlert
          message="忽略告警后将不再提示此告警，确认要忽略吗？"
          type="warning"
          showIcon
          className="mb-4"
        />
        <Form form={form} onFinish={handleIgnore} layout="vertical">
          <Form.Item
            name="remark"
            label="忽略原因"
          >
            <Input.TextArea rows={3} placeholder="请输入忽略原因（可选）" />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  )
}

export default AlertPage
