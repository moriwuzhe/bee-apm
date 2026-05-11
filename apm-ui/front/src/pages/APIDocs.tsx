import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Book, Terminal, Copy, Check, ExternalLink, ChevronDown, ChevronRight, Search, Download, RefreshCw, AlertTriangle, Settings, Activity, Shield, Zap, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu, CheckCircle, XCircle, Users, Key, Lock, Plus } from "lucide-react";

interface APICategory {
  name: string;
  description: string;
  endpoints: APIEndpoint[];
}

interface APIEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE";
  path: string;
  description: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
  requestBody?: { description: string; example: string };
  response?: { description: string; example: string };
}

interface APIStats {
  totalAPIs: number;
  documentedAPIs: number;
  avgResponseTime: number;
  apiCalls: number;
}

interface RecentAPI {
  endpoint: string;
  method: string;
  status: string;
  calls: number;
  lastCall: string;
}

interface APIUsage {
  api: string;
  calls: number;
  errors: number;
  avgTime: number;
}

const apiCategories: APICategory[] = [
  {
    name: "链路追踪",
    description: "用于接收和查询链路追踪数据",
    endpoints: [
      {
        method: "POST",
        path: "/apm/report",
        description: "上报链路追踪数据",
        requestBody: {
          description: "链路追踪Span数据列表",
          example: `[
  {
    "traceId": "abc123",
    "spanId": "span-1",
    "parentSpanId": null,
    "spanType": "HTTP",
    "appName": "order-service",
    "serviceName": "OrderService",
    "methodName": "createOrder",
    "timestamp": 1705312335123,
    "duration": 45,
    "success": true,
    "tags": { "env": "production" }
  }
]`
        },
        response: {
          description: "返回成功状态",
          example: `{ "success": true, "message": "数据接收成功" }`
        }
      },
      {
        method: "GET",
        path: "/apm/traces",
        description: "获取链路列表",
        parameters: [
          { name: "appName", type: "string", required: false, description: "应用名称筛选" },
          { name: "startTime", type: "long", required: false, description: "开始时间戳" },
          { name: "endTime", type: "long", required: false, description: "结束时间戳" }
        ],
        response: {
          description: "链路列表数据",
          example: `{ "data": [...], "total": 100 }`
        }
      },
      {
        method: "GET",
        path: "/apm/trace/{traceId}",
        description: "获取指定链路的详细信息",
        parameters: [
          { name: "traceId", type: "string", required: true, description: "链路ID" }
        ]
      },
      {
        method: "GET",
        path: "/apm/stats",
        description: "获取链路统计数据"
      }
    ]
  },
  {
    name: "健康检查",
    description: "系统服务健康状态检查",
    endpoints: [
      {
        method: "GET",
        path: "/health",
        description: "检查后端服务健康状态",
        response: {
          description: "健康状态",
          example: `{ "status": "UP", "timestamp": 1705312335123 }`
        }
      },
      {
        method: "GET",
        path: "/actuator/health",
        description: "Spring Boot Actuator健康检查端点"
      }
    ]
  },
  {
    name: "Agent管理",
    description: "Java Agent注册和管理",
    endpoints: [
      {
        method: "POST",
        path: "/agent/register",
        description: "注册Agent实例",
        requestBody: {
          description: "Agent配置信息",
          example: `{
  "agentId": "agent-001",
  "appName": "order-service",
  "host": "192.168.1.100",
  "port": 9999,
  "version": "v1.2.0"
}`
        }
      },
      {
        method: "GET",
        path: "/agent/list",
        description: "获取已注册的Agent列表"
      },
      {
        method: "DELETE",
        path: "/agent/{agentId}",
        description: "注销指定Agent"
      }
    ]
  },
  {
    name: "配置管理",
    description: "系统配置和设置",
    endpoints: [
      {
        method: "GET",
        path: "/config/themes",
        description: "获取可用的主题列表"
      },
      {
        method: "PUT",
        path: "/config/theme/{themeId}",
        description: "切换当前主题"
      },
      {
        method: "GET",
        path: "/config/settings",
        description: "获取系统设置"
      }
    ]
  }
];

const methodColors: Record<string, { bg: string; text: string }> = {
  GET: { bg: "rgba(0, 214, 143, 0.15)", text: "#00D68F" },
  POST: { bg: "rgba(22, 93, 255, 0.15)", text: "#165DFF" },
  PUT: { bg: "rgba(255, 170, 0, 0.15)", text: "#FFAA00" },
  DELETE: { bg: "rgba(255, 77, 79, 0.15)", text: "#FF4D4F" },
};

