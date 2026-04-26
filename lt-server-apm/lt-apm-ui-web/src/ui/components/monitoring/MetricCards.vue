<template>
  <div class="metric-cards-container">
    <el-row :gutter="12">
      <el-col 
        v-for="(card, index) in cards" 
        :key="index"
        :xs="12" :sm="8" :md="6" :lg="6" :xl="6"
        style="margin-bottom: 12px;"
      >
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">{{ card.title }}</div>
          <div class="stat-value" :class="card.status">{{ formatValue(card.value) }}</div>
          <div class="stat-subtitle">{{ card.subtitle }}</div>
          <el-progress 
            v-if="card.showProgress"
            :percentage="card.progressValue || 0" 
            :color="card.progressColor || getProgressColor(card.progressValue || 0)"
            style="margin-top: 8px"
          />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
interface MetricCard {
  title: string
  value: string | number
  subtitle?: string
  status?: 'success' | 'warning' | 'danger' | 'info'
  span?: number
  showProgress?: boolean
  progressValue?: number
  progressColor?: string
}

defineProps<{
  cards: MetricCard[]
}>()

// 格式化数值显示
const formatValue = (value: string | number): string => {
  if (typeof value === 'number') {
    // 如果数值太大，转换为易读格式
    if (value > 1000000000) {
      return (value / 1000000000).toFixed(2) + 'G'
    } else if (value > 1000000) {
      return (value / 1000000).toFixed(2) + 'M'
    } else if (value > 1000) {
      return (value / 1000).toFixed(2) + 'K'
    }
    return value.toString()
  }
  // 字符串类型，如果太长则截断
  if (typeof value === 'string' && value.length > 12) {
    return value.substring(0, 10) + '...'
  }
  return value
}

// 默认进度条颜色函数
const getProgressColor = (percentage: number): string => {
  if (percentage < 60) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.metric-cards-container {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
  padding: 16px 12px;
  min-height: 140px;
  height: 140px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 8px;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-title {
  font-size: 12px;
  color: #606266;
  margin-bottom: 10px;
  line-height: 1.4;
  min-height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 500;
  word-break: break-word;
}

.stat-value {
  font-size: 22px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 8px;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.stat-value.success { 
  color: #67c23a;
  text-shadow: 0 2px 4px rgba(103, 194, 58, 0.2);
}
.stat-value.warning { 
  color: #e6a23c;
  text-shadow: 0 2px 4px rgba(230, 162, 60, 0.2);
}
.stat-value.danger { 
  color: #f56c6c;
  text-shadow: 0 2px 4px rgba(245, 108, 108, 0.2);
}
.stat-value.info { 
  color: #909399;
}

.stat-subtitle {
  font-size: 11px;
  color: #909399;
  line-height: 1.3;
  word-break: break-word;
}
</style>
