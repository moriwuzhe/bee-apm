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
      <el-row :gutter="16" class="charts-row">
        <el-col :span="12">
          <div ref="diskIoChartRef" class="chart-box-large"></div>
        </el-col>
        <el-col :span="12">
          <div ref="networkTrafficChartRef" class="chart-box-large"></div>
        </el-col>
      </el-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
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

// 使用 Composable
const ioNetworkMon = useIoNetworkMonitoring()
const {
  readBytesRateValue,
  writeBytesRateValue,
  networkInRateValue,
  networkOutRateValue,
  renderIoNetworkCharts
} = ioNetworkMon

// 计算属性：IO指标卡片
const ioMetricCards = computed(() => [
  { title: '📖 读取速率', value: readBytesRateValue.value || '-', subtitle: 'Bytes/s' },
  { title: '✍️ 写入速率', value: writeBytesRateValue.value || '-', subtitle: 'Bytes/s' },
  { title: '⬇️ 网络流入', value: networkInRateValue.value || '-', subtitle: 'Bytes/s' },
  { title: '⬆️ 网络流出', value: networkOutRateValue.value || '-', subtitle: 'Bytes/s' }
])

// 监听数据变化，自动渲染图表
watch(() => props.memoryHistory, (newData) => {
  if (newData && newData.length > 0) {
    nextTick(() => {
      setTimeout(() => {
        renderIoNetworkCharts(newData)
      }, 300)
    })
  }
}, { deep: true })
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
