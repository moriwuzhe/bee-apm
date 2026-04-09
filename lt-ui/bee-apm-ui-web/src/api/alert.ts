import request from './request'

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

export function fetchAlerts(app?: string, limit: number = 100) {
  return request.get<AlertRow[]>('/api/alert/list', { params: { app, limit } })
}
