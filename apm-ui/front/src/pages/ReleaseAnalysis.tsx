import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { GitBranch, GitCommit, GitPullRequest, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Activity, Tag, MessageSquare, Plus, Filter, Download, RefreshCw } from "lucide-react";

interface Release {
  id: string;
  version: string;
  name: string;
  service: string;
  environment: "production" | "staging" | "development";
  status: "success" | "failed" | "in_progress" | "rolled_back";
  startedAt: string;
  completedAt?: string;
  duration?: number;
  author: string;
  commits: number;
  changes: {
    features: number;
    bugfixes: number;
    improvements: number;
  };
  rollbackAvailable: boolean;
  artifacts: string[];
  metrics: {
    cpuImpact: number;
    memoryImpact: number;
    responseTimeChange: number;
    errorRateChange: number;
  };
}

interface DeploymentFrequency {
  service: string;
  daily: number;
  weekly: number;
  monthly: number;
  trend: "up" | "down" | "stable";
}

const mockReleases: Release[] = [
  {
    id: "1",
    version: "v2.5.0",
    name: "性能优化版本",
    service: "order-service",
    environment: "production",
    status: "success",
    startedAt: "2024-01-15 10:30:00",
    completedAt: "2024-01-15 10:35:00",
    duration: 5,
    author: "zhang.san",
    commits: 12,
    changes: { features: 3, bugfixes: 5, improvements: 4 },
    rollbackAvailable: true,
    artifacts: ["order-service-2.5.0.jar", "docker-image-v2.5.0"],
    metrics: { cpuImpact: -5, memoryImpact: -3, responseTimeChange: -12, errorRateChange: -0.02 }
  },
  {
    id: "2",
    version: "v2.4.8",
    name: "Bug修复版本",
    service: "payment-gateway",
    environment: "production",
    status: "success",
    startedAt: "2024-01-15 09:00:00",
    completedAt: "2024-01-15 09:03:00",
    duration: 3,
    author: "li.si",
    commits: 3,
    changes: { features: 0, bugfixes: 3, improvements: 0 },
    rollbackAvailable: true,
    artifacts: ["payment-gateway-2.4.8.jar"],
    metrics: { cpuImpact: 0, memoryImpact: 1, responseTimeChange: -5, errorRateChange: -0.15 }
  },
  {
    id: "3",
    version: "v1.8.2",
    name: "新功能发布",
    service: "user-service",
    environment: "staging",
    status: "in_progress",
    startedAt: "2024-01-15 14:20:00",
    author: "wang.wu",
    commits: 8,
    changes: { features: 2, bugfixes: 2, improvements: 4 },
    rollbackAvailable: false,
    artifacts: ["user-service-1.8.2.jar"],
    metrics: { cpuImpact: 0, memoryImpact: 0, responseTimeChange: 0, errorRateChange: 0 }
  },
  {
    id: "4",
    version: "v2.3.5",
    name: "数据库优化",
    service: "inventory-service",
    environment: "production",
    status: "failed",
    startedAt: "2024-01-14 16:00:00",
    completedAt: "2024-01-14 16:08:00",
    duration: 8,
    author: "zhao.liu",
    commits: 5,
    changes: { features: 0, bugfixes: 1, improvements: 4 },
    rollbackAvailable: false,
    artifacts: ["inventory-service-2.3.5.jar"],
    metrics: { cpuImpact: 0, memoryImpact: 0, responseTimeChange: 0, errorRateChange: 0 }
  },
  {
    id: "5",
    version: "v2.5.1",
    name: "安全补丁",
    service: "auth-service",
    environment: "production",
    status: "rolled_back",
    startedAt: "2024-01-13 11:00:00",
    completedAt: "2024-01-13 11:05:00",
    duration: 5,
    author: "sun.qi",
    commits: 2,
    changes: { features: 0, bugfixes: 1, improvements: 1 },
    rollbackAvailable: false,
    artifacts: ["auth-service-2.5.1.jar"],
    metrics: { cpuImpact: 0, memoryImpact: 0, responseTimeChange: 0, errorRateChange: 0 }
  }
];

const mockDeploymentFrequency: DeploymentFrequency[] = [
  { service: "order-service", daily: 1.2, weekly: 8.5, monthly: 32, trend: "up" },
  { service: "payment-gateway", daily: 0.8, weekly: 5.6, monthly: 22, trend: "stable" },
  { service: "user-service", daily: 1.5, weekly: 10.2, monthly: 45, trend: "up" },
  { service: "inventory-service", daily: 0.5, weekly: 3.8, monthly: 15, trend: "down" },
  { service: "auth-service", daily: 0.3, weekly: 2.1, monthly: 9, trend: "stable" }
];

