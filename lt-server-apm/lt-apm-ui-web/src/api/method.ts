import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type MethodRow = {
  id: string
  time: string
  gid: string
  ip: string
  env: string
  app: string
  spend: number
  tags?: { method?: string }
  error?: boolean
}

export type MethodQuery = {
  env?: string
  app?: string
  sort?: 'time' | 'spend' | ''
  gid?: string
  ip?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchMethodList(params: MethodQuery) {
  const res = await http.post<PageResult<MethodRow>>('/api/method/list', params)
  return res.data
}

