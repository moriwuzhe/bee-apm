<template>
  <div class="monitoring-controls" style="margin-bottom: 16px;">
    <!-- 时间范围选择 -->
    <el-select 
      v-model="timeRange" 
      placeholder="选择时间范围" 
      style="width: 200px; margin-right: 10px;"
      @change="handleTimeRangeChange"
    >
      <el-option label="最近1小时" :value="1" />
      <el-option label="最近6小时" :value="6" />
      <el-option label="最近24小时" :value="24" />
      <el-option label="最近7天" :value="168" />
    </el-select>
    
    <!-- 刷新按钮 -->
    <el-button 
      type="primary" 
      @click="$emit('refresh')" 
      :loading="loading"
    >
      🔄 刷新数据
    </el-button>
    
    <!-- 自动刷新控制 -->
    <el-divider direction="vertical" />
    <el-switch 
      v-model="autoRefreshEnabled" 
      active-text="自动刷新" 
      @change="handleAutoRefreshToggle"
      style="margin-left: 10px;"
    />
    
    <el-select 
      v-if="autoRefreshEnabled" 
      v-model="autoRefreshInterval" 
      placeholder="刷新间隔" 
      style="width: 120px; margin-left: 10px;"
      @change="handleIntervalChange"
    >
      <el-option label="5秒" :value="5" />
      <el-option label="10秒" :value="10" />
      <el-option label="30秒" :value="30" />
      <el-option label="1分钟" :value="60" />
      <el-option label="5分钟" :value="300" />
    </el-select>
    
    <el-tag 
      v-if="autoRefreshEnabled" 
      type="success" 
      effect="dark" 
      style="margin-left: 10px;"
    >
      <el-icon class="is-loading"><Connection /></el-icon>
      自动刷新中
    </el-tag>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Connection } from '@element-plus/icons-vue'

const props = defineProps<{
  timeRange: number
  loading: boolean
  autoRefreshEnabled: boolean
  autoRefreshInterval: number
}>()

const emit = defineEmits<{
  (e: 'update:timeRange', value: number): void
  (e: 'update:autoRefreshEnabled', value: boolean): void
  (e: 'update:autoRefreshInterval', value: number): void
  (e: 'refresh'): void
  (e: 'autoRefreshToggle', enabled: boolean): void
}>()

const timeRange = ref(props.timeRange)
const autoRefreshEnabled = ref(props.autoRefreshEnabled)
const autoRefreshInterval = ref(props.autoRefreshInterval)

// 同步 props 到本地 ref
watch(() => props.timeRange, (val) => { timeRange.value = val })
watch(() => props.autoRefreshEnabled, (val) => { autoRefreshEnabled.value = val })
watch(() => props.autoRefreshInterval, (val) => { autoRefreshInterval.value = val })

const handleTimeRangeChange = (value: number) => {
  emit('update:timeRange', value)
}

const handleAutoRefreshToggle = (enabled: boolean) => {
  emit('update:autoRefreshEnabled', enabled)
  emit('autoRefreshToggle', enabled)
}

const handleIntervalChange = (interval: number) => {
  emit('update:autoRefreshInterval', interval)
}
</script>

<style scoped>
.monitoring-controls {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
