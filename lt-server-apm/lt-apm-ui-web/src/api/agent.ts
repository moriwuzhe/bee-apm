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
  const res = await http.get<{ data: AgentInstanceInfo[] }>('/api/agent/instances')
  return res.data?.data || []
}

export async function updateAgentConfig(data: AgentConfigUpdateRequest) {
  const res = await http.post('/api/agent/config/update', data)
  return res.data
}

export async function updateAgentInstanceConfig(data: AgentInstanceConfigUpdateRequest) {
  const res = await http.post('/api/agent/config/instance/update', data)
  return res.data
}

export async function getAppConfig(app: string) {
  const res = await http.get<{ data: string }>('/api/agent/config/get', { params: { app } })
  return res.data?.data || ''
}

export async function getInstanceConfig(app: string, inst: string) {
  const res = await http.get<{ data: string }>('/api/agent/config/instance/get', { params: { app, inst } })
  return res.data?.data || ''
}

export async function pullAgentConfig(app: string) {
  const res = await http.get<{ data: AgentPullConfigResult }>('/api/agent/config/pull', { params: { app } })
  return res.data?.data
}

export interface AgentFullConfigInfo {
  app: string
  inst?: string
  appConfig: string
  appConfigVersion: string
  instanceConfig: string
  instanceConfigVersion: string
  mergedConfig: string
  finalVersion: string
}

export async function getFullConfigInfo(app: string, inst?: string) {
  const params: any = { app }
  if (inst) params.inst = inst
  const res = await http.get<{ data: AgentFullConfigInfo }>('/api/agent/config/full', { params })
  return res.data?.data
}

// Agent diagnostic APIs
export async function fetchAgentConnections() {
  const res = await http.get<{ data: AgentConnection[] }>('/api/diag/agent/version/detail')
  return res.data?.data || []
}

export async function agentThreadDump(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/threadDump', { params: { agentId } })
  return res.data?.data
}

export async function agentJvmInfo(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/jvmInfo', { params: { agentId } })
  return res.data?.data
}

export async function agentGc(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/gc', { params: { agentId } })
  return res.data?.data
}

export async function agentMemory(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/memory', { params: { agentId } })
  return res.data?.data
}

export async function agentGcStats(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/gcStats', { params: { agentId } })
  return res.data?.data
}

export async function agentThreadsSummary(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/threadsSummary', { params: { agentId } })
  return res.data?.data
}

export async function agentDeadlocks(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/deadlocks', { params: { agentId } })
  return res.data?.data
}

export async function agentSysProps(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/sysProps', { params: { agentId } })
  return res.data?.data
}

export async function agentEnv(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/env', { params: { agentId } })
  return res.data?.data
}

export async function agentReadConfig(agentId: string) {
  const res = await http.get<{ data: string }>('/api/diag/agent/readConfig', { params: { agentId } })
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

// Memory history APIs
export interface AgentMemoryMetrics {
  appCode: string
  instId: string
  collectTime: number
  heapUsed: number
  heapCommitted: number
  heapMax: number
  nonHeapUsed: number
  nonHeapCommitted: number
  nonHeapMax: number
  threadCount: number
  peakThreadCount?: number
  daemonThreadCount?: number
  loadedClassCount: number
  totalLoadedClassCount?: number
  unloadedClassCount?: number
  classLoadingRate?: number
  gcCount: number
  gcTimeMs: number
  minorGcCount?: number
  minorGcTimeMs?: number
  fullGcCount?: number
  fullGcTimeMs?: number
  processCpuLoad?: number
  systemCpuLoad?: number
  memoryPools?: string // JSON string
  threadStates?: string // JSON string
  jvmStartTime?: number
  topCpuThreads?: string // Phase 2: JSON string - Top CPU线程列表
  threadPools?: string // Phase 2: JSON string - 线程池信息
  gcSnapshot?: string // Phase 2: JSON string - GC快照数据
  diskReadBytes?: number // Phase 3: IO & Network metrics
  diskWriteBytes?: number
  networkRecvBytes?: number
  networkSentBytes?: number
  diskReadOps?: number
  diskWriteOps?: number
  // Phase 4: Memory Pools Detail
  edenUsed?: number
  edenMax?: number
  survivorUsed?: number
  survivorMax?: number
  oldGenUsed?: number
  oldGenMax?: number
  metaspaceUsed?: number
  metaspaceMax?: number
  codeCacheUsed?: number
  codeCacheMax?: number
  // Phase 4: GC Efficiency
  gcReclaimedBytes?: number
  gcEfficiency?: number
  // Phase 5: Advanced Monitoring
  memoryAllocationRate?: number
  gcReclaimedLastInterval?: number
  gcPressure?: number
  // Phase 6: Comprehensive Monitoring
  gcReclaimedBytesCurrent?: number
  cpuMemoryCorrelation?: number
  // Phase 7: Real-time Dashboard
  topCpuThreadName?: string
  topCpuThreadPercent?: number
  threadCountRunnable?: number
  threadCountBlocked?: number
  // Phase 8: Performance Dashboard
  performanceScore?: number
  healthStatus?: string
}

export async function getMemoryHistory(
  app: string,
  inst: string,
  startTime?: number,
  endTime?: number,
  limit: number = 100
) {
  const params: any = { app, inst, limit }
  if (startTime) params.startTime = startTime
  if (endTime) params.endTime = endTime
  const res = await http.get<{ data: AgentMemoryMetrics[] }>('/api/agent/memory/history', { params })
  return res.data?.data || []
}

// Plugin assignment APIs
export interface AgentPluginConfig {
  pluginCode: string
  pluginName: string
  enabled: boolean
  version?: string
}

export async function getAgentPluginConfig(app: string, inst: string) {
  const res = await http.get<{ data: AgentPluginConfig[] }>('/api/agent/plugin/config', { params: { app, inst } })
  return res.data?.data || []
}

export async function updateAgentPluginConfig(app: string, inst: string, plugins: AgentPluginConfig[]) {
  const res = await http.post('/api/agent/plugin/config/update', { app, inst, plugins })
  return res.data
}
