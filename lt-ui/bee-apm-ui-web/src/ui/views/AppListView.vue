<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import PageShell from '../components/PageShell.vue'
import { useGroups } from '../composables/useGroups'
import { useTimeRangeStore } from '../../stores/timeRange'
import { fetchAppInfoList, type AppInfoRow } from '../../api/app'

const timeRange = useTimeRangeStore()
const { envOptions, appOptions, loading: groupsLoading, reload: reloadGroups } = useGroups()
const router = useRouter()

const loading = ref(false)
const rows = ref<AppInfoRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)
let autoExpanded = false

const form = reactive({
  env: '',
  app: '',
  ip: '',
})

function formatTime(v: string) {
  if (!v) return ''
  return v.length >= 19 ? v.substring(11, 19) : v
}

function toAppQuery(row: any) {
  return {
    env: row?.env || undefined,
    ip: row?.ip || undefined,
    inst: row?.inst || undefined,
    port: row?.port || undefined,
  } as any
}

function toDiagQuery(row: any) {
  const app = row?.app || ''
  const env = row?.env || ''
  const inst = row?.inst || ''
  const ip = row?.ip || ''
  const port = row?.port ? String(row.port) : ''
  const agentId = port ? `${app}@${env}@${inst}@${ip}:${port}` : `${app}@${env}@${inst}@${ip}`
  return { ...toAppQuery(row), agentId }
}

function goRequest(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/request`, query: toAppQuery(row) })
}
function goMethod(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/method`, query: toAppQuery(row) })
}
function goSql(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/sql`, query: toAppQuery(row) })
}
function goTx(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/tx`, query: toAppQuery(row) })
}
function goLogger(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/logger`, query: toAppQuery(row) })
}
function goDiagnostic(row: any) {
  router.push({ path: `/apps/${encodeURIComponent(String(row?.app || ''))}/diagnostic`, query: toDiagQuery(row) })
}

async function load(p = 1) {
  pageNum.value = p
  loading.value = true
  try {
    const data = await fetchAppInfoList({
      env: form.env || undefined,
      app: form.app || undefined,
      ip: form.ip || undefined,
      pageNum: pageNum.value,
      beginTime: timeRange.beginTime,
      endTime: timeRange.endTime,
    })
    rows.value = Array.isArray(data.rows) ? data.rows : []
    pageNum.value = Number((data as any).pageNum || pageNum.value)
    pageTotal.value = Number((data as any).pageTotal || 0)
    if (!autoExpanded && rows.value.length === 0) {
      autoExpanded = true
      ElMessage.warning('未查询到应用数据，已切换到最近2小时')
      setTimeout(() => timeRange.setQuick(120), 0)
    }
  } catch (e: any) {
    rows.value = []
    pageTotal.value = 0
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await reloadGroups()
  await load(1)
})
watch(() => [timeRange.beginTime, timeRange.endTime], async () => {
  await reloadGroups()
  await load(1)
})
</script>

<template>
  <PageShell title="应用列表">
    <template #actions>
      <el-button :loading="loading || groupsLoading" type="primary" @click="load(1)">查询</el-button>
    </template>

    <template #filters>
      <el-form label-width="64px">
        <div class="filters">
          <el-form-item label="环境">
            <el-select v-model="form.env" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in envOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="应用">
            <el-select v-model="form.app" placeholder="全部" clearable filterable :teleported="false">
              <el-option v-for="o in appOptions" :key="String(o.value)" :label="o.name" :value="String(o.value)" />
            </el-select>
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="form.ip" placeholder="ip" clearable />
          </el-form-item>
        </div>
      </el-form>
    </template>

    <el-table :data="rows" border stripe v-loading="loading">
      <el-table-column type="expand">
        <template #default="{ row }">
          <el-space wrap>
            <el-button size="small" type="primary" plain @click="goRequest(row)">请求查询</el-button>
            <el-button size="small" type="primary" plain @click="goMethod(row)">方法查询</el-button>
            <el-button size="small" type="primary" plain @click="goSql(row)">SQL查询</el-button>
            <el-button size="small" type="primary" plain @click="goTx(row)">事务查询</el-button>
            <el-button size="small" type="primary" plain @click="goLogger(row)">Logger查询</el-button>
            <el-button size="small" type="primary" plain @click="goDiagnostic(row)">诊断</el-button>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column prop="app" label="应用" width="160" />
      <el-table-column prop="inst" label="实例" width="160" />
      <el-table-column prop="ip" label="IP" width="160" />
      <el-table-column prop="env" label="环境" width="140" />
      <el-table-column label="版本" width="160">
        <template #default="{ row }">
          {{ row?.tags?.version || '' }}
        </template>
      </el-table-column>
      <el-table-column prop="time" label="时间" width="110" :formatter="(r:any)=>formatTime(r.time)" />
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
</style>

