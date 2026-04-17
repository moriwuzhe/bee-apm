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

export interface AgentInstanceConfigUpdateRequest {
  app: string
  inst: string
  config: string
}

export interface AgentConnection {
  agentId: string
  app: string
  inst: string
  version: string
  ip: string
  connected: boolean
  lastActiveTime: number
}

export async function fetchAgentInstances() {
  const res = await http.get<{ data: AgentInstanceInfo[] }>('/agent/instances')
  return res.data?.data || []
}

export async function updateAgentConfig(data: AgentConfigUpdateRequest) {
  const res = await http.post('/agent/config/update', data)
  return res.data
}

export async function updateAgentInstanceConfig(data: AgentInstanceConfigUpdateRequest) {
  const res = await http.post('/agent/config/instance/update', data)
  return res.data
}

export async function getAppConfig(app: string) {
  const res = await http.get<{ data: string }>('/agent/config/get', { params: { app } })
  return res.data?.data || ''
}

export async function getInstanceConfig(app: string, inst: string) {
  const res = await http.get<{ data: string }>('/agent/config/instance/get', { params: { app, inst } })
  return res.data?.data || ''
}

export async function pullAgentConfig(app: string) {
  const res = await http.get<{ data: AgentPullConfigResult }>('/agent/config/pull', { params: { app } })
  return res.data?.data
}

// Agent diagnostic APIs
export async function fetchAgentConnections() {
  const res = await http.get<{ data: AgentConnection[] }>('/diag/agent/version/detail')
  return res.data?.data || []
}

export async function agentThreadDump(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/threadDump', { params: { agentId } })
  return res.data?.data
}

export async function agentJvmInfo(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/jvmInfo', { params: { agentId } })
  return res.data?.data
}

export async function agentGc(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/gc', { params: { agentId } })
  return res.data?.data
}

export async function agentMemory(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/memory', { params: { agentId } })
  return res.data?.data
}

export async function agentGcStats(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/gcStats', { params: { agentId } })
  return res.data?.data
}

export async function agentThreadsSummary(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/threadsSummary', { params: { agentId } })
  return res.data?.data
}

export async function agentDeadlocks(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/deadlocks', { params: { agentId } })
  return res.data?.data
}

export async function agentSysProps(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/sysProps', { params: { agentId } })
  return res.data?.data
}

export async function agentEnv(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/env', { params: { agentId } })
  return res.data?.data
}

export async function agentStartProfiler(agentId: string, event: string = 'cpu', duration: number = 30) {
  const res = await http.get<{ data: string }>('/diag/agent/startProfiler', { params: { agentId, event, duration } })
  return res.data?.data
}

export async function agentStopProfiler(agentId: string) {
  const res = await http.get<{ data: string }>('/diag/agent/stopProfiler', { params: { agentId } })
  return res.data?.data
}
