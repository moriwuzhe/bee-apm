import { useState, useEffect, useRef, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, Terminal, AlertTriangle, Settings, Trash2, ChevronDown, Clock, Activity, Server, Cpu, Wifi, AlertCircle, Info, CheckCircle, XCircle, Calendar, Plus, Play, Pause, Trash, FileText, Columns, Rows } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  service: string;
  instance: string;
  message: string;
  traceId?: string;
  spanId?: string;
  host?: string;
  pid?: number;
}

interface LogStats {
  totalLogs: number;
  errorCount: number;
  warnCount: number;
  infoCount: number;
  debugCount: number;
}

interface ServiceLogStats {
  service: string;
  logs: number;
  errors: number;
  lastLog: string;
}

const levelConfig = {
  error: { color: "#FF4D4F", bg: "rgba(255, 77, 79, 0.15)", icon: XCircle, label: "错误" },
  warn: { color: "#FFAA00", bg: "rgba(255, 170, 0, 0.15)", icon: AlertTriangle, label: "警告" },
  info: { color: "#165DFF", bg: "rgba(22, 93, 255, 0.15)", icon: Info, label: "信息" },
  debug: { color: "#86909C", bg: "rgba(134, 144, 156, 0.15)", icon: Terminal, label: "调试" },
};

const mockServices = [
  "order-service",
  "payment-gateway",
  "user-service",
  "inventory-service",
  "notification-service",
];

const mockHosts = [
  "192.168.1.101",
  "192.168.1.102",
  "192.168.1.103",
];

