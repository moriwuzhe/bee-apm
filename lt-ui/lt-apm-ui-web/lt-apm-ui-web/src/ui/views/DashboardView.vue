<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { fetchDashboardStat, type DashboardStat } from '../../api/dashboard'
import { useTimeRangeStore } from '../../stores/timeRange'

const timeRange = useTimeRangeStore()

const loading = ref(false)
const stat = ref<DashboardStat>({ req: 0, log: 0, inst: 0, error: 0 })

async function reload() {
  loading.value = true
  try {
    stat.value = await fetchDashboardStat({ beginTime: timeRange.beginTime, endTime: timeRange.endTime })
  } catch (e: any) {
    stat.value = { req: 0, log: 0, inst: 0, error: 0 }
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(reload)
watch(() => [timeRange.beginTime, timeRange.endTime], reload)
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div class="title">仪表盘</div>
      <el-button :loading="loading" type="primary" @click="reload">刷新</el-button>
    </div>

    <div class="grid">
      <el-card class="kpi" shadow="never">
        <div class="kpi-label">异常量</div>
        <div class="kpi-value">{{ stat.error }}</div>
      </el-card>
      <el-card class="kpi" shadow="never">
        <div class="kpi-label">实例数</div>
        <div class="kpi-value">{{ stat.inst }}</div>
      </el-card>
      <el-card class="kpi" shadow="never">
        <div class="kpi-label">请求量</div>
        <div class="kpi-value">{{ stat.req }}</div>
      </el-card>
      <el-card class="kpi" shadow="never">
        <div class="kpi-label">采集量</div>
        <div class="kpi-value">{{ stat.log }}</div>
      </el-card>
    </div>

    <el-card shadow="never" class="panel">
      <div class="panel-title">时间范围</div>
      <div class="panel-sub">{{ timeRange.beginTime }} ~ {{ timeRange.endTime }}</div>
    </el-card>
  </div>
</template>

<style scoped>
.page{
  display:flex;
  flex-direction: column;
  gap: var(--space-4);
}

.page-head{
  display:flex;
  align-items:center;
  justify-content: space-between;
}

.title{
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.grid{
  display:grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--space-3);
}

@media (max-width: 1100px){
  .grid{
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.kpi :deep(.el-card__body){
  padding: 14px;
}

.kpi-label{
  color: var(--text-muted);
  font-size: 12px;
}

.kpi-value{
  margin-top: 8px;
  font-size: 26px;
  font-weight: 900;
  letter-spacing: .2px;
}

.panel :deep(.el-card__body){
  padding: 14px;
}

.panel-title{
  font-weight: 700;
}

.panel-sub{
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 13px;
}
</style>

