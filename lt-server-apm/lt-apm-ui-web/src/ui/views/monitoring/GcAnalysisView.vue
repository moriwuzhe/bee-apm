<template>
  <div class="gc-analysis-view">
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
    
    <!-- ♻️ GC分析区域 -->
    <div class="section-header">
      <h3>♻️ GC分析趋势</h3>
    </div>
    
    <!-- 空数据提示 -->
    <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
      <div style="font-size: 64px; margin-bottom: 16px;">♻️</div>
      <div style="font-size: 16px; margin-bottom: 8px;">暂无GC监控数据</div>
      <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
    </div>
    
    <template v-else>
      <!-- GC关键指标卡片 -->
      <MetricCards :cards="gcMetricCards" />
      
      <!-- GC图表 -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="gcCountChartRef" class="chart-box-large" data-chart="gc-count"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcDurationChartRef" class="chart-box-large" data-chart="gc-duration"></div>
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
      
      <!-- GC关联分析 -->
      <div class="section-header">
        <h3> GC关联分析</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="gcVsHeapChartRef" class="chart-box-large" data-chart="gc-vs-heap"></div>
        </el-col>
        <el-col :span="12">
          <div ref="gcVsCpuChartRef" class="chart-box-large" data-chart="gc-vs-cpu"></div>
        </el-col>
      </el-row>
      
      <!-- JVM信息 -->
      <div class="section-header">
        <h3>☕ JVM信息</h3>
      </div>
      <JvmInfoPanel
        :jvm-start-time="jvmStartTimeStr"
        :jvm-uptime="jvmUptimeStr"
        :peak-thread-count="latestPeakThreadCount"
        :daemon-thread-count="latestDaemonThreadCount"
        :total-loaded-class="latestTotalLoadedClass"
        :unloaded-class="latestUnloadedClass"
        :minor-gc-count="latestMinorGcCount"
        :full-gc-count="latestFullGcCount"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import { MonitoringControls, MetricCards, JvmInfoPanel } from '../../components/monitoring'
import { useGcAnalysis } from '../../composables/useGcAnalysis'

const props = defineProps<{
  memoryHistory: any[]
  historyTimeRange: number
  historyLoading: boolean
  enableAutoRefresh: boolean
  autoRefreshInterval: number
  totalGcCountValue: string
  totalGcTimeValue: string
  gcFrequencyValue: string
  avgGcTimeValue: string
  avgGcTimeStatus: string
  fullGcRatioValue: string
  fullGcRatioStatus: string
  gcEfficiencyValue: string
  maxGcDurationValue: string
  gcHealthScoreValue: string
  gcHealthStatus: string
  jvmStartTimeStr: string
  jvmUptimeStr: string
  latestPeakThreadCount: string | number
  latestDaemonThreadCount: string | number
  latestTotalLoadedClass: string | number
  latestUnloadedClass: string | number
  latestMinorGcCount: string | number
  latestFullGcCount: string | number
}>()

const emit = defineEmits<{
  (e: 'refresh'): void
  (e: 'autoRefreshToggle', enabled: boolean): void
}>()

// 定义本地ref（用于模板绑定）
const gcCountChartRef = ref<HTMLElement | null>(null)
const gcDurationChartRef = ref<HTMLElement | null>(null)
const minorVsFullGcChartRef = ref<HTMLElement | null>(null)
const gcEfficiencyChartRef = ref<HTMLElement | null>(null)
const gcVsHeapChartRef = ref<HTMLElement | null>(null)
const gcVsCpuChartRef = ref<HTMLElement | null>(null)

// 使用 Composable
const gcAnalysis = useGcAnalysis()
const {
  renderGcCharts
} = gcAnalysis

// 计算属性：GC指标卡片
const gcMetricCards = computed(() => [
  { title: '♻️ 累计GC次数', value: props.totalGcCountValue, subtitle: 'Minor + Full' },
  { title: '⏱️ 累计GC耗时', value: props.totalGcTimeValue, subtitle: '毫秒' },
  { title: '📈 GC频率', value: props.gcFrequencyValue, subtitle: '次/小时' },
  { title: '⚡ 平均GC耗时', value: props.avgGcTimeValue, subtitle: '毫秒/次', status: props.avgGcTimeStatus },
  { title: '🔴 Full GC占比', value: props.fullGcRatioValue, subtitle: 'Full/Total', status: props.fullGcRatioStatus },
  { title: ' GC效率', value: props.gcEfficiencyValue || '-', subtitle: '回收/分配' },
  { title: '🛑 最大GC耗时', value: props.maxGcDurationValue, subtitle: '峰值' },
  { title: '🎯 GC健康度', value: props.gcHealthScoreValue, subtitle: '综合评分', status: props.gcHealthStatus }
])

// 监听数据变化，自动渲染图表
watch(() => props.memoryHistory, (newData) => {
  if (newData && newData.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        renderGcCharts(newData)
      }, 300)
    })
  }
}, { deep: true })

// 监听时间范围变化，重新渲染图表
watch(() => props.historyTimeRange, () => {
  if (props.memoryHistory && props.memoryHistory.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        renderGcCharts(props.memoryHistory)
      }, 500)
    })
  }
})
</script>

<style scoped>
.gc-analysis-view {
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
