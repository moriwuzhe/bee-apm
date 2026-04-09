import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type AppInfoRow = {
  app: string
  inst: string
  ip: string
  env: string
  time: string
  tags?: { version?: string }
}

export type AppInfoQuery = {
  env?: string
  app?: string
  ip?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchAppInfoList(params: AppInfoQuery) {
  const res = await http.post<PageResult<AppInfoRow>>('/app/info/list', params)
  return res.data
}

export type SeedAllRequest = {
  hours?: number
  apps?: number
  instPerApp?: number
  reqPerApp?: number
}

export async function seedAll(params: SeedAllRequest = {}) {
  const res = await http.post<{ code: string; msg: string; result: any }>('/admin/seed/all', params)
  return res.data
}

