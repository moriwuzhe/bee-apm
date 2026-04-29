import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Cpu, HardDrive, Wifi, Activity, Thermometer, RefreshCw } from "lucide-react";

const timePoints = ["10:00", "10:05", "10:10", "10:15", "10:20", "10:25", "10:30", "10:35", "10:40", "10:45", "10:50", "10:55", "11:00"];

const cpuData = timePoints.map((t, i) => ({ t, v: 40 + Math.sin(i * 0.7) * 20 + Math.random() * 10 }));
const memData = timePoints.map((t, i) => ({ t, heap: 60 + Math.sin(i * 0.5) * 15, nonheap: 25 + Math.sin(i * 0.3) * 5 }));
const gcData   = timePoints.map((t, i) => ({ t, ygc: Math.floor(i * 0.8 + Math.random() * 2), fgc: i % 5 === 0 ? 1 : 0 }));
const netData  = timePoints.map((t, i) => ({ t, rx: 50 + Math.random() * 100, tx: 20 + Math.random() * 60 }));
const threadData = timePoints.map((t, i) => ({ t, live: 180 + Math.floor(Math.random() * 40), daemon: 120 + Math.floor(Math.random() * 20), peak: 220 + Math.floor(Math.random() * 10) }));

const apps = ["order-service", "payment-gateway", "user-service", "inventory-service"];

const MiniTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; color: string; name: string }[] }) => {
  if (active && payload?.length) {
    return (
      <div className="px-2 py-1.5 rounded text-xs" style={{ background: "#1E293B", border: "1px solid rgba(22,93,255,0.3)" }}>
        {payload.map((p, i) => <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}</div>)}
      </div>
    );
  }
  return null;
};

export default function JVMMonitor() {
  const [selectedApp, setSelectedApp] = useState("order-service");
  const [timeRange, setTimeRange] = useState("30m");

  return (
    <MainLayout title="主机 & JVM 监控">
      <div data-cmp="JVMMonitor" className="space-y-4">
        <PageHeader
          title="主机 & JVM 监控详情"
          subtitle="实时监控主机资源与JVM运行状态"
          actions={
            <>
              <select
                className="h-8 px-3 rounded-md text-xs outline-none"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
              >
                {apps.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <div className="flex gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {["5m", "30m", "1h", "6h", "24h"].map((t) => (
                  <button key={t} onClick={() => setTimeRange(t)} className="px-2.5 py-1 rounded text-xs" style={{ background: timeRange === t ? "#165DFF" : "transparent", color: timeRange === t ? "#fff" : "var(--muted-foreground)" }}>{t}</button>
                ))}
              </div>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />}>刷新</TechButton>
            </>
          }
        />

        {/* Host metrics row */}
        <div className="flex gap-3">
          {[
            { title: "CPU 使用率", value: "72.4", unit: "%", color: "#165DFF", icon: <Cpu size={14} />, sub: "8核 / 16线程", warn: true },
            { title: "内存使用率", value: "68.1", unit: "%", color: "#00D68F", icon: <Activity size={14} />, sub: "10.9GB / 16GB", warn: false },
            { title: "磁盘 IO",    value: "45.2", unit: "MB/s", color: "#FFAA00", icon: <HardDrive size={14} />, sub: "读 28 / 写 17", warn: false },
            { title: "网络流量",   value: "128.6", unit: "Mbps", color: "#A855F7", icon: <Wifi size={14} />, sub: "IN 80 / OUT 48", warn: false },
          ].map((m) => (
            <div key={m.title} className="flex-1 rounded-lg p-4 card-hover" style={{ background: "var(--card)", border: `1px solid ${m.warn ? "rgba(255,77,79,0.3)" : "var(--border)"}` }}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.title}</span>
                <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${m.color}1a` }}>
                  <span style={{ color: m.color }}>{m.icon}</span>
                </div>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-2xl font-bold" style={{ color: m.warn ? "#FF4D4F" : "var(--foreground)" }}>{m.value}</span>
                <span className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{m.unit}</span>
              </div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.sub}</span>
              <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.1)" }}>
                <div className="h-full rounded-full" style={{ width: `${parseFloat(m.value)}%`, background: m.color, maxWidth: "100%" }} />
              </div>
            </div>
          ))}
        </div>

        {/* JVM Charts - Row 1 */}
        <div className="flex gap-3">
          {/* Heap memory */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">堆内存 / 非堆内存</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Heap: 982MB/1.5GB | NonHeap: 256MB</div>
              </div>
              <Thermometer size={16} style={{ color: "#FF4D4F" }} />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={memData}>
                <defs>
                  <linearGradient id="gradHeap" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNH" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} unit="%" />
                <Tooltip content={<MiniTooltip />} />
                <Area type="monotone" dataKey="heap" name="堆内存" stroke="#165DFF" fill="url(#gradHeap)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="nonheap" name="非堆" stroke="#A855F7" fill="url(#gradNH)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Thread monitor */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">线程监控</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>Live: 198 | Daemon: 134 | Peak: 224</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={threadData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<MiniTooltip />} />
                <Line type="monotone" dataKey="live" name="活跃线程" stroke="#165DFF" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="daemon" name="守护线程" stroke="#00D68F" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
                <Line type="monotone" dataKey="peak" name="峰值" stroke="#FFAA00" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* JVM Charts - Row 2 */}
        <div className="flex gap-3">
          {/* GC */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">GC 监控</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>YGC累计 128次 / FGC累计 6次</div>
              </div>
              <div className="flex gap-3">
                {[["YGC", "#00D68F", "82次 / 12min"], ["FGC", "#FF4D4F", "6次 / 6.5s"]].map(([label, color, desc]) => (
                  <div key={label} className="text-right">
                    <div className="text-xs font-medium" style={{ color }}>{label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={gcData} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip content={<MiniTooltip />} />
                <Bar dataKey="ygc" name="YGC次数" fill="#00D68F" radius={[2, 2, 0, 0]} />
                <Bar dataKey="fgc" name="FGC次数" fill="#FF4D4F" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Network */}
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">网络流量</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>入站: avg 92 MB/s | 出站: avg 48 MB/s</div>
              </div>
              <Wifi size={16} style={{ color: "#A855F7" }} />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={netData}>
                <defs>
                  <linearGradient id="gradRx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTx" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                <XAxis dataKey="t" tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748B", fontSize: 10 }} axisLine={false} tickLine={false} unit="MB" />
                <Tooltip content={<MiniTooltip />} />
                <Area type="monotone" dataKey="rx" name="入站" stroke="#165DFF" fill="url(#gradRx)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="tx" name="出站" stroke="#A855F7" fill="url(#gradTx)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Class loading */}
          <div className="w-64 rounded-lg p-4 flex-shrink-0" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-3">类加载统计</div>
            <div className="space-y-3">
              {[
                { label: "已加载类", value: "12,458", color: "#165DFF" },
                { label: "已卸载类", value: "234",    color: "#94A3B8" },
                { label: "编译方法", value: "45,123", color: "#00D68F" },
                { label: "编译耗时", value: "18.4s",  color: "#FFAA00" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-md" style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.2)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "#FF4D4F" }}>⚠ GC 告警</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>FGC耗时超过500ms，建议排查内存泄露</div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
