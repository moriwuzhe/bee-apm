<template>
  <div class="memory-monitoring-view">
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
    
    <!-- 💾 内存监控区域 -->
    <div class="section-header">
      <h3>💾 内存监控</h3>
    </div>
    
    <!-- 空数据提示 -->
    <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
      <div style="font-size: 64px; margin-bottom: 16px;">📊</div>
      <div style="font-size: 16px; margin-bottom: 8px;">暂无内存监控数据</div>
      <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
    </div>
    
    <template v-else>
      <!-- 内存关键指标卡片 -->
      <MetricCards :cards="memoryMetricCards" />
      
      <!-- 图表区域 -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="heapChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="nonHeapChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="youngGenChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="oldGenChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" class="charts-row">
        <el-col :span="24">
          <div ref="memoryPoolsGridRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="memoryUsageRateRef" class="chart-box-large" data-chart="memory-usage-rate"></div>
        </el-col>
        <el-col :span="12">
          <div ref="memoryAllocationRef" class="chart-box-large" data-chart="memory-allocation"></div>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="bufferPoolsChartRef" class="chart-box-large" data-chart="buffer-pools"></div>
        </el-col>
        <el-col :span="12">
          <div ref="physicalMemoryRef" class="chart-box-large" data-chart="physical-memory"></div>
        </el-col>
      </el-row>
      
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="heapGrowthRateRef" class="chart-box-large" data-chart="heap-growth-rate"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcPressureRef" class="chart-box-large" data-chart="gc-pressure"></div>
        </el-col>
      </el-row>
      
      <!-- 内存池详细趋势 -->
      <div class="section-header">
        <h3>️ 内存池详细趋势</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="edenSurvivorChartRef" class="chart-box-large" data-chart="eden-survivor"></div>
        </el-col>
        <el-col :span="12">
          <div ref="oldGenChartDetailRef" class="chart-box-large" data-chart="old-gen"></div>
        </el-col>
      </el-row>
      
      <!-- GC深度分析 -->
      <div class="section-header">
        <h3>📊 GC深度分析</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="minorVsFullGcChartRef" class="chart-box-large" data-chart="minor-vs-full-gc"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcEfficiencyChartRef" class="chart-box-large" data-chart="gc-efficiency"></div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick, onMounted } from 'vue'
import { MonitoringControls, MetricCards } from '../../components/monitoring'
import { useMemoryMonitoring } from '../../composables/useMemoryMonitoring'

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
const heapChartRef = ref<HTMLElement | null>(null)
const nonHeapChartRef = ref<HTMLElement | null>(null)
const youngGenChartRef = ref<HTMLElement | null>(null)
const oldGenChartRef = ref<HTMLElement | null>(null)
const memoryPoolsGridRef = ref<HTMLElement | null>(null)
const memoryUsageRateRef = ref<HTMLElement | null>(null)
const memoryAllocationRef = ref<HTMLElement | null>(null)
const bufferPoolsChartRef = ref<HTMLElement | null>(null)
const physicalMemoryRef = ref<HTMLElement | null>(null)
const heapGrowthRateRef = ref<HTMLElement | null>(null)
const gcPressureRef = ref<HTMLElement | null>(null)
const edenSurvivorChartRef = ref<HTMLElement | null>(null)
const oldGenChartDetailRef = ref<HTMLElement | null>(null)
const minorVsFullGcChartRef = ref<HTMLElement | null>(null)
const gcEfficiencyChartRef = ref<HTMLElement | null>(null)

// 使用 Composable
const memoryMon = useMemoryMonitoring()
const {
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
  renderMemoryCharts,
  memoryHistory: composableMemoryHistory,  // 获取composable内部的memoryHistory
  // 获取composable中的ref（有些可能未导出，需要检查）
  heapChartRef: composableHeapChartRef,
  nonHeapChartRef: composableNonHeapChartRef,
  youngGenChartRef: composableYoungGenChartRef,
  oldGenChartRef: composableOldGenChartRef,
  memoryPoolsGridRef: composableMemoryPoolsGridRef,
  edenSurvivorChartRef: composableEdenSurvivorChartRef,
  oldGenChartDetailRef: composableOldGenChartDetailRef,
  // 以下ref可能未在composable中导出，使用可选链
  memoryUsageRateRef: composableMemoryUsageRateRef,
  memoryAllocationRef: composableMemoryAllocationRef,
  bufferPoolsChartRef: composableBufferPoolsChartRef,
  physicalMemoryRef: composablePhysicalMemoryRef,
  heapGrowthRateRef: composableHeapGrowthRateRef,
  gcPressureRef: composableGcPressureRef,
  minorVsFullGcChartRef: composableMinorVsFullGcChartRef,
  gcEfficiencyChartRef: composableGcEfficiencyChartRef
} = memoryMon

// 组件挂载后同步ref并检查
onMounted(() => {
  console.log('[MemoryMonitoringView] 组件已挂载')
  // 立即同步一次ref
  syncRefs()
})

