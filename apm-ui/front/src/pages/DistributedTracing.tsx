import { useState, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { GitBranch, RefreshCw, Download, AlertTriangle, CheckCircle, Clock, Search, Filter, ArrowRight, Activity, Zap, Target, Layers, Server, Database, ExternalLink, ChevronRight, Eye, Copy, Play, Pause, Gauge, BarChart3, TrendingUp, AlertCircle } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface Trace {
  id: string;
  traceId: string;
  name: string;
  duration: number;
  status: "success" | "error" | "warning";
  timestamp: string;
  spans: number;
  services: string[];
  latency: { total: number; network: number; db: number; external: number };
}

interface Span {
  id: string;
  traceId: string;
  parentId: string | null;
  name: string;
  service: string;
  duration: number;
  status: "success" | "error" | "warning";
  start: number;
  tags: { key: string; value: string }[];
}

const mockTraces: Trace[] = [
  { id: "1", traceId: "abc123...", name: "订单创建流程", duration: 456, status: "success", timestamp: "2分钟前", spans: 12, services: ["order-service", "payment-service", "user-service"], latency: { total: 456, network: 23, db: 234, external: 123 } },
  { id: "2", traceId: "def456...", name: "支付处理流程", duration: 1234, status: "error", timestamp: "5分钟前", spans: 8, services: ["payment-service", "bank-gateway"], latency: { total: 1234, network: 45, db: 123, external: 890 } },
  { id: "3", traceId: "ghi789...", name: "用户登录流程", duration: 156, status: "success", timestamp: "1分钟前", spans: 6, services: ["user-service", "auth-service"], latency: { total: 156, network: 12, db: 78, external: 34 } },
  { id: "4", traceId: "jkl012...", name: "商品查询流程", duration: 89, status: "success", timestamp: "3分钟前", spans: 4, services: ["product-service", "cache-service"], latency: { total: 89, network: 8, db: 23, external: 45 } },
  { id: "5", traceId: "mno345...", name: "订单取消流程", duration: 567, status: "warning", timestamp: "4分钟前", spans: 10, services: ["order-service", "payment-service", "inventory-service"], latency: { total: 567, network: 34, db: 189, external: 234 } },
];

const mockSpans: Span[] = [
  { id: "s1", traceId: "abc123...", parentId: null, name: "HTTP POST /api/v1/orders", service: "api-gateway", duration: 456, status: "success", start: 0, tags: [{ key: "http.method", value: "POST" }, { key: "http.status_code", value: "200" }], type: "http" },
  { id: "s2", traceId: "abc123...", parentId: "s1", name: "createOrder", service: "order-service", duration: 345, status: "success", start: 23, tags: [{ key: "db.operation", value: "INSERT" }, { key: "db.table", value: "orders" }], type: "db" },
  { id: "s3", traceId: "abc123...", parentId: "s2", name: "checkInventory", service: "inventory-service", duration: 123, status: "success", start: 67, tags: [{ key: "cache.hit", value: "true" }], type: "cache" },
  { id: "s4", traceId: "abc123...", parentId: "s2", name: "processPayment", service: "payment-service", duration: 189, status: "success", start: 200, tags: [{ key: "external.system", value: "bank-gateway" }, { key: "payment.status", value: "approved" }], type: "external" },
  { id: "s5", traceId: "abc123...", parentId: "s4", name: "verifyUser", service: "user-service", duration: 89, status: "success", start: 245, tags: [{ key: "auth.status", value: "valid" }], type: "rpc" },
];

const latencyDistributionData = [
  { range: "0-50ms", count: 156, percentage: 35 },
  { range: "50-100ms", count: 123, percentage: 28 },
  { range: "100-200ms", count: 89, percentage: 20 },
  { range: "200-500ms", count: 56, percentage: 12 },
  { range: ">500ms", count: 22, percentage: 5 },
];

const serviceStats = [
  { service: "api-gateway", calls: 1245, avgLatency: 45, p95: 123, errors: 12 },
  { service: "order-service", calls: 892, avgLatency: 156, p95: 345, errors: 8 },
  { service: "payment-service", calls: 654, avgLatency: 234, p95: 567, errors: 23 },
  { service: "user-service", calls: 1567, avgLatency: 34, p95: 89, errors: 5 },
  { service: "inventory-service", calls: 443, avgLatency: 67, p95: 145, errors: 3 },
];

const traceTrendData = [
  { time: "00:00", count: 120, avgLatency: 156 },
  { time: "04:00", count: 89, avgLatency: 134 },
  { time: "08:00", count: 345, avgLatency: 234 },
  { time: "12:00", count: 456, avgLatency: 345 },
  { time: "16:00", count: 389, avgLatency: 289 },
  { time: "20:00", count: 234, avgLatency: 198 },
];

export default function DistributedTracing() {
  const [activeTab, setActiveTab] = useState<"traces" | "analysis" | "compare">("traces");
  const [selectedTrace, setSelectedTrace] = useState<Trace | null>(mockTraces[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredTraces = mockTraces.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.traceId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const successCount = mockTraces.filter(t => t.status === "success").length;
  const errorCount = mockTraces.filter(t => t.status === "error").length;
  const avgDuration = (mockTraces.reduce((sum, t) => sum + t.duration, 0) / mockTraces.length).toFixed(0);
  const totalSpans = mockTraces.reduce((sum, t) => sum + t.spans, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertTriangle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "error": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "success": return "rgba(0, 214, 143, 0.1)";
      case "warning": return "rgba(250, 173, 20, 0.1)";
      case "error": return "rgba(255, 77, 79, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success": return "#00D68F";
      case "warning": return "#FAAD14";
      case "error": return "#FF4D4F";
      default: return "#94A3B8";
    }
  };

  const getServiceColor = (service: string) => {
    const colors: Record<string, string> = {
      "api-gateway": "#1890FF",
      "order-service": "#FAAD14",
      "payment-service": "#FF4D4F",
      "user-service": "#52C41A",
      "auth-service": "#722ED1",
      "product-service": "#13C2C2",
      "cache-service": "#EB2F96",
      "inventory-service": "#FA8C16",
      "bank-gateway": "#A0D911",
    };
    return colors[service] || "#94A3B8";
  };

  const maxDuration = selectedTrace ? selectedTrace.duration : 500;

  return (
    <MainLayout title="分布式追踪">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("traces")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "traces" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "traces" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "traces" ? "white" : "var(--foreground)"
              }}
            >
              追踪列表
            </button>
            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "analysis" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "analysis" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "analysis" ? "white" : "var(--foreground)"
              }}
            >
              分析视图
            </button>
            <button
              onClick={() => setActiveTab("compare")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "compare" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "compare" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "compare" ? "white" : "var(--foreground)"
              }}
            >
              对比分析
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
              导出追踪
            </button>
          </div>
        </div>

        {activeTab === "traces" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功追踪</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{successCount}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>失败追踪</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{errorCount}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均耗时</div>
                    <div className="text-2xl font-bold">{avgDuration}ms</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <GitBranch className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总Span数</div>
                    <div className="text-2xl font-bold">{totalSpans}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 搜索 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="搜索追踪ID或名称..."
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

            <div className="grid grid-cols-3 gap-4">
              {/* 追踪列表 */}
              <div className="col-span-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="p-3 border-b" style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                  <span className="text-sm font-medium">追踪列表</span>
                </div>
                <div className="max-h-[600px] overflow-y-auto">
                  {filteredTraces.map((trace) => (
                    <div
                      key={trace.id}
                      onClick={() => setSelectedTrace(trace)}
                      className={`p-3 cursor-pointer border-b transition-all ${selectedTrace?.id === trace.id ? "bg-primary/10" : ""}`}
                      style={{ borderBottom: "1px solid var(--border)" }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{trace.name}</span>
                        {getStatusIcon(trace.status)}
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{trace.traceId}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{trace.duration}ms</span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{trace.timestamp}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 追踪详情 */}
              <div className="col-span-2 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {selectedTrace && (
                  <>
                    <div className="p-4 border-b" style={{ borderBottom: "1px solid var(--border)" }}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{selectedTrace.name}</h3>
                            {getStatusIcon(selectedTrace.status)}
                          </div>
                          <div className="text-sm mt-1" style={{ color: "var(--muted-foreground)" }}>
                            Trace ID: {selectedTrace.traceId} • {selectedTrace.spans} spans
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{selectedTrace.duration}ms</div>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{selectedTrace.timestamp}</div>
                        </div>
                      </div>
                    </div>

                    {/* 火焰图区域 */}
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-sm font-medium">执行时间线</span>
                        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>0ms</span>
                        <span className="text-xs ml-auto" style={{ color: "var(--muted-foreground)" }}>{selectedTrace.duration}ms</span>
                      </div>

                      <div className="space-y-3">
                        {mockSpans.filter(s => s.traceId === selectedTrace.traceId).map((span) => (
                          <div key={span.id} className="flex items-center gap-3">
                            <div className="w-32 text-sm truncate" style={{ color: "var(--muted-foreground)" }}>{span.service}</div>
                            <div className="flex-1 h-8 relative">
                              <div className="absolute inset-y-0 left-0 w-full flex">
                                {mockSpans.filter(s => s.traceId === selectedTrace.traceId).map((s) => (
                                  <div
                                    key={s.id}
                                    className="rounded-sm transition-all hover:opacity-80"
                                    style={{
                                      width: `${(s.duration / maxDuration) * 100}%`,
                                      background: getServiceColor(s.service),
                                      marginLeft: `${(s.start / maxDuration) * 100}%`,
                                    }}
                                    title={`${s.name}: ${s.duration}ms`}
                                  />
                                ))}
                              </div>
                            </div>
                            <div className="w-20 text-right text-sm">{span.duration}ms</div>
                          </div>
                        ))}
                      </div>

                      {/* 延迟分布 */}
                      <div className="mt-6 p-4 rounded-lg" style={{ background: "var(--muted)" }}>
                        <div className="text-sm font-medium mb-3">延迟分布</div>
                        <div className="grid grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedTrace.latency.total}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总延迟(ms)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedTrace.latency.network}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>网络延迟(ms)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedTrace.latency.db}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据库(ms)</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold">{selectedTrace.latency.external}</div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>外部调用(ms)</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "analysis" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">今日追踪数</span>
                </div>
                <div className="text-2xl font-bold">1,234</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+12% 较昨日</span>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <Gauge className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm font-medium">平均延迟</span>
                </div>
                <div className="text-2xl font-bold">189ms</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-red-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>+5% 较昨日</span>
                </div>
              </div>
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium">异常追踪</span>
                </div>
                <div className="text-2xl font-bold">23</div>
                <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                  <TrendingUp className="w-3 h-3" />
                  <span>-8% 较昨日</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">延迟分布</span>
                  </div>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>今日数据</span>
                </div>
                <div className="space-y-3">
                  {latencyDistributionData.map((item) => (
                    <div key={item.range}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.range}</span>
                        <span className="text-xs">{item.count} ({item.percentage}%)</span>
                      </div>
                      <div className="h-2 rounded-full" style={{ background: "var(--muted)" }}>
                        <div 
                          className="h-full rounded-full transition-all" 
                          style={{ 
                            width: `${item.percentage}%`,
                            background: item.percentage > 20 ? "#165DFF" : item.percentage > 10 ? "#A855F7" : "#64748B"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">服务性能排行</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {serviceStats.map((stat, index) => (
                    <div key={stat.service} className="flex items-center gap-3 p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                      <span className="text-xs font-bold w-5" style={{ color: "#64748B" }}>{index + 1}</span>
                      <div className="flex-1">
                        <div className="text-xs font-medium">{stat.service}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{stat.calls} 次调用</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold">{stat.avgLatency}ms</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>P95: {stat.p95}ms</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm font-medium">追踪趋势</span>
                </div>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>最近 24 小时</span>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={traceTrendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="time" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 9 }} />
                    <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 9 }} />
                    <Tooltip contentStyle={{ background: "#1E293B", border: "none" }} />
                    <Line yAxisId="left" type="monotone" dataKey="count" name="追踪数" stroke="#165DFF" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="avgLatency" name="平均延迟(ms)" stroke="#FFAA00" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "compare" && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4">
              {mockTraces.slice(0, 4).map((trace) => (
                <div 
                  key={trace.id}
                  className="rounded-xl p-4 cursor-pointer transition-all"
                  style={{ 
                    background: "var(--card)", 
                    border: `1px solid ${selectedTrace?.id === trace.id ? "#165DFF" : "var(--border)"}`,
                    borderLeft: selectedTrace?.id === trace.id ? "3px solid #165DFF" : "3px solid transparent"
                  }}
                  onClick={() => setSelectedTrace(trace)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusIcon(trace.status)}
                    <span className="text-sm font-medium">{trace.name}</span>
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{trace.traceId}</div>
                  <div className="mt-3">
                    <div className="text-lg font-bold">{trace.duration}ms</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{trace.spans} spans</div>
                  </div>
                </div>
              ))}
            </div>

            {selectedTrace && (
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">执行时间线对比</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--muted)" }}>
                      <Play className="w-3 h-3" />
                      播放
                    </button>
                    <button className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs" style={{ background: "var(--muted)" }}>
                      <Copy className="w-3 h-3" />
                      复制ID
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-xs">api-gateway</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-orange-500" />
                    <span className="text-xs">order-service</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-xs">payment-service</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                    <span className="text-xs">user-service</span>
                  </div>
                </div>

                <div className="relative h-20">
                  <div className="absolute inset-0 flex items-end">
                    {mockSpans.filter(s => s.traceId === selectedTrace.traceId).map((span) => (
                      <div 
                        key={span.id}
                        className="flex-1 flex flex-col items-center gap-1"
                      >
                        <div 
                          className="w-full rounded-t-sm"
                          style={{ 
                            height: `${(span.duration / selectedTrace.duration) * 100}%`,
                            background: getServiceColor(span.service),
                            minHeight: 10
                          }}
                        />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{span.duration}ms</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-4">
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总延迟</div>
                    <div className="text-lg font-bold">{selectedTrace.duration}ms</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>网络延迟</div>
                    <div className="text-lg font-bold">{selectedTrace.latency.network}ms</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据库</div>
                    <div className="text-lg font-bold">{selectedTrace.latency.db}ms</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>外部调用</div>
                    <div className="text-lg font-bold">{selectedTrace.latency.external}ms</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
