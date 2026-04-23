import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'
import { getMemoryHistory, type AgentMemoryMetrics } from '../../api/agent'

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
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
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
    
    const times = memoryHistory.value.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. Heap Memory Chart
    if (heapChartRef.value) {
      if (!heapChartInstance) heapChartInstance = echarts.init(heapChartRef.value)
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
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
      if (!nonHeapChartInstance) nonHeapChartInstance = echarts.init(nonHeapChartRef.value)
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
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
      if (!youngGenChartInstance) youngGenChartInstance = echarts.init(youngGenChartRef.value)
      
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
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
      if (!oldGenChartInstance) oldGenChartInstance = echarts.init(oldGenChartRef.value)
      
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        series: [
          { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
          { name: '最大值', type: 'line', data: oldGenMax, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
        ]
      })
      oldGenChartInstance.resize()
    }
    
    // 5. GC Count Chart
    if (gcCountChartRef.value) {
      if (!gcCountChartInstance) gcCountChartInstance = echarts.init(gcCountChartRef.value)
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
      if (!gcDurationChartInstance) gcDurationChartInstance = echarts.init(gcDurationChartRef.value)
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
      if (!threadChartInstance) threadChartInstance = echarts.init(threadChartRef.value)
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
      if (!classLoadingChartInstance) classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
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
      if (!cpuChartInstance) cpuChartInstance = echarts.init(cpuChartRef.value)
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
      if (!memoryPoolsGridInstance) memoryPoolsGridInstance = echarts.init(memoryPoolsGridRef.value)
      
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        series
      })
      memoryPoolsGridInstance.resize()
    }
    
    // 11. Eden + Survivor 详细趋势
    if (edenSurvivorChartRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      let edenSurvivorChartInstance: any = null
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
      
      edenSurvivorChartInstance = echarts.init(edenSurvivorChartRef.value)
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
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        series: [
          { name: 'Eden', type: 'line', data: edenData, smooth: true, itemStyle: { color: '#409eff' } },
          { name: 'S0', type: 'line', data: s0Data, smooth: true, itemStyle: { color: '#67c23a' } },
          { name: 'S1', type: 'line', data: s1Data, smooth: true, itemStyle: { color: '#e6a23c' } }
        ]
      })
      edenSurvivorChartInstance.resize()
    }
    
    // 手动获取 Eden+Survivor 图表容器（备用方案）
    if (memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const edenSurvivorEl = document.querySelector('[data-chart="eden-survivor"]') as HTMLElement
      if (edenSurvivorEl && memoryHistory.value[0].memoryPools) {
        let edenSurvivorChartInstance: any = null
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
          yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
          series: [
            { name: 'Eden', type: 'line', data: edenData, smooth: true, itemStyle: { color: '#409eff' } },
            { name: 'S0', type: 'line', data: s0Data, smooth: true, itemStyle: { color: '#67c23a' } },
            { name: 'S1', type: 'line', data: s1Data, smooth: true, itemStyle: { color: '#e6a23c' } }
          ]
        })
        edenSurvivorChartInstance.resize()
        console.log('✅ Eden+Survivor 图表通过 querySelector 渲染')
      }
    }
    
    // 12. Old Gen 详细趋势
    if (oldGenChartDetailRef.value && memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      let oldGenChartDetailInstance: any = null
      const oldGenData: number[] = []
      const oldGenMaxData: number[] = []
      
      memoryHistory.value.forEach(record => {
        try {
          const pools: any[] = JSON.parse(record.memoryPools!)
          const old = pools.find(p => p.name.includes('Old') || p.name.includes('Tenured'))
          oldGenData.push(old ? old.used : 0)
          oldGenMaxData.push(old ? (old.max > 0 ? old.max : old.committed) : 0)
        } catch (e) {
          oldGenData.push(0)
          oldGenMaxData.push(0)
        }
      })
      
      oldGenChartDetailInstance = echarts.init(oldGenChartDetailRef.value)
      oldGenChartDetailInstance.setOption({
        title: { text: '老年代详细', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['已使用', '最大值'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
        series: [
          { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' } },
          { name: '最大值', type: 'line', data: oldGenMaxData, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
        ]
      })
      oldGenChartDetailInstance.resize()
    }
    
    // 手动获取 Old Gen 图表容器（备用方案）
    if (memoryHistory.value.length > 0 && memoryHistory.value[0].memoryPools) {
      const oldGenEl = document.querySelector('[data-chart="old-gen"]') as HTMLElement
      if (oldGenEl && memoryHistory.value[0].memoryPools) {
        let oldGenChartDetailInstance: any = null
        const oldGenData: number[] = []
        const oldGenMaxData: number[] = []
        
        memoryHistory.value.forEach(record => {
          try {
            const pools: any[] = JSON.parse(record.memoryPools!)
            const old = pools.find(p => p.name.includes('Old') || p.name.includes('Tenured'))
            oldGenData.push(old ? old.used : 0)
            oldGenMaxData.push(old ? (old.max > 0 ? old.max : old.committed) : 0)
          } catch (e) {
            oldGenData.push(0)
            oldGenMaxData.push(0)
          }
        })
        
        oldGenChartDetailInstance = echarts.init(oldGenEl)
        oldGenChartDetailInstance.setOption({
          title: { text: '老年代详细', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { trigger: 'axis' },
          legend: { data: ['已使用', '最大值'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', axisLabel: { formatter: (val: number) => formatBytes(val) } },
          series: [
            { name: '已使用', type: 'line', data: oldGenData, smooth: true, itemStyle: { color: '#f56c6c' } },
            { name: '最大值', type: 'line', data: oldGenMaxData, smooth: true, lineStyle: { type: 'dashed' }, itemStyle: { color: '#909399' } }
          ]
        })
        oldGenChartDetailInstance.resize()
        console.log('✅ Old Gen 图表通过 querySelector 渲染')
      }
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
