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

