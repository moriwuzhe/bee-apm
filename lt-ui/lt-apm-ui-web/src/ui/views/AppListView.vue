<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

import PageShell from '../components/PageShell.vue'
import { useGroups } from '../composables/useGroups'
import { useTimeRangeStore } from '../../stores/timeRange'
import { fetchAppInfoList, type AppInfoRow } from '../../api/app'
import { http } from '../../api/http'

const timeRange = useTimeRangeStore()
const { envOptions, appOptions, loading: groupsLoading, reload: reloadGroups } = useGroups()
const router = useRouter()

const loading = ref(false)
const rows = ref<AppInfoRow[]>([])
const pageNum = ref(1)
const pageTotal = ref(0)

const configDialogVisible = ref(false)
const installDialogVisible = ref(false)
const configApp = ref('')
const configContent = ref('')
const configSaving = ref(false)

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

async function openConfig(row: any) {
  configApp.value = row.app
  configDialogVisible.value = true
  configContent.value = '加载中...'
  try {
    const res = await http.get(`/agent/config/pull?app=${row.app}&inst=${row.inst}`)
    configContent.value = res.data?.config || '# 暂无配置'
  } catch (e: any) {
    ElMessage.error(e?.message || '加载配置失败')
  }
}

async function saveConfig() {
  configSaving.value = true
  try {
    await http.post('/agent/config/update', {
      app: configApp.value,
      config: configContent.value
    })
    ElMessage.success('配置下发成功！Agent将在下一次心跳拉取。')
    configDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
  } finally {
    configSaving.value = false
  }
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
      <el-button type="success" @click="installDialogVisible = true">Agent 下载与安装</el-button>
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
            <el-button size="small" type="warning" plain @click="openConfig(row)">配置管理</el-button>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column prop="app" label="应用" width="160" />
      <el-table-column prop="inst" label="实例" width="160" />
      <el-table-column prop="ip" label="IP" width="160" />
      <el-table-column prop="env" label="环境" width="140" />
      <el-table-column label="在线状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'danger'" size="small">
            {{ row.online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
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

  <!-- Agent Config Dialog -->
  <el-dialog v-model="configDialogVisible" :title="`管理配置 - ${configApp}`" width="600px" append-to-body>
    <el-input
      v-model="configContent"
      type="textarea"
      :rows="12"
      placeholder="输入 YAML 配置内容"
      style="font-family: monospace;"
    />
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="configDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="configSaving" @click="saveConfig">下发配置</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- Install Guide Dialog -->
  <el-dialog v-model="installDialogVisible" title="Agent 下载与安装指引" width="650px" append-to-body>
    <div style="line-height: 1.6;">
      <p><b>方式一：一键自动安装 (推荐)</b></p>
      <p>在业务服务器上执行以下命令，即可自动下载并解压配置Agent：</p>
      <div style="background:#282c34;color:#abb2bf;padding:12px;border-radius:4px;font-family:monospace;margin:8px 0;word-break:break-all;">
        curl -sSL http://&lt;your-server-ip&gt;:8080/api/agent/install.sh | bash -s -- &lt;您的应用名&gt; http://&lt;your-server-ip&gt;:8080
      </div>
      <p style="margin-top:20px;"><b>方式二：手动下载安装</b></p>
      <p>1. <a href="/api/agent/download" target="_blank" style="color:#409EFF;text-decoration:none;">点击下载 lt-agent.zip 包</a></p>
      <p>2. 解压到业务服务器目录（例如 `/opt/lt-monitor/agent`）</p>
      <p>3. 修改 <code>config.yml</code>，填入您的 <code>app: 应用名</code> 和 <code>control.server.url: 服务端地址</code></p>
      
      <el-divider />
      <p><b>最后：修改应用启动参数</b></p>
      <p>无论哪种方式，安装完成后，都需要在您的 Java 应用启动脚本中添加以下参数并重启：</p>
      <div style="background:#282c34;color:#abb2bf;padding:12px;border-radius:4px;font-family:monospace;margin:8px 0;word-break:break-all;">
        -javaagent:/opt/lt-monitor/agent/lt-agent.jar -DltConfig=/opt/lt-monitor/agent
      </div>
    </div>
    <template #footer>
      <el-button type="primary" @click="installDialogVisible = false">知道了</el-button>
    </template>
  </el-dialog>
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

