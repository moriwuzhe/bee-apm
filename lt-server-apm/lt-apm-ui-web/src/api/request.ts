import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type RequestRow = {
  id: string
  time: string
  gid: string
  ip: string
  env: string
  app: string
  spend: number
  tags?: { url?: string }
  error?: boolean
}

export type RequestQuery = {
  env?: string
  app?: string
  sort?: 'time' | 'spend' | ''
  entry?: string
  gid?: string
  ip?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchRequestList(params: RequestQuery) {
  const res = await http.post<PageResult<RequestRow>>('/request/list', params)
  return res.data
}

