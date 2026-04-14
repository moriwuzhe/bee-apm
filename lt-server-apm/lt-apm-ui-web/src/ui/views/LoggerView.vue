<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import * as XLSX from 'xlsx'

import PageShell from '../components/PageShell.vue'
import { useGroups } from '../composables/useGroups'
import { useTimeRangeStore } from '../../stores/timeRange'
import { fetchLoggerList, type LoggerRow } from '../../api/logger'

const timeRange = useTimeRangeStore()
const { envOptions, appOptions, loading: groupsLoading, reload: reloadGroups } = useGroups()
const route = useRoute()
const appLocked = computed(() => Boolean((route.params as any)?.app))

const loading = ref(false)
const rows = ref<LoggerRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)
const autoRefreshEnabled = ref(true)
const autoRefreshInterval = ref(10000) // 10 seconds
let refreshTimer: any = null

const form = reactive({
  env: '',
  app: '',
  gid: '',
  ip: '',
  level: '',
})

function formatTime(v: string) {
  if (!v) return ''
  return v.length >= 19 ? v.substring(11, 19) : v
}

async function load(p = 1) {
  pageNum.value = p
  loading.value = true
  try {
    const data = await fetchLoggerList({
      env: form.env || undefined,
      app: form.app || undefined,
      gid: form.gid || undefined,
      ip: form.ip || undefined,
      'tags.level': form.level || undefined,
      pageNum: pageNum.value,
      beginTime: timeRange.beginTime,
      endTime: timeRange.endTime,
    })
    rows.value = Array.isArray(data.rows) ? data.rows : []
    pageNum.value = Number((data as any).pageNum || pageNum.value)
    pageTotal.value = Number((data as any).pageTotal || 0)
  } catch (e: any) {
    rows.value = []
    pageTotal.value = 0
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function applyRouteQuery() {
  const q: any = route.query || {}
  const pApp = (route.params as any)?.app
  if (pApp != null && String(pApp)) form.app = String(pApp)
  if (q.env != null) form.env = String(q.env || '')
  if (q.app != null) form.app = String(q.app || '')
  if (q.ip != null) form.ip = String(q.ip || '')
  if (q.gid != null) form.gid = String(q.gid || '')
}

const subtitle = computed(() => {
  if (!appLocked.value) return ''
  const parts: string[] = []
  if (form.env) parts.push(`env=${form.env}`)
  if (form.app) parts.push(`app=${form.app}`)
  if (form.ip) parts.push(`ip=${form.ip}`)
  return parts.join('  ')
})

function startAutoRefresh() {
  stopAutoRefresh()
  if (autoRefreshEnabled.value) {
    refreshTimer = setInterval(() => {
      load(1)
    }, autoRefreshInterval.value)
  }
}

function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

watch(autoRefreshEnabled, () => {
  startAutoRefresh()
})

watch(autoRefreshInterval, () => {
  startAutoRefresh()
})

onMounted(async () => {
  applyRouteQuery()
  await reloadGroups()
  await load(1)
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

watch(() => [timeRange.beginTime, timeRange.endTime], async () => {
  await reloadGroups()
  await load(1)
})

watch(() => route.query, async () => {
  applyRouteQuery()
  await load(1)
})

function tableRowClassName({ row }: { row: LoggerRow }) {
  if (row?.tags?.level === 'error' || row?.tags?.level === 'fatal') {
    return 'error-row'
  }
  if (row?.tags?.level === 'warm') {
    return 'warning-row'
  }
  return ''
}

function exportToExcel() {
  if (!rows.value || rows.value.length === 0) {
    ElMessage.warning('没有数据可导出')
    return
  }
  
  const data = rows.value.map(row => ({
    ID: row.id,
    时间: formatTime(row.time),
    GID: row.gid,
    IP: row.ip,
    环境: row.env,
    应用: row.app,
    级别: row?.tags?.level || '',
    拦截点: row?.tags?.point || '',
    日志: row?.tags?.log || ''
  }))
  
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '日志数据')
  XLSX.writeFile(wb, `日志数据_${new Date().toISOString().slice(0,10)}.xlsx`)
  ElMessage.success('导出成功')
}
</script>

<template>
  <PageShell title="Logger查询" :subtitle="subtitle || undefined">
    <template #actions>
      <div class="actions">
        <el-switch v-model="autoRefreshEnabled" active-text="自动刷新" inactive-text="自动刷新" />
        <el-select v-model="autoRefreshInterval" placeholder="刷新间隔" style="width: 120px" :disabled="!autoRefreshEnabled">
          <el-option label="5秒" :value="5000" />
          <el-option label="10秒" :value="10000" />
          <el-option label="30秒" :value="30000" />
          <el-option label="1分钟" :value="60000" />
        </el-select>
        <el-button :disabled="!rows?.length" type="success" @click="exportToExcel">导出Excel</el-button>
        <el-button :loading="loading || groupsLoading" type="primary" @click="load(1)">查询</el-button>
      </div>
    </template>

    <template #filters>
      <el-form label-width="64px">
        <div class="filters">
          <el-form-item v-if="!appLocked" label="环境">
            <el-select v-model="form.env" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in envOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
          <el-form-item v-if="!appLocked" label="应用">
            <el-select v-model="form.app" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in appOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="级别">
            <el-select v-model="form.level" placeholder="全部" clearable style="width: 160px" :teleported="false">
              <el-option label="trace" value="trace" />
              <el-option label="debug" value="debug" />
              <el-option label="info" value="info" />
              <el-option label="warm" value="warm" />
              <el-option label="error" value="error" />
              <el-option label="fatal" value="fatal" />
            </el-select>
          </el-form-item>
          <el-form-item label="gId">
            <el-input v-model="form.gid" placeholder="gid" clearable />
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="form.ip" placeholder="ip" clearable />
          </el-form-item>
        </div>
      </el-form>
    </template>

    <el-table :data="rows" border stripe v-loading="loading" :row-class-name="tableRowClassName">
      <el-table-column prop="id" label="ID" width="200" fixed />
      <el-table-column prop="time" label="时间" width="110" :formatter="(r:any)=>formatTime(r.time)" fixed />
      <el-table-column prop="gid" label="GID" width="200" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="env" label="环境" width="120" />
      <el-table-column prop="app" label="应用" width="140" />
      <el-table-column label="级别" width="110">
        <template #default="{ row }">
          <span :class="{ 'text-error': row?.tags?.level === 'error' || row?.tags?.level === 'fatal', 'text-warning': row?.tags?.level === 'warm' }">{{ row?.tags?.level || '' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="拦截点" width="260">
        <template #default="{ row }">
          {{ row?.tags?.point || '' }}
        </template>
      </el-table-column>
      <el-table-column label="日志" min-width="360">
        <template #default="{ row }">
          {{ row?.tags?.log || '' }}
        </template>
      </el-table-column>
    </el-table>

    <template #footer>
      <el-pagination
        background
        layout="prev, pager, next"
        :total="pageTotal"
        :current-page="pageNum"
        @current-change="(p:number) => load(p)"
      />
    </template>
  </PageShell>
</template>

<style scoped>
.filters{
  display:grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0 var(--space-3);
}

@media (max-width: 1200px){
  .filters{
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.actions{
  display:flex;
  align-items:center;
  gap: var(--space-3);
}

:deep(.error-row) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

:deep(.warning-row) {
  background-color: rgba(245, 158, 11, 0.1) !important;
}

.text-error {
  color: var(--el-color-danger);
  font-weight: bold;
}

.text-warning {
  color: var(--el-color-warning);
  font-weight: bold;
}
</style>

