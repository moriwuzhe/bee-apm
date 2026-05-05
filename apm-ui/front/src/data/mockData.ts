import { User, Application, Project, Agent, AlertRule, Release } from "../types";

export const mockUsers: User[] = [
  { id: 1, name: "张伟", account: "zhangwei", email: "zhangwei@opswatch.com", status: "online", roles: ["管理员"], createdAt: "2024-01-15", lastLogin: "2024-01-20" },
  { id: 2, name: "李明", account: "liming", email: "liming@opswatch.com", status: "online", roles: ["开发工程师"], createdAt: "2024-02-20", lastLogin: "2024-01-19" },
  { id: 3, name: "王芳", account: "wangfang", email: "wangfang@opswatch.com", status: "offline", roles: ["测试工程师"], createdAt: "2024-03-10", lastLogin: "2024-01-18" },
  { id: 4, name: "刘强", account: "liuqiang", email: "liuqiang@opswatch.com", status: "online", roles: ["运维工程师"], createdAt: "2024-04-05", lastLogin: "2024-01-20" },
  { id: 5, name: "陈静", account: "chenjing", email: "chenjing@opswatch.com", status: "offline", roles: ["产品经理"], createdAt: "2024-05-12", lastLogin: "2024-01-15" },
  { id: 6, name: "赵磊", account: "zhaolei", email: "zhaolei@opswatch.com", status: "online", roles: ["架构师"], createdAt: "2024-06-18", lastLogin: "2024-01-20" },
];

export const mockApplications: Application[] = [
  { id: 1, name: "order-service", status: "online", ip: "192.168.1.10", agentVersion: "v2.4.1", jvmVersion: "17", heapUsage: 68, uptime: "2d 15h", instanceCount: 3 },
  { id: 2, name: "payment-gateway", status: "online", ip: "192.168.1.11", agentVersion: "v2.4.0", jvmVersion: "17", heapUsage: 45, uptime: "1d 8h", instanceCount: 2 },
  { id: 3, name: "user-service", status: "warning", ip: "192.168.1.12", agentVersion: "v2.3.9", jvmVersion: "11", heapUsage: 82, uptime: "5d 2h", instanceCount: 4 },
  { id: 4, name: "inventory-service", status: "online", ip: "192.168.1.13", agentVersion: "v2.4.1", jvmVersion: "17", heapUsage: 55, uptime: "3d 10h", instanceCount: 2 },
  { id: 5, name: "notification-service", status: "error", ip: "192.168.1.14", agentVersion: "v2.4.0", jvmVersion: "17", heapUsage: 95, uptime: "30m", instanceCount: 1 },
  { id: 6, name: "recommendation-engine", status: "online", ip: "192.168.1.15", agentVersion: "v2.4.1", jvmVersion: "17", heapUsage: 72, uptime: "4d 6h", instanceCount: 3 },
];

export const mockProjects: Project[] = [
  { id: 1, name: "电商平台", groupName: "交易中心", environment: "production", description: "核心电商交易平台", owner: "张伟", status: "online", appCount: 8 },
  { id: 2, name: "会员系统", groupName: "用户中心", environment: "staging", description: "会员管理系统", owner: "李明", status: "online", appCount: 3 },
  { id: 3, name: "数据分析", groupName: "数据中心", environment: "production", description: "大数据分析平台", owner: "王芳", status: "warning", appCount: 5 },
  { id: 4, name: "营销系统", groupName: "营销中心", environment: "dev", description: "营销活动管理系统", owner: "刘强", status: "online", appCount: 4 },
  { id: 5, name: "供应链", groupName: "供应链中心", environment: "production", description: "供应链管理系统", owner: "陈静", status: "offline", appCount: 6 },
];

