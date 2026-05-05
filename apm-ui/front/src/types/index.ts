// 状态类型
export type StatusType = "online" | "offline" | "warning" | "error" | "disabled" | "ok";

// API 响应类型
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
  timestamp: number;
}

// 项目环境类型
export type ProjectEnv = "dev" | "staging" | "production";

// 项目类型
export interface Project {
  id: number;
  name: string;
  groupName: string;
  environment: ProjectEnv;
  description: string;
  owner: string;
  status: StatusType;
  appCount: number;
}

// 前端项目类型
export interface ProjectFormData {
  name: string;
  groupName: string;
  environment: ProjectEnv;
  description: string;
  owner: string;
  status: StatusType;
}

// 应用类型
export interface Application {
  id: number;
  name: string;
  projectName?: string;
  status: StatusType;
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
  roles?: string[];
  status: StatusType;
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

// Agent 类型
export interface Agent {
  id: number;
  appName: string;
  ip: string;
  hostname: string;
  status: StatusType;
  agentVersion: string;
  lastHb: string;
  uptime: string;
  cpu: number;
  memory: number;
  disk: number;
  jvmVersion: string;
  heapUsage: number;
  nonHeapUsage: number;
  threads: number;
  gcCount: number;
  gcTime: number;
}

// Agent 表单数据类型
export interface AgentFormData {
  appName: string;
  ip: string;
  hostname: string;
  agentVersion: string;
  status: string;
}

// 告警级别类型
export type AlertLevel = "info" | "warning" | "error" | "critical";
export type RuleLevel = "critical" | "warning" | "info";
export type RuleStatus = "enabled" | "disabled" | "muted";

// 告警规则管理页面类型
export interface AlertRuleItem {
  id: number;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  unit: string;
  level: RuleLevel;
  status: RuleStatus;
  channels: string[];
  triggerCount: number;
  lastTrigger: string;
}

// 历史数据类型
export interface HistoryData {
  time: string;
  critical: number;
  warning: number;
  info: number;
}

// 告警规则类型
export interface AlertRule {
  id: number;
  name: string;
  app: string;
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  level: AlertLevel;
  status: StatusType;
  notify: string;
  createdAt: string;
  updatedAt: string;
}

// 告警规则表单数据类型
export interface AlertRuleFormData {
  name: string;
  app: string;
  metric: string;
  condition: string;
  threshold: number;
  duration: number;
  level: AlertLevel;
  status: StatusType;
  notify: string;
}

// 风险级别类型
export type RiskLevel = "low" | "medium" | "high" | "critical";

// 影响范围类型
export interface ImpactScope {
  services: number;
  apis: number;
  instances: number;
}

// 版本发布类型
export interface Release {
  id: number;
  appName: string;
  version: string;
  prevVersion: string;
  env: ProjectEnv;
  status: StatusType;
  operator: string;
  time: string;
  changes: string[];
  impact: ImpactScope;
  alerts: number;
}

// 版本发布表单数据类型
export interface ReleaseFormData {
  app: string;
  version: string;
  prev: string;
  env: ProjectEnv;
  changes: string[];
}

// 影响分析类型
export interface ImpactAnalysis {
  id: number;
  releaseId: number;
  app: string;
  affectedServices: string[];
  affectedInstances: number;
  riskScore: number;
  recommendation: string;
  status: string;
}

// 权限类型
export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
  module: string;
  type: string;
}

// 用户表单数据类型
export interface UserFormData {
  name: string;
  account: string;
  email: string;
  roleId: number;
  status: string;
}

// 角色表单数据类型
export interface RoleFormData {
  name: string;
  description: string;
  permissionIds: number[];
}

// 应用列表项类型（用于 Applications.tsx 组件）
export interface ApplicationListItem extends Application {
  project: string;
  agent: string;
  runtime: string;
  jvm: string;
  heap: number;
  inst: number;
}

// 应用表单数据类型
export interface ApplicationFormData {
  name: string;
  status: StatusType;
  ip: string;
  agentVersion: string;
  jvmVersion: string;
  heapUsage: number;
  uptime: string;
  instanceCount: number;
}

// 告警趋势数据类型
export interface AlertTrendData {
  name: string;
  critical: number;
  warning: number;
  info: number;
}

// 快捷入口项类型
export interface QuickAccessItem {
  label: string;
  count: number;
  color: string;
}

// Agent 管控页面类型
export interface AgentControlItem {
  id: number;
  host: string;
  app: string;
  version: string;
  status: StatusType;
  os: string;
  plugins: number;
  lastHb: string;
  connected: boolean;
}

// 插件类型
export interface Plugin {
  name: string;
  version: string;
  status: StatusType;
  desc: string;
  loaded: boolean;
}

// 市场插件类型
export interface MarketPlugin {
  name: string;
  desc: string;
  hot: boolean;
}

// 链路追踪 Span 类型
export interface TraceSpan {
  id: number;
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  spanType: string;
  appName: string;
  serviceName: string;
  methodName: string;
  startTime: number;
  endTime: number;
  duration: number;
  success: boolean;
  errorMsg?: string;
  tags: Record<string, string>;
  createdAt: string;
}

// 链路追踪搜索条件类型
export interface TraceSearchParams {
  appName?: string;
  serviceName?: string;
  traceId?: string;
  minDuration?: number;
  maxDuration?: number;
  startTime?: number;
  endTime?: number;
  success?: boolean;
  page?: number;
  size?: number;
}

// 链路追踪统计数据类型
export interface TraceStats {
  totalTraces: number;
  successCount: number;
  errorCount: number;
  avgDuration: number;
  maxDuration: number;
  minDuration: number;
  topApps: { appName: string; count: number }[];
}

// 链路详情类型
export interface TraceDetail {
  traceId: string;
  spans: TraceSpan[];
  totalDuration: number;
  startTime: number;
  endTime: number;
}
