<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

import { fetchRequestList, type RequestRow } from '../../../api/request'
import { queryById } from '../../../api/common'
import { fetchCallTree, fetchTopology } from '../../../api/requestExtras'
import { useTimeRangeStore } from '../../../stores/timeRange'
import JsonDialog from '../../components/JsonDialog.vue'
import CallTreeDrawer from '../../components/CallTreeDrawer.vue'
import TopologyDrawer from '../../components/TopologyDrawer.vue'

const props = defineProps<{ env: string; app: string }>()

const timeRange = useTimeRangeStore()

const loading = ref(false)
const rows = ref<RequestRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)

const form = reactive({
  sort: 'time' as 'time' | 'spend' | '',
  entry: '',
  gid: '',
  ip: '',
})

const dialogOpen = ref(false)
const dialogTitle = ref('')
const dialogText = ref('')

const callTreeOpen = ref(false)
const callTreeLoading = ref(false)
const callTreeData = ref<any[]>([])

const topologyOpen = ref(false)
const topologyLoading = ref(false)
const topologyData = ref<any | null>(null)

function formatTime(v: string) {
  if (!v) return ''
  return v.length >= 19 ? v.substring(11, 19) : v
}

function formatJson(v: any) {
  if (v == null) return ''
  if (typeof v === 'string') return v
  try {
    return JSON.stringify(v, null, 2)
  } catch {
    return String(v)
  }
}

async function openQueryById(row: RequestRow, index: string, title: string) {
  dialogOpen.value = true
  dialogTitle.value = title
  dialogText.value = ''
  try {
    const result = await queryById({ id: row.id, index, beginTime: timeRange.beginTime, endTime: timeRange.endTime })
    const content = result && result.tags ? result.tags.body : result
    dialogText.value = formatJson(content)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '查询失败')
  }
}

async function openParamsByCallTreeNode(node: any) {
  const type = node && node.type ? String(node.type) : ''
  let index = 'bee-request-body'
  if (type === 'proc') index = 'bee-process-param'
  if (type === 'sql') index = 'bee-sql-param'

  dialogOpen.value = true
  dialogTitle.value = '参数'
  dialogText.value = ''

  try {
    const result = await queryById({ id: String(node.id || ''), index, beginTime: timeRange.beginTime, endTime: timeRange.endTime })
    let content: any = result
    if (result && result.tags) {
      if (index === 'bee-process-param') content = result.tags.param
      else if (index === 'bee-sql-param') content = result.tags.args
      else content = result.tags.body
    }
    dialogText.value = formatJson(content)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '查询失败')
  }
}

async function openCallTree(row: RequestRow) {
  callTreeOpen.value = true
  callTreeLoading.value = true
  callTreeData.value = []
  try {
    const result = await fetchCallTree({ gid: row.gid, time: row.time })
    callTreeData.value = Array.isArray(result) ? result : []
  } catch (e: any) {
    callTreeData.value = []
    ElMessage.error(e?.message || '查询失败')
  } finally {
    callTreeLoading.value = false
  }
}

async function openTopology(row: RequestRow) {
  topologyOpen.value = true
  topologyLoading.value = true
  topologyData.value = null
  try {
    const result = await fetchTopology({ gid: row.gid, time: row.time })
    topologyData.value = result
  } catch (e: any) {
    topologyData.value = null
    ElMessage.error(e?.message || '查询失败')
  } finally {
    topologyLoading.value = false
  }
}

async function load(p = 1) {
  pageNum.value = p
  loading.value = true
  try {
    const data = await fetchRequestList({
      env: props.env || undefined,
      app: props.app || undefined,
      sort: form.sort,
      entry: form.entry || undefined,
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
              <el-option label="耗时" value="spend" />
            </el-select>
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="form.entry" placeholder="全部" style="width: 140px" clearable :teleported="false">
              <el-option label="全部" value="" />
              <el-option label="入口请求" value="nvl" />
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
      <el-table-column prop="spend" label="耗时(ms)" width="110" />
      <el-table-column label="URL" min-width="260">
        <template #default="{ row }">
          {{ row?.tags?.url || '' }}
        </template>
      </el-table-column>
    <el-table-column label="操作" width="220" fixed="right" align="center">
      <template #default="{ row }">
        <el-button link type="primary" @click="openQueryById(row, 'bee-request-body', '入参')">入参</el-button>
        <el-button link type="primary" @click="openQueryById(row, 'bee-response-body', '回参')">回参</el-button>
        <el-button link type="primary" @click="openTopology(row)">拓扑</el-button>
        <el-button link type="primary" @click="openCallTree(row)">链路</el-button>
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

    <JsonDialog v-model="dialogOpen" :title="dialogTitle" :text="dialogText" />
    <CallTreeDrawer v-model="callTreeOpen" :loading="callTreeLoading" :data="callTreeData" :onParams="openParamsByCallTreeNode" />
    <TopologyDrawer v-model="topologyOpen" :loading="topologyLoading" :data="topologyData" />
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

