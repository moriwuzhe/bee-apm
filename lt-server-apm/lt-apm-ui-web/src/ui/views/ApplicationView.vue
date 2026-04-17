<template>
  <div class="application-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 应用定义 -->
      <el-tab-pane label="应用定义" name="definition">
        <div class="tab-content">
          <div class="page-head">
            <div class="title">应用定义管理</div>
            <div class="controls">
              <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
              <el-button type="primary" @click="showCreateDialog = true">新建应用</el-button>
            </div>
          </div>

          <el-table :data="applications" border stripe v-loading="loading" style="width: 100%">
            <el-table-column prop="appCode" label="应用编码" width="180" />
            <el-table-column prop="appName" label="应用名称" width="180" />
            <el-table-column prop="projectCode" label="所属项目编码" width="180" />
            <el-table-column prop="appType" label="应用类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.appType === 'agent-attached' ? 'primary' : 'info'">
                  {{ row.appType === 'agent-attached' ? 'Agent接入' : '自建' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="appSecretKey" label="应用密钥" width="280">
              <template #default="{ row }">
                <el-tag type="success">{{ row.appSecretKey }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 运行实例 -->
      <el-tab-pane label="运行实例" name="instances">
        <div class="instances-tab">
          <!-- 统计卡片 -->
          <div class="stats-cards">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #67c23a;">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ onlineCount }}</div>
                  <div class="stat-label">在线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #f56c6c;">
                  <el-icon><CircleClose /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ offlineCount }}</div>
                  <div class="stat-label">离线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #e6a23c;">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ alertedCount }}</div>
                  <div class="stat-label">活跃告警</div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="page-head">
            <div class="title">Agent 运行实例</div>
            <div class="controls">
              <el-button :loading="instancesLoading" type="primary" @click="loadInstances">刷新</el-button>
            </div>
          </div>

          <el-table :data="instances" border stripe v-loading="instancesLoading" style="width: 100%">
            <el-table-column prop="projectCode" label="项目" width="120" />
            <el-table-column prop="app" label="应用" width="150" />
            <el-table-column prop="inst" label="实例" width="120" />
            <el-table-column prop="ip" label="IP" width="140" />
            <el-table-column label="在线状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.online ? 'success' : 'danger'" size="small">
                  {{ row.online ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="告警状态" width="100">
              <template #default="{ row }">
                <el-tooltip v-if="isAlerted(row)" content="该 Agent 已触发离线告警" placement="top">
                  <el-badge is-dot type="danger" style="margin-right: 5px;">
                    <el-icon color="#f56c6c"><Bell /></el-icon>
                  </el-badge>
                </el-tooltip>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="最后心跳时间" width="180">
              <template #default="{ row }">
                {{ formatTimestamp(row.lastHeartbeatTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="120" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-dropdown trigger="click" @command="(cmd: string) => handleDiagCommand(cmd, row)">
                  <el-button type="primary" link size="small">
                    诊断 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="jvm">JVM信息</el-dropdown-item>
                      <el-dropdown-item command="thread">线程Dump</el-dropdown-item>
                      <el-dropdown-item command="memory">内存信息</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="900px">
      <!-- 图表模式 -->
      <div v-if="diagMode === 'chart' && currentDiagType" class="diag-chart-content">
        <!-- JVM信息图表 -->
        <div v-if="currentDiagType === 'jvmInfo'" class="chart-container">
          <el-row :gutter="16">
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">堆内存</div>
                <div class="stat-value">{{ formatBytes(jvmData.heapUsed) }}</div>
                <div class="stat-subtitle">/ {{ formatBytes(jvmData.heapMax) }}</div>
                <el-progress :percentage="jvmData.heapPercent" :color="getProgressColor(jvmData.heapPercent)" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">非堆内存</div>
                <div class="stat-value">{{ formatBytes(jvmData.nonHeapUsed) }}</div>
                <div class="stat-subtitle">/ {{ formatBytes(jvmData.nonHeapMax) }}</div>
                <el-progress :percentage="jvmData.nonHeapPercent" :color="getProgressColor(jvmData.nonHeapPercent)" />
              </el-card>
            </el-col>
            <el-col :span="8">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">线程数</div>
                <div class="stat-value">{{ jvmData.threadCount }}</div>
                <div class="stat-subtitle">峰值: {{ jvmData.peakThreadCount }}</div>
              </el-card>
            </el-col>
          </el-row>
          
          <el-card shadow="never" style="margin-top: 16px;">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">JVM名称:</span>
                <span class="info-value">{{ jvmData.vmName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">JVM版本:</span>
                <span class="info-value">{{ jvmData.vmVersion }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">运行时长:</span>
                <span class="info-value">{{ formatDuration(jvmData.uptimeMs) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">启动时间:</span>
                <span class="info-value">{{ formatTimestamp(jvmData.startTimeMs) }}</span>
              </div>
            </div>
          </el-card>
        </div>

        <!-- 内存信息图表 -->
        <div v-else-if="currentDiagType === 'memory'" class="chart-container">
          <el-row :gutter="16" style="margin-bottom: 16px;">
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="chart-title">堆内存使用</div>
                <el-progress type="dashboard" :percentage="memoryData.heapPercent" :color="getProgressColor(memoryData.heapPercent)">
                  <template #default="{ percentage }">
                    <span class="percentage-value">{{ percentage }}%</span>
                    <span class="percentage-label">{{ formatBytes(memoryData.heapUsed) }} / {{ formatBytes(memoryData.heapMax) }}</span>
                  </template>
                </el-progress>
              </el-card>
            </el-col>
            <el-col :span="12">
              <el-card shadow="hover">
                <div class="chart-title">非堆内存使用</div>
                <el-progress type="dashboard" :percentage="memoryData.nonHeapPercent" :color="getProgressColor(memoryData.nonHeapPercent)">
                  <template #default="{ percentage }">
                    <span class="percentage-value">{{ percentage }}%</span>
                    <span class="percentage-label">{{ formatBytes(memoryData.nonHeapUsed) }} / {{ formatBytes(memoryData.nonHeapMax) }}</span>
                  </template>
                </el-progress>
              </el-card>
            </el-col>
          </el-row>
          
          <el-card shadow="never">
            <div class="chart-title">内存池详情</div>
            <el-table :data="memoryData.pools" border stripe size="small" max-height="300">
              <el-table-column prop="name" label="内存池" min-width="150" />
              <el-table-column prop="type" label="类型" width="80" />
              <el-table-column label="已使用" width="120">
                <template #default="{ row }">{{ formatBytes(row.used) }}</template>
              </el-table-column>
              <el-table-column label="已提交" width="120">
                <template #default="{ row }">{{ formatBytes(row.committed) }}</template>
              </el-table-column>
              <el-table-column label="最大值" width="120">
                <template #default="{ row }">{{ formatBytes(row.max) }}</template>
              </el-table-column>
              <el-table-column label="使用率" width="100">
                <template #default="{ row }">
                  <el-tag :type="getUsageLevel(row.percent)" size="small">{{ row.percent }}%</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>

        <!-- 其他文本模式 -->
        <div v-else class="text-mode">
          <el-input v-model="diagResult" type="textarea" :rows="25" readonly />
        </div>
      </div>

      <!-- 文本模式 -->
      <div v-else class="diag-text-content">
        <el-input v-model="diagResult" type="textarea" :rows="25" readonly />
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button v-if="diagMode === 'chart' && currentDiagType" @click="switchToTextMode">查看原始数据</el-button>
          <el-button v-else-if="canShowChart" @click="switchToChartMode">图表视图</el-button>
          <el-button @click="copyDiagResult">复制结果</el-button>
          <el-button type="primary" @click="showDiagDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" title="新建应用" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="所属项目" prop="projectCode">
          <el-select v-model="form.projectCode" placeholder="请选择项目">
            <el-option v-for="p in projects" :key="p.projectCode" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.projectCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用编码" prop="appCode">
          <el-input v-model="form.appCode" placeholder="如: order-service" />
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="如: 订单服务" />
        </el-form-item>
        <el-form-item label="应用类型" prop="appType">
          <el-select v-model="form.appType" placeholder="请选择应用类型">
            <el-option label="自建" value="self-built" />
            <el-option label="Agent接入" value="agent-attached" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, CircleClose, Bell, ArrowDown } from '@element-plus/icons-vue'
import { fetchApplications, createApplication, fetchProjects, type Application, type Project } from '../../api/project'
import { http } from '../../api/http'

const activeTab = ref('definition')
const applications = ref<Application[]>([])
const projects = ref<Project[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const formRef = ref()
const form = ref({
  projectCode: '',
  appCode: '',
  appName: '',
  appType: 'self-built',
  description: '',
})

// 运行实例相关
interface AgentInstance {
  projectCode: string
  app: string
  inst: string
  ip: string
  version: string | null
  configVersion: string | null
  lastHeartbeatTime: number
  online: boolean
  secretKey: string | null
}

const instances = ref<AgentInstance[]>([])
const instancesLoading = ref(false)
const alertedAgents = ref<string[]>([]) // 已告警的 Agent 列表

// 诊断相关
const showDiagDialog = ref(false)
const diagDialogTitle = ref('')
const diagResult = ref('')
const diagMode = ref<'chart' | 'text'>('chart')
const currentDiagType = ref('')

// JVM数据结构
interface JvmData {
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  threadCount: number
  peakThreadCount: number
  vmName: string
  vmVersion: string
  uptimeMs: number
  startTimeMs: number
}

const jvmData = ref<JvmData>({
  heapUsed: 0, heapMax: 0, heapPercent: 0,
  nonHeapUsed: 0, nonHeapMax: 0, nonHeapPercent: 0,
  threadCount: 0, peakThreadCount: 0,
  vmName: '', vmVersion: '', uptimeMs: 0, startTimeMs: 0
})

// 内存数据结构
interface MemoryData {
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  pools: Array<{ name: string; type: string; used: number; committed: number; max: number; percent: number }>
}

const memoryData = ref<MemoryData>({
  heapUsed: 0, heapMax: 0, heapPercent: 0,
  nonHeapUsed: 0, nonHeapMax: 0, nonHeapPercent: 0,
  pools: []
})

const canShowChart = computed(() => {
  return ['jvmInfo', 'memory'].includes(currentDiagType.value)
})

const loadInstances = async () => {
  instancesLoading.value = true
  try {
    const res = await http.get('/api/agent/instances')
    instances.value = (res.data as any)?.result || []
    
    // 同时加载告警状态
    await loadAlertedAgents()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    instancesLoading.value = false
  }
}

const loadAlertedAgents = async () => {
  try {
    const res = await http.get('/api/alert/list', { params: { limit: 100 } })
    const alerts = (res.data as any)?.result || []
    // 提取活跃的 AGENT_OFFLINE 告警
    const activeAlerts = alerts.filter((a: any) => 
      a.alertType === 'AGENT_OFFLINE' && a.status === 'ACTIVE'
    )
    alertedAgents.value = activeAlerts.map((a: any) => a.app)
  } catch (e: any) {
    console.error('Failed to load alerted agents:', e)
  }
}

// 计算属性
const onlineCount = computed(() => instances.value.filter(i => i.online).length)
const offlineCount = computed(() => instances.value.filter(i => !i.online).length)
const alertedCount = computed(() => alertedAgents.value.length)

// 判断 Agent 是否已告警
const isAlerted = (row: AgentInstance) => {
  return alertedAgents.value.includes(row.app) && !row.online
}

// 处理诊断命令
const handleDiagCommand = (cmd: string, row: AgentInstance) => {
  switch (cmd) {
    case 'jvm':
      showJvmInfo(row)
      break
    case 'thread':
      showThreadDump(row)
      break
    case 'memory':
      showMemory(row)
      break
  }
}

const formatTimestamp = (ts: number) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 构建完整的 agentId
const buildAgentId = (instance: AgentInstance) => {
  // 尝试从 Netty 连接列表中找到完整的 agentId
  return `${instance.app}@dev@${instance.inst}@${instance.ip}:8081`
}

// 执行诊断命令
const executeDiag = async (title: string, agentId: string, apiCall: (id: string) => Promise<any>, type?: string) => {
  diagDialogTitle.value = title
  diagResult.value = '正在执行...'
  showDiagDialog.value = true
  currentDiagType.value = type || ''
  diagMode.value = 'chart'
  
  try {
    const res = await apiCall(agentId)
    const result = (res.data as any)?.result || (res.data as any)?.data
    if (result === undefined || result === null) {
      diagResult.value = '返回数据为空'
    } else if (result === '') {
      diagResult.value = '返回空字符串'
    } else {
      diagResult.value = result
      
      // 解析数据用于图表展示
      if (type === 'jvmInfo') {
        parseJvmData(result)
      } else if (type === 'memory') {
        parseMemoryData(result)
      }
    }
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || '未知错误'
    diagResult.value = `执行失败: ${errorMsg}`
  }
}

// 解析 JVM 数据
const parseJvmData = (text: string) => {
  try {
    const lines = text.split('\n')
    const data: any = {}
    
    lines.forEach(line => {
      if (line.includes('Heap:')) {
        data.heapUsed = extractNumber(line, 'used=')
        data.heapMax = extractNumber(line, 'max=')
      } else if (line.includes('NonHeap:')) {
        data.nonHeapUsed = extractNumber(line, 'used=')
        data.nonHeapMax = extractNumber(line, 'max=')
      } else if (line.startsWith('VmName:')) {
        data.vmName = line.split(':')[1]?.trim() || ''
      } else if (line.startsWith('VmVersion:')) {
        data.vmVersion = line.split(':')[1]?.trim() || ''
      } else if (line.startsWith('UptimeMs:')) {
        data.uptimeMs = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('StartTimeMs:')) {
        data.startTimeMs = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('ThreadCount:')) {
        data.threadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('PeakThreadCount:')) {
        data.peakThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      }
    })
    
    jvmData.value = {
      heapUsed: data.heapUsed || 0,
      heapMax: data.heapMax || 0,
      heapPercent: data.heapMax ? Math.round((data.heapUsed / data.heapMax) * 100) : 0,
      nonHeapUsed: data.nonHeapUsed || 0,
      nonHeapMax: data.nonHeapMax || 0,
      nonHeapPercent: data.nonHeapMax ? Math.round((data.nonHeapUsed / data.nonHeapMax) * 100) : 0,
      threadCount: data.threadCount || 0,
      peakThreadCount: data.peakThreadCount || 0,
      vmName: data.vmName || '',
      vmVersion: data.vmVersion || '',
      uptimeMs: data.uptimeMs || 0,
      startTimeMs: data.startTimeMs || 0
    }
  } catch (e) {
    console.error('Failed to parse JVM data:', e)
  }
}

// 解析内存数据
const parseMemoryData = (text: string) => {
  try {
    const lines = text.split('\n')
    const pools: any[] = []
    let heapUsed = 0, heapMax = 0, nonHeapUsed = 0, nonHeapMax = 0
    
    lines.forEach(line => {
      if (line.startsWith('Heap:')) {
        heapUsed = extractNumber(line, 'used=')
        heapMax = extractNumber(line, 'max=')
      } else if (line.startsWith('NonHeap:')) {
        nonHeapUsed = extractNumber(line, 'used=')
        nonHeapMax = extractNumber(line, 'max=')
      } else if (line.startsWith('Pool:')) {
        const match = line.match(/Pool: (.+?) \((.+?)\) (.+)/)
        if (match) {
          const name = match[1]
          const type = match[2]
          const used = extractNumber(match[3], 'used=')
          const committed = extractNumber(match[3], 'committed=')
          const max = extractNumber(match[3], 'max=')
          const percent = max > 0 ? Math.round((used / max) * 100) : 0
          pools.push({ name, type, used, committed, max, percent })
        }
      }
    })
    
    memoryData.value = {
      heapUsed,
      heapMax,
      heapPercent: heapMax ? Math.round((heapUsed / heapMax) * 100) : 0,
      nonHeapUsed,
      nonHeapMax,
      nonHeapPercent: nonHeapMax ? Math.round((nonHeapUsed / nonHeapMax) * 100) : 0,
      pools
    }
  } catch (e) {
    console.error('Failed to parse memory data:', e)
  }
}

// 提取数字的工具函数
const extractNumber = (text: string, key: string): number => {
  const idx = text.indexOf(key)
  if (idx === -1) return 0
  const start = idx + key.length
  let end = start
  while (end < text.length && /\d/.test(text[end])) {
    end++
  }
  return parseInt(text.substring(start, end)) || 0
}

const showJvmInfo = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`JVM信息 - ${row.app}@${row.inst}`, agentId, 
    (id) => http.get('/api/diag/agent/jvmInfo', { params: { agentId: id } }), 'jvmInfo')
}

const showThreadDump = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`线程Dump - ${row.app}@${row.inst}`, agentId,
    (id) => http.get('/api/diag/agent/threadDump', { params: { agentId: id } }))
}

const showMemory = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`内存信息 - ${row.app}@${row.inst}`, agentId,
    (id) => http.get('/api/diag/agent/memory', { params: { agentId: id } }), 'memory')
}

const copyDiagResult = async () => {
  try {
    await navigator.clipboard.writeText(diagResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e: any) {
    ElMessage.error('复制失败')
  }
}

// 切换模式
const switchToTextMode = () => {
  diagMode.value = 'text'
}

const switchToChartMode = () => {
  if (canShowChart.value) {
    diagMode.value = 'chart'
  }
}

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
}

// 格式化时长
const formatDuration = (ms: number): string => {
  if (ms < 1000) return ms + ' ms'
  const seconds = Math.floor(ms / 1000)
  if (seconds < 60) return seconds + ' s'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return minutes + ' min'
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return hours + ' h ' + (minutes % 60) + ' min'
  const days = Math.floor(hours / 24)
  return days + ' d ' + (hours % 24) + ' h'
}

// 获取进度条颜色
const getProgressColor = (percent: number): string => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

// 获取使用率级别
const getUsageLevel = (percent: number): string => {
  if (percent < 60) return 'success'
  if (percent < 80) return 'warning'
  return 'danger'
}

const rules = {
  projectCode: [{ required: true, message: '请选择项目', trigger: 'change' }],
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
}

const loadData = async () => {
  loading.value = true
  try {
    applications.value = await fetchApplications()
    projects.value = await fetchProjects()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const submitCreate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await createApplication(form.value)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        form.value = { projectCode: '', appCode: '', appName: '', appType: 'self-built', description: '' }
        loadData()
      } catch (e: any) {
        ElMessage.error(e.message || '创建失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
  // 如果默认显示运行实例 Tab，则加载实例数据
  if (activeTab.value === 'instances') {
    loadInstances()
  }
})

// 监听 Tab 切换，加载对应数据
watch(activeTab, (newTab) => {
  if (newTab === 'instances' && instances.value.length === 0) {
    loadInstances()
  }
})
</script>

<style scoped>
.application-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 600px;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.tab-content {
  padding: var(--space-4) 0;
}

.instances-tab {
  min-height: 500px;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

/* 诊断图表样式 */
.diag-chart-content {
  min-height: 400px;
}

.chart-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.stat-card {
  text-align: center;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 12px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #909399;
  font-size: 13px;
}

.info-value {
  color: #303133;
  font-size: 13px;
  font-weight: 500;
}

.chart-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
}

.percentage-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #303133;
}

.percentage-label {
  display: block;
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.text-mode,
.diag-text-content {
  font-family: monospace;
}

.text-mode :deep(.el-textarea__inner),
.diag-text-content :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style>
