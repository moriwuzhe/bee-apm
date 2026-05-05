const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src/services/api.ts');

const content = `import type {
  ApiResponse,
  Project,
  ProjectFormData,
  Application,
  User,
  UserFormData,
  Role,
  RoleFormData,
  Permission,
  DashboardStats,
  TrendData,
  Alert,
  TopApp,
  Agent,
  AgentFormData,
  AlertRule,
  AlertRuleFormData,
  Release,
  ReleaseFormData,
  ImpactAnalysis,
} from "../types";
import { mockUsers, mockApplications, mockProjects, mockAgents, mockAlertRules, mockReleases } from "../data/mockData";

const API_BASE_URL = "http://localhost:8081/api";
const USE_MOCK = true;

const generateMockDashboardStats = (): DashboardStats => ({
  totalApps: 24,
  onlineApps: 18,
  warningApps: 4,
  errorApps: 2,
  totalAgents: 24,
  onlineAgents: 18,
  totalRequests: 1234567,
  errorRate: 0.15,
  avgResponseTime: 125,
  alertsToday: 6,
});

const generateMockTrendData = (): TrendData[] => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() - (23 - i) * 3600000);
    return {
      time: time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      requests: Math.floor(Math.random() * 50000) + 30000,
      avgResponseTime: Math.floor(Math.random() * 100) + 80,
      errorRate: Math.random() * 0.5,
    };
  });
};

const generateMockAlertTrend = (): { time: string; count: number }[] => {
  const now = new Date();
  return Array.from({ length: 24 }, (_, i) => {
    const time = new Date(now.getTime() - (23 - i) * 3600000);
    return {
      time: time.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      count: Math.floor(Math.random() * 10),
    };
  });
};

const generateMockRecentAlerts = (): Alert[] => [
  { id: "1", type: "error", msg: "order-service 出现 OOM 告警", time: "2分钟前", read: false },
  { id: "2", type: "warn", msg: "192.168.1.15 CPU使用率超过85%", time: "8分钟前", read: false },
  { id: "3", type: "info", msg: "Agent v2.4.1 版本升级完成", time: "30分钟前", read: false },
  { id: "4", type: "ok", msg: "payment-gateway 健康检查恢复正常", time: "1小时前", read: true },
];

const generateMockTopApps = (): TopApp[] => [
  { name: "order-service", requests: 123456, avgResponseTime: 125, errorRate: 0.15 },
  { name: "payment-gateway", requests: 98765, avgResponseTime: 89, errorRate: 0.08 },
  { name: "user-service", requests: 87654, avgResponseTime: 156, errorRate: 0.22 },
  { name: "inventory-service", requests: 65432, avgResponseTime: 98, errorRate: 0.05 },
];

function getMockData<T>(endpoint: string): T {
  console.log("Using mock data for:", endpoint);
  if (endpoint === "/dashboard/stats") {
    return { success: true, data: generateMockDashboardStats() } as T;
  }
  if (endpoint.startsWith("/dashboard/trend")) {
    return { success: true, data: generateMockTrendData() } as T;
  }
  if (endpoint === "/dashboard/alert-trend") {
    return { success: true, data: generateMockAlertTrend() } as T;
  }
  if (endpoint === "/dashboard/recent-alerts") {
    return { success: true, data: generateMockRecentAlerts() } as T;
  }
  if (endpoint === "/dashboard/top-apps") {
    return { success: true, data: generateMockTopApps() } as T;
  }
  if (endpoint === "/projects" || endpoint.startsWith("/projects")) {
    return { success: true, data: mockProjects } as T;
  }
  if (endpoint === "/applications" || endpoint.startsWith("/applications")) {
    return { success: true, data: mockApplications } as T;
  }
  if (endpoint === "/users" || endpoint.startsWith("/users")) {
    return { success: true, data: mockUsers } as T;
  }
  if (endpoint === "/agents" || endpoint.startsWith("/agents")) {
    return { success: true, data: mockAgents } as T;
  }
  if (endpoint === "/alert-rules" || endpoint.startsWith("/alert-rules")) {
    return { success: true, data: mockAlertRules } as T;
  }
  if (endpoint === "/releases" || endpoint.startsWith("/releases")) {
    return { success: true, data: mockReleases } as T;
  }
  if (endpoint === "/roles" || endpoint.startsWith("/roles")) {
    return { success: true, data: [] } as T;
  }
  if (endpoint === "/permissions" || endpoint.startsWith("/permissions")) {
    return { success: true, data: [] } as T;
  }
  return { success: true, data: null } as T;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  if (USE_MOCK) {
    return getMockData<T>(endpoint);
  }

  const url = \`\${API_BASE_URL}\${endpoint}\`;
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(\`HTTP error! status: \${response.status}\`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    console.log("Falling back to mock data for:", endpoint);
    return getMockData<T>(endpoint);
  }
}

export const dashboardApi = {
  getStats: () =>
    request<ApiResponse<DashboardStats>>("/dashboard/stats", { method: "GET" }),
  getTrend: (range: string = "24h") =>
    request<ApiResponse<TrendData[]>>(\`/dashboard/trend?range=\${range}\`, { method: "GET" }),
  getAlertTrend: () =>
    request<ApiResponse<{ time: string; count: number }[]>>("/dashboard/alert-trend", { method: "GET" }),
  getRecentAlerts: () =>
    request<ApiResponse<Alert[]>>("/dashboard/recent-alerts", { method: "GET" }),
  getTopApps: () =>
    request<ApiResponse<TopApp[]>>("/dashboard/top-apps", { method: "GET" }),
};

export const projectsApi = {
  getAll: () => request<ApiResponse<Project[]>>("/projects", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Project>>(\`/projects/\${id}\`, { method: "GET" }),
  getByEnv: (env: string) => request<ApiResponse<Project[]>>(\`/projects/env/\${env}\`, { method: "GET" }),
  create: (project: ProjectFormData) => request<ApiResponse<Project>>("/projects", { method: "POST", body: JSON.stringify(project) }),
  update: (id: number, project: Partial<ProjectFormData>) => request<ApiResponse<Project>>(\`/projects/\${id}\`, { method: "PUT", body: JSON.stringify(project) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/projects/\${id}\`, { method: "DELETE" }),
  search: (keyword: string) => request<ApiResponse<Project[]>>(\`/projects/search?keyword=\${encodeURIComponent(keyword)}\`, { method: "GET" }),
};

export const applicationsApi = {
  getAll: () => request<ApiResponse<Application[]>>("/applications", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Application>>(\`/applications/\${id}\`, { method: "GET" }),
  getByProjectId: (projectId: number) => request<ApiResponse<Application[]>>(\`/applications/project/\${projectId}\`, { method: "GET" }),
  getByStatus: (status: string) => request<ApiResponse<Application[]>>(\`/applications/status/\${status}\`, { method: "GET" }),
  create: (app: Partial<Application>) => request<ApiResponse<Application>>("/applications", { method: "POST", body: JSON.stringify(app) }),
  update: (id: number, app: Partial<Application>) => request<ApiResponse<Application>>(\`/applications/\${id}\`, { method: "PUT", body: JSON.stringify(app) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/applications/\${id}\`, { method: "DELETE" }),
  search: (keyword: string) => request<ApiResponse<Application[]>>(\`/applications/search?keyword=\${encodeURIComponent(keyword)}\`, { method: "GET" }),
};

export const usersApi = {
  getAll: () => request<ApiResponse<User[]>>("/users", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<User>>(\`/users/\${id}\`, { method: "GET" }),
  create: (user: Partial<User>) => request<ApiResponse<User>>("/users", { method: "POST", body: JSON.stringify(user) }),
  update: (id: number, user: Partial<User>) => request<ApiResponse<User>>(\`/users/\${id}\`, { method: "PUT", body: JSON.stringify(user) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/users/\${id}\`, { method: "DELETE" }),
  search: (keyword: string) => request<ApiResponse<User[]>>(\`/users/search?keyword=\${encodeURIComponent(keyword)}\`, { method: "GET" }),
};

export const rolesApi = {
  getAll: () => request<ApiResponse<Role[]>>("/roles", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Role>>(\`/roles/\${id}\`, { method: "GET" }),
  create: (role: Partial<Role>) => request<ApiResponse<Role>>("/roles", { method: "POST", body: JSON.stringify(role) }),
  update: (id: number, role: Partial<Role>) => request<ApiResponse<Role>>(\`/roles/\${id}\`, { method: "PUT", body: JSON.stringify(role) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/roles/\${id}\`, { method: "DELETE" }),
};

export const permissionsApi = {
  getAll: () => request<ApiResponse<Permission[]>>("/permissions", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Permission>>(\`/permissions/\${id}\`, { method: "GET" }),
  getByModule: (module: string) => request<ApiResponse<Permission[]>>(\`/permissions/module/\${module}\`, { method: "GET" }),
  create: (permission: Partial<Permission>) => request<ApiResponse<Permission>>("/permissions", { method: "POST", body: JSON.stringify(permission) }),
  update: (id: number, permission: Partial<Permission>) => request<ApiResponse<Permission>>(\`/permissions/\${id}\`, { method: "PUT", body: JSON.stringify(permission) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/permissions/\${id}\`, { method: "DELETE" }),
};

export const releasesApi = {
  getAll: () => request<ApiResponse<Release[]>>("/releases", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Release>>(\`/releases/\${id}\`, { method: "GET" }),
  getByAppName: (appName: string) => request<ApiResponse<Release[]>>(\`/releases/app/\${encodeURIComponent(appName)}\`, { method: "GET" }),
  create: (release: ReleaseFormData) => request<ApiResponse<Release>>("/releases", { method: "POST", body: JSON.stringify(release) }),
  update: (id: number, release: Partial<ReleaseFormData>) => request<ApiResponse<Release>>(\`/releases/\${id}\`, { method: "PUT", body: JSON.stringify(release) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/releases/\${id}\`, { method: "DELETE" }),
  getImpactAnalysis: (releaseId: number) => request<ApiResponse<ImpactAnalysis>>(\`/releases/\${releaseId}/impact\`, { method: "GET" }),
};

export const agentsApi = {
  getAll: () => request<ApiResponse<Agent[]>>("/agents", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<Agent>>(\`/agents/\${id}\`, { method: "GET" }),
  getByAppName: (appName: string) => request<ApiResponse<Agent[]>>(\`/agents/app/\${encodeURIComponent(appName)}\`, { method: "GET" }),
  getByStatus: (status: string) => request<ApiResponse<Agent[]>>(\`/agents/status/\${status}\`, { method: "GET" }),
  create: (agent: AgentFormData) => request<ApiResponse<Agent>>("/agents", { method: "POST", body: JSON.stringify(agent) }),
  update: (id: number, agent: Partial<AgentFormData>) => request<ApiResponse<Agent>>(\`/agents/\${id}\`, { method: "PUT", body: JSON.stringify(agent) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/agents/\${id}\`, { method: "DELETE" }),
  search: (keyword: string) => request<ApiResponse<Agent[]>>(\`/agents/search?keyword=\${encodeURIComponent(keyword)}\`, { method: "GET" }),
};

export const jvmMonitorApi = {
  getApplications: () => request<ApiResponse<string[]>>("/jvm/applications", { method: "GET" }),
  getHostMetrics: (appName: string) => request<ApiResponse<{ cpu: number; memory: number; disk: number }>>(\`/jvm/host-metrics?appName=\${encodeURIComponent(appName)}\`, { method: "GET" }),
  getHeapMemData: () => request<ApiResponse<{ time: string; heap: number; nonHeap: number }[]>>("/jvm/heap-mem", { method: "GET" }),
  getThreadData: () => request<ApiResponse<{ time: string; total: number; active: number }[]>>("/jvm/threads", { method: "GET" }),
  getGcData: () => request<ApiResponse<{ time: string; count: number; time: number }[]>>("/jvm/gc", { method: "GET" }),
  getNetworkData: () => request<ApiResponse<{ time: string; in: number; out: number }[]>>("/jvm/network", { method: "GET" }),
  getClassLoadingStats: () => request<ApiResponse<{ loaded: number; unloaded: number; total: number }>>("/jvm/class-loading", { method: "GET" }),
};

export const alertRulesApi = {
  getAll: () => request<ApiResponse<AlertRule[]>>("/alert-rules", { method: "GET" }),
  getById: (id: number) => request<ApiResponse<AlertRule>>(\`/alert-rules/\${id}\`, { method: "GET" }),
  getByAppName: (appName: string) => request<ApiResponse<AlertRule[]>>(\`/alert-rules/app/\${encodeURIComponent(appName)}\`, { method: "GET" }),
  create: (rule: AlertRuleFormData) => request<ApiResponse<AlertRule>>("/alert-rules", { method: "POST", body: JSON.stringify(rule) }),
  update: (id: number, rule: Partial<AlertRuleFormData>) => request<ApiResponse<AlertRule>>(\`/alert-rules/\${id}\`, { method: "PUT", body: JSON.stringify(rule) }),
  delete: (id: number) => request<ApiResponse<void>>(\`/alert-rules/\${id}\`, { method: "DELETE" }),
  toggleStatus: (id: number, status: string) => request<ApiResponse<AlertRule>>(\`/alert-rules/\${id}/status\`, { method: "PUT", body: JSON.stringify({ status }) }),
  search: (keyword: string) => request<ApiResponse<AlertRule[]>>(\`/alert-rules/search?keyword=\${encodeURIComponent(keyword)}\`, { method: "GET" }),
};

export const dataSourceApi = {
  switch: (type: string) => request<ApiResponse<string>>(\`/datasource/switch/\${type}\`, { method: "POST" }),
  getCurrent: () => request<ApiResponse<string>>("/datasource/current", { method: "GET" }),
  list: () => request<ApiResponse<Record<string, string>>>("/datasource/list", { method: "GET" }),
};

export { request };
`;

fs.writeFileSync(apiPath, content, 'utf-8');
console.log('api.ts created successfully!');
