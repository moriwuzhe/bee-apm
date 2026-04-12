import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type LoggerRow = {
  id: string
  time: string
  gid: string
  ip: string
  env: string
  app: string
  tags?: { level?: string; point?: string; log?: string }
}

export type LoggerQuery = {
  env?: string
  app?: string
  gid?: string
  ip?: string
  'tags.level'?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchLoggerList(params: LoggerQuery) {
  const res = await http.post<PageResult<LoggerRow>>('/logger/list', params)
  return res.data
}

