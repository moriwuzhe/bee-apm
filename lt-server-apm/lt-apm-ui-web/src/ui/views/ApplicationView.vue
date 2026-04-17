<template>
  <div class="application-container">
    <el-tabs v-model="activeTab" type="border-card">
      <!-- Tab 1: 应用定义 -->
      <el-tab-pane label="应用定义" name="definition">
        <div class="tab-content">
          <div class="page-head">
            <div class="title">应用定义管理</div>
            <div class="controls">
              <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
              <el-button type="primary" @click="showCreateDialog = true">新建应用</el-button>
            </div>
          </div>

          <el-table :data="applications" border stripe v-loading="loading" style="width: 100%">
            <el-table-column prop="appCode" label="应用编码" width="180" />
            <el-table-column prop="appName" label="应用名称" width="180" />
            <el-table-column prop="projectCode" label="所属项目编码" width="180" />
            <el-table-column prop="appType" label="应用类型" width="120">
              <template #default="{ row }">
                <el-tag :type="row.appType === 'agent-attached' ? 'primary' : 'info'">
                  {{ row.appType === 'agent-attached' ? 'Agent接入' : '自建' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="appSecretKey" label="应用密钥" width="280">
              <template #default="{ row }">
                <el-tag type="success">{{ row.appSecretKey }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" />
          </el-table>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 运行实例 -->
      <el-tab-pane label="运行实例" name="instances">
        <div class="instances-tab">
          <!-- 统计卡片 -->
          <div class="stats-cards">
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #67c23a;">
                  <el-icon><Connection /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ onlineCount }}</div>
                  <div class="stat-label">在线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #f56c6c;">
                  <el-icon><CircleClose /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ offlineCount }}</div>
                  <div class="stat-label">离线 Agent</div>
                </div>
              </div>
            </el-card>
            <el-card shadow="hover" class="stat-card">
              <div class="stat-content">
                <div class="stat-icon" style="background: #e6a23c;">
                  <el-icon><Bell /></el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ alertedCount }}</div>
                  <div class="stat-label">活跃告警</div>
                </div>
              </div>
            </el-card>
          </div>

          <div class="page-head">
            <div class="title">Agent 运行实例</div>
            <div class="controls">
              <el-button :loading="instancesLoading" type="primary" @click="loadInstances">刷新</el-button>
            </div>
          </div>

          <el-table :data="instances" border stripe v-loading="instancesLoading" style="width: 100%">
            <el-table-column prop="projectCode" label="项目" width="120" />
            <el-table-column prop="app" label="应用" width="150" />
            <el-table-column prop="inst" label="实例" width="120" />
            <el-table-column prop="ip" label="IP" width="140" />
            <el-table-column label="在线状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.online ? 'success' : 'danger'" size="small">
                  {{ row.online ? '在线' : '离线' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="告警状态" width="100">
              <template #default="{ row }">
                <el-tooltip v-if="isAlerted(row)" content="该 Agent 已触发离线告警" placement="top">
                  <el-badge is-dot type="danger" style="margin-right: 5px;">
                    <el-icon color="#f56c6c"><Bell /></el-icon>
                  </el-badge>
                </el-tooltip>
                <span v-else style="color: #909399;">-</span>
              </template>
            </el-table-column>
            <el-table-column label="最后心跳时间" width="180">
              <template #default="{ row }">
                {{ formatTimestamp(row.lastHeartbeatTime) }}
              </template>
            </el-table-column>
            <el-table-column prop="version" label="版本" width="120" />
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" type="primary" @click="showJvmInfo(row)">JVM</el-button>
                <el-button size="small" type="success" @click="showThreadDump(row)">线程</el-button>
                <el-button size="small" type="warning" @click="showMemory(row)">内存</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="800px" append-to-body>
      <el-input
        v-model="diagResult"
        type="textarea"
        :rows="20"
        readonly
        style="font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace; font-size: 12px; line-height: 1.5;"
      />
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDiagResult">复制</el-button>
          <el-button type="primary" @click="showDiagDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" title="新建应用" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="所属项目" prop="projectCode">
          <el-select v-model="form.projectCode" placeholder="请选择项目">
            <el-option v-for="p in projects" :key="p.projectCode" :label="p.projectName + ' (' + p.projectCode + ')'" :value="p.projectCode" />
          </el-select>
        </el-form-item>
        <el-form-item label="应用编码" prop="appCode">
          <el-input v-model="form.appCode" placeholder="如: order-service" />
        </el-form-item>
        <el-form-item label="应用名称" prop="appName">
          <el-input v-model="form.appName" placeholder="如: 订单服务" />
        </el-form-item>
        <el-form-item label="应用类型" prop="appType">
          <el-select v-model="form.appType" placeholder="请选择应用类型">
            <el-option label="自建" value="self-built" />
            <el-option label="Agent接入" value="agent-attached" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input type="textarea" v-model="form.description" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showCreateDialog = false">取消</el-button>
          <el-button type="primary" @click="submitCreate">确认</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Connection, CircleClose, Bell } from '@element-plus/icons-vue'
import { fetchApplications, createApplication, fetchProjects, type Application, type Project } from '../../api/project'
import { http } from '../../api/http'

const activeTab = ref('definition')
const applications = ref<Application[]>([])
const projects = ref<Project[]>([])
const loading = ref(false)
const showCreateDialog = ref(false)
const formRef = ref()
const form = ref({
  projectCode: '',
  appCode: '',
  appName: '',
  appType: 'self-built',
  description: '',
})

// 运行实例相关
interface AgentInstance {
  projectCode: string
  app: string
  inst: string
  ip: string
  version: string | null
  configVersion: string | null
  lastHeartbeatTime: number
  online: boolean
  secretKey: string | null
}

const instances = ref<AgentInstance[]>([])
const instancesLoading = ref(false)
const alertedAgents = ref<string[]>([]) // 已告警的 Agent 列表

// 诊断相关
const showDiagDialog = ref(false)
const diagDialogTitle = ref('')
const diagResult = ref('')

const loadInstances = async () => {
  instancesLoading.value = true
  try {
    const res = await http.get('/api/agent/instances')
    instances.value = (res.data as any)?.result || []
    
    // 同时加载告警状态
    await loadAlertedAgents()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    instancesLoading.value = false
  }
}

const loadAlertedAgents = async () => {
  try {
    const res = await http.get('/api/alert/list', { params: { limit: 100 } })
    const alerts = (res.data as any)?.result || []
    // 提取活跃的 AGENT_OFFLINE 告警
    const activeAlerts = alerts.filter((a: any) => 
      a.alertType === 'AGENT_OFFLINE' && a.status === 'ACTIVE'
    )
    alertedAgents.value = activeAlerts.map((a: any) => a.app)
  } catch (e: any) {
    console.error('Failed to load alerted agents:', e)
  }
}

// 计算属性
const onlineCount = computed(() => instances.value.filter(i => i.online).length)
const offlineCount = computed(() => instances.value.filter(i => !i.online).length)
const alertedCount = computed(() => alertedAgents.value.length)

// 判断 Agent 是否已告警
const isAlerted = (row: AgentInstance) => {
  return alertedAgents.value.includes(row.app) && !row.online
}

const formatTimestamp = (ts: number) => {
  if (!ts) return '-'
  const date = new Date(ts)
  return date.toLocaleString('zh-CN', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  })
}

