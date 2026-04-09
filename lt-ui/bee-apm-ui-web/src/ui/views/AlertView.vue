<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageShell from '../components/PageShell.vue'
import { fetchAlerts, type AlertRow } from '../../api/alert'
import { fetchAppNames } from '../../api/request'
import { useRouter } from 'vue-router'

const router = useRouter()

const loading = ref(false)
const alerts = ref<AlertRow[]>([])
const apps = ref<string[]>([])
const query = reactive({
  app: '',
  limit: 100
})

async function loadApps() {
  try {
    apps.value = await fetchAppNames()
  } catch (e: any) {
    ElMessage.error(e.message || '加载应用列表失败')
  }
}

async function loadAlerts() {
  loading.value = true
  try {
    alerts.value = await fetchAlerts(query.app, query.limit)
  } catch (e: any) {
    ElMessage.error(e.message || '加载告警列表失败')
  } finally {
    loading.value = false
  }
}

function formatDate(ms: number) {
  if (!ms) return '-'
  const d = new Date(ms)
  return d.toLocaleString()
}

function goToTrace(gid: string) {
  if (gid) {
    router.push({ name: 'request', query: { gid } })
  }
}

onMounted(() => {
  loadApps()
  loadAlerts()
})
</script>

<template>
  <PageShell title="智能告警 (Alerting)">
    <el-card shadow="never" class="alert-card">
      <template #header>
        <div class="card-header">
          <span class="title">告警事件列表 (基于 AIOps 与规则引擎)</span>
          <el-form :inline="true" size="small" class="search-form">
            <el-form-item label="应用名">
              <el-select v-model="query.app" placeholder="选择应用" clearable style="width: 150px" @change="loadAlerts">
                <el-option v-for="app in apps" :key="app" :label="app" :value="app" />
              </el-select>
            </el-form-item>
            <el-form-item label="最近条数">
              <el-input-number v-model="query.limit" :min="10" :max="500" style="width: 100px" @change="loadAlerts" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" icon="Refresh" @click="loadAlerts" :loading="loading">刷新</el-button>
            </el-form-item>
          </el-form>
        </div>
      </template>

      <el-alert
        title="内置默认规则：过去 1 分钟内，只要发生 Error/Exception 或耗时超过 1000ms 的请求，都会触发实时告警。"
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 16px;"
      />

      <el-table :data="alerts" border stripe v-loading="loading" style="width: 100%" max-height="calc(100vh - 280px)">
        <el-table-column label="发生时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.time) }}
          </template>
        </el-table-column>
        <el-table-column prop="app" label="应用名" width="150" />
        <el-table-column prop="alertType" label="告警类型" width="180">
          <template #default="{ row }">
            <el-tag :type="row.alertType.includes('Error') ? 'danger' : 'warning'" effect="dark">
              {{ row.alertType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="url" label="故障接口/URL" min-width="200" show-overflow-tooltip />
        <el-table-column prop="message" label="告警详情" min-width="300" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'NEW' ? 'danger' : 'success'">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="goToTrace(row.gid)">查看全链路</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </PageShell>
</template>

<style scoped>
.alert-card {
  min-height: calc(100vh - 120px);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title {
  font-weight: bold;
  font-size: 16px;
}
.search-form {
  margin-bottom: 0;
}
</style>
