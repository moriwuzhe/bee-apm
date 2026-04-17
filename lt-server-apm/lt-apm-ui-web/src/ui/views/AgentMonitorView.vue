<template>
  <div class="monitor-container">
    <div class="page-head">
      <div class="title">Agent 实时监控</div>
      <div class="controls">
        <el-select v-model="selectedAgents" multiple placeholder="选择要监控的 Agent" style="width: 300px" @change="startMonitoring">
          <el-option v-for="agent in availableAgents" :key="agent.agentId" :label="agent.displayName" :value="agent.agentId" />
        </el-select>
        <el-button :loading="loading" type="primary" @click="refreshData">刷新</el-button>
        <el-switch v-model="autoRefreshEnabled" active-text="自动刷新" inactive-text="自动刷新" @change="toggleAutoRefresh" />
        <span v-if="autoRefreshEnabled" style="color: #909399; font-size: 12px; margin-left: 8px;">
          下次刷新: {{ countdown }}s
        </span>
        <el-button size="small" @click="clearHistory">清除历史</el-button>
        <el-button size="small" type="info" @click="debugHistory">调试数据</el-button>
      </div>
    </div>

    <!-- 无数据提示 -->
    <el-empty v-if="!selectedAgents || selectedAgents.length === 0" description="请选择要监控的 Agent" />

    <!-- 监控卡片网格 -->
    <div v-else class="monitor-grid">
      <el-card v-for="agentId in selectedAgents" :key="agentId" shadow="hover" class="agent-monitor-card">
        <template #header>
          <div class="card-header">
            <div class="agent-info">
              <span class="agent-name">{{ getAgentDisplayName(agentId) }}</span>
              <el-tag :type="getAgentStatus(agentId) ? 'success' : 'danger'" size="small">
                {{ getAgentStatus(agentId) ? '在线' : '离线' }}
              </el-tag>
            </div>
            <div class="last-update">
              更新于: {{ formatTime(agentMetrics[agentId]?.lastUpdate) }}
            </div>
          </div>
        </template>

        <div v-if="agentMetrics[agentId]" class="metrics-content">
          <!-- 瞬时指标 -->
          <el-row :gutter="16" class="metrics-row">
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">堆内存使用</div>
                <div class="metric-value">{{ formatBytes(agentMetrics[agentId].heapUsed) }}</div>
                <div class="metric-subtitle">/ {{ formatBytes(agentMetrics[agentId].heapMax) }}</div>
                <el-progress 
                  :percentage="agentMetrics[agentId].heapPercent" 
                  :color="getProgressColor(agentMetrics[agentId].heapPercent)"
                  :stroke-width="8"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">非堆内存使用</div>
                <div class="metric-value">{{ formatBytes(agentMetrics[agentId].nonHeapUsed) }}</div>
                <div class="metric-subtitle">/ {{ formatBytes(agentMetrics[agentId].nonHeapMax) }}</div>
                <el-progress 
                  :percentage="agentMetrics[agentId].nonHeapPercent" 
                  :color="getProgressColor(agentMetrics[agentId].nonHeapPercent)"
                  :stroke-width="8"
                />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="metric-item">
                <div class="metric-label">线程数</div>
                <div class="metric-value large">{{ agentMetrics[agentId].threadCount }}</div>
                <div class="metric-subtitle">峰值: {{ agentMetrics[agentId].peakThreadCount }}</div>
              </div>
            </el-col>
          </el-row>

          <!-- 历史趋势图 -->
          <div class="chart-section">
            <div class="chart-title">堆内存趋势（最近1小时）</div>
            <div :id="`chart-heap-${agentId}`" class="echart-container"></div>
          </div>

          <div class="chart-section">
            <div class="chart-title">线程数趋势（最近1小时）</div>
            <div :id="`chart-thread-${agentId}`" class="echart-container"></div>
          </div>
        </div>

        <el-empty v-else description="暂无数据" :image-size="80" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'
import { http } from '../../api/http'
import { metricHistoryStore, type MetricRecord } from '../../utils/metricHistory'

interface AgentInfo {
  agentId: string
  displayName: string
  app: string
  inst: string
}