// 构建完整的 agentId
const buildAgentId = (instance: AgentInstance) => {
  // 尝试从 Netty 连接列表中找到完整的 agentId
  return `${instance.app}@dev@${instance.inst}@${instance.ip}:8081`
}

// 执行诊断命令
const executeDiag = async (title: string, agentId: string, apiCall: (id: string) => Promise<any>) => {
  diagDialogTitle.value = title
  diagResult.value = '正在执行...'
  showDiagDialog.value = true
  
  try {
    const res = await apiCall(agentId)
    const result = (res.data as any)?.result || (res.data as any)?.data
    if (result === undefined || result === null) {
      diagResult.value = '返回数据为空'
    } else if (result === '') {
      diagResult.value = '返回空字符串'
    } else {
      diagResult.value = result
    }
  } catch (e: any) {
    const errorMsg = e.response?.data?.message || e.message || '未知错误'
    diagResult.value = `执行失败: ${errorMsg}`
  }
}

const showJvmInfo = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`JVM信息 - ${row.app}@${row.inst}`, agentId, 
    (id) => http.get('/api/diag/agent/jvmInfo', { params: { agentId: id } }))
}

const showThreadDump = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`线程Dump - ${row.app}@${row.inst}`, agentId,
    (id) => http.get('/api/diag/agent/threadDump', { params: { agentId: id } }))
}

const showMemory = async (row: AgentInstance) => {
  const agentId = buildAgentId(row)
  await executeDiag(`内存信息 - ${row.app}@${row.inst}`, agentId,
    (id) => http.get('/api/diag/agent/memory', { params: { agentId: id } }))
}

const copyDiagResult = async () => {
  try {
    await navigator.clipboard.writeText(diagResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e: any) {
    ElMessage.error('复制失败')
  }
}

const rules = {
  projectCode: [{ required: true, message: '请选择项目', trigger: 'change' }],
  appCode: [{ required: true, message: '请输入应用编码', trigger: 'blur' }],
  appName: [{ required: true, message: '请输入应用名称', trigger: 'blur' }],
}

const loadData = async () => {
  loading.value = true
  try {
    applications.value = await fetchApplications()
    projects.value = await fetchProjects()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const submitCreate = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (valid) {
      try {
        await createApplication(form.value)
        ElMessage.success('创建成功')
        showCreateDialog.value = false
        form.value = { projectCode: '', appCode: '', appName: '', appType: 'self-built', description: '' }
        loadData()
      } catch (e: any) {
        ElMessage.error(e.message || '创建失败')
      }
    }
  })
}

onMounted(() => {
  loadData()
  // 如果默认显示运行实例 Tab，则加载实例数据
  if (activeTab.value === 'instances') {
    loadInstances()
  }
})

// 监听 Tab 切换，加载对应数据
watch(activeTab, (newTab) => {
  if (newTab === 'instances' && instances.value.length === 0) {
    loadInstances()
  }
})
</script>

<style scoped>
.application-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  min-height: 600px;
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

.tab-content {
  padding: var(--space-4) 0;
}

.instances-tab {
  min-height: 500px;
}

/* 统计卡片样式 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.stat-card {
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--text);
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 13px;
  color: #909399;
}
</style>
