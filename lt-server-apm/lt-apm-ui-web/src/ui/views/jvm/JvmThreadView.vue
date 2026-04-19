<template>
  <div class="jvm-thread-container">
    <div class="page-header">
      <h2>🧵 JVM线程监控</h2>
      <div class="controls">
        <el-select v-model="selectedApp" placeholder="选择应用" style="width: 200px; margin-right: 10px;" @change="onAppChange">
          <el-option v-for="app in applications" :key="app.appCode" :label="app.appName" :value="app.appCode" />
        </el-select>
        <el-select v-model="selectedInst" placeholder="选择实例" style="width: 200px; margin-right: 10px;">
          <el-option v-for="inst in instances" :key="inst.inst" :label="inst.inst" :value="inst.inst" />
        </el-select>
        <el-select v-model="timeRange" placeholder="时间范围" style="width: 150px; margin-right: 10px;">
          <el-option label="最近1小时" :value="1" />
          <el-option label="最近6小时" :value="6" />
          <el-option label="最近24小时" :value="24" />
          <el-option label="最近7天" :value="168" />
        </el-select>
        <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
        
        <el-divider direction="vertical" />
        <el-switch v-model="enableRealtime" active-text="实时监控" @change="toggleRealtime" />
        <el-select v-if="enableRealtime" v-model="pollingInterval" placeholder="轮询间隔" style="width: 120px; margin-left: 10px;">
          <el-option label="3秒" :value="3000" />
          <el-option label="5秒" :value="5000" />
          <el-option label="10秒" :value="10000" />
          <el-option label="30秒" :value="30000" />
        </el-select>
        <el-tag v-if="enableRealtime" type="success" effect="dark" style="margin-left: 10px;">
          <el-icon class="is-loading"><Connection /></el-icon>
          监控中
        </el-tag>
      </div>
    </div>

    <div v-if="memoryHistory.length > 0" class="charts-container">
      <!-- Key Metrics Cards -->
      <el-row :gutter="16" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">当前线程数</div>
            <div class="metric-value">{{ latestThreadCount }}</div>
            <div class="metric-subtitle">峰值: {{ maxThreadCount }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">守护线程</div>
            <div class="metric-value">{{ latestDaemonThreadCount }}</div>
            <div class="metric-subtitle">占比: {{ daemonPercent }}%</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">累计加载类</div>
            <div class="metric-value">{{ latestTotalLoadedClass }}</div>
            <div class="metric-subtitle">当前: {{ latestLoadedClass }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">卸载类数量</div>
            <div class="metric-value">{{ latestUnloadedClass }}</div>
            <div class="metric-subtitle">净增加: {{ netLoadedClass }}</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- Thread Charts -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="threadChartRef" class="chart-box"></div>
        </el-col>
        <el-col :span="12">
          <div ref="classLoadingChartRef" class="chart-box"></div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="threadStatesChartRef" class="chart-box"></div>
        </el-col>
        <el-col :span="12">
          <div ref="classLoadingDetailChartRef" class="chart-box"></div>
        </el-col>
      </el-row>

      <!-- Top CPU Threads Table -->
      <el-row :gutter="16" class="charts-row" v-if="latestTopCpuThreads.length > 0">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header>
              <div class="card-header">
                <span>🔥 Top CPU线程</span>
              </div>
            </template>
            <el-table :data="latestTopCpuThreads" border stripe size="small" max-height="300">
              <el-table-column prop="threadName" label="线程名称" min-width="200" />
              <el-table-column label="CPU时间" width="150" align="right">
                <template #default="{ row }">{{ formatNanoTime(row.cpuTimeNs) }}</template>
              </el-table-column>
              <el-table-column prop="state" label="状态" width="120" />
              <el-table-column prop="blockedCount" label="Blocked" width="100" align="right" />
              <el-table-column prop="waitedCount" label="Waited" width="100" align="right" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="请选择应用和实例，点击查询加载数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection } from '@element-plus/icons-vue'
import { fetchApplications } from '../../../api/project'
import { http } from '../../../api/http'
import { getMemoryHistory, type AgentMemoryMetrics } from '../../../api/agent'
import * as echarts from 'echarts'

const applications = ref<any[]>([])
const instances = ref<any[]>([])
const selectedApp = ref('')
const selectedInst = ref('')
const timeRange = ref(6)
const loading = ref(false)
const memoryHistory = ref<AgentMemoryMetrics[]>([])

const enableRealtime = ref(false)
const pollingInterval = ref(5000)
let realtimeTimer: number | null = null

const threadChartRef = ref<HTMLElement>()
const classLoadingChartRef = ref<HTMLElement>()
const threadStatesChartRef = ref<HTMLElement>()
const classLoadingDetailChartRef = ref<HTMLElement>()

let threadChartInstance: any = null
let classLoadingChartInstance: any = null
let threadStatesChartInstance: any = null
let classLoadingDetailChartInstance: any = null

// Computed properties
const latestThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].threadCount || 0
})

const maxThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return Math.max(...memoryHistory.value.map(m => m.peakThreadCount || 0))
})

const latestDaemonThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].daemonThreadCount || 0
})

const daemonPercent = computed(() => {
  const total = latestThreadCount.value
  const daemon = latestDaemonThreadCount.value
  return total > 0 ? ((daemon / total) * 100).toFixed(1) : '0'
})

const latestLoadedClass = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].loadedClassCount || 0
})

const latestTotalLoadedClass = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].totalLoadedClassCount || 0
})

const latestUnloadedClass = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].unloadedClassCount || 0
})

const netLoadedClass = computed(() => {
  return latestTotalLoadedClass.value - latestUnloadedClass.value
})

const latestTopCpuThreads = computed(() => {
  if (memoryHistory.value.length === 0 || !memoryHistory.value[0].topCpuThreads) return []
  try {
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    return JSON.parse(latest.topCpuThreads!)
  } catch (e) {
    return []
  }
})

const formatNanoTime = (ns: number): string => {
  if (!ns) return '0s'
  const ms = ns / 1000000
  if (ms < 1000) return `${ms.toFixed(2)}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(2)}s`
  const minutes = seconds / 60
  return `${minutes.toFixed(2)}min`
}

const loadApplications = async () => {
  try {
    applications.value = await fetchApplications()
  } catch (e: any) {
    ElMessage.error(e.message || '加载应用列表失败')
  }
}

const loadInstances = async () => {
  if (!selectedApp.value) return
  try {
    const res = await http.get('/api/agent/instances')
    const allInstances = (res.data as any)?.result || []
    instances.value = allInstances.filter((i: any) => i.app === selectedApp.value && i.online)
  } catch (e: any) {
    ElMessage.error(e.message || '加载实例列表失败')
  }
}

const onAppChange = () => {
  selectedInst.value = ''
  instances.value = []
  loadInstances()
}

