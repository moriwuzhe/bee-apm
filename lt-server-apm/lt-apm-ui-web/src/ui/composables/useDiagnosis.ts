import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  agentThreadDump,
  agentJvmInfo,
  agentGc,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentDeadlocks,
  agentSysProps,
  agentEnv,
  getMemoryHistory,
  type AgentMemoryMetrics
} from '../../api/agent'

// JVM数据结构
interface JvmData {
  pid: string
  uptimeMs: number
  startTimeMs: number
  vmName: string
  vmVersion: string
  heapUsed: number
  heapMax: number
  heapPercent: number
  nonHeapUsed: number
  nonHeapMax: number
  nonHeapPercent: number
  threadCount: number
  peakThreadCount: number
  daemonThreadCount: number
  totalStartedThreadCount: number
  loadedClassCount: number
  totalLoadedClassCount: number
  unloadedClassCount: number
  osName: string
  osVersion: string
  availableProcessors: number
  systemLoadAverage: number
  totalPhysicalMemory: number
  freePhysicalMemory: number
  processCpuLoad: number
  systemCpuLoad: number
  totalGcCount: number
  totalGcTime: number
}

// GC数据结构
interface GcData {
  collectors: Array<{ name: string; count: number; timeMs: number; pools: string }>
}

// 线程数据结构
interface ThreadsData {
  threadCount: number
  daemonThreadCount: number
  peakThreadCount: number
  totalStartedThreadCount: number
}

