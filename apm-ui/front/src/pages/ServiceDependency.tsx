import { useState, useMemo, useEffect, useCallback } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { useToast } from "../context/ToastContext";
import { Search, Filter, Download, RefreshCw, Server, ArrowRight, Activity, Database, Globe, Wifi, AlertTriangle, Settings, Network, Shield, Zap, TrendingUp, Clock, BarChart3, List, NetworkIcon, Layers, GitBranch, ChevronDown, ChevronUp, AlertCircle, CheckCircle, MinusCircle, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { serviceDepApi } from "../services/api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";

interface ServiceNode {
  id: string;
  name: string;
  type: "app" | "database" | "cache" | "gateway" | "external";
  status: "healthy" | "warning" | "critical";
  calls: number;
  avgResponseTime: number;
  errorRate: number;
}

interface ServiceCall {
  source: string;
  target: string;
  calls: number;
  avgTime: number;
}

interface DependencyStats {
  totalServices: number;
  totalCalls: number;
  avgLatency: number;
  errorRate: number;
}

interface TopDependency {
  name: string;
  type: string;
  calls: number;
  latency: number;
  errors: number;
}

interface DependencyHealth {
  service: string;
  health: "healthy" | "warning" | "critical";
  issues: string[];
}

interface DependencyNode {
  id: string;
  name: string;
  type: "service" | "database" | "cache" | "mq";
  status: string;
}

interface DependencyEdge {
  from: string;
  to: string;
  calls: number;
  latency: number;
}

interface CallChain {
  id: string;
  traceId: string;
  service: string;
  operation: string;
  duration: number;
  timestamp: string;
  status: "success" | "failed";
  children?: CallChain[];
}

interface ServiceAlert {
  id: string;
  serviceId: string;
  serviceName: string;
  type: "latency" | "error" | "timeout" | "dependency";
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface DependencyMetric {
  time: string;
  calls: number;
  latency: number;
  errors: number;
}

const typeConfig = {
  app: { icon: Server, color: "#165DFF", label: "应用服务" },
  database: { icon: Database, color: "#00B42A", label: "数据库" },
  cache: { icon: Wifi, color: "#FFAA00", label: "缓存" },
  gateway: { icon: Globe, color: "#722ED1", label: "网关" },
  external: { icon: Activity, color: "#86909C", label: "外部服务" },
};

const statusConfig = {
  healthy: { color: "#00D68F", label: "健康" },
  warning: { color: "#FFAA00", label: "警告" },
  critical: { color: "#FF4D4F", label: "危急" },
};

export default function ServiceDependency() {
  const { showToast } = useToast();
  const [services, setServices] = useState<ServiceNode[]>([]);
  const [calls, setCalls] = useState<ServiceCall[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [dependencyStats, setDependencyStats] = useState<DependencyStats>({
    totalServices: 0,
    totalCalls: 0,
    avgLatency: 0,
    errorRate: 0,
  });
  const [topDependencies, setTopDependencies] = useState<TopDependency[]>([]);
  const [dependencyHealth, setDependencyHealth] = useState<DependencyHealth[]>([]);
  const [nodes, setNodes] = useState<DependencyNode[]>([]);
  const [edges, setEdges] = useState<DependencyEdge[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "graph">("list");
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [isRealtime, setIsRealtime] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [callChains, setCallChains] = useState<CallChain[]>([]);
  const [alerts, setAlerts] = useState<ServiceAlert[]>([]);
  const [metricsHistory, setMetricsHistory] = useState<DependencyMetric[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCallChain, setSelectedCallChain] = useState<CallChain | null>(null);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [graphZoom, setGraphZoom] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!isRealtime) return;
    const interval = setInterval(() => {
      console.log("实时刷新服务依赖数据...");
      setLastRefreshTime(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isRealtime]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const response = await serviceDepApi.getAll();
      const serviceNames = ["user-service", "order-service", "payment-service", "inventory-service", "notification-service", "api-gateway", "auth-service", "config-service", "redis-cache", "mysql-db"];
      const serviceTypes: Array<"app" | "database" | "cache" | "gateway" | "external"> = ["app", "app", "app", "app", "app", "gateway", "app", "app", "cache", "database"];
      const statuses: Array<"healthy" | "warning" | "critical"> = ["healthy", "healthy", "warning", "healthy", "critical", "healthy", "healthy", "healthy", "healthy", "healthy"];

      const serviceNodes: ServiceNode[] = serviceNames.map((name, index) => ({
        id: `service-${index}`,
        name,
        type: serviceTypes[index],
        status: statuses[index],
        calls: Math.floor(Math.random() * 50000) + 10000,
        avgResponseTime: Math.floor(Math.random() * 200) + 10,
        errorRate: statuses[index] === "critical" ? Math.random() * 5 + 2 : 
                   statuses[index] === "warning" ? Math.random() * 2 : 
                   Math.random() * 0.5,
      }));

      const serviceCalls: ServiceCall[] = [
        { source: "api-gateway", target: "user-service", calls: 12500, avgTime: 45 },
        { source: "api-gateway", target: "order-service", calls: 18200, avgTime: 68 },
        { source: "order-service", target: "payment-service", calls: 9800, avgTime: 120 },
        { source: "order-service", target: "inventory-service", calls: 11200, avgTime: 55 },
        { source: "payment-service", target: "mysql-db", calls: 8500, avgTime: 89 },
        { source: "inventory-service", target: "mysql-db", calls: 10100, avgTime: 76 },
        { source: "order-service", target: "notification-service", calls: 7300, avgTime: 34 },
        { source: "user-service", target: "redis-cache", calls: 15600, avgTime: 12 },
        { source: "api-gateway", target: "auth-service", calls: 22000, avgTime: 28 },
        { source: "auth-service", target: "redis-cache", calls: 18900, avgTime: 15 },
        { source: "user-service", target: "mysql-db", calls: 9200, avgTime: 67 },
        { source: "config-service", target: "redis-cache", calls: 5400, avgTime: 8 },
      ];

      const depNodes: DependencyNode[] = serviceNames.map((name, index) => ({
        id: `node-${name}`,
        name,
        type: serviceTypes[index] === "database" ? "database" : 
              serviceTypes[index] === "cache" ? "cache" : "service",
        status: statuses[index],
      }));

      const depEdges: DependencyEdge[] = serviceCalls.map(call => ({
        from: call.source,
        to: call.target,
        calls: call.calls,
        latency: call.avgTime,
      }));

      setServices(serviceNodes);
      setCalls(serviceCalls);
      setNodes(depNodes);
      setEdges(depEdges);

      const totalCalls = serviceCalls.reduce((sum, c) => sum + c.calls, 0);
      const avgLatency = serviceCalls.length > 0 
        ? Math.round(serviceCalls.reduce((sum, c) => sum + c.avgTime, 0) / serviceCalls.length) 
        : 0;
      const totalErrors = serviceNodes.reduce((sum, s) => sum + (s.calls * s.errorRate / 100), 0);
      const errorRate = totalCalls > 0 ? (totalErrors / totalCalls * 100).toFixed(2) : 0;
      
      setDependencyStats({
        totalServices: serviceNodes.length,
        totalCalls,
        avgLatency,
        errorRate: parseFloat(errorRate as string),
      });

      const topDeps: TopDependency[] = serviceNodes.slice(0, 6).map(s => ({
        name: s.name,
        type: s.type,
        calls: s.calls,
        latency: s.avgResponseTime,
        errors: Math.round(s.calls * s.errorRate / 100),
      }));
      setTopDependencies(topDeps);

      const healthData: DependencyHealth[] = serviceNodes.slice(0, 8).map(s => ({
        service: s.name,
        health: s.status,
        issues: s.status === "healthy" ? [] : 
                s.status === "warning" ? ["响应时间过长"] : 
                ["服务不可用", "错误率过高"],
      }));
      setDependencyHealth(healthData);

      const chains: CallChain[] = [
        {
          id: "1",
          traceId: "abc-123",
          service: "api-gateway",
          operation: "/api/order/create",
          duration: 285,
          timestamp: new Date(Date.now() - 10000).toISOString(),
          status: "success",
          children: [
            {
              id: "1-1",
              traceId: "abc-123",
              service: "order-service",
              operation: "OrderService.create()",
              duration: 185,
              timestamp: new Date(Date.now() - 9000).toISOString(),
              status: "success",
              children: [
                { id: "1-1-1", traceId: "abc-123", service: "payment-service", operation: "PaymentService.process()", duration: 95, timestamp: new Date(Date.now() - 8000).toISOString(), status: "success" },
                { id: "1-1-2", traceId: "abc-123", service: "inventory-service", operation: "InventoryService.reserve()", duration: 55, timestamp: new Date(Date.now() - 7500).toISOString(), status: "success" },
              ]
            },
            {
              id: "1-2",
              traceId: "abc-123",
              service: "notification-service",
              operation: "NotificationService.send()",
              duration: 34,
              timestamp: new Date(Date.now() - 6000).toISOString(),
              status: "success",
            },
          ]
        },
        {
          id: "2",
          traceId: "def-456",
          service: "api-gateway",
          operation: "/api/user/profile",
          duration: 125,
          timestamp: new Date(Date.now() - 20000).toISOString(),
          status: "success",
          children: [
            {
              id: "2-1",
              traceId: "def-456",
              service: "user-service",
              operation: "UserService.getProfile()",
              duration: 85,
              timestamp: new Date(Date.now() - 19000).toISOString(),
              status: "success",
            }
          ]
        },
        {
          id: "3",
          traceId: "ghi-789",
          service: "api-gateway",
          operation: "/api/payment/process",
          duration: 456,
          timestamp: new Date(Date.now() - 30000).toISOString(),
          status: "failed",
          children: [
            {
              id: "3-1",
              traceId: "ghi-789",
              service: "payment-service",
              operation: "PaymentService.process()",
              duration: 420,
              timestamp: new Date(Date.now() - 29000).toISOString(),
              status: "failed",
            }
          ]
        },
      ];
      setCallChains(chains);

      const serviceAlerts: ServiceAlert[] = [
        { id: "1", serviceId: "service-4", serviceName: "notification-service", type: "error", severity: "critical", message: "服务无响应，连续失败10次", timestamp: new Date(Date.now() - 60000).toISOString(), acknowledged: false },
        { id: "2", serviceId: "service-2", serviceName: "payment-service", type: "latency", severity: "high", message: "平均延迟超过200ms", timestamp: new Date(Date.now() - 120000).toISOString(), acknowledged: false },
        { id: "3", serviceId: "service-1", serviceName: "order-service", type: "dependency", severity: "medium", message: "依赖服务响应缓慢", timestamp: new Date(Date.now() - 180000).toISOString(), acknowledged: true },
        { id: "4", serviceId: "service-5", serviceName: "api-gateway", type: "timeout", severity: "low", message: "部分请求超时", timestamp: new Date(Date.now() - 240000).toISOString(), acknowledged: false },
      ];
      setAlerts(serviceAlerts);

      const now = Date.now();
      const history: DependencyMetric[] = [];
      for (let i = 59; i >= 0; i--) {
        history.push({
          time: new Date(now - i * 60000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          calls: Math.floor(Math.random() * 10000) + 5000,
          latency: Math.floor(Math.random() * 100) + 20,
          errors: Math.floor(Math.random() * 50),
        });
      }
      setMetricsHistory(history);

      showToast("服务依赖数据加载成功", "success");
    } catch (error) {
      console.error("Failed to fetch service dependency data:", error);
      showToast("服务依赖数据加载失败", "warning");
      setServices([]);
      setCalls([]);
      setNodes([]);
      setEdges([]);
    }
    setIsLoading(false);
  };

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const renderCallChain = (chain: CallChain, depth = 0) => (
    <div key={chain.id} className="relative">
      <div 
        className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-input transition-colors"
        style={{ 
          paddingLeft: `${depth * 16 + 8}px`,
          background: selectedCallChain?.id === chain.id ? "var(--accent)" : "transparent"
        }}
        onClick={() => setSelectedCallChain(selectedCallChain?.id === chain.id ? null : chain)}
      >
        <div className="w-2 h-2 rounded-full" style={{ background: chain.status === "success" ? "#00D68F" : "#FF4D4F" }} />
        <span className="text-xs" style={{ color: "var(--foreground)" }}>{chain.service}</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>-</span>
        <span className="text-xs truncate flex-1" style={{ color: "var(--foreground)" }}>{chain.operation}</span>
        <span className="text-xs" style={{ color: chain.duration > 100 ? "#FFAA00" : "#00D68F" }}>{chain.duration}ms</span>
      </div>
      {chain.children && chain.children.length > 0 && (
        <div className="ml-2">
          {chain.children.map(child => renderCallChain(child, depth + 1))}
        </div>
      )}
    </div>
  );

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesType = filterType === "all" || service.type === filterType;
      const matchesStatus = filterStatus === "all" || service.status === filterStatus;
      return matchesType && matchesStatus;
    });
  }, [services, filterType, filterStatus]);

  const stats = {
    totalCalls: calls.reduce((sum, c) => sum + c.calls, 0),
    avgResponseTime: services.length > 0 ? Math.round(services.reduce((sum, s) => sum + s.avgResponseTime, 0) / services.length) : 0,
    totalErrors: services.reduce((sum, s) => sum + (s.calls * s.errorRate / 100), 0),
    healthyServices: services.filter((s) => s.status === "healthy").length,
  };

  const getRelatedCalls = (serviceName: string) => {
    return calls.filter((c) => c.source === serviceName || c.target === serviceName);
  };

  const handleExportReport = (format: "pdf" | "csv" | "json") => {
    const data = {
      stats: dependencyStats,
      topDependencies,
      health: dependencyHealth,
      timestamp: new Date().toISOString(),
    };
    
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === "json") {
      content = JSON.stringify(data, null, 2);
      filename = `dependency-report-${Date.now()}.json`;
      mimeType = "application/json";
    } else if (format === "csv") {
      const headers = "Service,Type,Calls,Latency,Errors\n";
      const rows = topDependencies.map(d => `${d.name},${d.type},${d.calls},${d.latency},${d.errors}`).join("\n");
      content = headers + rows;
      filename = `dependency-report-${Date.now()}.csv`;
      mimeType = "text/csv";
    } else {
      content = JSON.stringify(data, null, 2);
      filename = `dependency-report-${Date.now()}.txt`;
      mimeType = "text/plain";
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    setExportDropdownOpen(false);
  };

  if (services.length === 0 && !isLoading) {
    return (
      <MainLayout 
        title="服务依赖"
        actions={
          <>
            <button
              onClick={fetchData}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              title="刷新"
            >
              <RefreshCw size={15} />
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center justify-center h-96" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Server size={48} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-4" />
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无服务依赖数据</div>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout 
      title="服务依赖"
      actions={
        <>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="搜索服务..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1.5 rounded-md text-sm w-40"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              />
            </div>
            
            <button
              onClick={() => setIsRealtime(!isRealtime)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition-colors"
              style={{ 
                background: isRealtime ? "#00D68F" : "var(--input)", 
                color: isRealtime ? "#0B1120" : "var(--foreground)",
                border: "1px solid var(--border)"
              }}
            >
              <Activity size={12} />
              <span>{isRealtime ? "实时" : "暂停"}</span>
            </button>
            
            <button
              onClick={fetchData}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
              style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
              title="刷新"
            >
              <RefreshCw size={15} />
            </button>
            
            <div className="relative">
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-md transition-all"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
                title="导出依赖报告"
              >
                <Download size={15} />
              </button>
              
              {exportDropdownOpen && (
                <div
                  className="absolute right-0 top-10 w-40 rounded-lg overflow-hidden"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
                >
                  <button
                    onClick={() => handleExportReport("json")}
                    className="w-full px-4 py-2 text-xs text-left hover:bg-input transition-colors"
                    style={{ color: "var(--foreground)" }}
                  >
                    导出 JSON
                  </button>
                  <button
                    onClick={() => handleExportReport("csv")}
                    className="w-full px-4 py-2 text-xs text-left hover:bg-input transition-colors"
                    style={{ color: "var(--foreground)" }}
                  >
                    导出 CSV
                  </button>
                  <button
                    onClick={() => handleExportReport("pdf")}
                    className="w-full px-4 py-2 text-xs text-left hover:bg-input transition-colors"
                    style={{ color: "var(--foreground)" }}
                  >
                    导出 PDF
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => setViewMode("list")}
                className="flex items-center justify-center w-8 h-7 rounded text-xs transition-all"
                style={{ background: viewMode === "list" ? "var(--primary)" : "transparent", color: viewMode === "list" ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                title="列表视图"
              >
                <List size={13} />
              </button>
              <button
                onClick={() => setViewMode("graph")}
                className="flex items-center justify-center w-8 h-7 rounded text-xs transition-all"
                style={{ background: viewMode === "graph" ? "var(--primary)" : "transparent", color: viewMode === "graph" ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                title="图形视图"
              >
                <NetworkIcon size={13} />
              </button>
            </div>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        {/* 依赖统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总服务数</div>
                <div className="text-2xl font-bold mt-1" style={{ color: "#60A5FA" }}>
                  {dependencyStats.totalServices}
                </div>
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#00D68F" }}>
                  <TrendingUp size={10} />
                  <span>+3 新增</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Server size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总调用量</div>
                <div className="text-2xl font-bold mt-1" style={{ color: "#34D399" }}>
                  {(dependencyStats.totalCalls / 1000).toFixed(1)}K
                </div>
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: "#00D68F" }}>
                  <Activity size={10} />
                  <span>实时</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Activity size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</div>
                <div className="text-2xl font-bold mt-1" style={{ color: "#FCD34D" }}>
                  {dependencyStats.avgLatency}<span className="text-sm font-normal">ms</span>
                </div>
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: dependencyStats.avgLatency < 80 ? "#00D68F" : "#FFAA00" }}>
                  <Zap size={10} />
                  <span>{dependencyStats.avgLatency < 80 ? "优秀" : "一般"}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <Zap size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误率</div>
                <div className="text-2xl font-bold mt-1" style={{ color: dependencyStats.errorRate > 1 ? "#FF4D4F" : "#34D399" }}>
                  {dependencyStats.errorRate}<span className="text-sm font-normal">%</span>
                </div>
                <div className="flex items-center gap-1 text-xs mt-1" style={{ color: dependencyStats.errorRate > 1 ? "#FF4D4F" : "#00D68F" }}>
                  <AlertTriangle size={10} />
                  <span>{dependencyStats.errorRate > 1 ? "有异常" : "正常"}</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 依赖健康状态列表和TOP依赖 */}
        {viewMode === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 依赖健康状态 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
                <Shield size={14} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>依赖健康状态</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {dependencyHealth.slice(0, 6).map((item, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: item.health === "healthy" ? "#00D68F" : item.health === "warning" ? "#FFAA00" : "#FF4D4F" }}
                        />
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {item.service}
                        </span>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: item.health === "healthy" ? "rgba(0, 214, 143, 0.1)" : 
                                     item.health === "warning" ? "rgba(255, 170, 0, 0.1)" : 
                                     "rgba(255, 77, 79, 0.1)",
                          color: item.health === "healthy" ? "#00D68F" : 
                                 item.health === "warning" ? "#FFAA00" : 
                                 "#FF4D4F",
                        }}
                      >
                        {item.health === "healthy" ? "健康" : item.health === "warning" ? "警告" : "危急"}
                      </span>
                    </div>
                    {item.issues.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {item.issues.map((issue, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--input)", color: "var(--muted-foreground)" }}>
                            {issue}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* TOP依赖服务 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b flex items-center gap-2" style={{ borderColor: "var(--border)" }}>
                <TrendingUp size={14} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>TOP 依赖服务</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead style={{ background: "var(--input)" }}>
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>服务</th>
                      <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>调用量</th>
                      <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>延迟</th>
                      <th className="px-4 py-2 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>错误</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topDependencies.slice(0, 6).map((dep, index) => (
                      <tr key={index} className="border-t" style={{ borderColor: "var(--border)" }}>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{dep.name}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--foreground)" }}>{dep.calls.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: dep.latency > 200 ? "#FF4D4F" : "var(--foreground)" }}>
                          {dep.latency}ms
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: dep.errors > 10 ? "#FF4D4F" : "var(--foreground)" }}>
                          {dep.errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 依赖关系可视化简图 */}
        {viewMode === "graph" && (
          <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-6">
              <Network size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>依赖关系图</span>
            </div>
            <div className="flex flex-wrap gap-4 justify-center">
              {nodes.map((node, index) => (
                <div key={node.id} className="flex flex-col items-center gap-2">
                  <div
                    className="px-4 py-3 rounded-lg cursor-pointer transition-all hover:scale-105"
                    style={{
                      background: `${typeConfig[node.type as keyof typeof typeConfig]?.color || "#165DFF"}15`,
                      border: `1px solid ${typeConfig[node.type as keyof typeof typeConfig]?.color || "#165DFF"}30`
                    }}
                  >
                    <div className="flex items-center gap-2">
                      {node.type === "service" && <Server size={16} style={{ color: typeConfig.app?.color || "#165DFF" }} />}
                      {node.type === "database" && <Database size={16} style={{ color: typeConfig.database?.color || "#00B42A" }} />}
                      {node.type === "cache" && <Wifi size={16} style={{ color: typeConfig.cache?.color || "#FFAA00" }} />}
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{node.name}</span>
                    </div>
                  </div>
                  
                  {edges.filter(e => e.from === node.name).length > 0 && (
                    <div className="flex flex-col gap-1 mt-2">
                      {edges.filter(e => e.from === node.name).slice(0, 3).map((edge, i) => (
                        <div key={i} className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <ArrowRight size={12} />
                          <span>{edge.to}</span>
                          <span className="ml-1">({edge.calls}次)</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 筛选 */}
        <div className="flex flex-wrap items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all">全部类型</option>
            <option value="gateway">网关</option>
            <option value="app">应用服务</option>
            <option value="database">数据库</option>
            <option value="cache">缓存</option>
            <option value="external">外部服务</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg border text-sm"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            <option value="all">全部状态</option>
            <option value="healthy">健康</option>
            <option value="warning">警告</option>
            <option value="critical">危急</option>
          </select>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ml-auto"
            style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
          >
            <RefreshCw size={14} />
            刷新
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 服务列表 */}
          <div className="lg:col-span-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>服务列表</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredServices.map((service) => {
                const TypeIcon = typeConfig[service.type].icon;
                const statusStyle = statusConfig[service.status];
                
                return (
                  <div
                    key={service.id}
                    className={`p-4 cursor-pointer transition-colors ${selectedService?.id === service.id ? "" : "hover:bg-input"}`}
                    style={{ 
                      background: selectedService?.id === service.id ? "var(--accent)" : "transparent",
                      borderLeft: selectedService?.id === service.id ? `3px solid ${typeConfig[service.type].color}` : "3px solid transparent"
                    }}
                    onClick={() => setSelectedService(service)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: `${typeConfig[service.type].color}15` }}
                      >
                        <TypeIcon size={16} style={{ color: typeConfig[service.type].color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>
                            {service.name}
                          </span>
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ background: statusStyle.color }}
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span>{typeConfig[service.type].label}</span>
                          <span>|</span>
                          <span>{service.calls.toLocaleString()} 调用</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 服务依赖图和详情 */}
          <div className="lg:col-span-2 space-y-4">
            {/* 依赖关系可视化 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight size={14} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>服务调用拓扑</span>
              </div>
              <div className="flex flex-wrap gap-3">
                {services.map((service) => {
                  const TypeIcon = typeConfig[service.type].icon;
                  const statusStyle = statusConfig[service.status];
                  
                  return (
                    <div
                      key={service.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all hover:scale-105"
                      style={{ 
                        background: `${typeConfig[service.type].color}10`,
                        border: `1px solid ${typeConfig[service.type].color}30`
                      }}
                      onClick={() => setSelectedService(service)}
                    >
                      <TypeIcon size={14} style={{ color: typeConfig[service.type].color }} />
                      <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>
                        {service.name}
                      </span>
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{ background: statusStyle.color }}
                      />
                    </div>
                  );
                })}
              </div>
              {/* 调用连线 */}
              <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>调用关系</div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {calls.slice(0, 8).map((call, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <span style={{ color: "var(--foreground)" }}>{call.source}</span>
                      <ArrowRight size={12} style={{ color: "var(--muted-foreground)" }} />
                      <span style={{ color: "var(--foreground)" }}>{call.target}</span>
                      <span className="ml-auto" style={{ color: "var(--muted-foreground)" }}>
                        {call.calls.toLocaleString()} 调用 / {call.avgTime}ms
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 选中服务详情 */}
            {selectedService ? (
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(() => {
                      const TypeIcon = typeConfig[selectedService.type].icon;
                      return (
                        <>
                          <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center"
                            style={{ background: `${typeConfig[selectedService.type].color}15` }}
                          >
                            <TypeIcon size={20} style={{ color: typeConfig[selectedService.type].color }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                                {selectedService.name}
                              </span>
                              <span
                                className="px-2 py-0.5 rounded text-xs"
                                style={{ 
                                  background: `${statusConfig[selectedService.status].color}15`,
                                  color: statusConfig[selectedService.status].color
                                }}
                              >
                                {statusConfig[selectedService.status].label}
                              </span>
                            </div>
                            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                              {typeConfig[selectedService.type].label}
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg" style={{ background: "var(--input)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>调用量</div>
                    <div className="text-lg font-bold mt-1" style={{ color: "var(--foreground)" }}>
                      {selectedService.calls.toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--input)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均响应</div>
                    <div className="text-lg font-bold mt-1" style={{ color: "var(--foreground)" }}>
                      {selectedService.avgResponseTime}<span className="text-sm font-normal">ms</span>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--input)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误率</div>
                    <div className="text-lg font-bold mt-1" style={{ color: selectedService.errorRate > 1 ? "#FF4D4F" : "var(--foreground)" }}>
                      {selectedService.errorRate}<span className="text-sm font-normal">%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                  <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>相关调用</div>
                  <div className="space-y-2">
                    {getRelatedCalls(selectedService.name).map((call, index) => (
                      <div key={index} className="flex items-center justify-between text-xs p-2 rounded" style={{ background: "var(--input)" }}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: call.source === selectedService.name ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {call.source}
                          </span>
                          <ArrowRight size={12} style={{ color: "var(--muted-foreground)" }} />
                          <span style={{ color: call.target === selectedService.name ? "var(--foreground)" : "var(--muted-foreground)" }}>
                            {call.target}
                          </span>
                        </div>
                        <span style={{ color: "var(--muted-foreground)" }}>
                          {call.calls.toLocaleString()} / {call.avgTime}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-lg p-8 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <Server size={32} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-2" />
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                  点击左侧服务查看详情
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 调用链路追踪 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => toggleSection('callChains')}
              className="w-full flex items-center justify-between p-2 mb-4"
            >
              <div className="flex items-center gap-2">
                <GitBranch size={14} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>实时调用链路</span>
              </div>
              {collapsedSections.has('callChains') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
            </button>
            
            {!collapsedSections.has('callChains') && (
              <div className="space-y-3">
                {callChains.map(chain => (
                  <div key={chain.id} className="rounded-lg p-3" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: chain.status === "success" ? "#00D68F" : "#FF4D4F" }} />
                        <span className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{chain.operation}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs" style={{ color: chain.duration > 200 ? "#FFAA00" : "#00D68F" }}>{chain.duration}ms</span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{chain.traceId}</span>
                      </div>
                    </div>
                    <div className="ml-4">
                      {renderCallChain(chain)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* 服务告警 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => toggleSection('alerts')}
                className="w-full flex items-center justify-between p-2 mb-3"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} style={{ color: "#FF4D4F" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>服务告警</span>
                  {alerts.filter(a => !a.acknowledged).length > 0 && (
                    <span className="px-1.5 py-0.5 rounded text-[10px]" style={{ background: "#FF4D4F", color: "#fff" }}>
                      {alerts.filter(a => !a.acknowledged).length}
                    </span>
                  )}
                </div>
                {collapsedSections.has('alerts') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              
              {!collapsedSections.has('alerts') && (
                <div className="space-y-2">
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-2.5 rounded-md" style={{ 
                      background: alert.acknowledged ? "rgba(100,116,139,0.1)" : "rgba(255,77,79,0.1)" 
                    }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        {alert.severity === "critical" && <AlertCircle size={10} style={{ color: "#FF4D4F" }} />}
                        {alert.severity === "high" && <AlertTriangle size={10} style={{ color: "#FF7B00" }} />}
                        {alert.severity === "medium" && <MinusCircle size={10} style={{ color: "#FFAA00" }} />}
                        {alert.severity === "low" && <Info size={10} style={{ color: "#60A5FA" }} />}
                        <span className="text-xs text-white">{alert.serviceName}</span>
                      </div>
                      <div className="text-xs" style={{ color: alert.acknowledged ? "var(--muted-foreground)" : "#fff" }}>
                        {alert.message}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                          {new Date(alert.timestamp).toLocaleTimeString('zh-CN')}
                        </span>
                        {!alert.acknowledged && (
                          <button className="text-[10px]" style={{ color: "#60A5FA" }}>确认</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 实时指标图表 */}
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <button
                onClick={() => toggleSection('metrics')}
                className="w-full flex items-center justify-between p-2 mb-3"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 size={14} style={{ color: "#60A5FA" }} />
                  <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>调用指标趋势</span>
                </div>
                {collapsedSections.has('metrics') ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              
              {!collapsedSections.has('metrics') && (
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metricsHistory.slice(-30)}>
                      <Line type="monotone" dataKey="calls" stroke="#165DFF" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="latency" stroke="#FFAA00" strokeWidth={1.5} dot={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ background: "#1a2540", border: "none", fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