const mockLogs: LogEntry[] = Array.from({ length: 50 }, (_, i) => {
  const levels: Array<"info" | "warn" | "error" | "debug"> = ["info", "warn", "error", "debug"];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const service = mockServices[Math.floor(Math.random() * mockServices.length)];
  const host = mockHosts[Math.floor(Math.random() * mockHosts.length)];
  
  const messages: Record<string, string[]> = {
    error: [
      "Connection timeout after 30000ms",
      "Failed to connect to database",
      "OutOfMemoryError: Heap space exhausted",
      "NullPointerException at line 145",
      "Transaction rollback due to lock timeout",
    ],
    warn: [
      "High memory usage detected: 85%",
      "Slow query detected: 2500ms",
      "Connection pool near capacity: 90%",
      "Retrying request after failure",
      "Cache miss rate above threshold",
    ],
    info: [
      "Service started successfully on port 8080",
      "New connection established",
      "Configuration reloaded",
      "Scheduled task completed",
      "Health check passed",
    ],
    debug: [
      "Processing request: GET /api/orders",
      "Entering method: calculateTotal",
      "Cache lookup for key: user_123",
      "SQL executed in 45ms",
      "Response sent with status 200",
    ],
  };
  
  return {
    id: `log-${i}`,
    timestamp: new Date(Date.now() - Math.random() * 3600000),
    level,
    service,
    instance: `${host}:${8080 + Math.floor(Math.random() * 5)}`,
    message: messages[level][Math.floor(Math.random() * messages[level].length)],
    traceId: Math.random() > 0.5 ? `trace-${Math.random().toString(36).substr(2, 9)}` : undefined,
    spanId: Math.random() > 0.7 ? `span-${Math.floor(Math.random() * 100)}` : undefined,
    host,
    pid: 1000 + Math.floor(Math.random() * 5000),
  };
});

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [filterHost, setFilterHost] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isRealtime, setIsRealtime] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "list">("list");
  const [timeRange, setTimeRange] = useState<"1h" | "6h" | "24h" | "7d">("1h");
  const [autoScroll, setAutoScroll] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const [logStats, setLogStats] = useState<LogStats>({
    totalLogs: 0,
    errorCount: 0,
    warnCount: 0,
    infoCount: 0,
    debugCount: 0,
  });

  const [serviceStats, setServiceStats] = useState<ServiceLogStats[]>([]);

  useEffect(() => {
    updateStats();
  }, [logs]);

  const updateStats = () => {
    const stats: LogStats = {
      totalLogs: logs.length,
      errorCount: logs.filter(l => l.level === "error").length,
      warnCount: logs.filter(l => l.level === "warn").length,
      infoCount: logs.filter(l => l.level === "info").length,
      debugCount: logs.filter(l => l.level === "debug").length,
    };
    setLogStats(stats);

    const serviceMap = new Map<string, ServiceLogStats>();
    logs.forEach(log => {
      const existing = serviceMap.get(log.service) || {
        service: log.service,
        logs: 0,
        errors: 0,
        lastLog: "",
      };
      existing.logs++;
      if (log.level === "error") existing.errors++;
      existing.lastLog = log.timestamp.toLocaleTimeString();
      serviceMap.set(log.service, existing);
    });
    setServiceStats(Array.from(serviceMap.values()));
  };

  useEffect(() => {
    if (!isRealtime) return;
    const interval = setInterval(() => {
      const levels: Array<"info" | "warn" | "error" | "debug"> = ["info", "warn", "error", "debug"];
      const level = levels[Math.floor(Math.random() * levels.length)];
      const service = mockServices[Math.floor(Math.random() * mockServices.length)];
      const host = mockHosts[Math.floor(Math.random() * mockHosts.length)];
      
      const messages: Record<string, string[]> = {
        error: ["New error detected in production"],
        warn: ["Warning: Performance degradation"],
        info: ["Scheduled maintenance completed"],
        debug: ["Debug information logged"],
      };
      
      const newLog: LogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date(),
        level,
        service,
        instance: `${host}:8080`,
        message: messages[level][0],
        traceId: `trace-${Math.random().toString(36).substr(2, 9)}`,
        host,
        pid: 1000 + Math.floor(Math.random() * 5000),
      };
      
      setLogs(prev => [newLog, ...prev.slice(0, 99)]);
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isRealtime]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesKeyword = searchKeyword === "" || 
        log.message.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        log.service.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        log.traceId?.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesLevel = filterLevel === "all" || log.level === filterLevel;
      const matchesService = filterService === "all" || log.service === filterService;
      const matchesHost = filterHost === "all" || log.host === filterHost;
      return matchesKeyword && matchesLevel && matchesService && matchesHost;
    });
  }, [logs, searchKeyword, filterLevel, filterService, filterHost]);

  const uniqueServices = [...new Set(logs.map(l => l.service))];
  const uniqueHosts = [...new Set(logs.map(l => l.host).filter(Boolean))];

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const handleExport = () => {
    const data = filteredLogs.map(log => ({
      timestamp: log.timestamp.toISOString(),
      level: log.level,
      service: log.service,
      instance: log.instance,
      message: log.message,
      traceId: log.traceId,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = () => {
    setLogs([]);
  };

  return (
    <MainLayout title="日志查看">
      <div className="space-y-4">
        {/* 日志统计概览 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总日志数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{logStats.totalLogs.toLocaleString()}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <FileText size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{logStats.errorCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <XCircle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FFAA00" }}>{logStats.warnCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>信息</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#165DFF" }}>{logStats.infoCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Info size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>调试</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#86909C" }}>{logStats.debugCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(134, 144, 156, 0.1)" }}>
                <Terminal size={20} style={{ color: "#86909C" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 服务日志统计 */}
        <div className="grid grid-cols-5 gap-3">
          {serviceStats.slice(0, 5).map((stat, index) => (
            <div key={stat.service} className="rounded-lg p-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-2">
                <Server size={14} style={{ color: "#165DFF" }} />
                <span className="text-xs font-medium text-white truncate">{stat.service}</span>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>日志数</span>
                  <span className="font-medium text-white">{stat.logs}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>错误</span>
                  <span className="font-medium" style={{ color: "#FF4D4F" }}>{stat.errors}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span style={{ color: "var(--muted-foreground)" }}>最新</span>
                  <span className="font-medium text-white">{stat.lastLog}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 实时监控指示器 */}
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsRealtime(!isRealtime)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${isRealtime ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}
            >
              {isRealtime ? <><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />实时监控中</> : <><span className="w-2 h-2 rounded-full bg-gray-500" />已暂停</>}
            </button>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {timeRange === "1h" ? "最近1小时" : timeRange === "6h" ? "最近6小时" : timeRange === "24h" ? "最近24小时" : "最近7天"}
            </span>
            <div className="flex items-center gap-1">
              {(["1h", "6h", "24h", "7d"] as const).map(range => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-2 py-1 rounded text-xs ${timeRange === range ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"}`}
                >
                  {range === "1h" ? "1小时" : range === "6h" ? "6小时" : range === "24h" ? "24小时" : "7天"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoScroll(!autoScroll)}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${autoScroll ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"}`}
            >
              {autoScroll ? <><Play size={12} />自动滚动</> : <><Pause size={12} />已暂停</>}
            </button>
            <button
              onClick={() => setViewMode(viewMode === "table" ? "list" : "table")}
              className="p-1.5 rounded hover:bg-input"
              style={{ color: "var(--muted-foreground)" }}
              title={viewMode === "table" ? "切换到列表视图" : "切换到表格视图"}
            >
              {viewMode === "table" ? <Rows size={16} /> : <Columns size={16} />}
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
              style={{ background: "var(--muted)", color: "var(--foreground)" }}
            >
              <Download size={12} />
              导出
            </button>
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs"
              style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}
            >
              <Trash size={12} />
              清空
            </button>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索日志内容、服务名、Trace ID..."
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
              <option value="error">错误</option>
              <option value="warn">警告</option>
              <option value="info">信息</option>
              <option value="debug">调试</option>
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部服务</option>
              {uniqueServices.map(service => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
            <select
              value={filterHost}
              onChange={(e) => setFilterHost(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部主机</option>
              {uniqueHosts.map(host => (
                <option key={host} value={host}>{host}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm"
            style={{ background: showAdvanced ? "rgba(22, 93, 255, 0.1)" : "var(--muted)", color: showAdvanced ? "#165DFF" : "var(--foreground)" }}
          >
            <Settings size={14} />
            高级筛选
          </button>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>

        {/* 日志列表 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              日志列表 <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({filteredLogs.length} 条)</span>
            </span>
          </div>
          
          {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--input)" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>级别</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>服务</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>实例</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>消息</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Trace ID</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {filteredLogs.slice(0, 50).map((log) => {
                    const LevelIcon = levelConfig[log.level].icon;
                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-input cursor-pointer transition-colors"
                        onClick={() => setSelectedLog(log)}
                      >
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                          {formatTime(log.timestamp)}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: levelConfig[log.level].bg, color: levelConfig[log.level].color }}
                          >
                            <LevelIcon size={12} />
                            {levelConfig[log.level].label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>
                          {log.service}
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                          {log.instance}
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>
                          <div className="max-w-md truncate">{log.message}</div>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted-foreground)" }}>
                          {log.traceId || "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredLogs.slice(0, 50).map((log) => {
                const LevelIcon = levelConfig[log.level].icon;
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-4 hover:bg-input cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex-shrink-0 w-16 text-xs font-mono pt-1" style={{ color: "var(--muted-foreground)" }}>
                      {formatTime(log.timestamp)}
                    </div>
                    <div className="flex-shrink-0">
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
                        style={{ background: levelConfig[log.level].bg, color: levelConfig[log.level].color }}
                      >
                        <LevelIcon size={12} />
                        {levelConfig[log.level].label}
                      </span>
                    </div>
                    <div className="flex-shrink-0 w-32 text-xs" style={{ color: "var(--foreground)" }}>
                      {log.service}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm" style={{ color: "var(--foreground)" }}>
                        {log.message}
                      </div>
                      {log.traceId && (
                        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                          Trace: {log.traceId}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div ref={logsEndRef} />

        {/* 详情弹窗 */}
        {selectedLog && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedLog(null)}>
            <div
              className="bg-card rounded-lg w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  {(() => {
                    const LevelIcon = levelConfig[selectedLog.level].icon;
                    return <LevelIcon size={16} style={{ color: levelConfig[selectedLog.level].color }} />;
                  })()}
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>日志详情</span>
                </div>
                <button onClick={() => setSelectedLog(null)} className="p-1 hover:bg-input rounded">
                  <XCircle size={16} style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>时间</div>
                    <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{selectedLog.timestamp.toLocaleString()}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>级别</div>
                    <span className="text-sm font-medium" style={{ color: levelConfig[selectedLog.level].color }}>{levelConfig[selectedLog.level].label}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>服务</div>
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>{selectedLog.service}</span>
                  </div>
                  <div>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>实例</div>
                    <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{selectedLog.instance}</span>
                  </div>
                  {selectedLog.host && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>主机</div>
                      <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{selectedLog.host}</span>
                    </div>
                  )}
                  {selectedLog.pid && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>进程ID</div>
                      <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{selectedLog.pid}</span>
                    </div>
                  )}
                  {selectedLog.traceId && (
                    <div className="col-span-2">
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Trace ID</div>
                      <span className="text-sm font-mono" style={{ color: "#165DFF" }}>{selectedLog.traceId}</span>
                    </div>
                  )}
                  {selectedLog.spanId && (
                    <div>
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>Span ID</div>
                      <span className="text-sm font-mono" style={{ color: "var(--foreground)" }}>{selectedLog.spanId}</span>
                    </div>
                  )}
                </div>
                <div>
                  <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>日志消息</div>
                  <div className="p-3 rounded-lg text-sm font-mono" style={{ background: "#0B1120", color: "#94A3B8" }}>
                    {selectedLog.message}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 p-4 border-t" style={{ borderColor: "var(--border)" }}>
                <button
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                  onClick={() => setSelectedLog(null)}
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
