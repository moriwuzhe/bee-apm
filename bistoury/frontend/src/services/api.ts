import axios from 'axios'

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    console.error('API Error:', error)
    return Promise.reject(error)
  }
)

// 应用相关API
export const agentApi = {
  // 获取应用列表
  getList: (params?: { status?: string; keyword?: string }) => api.get('/agent/list', { params }),
  // 获取应用详情
  getDetail: (agentId: string) => api.get(`/agent/${agentId}`),
  // 获取应用统计
  getStats: () => api.get('/agent/stats'),
  // 执行诊断命令
  executeCommand: (agentId: string, command: string) => 
    api.post(`/agent/${agentId}/command`, { command }),
  // 获取命令执行结果
  getCommandResult: (taskId: string) => api.get(`/proxy/agent/task/${taskId}/result`),
  // 下线Agent
  offline: (agentId: string) => api.post(`/agent/${agentId}/offline`),
}

// 诊断相关API
export const diagnoseApi = {
  // 获取支持的命令列表
  getCommands: () => api.get('/proxy/diagnose/commands'),
  // 获取诊断历史
  getHistory: (agentId?: string) => api.get('/proxy/diagnose/history', { params: { agentId } }),
  // AI分析结果
  aiAnalyze: (command: string, result: string) => 
    api.post('/diagnose/ai-analyze', { command, result }),
}

// 告警相关API
export const alertApi = {
  // 获取告警列表
  getList: (params?: { level?: string; status?: string; agentId?: string; startTime?: number; endTime?: number }) => 
    api.get('/alert/list', { params }),
  // 获取告警统计
  getStats: () => api.get('/alert/stats'),
  // 获取未处理告警数量
  getPendingCount: () => api.get('/alert/pending/count'),
  // 解决告警
  resolve: (alertId: string, data: { resolveUser: string; remark?: string }) => 
    api.post(`/alert/resolve/${alertId}`, null, { params: data }),
  // 忽略告警
  ignore: (alertId: string, data: { remark?: string }) => 
    api.post(`/alert/ignore/${alertId}`, null, { params: data }),
  // 创建测试告警
  createTest: () => api.post('/alert/test'),
}

// 系统相关API
export const systemApi = {
  // 登录
  login: (username: string, password: string) => 
    api.post('/proxy/user/login', { username, password }),
  // 获取系统信息
  getInfo: () => api.get('/proxy/system/info'),
  // 保存配置
  saveConfig: (config: any) => api.post('/proxy/system/config', config),
}

export default api
