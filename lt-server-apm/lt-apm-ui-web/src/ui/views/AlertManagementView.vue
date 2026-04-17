<template>
  <div class="alert-management-container">
    <div class="page-head">
      <div class="title">告警管理</div>
      <div class="controls">
        <el-select v-model="filterApp" placeholder="选择应用" clearable style="width: 150px" @change="loadAlerts">
          <el-option label="全部" value="" />
          <el-option v-for="app in appList" :key="app" :label="app" :value="app" />
        </el-select>
        <el-select v-model="filterType" placeholder="告警类型" clearable style="width: 150px" @change="loadAlerts">
          <el-option label="全部" value="" />
          <el-option label="Agent离线" value="AGENT_OFFLINE" />
          <el-option label="Agent恢复" value="AGENT_RECOVERY" />
        </el-select>
        <el-button :loading="loading" type="primary" @click="loadAlerts">刷新</el-button>
        <el-switch v-model="autoRefreshEnabled" active-text="自动刷新" inactive-text="自动刷新" style="margin-left: 10px" />
      </div>
    </div>

    <el-table :data="alerts" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="alertType" label="类型" width="120">
        <template #default="{ row }">
          <el-tag :type="getAlertTypeColor(row.alertType)" size="small">
            {{ getAlertTypeName(row.alertType) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="app" label="应用" width="150" />
      <el-table-column label="消息" min-width="300">
        <template #default="{ row }">
          <span style="font-size: 13px;">{{ row.message }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'danger' : 'success'" size="small">
            {{ row.status === 'ACTIVE' ? '活跃' : '已解决' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="时间" width="180">
        <template #default="{ row }">
          {{ formatTime(row.time) }}
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-container" v-if="alerts.length > 0">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="total"
        :current-page="currentPage"
        :page-size="pageSize"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '../../api/http'

interface Alert {
  id: string
  time: number
  app: string
  alertType: string
  message: string
  status: string
}

const alerts = ref<Alert[]>([])
const loading = ref(false)
const appList = ref<string[]>([])
const filterApp = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(50)
const total = ref(0)
const autoRefreshEnabled = ref(true)
let refreshTimer: any = null

const loadAlerts = async () => {
  loading.value = true
  try {
    const params: any = { limit: pageSize.value }
    if (filterApp.value) {
      params.app = filterApp.value
    }
    
    const res = await http.get('/api/alert/list', { params })
    const result = (res.data as any)?.result || []
    
    // 过滤告警类型
    let filtered = result
    if (filterType.value) {
      filtered = result.filter((a: Alert) => a.alertType === filterType.value)
    }
    
    alerts.value = filtered
    total.value = filtered.length
    
    // 提取应用列表
    const apps = new Set<string>()
    result.forEach((a: Alert) => {
      if (a.app) apps.add(a.app)
    })
    appList.value = Array.from(apps).sort()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  currentPage.value = page
  loadAlerts()
}

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
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

const getAlertTypeName = (type: string) => {
  const names: Record<string, string> = {
    'AGENT_OFFLINE': 'Agent离线',
    'AGENT_RECOVERY': 'Agent恢复'
  }
  return names[type] || type
}

const getAlertTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    'AGENT_OFFLINE': 'danger',
    'AGENT_RECOVERY': 'success'
  }
  return colors[type] || 'info'
}

const startAutoRefresh = () => {
  stopAutoRefresh()
  if (autoRefreshEnabled.value) {
    refreshTimer = setInterval(() => {
      loadAlerts()
    }, 30000) // 30秒刷新一次
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(autoRefreshEnabled, () => {
  startAutoRefresh()
})

onMounted(() => {
  loadAlerts()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})
</script>

<style scoped>
.alert-management-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
}

.page-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text);
}

.controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: var(--space-4);
}
</style>
