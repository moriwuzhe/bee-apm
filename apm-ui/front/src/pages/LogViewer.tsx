import { useState, useMemo, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, Clock, AlertTriangle, Info, Terminal, ChevronDown, ChevronRight, Copy, Check, FileText } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  level: "DEBUG" | "INFO" | "WARN" | "ERROR";
  service: string;
  thread: string;
  message: string;
  stackTrace?: string;
}

const mockLogs: LogEntry[] = [
  { id: "1", timestamp: "2024-01-15 14:32:15.123", level: "ERROR", service: "order-service", thread: "http-nio-8080-exec-1", message: "订单创建失败 - 库存不足", stackTrace: "com.example.OrderException: 库存不足\n\tat com.example.service.OrderService.createOrder(OrderService.java:145)\n\tat com.example.controller.OrderController.create(OrderController.java:67)" },
  { id: "2", timestamp: "2024-01-15 14:32:15.456", level: "WARN", service: "inventory-service", thread: "pool-2-thread-3", message: "库存扣减延迟超过500ms" },
  { id: "3", timestamp: "2024-01-15 14:32:16.789", level: "INFO", service: "payment-gateway", thread: "http-nio-8081-exec-5", message: "支付成功 - orderId: O202401150001" },
  { id: "4", timestamp: "2024-01-15 14:32:17.012", level: "DEBUG", service: "user-service", thread: "http-nio-8080-exec-2", message: "用户认证成功 - userId: U10086" },
  { id: "5", timestamp: "2024-01-15 14:32:18.345", level: "ERROR", service: "order-service", thread: "http-nio-8080-exec-4", message: "数据库连接超时", stackTrace: "java.sql.SQLTimeoutException: Connection timeout\n\tat com.mysql.cj.jdbc.exceptions.SQLError.createSQLException(SQLError.java:129)" },
  { id: "6", timestamp: "2024-01-15 14:32:19.678", level: "WARN", service: "kafka-producer", thread: "kafka-producer-network-thread", message: "消息发送重试 - topic: order-events" },
  { id: "7", timestamp: "2024-01-15 14:32:20.901", level: "INFO", service: "notify-service", thread: "pool-3-thread-1", message: "通知发送成功 - sms" },
  { id: "8", timestamp: "2024-01-15 14:32:21.234", level: "DEBUG", service: "redis-cache", thread: "lettuce-eventLoop-1", message: "缓存命中 - key: user:10086" },
  { id: "9", timestamp: "2024-01-15 14:32:22.567", level: "INFO", service: "api-gateway", thread: "http-nio-8080-exec-8", message: "请求完成 - /api/v1/orders - 156ms" },
  { id: "10", timestamp: "2024-01-15 14:32:23.890", level: "ERROR", service: "search-service", thread: "elasticsearch[node-1][search][T#1]", message: "搜索查询失败 - timeout" },
];

const levelConfig = {
  DEBUG: { color: "#60A5FA", bgColor: "rgba(96, 165, 250, 0.1)", icon: Info },
  INFO: { color: "#00D68F", bgColor: "rgba(0, 214, 143, 0.1)", icon: Check },
  WARN: { color: "#FFAA00", bgColor: "rgba(255, 170, 0, 0.1)", icon: AlertTriangle },
  ERROR: { color: "#FF4D4F", bgColor: "rgba(255, 77, 79, 0.1)", icon: AlertTriangle },
};