// 同步本地ref到composable的ref（只同步本地定义的ref）
const syncRefs = () => {
  console.log('[MemoryMonitoringView] 同步ref到composable')
  
  // 只同步本地定义且模板中使用的ref
  if (composableHeapChartRef) composableHeapChartRef.value = heapChartRef.value as any
  if (composableNonHeapChartRef) composableNonHeapChartRef.value = nonHeapChartRef.value as any
  if (composableYoungGenChartRef) composableYoungGenChartRef.value = youngGenChartRef.value as any
  if (composableOldGenChartRef) composableOldGenChartRef.value = oldGenChartRef.value as any
  if (composableMemoryPoolsGridRef) composableMemoryPoolsGridRef.value = memoryPoolsGridRef.value as any
  if (composableMemoryUsageRateRef) composableMemoryUsageRateRef.value = memoryUsageRateRef.value as any
  if (composableMemoryAllocationRef) composableMemoryAllocationRef.value = memoryAllocationRef.value as any
  if (composableBufferPoolsChartRef) composableBufferPoolsChartRef.value = bufferPoolsChartRef.value as any
  if (composablePhysicalMemoryRef) composablePhysicalMemoryRef.value = physicalMemoryRef.value as any
  if (composableHeapGrowthRateRef) composableHeapGrowthRateRef.value = heapGrowthRateRef.value as any
  if (composableGcPressureRef) composableGcPressureRef.value = gcPressureRef.value as any
  if (composableEdenSurvivorChartRef) composableEdenSurvivorChartRef.value = edenSurvivorChartRef.value as any
  if (composableOldGenChartDetailRef) composableOldGenChartDetailRef.value = oldGenChartDetailRef.value as any
  if (composableMinorVsFullGcChartRef) composableMinorVsFullGcChartRef.value = minorVsFullGcChartRef.value as any
  if (composableGcEfficiencyChartRef) composableGcEfficiencyChartRef.value = gcEfficiencyChartRef.value as any
  
  console.log('[MemoryMonitoringView] ref同步完成')
}

// 同步props.memoryHistory到composable的memoryHistory，并渲染图表
let memoryWatchTimer: ReturnType<typeof setTimeout> | null = null
watch(() => props.memoryHistory, (newData) => {
  console.log('[MemoryMonitoringView] memoryHistory变化, length:', newData?.length || 0)
  if (newData && newData.length > 0) {
    // 清除之前的定时器（防抖）
    if (memoryWatchTimer) {
      clearTimeout(memoryWatchTimer)
    }
    
    // 同步数据到composable
    composableMemoryHistory.value = newData
    
    // 等待DOM更新后再同步ref并渲染
    memoryWatchTimer = setTimeout(() => {
      // 检查当前组件是否可见（通过检查自己的根元素）
      const rootEl = document.querySelector('.memory-monitoring-view') as HTMLElement
      if (!rootEl || rootEl.offsetParent === null) {
        console.log('[MemoryMonitoringView] 组件被隐藏（offsetParent为null），跳过渲染')
        memoryWatchTimer = null
        return // 直接跳过，不渲染
      }
      
      // 再次同步ref（确保DOM已渲染）
      syncRefs()
      
      console.log('[MemoryMonitoringView] 开始渲染图表...')
      renderMemoryCharts()
      console.log('[MemoryMonitoringView] 图表渲染完成')
      memoryWatchTimer = null
    }, 800) // 增加延迟到800ms确保Dialog动画和DOM渲染完成
  }
}, { deep: true })

// 监听时间范围变化，重新渲染图表
watch(() => props.historyTimeRange, () => {
  if (props.memoryHistory && props.memoryHistory.length > 0) {
    composableMemoryHistory.value = props.memoryHistory
    nextTick(() => {
      setTimeout(() => {
        syncRefs()
        renderMemoryCharts()
      }, 500)
    })
  }
})

// 计算属性：内存指标卡片
const memoryMetricCards = computed(() => [
  { title: '💾 堆内存使用率', value: heapUsagePercent.value, subtitle: '当前时刻', status: heapUsageStatus.value },
  { title: '📊 非堆内存使用率', value: nonHeapUsagePercent.value, subtitle: 'Metaspace等', status: nonHeapUsageStatus.value },
  { title: '🌱 新生代使用率', value: youngGenUsagePercent.value, subtitle: 'Eden + Survivor', status: youngGenUsageStatus.value },
  { title: '👴 老年代使用率', value: oldGenUsagePercent.value, subtitle: 'Old Gen', status: oldGenUsageStatus.value },
  { title: '📈 内存增长速率', value: memoryGrowthRate.value, subtitle: 'MB/分钟', status: memoryGrowthStatus.value },
  { title: '⚡ GC压力指数', value: gcPressureIndex.value, subtitle: '0-100分', status: gcPressureStatus.value },
  { title: '🔍 内存泄漏风险', value: leakRiskLevel.value, subtitle: '风险评估', status: leakRiskStatus.value },
  { title: '🎯 内存健康度', value: memoryHealthScore.value, subtitle: '综合评分', status: memoryHealthStatus.value }
])
</script>

<style scoped>
.memory-monitoring-view {
  padding: 12px;
}

.section-header {
  margin: 16px 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 2px solid #e4e7ed;
}

.section-header:first-child {
  margin-top: 0;
}

.section-header h3 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.chart-box-large {
  height: 280px;
  background: #fff;
  border-radius: 6px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  width: 100%;
  min-width: 0;
  position: relative;
  overflow: hidden;
}

.charts-row {
  margin-bottom: 12px;
}
</style>
