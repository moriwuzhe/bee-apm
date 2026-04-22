<template>
  <div class="agent-diag-view">
    <div class="page-head">
      <div class="title">
        <el-icon><Monitor /></el-icon>
        Agent 诊断分析
      </div>
      <div class="controls">
        <el-select v-model="selectedApp" placeholder="选择应用" filterable clearable @change="onAppChange" style="width: 200px;">
          <el-option v-for="app in appList" :key="app" :label="app" :value="app" />
        </el-select>
        <el-select v-model="selectedInst" placeholder="选择实例" filterable clearable @change="onInstChange" style="width: 200px;" :disabled="!selectedApp">
          <el-option v-for="inst in instList" :key="inst" :label="inst" :value="inst" />
        </el-select>
      </div>
    </div>

    <AgentDiagPanel 
      v-if="currentAgentInfo"
      :agent-info="currentAgentInfo"
      :enable-realtime-monitor="true"
      @refresh="handleRefresh"
    />
    
    <el-empty v-else description="请选择应用和实例进行诊断分析" :image-size="200" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Monitor } from '@element-plus/icons-vue'
import AgentDiagPanel from '../components/AgentDiagPanel.vue'
import { fetchAgentInstances, type AgentInstanceInfo } from '../../api/agent'

const route = useRoute()
const router = useRouter()

// 状态
const selectedApp = ref('')
const selectedInst = ref('')
const appList = ref<string[]>([])
const instList = ref<string[]>([])
const allAgents = ref<AgentInstanceInfo[]>([])

// 当前Agent信息
const currentAgentInfo = computed(() => {
  if (!selectedApp.value || !selectedInst.value) return null
  
  // 从真实Agent列表中查找IP和在线状态
  const agent = allAgents.value.find(a => a.app === selectedApp.value && a.inst === selectedInst.value)
  
  return {
    app: selectedApp.value,
    inst: selectedInst.value,
    ip: agent?.ip || '未知',
    online: agent?.online || false
  }
})

// 应用变更
const onAppChange = (app: string) => {
  console.log('[AgentDiagView] 应用变更:', app)
  selectedInst.value = ''
  
  // 根据应用获取实例列表
  const agentsForApp = allAgents.value.filter(a => a.app === app)
  instList.value = [...new Set(agentsForApp.map(a => a.inst))]
  console.log('[AgentDiagView] 实例列表:', instList.value)
}

// 实例变更
const onInstChange = (inst: string) => {
  console.log('[AgentDiagView] 实例变更:', inst)
  // 更新URL参数
  router.replace({
    query: {
      ...route.query,
      app: selectedApp.value,
      inst
    }
  })
}

// 刷新数据
const handleRefresh = (agentInfo: any) => {
  console.log('[AgentDiagView] 刷新Agent数据', agentInfo)
  ElMessage.success('数据已刷新')
}

// 加载Agent列表
const loadAgents = async () => {
  try {
    console.log('[AgentDiagView] 加载Agent列表...')
    allAgents.value = await fetchAgentInstances()
    
    // 提取唯一的应用列表
    appList.value = [...new Set(allAgents.value.map(a => a.app))]
    console.log('[AgentDiagView] 应用列表:', appList.value)
    console.log('[AgentDiagView] Agent总数:', allAgents.value.length)
  } catch (e: any) {
    console.error('[AgentDiagView] 加载Agent列表失败', e)
    ElMessage.error('加载Agent列表失败')
  }
}

// 初始化
onMounted(async () => {
  // 先加载Agent列表
  await loadAgents()
  
  // 从URL参数恢复选择
  const app = route.query.app as string
  const inst = route.query.inst as string
  
  if (app) {
    selectedApp.value = app
    onAppChange(app)
    if (inst) {
      selectedInst.value = inst
    }
  }
})
</script>

<style scoped>
.agent-diag-view {
  padding: 20px;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;
  font-weight: 600;
}

.controls {
  display: flex;
  gap: 12px;
}
</style>