export default function LogViewer() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterService, setFilterService] = useState<string>("all");
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const url = new URL("/api/logs", window.location.origin);
      if (searchKeyword) url.searchParams.set("keyword", searchKeyword);
      if (filterLevel !== "all") url.searchParams.set("level", filterLevel);
      if (filterService !== "all") url.searchParams.set("service", filterService);

      const response = await fetch(url.toString());
      if (response.ok) {
        const result = await response.json();
        if (result.data) {
          setLogs(result.data);
        }
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesKeyword =
        searchKeyword === "" ||
        log.message.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        log.service.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        log.thread.toLowerCase().includes(searchKeyword.toLowerCase());
      const matchesLevel = filterLevel === "all" || log.level === filterLevel;
      const matchesService = filterService === "all" || log.service === filterService;
      return matchesKeyword && matchesLevel && matchesService;
    });
  }, [logs, searchKeyword, filterLevel, filterService]);

  const uniqueServices = [...new Set(logs.map((l) => l.service))];

  const stats = {
    total: logs.length,
    error: logs.filter((l) => l.level === "ERROR").length,
    warn: logs.filter((l) => l.level === "WARN").length,
    info: logs.filter((l) => l.level === "INFO").length,
  };

  const toggleExpand = (id: string) => {
    setExpandedLogs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const copyMessage = (id: string, message: string) => {
    navigator.clipboard.writeText(message);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <MainLayout title="日志查看">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>日志总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.total}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <FileText size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误日志</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{stats.error}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告日志</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FFAA00" }}>{stats.warn}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>信息日志</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{stats.info}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Check size={20} style={{ color: "#00D68F" }} />
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
              placeholder="搜索日志内容、服务名称、线程..."
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
              <option value="DEBUG">DEBUG</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
            </select>
            <select
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="px-3 py-2 rounded-lg border text-sm"
              style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
            >
              <option value="all">全部服务</option>
              {uniqueServices.map((service) => (
                <option key={service} value={service}>{service}</option>
              ))}
            </select>
          </div>

          <button
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "rgba(250, 204, 21, 0.1)", color: "#FACC15" }}
          >
            <Download size={14} />
            导出日志
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
            <div className="flex items-center gap-2">
              <Terminal size={14} style={{ color: "var(--muted-foreground)" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                日志列表 <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>({filteredLogs.length} 条)</span>
              </span>
            </div>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {filteredLogs.length === 0 ? (
              <div className="px-4 py-12 text-center">
                <FileText size={32} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-2" />
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无符合条件的日志</div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const LevelIcon = levelConfig[log.level].icon;
                const levelStyle = levelConfig[log.level];
                const isExpanded = expandedLogs.has(log.id);

                return (
                  <div key={log.id}>
                    <div
                      className="flex items-center gap-4 p-4 hover:bg-input cursor-pointer transition-colors"
                      onClick={() => toggleExpand(log.id)}
                      style={{ background: log.level === "ERROR" ? levelStyle.bgColor : "transparent" }}
                    >
                      <button className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown size={16} style={{ color: "var(--muted-foreground)" }} />
                        ) : (
                          <ChevronRight size={16} style={{ color: "var(--muted-foreground)" }} />
                        )}
                      </button>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: levelStyle.bgColor }}
                      >
                        <LevelIcon size={16} style={{ color: levelStyle.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-0.5 rounded text-xs font-medium"
                            style={{ background: levelStyle.bgColor, color: levelStyle.color }}
                          >
                            {log.level}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {log.service}
                          </span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                          {log.message}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="text-xs text-right" style={{ color: "var(--muted-foreground)" }}>
                          <div className="flex items-center gap-1">
                            <Clock size={12} />
                            {log.timestamp.split(" ")[1]?.substring(0, 12)}
                          </div>
                          <div className="mt-1">{log.thread}</div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyMessage(log.id, log.message);
                          }}
                          className="p-1.5 rounded hover:bg-input transition-colors"
                          title="复制日志内容"
                        >
                          {copiedId === log.id ? (
                            <Check size={14} style={{ color: "#00D68F" }} />
                          ) : (
                            <Copy size={14} style={{ color: "var(--muted-foreground)" }} />
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && log.stackTrace && (
                      <div className="px-4 pb-4">
                        <div className="ml-12 p-3 rounded-lg font-mono text-xs overflow-x-auto" style={{ background: "#0B1120", color: "#94A3B8" }}>
                          <pre className="whitespace-pre-wrap">{log.stackTrace}</pre>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 日志级别分布 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Terminal size={14} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>日志级别分布</span>
          </div>
          <div className="flex gap-2">
            {[
              { level: "ERROR", count: stats.error, color: "#FF4D4F" },
              { level: "WARN", count: stats.warn, color: "#FFAA00" },
              { level: "INFO", count: stats.info, color: "#00D68F" },
              { level: "DEBUG", count: logs.filter(l => l.level === "DEBUG").length, color: "#60A5FA" },
            ].map((item) => {
              const percentage = logs.length > 0 ? (item.count / logs.length) * 100 : 0;
              return (
                <div
                  key={item.level}
                  className="flex-1 relative rounded-lg overflow-hidden"
                  style={{ height: "24px", background: `${item.color}15` }}
                >
                  <div
                    className="absolute left-0 top-0 h-full rounded-lg transition-all duration-500"
                    style={{ width: `${percentage}%`, background: item.color }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-white drop-shadow">{item.level} {item.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}