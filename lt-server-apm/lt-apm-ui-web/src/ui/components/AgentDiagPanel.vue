                      x'x'x'x'z<template>
  <div class="agent-diag-panel">
    <!-- 实例信息头部 -->
    <div v-if="agentInfo" class="agent-info-bar">
      <el-descriptions :column="4" border size="small">
        <el-descriptions-item label="应用">{{ agentInfo.app }}</el-descriptions-item>
        <el-descriptions-item label="实例">{{ agentInfo.inst }}</el-descriptions-item>
        <el-descriptions-item label="IP">{{ agentInfo.ip }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="agentInfo.online ? 'success' : 'danger'" size="small">
            {{ agentInfo.online ? '在线' : '离线' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div class="agent-actions" v-if="agentInfo.online">
        <el-button size="small" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 功能Tab -->
    <el-tabs v-model="activeTab" type="border-card" v-loading="loading">
      
      <!-- Tab 1: 实时监控（趋势图表） -->
      <el-tab-pane v-if="enableRealtimeMonitor" label="📊 实时监控" name="realtime">
        <div class="monitor-charts">
          <!-- 空数据提示 -->
          <div v-if="memoryHistoryData.length === 0" class="empty-data-tip">
            <el-empty description="暂无监控数据">
              <template #image>
                <el-icon :size="80" color="#c0c4cc"><DataAnalysis /></el-icon>
              </template>
              <template #description>
                <p style="color: #909399; margin: 8px 0;">请确保Agent正常运行并上报数据</p>
                <p style="color: #c0c4cc; font-size: 12px;">数据将在Agent上报后自动显示</p>
              </template>
              <el-button type="primary" @click="loadHistoryData" :loading="loading">
                <el-icon><Refresh /></el-icon>
                刷新数据
              </el-button>
            </el-empty>
          </div>
          
          <!-- 图表区域 -->
          <template v-else>
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>💾 内存趋势</span>
                  <el-tag size="small" type="info">实时</el-tag>
                </div>
              </template>
              <div ref="memoryChartRef" class="chart-container"></div>
            </el-card>
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>♻️ GC趋势</span>
                  <el-tag size="small" type="info">实时</el-tag>
                </div>
              </template>
              <div ref="gcChartRef" class="chart-container"></div>
            </el-card>
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>🧵 线程趋势</span>
                  <el-tag size="small" type="info">实时</el-tag>
                </div>
              </template>
              <div ref="threadChartRef" class="chart-container"></div>
            </el-card>
            <el-card shadow="hover" class="chart-card">
              <template #header>
                <div class="chart-header">
                  <span>🌐 IO/网络趋势</span>
                  <el-tag size="small" type="info">实时</el-tag>
                </div>
              </template>
              <div ref="ioChartRef" class="chart-container"></div>
            </el-card>
          </template>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 实时诊断 -->
      <el-tab-pane label="🔍 实时诊断" name="diagnostic">
        <div class="diagnostic-sections">
          <!-- JVM快照 -->
          <el-card shadow="hover" class="diag-card">
            <template #header>
              <div class="card-header">
                <span>☕ JVM快照</span>
                <el-button size="small" type="primary" @click="fetchJvmInfo" :loading="jvmInfoLoading">
                  <el-icon><Refresh /></el-icon>
                  获取快照
                </el-button>
              </div>
            </template>
            <div v-if="jvmInfoData" class="diag-content">
              <el-row :gutter="16">
                <el-col :span="8">
                  <div class="metric-item">
                    <div class="metric-label">堆内存使用</div>
                    <div class="metric-value">{{ formatBytes(jvmInfoData.heapUsed) }}</div>
                    <div class="metric-sub">/ {{ formatBytes(jvmInfoData.heapMax) }}</div>
                    <el-progress :percentage="jvmInfoData.heapPercent" :color="getProgressColor(jvmInfoData.heapPercent)" />
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="metric-item">
                    <div class="metric-label">非堆内存使用</div>
                    <div class="metric-value">{{ formatBytes(jvmInfoData.nonHeapUsed) }}</div>
                    <div class="metric-sub">/ {{ formatBytes(jvmInfoData.nonHeapMax) }}</div>
                    <el-progress :percentage="jvmInfoData.nonHeapPercent" :color="getProgressColor(jvmInfoData.nonHeapPercent)" />
                  </div>
                </el-col>
                <el-col :span="8">
                  <div class="metric-item">
                    <div class="metric-label">线程数</div>
                    <div class="metric-value">{{ jvmInfoData.threadCount }}</div>
                    <div class="metric-sub">峰值: {{ jvmInfoData.peakThreadCount }}</div>
                  </div>
                </el-col>
              </el-row>
              <el-row :gutter="16" style="margin-top: 16px;">
                <el-col :span="24">
                  <div class="jvm-details">
                    <div class="detail-row">
                      <span class="detail-label">Java版本:</span>
                      <span class="detail-value">{{ jvmInfoData.javaVersion }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">VM名称:</span>
                      <span class="detail-value">{{ jvmInfoData.vmName }}</span>
                    </div>
                    <div class="detail-row">
                      <span class="detail-label">运行时间:</span>
                      <span class="detail-value">{{ formatUptime(jvmInfoData.uptime) }}</span>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </div>
            <el-empty v-else description="点击获取快照查看JVM信息" :image-size="80" />
          </el-card>

          <!-- 线程Dump -->
          <el-card shadow="hover" class="diag-card">
            <template #header>
              <div class="card-header">
                <span>📝 线程Dump</span>
                <el-button size="small" type="primary" @click="fetchThreadDump" :loading="threadDumpLoading">
                  <el-icon><Refresh /></el-icon>
                  获取Dump
                </el-button>
              </div>
            </template>
            <div v-if="threadDumpData" class="diag-content">
              <div class="thread-summary">
                <el-tag type="info" size="small">总线程数: {{ threadDumpData.totalThreads }}</el-tag>
                <el-tag type="success" size="small">运行中: {{ threadDumpData.running }}</el-tag>
                <el-tag type="warning" size="small">等待中: {{ threadDumpData.waiting }}</el-tag>
                <el-tag type="danger" size="small">阻塞: {{ threadDumpData.blocked }}</el-tag>
              </div>
              <el-input
                v-model="threadDumpData.raw"
                type="textarea"
                :rows="15"
                readonly
                class="raw-data-area"
              />
            </div>
            <el-empty v-else description="点击获取Dump查看线程信息" :image-size="80" />
          </el-card>

          <!-- 死锁检测 -->
          <el-card shadow="hover" class="diag-card">
            <template #header>
              <div class="card-header">
                <span>🔒 死锁检测</span>
                <el-button size="small" type="primary" @click="fetchDeadlocks" :loading="deadlocksLoading">
                  <el-icon><Refresh /></el-icon>
                  检测死锁
                </el-button>
              </div>
            </template>
            <div v-if="deadlocksData" class="diag-content">
              <div v-if="deadlocksData.hasDeadlock" class="deadlock-warning">
                <el-alert title="⚠️ 发现死锁！" type="error" :closable="false" show-icon>
                  <template #default>
                    <div v-for="(lock, index) in deadlocksData.deadlocks" :key="index" class="deadlock-detail">
                      <p><strong>死锁 {{ index + 1 }}:</strong></p>
                      <pre>{{ lock }}</pre>
                    </div>
                  </template>
                </el-alert>
              </div>
              <el-result v-else icon="success" title="未发现死锁" sub-title="系统运行正常" />
            </div>
            <el-empty v-else description="点击检测死锁进行检查" :image-size="80" />
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 3: 诊断工具 -->
      <el-tab-pane label="🛠️ 诊断工具" name="tools">
        <div class="tools-grid">
          <el-card shadow="hover" class="tool-card" @click="fetchMemoryInfo" v-loading="memoryInfoLoading">
            <div class="tool-icon">💾</div>
            <div class="tool-title">内存信息</div>
            <div class="tool-desc">查看堆内存和非堆内存详情</div>
          </el-card>
          <el-card shadow="hover" class="tool-card" @click="fetchGcStats" v-loading="gcStatsLoading">
            <div class="tool-icon">♻️</div>
            <div class="tool-title">GC统计</div>
            <div class="tool-desc">查看垃圾回收统计信息</div>
          </el-card>
          <el-card shadow="hover" class="tool-card" @click="fetchThreadsSummary" v-loading="threadsSummaryLoading">
            <div class="tool-icon">🧵</div>
            <div class="tool-title">线程概要</div>
            <div class="tool-desc">查看线程状态分布</div>
          </el-card>
          <el-card shadow="hover" class="tool-card" @click="executeGC" v-loading="gcLoading">
            <div class="tool-icon">️🗑️</div>
            <div class="tool-title">执行GC</div>
            <div class="tool-desc">手动触发垃圾回收</div>
          </el-card>
          <el-card shadow="hover" class="tool-card" @click="fetchSysProps" v-loading="sysPropsLoading">
            <div class="tool-icon">⚙️</div>
            <div class="tool-title">系统属性</div>
            <div class="tool-desc">查看JVM系统属性</div>
          </el-card>
          <el-card shadow="hover" class="tool-card" @click="fetchEnvVars" v-loading="envVarsLoading">
            <div class="tool-icon">🌍</div>
            <div class="tool-title">环境变量</div>
            <div class="tool-desc">查看系统环境变量</div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 通用结果对话框 -->
    <el-dialog v-model="showResultDialog" :title="resultDialogTitle" width="800px">
      <el-input
        v-model="resultData"
        type="textarea"
        :rows="20"
        readonly
        class="raw-data-area"
      />
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
        <el-button type="primary" @click="copyResult">复制内容</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, DataAnalysis } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import {
  agentJvmInfo,
  agentThreadDump,
  agentDeadlocks,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentGc,
  agentSysProps,
  agentEnv,
  fetchAgentConnections,
  getMemoryHistory,
  type AgentMemoryMetrics
} from '../../api/agent'

// Props定义
interface AgentInfo {
  app: string
  inst: string
  ip: string
  online: boolean
}

const props = defineProps<{
  agentInfo?: AgentInfo | null
  enableRealtimeMonitor?: boolean
}>()

// Emits定义
const emit = defineEmits(['refresh'])

// 状态
const activeTab = ref('diagnostic')
const loading = ref(false)

// JVM快照
const jvmInfoLoading = ref(false)
const jvmInfoData = ref<any>(null)

// 线程Dump
const threadDumpLoading = ref(false)
const threadDumpData = ref<any>(null)

// 死锁检测
const deadlocksLoading = ref(false)
const deadlocksData = ref<any>(null)

// 工具加载状态
const memoryInfoLoading = ref(false)
const gcStatsLoading = ref(false)
const threadsSummaryLoading = ref(false)
const gcLoading = ref(false)
const sysPropsLoading = ref(false)
const envVarsLoading = ref(false)

// 结果对话框
const showResultDialog = ref(false)
const resultDialogTitle = ref('')
const resultData = ref('')

// 图表引用
const memoryChartRef = ref<HTMLDivElement>()
const gcChartRef = ref<HTMLDivElement>()
const threadChartRef = ref<HTMLDivElement>()
const ioChartRef = ref<HTMLDivElement>()
let memoryChart: echarts.ECharts | null = null
let gcChart: echarts.ECharts | null = null
let threadChart: echarts.ECharts | null = null
let ioChart: echarts.ECharts | null = null

// 历史数据
const memoryHistoryData = ref<AgentMemoryMetrics[]>([])
const realtimeTimer = ref<any>(null)

// 获取AgentId
const getAgentId = async (): Promise<string> => {
  if (!props.agentInfo) return ''
  try {
    const connections = await fetchAgentConnections()
    console.log('Available connections:', connections.map(c => c.agentId))
    
    // 精确匹配: app@inst@ip格式
    const exactMatch = connections.find(conn => {
      const parts = conn.agentId.split('@')
      return parts.length >= 2 && parts[0] === props.agentInfo?.app && parts[1] === props.agentInfo?.inst
    })
    
    if (exactMatch) {
      console.log('Found exact match:', exactMatch.agentId)
      return exactMatch.agentId
    }
    
    // 降级: 使用app@inst格式
    const fallbackId = `${props.agentInfo.app}@${props.agentInfo.inst}`
    console.warn('Using fallback agentId:', fallbackId)
    return fallbackId
  } catch (e) {
    console.error('Failed to fetch agent connections, using fallback', e)
    return `${props.agentInfo.app}@${props.agentInfo.inst}`
  }
}

// 加载历史数据
const loadHistoryData = async () => {
  if (!props.agentInfo) return
  try {
    const endTime = Date.now()
    const startTime = endTime - 3600000 // 最近1小时
    memoryHistoryData.value = await getMemoryHistory(
      props.agentInfo.app,
      props.agentInfo.inst,
      startTime,
      endTime,
      100
    )
    renderCharts()
  } catch (error) {
    console.error('加载历史数据失败', error)
  } finally {
    loading.value = false
  }
}

// 尝试渲染图表，带重试机制
const tryRenderCharts = (retryCount = 0) => {
  const maxRetries = 5

  // 检查DOM是否存在且有尺寸
  const hasMemoryDom = memoryChartRef.value && memoryChartRef.value.clientWidth > 0
  const hasGcDom = gcChartRef.value && gcChartRef.value.clientWidth > 0
  const hasThreadDom = threadChartRef.value && threadChartRef.value.clientWidth > 0
  const hasIoDom = ioChartRef.value && ioChartRef.value.clientWidth > 0

  if (hasMemoryDom) renderMemoryChart()
  if (hasGcDom) renderGcChart()
  if (hasThreadDom) renderThreadChart()
  if (hasIoDom) renderIoChart()

  // 如果还有图表未渲染且未达到最大重试次数，继续重试
  const allRendered = (!hasMemoryDom || memoryChart) &&
                      (!hasGcDom || gcChart) &&
                      (!hasThreadDom || threadChart) &&
                      (!hasIoDom || ioChart)

  if (!allRendered && retryCount < maxRetries) {
    setTimeout(() => tryRenderCharts(retryCount + 1), 200)
  }
}

// 渲染图表
const renderCharts = () => {
  if (!props.enableRealtimeMonitor) return
  // 只有在实时监控Tab时才渲染图表
  if (activeTab.value !== 'realtime') {
    console.log('[诊断] 不在实时监控Tab，跳过图表渲染')
    return
  }

  // 等待DOM完全渲染后再初始化图表
  nextTick(() => {
    setTimeout(() => {
      tryRenderCharts()
    }, 300) // 增加延迟时间确保DOM已渲染
  })
}

// 监听Tab切换
watch(activeTab, (newTab) => {
  console.log('[诊断] Tab切换到:', newTab)
  if (newTab === 'realtime' && props.enableRealtimeMonitor) {
    // 切换到实时监控Tab时重新渲染图表
    console.log('[诊断] 重新渲染图表')
    renderCharts()
  }
})

// 渲染内存图表
const renderMemoryChart = () => {
  if (!memoryChartRef.value || memoryHistoryData.value.length === 0) {
    console.warn('Memory chart: No data or ref not ready')
    return
  }
  // 检查DOM是否有有效尺寸
  if (memoryChartRef.value.clientWidth === 0 || memoryChartRef.value.clientHeight === 0) {
    console.warn('Memory chart: DOM has no dimensions, skipping initialization')
    return
  }
  if (!memoryChart) memoryChart = echarts.init(memoryChartRef.value)

  const data = memoryHistoryData.value.sort((a, b) => a.collectTime - b.collectTime)
  const times = data.map(d => new Date(d.collectTime).toLocaleTimeString())

  console.log('Rendering memory chart with', data.length, 'data points')

  memoryChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['堆内存', '非堆内存'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: 'MB' },
    series: [
      {
        name: '堆内存',
        type: 'line',
        data: data.map(d => Math.round((d.heapUsed || 0) / 1024 / 1024)),
        smooth: true,
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '非堆内存',
        type: 'line',
        data: data.map(d => Math.round((d.nonHeapUsed || 0) / 1024 / 1024)),
        smooth: true,
        areaStyle: { opacity: 0.3 }
      }
    ]
  })

  // 确保图表正确渲染
  setTimeout(() => memoryChart?.resize(), 100)
}

// 渲染GC图表
const renderGcChart = () => {
  if (!gcChartRef.value || memoryHistoryData.value.length === 0) {
    console.warn('GC chart: No data or ref not ready')
    return
  }
  // 检查DOM是否有有效尺寸
  if (gcChartRef.value.clientWidth === 0 || gcChartRef.value.clientHeight === 0) {
    console.warn('GC chart: DOM has no dimensions, skipping initialization')
    return
  }
  if (!gcChart) gcChart = echarts.init(gcChartRef.value)

  const data = memoryHistoryData.value.sort((a, b) => a.collectTime - b.collectTime)
  const times = data.map(d => new Date(d.collectTime).toLocaleTimeString())

  gcChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['GC次数', 'GC耗时(ms)'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: [
      { type: 'value', name: '次数' },
      { type: 'value', name: '耗时(ms)' }
    ],
    series: [
      {
        name: 'GC次数',
        type: 'bar',
        data: data.map(d => d.gcCount || 0)
      },
      {
        name: 'GC耗时(ms)',
        type: 'line',
        yAxisIndex: 1,
        data: data.map(d => d.gcTimeMs || 0),
        smooth: true
      }
    ]
  })
  setTimeout(() => gcChart?.resize(), 100)
}

