import { useState, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Cpu, Database, Wifi, Server, TrendingUp, TrendingDown, Activity, Clock, BarChart3, LineChart, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Plus, Download, RefreshCw, AlertTriangle, CheckCircle, Clock as ClockIcon, TrendingUp as TrendingUpIcon } from "lucide-react";

interface CapacityTrend {
  time: string;
  current: number;
  projected: number;
  threshold: number;
}

interface ResourceMetric {
  name: string;
  current: number;
  threshold: number;
  trend: "up" | "down" | "stable";
  daysUntilFull: number;
  recommended: number;
}

interface ScalingRecommendation {
  id: string;
  type: "scale_up" | "scale_down" | "optimize" | "migrate";
  priority: "high" | "medium" | "low";
  service: string;
  current: number;
  recommended: number;
  reason: string;
  estimated: string;
  effort: "low" | "medium" | "high";
}

const mockCapacityTrends: CapacityTrend[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date(Date.now() - (29 - i) * 24 * 3600000);
  return {
    time: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
    current: 40 + Math.random() * 30 + (i > 20 ? (i - 20) * 3 : 0),
    projected: 40 + Math.random() * 30 + (i > 20 ? (i - 20) * 4 : 0),
    threshold: 85,
  };
});

const mockResourceMetrics: ResourceMetric[] = [
  { name: "CPU", current: 68, threshold: 85, trend: "up", daysUntilFull: 15, recommended: 80 },
  { name: "内存", current: 75, threshold: 90, trend: "up", daysUntilFull: 20, recommended: 85 },
  { name: "存储", current: 45, threshold: 80, trend: "stable", daysUntilFull: 60, recommended: 70 },
  { name: "网络带宽", current: 52, threshold: 75, trend: "up", daysUntilFull: 25, recommended: 80 },
  { name: "数据库连接", current: 35, threshold: 90, trend: "stable", daysUntilFull: 90, recommended: 80 },
];

const mockRecommendations: ScalingRecommendation[] = [
  {
    id: "1",
    type: "scale_up",
    priority: "high",
    service: "order-service",
    current: 8,
    recommended: 12,
    reason: "CPU使用率持续增长，预计15天后达到阈值",
    estimated: "提升50%处理能力",
    effort: "low",
  },
  {
    id: "2",
    type: "optimize",
    priority: "medium",
    service: "payment-gateway",
    current: 6,
    recommended: 8,
    reason: "内存使用率偏高，存在优化空间",
    estimated: "降低20%内存使用",
    effort: "medium",
  },
  {
    id: "3",
    type: "migrate",
    priority: "low",
    service: "log-service",
    current: 4,
    recommended: 6,
    reason: "存储使用增长较快，建议迁移到更大存储",
    estimated: "延长30天存储寿命",
    effort: "high",
  },
];

