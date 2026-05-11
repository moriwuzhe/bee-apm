import { useState, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle, Clock, X, ChevronRight, Activity, TrendingUp, Zap, Bell, Users, Settings, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";

interface AlertRecord {
  id: string;
  appName: string;
  env: string;
  type: string;
  level: "critical" | "warning" | "info";
  message: string;
  time: string;
  status: "open" | "resolved";
  source?: string;
  tags?: Record<string, string>;
}

const mockAlerts: AlertRecord[] = [
  { id: "1", appName: "order-service", env: "production", type: "OOM", level: "critical", message: "堆内存使用超过95%，触发OOM告警", time: "2分钟前", status: "open", source: "JVM" },
  { id: "2", appName: "192.168.1.15", env: "host", type: "CPU > 85%", level: "warning", message: "主机CPU使用率持续超过85%", time: "8分钟前", status: "open", source: "主机监控" },
  { id: "3", appName: "gateway-v2", env: "production", type: "响应延迟 > 2s", level: "warning", message: "API响应时间超过2秒阈值", time: "15分钟前", status: "open", source: "API监控" },
  { id: "4", appName: "mysql-master", env: "production", type: "连接数 > 80%", level: "warning", message: "数据库连接数达到85%", time: "22分钟前", status: "resolved", source: "数据库" },
  { id: "5", appName: "user-service", env: "staging", type: "实例宕机", level: "critical", message: "用户服务实例异常退出", time: "35分钟前", status: "resolved", source: "Agent" },
  { id: "6", appName: "payment-gateway", env: "production", type: "超时次数", level: "warning", message: "支付网关超时请求超过阈值", time: "45分钟前", status: "open", source: "API监控" },
  { id: "7", appName: "redis-cache", env: "production", type: "缓存命中率", level: "info", message: "缓存命中率下降至85%", time: "1小时前", status: "resolved", source: "Redis" },
  { id: "8", appName: "kafka-broker", env: "production", type: "消息积压", level: "warning", message: "Kafka消息队列积压超过10000条", time: "1小时前", status: "open", source: "Kafka" },
  { id: "9", appName: "nginx-proxy", env: "production", type: "错误率上升", level: "warning", message: "Nginx错误率从1%上升至5%", time: "2小时前", status: "resolved", source: "Nginx" },
  { id: "10", appName: "es-cluster", env: "production", type: "分片异常", level: "critical", message: "Elasticsearch分片未分配", time: "3小时前", status: "resolved", source: "Elasticsearch" },
];

const levelConfig = {
  critical: { icon: AlertTriangle, color: "#FF4D4F", bgColor: "rgba(255, 77, 79, 0.1)", label: "严重" },
  warning: { icon: AlertCircle, color: "#FFAA00", bgColor: "rgba(255, 170, 0, 0.1)", label: "警告" },
  info: { icon: Info, color: "#165DFF", bgColor: "rgba(22, 93, 255, 0.1)", label: "信息" },
};

const statusConfig = {
  open: { color: "#FF4D4F", label: "待处理" },
  resolved: { color: "#00D68F", label: "已解决" },
};

export default function AlertHistory() {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterEnv, setFilterEnv] = useState<string>("all");
  const [selectedAlert, setSelectedAlert] = useState<AlertRecord | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<"today" | "7d" | "30d" | "custom">("7d");
  const [isRealtime, setIsRealtime] = useState(true);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  const [advancedStats, setAdvancedStats] = useState({
    totalToday: 156,
    criticalToday: 23,
    warningToday: 85,
    avgResolveTime: 12.5,
    resolutionRate: 91.2,
    mttr: 8.3,
    alertFrequency: 2.3,
    topAgents: [
      { name: "order-service", count: 45, trend: 12 },
      { name: "payment-gateway", count: 38, trend: -5 },
      { name: "user-service", count: 32, trend: 8 },
      { name: "gateway-v2", count: 28, trend: 15 },
      { name: "redis-cache", count: 13, trend: -3 },
    ],
    topAlertTypes: [
      { type: "CPU 过载", count: 56, color: "#FF4D4F" },
      { type: "内存告警", count: 42, color: "#FFAA00" },
      { type: "响应超时", count: 35, color: "#FFAA00" },
      { type: "错误率上升", count: 18, color: "#165DFF" },
      { type: "连接异常", count: 5, color: "#165DFF" },
    ],
  });

  const [realtimeAlerts, setRealtimeAlerts] = useState([
    { id: "rt-1", message: "order-service CPU 使用率达到 92%", level: "critical", time: "2秒前" },
    { id: "rt-2", message: "payment-gateway 响应时间超过 500ms", level: "warning", time: "15秒前" },
    { id: "rt-3", message: "user-service 内存使用率超过 85%", level: "warning", time: "30秒前" },
  ]);

  const [correlationGroups, setCorrelationGroups] = useState([
    { id: 1, name: "订单服务故障群", count: 5, alerts: ["CPU过载", "响应超时", "连接池满"], status: "active" },
    { id: 2, name: "支付链路异常", count: 3, alerts: ["错误率上升", "响应超时"], status: "investigating" },
  ]);

  const filteredAlerts = useMemo(() => {
    return mockAlerts.filter((alert) => {
      const matchesKeyword =
        searchKeyword === "" ||
        alert.appName.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        alert.message.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        alert.type.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesLevel = filterLevel === "all" || alert.level === filterLevel;
      const matchesStatus = filterStatus === "all" || alert.status === filterStatus;
      const matchesEnv = filterEnv === "all" || alert.env === filterEnv;
      return matchesKeyword && matchesLevel && matchesStatus && matchesEnv;
    });
  }, [searchKeyword, filterLevel, filterStatus, filterEnv]);

  const uniqueEnvs = [...new Set(mockAlerts.map((a) => a.env))];

  const stats = {
    total: mockAlerts.length,
    open: mockAlerts.filter((a) => a.status === "open").length,
    resolved: mockAlerts.filter((a) => a.status === "resolved").length,
    critical: mockAlerts.filter((a) => a.level === "critical").length,
  };

  // 告警级别分布数据
  const levelDistributionData = useMemo(() => {
    const distribution = mockAlerts.reduce((acc, alert) => {
      acc[alert.level] = (acc[alert.level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return [
      { name: "严重", value: distribution.critical || 0, color: "#FF4D4F" },
      { name: "警告", value: distribution.warning || 0, color: "#FFAA00" },
      { name: "信息", value: distribution.info || 0, color: "#165DFF" },
    ];
  }, []);

  // 按时间分布的数据（最近7天）
  const timeDistributionData = useMemo(() => {
    const days = ["1天前", "2天前", "3天前", "4天前", "5天前", "6天前", "今天"];
    return days.map(day => ({
      day,
      critical: Math.floor(Math.random() * 3),
      warning: Math.floor(Math.random() * 5) + 1,
      info: Math.floor(Math.random() * 2),
    }));
  }, []);

  // 按环境分布的数据
  const envDistributionData = useMemo(() => {
    const envs = ["production", "staging", "host"];
    return envs.map(env => ({
      name: env === "production" ? "生产环境" : env === "staging" ? "预发环境" : "主机",
      count: mockAlerts.filter(a => a.env === env).length,
      color: env === "production" ? "#FF4D4F" : env === "staging" ? "#FFAA00" : "#165DFF",
    }));
  }, []);

  const exportData = () => {
    const data = filteredAlerts.map((a) => ({
      id: a.id,
      appName: a.appName,
      env: a.env,
      type: a.type,
      level: a.level,
      message: a.message,
      time: a.time,
      status: a.status,
      source: a.source,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `alerts-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="告警历史">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>告警总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.total}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <AlertCircle size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>待处理</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{stats.open}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已解决</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{stats.resolved}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>严重告警</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{stats.critical}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 高级统计和趋势 */}
        <div className="grid grid-cols-6 gap-3">
          <div className="rounded-xl p-4 bg-card border border-border hover:border-blue-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">今日告警</div>
              <Activity size={14} className="text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-white">{advancedStats.totalToday}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <TrendingUp size={12} className="text-green-400" />
              <span className="text-green-400">+12%</span>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-card border border-border hover:border-red-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">严重告警</div>
              <AlertTriangle size={14} className="text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-400">{advancedStats.criticalToday}</div>
            <div className="flex items-center gap-1 mt-1 text-xs">
              <TrendingUp size={12} className="text-red-400" />
              <span className="text-red-400">+8%</span>
            </div>
          </div>
          <div className="rounded-xl p-4 bg-card border border-border hover:border-yellow-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">平均解决时间</div>
              <Clock size={14} className="text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-white">{advancedStats.avgResolveTime}<span className="text-sm">min</span></div>
            <div className="text-xs text-muted-foreground mt-1">MTTR</div>
          </div>
          <div className="rounded-xl p-4 bg-card border border-border hover:border-green-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">解决率</div>
              <CheckCircle size={14} className="text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-400">{advancedStats.resolutionRate}%</div>
            <div className="text-xs text-muted-foreground mt-1">今日</div>
          </div>
          <div className="rounded-xl p-4 bg-card border border-border hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">告警频率</div>
              <Zap size={14} className="text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-white">{advancedStats.alertFrequency}<span className="text-sm">/min</span></div>
            <div className="text-xs text-muted-foreground mt-1">系统平均</div>
          </div>
          <div className="rounded-xl p-4 bg-card border border-border hover:border-cyan-500/50 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-muted-foreground">故障群组</div>
              <Bell size={14} className="text-cyan-500" />
            </div>
            <div className="text-2xl font-bold text-white">{correlationGroups.length}</div>
            <div className="text-xs text-muted-foreground mt-1">待处理</div>
          </div>
        </div>

        {/* 时间范围选择和实时告警 */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-xl p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-blue-500" />
                <span className="text-sm font-medium text-white">告警趋势</span>
              </div>
              <div className="flex items-center gap-2">
                {(["today", "7d", "30d"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-3 py-1 rounded text-xs transition-colors ${selectedTimeRange === range ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"}`}
                  >
                    {range === "today" ? "今天" : range === "7d" ? "近7天" : "近30天"}
                  </button>
                ))}
                <button
                  onClick={() => setIsRealtime(!isRealtime)}
                  className={`flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors ${isRealtime ? "bg-green-500/20 text-green-400" : "text-muted-foreground"}`}
                >
                  <span className={`w-2 h-2 rounded-full ${isRealtime ? "bg-green-500 animate-pulse" : "bg-gray-500"}`} />
                  {isRealtime ? "实时" : "已暂停"}
                </button>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={timeDistributionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94A3B8" }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Line type="monotone" dataKey="critical" stroke="#FF4D4F" strokeWidth={2} dot={{ r: 3 }} name="严重" />
                <Line type="monotone" dataKey="warning" stroke="#FFAA00" strokeWidth={2} dot={{ r: 3 }} name="警告" />
                <Line type="monotone" dataKey="info" stroke="#165DFF" strokeWidth={2} dot={{ r: 3 }} name="信息" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl p-4 bg-card border border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-yellow-500" />
                <span className="text-sm font-medium text-white">实时告警</span>
              </div>
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                实时监控
              </span>
            </div>
            <div className="space-y-2 max-h-[180px] overflow-y-auto">
              {realtimeAlerts.map((alert) => (
                <div key={alert.id} className="flex items-start gap-2 p-2 bg-muted/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full mt-1 ${alert.level === "critical" ? "bg-red-500" : alert.level === "warning" ? "bg-yellow-500" : "bg-blue-500"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-white truncate">{alert.message}</div>
                    <div className="text-xs text-muted-foreground">{alert.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 故障关联分析 */}
        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-purple-500" />
              <span className="text-sm font-medium text-white">故障关联分析</span>
            </div>
            <span className="text-xs text-muted-foreground">智能检测到的关联告警</span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {correlationGroups.map((group) => (
              <div key={group.id} className="p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">{group.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${group.status === "active" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {group.status === "active" ? "活跃" : "调查中"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{group.count} 个关联告警</span>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {group.alerts.map((alert, idx) => (
                    <span key={idx} className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400">{alert}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索应用名称、告警类型、消息..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部级别</option>
              <option value="critical">严重</option>
              <option value="warning">警告</option>
              <option value="info">信息</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部状态</option>
              <option value="open">待处理</option>
              <option value="resolved">已解决</option>
            </select>
            <select
              value={filterEnv}
              onChange={(e) => setFilterEnv(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部环境</option>
              {uniqueEnvs.map((env) => (
                <option key={env} value={env}>{env}</option>
              ))}
            </select>
          </div>

          <button
            onClick={exportData}
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

        {/* 告警列表 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              告警列表 <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({filteredAlerts.length} 条)</span>
            </span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredAlerts.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <Info size={32} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-2" />
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无符合条件的告警</div>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const LevelIcon = levelConfig[alert.level].icon;
                const levelStyle = levelConfig[alert.level];
                
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 hover:bg-input cursor-pointer transition-colors"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ background: levelStyle.bgColor }}
                      >
                        <LevelIcon size={18} style={{ color: levelStyle.color }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {alert.appName}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ background: levelStyle.bgColor, color: levelStyle.color }}
                          >
                            {levelStyle.label}
                          </span>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ color: statusConfig[alert.status].color }}
                          >
                            {statusConfig[alert.status].label}
                          </span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                          {alert.type} - {alert.message}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>{alert.env}</span>
                          <span>|</span>
                          <span>{alert.source}</span>
                          <span>|</span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {alert.time}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 详情弹窗 */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedAlert(null)}>
            <div
              className="bg-card rounded-lg w-full max-w-md mx-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  {(() => {
                    const LevelIcon = levelConfig[selectedAlert.level].icon;
                    return <LevelIcon size={16} style={{ color: levelConfig[selectedAlert.level].color }} />;
                  })()}
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>告警详情</span>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-1 hover:bg-input rounded">
                  <X size={16} style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>告警类型</div>
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{selectedAlert.type}</span>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>告警消息</div>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>{selectedAlert.message}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>应用名称</div>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{selectedAlert.appName}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>环境</div>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{selectedAlert.env}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>来源</div>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{selectedAlert.source}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>时间</div>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{selectedAlert.time}</span>
                  </div>
                </div>
                {selectedAlert.tags && Object.keys(selectedAlert.tags).length > 0 && (
                  <div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>标签</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedAlert.tags).map(([key, value]) => (
                        <span
                          key={key}
                          className="px-2 py-1 rounded text-xs"
                          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                        >
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2 p-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  onClick={() => setSelectedAlert(null)}
                >
                  关闭
                </button>
                {selectedAlert.status === "open" && (
                  <button
                    className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                    style={{ background: "#00D68F", color: "#fff" }}
                    onClick={() => {
                      setSelectedAlert({ ...selectedAlert, status: "resolved" });
                    }}
                  >
                    标记已解决
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}