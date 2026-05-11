import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, TrendingUp, Activity, BarChart3, Clock, Package, GitBranch, AlertTriangle, CheckCircle, XCircle, Server, Cpu, Wifi, Calendar, ChevronDown, ChevronRight, LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "lucide-react";
import { PieChart, Pie, Cell } from "recharts";

interface ReleaseRecord {
  id: string;
  version: string;
  appName: string;
  environment: "production" | "staging" | "development";
  status: "success" | "failed" | "rolling" | "pending";
  deployTime: Date;
  duration: number;
  deployer: string;
  commitId?: string;
  branch?: string;
  changelog?: string;
  instances: {
    total: number;
    deployed: number;
    failed: number;
  };
  rollback?: boolean;
}

interface ReleaseStats {
  totalReleases: number;
  successRate: number;
  avgDeployTime: number;
  activeRollouts: number;
}

interface EnvironmentStats {
  environment: string;
  releases: number;
  success: number;
  failed: number;
}

const mockReleases: ReleaseRecord[] = Array.from({ length: 30 }, (_, i) => {
  const environments: Array<"production" | "staging" | "development"> = ["production", "staging", "development"];
  const statuses: Array<"success" | "failed" | "rolling" | "pending"> = ["success", "failed", "rolling", "pending"];
  const apps = ["order-service", "payment-gateway", "user-service", "inventory-service", "notification-service"];
  const deployers = ["张三", "李四", "王五", "赵六"];
  const env = environments[Math.floor(Math.random() * environments.length)];
  const status = Math.random() > 0.85 ? (Math.random() > 0.5 ? "failed" : "rolling") : "success";
  
  return {
    id: `release-${i}`,
    version: `v${2 + Math.floor(i / 10)}.${Math.floor(i % 10)}.${Math.floor(Math.random() * 100)}`,
    appName: apps[Math.floor(Math.random() * apps.length)],
    environment: env,
    status,
    deployTime: new Date(Date.now() - Math.random() * 7 * 24 * 3600000),
    duration: Math.floor(Math.random() * 600) + 60,
    deployer: deployers[Math.floor(Math.random() * deployers.length)],
    commitId: Math.random() > 0.3 ? `abc${Math.random().toString(36).substr(2, 7)}` : undefined,
    branch: Math.random() > 0.3 ? ["main", "develop", "feature/new-api"][Math.floor(Math.random() * 3)] : undefined,
    changelog: Math.random() > 0.5 ? ["修复了订单查询性能问题", "优化了缓存策略", "新增用户权限管理", "修复了支付回调bug", "升级了依赖版本"][Math.floor(Math.random() * 5)] : undefined,
    instances: {
      total: [3, 5, 7, 10][Math.floor(Math.random() * 4)],
      deployed: status === "failed" ? Math.floor(Math.random() * 3) : [3, 5, 7, 10][Math.floor(Math.random() * 4)],
      failed: status === "failed" ? Math.floor(Math.random() * 2) + 1 : 0,
    },
    rollback: Math.random() > 0.9,
  };
});

const statusConfig = {
  success: { color: "#00D68F", bg: "rgba(0, 214, 143, 0.1)", icon: CheckCircle, label: "成功" },
  failed: { color: "#FF4D4F", bg: "rgba(255, 77, 79, 0.1)", icon: XCircle, label: "失败" },
  rolling: { color: "#FFAA00", bg: "rgba(255, 170, 0, 0.1)", icon: Activity, label: "部署中" },
  pending: { color: "#165DFF", bg: "rgba(22, 93, 255, 0.1)", icon: Clock, label: "待部署" },
};

const envConfig = {
  production: { color: "#FF4D4F", label: "生产环境" },
  staging: { color: "#FFAA00", label: "预发环境" },
  development: { color: "#165DFF", label: "开发环境" },
};

