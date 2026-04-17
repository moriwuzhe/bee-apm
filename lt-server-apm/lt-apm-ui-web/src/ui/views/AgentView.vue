<template>
  <div class="agent-container">
    <div class="page-head">
      <div class="title">Agent管理</div>
      <div class="controls">
        <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-table :data="agents" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="app" label="应用" width="150" />
      <el-table-column prop="inst" label="实例" width="150" />
      <el-table-column prop="ip" label="IP地址" width="130" />
      <el-table-column prop="version" label="Agent版本" width="110" />
      <el-table-column prop="configVersion" label="配置版本" width="100" />
      <el-table-column label="最后心跳" width="160">
        <template #default="{ row }">
          {{ formatTime(row.lastHeartbeatTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="online" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'danger'" size="small">
            {{ row.online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
            <el-button type="primary" link>
              操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="config">应用配置</el-dropdown-item>
                <el-dropdown-item command="instanceConfig">实例配置</el-dropdown-item>
                <el-dropdown-item divided command="jvmInfo">JVM信息</el-dropdown-item>
                <el-dropdown-item command="memory">内存信息</el-dropdown-item>
                <el-dropdown-item command="threadDump">线程Dump</el-dropdown-item>
                <el-dropdown-item command="threadsSummary">线程概要</el-dropdown-item>
                <el-dropdown-item command="gcStats">GC统计</el-dropdown-item>
                <el-dropdown-item command="deadlocks">死锁检测</el-dropdown-item>
                <el-dropdown-item divided command="gc">执行GC</el-dropdown-item>
                <el-dropdown-item command="sysProps">系统属性</el-dropdown-item>
                <el-dropdown-item command="env">环境变量</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 配置管理对话框 -->
    <el-dialog v-model="showConfigDialog" :title="configDialogTitle" width="700px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="应用">
          <span>{{ currentApp }}</span>
        </el-form-item>
        <el-form-item v-if="configMode === 'instance'" label="实例">
          <span>{{ currentInst }}</span>
        </el-form-item>
        <el-form-item label="配置内容">
          <el-input type="textarea" v-model="configForm.config" :rows="18" placeholder="请输入配置内容（YAML格式）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <el-button type="primary" @click="submitConfig" :loading="submitting">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="900px">
      <!-- 图表模式 -->
      <div v-if="diagMode === 'chart'" class="diag-chart-content">
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

        <!-- GC统计图表 -->
        <div v-else-if="currentDiagType === 'gcStats'" class="chart-container">
          <el-card shadow="never">
            <div class="chart-title">GC收集器统计</div>
            <el-table :data="gcData.collectors" border stripe size="small">
              <el-table-column prop="name" label="GC收集器" min-width="150" />
              <el-table-column prop="count" label="收集次数" width="100" align="right" />
              <el-table-column label="总耗时" width="120" align="right">
                <template #default="{ row }">{{ row.timeMs }} ms</template>
              </el-table-column>
              <el-table-column label="平均耗时" width="120" align="right">
                <template #default="{ row }">{{ row.count > 0 ? (row.timeMs / row.count).toFixed(2) : 0 }} ms</template>
              </el-table-column>
              <el-table-column prop="pools" label="管理的内存池" min-width="200" show-overflow-tooltip />
            </el-table>
          </el-card>
        </div>

        <!-- 线程概要图表 -->
        <div v-else-if="currentDiagType === 'threadsSummary'" class="chart-container">
          <el-row :gutter="16">
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">当前线程</div>
                <div class="stat-value large">{{ threadsData.threadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">守护线程</div>
                <div class="stat-value large">{{ threadsData.daemonThreadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">峰值线程</div>
                <div class="stat-value large">{{ threadsData.peakThreadCount }}</div>
              </el-card>
            </el-col>
            <el-col :span="6">
              <el-card shadow="hover" class="stat-card">
                <div class="stat-title">累计启动</div>
                <div class="stat-value large">{{ threadsData.totalStartedThreadCount }}</div>
              </el-card>
            </el-col>
          </el-row>
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
          <el-button v-if="diagMode === 'chart'" @click="switchToTextMode">查看原始数据</el-button>
          <el-button v-else @click="switchToChartMode" :disabled="!canShowChart">图表视图</el-button>
          <el-button @click="copyDiagResult">复制结果</el-button>
          <el-button type="primary" @click="showDiagDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  fetchAgentInstances,
  updateAgentConfig,
  updateAgentInstanceConfig,
  agentThreadDump,
  agentJvmInfo,
  agentGc,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentDeadlocks,
  agentSysProps,
  agentEnv,
  fetchAgentConnections,
  type AgentInstanceInfo
} from '../../api/agent'

const agents = ref<AgentInstanceInfo[]>([])
const loading = ref(false)
const submitting = ref(false)

// 配置对话框相关
const showConfigDialog = ref(false)
const configMode = ref<'app' | 'instance'>('app')
const currentApp = ref('')
const currentInst = ref('')
const configForm = ref({ config: '' })

// 诊断对话框相关
const showDiagDialog = ref(false)
const diagDialogTitle = ref('')
const diagResult = ref('')
const diagMode = ref<'chart' | 'text'>('chart') // 默认图表模式
const currentDiagType = ref('') // 当前诊断类型

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

// GC数据结构
interface GcData {
  collectors: Array<{ name: string; count: number; timeMs: number; pools: string }>
}

const gcData = ref<GcData>({ collectors: [] })

// 线程数据结构
interface ThreadsData {
  threadCount: number
  daemonThreadCount: number
  peakThreadCount: number
  totalStartedThreadCount: number
}

const threadsData = ref<ThreadsData>({
  threadCount: 0, daemonThreadCount: 0,
  peakThreadCount: 0, totalStartedThreadCount: 0
})

// 判断是否可以显示图表
const canShowChart = computed(() => {
  return ['jvmInfo', 'memory', 'gcStats', 'threadsSummary'].includes(currentDiagType.value)
})

const configDialogTitle = computed(() => 
  configMode.value === 'app' ? '应用配置管理' : '实例配置管理'
)

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    agents.value = await fetchAgentInstances()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleCommand = async (cmd: string, row: AgentInstanceInfo) => {
  // 构建简化的 agentId 用于匹配
  const simpleAgentId = `${row.app}@${row.inst}`
  
  // 从在线 Agent 列表中查找完整的 agentId
  let agentId = simpleAgentId
  try {
    const connections = await fetchAgentConnections()
    const matched = connections.find(conn => {
      // 尝试多种匹配方式
      return conn.agentId === simpleAgentId || 
             conn.agentId.startsWith(simpleAgentId + '@') ||
             conn.agentId.includes(`@${row.inst}@`)
    })
    if (matched) {
      agentId = matched.agentId
    }
  } catch (e) {
    console.warn('Failed to fetch agent connections, using simple agentId')
  }
  
  switch (cmd) {
    case 'config':
      configMode.value = 'app'
      currentApp.value = row.app
      currentInst.value = ''
      // 尝试从 localStorage 加载应用配置
      const appConfigKey = `agent_config_app_${row.app}`
      const savedAppConfig = localStorage.getItem(appConfigKey)
      configForm.value.config = savedAppConfig || ''
      showConfigDialog.value = true
      break
      
    case 'instanceConfig':
      configMode.value = 'instance'
      currentApp.value = row.app
      currentInst.value = row.inst
      // 尝试从 localStorage 加载实例配置
      const instConfigKey = `agent_config_inst_${row.app}_${row.inst}`
      const savedInstConfig = localStorage.getItem(instConfigKey)
      configForm.value.config = savedInstConfig || ''
      showConfigDialog.value = true
      break
      
    case 'jvmInfo':
      await executeDiag('JVM信息', () => agentJvmInfo(agentId), 'jvmInfo')
      break
      
    case 'memory':
      await executeDiag('内存信息', () => agentMemory(agentId), 'memory')
      break
      
    case 'threadDump':
      await executeDiag('线程Dump', () => agentThreadDump(agentId))
      break
      
    case 'threadsSummary':
      await executeDiag('线程概要', () => agentThreadsSummary(agentId), 'threadsSummary')
      break
      
    case 'gcStats':
      await executeDiag('GC统计', () => agentGcStats(agentId), 'gcStats')
      break
      
    case 'deadlocks':
      await executeDiag('死锁检测', () => agentDeadlocks(agentId))
      break
      
    case 'gc':
      // 执行GC需要二次确认
      try {
        await ElMessageBox.confirm(
          `确定要对 ${row.app}@${row.inst} 执行 GC 吗？这可能会导致短暂的停顿。`,
          '执行 GC 确认',
          {
            confirmButtonText: '确定执行',
            cancelButtonText: '取消',
            type: 'warning',
          }
        )
        await executeDiag('执行GC', () => agentGc(agentId))
      } catch (e: any) {
        if (e !== 'cancel') {
          ElMessage.error('操作失败')
        }
      }
      break
      
    case 'sysProps':
      await executeDiag('系统属性', () => agentSysProps(agentId))
      break
      
    case 'env':
      await executeDiag('环境变量', () => agentEnv(agentId))
      break
  }
}

const executeDiag = async (title: string, fn: () => Promise<string | undefined>, type?: string) => {
  diagDialogTitle.value = title
  diagResult.value = '正在执行...'
  showDiagDialog.value = true
  currentDiagType.value = type || ''
  diagMode.value = 'chart' // 默认使用图表模式
  
  try {
    const result = await fn()
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
      } else if (type === 'gcStats') {
        parseGcData(result)
      } else if (type === 'threadsSummary') {
        parseThreadsData(result)
      }
    }
  } catch (e: any) {
    const errorMsg = e.response?.data || e.message || '未知错误'
    diagResult.value = `执行失败: ${JSON.stringify(errorMsg, null, 2)}`
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

// 解析 GC 数据
const parseGcData = (text: string) => {
  try {
    const lines = text.split('\n')
    const collectors: any[] = []
    
    lines.forEach(line => {
      if (line.startsWith('GC:')) {
        const match = line.match(/GC: (.+?) count=(\d+) timeMs=(\d+)(?: pools=(.+))?/)
        if (match) {
          collectors.push({
            name: match[1],
            count: parseInt(match[2]),
            timeMs: parseInt(match[3]),
            pools: match[4] || '-'
          })
        }
      }
    })
    
    gcData.value = { collectors }
  } catch (e) {
    console.error('Failed to parse GC data:', e)
  }
}

// 解析线程数据
const parseThreadsData = (text: string) => {
  try {
    const lines = text.split('\n')
    const data: any = {}
    
    lines.forEach(line => {
      if (line.startsWith('ThreadCount:')) {
        data.threadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('DaemonThreadCount:')) {
        data.daemonThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('PeakThreadCount:')) {
        data.peakThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      } else if (line.startsWith('TotalStartedThreadCount:')) {
        data.totalStartedThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
      }
    })
    
    threadsData.value = {
      threadCount: data.threadCount || 0,
      daemonThreadCount: data.daemonThreadCount || 0,
      peakThreadCount: data.peakThreadCount || 0,
      totalStartedThreadCount: data.totalStartedThreadCount || 0
    }
  } catch (e) {
    console.error('Failed to parse threads data:', e)
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

const submitConfig = async () => {
  submitting.value = true
  try {
    if (configMode.value === 'app') {
      await updateAgentConfig({
        app: currentApp.value,
        config: configForm.value.config
      })
      // 保存到 localStorage
      const appConfigKey = `agent_config_app_${currentApp.value}`
      localStorage.setItem(appConfigKey, configForm.value.config)
    } else {
      await updateAgentInstanceConfig({
        app: currentApp.value,
        inst: currentInst.value,
        config: configForm.value.config
      })
      // 保存到 localStorage
      const instConfigKey = `agent_config_inst_${currentApp.value}_${currentInst.value}`
      localStorage.setItem(instConfigKey, configForm.value.config)
    }
    ElMessage.success('配置更新成功')
    showConfigDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '配置更新失败')
  } finally {
    submitting.value = false
  }
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

// 格式化时间戳
const formatTimestamp = (ts: number): string => {
  if (!ts) return '-'
  return new Date(ts).toLocaleString('zh-CN')
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

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.agent-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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

.diag-content {
  font-family: monospace;
}

.diag-content :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}

/* 图表模式样式 */
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

.stat-value.large {
  font-size: 32px;
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
