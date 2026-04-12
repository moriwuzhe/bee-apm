import { http } from './http'

export interface AlertRow {
  id: string
  time: number
  app: string
  url: string
  gid: string
  alertType: string
  message: string
  status: string
}

export async function fetchAlerts(app?: string, limit: number = 100) {
  const res = await http.get<{ result: AlertRow[] }>('/alert/list', { params: { app, limit } })
  return res.data && res.data.result ? res.data.result : []
}
