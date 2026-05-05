import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Book, Terminal, Copy, Check, ExternalLink, ChevronDown, ChevronRight, Search } from "lucide-react";

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
    <MainLayout title="API文档">
      <div className="space-y-4">
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