// 渲染线程图表
const renderThreadChart = () => {
  if (!threadChartRef.value || memoryHistoryData.value.length === 0) {
    console.warn('Thread chart: No data or ref not ready')
    return
  }
  // 检查DOM是否有有效尺寸
  if (threadChartRef.value.clientWidth === 0 || threadChartRef.value.clientHeight === 0) {
    console.warn('Thread chart: DOM has no dimensions, skipping initialization')
    return
  }
  if (!threadChart) threadChart = echarts.init(threadChartRef.value)

  const data = memoryHistoryData.value.sort((a, b) => a.collectTime - b.collectTime)
  const times = data.map(d => new Date(d.collectTime).toLocaleTimeString())

  threadChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['线程数', '峰值线程'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: '个' },
    series: [
      {
        name: '线程数',
        type: 'line',
        data: data.map(d => d.threadCount || 0),
        smooth: true,
        areaStyle: { opacity: 0.3 }
      },
      {
        name: '峰值线程',
        type: 'line',
        data: data.map(d => d.peakThreadCount || 0),
        smooth: true,
        lineStyle: { type: 'dashed' }
      }
    ]
  })
  setTimeout(() => threadChart?.resize(), 100)
}

// 渲染IO/网络图表
const renderIoChart = () => {
  if (!ioChartRef.value || memoryHistoryData.value.length === 0) {
    console.warn('IO chart: No data or ref not ready')
    return
  }
  // 检查DOM是否有有效尺寸
  if (ioChartRef.value.clientWidth === 0 || ioChartRef.value.clientHeight === 0) {
    console.warn('IO chart: DOM has no dimensions, skipping initialization')
    return
  }
  if (!ioChart) ioChart = echarts.init(ioChartRef.value)

  const data = memoryHistoryData.value.sort((a, b) => a.collectTime - b.collectTime)
  const times = data.map(d => new Date(d.collectTime).toLocaleTimeString())

  ioChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['磁盘读', '磁盘写', '网络收', '网络发'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: times },
    yAxis: { type: 'value', name: 'KB' },
    series: [
      {
        name: '磁盘读',
        type: 'line',
        data: data.map(d => Math.round((d.diskReadBytes || 0) / 1024)),
        smooth: true
      },
      {
        name: '磁盘写',
        type: 'line',
        data: data.map(d => Math.round((d.diskWriteBytes || 0) / 1024)),
        smooth: true
      },
      {
        name: '网络收',
        type: 'line',
        data: data.map(d => Math.round((d.networkRecvBytes || 0) / 1024)),
        smooth: true
      },
      {
        name: '网络发',
        type: 'line',
        data: data.map(d => Math.round((d.networkSentBytes || 0) / 1024)),
        smooth: true
      }
    ]
  })
  setTimeout(() => ioChart?.resize(), 100)
}

