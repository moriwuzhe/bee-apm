<template>
  <div class="jvm-cpu-container">
    <div class="page-header">
      <h2>⚡ JVM CPU监控</h2>
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
      <el-row :gutter="16" style="margin-bottom: 20px;">
        <el-col :span="8">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">进程CPU使用率</div>
            <div class="metric-value">{{ latestProcessCpu }}%</div>
            <el-progress :percentage="latestProcessCpu" :color="getProgressColor(latestProcessCpu)" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">系统CPU使用率</div>
            <div class="metric-value">{{ latestSystemCpu }}%</div>
            <el-progress :percentage="latestSystemCpu" :color="getProgressColor(latestSystemCpu)" />
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">可用处理器</div>
            <div class="metric-value">{{ availableProcessors }}</div>
            <div class="metric-subtitle">核心数</div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :span="24">
          <div ref="cpuChartRef" class="chart-box-large"></div>
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
const cpuChartRef = ref<HTMLElement>()
let cpuChartInstance: any = null

const latestProcessCpu = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const cpu = memoryHistory.value[memoryHistory.value.length - 1].processCpuLoad || 0
  return Number((cpu * 100).toFixed(1))
})

const latestSystemCpu = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const cpu = memoryHistory.value[memoryHistory.value.length - 1].systemCpuLoad || 0
  return Number((cpu * 100).toFixed(1))
})

const availableProcessors = computed(() => {
  // TODO: 需要从后端添加此字段
  return 0
})

const getProgressColor = (percent: number): string => {
  if (percent < 60) return '#67c23a'
  if (percent < 80) return '#e6a23c'
  return '#f56c6c'
}

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

  if (cpuChartRef.value) {
    if (!cpuChartInstance) cpuChartInstance = echarts.init(cpuChartRef.value)
    cpuChartInstance.setOption({
      title: { text: 'CPU使用率趋势', left: 'center' },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>` })
        return result
      }},
      legend: { data: ['进程CPU', '系统CPU'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: 'CPU%', max: 100 },
      series: [
        { name: '进程CPU', type: 'line', data: memoryHistory.value.map(m => ((m.processCpuLoad || 0) * 100).toFixed(1)), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
        { name: '系统CPU', type: 'line', data: memoryHistory.value.map(m => ((m.systemCpuLoad || 0) * 100).toFixed(1)), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
      ]
    })
    cpuChartInstance.resize()
  }
}

onMounted(() => { loadApplications() })
onUnmounted(() => { if (realtimeTimer) { clearInterval(realtimeTimer); realtimeTimer = null } })
</script>

<style scoped>
.jvm-cpu-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.charts-container { animation: fadeIn 0.3s ease-in; }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
.metric-card { text-align: center; }
.metric-title { font-size: 14px; color: #909399; margin-bottom: 8px; }
.metric-value { font-size: 24px; font-weight: 700; color: #303133; margin-bottom: 4px; }
.metric-subtitle { font-size: 12px; color: #c0c4cc; }
.charts-row { margin-bottom: 20px; }
.chart-box-large { height: 400px; background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06); }
</style>
