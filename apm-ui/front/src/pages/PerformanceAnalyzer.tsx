import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Activity, TrendingUp, Clock, Database, Wifi, Cpu, BarChart3, LineChart, PieChart, Search, Filter, Download, RefreshCw, AlertTriangle, CheckCircle, Zap } from "lucide-react";

interface PerformanceIssue {
  id: string;
  type: "slow_query" | "memory_leak" | "cpu_spike" | "network_latency" | "deadlock";
  severity: "critical" | "warning" | "info";
  service: string;
  endpoint?: string;
  duration: number;
  timestamp: string;
  description: string;
  suggestion: string;
  impact: string;
}

interface SlowEndpoint {
  method: string;
  path: string;
  avgDuration: number;
  maxDuration: number;
  requests: number;
  errorRate: number;
  trend: "up" | "down" | "stable";
}

interface DatabaseQuery {
  id: string;
  query: string;
  executionTime: number;
  executions: number;
  avgRows: number;
  indexed: boolean;
  status: "good" | "warning" | "critical";
}

const mockPerformanceIssues: PerformanceIssue[] = [
  { id: "1", type: "slow_query", severity: "critical", service: "order-service", endpoint: "/api/orders/search", duration: 5234, timestamp: new Date(Date.now() - 300000).toLocaleString(), description: "订单查询语句执行时间超过5秒", suggestion: "添加复合索引或优化查询条件", impact: "影响用户体验，可能导致超时" },
  { id: "2", type: "memory_leak", severity: "warning", service: "payment-gateway", duration: 0, timestamp: new Date(Date.now() - 1800000).toLocaleString(), description: "内存使用呈现持续增长趋势", suggestion: "检查对象引用，及时释放资源", impact: "长期运行可能导致OOM" },
  { id: "3", type: "cpu_spike", severity: "warning", service: "user-service", duration: 0, timestamp: new Date(Date.now() - 3600000).toLocaleString(), description: "CPU使用率突发性升高", suggestion: "分析热点代码，优化算法", impact: "响应时间增加" },
  { id: "4", type: "network_latency", severity: "info", service: "inventory-service", duration: 0, timestamp: new Date(Date.now() - 7200000).toLocaleString(), description: "与Redis的网络延迟增加", suggestion: "检查网络连接或考虑本地缓存", impact: "轻微性能下降" },
];

const mockSlowEndpoints: SlowEndpoint[] = [
  { method: "GET", path: "/api/orders/search", avgDuration: 2341, maxDuration: 5234, requests: 15678, errorRate: 2.3, trend: "up" },
  { method: "POST", path: "/api/payments", avgDuration: 1892, maxDuration: 3456, requests: 8945, errorRate: 1.2, trend: "stable" },
  { method: "GET", path: "/api/users/profile", avgDuration: 456, maxDuration: 1234, requests: 45678, errorRate: 0.3, trend: "down" },
  { method: "POST", path: "/api/products", avgDuration: 789, maxDuration: 2345, requests: 5678, errorRate: 0.8, trend: "stable" },
];

const mockDatabaseQueries: DatabaseQuery[] = [
  { id: "1", query: "SELECT * FROM orders WHERE user_id = ? AND status = ?", executionTime: 234, executions: 15678, avgRows: 12, indexed: true, status: "good" },
  { id: "2", query: "SELECT * FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE user_id = ?)", executionTime: 1234, executions: 4567, avgRows: 45, indexed: false, status: "critical" },
  { id: "3", query: "UPDATE users SET last_login = ? WHERE id = ?", executionTime: 23, executions: 23456, avgRows: 1, indexed: true, status: "good" },
  { id: "4", query: "SELECT COUNT(*) FROM products WHERE category_id = ? AND status = 'active'", executionTime: 567, executions: 8901, avgRows: 234, indexed: true, status: "warning" },
];

