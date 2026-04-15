import { http } from './http'

export interface AgentInstanceInfo {
  id: number
  projectCode?: string
  app: string
  inst: string
  ip: string
  version: string
  configVersion: string
  lastHeartbeatTime: number
  online: boolean
  secretKey?: string
}

export interface AgentHeartbeatResult {
  hasNewConfig: boolean
  newConfigVersion?: string
  hasNewPlugins?: boolean
  pluginLastUpdateTime?: number
}

export interface AgentPullConfigResult {
  config: string
  version: string
}

export interface AgentConfigUpdateRequest {
  app: string
  config: string
}

export async function fetchAgentInstances() {
  const res = await http.get<{ data: AgentInstanceInfo[] }>('/agent/instances')
  return res.data?.data || []
}

export async function updateAgentConfig(data: AgentConfigUpdateRequest) {
  const res = await http.post('/agent/config/update', data)
  return res.data
}

export async function pullAgentConfig(app: string) {
  const res = await http.get<{ data: AgentPullConfigResult }>('/agent/config/pull', { params: { app } })
  return res.data?.data
}
