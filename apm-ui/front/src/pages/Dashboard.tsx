import MainLayout from "../components/Layout/MainLayout";
import MetricCard from "../components/UI/MetricCard";
import TechButton from "../components/UI/TechButton";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  Server, Cpu, Wifi, AlertTriangle, CheckCircle,
  Activity, Layers, Zap, ArrowRight, Clock,
  BarChart3, TrendingUp, TrendingDown, X, Search, Filter, Eye, Target
} from "lucide-react";
import StatusBadge from "../components/UI/StatusBadge";
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api";

// 告警聚合数据
const alertAggregationData = {
  totalAlerts: 23,
  critical: 5,
  warning: 12,
  info: 6,
  topIssues: [
    { id: 1, name: "OOM 问题", count: 8, severity: "critical", trend: "up" },
    { id: 2, name: "CPU 过载", count: 7, severity: "warning", trend: "down" },
    { id: 3, name: "响应延迟", count: 5, severity: "warning", trend: "stable" },
    { id: 4, name: "GC 频繁", count: 3, severity: "info", trend: "up" },
  ],
  serviceImpacts: [
    { id: 1, service: "order-service", impact: "high", alerts: 6 },
    { id: 2, service: "payment-gateway", impact: "medium", alerts: 4 },
    { id: 3, service: "user-service", impact: "low", alerts: 2 },
  ],
  trendByHour: Array.from({ length: 24 }, (_, i) => ({
    hour: `${i}:00`,
    alerts: Math.floor(Math.random() * 15),
  })),
};

// 根因分析数据
const rootCauseAnalysis = {
  currentIssue: "order-service 频繁 OOM",
  possibleCauses: [
    { id: 1, cause: "内存泄漏", confidence: 85, recommendation: "检查 JVM 堆内存配置" },
    { id: 2, cause: "流量突增", confidence: 72, recommendation: "检查负载均衡配置" },
    { id: 3, cause: "异常请求", confidence: 60, recommendation: "查看错误日志" },
  ],
  timeline: [
    { time: "10:25", event: "首次 OOM 告警", severity: "warning" },
    { time: "10:30", event: "CPU 利用率突增", severity: "warning" },
    { time: "10:35", event: "响应延迟 > 2s", severity: "critical" },
    { time: "10:40", event: "多个实例 OOM", severity: "critical" },
  ],
};

// 默认数据，在API未加载时显示
const defaultTrendData = [
  { time: "00:00", cpu: 32, mem: 54, net: 120, err: 2 },
  { time: "02:00", cpu: 28, mem: 52, net: 98,  err: 0 },
  { time: "04:00", cpu: 22, mem: 51, net: 76,  err: 1 },
  { time: "06:00", cpu: 35, mem: 55, net: 145, err: 3 },
  { time: "08:00", cpu: 68, mem: 62, net: 320, err: 5 },
  { time: "10:00", cpu: 75, mem: 68, net: 480, err: 8 },
  { time: "12:00", cpu: 82, mem: 72, net: 510, err: 12 },
  { time: "14:00", cpu: 79, mem: 70, net: 490, err: 7 },
  { time: "16:00", cpu: 85, mem: 74, net: 530, err: 15 },
  { time: "18:00", cpu: 71, mem: 68, net: 420, err: 9 },
  { time: "20:00", cpu: 55, mem: 63, net: 280, err: 4 },
  { time: "22:00", cpu: 41, mem: 58, net: 190, err: 2 },
];

const defaultAlertData = [
  { name: "Mon", critical: 3, warning: 8, info: 15 },
  { name: "Tue", critical: 1, warning: 5, info: 12 },
  { name: "Wed", critical: 5, warning: 12, info: 20 },
  { name: "Thu", critical: 2, warning: 7, info: 18 },
  { name: "Fri", critical: 8, warning: 15, info: 25 },
  { name: "Sat", critical: 1, warning: 3, info: 8 },
  { name: "Sun", critical: 0, warning: 2, info: 6 },
];

