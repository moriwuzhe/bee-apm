<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { fetchLoggerList, type LoggerRow } from '../../../api/logger'
import { useTimeRangeStore } from '../../../stores/timeRange'

const props = defineProps<{ env: string; app: string }>()

const timeRange = useTimeRangeStore()

const loading = ref(false)
const rows = ref<LoggerRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)

const form = reactive({
  sort: 'time' as 'time' | '',
  level: '',
  gid: '',
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
    const data = await fetchLoggerList({
      env: props.env || undefined,
      app: props.app || undefined,
      sort: form.sort,
      level: form.level || undefined,
      gid: form.gid || undefined,
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
  await load(1)
})
watch(() => [timeRange.beginTime, timeRange.endTime, props.env, props.app], async () => {
  await load(1)
})

defineExpose({ load })
</script>

<template>
  <div class="tab-content">
    <div class="tab-filters">
      <el-form label-width="64px">
        <div class="filters">
          <el-form-item label="排序">
            <el-select v-model="form.sort" placeholder="排序" style="width: 140px" :teleported="false">
              <el-option label="时间" value="time" />
            </el-select>
          </el-form-item>
          <el-form-item label="级别">
            <el-select v-model="form.level" placeholder="全部" style="width: 140px" clearable :teleported="false">
              <el-option label="全部" value="" />
              <el-option label="DEBUG" value="DEBUG" />
              <el-option label="INFO" value="INFO" />
              <el-option label="WARN" value="WARN" />
              <el-option label="ERROR" value="ERROR" />
            </el-select>
          </el-form-item>
          <el-form-item label="gId">
            <el-input v-model="form.gid" placeholder="gid" clearable @keyup.enter="load(1)" />
          </el-form-item>
          <el-form-item label="IP">
            <el-input v-model="form.ip" placeholder="ip" clearable @keyup.enter="load(1)" />
          </el-form-item>
          <el-form-item>
            <el-button :loading="loading" type="primary" @click="load(1)">查询</el-button>
          </el-form-item>
        </div>
      </el-form>
    </div>

    <el-table :data="rows" border stripe v-loading="loading">
      <el-table-column prop="id" label="ID" width="220" fixed />
      <el-table-column prop="time" label="时间" width="110" :formatter="(r:any)=>formatTime(r.time)" fixed />
      <el-table-column prop="gid" label="GID" width="200" />
      <el-table-column prop="ip" label="IP" width="140" />
      <el-table-column prop="env" label="环境" width="120" />
      <el-table-column prop="app" label="应用" width="140" />
      <el-table-column label="级别" width="90">
        <template #default="{ row }">
          <el-tag
            size="small"
            :type="row?.tags?.level === 'ERROR' ? 'danger' : row?.tags?.level === 'WARN' ? 'warning' : row?.tags?.level === 'DEBUG' ? 'info' : 'primary'"
          >
            {{ row?.tags?.level || '' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="日志内容" min-width="400">
        <template #default="{ row }">
          {{ row?.tags?.msg || '' }}
        </template>
      </el-table-column>
    </el-table>

    <div class="footer">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="pageTotal"
        :current-page="pageNum"
        @current-change="(p:number) => load(p)"
      />
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.filters{
  display:flex;
  flex-wrap: wrap;
  gap: 0 var(--space-3);
}
.footer{
  display:flex;
  justify-content:flex-end;
}
</style>

