import { http } from './http'

export type DashboardStat = {
  req: number
  log: number
  inst: number
  error: number
}

export type TopologyNode = {
  id: string
  label: string
  group: string
  image?: string
}

export type TopologyEdge = {
  from: string
  to: string
  times: number
  label?: string
}

export type TopologyData = {
  nodes: TopologyNode[]
  edges: TopologyEdge[]
}

export async function fetchDashboardStat(params: { beginTime: string; endTime: string }) {
  const res = await http.post<DashboardStat>('/dashboard/stat', params)
  return res.data
}

export async function fetchGlobalTopology(params: { beginTime: string; endTime: string }) {
  const res = await http.post<TopologyData>('/dashboard/topology', params)
  return res.data
}

