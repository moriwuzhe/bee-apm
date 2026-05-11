import { useEffect, useState, useMemo, useCallback } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { traceApi } from "../services/api";
import type { TraceSpan, TraceStats, TraceDetail } from "../types";
import { Search, Filter, Activity, Clock, AlertCircle, CheckCircle, ChevronRight, Flame, Network, Server, Send, Download, RefreshCw, AlertTriangle, Settings, Zap, TrendingUp, BarChart3, List } from "lucide-react";

interface TopTrace {
  traceId: string;
  duration: number;
  services: number;
  status: string;
  startTime: string;
}

interface SlowTrace {
  traceId: string;
  duration: number;
  slowService: string;
  reason: string;
}

interface ServiceTopology {
  service: string;
  calls: number;
  avgLatency: number;
  errorRate: number;
}

interface AdvancedStats {
  totalTraces: number;
  avgDuration: number;
  errorRate: number;
  slowestService: string;
}

export default function TraceTracking() {
  const [loading, setLoading] = useState(true);
  const [traces, setTraces] = useState<TraceSpan[]>([]);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [selectedTrace, setSelectedTrace] = useState<TraceDetail | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [filterApp, setFilterApp] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [advancedStats, setAdvancedStats] = useState<AdvancedStats>({
    totalTraces: 0,
    avgDuration: 0,
    errorRate: 0,
    slowestService: "",
  });
  const [topTraces, setTopTraces] = useState<TopTrace[]>([]);
  const [slowTraces, setSlowTraces] = useState<SlowTrace[]>([]);
  const [serviceTopology, setServiceTopology] = useState<ServiceTopology[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  // 安全解析函数
  const safeParseInt = (value: any, defaultValue: number = 0): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      return isNaN(parsed) ? defaultValue : parsed;
    }
    return defaultValue;
  };

  const safeParseDate = (value: any): Date => {
    if (!value) return new Date();
    if (value instanceof Date) return value;
    const date = new Date(value);
    return isNaN(date.getTime()) ? new Date() : date;
  };

  const safeParseTags = (tags: any): Record<string, any> => {
    if (!tags) return {};
    if (typeof tags === 'object') {
      if (Array.isArray(tags)) {
        try {
          return JSON.parse(tags.join(''));
        } catch {
          return {};
        }
      }
      return tags;
    }
    if (typeof tags === 'string') {
      try {
        const cleaned = tags.trim()
          .replace(/^["']|["']$/g, '')
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\");
        return JSON.parse(cleaned);
      } catch {
        try {
          return JSON.parse(tags);
        } catch {
          return {};
        }
      }
    }
    return {};
  };

  const formatDuration = (ms: number | null | undefined) => {
    if (ms === null || ms === undefined || ms === 0) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 有效的链路追踪类型
  const validSpanTypes = ['HTTP', 'SQL', 'REDIS', 'RPC', 'LOCAL', 'UNKNOWN', 'jvm', 'hb'];
  
  const loadData = async () => {
    try {
      setLoading(true);
      const [tracesRes, statsRes] = await Promise.all([
        traceApi.getTraces(),
        traceApi.getStats(),
      ]);

      if (tracesRes.data) {
        // 转换后端数据格式 - 更安全的解析
        const processedTraces = tracesRes.data.map((t: any, index: number) => {
          const timestamp = safeParseDate(t.timestamp);
          const duration = safeParseInt(t.duration, safeParseInt(t.spend, 0));
          
          const parsedTags = safeParseTags(t.tags);
          const spanType = t.spanType || t.type || 'UNKNOWN';
          const originalTraceId = t.traceId || t.id;
          
          let traceId = originalTraceId || `trace-${index}`;
          if (spanType === 'hb' && (!originalTraceId || originalTraceId.startsWith('unknown'))) {
            traceId = `heartbeat-${t.id}-${Date.now()}`;
          }
          
          return {
            id: t.id || `span-${index}`,
            traceId: traceId,
            spanId: t.spanId || `span-${index}`,
            parentId: t.parentId || null,
            spanType: spanType,
            appName: t.appName || t.app || 'unknown',
            serviceName: t.serviceName || t.appName || t.app || 'unknown',
            methodName: t.methodName || t.method || t.name || '-',
            env: t.env,
            instanceName: t.instanceName || t.inst,
            ipAddress: t.ipAddress || t.ip,
            port: t.port,
            processId: t.processId || t.pid,
            groupId: t.groupId || t.gid,
            startTime: timestamp.getTime(),
            endTime: timestamp.getTime() + duration,
            duration: duration,
            success: t.success !== false,
            errorMsg: t.errorMsg,
            tags: parsedTags,
          };
        }).filter(t => validSpanTypes.includes(t.spanType)); // 过滤掉心跳和JVM指标
        
        setTraces(processedTraces);
      }
      if (statsRes.data) {
        setStats(statsRes.data);
      }

      // 计算高级统计数据
      if (tracesRes.data && tracesRes.data.length > 0) {
        const traceGroups = new Map<string, any[]>();
        tracesRes.data.forEach((t: any) => {
          const tid = t.traceId || t.id;
          if (!traceGroups.has(tid)) traceGroups.set(tid, []);
          traceGroups.get(tid)!.push(t);
        });

        const totalTraces = traceGroups.size;
        const durations = tracesRes.data.map((t: any) => safeParseInt(t.duration, safeParseInt(t.spend, 0)));
        const avgDuration = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
        const errorTraces = tracesRes.data.filter((t: any) => t.success === false).length;
        const errorRate = tracesRes.data.length > 0 ? (errorTraces / tracesRes.data.length) * 100 : 0;

        // 找出最慢服务
        const serviceDurations = new Map<string, number[]>();
        tracesRes.data.forEach((t: any) => {
          const service = t.appName || t.app || 'unknown';
          const duration = safeParseInt(t.duration, safeParseInt(t.spend, 0));
          if (!serviceDurations.has(service)) serviceDurations.set(service, []);
          serviceDurations.get(service)!.push(duration);
        });

        let slowestService = '';
        let maxAvgDuration = 0;
        serviceDurations.forEach((durations, service) => {
          const avg = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
          if (avg > maxAvgDuration) {
            maxAvgDuration = avg;
            slowestService = service;
          }
        });

        setAdvancedStats({
          totalTraces,
          avgDuration,
          errorRate,
          slowestService,
        });

        // TOP 10 慢链路
        const topTracesData: TopTrace[] = Array.from(traceGroups.entries())
          .map(([traceId, spans]) => {
            const duration = spans.reduce((sum: number, s: any) => sum + safeParseInt(s.duration, safeParseInt(s.spend, 0)), 0);
            const hasError = spans.some((s: any) => s.success === false);
            return {
              traceId,
              duration,
              services: spans.length,
              status: hasError ? 'error' : 'success',
              startTime: spans[0]?.timestamp ? new Date(safeParseDate(spans[0].timestamp)).toISOString() : new Date().toISOString(),
            };
          })
          .sort((a, b) => b.duration - a.duration)
          .slice(0, 10);

        setTopTraces(topTracesData);

        // 慢链路详情
        const slowTracesData: SlowTrace[] = tracesRes.data
          .filter((t: any) => safeParseInt(t.duration, safeParseInt(t.spend, 0)) > 500)
          .map((t: any) => ({
            traceId: t.traceId || t.id,
            duration: safeParseInt(t.duration, safeParseInt(t.spend, 0)),
            slowService: t.appName || t.app || 'unknown',
            reason: t.errorMsg || '执行时间过长',
          }))
          .sort((a: SlowTrace, b: SlowTrace) => b.duration - a.duration)
          .slice(0, 10);

        setSlowTraces(slowTracesData);

        // 服务拓扑数据
        const topologyData: ServiceTopology[] = Array.from(serviceDurations.entries())
          .map(([service, durations]) => {
            const totalCalls = tracesRes.data.filter((t: any) => (t.appName || t.app) === service).length;
            const avgLatency = durations.reduce((a: number, b: number) => a + b, 0) / durations.length;
            const errorCount = tracesRes.data.filter((t: any) => (t.appName || t.app) === service && t.success === false).length;
            const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0;
            return { service, calls: totalCalls, avgLatency, errorRate };
          })
          .sort((a, b) => b.calls - a.calls);

        setServiceTopology(topologyData);
      }
    } catch (error) {
      console.error("Failed to load trace data:", error);
    } finally {
      setLoading(false);
    }
  };

  const viewTraceDetail = async (traceId: string) => {
    try {
      const res = await traceApi.getTraceById(traceId);
      if (res.data) {
        // 处理链路详情数据 - 使用安全解析
        const spans = Array.isArray(res.data) ? res.data : [res.data];
        const processedSpans = spans.map((s: any, index: number) => {
          const timestamp = safeParseDate(s.timestamp);
          const duration = safeParseInt(s.duration, safeParseInt(s.spend, 0));
          
          const parsedTags = safeParseTags(s.tags);
          return {
            id: s.id || `span-${index}`,
            traceId: s.traceId || traceId,
            spanId: s.spanId || `span-${index}`,
            parentId: s.parentId || null,
            spanType: s.spanType || s.type || 'UNKNOWN',
            appName: s.appName || s.app || 'unknown',
            serviceName: s.serviceName || s.appName || s.app || 'unknown',
            methodName: s.methodName || s.method || '-',
            env: s.env,
            instanceName: s.instanceName || s.inst,
            ipAddress: s.ipAddress || s.ip,
            port: s.port,
            processId: s.processId || s.pid,
            groupId: s.groupId || s.gid,
            startTime: timestamp.getTime(),
            endTime: timestamp.getTime() + duration,
            duration: duration,
            success: s.success !== false,
            errorMsg: s.errorMsg,
            tags: parsedTags,
          };
        });
        
        const detail: TraceDetail = {
          traceId,
          spans: processedSpans,
          totalDuration: processedSpans.reduce((sum: number, s: any) => sum + s.duration, 0),
          startTime: Math.min(...processedSpans.map((s: any) => s.startTime)),
          endTime: Math.max(...processedSpans.map((s: any) => s.endTime)),
        };
        setSelectedTrace(detail);
        setShowDetail(true);
      }
    } catch (error) {
      console.error("Failed to load trace detail:", error);
    }
  };

  const sendTestData = async () => {
    try {
      setMessage({ type: "success", text: "正在上报测试数据..." });
      const testSpans = generateTestSpans();
      const response = await fetch("http://localhost:8081/apm/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testSpans),
      });
      if (response.ok) {
        setMessage({ type: "success", text: "测试数据上报成功！" });
        setTimeout(() => loadData(), 500);
      } else {
        setMessage({ type: "error", text: "测试数据上报失败" });
      }
    } catch (error) {
      setMessage({ type: "error", text: "上报失败: " + (error as Error).message });
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const generateTestSpans = () => {
    const traceId = "test-trace-" + Date.now();
    const appNames = ["order-service", "payment-gateway", "user-service", "inventory-service"];
    const spanTypes = ["HTTP", "RPC", "SQL", "REDIS"];
    const spans = [];
    
    for (let i = 0; i < 5; i++) {
      spans.push({
        id: traceId + "-" + i,
        traceId,
        spanId: `span-${i}`,
        parentSpanId: i > 0 ? `span-${i - 1}` : null,
        spanType: spanTypes[i % spanTypes.length],
        appName: appNames[i % appNames.length],
        serviceName: "test-service",
        methodName: ["getOrder", "createPayment", "verifyUser", "checkStock", "notify"][i],
        timestamp: Date.now() - i * 100,
        duration: Math.floor(Math.random() * 200) + 50,
        success: Math.random() > 0.1,
        tags: JSON.stringify({ env: "test", version: "v1.0.0" }),
      });
    }
    return spans;
  };

  const exportData = () => {
    const dataToExport = traces.map(t => ({
      traceId: t.traceId,
      spanId: t.spanId,
      spanType: t.spanType,
      appName: t.appName,
      serviceName: t.serviceName,
      methodName: t.methodName,
      duration: t.duration,
      success: t.success,
      time: new Date(t.startTime).toISOString(),
    }));
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trace-data-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setMessage({ type: "success", text: "数据导出成功！" });
    setTimeout(() => setMessage(null), 3000);
  };

  const getSpanTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      HTTP: "#165DFF",
      SQL: "#00B42A",
      REDIS: "#FF7D00",
      RPC: "#722ED1",
      LOCAL: "#86909C",
      jvm: "#9C59B2",
      hb: "#3498DB",
    };
    return colors[type] || "#86909C";
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };

  const filteredTraces = traces.filter((trace) => {
    const matchesKeyword =
      searchKeyword === "" ||
      (trace.traceId && trace.traceId.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (trace.appName && trace.appName.toLowerCase().includes(searchKeyword.toLowerCase())) ||
      (trace.serviceName && trace.serviceName.toLowerCase().includes(searchKeyword.toLowerCase()));
    const matchesApp = filterApp === "" || trace.appName === filterApp;
    const matchesStatus = filterStatus === "" || 
      (filterStatus === "success" && trace.success) || 
      (filterStatus === "error" && !trace.success);
    const matchesType = filterType === "" || trace.spanType === filterType;
    return matchesKeyword && matchesApp && matchesStatus && matchesType;
  });

  const uniqueApps = [...new Set(traces.map((t) => t.appName).filter((name): name is string => !!name))];
  const uniqueTypes = [...new Set(traces.map((t) => t.spanType).filter((type): type is string => !!type))];

  return (
    <MainLayout title="链路追踪" actions={
      <div className="flex items-center gap-2">
        <button
          onClick={loadData}
          className="p-2 rounded-md transition-colors"
          style={{
            background: "rgba(22, 93, 255, 0.1)",
            color: "#165DFF",
          }}
          title="刷新"
        >
          <RefreshCw size={16} />
        </button>
        <button
          onClick={exportData}
          className="p-2 rounded-md transition-colors"
          style={{
            background: "rgba(250, 204, 21, 0.1)",
            color: "#FACC15",
          }}
          title="导出链路"
        >
          <Download size={16} />
        </button>
        <button
          className="p-2 rounded-md transition-colors"
          style={{
            background: "var(--muted)",
            color: "var(--muted-foreground)",
          }}
          title="筛选"
          onClick={() => {
            const filterSection = document.querySelector('input[placeholder*="搜索"]');
            if (filterSection) {
              (filterSection as HTMLInputElement).focus();
            }
          }}
        >
          <Filter size={16} />
        </button>
      </div>
    }>
      <div className="space-y-4">
        {/* 高级链路追踪统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div
            className="p-4 rounded-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(22, 93, 255, 0.15)" }}>
                <Network className="w-5 h-5" style={{ color: "#165DFF" }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  总链路数
                </div>
                <div className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {advancedStats.totalTraces.toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(0, 180, 42, 0.15)" }}>
                <Clock className="w-5 h-5" style={{ color: "#00B42A" }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  平均耗时
                </div>
                <div className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {formatDuration(advancedStats.avgDuration)}
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.15)" }}>
                <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  错误率
                </div>
                <div className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                  {advancedStats.errorRate.toFixed(2)}%
                </div>
              </div>
            </div>
          </div>

          <div
            className="p-4 rounded-lg"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ background: "rgba(255, 170, 0, 0.15)" }}>
                <Zap className="w-5 h-5" style={{ color: "#FFAA00" }} />
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                  最慢服务
                </div>
                <div className="text-lg font-semibold truncate" style={{ color: "var(--foreground)" }}>
                  {advancedStats.slowestService || "-"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 链路健康状态指示器 */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: "#00D68F" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                链路健康状态
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: advancedStats.errorRate < 5 ? "#00D68F" : advancedStats.errorRate < 15 ? "#FFAA00" : "#FF4D4F" }}
                />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  {advancedStats.errorRate < 5 ? "健康" : advancedStats.errorRate < 15 ? "警告" : "异常"}
                </span>
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                过去1小时内共 {advancedStats.totalTraces} 条链路
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-6 gap-3">
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                总链路数
              </div>
              <div className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                {stats.totalTraces?.toLocaleString() || "0"}
              </div>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                成功
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#00D68F" }}>
                {stats.successCount?.toLocaleString() || "0"}
              </div>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                失败
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#FF4D4F" }}>
                {stats.errorCount?.toLocaleString() || "0"}
              </div>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                平均耗时
              </div>
              <div className="text-2xl font-semibold" style={{ color: "var(--foreground)" }}>
                {formatDuration(stats.avgDuration || 0)}
              </div>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                最大耗时
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#FFAA00" }}>
                {formatDuration(stats.maxDuration || 0)}
              </div>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                最小耗时
              </div>
              <div className="text-2xl font-semibold" style={{ color: "#00B42A" }}>
                {formatDuration(stats.minDuration || 0)}
              </div>
            </div>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div
            className="p-3 rounded-lg flex items-center gap-2"
            style={{
              background: message.type === "success" ? "rgba(0, 214, 143, 0.15)" : "rgba(255, 77, 79, 0.15)",
              border: `1px solid ${message.type === "success" ? "#00D68F" : "#FF4D4F"}`,
            }}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />
            ) : (
              <AlertCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />
            )}
            <span className="text-sm" style={{ color: message.type === "success" ? "#00D68F" : "#FF4D4F" }}>
              {message.text}
            </span>
          </div>
        )}

        {/* 搜索和筛选 */}
        <div
          className="flex items-center gap-3 p-4 rounded-lg"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索 Trace ID、应用名称或服务名称..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-md border text-sm"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <select
              value={filterApp}
              onChange={(e) => setFilterApp(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="">全部应用</option>
              {uniqueApps.map((app) => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="">全部类型</option>
              {uniqueTypes.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-md border text-sm"
              style={{
                background: "var(--background)",
                borderColor: "var(--border)",
                color: "var(--foreground)",
              }}
            >
              <option value="">全部状态</option>
              <option value="success">成功</option>
              <option value="error">失败</option>
            </select>
          </div>
          <button
            onClick={loadData}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              background: "rgba(22, 93, 255, 0.1)",
              color: "#165DFF",
            }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
          <button
            onClick={sendTestData}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              background: "rgba(0, 214, 143, 0.1)",
              color: "#00D68F",
            }}
          >
            <Send size={14} />
            上报测试数据
          </button>
          <button
            onClick={exportData}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1"
            style={{
              background: "rgba(250, 204, 21, 0.1)",
              color: "#FACC15",
            }}
          >
            <Download size={14} />
            导出数据
          </button>
          <button
            onClick={() => {
              setSearchKeyword("");
              setFilterApp("");
              setFilterType("");
              setFilterStatus("");
            }}
            className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              background: "var(--muted)",
              color: "var(--muted-foreground)",
            }}
          >
            重置筛选
          </button>
        </div>

        {/* 服务依赖图 */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Network className="w-4 h-4" style={{ color: "#165DFF" }} />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>服务调用拓扑</span>
          </div>
          <ServiceDependencyGraph traces={traces} />
        </div>

        {/* TOP 慢链路表格 */}
        {slowTraces.length > 0 && (
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4" style={{ color: "#FF7D00" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                TOP 慢链路
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--muted)" }}>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      链路ID
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      耗时
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      慢服务
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      原因
                    </th>
                    <th className="text-left px-3 py-2 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {slowTraces.slice(0, 5).map((trace, index) => (
                    <tr
                      key={index}
                      className="hover:bg-opacity-50 transition-colors"
                      style={{ background: "transparent" }}
                    >
                      <td className="px-3 py-3 text-sm font-mono" style={{ color: "var(--foreground)" }}>
                        {trace.traceId}
                      </td>
                      <td className="px-3 py-3 text-sm font-medium" style={{ color: "#FF7D00" }}>
                        {formatDuration(trace.duration)}
                      </td>
                      <td className="px-3 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                        {trace.slowService}
                      </td>
                      <td className="px-3 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {trace.reason}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          className="px-3 py-1 rounded text-xs font-medium transition-colors"
                          style={{
                            background: "rgba(22, 93, 255, 0.1)",
                            color: "#165DFF",
                          }}
                          onClick={() => trace.traceId && viewTraceDetail(trace.traceId)}
                        >
                          查看详情
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 服务拓扑简图 */}
        {serviceTopology.length > 0 && (
          <div
            className="rounded-lg p-4"
            style={{
              background: "var(--card)",
              border: "1px solid var(--border)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <List className="w-4 h-4" style={{ color: "#722ED1" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                服务拓扑
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {serviceTopology.slice(0, 6).map((service, index) => (
                <div
                  key={index}
                  className="p-3 rounded-lg border"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--border)",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Server className="w-4 h-4" style={{ color: "#722ED1" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                        {service.service}
                      </span>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: service.errorRate < 5 ? "#00D68F" : service.errorRate < 15 ? "#FFAA00" : "#FF4D4F",
                      }}
                    />
                  </div>
                  <div className="space-y-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <div className="flex justify-between">
                      <span>调用次数:</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>
                        {service.calls}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>平均延迟:</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>
                        {formatDuration(service.avgLatency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>错误率:</span>
                      <span
                        className="font-medium"
                        style={{
                          color: service.errorRate < 5 ? "#00D68F" : service.errorRate < 15 ? "#FFAA00" : "#FF4D4F",
                        }}
                      >
                        {service.errorRate.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 耗时分布直方图 */}
        <div
          className="rounded-lg p-4"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: "#00D68F" }} />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>耗时分布</span>
          </div>
          <DurationHistogram traces={traces} />
        </div>

        {/* 链路列表 */}
        <div
          className="rounded-lg overflow-hidden"
          style={{
            background: "var(--card)",
            border: "1px solid var(--border)",
          }}
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ background: "var(--muted)" }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    Trace ID
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    应用
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    类型
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    服务
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    方法
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    状态
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    耗时
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    时间
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>加载中...</div>
                    </td>
                  </tr>
                ) : filteredTraces.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-8 text-center">
                      <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无数据</div>
                    </td>
                  </tr>
                ) : (
                  filteredTraces.map((trace, index) => (
                    <tr
                      key={trace.id || index}
                      className="hover:bg-opacity-50 transition-colors cursor-pointer"
                      style={{ background: "transparent" }}
                      onClick={() => trace.traceId && viewTraceDetail(trace.traceId)}
                    >
                      <td className="px-4 py-3 text-sm font-mono" style={{ color: "var(--foreground)" }}>
                        {trace.traceId}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                        {trace.appName}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs font-medium"
                          style={{
                            background: `${getSpanTypeColor(trace.spanType)}15`,
                            color: getSpanTypeColor(trace.spanType),
                          }}
                        >
                          {trace.spanType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                        {trace.serviceName}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {trace.methodName}
                      </td>
                      <td className="px-4 py-3">
                        {trace.success ? (
                          <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />
                        ) : (
                          <AlertCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>
                        <span
                          className={trace.duration > 300 ? "font-medium" : ""}
                          style={{
                            color: trace.duration > 300 ? "#FFAA00" : "var(--foreground)",
                          }}
                        >
                          {formatDuration(trace.duration)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {formatTime(trace.startTime)}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          className="p-1 rounded hover:bg-opacity-10 transition-colors"
                          style={{ color: "#165DFF" }}
                          onClick={(e) => {
                            e.stopPropagation();
                            trace.traceId && viewTraceDetail(trace.traceId);
                          }}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 链路详情弹窗 */}
        {showDetail && selectedTrace && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div
              className="w-full max-w-4xl max-h-[80vh] overflow-auto rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                <div>
                  <h3 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                    链路详情
                  </h3>
                  <p className="text-sm mt-1 font-mono" style={{ color: "var(--muted-foreground)" }}>
                    {selectedTrace.traceId}
                  </p>
                </div>
                <button
                  onClick={() => setShowDetail(false)}
                  className="p-2 rounded-md hover:bg-opacity-10 transition-colors"
                  style={{ color: "var(--muted-foreground)" }}
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      总耗时
                    </div>
                    <div className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                      {formatDuration(selectedTrace.totalDuration)}
                    </div>
                  </div>
                  <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      Span 数量
                    </div>
                    <div className="text-xl font-semibold" style={{ color: "var(--foreground)" }}>
                      {selectedTrace.spans.length}
                    </div>
                  </div>
                  <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>
                      开始时间
                    </div>
                    <div className="text-sm" style={{ color: "var(--foreground)" }}>
                      {formatTime(selectedTrace.startTime)}
                    </div>
                  </div>
                </div>
                {/* 火焰图 */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: "var(--foreground)" }}>
                    <Flame size={14} style={{ color: "#FF7D00" }} />
                    火焰图
                  </h4>
                  <div className="p-3 rounded-md border" style={{ background: "var(--background)", borderColor: "var(--border)" }}>
                    <FlameGraph spans={selectedTrace.spans} />
                  </div>
                </div>

                {/* Span 列表 */}
                <div className="space-y-3">
                  <h4 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                    Span 列表
                  </h4>
                  {selectedTrace.spans.map((span, index) => (
                    <div
                      key={span.id || index}
                      className="p-3 rounded-md border"
                      style={{
                        background: "var(--background)",
                        borderColor: "var(--border)",
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="px-2 py-1 rounded text-xs font-medium"
                            style={{
                              background: `${getSpanTypeColor(span.spanType)}15`,
                              color: getSpanTypeColor(span.spanType),
                            }}
                          >
                            {span.spanType}
                          </span>
                          <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                            {span.appName}
                          </span>
                          {span.success ? (
                            <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />
                          ) : (
                            <AlertCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />
                          )}
                        </div>
                        <span className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>
                          {formatDuration(span.duration)}
                        </span>
                      </div>
                      <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {span.serviceName}.{span.methodName}
                      </div>
                      {span.errorMsg && (
                        <div className="mt-2 text-xs p-2 rounded" style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}>
                          {span.errorMsg}
                        </div>
                      )}
                      {span.tags && Object.keys(span.tags).length > 0 && (
                        <div className="mt-2">
                          {span.spanType === 'jvm' ? (
                            <JVMDetails tags={span.tags} />
                          ) : span.spanType === 'hb' ? (
                            <HBDetails tags={span.tags} />
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(span.tags).map(([key, value]) => (
                                <span
                                  key={key}
                                  className="px-2 py-1 rounded text-xs"
                                  style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
                                >
                                  {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

interface DurationHistogramProps {
  traces: TraceSpan[];
}

function DurationHistogram({ traces }: DurationHistogramProps) {
  if (!traces || traces.length === 0) {
    return <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>暂无数据</div>;
  }

  const bins = [
    { label: "<50ms", min: 0, max: 50, color: "#00D68F" },
    { label: "50-100ms", min: 50, max: 100, color: "#00B42A" },
    { label: "100-200ms", min: 100, max: 200, color: "#165DFF" },
    { label: "200-500ms", min: 200, max: 500, color: "#FFAA00" },
    { label: ">500ms", min: 500, max: Infinity, color: "#FF4D4F" },
  ];

  const counts = bins.map((bin) => 
    traces.filter((t) => {
      const duration = t.duration || 0;
      return duration >= bin.min && duration < bin.max;
    }).length
  );
  
  const maxCount = Math.max(...counts, 1);

  return (
    <div className="flex items-end justify-between gap-2 h-32">
      {bins.map((bin, index) => {
        const height = (counts[index] / maxCount) * 100;
        return (
          <div
            key={bin.label}
            className="flex-1 flex flex-col items-center gap-2"
          >
            <div className="w-full flex flex-col items-end gap-1" style={{ height: "100%" }}>
              <span className="text-xs text-right" style={{ color: "var(--muted-foreground)" }}>
                {counts[index]}
              </span>
              <div
                className="w-full rounded-t-sm transition-all duration-500 hover:opacity-80 cursor-pointer relative group"
                style={{
                  height: `${height}%`,
                  minHeight: "8px",
                  background: `linear-gradient(180deg, ${bin.color} 0%, ${bin.color}80 100%)`,
                }}
              >
                {/* Tooltip */}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 rounded text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all" style={{ background: "rgba(15, 23, 42, 0.95)", color: "#fff", whiteSpace: "nowrap" }}>
                  {bin.label}: {counts[index]} 条
                </div>
              </div>
            </div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {bin.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface ServiceDependencyGraphProps {
  traces: TraceSpan[];
}

function ServiceDependencyGraph({ traces }: ServiceDependencyGraphProps) {
  const serviceMap = useMemo(() => {
    const map: Record<string, { count: number; type: string }> = {};
    if (!traces) return map;
    
    traces.forEach((trace) => {
      if (trace.appName) {
        if (!map[trace.appName]) {
          map[trace.appName] = { count: 0, type: trace.spanType || 'UNKNOWN' };
        }
        map[trace.appName].count++;
      }
    });
    return map;
  }, [traces]);

  const services = Object.entries(serviceMap);
  const maxCount = services.length > 0 ? Math.max(...services.map(([, v]) => v.count), 1) : 1;

  if (services.length === 0) {
    return <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>暂无数据</div>;
  }

  const getNodeColor = (count: number) => {
    const ratio = count / maxCount;
    if (ratio > 0.7) return "#FF4D4F";
    if (ratio > 0.4) return "#FFAA00";
    return "#00D68F";
  };

  return (
    <div className="flex flex-wrap justify-center gap-4 py-4">
      {services.map(([name, { count, type }], index) => (
        <div
          key={name}
          className="relative group"
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 cursor-pointer"
            style={{
              background: `${getNodeColor(count)}20`,
              border: `2px solid ${getNodeColor(count)}`,
            }}
          >
            <Server size={24} style={{ color: getNodeColor(count) }} />
          </div>
          <div className="text-center mt-2">
            <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
              {name}
            </div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              {count} 次调用
            </div>
          </div>
          {/* 连接线 */}
          {index < services.length - 1 && (
            <div className="absolute top-8 left-full w-8 h-0.5" style={{ background: "var(--border)" }}>
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-current animate-pulse" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

interface FlameGraphProps {
  spans: TraceSpan[];
}

function FlameGraph({ spans }: FlameGraphProps) {
  if (!spans || spans.length === 0) {
    return <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>暂无数据</div>;
  }

  // 安全获取开始时间和结束时间
  const startTimes = spans.map((s) => s.startTime || 0).filter(t => t > 0);
  const endTimes = spans.map((s) => s.endTime || 0).filter(t => t > 0);
  
  const minStartTime = startTimes.length > 0 ? Math.min(...startTimes) : Date.now() - 1000;
  const maxEndTime = endTimes.length > 0 ? Math.max(...endTimes) : Date.now();
  
  let totalDuration = maxEndTime - minStartTime;
  // 防止totalDuration为0或太小
  if (totalDuration <= 0) {
    totalDuration = 1000; // 默认1秒
  }
  
  const width = 100;

  const getSpanColor = (type: string) => {
    const colors: Record<string, string> = {
      HTTP: "#165DFF",
      SQL: "#00B42A",
      REDIS: "#FF7D00",
      RPC: "#722ED1",
      LOCAL: "#86909C",
      jvm: "#9C59B2",
      hb: "#3498DB",
    };
    return colors[type] || "#86909C";
  };

  const sortedSpans = [...spans].sort((a, b) => {
    const aStart = a.startTime || 0;
    const bStart = b.startTime || 0;
    if (aStart !== bStart) return aStart - bStart;
    return (b.duration || 0) - (a.duration || 0);
  });

  return (
    <div className="space-y-2">
      {sortedSpans.map((span, index) => {
        const spanStartTime = span.startTime || minStartTime;
        const left = ((spanStartTime - minStartTime) / totalDuration) * width;
        // 确保有最小宽度
        const spanDuration = span.duration || 1;
        const spanWidth = Math.max((spanDuration / totalDuration) * width, 2);

        return (
          <div key={span.id || index} className="relative h-8 flex items-center">
            <div
              className="absolute left-0 top-0 h-full w-full flex items-center"
              style={{ paddingLeft: `${Math.min(left, 90)}%` }}
            >
              <div
                className="h-6 rounded-sm flex items-center px-2 relative group cursor-pointer"
                style={{
                  width: `${Math.min(spanWidth, 100 - Math.min(left, 90))}%`,
                  background: getSpanColor(span.spanType),
                  minWidth: "40px",
                }}
                title={`${span.methodName} - ${spanDuration}ms`}
              >
                <span className="text-xs text-white font-medium truncate">
                  {span.methodName}
                </span>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10" style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid var(--border)" }}>
                  <div className="text-xs text-white font-medium">{span.serviceName}.{span.methodName}</div>
                  <div className="text-xs mt-1" style={{ color: "#94A3B8" }}>
                    <div>类型: {span.spanType}</div>
                    <div>耗时: {spanDuration}ms</div>
                    <div>应用: {span.appName}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}
      {/* 时间轴 */}
      <div className="flex justify-between text-xs pt-2 border-t" style={{ color: "var(--muted-foreground)", borderColor: "var(--border)" }}>
      <span>0ms</span>
      <span>{Math.round(totalDuration / 2)}ms</span>
      <span>{totalDuration}ms</span>
    </div>
  </div>
);
}

interface JVMDetailsProps {
  tags: Record<string, any>;
}

function JVMDetails({ tags }: JVMDetailsProps) {
  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const { memory, thread, gc, heap } = tags;

  return (
    <div className="grid grid-cols-2 gap-3">
      {heap && (
        <div className="p-2 rounded-md" style={{ background: "var(--muted)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>堆内存</div>
          <div className="text-xs space-y-1" style={{ color: "var(--muted-foreground)" }}>
            <div>最大: {formatBytes(heap.max || 0)}</div>
            <div>已用: {formatBytes(heap.used || 0)}</div>
            {heap.max && (
              <div className="mt-1 h-1 rounded-full" style={{ background: "var(--border)" }}>
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    background: "#165DFF",
                    width: `${Math.min((heap.used / heap.max) * 100, 100)}%`
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {memory && (
        <div className="p-2 rounded-md" style={{ background: "var(--muted)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>内存区域</div>
          <div className="text-xs space-y-1" style={{ color: "var(--muted-foreground)" }}>
            <div>Old: {formatBytes(memory.oldSize || 0)}</div>
            <div>Young: {formatBytes(memory.youngSize || 0)}</div>
            <div>PermGen: {formatBytes(memory.permGenSize || 0)}</div>
          </div>
        </div>
      )}
      {thread && (
        <div className="p-2 rounded-md" style={{ background: "var(--muted)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>线程</div>
          <div className="text-xs space-y-1" style={{ color: "var(--muted-foreground)" }}>
            <div>总数: {thread.threadCount || 0}</div>
            <div>守护线程: {thread.daemonThreadCount || 0}</div>
          </div>
        </div>
      )}
      {gc && (
        <div className="p-2 rounded-md" style={{ background: "var(--muted)" }}>
          <div className="text-xs font-medium mb-1" style={{ color: "var(--foreground)" }}>GC统计</div>
          <div className="text-xs space-y-1" style={{ color: "var(--muted-foreground)" }}>
            <div>Young GC: {gc.youngGcCount || 0}次 ({gc.youngGcTime || 0}ms)</div>
            <div>Old GC: {gc.oldGcCount || 0}次 ({gc.oldGcTime || 0}ms)</div>
          </div>
        </div>
      )}
    </div>
  );
}

interface HBDetailsProps {
  tags: Record<string, any>;
}

function HBDetails({ tags }: HBDetailsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(tags).map(([key, value]) => (
        <span
          key={key}
          className="px-2 py-1 rounded text-xs"
          style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
        >
          {key}: {typeof value === 'object' ? JSON.stringify(value) : value}
        </span>
      ))}
    </div>
  );
}
