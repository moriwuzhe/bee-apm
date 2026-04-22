<template>
  <div class="agent-container">
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
          <div class="stat-icon" style="background: #409eff;">
            <el-icon><DataAnalysis /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ agents.length }}</div>
            <div class="stat-label">总实例数</div>
          </div>
        </div>
      </el-card>
    </div>

    <div class="page-head">
      <div class="title">Agent管理</div>
      <div class="controls">
        <el-select v-model="filterApp" placeholder="筛选应用" clearable filterable style="width: 200px;" @change="applyFilters">
          <el-option
            v-for="app in uniqueApps"
            :key="app"
            :label="app"
            :value="app"
          />
        </el-select>
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 120px;" @change="applyFilters">
          <el-option label="在线" :value="true" />
          <el-option label="离线" :value="false" />
        </el-select>
        <el-input 
          v-model="filterIp" 
          placeholder="搜索IP" 
          clearable 
          style="width: 180px;"
          @clear="applyFilters"
          @keyup.enter="applyFilters"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <el-switch 
          v-model="autoRefresh" 
          active-text="自动刷新" 
          @change="toggleAutoRefresh"
          style="margin-left: 10px;"
        />
        <el-select v-if="autoRefresh" v-model="refreshInterval" placeholder="间隔" style="width: 100px;" @change="restartAutoRefresh">
          <el-option label="5秒" :value="5000" />
          <el-option label="10秒" :value="10000" />
          <el-option label="30秒" :value="30000" />
        </el-select>
        <el-button :loading="loading" type="primary" @click="loadData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <el-table :data="filteredAgents" border stripe v-loading="loading" style="width: 100%" @row-click="handleRowClick">
      <el-table-column prop="app" label="应用" width="160" />
      <el-table-column prop="inst" label="实例" width="160" />
      <el-table-column prop="ip" label="IP地址" width="140" />
      <el-table-column prop="version" label="Agent版本" width="120" />
      <el-table-column prop="configVersion" label="配置版本" width="100" />
      <el-table-column label="最后心跳" width="180">
        <template #default="{ row }">
          {{ formatTime(row.lastHeartbeatTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="online" label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'danger'" size="small">
            {{ row.online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right" align="center">
        <template #default="{ row }">
          <el-button-group>
            <el-button type="primary" size="small" @click.stop="handleCommand('pluginManage', row)">
              <el-icon><Tools /></el-icon>
              插件
            </el-button>
            <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
              <el-button type="primary" size="small">
                <el-icon><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="config">⚙️ 应用配置</el-dropdown-item>
                  <el-dropdown-item command="instanceConfig">🔧 实例配置</el-dropdown-item>
                  <el-dropdown-item command="pluginManage">📦 插件管理</el-dropdown-item>
                  
                  <el-dropdown-item divided />
                  <div class="dropdown-category">🔍 诊断工具</div>
                  <el-dropdown-item command="jvmInfo">☕ JVM信息</el-dropdown-item>
                  <el-dropdown-item command="memory">💾 内存信息</el-dropdown-item>
                  <el-dropdown-item command="gcStats">♻️ GC统计</el-dropdown-item>
                  <el-dropdown-item command="threadsSummary">🧵 线程概要</el-dropdown-item>
                  <el-dropdown-item command="threadDump">📝 线程Dump</el-dropdown-item>
                  <el-dropdown-item command="deadlocks">🔒 死锁检测</el-dropdown-item>
                  
                  <el-dropdown-item divided />
                  <div class="dropdown-category">🛠️ 操作工具</div>
                  <el-dropdown-item command="gc">♻️ 执行GC</el-dropdown-item>
                  <el-dropdown-item command="sysProps">⚙️ 系统属性</el-dropdown-item>
                  <el-dropdown-item command="env">🌍 环境变量</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </el-button-group>
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

    <!-- 插件下发管理对话框 -->
    <el-dialog v-model="showPluginDialog" title="插件下发管理" width="900px">
      <div style="margin-bottom: 16px;">
        <el-descriptions :column="3" border size="small">
          <el-descriptions-item label="应用">{{ currentAgentApp }}</el-descriptions-item>
          <el-descriptions-item label="实例">{{ currentAgentInst }}</el-descriptions-item>
          <el-descriptions-item label="IP">{{ currentAgentIp }}</el-descriptions-item>
        </el-descriptions>
      </div>
      
      <el-table :data="pluginConfigs" border stripe style="width: 100%" max-height="400">
        <el-table-column prop="pluginCode" label="插件编码" width="180" />
        <el-table-column prop="pluginName" label="插件名称" width="150" />
        <el-table-column prop="version" label="版本" width="100" />
        <el-table-column label="是否下发" width="120">
          <template #default="{ row }">
            <el-switch 
              v-model="row.enabled" 
              :active-value="true" 
              :inactive-value="false"
              @change="onPluginToggleChange(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="状态">
          <template #default="{ row }">
            <el-tag :type="row.enabled ? 'success' : 'info'" size="small">
              {{ row.enabled ? '已下发' : '未下发' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
      
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showPluginDialog = false">关闭</el-button>
          <el-button type="primary" @click="savePluginConfig" :loading="savingPlugins">保存配置</el-button>
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
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  ArrowDown, Connection, CircleClose, DataAnalysis, Search, Refresh, Tools 
} from '@element-plus/icons-vue'
import {
  fetchAgentInstances,
  updateAgentConfig,
  updateAgentInstanceConfig,
  getAppConfig,
  getInstanceConfig,
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
  getAgentPluginConfig,
  updateAgentPluginConfig,
  type AgentInstanceInfo,
  type AgentPluginConfig
} from '../../api/agent'
import { fetchAllPlugins, type PluginInfo } from '../../api/plugin'

const agents = ref<AgentInstanceInfo[]>([])
const loading = ref(false)
const submitting = ref(false)

// 筛选和自动刷新相关
const filterApp = ref('')
const filterStatus = ref<boolean | undefined>(undefined)
const filterIp = ref('')
const autoRefresh = ref(false)
const refreshInterval = ref(10000) // 默认10秒
let refreshTimer: any = null

// 计算属性：唯一的应用列表
const uniqueApps = computed(() => {
  return [...new Set(agents.value.map(a => a.app))]
})

// 计算属性：在线/离线计数
const onlineCount = computed(() => agents.value.filter(a => a.online).length)
const offlineCount = computed(() => agents.value.filter(a => !a.online).length)

// 计算属性：过滤后的Agent列表
const filteredAgents = computed(() => {
  return agents.value.filter(agent => {
    if (filterApp.value && agent.app !== filterApp.value) return false
    if (filterStatus.value !== undefined && agent.online !== filterStatus.value) return false
    if (filterIp.value && !agent.ip.includes(filterIp.value)) return false
    return true
  })
})

// 插件管理相关
const showPluginDialog = ref(false)
const pluginConfigs = ref<AgentPluginConfig[]>([])
const allPlugins = ref<PluginInfo[]>([])
const currentAgentApp = ref('')
const currentAgentInst = ref('')
const currentAgentIp = ref('')
const savingPlugins = ref(false)

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
      // 从后端加载应用配置
      showConfigDialog.value = true
      configForm.value.config = '加载中...'
      try {
        const config = await getAppConfig(row.app)
        configForm.value.config = config
      } catch (e: any) {
        console.error('Failed to load app config:', e)
        configForm.value.config = ''
      }
      break
      
    case 'instanceConfig':
      configMode.value = 'instance'
      currentApp.value = row.app
      currentInst.value = row.inst
      // 从后端加载实例配置
      showConfigDialog.value = true
      configForm.value.config = '加载中...'
      try {
        const config = await getInstanceConfig(row.app, row.inst)
        configForm.value.config = config
      } catch (e: any) {
        console.error('Failed to load instance config:', e)
        configForm.value.config = ''
      }
      break
      
    case 'pluginManage':
      await openPluginManageDialog(row)
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
    } else {
      await updateAgentInstanceConfig({
        app: currentApp.value,
        inst: currentInst.value,
        config: configForm.value.config
      })
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
  
  // 如果当前是图表模式且已有解析的数据，则显示原始数据
  // 注意：diagResult已经存储了原始数据，无需额外处理
  if (!diagResult.value || diagResult.value === '正在执行...') {
    diagResult.value = '暂无数据'
  }
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

// 插件管理相关函数
const openPluginManageDialog = async (row: AgentInstanceInfo) => {
  currentAgentApp.value = row.app
  currentAgentInst.value = row.inst
  currentAgentIp.value = row.ip
  
  showPluginDialog.value = true
  pluginConfigs.value = []
  
  try {
    // 加载所有插件
    allPlugins.value = await fetchAllPlugins()
    
    // 加载当前Agent的插件配置
    const existingConfig = await getAgentPluginConfig(row.app, row.inst)
    
    // 构建插件配置列表
    pluginConfigs.value = allPlugins.value.map(plugin => {
      const existing = existingConfig.find(p => p.pluginCode === plugin.pluginCode)
      return {
        pluginCode: plugin.pluginCode,
        pluginName: plugin.pluginName,
        enabled: existing ? existing.enabled : false,
        version: plugin.version
      }
    })
  } catch (e: any) {
    ElMessage.error('加载插件配置失败: ' + (e.message || ''))
  }
}

const onPluginToggleChange = (row: AgentPluginConfig) => {
  // 实时更新状态显示，但实际需要保存后才生效
  console.log('Plugin toggle changed:', row.pluginCode, '->', row.enabled)
}

const savePluginConfig = async () => {
  savingPlugins.value = true
  try {
    await updateAgentPluginConfig(currentAgentApp.value, currentAgentInst.value, pluginConfigs.value)
    ElMessage.success('插件配置保存成功，Agent将在下次心跳时同步')
    showPluginDialog.value = false
    loadData() // 刷新Agent列表
  } catch (e: any) {
    ElMessage.error('插件配置保存失败: ' + (e.message || ''))
  } finally {
    savingPlugins.value = false
  }
}

// 筛选和自动刷新相关函数
const applyFilters = () => {
  // 筛选由计算属性自动处理，这里可以添加额外的逻辑
  console.log('Filters applied:', { 
    app: filterApp.value, 
    status: filterStatus.value, 
    ip: filterIp.value 
  })
}

const handleRowClick = (row: AgentInstanceInfo) => {
  // 点击行可以跳转到应用详情页或展开详情
  console.log('Row clicked:', row)
}

const toggleAutoRefresh = (enabled: boolean) => {
  if (enabled) {
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    console.log('Auto refreshing agent list...')
    loadData()
  }, refreshInterval.value)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

const restartAutoRefresh = () => {
  if (autoRefresh.value) {
    startAutoRefresh()
  }
}

// 组件卸载时清理定时器
onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.agent-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-bottom: 8px;
}

.stat-card {
  border: none;
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
  gap: 16px;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
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
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
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
  flex-wrap: wrap;
}

/* 下拉菜单分类样式 */
.dropdown-category {
  padding: 4px 16px;
  font-size: 12px;
  color: #909399;
  font-weight: 600;
  background: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
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

/* 按钮组样式优化 */
:deep(.el-button-group) {
  display: flex;
  align-items: center;
}

:deep(.el-button-group .el-button--small) {
  padding: 7px 12px;
  font-size: 13px;
}

/* 表格行hover效果 */
:deep(.el-table__body tr:hover) {
  cursor: pointer;
}
</style>