export const mockAgents: Agent[] = [
  { id: 1, host: "192.168.1.10", app: "order-service", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 5, lastHb: "2s", connected: true },
  { id: 2, host: "192.168.1.11", app: "payment-gateway", version: "v2.4.0", status: "online", os: "Linux x64", plugins: 4, lastHb: "5s", connected: true },
  { id: 3, host: "192.168.1.12", app: "user-service", version: "v2.3.9", status: "warning", os: "Linux x64", plugins: 5, lastHb: "30s", connected: true },
  { id: 4, host: "192.168.1.13", app: "inventory-service", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 4, lastHb: "1s", connected: true },
  { id: 5, host: "192.168.1.14", app: "notification-service", version: "v2.4.0", status: "error", os: "Linux x64", plugins: 3, lastHb: "5m", connected: false },
  { id: 6, host: "192.168.1.15", app: "recommendation-engine", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 6, lastHb: "3s", connected: true },
];

export const mockAlertRules: AlertRule[] = [
  { id: 1, name: "CPU使用率告警", metric: "cpu_usage", condition: ">", threshold: 85, level: "critical", status: "enabled", channels: ["email", "sms"], description: "CPU使用率超过85%触发告警" },
  { id: 2, name: "内存使用率告警", metric: "memory_usage", condition: ">", threshold: 90, level: "warning", status: "enabled", channels: ["email"], description: "内存使用率超过90%触发告警" },
  { id: 3, name: "磁盘使用率告警", metric: "disk_usage", condition: ">", threshold: 80, level: "info", status: "enabled", channels: ["email", "webhook"], description: "磁盘使用率超过80%触发告警" },
  { id: 4, name: "响应时间告警", metric: "response_time", condition: ">", threshold: 500, level: "critical", status: "disabled", channels: ["sms"], description: "接口响应时间超过500ms触发告警" },
  { id: 5, name: "错误率告警", metric: "error_rate", condition: ">", threshold: 5, level: "critical", status: "enabled", channels: ["email", "sms"], description: "错误率超过5%触发告警" },
  { id: 6, name: "线程池告警", metric: "thread_pool", condition: ">", threshold: 95, level: "warning", status: "enabled", channels: ["email"], description: "线程池使用率超过95%触发告警" },
];

export const mockReleases: Release[] = [
  { 
    id: 1, 
    appName: "order-service", 
    version: "v3.2.1", 
    prevVersion: "v3.2.0", 
    env: "production", 
    status: "online", 
    operator: "张伟", 
    time: "2024-01-20 14:30",
    changes: ["修复订单创建失败问题", "优化支付回调逻辑", "添加日志监控"],
    impact: { services: 5, apis: 12, instances: 8 },
    alerts: 0
  },
  { 
    id: 2, 
    appName: "payment-gateway", 
    version: "v2.5.0", 
    prevVersion: "v2.4.1", 
    env: "staging", 
    status: "online", 
    operator: "李明", 
    time: "2024-01-19 09:15",
    changes: ["支持新支付渠道", "优化退款流程"],
    impact: { services: 3, apis: 8, instances: 4 },
    alerts: 1
  },
  { 
    id: 3, 
    appName: "user-service", 
    version: "v4.0.0", 
    prevVersion: "v3.8.2", 
    env: "production", 
    status: "error", 
    operator: "王芳", 
    time: "2024-01-18 16:45",
    changes: ["重构用户认证模块", "添加OAuth2支持", "优化数据库查询"],
    impact: { services: 8, apis: 20, instances: 12 },
    alerts: 5
  },
  { 
    id: 4, 
    appName: "inventory-service", 
    version: "v1.8.0", 
    prevVersion: "v1.7.5", 
    env: "dev", 
    status: "online", 
    operator: "刘强", 
    time: "2024-01-17 11:20",
    changes: ["添加库存预警功能", "优化库存同步"],
    impact: { services: 2, apis: 6, instances: 3 },
    alerts: 0
  },
];

