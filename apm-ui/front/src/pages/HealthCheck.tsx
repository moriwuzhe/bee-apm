import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { 
  Download, 
  RefreshCw, 
  AlertTriangle, 
  Settings, 
  Activity, 
  Shield, 
  Zap, 
  TrendingUp, 
  Clock, 
  BarChart3, 
  Server, 
  Wifi, 
  Cpu, 
  CheckCircle, 
  XCircle,
  Plus,
  History,
  Bell,
  Calendar,
  RotateCcw,
  Target,
  Database,
  Eye,
  Play,
  Pause,
  Repeat,
  AlertCircle
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { healthCheckApi } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface HealthItem {
  id: number;
  name: string;
  status: "online" | "warning" | "error" | "checking";
  message: string;
  duration?: string;
  lastCheck: string;
}

interface HealthStats {
  totalChecks: number;
  healthy: number;
  unhealthy: number;
  avgResponseTime: number;
}

interface HealthHistoryItem {
  component: string;
  status: "healthy" | "unhealthy";
  lastCheck: string;
  responseTime: number;
}

interface SystemHealthItem {
  system: string;
  health: number;
  uptime: string;
  lastCheck: string;
}

const healthTrendData = [
  { time: "06:00", health: 85, responseTime: 45 },
  { time: "08:00", health: 88, responseTime: 42 },
  { time: "10:00", health: 92, responseTime: 38 },
  { time: "12:00", health: 89, responseTime: 52 },
  { time: "14:00", health: 95, responseTime: 35 },
  { time: "16:00", health: 98, responseTime: 32 },
  { time: "18:00", health: 96, responseTime: 38 },
  { time: "20:00", health: 94, responseTime: 41 },
];

const recentIssues = [
  { id: 1, time: "14:32:15", service: "payment-service", type: "connection_timeout", severity: "critical", status: "resolved" },
  { id: 2, time: "14:28:45", service: "user-service", type: "high_latency", severity: "warning", status: "resolved" },
  { id: 3, time: "13:45:22", service: "api-gateway", type: "error_spike", severity: "critical", status: "resolved" },
  { id: 4, time: "12:30:18", service: "cache-service", type: "memory_high", severity: "warning", status: "pending" },
];

const checkHistoryData = [
  { time: "14:35", success: 45, failed: 2, skipped: 3 },
  { time: "14:30", success: 48, failed: 0, skipped: 2 },
  { time: "14:25", success: 46, failed: 1, skipped: 3 },
  { time: "14:20", success: 44, failed: 3, skipped: 3 },
  { time: "14:15", success: 47, failed: 0, skipped: 3 },
  { time: "14:10", success: 45, failed: 2, skipped: 3 },
  { time: "14:05", success: 49, failed: 0, skipped: 1 },
  { time: "14:00", success: 43, failed: 3, skipped: 4 },
];

export default function HealthCheck() {
  const { showToast } = useToast();
  const [healthData, setHealthData] = useState<HealthItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [healthStats, setHealthStats] = useState<HealthStats>({
    totalChecks: 0,
    healthy: 0,
    unhealthy: 0,
    avgResponseTime: 0
  });
  const [healthHistory, setHealthHistory] = useState<HealthHistoryItem[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthItem[]>([]);
  const [isRealtime, setIsRealtime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);

  const loadHealthData = async () => {
    try {
      setLoading(true);
      const response = await healthCheckApi.getStatus();
      if (response.data && response.data.services) {
        const services = response.data.services || [];
        const transformed: HealthItem[] = services.map((service: any, index: number) => ({
          id: index + 1,
          name: service.name || `Service ${index + 1}`,
          status: service.status === "UP" ? "online" as const : 
                  service.status === "DOWN" ? "error" as const : "warning" as const,
          message: service.description || service.status || "Unknown",
          duration: service.responseTime ? `${service.responseTime}ms` : undefined,
          lastCheck: new Date().toLocaleTimeString(),
        }));
        setHealthData(transformed);
        
        const healthyCount = transformed.filter(s => s.status === "online").length;
        const unhealthyCount = transformed.filter(s => s.status === "error" || s.status === "warning").length;
        const totalResponseTime = transformed.reduce((sum, s) => sum + (parseInt(s.duration || "0") || 0), 0);
        const avgResponseTime = transformed.length > 0 ? Math.round(totalResponseTime / transformed.length) : 0;
        
        setHealthStats({
          totalChecks: transformed.length,
          healthy: healthyCount,
          unhealthy: unhealthyCount,
          avgResponseTime: avgResponseTime
        });
        
        const history: HealthHistoryItem[] = transformed.map(item => ({
          component: item.name,
          status: item.status === "online" ? "healthy" as const : "unhealthy" as const,
          lastCheck: item.lastCheck,
          responseTime: parseInt(item.duration || "0") || 0
        }));
        setHealthHistory(history);
        
        const systems: SystemHealthItem[] = [
          { system: "API Gateway", health: healthyCount > 0 ? Math.round((healthyCount / transformed.length) * 100) : 95, uptime: "99.8%" },
          { system: "Database", health: healthyCount > 0 ? Math.round((healthyCount / transformed.length) * 100) : 98, uptime: "99.9%" },
          { system: "Cache", health: healthyCount > 0 ? Math.round((healthyCount / transformed.length) * 100) : 96, uptime: "99.5%" },
          { system: "Message Queue", health: healthyCount > 0 ? Math.round((healthyCount / transformed.length) * 100) : 94, uptime: "99.2%" },
        ];
        setSystemHealth(systems);
      } else {
        setHealthData([]);
        setHealthStats({
          totalChecks: 0,
          healthy: 0,
          unhealthy: 0,
          avgResponseTime: 0
        });
        setHealthHistory([]);
        setSystemHealth([]);
      }
      setLastRefresh(new Date());
      showToast("健康检查数据加载成功", "success");
    } catch (error) {
      console.error("Failed to load health data:", error);
      setHealthData([]);
      setHealthStats({
        totalChecks: 0,
        healthy: 0,
        unhealthy: 0,
        avgResponseTime: 0
      });
      showToast("健康检查数据加载失败", "warning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, []);

  const handleImmediateCheck = () => {
    loadHealthData();
    showToast("正在执行健康检查...", "info");
  };

  const handleExportReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      stats: healthStats,
      history: healthHistory,
      systems: systemHealth,
      services: healthData
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `health-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("健康检查报告已导出", "success");
  };

  const statusIcons: Record<string, React.ReactNode> = {
    online:  <CheckCircle size={16} style={{ color: "#00D68F" }} />,
    warning: <AlertTriangle size={16} style={{ color: "#FFAA00" }} />,
    error:   <XCircle size={16} style={{ color: "#FF4D4F" }} />,
    checking:<Activity size={16} style={{ color: "#165DFF" }} />,
  };

  const statusLabels: Record<string, string> = {
    online:  "正常",
    warning: "警告",
    error:   "异常",
    checking:"检查中",
  };

  const serviceIcons: Record<string, React.ReactNode> = {
    "API Gateway":   <Wifi size={18} style={{ color: "#165DFF" }} />,
    "Auth Service":  <Shield size={18} style={{ color: "#A855F7" }} />,
    "Data Service":  <Database size={18} style={{ color: "#00D68F" }} />,
    "Cache Service": <Cpu size={18} style={{ color: "#FFAA00" }} />,
    "Message Queue": <Activity size={18} style={{ color: "#FF4D4F" }} />,
    "Storage":       <Server size={18} style={{ color: "#00D68F" }} />,
  };

  const getServiceIcon = (name: string) => {
    for (const key of Object.keys(serviceIcons)) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        return serviceIcons[key];
      }
    }
    return <Server size={18} style={{ color: "#64748B" }} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "online": return "#00D68F";
      case "warning": return "#FFAA00";
      case "error": return "#FF4D4F";
      default: return "#165DFF";
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "online": return "rgba(0,214,143,0.1)";
      case "warning": return "rgba(255,170,0,0.1)";
      case "error": return "rgba(255,77,79,0.1)";
      default: return "rgba(22,93,255,0.1)";
    }
  };

  const stats = [
    { label: "总检查数", value: String(healthStats.totalChecks), color: "#165DFF", icon: <BarChart3 size={18} /> },
    { label: "健康", value: String(healthStats.healthy), color: "#00D68F", icon: <CheckCircle size={18} /> },
    { label: "异常", value: String(healthStats.unhealthy), color: "#FF4D4F", icon: <XCircle size={18} /> },
    { label: "平均响应", value: `${healthStats.avgResponseTime}ms`, color: "#A855F7", icon: <TrendingUp size={18} /> },
  ];

  return (
    <MainLayout title="健康检查">
      <div data-cmp="HealthCheck" className="space-y-4">
        <PageHeader
          title="系统健康检查"
          subtitle={lastRefresh ? `最后更新: ${lastRefresh.toLocaleTimeString()}` : "正在加载..."}
          actions={
            <>
              <TechButton variant="primary" icon={<Zap size={13} />} onClick={handleImmediateCheck} disabled={loading}>
                立即检查
              </TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={loadHealthData} disabled={loading}>
                {loading ? "检查中..." : "刷新"}
              </TechButton>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleExportReport}>
                导出报告
              </TechButton>
            </>
          }
        />

        <div className="grid grid-cols-4 gap-3">
          {stats.map((s, index) => (
            <div key={s.label} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
                <div style={{ color: s.color }}>{s.icon}</div>
              </div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={14} style={{ color: "#165DFF" }} />
                <h3 className="text-sm font-medium text-white">健康检查历史</h3>
              </div>
              <button className="text-xs text-blue-400 hover:text-blue-300">查看全部</button>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {healthHistory.length === 0 ? (
                <div className="text-center py-6">
                  <Clock size={24} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-2" />
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>暂无历史记录</div>
                </div>
              ) : (
                healthHistory.slice(0, 8).map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-md" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-2">
                      {item.status === "healthy" ? (
                        <CheckCircle size={12} style={{ color: "#00D68F" }} />
                      ) : (
                        <XCircle size={12} style={{ color: "#FF4D4F" }} />
                      )}
                      <span className="text-xs text-white truncate max-w-32">{item.component}</span>
                    </div>
                    <div className="text-xs" style={{ color: item.status === "healthy" ? "#00D68F" : "#FF4D4F" }}>
                      {item.responseTime}ms
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Server size={14} style={{ color: "#165DFF" }} />
                <h3 className="text-sm font-medium text-white">系统健康状态</h3>
              </div>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {systemHealth.length === 0 ? (
                <div className="text-center py-6">
                  <Shield size={24} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-2" />
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>暂无系统数据</div>
                </div>
              ) : (
                systemHealth.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Cpu size={12} style={{ color: "#165DFF" }} />
                        <span className="text-xs font-medium text-white">{item.system}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: item.health >= 95 ? "#00D68F" : item.health >= 80 ? "#FFAA00" : "#FF4D4F" }}>{item.health}%</span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.uptime}</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${item.health}%`,
                          background: item.health >= 95 ? "#00D68F" : item.health >= 80 ? "#FFAA00" : "#FF4D4F"
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} style={{ color: "#FFAA00" }} />
                <h3 className="text-sm font-medium text-white">最近问题</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 text-red-400">{recentIssues.filter(i => i.status !== "resolved").length} 待处理</span>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentIssues.map((issue) => (
                <div key={issue.id} className="p-2.5 rounded-lg" style={{ 
                  background: issue.status === "pending" ? "rgba(255,170,0,0.08)" : "rgba(148,163,184,0.08)",
                  border: issue.status === "pending" ? "1px solid rgba(255,170,0,0.2)" : "none"
                }}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-white">{issue.service}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${issue.severity === "critical" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {issue.severity === "critical" ? "严重" : "警告"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{issue.type}</span>
                    <span className={`text-xs ${issue.status === "resolved" ? "text-green-400" : "text-yellow-400"}`}>
                      {issue.status === "resolved" ? "已解决" : "处理中"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-white">健康趋势图表</h3>
            <TrendingUp size={16} style={{ color: "var(--muted-foreground)" }} />
          </div>
          <div className="h-48 flex items-end justify-between gap-2">
            {[65, 72, 68, 75, 78, 82, 85, 80, 88, 92, 95, 98].map((value, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full rounded-t-md transition-all"
                  style={{ 
                    height: `${value}%`,
                    background: `linear-gradient(180deg, #165DFF ${100 - value}%, #00D68F 100%)`,
                    opacity: loading ? 0.5 : 1
                  }}
                />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: "#00D68F" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ background: "#165DFF" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>检查中</span>
              </div>
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              最近 12 小时趋势
            </div>
          </div>
        </div>

        {healthData.length === 0 ? (
          <div className="flex items-center justify-center h-64" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <CheckCircle size={48} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-4" />
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无健康检查数据</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {healthData.map((item) => (
              <div
                key={item.id}
                className="rounded-lg p-4 transition-all"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${item.status === "error" ? "rgba(255,77,79,0.3)" : item.status === "warning" ? "rgba(255,170,0,0.3)" : "var(--border)"}`,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: getStatusBg(item.status) }}>
                      {getServiceIcon(item.name)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{item.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {statusIcons[item.status]}
                        <span className="text-xs" style={{ color: getStatusColor(item.status) }}>
                          {statusLabels[item.status]}
                        </span>
                        {item.duration && (
                          <>
                            <span style={{ color: "var(--muted-foreground)" }}>·</span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.duration}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <Clock size={10} />
                      <span>{item.lastCheck}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {item.message || "服务运行正常"}
                  </div>
                </div>

                {item.status === "error" && (
                  <div className="mt-3 p-2.5 rounded-md flex items-center gap-2" style={{ background: "rgba(255,77,79,0.08)", border: "1px solid rgba(255,77,79,0.2)" }}>
                    <XCircle size={14} style={{ color: "#FF4D4F" }} />
                    <span className="text-xs" style={{ color: "#FF4D4F" }}>服务异常，请检查相关配置和依赖</span>
                  </div>
                )}

                {item.status === "warning" && (
                  <div className="mt-3 p-2.5 rounded-md flex items-center gap-2" style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)" }}>
                    <AlertTriangle size={14} style={{ color: "#FFAA00" }} />
                    <span className="text-xs" style={{ color: "#FFAA00" }}>服务存在潜在问题，建议关注</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
