<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Connection, CircleClose, Bell, ArrowDown } from '@element-plus/icons-vue'
import type { Application, Project } from '../../api/project'

// 导入 Composables
import { useApplicationManagement } from '../composables/useApplicationManagement'
import { useAgentInstances } from '../composables/useAgentInstances'
import { useDiagnosis } from '../composables/useDiagnosis'
import { useMemoryMonitoring } from '../composables/useMemoryMonitoring'
import { useConfigManagement } from '../composables/useConfigManagement'
import { useGcAnalysis } from '../composables/useGcAnalysis'
import { useThreadMonitoring } from '../composables/useThreadMonitoring'
import { useIoNetworkMonitoring } from '../composables/useIoNetworkMonitoring'

// ==================== Tab 状态 ====================
const activeTab = ref('definition')

// ==================== 应用管理 ====================
const appMgmt = useApplicationManagement()
const { 
  applications, 
  projects, 
  loading, 
  showCreateDialog, 
  form, 
  rules,
  loadData: loadApplications,
  submitCreate,
  resetForm 
} = appMgmt

const formRef = ref()

// ==================== Agent 实例监控 ====================
const agentInst = useAgentInstances()
const { 
  instances, 
  instancesLoading, 
  onlineCount, 
  offlineCount, 
  alertedCount,
  loadInstances,
  isAlerted,
  formatTimestamp
} = agentInst

// ==================== JVM 诊断 ====================
const diagnosis = useDiagnosis()
const {
  showDiagDialog,
  diagDialogTitle,
  diagResult,
  diagMode,
  currentDiagType,
  currentDiagRow,
  jvmData,
  gcData,
  threadsData,
  handleDiagCommand,
  executeDiagCommand,
  parseJvmData,
  parseMemoryData,
  parseGcData,
  parseThreadsData
} = diagnosis

// ==================== 内存监控 ====================
const memoryMon = useMemoryMonitoring()
const {
  memoryTab,
  historyTimeRange,
  historyLoading,
  memoryHistory,
  enableRealtime,
  pollingInterval,
  enableAutoRefresh,
  autoRefreshInterval,
  heapChartRef,
  nonHeapChartRef,
  youngGenChartRef,
  oldGenChartRef,
  gcCountChartRef,
  gcDurationChartRef,
  threadChartRef,
  classLoadingChartRef,
  cpuChartRef,
  memoryPoolsGridRef,
  heapUsagePercent,
  heapUsageStatus,
  nonHeapUsagePercent,
  nonHeapUsageStatus,
  youngGenUsagePercent,
  youngGenUsageStatus,
  oldGenUsagePercent,
  oldGenUsageStatus,
  memoryGrowthRate,
  memoryGrowthStatus,
  gcPressureIndex,
  gcPressureStatus,
  leakRiskLevel,
  leakRiskStatus,
  memoryHealthScore,
  memoryHealthStatus,
  loadMemoryHistory,
  toggleRealtime,
  toggleAutoRefresh,
  renderMemoryCharts,
  formatBytes,
  getProgressColor,
  cleanup: cleanupMemory
} = memoryMon

// ==================== GC 分析 ====================
const gcAnalysis = useGcAnalysis()
const {
  minorVsFullGcChartRef,
  gcEfficiencyChartRef,
  totalGcCount,
  totalGcTime,
  avgGcTime,
  fullGcRatio,
  gcEfficiency,
  maxGcDuration,
  gcHealthScore,
  renderGcCharts,
  cleanup: cleanupGc
} = gcAnalysis

// ==================== 线程监控 ====================
const threadMon = useThreadMonitoring()
const {
  threadStatesChartRef,
  classLoadingDetailChartRef,
  threadPoolsChartRef,
  maxThreadCountValue,
  avgThreadCount,
  blockedRatioText,
  daemonRatioText,
  threadCreationRateValue,
  hasThreadPoolData,
  renderThreadCharts,
  formatNanoTime,
  cleanup: cleanupThread
} = threadMon

// ==================== IO/网络监控 ====================
const ioNetworkMon = useIoNetworkMonitoring()
const {
  diskIoRef,
  networkTrafficRef,
  avgDiskReadRate,
  avgDiskWriteRate,
  maxDiskReadRate,
  maxDiskWriteRate,
  avgNetworkRecvRate,
  avgNetworkSentRate,
  ioPatternAnalysis,
  ioLatencyAnalysis,
  networkPatternAnalysis,
  renderIoNetworkCharts,
  cleanup: cleanupIo
} = ioNetworkMon

// ==================== 配置管理 ====================
const configMgmt = useConfigManagement()
const {
  showConfigDialog,
  configMode,
  currentApp,
  currentInst,
  dbConfigContent,
  agentRuntimeConfig,
  fullConfigInfo,
  submitting,
  configSourceTab,
  activeCollapsePanels,
  configDialogTitle,
  openConfigDialog,
  loadConfigs,
  formatConfig,
  clearConfig,
  syncFromRuntime,
  submitConfig
} = configMgmt

// ==================== 计算属性 - 从 memoryHistory 派生 ====================
const latestHeapPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.heapMax > 0 ? Math.round((latest.heapUsed / latest.heapMax) * 100) : 0
})

const latestCpuPercent = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  const latest = memoryHistory.value[memoryHistory.value.length - 1]
  return latest.processCpuLoad ? Math.round(latest.processCpuLoad * 100) : 0
})

const latestThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return memoryHistory.value[memoryHistory.value.length - 1].threadCount || 0
})

