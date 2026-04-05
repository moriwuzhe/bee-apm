<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import PageShell from '../components/PageShell.vue'
import { useGroups } from '../composables/useGroups'
import { useTimeRangeStore } from '../../stores/timeRange'
import { fetchAppInfoList, type AppInfoRow } from '../../api/app'

const timeRange = useTimeRangeStore()
const { envOptions, appOptions, loading: groupsLoading, reload: reloadGroups } = useGroups()

const loading = ref(false)
const rows = ref<AppInfoRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)

const form = reactive({
  env: '',
  app: '',
  ip: '',
})

function formatTime(v: string) {
  if (!v) return ''
  return v.length >= 19 ? v.substring(11, 19) : v
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

