<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import PageShell from '../components/PageShell.vue'
import { fetchRequestList, type RequestRow, type RequestQuery } from '../../api/request'
import { fetchAgentConnections, replayDebugOnce, type AgentConnection } from '../../api/diagnostic'

const loadingRequests = ref(false)
const requests = ref<RequestRow[]>([])
const requestQuery = reactive<RequestQuery>({
  app: '',
  env: '',
  pageNum: 1,
  beginTime: new Date(Date.now() - 3600000).toISOString().slice(0, 19).replace('T', ' '),
  endTime: new Date().toISOString().slice(0, 19).replace('T', ' ')
})

const agents = ref<AgentConnection[]>([])
const loadingAgents = ref(false)

const selectedRequest = ref<RequestRow | null>(null)
const debugForm = reactive({
  targetAgentId: '',
  className: '',
  methodName: '',
  when: 'ENTER',
  paramTypes: '',
  contains: '',
  stackDepth: 8,
  limit: 20
})

const activeStep = ref(0)
const debugResult = ref('')
const debugRunning = ref(false)

async function loadRequests() {
  loadingRequests.value = true
  try {
    const res = await fetchRequestList(requestQuery)
    requests.value = res.rows || []
  } catch (e: any) {
    ElMessage.error(e.message || '加载请求列表失败')
  } finally {
    loadingRequests.value = false
  }
}

async function loadAgents() {
  loadingAgents.value = true
  try {
    agents.value = await fetchAgentConnections()
  } catch (e: any) {
    ElMessage.error(e.message || '加载节点列表失败')
  } finally {
    loadingAgents.value = false
  }
}

function selectRequest(row: RequestRow) {
  selectedRequest.value = row
}

async function startDebug() {
  if (!selectedRequest.value) {
    ElMessage.warning('请先从左侧选择一条流量')
    return
  }
  if (!debugForm.targetAgentId) {
    ElMessage.warning('请选择目标隔离节点')
    return
  }
  if (!debugForm.className || !debugForm.methodName) {
    ElMessage.warning('请填写类名和方法名')
    return
  }

  const agent = agents.value.find(a => a.agentId === debugForm.targetAgentId)
  if (!agent) return
  
  // Parse target IP and port from agentId (format: app@env@inst@ip:port)
  const parts = agent.agentId.split('@')
  const ipPort = parts[parts.length - 1]
  const targetBaseUrl = `http://${ipPort}`

  debugRunning.value = true
  debugResult.value = ''
  activeStep.value = 1 // 下发探针

  try {
    // 模拟进度流转
    setTimeout(() => { if (activeStep.value === 1) activeStep.value = 2 }, 1000)
    setTimeout(() => { if (activeStep.value === 2) activeStep.value = 3 }, 2000)

    const res = await replayDebugOnce({
      agentId: agent.agentId,
      requestId: selectedRequest.value.id,
      targetBaseUrl: targetBaseUrl,
      className: debugForm.className,
      methodName: debugForm.methodName,
      when: debugForm.when,
      paramTypes: debugForm.paramTypes,
      contains: debugForm.contains,
      stackDepth: debugForm.stackDepth,
      limit: debugForm.limit,
      waitMs: 5000,
      clearAfter: true,
      lastEventOnly: true
    })
    
    activeStep.value = 4 // 完成
    debugResult.value = res
    ElMessage.success('回放并抓取快照成功')
  } catch (e: any) {
    activeStep.value = 0
    ElMessage.error(e.message || '线上调试失败')
    debugResult.value = e.message || 'Error'
  } finally {
    debugRunning.value = false
  }
}

onMounted(() => {
  loadRequests()
  loadAgents()
})
</script>

