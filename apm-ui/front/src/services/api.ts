import type {
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
    TraceSpan,
    TraceSearchParams,
    TraceStats,
    TraceDetail,
} from "../types";
import { mockUsers, mockApplications, mockProjects, mockAgents, mockAlertRules, mockReleases } from "../data/mockData";

const API_BASE_URL = "http://localhost:8081";
const USE_MOCK = false;

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
            requests: Math.floor(Math.random() * 50000 + 30000),
            avgResponseTime: Math.floor(Math.random() * 100 + 80),
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

const generateMockTraceSpans = (): TraceSpan[] => {
    const appNames = ["order-service", "payment-gateway", "user-service", "inventory-service"];
    const spanTypes = ["HTTP", "SQL", "REDIS", "RPC", "LOCAL"];
    const mockSpans: TraceSpan[] = [];

    for (let i = 0; i < 20; i++) {
        const startTime = Date.now() - Math.floor(Math.random() * 3600000);
        const duration = Math.floor(Math.random() * 500 + 50);
        const appName = appNames[Math.floor(Math.random() * appNames.length)];
        const success = Math.random() > 0.1;

        mockSpans.push({
            id: i + 1,
            traceId: "trace-" + Math.floor(Math.random() * 1000),
            spanType: spanTypes[Math.floor(Math.random() * spanTypes.length)],
            appName,
            serviceName: appName + ".service",
            methodName: i % 2 === 0 ? "getOrder" : "createPayment",
            startTime,
            endTime: startTime + duration,
            duration,
            success,
            errorMsg: success ? undefined : "Connection timeout",
            tags: { env: "production", version: "v1.2.3" },
            createdAt: new Date(startTime).toISOString(),
        });
    }

    return mockSpans;
};

const generateMockTraceStats = (): TraceStats => ({
    totalTraces: 12345,
    successCount: 11890,
    errorCount: 455,
    avgDuration: 145,
    maxDuration: 1250,
    minDuration: 12,
    topApps: [
        { appName: "order-service", count: 4567 },
        { appName: "payment-gateway", count: 3456 },
        { appName: "user-service", count: 2345 },
        { appName: "inventory-service", count: 1977 },
    ],
});

const generateMockTraceDetail = (traceId: string): TraceDetail => {
    const spans: TraceSpan[] = [];
    const startTime = Date.now() - 3600000;

    for (let i = 0; i < 5; i++) {
        const offset = i * 50;
        const duration = 100 + i * 50;
        spans.push({
            id: i + 1,
            traceId,
            spanType: i === 0 ? "HTTP" : i === 1 ? "RPC" : i === 2 ? "SQL" : "REDIS",
            appName: i % 2 === 0 ? "order-service" : "payment-gateway",
            serviceName: (i % 2 === 0 ? "order" : "payment") + ".service",
            methodName: "method-" + i,
            startTime: startTime + offset,
            endTime: startTime + offset + duration,
            duration,
            success: true,
            tags: { env: "production" },
            createdAt: new Date(startTime).toISOString(),
        });
    }

    return {
        traceId,
        spans,
        totalDuration: spans.reduce((sum, s) => sum + s.duration, 0),
        startTime: spans[0]?.startTime || 0,
        endTime: spans[spans.length - 1]?.endTime || 0,
    };
};

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
    if (endpoint.startsWith("/apm/traces")) {
        return { success: true, data: generateMockTraceSpans() } as T;
    }
    if (endpoint.startsWith("/apm/stats")) {
        return { success: true, data: generateMockTraceStats() } as T;
    }
    if (endpoint.startsWith("/apm/trace/")) {
        const traceId = endpoint.substring("/apm/trace/".length);
        return { success: true, data: generateMockTraceDetail(traceId) } as T;
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

    const url = API_BASE_URL + endpoint;
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
            throw new Error("HTTP error! status: " + response.status);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("API request failed:", error);
        return { success: true, data: [] } as T;
    }
}

export const dashboardApi = {
    getStats: () =>
        request<ApiResponse<DashboardStats>>("/api/dashboard/stats", { method: "GET" }),
    getTrend: (range: string = "24h") =>
        request<ApiResponse<TrendData[]>>("/api/dashboard/trend?range=" + range, { method: "GET" }),
    getAlertTrend: () =>
        request<ApiResponse<{ time: string; count: number }[]>>("/api/dashboard/alert-trend", { method: "GET" }),
    getRecentAlerts: () =>
        request<ApiResponse<Alert[]>>("/api/dashboard/recent-alerts", { method: "GET" }),
    getTopApps: () =>
        request<ApiResponse<TopApp[]>>("/api/dashboard/top-apps", { method: "GET" }),
};

