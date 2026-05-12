import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Network, Zap, Activity, Clock, CheckCircle, AlertTriangle, XCircle, Download, RefreshCw, Search, Filter, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface APIGateway {
  id: string;
  name: string;
  endpoint: string;
  status: "healthy" | "warning" | "critical";
  requests: number;
  latency: number;
  errorRate: number;
  uptime: number;
  rateLimit: { used: number; max: number };
  cacheHit: number;
}

interface Route {
  id: string;
  path: string;
  method: string;
  status: "active" | "inactive";
  requests: number;
  latency: number;
  errorRate: number;
  upstream: string;
}

const mockGateways: APIGateway[] = [
  { id: "1", name: "订单API网关", endpoint: "api.order.internal", status: "healthy", requests: 15678, latency: 23.4, errorRate: 0.05, uptime: 99.99, rateLimit: { used: 85, max: 100 }, cacheHit: 78 },
  { id: "2", name: "支付API网关", endpoint: "api.payment.internal", status: "warning", requests: 8945, latency: 45.6, errorRate: 1.2, uptime: 99.8, rateLimit: { used: 92, max: 100 }, cacheHit: 65 },
  { id: "3", name: "用户API网关", endpoint: "api.user.internal", status: "healthy", requests: 23456, latency: 18.2, errorRate: 0.02, uptime: 99.97, rateLimit: { used: 67, max: 100 }, cacheHit: 82 },
  { id: "4", name: "商品API网关", endpoint: "api.product.internal", status: "critical", requests: 12345, latency: 125.3, errorRate: 3.5, uptime: 95.2, rateLimit: { used: 98, max: 100 }, cacheHit: 45 },
];

const mockRoutes: Route[] = [
  { id: "1", path: "/api/v1/orders", method: "POST", status: "active", requests: 4567, latency: 28.5, errorRate: 0.08, upstream: "order-service" },
  { id: "2", path: "/api/v1/orders/{id}", method: "GET", status: "active", requests: 8934, latency: 15.2, errorRate: 0.01, upstream: "order-service" },
  { id: "3", path: "/api/v1/payments", method: "POST", status: "active", requests: 2345, latency: 55.6, errorRate: 1.5, upstream: "payment-gateway" },
  { id: "4", path: "/api/v1/users", method: "GET", status: "active", requests: 12345, latency: 12.3, errorRate: 0.01, upstream: "user-service" },
  { id: "5", path: "/api/v1/products", method: "GET", status: "inactive", requests: 0, latency: 0, errorRate: 0, upstream: "product-service" },
];

export default function APIGatewayMonitor() {
  const [activeTab, setActiveTab] = useState<"gateways" | "routes" | "analytics">("gateways");
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredRoutes = mockRoutes.filter(route => {
    return searchQuery === "" || 
      route.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      route.method.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const totalRequests = mockGateways.reduce((sum, gw) => sum + gw.requests, 0);
  const avgLatency = (mockGateways.reduce((sum, gw) => sum + gw.latency, 0) / mockGateways.length).toFixed(1);
  const avgErrorRate = (mockGateways.reduce((sum, gw) => sum + gw.errorRate, 0) / mockGateways.length).toFixed(2);
  const healthyCount = mockGateways.filter(gw => gw.status === "healthy").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertTriangle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "critical": return <XCircle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
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

  return (
    <MainLayout title="API网关监控">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("gateways")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "gateways" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "gateways" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "gateways" ? "white" : "var(--foreground)"
              }}
            >
              网关列表
            </button>
            <button
              onClick={() => setActiveTab("routes")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "routes" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "routes" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "routes" ? "white" : "var(--foreground)"
              }}
            >
              路由管理
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

        {activeTab === "gateways" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <Network className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康网关</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{healthyCount}/{mockGateways.length}</div>
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
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误率</div>
                    <div className="text-2xl font-bold">{avgErrorRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 网关列表 */}
            <div className="grid grid-cols-2 gap-4">
              {mockGateways.map((gw) => (
                <div
                  key={gw.id}
                  className="rounded-lg p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg" style={{ background: getStatusBg(gw.status) }}>
                        <Network className="w-6 h-6" style={{ color: getStatusColor(gw.status) }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{gw.name}</h3>
                          {getStatusIcon(gw.status)}
                        </div>
                        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{gw.endpoint}</div>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{ background: getStatusBg(gw.status), color: getStatusColor(gw.status) }}
                    >
                      {gw.status === "healthy" ? "健康" : gw.status === "warning" ? "警告" : "严重"}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>QPS</div>
                      <div className="font-bold">{gw.requests.toLocaleString()}</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>延迟</div>
                      <div className="font-bold">{gw.latency}ms</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误率</div>
                      <div className="font-bold" style={{ color: gw.errorRate > 1 ? "#FF4D4F" : "inherit" }}>{gw.errorRate}%</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>缓存命中</div>
                      <div className="font-bold">{gw.cacheHit}%</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "var(--muted-foreground)" }}>限流使用</span>
                        <span>{gw.rateLimit.used}% / {gw.rateLimit.max}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${gw.rateLimit.used}%`,
                            background: gw.rateLimit.used > 90 ? "#FF4D4F" : "#00D68F"
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>正常运行时间</span>
                      <span className="font-medium">{gw.uptime}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "routes" && (
          <>
            {/* 搜索 */}
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="搜索路由路径..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
            </div>

            {/* 路由列表 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>方法</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>路径</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>上游服务</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>请求数</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>延迟</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>错误率</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.map((route) => (
                      <tr key={route.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: route.method === "GET" ? "rgba(0, 214, 143, 0.1)" :
                                route.method === "POST" ? "rgba(24, 144, 255, 0.1)" : "rgba(250, 173, 20, 0.1)",
                              color: route.method === "GET" ? "#00D68F" :
                                route.method === "POST" ? "#1890FF" : "#FAAD14"
                            }}
                          >
                            {route.method}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium">{route.path}</td>
                        <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{route.upstream}</td>
                        <td className="px-4 py-3">{route.requests.toLocaleString()}</td>
                        <td className="px-4 py-3">{route.latency}ms</td>
                        <td className="px-4 py-3">
                          <span className={route.errorRate > 1 ? "text-red-500" : "inherit"}>{route.errorRate}%</span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: route.status === "active" ? "rgba(0, 214, 143, 0.1)" : "rgba(148, 163, 184, 0.1)",
                              color: route.status === "active" ? "#00D68F" : "#94A3B8"
                            }}
                          >
                            {route.status === "active" ? "活跃" : "停用"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">请求趋势</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                折线图显示请求趋势
              </div>
            </div>
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">延迟分布</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                柱状图显示延迟分布
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
