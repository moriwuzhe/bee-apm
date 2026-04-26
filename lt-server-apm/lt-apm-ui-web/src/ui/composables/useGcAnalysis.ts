import { ref, computed } from 'vue'
import * as echarts from 'echarts'
import type { AgentMemoryMetrics } from '../../api/agent'
import { safeFormatBytes } from '../../utils/formatBytes'

export function useGcAnalysis() {
  // 图表实例
  let gcCountChartInstance: any = null
  let gcDurationChartInstance: any = null
  let minorVsFullGcChartInstance: any = null
  let gcEfficiencyChartInstance: any = null
  let gcVsHeapChartInstance: any = null
  let gcVsCpuChartInstance: any = null

  // ================= GC分析相关计算属性 =================
  
  // GC关键指标
  const totalGcCount = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const total = (latest.minorGcCount || 0) + (latest.fullGcCount || 0)
    return total > 0 ? `${total} 次` : '0 次'
  })

  const totalGcTime = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const total = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
    return total > 0 ? `${total} ms` : '0 ms'
  })

  const avgGcTime = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const totalGcTime = (latest.minorGcTimeMs || 0) + (latest.fullGcTimeMs || 0)
    const totalGcCount = (latest.minorGcCount || 0) + (latest.fullGcCount || 0)
    if (totalGcCount === 0) return '0 ms'
    const avg = totalGcTime / totalGcCount
    return avg.toFixed(1) + ' ms'
  })

  const fullGcRatio = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const minor = latest.minorGcCount || 0
    const full = latest.fullGcCount || 0
    const total = minor + full
    if (total === 0) return '0%'
    return ((full / total) * 100).toFixed(1) + '%'
  })

  const gcEfficiency = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    const minor = latest.minorGcCount || 0
    const full = latest.fullGcCount || 0
    const total = minor + full
    if (total === 0) return '0%'
    return ((minor / total) * 100).toFixed(1) + '%'
  })

  const maxGcDuration = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let maxDuration = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const gcTimeDiff = (memoryHistory[i].gcTimeMs || 0) - (memoryHistory[i-1].gcTimeMs || 0)
      if (gcTimeDiff > maxDuration) {
        maxDuration = gcTimeDiff
      }
    }
    return maxDuration > 0 ? `${maxDuration} ms` : '0 ms'
  })

  const gcHealthScore = (memoryHistory: AgentMemoryMetrics[], gcFrequency: string, avgGcTimeValue: string) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    const latest = memoryHistory[memoryHistory.length - 1]
    let score = 100
    
    // Full GC占比扣分
    const minor = latest.minorGcCount || 0
    const full = latest.fullGcCount || 0
    const total = minor + full
    if (total > 0) {
      const fullRatio = full / total
      if (fullRatio > 0.3) score -= 30
      else if (fullRatio > 0.15) score -= 15
      else if (fullRatio > 0.05) score -= 5
    }
    
    // GC频率扣分
    const gcFreq = parseFloat(gcFrequency) || 0
    if (gcFreq > 60) score -= 20
    else if (gcFreq > 30) score -= 10
    
    // 平均GC耗时扣分
    const avgTime = parseFloat(avgGcTimeValue) || 0
    if (avgTime > 100) score -= 20
    else if (avgTime > 50) score -= 10
    
    score = Math.max(0, Math.min(100, score))
    return `${score}分`
  })

  // 格式化字节（已迁移到 safeFormatBytes，保留此函数用于向后兼容）
  const formatBytes = (bytes: number | string): string => {
    return safeFormatBytes(bytes)
  }

  // 渲染GC图表
  const renderGcCharts = (memoryHistory: AgentMemoryMetrics[]) => {
    if (memoryHistory.length === 0) return
    
    // 清除所有旧实例（防止DOM切换导致的实例失效）
    ;[gcCountChartInstance, gcDurationChartInstance, minorVsFullGcChartInstance, 
      gcEfficiencyChartInstance, gcVsHeapChartInstance, gcVsCpuChartInstance].forEach(instance => {
      if (instance) {
        try {
          instance.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
      }
    })
    
    // 重置实例引用
    gcCountChartInstance = null
    gcDurationChartInstance = null
    minorVsFullGcChartInstance = null
    gcEfficiencyChartInstance = null
    gcVsHeapChartInstance = null
    gcVsCpuChartInstance = null
    
    const times = memoryHistory.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. GC Count Chart
    const gcCountEl = document.querySelector('[data-chart="gc-count"]') as HTMLElement
    if (gcCountEl) {
      // 检查DOM上是否已有实例，如果有先dispose
      const existingInstance = echarts.getInstanceByDom(gcCountEl)
      if (existingInstance) existingInstance.dispose()
      
      gcCountChartInstance = echarts.init(gcCountEl)
      
      const gcIncrements = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return m.gcCount - memoryHistory[i - 1].gcCount
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
    
    // 2. GC Duration Chart
    const gcDurationEl = document.querySelector('[data-chart="gc-duration"]') as HTMLElement
    if (gcDurationEl) {
      const existingInstance = echarts.getInstanceByDom(gcDurationEl)
      if (existingInstance) existingInstance.dispose()
      
      gcDurationChartInstance = echarts.init(gcDurationEl)
      
      const gcTimeIncrements = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return m.gcTimeMs - memoryHistory[i - 1].gcTimeMs
      })
      
      gcDurationChartInstance.setOption({
        title: { text: 'GC耗时分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          return params[0].name + '<br/>GC耗时: ' + params[0].value + ' ms'
        }},
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '耗时(ms)' },
        series: [{ name: 'GC耗时', type: 'line', data: gcTimeIncrements, smooth: true, itemStyle: { color: '#ff6b6b' }, areaStyle: { color: 'rgba(255, 107, 107, 0.1)' } }]
      })
      gcDurationChartInstance.resize()
    }
    
    // 3. Minor vs Full GC Chart
    const minorVsFullGcEl = document.querySelector('[data-chart="minor-vs-full-gc"]') as HTMLElement
    if (minorVsFullGcEl) {
      const existingInstance = echarts.getInstanceByDom(minorVsFullGcEl)
      if (existingInstance) existingInstance.dispose()
      
      minorVsFullGcChartInstance = echarts.init(minorVsFullGcEl)
      
      const minorGcData = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return (m.minorGcCount || 0) - (memoryHistory[i - 1].minorGcCount || 0)
      })
      const fullGcData = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return (m.fullGcCount || 0) - (memoryHistory[i - 1].fullGcCount || 0)
      })
      
      minorVsFullGcChartInstance.setOption({
        title: { text: 'Minor vs Full GC', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { trigger: 'axis', formatter: (params: any) => {
          let result = params[0].name + '<br/>'
          params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value} 次<br/>` })
          return result
        }},
        legend: { data: ['Minor GC', 'Full GC'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '次数' },
        series: [
          { name: 'Minor GC', type: 'bar', data: minorGcData, itemStyle: { color: '#409eff' } },
          { name: 'Full GC', type: 'bar', data: fullGcData, itemStyle: { color: '#f56c6c' } }
        ]
      })
      minorVsFullGcChartInstance.resize()
    }
    
    // 4. GC Efficiency Chart
    const gcEfficiencyEl = document.querySelector('[data-chart="gc-efficiency"]') as HTMLElement
    if (gcEfficiencyEl && memoryHistory[0].memoryPools) {
      const existingInstance = echarts.getInstanceByDom(gcEfficiencyEl)
      if (existingInstance) existingInstance.dispose()
      
      gcEfficiencyChartInstance = echarts.init(gcEfficiencyEl)
      
      const gcEfficiencyData: number[] = []
      memoryHistory.forEach((m, i) => {
        if (i === 0) {
          gcEfficiencyData.push(0)
          return
        }
        try {
          const pools: any[] = JSON.parse(m.memoryPools!)
          const prevPools: any[] = JSON.parse(memoryHistory[i - 1].memoryPools!)
          const eden = pools.find(p => p.name.includes('Eden'))
          const prevEden = prevPools.find(p => p.name.includes('Eden'))
          if (eden && prevEden && eden.used !== undefined && prevEden.used !== undefined) {
            const reclaimed = prevEden.used - eden.used
            gcEfficiencyData.push(reclaimed >= 0 ? reclaimed : 0)
          } else {
            gcEfficiencyData.push(0)
          }
        } catch (e) {
          gcEfficiencyData.push(0)
        }
      })
      
      gcEfficiencyChartInstance.setOption({
        title: { text: 'GC回收效率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis', 
          formatter: (params: any) => {
            const value = params[0].value
            if (value === undefined || value === null || isNaN(value)) {
              return params[0].name + '<br/>数据无效'
            }
            return params[0].name + '<br/>回收内存: ' + safeFormatBytes(value)
          }
        },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { 
          type: 'value', 
          axisLabel: { 
            formatter: (val: any) => {
              if (isNaN(val) || val === undefined) return '0 B'
              return safeFormatBytes(val)
            }
          }
        },
        series: [{ 
          name: '回收内存', 
          type: 'line', 
          data: gcEfficiencyData.map(v => isNaN(v) ? 0 : v),
          smooth: true, 
          itemStyle: { color: '#67c23a' }, 
          areaStyle: { color: 'rgba(103, 194, 58, 0.1)' }
        }]
      })
      gcEfficiencyChartInstance.resize()
    }
    
    // 5. GC vs Heap Chart
    const gcVsHeapEl = document.querySelector('[data-chart="gc-vs-heap"]') as HTMLElement
    if (gcVsHeapEl && memoryHistory[0].memoryPools) {
      const existingInstance = echarts.getInstanceByDom(gcVsHeapEl)
      if (existingInstance) existingInstance.dispose()
      
      gcVsHeapChartInstance = echarts.init(gcVsHeapEl)
      
      const heapUsedData: number[] = []
      const gcTimeData: number[] = []
      
      memoryHistory.forEach((m, i) => {
        if (i === 0) {
          heapUsedData.push(0)
          gcTimeData.push(0)
          return
        }
        try {
          const pools: any[] = JSON.parse(m.memoryPools!)
          const heapUsed = pools.reduce((sum, p) => sum + (p.used || 0), 0)
          heapUsedData.push(heapUsed)
          
          const gcTimeDiff = (m.gcTimeMs || 0) - (memoryHistory[i - 1].gcTimeMs || 0)
          gcTimeData.push(gcTimeDiff)
        } catch (e) {
          heapUsedData.push(0)
          gcTimeData.push(0)
        }
      })
      
      gcVsHeapChartInstance.setOption({
        title: { text: 'GC耗时 vs 堆内存', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => {
              if (p.seriesName === '堆内存使用') {
                result += `${p.marker} ${p.seriesName}: ${safeFormatBytes(p.value)}<br/>`
              } else {
                result += `${p.marker} ${p.seriesName}: ${p.value} ms<br/>`
              }
            })
            return result
          }
        },
        legend: { data: ['堆内存使用', 'GC耗时'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: [
          { 
            type: 'value', 
            name: '堆内存',
            axisLabel: { 
              formatter: (val: any) => isNaN(val) ? '0 B' : safeFormatBytes(val)
            }
          },
          { 
            type: 'value', 
            name: 'GC耗时(ms)',
            position: 'right'
          }
        ],
        series: [
          { 
            name: '堆内存使用', 
            type: 'line', 
            yAxisIndex: 0,
            data: heapUsedData,
            smooth: true, 
            itemStyle: { color: '#409eff' },
            areaStyle: { color: 'rgba(64, 158, 255, 0.1)' }
          },
          { 
            name: 'GC耗时', 
            type: 'bar', 
            yAxisIndex: 1,
            data: gcTimeData,
            itemStyle: { color: '#f56c6c' }
          }
        ]
      })
      gcVsHeapChartInstance.resize()
    }
    
    // 6. GC vs CPU Chart
    const gcVsCpuEl = document.querySelector('[data-chart="gc-vs-cpu"]') as HTMLElement
    if (gcVsCpuEl) {
      const existingInstance = echarts.getInstanceByDom(gcVsCpuEl)
      if (existingInstance) existingInstance.dispose()
      
      gcVsCpuChartInstance = echarts.init(gcVsCpuEl)
      
      const cpuLoadData: number[] = []
      const gcTimeData: number[] = []
      
      memoryHistory.forEach((m, i) => {
        if (i === 0) {
          cpuLoadData.push(0)
          gcTimeData.push(0)
          return
        }
        const cpuLoad = m.processCpuLoad ? (m.processCpuLoad * 100).toFixed(1) : 0
        cpuLoadData.push(parseFloat(cpuLoad))
        
        const gcTimeDiff = (m.gcTimeMs || 0) - (memoryHistory[i - 1].gcTimeMs || 0)
        gcTimeData.push(gcTimeDiff)
      })
      
      gcVsCpuChartInstance.setOption({
        title: { text: 'GC耗时 vs CPU使用率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => {
              if (p.seriesName === 'CPU使用率') {
                result += `${p.marker} ${p.seriesName}: ${p.value}%<br/>`
              } else {
                result += `${p.marker} ${p.seriesName}: ${p.value} ms<br/>`
              }
            })
            return result
          }
        },
        legend: { data: ['CPU使用率', 'GC耗时'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: [
          { 
            type: 'value', 
            name: 'CPU(%)',
            max: 100
          },
          { 
            type: 'value', 
            name: 'GC耗时(ms)',
            position: 'right'
          }
        ],
        series: [
          { 
            name: 'CPU使用率', 
            type: 'line', 
            yAxisIndex: 0,
            data: cpuLoadData,
            smooth: true, 
            itemStyle: { color: '#e6a23c' },
            areaStyle: { color: 'rgba(230, 162, 60, 0.1)' }
          },
          { 
            name: 'GC耗时', 
            type: 'bar', 
            yAxisIndex: 1,
            data: gcTimeData,
            itemStyle: { color: '#f56c6c' }
          }
        ]
      })
      gcVsCpuChartInstance.resize()
    }
  }

  // 清理资源
  const cleanup = () => {
    ;[gcCountChartInstance, gcDurationChartInstance, minorVsFullGcChartInstance, 
       gcEfficiencyChartInstance, gcVsHeapChartInstance, gcVsCpuChartInstance].forEach(instance => {
      if (instance) {
        instance.dispose()
      }
    })
  }

  return {
    // 计算属性工厂函数（需要传入memoryHistory）
    totalGcCount,
    totalGcTime,
    avgGcTime,
    fullGcRatio,
    gcEfficiency,
    maxGcDuration,
    gcHealthScore,
    
    // 方法
    renderGcCharts,
    formatBytes,
    cleanup
  }
}
