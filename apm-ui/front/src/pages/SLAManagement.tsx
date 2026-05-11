import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Shield, Clock, CheckCircle, AlertTriangle, Activity, TrendingUp, TrendingDown, Plus, Edit2, Download, Filter, Bell, MessageSquare } from "lucide-react";

interface SLA {
  id: string;
  name: string;
  service: string;
  uptime: number;
  responseTime: number;
  errorRate: number;
  currentStatus: "met" | "at_risk" | "breached";
  currentUptime: number;
  currentResponseTime: number;
  currentErrorRate: number;
  incidents: number;
  breachedMinutes: number;
  period: string;
  notifications: {
    email: boolean;
    slack: boolean;
    sms: boolean;
  };
}

interface Incident {
  id: string;
  slaId: string;
  slaName: string;
  title: string;
  startTime: string;
  endTime?: string;
  duration: number;
  status: "open" | "investigating" | "resolved";
  severity: "low" | "medium" | "high" | "critical";
  impact: string;
  affectedMetrics: string[];
}

const mockSLAs: SLA[] = [
  { id: "1", name: "核心业务SLA", service: "order-service", uptime: 99.9, responseTime: 200, errorRate: 0.1, currentStatus: "met", currentUptime: 99.95, currentResponseTime: 156, currentErrorRate: 0.05, incidents: 2, breachedMinutes: 0, period: "2024-01", notifications: { email: true, slack: true, sms: false } },
  { id: "2", name: "支付服务SLA", service: "payment-gateway", uptime: 99.95, responseTime: 300, errorRate: 0.05, currentStatus: "at_risk", currentUptime: 99.92, currentResponseTime: 278, currentErrorRate: 0.08, incidents: 5, breachedMinutes: 15, period: "2024-01", notifications: { email: true, slack: true, sms: true } },
  { id: "3", name: "用户服务SLA", service: "user-service", uptime: 99.5, responseTime: 500, errorRate: 0.5, currentStatus: "met", currentUptime: 99.78, currentResponseTime: 423, currentErrorRate: 0.22, incidents: 8, breachedMinutes: 0, period: "2024-01", notifications: { email: true, slack: false, sms: false } },
];

const mockIncidents: Incident[] = [
  { id: "1", slaId: "1", slaName: "核心业务SLA", title: "响应时间超标", startTime: "2024-01-15 14:30:00", endTime: "2024-01-15 14:45:00", duration: 15, status: "resolved", severity: "medium", impact: "部分用户受影响", affectedMetrics: ["响应时间"] },
  { id: "2", slaId: "2", slaName: "支付服务SLA", title: "服务不可用", startTime: "2024-01-15 10:20:00", endTime: "2024-01-15 10:35:00", duration: 15, status: "resolved", severity: "high", impact: "支付失败", affectedMetrics: ["可用性", "错误率"] },
  { id: "3", slaId: "1", slaName: "核心业务SLA", title: "数据库连接超时", startTime: "2024-01-14 16:00:00", duration: 10, status: "investigating", severity: "medium", impact: "部分请求失败", affectedMetrics: ["响应时间"] },
];

