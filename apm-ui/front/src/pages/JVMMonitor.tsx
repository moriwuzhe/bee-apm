import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { Cpu, HardDrive, Wifi, Activity, Thermometer, RefreshCw, Zap, Clock, AlertTriangle, TrendingUp, Settings, Database, Target, Shield } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { jvmApi } from "../services/api";

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
  const { showToast } = useToast();
  const [selectedApp, setSelectedApp] = useState("");
  const [timeRange, setTimeRange] = useState("30m");
  const [apps, setApps] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [chartData, setChartData] = useState({ cpuData: [] as {t: string; v: number}[], memData: [] as {t: string; heap: number; nonheap?: number}[], gcData: [] as {t: string; ygc: number; fgc: number}[], netData: [] as {t: string; rx: number; tx: number}[], threadData: [] as {t: string; live: number; daemon: number; peak: number}[] });
  const [isRealtime, setIsRealtime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [showAlertConfig, setShowAlertConfig] = useState(false);
  const [alertThresholds, setAlertThresholds] = useState({
    cpu: 85,
    memory: 90,
    heap: 85,
    gcFrequency: 10,
    threadCount: 200,
  });
  const [alerts, setAlerts] = useState<Array<{
    id: number;
    type: string;
    severity: "critical" | "warning" | "info";
    message: string;
    timestamp: string;
  }>>([]);

  const [advancedMetrics, setAdvancedMetrics] = useState({
    heapMemory: { used: 512, max: 1024, Eden: 156, Survivor: 45, OldGen: 311 },
    nonHeapMemory: { used: 89, max: 256 },
    classLoading: { loaded: 15234, unloaded: 234 },
    codeCache: { used: 28, max: 48 },
    metaspace: { used: 86, max: 512 },
    compressedClass: { used: 35, max: 128 },
    threadStats: { live: 125, daemon: 98, peak: 156, started: 2340 },
    gcStats: { youngGC: { count: 1256, time: 4567 }, fullGC: { count: 12, time: 890 } },
    directBuffer: { count: 15, memory: 256 },
    mappedBuffer: { count: 3, memory: 128 },
  });

  const [gcOptimizationSuggestions, setGcOptimizationSuggestions] = useState([
    { id: 1, type: "memory", severity: "warning", title: "老年代内存使用率偏高", description: "当前老年代使用率 78%，建议调整 -XX:NewRatio 参数或增加堆内存", suggestion: "建议将堆内存从 1GB 增加到 1.5GB 或调整 NewRatio 为 2" },
    { id: 2, type: "gc", severity: "info", title: "Full GC 频率正常", description: "Full GC 触发频率为每 2 小时一次，符合预期", suggestion: "继续保持当前配置" },
    { id: 3, type: "thread", severity: "info", title: "线程数稳定", description: "活跃线程数 125 个，峰值 156 个，运行稳定", suggestion: "无需优化" },
  ]);

  const [memoryLeakDetection, setMemoryLeakDetection] = useState({
    status: "healthy",
    heapTrend: [
      { time: "10:00", used: 480, max: 1024 },
      { time: "10:05", used: 495, max: 1024 },
      { time: "10:10", used: 510, max: 1024 },
      { time: "10:15", used: 528, max: 1024 },
      { time: "10:20", used: 512, max: 1024 },
    ],
    suspicion: null as { confidence: number; cause: string } | null,
  });

  const [jvmConfigRecommendations, setJvmConfigRecommendations] = useState([
    { param: "-Xms/-Xmx", current: "1g", recommended: "2g", reason: "当前堆内存偏小，建议增大以提升性能" },
    { param: "-XX:NewRatio", current: "2", recommended: "3", reason: "适当增大年轻代比例，减少Minor GC频率" },
    { param: "-XX:SurvivorRatio", current: "8", recommended: "6", reason: "调整Survivor区比例，优化对象晋升策略" },
    { param: "-XX:MaxGCPauseMillis", current: "未设置", recommended: "200", reason: "设置GC暂停时间目标，优化GC策略" },
  ]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, hostMetricsRes, heapRes, threadRes, gcRes, netRes] = await Promise.all([
        jvmApi.getApplications(),
        selectedApp ? jvmApi.getHostMetrics(selectedApp) : Promise.resolve({ success: true, data: {} }),
        jvmApi.getHeapMemData(),
        jvmApi.getThreadData(),
        jvmApi.getGcData(),
        jvmApi.getNetworkData(),
      ]);
      
      if (appsRes.data && appsRes.data.length > 0) {
        setApps(appsRes.data);
        if (!selectedApp) {
          setSelectedApp(appsRes.data[0]);
        }
      }
      
      if (hostMetricsRes.data) {
        setMetrics(hostMetricsRes.data);
      }
      
      if (heapRes.data && heapRes.data.length > 0) {
        setChartData(prev => ({ ...prev, memData: heapRes.data }));
      }
      
      if (threadRes.data && threadRes.data.length > 0) {
        setChartData(prev => ({ ...prev, threadData: threadRes.data }));
      }
      
      if (gcRes.data && gcRes.data.length > 0) {
        setChartData(prev => ({ ...prev, gcData: gcRes.data }));
      }
      
      if (netRes.data && netRes.data.length > 0) {
        setChartData(prev => ({ ...prev, netData: netRes.data }));
      }
      
      showToast("数据刷新成功", "success");
    } catch (error) {
      console.error("Failed to load JVM data:", error);
      showToast("数据加载失败", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedApp]);

  useEffect(() => {
    if (!isRealtime) return;
    const interval = setInterval(() => {
      console.log("实时刷新JVM监控数据...");
      setLastRefreshTime(new Date());
      loadData();
    }, refreshInterval * 1000);
    return () => clearInterval(interval);
  }, [isRealtime, refreshInterval]);

  const handleRefresh = () => {
    showToast(`正在刷新 JVM 监控数据...`, "info");
    setLastRefreshTime(new Date());
    loadData();
  };

  const handleExport = () => {
    const exportData = {
      exportTime: new Date().toISOString(),
      appName: selectedApp,
      metrics: metrics,
      advancedMetrics: advancedMetrics,
      chartData: chartData,
    };
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jvm-metrics-${selectedApp}-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("JVM监控数据导出成功", "success");
  };

  const checkAlerts = () => {
    const newAlerts: typeof alerts = [];
    if (metrics.cpuUsage > alertThresholds.cpu) {
      newAlerts.push({
        id: Date.now(),
        type: "CPU",
        severity: metrics.cpuUsage > 95 ? "critical" : "warning",
        message: `CPU使用率 ${metrics.cpuUsage}% 超过阈值 ${alertThresholds.cpu}%`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    if (metrics.memUsage > alertThresholds.memory) {
      newAlerts.push({
        id: Date.now() + 1,
        type: "Memory",
        severity: "warning",
        message: `内存使用率 ${metrics.memUsage}% 超过阈值 ${alertThresholds.memory}%`,
        timestamp: new Date().toLocaleTimeString(),
      });
    }
    setAlerts(newAlerts);
  };

  useEffect(() => {
    checkAlerts();
  }, [metrics]);

  const hostMetrics = metrics || {
    cpuUsage: 0,
    memUsage: 0,
    diskIO: 0,
    network: 0,
  };

  return (
    <MainLayout title="主机 & JVM 监控">
      <div data-cmp="JVMMonitor" className="space-y-4">
        <PageHeader
          title="主机 & JVM 监控详情"
          subtitle="实时监控主机资源与JVM运行状态"
          actions={
            <>
              <select
                className="h-8 px-3 rounded-md text-xs outline-none appearance-none cursor-pointer"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                value={selectedApp}
                onChange={(e) => setSelectedApp(e.target.value)}
              >
                {apps.length > 0 ? apps.map((a) => <option key={a} value={a} style={{ color: "var(--foreground)", background: "var(--card)" }}>{a}</option>) : <option value="" style={{ color: "var(--foreground)", background: "var(--card)" }}>暂无应用</option>}
              </select>
              <div className="flex gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {["5m", "30m", "1h", "6h", "24h"].map((t) => (
                  <button key={t} onClick={() => setTimeRange(t)} className="px-2.5 py-1 rounded text-xs" style={{ background: timeRange === t ? "#165DFF" : "transparent", color: timeRange === t ? "#fff" : "var(--muted-foreground)" }}>{t}</button>
                ))}
              </div>
              <TechButton variant="secondary" icon={<Settings size={13} />} onClick={() => setShowAlertConfig(!showAlertConfig)}>告警配置</TechButton>
              <TechButton variant="secondary" icon={<Activity size={13} />} onClick={handleExport}>导出</TechButton>
              <TechButton variant="primary" icon={<RefreshCw size={13} />} onClick={handleRefresh} disabled={loading}>{loading ? "刷新中..." : "刷新"}</TechButton>
            </>
          }
        />

        {/* 实时监控控制栏 */}
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRealtime(!isRealtime)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isRealtime ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
              }`}
            >
              {isRealtime ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  实时监控中
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-500" />
                  已暂停
                </>
              )}
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>刷新间隔:</span>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1.5 rounded-lg border text-xs"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value={10}>10秒</option>
                <option value={30}>30秒</option>
                <option value={60}>1分钟</option>
                <option value={300}>5分钟</option>
              </select>
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              最后刷新: {lastRefreshTime.toLocaleTimeString()}
            </div>
          </div>
          {alerts.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: "rgba(255,77,79,0.1)", color: "#FF4D4F" }}>
                {alerts.length} 个告警
              </span>
            </div>
          )}
        </div>

        {/* 告警配置面板 */}
        {showAlertConfig && (
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-white">告警阈值配置</span>
              <button
                onClick={() => setShowAlertConfig(false)}
                className="p-1 hover:bg-input rounded"
                style={{ color: "var(--muted-foreground)" }}
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>CPU阈值 (%)</label>
                <input
                  type="number"
                  value={alertThresholds.cpu}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, cpu: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>内存阈值 (%)</label>
                <input
                  type="number"
                  value={alertThresholds.memory}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, memory: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>堆内存阈值 (%)</label>
                <input
                  type="number"
                  value={alertThresholds.heap}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, heap: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>GC频率阈值</label>
                <input
                  type="number"
                  value={alertThresholds.gcFrequency}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, gcFrequency: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>线程数阈值</label>
                <input
                  type="number"
                  value={alertThresholds.threadCount}
                  onChange={(e) => setAlertThresholds({ ...alertThresholds, threadCount: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <TechButton variant="secondary" size="sm" onClick={() => setShowAlertConfig(false)}>取消</TechButton>
              <TechButton variant="primary" size="sm" onClick={() => { showToast("告警配置已保存", "success"); setShowAlertConfig(false); }}>保存配置</TechButton>
            </div>
          </div>
        )}

        {apps.length === 0 ? (
          <div className="flex items-center justify-center h-64" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Activity size={48} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-4" />
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无监控数据，请等待 Agent 上报</div>
            </div>
          </div>
        ) : (
          <>
        {/* Host metrics row */}
        <div className="flex gap-3">
          {[
            { title: "CPU 使用率", value: hostMetrics.cpuUsage?.toString() || "0", unit: "%", color: "#165DFF", icon: <Cpu size={14} />, sub: "等待数据...", warn: parseFloat(hostMetrics.cpuUsage?.toString() || "0") > 80 },
            { title: "内存使用率", value: hostMetrics.memUsage?.toString() || "0", unit: "%", color: "#00D68F", icon: <Activity size={14} />, sub: "等待数据...", warn: false },
            { title: "磁盘 IO",    value: hostMetrics.diskIO?.toString() || "0", unit: "MB/s", color: "#FFAA00", icon: <HardDrive size={14} />, sub: "等待数据...", warn: false },
            { title: "网络流量",   value: hostMetrics.network?.toString() || "0", unit: "Mbps", color: "#A855F7", icon: <Wifi size={14} />, sub: "等待数据...", warn: false },
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
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">堆内存 / 非堆内存</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>等待数据...</div>
              </div>
              <Thermometer size={16} style={{ color: "#FF4D4F" }} />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData.memData}>
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
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">线程监控</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>等待数据...</div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={chartData.threadData}>
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
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">GC 监控</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>等待数据...</div>
              </div>
              <div className="flex gap-3">
                {[["YGC", "#00D68F", "等待..."], ["FGC", "#FF4D4F", "等待..."]].map(([label, color, desc]) => (
                  <div key={label} className="text-right">
                    <div className="text-xs font-medium" style={{ color }}>{label}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={chartData.gcData} barSize={10}>
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
          <div className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)", minHeight: 200 }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-medium text-white">网络流量</div>
                <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>等待数据...</div>
              </div>
              <Wifi size={16} style={{ color: "#A855F7" }} />
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={chartData.netData}>
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
                { label: "已加载类", value: "0", color: "#165DFF" },
                { label: "已卸载类", value: "0",    color: "#94A3B8" },
                { label: "编译方法", value: "0", color: "#00D68F" },
                { label: "编译耗时", value: "0s",  color: "#FFAA00" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-md" style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.2)" }}>
              <div className="text-xs font-medium mb-1" style={{ color: "#FF4D4F" }}>等待数据</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>暂无告警信息</div>
            </div>
          </div>
        </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