const defaultRecentAlerts = [
  { app: "order-service", env: "production", type: "OOM", level: "error", time: "2分钟前" },
  { app: "192.168.1.15", env: "host",       type: "CPU > 85%", level: "warning", time: "8分钟前" },
  { app: "gateway-v2",   env: "production", type: "响应延迟 > 2s", level: "warning", time: "15分钟前" },
  { app: "mysql-master", env: "production", type: "连接数 > 80%", level: "warning", time: "22分钟前" },
  { app: "user-service", env: "staging",    type: "实例宕机", level: "error", time: "35分钟前" },
];

const defaultTopApps = [
  { name: "order-service", status: "error", cpu: 85, mem: 92, inst: 3 },
  { name: "payment-gateway", status: "online", cpu: 42, mem: 68, inst: 2 },
  { name: "user-service", status: "warning", cpu: 68, mem: 75, inst: 4 },
  { name: "inventory-svc", status: "online", cpu: 31, mem: 55, inst: 2 },
  { name: "notification-svc", status: "online", cpu: 18, mem: 42, inst: 1 },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg text-xs" style={{ background: "#1E293B", border: "1px solid rgba(22,93,255,0.3)" }}>
        <div className="font-medium mb-1" style={{ color: "#94A3B8" }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span style={{ color: "#E2E8F0" }}>{p.name}: {p.value}{p.name === "网络" ? " MB/s" : p.name === "错误数" ? "" : "%"}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [trendData, setTrendData] = useState(defaultTrendData);
  const [alertData, setAlertData] = useState(defaultAlertData);
  const [recentAlerts, setRecentAlerts] = useState(defaultRecentAlerts);
  const [topApps, setTopApps] = useState(defaultTopApps);
  const [showAlertAggregation, setShowAlertAggregation] = useState(false);
  const [showRootCause, setShowRootCause] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("开始加载Dashboard数据...");

        // 获取统计数据
        try {
          const statsResponse = await dashboardApi.getStats();
          console.log("Dashboard统计响应:", statsResponse);
          if (statsResponse.data) {
            setStats(statsResponse.data);
          }
        } catch (error) {
          console.error("获取统计数据失败:", error);
        }

        // 获取趋势数据
        try {
          const trendResponse = await dashboardApi.getTrend();
          console.log("Dashboard趋势响应:", trendResponse);
          if (trendResponse.data) {
            setTrendData(trendResponse.data);
          }
        } catch (error) {
          console.error("获取趋势数据失败:", error);
        }

        // 获取告警趋势
        try {
          const alertTrendResponse = await dashboardApi.getAlertTrend();
          console.log("Dashboard告警趋势响应:", alertTrendResponse);
          if (alertTrendResponse.data) {
            setAlertData(alertTrendResponse.data);
          }
        } catch (error) {
          console.error("获取告警趋势失败:", error);
        }

        // 获取最新告警
        try {
          const recentAlertsResponse = await dashboardApi.getRecentAlerts();
          console.log("Dashboard最新告警响应:", recentAlertsResponse);
          if (recentAlertsResponse.data) {
            setRecentAlerts(recentAlertsResponse.data);
          }
        } catch (error) {
          console.error("获取最新告警失败:", error);
        }

        // 获取Top应用
        try {
          const topAppsResponse = await dashboardApi.getTopApps();
          console.log("Dashboard Top应用响应:", topAppsResponse);
          if (topAppsResponse.data) {
            setTopApps(topAppsResponse.data);
          }
        } catch (error) {
          console.error("获取Top应用失败:", error);
        }
      } catch (error) {
        console.error("加载Dashboard数据失败:", error);
      } finally {
        setLoading(false);
        console.log("Dashboard数据加载完成");
      }
    };

    fetchData();
  }, []);

  const displayStats = stats || {
    totalApps: 128,
    onlineAgents: 96,
    totalAgents: 112,
    serverNodes: 48,
    activeAlerts: 23,
    healthScore: 87.3,
    avgResponseTime: 142,
  };

  if (loading) {
    return (
      <MainLayout title="监控大盘">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm" style={{ color: "#94A3B8" }}>加载中...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="监控大盘">
      <div data-cmp="Dashboard" className="space-y-4">

        {/* Metric cards row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <MetricCard title="接入应用总数" value={displayStats.totalApps} unit="个" trend={5} trendLabel="+5 本周" color="#165DFF" icon={<Layers size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="Agent 在线" value={displayStats.onlineAgents} unit={`/${displayStats.totalAgents}`} trend={0} trendLabel="在线率 85.7%" color="#00D68F" icon={<Activity size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="服务器节点" value={displayStats.serverNodes} unit="台" trend={0} trendLabel="12台告警" color="#FFAA00" icon={<Server size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="活跃告警" value={displayStats.activeAlerts} unit="条" trend={15} trendLabel="+15% 今日" color="#FF4D4F" icon={<AlertTriangle size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="系统健康度" value={displayStats.healthScore} unit="%" trend={-3} trendLabel="-3% 较昨日" color="#00D68F" icon={<CheckCircle size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="平均响应时间" value={displayStats.avgResponseTime} unit="ms" trend={8} trendLabel="+8ms 较昨日" color="#A855F7" icon={<Zap size={14} />} />
          </div>
        </div>

        {/* Charts row */}
        <div className="flex gap-3">
          {/* Core trend */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 250 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">核心指标趋势</span>
              <div className="flex gap-2">
                {["24h", "7d", "30d"].map((t, i) => (
                  <button key={t} className="text-xs px-2 py-0.5 rounded" style={{ background: i === 0 ? "rgba(22,93,255,0.2)" : "transparent", color: i === 0 ? "#165DFF" : "var(--muted-foreground)", border: i === 0 ? "1px solid rgba(22,93,255,0.4)" : "1px solid transparent" }}>{t}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradCpu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMem" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D68F" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00D68F" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="time" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94A3B8" }} />
                <Area type="monotone" dataKey="cpu" name="CPU" stroke="#165DFF" fill="url(#gradCpu)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="mem" name="内存" stroke="#00D68F" fill="url(#gradMem)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Alert trend */}
          <div className="w-72 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 250 }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">告警趋势</span>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>近7天</span>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={alertData} barSize={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="name" tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="critical" name="严重" fill="#FF4D4F" radius={[2, 2, 0, 0]} />
                <Bar dataKey="warning" name="警告" fill="#FFAA00" radius={[2, 2, 0, 0]} />
                <Bar dataKey="info" name="提示" fill="#165DFF" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom row */}
        <div className="flex gap-3">
          {/* Recent alerts */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">最新告警</span>
              <button className="flex items-center gap-1 text-xs" style={{ color: "#165DFF" }}>查看全部 <ArrowRight size={12} /></button>
            </div>
            <div className="space-y-2">
              {recentAlerts.map((a, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.level === "error" ? "status-dot-red" : "status-dot-yellow"}`} />
                  <span className="flex-1 text-xs text-white">{a.app}</span>
                  <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(148,163,184,0.1)", color: "var(--muted-foreground)" }}>{a.env}</span>
                  <span className="text-xs" style={{ color: a.level === "error" ? "#FF4D4F" : "#FFAA00" }}>{a.type}</span>
                  <span className="text-xs flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}><Clock size={10} />{a.time}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top apps */}
          <div className="w-80 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white">应用健康排行</span>
              <ArrowRight size={14} style={{ color: "var(--muted-foreground)" }} />
            </div>
            <div className="space-y-2">
              {topApps.map((app, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs w-4 text-center" style={{ color: "var(--muted-foreground)" }}>{i + 1}</span>
                  <StatusBadge status={app.status as "online" | "error" | "warning"} />
                  <span className="flex-1 text-xs text-white truncate">{app.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <Cpu size={11} style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-xs" style={{ color: app.cpu > 80 ? "#FF4D4F" : "var(--foreground)" }}>{app.cpu}%</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Server size={11} style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{app.inst}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick access */}
          <div className="w-56 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-3">故障快捷入口</div>
            <div className="space-y-2">
              {[
                { label: "OOM 分析", count: 2, color: "#FF4D4F" },
                { label: "慢查询分析", count: 5, color: "#FFAA00" },
                { label: "线程阻塞", count: 1, color: "#FF4D4F" },
                { label: "GC 频繁", count: 3, color: "#FFAA00" },
                { label: "磁盘告警", count: 2, color: "#FFAA00" },
                { label: "Agent 离线", count: 4, color: "#94A3B8" },
              ].map((item, i) => (
                <button key={i} className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs transition-colors table-row-hover" style={{ background: "var(--muted)" }}>
                  <span className="text-white">{item.label}</span>
                  <span className="px-1.5 py-0.5 rounded-full text-xs font-medium" style={{ background: `${item.color}1a`, color: item.color }}>{item.count}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 快捷操作区域 */}
        <div className="flex gap-3 mt-4">
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">系统洞察</span>
              <div className="flex gap-2">
                <TechButton variant="secondary" size="sm" icon={<BarChart3 size={12} />} onClick={() => setShowAlertAggregation(true)}>告警聚合</TechButton>
                <TechButton variant="primary" size="sm" icon={<Target size={12} />} onClick={() => setShowRootCause(true)}>根因分析</TechButton>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">系统稳定性</div>
                <div className="text-lg font-bold text-white">98.7%</div>
                <div className="text-xs text-green-400 mt-1">↑ 2.3% 较上周</div>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <div className="text-xs text-purple-400 mb-1">资源利用率</div>
                <div className="text-lg font-bold text-white">67.2%</div>
                <div className="text-xs text-yellow-400 mt-1">↑ 5.8% 较上周</div>
              </div>
              <div className="p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <div className="text-xs text-cyan-400 mb-1">性能优化</div>
                <div className="text-lg font-bold text-white">12项</div>
                <div className="text-xs text-blue-400 mt-1">↓ 4项 已完成</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 告警聚合视图模态框 */}
      {showAlertAggregation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowAlertAggregation(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[1000px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-white">告警聚合视图</h3>
              </div>
              <button onClick={() => setShowAlertAggregation(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-muted border border-border">
                <div className="text-xs text-muted-foreground mb-1">总告警数</div>
                <div className="text-2xl font-bold text-white">{alertAggregationData.totalAlerts}</div>
                <div className="text-xs text-yellow-400 mt-1">↑ 8 较昨日</div>
              </div>
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <div className="text-xs text-red-400 mb-1">严重告警</div>
                <div className="text-2xl font-bold text-red-400">{alertAggregationData.critical}</div>
                <div className="text-xs text-red-400 mt-1">需要立即处理</div>
              </div>
              <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <div className="text-xs text-yellow-400 mb-1">警告告警</div>
                <div className="text-2xl font-bold text-yellow-400">{alertAggregationData.warning}</div>
                <div className="text-xs text-yellow-400 mt-1">需要关注</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <div className="text-xs text-blue-400 mb-1">信息告警</div>
                <div className="text-2xl font-bold text-blue-400">{alertAggregationData.info}</div>
                <div className="text-xs text-blue-400 mt-1">一般提醒</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-sm font-semibold text-white mb-4">告警类型分布</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '严重', value: alertAggregationData.critical, fill: '#FF4D4F' },
                        { name: '警告', value: alertAggregationData.warning, fill: '#FFAA00' },
                        { name: '信息', value: alertAggregationData.info, fill: '#165DFF' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: '严重', value: alertAggregationData.critical, fill: '#FF4D4F' },
                        { name: '警告', value: alertAggregationData.warning, fill: '#FFAA00' },
                        { name: '信息', value: alertAggregationData.info, fill: '#165DFF' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-sm font-semibold text-white mb-4">24小时告警趋势</div>
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={alertAggregationData.trendByHour}>
                    <defs>
                      <linearGradient id="gradAlerts" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF4D4F" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#FF4D4F" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                    <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="alerts" stroke="#FF4D4F" fill="url(#gradAlerts)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-sm font-semibold text-white mb-3">Top问题</div>
                <div className="space-y-2">
                  {alertAggregationData.topIssues.map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          issue.severity === "critical" ? "bg-red-500/20 text-red-400" :
                          issue.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {issue.severity === "critical" ? "严重" :
                           issue.severity === "warning" ? "警告" : "信息"}
                        </span>
                        <span className="text-sm text-white">{issue.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{issue.count}次</span>
                        {issue.trend === "up" && <TrendingUp size={12} className="text-red-400" />}
                        {issue.trend === "down" && <TrendingDown size={12} className="text-green-400" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-sm font-semibold text-white mb-3">服务影响</div>
                <div className="space-y-2">
                  {alertAggregationData.serviceImpacts.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-2 rounded-lg bg-card/50">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          service.impact === "high" ? "bg-red-500/20 text-red-400" :
                          service.impact === "medium" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {service.impact === "high" ? "高危" :
                           service.impact === "medium" ? "中危" : "低危"}
                        </span>
                        <span className="text-sm text-white">{service.service}</span>
                      </div>
                      <span className="text-sm font-medium text-white">{service.alerts}条告警</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <TechButton variant="secondary" onClick={() => setShowAlertAggregation(false)}>关闭</TechButton>
              <TechButton variant="primary">导出报告</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 根因分析模态框 */}
      {showRootCause && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowRootCause(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Target size={20} className="text-blue-500" />
                <h3 className="text-lg font-semibold text-white">根因分析</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">重新分析</TechButton>
                <button onClick={() => setShowRootCause(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <div className="flex items-center gap-3">
                <AlertTriangle size={20} className="text-red-400" />
                <div>
                  <div className="text-sm font-semibold text-red-400">{rootCauseAnalysis.currentIssue}</div>
                  <div className="text-xs text-muted-foreground mt-1">AI 正在分析可能原因...</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 flex-1 overflow-hidden">
              <div className="rounded-xl bg-muted border border-border p-4 overflow-y-auto">
                <div className="text-sm font-semibold text-white mb-4">可能原因</div>
                <div className="space-y-3">
                  {rootCauseAnalysis.possibleCauses.map((cause) => (
                    <div key={cause.id} className="p-4 rounded-lg bg-card/50 border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{cause.cause}</span>
                        <div className="flex items-center gap-2">
                          <div className="text-xs text-muted-foreground">置信度</div>
                          <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500"
                              style={{ width: `${cause.confidence}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-blue-400">{cause.confidence}%</span>
                        </div>
                      </div>
                      <div className="text-xs text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded">
                        💡 {cause.recommendation}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl bg-muted border border-border p-4">
                <div className="text-sm font-semibold text-white mb-4">事件时间线</div>
                <div className="space-y-3">
                  {rootCauseAnalysis.timeline.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${
                          item.severity === "critical" ? "bg-red-500" :
                          item.severity === "warning" ? "bg-yellow-500" :
                          "bg-blue-500"
                        }`} />
                        {index < rootCauseAnalysis.timeline.length - 1 && (
                          <div className="w-0.5 flex-1 bg-gray-700 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs text-muted-foreground">{item.time}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            item.severity === "critical" ? "bg-red-500/20 text-red-400" :
                            item.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                            "bg-blue-500/20 text-blue-400"
                          }`}>
                            {item.severity === "critical" ? "严重" :
                             item.severity === "warning" ? "警告" : "信息"}
                          </span>
                        </div>
                        <span className="text-sm text-white">{item.event}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <TechButton variant="secondary" onClick={() => setShowRootCause(false)}>关闭</TechButton>
              <TechButton variant="primary">执行建议</TechButton>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
