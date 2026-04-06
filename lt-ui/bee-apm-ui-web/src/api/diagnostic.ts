import axios from 'axios'

export type ApiResult<T> = {
  code: string
  msg?: string
  result?: T
}

export type AgentConnection = {
  agentId: string
  version: number
  active: boolean
  writable: boolean
}

const diagHttp = axios.create({
  baseURL: (import.meta as any).env?.VITE_DIAG_API_BASE === undefined ? '/diag-api' : (import.meta as any).env?.VITE_DIAG_API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

function unwrap<T>(r: ApiResult<T>): T {
  if (!r) throw new Error('Empty response')
  if (String(r.code) !== '0') throw new Error(r.msg || '请求失败')
  return r.result as T
}

export async function fetchAgentConnections(): Promise<AgentConnection[]> {
  const res = await diagHttp.get<ApiResult<Record<string, AgentConnection>>>('/diag/agent/version/detail')
  const map = unwrap(res.data) || {}
  return Object.keys(map).map((k) => map[k])
}

export async function searchAgentConnections(agentId: string): Promise<AgentConnection[]> {
  const res = await diagHttp.get<ApiResult<Record<string, AgentConnection>>>('/diag/agent/version/search', { params: { agentId } })
  const map = unwrap(res.data) || {}
  return Object.keys(map).map((k) => map[k])
}

export async function fetchThreadDump(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/threadDump', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchJvmInfo(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/jvmInfo', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function triggerGc(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/gc', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchSysProps(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/sysProps', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchEnv(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/env', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchInputArgs(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/inputArgs', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchClassLoading(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/classLoading', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchMemory(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/memory', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchGcStats(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/gcStats', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchThreadsSummary(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/threadsSummary', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchDeadlocks(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/deadlocks', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function fetchTopThreadsCpu(agentId: string, limit = 10, runnableOnly = false): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/topThreadsCpu', { params: { agentId, limit, runnableOnly } })
  return unwrap(res.data) || ''
}

export async function enableJdwp(agentId: string, port = 5005): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/jdwpEnable', { params: { agentId, port } })
  return unwrap(res.data) || ''
}

export async function fetchJdwpStatus(agentId: string, port = 5005): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/jdwpStatus', { params: { agentId, port } })
  return unwrap(res.data) || ''
}

export async function watchAdd(agentId: string, className: string, methodName: string, paramTypes = '', limit = 50): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/watchAdd', { params: { agentId, className, methodName, paramTypes, limit } })
  return unwrap(res.data) || ''
}

export async function watchDump(agentId: string, id: string, maxLines = 200): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/watchDump', { params: { agentId, id, maxLines } })
  return unwrap(res.data) || ''
}

export async function watchClear(agentId: string, id: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/watchClear', { params: { agentId, id } })
  return unwrap(res.data) || ''
}

export async function watchList(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/watchList', { params: { agentId } })
  return unwrap(res.data) || ''
}

export async function debugAdd(agentId: string, className: string, methodName: string, when: string, paramTypes = '', limit = 20, stackDepth = 0, contains = ''): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/debugAdd', { params: { agentId, className, methodName, when, paramTypes, limit, stackDepth, contains } })
  return unwrap(res.data) || ''
}

export async function debugDump(agentId: string, id: string, maxLines = 200): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/debugDump', { params: { agentId, id, maxLines } })
  return unwrap(res.data) || ''
}

export async function debugClear(agentId: string, id: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/debugClear', { params: { agentId, id } })
  return unwrap(res.data) || ''
}

export async function debugList(agentId: string): Promise<string> {
  const res = await diagHttp.get<ApiResult<string>>('/diag/agent/debugList', { params: { agentId } })
  return unwrap(res.data) || ''
}

export type ReplaySnapshot = {
  url?: string
  method?: string
  ip?: string
  port?: string
  body?: string
  headers?: Record<string, string>
  params?: Record<string, any>
}

export type ReplayDebugRequest = {
  agentId: string
  requestId?: string
  targetBaseUrl?: string
  className: string
  methodName: string
  when: string
  paramTypes?: string
  limit?: number
  stackDepth?: number
  contains?: string
  dumpLines?: number
  waitMs?: number
  clearAfter?: boolean
  includeAuthHeaders?: boolean
  includeCookieHeaders?: boolean
  responseMaxChars?: number
  dryRun?: boolean
  lastEventOnly?: boolean
  snapshot?: ReplaySnapshot
}

export async function replayDebugOnce(payload: ReplayDebugRequest): Promise<string> {
  const res = await diagHttp.post<ApiResult<string>>('/diag/replay/debugOnce', payload)
  return unwrap(res.data) || ''
}
