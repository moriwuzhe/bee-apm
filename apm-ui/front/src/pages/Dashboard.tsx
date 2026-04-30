import MainLayout from "../components/Layout/MainLayout";
import MetricCard from "../components/UI/MetricCard";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  Server, Cpu, Wifi, AlertTriangle, CheckCircle,
  Activity, Layers, Zap, ArrowRight, Clock
} from "lucide-react";
import StatusBadge from "../components/UI/StatusBadge";
import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api";

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
  return (
    <MainLayout title="监控大盘">
      <div data-cmp="Dashboard" className="space-y-4">

        {/* Metric cards row */}
        <div className="flex gap-3">
          <div className="flex-1">
            <MetricCard title="接入应用总数" value="128" unit="个" trend={5} trendLabel="+5 本周" color="#165DFF" icon={<Layers size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="Agent 在线" value="96" unit="/112" trend={0} trendLabel="在线率 85.7%" color="#00D68F" icon={<Activity size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="服务器节点" value="48" unit="台" trend={0} trendLabel="12台告警" color="#FFAA00" icon={<Server size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="活跃告警" value="23" unit="条" trend={15} trendLabel="+15% 今日" color="#FF4D4F" icon={<AlertTriangle size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="系统健康度" value="87.3" unit="%" trend={-3} trendLabel="-3% 较昨日" color="#00D68F" icon={<CheckCircle size={14} />} />
          </div>
          <div className="flex-1">
            <MetricCard title="平均响应时间" value="142" unit="ms" trend={8} trendLabel="+8ms 较昨日" color="#A855F7" icon={<Zap size={14} />} />
          </div>
        </div>

        {/* Charts row */}
        <div className="flex gap-3">
          {/* Core trend */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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
          <div className="w-72 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
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
      </div>
    </MainLayout>
  );
}
