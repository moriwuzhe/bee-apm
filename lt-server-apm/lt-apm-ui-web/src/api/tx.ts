import { http } from './http'

export type PageResult<T> = {
  rows: T[]
  pageNum: number
  pageTotal: number
}

export type TxRow = {
  id: string
  time: string
  gid: string
  ip: string
  env: string
  app: string
  spend: number
  tags?: { count?: number; point?: string }
  error?: boolean
}

export type TxQuery = {
  env?: string
  app?: string
  sort?: 'time' | 'spend' | 'tags.count' | ''
  gid?: string
  ip?: string
  pageNum: number
  beginTime: string
  endTime: string
}

export async function fetchTxList(params: TxQuery) {
  const res = await http.post<PageResult<TxRow>>('/tx/list', params)
  return res.data
}