// 刷新数据
const refreshData = () => {
  emit('refresh', props.agentInfo)
  ElMessage.success('数据已刷新')
}

// 获取JVM信息
const fetchJvmInfo = async () => {
  console.log('[诊断] 点击获取JVM信息按钮')
  console.log('[诊断] props.agentInfo:', props.agentInfo)
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  console.log('[诊断] 开始获取JVM信息...')
  jvmInfoLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取JVM信息, agentId:', agentId)
    
    if (!agentId) {
      console.error('[诊断] agentId为空')
      ElMessage.error('无法获取Agent ID，请确认Agent是否在线')
      return
    }
    
    console.log('[诊断] 调用agentJvmInfo API...')
    const res = await agentJvmInfo(agentId)
    console.log('[诊断] JVM信息响应:', res ? '有数据' : '无数据', res)
    
    if (!res) {
      ElMessage.warning('未获取到JVM信息，可能原因：\n1. Agent未启动或未连接\n2. Agent已离线\n3. 网络连接问题')
      return
    }
    
    // 尝试解析JSON数据
    let data: any
    try {
      data = typeof res === 'string' ? JSON.parse(res) : res
    } catch (e) {
      console.error('[诊断] JVM信息解析失败', e)
      ElMessage.error('JVM信息格式错误，请联系开发人员')
      return
    }
    
    jvmInfoData.value = {
      heapUsed: data.heapUsed || 0,
      heapMax: data.heapMax || 0,
      heapPercent: data.heapMax ? Math.round((data.heapUsed / data.heapMax) * 100) : 0,
      nonHeapUsed: data.nonHeapUsed || 0,
      nonHeapMax: data.nonHeapMax || 0,
      nonHeapPercent: data.nonHeapMax ? Math.round((data.nonHeapUsed / data.nonHeapMax) * 100) : 0,
      threadCount: data.threadCount || 0,
      peakThreadCount: data.peakThreadCount || 0,
      javaVersion: data.javaVersion || data.vmVersion || 'N/A',
      vmName: data.vmName || 'N/A',
      uptime: data.uptime || data.uptimeMs || 0
    }
    
    console.log('[诊断] JVM信息加载成功', jvmInfoData.value)
    ElMessage.success('JVM快照获取成功')
  } catch (error: any) {
    console.error('[诊断] 获取JVM信息失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取JVM信息失败: ${errorMsg}`)
  } finally {
    console.log('[诊断] 设置jvmInfoLoading为false')
    jvmInfoLoading.value = false
  }
}