interface AgentMetric {
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  threadCount: number
  peakThreadCount: number
  youngGcCount: number
  youngGcTime: number
  fullGcCount: number
  fullGcTime: number
  uptimeMs: number
  lastUpdate: number
}

const loading = ref(false)
const availableAgents = ref<AgentInfo[]>([])
const selectedAgents = ref<string[]>([])
const agentMetrics = ref<Record<string, AgentMetric>>({})
const autoRefreshEnabled = ref(true)
const countdown = ref(10)
let refreshTimer: any = null
let countdownTimer: any = null
const chartInstances = ref<Record<string, any>>({})

// 获取可用 Agent 列表
const loadAvailableAgents = async () => {
  try {
    const res = await http.get('/api/diag/agent/version/detail')
    const agents = (res.data as any)?.result || []
    
    availableAgents.value = agents.map((agent: any) => ({
      agentId: agent.agentId,
      displayName: formatAgentId(agent.agentId),
      app: agent.agentId.split('@')[0] || '',
      inst: agent.agentId.split('@')[2] || ''
    }))
    
    console.log(`[Monitor] Loaded ${availableAgents.value.length} agents`)
    
    // 默认选中第一个在线的 Agent
    if (selectedAgents.value.length === 0 && availableAgents.value.length > 0) {
      selectedAgents.value = [availableAgents.value[0].agentId]
      console.log(`[Monitor] Auto-selected agent: ${selectedAgents.value[0]}`)
      startMonitoring()
    }
  } catch (e: any) {
    console.error('Failed to load agents:', e)
    ElMessage.error('加载 Agent 列表失败')
  }
}

// 格式化 Agent ID
const formatAgentId = (agentId: string): string => {
  const parts = agentId.split('@')
  if (parts.length >= 3) {
    return `${parts[0]}@${parts[2]}`
  }
  return agentId
}

// 获取 Agent 显示名称
const getAgentDisplayName = (agentId: string): string => {
  const agent = availableAgents.value.find(a => a.agentId === agentId)
  return agent?.displayName || agentId
}

// 获取 Agent 状态
const getAgentStatus = (agentId: string): boolean => {
  return !!agentMetrics.value[agentId]
}

// 刷新单个 Agent 的数据
const refreshAgentData = async (agentId: string) => {
  try {
    const res = await http.get('/api/diag/agent/jvmInfo', { 
      params: { agentId } 
    })
    const result = (res.data as any)?.result || ''
    
    if (result) {
      const metrics = parseJvmData(result)
      metrics.lastUpdate = Date.now()
      agentMetrics.value[agentId] = metrics
      
      // 保存到历史数据
      try {
        await metricHistoryStore.save({
          agentId,
          timestamp: Date.now(),
          heapUsed: metrics.heapUsed,
          heapMax: metrics.heapMax,
          heapPercent: metrics.heapPercent,
          nonHeapUsed: metrics.nonHeapUsed,
          nonHeapMax: metrics.nonHeapMax,
          nonHeapPercent: metrics.nonHeapPercent,
          threadCount: metrics.threadCount,
          peakThreadCount: metrics.peakThreadCount,
          uptimeMs: metrics.uptimeMs
        })
        console.log(`[Monitor] Saved metrics for ${agentId}, heap: ${metrics.heapPercent}%, threads: ${metrics.threadCount}`)
      } catch (saveError) {
        console.error('[Monitor] Failed to save metrics:', saveError)
      }
      
      // 更新图表
      await nextTick()
      updateCharts(agentId)
    }
  } catch (e: any) {
    console.error(`Failed to refresh agent ${agentId}:`, e)
  }
}

