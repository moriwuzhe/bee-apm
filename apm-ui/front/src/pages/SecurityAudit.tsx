import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Shield, Search, Filter, Download, AlertTriangle, CheckCircle, Clock, User, Activity, Database, Lock, Eye, EyeOff, RefreshCw, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  ip: string;
  userAgent: string;
  status: "success" | "failed" | "warning";
  details: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface SecurityEvent {
  id: string;
  timestamp: string;
  type: "login" | "permission" | "data" | "config" | "api";
  severity: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  user?: string;
  ip?: string;
  resolved: boolean;
}

const mockAuditLogs: AuditLog[] = [
  { id: "1", timestamp: "2024-01-15 14:35:20", user: "zhang.san", userId: "1001", action: "LOGIN", resource: "系统", resourceId: "system", ip: "192.168.1.100", userAgent: "Chrome/120.0", status: "success", details: "用户登录成功", severity: "low" },
  { id: "2", timestamp: "2024-01-15 14:32:15", user: "li.si", userId: "1002", action: "UPDATE_CONFIG", resource: "告警规则", resourceId: "alert-rule-123", ip: "192.168.1.101", userAgent: "Chrome/120.0", status: "warning", details: "修改了告警阈值配置", severity: "medium" },
  { id: "3", timestamp: "2024-01-15 14:30:00", user: "wang.wu", userId: "1003", action: "DELETE", resource: "应用", resourceId: "app-456", ip: "192.168.1.102", userAgent: "Firefox/121.0", status: "failed", details: "尝试删除生产环境应用，被权限系统阻止", severity: "high" },
  { id: "4", timestamp: "2024-01-15 14:28:45", user: "admin", userId: "1", action: "GRANT_PERMISSION", resource: "用户", resourceId: "user-789", ip: "192.168.1.1", userAgent: "Chrome/120.0", status: "success", details: "授予管理员权限", severity: "critical" },
  { id: "5", timestamp: "2024-01-15 14:25:30", user: "zhao.liu", userId: "1004", action: "API_ACCESS", resource: "监控数据", resourceId: "metrics-query", ip: "10.0.0.50", userAgent: "Python/3.9", status: "success", details: "批量查询监控指标", severity: "low" },
];

const mockSecurityEvents: SecurityEvent[] = [
  { id: "1", timestamp: "2024-01-15 14:35:20", type: "login", severity: "medium", title: "异常登录地点", description: "用户 zhang.san 从新地点登录", user: "zhang.san", ip: "192.168.1.100", resolved: false },
  { id: "2", timestamp: "2024-01-15 14:30:00", type: "permission", severity: "high", title: "权限提升尝试", description: "用户 wang.wu 尝试访问受限资源", user: "wang.wu", ip: "192.168.1.102", resolved: false },
  { id: "3", timestamp: "2024-01-15 14:20:00", type: "api", severity: "low", title: "API 限流触发", description: "IP 10.0.0.50 触发 API 限流", ip: "10.0.0.50", resolved: true },
  { id: "4", timestamp: "2024-01-15 14:15:00", type: "data", severity: "critical", title: "敏感数据访问", description: "检测到批量导出用户数据", resolved: true },
];

