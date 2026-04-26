<template>
  <div class="thread-monitoring-view">
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
    
    <!-- 🧵 线程监控区域 -->
    <div class="section-header">
      <h3>🧵 线程监控</h3>
    </div>
    
    <!-- 空数据提示 -->
    <div v-if="memoryHistory.length === 0" style="text-align: center; padding: 60px 0; color: #909399;">
      <div style="font-size: 64px; margin-bottom: 16px;">🧵</div>
      <div style="font-size: 16px; margin-bottom: 8px;">暂无线程监控数据</div>
      <div style="font-size: 13px; color: #c0c4cc;">请确保Agent正常运行并上报数据</div>
    </div>
    
    <template v-else>
      <!-- 线程指标卡片 -->
      <MetricCards :cards="threadMetricCards" />
      
      <!-- 图表区域 -->
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="threadChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="classLoadingChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <!-- 线程深度分析 -->
      <div class="section-header">
        <h3>🧵 线程深度分析</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="threadStatesChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="classLoadingDetailChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
      
      <!-- CPU与系统监控 -->
      <div class="section-header">
        <h3>⚡ CPU与系统监控</h3>
      </div>
      <el-row :gutter="16" class="charts-row">
        <el-col :span="24">
          <div ref="cpuChartRef" class="chart-box-large"></div>
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
import { useThreadMonitoring } from '../../composables/useThreadMonitoring'

const props = defineProps<{
  memoryHistory: any[]
  historyTimeRange: number
  historyLoading: boolean
  enableAutoRefresh: boolean
  autoRefreshInterval: number
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
const threadChartRef = ref<HTMLElement | null>(null)
const classLoadingChartRef = ref<HTMLElement | null>(null)
const threadStatesChartRef = ref<HTMLElement | null>(null)
const classLoadingDetailChartRef = ref<HTMLElement | null>(null)
const cpuChartRef = ref<HTMLElement | null>(null)

// 使用 Composable
const threadMon = useThreadMonitoring()
const {
  maxThreadCountValue,
  currentThreadCountValue,
  daemonThreadCountValue,
  peakThreadCountValue,
  renderThreadCharts
} = threadMon

// 计算属性：线程指标卡片
const threadMetricCards = computed(() => [
  { title: '📊 最大线程数', value: maxThreadCountValue.value, subtitle: '历史峰值' },
  { title: '🧵 当前线程数', value: currentThreadCountValue.value, subtitle: '活跃线程' },
  { title: '🛡️ 守护线程', value: daemonThreadCountValue.value, subtitle: '后台线程' },
  { title: '📈 峰值线程', value: peakThreadCountValue.value, subtitle: '最高记录' }
])

// 监听数据变化，自动渲染图表
watch(() => props.memoryHistory, (newData) => {
  if (newData && newData.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        renderThreadCharts(newData)
      }, 300)
    })
  }
}, { deep: true })
</script>

<style scoped>
.thread-monitoring-view {
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