// 获取线程Dump
const fetchThreadDump = async () => {
  console.log('[诊断] 点击获取线程Dump按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  threadDumpLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取线程Dump, agentId:', agentId)
    
    if (!agentId) {
      console.error('[诊断] agentId为空')
      ElMessage.error('无法获取Agent ID，请确认Agent是否在线')
      return
    }
    
    const res = await agentThreadDump(agentId)
    console.log('[诊断] 线程Dump响应:', res ? '有数据' : '无数据')
    
    if (!res) {
      ElMessage.warning('未获取到线程Dump，可能Agent已离线')
      return
    }
    
    // 解析线程状态统计
    const lines = res.split('\n')
    let totalThreads = 0
    let running = 0
    let waiting = 0
    let blocked = 0
    let timedWaiting = 0
    
    lines.forEach(line => {
      if (line.includes('java.lang.Thread.State:')) {
        totalThreads++
        if (line.includes('RUNNABLE')) running++
        else if (line.includes('WAITING')) waiting++
        else if (line.includes('TIMED_WAITING')) timedWaiting++
        else if (line.includes('BLOCKED')) blocked++
      }
    })
    
    threadDumpData.value = {
      totalThreads,
      running,
      waiting: waiting + timedWaiting,
      blocked,
      raw: res
    }
    
    console.log(`[诊断] 线程Dump加载成功: ${totalThreads} 个线程`)
    ElMessage.success('线程Dump获取成功')
  } catch (error: any) {
    console.error('[诊断] 获取线程Dump失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取线程Dump失败: ${errorMsg}`)
  } finally {
    threadDumpLoading.value = false
  }
}

