<script setup lang="ts">
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'

import PageShell from '../components/PageShell.vue'
import { enableJdwp, fetchAgentConnections, fetchClassLoading, fetchDeadlocks, fetchEnv, fetchGcStats, fetchInputArgs, fetchJvmInfo, fetchJdwpStatus, fetchMemory, fetchSysProps, fetchThreadDump, fetchThreadsSummary, fetchTopThreadsCpu, searchAgentConnections, triggerGc, watchAdd, watchClear, watchDump, watchList, type AgentConnection } from '../../api/diagnostic'

const loading = ref(false)
const rows = ref<AgentConnection[]>([])

const form = reactive({
  agentId: '',
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const dialogText = ref('')
const dialogLoading = ref(false)

const topCpuLimit = ref(10)
const topCpuRunnableOnly = ref(false)
const jdwpPort = ref(5005)
const watchClassName = ref('')
const watchMethodName = ref('')
const watchLimit = ref(50)
const watchId = ref('')
const watchMaxLines = ref(200)

let timer: any = null

async function load() {
  loading.value = true
  try {
    const data = form.agentId ? await searchAgentConnections(form.agentId) : await fetchAgentConnections()
    rows.value = Array.isArray(data) ? data : []
  } catch (e: any) {
    rows.value = []
    ElMessage.error(e?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function startAutoRefresh() {
  stopAutoRefresh()
  timer = setInterval(() => {
    if (!loading.value) load()
  }, 5000)
}

function stopAutoRefresh() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}

onMounted(async () => {
  await load()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

async function openThreadDump(row: AgentConnection) {
  dialogTitle.value = `线程栈 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchThreadDump(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取线程栈失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openJvmInfo(row: AgentConnection) {
  dialogTitle.value = `JVM信息 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchJvmInfo(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取JVM信息失败')
  } finally {
    dialogLoading.value = false
  }
}

async function doGc(row: AgentConnection) {
  try {
    await triggerGc(row.agentId)
    ElMessage.success('已触发GC')
  } catch (e: any) {
    ElMessage.error(e?.message || '触发GC失败')
  }
}

async function openSysProps(row: AgentConnection) {
  dialogTitle.value = `系统属性 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchSysProps(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取系统属性失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openEnv(row: AgentConnection) {
  dialogTitle.value = `环境变量 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchEnv(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取环境变量失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openInputArgs(row: AgentConnection) {
  dialogTitle.value = `启动参数 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchInputArgs(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取启动参数失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openClassLoading(row: AgentConnection) {
  dialogTitle.value = `类加载 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchClassLoading(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取类加载信息失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openMemory(row: AgentConnection) {
  dialogTitle.value = `内存 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchMemory(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取内存信息失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openGcStats(row: AgentConnection) {
  dialogTitle.value = `GC统计 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchGcStats(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取GC统计失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openThreadsSummary(row: AgentConnection) {
  dialogTitle.value = `线程概况 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchThreadsSummary(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取线程概况失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openDeadlocks(row: AgentConnection) {
  dialogTitle.value = `死锁检测 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchDeadlocks(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取死锁信息失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openTopThreadsCpu(row: AgentConnection) {
  dialogTitle.value = `CPU线程Top - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchTopThreadsCpu(row.agentId, topCpuLimit.value, topCpuRunnableOnly.value)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取CPU线程Top失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openJdwpEnable(row: AgentConnection) {
  dialogTitle.value = `JDWP - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await enableJdwp(row.agentId, jdwpPort.value)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '启用JDWP失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openJdwpStatus(row: AgentConnection) {
  dialogTitle.value = `JDWP状态 - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await fetchJdwpStatus(row.agentId, jdwpPort.value)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || '获取JDWP状态失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openWatchAdd(row: AgentConnection) {
  dialogTitle.value = `WatchAdd - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await watchAdd(row.agentId, watchClassName.value, watchMethodName.value, watchLimit.value)
    const m = dialogText.value.match(/id=([0-9a-fA-F]+)/)
    if (m && m[1]) watchId.value = m[1]
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || 'WatchAdd失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openWatchDump(row: AgentConnection) {
  dialogTitle.value = `WatchDump - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await watchDump(row.agentId, watchId.value, watchMaxLines.value)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || 'WatchDump失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openWatchList(row: AgentConnection) {
  dialogTitle.value = `WatchList - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await watchList(row.agentId)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || 'WatchList失败')
  } finally {
    dialogLoading.value = false
  }
}

async function openWatchClear(row: AgentConnection) {
  dialogTitle.value = `WatchClear - ${row.agentId}`
  dialogText.value = ''
  dialogVisible.value = true
  dialogLoading.value = true
  try {
    dialogText.value = await watchClear(row.agentId, watchId.value)
  } catch (e: any) {
    dialogText.value = ''
    ElMessage.error(e?.message || 'WatchClear失败')
  } finally {
    dialogLoading.value = false
  }
}
</script>

<template>
  <PageShell title="诊断">
    <template #actions>
      <el-button :loading="loading" type="primary" @click="load">刷新</el-button>
    </template>

    <template #filters>
      <el-form label-width="80px">
        <div class="filters">
          <el-form-item label="AgentId">
            <el-input v-model="form.agentId" placeholder="ip/标识（模糊匹配）" clearable @keyup.enter="load" />
          </el-form-item>
          <el-form-item>
            <el-button :loading="loading" @click="load">查询</el-button>
          </el-form-item>
          <el-form-item label="TopCPU">
            <el-select v-model="topCpuLimit" style="width: 120px">
              <el-option label="5" :value="5" />
              <el-option label="10" :value="10" />
              <el-option label="20" :value="20" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-checkbox v-model="topCpuRunnableOnly">仅RUNNABLE</el-checkbox>
          </el-form-item>
          <el-form-item label="JDWP端口">
            <el-input-number v-model="jdwpPort" :min="1" :max="65535" controls-position="right" />
          </el-form-item>
          <el-form-item label="Watch类">
            <el-input v-model="watchClassName" placeholder="com.foo.Bar" clearable style="width: 260px" />
          </el-form-item>
          <el-form-item label="Watch方法">
            <el-input v-model="watchMethodName" placeholder="methodName" clearable style="width: 180px" />
          </el-form-item>
          <el-form-item label="WLimit">
            <el-input-number v-model="watchLimit" :min="1" :max="500" controls-position="right" />
          </el-form-item>
          <el-form-item label="WatchId">
            <el-input v-model="watchId" placeholder="自动填充/手动输入" clearable style="width: 260px" />
          </el-form-item>
          <el-form-item label="WLines">
            <el-input-number v-model="watchMaxLines" :min="1" :max="2000" controls-position="right" />
          </el-form-item>
        </div>
      </el-form>
    </template>

    <el-table :data="rows" border stripe v-loading="loading">
      <el-table-column prop="agentId" label="AgentId" min-width="220" />
      <el-table-column prop="version" label="版本" width="120" />
      <el-table-column prop="active" label="在线" width="90">
        <template #default="{ row }">
          <el-tag :type="row.active ? 'success' : 'info'">{{ row.active ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="writable" label="可写" width="90">
        <template #default="{ row }">
          <el-tag :type="row.writable ? 'success' : 'warning'">{{ row.writable ? '是' : '否' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="980">
        <template #default="{ row }">
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openThreadDump(row)">线程栈</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openJvmInfo(row)">JVM</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="doGc(row)">GC</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openSysProps(row)">属性</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openEnv(row)">Env</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openInputArgs(row)">Args</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openClassLoading(row)">Class</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openMemory(row)">Mem</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openGcStats(row)">GCStat</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openThreadsSummary(row)">Threads</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openDeadlocks(row)">Deadlock</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openTopThreadsCpu(row)">TopCPU</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openJdwpEnable(row)">JDWP</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openJdwpStatus(row)">JDWP状态</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openWatchAdd(row)">WatchAdd</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openWatchDump(row)">WatchDump</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openWatchList(row)">WatchList</el-button>
          <el-button size="small" :disabled="!row.active || !row.writable" @click="openWatchClear(row)">WatchClear</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="900px">
      <el-input v-model="dialogText" type="textarea" :rows="24" readonly v-loading="dialogLoading" />
    </el-dialog>
  </PageShell>
</template>

<style scoped>
.filters{
  display:flex;
  align-items:flex-start;
  gap: var(--space-3);
  flex-wrap: wrap;
}
</style>
