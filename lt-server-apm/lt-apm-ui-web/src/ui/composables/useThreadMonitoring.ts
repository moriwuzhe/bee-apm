import { ref, computed } from 'vue'
import * as echarts from 'echarts'
import type { AgentMemoryMetrics } from '../../api/agent'
import { safeFormatBytes } from '../../utils/formatBytes'

export function useThreadMonitoring() {
  // 图表DOM引用
  const threadChartRef = ref<HTMLElement>()
  const classLoadingChartRef = ref<HTMLElement>()
  const cpuChartRef = ref<HTMLElement>()
  const threadStatesChartRef = ref<HTMLElement>()
  const classLoadingDetailChartRef = ref<HTMLElement>()
  const threadPoolsChartRef = ref<HTMLElement>()
  
  // 图表实例
  let threadChartInstance: any = null
  let classLoadingChartInstance: any = null
  let cpuChartInstance: any = null
  let threadStatesChartInstance: any = null
  let classLoadingDetailChartInstance: any = null
  let threadPoolsChartInstance: any = null

  // ================= 线程监控相关计算属性 =================
  
  const maxThreadCountValue = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let maxCount = 0
    for (let i = 0; i < memoryHistory.length; i++) {
      const count = memoryHistory[i].threadCount || 0
      if (count > maxCount) maxCount = count
    }
    return maxCount > 0 ? `${maxCount} 线程` : '0 线程'
  })

  const avgThreadCount = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const total = memoryHistory.reduce((sum, m) => sum + (m.threadCount || 0), 0)
    const avg = total / memoryHistory.length
    return `${Math.round(avg)} 线程`
  })

  const blockedRatioText = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const blocked = latest.threadCountBlocked || 0
    const total = latest.threadCount || 1
    const ratio = (blocked / total) * 100
    return ratio.toFixed(1) + '%'
  })

  const daemonRatioText = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const daemon = latest.daemonThreadCount || 0
    const total = latest.threadCount || 1
    const ratio = (daemon / total) * 100
    return ratio.toFixed(1) + '%'
  })

  const threadCreationRateValue = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length < 2) return '-'
    const first = memoryHistory[0]
    const last = memoryHistory[memoryHistory.length - 1]
    const timeDiff = (last.collectTime - first.collectTime) / 1000
    const threadDiff = (last.totalStartedThreadCount || 0) - (first.totalStartedThreadCount || 0)
    if (timeDiff > 0) {
      const rate = threadDiff / timeDiff
      return rate.toFixed(2)
    }
    return '0'
  })

  // 检查是否有线程池数据
  const hasThreadPoolData = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return false
    return !!memoryHistory[memoryHistory.length - 1].threadPools
  })

  // 格式化字节（已迁移到 safeFormatBytes，保留此函数用于向后兼容）
  const formatBytes = (bytes: number | string): string => {
    return safeFormatBytes(bytes)
  }

  // 格式化纳秒时间
  const formatNanoTime = (ns: number): string => {
    if (ns < 1000) return `${ns} ns`
    if (ns < 1000000) return `${(ns / 1000).toFixed(2)} μs`
    if (ns < 1000000000) return `${(ns / 1000000).toFixed(2)} ms`
    return `${(ns / 1000000000).toFixed(2)} s`
  }

  // 渲染线程图表
  const renderThreadCharts = (memoryHistory: AgentMemoryMetrics[]) => {
    if (memoryHistory.length === 0) return
    
    const times = memoryHistory.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. Thread Count Chart
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
          { name: '当前线程', type: 'line', data: memoryHistory.map(m => m.threadCount), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }
        ]
      })
      threadChartInstance.resize()
    }
    
    // 2. Class Loading Chart
    if (classLoadingChartRef.value) {
      if (!classLoadingChartInstance) classLoadingChartInstance = echarts.init(classLoadingChartRef.value)
      classLoadingChartInstance.setOption({
        title: { text: '类加载统计', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis' },
        legend: { data: ['已加载类'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '类数量' },
        series: [{ name: '已加载类', type: 'line', data: memoryHistory.map(m => m.loadedClassCount), smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }]
      })
      classLoadingChartInstance.resize()
    }
    
    // 3. CPU Usage Chart
    if (cpuChartRef.value) {
      if (!cpuChartInstance) cpuChartInstance = echarts.init(cpuChartRef.value)
      
      const hasData = memoryHistory.length > 0 && (memoryHistory[0].processCpuLoad !== undefined || memoryHistory[0].systemCpuLoad !== undefined)
      
      if (!hasData) {
        cpuChartInstance.setOption({
          title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无CPU数据\n请确保 Agent 正常运行并上报数据',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        cpuChartInstance.setOption({
          title: { text: 'CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { trigger: 'axis', formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(2)}%<br/>` })
            return result
          }},
          legend: { data: ['进程CPU', '系统CPU'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', name: 'CPU%', axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' } },
          series: [
            { name: '进程CPU', type: 'line', data: memoryHistory.map(m => m.processCpuLoad || 0), smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
            { name: '系统CPU', type: 'line', data: memoryHistory.map(m => m.systemCpuLoad || 0), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
          ]
        })
      }
      cpuChartInstance.resize()
    }
    
    // 4. Thread Pools Chart
    if (threadPoolsChartRef.value) {
      if (!threadPoolsChartInstance) threadPoolsChartInstance = echarts.init(threadPoolsChartRef.value)
      
      const hasData = memoryHistory.length > 0 && memoryHistory[0].threadPools
      
      if (!hasData) {
        threadPoolsChartInstance.setOption({
          title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无线程池数据\n请确保 Agent 正常运行并上报数据',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        try {
          const latest = memoryHistory[memoryHistory.length - 1]
          const pools: any[] = JSON.parse(latest.threadPools!)
          
          if (!pools || pools.length === 0) {
            threadPoolsChartInstance.setOption({
              title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
              graphic: {
                type: 'text',
                left: 'center',
                top: 'middle',
                style: {
                  text: '该 Agent 未上报线程池数据',
                  fill: '#c0c4cc',
                  fontSize: 14,
                  textAlign: 'center'
                }
              }
            })
          } else {
            const poolNames = pools.map(p => p.poolName)
            const poolCounts = pools.map(p => p.activeCount)
            
            threadPoolsChartInstance.setOption({
              title: { text: '线程池使用情况', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
              tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
              grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
              xAxis: { type: 'category', data: poolNames, axisLabel: { interval: 0, rotate: 30 } },
              yAxis: { type: 'value', name: '线程数' },
              series: [{
                name: '活跃线程',
                type: 'bar',
                data: poolCounts,
                itemStyle: { color: '#409eff' },
                label: { show: true, position: 'top' }
              }]
            })
          }
        } catch (e) {
          console.error('Failed to parse threadPools:', e)
        }
      }
      threadPoolsChartInstance.resize()
    }
  }

  // 清理资源
  const cleanup = () => {
    ;[threadChartInstance, classLoadingChartInstance, cpuChartInstance, 
       threadStatesChartInstance, classLoadingDetailChartInstance, threadPoolsChartInstance].forEach(instance => {
      if (instance) {
        instance.dispose()
      }
    })
  }

  return {
    // 图表DOM引用
    threadChartRef,
    classLoadingChartRef,
    cpuChartRef,
    threadStatesChartRef,
    classLoadingDetailChartRef,
    threadPoolsChartRef,
    
    // 计算属性工厂函数
    maxThreadCountValue,
    avgThreadCount,
    blockedRatioText,
    daemonRatioText,
    threadCreationRateValue,
    hasThreadPoolData,
    
    // 方法
    renderThreadCharts,
    formatBytes,
    formatNanoTime,
    cleanup
  }
}
