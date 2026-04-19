<template>
  <div class="jvm-gc-container">
    <div class="page-header">
      <h2>♻️ JVM GC分析</h2>
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
        
        <!-- 实时监控开关 -->
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
            <div class="metric-title">GC总次数</div>
            <div class="metric-value">{{ latestGcCount }}</div>
            <div class="metric-subtitle">Minor: {{ latestMinorGcCount }} / Full: {{ latestFullGcCount }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">GC总耗时</div>
            <div class="metric-value">{{ formatDuration(latestGcTimeMs) }}</div>
            <div class="metric-subtitle">Minor: {{ formatDuration(latestMinorGcTimeMs) }}</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">GC频率</div>
            <div class="metric-value">{{ gcFrequency }}</div>
            <div class="metric-subtitle">次/分钟</div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="metric-card">
            <div class="metric-title">平均GC耗时</div>
            <div class="metric-value">{{ avgGcDuration }}ms</div>
            <div class="metric-subtitle">每次GC平均</div>
          </el-card>
        </el-col>
      </el-row>

      <!-- GC Charts -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="gcCountChartRef" class="chart-box"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcDurationChartRef" class="chart-box"></div>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="minorVsFullGcChartRef" class="chart-box"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcEfficiencyChartRef" class="chart-box"></div>
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

// 实时监控相关
const enableRealtime = ref(false)
const pollingInterval = ref(5000)
let realtimeTimer: number | null = null

const gcCountChartRef = ref<HTMLElement>()
const gcDurationChartRef = ref<HTMLElement>()
const minorVsFullGcChartRef = ref<HTMLElement>()
const gcEfficiencyChartRef = ref<HTMLElement>()

let gcCountChartInstance: any = null
let gcDurationChartInstance: any = null
let minorVsFullGcChartInstance: any = null
let gcEfficiencyChartInstance: any = null

// Computed properties
const latestGcCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].gcCount || 0
})

const latestMinorGcCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].minorGcCount || 0
})

const latestFullGcCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].fullGcCount || 0
})

const latestGcTimeMs = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].gcTimeMs || 0
})

const latestMinorGcTimeMs = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].minorGcTimeMs || 0
})

const gcFrequency = computed(() => {
  if (memoryHistory.value.length < 2) return '0'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
  const gcDiff = last.gcCount - first.gcCount
  return timeDiffMinutes > 0 ? (gcDiff / timeDiffMinutes).toFixed(1) : '0'
})

const avgGcDuration = computed(() => {
  const count = latestGcCount.value
  const time = latestGcTimeMs.value
  return count > 0 ? (time / count).toFixed(2) : '0'
})

const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`
  const seconds = ms / 1000
  if (seconds < 60) return `${seconds.toFixed(1)}s`
  const minutes = seconds / 60
  return `${minutes.toFixed(1)}min`
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

  // GC Count Chart
  if (gcCountChartRef.value) {
    if (!gcCountChartInstance) gcCountChartInstance = echarts.init(gcCountChartRef.value)
    gcCountChartInstance.setOption({
      title: { text: 'GC次数趋势', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['总次数', 'Minor GC', 'Full GC'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '次数' },
      series: [
        { name: '总次数', type: 'line', data: memoryHistory.value.map(m => m.gcCount || 0), smooth: true },
        { name: 'Minor GC', type: 'line', data: memoryHistory.value.map(m => m.minorGcCount || 0), smooth: true, lineStyle: { type: 'dotted' } },
        { name: 'Full GC', type: 'line', data: memoryHistory.value.map(m => m.fullGcCount || 0), smooth: true, lineStyle: { type: 'dashed' } }
      ]
    })
    gcCountChartInstance.resize()
  }

  // GC Duration Chart
  if (gcDurationChartRef.value) {
    if (!gcDurationChartInstance) gcDurationChartInstance = echarts.init(gcDurationChartRef.value)
    gcDurationChartInstance.setOption({
      title: { text: 'GC耗时趋势', left: 'center' },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        let result = params[0].name + '<br/>'
        params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}ms<br/>` })
        return result
      }},
      legend: { data: ['总耗时', 'Minor GC耗时'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '耗时(ms)' },
      series: [
        { name: '总耗时', type: 'line', data: memoryHistory.value.map(m => m.gcTimeMs || 0), smooth: true },
        { name: 'Minor GC耗时', type: 'line', data: memoryHistory.value.map(m => m.minorGcTimeMs || 0), smooth: true, lineStyle: { type: 'dotted' } }
      ]
    })
    gcDurationChartInstance.resize()
  }

  // Minor vs Full GC Chart
  if (minorVsFullGcChartRef.value) {
    if (!minorVsFullGcChartInstance) minorVsFullGcChartInstance = echarts.init(minorVsFullGcChartRef.value)
    minorVsFullGcChartInstance.setOption({
      title: { text: 'Minor vs Full GC对比', left: 'center' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['Minor GC', 'Full GC'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '次数' },
      series: [
        { name: 'Minor GC', type: 'bar', data: memoryHistory.value.map(m => m.minorGcCount || 0), itemStyle: { color: '#67c23a' } },
        { name: 'Full GC', type: 'bar', data: memoryHistory.value.map(m => m.fullGcCount || 0), itemStyle: { color: '#f56c6c' } }
      ]
    })
    minorVsFullGcChartInstance.resize()
  }

  // GC Efficiency Chart
  if (gcEfficiencyChartRef.value) {
    if (!gcEfficiencyChartInstance) gcEfficiencyChartInstance = echarts.init(gcEfficiencyChartRef.value)
    const efficiencyData = memoryHistory.value.map((m, i) => {
      if (i === 0 || m.gcCount === 0) return 0
      return (m.gcTimeMs / m.gcCount).toFixed(2)
    })
    gcEfficiencyChartInstance.setOption({
      title: { text: 'GC效率 (平均耗时)', left: 'center' },
      tooltip: { trigger: 'axis', formatter: (params: any) => {
        return params[0].name + '<br/>平均耗时: ' + params[0].value + 'ms'
      }},
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: times },
      yAxis: { type: 'value', name: '平均耗时(ms)' },
      series: [{ name: '平均耗时', type: 'line', data: efficiencyData, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }]
    })
    gcEfficiencyChartInstance.resize()
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
.jvm-gc-container {
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
</style>