// 解析 JVM 数据
const parseJvmData = (text: string): AgentMetric => {
  const lines = text.split('\n')
  const metrics: any = {
    heapUsed: 0, heapMax: 0, heapPercent: 0,
    nonHeapUsed: 0, nonHeapMax: 0, nonHeapPercent: 0,
    threadCount: 0, peakThreadCount: 0,
    youngGcCount: 0, youngGcTime: 0,
    fullGcCount: 0, fullGcTime: 0,
    uptimeMs: 0,
    lastUpdate: 0
  }
  
  lines.forEach(line => {
    if (line.includes('Heap:')) {
      metrics.heapUsed = extractNumber(line, 'used=')
      metrics.heapMax = extractNumber(line, 'max=')
      metrics.heapPercent = metrics.heapMax ? Math.round((metrics.heapUsed / metrics.heapMax) * 100) : 0
    } else if (line.includes('NonHeap:')) {
      metrics.nonHeapUsed = extractNumber(line, 'used=')
      metrics.nonHeapMax = extractNumber(line, 'max=')
      metrics.nonHeapPercent = metrics.nonHeapMax ? Math.round((metrics.nonHeapUsed / metrics.nonHeapMax) * 100) : 0
    } else if (line.startsWith('ThreadCount:')) {
      metrics.threadCount = parseInt(line.split(':')[1]?.trim() || '0')
    } else if (line.startsWith('PeakThreadCount:')) {
      metrics.peakThreadCount = parseInt(line.split(':')[1]?.trim() || '0')
    } else if (line.startsWith('UptimeMs:')) {
      metrics.uptimeMs = parseInt(line.split(':')[1]?.trim() || '0')
    }
  })
  
  return metrics
}

// 提取数字
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

// 刷新所有选中的 Agent
const refreshData = async () => {
  loading.value = true
  try {
    await Promise.all(selectedAgents.value.map(agentId => refreshAgentData(agentId)))
  } catch (e: any) {
    ElMessage.error('刷新失败')
  } finally {
    loading.value = false
    countdown.value = 10
  }
}

// 开始监控
const startMonitoring = () => {
  if (autoRefreshEnabled.value) {
    toggleAutoRefresh(true)
  }
}

// 切换自动刷新
const toggleAutoRefresh = (enabled?: boolean) => {
  const state = enabled !== undefined ? enabled : autoRefreshEnabled.value
  
  if (state) {
    // 启动倒计时
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        countdown.value = 10
      }
    }, 1000)
    
    // 启动定时刷新
    refreshTimer = setInterval(() => {
      refreshData()
    }, 10000)
  } else {
    // 停止定时器
    if (countdownTimer) {
      clearInterval(countdownTimer)
      countdownTimer = null
    }
    if (refreshTimer) {
      clearInterval(refreshTimer)
      refreshTimer = null
    }
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

// 格式化时间
const formatTime = (timestamp?: number): string => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN')
}

// 获取进度条颜色
const getProgressColor = (percent: number): string => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

// 更新图表
const updateCharts = async (agentId: string) => {
  try {
    // 获取最近 1 小时的数据
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const records = await metricHistoryStore.query(agentId, oneHourAgo, Date.now())
    
    console.log(`[Monitor] Query result for ${agentId}: ${records.length} records`)
    
    if (records.length === 0) {
      console.warn(`[Monitor] No historical data for ${agentId}`)
      return
    }
    
    // 更新堆内存图表
    updateHeapChart(agentId, records)
    
    // 更新线程数图表
    updateThreadChart(agentId, records)
  } catch (e) {
    console.error('Failed to update charts:', e)
  }
}

// 更新堆内存图表
const updateHeapChart = (agentId: string, records: MetricRecord[]) => {
  const chartId = `chart-heap-${agentId}`
  const chartDom = document.getElementById(chartId)
  if (!chartDom) return
  
  let chart = chartInstances.value[chartId]
  if (!chart) {
    chart = echarts.init(chartDom)
    chartInstances.value[chartId] = chart
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const time = new Date(params[0].value[0]).toLocaleTimeString()
        const used = formatBytes(params[0].value[1])
        const percent = params[0].value[2]
        return `${time}<br/>已使用: ${used}<br/>使用率: ${percent}%`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: '{HH}:{mm}' }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1024 * 1024 * 1024) return (value / (1024 * 1024 * 1024)).toFixed(1) + ' GB'
          if (value >= 1024 * 1024) return (value / (1024 * 1024)).toFixed(0) + ' MB'
          return value
        }
      }
    },
    series: [
      {
        name: '堆内存',
        type: 'line',
        smooth: true,
        data: records.map(r => [r.timestamp, r.heapUsed, r.heapPercent]),
        lineStyle: { color: '#409eff', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
}

// 更新线程数图表
const updateThreadChart = (agentId: string, records: MetricRecord[]) => {
  const chartId = `chart-thread-${agentId}`
  const chartDom = document.getElementById(chartId)
  if (!chartDom) return
  
  let chart = chartInstances.value[chartId]
  if (!chart) {
    chart = echarts.init(chartDom)
    chartInstances.value[chartId] = chart
  }
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const time = new Date(params[0].value[0]).toLocaleTimeString()
        const count = params[0].value[1]
        return `${time}<br/>线程数: ${count}`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'time',
      axisLabel: { formatter: '{HH}:{mm}' }
    },
    yAxis: {
      type: 'value',
      minInterval: 1
    },
    series: [
      {
        name: '线程数',
        type: 'line',
        smooth: true,
        data: records.map(r => [r.timestamp, r.threadCount]),
        lineStyle: { color: '#67c23a', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(103, 194, 58, 0.3)' },
            { offset: 1, color: 'rgba(103, 194, 58, 0.05)' }
          ])
        }
      }
    ]
  }
  
  chart.setOption(option)
}