const maxThreadCount = computed(() => {
  if (memoryHistory.value.length === 0) return 0
  return Math.max(...memoryHistory.value.map(m => m.threadCount || 0))
})

const gcFrequency = computed(() => {
  if (memoryHistory.value.length < 2) return '0'
  const first = memoryHistory.value[0]
  const last = memoryHistory.value[memoryHistory.value.length - 1]
  const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
  const gcDiff = last.gcCount - first.gcCount
  return timeDiffMinutes > 0 ? (gcDiff / timeDiffMinutes).toFixed(1) : '0'
})

const avgGcTimeStatus = computed(() => {
  const time = parseFloat(avgGcTime.value) || 0
  if (time < 50) return 'success'
  if (time < 100) return 'warning'
  return 'danger'
})

const fullGcRatioStatus = computed(() => {
  const ratio = parseFloat(fullGcRatio.value) || 0
  if (ratio < 5) return 'success'
  if (ratio < 15) return 'warning'
  return 'danger'
})

const gcEfficiencyStatus = computed(() => {
  const eff = parseFloat(gcEfficiency.value) || 0
  if (eff > 80) return 'success'
  if (eff > 60) return 'warning'
  return 'danger'
})

const hasBufferPoolsData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  return !!memoryHistory.value[memoryHistory.value.length - 1].bufferPools
})

const hasPhysicalMemoryData = computed(() => {
  if (memoryHistory.value.length === 0) return false
  return !!memoryHistory.value[0].totalPhysicalMemory
})

const jvmStartTimeStr = computed(() => {
  if (!jvmData.value.startTimeMs) return '-'
  return new Date(jvmData.value.startTimeMs).toLocaleString('zh-CN')
})

const jvmUptimeStr = computed(() => {
  if (!jvmData.value.uptimeMs) return '-'
  const hours = Math.floor(jvmData.value.uptimeMs / 3600000)
  const minutes = Math.floor((jvmData.value.uptimeMs % 3600000) / 60000)
  return `${hours}小时 ${minutes}分钟`
})

const latestPeakThreadCount = computed(() => jvmData.value.peakThreadCount || '-')
const latestDaemonThreadCount = computed(() => jvmData.value.daemonThreadCount || '-')
const latestTotalLoadedClass = computed(() => jvmData.value.totalLoadedClassCount || '-')
const latestUnloadedClass = computed(() => jvmData.value.unloadedClassCount || '-')
const latestMinorGcCount = computed(() => gcData.value.collectors?.find(c => c.name.includes('Young'))?.count || '-')
const latestFullGcCount = computed(() => gcData.value.collectors?.find(c => c.name.includes('Old'))?.count || '-')

const topCpuThreadsTable = computed(() => {
  // TODO: 从 threadsData 中提取 Top CPU 线程
  return []
})

// ==================== 方法 ====================

// 刷新历史图表
const refreshHistoryChart = async () => {
  if (!currentDiagRow.value) return
  const row = currentDiagRow.value
  
  if (currentDiagType.value === 'memoryChart') {
    await memoryMon.loadMemoryHistory(row.app, row.inst)
  } else if (currentDiagType.value === 'gcChart') {
    await memoryMon.loadMemoryHistory(row.app, row.inst)
    setTimeout(() => {
      gcAnalysis.renderGcCharts(memoryHistory.value)
    }, 500)
  } else if (currentDiagType.value === 'threadChart') {
    await memoryMon.loadMemoryHistory(row.app, row.inst)
    setTimeout(() => {
      threadMon.renderThreadCharts(memoryHistory.value)
    }, 500)
  } else if (currentDiagType.value === 'ioNetworkChart') {
    await memoryMon.loadMemoryHistory(row.app, row.inst)
    setTimeout(() => {
      ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
    }, 500)
  }
}

// 格式化持续时间
const formatDuration = (ms: number): string => {
  if (!ms) return '-'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天 ${hours % 24}小时`
  if (hours > 0) return `${hours}小时 ${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟 ${seconds % 60}秒`
  return `${seconds}秒`
}

// 获取使用率级别
const getUsageLevel = (percent: number): 'success' | 'warning' | 'danger' | 'info' => {
  if (percent < 60) return 'success'
  if (percent < 80) return 'warning'
  return 'danger'
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadApplications()
  if (activeTab.value === 'instances') {
    loadInstances()
  }
})

onUnmounted(() => {
  // 清理所有图表实例和定时器
  cleanupMemory()
  cleanupGc()
  cleanupThread()
  cleanupIo()
})

// 监听 Tab 切换
watch(activeTab, (newTab) => {
  if (newTab === 'instances' && instances.value.length === 0) {
    loadInstances()
  }
  
  // 切换到非历史趋势Tab时，暂停实时监控
  if (newTab !== 'history' && enableRealtime.value) {
    toggleRealtime(false)
    ElMessage.info('已离开历史趋势页面，实时监控已暂停')
  }
})

// 监听诊断类型变化，渲染对应图表
watch(currentDiagType, (newType) => {
  if (newType && memoryHistory.value.length > 0) {
    setTimeout(() => {
      if (newType === 'memory' || newType === 'memoryChart') {
        renderMemoryCharts()
      } else if (newType === 'gcChart') {
        gcAnalysis.renderGcCharts(memoryHistory.value)
      } else if (newType === 'threadChart') {
        threadMon.renderThreadCharts(memoryHistory.value)
      } else if (newType === 'ioNetworkChart') {
        ioNetworkMon.renderIoNetworkCharts(memoryHistory.value)
      }
    }, 300)
  }
})
</script>