<template>
  <PageShell title="线上调试工作台">
    <div class="debug-container">
      <!-- 左侧：流量录制列表 -->
      <div class="left-panel">
        <div class="panel-header">录制的请求流量</div>
        <el-form :inline="true" size="small" class="search-form">
          <el-form-item label="App">
            <el-input v-model="requestQuery.app" placeholder="应用名" clearable style="width: 100px" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="loadRequests" :loading="loadingRequests">查询</el-button>
          </el-form-item>
        </el-form>
        <el-table :data="requests" border stripe size="small" highlight-current-row @row-click="selectRequest" v-loading="loadingRequests" height="calc(100vh - 220px)">
          <el-table-column prop="time" label="时间" width="140" show-overflow-tooltip />
          <el-table-column prop="tags.url" label="接口" min-width="120" show-overflow-tooltip />
          <el-table-column prop="spend" label="耗时(ms)" width="80" />
        </el-table>
      </div>

      <!-- 右侧：调试配置与结果 -->
      <div class="right-panel">
        <el-card shadow="never" class="config-card">
          <template #header>
            <div class="card-header">
              <span>调试配置</span>
              <el-tag type="info" v-if="selectedRequest">已选请求: {{ selectedRequest.id }}</el-tag>
              <el-tag type="danger" v-else>未选择请求</el-tag>
            </div>
          </template>
          <el-form label-width="100px" size="small">
            <el-row :gutter="20">
              <el-col :span="24">
                <el-form-item label="目标节点" required>
                  <el-select v-model="debugForm.targetAgentId" placeholder="选择回放的隔离节点 (避免选择生产核心节点)" style="width: 100%">
                    <el-option v-for="a in agents" :key="a.agentId" :label="a.agentId + (a.active ? ' (在线)' : ' (离线)')" :value="a.agentId" :disabled="!a.active || !a.writable" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item label="目标类名" required>
                  <el-input v-model="debugForm.className" placeholder="如: com.example.Service" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="目标方法" required>
                  <el-input v-model="debugForm.methodName" placeholder="如: getUser" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="观测时机">
                  <el-select v-model="debugForm.when" style="width: 100%">
                    <el-option label="方法进入 (ENTER)" value="ENTER" />
                    <el-option label="方法返回 (EXIT)" value="EXIT" />
                    <el-option label="抛出异常 (THROW)" value="THROW" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="参数类型">
                  <el-input v-model="debugForm.paramTypes" placeholder="可选, 如: java.lang.String" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="堆栈深度">
                  <el-input-number v-model="debugForm.stackDepth" :min="0" :max="50" style="width: 100%" />
                </el-form-item>
              </el-col>
            </el-row>
            <div style="text-align: right; margin-top: 10px;">
              <el-button type="primary" @click="startDebug" :loading="debugRunning" icon="VideoPlay">一键回放并抓取</el-button>
            </div>
          </el-form>
        </el-card>

        <!-- 进度条 -->
        <el-card shadow="never" class="step-card" v-if="activeStep > 0">
          <el-steps :active="activeStep" finish-status="success" align-center>
            <el-step title="下发调试探针" description="动态注入字节码" />
            <el-step title="发起回放流量" description="定向发送至隔离节点" />
            <el-step title="抓取变量快照" description="等待事件触发并收集" />
            <el-step title="清理探针" description="恢复节点原始状态" />
          </el-steps>
        </el-card>

        <!-- 结果展示 -->
        <el-card shadow="never" class="result-card" v-if="debugResult || debugRunning">
          <template #header>
            <div class="card-header">
              <span>调试结果 (快照 & 调用栈)</span>
              <el-button v-if="debugResult" size="small" type="primary" link @click="$router.push({ name: 'logger', query: { gid: selectedRequest?.gid } })">查看关联日志</el-button>
            </div>
          </template>
          <div class="code-viewer" v-loading="debugRunning" element-loading-text="正在等待流量回放与快照抓取...">
            <pre v-if="debugResult">{{ debugResult }}</pre>
            <div v-else class="empty-text">等待结果返回...</div>
          </div>
        </el-card>
      </div>
    </div>
  </PageShell>
</template>

<style scoped>
.debug-container {
  display: flex;
  gap: 16px;
  height: 100%;
}
.left-panel {
  width: 350px;
  border-right: 1px solid var(--el-border-color-light);
  padding-right: 16px;
  display: flex;
  flex-direction: column;
}
.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}
.panel-header {
  font-weight: bold;
  margin-bottom: 12px;
  font-size: 15px;
}
.search-form {
  margin-bottom: 10px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.code-viewer {
  background-color: #1e1e1e;
  color: #d4d4d4;
  padding: 16px;
  border-radius: 4px;
  overflow: auto;
  min-height: 200px;
  max-height: 400px;
  font-family: Consolas, Monaco, monospace;
  font-size: 13px;
  line-height: 1.5;
}
.empty-text {
  color: #888;
  text-align: center;
  margin-top: 80px;
}
</style>
