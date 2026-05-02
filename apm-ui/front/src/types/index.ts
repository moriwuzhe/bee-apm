// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 项目类型
export interface Project {
  id: number;
  name: string;
  groupName: string;
  environment: string;
  description: string;
  owner: string;
  status: string;
  appCount: number;
}

// 前端项目类型
export interface ProjectFormData {
  name: string;
  groupName: string;
  environment: string;
  description: string;
  owner: string;
  status: string;
}

// 应用类型
export interface Application {
  id: number;
  name: string;
  projectName?: string;
  status: string;
  ip: string;
  agentVersion: string;
  jvmVersion: string;
  heapUsage: number;
  instanceCount: number;
  uptime: string;
}

// 用户类型
export interface User {
  id: number;
  name: string;
  account: string;
  email: string;
  roleName: string;
  status: string;
  lastLoginTime: string;
  lastLoginIp: string;
  loginCount: number;
}

// 角色类型
export interface Role {
  id: number;
  name: string;
  description: string;
  userCount: number;
  permissionCount: number;
  isSystem: boolean;
  color: string;
}

// Dashboard 统计数据类型
export interface DashboardStats {
  totalApps: number;
  onlineAgents: number;
  totalAgents: number;
  serverNodes: number;
  activeAlerts: number;
  healthScore: number;
  avgResponseTime: number;
}

// 趋势数据类型
export interface TrendData {
  time: string;
  cpu: number;
  mem: number;
  net: number;
  err: number;
}

// 告警类型
export interface Alert {
  app: string;
  env: string;
  type: string;
  level: string;
  time: string;
}

// 应用排名类型
export interface TopApp {
  name: string;
  status: string;
  cpu: number;
  mem: number;
  inst: number;
}