export default function ReleaseAnalysis() {
  const [releases, setReleases] = useState<ReleaseRecord[]>(mockReleases);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterEnv, setFilterEnv] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterApp, setFilterApp] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<"24h" | "7d" | "30d">("7d");
  const [expandedRelease, setExpandedRelease] = useState<string | null>(null);

  const [stats, setStats] = useState<ReleaseStats>({
    totalReleases: 0,
    successRate: 0,
    avgDeployTime: 0,
    activeRollouts: 0,
  });

  const [envStats, setEnvStats] = useState<EnvironmentStats[]>([]);

  useEffect(() => {
    updateStats();
  }, [releases]);

  const updateStats = () => {
    const successCount = releases.filter(r => r.status === "success").length;
    const totalDuration = releases.reduce((sum, r) => sum + r.duration, 0);
    const activeRollouts = releases.filter(r => r.status === "rolling" || r.status === "pending").length;
    
    setStats({
      totalReleases: releases.length,
      successRate: releases.length > 0 ? (successCount / releases.length) * 100 : 0,
      avgDeployTime: releases.length > 0 ? Math.round(totalDuration / releases.length) : 0,
      activeRollouts,
    });

    const envMap = new Map<string, EnvironmentStats>();
    ["production", "staging", "development"].forEach(env => {
      envMap.set(env, { environment: env, releases: 0, success: 0, failed: 0 });
    });
    
    releases.forEach(r => {
      const existing = envMap.get(r.environment)!;
      existing.releases++;
      if (r.status === "success") existing.success++;
      if (r.status === "failed") existing.failed++;
    });
    
    setEnvStats(Array.from(envMap.values()));
  };

  const filteredReleases = useMemo(() => {
    return releases.filter(r => {
      const matchesKeyword = searchKeyword === "" || 
        r.appName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.version.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.deployer.includes(searchKeyword);
      const matchesEnv = filterEnv === "all" || r.environment === filterEnv;
      const matchesStatus = filterStatus === "all" || r.status === filterStatus;
      const matchesApp = filterApp === "all" || r.appName === filterApp;
      return matchesKeyword && matchesEnv && matchesStatus && matchesApp;
    });
  }, [releases, searchKeyword, filterEnv, filterStatus, filterApp]);

  const uniqueApps = [...new Set(releases.map(r => r.appName))];

  const trendData = useMemo(() => {
    const days = timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30;
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(Date.now() - (days - i - 1) * 24 * 3600000);
      const dayReleases = releases.filter(r => {
        const diff = Date.now() - r.deployTime.getTime();
        return diff <= (days - i) * 24 * 3600000 && diff > (days - i - 1) * 24 * 3600000;
      });
      return {
        date: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
        releases: dayReleases.length,
        success: dayReleases.filter(r => r.status === "success").length,
        failed: dayReleases.filter(r => r.status === "failed").length,
      };
    });
  }, [releases, timeRange]);

  const pieData = [
    { name: "成功", value: releases.filter(r => r.status === "success").length, color: "#00D68F" },
    { name: "失败", value: releases.filter(r => r.status === "failed").length, color: "#FF4D4F" },
    { name: "部署中", value: releases.filter(r => r.status === "rolling").length, color: "#FFAA00" },
    { name: "待部署", value: releases.filter(r => r.status === "pending").length, color: "#165DFF" },
  ];

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}分${secs}秒`;
  };

  const formatTime = (date: Date) => {
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return `${Math.floor(diff / 86400000)}天前`;
  };

  const handleExport = () => {
    const data = filteredReleases.map(r => ({
      version: r.version,
      appName: r.appName,
      environment: r.environment,
      status: r.status,
      deployTime: r.deployTime.toISOString(),
      duration: r.duration,
      deployer: r.deployer,
      commitId: r.commitId,
      branch: r.branch,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `release-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="发布分析">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总发布次数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.totalReleases}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Package size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{stats.successRate.toFixed(1)}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均部署时长</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{formatDuration(stats.avgDeployTime)}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <Clock size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>进行中的发布</div>
                <div className="text-xl font-bold mt-1" style={{ color: stats.activeRollouts > 0 ? "#FFAA00" : "var(--foreground)" }}>{stats.activeRollouts}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Activity size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 趋势图表和分布 */}
        <div className="grid grid-cols-3 gap-4">
          {/* 发布趋势 */}
          <div className="col-span-2 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium text-white">发布趋势</span>
              </div>
              <div className="flex items-center gap-1">
                {(["24h", "7d", "30d"] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-2 py-1 rounded text-xs ${timeRange === range ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"}`}
                  >
                    {range === "24h" ? "24小时" : range === "7d" ? "7天" : "30天"}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="success" stackId="1" stroke="#00D68F" fill="rgba(0, 214, 143, 0.3)" name="成功" />
                <Area type="monotone" dataKey="failed" stackId="1" stroke="#FF4D4F" fill="rgba(255, 77, 79, 0.3)" name="失败" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* 发布状态分布 */}
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-4">
              <PieChart size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">状态分布</span>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.name}</span>
                  <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 环境统计 */}
        <div className="grid grid-cols-3 gap-4">
          {envStats.map((stat) => (
            <div key={stat.environment} className="rounded-lg p-4" style={{ background: "var(--card)", border: `1px solid ${envConfig[stat.environment as keyof typeof envConfig]?.color}30` }}>
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} style={{ color: envConfig[stat.environment as keyof typeof envConfig]?.color }} />
                <span className="text-sm font-medium text-white">{envConfig[stat.environment as keyof typeof envConfig]?.label}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>总发布</span>
                  <span className="font-medium text-white">{stat.releases}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>成功</span>
                  <span className="font-medium" style={{ color: "#00D68F" }}>{stat.success}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>失败</span>
                  <span className="font-medium" style={{ color: "#FF4D4F" }}>{stat.failed}</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${stat.releases > 0 ? (stat.success / stat.releases) * 100 : 0}%`,
                      background: envConfig[stat.environment as keyof typeof envConfig]?.color,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索应用名称、版本号、部署人..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <select
              value={filterEnv}
              onChange={(e) => setFilterEnv(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部环境</option>
              <option value="production">生产环境</option>
              <option value="staging">预发环境</option>
              <option value="development">开发环境</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部状态</option>
              <option value="success">成功</option>
              <option value="failed">失败</option>
              <option value="rolling">部署中</option>
              <option value="pending">待部署</option>
            </select>
            <select
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部应用</option>
              {uniqueApps.map(app => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgba(250, 204, 21, 0.1)", color: "#FACC15" }}
          >
            <Download size={14} />
            导出数据
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>

        {/* 发布列表 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              发布历史 <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({filteredReleases.length} 条)</span>
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredReleases.map((release) => {
              const StatusIcon = statusConfig[release.status].icon;
              const isExpanded = expandedRelease === release.id;
              
              return (
                <div key={release.id}>
                  <div
                    className="flex items-center justify-between p-4 hover:bg-input cursor-pointer transition-colors"
                    onClick={() => setExpandedRelease(isExpanded ? null : release.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: statusConfig[release.status].bg }}
                      >
                        <StatusIcon size={18} style={{ color: statusConfig[release.status].color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {release.appName}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ background: statusConfig[release.status].bg, color: statusConfig[release.status].color }}
                          >
                            {statusConfig[release.status].label}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ background: `${envConfig[release.environment].color}15`, color: envConfig[release.environment].color }}
                          >
                            {envConfig[release.environment].label}
                          </span>
                          {release.rollback && (
                            <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}>
                              回滚
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>{release.version}</span>
                          <span>|</span>
                          <span>{release.deployer}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatTime(release.deployTime)}
                          </span>
                          <span>|</span>
                          <span>{formatDuration(release.duration)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--muted-foreground)", transform: isExpanded ? "rotate(90deg)" : "", transition: "transform 0.2s" }} />
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 ml-14">
                      <div className="p-4 rounded-lg" style={{ background: "var(--input)" }}>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>实例状态</div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{release.instances.deployed}/{release.instances.total}</span>
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>已部署</span>
                              {release.instances.failed > 0 && (
                                <span className="text-xs" style={{ color: "#FF4D4F" }}>({release.instances.failed} 失败)</span>
                              )}
                            </div>
                          </div>
                          {release.commitId && (
                            <div>
                              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Commit ID</div>
                              <div className="text-sm font-mono" style={{ color: "#165DFF" }}>{release.commitId}</div>
                            </div>
                          )}
                          {release.branch && (
                            <div>
                              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>分支</div>
                              <div className="flex items-center gap-1 text-sm" style={{ color: "var(--foreground)" }}>
                                <GitBranch size={14} />
                                {release.branch}
                              </div>
                            </div>
                          )}
                          <div>
                            <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>部署时间</div>
                            <div className="text-sm" style={{ color: "var(--foreground)" }}>{release.deployTime.toLocaleString()}</div>
                          </div>
                        </div>
                        {release.changelog && (
                          <div>
                            <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>变更说明</div>
                            <div className="text-sm" style={{ color: "var(--foreground)" }}>{release.changelog}</div>
                          </div>
                        )}
                        <div className="flex gap-2 mt-4">
                          <button
                            className="px-3 py-1.5 rounded text-xs font-medium"
                            style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                          >
                            查看详情
                          </button>
                          {release.status === "success" && (
                            <button
                              className="px-3 py-1.5 rounded text-xs font-medium"
                              style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}
                            >
                              回滚
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
