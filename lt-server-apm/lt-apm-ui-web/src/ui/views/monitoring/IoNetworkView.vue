<template>
  <div class="io-network-view">
    <!-- 控制面板 -->
    <MonitoringControls
      :time-range="historyTimeRange"
      :loading="historyLoading"
      :auto-refresh-enabled="enableAutoRefresh"
      :auto-refresh-interval="autoRefreshInterval"
      @refresh="$emit('refresh')"
      @auto-refresh-toggle="$emit('autoRefreshToggle', $event)"
      @update:time-range="(val) => $emit('update:historyTimeRange', val)"
      @update:auto-refresh-enabled="(val) => $emit('update:enableAutoRefresh', val)"
      @update:auto-refresh-interval="(val) => $emit('update:autoRefreshInterval', val)"
    />
    
    <!-- 🌐 IO/网络监控区域 -->
    <div class="section-header">
      <h3>🌐 IO/网络监控</h3>
    </div>
    
    <!-- 空数据提示 -->
    <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
      <div style="font-size: 64px; margin-bottom: 16px;">🌐</div>
      <div style="font-size: 16px; margin-bottom: 8px;">暂无IO/网络监控数据</div>
      <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
    </div>
    
    <template v-else>
      <!-- IO指标卡片 -->
      <MetricCards :cards="ioMetricCards" />
      
      <!-- 图表区域 -->
      <div class="section-header">
        <h3>📊 IO/网络流量</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="diskIoChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="networkTrafficChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <!-- 深度分析 -->
      <div class="section-header">
        <h3>🔍 深度分析</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="diskIoOpsChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="ioCpuCorrelationChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { MonitoringControls, MetricCards } from '../../components/monitoring'
import { useIoNetworkMonitoring } from '../../composables/useIoNetworkMonitoring'

const props = defineProps<{
  memoryHistory: any[]
  historyTimeRange: number
  historyLoading: boolean
  enableAutoRefresh: boolean
  autoRefreshInterval: number
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'autoRefreshToggle', enabled: boolean): void
  (e: 'update:historyTimeRange', value: number): void
  (e: 'update:enableAutoRefresh', value: boolean): void
  (e: 'update:autoRefreshInterval', value: number): void
}>()

// 定义本地ref（用于模板绑定）
const diskIoChartRef = ref<HTMLElement | null>(null)
const networkTrafficChartRef = ref<HTMLElement | null>(null)
const diskIoOpsChartRef = ref<HTMLElement | null>(null)
const ioCpuCorrelationChartRef = ref<HTMLElement | null>(null)

// 使用 Composable
const ioNetworkMon = useIoNetworkMonitoring()
const {
  renderIoNetworkCharts,
  diskIoRef: composableDiskIoRef,
  diskIoOpsRef: composableDiskIoOpsRef,
  networkTrafficRef: composableNetworkTrafficRef,
  ioCpuCorrelationRef: composableIoCpuCorrelationRef
} = ioNetworkMon

// 同步本地ref到composable的ref
const syncRefs = () => {
  console.log('[IoNetworkView] 同步ref到composable')
  if (composableDiskIoRef) composableDiskIoRef.value = diskIoChartRef.value as any
  if (composableNetworkTrafficRef) composableNetworkTrafficRef.value = networkTrafficChartRef.value as any
  if (composableDiskIoOpsRef) composableDiskIoOpsRef.value = diskIoOpsChartRef.value as any
  if (composableIoCpuCorrelationRef) composableIoCpuCorrelationRef.value = ioCpuCorrelationChartRef.value as any
  console.log('[IoNetworkView] ref同步完成')
}

// 组件挂载后同步ref
onMounted(() => {
  console.log('[IoNetworkView] 组件已挂载')
  syncRefs()
})

// 计算属性：IO指标卡片（基于props.memoryHistory）
const ioMetricCards = computed(() => {
  if (!props.memoryHistory || props.memoryHistory.length === 0) {
    return [
      { title: '📖 读取速率', value: '-', subtitle: 'Bytes/s' },
      { title: '✍️ 写入速率', value: '-', subtitle: 'Bytes/s' },
      { title: '⬇️ 网络流入', value: '-', subtitle: 'Bytes/s' },
      { title: '⬆️ 网络流出', value: '-', subtitle: 'Bytes/s' }
    ]
  }
  
  const latest = props.memoryHistory[props.memoryHistory.length - 1]
  
  // Agent上报的是累积值，需要计算速率
  // 如果有rate字段直接用，否则用最后一条数据的值
  const diskReadRate = latest.diskReadRate || latest.diskReadBytes || 0
  const diskWriteRate = latest.diskWriteRate || latest.diskWriteBytes || 0
  const networkRecvRate = latest.networkRecvRate || latest.networkRecvBytes || 0
  const networkSentRate = latest.networkSentRate || latest.networkSentBytes || 0
  
  return [
    { title: '📖 读取速率', value: diskReadRate ? formatBytes(diskReadRate) : '-', subtitle: 'Bytes/s' },
    { title: '✍️ 写入速率', value: diskWriteRate ? formatBytes(diskWriteRate) : '-', subtitle: 'Bytes/s' },
    { title: '⬇️ 网络流入', value: networkRecvRate ? formatBytes(networkRecvRate) : '-', subtitle: 'Bytes/s' },
    { title: '⬆️ 网络流出', value: networkSentRate ? formatBytes(networkSentRate) : '-', subtitle: 'Bytes/s' }
  ]
})

// 格式化字节显示
const formatBytes = (bytes: number): string => {
  if (bytes >= 1073741824) {
    return (bytes / 1073741824).toFixed(2) + ' GB/s'
  } else if (bytes >= 1048576) {
    return (bytes / 1048576).toFixed(2) + ' MB/s'
  } else if (bytes >= 1024) {
    return (bytes / 1024).toFixed(2) + ' KB/s'
  }
  return bytes.toFixed(0) + ' B/s'
}

// 监听数据变化，自动渲染图表
let ioWatchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => props.memoryHistory, (newData) => {
  if (newData && newData.length > 0) {
    // 清除之前的定时器（防抖）
    if (ioWatchTimer) {
      clearTimeout(ioWatchTimer)
    }
    
    ioWatchTimer = setTimeout(() => {
      // 检查当前组件是否可见（通过检查自己的根元素）
      const rootEl = document.querySelector('.io-network-view') as HTMLElement
      if (!rootEl || rootEl.offsetParent === null) {
        console.log('[IoNetworkView] 组件被隐藏（offsetParent为null），跳过渲染')
        ioWatchTimer = null
        return // 直接跳过，不渲染
      }
      
      // 同步ref
      syncRefs()
      renderIoNetworkCharts(newData)
      ioWatchTimer = null
    }, 800) // 增加延迟确保DOM就绪
  }
}, { deep: true })

// 监听时间范围变化，重新渲染图表
watch(() => props.historyTimeRange, () => {
  if (props.memoryHistory && props.memoryHistory.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        syncRefs()
        renderIoNetworkCharts(props.memoryHistory)
      }, 500)
    })
  }
})
</script>

<style scoped>
.io-network-view {
  padding: 16px;
}

.section-header {
  margin: 24px 0 16px 0;
  padding-bottom: 8px;
  border-bottom: 2px solid #e4e7ed;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-box-large {
  height: 350px;
  background: #fff;
  border-radius: 4px;
  padding: 16px;
}

.charts-row {
  margin-bottom: 16px;
}
</style>