// 清除历史数据
const clearHistory = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要清除所有历史监控数据吗？此操作不可恢复。',
      '清除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
    
    await metricHistoryStore.clear()
    
    // 销毁所有图表实例
    Object.values(chartInstances.value).forEach(chart => chart.dispose())
    chartInstances.value = {}
    
    ElMessage.success('历史数据已清除')
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('清除失败')
    }
  }
}

// 调试历史数据
const debugHistory = async () => {
  if (!selectedAgents.value || selectedAgents.value.length === 0) {
    ElMessage.warning('请先选择一个 Agent')
    return
  }
  
  const agentId = selectedAgents.value[0]
  try {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const records = await metricHistoryStore.query(agentId, oneHourAgo, Date.now())
    
    console.log('=== IndexedDB 调试信息 ===')
    console.log('Agent ID:', agentId)
    console.log('查询范围:', new Date(oneHourAgo).toLocaleString(), '-', new Date().toLocaleString())
    console.log('记录数量:', records.length)
    if (records.length > 0) {
      console.log('第一条记录:', records[0])
      console.log('最后一条记录:', records[records.length - 1])
      console.log('所有记录:', records)
    }
    
    ElMessage.info(`调试信息已输出到控制台 (F12 → Console)，共 ${records.length} 条记录`)
  } catch (e: any) {
    console.error('调试失败:', e)
    ElMessage.error('调试失败: ' + e.message)
  }
}

onMounted(async () => {
  // 初始化 IndexedDB
  try {
    await metricHistoryStore.init()
    console.log('[Monitor] IndexedDB initialized successfully')
  } catch (e) {
    console.error('[Monitor] Failed to initialize IndexedDB:', e)
    ElMessage.warning('历史数据存储初始化失败，图表功能可能不可用')
  }
  
  loadAvailableAgents()
  if (autoRefreshEnabled.value) {
    toggleAutoRefresh(true)
  }
})

onUnmounted(() => {
  toggleAutoRefresh(false)
  // 销毁所有图表实例
  Object.values(chartInstances.value).forEach(chart => chart.dispose())
  chartInstances.value = {}
})
</script>

<style scoped>
.monitor-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
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

.monitor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(600px, 1fr));
  gap: var(--space-4);
}

.agent-monitor-card {
  transition: all 0.3s ease;
}

.agent-monitor-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.agent-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.agent-name {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.last-update {
  font-size: 12px;
  color: #909399;
}

.metrics-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.metrics-row {
  margin-bottom: 0;
}

.metric-item {
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
  text-align: center;
}

.metric-item.uptime {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.metric-item.uptime .metric-label,
.metric-item.uptime .metric-value,
.metric-item.uptime .metric-subtitle {
  color: white;
}

.metric-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-value.large {
  font-size: 32px;
}

.metric-subtitle {
  font-size: 12px;
  color: #c0c4cc;
}

.chart-section {
  margin-top: 20px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
  padding-left: 8px;
  border-left: 3px solid #409eff;
}

.echart-container {
  width: 100%;
  height: 250px;
  background: #fafafa;
  border-radius: 4px;
}
</style>
