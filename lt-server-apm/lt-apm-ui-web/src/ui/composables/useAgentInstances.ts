import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { http } from '../../api/http'
import { getMemoryHistory, type AgentMemoryMetrics } from '../../api/agent'

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

export function useAgentInstances() {
  const instances = ref<AgentInstance[]>([])
  const instancesLoading = ref(false)
  const alertedAgents = ref<string[]>([]) // 已告警的 Agent 列表

  // 统计数据
  const onlineCount = computed(() => instances.value.filter(i => i.online).length)
  const offlineCount = computed(() => instances.value.filter(i => !i.online).length)
  const alertedCount = computed(() => alertedAgents.value.length)

  const loadInstances = async () => {
    instancesLoading.value = true
    try {
      const response = await http.get('/api/agent/instances')
      instances.value = (response.data as any)?.result || []
      
      // 检查告警状态
      checkAlertedAgents()
    } catch (e: any) {
      ElMessage.error(e.message || '加载实例失败')
    } finally {
      instancesLoading.value = false
    }
  }

  const checkAlertedAgents = async () => {
    try {
      const response = await http.get('/api/alert/list', { params: { limit: 100 } })
      const alerts = (response.data as any)?.result || []
      // 提取活跃的 AGENT_OFFLINE 告警
      const activeAlerts = alerts.filter((a: any) => 
        a.alertType === 'AGENT_OFFLINE' && a.status === 'ACTIVE'
      )
      alertedAgents.value = activeAlerts.map((a: any) => a.app)
    } catch (e) {
      console.error('Failed to check alerted agents:', e)
    }
  }

  const isAlerted = (row: AgentInstance) => {
    return alertedAgents.value.includes(row.app) && !row.online
  }

  const formatTimestamp = (timestamp: number) => {
    if (!timestamp) return '-'
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return {
    instances,
    instancesLoading,
    alertedAgents,
    onlineCount,
    offlineCount,
    alertedCount,
    loadInstances,
    isAlerted,
    formatTimestamp
  }
}
