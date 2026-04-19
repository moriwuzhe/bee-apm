<template>
  <div class="jvm-advanced-container">
    <div class="page-header">
      <h2>🚀 JVM高级监控</h2>
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
        </el-select>
        <el-button type="primary" @click="loadData" :loading="loading">查询</el-button>
        
        <el-divider direction="vertical" />
        <el-switch v-model="enableRealtime" active-text="实时监控" @change="toggleRealtime" />
        <el-select v-if="enableRealtime" v-model="pollingInterval" style="width: 120px; margin-left: 10px;">
          <el-option label="3秒" :value="3000" />
          <el-option label="5秒" :value="5000" />
          <el-option label="10秒" :value="10000" />
        </el-select>
        <el-tag v-if="enableRealtime" type="success" effect="dark" style="margin-left: 10px;">监控中</el-tag>
      </div>
    </div>

    <div v-if="memoryHistory.length > 0" class="charts-container">
      <!-- JVM Info Card -->
      <el-row :gutter="16" style="margin-bottom: 20px;">
        <el-col :span="24">
          <el-card shadow="hover">
            <template #header><span>☕ JVM信息</span></template>
            <el-descriptions :column="4" border size="small">
              <el-descriptions-item label="JVM启动时间">{{ jvmStartTimeStr }}</el-descriptions-item>
              <el-descriptions-item label="运行时长">{{ jvmUptimeStr }}</el-descriptions-item>
              <el-descriptions-item label="峰值线程数">{{ latestPeakThreadCount }}</el-descriptions-item>
              <el-descriptions-item label="守护线程数">{{ latestDaemonThreadCount }}</el-descriptions-item>
            </el-descriptions>
          </el-card>
        </el-col>
      </el-row>

      <!-- Thread Pools & Class Loading Rate -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="threadPoolsChartRef" class="chart-box"></div>
        </el-col>
        <el-col :span="12">
          <div ref="classLoadingRateChartRef" class="chart-box"></div>
        </el-col>
      </el-row>
    </div>

    <el-empty v-else description="请选择应用和实例，点击查询加载数据" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
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
const threadPoolsChartRef = ref<HTMLElement>()
const classLoadingRateChartRef = ref<HTMLElement>()
let threadPoolsChartInstance: any = null
let classLoadingRateChartInstance: any = null

const latestPeakThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].peakThreadCount || 0
})

const latestDaemonThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].daemonThreadCount || 0
})

const jvmStartTimeStr = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const time = memoryHistory.value[0].jvmStartTime
  return time ? new Date(time).toLocaleString() : '-'
})

const jvmUptimeStr = computed(() => {
  if (memoryHistory.value.length === 0) return '-'
  const startTime = memoryHistory.value[0].jvmStartTime
  if (!startTime) return '-'
  const uptime = Date.now() - startTime
  const hours = Math.floor(uptime / 3600000)
  const minutes = Math.floor((uptime % 3600000) / 60000)
  return `${hours}小时${minutes}分钟`
})

const loadApplications = async () => {
  try { applications.value = await fetchApplications() }
  catch (e: any) { ElMessage.error(e.message || '加载失败') }
}

const loadInstances = async () => {
  if (!selectedApp.value) return
  try {
    const res = await http.get('/api/agent/instances')
    instances.value = ((res.data as any)?.result || []).filter((i: any) => i.app === selectedApp.value && i.online)
  } catch (e: any) { ElMessage.error(e.message || '加载失败') }
}

const onAppChange = () => { selectedInst.value = ''; instances.value = []; loadInstances() }

const loadData = async () => {
  if (!selectedApp.value || !selectedInst.value) { ElMessage.warning('请选择应用和实例'); return }
  loading.value = true
  try {
    const endTime = Date.now()
    memoryHistory.value = await getMemoryHistory(selectedApp.value, selectedInst.value, endTime - timeRange.value * 3600 * 1000, endTime, 200)
    memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
    setTimeout(() => renderCharts(), 300)
    ElMessage.success(`加载了 ${memoryHistory.value.length} 条记录`)
  } catch (e: any) { ElMessage.error(e.message || '加载失败') }
  finally { loading.value = false }
}

