import type {
  ApiResponse,
  Project,
  ProjectFormData,
  Application,
  User,
  Role,
  DashboardStats,
  TrendData,
  Alert,
  TopApp,
} from "../types";

const API_BASE_URL = "http://localhost:8081/api";

// 通用请求方法
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
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
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

// Dashboard API
export const dashboardApi = {
  getStats: () =>
    request<ApiResponse<DashboardStats>>("/dashboard/stats", { method: "GET" }),

  getTrend: (range: string = "24h") =>
    request<ApiResponse<TrendData[]>>(`/dashboard/trend?range=${range}`, {
      method: "GET",
    }),

  getAlertTrend: () =>
    request<ApiResponse<any[]>>("/dashboard/alert-trend", {
      method: "GET",
    }),

  getRecentAlerts: () =>
    request<ApiResponse<Alert[]>>("/dashboard/recent-alerts", {
      method: "GET",
    }),

  getTopApps: () =>
    request<ApiResponse<TopApp[]>>("/dashboard/top-apps", { method: "GET" }),
};

// Projects API
export const projectsApi = {
  getAll: () =>
    request<ApiResponse<Project[]>>("/projects", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<Project>>(`/projects/${id}`, { method: "GET" }),

  getByEnv: (env: string) =>
    request<ApiResponse<Project[]>>(`/projects/env/${env}`, { method: "GET" }),

  create: (project: ProjectFormData) =>
    request<ApiResponse<Project>>("/projects", {
      method: "POST",
      body: JSON.stringify(project),
    }),

  update: (id: number, project: Partial<ProjectFormData>) =>
    request<ApiResponse<Project>>(`/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(project),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/projects/${id}`, { method: "DELETE" }),

  search: (keyword: string) =>
    request<ApiResponse<Project[]>>(`/projects/search?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
    }),
};

// Applications API
export const applicationsApi = {
  getAll: () =>
    request<ApiResponse<Application[]>>("/applications", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<Application>>(`/applications/${id}`, { method: "GET" }),

  getByProjectId: (projectId: number) =>
    request<ApiResponse<Application[]>>(`/applications/project/${projectId}`, {
      method: "GET",
    }),

  getByStatus: (status: string) =>
    request<ApiResponse<Application[]>>(`/applications/status/${status}`, {
      method: "GET",
    }),

  create: (app: Partial<Application>) =>
    request<ApiResponse<Application>>("/applications", {
      method: "POST",
      body: JSON.stringify(app),
    }),

  update: (id: number, app: Partial<Application>) =>
    request<ApiResponse<Application>>(`/applications/${id}`, {
      method: "PUT",
      body: JSON.stringify(app),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/applications/${id}`, { method: "DELETE" }),

  search: (keyword: string) =>
    request<ApiResponse<Application[]>>(`/applications/search?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
    }),
};

// Users API
export const usersApi = {
  getAll: () => request<ApiResponse<User[]>>("/users", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<User>>(`/users/${id}`, { method: "GET" }),

  create: (user: Partial<User>) =>
    request<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(user),
    }),

  update: (id: number, user: Partial<User>) =>
    request<ApiResponse<User>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(user),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/users/${id}`, { method: "DELETE" }),

  search: (keyword: string) =>
    request<ApiResponse<User[]>>(`/users/search?keyword=${encodeURIComponent(keyword)}`, {
      method: "GET",
    }),
};

// Roles API
export const rolesApi = {
  getAll: () => request<ApiResponse<Role[]>>("/roles", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<Role>>(`/roles/${id}`, { method: "GET" }),

  create: (role: Partial<Role>) =>
    request<ApiResponse<Role>>("/roles", {
      method: "POST",
      body: JSON.stringify(role),
    }),

  update: (id: number, role: Partial<Role>) =>
    request<ApiResponse<Role>>(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(role),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/roles/${id}`, { method: "DELETE" }),
};

// Permissions API
export const permissionsApi = {
  getAll: () => request<ApiResponse<any[]>>("/permissions", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<any>>(`/permissions/${id}`, { method: "GET" }),

  getByModule: (module: string) =>
    request<ApiResponse<any[]>>(`/permissions/module/${module}`, { method: "GET" }),

  create: (permission: any) =>
    request<ApiResponse<any>>("/permissions", {
      method: "POST",
      body: JSON.stringify(permission),
    }),

  update: (id: number, permission: any) =>
    request<ApiResponse<any>>(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify(permission),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/permissions/${id}`, { method: "DELETE" }),
};

// Releases API
export const releasesApi = {
  getAll: () => request<ApiResponse<any[]>>("/releases", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<any>>(`/releases/${id}`, { method: "GET" }),

  getByAppName: (appName: string) =>
    request<ApiResponse<any[]>>(`/releases/app/${encodeURIComponent(appName)}`, {
      method: "GET",
    }),

  create: (release: any) =>
    request<ApiResponse<any>>("/releases", {
      method: "POST",
      body: JSON.stringify(release),
    }),

  update: (id: number, release: any) =>
    request<ApiResponse<any>>(`/releases/${id}`, {
      method: "PUT",
      body: JSON.stringify(release),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/releases/${id}`, { method: "DELETE" }),
};

// JVM Monitor API
export const jvmMonitorApi = {
  getApplications: () =>
    request<ApiResponse<string[]>>("/jvm/applications", { method: "GET" }),

  getHostMetrics: (appName: string) =>
    request<ApiResponse<any>>(`/jvm/host-metrics?appName=${encodeURIComponent(appName)}`, {
      method: "GET",
    }),

  getHeapMemData: () =>
    request<ApiResponse<any[]>>("/jvm/heap-mem", { method: "GET" }),

  getThreadData: () =>
    request<ApiResponse<any[]>>("/jvm/threads", { method: "GET" }),

  getGcData: () => request<ApiResponse<any[]>>("/jvm/gc", { method: "GET" }),

  getNetworkData: () =>
    request<ApiResponse<any[]>>("/jvm/network", { method: "GET" }),

  getClassLoadingStats: () =>
    request<ApiResponse<any>>("/jvm/class-loading", { method: "GET" }),
};

// Alert Rules API
export const alertRulesApi = {
  getAll: () =>
    request<ApiResponse<any[]>>("/alert-rules", { method: "GET" }),

  getById: (id: number) =>
    request<ApiResponse<any>>(`/alert-rules/${id}`, { method: "GET" }),

  create: (rule: any) =>
    request<ApiResponse<any>>("/alert-rules", {
      method: "POST",
      body: JSON.stringify(rule),
    }),

  update: (id: number, rule: any) =>
    request<ApiResponse<any>>(`/alert-rules/${id}`, {
      method: "PUT",
      body: JSON.stringify(rule),
    }),

  delete: (id: number) =>
    request<ApiResponse<void>>(`/alert-rules/${id}`, { method: "DELETE" }),

  toggleStatus: (id: number, status: string) =>
    request<ApiResponse<any>>(`/alert-rules/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    }),
};

// DataSource API
export const dataSourceApi = {
  switch: (type: string) =>
    request<ApiResponse<string>>(`/datasource/switch/${type}`, {
      method: "POST",
    }),

  getCurrent: () =>
    request<ApiResponse<string>>("/datasource/current", { method: "GET" }),

  list: () =>
    request<ApiResponse<Record<string, string>>>("/datasource/list", {
      method: "GET",
    }),
};
