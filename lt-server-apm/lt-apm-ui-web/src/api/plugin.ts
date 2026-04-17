import { http } from './http'

export interface PluginInfo {
  id: number
  pluginCode: string
  pluginName: string
  pluginType: string
  version: string
  description: string
  fileName: string
  fileSize: number
  fileMd5: string
  downloadUrl: string
  enabled: boolean
  createTime: string
  updateTime: string
}

export interface PluginListResult {
  plugins: PluginInfo[]
  lastUpdateTime: number
}

export async function fetchEnabledPlugins() {
  const res = await http.get<{ data: PluginListResult }>('/plugin/list')
  return res.data?.data
}

export async function fetchAllPlugins() {
  const res = await http.get<{ data: PluginInfo[] }>('/plugin/admin/list')
  return res.data?.data || []
}

export async function fetchPluginInfo(pluginCode: string) {
  const res = await http.get<{ data: PluginInfo }>('/plugin/info', { params: { pluginCode } })
  return res.data?.data
}

export async function registerPlugin(data: PluginInfo) {
  const res = await http.post('/plugin/admin/register', data)
  return res.data
}

export async function updatePlugin(data: PluginInfo) {
  const res = await http.post('/plugin/admin/update', data)
  return res.data
}

export async function deletePlugin(pluginCode: string) {
  const res = await http.post('/plugin/admin/delete', null, { params: { pluginCode } })
  return res.data
}
