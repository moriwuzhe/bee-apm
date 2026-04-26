import { ref, computed } from 'vue'
import * as echarts from 'echarts'
import type { AgentMemoryMetrics } from '../../api/agent'
import { safeFormatBytes } from '../../utils/formatBytes'

export function useIoNetworkMonitoring() {
  // 图表DOM引用
  const diskIoRef = ref<HTMLElement>()
  const diskIoOpsRef = ref<HTMLElement>()
  const networkTrafficRef = ref<HTMLElement>()
  const ioCpuCorrelationRef = ref<HTMLElement>()
  
  // 图表实例
  let diskIoInstance: any = null
  let diskIoOpsInstance: any = null
  let networkTrafficInstance: any = null
  let ioCpuCorrelationInstance: any = null

  // ================= IO/网络监控关键指标计算属性 =================
  
  const avgDiskReadRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let totalRate = 0
    let count = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].diskReadBytes || 0) - (memoryHistory[i-1].diskReadBytes || 0))
      totalRate += rate
      count++
    }
    return count > 0 ? `${formatBytes(totalRate / count)}/s` : '0 B/s'
  })

  const avgDiskWriteRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let totalRate = 0
    let count = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].diskWriteBytes || 0) - (memoryHistory[i-1].diskWriteBytes || 0))
      totalRate += rate
      count++
    }
    return count > 0 ? `${formatBytes(totalRate / count)}/s` : '0 B/s'
  })

  const maxDiskReadRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let maxRate = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].diskReadBytes || 0) - (memoryHistory[i-1].diskReadBytes || 0))
      if (rate > maxRate) maxRate = rate
    }
    return maxRate > 0 ? `${formatBytes(maxRate)}/s` : '0 B/s'
  })

  const maxDiskWriteRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let maxRate = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].diskWriteBytes || 0) - (memoryHistory[i-1].diskWriteBytes || 0))
      if (rate > maxRate) maxRate = rate
    }
    return maxRate > 0 ? `${formatBytes(maxRate)}/s` : '0 B/s'
  })

  const avgNetworkRecvRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let totalRate = 0
    let count = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].networkRecvBytes || 0) - (memoryHistory[i-1].networkRecvBytes || 0))
      totalRate += rate
      count++
    }
    return count > 0 ? `${formatBytes(totalRate / count)}/s` : '0 B/s'
  })

  const avgNetworkSentRate = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length === 0) return '-'
    let totalRate = 0
    let count = 0
    for (let i = 1; i < memoryHistory.length; i++) {
      const rate = Math.max(0, (memoryHistory[i].networkSentBytes || 0) - (memoryHistory[i-1].networkSentBytes || 0))
      totalRate += rate
      count++
    }
    return count > 0 ? `${formatBytes(totalRate / count)}/s` : '0 B/s'
  })

  // IO智能分析
  const ioPatternAnalysis = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length < 2) {
      return { status: 'info', text: '数据不足', detail: '需要更多数据点才能分析IO模式' }
    }
    
    let sequentialCount = 0
    let randomCount = 0
    let totalOps = 0
    
    for (let i = 1; i < memoryHistory.length; i++) {
      const readBytes = Math.max(0, (memoryHistory[i].diskReadBytes || 0) - (memoryHistory[i-1].diskReadBytes || 0))
      const writeBytes = Math.max(0, (memoryHistory[i].diskWriteBytes || 0) - (memoryHistory[i-1].diskWriteBytes || 0))
      const readOps = Math.max(0, (memoryHistory[i].diskReadOps || 0) - (memoryHistory[i-1].diskReadOps || 0))
      const writeOps = Math.max(0, (memoryHistory[i].diskWriteOps || 0) - (memoryHistory[i-1].diskWriteOps || 0))
      
      const totalBytes = readBytes + writeBytes
      const totalOpCount = readOps + writeOps
      totalOps += totalOpCount
      
      if (totalOpCount > 0) {
        const avgBytesPerOp = totalBytes / totalOpCount
        if (avgBytesPerOp > 65536) {
          sequentialCount++
        } else {
          randomCount++
        }
      }
    }
    
    if (totalOps === 0) {
      return { status: 'info', text: '无IO活动', detail: '当前时间段内没有检测到磁盘IO操作' }
    }
    
    const sequentialRatio = sequentialCount / (sequentialCount + randomCount)
    if (sequentialRatio > 0.7) {
      return { status: 'success', text: '顺序读写为主', detail: `顺序IO占比${(sequentialRatio * 100).toFixed(0)}%，性能良好` }
    } else if (sequentialRatio > 0.4) {
      return { status: 'warning', text: '混合IO模式', detail: `顺序IO占比${(sequentialRatio * 100).toFixed(0)}%，建议优化` }
    } else {
      return { status: 'danger', text: '随机IO为主', detail: `随机IO占比${((1 - sequentialRatio) * 100).toFixed(0)}%，性能较差` }
    }
  })

  const ioLatencyAnalysis = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length < 2) {
      return { status: 'info', text: '数据不足', detail: '需要更多数据点才能计算IO延迟' }
    }
    
    let totalLatency = 0
    let count = 0
    
    for (let i = 1; i < memoryHistory.length; i++) {
      const readOps = Math.max(0, (memoryHistory[i].diskReadOps || 0) - (memoryHistory[i-1].diskReadOps || 0))
      const writeOps = Math.max(0, (memoryHistory[i].diskWriteOps || 0) - (memoryHistory[i-1].diskWriteOps || 0))
      const totalOps = readOps + writeOps
      
      if (totalOps > 0) {
        const avgLatency = 10000 / totalOps
        totalLatency += avgLatency
        count++
      }
    }
    
    if (count === 0) {
      return { status: 'info', text: '无IO活动', detail: '无法计算延迟' }
    }
    
    const avgLatency = totalLatency / count
    if (avgLatency < 1) {
      return { status: 'success', text: `${avgLatency.toFixed(2)} ms`, detail: '延迟优秀' }
    } else if (avgLatency < 5) {
      return { status: 'success', text: `${avgLatency.toFixed(2)} ms`, detail: '延迟良好' }
    } else if (avgLatency < 20) {
      return { status: 'warning', text: `${avgLatency.toFixed(2)} ms`, detail: '延迟偏高，建议关注' }
    } else {
      return { status: 'danger', text: `${avgLatency.toFixed(2)} ms`, detail: '延迟过高，需要优化' }
    }
  })

  const networkPatternAnalysis = (memoryHistory: AgentMemoryMetrics[]) => computed(() => {
    if (memoryHistory.length < 2) {
      return { status: 'info', text: '数据不足', detail: '需要更多数据点才能分析网络模式' }
    }
    
    let recvTotal = 0
    let sentTotal = 0
    
    for (let i = 1; i < memoryHistory.length; i++) {
      const recv = Math.max(0, (memoryHistory[i].networkRecvBytes || 0) - (memoryHistory[i-1].networkRecvBytes || 0))
      const sent = Math.max(0, (memoryHistory[i].networkSentBytes || 0) - (memoryHistory[i-1].networkSentBytes || 0))
      recvTotal += recv
      sentTotal += sent
    }
    
    if (recvTotal === 0 && sentTotal === 0) {
      return { status: 'info', text: '无网络活动', detail: '当前时间段内没有检测到网络流量' }
    }
    
    const ratio = sentTotal / Math.max(1, recvTotal)
    if (ratio > 2) {
      return { status: 'warning', text: '发送密集型', detail: `发送/接收比${ratio.toFixed(1)}:1，可能存在数据积压` }
    } else if (ratio < 0.5) {
      return { status: 'success', text: '接收密集型', detail: `发送/接收比${ratio.toFixed(1)}:1，正常模式` }
    } else {
      return { status: 'success', text: '均衡模式', detail: `发送/接收比${ratio.toFixed(1)}:1，流量均衡` }
    }
  })

  // 格式化字节（已迁移到 safeFormatBytes，保留此函数用于向后兼容）
  const formatBytes = (bytes: number | string): string => {
    return safeFormatBytes(bytes)
  }

  // 渲染IO/网络图表
  const renderIoNetworkCharts = (memoryHistory: AgentMemoryMetrics[]) => {
    if (memoryHistory.length === 0) return
    
    // 清除所有旧实例（防止DOM切换导致的实例失效）
    ;[diskIoInstance, diskIoOpsInstance, networkTrafficInstance, ioCpuCorrelationInstance].forEach(instance => {
      if (instance) {
        try {
          instance.dispose()
        } catch (e) {
          // 忽略dispose错误
        }
      }
    })
    
    // 重置实例引用
    diskIoInstance = null
    diskIoOpsInstance = null
    networkTrafficInstance = null
    ioCpuCorrelationInstance = null
    
    const times = memoryHistory.map(m => {
      const date = new Date(m.collectTime)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    })
    
    // 1. Disk I/O Chart
    if (diskIoRef.value) {
      // 检查DOM上是否已有实例，如果有先dispose
      const existingInstance = echarts.getInstanceByDom(diskIoRef.value)
      if (existingInstance) existingInstance.dispose()
      
      diskIoInstance = echarts.init(diskIoRef.value)
      
      const readRates = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return Math.max(0, (m.diskReadBytes || 0) - (memoryHistory[i-1].diskReadBytes || 0))
      })
      const writeRates = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return Math.max(0, (m.diskWriteBytes || 0) - (memoryHistory[i-1].diskWriteBytes || 0))
      })
      
      diskIoInstance.setOption({
        title: { text: '磁盘I/O速率', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}/s<br/>` })
            return result
          }
        },
        legend: { data: ['读取速率', '写入速率'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '速率', axisLabel: { formatter: (val: any) => safeFormatBytes(val) + '/s' } },
        series: [
          { name: '读取速率', type: 'line', data: readRates, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } },
          { name: '写入速率', type: 'line', data: writeRates, smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } }
        ]
      })
      diskIoInstance.resize()
    }
    
    // 2. Network Traffic Chart
    if (networkTrafficRef.value) {
      const existingInstance = echarts.getInstanceByDom(networkTrafficRef.value)
      if (existingInstance) existingInstance.dispose()
      
      networkTrafficInstance = echarts.init(networkTrafficRef.value)
      
      const recvRates = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return Math.max(0, (m.networkRecvBytes || 0) - (memoryHistory[i-1].networkRecvBytes || 0))
      })
      const sentRates = memoryHistory.map((m, i) => {
        if (i === 0) return 0
        return Math.max(0, (m.networkSentBytes || 0) - (memoryHistory[i-1].networkSentBytes || 0))
      })
      
      networkTrafficInstance.setOption({
        title: { text: '网络流量', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
        tooltip: { 
          trigger: 'axis',
          formatter: (params: any) => {
            let result = params[0].name + '<br/>'
            params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${formatBytes(p.value)}/s<br/>` })
            return result
          }
        },
        legend: { data: ['接收速率', '发送速率'], bottom: 0 },
        grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
        xAxis: { type: 'category', data: times, boundaryGap: false },
        yAxis: { type: 'value', name: '速率', axisLabel: { formatter: (val: any) => safeFormatBytes(val) + '/s' } },
        series: [
          { name: '接收速率', type: 'line', data: recvRates, smooth: true, itemStyle: { color: '#67c23a' }, areaStyle: { color: 'rgba(103, 194, 58, 0.1)' } },
          { name: '发送速率', type: 'line', data: sentRates, smooth: true, itemStyle: { color: '#e6a23c' }, areaStyle: { color: 'rgba(230, 162, 60, 0.1)' } }
        ]
      })
      networkTrafficInstance.resize()
    }
    
    // 3. Disk I/O Operations Chart (磁盘IO操作次数)
    if (diskIoOpsRef.value) {
      const existingInstance = echarts.getInstanceByDom(diskIoOpsRef.value)
      if (existingInstance) existingInstance.dispose()
      
      diskIoOpsInstance = echarts.init(diskIoOpsRef.value)
      
      const hasOpsData = memoryHistory.some(m => m.diskReadOps !== undefined || m.diskWriteOps !== undefined)
      
      if (!hasOpsData) {
        diskIoOpsInstance.setOption({
          title: { text: '磁盘IO操作次数', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无IO操作数据\n请确保 Agent 正常运行并上报数据',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        const readOpsRates = memoryHistory.map((m, i) => {
          if (i === 0) return 0
          return Math.max(0, (m.diskReadOps || 0) - (memoryHistory[i-1].diskReadOps || 0))
        })
        const writeOpsRates = memoryHistory.map((m, i) => {
          if (i === 0) return 0
          return Math.max(0, (m.diskWriteOps || 0) - (memoryHistory[i-1].diskWriteOps || 0))
        })
        
        diskIoOpsInstance.setOption({
          title: { text: '磁盘IO操作次数', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { 
            trigger: 'axis',
            formatter: (params: any) => {
              let result = params[0].name + '<br/>'
              params.forEach((p: any) => { result += `${p.marker} ${p.seriesName}: ${p.value} ops/s<br/>` })
              return result
            }
          },
          legend: { data: ['读取操作', '写入操作'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: { type: 'value', name: '操作次数/s' },
          series: [
            { name: '读取操作', type: 'bar', data: readOpsRates, itemStyle: { color: '#409eff' } },
            { name: '写入操作', type: 'bar', data: writeOpsRates, itemStyle: { color: '#f56c6c' } }
          ]
        })
      }
      diskIoOpsInstance.resize()
    }
    
    // 4. IO-CPU Correlation Chart (IO与CPU相关性)
    if (ioCpuCorrelationRef.value) {
      const existingInstance = echarts.getInstanceByDom(ioCpuCorrelationRef.value)
      if (existingInstance) existingInstance.dispose()
      
      ioCpuCorrelationInstance = echarts.init(ioCpuCorrelationRef.value)
      
      const hasCpuData = memoryHistory.some(m => m.processCpuLoad !== undefined)
      const hasIoData = memoryHistory.some(m => m.diskReadBytes !== undefined || m.diskWriteBytes !== undefined)
      
      if (!hasCpuData || !hasIoData) {
        ioCpuCorrelationInstance.setOption({
          title: { text: 'IO与CPU相关性分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600, color: '#909399' } },
          graphic: {
            type: 'text',
            left: 'center',
            top: 'middle',
            style: {
              text: '暂无IO或CPU数据\n请确保 Agent 正常运行并上报数据',
              fill: '#c0c4cc',
              fontSize: 14,
              textAlign: 'center'
            }
          }
        })
      } else {
        const ioTotalRates = memoryHistory.map((m, i) => {
          if (i === 0) return 0
          const readRate = Math.max(0, (m.diskReadBytes || 0) - (memoryHistory[i-1].diskReadBytes || 0))
          const writeRate = Math.max(0, (m.diskWriteBytes || 0) - (memoryHistory[i-1].diskWriteBytes || 0))
          return readRate + writeRate
        })
        
        ioCpuCorrelationInstance.setOption({
          title: { text: 'IO与CPU相关性分析', left: 'center', textStyle: { fontSize: 14, fontWeight: 600 } },
          tooltip: { 
            trigger: 'axis',
            formatter: (params: any) => {
              let result = params[0].name + '<br/>'
              params.forEach((p: any) => {
                if (p.seriesName === 'CPU使用率') {
                  result += `${p.marker} ${p.seriesName}: ${(p.value * 100).toFixed(2)}%<br/>`
                } else {
                  result += `${p.marker} ${p.seriesName}: ${safeFormatBytes(p.value)}/s<br/>`
                }
              })
              return result
            }
          },
          legend: { data: ['CPU使用率', 'IO总速率'], bottom: 0 },
          grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
          xAxis: { type: 'category', data: times, boundaryGap: false },
          yAxis: [
            { type: 'value', name: 'CPU%', axisLabel: { formatter: (val: number) => (val * 100).toFixed(0) + '%' } },
            { type: 'value', name: 'IO速率', axisLabel: { formatter: (val: any) => safeFormatBytes(val) + '/s' } }
          ],
          series: [
            { name: 'CPU使用率', type: 'line', data: memoryHistory.map(m => m.processCpuLoad || 0), smooth: true, itemStyle: { color: '#f56c6c' }, areaStyle: { color: 'rgba(245, 108, 108, 0.1)' } },
            { name: 'IO总速率', type: 'line', yAxisIndex: 1, data: ioTotalRates, smooth: true, itemStyle: { color: '#409eff' }, areaStyle: { color: 'rgba(64, 158, 255, 0.1)' } }
          ]
        })
      }
      ioCpuCorrelationInstance.resize()
    }
  }

  // 清理资源
  const cleanup = () => {
    ;[diskIoInstance, diskIoOpsInstance, networkTrafficInstance, ioCpuCorrelationInstance].forEach(instance => {
      if (instance) {
        instance.dispose()
      }
    })
  }

  return {
    // 图表DOM引用
    diskIoRef,
    diskIoOpsRef,
    networkTrafficRef,
    ioCpuCorrelationRef,
    
    // 计算属性工厂函数
    avgDiskReadRate,
    avgDiskWriteRate,
    maxDiskReadRate,
    maxDiskWriteRate,
    avgNetworkRecvRate,
    avgNetworkSentRate,
    ioPatternAnalysis,
    ioLatencyAnalysis,
    networkPatternAnalysis,
    
    // 方法
    renderIoNetworkCharts,
    formatBytes,
    cleanup
  }
}
