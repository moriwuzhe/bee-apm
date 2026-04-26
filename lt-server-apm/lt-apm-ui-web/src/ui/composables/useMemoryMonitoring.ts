import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getMemoryHistory, type AgentMemoryMetrics } from '../../api/agent'
import { safeFormatBytes } from '../../utils/formatBytes'

export function useMemoryMonitoring() {
  // 状态
  const memoryTab = ref('realtime')
  const historyTimeRange = ref(6)
  const historyLoading = ref(false)
  const memoryHistory = ref<AgentMemoryMetrics[]>([])
  
  // 实时监控相关
  const enableRealtime = ref(false)
  const pollingInterval = ref(5000)
  let realtimeTimer: number | null = null
  
  // 自动刷新相关
  const enableAutoRefresh = ref(false)
  const autoRefreshInterval = ref(10)
  let autoRefreshTimer: number | null = null
  
  // 图表DOM引用
  const heapChartRef = ref<HTMLElement>()
  const nonHeapChartRef = ref<HTMLElement>()
  const youngGenChartRef = ref<HTMLElement>()
  const oldGenChartRef = ref<HTMLElement>()
  const gcCountChartRef = ref<HTMLElement>()
  const gcDurationChartRef = ref<HTMLElement>()
  const threadChartRef = ref<HTMLElement>()
  const classLoadingChartRef = ref<HTMLElement>()
  const cpuChartRef = ref<HTMLElement>()
  const memoryPoolsGridRef = ref<HTMLElement>()
  
  // 额外的图表 ref（用于高级监控）
  const edenSurvivorChartRef = ref<HTMLElement>()
  const oldGenChartDetailRef = ref<HTMLElement>()
  const metaspaceChartRef = ref<HTMLElement>()
  const codeCacheChartRef = ref<HTMLElement>()
  const memoryAllocationRateChartRef = ref<HTMLElement>()
  const gcPressureChartRef = ref<HTMLElement>()
  const gcReclaimedChartRef = ref<HTMLElement>()
  const cpuMemoryCorrelationChartRef = ref<HTMLElement>()
  const topCpuThreadChartRef = ref<HTMLElement>()
  const threadStateChartRef = ref<HTMLElement>()
  const performanceDashboardChartRef = ref<HTMLElement>()
  
  // 图表实例
  let heapChartInstance: any = null
  let nonHeapChartInstance: any = null
  let youngGenChartInstance: any = null
  let oldGenChartInstance: any = null
  let gcCountChartInstance: any = null
  let gcDurationChartInstance: any = null
  let threadChartInstance: any = null
  let classLoadingChartInstance: any = null
  let cpuChartInstance: any = null
  let memoryPoolsGridInstance: any = null

  // ================= 计算属性 =================
  
  // 堆内存使用率
  const heapUsagePercent = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (latest.heapMax === 0) return '0%'
    return ((latest.heapUsed / latest.heapMax) * 100).toFixed(1) + '%'
  })

  const heapUsageStatus = computed(() => {
    const percent = parseFloat(heapUsagePercent.value) || 0
    if (percent < 60) return 'success'
    if (percent < 80) return 'warning'
    return 'danger'
  })

  // 非堆内存使用率
  const nonHeapUsagePercent = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (latest.nonHeapMax === 0) return '0%'
    return ((latest.nonHeapUsed / latest.nonHeapMax) * 100).toFixed(1) + '%'
  })

  const nonHeapUsageStatus = computed(() => {
    const percent = parseFloat(nonHeapUsagePercent.value) || 0
    if (percent < 70) return 'success'
    if (percent < 85) return 'warning'
    return 'danger'
  })

  // 新生代使用率
  const youngGenUsagePercent = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (!latest.youngGenMax || latest.youngGenMax === 0) return '0%'
    return ((latest.youngGenUsed / latest.youngGenMax) * 100).toFixed(1) + '%'
  })

  const youngGenUsageStatus = computed(() => {
    const percent = parseFloat(youngGenUsagePercent.value) || 0
    if (percent < 70) return 'success'
    if (percent < 85) return 'warning'
    return 'danger'
  })

  // 老年代使用率
  const oldGenUsagePercent = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    if (!latest.oldGenMax || latest.oldGenMax === 0) return '0%'
    return ((latest.oldGenUsed / latest.oldGenMax) * 100).toFixed(1) + '%'
  })

  const oldGenUsageStatus = computed(() => {
    const percent = parseFloat(oldGenUsagePercent.value) || 0
    if (percent < 70) return 'success'
    if (percent < 85) return 'warning'
    return 'danger'
  })

  // 内存增长速率
  const memoryGrowthRate = computed(() => {
    if (memoryHistory.value.length < 2) return '-'
    const first = memoryHistory.value[0]
    const last = memoryHistory.value[memoryHistory.value.length - 1]
    const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
    if (timeDiffMinutes === 0) return '0 MB/min'
    const heapDiff = last.heapUsed - first.heapUsed
    const growthPerMin = heapDiff / timeDiffMinutes / (1024 * 1024)
    return growthPerMin.toFixed(2) + ' MB/min'
  })

  const memoryGrowthStatus = computed(() => {
    const rate = parseFloat(memoryGrowthRate.value) || 0
    if (rate < 10) return 'success'
    if (rate < 50) return 'warning'
    return 'danger'
  })

  // GC压力指数
  const gcPressureIndex = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    let pressure = 0
    
    // 基于GC频率
    const gcFreq = parseFloat(gcFrequency.value) || 0
    if (gcFreq > 60) pressure += 30
    else if (gcFreq > 30) pressure += 15
    
    // 基于平均GC耗时
    const avgTime = parseFloat(avgGcTime.value) || 0
    if (avgTime > 100) pressure += 30
    else if (avgTime > 50) pressure += 15
    
    // 基于Full GC占比
    const fullRatio = parseFloat(fullGcRatio.value) || 0
    if (fullRatio > 15) pressure += 25
    else if (fullRatio > 5) pressure += 10
    
    // 基于堆内存使用率
    const heapUsage = parseFloat(heapUsagePercent.value) || 0
    if (heapUsage > 90) pressure += 15
    else if (heapUsage > 80) pressure += 8
    
    pressure = Math.min(100, pressure)
    return `${pressure}`
  })

  const gcPressureStatus = computed(() => {
    const index = parseInt(gcPressureIndex.value) || 0
    if (index < 30) return 'success'
    if (index < 60) return 'warning'
    return 'danger'
  })

  // GC频率
  const gcFrequency = computed(() => {
    if (memoryHistory.value.length < 2) return '0'
    const first = memoryHistory.value[0]
    const last = memoryHistory.value[memoryHistory.value.length - 1]
    const timeDiffMinutes = (last.collectTime - first.collectTime) / 60000
    const gcDiff = last.gcCount - first.gcCount
    return timeDiffMinutes > 0 ? (gcDiff / timeDiffMinutes).toFixed(1) : '0'
  })

  // 平均GC时间
  const avgGcTime = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    const totalGcTime = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
    const totalGcCount = (latest.minorGcCount || 0) + (latest.fullGcCount || 0)
    if (totalGcCount === 0) return '0 ms'
    const avg = totalGcTime / totalGcCount
    return avg.toFixed(1) + ' ms'
  })

  // Full GC占比
  const fullGcRatio = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    const latest = memoryHistory.value[memoryHistory.value.length - 1]
    const minor = latest.minorGcCount || 0
    const full = latest.fullGcCount || 0
    const total = minor + full
    if (total === 0) return '0%'
    return ((full / total) * 100).toFixed(1) + '%'
  })

  // 内存泄漏风险
  const leakRiskLevel = computed(() => {
    if (memoryHistory.value.length < 3) return '数据不足'
    
    const heapData = memoryHistory.value.map(m => m.heapUsed || 0)
    const growthRate = parseFloat(memoryGrowthRate.value) || 0
    
    let increasingCount = 0
    for (let i = 1; i < heapData.length; i++) {
      if (heapData[i] > heapData[i-1]) {
        increasingCount++
      }
    }
    const increaseRatio = increasingCount / (heapData.length - 1)
    
    if (growthRate > 50 && increaseRatio > 0.8) {
      return '高风险'
    } else if (growthRate > 20 && increaseRatio > 0.6) {
      return '中风险'
    } else if (growthRate > 10) {
      return '低风险'
    } else {
      return '无风险'
    }
  })

  const leakRiskStatus = computed(() => {
    const risk = leakRiskLevel.value
    if (risk === '无风险') return 'success'
    if (risk === '低风险') return 'info'
    if (risk === '中风险') return 'warning'
    return 'danger'
  })

  // 内存健康度评分
  const memoryHealthScore = computed(() => {
    if (memoryHistory.value.length === 0) return '-'
    let score = 100
    
    // 堆内存使用率扣分
    const heapUsage = parseFloat(heapUsagePercent.value) || 0
    if (heapUsage > 90) score -= 30
    else if (heapUsage > 80) score -= 15
    else if (heapUsage > 70) score -= 5
    
    // 内存增长速率扣分
    const growthRate = parseFloat(memoryGrowthRate.value) || 0
    if (growthRate > 50) score -= 25
    else if (growthRate > 20) score -= 10
    
    // GC压力扣分
    const gcPressure = parseInt(gcPressureIndex.value) || 0
    if (gcPressure > 60) score -= 20
    else if (gcPressure > 30) score -= 10
    
    // 泄漏风险扣分
    const risk = leakRiskLevel.value
    if (risk === '高风险') score -= 25
    else if (risk === '中风险') score -= 10
    else if (risk === '低风险') score -= 5
    
    score = Math.max(0, Math.min(100, score))
    return `${score}分`
  })

  const memoryHealthStatus = computed(() => {
    const score = parseInt(memoryHealthScore.value) || 0
    if (score >= 80) return 'success'
    if (score >= 60) return 'warning'
    return 'danger'
  })

  // ================= 方法 =================

  // 加载内存历史数据
  const loadMemoryHistory = async (app: string, inst: string) => {
    if (!app || !inst) {
      ElMessage.warning('请先从运行实例列表打开诊断')
      return
    }
    
    historyLoading.value = true
    try {
      const endTime = Date.now()
      const startTime = endTime - (historyTimeRange.value * 3600 * 1000)
      
      memoryHistory.value = await getMemoryHistory(app, inst, startTime, endTime, 200)
      
      // 按时间排序（升序）
      memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
      
      // 渲染图表
      setTimeout(() => {
        renderMemoryCharts()
      }, 500)
      
      ElMessage.success(`加载了 ${memoryHistory.value.length} 条历史记录`)
    } catch (e: any) {
      console.error('Failed to load memory history:', e)
      ElMessage.error(e.message || '加载历史数据失败')
    } finally {
      historyLoading.value = false
    }
  }

  // 加载最新数据（用于实时监控）
  const loadLatestMetrics = async (app: string, inst: string) => {
    try {
      const endTime = Date.now()
      const startTime = endTime - 60000
      
      const newData = await getMemoryHistory(app, inst, startTime, endTime, 10)
      
      if (newData.length > 0) {
        // 追加新数据到现有列表（去重）
        const existingTimes = new Set(memoryHistory.value.map(m => m.collectTime))
        
        newData.forEach(metric => {
          if (!existingTimes.has(metric.collectTime)) {
            memoryHistory.value.push(metric)
          }
        })
        
        // 保持最多200条记录
        if (memoryHistory.value.length > 200) {
          memoryHistory.value = memoryHistory.value.slice(-200)
        }
        
        // 重新排序
        memoryHistory.value.sort((a, b) => a.collectTime - b.collectTime)
        
        // 增量更新图表
        renderMemoryCharts()
      }
    } catch (e: any) {
      console.error('Failed to load latest metrics:', e)
    }
  }

  // 切换实时监控
  const toggleRealtime = (enabled: boolean, app: string, inst: string) => {
    if (enabled) {
      ElMessage.info(`已开启实时监控，轮询间隔：${pollingInterval.value / 1000}秒`)
      loadLatestMetrics(app, inst)
      
      realtimeTimer = setInterval(() => {
        loadLatestMetrics(app, inst)
      }, pollingInterval.value)
    } else {
      if (realtimeTimer) {
        clearInterval(realtimeTimer)
        realtimeTimer = null
      }
      ElMessage.info('已关闭实时监控')
    }
  }

  // 监听轮询间隔变化
  watch(pollingInterval, (newInterval) => {
    if (enableRealtime.value && realtimeTimer) {
      clearInterval(realtimeTimer)
      realtimeTimer = setInterval(() => {
        // 需要传入app和inst，这里简化处理
      }, newInterval)
    }
  })

  // 切换自动刷新
  const toggleAutoRefresh = (enabled: boolean, refreshCallback: () => void) => {
    if (enabled) {
      startAutoRefresh(refreshCallback)
      ElMessage.success(`自动刷新已开启 (${autoRefreshInterval.value}秒)`)
    } else {
      stopAutoRefresh()
      ElMessage.info('自动刷新已关闭')
    }
  }

  // 启动自动刷新
  const startAutoRefresh = (refreshCallback: () => void) => {
    stopAutoRefresh()
    autoRefreshTimer = window.setInterval(() => {
      refreshCallback()
    }, autoRefreshInterval.value * 1000)
  }

  // 停止自动刷新
  const stopAutoRefresh = () => {
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
  }

  // 监听自动刷新间隔变化
  watch(autoRefreshInterval, (newInterval) => {
    if (enableAutoRefresh.value) {
      stopAutoRefresh()
      // 需要外部传入refreshCallback
    }
  })

  // 格式化字节
  const formatBytes = (bytes: number): string => {
    // 防御性检查：处理 NaN、undefined、null 和负数
    if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
      return '0 B'
    }
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    // 防止数组越界
    const unitIndex = Math.min(i, sizes.length - 1)
    return (bytes / Math.pow(k, unitIndex)).toFixed(2) + ' ' + sizes[unitIndex]
  }

  // 获取进度条颜色
  const getProgressColor = (percent: number): string => {
    if (percent < 60) return '#67c23a'
    if (percent < 80) return '#e6a23c'
    return '#f56c6c'
  }

  // 渲染内存图表
  const renderMemoryCharts = () => {
    if (memoryHistory.value.length === 0) return
    
    // 清除所有旧实例（防止DOM切换导致的实例失效）
    ;[heapChartInstance, nonHeapChartInstance, youngGenChartInstance, oldGenChartInstance,
      gcCountChartInstance, gcDurationChartInstance, threadChartInstance, classLoadingChartInstance,
      cpuChartInstance, memoryPoolsGridInstance].forEach(instance => {
      if (instance) {
        try {
          instance.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
      }
    })
    
    // 重置实例引用
    heapChartInstance = null
    nonHeapChartInstance = null
    youngGenChartInstance = null
    oldGenChartInstance = null
    gcCountChartInstance = null
    gcDurationChartInstance = null
    threadChartInstance = null
    classLoadingChartInstance = null
    cpuChartInstance = null
    memoryPoolsGridInstance = null
    
    const times = memoryHistory.value.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. Heap Memory Chart
    if (heapChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(heapChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      heapChartInstance = echarts.init(heapChartRef.value)
      const heapData = memoryHistory.value.map(m => m.heapUsed)
      const heapCommittedData = memoryHistory.value.map(m => m.heapCommitted)
      const heapMaxData = memoryHistory.value.map(m => m.heapMax)
      
      heapChartInstance.setOption({
        title: { text: '堆内存总览', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }},
        legend: { data: ['已使用', '已提交', '最大值'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series: [
          { name: '已使用', type: 'line', data: heapData, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
          { name: '已提交', type: 'line', data: heapCommittedData, smooth: true, lineStyle: { type: 'dotted' }, itemStyle: { color: '#67c23a' } },
          { name: '最大值', type: 'line', data: heapMaxData, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
        ]
      })
      heapChartInstance.resize()
    }
    
    // 2. Non-Heap Memory Chart
    if (nonHeapChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(nonHeapChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      nonHeapChartInstance = echarts.init(nonHeapChartRef.value)
      nonHeapChartInstance.setOption({
        title: { text: '非堆内存', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }},
        legend: { data: ['已使用', '已提交', '最大值'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series: [
          { name: '已使用', type: 'line', data: memoryHistory.value.map(m => m.nonHeapUsed), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } },
          { name: '已提交', type: 'line', data: memoryHistory.value.map(m => m.nonHeapCommitted), smooth: true, lineStyle: { type: 'dotted' }, itemStyle: { color: '#67c23a' } },
          { name: '最大值', type: 'line', data: memoryHistory.value.map(m => m.nonHeapMax > 0 ? m.nonHeapMax : m.nonHeapCommitted), smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
        ]
      })
      nonHeapChartInstance.resize()
    }
    
    // 3. Young Generation Stacked Chart (Eden + S0 + S1)
    if (youngGenChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const existingInstance = echarts.getInstanceByDom(youngGenChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      youngGenChartInstance = echarts.init(youngGenChartRef.value)
      
      const edenData: number[] = []
      const s0Data: number[] = []
      const s1Data: number[] = []
      
      memoryHistory.value.forEach(record => {
        try {
          const pools: any[] = JSON.parse(record.memoryPools!)
          const eden = pools.find(p => p.name.includes('Eden'))
          const s0 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S0'))
          const s1 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S1'))
          edenData.push(eden ? eden.used : 0)
          s0Data.push(s0 ? s0.used : 0)
          s1Data.push(s1 ? s1.used : 0)
        } catch (e) {
          edenData.push(0)
          s0Data.push(0)
          s1Data.push(0)
        }
      })
      
      youngGenChartInstance.setOption({
        title: { text: '新生代 (Young Gen)', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>总计: ' + formatBytes(params.reduce((sum: number, p: any) => sum + p.value, 0)) + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }},
        legend: { data: ['Eden', 'Survivor 0', 'Survivor 1'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series: [
          { name: 'Eden', type: 'bar', stack: 'young', data: edenData, itemStyle: { color: '#409eff' } },
          { name: 'Survivor 0', type: 'bar', stack: 'young', data: s0Data, itemStyle: { color: '#67c23a' } },
          { name: 'Survivor 1', type: 'bar', stack: 'young', data: s1Data, itemStyle: { color: '#e6a23c' } }
        ]
      })
      youngGenChartInstance.resize()
    }
    
    // 4. Old Generation Chart
    if (oldGenChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const existingInstance = echarts.getInstanceByDom(oldGenChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      oldGenChartInstance = echarts.init(oldGenChartRef.value)
      
      const oldGenData: number[] = []
      const oldGenMax: number[] = []
      
      memoryHistory.value.forEach(record => {
        try {
          const pools: any[] = JSON.parse(record.memoryPools!)
          const old = pools.find(p => p.name.includes('Old') || p.name.includes('Tenured'))
          oldGenData.push(old ? old.used : 0)
          oldGenMax.push(old ? (old.max > 0 ? old.max : old.committed) : 0)
        } catch (e) {
          oldGenData.push(0)
          oldGenMax.push(0)
        }
      })
      
      oldGenChartInstance.setOption({
        title: { text: '老年代 (Old Gen)', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          const usage = params.find((p: any) => p.seriesName === '已使用')
          const max = params.find((p: any) => p.seriesName === '最大值')
          if (usage && max && max.value > 0) {
            result += `使用率: ${((usage.value / max.value) * 100).toFixed(1)}%`
          }
          return result
        }},
        legend: { data: ['已使用', '最大值'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series: [
          { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
          { name: '最大值', type: 'line', data: oldGenMax, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
        ]
      })
      oldGenChartInstance.resize()
    }
    
    // 5. GC Count Chart
    if (gcCountChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(gcCountChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      gcCountChartInstance = echarts.init(gcCountChartRef.value)
      const gcIncrements = memoryHistory.value.map((m, i) => {
        if (i === 0) return 0
        const increment = m.gcCount - memoryHistory.value[i - 1].gcCount
        return increment >= 0 ? increment : 0
      })
      gcCountChartInstance.setOption({
        title: { text: 'GC次数增量', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          return params[0].name + '<br/>GC增量: ' + params[0].value + ' 次'
        }},
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '次数' },
        series: [{ name: 'GC增量', type: 'bar', data: gcIncrements, itemStyle: { color: '#9c27b0' } }]
      })
      gcCountChartInstance.resize()
    }
    
    // 6. GC Duration Chart
    if (gcDurationChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(gcDurationChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      gcDurationChartInstance = echarts.init(gcDurationChartRef.value)
      const gcTimeIncrements = memoryHistory.value.map((m, i) => {
        if (i === 0) return 0
        const increment = m.gcTimeMs - memoryHistory.value[i - 1].gcTimeMs
        return increment >= 0 ? increment : 0
      })
      gcDurationChartInstance.setOption({
        title: { text: 'GC耗时分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          return params[0].name + '<br/>GC耗时: ' + params[0].value + ' ms'
        }},
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '耗时(ms)' },
        series: [{ name: 'GC耗时', type: 'bar', data: gcTimeIncrements, itemStyle: { color: '#e6a23c' } }]
      })
      gcDurationChartInstance.resize()
    }
    
    // 7. Thread Count Chart
    if (threadChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(threadChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      threadChartInstance = echarts.init(threadChartRef.value)
      threadChartInstance.setOption({
        title: { text: '线程数趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['当前线程'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '线程数' },
        series: [
          { name: '当前线程', type: 'line', data: memoryHistory.value.map(m => m.threadCount), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }
        ]
      })
      threadChartInstance.resize()
    }
    
    // 8. Class Loading Chart
    if (classLoadingChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(classLoadingChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
      classLoadingChartInstance.setOption({
        title: { text: '类加载统计', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['已加载类'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '类数量' },
        series: [{ name: '已加载类', type: 'line', data: memoryHistory.value.map(m => m.loadedClassCount), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }]
      })
      classLoadingChartInstance.resize()
    }
    
    // 9. CPU Chart
    if (cpuChartRef.value) {
      const existingInstance = echarts.getInstanceByDom(cpuChartRef.value)
      if (existingInstance) existingInstance.dispose()
      
      cpuChartInstance = echarts.init(cpuChartRef.value)
      const cpuData = memoryHistory.value.map(m => ((m.processCpuLoad || 0) * 100).toFixed(2))
      cpuChartInstance.setOption({
        title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          return params[0].name + '<br/>CPU: ' + params[0].value + '%'
        }},
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: 'CPU%', max: 100 },
        series: [{ name: 'CPU使用率', type: 'line', data: cpuData, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } }]
      })
      cpuChartInstance.resize()
    }
    
    // 10. Memory Pools Grid (Eden, Survivor, Old Gen, Metaspace, Code Cache)
    if (memoryPoolsGridRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const existingInstance = echarts.getInstanceByDom(memoryPoolsGridRef.value)
      if (existingInstance) existingInstance.dispose()
      
      memoryPoolsGridInstance = echarts.init(memoryPoolsGridRef.value)
      
      // 解析内存池数据
      const poolData: Record<string, number[]> = {}
      const poolMaxData: Record<string, number[]> = {}
      
      memoryHistory.value.forEach(record => {
        try {
          const pools: any[] = JSON.parse(record.memoryPools!)
          pools.forEach((pool: any) => {
            const name = pool.name
            if (!poolData[name]) {
              poolData[name] = []
              poolMaxData[name] = []
            }
            poolData[name].push(pool.used || 0)
            poolMaxData[name].push(pool.max > 0 ? pool.max : pool.committed || 0)
          })
        } catch (e) {
          // 忽略解析错误
        }
      })
      
      // 渲染堆叠柱状图
      const series = Object.keys(poolData).map(name => ({
        name: name.replace('PS ', '').replace(' Generation', ''),
        type: 'bar',
        stack: 'pools',
        data: poolData[name]
      }))
      
      memoryPoolsGridInstance.setOption({
        title: { text: '内存池详细使用', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
          return result
        }},
        legend: { data: Object.keys(poolData).map(n => n.replace('PS ', '').replace(' Generation', '')), bottom: 0, type: 'scroll' },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series
      })
      memoryPoolsGridInstance.resize()
    }
    
    // 11. Eden + Survivor 详细趋势（直接使用 querySelector，避免 ref 时机问题）
    console.log('[Eden+Survivor] Starting render via querySelector')
    
    if (memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const edenSurvivorEl = document.querySelector('[data-chart="eden-survivor"]') as HTMLElement
      
      if (edenSurvivorEl) {
        console.log('[Eden+Survivor] Element found, size:', `${edenSurvivorEl.offsetWidth}x${edenSurvivorEl.offsetHeight}`)
        
        let edenSurvivorChartInstance: any = null
        const edenData: number[] = []
        const s0Data: number[] = []
        const s1Data: number[] = []
        
        memoryHistory.value.forEach((record, index) => {
          try {
            const pools: any[] = JSON.parse(record.memoryPools!)
            const eden = pools.find(p => p.name.includes('Eden'))
            
            // 兼容不同的 Survivor 命名方式
            const s0 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S0'))
            const s1 = pools.find(p => p.name.includes('Survivor') && p.name.includes('S1'))
            const survivor = pools.find(p => p.name.includes('Survivor') && !p.name.includes('S0') && !p.name.includes('S1'))
            
            const edenVal = eden ? eden.used : 0
            const s0Val = s0 ? s0.used : (survivor ? survivor.used : 0)
            const s1Val = s1 ? s1.used : 0
            
            edenData.push(edenVal)
            s0Data.push(s0Val)
            s1Data.push(s1Val)
          } catch (e) {
            edenData.push(0)
            s0Data.push(0)
            s1Data.push(0)
          }
        })
        
        console.log('[Eden+Survivor] Data length:', edenData.length, 'Max values:', {
          eden: Math.max(...edenData),
          s0: Math.max(...s0Data),
          s1: Math.max(...s1Data)
        })
        
        // 检查是否已存在实例，如果有则销毁
        const existingInstance = echarts.getInstanceByDom(edenSurvivorEl)
        if (existingInstance) {
          console.log('[Eden+Survivor] Disposing existing instance')
          existingInstance.dispose()
        }
        
        edenSurvivorChartInstance = echarts.init(edenSurvivorEl)
        
        edenSurvivorChartInstance.setOption({
          title: { text: 'Eden + Survivor 详细', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { trigger: 'axis', formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
            return result
          }},
          legend: { data: ['Eden', 'S0', 'S1'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
          series: [
            { name: 'Eden', type: 'line', data: edenData, smooth: true, itemStyle: { color: '#409eff' } },
            { name: 'S0', type: 'line', data: s0Data, smooth: true, itemStyle: { color: '#67c23a' } },
            { name: 'S1', type: 'line', data: s1Data, smooth: true, itemStyle: { color: '#e6a23c' } }
          ]
        }, true) // notMerge: true 强制完全重绘
        
        // 多次 resize 确保渲染正确
        edenSurvivorChartInstance.resize()
        setTimeout(() => {
          if (edenSurvivorChartInstance) edenSurvivorChartInstance.resize()
        }, 300)
        setTimeout(() => {
          if (edenSurvivorChartInstance) edenSurvivorChartInstance.resize()
        }, 800)
        
        console.log('✅ Eden+Survivor 图表渲染完成')
      } else {
        console.warn('[Eden+Survivor] Element NOT found!')
      }
    }
    
    // 12. Old Gen 详细趋势（直接使用 querySelector）
    console.log('[Old Gen] Starting render via querySelector')
    
    if (memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const oldGenEl = document.querySelector('[data-chart="old-gen"]') as HTMLElement
      
      if (oldGenEl) {
        console.log('[Old Gen] Element found, size:', `${oldGenEl.offsetWidth}x${oldGenEl.offsetHeight}`)
        
        let oldGenChartDetailInstance: any = null
        const oldGenData: number[] = []
        const oldGenMaxData: number[] = []
        
        memoryHistory.value.forEach((record, index) => {
          try {
            const pools: any[] = JSON.parse(record.memoryPools!)
            const old = pools.find(p => p.name.includes('Old') || p.name.includes('Tenured'))
            oldGenData.push(old ? old.used : 0)
            oldGenMaxData.push(old ? (old.max > 0 ? old.max : old.committed) : 0)
            
            if (index < 3) {
              console.log(`[Old Gen Debug] Record ${index}:`, { used: old?.used, max: old?.max, committed: old?.committed })
            }
          } catch (e) {
            oldGenData.push(0)
            oldGenMaxData.push(0)
          }
        })
        
        console.log('[Old Gen Debug] Data arrays:', { oldGenData: oldGenData.slice(0, 5), oldGenMaxData: oldGenMaxData.slice(0, 5) })
        
        // 检查是否已存在实例，如果有则销毁
        const existingOldGenInstance = echarts.getInstanceByDom(oldGenEl)
        if (existingOldGenInstance) {
          existingOldGenInstance.dispose()
        }
        
        oldGenChartDetailInstance = echarts.init(oldGenEl)
        oldGenChartDetailInstance.setOption({
          title: { text: '老年代详细', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { trigger: 'axis' },
          legend: { data: ['已使用', '最大值'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
          series: [
            { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' } },
            { name: '最大值', type: 'line', data: oldGenMaxData, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
          ]
        }, true) // notMerge: true 强制完全重绘
        
        // 多次 resize 确保渲染正确
        oldGenChartDetailInstance.resize()
        setTimeout(() => {
          if (oldGenChartDetailInstance) oldGenChartDetailInstance.resize()
        }, 300)
        setTimeout(() => {
          if (oldGenChartDetailInstance) oldGenChartDetailInstance.resize()
        }, 800)
        
        console.log('✅ Old Gen 图表渲染完成')
      } else {
        console.warn('[Old Gen] Element NOT found!')
      }
    }
    
    // 13. Heap Growth Rate (内存泄漏检测关键指标)
    console.log('[Heap Growth Rate] Starting render via querySelector')
    const heapGrowthRateEl = document.querySelector('[data-chart="heap-growth-rate"]') as HTMLElement
    if (heapGrowthRateEl && memoryHistory.value.length > 0) {
      const times = memoryHistory.value.map(m => {
        const date = new Date(m.collectTime)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
      
      // 计算堆内存增长率 (%/分钟)
      const growthRates: number[] = []
      for (let i = 1; i < memoryHistory.value.length; i++) {
        const prev = memoryHistory.value[i - 1]
        const curr = memoryHistory.value[i]
        const timeDiffMinutes = (curr.collectTime - prev.collectTime) / 60000
        
        if (timeDiffMinutes > 0 && prev.heapMax > 0) {
          const growthPercent = ((curr.heapUsed - prev.heapUsed) / prev.heapMax) * 100
          growthRates.push(growthPercent / timeDiffMinutes) // %/min
        } else {
          growthRates.push(0)
        }
      }
      growthRates.unshift(0) // 第一个点为0
      
      let heapGrowthRateInstance: any = null
      const existingInstance = echarts.getInstanceByDom(heapGrowthRateEl)
      if (existingInstance) {
        existingInstance.dispose()
      }
      
      heapGrowthRateInstance = echarts.init(heapGrowthRateEl)
      heapGrowthRateInstance.setOption({
        title: { 
          text: '堆内存增长率 (泄漏检测)', 
          left: 'center', 
          textStyle: { fontSize: 14, fontWeight: 600 }
        },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            const value = params[0].value
            let status = ''
            if (value > 5) status = ' ⚠️ 快速增长'
            else if (value > 1) status = ' ⚡ 中速增长'
            else if (value > 0) status = ' ✅ 缓慢增长'
            else status = ' 💚 稳定/下降'
            
            return `${params[0].name}<br/>${params[0].marker} 增长率: ${value.toFixed(2)}%/分钟${status}`
          }
        },
        legend: { data: ['增长率'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { 
          type: 'value', 
          name: '%/分钟',
          axisLabel: { formatter: (val: number) => val.toFixed(2) + '%' }
        },
        series: [
          { 
            name: '增长率', 
            type: 'line', 
            data: growthRates, 
            smooth: true,
            itemStyle: { 
              color: (params: any) => {
                if (params.value > 5) return '#f56c6c' // 红色-快速增长
                if (params.value > 1) return '#e6a23c' // 橙色-中速增长
                if (params.value > 0) return '#409eff' // 蓝色-缓慢增长
                return '#67c23a' // 绿色-稳定
              }
            },
            areaStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
                { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
              ])
            },
            markLine: {
              data: [
                { yAxis: 0, label: { formatter: '零增长线' }, lineStyle: { color: '#67c23a', type: 'solid' } },
                { yAxis: 1, label: { formatter: '警戒线 1%/min' }, lineStyle: { color: '#e6a23c', type: 'dashed' } },
                { yAxis: 5, label: { formatter: '危险线 5%/min' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }
              ]
            }
          }
        ]
      })
      heapGrowthRateInstance.resize()
      setTimeout(() => {
        if (heapGrowthRateInstance) heapGrowthRateInstance.resize()
      }, 300)
      console.log('✅ Heap Growth Rate 图表渲染完成')
    }
    
    // 14. GC Pressure Index (综合评估GC对性能的影响)
    console.log('[GC Pressure] Starting render via querySelector')
    const gcPressureEl = document.querySelector('[data-chart="gc-pressure"]') as HTMLElement
    if (gcPressureEl && memoryHistory.value.length > 0) {
      const times = memoryHistory.value.map(m => {
        const date = new Date(m.collectTime)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
      
      // 计算GC压力指数 (0-100)
      const gcPressureData: number[] = []
      for (let i = 1; i < memoryHistory.value.length; i++) {
        const prev = memoryHistory.value[i - 1]
        const curr = memoryHistory.value[i]
        const timeDiffSeconds = (curr.collectTime - prev.collectTime) / 1000
        
        if (timeDiffSeconds > 0) {
          // GC时间占比（确保不为负）
          const gcTimeIncrement = Math.max(0, curr.gcTimeMs - prev.gcTimeMs)
          const gcTimeRatio = gcTimeIncrement / (timeDiffSeconds * 1000)
          
          // GC频率（确保不为负）
          const gcCountIncrement = Math.max(0, curr.gcCount - prev.gcCount)
          const gcFrequency = gcCountIncrement / timeDiffSeconds
          
          // Full GC频率（确保不为负，权重更高）
          const fullGcIncrement = Math.max(0, (curr.fullGcCount || 0) - (prev.fullGcCount || 0))
          const fullGcFreq = fullGcIncrement / timeDiffSeconds
          
          // 综合压力指数 (0-100)
          const pressure = Math.min(100, Math.max(0, (
            gcTimeRatio * 40 +      // GC时间占比 40%
            gcFrequency * 30 +      // GC频率 30%
            fullGcFreq * 300        // Full GC频率 30% (权重高)
          ) * 100))
          
          gcPressureData.push(pressure)
        } else {
          gcPressureData.push(0)
        }
      }
      gcPressureData.unshift(0)
      
      let gcPressureInstance: any = null
      const existingGcPressureInstance = echarts.getInstanceByDom(gcPressureEl)
      if (existingGcPressureInstance) {
        existingGcPressureInstance.dispose()
      }
      
      gcPressureInstance = echarts.init(gcPressureEl)
      gcPressureInstance.setOption({
        title: { 
          text: 'GC压力指数', 
          left: 'center', 
          textStyle: { fontSize: 14, fontWeight: 600 }
        },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            const value = params[0].value
            let level = ''
            let color = ''
            if (value > 70) { level = '🔴 严重'; color = '#f56c6c' }
            else if (value > 40) { level = '🟠 高'; color = '#e6a23c' }
            else if (value > 20) { level = '🟡 中'; color = '#ffd700' }
            else { level = '🟢 低'; color = '#67c23a' }
            
            return `${params[0].name}<br/>${params[0].marker} 压力指数: ${value.toFixed(1)}<br/>等级: <span style="color:${color}">${level}</span>`
          }
        },
        legend: { data: ['GC压力'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { 
          type: 'value', 
          name: '压力指数',
          max: 100,
          axisLabel: { formatter: (val: number) => val.toFixed(0) }
        },
        series: [
          { 
            name: 'GC压力', 
            type: 'line', 
            data: gcPressureData, 
            smooth: true,
            itemStyle: { 
              color: (params: any) => {
                if (params.value > 70) return '#f56c6c'
                if (params.value > 40) return '#e6a23c'
                if (params.value > 20) return '#ffd700'
                return '#67c23a'
              }
            },
            areaStyle: { 
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: 'rgba(245, 108, 108, 0.3)' },
                { offset: 1, color: 'rgba(245, 108, 108, 0.05)' }
              ])
            },
            markLine: {
              data: [
                { yAxis: 20, label: { formatter: '低/中分界' }, lineStyle: { color: '#ffd700', type: 'dashed' } },
                { yAxis: 40, label: { formatter: '中/高分界' }, lineStyle: { color: '#e6a23c', type: 'dashed' } },
                { yAxis: 70, label: { formatter: '高/严重分界' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }
              ]
            }
          }
        ]
      })
      gcPressureInstance.resize()
      setTimeout(() => {
        if (gcPressureInstance) gcPressureInstance.resize()
      }, 300)
      console.log('✅ GC Pressure 图表渲染完成')
    }
    
    // 15. Buffer Pools Chart (缓冲区池监控)
    console.log('[Buffer Pools] Starting render via querySelector')
    const bufferPoolsEl = document.querySelector('[data-chart="buffer-pools"]') as HTMLElement
    if (bufferPoolsEl) {
      let bufferPoolsInstance: any = null
      const existingBufferPoolsInstance = echarts.getInstanceByDom(bufferPoolsEl)
      if (existingBufferPoolsInstance) {
        existingBufferPoolsInstance.dispose()
      }
      
      // 检查是否有缓冲区池数据
      if (memoryHistory.value.length > 0 && memoryHistory.value[0].bufferPools) {
        try {
          const latest = memoryHistory.value[memoryHistory.value.length - 1]
          const buffers: any[] = JSON.parse(latest.bufferPools!)
          
          if (buffers && buffers.length > 0) {
            const bufferNames = buffers.map(b => b.name)
            const bufferUsed = buffers.map(b => b.memoryUsed || 0)
            const bufferCapacity = buffers.map(b => b.totalCapacity || 0)
            
            bufferPoolsInstance = echarts.init(bufferPoolsEl)
            bufferPoolsInstance.setOption({
              title: { text: '缓冲区池使用', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
              tooltip: { 
                trigger: 'axis',
                axisPointer: { type: 'shadow' },
                formatter: (params: any) => {
                  let result = params[0].name + '<br/>'
                  params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
                  return result
                }
              },
              legend: { data: ['已使用', '总容量'], bottom: 0 },
              grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
              xAxis: { type: 'category', data: bufferNames, axisLabel: { interval: 0, rotate: 30 } },
              yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
              series: [
                { name: '已使用', type: 'bar', data: bufferUsed, itemStyle: { color: '#409eff' } },
                { name: '总容量', type: 'bar', data: bufferCapacity, itemStyle: { color: '#909399' } }
              ]
            })
            bufferPoolsInstance.resize()
            setTimeout(() => {
              if (bufferPoolsInstance) bufferPoolsInstance.resize()
            }, 300)
            console.log('✅ Buffer Pools 图表渲染完成')
          } else {
            // 数据为空，显示空状态
            bufferPoolsInstance = echarts.init(bufferPoolsEl)
            bufferPoolsInstance.setOption({
              graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: '暂无缓冲区池数据',
                  fontSize: 14,
                  fill: '#909399'
                }
              }
            })
            bufferPoolsInstance.resize()
            console.log('[Buffer Pools] No buffer pools data available, showing empty state')
          }
        } catch (e) {
          console.warn('[Buffer Pools] Failed to render:', e)
        }
      } else {
        // 没有数据，显示空状态
        bufferPoolsInstance = echarts.init(bufferPoolsEl)
        bufferPoolsInstance.setOption({
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无缓冲区池数据',
              fontSize: 14,
              fill: '#909399'
            }
          }
        })
        bufferPoolsInstance.resize()
        console.log('[Buffer Pools] No buffer pools data, showing empty state')
      }
    }
    
    // 16. Physical Memory Chart (物理内存监控)
    console.log('[Physical Memory] Starting render via querySelector')
    const physicalMemoryEl = document.querySelector('[data-chart="physical-memory"]') as HTMLElement
    if (physicalMemoryEl) {
      let physicalMemoryInstance: any = null
      const existingPhysicalMemoryInstance = echarts.getInstanceByDom(physicalMemoryEl)
      if (existingPhysicalMemoryInstance) {
        existingPhysicalMemoryInstance.dispose()
      }
      
      // 检查是否有物理内存数据
      if (memoryHistory.value.length > 0 && memoryHistory.value[0].totalPhysicalMemory) {
        const times = memoryHistory.value.map(m => {
          const date = new Date(m.collectTime)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        })
        
        const usedPhysicalMemory = memoryHistory.value.map(m => 
          (m.totalPhysicalMemory || 0) - (m.freePhysicalMemory || 0)
        )
        const totalPhysicalMemory = memoryHistory.value[0].totalPhysicalMemory
        
        physicalMemoryInstance = echarts.init(physicalMemoryEl)
        physicalMemoryInstance.setOption({
          title: { text: '物理内存使用', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { 
            trigger: 'axis',
            formatter: (params: any) => {
              let result = params[0].name + '<br/>'
              params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
              const used = params.find((p: any) => p.seriesName === '已使用')
              if (used && totalPhysicalMemory > 0) {
                result += `使用率: ${((used.value / totalPhysicalMemory) * 100).toFixed(1)}%`
              }
              return result
            }
          },
          legend: { data: ['已使用', '总物理内存'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
          series: [
            { name: '已使用', type: 'line', data: usedPhysicalMemory, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
            { name: '总物理内存', type: 'line', data: memoryHistory.value.map(() => totalPhysicalMemory), smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
          ]
        })
        physicalMemoryInstance.resize()
        setTimeout(() => {
          if (physicalMemoryInstance) physicalMemoryInstance.resize()
        }, 300)
        console.log('✅ Physical Memory 图表渲染完成')
      } else {
        // 没有数据，显示空状态
        physicalMemoryInstance = echarts.init(physicalMemoryEl)
        physicalMemoryInstance.setOption({
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无物理内存数据',
              fontSize: 14,
              fill: '#909399'
            }
          }
        })
        physicalMemoryInstance.resize()
        console.log('[Physical Memory] No physical memory data, showing empty state')
      }
    }
    
    // 17. Memory Usage Rate Chart (内存使用率趋势)
    console.log('[Memory Usage Rate] Starting render via querySelector')
    const memoryUsageRateEl = document.querySelector('[data-chart="memory-usage-rate"]') as HTMLElement
    if (memoryUsageRateEl && memoryHistory.value.length > 0) {
      const times = memoryHistory.value.map(m => {
        const date = new Date(m.collectTime)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
      
      const heapUsageRates = memoryHistory.value.map(m => 
        m.heapMax > 0 ? ((m.heapUsed / m.heapMax) * 100).toFixed(1) : 0
      )
      const nonHeapUsageRates = memoryHistory.value.map(m => 
        m.nonHeapMax > 0 ? ((m.nonHeapUsed / m.nonHeapMax) * 100).toFixed(1) : 0
      )
      
      let memoryUsageRateInstance: any = null
      const existingMemoryUsageRateInstance = echarts.getInstanceByDom(memoryUsageRateEl)
      if (existingMemoryUsageRateInstance) {
        existingMemoryUsageRateInstance.dispose()
      }
      
      memoryUsageRateInstance = echarts.init(memoryUsageRateEl)
      memoryUsageRateInstance.setOption({
        title: { text: '内存使用率趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>` })
            return result
          }
        },
        legend: { data: ['堆内存使用率', '非堆内存使用率'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '使用率(%)', max: 100 },
        series: [
          { 
            name: '堆内存使用率', 
            type: 'line', 
            data: heapUsageRates, 
            smooth: true, 
            itemStyle: { color: '#409eff' },
            markLine: {
              data: [{ yAxis: 80, label: { formatter: '警戒线 80%' }, lineStyle: { color: '#f56c6c', type: 'dashed' } }]
            }
          },
          { 
            name: '非堆内存使用率', 
            type: 'line', 
            data: nonHeapUsageRates, 
            smooth: true, 
            itemStyle: { color: '#e6a23c' }
          }
        ]
      })
      memoryUsageRateInstance.resize()
      setTimeout(() => {
        if (memoryUsageRateInstance) memoryUsageRateInstance.resize()
      }, 300)
      console.log('✅ Memory Usage Rate 图表渲染完成')
    }
    
    // 18. Memory Allocation Chart (内存分配趋势)
    console.log('[Memory Allocation] Starting render via querySelector')
    const memoryAllocationEl = document.querySelector('[data-chart="memory-allocation"]') as HTMLElement
    if (memoryAllocationEl && memoryHistory.value.length > 0) {
      const times = memoryHistory.value.map(m => {
        const date = new Date(m.collectTime)
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      })
      
      const heapCommittedData = memoryHistory.value.map(m => m.heapCommitted)
      const nonHeapCommittedData = memoryHistory.value.map(m => m.nonHeapCommitted)
      
      let memoryAllocationInstance: any = null
      const existingMemoryAllocationInstance = echarts.getInstanceByDom(memoryAllocationEl)
      if (existingMemoryAllocationInstance) {
        existingMemoryAllocationInstance.dispose()
      }
      
      memoryAllocationInstance = echarts.init(memoryAllocationEl)
      memoryAllocationInstance.setOption({
        title: { text: '内存分配趋势', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}<br/>` })
            return result
          }
        },
        legend: { data: ['堆内存分配', '非堆内存分配'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: any) => safeFormatBytes(val) } },
        series: [
          { name: '堆内存分配', type: 'line', data: heapCommittedData, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } },
          { name: '非堆内存分配', type: 'line', data: nonHeapCommittedData, smooth: true, itemStyle: { color: '#00bcd4' }, areaStyle: { color: 'rgba(0, 188, 212, 0.1)' } }
        ]
      })
      memoryAllocationInstance.resize()
      setTimeout(() => {
        if (memoryAllocationInstance) memoryAllocationInstance.resize()
      }, 300)
      console.log('✅ Memory Allocation 图表渲染完成')
    }
    
    console.log('✅ Memory charts rendered:', {
      heap: !!heapChartInstance,
      nonHeap: !!nonHeapChartInstance,
      youngGen: !!youngGenChartInstance,
      oldGen: !!oldGenChartInstance,
      gcCount: !!gcCountChartInstance,
      gcDuration: !!gcDurationChartInstance,
      thread: !!threadChartInstance,
      classLoading: !!classLoadingChartInstance,
      cpu: !!cpuChartInstance,
      memoryPools: !!memoryPoolsGridInstance
    })
  }

  // 清理资源
  const cleanup = () => {
    if (realtimeTimer) {
      clearInterval(realtimeTimer)
      realtimeTimer = null
    }
    if (autoRefreshTimer) {
      clearInterval(autoRefreshTimer)
      autoRefreshTimer = null
    }
    
    // 销毁所有图表实例
    ;[heapChartInstance, nonHeapChartInstance, youngGenChartInstance, oldGenChartInstance, 
       gcCountChartInstance, gcDurationChartInstance, threadChartInstance, 
       classLoadingChartInstance, cpuChartInstance, memoryPoolsGridInstance].forEach(instance => {
      if (instance) {
        instance.dispose()
      }
    })
  }

  return {
    // 状态
    memoryTab,
    historyTimeRange,
    historyLoading,
    memoryHistory,
    enableRealtime,
    pollingInterval,
    enableAutoRefresh,
    autoRefreshInterval,
    
    // 图表DOM引用
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
    
    // 额外的图表 ref（用于高级监控）
    edenSurvivorChartRef,
    oldGenChartDetailRef,
    metaspaceChartRef,
    codeCacheChartRef,
    memoryAllocationRateChartRef,
    gcPressureChartRef,
    gcReclaimedChartRef,
    cpuMemoryCorrelationChartRef,
    topCpuThreadChartRef,
    threadStateChartRef,
    performanceDashboardChartRef,
    
    // 计算属性
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
    gcFrequency,
    avgGcTime,
    fullGcRatio,
    leakRiskLevel,
    leakRiskStatus,
    memoryHealthScore,
    memoryHealthStatus,
    
    // 方法
    loadMemoryHistory,
    loadLatestMetrics,
    toggleRealtime,
    toggleAutoRefresh,
    renderMemoryCharts,
    formatBytes,
    getProgressColor,
    cleanup
  }
}