const loadData = async () => {
  if (!selectedApp.value || !selectedInst.value) {
    ElMessage.warning('请选择应用和实例')
    return
  }

  loading.value = true
  try {
    const endTime = Date.now()
    const startTime = endTime - timeRange.value * 3600 * 1000

    memoryHistory.value = await getMemoryHistory(
      selectedApp.value,
      selectedInst.value,
      startTime,
      endTime,
      200
    )

    memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)

    setTimeout(() => {
      renderCharts()
    }, 300)

    ElMessage.success(`加载了 ${memoryHistory.value.length} 条记录`)
  } catch (e: any) {
    ElMessage.error(e.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

const loadLatestMetrics = async () => {
  if (!selectedApp.value || !selectedInst.value) return
  
  try {
    const endTime = Date.now()
    const startTime = endTime - 60000
    
    const newData = await getMemoryHistory(selectedApp.value, selectedInst.value, startTime, endTime, 10)
    
    if (newData.length > 0) {
      const existingTimes = new Set(memoryHistory.value.map(m => m.collectTime))
      
      newData.forEach(metric => {
        if (!existingTimes.has(metric.collectTime)) {
          memoryHistory.value.push(metric)
        }
      })
      
      if (memoryHistory.value.length > 200) {
        memoryHistory.value = memoryHistory.value.slice(-200)
      }
      
      memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
      renderCharts()
    }
  } catch (e: any) {
    console.error('Failed to load latest metrics:', e)
  }
}

const toggleRealtime = (enabled: boolean) => {
  if (enabled) {
    ElMessage.info(`已开启实时监控，轮询间隔：${pollingInterval.value / 1000}秒`)
    loadLatestMetrics()
    realtimeTimer = setInterval(() => {
      loadLatestMetrics()
    }, pollingInterval.value)
  } else {
    if (realtimeTimer) {
      clearInterval(realtimeTimer)
      realtimeTimer = null
    }
    ElMessage.info('已关闭实时监控')
  }
}

watch(pollingInterval, (newInterval) => {
  if (enableRealtime.value && realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = setInterval(() => {
      loadLatestMetrics()
    }, newInterval)
    ElMessage.success(`轮询间隔已更新为 ${newInterval / 1000}秒`)
  }
})

const renderCharts = () => {
  if (memoryHistory.value.length === 0) return

  const times = memoryHistory.value.map(m => {
    const date = new Date(m.collectTime)
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  })

  // Thread Count Chart
  if (threadChartRef.value) {
    if (!threadChartInstance) threadChartInstance = echarts.init(threadChartRef.value)
    threadChartInstance.setOption({
      title: { text: '线程数趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['当前线程', '峰值线程'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '线程数' },
      series: [
        { name: '当前线程', type: 'line', data: memoryHistory.value.map(m => m.threadCount || 0), smooth: true },
        { name: '峰值线程', type: 'line', data: memoryHistory.value.map(m => m.peakThreadCount || 0), smooth: true, lineStyle: { type: 'dashed' } }
      ]
    })
    threadChartInstance.resize()
  }

  // Class Loading Chart
  if (classLoadingChartRef.value) {
    if (!classLoadingChartInstance) classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
    classLoadingChartInstance.setOption({
      title: { text: '类加载统计', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['已加载', '已卸载'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '类数量' },
      series: [
        { name: '已加载', type: 'line', data: memoryHistory.value.map(m => m.loadedClassCount || 0), smooth: true },
        { name: '已卸载', type: 'line', data: memoryHistory.value.map(m => m.unloadedClassCount || 0), smooth: true }
      ]
    })
    classLoadingChartInstance.resize()
  }

  // Thread States Pie Chart
  if (threadStatesChartRef.value && memoryHistory.value[0].threadStates) {
    if (!threadStatesChartInstance) threadStatesChartInstance = echarts.init(threadStatesChartRef.value)
    try {
      const threadStates: any = JSON.parse(memoryHistory.value[memoryHistory.value.length - 1].threadStates!)
      const pieData = Object.entries(threadStates).map(([name, value]) => ({ name, value }))
      
      threadStatesChartInstance.setOption({
        title: { text: '线程状态分布', left: 'center' },
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { orient: 'vertical', left: 'left' },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          data: pieData,
          emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
        }]
      })
      threadStatesChartInstance.resize()
    } catch (e) {
      console.error('Failed to parse thread states:', e)
    }
  }

  // Class Loading Detail Chart
  if (classLoadingDetailChartRef.value) {
    if (!classLoadingDetailChartInstance) classLoadingDetailChartInstance = echarts.init(classLoadingDetailChartRef.value)
    const totalLoadedData = memoryHistory.value.map(m => m.totalLoadedClassCount || 0)
    classLoadingDetailChartInstance.setOption({
      title: { text: '累计加载类趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '类数量' },
      series: [{ name: '累计加载', type: 'line', data: totalLoadedData, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }]
    })
    classLoadingDetailChartInstance.resize()
  }
}

onMounted(() => {
  loadApplications()
})

onUnmounted(() => {
  if (realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = null
  }
})
</script>

<style scoped>
.jvm-thread-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.charts-container {
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.metric-card {
  text-align: center;
}

.metric-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.metric-value {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 4px;
}

.metric-subtitle {
  font-size: 12px;
  color: #c0c4cc;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-box {
  height: 320px;
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  font-weight: 600;
  font-size: 14px;
}
</style>
