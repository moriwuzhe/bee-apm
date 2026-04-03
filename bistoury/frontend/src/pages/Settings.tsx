import React, { useState } from 'react'
import {
  PageContainer,
  ProForm,
  ProFormText,
  ProFormSwitch,
  ProFormSelect,
  ProFormDigit,
  ProCard,
  Button,
  message,
  Space,
  Divider,
  Alert,
} from '@ant-design/pro-components'
import { SaveOutlined, SyncOutlined } from '@ant-design/icons'
import { Card, Tabs, Tag, Descriptions } from 'antd'
import api from '../services/api'

const { TabPane } = Tabs

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState('system')
  const [form] = ProForm.useForm()

  // 模拟系统配置
  const systemConfig = {
    siteName: 'Bistoury诊断平台',
    siteUrl: 'http://bistoury.example.com',
    defaultLanguage: 'zh-CN',
    enableRegistration: false,
    defaultTimeout: 30,
    maxConcurrentTasks: 10,
    enableAiDiagnose: true,
    aiApiKey: '**********',
    aiApiUrl: 'https://ark.cn-beijing.volces.com.com/api/v3/chat/completions',
    aiModel: 'doubao-seed-2.0-pro',
    enableAlert: true,
    alertDingtalkEnabled: false,
    alertWechatEnabled: true,
    alertEmailEnabled: true,
    alertWechatWebhook: 'https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxx',
    alertEmailSmtp: 'smtp.example.com',
    alertEmailPort: 465,
    alertEmailUsername: 'alert@example.com',
    alertEmailPassword: '**********',
    agentHeartbeatTimeout: 60,
    agentAutoRegister: true,
    agentAllowList: ['192.168.0.0/16', '10.0.0.0/8'],
  }

  // 保存配置
  const handleSave = async (values: any) => {
    try {
      console.log('保存配置：', values)
      // 调用保存API
      message.success('配置保存成功')
    } catch (error) {
      message.error('保存失败：' + (error as Error).message)
    }
  }

  // 系统信息
  const systemInfo = {
    version: '2.0.7',
    buildTime: '2026-03-30 10:00:00',
    jdkVersion: '11.0.18',
    os: 'Linux 4.18.0-305.el8.x86_64',
    cpu: '8核',
    memory: '16GB',
    uptime: '72小时30分钟',
    agentCount: '5个',
    totalDiagnoseTasks: '1234次',
  }

  return (
    <PageContainer
      header={{
        title: '系统设置',
        subTitle: '配置平台全局参数和功能开关',
      }}
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="系统设置" key="system">
          <ProCard title="基础设置" className="mb-4">
            <ProForm
              form={form}
              initialValues={systemConfig}
              onFinish={handleSave}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
            >
              <ProFormText
                name="siteName"
                label="站点名称"
                placeholder="请输入站点名称"
                rules={[{ required: true, message: '请输入站点名称' }]}
              />
              <ProFormText
                name="siteUrl"
                label="站点地址"
                placeholder="请输入站点访问地址"
                rules={[{ required: true, message: '请输入站点地址' }]}
              />
              <ProFormSelect
                name="defaultLanguage"
                label="默认语言"
                options={[
                  { label: '简体中文', value: 'zh-CN' },
                  { label: 'English', value: 'en-US' },
                ]}
              />
              <ProFormSwitch
                name="enableRegistration"
                label="开放注册"
              />
              <ProFormDigit
                name="defaultTimeout"
                label="命令默认超时时间(秒)"
                min={10}
                max={300}
              />
              <ProFormDigit
                name="maxConcurrentTasks"
                label="最大并发诊断任务数"
                min={1}
                max={100}
              />
              <Divider />
              <ProForm.Item wrapperCol={{ offset: 6, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存配置
                  </Button>
                  <Button icon={<SyncOutlined />} onClick={() => form.resetFields()}>
                    重置
                  </Button>
                </Space>
              </ProForm.Item>
            </ProForm>
          </ProCard>

          <ProCard title="AI诊断配置">
            <ProForm
              form={form}
              initialValues={systemConfig}
              onFinish={handleSave}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
            >
              <ProFormSwitch
                name="enableAiDiagnose"
                label="启用AI诊断"
              />
              <ProFormText.Password
                name="aiApiKey"
                label="API Key"
                placeholder="请输入大模型API Key"
                rules={[{ required: true, message: '请输入API Key' }]}
                fieldProps={{
                  autoComplete: 'new-password',
                }}
              />
              <ProFormText
                name="aiApiUrl"
                label="API地址"
                placeholder="请输入大模型API地址"
              />
              <ProFormText
                name="aiModel"
                label="模型名称"
                placeholder="请输入模型名称"
              />
              <Alert
                message="配置说明"
                description="支持所有兼容OpenAI协议的大模型，包括字节跳动豆包、OpenAI GPT、通义千问、文心一言等。"
                type="info"
                showIcon
                className="mb-4"
              />
              <ProForm.Item wrapperCol={{ offset: 6, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存配置
                  </Button>
                </Space>
              </ProForm.Item>
            </ProForm>
          </ProCard>
        </TabPane>

        <TabPane tab="告警配置" key="alert">
          <ProCard title="全局告警设置" className="mb-4">
            <ProForm
              form={form}
              initialValues={systemConfig}
              onFinish={handleSave}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
            >
              <ProFormSwitch
                name="enableAlert"
                label="启用告警功能"
              />
              <Divider>通知渠道</Divider>
              <ProFormSwitch
                name="alertWechatEnabled"
                label="企业微信告警"
              />
              <ProFormText
                name="alertWechatWebhook"
                label="企业微信Webhook"
                placeholder="请输入企业微信机器人Webhook地址"
                disabled={!form.getFieldValue('alertWechatEnabled')}
              />
              <ProFormSwitch
                name="alertDingtalkEnabled"
                label="钉钉告警"
              />
              <ProFormText
                name="alertDingtalkWebhook"
                label="钉钉Webhook"
                placeholder="请输入钉钉机器人Webhook地址"
                disabled={!form.getFieldValue('alertDingtalkEnabled')}
              />
              <ProFormSwitch
                name="alertEmailEnabled"
                label="邮件告警"
              />
              <ProFormText
                name="alertEmailSmtp"
                label="SMTP服务器"
                placeholder="smtp.example.com"
                disabled={!form.getFieldValue('alertEmailEnabled')}
              />
              <ProFormDigit
                name="alertEmailPort"
                label="SMTP端口"
                min={1}
                max={65535}
                disabled={!form.getFieldValue('alertEmailEnabled')}
              />
              <ProFormText
                name="alertEmailUsername"
                label="邮箱账号"
                placeholder="alert@example.com"
                disabled={!form.getFieldValue('alertEmailEnabled')}
              />
              <ProFormText.Password
                name="alertEmailPassword"
                label="邮箱密码"
                disabled={!form.getFieldValue('alertEmailEnabled')}
                fieldProps={{
                  autoComplete: 'new-password',
                }}
              />
              <ProForm.Item wrapperCol={{ offset: 6, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存配置
                  </Button>
                </Space>
              </ProForm.Item>
            </ProForm>
          </ProCard>
        </TabPane>

        <TabPane tab="Agent配置" key="agent">
          <ProCard title="Agent接入设置">
            <ProForm
              form={form}
              initialValues={systemConfig}
              onFinish={handleSave}
              layout="horizontal"
              labelCol={{ span: 6 }}
              wrapperCol={{ span: 16 }}
            >
              <ProFormSwitch
                name="agentAutoRegister"
                label="允许Agent自动注册"
              />
              <ProFormDigit
                name="agentHeartbeatTimeout"
                label="Agent心跳超时时间(秒)"
                min={10}
                max={300}
              />
              <ProFormTextArea
                name="agentAllowList"
                label="Agent接入IP白名单"
                placeholder="请输入允许接入的IP段，每行一个，例如：192.168.0.0/16"
                fieldProps={{
                  rows: 4,
                }}
              />
              <Alert
                message="安全提示"
                description="建议配置IP白名单，只允许信任的服务器接入，避免未授权访问。"
                type="warning"
                showIcon
                className="mb-4"
              />
              <ProForm.Item wrapperCol={{ offset: 6, span: 16 }}>
                <Space>
                  <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                    保存配置
                  </Button>
                </Space>
              </ProForm.Item>
            </ProForm>
          </ProCard>
        </TabPane>

        <TabPane tab="系统信息" key="info">
          <ProCard title="系统信息">
            <Descriptions bordered column={2}>
              <Descriptions.Item label="系统版本">{systemInfo.version}</Descriptions.Item>
              <Descriptions.Item label="构建时间">{systemInfo.buildTime}</Descriptions.Item>
              <Descriptions.Item label="JDK版本">{systemInfo.jdkVersion}</Descriptions.Item>
              <Descriptions.Item label="操作系统">{systemInfo.os}</Descriptions.Item>
              <Descriptions.Item label="CPU">{systemInfo.cpu}</Descriptions.Item>
              <Descriptions.Item label="内存">{systemInfo.memory}</Descriptions.Item>
              <Descriptions.Item label="运行时间">{systemInfo.uptime}</Descriptions.Item>
              <Descriptions.Item label="接入Agent数量">{systemInfo.agentCount}</Descriptions.Item>
              <Descriptions.Item label="总诊断任务数">{systemInfo.totalDiagnoseTasks}</Descriptions.Item>
              <Descriptions.Item label="开源地址" span={2}>
                <a href="https://github.com/moriwuzhe/bistoury" target="_blank" rel="noopener noreferrer">
                  https://github.com/moriwuzhe/bistoury
                </a>
                <Tag color="blue" className="ml-2">欢迎Star支持</Tag>
              </Descriptions.Item>
            </Descriptions>
          </ProCard>
        </TabPane>
      </Tabs>
    </PageContainer>
  )
}

export default Settings