export function useDiagnosis() {
  const showDiagDialog = ref(false)
  const diagDialogTitle = ref('')
  const diagResult = ref('')
  const diagMode = ref<'chart' | 'text'>('chart')
  const currentDiagType = ref('')
  const currentDiagRow = ref<any>(null)

  // 数据状态
  const jvmData = ref<JvmData>({
    pid: '', uptimeMs: 0, startTimeMs: 0, vmName: '', vmVersion: '',
    heapUsed: 0, heapMax: 0, heapPercent: 0,
    nonHeapUsed: 0, nonHeapMax: 0, nonHeapPercent: 0,
    threadCount: 0, peakThreadCount: 0, daemonThreadCount: 0, totalStartedThreadCount: 0,
    loadedClassCount: 0, totalLoadedClassCount: 0, unloadedClassCount: 0,
    osName: '', osVersion: '', availableProcessors: 0, systemLoadAverage: 0,
    totalPhysicalMemory: 0, freePhysicalMemory: 0, processCpuLoad: 0, systemCpuLoad: 0,
    totalGcCount: 0, totalGcTime: 0
  })

  const gcData = ref<GcData>({ collectors: [] })
  const threadsData = ref<ThreadsData>({
    threadCount: 0, daemonThreadCount: 0, peakThreadCount: 0, totalStartedThreadCount: 0
  })

  // 内存历史相关
  const memoryTab = ref('realtime')
  const historyTimeRange = ref(6)
  const historyLoading = ref(false)
  const memoryHistory = ref<AgentMemoryMetrics[]>([])

  // 处理诊断命令
  const handleDiagCommand = async (command: string, row: any) => {
    const agentId = `${row.app}@${row.inst}`
    currentDiagRow.value = row

    switch (command) {
      case 'config':
        // 配置管理 - 由父组件处理
        break
      case 'instanceConfig':
        // 实例配置 - 由父组件处理
        break
      case 'memoryChart':
        await showMemoryHistoryChart(row)
        break
      case 'gcChart':
        await showGcHistoryChart(row)
        break
      case 'threadChart':
        await showThreadHistoryChart(row)
        break
      case 'ioNetworkChart':
        await showIoNetworkHistoryChart(row)
        break
      case 'jvmInfo':
        await executeDiagCommand('JVM信息', () => agentJvmInfo(agentId), 'jvmInfo')
        break
      case 'memory':
        await executeDiagCommand('内存信息', () => agentMemory(agentId), 'memory')
        break
      case 'threadDump':
        await executeDiagCommand('线程Dump', () => agentThreadDump(agentId))
        break
      case 'threadsSummary':
        await executeDiagCommand('线程概要', () => agentThreadsSummary(agentId), 'threadsSummary')
        break
      case 'gcStats':
        await executeDiagCommand('GC统计', () => agentGcStats(agentId), 'gcStats')
        break
      case 'deadlocks':
        await executeDiagCommand('死锁检测', () => agentDeadlocks(agentId))
        break
      case 'gc':
        try {
          await ElMessageBox.confirm(
            `确定要对 ${row.app}@${row.inst} 执行 GC 吗？这可能会导致短暂的停顿。`,
            '执行 GC 确认',
            { confirmButtonText: '确定执行', cancelButtonText: '取消', type: 'warning' }
          )
          await executeDiagCommand('执行GC', () => agentGc(agentId))
        } catch (e: any) {
          if (e !== 'cancel') ElMessage.error('操作失败')
        }
        break
      case 'sysProps':
        await executeDiagCommand('系统属性', () => agentSysProps(agentId), 'sysProps')
        break
      case 'env':
        await executeDiagCommand('环境变量', () => agentEnv(agentId), 'env')
        break
    }
  }

  // 执行诊断命令
  const executeDiagCommand = async (title: string, fn: () => Promise<string | undefined>, type?: string) => {
    diagDialogTitle.value = title
    diagResult.value = '正在执行...'
    showDiagDialog.value = true
    currentDiagType.value = type || ''
    diagMode.value = 'chart'
    
    try {
      const result = await fn()
      if (result === undefined || result === null) {
        diagResult.value = '返回数据为空'
      } else if (result === '') {
        diagResult.value = '返回空字符串'
      } else {
        diagResult.value = result
        
        // 解析数据用于图表展示
        if (type === 'jvmInfo') parseJvmData(result)
        else if (type === 'memory') parseMemoryData(result)
        else if (type === 'gcStats') parseGcData(result)
        else if (type === 'threadsSummary') parseThreadsData(result)
      }
    } catch (e: any) {
      const errorMsg = e.response?.data || e.message || '未知错误'
      diagResult.value = `执行失败: ${JSON.stringify(errorMsg, null, 2)}`
    }
  }

  // 显示内存历史监控图表
  const showMemoryHistoryChart = async (row: any, refresh = false) => {
    if (!refresh) {
      diagDialogTitle.value = `💾 内存监控 - ${row.app}@${row.inst}`
      diagResult.value = '正在加载历史数据...'
      showDiagDialog.value = true
      currentDiagType.value = 'memoryChart'
      diagMode.value = 'chart'
    }
    
    try {
      historyLoading.value = true
      const endTime = Date.now()
      const startTime = endTime - historyTimeRange.value * 3600 * 1000
      
      const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
      
      if (data.length === 0) {
        diagResult.value = '暂无历史数据，请确保Agent正常运行并上报数据'
        return
      }
      
      memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
      diagResult.value = 'loaded'
      
      if (!refresh) {
        ElMessage.success(`加载了 ${data.length} 条历史记录`)
      } else {
        ElMessage.success('数据已刷新')
      }
    } catch (e: any) {
      diagResult.value = `加载失败: ${e.message || '未知错误'}`
    } finally {
      historyLoading.value = false
    }
  }

  // 显示GC历史监控图表
  const showGcHistoryChart = async (row: any, refresh = false) => {
    if (!refresh) {
      diagDialogTitle.value = `♻️ GC分析 - ${row.app}@${row.inst}`
      diagResult.value = '正在加载历史数据...'
      showDiagDialog.value = true
      currentDiagType.value = 'gcChart'
      diagMode.value = 'chart'
    }
    
    try {
      historyLoading.value = true
      const endTime = Date.now()
      const startTime = endTime - historyTimeRange.value * 3600 * 1000
      
      const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
      
      if (data.length === 0) {
        diagResult.value = '暂无历史数据'
        return
      }
      
      memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
      diagResult.value = 'loaded'
      
      if (!refresh) {
        ElMessage.success(`加载了 ${data.length} 条历史记录`)
      }
    } catch (e: any) {
      diagResult.value = `加载失败: ${e.message || '未知错误'}`
    } finally {
      historyLoading.value = false
    }
  }

  // 显示线程历史监控图表
  const showThreadHistoryChart = async (row: any, refresh = false) => {
    if (!refresh) {
      diagDialogTitle.value = `🧵 线程监控 - ${row.app}@${row.inst}`
      diagResult.value = '正在加载历史数据...'
      showDiagDialog.value = true
      currentDiagType.value = 'threadChart'
      diagMode.value = 'chart'
    }
    
    try {
      historyLoading.value = true
      const endTime = Date.now()
      const startTime = endTime - historyTimeRange.value * 3600 * 1000
      
      const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
      
      if (data.length === 0) {
        diagResult.value = '暂无历史数据'
        return
      }
      
      memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
      diagResult.value = 'loaded'
      
      if (!refresh) {
        ElMessage.success(`加载了 ${data.length} 条历史记录`)
      }
    } catch (e: any) {
      diagResult.value = `加载失败: ${e.message || '未知错误'}`
    } finally {
      historyLoading.value = false
    }
  }

  // 显示IO/网络历史监控图表
  const showIoNetworkHistoryChart = async (row: any, refresh = false) => {
    if (!refresh) {
      diagDialogTitle.value = `🌐 IO/网络监控 - ${row.app}@${row.inst}`
      diagResult.value = '正在加载历史数据...'
      showDiagDialog.value = true
      currentDiagType.value = 'ioNetworkChart'
      diagMode.value = 'chart'
    }
    
    try {
      historyLoading.value = true
      const endTime = Date.now()
      const startTime = endTime - historyTimeRange.value * 3600 * 1000
      
      const data = await getMemoryHistory(row.app, row.inst, startTime, endTime, 100)
      
      if (data.length === 0) {
        diagResult.value = '暂无历史数据'
        return
      }
      
      memoryHistory.value = data.sort((a, b) => a.collectTime - b.collectTime)
      diagResult.value = 'loaded'
      
      if (!refresh) {
        ElMessage.success(`加载了 ${data.length} 条历史记录`)
      }
    } catch (e: any) {
      diagResult.value = `加载失败: ${e.message || '未知错误'}`
    } finally {
      historyLoading.value = false
    }
  }

  // 解析JVM数据
  const parseJvmData = (text: string) => {
    try {
      const lines = text.split('\n')
      const data: any = {}
      
      lines.forEach(line => {
        if (line.startsWith('Pid:')) data.pid = line.split(':')[1]?.trim()
        else if (line.startsWith('UptimeMs:')) data.uptimeMs = parseInt(line.split(':')[1]?.trim() || '0')
        else if (line.startsWith('StartTimeMs:')) data.startTimeMs = parseInt(line.split(':')[1]?.trim() || '0')
        else if (line.startsWith('VmName:')) data.vmName = line.split(':')[1]?.trim()
        else if (line.startsWith('VmVersion:')) data.vmVersion = line.split(':')[1]?.trim()
        // ... 更多字段解析
      })
      
      jvmData.value = { ...jvmData.value, ...data }
    } catch (e) {
      console.error('Failed to parse JVM data:', e)
    }
  }

  // 解析内存数据
  const parseMemoryData = (text: string) => {
    // 从原文提取解析逻辑
    console.log('Parse memory data:', text.substring(0, 100))
  }

  // 解析GC数据
  const parseGcData = (text: string) => {
    try {
      const lines = text.split('\n')
      const collectors: Array<{ name: string; count: number; timeMs: number; pools: string }> = []
      
      lines.forEach(line => {
        if (line.trim().startsWith('- Name:')) {
          const name = line.split(':')[1]?.trim()
          collectors.push({ name, count: 0, timeMs: 0, pools: '' })
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

  // 刷新历史图表
  const refreshHistoryChart = () => {
    if (!currentDiagRow.value) {
      ElMessage.warning('无法获取实例信息')
      return
    }
    
    switch (currentDiagType.value) {
      case 'memoryChart':
        showMemoryHistoryChart(currentDiagRow.value, true)
        break
      case 'gcChart':
        showGcHistoryChart(currentDiagRow.value, true)
        break
      case 'threadChart':
        showThreadHistoryChart(currentDiagRow.value, true)
        break
      case 'ioNetworkChart':
        showIoNetworkHistoryChart(currentDiagRow.value, true)
        break
      default:
        ElMessage.info('当前不是历史监控视图')
    }
  }

  // 复制诊断结果
  const copyDiagResult = async () => {
    try {
      await navigator.clipboard.writeText(diagResult.value)
      ElMessage.success('已复制到剪贴板')
    } catch (e: any) {
      ElMessage.error('复制失败')
    }
  }

  // 切换到文本模式
  const switchToTextMode = () => {
    diagMode.value = 'text'
    
    // 设置真实的原始数据
    const historyChartTypes = ['memoryChart', 'gcChart', 'threadChart', 'ioNetworkChart']
    
    if (historyChartTypes.includes(currentDiagType.value)) {
      // 历史监控图表：从 memoryHistory 生成数据
      if (memoryHistory.value.length > 0) {
        const dataInfo: Record<string, string> = {
          memoryChart: '内存监控',
          gcChart: 'GC分析',
          threadChart: '线程监控',
          ioNetworkChart: 'IO/网络监控'
        }
        
        const title = dataInfo[currentDiagType.value] || '监控数据'
        diagResult.value = `【${title} - 原始数据】\n\n记录总数: ${memoryHistory.value.length} 条\n时间范围: ${new Date(memoryHistory.value[0].collectTime).toLocaleString()} ~ ${new Date(memoryHistory.value[memoryHistory.value.length - 1].collectTime).toLocaleString()}\n\n${JSON.stringify(memoryHistory.value, null, 2)}`
      } else {
        diagResult.value = '暂无数据'
      }
    }
    // 对于其他类型（sysProps、env、jvmInfo、memory、gcStats、threadsSummary），保持原有的 diagResult 不变
  }

  // 是否可以显示图表
  const canShowChart = computed(() => {
    return currentDiagType.value && (
      currentDiagType.value === 'jvmInfo' ||
      currentDiagType.value === 'memory' ||
      currentDiagType.value === 'gcStats' ||
      currentDiagType.value === 'threadsSummary' ||
      currentDiagType.value === 'memoryChart' ||
      currentDiagType.value === 'gcChart' ||
      currentDiagType.value === 'threadChart' ||
      currentDiagType.value === 'ioNetworkChart'
    )
  })

  // 切换到图表模式
  const switchToChartMode = () => {
    if (canShowChart.value) {
      diagMode.value = 'chart'
      
      // 切换到图表模式后，触发图表渲染
      // 注意：这里只是设置模式，实际渲染由 ApplicationView 中的 watch 处理
    }
  }

  return {
    // 状态
    showDiagDialog,
    diagDialogTitle,
    diagResult,
    diagMode,
    currentDiagType,
    currentDiagRow,
    jvmData,
    gcData,
    threadsData,
    memoryTab,
    historyTimeRange,
    historyLoading,
    memoryHistory,
    canShowChart,
    
    // 方法
    handleDiagCommand,
    executeDiagCommand,
    refreshHistoryChart,
    copyDiagResult,
    switchToTextMode,
    switchToChartMode,
    parseJvmData,
    parseMemoryData,
    parseGcData,
    parseThreadsData
  }
}
