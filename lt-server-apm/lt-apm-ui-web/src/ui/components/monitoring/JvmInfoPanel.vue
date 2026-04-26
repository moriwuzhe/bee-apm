<template>
  <el-card shadow="hover" class="jvm-info-card">
    <el-descriptions :column="4" border size="small">
      <el-descriptions-item label="JVM启动时间">{{ jvmStartTime }}</el-descriptions-item>
      <el-descriptions-item label="运行时长">{{ jvmUptime }}</el-descriptions-item>
      <el-descriptions-item label="峰值线程数">{{ peakThreadCount }}</el-descriptions-item>
      <el-descriptions-item label="守护线程数">{{ daemonThreadCount }}</el-descriptions-item>
      <el-descriptions-item label="累计加载类">{{ totalLoadedClass }}</el-descriptions-item>
      <el-descriptions-item label="卸载类数量">{{ unloadedClass }}</el-descriptions-item>
      <el-descriptions-item label="Minor GC次数">{{ minorGcCount }}</el-descriptions-item>
      <el-descriptions-item label="Full GC次数">{{ fullGcCount }}</el-descriptions-item>
    </el-descriptions>
    
    <!-- JVM参数 -->
    <template v-if="jvmArgs && jvmArgs.length > 0">
      <el-divider content-position="left">
        <el-icon><Setting /></el-icon>
        JVM参数
      </el-divider>
      <div class="jvm-args-container">
        <el-tag 
          v-for="(arg, index) in jvmArgs" 
          :key="index"
          size="small"
          type="info"
          style="margin: 2px;"
        >
          {{ arg }}
        </el-tag>
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'

defineProps<{
  jvmStartTime: string
  jvmUptime: string
  peakThreadCount: string | number
  daemonThreadCount: string | number
  totalLoadedClass: string | number
  unloadedClass: string | number
  minorGcCount: string | number
  fullGcCount: string | number
  jvmArgs?: string[]
}>()
</script>

<style scoped>
.jvm-info-card {
  margin-bottom: 16px;
}

.jvm-args-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 8px 0;
}
</style>
