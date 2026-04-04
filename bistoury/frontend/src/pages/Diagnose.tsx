import React, { useState, useEffect, useRef } from 'react'
import {
  PageContainer,
  ProFormSelect,
  ProFormTextArea,
  ModalForm,
  ProCard,
  ProTable,
  ActionType,
} from '@ant-design/pro-components'
import { Button, Select, Space, Tag, message, Alert, Empty } from 'antd'
import { PlayCircleOutlined, HistoryOutlined, ClearOutlined } from '@ant-design/icons'
import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { api } from '../services/api'
import type { ColumnType } from 'antd/es/table'

// 命令历史记录类型
interface CommandHistory {
  id: string
  agentId: string
  agentName: string
  command: string
  status: 'success' | 'running' | 'failed'
  result: string
  submitTime: string
  costTime?: number
}

// 已接入的应用列表
const agentList = [
  { label: '订单服务 (192.168.1.101)', value: 'agent-1' },
  { label: '支付服务 (192.168.1.102)', value: 'agent-2' },
  { label: '用户服务 (192.168.1.103)', value: 'agent-3' },
  { label: '商品服务 (192.168.1.104)', value: 'agent-4' },
  { label: '网关服务 (192.168.1.105)', value: 'agent-5' },
]

// 常用命令模板
const commandTemplates = [
  { label: '线程统计', value: 'thread' },
  { label: 'JVM内存', value: 'jvm' },
  { label: '方法追踪', value: 'trace com.example.service.OrderService.createOrder' },
  { label: '方法耗时', value: 'watch com.example.service.OrderService.createOrder' },
  { label: '堆内存dump', value: 'heapdump' },
  { label: '查看环境变量', value: 'env' },
  { label: '查看系统属性', value: 'sysprop' },
]