const loadLatestMetrics = async () => {
  if (!selectedApp.value || !selectedInst.value) return
  try {
    const endTime = Date.now()
    const newData = await getMemoryHistory(selectedApp.value, selectedInst.value, endTime - 60000, endTime, 10)
    if (newData.length > 0) {
      const existingTimes = new Set(memoryHistory.value.map(m => m.collectTime))
      newData.forEach(m => { if (!existingTimes.has(m.collectTime)) memoryHistory.value.push(m) })
      if (memoryHistory.value.length > 200) memoryHistory.value = memoryHistory.value.slice(-200)
      memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
      renderCharts()
    }
  } catch (e) { console.error(e) }
}

const toggleRealtime = (enabled: boolean) => {
  if (enabled) {
    loadLatestMetrics()
    realtimeTimer = setInterval(loadLatestMetrics, pollingInterval.value)
  } else {
    if (realtimeTimer) { clearInterval(realtimeTimer); realtimeTimer = null }
  }
}

watch(pollingInterval, (newInterval) => {
  if (enableRealtime.value && realtimeTimer) {
    clearInterval(realtimeTimer)
    realtimeTimer = setInterval(loadLatestMetrics, newInterval)
  }
})

const renderCharts = () => {
  if (memoryHistory.value.length === 0) return
  const times = memoryHistory.value.map(m => {
    const d = new Date(m.collectTime)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  })

  // Thread Pools Chart
  if (threadPoolsChartRef.value && memoryHistory.value[0].threadPools) {
    if (!threadPoolsChartInstance) threadPoolsChartInstance = echarts.init(threadPoolsChartRef.value)
    try {
      const latest = memoryHistory.value[memoryHistory.value.length - 1]
      const pools: any[] = JSON.parse(latest.threadPools!)
      const poolNames = pools.map(p => p.poolName)
      const poolCounts = pools.map(p => p.activeCount)
      
      threadPoolsChartInstance.setOption({
        title: { text: '线程池使用情况', left: 'center' },
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: poolNames, axisLabel: { interval: 0, rotate: 30 } },
        yAxis: { type: 'value', name: '线程数' },
        series: [{ name: '活跃线程', type: 'bar', data: poolCounts, itemStyle: { color: '#409eff' }, label: { show: true, position: 'top' } }]
      })
      threadPoolsChartInstance.resize()
    } catch (e) { console.error('Failed to parse threadPools:', e) }
  }

  // Class Loading Rate Chart
  if (classLoadingRateChartRef.value) {
    if (!classLoadingRateChartInstance) classLoadingRateChartInstance = echarts.init(classLoadingRateChartRef.value)
    const loadRates: number[] = []
    memoryHistory.value.forEach((m, i) => {
      if (i === 0) { loadRates.push(0); return }
      const prevM = memoryHistory.value[i - 1]
      const timeDiffSeconds = (m.collectTime - prevM.collectTime) / 1000
      if (timeDiffSeconds > 0) {
        const totalLoadedDiff = (m.totalLoadedClassCount || 0) - (prevM.totalLoadedClassCount || 0)
        loadRates.push(totalLoadedDiff / timeDiffSeconds)
      } else {
        loadRates.push(0)
      }
    })
    
    classLoadingRateChartInstance.setOption({
      title: { text: '类加载速率', left: 'center' },
      tooltip: { trigger: 'axis', formatter: (params: any) => params[0].name + '<br/>加载速率: ' + params[0].value.toFixed(2) + ' 类/秒' },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '类/秒' },
      series: [{ name: '加载速率', type: 'line', data: loadRates, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } }]
    })
    classLoadingRateChartInstance.resize()
  }
}

onMounted(() => { loadApplications() })
onUnmounted(() => { if (realtimeTimer) { clearInterval(realtimeTimer); realtimeTimer = null } })
</script>

<style scoped>
.jvm-advanced-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.charts-container { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.charts-row { margin-bottom: 20px; }
.chart-box { height: 320px; background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
</style>
