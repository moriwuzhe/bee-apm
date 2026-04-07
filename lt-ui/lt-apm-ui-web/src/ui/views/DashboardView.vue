<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, shallowRef } from 'vue'
import { ElMessage } from 'element-plus'
import PageShell from '../components/PageShell.vue'
import { fetchDashboardStat, fetchGlobalTopology, type DashboardStat } from '../../api/dashboard'
import { useTimeRangeStore } from '../../stores/timeRange'

const timeRange = useTimeRangeStore()
const loading = ref(false)
const topoLoading = ref(false)

const stat = ref<DashboardStat>({
  req: 0,
  log: 0,
  inst: 0,
  error: 0,
})

const visContainer = ref<HTMLElement | null>(null)
let network: any = null

async function reload() {
  loading.value = true
  try {
    stat.value = await fetchDashboardStat({
      beginTime: timeRange.beginTime,
      endTime: timeRange.endTime,
    })
  } catch (e: any) {
    ElMessage.error(e?.message || '加载大盘数据失败')
  } finally {
    loading.value = false
  }
}

async function renderTopology() {
  topoLoading.value = true
  try {
    const data = await fetchGlobalTopology({
      beginTime: timeRange.beginTime,
      endTime: timeRange.endTime,
    })
    
    // Load vis-network dynamically to reduce bundle size
    const vis = await import('vis-network/standalone')
    
    if (visContainer.value) {
      if (network) {
        network.destroy()
      }
      
      const nodes = new vis.DataSet(data.nodes.map(n => ({
        ...n,
        shape: n.image ? 'image' : 'dot',
        image: n.image || undefined,
        size: n.image ? 25 : 15,
        font: { color: '#fff', size: 14 }
      })))
      
      const edges = new vis.DataSet(data.edges.map(e => ({
        ...e,
        arrows: 'to',
        font: { color: '#999', size: 12, align: 'horizontal' },
        color: { color: '#555', highlight: '#409EFF' },
        smooth: { type: 'continuous' }
      })))
      
      const options = {
        physics: {
          enabled: true,
          barnesHut: { gravitationalConstant: -3000, springLength: 150 },
        },
        interaction: { hover: true, tooltipDelay: 200 }
      }
      
      network = new vis.Network(visContainer.value, { nodes, edges }, options)
    }
  } catch (e: any) {
    // Ignore error or show silent error
  } finally {
    topoLoading.value = false
  }
}

onMounted(() => {
  reload()
  renderTopology()
})

watch(() => [timeRange.beginTime, timeRange.endTime], () => {
  reload()
  renderTopology()
})

onUnmounted(() => {
  if (network) network.destroy()
})
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div class="title">仪表盘</div>
      <el-button :loading="loading" type="primary" @click="reload">刷新</el-button>
    </div>

    <div class="grid">
      <el-card class="kpi" shadow="never" v-loading="loading">
        <div class="kpi-label">异常量</div>
        <div class="kpi-value text-danger">{{ stat.error }}</div>
      </el-card>
      <el-card class="kpi" shadow="never" v-loading="loading">
        <div class="kpi-label">实例数</div>
        <div class="kpi-value">{{ stat.inst }}</div>
      </el-card>
      <el-card class="kpi" shadow="never" v-loading="loading">
        <div class="kpi-label">请求量</div>
        <div class="kpi-value text-primary">{{ stat.req }}</div>
      </el-card>
      <el-card class="kpi" shadow="never" v-loading="loading">
        <div class="kpi-label">采集量</div>
        <div class="kpi-value">{{ stat.log }}</div>
      </el-card>
    </div>

    <el-card shadow="never" class="topology-card" v-loading="topoLoading">
      <template #header>
        <div class="card-header">
          <span>全局服务依赖拓扑</span>
        </div>
      </template>
      <div ref="visContainer" class="vis-container"></div>
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

.text-danger { color: var(--el-color-danger); }
.text-primary { color: var(--el-color-primary); }

.topology-card {
  height: 500px;
  display: flex;
  flex-direction: column;
}
.topology-card :deep(.el-card__body) {
  flex: 1;
  padding: 0;
}
.vis-container {
  width: 100%;
  height: 100%;
  min-height: 400px;
  background-color: #1e1e1e;
}
</style>

