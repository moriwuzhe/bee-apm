import { useState, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, AlertTriangle, AlertCircle, Info, CheckCircle, Clock, X, ChevronRight } from "lucide-react";

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