export const mockDashboardData = {
  totalRequests: 1256789,
  avgResponseTime: 128,
  errorRate: 0.02,
  activeUsers: 2453,
  cpuUsage: 45,
  memoryUsage: 62,
  diskUsage: 78,
  networkIn: 125.5,
  networkOut: 89.3,
  topServices: [
    { name: "order-service", requests: 456789, latency: 145, errors: 123 },
    { name: "payment-gateway", requests: 321456, latency: 98, errors: 45 },
    { name: "user-service", requests: 289012, latency: 167, errors: 78 },
    { name: "inventory-service", requests: 156789, latency: 89, errors: 23 },
    { name: "notification-service", requests: 32844, latency: 210, errors: 156 },
  ],
  requestTrend: [
    { time: "00:00", value: 8500 },
    { time: "04:00", value: 4200 },
    { time: "08:00", value: 12500 },
    { time: "12:00", value: 18900 },
    { time: "16:00", value: 15600 },
    { time: "20:00", value: 11200 },
  ],
  errorDistribution: [
    { type: "4xx", count: 1256, percentage: 65 },
    { type: "5xx", count: 456, percentage: 23 },
    { type: "Timeout", count: 123, percentage: 6 },
    { type: "Other", count: 115, percentage: 6 },
  ],
  alertSummary: { total: 45, critical: 5, warning: 12, info: 28 },
};

export const mockJVMMonitorData = {
  heapUsed: 1256,
  heapMax: 2048,
  nonHeapUsed: 256,
  nonHeapMax: 512,
  threadCount: 156,
  daemonThreadCount: 45,
  peakThreadCount: 178,
  gcCount: 1234,
  gcTime: 45678,
  heapTrend: [
    { time: "10:00", used: 800, max: 2048 },
    { time: "10:15", used: 950, max: 2048 },
    { time: "10:30", used: 1100, max: 2048 },
    { time: "10:45", used: 1200, max: 2048 },
    { time: "11:00", used: 900, max: 2048 },
    { time: "11:15", used: 1050, max: 2048 },
    { time: "11:30", used: 1256, max: 2048 },
  ],
  threadStates: {
    RUNNABLE: 85,
    TIMED_WAITING: 45,
    WAITING: 20,
    BLOCKED: 6,
  },
  memoryPools: [
    { name: "Eden Space", used: 450, max: 512 },
    { name: "Survivor Space", used: 120, max: 128 },
    { name: "Old Gen", used: 686, max: 1408 },
  ],
};

export const mockAlertHistory = [
  { id: 1, type: "error", message: "order-service CPU使用率达到95%", time: "2分钟前", status: "unread" },
  { id: 2, type: "warn", message: "user-service 内存使用率达到88%", time: "8分钟前", status: "unread" },
  { id: 3, type: "info", message: "Agent v2.4.1 升级完成", time: "30分钟前", status: "read" },
  { id: 4, type: "success", message: "payment-gateway 健康检查恢复", time: "1小时前", status: "read" },
  { id: 5, type: "error", message: "notification-service 连接超时", time: "2小时前", status: "read" },
];

export const mockNetworkTopology = {
  nodes: [
    { id: "order", name: "order-service", type: "service", status: "online", x: 400, y: 200 },
    { id: "payment", name: "payment-gateway", type: "service", status: "online", x: 600, y: 200 },
    { id: "user", name: "user-service", type: "service", status: "warning", x: 400, y: 350 },
    { id: "inventory", name: "inventory-service", type: "service", status: "online", x: 200, y: 200 },
    { id: "db", name: "MySQL", type: "database", status: "online", x: 400, y: 500 },
    { id: "cache", name: "Redis", type: "cache", status: "online", x: 600, y: 350 },
  ],
  edges: [
    { source: "order", target: "payment", traffic: 12500, latency: 15 },
    { source: "order", target: "user", traffic: 8900, latency: 12 },
    { source: "order", target: "inventory", traffic: 6700, latency: 8 },
    { source: "order", target: "db", traffic: 23400, latency: 45 },
    { source: "payment", target: "db", traffic: 15600, latency: 42 },
    { source: "payment", target: "cache", traffic: 8900, latency: 5 },
    { source: "user", target: "db", traffic: 18900, latency: 38 },
    { source: "inventory", target: "db", traffic: 12300, latency: 35 },
    { source: "inventory", target: "cache", traffic: 4500, latency: 6 },
  ],
};