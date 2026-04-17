<template>
  <div class="agent-container">
    <div class="page-head">
      <div class="title">Agent管理</div>
      <div class="controls">
        <el-button :loading="loading" type="primary" @click="loadData">刷新</el-button>
      </div>
    </div>

    <el-table :data="agents" border stripe v-loading="loading" style="width: 100%">
      <el-table-column prop="app" label="应用" width="150" />
      <el-table-column prop="inst" label="实例" width="150" />
      <el-table-column prop="ip" label="IP地址" width="130" />
      <el-table-column prop="version" label="Agent版本" width="110" />
      <el-table-column prop="configVersion" label="配置版本" width="100" />
      <el-table-column label="最后心跳" width="160">
        <template #default="{ row }">
          {{ formatTime(row.lastHeartbeatTime) }}
        </template>
      </el-table-column>
      <el-table-column prop="online" label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.online ? 'success' : 'danger'" size="small">
            {{ row.online ? '在线' : '离线' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right" align="center">
        <template #default="{ row }">
          <el-dropdown trigger="click" @command="(cmd: string) => handleCommand(cmd, row)">
            <el-button type="primary" link>
              操作 <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="config">应用配置</el-dropdown-item>
                <el-dropdown-item command="instanceConfig">实例配置</el-dropdown-item>
                <el-dropdown-item divided command="jvmInfo">JVM信息</el-dropdown-item>
                <el-dropdown-item command="memory">内存信息</el-dropdown-item>
                <el-dropdown-item command="threadDump">线程Dump</el-dropdown-item>
                <el-dropdown-item command="threadsSummary">线程概要</el-dropdown-item>
                <el-dropdown-item command="gcStats">GC统计</el-dropdown-item>
                <el-dropdown-item command="deadlocks">死锁检测</el-dropdown-item>
                <el-dropdown-item divided command="gc">执行GC</el-dropdown-item>
                <el-dropdown-item command="sysProps">系统属性</el-dropdown-item>
                <el-dropdown-item command="env">环境变量</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <!-- 配置管理对话框 -->
    <el-dialog v-model="showConfigDialog" :title="configDialogTitle" width="700px">
      <el-form :model="configForm" label-width="100px">
        <el-form-item label="应用">
          <span>{{ currentApp }}</span>
        </el-form-item>
        <el-form-item v-if="configMode === 'instance'" label="实例">
          <span>{{ currentInst }}</span>
        </el-form-item>
        <el-form-item label="配置内容">
          <el-input type="textarea" v-model="configForm.config" :rows="18" placeholder="请输入配置内容（YAML格式）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showConfigDialog = false">取消</el-button>
          <el-button type="primary" @click="submitConfig" :loading="submitting">确认更新</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 诊断结果对话框 -->
    <el-dialog v-model="showDiagDialog" :title="diagDialogTitle" width="900px">
      <div class="diag-content">
        <el-input
          v-model="diagResult"
          type="textarea"
          :rows="25"
          readonly
          placeholder="等待结果..."
        />
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="copyDiagResult">复制结果</el-button>
          <el-button type="primary" @click="showDiagDialog = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  fetchAgentInstances,
  updateAgentConfig,
  updateAgentInstanceConfig,
  agentThreadDump,
  agentJvmInfo,
  agentGc,
  agentMemory,
  agentGcStats,
  agentThreadsSummary,
  agentDeadlocks,
  agentSysProps,
  agentEnv,
  fetchAgentConnections,
  type AgentInstanceInfo
} from '../../api/agent'

const agents = ref<AgentInstanceInfo[]>([])
const loading = ref(false)
const submitting = ref(false)

// 配置对话框相关
const showConfigDialog = ref(false)
const configMode = ref<'app' | 'instance'>('app')
const currentApp = ref('')
const currentInst = ref('')
const configForm = ref({ config: '' })

// 诊断对话框相关
const showDiagDialog = ref(false)
const diagDialogTitle = ref('')
const diagResult = ref('')

const configDialogTitle = computed(() => 
  configMode.value === 'app' ? '应用配置管理' : '实例配置管理'
)

const formatTime = (timestamp: number) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const loadData = async () => {
  loading.value = true
  try {
    agents.value = await fetchAgentInstances()
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

const handleCommand = async (cmd: string, row: AgentInstanceInfo) => {
  // 构建简化的 agentId 用于匹配
  const simpleAgentId = `${row.app}@${row.inst}`
  
  // 从在线 Agent 列表中查找完整的 agentId
  let agentId = simpleAgentId
  try {
    const connections = await fetchAgentConnections()
    const matched = connections.find(conn => {
      // 尝试多种匹配方式
      return conn.agentId === simpleAgentId || 
             conn.agentId.startsWith(simpleAgentId + '@') ||
             conn.agentId.includes(`@${row.inst}@`)
    })
    if (matched) {
      agentId = matched.agentId
    }
  } catch (e) {
    console.warn('Failed to fetch agent connections, using simple agentId')
  }
  
  switch (cmd) {
    case 'config':
      configMode.value = 'app'
      currentApp.value = row.app
      currentInst.value = ''
      configForm.value.config = ''
      showConfigDialog.value = true
      break
      
    case 'instanceConfig':
      configMode.value = 'instance'
      currentApp.value = row.app
      currentInst.value = row.inst
      configForm.value.config = ''
      showConfigDialog.value = true
      break
      
    case 'jvmInfo':
      await executeDiag('JVM信息', () => agentJvmInfo(agentId))
      break
      
    case 'memory':
      await executeDiag('内存信息', () => agentMemory(agentId))
      break
      
    case 'threadDump':
      await executeDiag('线程Dump', () => agentThreadDump(agentId))
      break
      
    case 'threadsSummary':
      await executeDiag('线程概要', () => agentThreadsSummary(agentId))
      break
      
    case 'gcStats':
      await executeDiag('GC统计', () => agentGcStats(agentId))
      break
      
    case 'deadlocks':
      await executeDiag('死锁检测', () => agentDeadlocks(agentId))
      break
      
    case 'gc':
      await executeDiag('执行GC', () => agentGc(agentId))
      break
      
    case 'sysProps':
      await executeDiag('系统属性', () => agentSysProps(agentId))
      break
      
    case 'env':
      await executeDiag('环境变量', () => agentEnv(agentId))
      break
  }
}

const executeDiag = async (title: string, fn: () => Promise<string | undefined>) => {
  diagDialogTitle.value = title
  diagResult.value = '正在执行...'
  showDiagDialog.value = true
  
  try {
    const result = await fn()
    if (result === undefined || result === null) {
      diagResult.value = '返回数据为空'
    } else if (result === '') {
      diagResult.value = '返回空字符串'
    } else {
      diagResult.value = result
    }
  } catch (e: any) {
    const errorMsg = e.response?.data || e.message || '未知错误'
    diagResult.value = `执行失败: ${JSON.stringify(errorMsg, null, 2)}`
  }
}

const submitConfig = async () => {
  submitting.value = true
  try {
    if (configMode.value === 'app') {
      await updateAgentConfig({
        app: currentApp.value,
        config: configForm.value.config
      })
    } else {
      await updateAgentInstanceConfig({
        app: currentApp.value,
        inst: currentInst.value,
        config: configForm.value.config
      })
    }
    ElMessage.success('配置更新成功')
    showConfigDialog.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '配置更新失败')
  } finally {
    submitting.value = false
  }
}

const copyDiagResult = async () => {
  try {
    await navigator.clipboard.writeText(diagResult.value)
    ElMessage.success('已复制到剪贴板')
  } catch (e: any) {
    ElMessage.error('复制失败')
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.agent-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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

.diag-content {
  font-family: monospace;
}

.diag-content :deep(.el-textarea__inner) {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
}
</style>
