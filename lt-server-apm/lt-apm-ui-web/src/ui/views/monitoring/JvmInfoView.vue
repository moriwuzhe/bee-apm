<template>
  <div class="jvm-info-view">
    <!-- Runtime & Memory Section -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">堆内存</div>
          <div class="stat-value">{{ formatBytes(jvmData.heapUsed) }}</div>
          <div class="stat-subtitle">/ {{ formatBytes(jvmData.heapMax) }}</div>
          <el-progress :percentage="jvmData.heapPercent" :color="getProgressColor(jvmData.heapPercent)" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">非堆内存</div>
          <div class="stat-value">{{ formatBytes(jvmData.nonHeapUsed) }}</div>
          <div class="stat-subtitle">/ {{ formatBytes(jvmData.nonHeapMax) }}</div>
          <el-progress :percentage="jvmData.nonHeapPercent" :color="getProgressColor(jvmData.nonHeapPercent)" />
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-title">线程数</div>
          <div class="stat-value">{{ jvmData.threadCount }}</div>
          <div class="stat-subtitle">峰值: {{ jvmData.peakThreadCount }}</div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- Basic Info Card -->
    <el-card shadow="never" style="margin-bottom: 16px;">
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">PID:</span>
          <span class="info-value">{{ jvmData.pid }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">JVM名称:</span>
          <span class="info-value">{{ jvmData.vmName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">JVM版本:</span>
          <span class="info-value">{{ jvmData.vmVersion }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">运行时长:</span>
          <span class="info-value">{{ formatDuration(jvmData.uptimeMs) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">启动时间:</span>
          <span class="info-value">{{ formatTimestamp(jvmData.startTimeMs) }}</span>
        </div>
      </div>
    </el-card>

    <!-- Thread & Class Loading Section -->
    <el-row :gutter="16" style="margin-bottom: 16px;">
      <el-col :span="12">
        <el-card shadow="hover">
          <div class="section-title">线程详情</div>
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">当前线程:</span>
              <span class="detail-value">{{ jvmData.threadCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">守护线程:</span>
              <span class="detail-value">{{ jvmData.daemonThreadCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">峰值线程:</span>
              <span class="detail-value">{{ jvmData.peakThreadCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">累计启动:</span>
              <span class="detail-value">{{ jvmData.totalStartedThreadCount }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <div class="section-title">类加载</div>
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">已加载类:</span>
              <span class="detail-value">{{ jvmData.loadedClassCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">总加载类:</span>
              <span class="detail-value">{{ jvmData.totalLoadedClassCount }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">卸载类:</span>
              <span class="detail-value">{{ jvmData.unloadedClassCount }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- OS Information Section -->
    <el-card shadow="never" style="margin-bottom: 16px;">
      <div class="section-title">操作系统信息</div>
      <el-row :gutter="16">
        <el-col :span="12">
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">操作系统:</span>
              <span class="detail-value">{{ jvmData.osName }} {{ jvmData.osVersion }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">处理器:</span>
              <span class="detail-value">{{ jvmData.availableProcessors }} 核心</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">系统负载:</span>
              <span class="detail-value">{{ jvmData.systemLoadAverage.toFixed(2) }}</span>
            </div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">物理内存:</span>
              <span class="detail-value">{{ formatBytes(jvmData.totalPhysicalMemory - jvmData.freePhysicalMemory) }} / {{ formatBytes(jvmData.totalPhysicalMemory) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">进程CPU:</span>
              <span class="detail-value">{{ (jvmData.processCpuLoad * 100).toFixed(2) }}%</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">系统CPU:</span>
              <span class="detail-value">{{ (jvmData.systemCpuLoad * 100).toFixed(2) }}%</span>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- GC Summary Section -->
    <el-card shadow="never">
      <div class="section-title">GC摘要</div>
      <div class="detail-list">
        <div class="detail-item">
          <span class="detail-label">总GC次数:</span>
          <span class="detail-value">{{ jvmData.totalGcCount }}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">总GC耗时:</span>
          <span class="detail-value">{{ formatDuration(jvmData.totalGcTime) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'

const props = defineProps<{
  jvmData: any
}>()

// 格式化字节
const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化持续时间
const formatDuration = (ms: number): string => {
  if (!ms || ms === 0) return '0s'
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days}天${hours % 24}小时`
  if (hours > 0) return `${hours}小时${minutes % 60}分钟`
  if (minutes > 0) return `${minutes}分钟${seconds % 60}秒`
  return `${seconds}秒`
}

// 格式化时间戳
const formatTimestamp = (timestamp: number): string => {
  if (!timestamp || timestamp === 0) return '-'
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

// 获取进度条颜色
const getProgressColor = (percentage: number): string => {
  if (percentage < 50) return '#67c23a'
  if (percentage < 80) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.jvm-info-view {
  width: 100%;
}

.stat-card {
  text-align: center;
}

.stat-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
  margin-bottom: 4px;
}

.stat-subtitle {
  font-size: 12px;
  color: #c0c4cc;
  margin-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.info-label {
  font-weight: 500;
  color: #606266;
  margin-right: 8px;
  min-width: 80px;
}

.info-value {
  color: #303133;
  font-family: monospace;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #ebeef5;
}

.detail-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-label {
  color: #606266;
  font-size: 14px;
}

.detail-value {
  color: #303133;
  font-weight: 500;
  font-family: monospace;
}
</style>
