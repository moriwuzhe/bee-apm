import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Activity, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle, Download, RefreshCw, Search, Filter, BarChart3, Zap, Target, Layers } from "lucide-react";

interface APIEndpoint {
  id: string;
  name: string;
  endpoint: string;
  method: string;
  status: "healthy" | "warning" | "critical";
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
  errorRate: number;
  requests: number;
  throughput: number;
  availability: number;
}

interface APIError {
  id: string;
  endpointId: string;
  errorType: string;
  message: string;
  count: number;
  lastOccurrence: string;
}

const mockEndpoints: APIEndpoint[] = [
  { id: "1", name: "订单创建", endpoint: "/api/v1/orders", method: "POST", status: "healthy", avgLatency: 45.6, p95Latency: 89.2, p99Latency: 156.3, errorRate: 0.05, requests: 12345, throughput: 345, availability: 99.99 },
  { id: "2", name: "订单查询", endpoint: "/api/v1/orders/{id}", method: "GET", status: "healthy", avgLatency: 23.4, p95Latency: 45.6, p99Latency: 78.9, errorRate: 0.01, requests: 45678, throughput: 890, availability: 99.97 },
  { id: "3", name: "支付处理", endpoint: "/api/v1/payments", method: "POST", status: "warning", avgLatency: 125.3, p95Latency: 234.5, p99Latency: 456.7, errorRate: 1.2, requests: 8934, throughput: 234, availability: 99.8 },
  { id: "4", name: "用户登录", endpoint: "/api/v1/users/login", method: "POST", status: "critical", avgLatency: 234.5, p95Latency: 456.7, p99Latency: 890.1, errorRate: 3.5, requests: 15678, throughput: 456, availability: 95.2 },
  { id: "5", name: "商品列表", endpoint: "/api/v1/products", method: "GET", status: "healthy", avgLatency: 18.2, p95Latency: 34.5, p99Latency: 56.7, errorRate: 0.02, requests: 67890, throughput: 1234, availability: 99.99 },
];

const mockErrors: APIError[] = [
  { id: "1", endpointId: "4", errorType: "TimeoutError", message: "Request timeout after 30000ms", count: 123, lastOccurrence: "2分钟前" },
  { id: "2", endpointId: "3", errorType: "ServiceUnavailable", message: "Payment gateway unavailable", count: 45, lastOccurrence: "5分钟前" },
  { id: "3", endpointId: "4", errorType: "AuthenticationError", message: "Invalid token", count: 89, lastOccurrence: "1分钟前" },
  { id: "4", endpointId: "1", errorType: "ValidationError", message: "Missing required field", count: 23, lastOccurrence: "3分钟前" },
];