export default function ReleaseAnalysis() {
  const [activeTab, setActiveTab] = useState<"releases" | "frequency" | "analytics">("releases");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterEnvironment, setFilterEnvironment] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        setLastRefresh(new Date());
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const filteredReleases = mockReleases.filter(release => {
    const matchesStatus = filterStatus === "all" || release.status === filterStatus;
    const matchesEnv = filterEnvironment === "all" || release.environment === filterEnvironment;
    return matchesStatus && matchesEnv;
  });

  const successRate = (mockReleases.filter(r => r.status === "success").length / mockReleases.length * 100).toFixed(1);
  const avgDuration = (mockReleases.filter(r => r.duration).reduce((sum, r) => sum + (r.duration || 0), 0) / mockReleases.filter(r => r.duration).length).toFixed(1);
  const totalCommits = mockReleases.reduce((sum, r) => sum + r.commits, 0);
  const rollbackRate = (mockReleases.filter(r => r.status === "rolled_back").length / mockReleases.length * 100).toFixed(1);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />;
      case "failed": return <XCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />;
      case "in_progress": return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#1890FF" }} />;
      case "rolled_back": return <AlertCircle className="w-4 h-4" style={{ color: "#FFAA00" }} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "success": return "成功";
      case "failed": return "失败";
      case "in_progress": return "进行中";
      case "rolled_back": return "已回滚";
      default: return status;
    }
  };

  return (
    <MainLayout title="发布分析">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("releases")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "releases"
                  ? "text-white shadow-lg"
                  : ""
              }`}
              style={{
                background: activeTab === "releases" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "releases" ? "white" : "var(--foreground)"
              }}
            >
              发布历史
            </button>
            <button
              onClick={() => setActiveTab("frequency")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "frequency"
                  ? "text-white shadow-lg"
                  : ""
              }`}
              style={{
                background: activeTab === "frequency" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "frequency" ? "white" : "var(--foreground)"
              }}
            >
              部署频率
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "analytics"
                  ? "text-white shadow-lg"
                  : ""
              }`}
              style={{
                background: activeTab === "analytics" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "analytics" ? "white" : "var(--foreground)"
              }}
            >
              发布分析
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
              {autoRefresh ? "自动刷新中" : "自动刷新"}
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

        {activeTab === "releases" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-5 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{successRate}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均时长</div>
                    <div className="text-2xl font-bold" style={{ color: "#1890FF" }}>{avgDuration}分钟</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <GitCommit className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总提交数</div>
                    <div className="text-2xl font-bold" style={{ color: "#FAAD14" }}>{totalCommits}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <AlertCircle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>失败数</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>
                      {mockReleases.filter(r => r.status === "failed").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                    <GitPullRequest className="w-6 h-6" style={{ color: "#FFAA00" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>回滚率</div>
                    <div className="text-2xl font-bold" style={{ color: "#FFAA00" }}>{rollbackRate}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 筛选栏 */}
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <span className="text-sm" style={{ color: "var(--muted-foreground)" }}>筛选:</span>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
                <option value="in_progress">进行中</option>
                <option value="rolled_back">已回滚</option>
              </select>
              <select
                value={filterEnvironment}
                onChange={(e) => setFilterEnvironment(e.target.value)}
                className="px-3 py-1.5 rounded-lg text-sm"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="all">全部环境</option>
                <option value="production">生产环境</option>
                <option value="staging">预发环境</option>
                <option value="development">开发环境</option>
              </select>
              <div className="flex-1" />
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                最后更新: {lastRefresh.toLocaleTimeString()}
              </div>
            </div>

            {/* 发布列表 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>版本</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>服务</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>环境</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>变更</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>指标影响</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>时长</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredReleases.map((release) => (
                      <tr
                        key={release.id}
                        className="transition-colors hover:bg-opacity-50"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Tag className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                              <span className="font-medium">{release.version}</span>
                            </div>
                            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{release.name}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <GitBranch className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            <span>{release.service}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: release.environment === "production"
                                ? "rgba(255, 77, 79, 0.1)"
                                : release.environment === "staging"
                                ? "rgba(250, 173, 20, 0.1)"
                                : "rgba(0, 214, 143, 0.1)",
                              color: release.environment === "production"
                                ? "#FF4D4F"
                                : release.environment === "staging"
                                ? "#FAAD14"
                                : "#00D68F"
                            }}
                          >
                            {release.environment === "production" ? "生产" : release.environment === "staging" ? "预发" : "开发"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(release.status)}
                            <span className="text-sm">{getStatusLabel(release.status)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs" style={{ color: "#52C41A" }}>+{release.changes.features} 功能</span>
                            <span className="text-xs" style={{ color: "#FF4D4F" }}>-{release.changes.bugfixes} 修复</span>
                            <span className="text-xs" style={{ color: "#1890FF" }}>~{release.changes.improvements} 优化</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-1">
                            {release.status === "success" && (
                              <>
                                <div className="flex items-center gap-1 text-xs">
                                  <span style={{ color: "var(--muted-foreground)" }}>响应时间:</span>
                                  <span className={release.metrics.responseTimeChange < 0 ? "text-green-500" : "text-red-500"}>
                                    {release.metrics.responseTimeChange < 0 ? "-" : "+"}{Math.abs(release.metrics.responseTimeChange)}%
                                  </span>
                                  {release.metrics.responseTimeChange < 0 ? <TrendingDown className="w-3 h-3 text-green-500" /> : <TrendingUp className="w-3 h-3 text-red-500" />}
                                </div>
                                <div className="flex items-center gap-1 text-xs">
                                  <span style={{ color: "var(--muted-foreground)" }}>错误率:</span>
                                  <span className={release.metrics.errorRateChange < 0 ? "text-green-500" : "text-red-500"}>
                                    {release.metrics.errorRateChange < 0 ? "-" : "+"}{Math.abs(release.metrics.errorRateChange)}%
                                  </span>
                                  {release.metrics.errorRateChange < 0 ? <TrendingDown className="w-3 h-3 text-green-500" /> : <TrendingUp className="w-3 h-3 text-red-500" />}
                                </div>
                              </>
                            )}
                            {release.status !== "success" && (
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>无数据</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {release.duration ? (
                            <span className="text-sm">{release.duration}分钟</span>
                          ) : (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>进行中...</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {release.rollbackAvailable && (
                              <button
                                className="px-2 py-1 rounded text-xs transition-all"
                                style={{
                                  background: "rgba(255, 77, 79, 0.1)",
                                  color: "#FF4D4F",
                                  border: "1px solid rgba(255, 77, 79, 0.2)"
                                }}
                              >
                                回滚
                              </button>
                            )}
                            <button
                              className="px-2 py-1 rounded text-xs transition-all"
                              style={{
                                background: "var(--muted)",
                                color: "var(--foreground)",
                                border: "1px solid var(--border)"
                              }}
                            >
                              详情
                            </button>
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

        {activeTab === "frequency" && (
          <div className="space-y-4">
            {/* 部署频率统计 */}
            <div className="grid grid-cols-1 gap-4">
              {mockDeploymentFrequency.map((freq) => (
                <div
                  key={freq.service}
                  className="rounded-lg p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <GitBranch className="w-5 h-5" style={{ color: "var(--primary)" }} />
                      <span className="font-medium">{freq.service}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {freq.trend === "up" && <TrendingUp className="w-4 h-4 text-green-500" />}
                      {freq.trend === "down" && <TrendingDown className="w-4 h-4 text-red-500" />}
                      {freq.trend === "stable" && <Activity className="w-4 h-4 text-gray-500" />}
                      <span
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          background: freq.trend === "up"
                            ? "rgba(0, 214, 143, 0.1)"
                            : freq.trend === "down"
                            ? "rgba(255, 77, 79, 0.1)"
                            : "rgba(148, 163, 184, 0.1)",
                          color: freq.trend === "up"
                            ? "#00D68F"
                            : freq.trend === "down"
                            ? "#FF4D4F"
                            : "#94A3B8"
                        }}
                      >
                        {freq.trend === "up" ? "上升" : freq.trend === "down" ? "下降" : "稳定"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>日均部署</div>
                      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{freq.daily}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>周均部署</div>
                      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{freq.weekly}</div>
                    </div>
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>月均部署</div>
                      <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{freq.monthly}</div>
                    </div>
                  </div>

                  <div className="mt-4 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min((freq.monthly / 50) * 100, 100)}%`,
                        background: "linear-gradient(90deg, var(--primary), var(--primary-hover))"
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="space-y-4">
            {/* 发布分析图表 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-lg font-medium mb-4">发布趋势</h3>
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  发布趋势图表（过去30天）
                </div>
              </div>

              <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-lg font-medium mb-4">成功/失败分布</h3>
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  饼图显示成功/失败比例
                </div>
              </div>

              <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-lg font-medium mb-4">各服务发布频率</h3>
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  柱状图显示各服务发布频率
                </div>
              </div>

              <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-lg font-medium mb-4">平均部署时长</h3>
                <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                  折线图显示平均部署时长趋势
                </div>
              </div>
            </div>

            {/* 关键指标 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <Activity className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均MTTR</div>
                    <div className="text-2xl font-bold">4.2分钟</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>发布频率</div>
                    <div className="text-2xl font-bold">23.4次/周</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <TrendingUp className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>变更前置时间</div>
                    <div className="text-2xl font-bold">2.1天</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#52C41A" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>变更失败率</div>
                    <div className="text-2xl font-bold">4.3%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