// 检测死锁
const fetchDeadlocks = async () => {
  console.log('[诊断] 点击死锁检测按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  deadlocksLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 检测死锁, agentId:', agentId)
    
    if (!agentId) {
      console.error('[诊断] agentId为空')
      ElMessage.error('无法获取Agent ID，请确认Agent是否在线')
      return
    }
    
    const res = await agentDeadlocks(agentId)
    console.log('[诊断] 死锁检测响应:', res ? '有数据' : '无数据')
    
    if (!res) {
      ElMessage.warning('未获取到死锁检测结果')
      return
    }
    
    // 检测是否包含死锁信息
    const hasDeadlock = res.includes('DEADLOCK DETECTED') || 
                       res.includes('Found deadlock') ||
                       (res.toLowerCase().includes('deadlock') && !res.includes('No deadlocks'))
    
    deadlocksData.value = {
      hasDeadlock,
      deadlocks: hasDeadlock ? [res] : []
    }
    
    if (hasDeadlock) {
      console.warn('[诊断] 发现死锁！')
      ElMessage.error('⚠️ 发现死锁！请立即处理')
    } else {
      console.log('[诊断] 未发现死锁')
      ElMessage.success('未发现死锁，系统运行正常')
    }
  } catch (error: any) {
    console.error('[诊断] 死锁检测失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`死锁检测失败: ${errorMsg}`)
  } finally {
    deadlocksLoading.value = false
  }
}

