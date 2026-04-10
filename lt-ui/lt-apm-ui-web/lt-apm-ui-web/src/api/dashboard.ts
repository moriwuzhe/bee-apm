import { http } from './http'

export type DashboardStat = {
  req: number
  log: number
  inst: number
  error: number
}

export async function fetchDashboardStat(params: { beginTime: string; endTime: string }) {
  const res = await http.post<DashboardStat>('/dashboard/stat', params)
  return res.data
}