export const projectsApi = {
    getAll: () => request<ApiResponse<Project[]>>("/api/projects", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Project>>("/api/projects/" + id, { method: "GET" }),
    getByEnv: (env: string) => request<ApiResponse<Project[]>>("/api/projects/env/" + env, { method: "GET" }),
    create: (project: ProjectFormData) => request<ApiResponse<Project>>("/api/projects", { method: "POST", body: JSON.stringify(project) }),
    update: (id: number, project: Partial<ProjectFormData>) => request<ApiResponse<Project>>("/api/projects/" + id, { method: "PUT", body: JSON.stringify(project) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/projects/" + id, { method: "DELETE" }),
    search: (keyword: string) => request<ApiResponse<Project[]>>("/api/projects/search?keyword=" + encodeURIComponent(keyword), { method: "GET" }),
};

export const applicationsApi = {
    getAll: () => request<ApiResponse<Application[]>>("/api/applications", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Application>>("/api/applications/" + id, { method: "GET" }),
    getByProjectId: (projectId: number) => request<ApiResponse<Application[]>>("/api/applications/project/" + projectId, { method: "GET" }),
    getByStatus: (status: string) => request<ApiResponse<Application[]>>("/api/applications/status/" + status, { method: "GET" }),
    create: (app: Partial<Application>) => request<ApiResponse<Application>>("/api/applications", { method: "POST", body: JSON.stringify(app) }),
    update: (id: number, app: Partial<Application>) => request<ApiResponse<Application>>("/api/applications/" + id, { method: "PUT", body: JSON.stringify(app) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/applications/" + id, { method: "DELETE" }),
    search: (keyword: string) => request<ApiResponse<Application[]>>("/api/applications/search?keyword=" + encodeURIComponent(keyword), { method: "GET" }),
};

export const usersApi = {
    getAll: () => request<ApiResponse<User[]>>("/api/users", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<User>>("/api/users/" + id, { method: "GET" }),
    create: (user: Partial<User>) => request<ApiResponse<User>>("/api/users", { method: "POST", body: JSON.stringify(user) }),
    update: (id: number, user: Partial<User>) => request<ApiResponse<User>>("/api/users/" + id, { method: "PUT", body: JSON.stringify(user) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/users/" + id, { method: "DELETE" }),
    search: (keyword: string) => request<ApiResponse<User[]>>("/api/users/search?keyword=" + encodeURIComponent(keyword), { method: "GET" }),
};

export const rolesApi = {
    getAll: () => request<ApiResponse<Role[]>>("/api/roles", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Role>>("/api/roles/" + id, { method: "GET" }),
    create: (role: Partial<Role>) => request<ApiResponse<Role>>("/api/roles", { method: "POST", body: JSON.stringify(role) }),
    update: (id: number, role: Partial<Role>) => request<ApiResponse<Role>>("/api/roles/" + id, { method: "PUT", body: JSON.stringify(role) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/roles/" + id, { method: "DELETE" }),
};

export const permissionsApi = {
    getAll: () => request<ApiResponse<Permission[]>>("/api/permissions", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Permission>>("/api/permissions/" + id, { method: "GET" }),
    getByModule: (module: string) => request<ApiResponse<Permission[]>>("/api/permissions/module/" + module, { method: "GET" }),
    create: (permission: Partial<Permission>) => request<ApiResponse<Permission>>("/api/permissions", { method: "POST", body: JSON.stringify(permission) }),
    update: (id: number, permission: Partial<Permission>) => request<ApiResponse<Permission>>("/api/permissions/" + id, { method: "PUT", body: JSON.stringify(permission) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/permissions/" + id, { method: "DELETE" }),
};

export const releasesApi = {
    getAll: () => request<ApiResponse<Release[]>>("/api/releases", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Release>>("/api/releases/" + id, { method: "GET" }),
    getByAppName: (appName: string) => request<ApiResponse<Release[]>>("/api/releases/app/" + encodeURIComponent(appName), { method: "GET" }),
    create: (release: ReleaseFormData) => request<ApiResponse<Release>>("/api/releases", { method: "POST", body: JSON.stringify(release) }),
    update: (id: number, release: Partial<ReleaseFormData>) => request<ApiResponse<Release>>("/api/releases/" + id, { method: "PUT", body: JSON.stringify(release) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/releases/" + id, { method: "DELETE" }),
    getImpactAnalysis: (releaseId: number) => request<ApiResponse<ImpactAnalysis>>("/api/releases/" + releaseId + "/impact", { method: "GET" }),
};

export const agentsApi = {
    getAll: () => request<ApiResponse<Agent[]>>("/api/agents", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<Agent>>("/api/agents/" + id, { method: "GET" }),
    getByAppName: (appName: string) => request<ApiResponse<Agent[]>>("/api/agents/app/" + encodeURIComponent(appName), { method: "GET" }),
    getByStatus: (status: string) => request<ApiResponse<Agent[]>>("/api/agents/status/" + status, { method: "GET" }),
    create: (agent: AgentFormData) => request<ApiResponse<Agent>>("/api/agents", { method: "POST", body: JSON.stringify(agent) }),
    update: (id: number, agent: Partial<AgentFormData>) => request<ApiResponse<Agent>>("/api/agents/" + id, { method: "PUT", body: JSON.stringify(agent) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/agents/" + id, { method: "DELETE" }),
    search: (keyword: string) => request<ApiResponse<Agent[]>>("/api/agents/search?keyword=" + encodeURIComponent(keyword), { method: "GET" }),
};

// Agent 管控 API
export const agentManagementApi = {
    // 插件管理
    getPlugins: (agentId: number) => request<ApiResponse<any[]>>("/api/agent-management/" + agentId + "/plugins", { method: "GET" }),
    addPlugin: (agentId: number, plugin: any) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/plugins", { method: "POST", body: JSON.stringify(plugin) }),
    updatePlugin: (pluginId: number, plugin: any) => request<ApiResponse<any>>("/api/agent-management/plugins/" + pluginId, { method: "PUT", body: JSON.stringify(plugin) }),
    enablePlugin: (pluginId: number) => request<ApiResponse<any>>("/api/agent-management/plugins/" + pluginId + "/enable", { method: "PUT" }),
    disablePlugin: (pluginId: number) => request<ApiResponse<any>>("/api/agent-management/plugins/" + pluginId + "/disable", { method: "PUT" }),
    deletePlugin: (pluginId: number) => request<ApiResponse<void>>("/api/agent-management/plugins/" + pluginId, { method: "DELETE" }),
    
    // 配置管理
    getConfigs: (agentId: number) => request<ApiResponse<any[]>>("/api/agent-management/" + agentId + "/configs", { method: "GET" }),
    addConfig: (agentId: number, config: any) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/configs", { method: "POST", body: JSON.stringify(config) }),
    updateConfig: (configId: number, value: string) => request<ApiResponse<any>>("/api/agent-management/configs/" + configId, { method: "PUT", body: JSON.stringify({ value }) }),
    resetConfig: (configId: number) => request<ApiResponse<any>>("/api/agent-management/configs/" + configId + "/reset", { method: "PUT" }),
    deleteConfig: (configId: number) => request<ApiResponse<void>>("/api/agent-management/configs/" + configId, { method: "DELETE" }),
    
    // 命令管理
    getCommands: (agentId: number) => request<ApiResponse<any[]>>("/api/agent-management/" + agentId + "/commands", { method: "GET" }),
    sendCommand: (agentId: number, type: string, data: string) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/commands", { method: "POST", body: JSON.stringify({ type, data }) }),
    restartAgent: (agentId: number) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/restart", { method: "POST" }),
    hotReloadAgent: (agentId: number) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/hot-reload", { method: "POST" }),
    upgradeAgent: (agentId: number) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/upgrade", { method: "POST" }),
    updateAgentConfig: (agentId: number, config: any) => request<ApiResponse<any>>("/api/agent-management/" + agentId + "/update-config", { method: "POST", body: JSON.stringify(config) }),
    
    // 批量操作
    batchUpgrade: (agentIds: number[]) => request<ApiResponse<any[]>>("/api/agent-management/batch-upgrade", { method: "POST", body: JSON.stringify(agentIds) }),
    batchHotReload: (agentIds: number[]) => request<ApiResponse<any[]>>("/api/agent-management/batch-reload", { method: "POST", body: JSON.stringify(agentIds) }),
    
    // 插件市场
    getMarketPlugins: () => request<ApiResponse<any[]>>("/api/agent-management/market/plugins", { method: "GET" }),
};

export const alertRulesApi = {
    getAll: () => request<ApiResponse<AlertRule[]>>("/api/alert-rules", { method: "GET" }),
    getById: (id: number) => request<ApiResponse<AlertRule>>("/api/alert-rules/" + id, { method: "GET" }),
    getByAppName: (appName: string) => request<ApiResponse<AlertRule[]>>("/api/alert-rules/app/" + encodeURIComponent(appName), { method: "GET" }),
    create: (rule: AlertRuleFormData) => request<ApiResponse<AlertRule>>("/api/alert-rules", { method: "POST", body: JSON.stringify(rule) }),
    update: (id: number, rule: Partial<AlertRuleFormData>) => request<ApiResponse<AlertRule>>("/api/alert-rules/" + id, { method: "PUT", body: JSON.stringify(rule) }),
    delete: (id: number) => request<ApiResponse<void>>("/api/alert-rules/" + id, { method: "DELETE" }),
    toggleStatus: (id: number, status: string) => request<ApiResponse<AlertRule>>("/api/alert-rules/" + id + "/status", { method: "PUT", body: JSON.stringify({ status }) }),
    search: (keyword: string) => request<ApiResponse<AlertRule[]>>("/api/alert-rules/search?keyword=" + encodeURIComponent(keyword), { method: "GET" }),
};

export const jvmApi = {
    getApplications: () => request<ApiResponse<string[]>>("/api/jvm/applications", { method: "GET" }),
    getHostMetrics: (appName: string) => request<ApiResponse<Record<string, any>>>("/api/jvm/host-metrics?appName=" + encodeURIComponent(appName), { method: "GET" }),
    getHeapMemData: () => request<ApiResponse<Record<string, any>[]>>("/api/jvm/heap-mem", { method: "GET" }),
    getThreadData: () => request<ApiResponse<Record<string, any>[]>>("/api/jvm/threads", { method: "GET" }),
    getGcData: () => request<ApiResponse<Record<string, any>[]>>("/api/jvm/gc", { method: "GET" }),
    getNetworkData: () => request<ApiResponse<Record<string, any>[]>>("/api/jvm/network", { method: "GET" }),
    getClassLoadingStats: () => request<ApiResponse<Record<string, any>>>("/api/jvm/class-loading", { method: "GET" }),
};

export const traceApi = {
    getTraces: (params?: TraceSearchParams) => {
        let query = "";
        if (params) {
            const qp: string[] = [];
            if (params.appName) qp.push("appName=" + encodeURIComponent(params.appName));
            if (params.spanType) qp.push("spanType=" + encodeURIComponent(params.spanType));
            if (params.hours) qp.push("hours=" + params.hours);
            else qp.push("hours=24");
            query = "?" + qp.join("&");
        }
        return request<ApiResponse<TraceSpan[]>>("/apm/traces" + query, { method: "GET" });
    },
    getTraceById: (traceId: string) =>
        request<ApiResponse<TraceDetail>>("/apm/trace/" + traceId, { method: "GET" }),
    getStats: () =>
        request<ApiResponse<TraceStats>>("/apm/stats", { method: "GET" }),
};

export const serviceDepApi = {
    getAll: () => request<ApiResponse<any[]>>("/api/topology", { method: "GET" }),
};

export const healthCheckApi = {
    getStatus: () => request<ApiResponse<any>>("/api/health", { method: "GET" }),
};

export const logsApi = {
    queryLogs: (params?: { level?: string; keyword?: string; page?: number; size?: number }) => {
        let query = "";
        if (params) {
            const qp: string[] = [];
            if (params.level) qp.push("level=" + encodeURIComponent(params.level));
            if (params.keyword) qp.push("keyword=" + encodeURIComponent(params.keyword));
            if (params.page !== undefined) qp.push("page=" + params.page);
            if (params.size !== undefined) qp.push("size=" + params.size);
            query = "?" + qp.join("&");
        }
        return request<ApiResponse<any>>("/api/logs" + query, { method: "GET" });
    },
};

export { request };