export default function PerformanceAnalyzer() {
  const [activeTab, setActiveTab] = useState<"overview" | "endpoints" | "database" | "issues">("overview");
  const [filterSeverity, setFilterSeverity] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [performanceIssues, setPerformanceIssues] = useState<PerformanceIssue[]>(mockPerformanceIssues);
  const [slowEndpoints] = useState<SlowEndpoint[]>(mockSlowEndpoints);
  const [databaseQueries] = useState<DatabaseQuery[]>(mockDatabaseQueries);

  const filteredIssues = performanceIssues.filter(issue => {
    const matchesSeverity = filterSeverity === "all" || issue.severity === filterSeverity;
    const matchesType = filterType === "all" || issue.type === filterType;
    const matchesKeyword = searchKeyword === "" || issue.service.toLowerCase().includes(searchKeyword.toLowerCase()) || issue.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesSeverity && matchesType && matchesKeyword;
  });

  const criticalCount = performanceIssues.filter(i => i.severity === "critical").length;
  const warningCount = performanceIssues.filter(i => i.severity === "warning").length;
  const infoCount = performanceIssues.filter(i => i.severity === "info").length;

  const avgResponseTime = Math.round(slowEndpoints.reduce((sum, e) => sum + e.avgDuration, 0) / slowEndpoints.length);
  const totalRequests = slowEndpoints.reduce((sum, e) => sum + e.requests, 0);
  const avgErrorRate = (slowEndpoints.reduce((sum, e) => sum + e.errorRate, 0) / slowEndpoints.length).toFixed(2);

  return (
    <MainLayout title="性能分析">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均响应时间</div>
                <div className="text-xl font-bold mt-1" style={{ color: avgResponseTime > 1000 ? "#FF4D4F" : "#00D68F" }}>
                  {avgResponseTime}ms
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Clock size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总请求数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {(totalRequests / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Activity size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均错误率</div>
                <div className="text-xl font-bold mt-1" style={{ color: parseFloat(avgErrorRate) > 2 ? "#FFAA00" : "#00D68F" }}>
                  {avgErrorRate}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>严重问题</div>
                <div className="text-xl font-bold mt-1" style={{ color: criticalCount > 0 ? "#FF4D4F" : "#00D68F" }}>
                  {criticalCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <Zap size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告问题</div>
                <div className="text-xl font-bold mt-1" style={{ color: warningCount > 0 ? "#FFAA00" : "#00D68F" }}>
                  {warningCount}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "overview" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Activity size={16} />
            性能概览
          </button>
          <button
            onClick={() => setActiveTab("endpoints")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "endpoints" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <TrendingUp size={16} />
            慢接口
          </button>
          <button
            onClick={() => setActiveTab("database")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "database" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Database size={16} />
            数据库分析
          </button>
          <button
            onClick={() => setActiveTab("issues")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "issues" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <AlertTriangle size={16} />
            问题列表
          </button>
        </div>

        {/* 性能概览 */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-2 gap-4">
            {/* 性能趋势 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: "#165DFF" }} />
                  <span className="text-sm font-medium text-white">响应时间趋势</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5" style={{ background: "#165DFF" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>P50</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5" style={{ background: "#00D68F" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>P95</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-0.5" style={{ background: "#FF4D4F" }} />
                    <span style={{ color: "var(--muted-foreground)" }}>P99</span>
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>P50</span>
                  <span className="text-sm font-medium text-white">156ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>P95</span>
                  <span className="text-sm font-medium text-white">456ms</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>P99</span>
                  <span className="text-sm font-medium text-white">1234ms</span>
                </div>
              </div>
            </div>

            {/* 问题分布 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={16} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium text-white">问题类型分布</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: "#FF4D4F" }} />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>慢查询</span>
                  </div>
                  <span className="text-sm font-medium text-white">{performanceIssues.filter(i => i.type === "slow_query").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: "#FFAA00" }} />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>内存泄漏</span>
                  </div>
                  <span className="text-sm font-medium text-white">{performanceIssues.filter(i => i.type === "memory_leak").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: "#165DFF" }} />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>CPU峰值</span>
                  </div>
                  <span className="text-sm font-medium text-white">{performanceIssues.filter(i => i.type === "cpu_spike").length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{ background: "#00D68F" }} />
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>网络延迟</span>
                  </div>
                  <span className="text-sm font-medium text-white">{performanceIssues.filter(i => i.type === "network_latency").length}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 慢接口 */}
        {activeTab === "endpoints" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--input)" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>接口</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>方法</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>平均耗时</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>最大耗时</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>请求数</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>错误率</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>趋势</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {slowEndpoints.map((endpoint, idx) => (
                    <tr key={idx} className="hover:bg-input">
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--foreground)" }}>{endpoint.path}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: endpoint.method === "GET" ? "rgba(0, 214, 143, 0.1)" : "rgba(255, 170, 0, 0.1)", color: endpoint.method === "GET" ? "#00D68F" : "#FFAA00" }}>
                          {endpoint.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-medium" style={{ color: endpoint.avgDuration > 1000 ? "#FF4D4F" : "var(--foreground)" }}>
                        {endpoint.avgDuration}ms
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{endpoint.maxDuration}ms</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{endpoint.requests.toLocaleString()}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: endpoint.errorRate > 2 ? "#FF4D4F" : "var(--foreground)" }}>
                        {endpoint.errorRate}%
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1 text-xs" style={{ color: endpoint.trend === "up" ? "#FF4D4F" : endpoint.trend === "down" ? "#00D68F" : "var(--muted-foreground)" }}>
                          {endpoint.trend === "up" && "↑"}
                          {endpoint.trend === "down" && "↓"}
                          {endpoint.trend === "stable" && "→"}
                          {endpoint.trend === "up" ? "恶化" : endpoint.trend === "down" ? "改善" : "稳定"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 数据库分析 */}
        {activeTab === "database" && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-medium text-white">慢查询列表</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--input)" }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>SQL语句</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>执行时间</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>执行次数</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>平均行数</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>索引</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {databaseQueries.map((query) => (
                      <tr key={query.id} className="hover:bg-input">
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--foreground)" }}>
                          <div className="max-w-md truncate">{query.query}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium" style={{ color: query.executionTime > 500 ? "#FF4D4F" : query.executionTime > 100 ? "#FFAA00" : "var(--foreground)" }}>
                          {query.executionTime}ms
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{query.executions.toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{query.avgRows}</td>
                        <td className="px-4 py-3">
                          {query.indexed ? (
                            <CheckCircle size={14} style={{ color: "#00D68F" }} />
                          ) : (
                            <span className="text-xs" style={{ color: "#FF4D4F" }}>无索引</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: query.status === "good" ? "rgba(0, 214, 143, 0.1)" : query.status === "warning" ? "rgba(255, 170, 0, 0.1)" : "rgba(255, 77, 79, 0.1)", color: query.status === "good" ? "#00D68F" : query.status === "warning" ? "#FFAA00" : "#FF4D4F" }}>
                            {query.status === "good" ? "良好" : query.status === "warning" ? "警告" : "严重"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 问题列表 */}
        {activeTab === "issues" && (
          <div className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <input
                type="text"
                placeholder="搜索服务或问题..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="all">全部级别</option>
                <option value="critical">严重</option>
                <option value="warning">警告</option>
                <option value="info">信息</option>
              </select>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="all">全部类型</option>
                <option value="slow_query">慢查询</option>
                <option value="memory_leak">内存泄漏</option>
                <option value="cpu_spike">CPU峰值</option>
                <option value="network_latency">网络延迟</option>
              </select>
            </div>

            {/* 问题列表 */}
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg p-4 border"
                  style={{
                    background: issue.severity === "critical" ? "rgba(255, 77, 79, 0.05)" : issue.severity === "warning" ? "rgba(255, 170, 0, 0.05)" : "rgba(22, 93, 255, 0.05)",
                    borderColor: issue.severity === "critical" ? "rgba(255, 77, 79, 0.2)" : issue.severity === "warning" ? "rgba(255, 170, 0, 0.2)" : "rgba(22, 93, 255, 0.2)"
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {issue.severity === "critical" && <Zap size={16} style={{ color: "#FF4D4F" }} />}
                      {issue.severity === "warning" && <AlertTriangle size={16} style={{ color: "#FFAA00" }} />}
                      {issue.severity === "info" && <Activity size={16} style={{ color: "#165DFF" }} />}
                      <span className="text-sm font-medium text-white">{issue.service}</span>
                      {issue.endpoint && <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{issue.endpoint}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: issue.severity === "critical" ? "rgba(255, 77, 79, 0.1)" : issue.severity === "warning" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                          color: issue.severity === "critical" ? "#FF4D4F" : issue.severity === "warning" ? "#FFAA00" : "#165DFF"
                        }}
                      >
                        {issue.severity === "critical" ? "严重" : issue.severity === "warning" ? "警告" : "信息"}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{issue.timestamp}</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <div className="text-sm text-white mb-1">{issue.description}</div>
                    {issue.duration > 0 && (
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        持续时间: <span className="font-medium text-white">{(issue.duration / 1000).toFixed(1)}秒</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 rounded-lg mb-3" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>💡 优化建议</div>
                    <div className="text-sm text-white">{issue.suggestion}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      影响: <span className="text-white">{issue.impact}</span>
                    </div>
                    <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                      查看详情
                    </button>
                  </div>
                </div>
              ))}
              {filteredIssues.length === 0 && (
                <div className="text-center py-12">
                  <CheckCircle size={48} className="mx-auto mb-3" style={{ color: "#00D68F" }} />
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>没有发现性能问题</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