export default function CapacityPlanning() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [selectedService, setSelectedService] = useState<string>("all");
  const [showAlerts, setShowAlerts] = useState(true);

  const services = ["order-service", "payment-gateway", "user-service", "inventory-service", "log-service"];

  const filteredTrends = useMemo(() => {
    const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
    return mockCapacityTrends.slice(-days);
  }, [timeRange]);

  const criticalMetrics = mockResourceMetrics.filter(m => m.daysUntilFull <= 30);
  const healthyMetrics = mockResourceMetrics.filter(m => m.daysUntilFull > 30);

  const handleExportReport = () => {
    const reportData = {
      exportTime: new Date().toISOString(),
      timeRange,
      service: selectedService,
      metrics: mockResourceMetrics,
      recommendations: mockRecommendations,
      trends: filteredTrends,
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `capacity-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <MainLayout title="容量规划">
      <div className="space-y-4">
        {/* 容量概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均利用率</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>58.3%</div>
                <div className="text-xs mt-1 flex items-center gap-1" style={{ color: "#00D68F" }}>
                  <TrendingDown size={12} />
                  安全范围
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
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预警资源</div>
                <div className="text-xl font-bold mt-1" style={{ color: criticalMetrics.length > 0 ? "#FFAA00" : "#00D68F" }}>
                  {criticalMetrics.length}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  需要关注
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>扩容建议</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#165DFF" }}>
                  {mockRecommendations.filter(r => r.type === "scale_up").length}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  待执行
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <TrendingUpIcon size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康资源</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>
                  {healthyMetrics.length}
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  运行良好
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 控制栏 */}
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>服务:</span>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="all">全部服务</option>
                {services.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg" style={{ background: "var(--muted)" }}>
              {(["7d", "30d", "90d"] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className="px-3 py-1.5 rounded text-xs"
                  style={{
                    background: timeRange === range ? "#165DFF" : "transparent",
                    color: timeRange === range ? "#fff" : "var(--muted-foreground)"
                  }}
                >
                  {range === "7d" ? "7天" : range === "30d" ? "30天" : "90天"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAlerts(!showAlerts)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                showAlerts ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"
              }`}
            >
              <AlertTriangle size={14} />
              {showAlerts ? "隐藏预警" : "显示预警"}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportReport}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm"
              style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}
            >
              <Download size={14} />
              导出报告
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#165DFF", color: "#fff" }}
            >
              <Plus size={14} />
              创建计划
            </button>
          </div>
        </div>

        {/* 容量趋势图 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">容量使用趋势</span>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ background: "#165DFF" }} />
                <span style={{ color: "var(--muted-foreground)" }}>当前使用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ background: "#A855F7" }} />
                <span style={{ color: "var(--muted-foreground)" }}>预测趋势</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-0.5" style={{ background: "#FF4D4F", opacity: 0.5 }} />
                <span style={{ color: "var(--muted-foreground)" }}>阈值 (85%)</span>
              </div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredTrends}>
              <defs>
                <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#165DFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#64748B" }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Area type="monotone" dataKey="current" stroke="#165DFF" fill="url(#colorCurrent)" strokeWidth={2} name="当前使用" />
              <Area type="monotone" dataKey="projected" stroke="#A855F7" strokeWidth={2} fill="url(#colorProjected)" name="预测趋势" strokeDasharray="5 5" />
              <Area type="monotone" dataKey="threshold" stroke="#FF4D4F" strokeWidth={1} fill="none" strokeDasharray="3 3" name="阈值" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 资源指标 */}
        <div className="grid grid-cols-5 gap-3">
          {mockResourceMetrics.map((metric) => {
            const isWarning = metric.daysUntilFull <= 30;
            return (
              <div
                key={metric.name}
                className="rounded-lg p-3"
                style={{
                  background: "var(--card)",
                  border: `1px solid ${isWarning ? "rgba(255, 170, 0, 0.3)" : "var(--border)"}`
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Cpu size={14} style={{ color: isWarning ? "#FFAA00" : "#165DFF" }} />
                    <span className="text-xs font-medium text-white">{metric.name}</span>
                  </div>
                  {isWarning && <AlertTriangle size={12} style={{ color: "#FFAA00" }} />}
                </div>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: "var(--muted-foreground)" }}>当前使用</span>
                      <span className="font-medium text-white">{metric.current}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${metric.current}%`,
                          background: isWarning ? "#FFAA00" : "#165DFF"
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span style={{ color: "var(--muted-foreground)" }}>预计满载</span>
                    <span className="font-medium" style={{ color: isWarning ? "#FFAA00" : "#00D68F" }}>
                      {metric.daysUntilFull}天
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    {metric.trend === "up" && <TrendingUp size={10} style={{ color: "#FF4D4F" }} />}
                    {metric.trend === "down" && <TrendingDown size={10} style={{ color: "#00D68F" }} />}
                    {metric.trend === "stable" && <Activity size={10} style={{ color: "#165DFF" }} />}
                    {metric.trend === "up" ? "上升中" : metric.trend === "down" ? "下降中" : "稳定"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 扩容建议 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUpIcon size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">扩容与优化建议</span>
            </div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              基于历史数据和机器学习预测
            </span>
          </div>
          <div className="space-y-3">
            {mockRecommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-3 rounded-lg border"
                style={{
                  background: "var(--muted)",
                  borderColor: rec.priority === "high" ? "rgba(255, 77, 79, 0.3)" : rec.priority === "medium" ? "rgba(255, 170, 0, 0.3)" : "var(--border)"
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: rec.type === "scale_up" ? "rgba(255, 77, 79, 0.1)" : rec.type === "optimize" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                        color: rec.type === "scale_up" ? "#FF4D4F" : rec.type === "optimize" ? "#FFAA00" : "#165DFF"
                      }}
                    >
                      {rec.type === "scale_up" ? "扩容" : rec.type === "optimize" ? "优化" : "迁移"}
                    </span>
                    <span className="text-sm font-medium text-white">{rec.service}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-xs"
                      style={{
                        background: rec.priority === "high" ? "rgba(255, 77, 79, 0.1)" : rec.priority === "medium" ? "rgba(255, 170, 0, 0.1)" : "rgba(0, 214, 143, 0.1)",
                        color: rec.priority === "high" ? "#FF4D4F" : rec.priority === "medium" ? "#FFAA00" : "#00D68F"
                      }}
                    >
                      {rec.priority === "high" ? "高" : rec.priority === "medium" ? "中" : "低"}
                    </span>
                  </div>
                </div>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                  {rec.reason}
                </div>
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>当前</div>
                    <div className="text-sm font-medium text-white">{rec.current} 实例</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>建议</div>
                    <div className="text-sm font-medium" style={{ color: "#00D68F" }}>{rec.recommended} 实例</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预期效果</div>
                    <div className="text-sm font-medium text-white">{rec.estimated}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>工作量</div>
                    <div className="text-sm" style={{ color: rec.effort === "low" ? "#00D68F" : rec.effort === "medium" ? "#FFAA00" : "#FF4D4F" }}>
                      {rec.effort === "low" ? "低" : rec.effort === "medium" ? "中" : "高"}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                  >
                    查看详情
                  </button>
                  <button
                    className="flex-1 px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: "#165DFF", color: "#fff" }}
                  >
                    立即执行
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