// 获取内存信息
const fetchMemoryInfo = async () => {
  console.log('[诊断] 点击内存信息按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  memoryInfoLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取内存信息, agentId:', agentId)
    const res = await agentMemory(agentId)
    resultDialogTitle.value = '💾 内存信息'
    resultData.value = res || '暂无数据'
    showResultDialog.value = true
    console.log('[诊断] 内存信息加载成功')
  } catch (error: any) {
    console.error('[诊断] 获取内存信息失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取内存信息失败: ${errorMsg}`)
  } finally {
    memoryInfoLoading.value = false
  }
}

// 获取GC统计
const fetchGcStats = async () => {
  console.log('[诊断] 点击GC统计按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  gcStatsLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取GC统计, agentId:', agentId)
    const res = await agentGcStats(agentId)
    resultDialogTitle.value = '♻️ GC统计'
    resultData.value = res || '暂无数据'
    showResultDialog.value = true
    console.log('[诊断] GC统计加载成功')
  } catch (error: any) {
    console.error('[诊断] 获取GC统计失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取GC统计失败: ${errorMsg}`)
  } finally {
    gcStatsLoading.value = false
  }
}

// 获取线程概要
const fetchThreadsSummary = async () => {
  console.log('[诊断] 点击线程概要按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  threadsSummaryLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取线程概要, agentId:', agentId)
    const res = await agentThreadsSummary(agentId)
    resultDialogTitle.value = '🧵 线程概要'
    resultData.value = res || '暂无数据'
    showResultDialog.value = true
    console.log('[诊断] 线程概要加载成功')
  } catch (error: any) {
    console.error('[诊断] 获取线程概要失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取线程概要失败: ${errorMsg}`)
  } finally {
    threadsSummaryLoading.value = false
  }
}