const Diagnose: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>()
  const [command, setCommand] = useState<string>('')
  const [commandResult, setCommandResult] = useState<string>('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [history, setHistory] = useState<CommandHistory[]>([])
  const [stompClient, setStompClient] = useState<Client | null>(null)
  const actionRef = useRef<ActionType>()
  const resultRef = useRef<HTMLDivElement>(null)

  // 初始化WebSocket连接
  useEffect(() => {
    const socket = new SockJS('/api/ws')
    const client = new Client({
      webSocketFactory: () => socket,
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    })

    client.onConnect = () => {
      console.log('WebSocket连接成功')
      message.success('WebSocket连接成功，命令结果将实时推送')
    }

    client.onDisconnect = () => {
      console.log('WebSocket断开连接')
      message.error('WebSocket断开连接，将自动重连')
    }

    client.activate()
    setStompClient(client)

    return () => {
      client.deactivate()
    }
  }, [])

  // 执行诊断命令
  const handleExecute = async () => {
    if (!selectedAgent) {
      message.error('请先选择目标应用')
      return
    }
    if (!command?.trim()) {
      message.error('请输入要执行的命令')
      return
    }

    setIsExecuting(true)
    setCommandResult('命令执行中，请稍候...\n')

    try {
      // 提交命令到后端
      const taskId = await api.post('/api/diagnose/command', {
        agentId: selectedAgent,
        command: command.trim(),
      })

      // 订阅该任务的执行结果
      stompClient?.subscribe(`/topic/command/${taskId}`, (message) => {
        const result = message.body
        setCommandResult(prev => prev + result)
        setIsExecuting(false)
        
        // 添加到历史记录
        const newHistory: CommandHistory = {
          id: taskId,
          agentId: selectedAgent,
          agentName: agentList.find(a => a.value === selectedAgent)?.label || '',
          command: command.trim(),
          status: 'success',
          result: result,
          submitTime: new Date().toLocaleString(),
          costTime: 1000,
        }
        setHistory(prev => [newHistory, ...prev])
        
        // 滚动到底部
        setTimeout(() => {
          resultRef.current?.scrollIntoView({ behavior: 'smooth' })
        }, 100)
      })

    } catch (error) {
      message.error('命令执行失败：' + (error as Error).message)
      setIsExecuting(false)
      setCommandResult(prev => prev + '\n执行失败：' + (error as Error).message)
    }
  }

  // 选择历史命令
  const handleSelectHistory = (record: CommandHistory) => {
    setSelectedAgent(record.agentId)
    setCommand(record.command)
    setCommandResult(record.result)
  }

  // 清空结果
  const handleClear = () => {
    setCommandResult('')
  }

  // 表格列定义
  const columns: ColumnType<CommandHistory>[] = [
    {
      title: '应用名称',
      dataIndex: 'agentName',
      width: 200,
    },
    {
      title: '命令内容',
      dataIndex: 'command',
      ellipsis: true,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (status) => (
        <Tag color={status === 'success' ? 'success' : status === 'running' ? 'processing' : 'error'}>
          {status === 'success' ? '成功' : status === 'running' ? '执行中' : '失败'}
        </Tag>
      ),
    },
    {
      title: '提交时间',
      dataIndex: 'submitTime',
      width: 180,
    },
    {
      title: '耗时',
      dataIndex: 'costTime',
      width: 100,
      render: (cost) => cost ? `${cost}ms` : '-',
    },
    {
      title: '操作',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleSelectHistory(record)}>
            查看
          </Button>
          <Button type="link" size="small" onClick={() => {
            setSelectedAgent(record.agentId)
            setCommand(record.command)
          }}>
            重执行
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer
      header={{
        title: '诊断中心',
        subTitle: '在线诊断Java应用，支持Arthas全量命令',
      }}
    >
      <div className="grid grid-cols-12 gap-4">
        {/* 左侧命令执行区 */}
        <div className="col-span-8">
          <ProCard
            title="命令执行"
            extra={
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={isExecuting}
                  onClick={handleExecute}
                >
                  执行命令
                </Button>
                <Button icon={<ClearOutlined />} onClick={handleClear}>
                  清空
                </Button>
              </Space>
            }
          >
            <div className="mb-4 flex gap-4 items-center">
              <div className="w-80">
                <Select
                  placeholder="选择目标应用"
                  value={selectedAgent}
                  onChange={setSelectedAgent}
                  options={agentList}
                  style={{ width: '100%' }}
                />
              </div>
              <div className="flex-1">
                <Select
                  placeholder="选择常用命令模板"
                  onChange={(value) => setCommand(value)}
                  options={commandTemplates}
                  style={{ width: '100%' }}
                  allowClear
                />
              </div>
            </div>

            <ProFormTextArea
              name="command"
              label="命令内容"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="请输入要执行的Arthas命令，例如：thread、jvm、trace 类名.方法名"
              rows={4}
              fieldProps={{
                onPressEnter: (e) => {
                  if (!e.shiftKey) {
                    e.preventDefault()
                    handleExecute()
                  }
                },
              }}
            />

            <div className="mt-4">
              <div className="mb-2 font-medium">执行结果</div>
              <div
                className="bg-gray-900 text-green-400 p-4 rounded-lg h-96 overflow-y-auto font-mono text-sm whitespace-pre-wrap"
                ref={resultRef}
              >
                {commandResult || <Empty description="暂无执行结果" image={Empty.PRESENTED_IMAGE_SIMPLE} />}
              </div>
            </div>
          </ProCard>
        </div>

        {/* 右侧历史记录区 */}
        <div className="col-span-4">
          <ProCard title="历史命令" icon={<HistoryOutlined />}>
            <ProTable<CommandHistory>
              actionRef={actionRef}
              columns={columns}
              dataSource={history}
              rowKey="id"
              search={false}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
              }}
              toolBarRender={() => []}
            />
          </ProCard>

          <ProCard title="使用说明" className="mt-4">
            <Alert
              message="常用命令说明"
              description={
                <div className="text-sm space-y-1 mt-2">
                  <div>• <code>thread</code>：查看线程统计信息</div>
                  <div>• <code>jvm</code>：查看JVM内存和GC信息</div>
                  <div>• <code>trace 类名.方法名</code>：追踪方法调用链路和耗时</div>
                  <div>• <code>watch 类名.方法名</code>：监控方法的入参和返回值</div>
                  <div>• <code>heapdump</code>：生成堆内存快照</div>
                  <div>• <code>ognl 表达式</code>：执行OGNL表达式</div>
                </div>
              }
              type="info"
              showIcon
            />
          </ProCard>
        </div>
      </div>
    </PageContainer>
  )
}

export default Diagnose