export default function APIPerformance() {
  const [activeTab, setActiveTab] = useState<"endpoints" | "errors" | "analytics">("endpoints");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredEndpoints = mockEndpoints.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.endpoint.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalRequests = mockEndpoints.reduce((sum, e) => sum + e.requests, 0);
  const avgLatency = (mockEndpoints.reduce((sum, e) => sum + e.avgLatency, 0) / mockEndpoints.length).toFixed(1);
  const avgErrorRate = (mockEndpoints.reduce((sum, e) => sum + e.errorRate, 0) / mockEndpoints.length).toFixed(2);
  const healthyCount = mockEndpoints.filter(e => e.status === "healthy").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertTriangle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "critical": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy": return "rgba(0, 214, 143, 0.1)";
      case "warning": return "rgba(250, 173, 20, 0.1)";
      case "critical": return "rgba(255, 77, 79, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#00D68F";
      case "warning": return "#FAAD14";
      case "critical": return "#FF4D4F";
      default: return "#94A3B8";
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET": return { bg: "rgba(0, 214, 143, 0.1)", color: "#00D68F" };
      case "POST": return { bg: "rgba(24, 144, 255, 0.1)", color: "#1890FF" };
      case "PUT": return { bg: "rgba(250, 173, 20, 0.1)", color: "#FAAD14" };
      case "DELETE": return { bg: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" };
      default: return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8" };
    }
  };

  return (
    <MainLayout title="API性能分析">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("endpoints")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "endpoints" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "endpoints" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "endpoints" ? "white" : "var(--foreground)"
              }}
            >
              端点列表
            </button>
            <button
              onClick={() => setActiveTab("errors")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "errors" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "errors" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "errors" ? "white" : "var(--foreground)"
              }}
            >
              错误追踪
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "analytics" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "analytics" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "analytics" ? "white" : "var(--foreground)"
              }}
            >
              分析报表
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: autoRefresh ? "rgba(0, 214, 143, 0.1)" : "var(--card)",
                border: `1px solid ${autoRefresh ? "#00D68F" : "var(--border)"}`,
                color: autoRefresh ? "#00D68F" : "var(--foreground)"
              }}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "自动刷新" : "已暂停"}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>

        {activeTab === "endpoints" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康端点</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{healthyCount}/{mockEndpoints.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <Zap className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总请求数</div>
                    <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</div>
                    <div className="text-2xl font-bold">{avgLatency}ms</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                    <Activity className="w-6 h-6" style={{ color: "#52C41A" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均错误率</div>
                    <div className="text-2xl font-bold">{avgErrorRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="搜索端点名称或路径..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-lg"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              />
            </div>

            {/* 端点列表 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>端点名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>路径</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>方法</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>延迟(avg/p95/p99)</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>错误率</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>吞吐量</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>可用性</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEndpoints.map((endpoint) => (
                      <tr key={endpoint.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3 font-medium">{endpoint.name}</td>
                        <td className="px-4 py-3 font-mono text-sm">{endpoint.endpoint}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: getMethodColor(endpoint.method).bg,
                              color: getMethodColor(endpoint.method).color
                            }}
                          >
                            {endpoint.method}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={endpoint.avgLatency > 100 ? "text-red-500" : endpoint.avgLatency > 50 ? "text-yellow-500" : ""}>
                            {endpoint.avgLatency}
                          </span>
                          <span className="mx-2 text-gray-400">/</span>
                          <span className={endpoint.p95Latency > 200 ? "text-red-500" : endpoint.p95Latency > 100 ? "text-yellow-500" : ""}>
                            {endpoint.p95Latency}
                          </span>
                          <span className="mx-2 text-gray-400">/</span>
                          <span className={endpoint.p99Latency > 400 ? "text-red-500" : endpoint.p99Latency > 200 ? "text-yellow-500" : ""}>
                            {endpoint.p99Latency}
                          </span>
                          <span className="ml-1 text-xs" style={{ color: "var(--muted-foreground)" }}>ms</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={endpoint.errorRate > 1 ? "text-red-500" : endpoint.errorRate > 0.5 ? "text-yellow-500" : ""}>
                            {endpoint.errorRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3">{endpoint.throughput} req/s</td>
                        <td className="px-4 py-3">
                          <span className={endpoint.availability < 99 ? "text-red-500" : endpoint.availability < 99.9 ? "text-yellow-500" : "text-green-500"}>
                            {endpoint.availability}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(endpoint.status)}
                            <span
                              className="text-sm"
                              style={{ color: getStatusColor(endpoint.status) }}
                            >
                              {endpoint.status === "healthy" ? "健康" : endpoint.status === "warning" ? "警告" : "严重"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "errors" && (
          <div className="space-y-4">
            {mockErrors.map((error) => {
              const endpoint = mockEndpoints.find(e => e.id === error.endpointId);
              return (
                <div
                  key={error.id}
                  className="rounded-lg p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                        <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-red-500">{error.errorType}</span>
                          <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            {endpoint?.endpoint}
                          </span>
                        </div>
                        <p className="text-sm mt-1" style={{ color: "var(--foreground)" }}>{error.message}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">出现 <span className="text-red-500">{error.count}</span> 次</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>最近: {error.lastOccurrence}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">延迟分布</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                直方图显示延迟分布
              </div>
            </div>
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">吞吐量趋势</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                折线图显示吞吐量变化
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
