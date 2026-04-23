import { ref, computed } from 'vue'
import * as echarts from 'echarts'
import type { AgentMemoryMetrics } from '../../api/agent'

export function useGcAnalysis() {
  // 图表DOM引用
  const gcCountChartRef = ref<HTMLElement>()
  const gcDurationChartRef = ref<HTMLElement>()
  const minorVsFullGcChartRef = ref<HTMLElement>()
  const gcEfficiencyChartRef = ref<HTMLElement>()
  const gcVsHeapChartRef = ref<HTMLElement>()
  const gcVsCpuChartRef = ref<HTMLElement>()
  
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

  // 格式化字节
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]
  }

  // 渲染GC图表
  const renderGcCharts = (memoryHistory: AgentMemoryMetrics[]) => {
    if (memoryHistory.length === 0) return
    
    const times = memoryHistory.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. GC Count Chart
    if (gcCountChartRef.value) {
      if (!gcCountChartInstance) gcCountChartInstance = echarts.init(gcCountChartRef.value)
      
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
    if (gcDurationChartRef.value) {
      if (!gcDurationChartInstance) gcDurationChartInstance = echarts.init(gcDurationChartRef.value)
      
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
    if (minorVsFullGcChartRef.value) {
      if (!minorVsFullGcChartInstance) minorVsFullGcChartInstance = echarts.init(minorVsFullGcChartRef.value)
      
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
    if (gcEfficiencyChartRef.value && memoryHistory[0].memoryPools) {
      if (!gcEfficiencyChartInstance) gcEfficiencyChartInstance = echarts.init(gcEfficiencyChartRef.value)
      
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
            return params[0].name + '<br/>回收内存: ' + formatBytes(value)
          }
        },
        grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { 
          type: 'value', 
          axisLabel: { 
            formatter: (val: number) => {
              if (isNaN(val) || val === undefined) return '0 B'
              return formatBytes(val)
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
    
    // 手动获取 GC 图表容器（备用方案）
    if (memoryHistory.length > 0) {
      const minorVsFullGcEl = document.querySelector('[data-chart="minor-vs-full-gc"]') as HTMLElement
      if (minorVsFullGcEl) {
        let minorVsFullGcChartInstance: any = null
        const times = memoryHistory.map(m => {
          const date = new Date(m.collectTime)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        })
        
        const minorGcData = memoryHistory.map((m, i) => {
          if (i === 0) return 0
          return (m.minorGcCount || 0) - (memoryHistory[i - 1].minorGcCount || 0)
        })
        const fullGcData = memoryHistory.map((m, i) => {
          if (i === 0) return 0
          return (m.fullGcCount || 0) - (memoryHistory[i - 1].fullGcCount || 0)
        })
        
        minorVsFullGcChartInstance = echarts.init(minorVsFullGcEl)
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
        console.log('✅ Minor vs Full GC 图表通过 querySelector 渲染')
      }
      
      const gcEfficiencyEl = document.querySelector('[data-chart="gc-efficiency"]') as HTMLElement
      if (gcEfficiencyEl && memoryHistory[0].memoryPools) {
        let gcEfficiencyChartInstance: any = null
        const times = memoryHistory.map(m => {
          const date = new Date(m.collectTime)
          return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
        })
        
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
        
        gcEfficiencyChartInstance = echarts.init(gcEfficiencyEl)
        gcEfficiencyChartInstance.setOption({
          title: { text: 'GC回收效率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { 
            trigger: 'axis', 
            formatter: (params: any) => {
              const value = params[0].value
              if (value === undefined || value === null || isNaN(value)) {
                return params[0].name + '<br/>数据无效'
              }
              return params[0].name + '<br/>回收内存: ' + formatBytes(value)
            }
          },
          grid: { left: '3%', right: '4%', bottom: '10%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { 
            type: 'value', 
            axisLabel: { 
              formatter: (val: number) => {
                if (isNaN(val) || val === undefined) return '0 B'
                return formatBytes(val)
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
        console.log('✅ GC回收效率 图表通过 querySelector 渲染')
      }
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
    // 图表DOM引用
    gcCountChartRef,
    gcDurationChartRef,
    minorVsFullGcChartRef,
    gcEfficiencyChartRef,
    gcVsHeapChartRef,
    gcVsCpuChartRef,
    
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
