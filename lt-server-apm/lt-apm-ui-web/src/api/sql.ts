import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type SqlRow = {
  id: string
  time: string
  gid: string
  ip: string
  env: string
  app: string
  spend: number
  tags?: { count?: number; sql?: string }
  error?: boolean
}

export type SqlQuery = {
  env?: string
  app?: string
  sort?: 'time' | 'spend' | 'tags.count' | ''
  gid?: string
  ip?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchSqlList(params: SqlQuery) {
  const res = await http.post<PageResult<SqlRow>>('/api/sql/list', params)
  return res.data
}

