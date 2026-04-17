import { http } from './http'

export async function fetchCallTree(params: { gid: string; time: string }) {
  const res = await http.post<{ result: any }>('/api/request/callTree', params)
  return res.data && (res.data as any).result ? (res.data as any).result : null
}

export async function fetchTopology(params: { gid: string; time: string }) {
  const res = await http.post<{ result: any }>('/api/request/topology', params)
  return res.data && (res.data as any).result ? (res.data as any).result : null
}