export default function SecurityAudit() {
  const [activeTab, setActiveTab] = useState<"logs" | "events" | "compliance">("logs");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(false);

  const filteredLogs = mockAuditLogs.filter(log => {
    const matchesSearch = searchQuery === "" || 
      log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeverity = filterSeverity === "all" || log.severity === filterSeverity;
    const matchesStatus = filterStatus === "all" || log.status === filterStatus;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical": return { bg: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" };
      case "high": return { bg: "rgba(255, 159, 67, 0.1)", color: "#FF9F43" };
      case "medium": return { bg: "rgba(250, 173, 20, 0.1)", color: "#FAAD14" };
      case "low": return { bg: "rgba(0, 214, 143, 0.1)", color: "#00D68F" };
      default: return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8" };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />;
      case "failed": return <AlertTriangle className="w-4 h-4" style={{ color: "#FF4D4F" }} />;
      case "warning": return <AlertTriangle className="w-4 h-4" style={{ color: "#FAAD14" }} />;
      default: return null;
    }
  };

  return (
    <MainLayout title="安全审计">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "logs" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "logs" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "logs" ? "white" : "var(--foreground)"
              }}
            >
              审计日志
            </button>
            <button
              onClick={() => setActiveTab("events")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "events" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "events" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "events" ? "white" : "var(--foreground)"
              }}
            >
              安全事件
            </button>
            <button
              onClick={() => setActiveTab("compliance")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "compliance" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "compliance" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "compliance" ? "white" : "var(--foreground)"
              }}
            >
              合规报告
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
              导出日志
            </button>
          </div>
        </div>

        {activeTab === "logs" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功操作</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>
                      {mockAuditLogs.filter(l => l.status === "success").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>失败操作</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>
                      {mockAuditLogs.filter(l => l.status === "failed").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 159, 67, 0.1)" }}>
                    <Shield className="w-6 h-6" style={{ color: "#FF9F43" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>高危操作</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF9F43" }}>
                      {mockAuditLogs.filter(l => l.severity === "high" || l.severity === "critical").length}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <User className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃用户</div>
                    <div className="text-2xl font-bold">{new Set(mockAuditLogs.map(l => l.userId)).size}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 搜索和筛选 */}
            <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="搜索用户、操作、资源..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <select
                value={filterSeverity}
                onChange={(e) => setFilterSeverity(e.target.value)}
                className="px-3 py-2 rounded-lg"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="all">全部严重性</option>
                <option value="critical">严重</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-lg"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="all">全部状态</option>
                <option value="success">成功</option>
                <option value="failed">失败</option>
                <option value="warning">警告</option>
              </select>
            </div>

            {/* 审计日志列表 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>时间</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>用户</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>资源</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>严重性</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>IP地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.map((log) => (
                      <tr
                        key={log.id}
                        className="transition-colors hover:bg-opacity-50"
                        style={{ borderBottom: "1px solid var(--border)" }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3" style={{ color: "var(--muted-foreground)" }} />
                            <span className="text-sm">{log.timestamp}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                            <span className="font-medium">{log.user}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: "var(--muted)" }}>
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-sm">{log.resource}</span>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{log.details}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <span className="text-sm capitalize">{log.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={getSeverityColor(log.severity)}
                          >
                            {log.severity === "critical" ? "严重" : 
                             log.severity === "high" ? "高" : 
                             log.severity === "medium" ? "中" : "低"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm font-mono">{log.ip}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "events" && (
          <div className="space-y-4">
            {/* 安全事件列表 */}
            {mockSecurityEvents.map((event) => (
              <div
                key={event.id}
                className="rounded-lg p-4 transition-all"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg" style={getSeverityColor(event.severity)}>
                      <Shield className="w-5 h-5" style={{ color: getSeverityColor(event.severity).color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{event.title}</h3>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={getSeverityColor(event.severity)}
                        >
                          {event.severity === "critical" ? "严重" : 
                           event.severity === "high" ? "高" : 
                           event.severity === "medium" ? "中" : "低"}
                        </span>
                      </div>
                      <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>{event.description}</p>
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.timestamp}
                        </span>
                        {event.user && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {event.user}
                          </span>
                        )}
                        {event.ip && (
                          <span className="flex items-center gap-1">
                            <Activity className="w-3 h-3" />
                            {event.ip}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {event.resolved ? (
                      <span className="px-2 py-1 rounded text-xs" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                        已解决
                      </span>
                    ) : (
                      <button
                        className="px-3 py-1 rounded text-xs text-white transition-all"
                        style={{ background: "var(--primary)" }}
                      >
                        处理
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "compliance" && (
          <div className="space-y-4">
            <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
                <h3 className="text-lg font-medium mb-2">合规报告</h3>
                <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                  生成符合 GDPR、SOX、ISO27001 等标准的合规报告
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    className="px-4 py-2 rounded-lg text-white transition-all"
                    style={{ background: "var(--primary)" }}
                  >
                    生成报告
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg transition-all"
                    style={{
                      background: "var(--card)",
                      border: "1px solid var(--border)",
                      color: "var(--foreground)"
                    }}
                  >
                    查看模板
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
