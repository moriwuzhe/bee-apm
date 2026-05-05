const fs = require('fs');
const path = require('path');

const apiPath = path.join(__dirname, 'src/services/api.ts');
const content = fs.readFileSync(apiPath, 'utf-8');

const mockCode = `import type {
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
import { mockUsers, mockApplications, mockProjects } from "../data/mockData";

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
  return { success: true, data: null } as T;
}

// 通用请求方法
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
}`;

const newContent = content.replace(
  /import type \{[\s\S]*?\} from "\.\.\/types";/,
  mockCode
);

fs.writeFileSync(apiPath, newContent, 'utf-8');
console.log('api.ts updated successfully with mock support!');