export default function SLAManagement() {
  const [activeTab, setActiveTab] = useState<"overview" | "incidents" | "reports">("overview");
  const [slas] = useState<SLA[]>(mockSLAs);
  const [incidents] = useState<Incident[]>(mockIncidents);
  const [filterStatus, setFilterStatus] = useState("all");

  const metSLAs = slas.filter(s => s.currentStatus === "met").length;
  const atRiskSLAs = slas.filter(s => s.currentStatus === "at_risk").length;
  const breachedSLAs = slas.filter(s => s.currentStatus === "breached").length;
  const openIncidents = incidents.filter(i => i.status !== "resolved").length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "met": return { bg: "rgba(0, 214, 143, 0.1)", color: "#00D68F", label: "达标" };
      case "at_risk": return { bg: "rgba(255, 170, 0, 0.1)", color: "#FFAA00", label: "风险" };
      case "breached": return { bg: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F", label: "违约" };
      default: return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8", label: "未知" };
    }
  };

  return (
    <MainLayout title="SLA管理">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>SLA达标</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{metSLAs}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>SLA风险</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FFAA00" }}>{atRiskSLAs}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>SLA违约</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{breachedSLAs}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <Shield size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>进行中事件</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FFAA00" }}>{openIncidents}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Activity size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("overview")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "overview" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <Shield size={16} />
            SLA概览
          </button>
          <button
            onClick={() => setActiveTab("incidents")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "incidents" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <AlertTriangle size={16} />
            故障事件
          </button>
          <button
            onClick={() => setActiveTab("reports")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "reports" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <Activity size={16} />
            SLA报告
          </button>
        </div>

        {/* SLA概览 */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                <Plus size={14} />
                创建SLA
              </button>
            </div>

            <div className="space-y-4">
              {slas.map(sla => {
                const status = getStatusColor(sla.currentStatus);
                return (
                  <div key={sla.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-medium text-white">{sla.name}</h3>
                          <span
                            className="px-2 py-0.5 rounded text-xs"
                            style={{ background: status.bg, color: status.color }}
                          >
                            {status.label}
                          </span>
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          服务: {sla.service} | 周期: {sla.period}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1.5 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                          <Edit2 size={14} />
                        </button>
                        <button className="p-1.5 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                          <Bell size={14} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>可用性目标</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{sla.uptime}%</span>
                          <div className="flex items-center gap-1 text-xs">
                            {sla.currentUptime >= sla.uptime ? (
                              <TrendingUp size={12} style={{ color: "#00D68F" }} />
                            ) : (
                              <TrendingDown size={12} style={{ color: "#FF4D4F" }} />
                            )}
                            <span style={{ color: sla.currentUptime >= sla.uptime ? "#00D68F" : "#FF4D4F" }}>
                              {sla.currentUptime.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>响应时间目标</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{sla.responseTime}ms</span>
                          <div className="flex items-center gap-1 text-xs">
                            {sla.currentResponseTime <= sla.responseTime ? (
                              <TrendingUp size={12} style={{ color: "#00D68F" }} />
                            ) : (
                              <TrendingDown size={12} style={{ color: "#FF4D4F" }} />
                            )}
                            <span style={{ color: sla.currentResponseTime <= sla.responseTime ? "#00D68F" : "#FF4D4F" }}>
                              {sla.currentResponseTime}ms
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                        <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>错误率目标</div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{sla.errorRate}%</span>
                          <div className="flex items-center gap-1 text-xs">
                            {sla.currentErrorRate <= sla.errorRate ? (
                              <TrendingUp size={12} style={{ color: "#00D68F" }} />
                            ) : (
                              <TrendingDown size={12} style={{ color: "#FF4D4F" }} />
                            )}
                            <span style={{ color: sla.currentErrorRate <= sla.errorRate ? "#00D68F" : "#FF4D4F" }}>
                              {sla.currentErrorRate.toFixed(2)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>故障次数</div>
                        <div className="text-sm font-medium text-white mt-1">{sla.incidents}</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>违约时长</div>
                        <div className="text-sm font-medium mt-1" style={{ color: sla.breachedMinutes > 0 ? "#FF4D4F" : "#00D68F" }}>
                          {sla.breachedMinutes} 分钟
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>通知渠道</div>
                        <div className="flex gap-1 mt-1">
                          {sla.notifications.email && <MessageSquare size={14} style={{ color: "#165DFF" }} />}
                          {sla.notifications.slack && <span className="text-xs">Slack</span>}
                          {sla.notifications.sms && <span className="text-xs">SMS</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 故障事件 */}
        {activeTab === "incidents" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--input)" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>事件</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>SLA</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>严重程度</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>持续时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>开始时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {incidents.map(incident => (
                    <tr key={incident.id} className="hover:bg-input">
                      <td className="px-4 py-3">
                        <div className="text-sm text-white">{incident.title}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{incident.impact}</div>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{incident.slaName}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: incident.severity === "critical" ? "rgba(255, 77, 79, 0.1)" : incident.severity === "high" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                            color: incident.severity === "critical" ? "#FF4D4F" : incident.severity === "high" ? "#FFAA00" : "#165DFF"
                          }}
                        >
                          {incident.severity === "critical" ? "严重" : incident.severity === "high" ? "高" : incident.severity === "medium" ? "中" : "低"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: incident.status === "resolved" ? "rgba(0, 214, 143, 0.1)" : incident.status === "investigating" ? "rgba(255, 170, 0, 0.1)" : "rgba(255, 77, 79, 0.1)",
                            color: incident.status === "resolved" ? "#00D68F" : incident.status === "investigating" ? "#FFAA00" : "#FF4D4F"
                          }}
                        >
                          {incident.status === "resolved" ? "已解决" : incident.status === "investigating" ? "调查中" : "待处理"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>
                        {incident.duration} 分钟
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {incident.startTime}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-xs px-3 py-1 rounded" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                          详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SLA报告 */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">月度SLA报告 - 2024年1月</h3>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                  <Download size={14} />
                  导出报告
                </button>
              </div>
              <div className="space-y-3">
                <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>总体SLA达成率</div>
                  <div className="text-lg font-bold" style={{ color: "#00D68F" }}>98.5%</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>总违约时长</div>
                  <div className="text-lg font-bold" style={{ color: "#FFAA00" }}>15 分钟</div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>总故障次数</div>
                  <div className="text-lg font-bold text-white">15 次</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