// 执行GC
const executeGC = async () => {
  console.log('[诊断] 点击执行GC按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  gcLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 执行GC, agentId:', agentId)
    await agentGc(agentId)
    ElMessage.success('GC执行成功')
    console.log('[诊断] GC执行成功')
  } catch (error: any) {
    console.error('[诊断] 执行GC失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`执行GC失败: ${errorMsg}`)
  } finally {
    gcLoading.value = false
  }
}

// 获取系统属性
const fetchSysProps = async () => {
  console.log('[诊断] 点击系统属性按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  sysPropsLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取系统属性, agentId:', agentId)
    const res = await agentSysProps(agentId)
    resultDialogTitle.value = '⚙️ 系统属性'
    resultData.value = res || '暂无数据'
    showResultDialog.value = true
    console.log('[诊断] 系统属性加载成功')
  } catch (error: any) {
    console.error('[诊断] 获取系统属性失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取系统属性失败: ${errorMsg}`)
  } finally {
    sysPropsLoading.value = false
  }
}

// 获取环境变量
const fetchEnvVars = async () => {
  console.log('[诊断] 点击环境变量按钮')
  
  if (!props.agentInfo) {
    console.warn('[诊断] agentInfo为空')
    ElMessage.warning('请先选择Agent实例')
    return
  }
  
  envVarsLoading.value = true
  try {
    const agentId = await getAgentId()
    console.log('[诊断] 获取环境变量, agentId:', agentId)
    const res = await agentEnv(agentId)
    resultDialogTitle.value = '🌍 环境变量'
    resultData.value = res || '暂无数据'
    showResultDialog.value = true
    console.log('[诊断] 环境变量加载成功')
  } catch (error: any) {
    console.error('[诊断] 获取环境变量失败', error)
    const errorMsg = error.response?.data?.message || error.message || '未知错误'
    ElMessage.error(`获取环境变量失败: ${errorMsg}`)
  } finally {
    envVarsLoading.value = false
  }
}

