import { http } from './http'

export type KeyValue = {
  name: string
  value: string
}

export async function fetchGroupList(params: { beginTime: string; endTime: string; group: 'env' | 'app' }) {
  const res = await http.post<{ result: KeyValue[] }>('/api/common/getGroupList', params)
  const list = res.data && Array.isArray(res.data.result) ? res.data.result : []
  return list
}

export async function queryById(params: { id: string; index: string; beginTime: string; endTime: string }) {
  const res = await http.post<{ result: any }>('/api/common/queryById', params)
  return res.data && (res.data as any).result ? (res.data as any).result : null
}