export default function APIDocs() {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["链路追踪"]));
  const [expandedEndpoints, setExpandedEndpoints] = useState<Set<string>>(new Set());
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedEndpoints, setSelectedEndpoints] = useState<Set<string>>(new Set());
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRealtime, setIsRealtime] = useState(true);

  const apiStats: APIStats = {
    totalAPIs: 15,
    documentedAPIs: 12,
    avgResponseTime: 45,
    apiCalls: 12847
  };

  const recentAPIs: RecentAPI[] = [
    { endpoint: "/apm/report", method: "POST", status: "success", calls: 1250, lastCall: "2秒前" },
    { endpoint: "/apm/traces", method: "GET", status: "success", calls: 890, lastCall: "5秒前" },
    { endpoint: "/apm/trace/{traceId}", method: "GET", status: "success", calls: 756, lastCall: "12秒前" },
    { endpoint: "/health", method: "GET", status: "success", calls: 2340, lastCall: "1秒前" },
    { endpoint: "/agent/register", method: "POST", status: "success", calls: 45, lastCall: "3分钟前" },
    { endpoint: "/config/themes", method: "GET", status: "error", calls: 128, lastCall: "10分钟前" },
  ];

  const apiUsage: APIUsage[] = [
    { api: "/apm/report", calls: 1250, errors: 3, avgTime: 32 },
    { api: "/apm/traces", calls: 890, errors: 12, avgTime: 156 },
    { api: "/health", calls: 2340, errors: 0, avgTime: 8 },
    { api: "/agent/register", calls: 45, errors: 2, avgTime: 89 },
    { api: "/config/themes", calls: 128, errors: 8, avgTime: 45 },
  ];

  const healthStatus = {
    overall: "healthy",
    services: [
      { name: "APM Collector", status: "healthy", uptime: "99.9%", latency: "32ms" },
      { name: "Trace Storage", status: "healthy", uptime: "99.7%", latency: "156ms" },
      { name: "Agent Registry", status: "healthy", uptime: "100%", latency: "89ms" },
      { name: "Config Service", status: "degraded", uptime: "98.5%", latency: "45ms" },
    ]
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1500);
  };

  const handleExport = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      categories: apiCategories
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "api-docs-export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoints((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const copyToClipboard = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const filteredCategories = apiCategories
    .map((cat) => ({
      ...cat,
      endpoints: cat.endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          ep.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
          ep.method.toLowerCase().includes(searchKeyword.toLowerCase())
      ),
    }))
    .filter((cat) => cat.endpoints.length > 0);

  return (
    <MainLayout 
      title="API文档"
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            <Plus size={16} />
            新建API
          </button>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "var(--muted)", color: "var(--foreground)" }}
          >
            <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
            刷新
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
            style={{ background: "#165DFF", color: "white" }}
          >
            <Download size={16} />
            导出文档
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* API统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Server size={20} style={{ color: "#165DFF" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>总API数</p>
                <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{apiStats.totalAPIs}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>已文档化</p>
                <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{apiStats.documentedAPIs}</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <Clock size={20} style={{ color: "#FFAA00" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均响应时间</p>
                <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{apiStats.avgResponseTime}ms</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <Activity size={20} style={{ color: "#FF4D4F" }} />
              </div>
              <div>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>API调用次数</p>
                <p className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>{apiStats.apiCalls.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 最近API调用 & API健康状态 */}
        <div className="grid grid-cols-2 gap-4">
          {/* 最近API调用列表 */}
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>最近API调用</h3>
              <TrendingUp size={16} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <div className="space-y-3">
              {recentAPIs.map((api, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-1.5 py-0.5 rounded text-xs font-medium"
                      style={{ background: methodColors[api.method].bg, color: methodColors[api.method].text }}
                    >
                      {api.method}
                    </span>
                    <code className="text-xs" style={{ color: "var(--foreground)" }}>{api.endpoint}</code>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: api.status === "success" ? "#00D68F" : "#FF4D4F" }}>
                      {api.status === "success" ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    </span>
                    <span style={{ color: "var(--muted-foreground)" }}>{api.lastCall}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* API健康状态 */}
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>API健康状态</h3>
              <Shield size={16} style={{ color: healthStatus.overall === "healthy" ? "#00D68F" : "#FFAA00" }} />
            </div>
            <div className="space-y-3">
              {healthStatus.services.map((service, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wifi size={14} style={{ color: service.status === "healthy" ? "#00D68F" : "#FFAA00" }} />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{service.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span style={{ color: "var(--muted-foreground)" }}>延迟: {service.latency}</span>
                    <span style={{ color: service.status === "healthy" ? "#00D68F" : "#FFAA00" }}>
                      {service.uptime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* API使用分布图表 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>API使用分布</h3>
            <BarChart3 size={16} style={{ color: "var(--muted-foreground)" }} />
          </div>
          <div className="space-y-3">
            {apiUsage.map((usage, index) => {
              const maxCalls = Math.max(...apiUsage.map(u => u.calls));
              const percentage = (usage.calls / maxCalls) * 100;
              return (
                <div key={index} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <code style={{ color: "var(--foreground)" }}>{usage.api}</code>
                    <div className="flex items-center gap-3">
                      <span style={{ color: "var(--muted-foreground)" }}>{usage.calls} 调用</span>
                      <span style={{ color: usage.errors > 0 ? "#FF4D4F" : "#00D68F" }}>{usage.errors} 错误</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{usage.avgTime}ms</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${percentage}%`, background: "#165DFF" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 头部 */}
        <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
              <Book size={24} style={{ color: "#165DFF" }} />
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>API 文档</h1>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Bee APM 后端服务 RESTful API 参考</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
              <div className="w-2 h-2 rounded-full" style={{ background: "#00D68F" }} />
              <span className="text-xs" style={{ color: "#00D68F" }}>后端运行中</span>
            </div>
            <a
              href="http://localhost:8081"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs"
              style={{ color: "#165DFF" }}
            >
              http://localhost:8081
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* 搜索 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索 API..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
        </div>

        {/* API列表 */}
        <div className="space-y-4">
          {filteredCategories.map((category) => (
            <div key={category.name} className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-input transition-colors"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center gap-3">
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                  ) : (
                    <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
                  )}
                  <div>
                    <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{category.name}</h2>
                    <p className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{category.description}</p>
                  </div>
                </div>
                <span className="text-xs px-2 py-1 rounded" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                  {category.endpoints.length} 接口
                </span>
              </div>

              {expandedCategories.has(category.name) && (
                <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {category.endpoints.map((endpoint) => {
                    const isExpanded = expandedEndpoints.has(endpoint.path);
                    const methodStyle = methodColors[endpoint.method];

                    return (
                      <div key={endpoint.path}>
                        <div
                          className="flex items-center gap-4 p-4 cursor-pointer hover:bg-input transition-colors"
                          onClick={() => toggleEndpoint(endpoint.path)}
                        >
                          <button className="flex-shrink-0">
                            {isExpanded ? (
                              <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                            ) : (
                              <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
                            )}
                          </button>
                          <span
                            className="px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                            style={{ background: methodStyle.bg, color: methodStyle.text }}
                          >
                            {endpoint.method}
                          </span>
                          <code className="text-sm flex-1 truncate" style={{ color: "var(--foreground)" }}>
                            {endpoint.path}
                          </code>
                          <span className="text-xs hidden md:inline" style={{ color: "var(--muted-foreground)" }}>
                            {endpoint.description}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`curl -X ${endpoint.method} http://localhost:8081${endpoint.path}`, endpoint.path);
                            }}
                            className="p-1.5 rounded hover:bg-input transition-colors flex-shrink-0"
                            title="复制API命令"
                          >
                            {copiedPath === endpoint.path ? (
                              <Check size={14} style={{ color: "#00D68F" }} />
                            ) : (
                              <Copy size={14} style={{ color: "var(--muted-foreground)" }} />
                            )}
                          </button>
                        </div>

                        {isExpanded && (
                          <div className="px-4 pb-4 ml-10 space-y-4">
                            <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>{endpoint.description}</p>

                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div>
                                <h3 className="text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>参数</h3>
                                <div className="space-y-2">
                                  {endpoint.parameters.map((param) => (
                                    <div key={param.name} className="flex items-start gap-3 text-xs">
                                      <code className="px-2 py-1 rounded" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                                        {param.name}
                                      </code>
                                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                        <span className="font-medium">{param.type}</span>
                                        {param.required && <span style={{ color: "#FF4D4F" }}> *必填</span>}
                                        {" - "}{param.description}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {endpoint.requestBody && (
                              <div>
                                <h3 className="text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>请求体</h3>
                                <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{endpoint.requestBody.description}</p>
                                <pre className="p-3 rounded-lg text-xs overflow-x-auto" style={{ background: "#0B1120", color: "#94A3B8" }}>
                                  {endpoint.requestBody.example}
                                </pre>
                              </div>
                            )}

                            {endpoint.response && (
                              <div>
                                <h3 className="text-xs font-medium mb-2" style={{ color: "var(--foreground)" }}>响应</h3>
                                <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{endpoint.response.description}</p>
                                <pre className="p-3 rounded-lg text-xs overflow-x-auto" style={{ background: "#0B1120", color: "#94A3B8" }}>
                                  {endpoint.response.example}
                                </pre>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyToClipboard(`curl -X ${endpoint.method} http://localhost:8081${endpoint.path}`, endpoint.path)}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
                                style={{ background: "var(--muted)", color: "var(--foreground)" }}
                              >
                                <Terminal size={12} />
                                复制cURL命令
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}