// 复制结果
const copyResult = async () => {
  try {
    await navigator.clipboard.writeText(resultData.value)
    ElMessage.success('已复制到剪贴板')
  } catch (error) {
    ElMessage.error('复制失败')
  }
}

// 格式化字节
const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

// 格式化运行时间
const formatUptime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  return `${hours}h ${minutes}m ${secs}s`
}

// 进度条颜色
const getProgressColor = (percentage: number) => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}

// 刷新数据
const refreshData = () => {
  console.log('[诊断] 刷新数据')
  if (activeTab.value === 'realtime') {
    loadHistoryData()
  } else if (activeTab.value === 'diagnostic') {
    // 清空当前数据
    jvmInfoData.value = null
    threadDumpData.value = null
    deadlocksData.value = null
    ElMessage.success('数据已清空，请重新获取')
  }
  emit('refresh', props.agentInfo)
}

// 初始化图表
const initCharts = () => {
  if (!props.enableRealtimeMonitor) return
  loadHistoryData()
}

// 监听agentInfo变化
watch(() => props.agentInfo, (newVal, oldVal) => {
  if (newVal && newVal !== oldVal && props.enableRealtimeMonitor) {
    console.log('Switching agent:', oldVal, '->', newVal)
    
    // 显示加载状态
    loading.value = true
    
    // 切换实例时清空旧数据
    memoryHistoryData.value = []
    jvmInfoData.value = null
    threadDumpData.value = null
    deadlocksData.value = null
    
    // 加载新实例的数据（loadHistoryData内部会设置loading=false）
    loadHistoryData()
  }
})

// 组件挂载
onMounted(() => {
  console.log('[诊断] 组件挂载')
  initCharts()

  // 添加窗口resize监听（带防抖）
  let resizeTimer: any = null
  const handleResize = () => {
    if (resizeTimer) clearTimeout(resizeTimer)
    resizeTimer = setTimeout(() => {
      console.log('[诊断] 窗口resize，重新调整图表')
      memoryChart?.resize()
      gcChart?.resize()
      threadChart?.resize()
      ioChart?.resize()
    }, 200)
  }
  window.addEventListener('resize', handleResize, { passive: true })

  // 保存清理函数
  ;(window as any).__agentDiagCleanup = handleResize
})

// 组件卸载
onUnmounted(() => {
  if (realtimeTimer.value) {
    clearInterval(realtimeTimer.value)
  }
  
  // 移除窗口resize监听
  if ((window as any).__agentDiagCleanup) {
    window.removeEventListener('resize', (window as any).__agentDiagCleanup)
    delete (window as any).__agentDiagCleanup
  }
  
  memoryChart?.dispose()
  gcChart?.dispose()
  threadChart?.dispose()
  ioChart?.dispose()
})

// 暴露方法供父组件调用
defineExpose({
  refreshData,
  fetchJvmInfo,
  fetchThreadDump,
  fetchDeadlocks
})
</script>

<style scoped>
.agent-diag-panel {
  padding: 16px;
}

.agent-info-bar {
  margin-bottom: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-actions {
  flex-shrink: 0;
}

.monitor-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.empty-data-tip {
  grid-column: 1 / -1;
  padding: 40px 0;
}

.chart-card {
  border-radius: 8px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 300px;
  width: 100%;
}

.raw-data-area {
  font-family: 'Courier New', monospace;
  font-size: 12px;
}

.diagnostic-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.diag-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.diag-content {
  padding: 8px 0;
}

.metric-item {
  text-align: center;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.metric-sub {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

.jvm-details {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 6px;
}

.detail-row {
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid #e4e7ed;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  width: 100px;
  color: #606266;
  font-weight: 500;
}

.detail-value {
  flex: 1;
  color: #303133;
}

.thread-summary {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.deadlock-warning {
  margin-top: 16px;
}

.deadlock-detail {
  margin-top: 12px;
}

.deadlock-detail pre {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
  margin-top: 8px;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.tool-card {
  text-align: center;
  padding: 24px 16px;
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 8px;
  user-select: none;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.tool-card:active {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tool-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.tool-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
}

.tool-desc {
  font-size: 13px;
  color: #909399;
}

.raw-data-area {
  font-family: 'Courier New', monospace;
  font-size: 13px;
}
</style>
