import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAppConfig,
  getInstanceConfig,
  updateAgentConfig,
  updateAgentInstanceConfig,
  getFullConfigInfo,
  agentReadConfig,
  type AgentFullConfigInfo
} from '../../api/agent'

export function useConfigManagement() {
  // 对话框状态
  const showConfigDialog = ref(false)
  const configMode = ref<'app' | 'instance'>('app')
  const currentApp = ref('')
  const currentInst = ref('')
  
  // 配置内容
  const dbConfigContent = ref('')
  const agentRuntimeConfig = ref('')
  const fullConfigInfo = ref<AgentFullConfigInfo | null>(null)
  const submitting = ref(false)
  const configSourceTab = ref('database')
  
  // 折叠面板
  const activeCollapsePanels = ref<string[]>(['app', 'merged'])

  // 对话框标题
  const configDialogTitle = computed(() => {
    if (configMode.value === 'instance') {
      return `实例配置管理 - ${currentApp.value}@${currentInst.value}`
    }
    return `应用配置管理 - ${currentApp.value}`
  })

  // 打开配置对话框
  const openConfigDialog = async (app: string, inst?: string) => {
    currentApp.value = app
    currentInst.value = inst || ''
    configMode.value = inst ? 'instance' : 'app'
    showConfigDialog.value = true
    
    await loadConfigs()
  }

  // 加载配置
  const loadConfigs = async () => {
    try {
      // 加载数据库配置
      if (configMode.value === 'app') {
        const config = await getAppConfig(currentApp.value)
        dbConfigContent.value = config?.config || '# 无配置'
      } else {
        const config = await getInstanceConfig(currentApp.value, currentInst.value)
        dbConfigContent.value = config?.config || '# 无实例配置'
      }
      
      // 加载运行时配置
      try {
        const runtimeConfig = await agentReadConfig(`${currentApp.value}@${currentInst.value || 'default'}`)
        agentRuntimeConfig.value = runtimeConfig || '# 无法获取运行时配置'
      } catch (e) {
        console.warn('Failed to load runtime config:', e)
        agentRuntimeConfig.value = '# 无法获取运行时配置'
      }
      
      // 加载完整配置信息
      try {
        fullConfigInfo.value = await getFullConfigInfo(currentApp.value, currentInst.value || undefined)
      } catch (e) {
        console.warn('Failed to load full config info:', e)
      }
    } catch (e: any) {
      ElMessage.error(e.message || '加载配置失败')
    }
  }

  // 格式化配置内容
  const formatConfig = () => {
    if (!dbConfigContent.value.trim()) {
      ElMessage.warning('配置内容为空')
      return
    }
    
    try {
      const lines = dbConfigContent.value.split('\n')
      const formatted = lines.map(line => {
        if (line.trim() === '' || line.trim().startsWith('#')) {
          return line
        }
        return line
      }).join('\n')
      
      dbConfigContent.value = formatted
      ElMessage.success('配置已格式化')
    } catch (e) {
      ElMessage.error('格式化失败')
    }
  }

  // 清空配置内容
  const clearConfig = () => {
    ElMessageBox.confirm(
      '确定要清空配置内容吗？此操作不可恢复。',
      '清空确认',
      {
        confirmButtonText: '确定清空',
        cancelButtonText: '取消',
        type: 'warning',
      }
    ).then(() => {
      dbConfigContent.value = '# 配置已清空\n# 请重新输入配置内容'
      ElMessage.success('配置已清空')
    }).catch(() => {})
  }

  // 从运行时配置同步
  const syncFromRuntime = () => {
    if (agentRuntimeConfig.value) {
      dbConfigContent.value = agentRuntimeConfig.value
      configSourceTab.value = 'database'
      ElMessage.success('已从运行时配置同步')
    }
  }

  // 提交配置
  const submitConfig = async () => {
    submitting.value = true
    try {
      const configToSubmit = configSourceTab.value === 'database' ? dbConfigContent.value : agentRuntimeConfig.value
      
      if (configMode.value === 'app') {
        await updateAgentConfig({
          app: currentApp.value,
          config: configToSubmit
        })
      } else {
        await updateAgentInstanceConfig({
          app: currentApp.value,
          inst: currentInst.value,
          config: configToSubmit
        })
      }
      
      ElMessage.success('配置更新成功')
      showConfigDialog.value = false
    } catch (e: any) {
      ElMessage.error(e.message || '配置更新失败')
    } finally {
      submitting.value = false
    }
  }

  return {
    // 状态
    showConfigDialog,
    configMode,
    currentApp,
    currentInst,
    dbConfigContent,
    agentRuntimeConfig,
    fullConfigInfo,
    submitting,
    configSourceTab,
    activeCollapsePanels,
    
    // 计算属性
    configDialogTitle,
    
    // 方法
    openConfigDialog,
    loadConfigs,
    formatConfig,
    clearConfig,
    syncFromRuntime,
    submitConfig
  }
}
