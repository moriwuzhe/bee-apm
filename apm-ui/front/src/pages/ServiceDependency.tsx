import { useState, useMemo, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, Server, ArrowRight, Activity, Database, Globe, Wifi, AlertTriangle, Settings, Network, Shield, Zap, TrendingUp, Clock, BarChart3, List, NetworkIcon } from "lucide-react";
import { serviceDepApi } from "../services/api";

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
      if (response.data && response.data.length > 0) {
        const data = response.data;
        const serviceNodes: ServiceNode[] = [];
        const serviceCalls: ServiceCall[] = [];
        const depNodes: DependencyNode[] = [];
        const depEdges: DependencyEdge[] = [];
        
        data.forEach((dep: any, index: number) => {
          if (!serviceNodes.find(s => s.name === dep.caller)) {
            serviceNodes.push({
              id: `service-${index}`,
              name: dep.caller,
              type: "app",
              status: "healthy",
              calls: 0,
              avgResponseTime: 0,
              errorRate: 0,
            });
          }
          if (!serviceNodes.find(s => s.name === dep.callee)) {
            serviceNodes.push({
              id: `service-${index}-${dep.callee}`,
              name: dep.callee,
              type: "app",
              status: "healthy",
              calls: 0,
              avgResponseTime: 0,
              errorRate: 0,
            });
          }
          
          serviceCalls.push({
            source: dep.caller,
            target: dep.callee,
            calls: dep.callCount || 0,
            avgTime: dep.avgDuration || 0,
          });

          if (!depNodes.find(n => n.id === `node-${dep.caller}`)) {
            depNodes.push({
              id: `node-${dep.caller}`,
              name: dep.caller,
              type: "service",
              status: "healthy",
            });
          }
          if (!depNodes.find(n => n.id === `node-${dep.callee}`)) {
            depNodes.push({
              id: `node-${dep.callee}`,
              name: dep.callee,
              type: "service",
              status: "healthy",
            });
          }

          depEdges.push({
            from: dep.caller,
            to: dep.callee,
            calls: dep.callCount || 0,
            latency: dep.avgDuration || 0,
          });
        });
        
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

        const topDeps: TopDependency[] = serviceNodes.slice(0, 5).map(s => ({
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
      } else {
        setServices([]);
        setCalls([]);
        setNodes([]);
        setEdges([]);
        setDependencyStats({
          totalServices: 0,
          totalCalls: 0,
          avgLatency: 0,
          errorRate: 0,
        });
        setTopDependencies([]);
        setDependencyHealth([]);
      }
    } catch (error) {
      console.error("Failed to fetch service dependency data:", error);
      setServices([]);
      setCalls([]);
      setNodes([]);
      setEdges([]);
    }
    setIsLoading(false);
  };

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
          <button
            onClick={fetchData}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
            style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            title="刷新"
          >
            <RefreshCw size={15} />
          </button>
          
          <div className="relative">
            <button
              onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
              className="flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
              style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
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

          <div className="flex items-center gap-1 px-2 rounded-md" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center justify-center w-8 h-8 rounded transition-all"
              style={{ background: viewMode === "list" ? "var(--primary)" : "transparent", color: viewMode === "list" ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
              title="列表视图"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode("graph")}
              className="flex items-center justify-center w-8 h-8 rounded transition-all"
              style={{ background: viewMode === "graph" ? "var(--primary)" : "transparent", color: viewMode === "graph" ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
              title="图形视图"
            >
              <NetworkIcon size={15} />
            </button>
          </div>
        </>
      }
    >
      <div className="space-y-4">
        {/* 依赖统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总服务数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {dependencyStats.totalServices}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Server size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总调用量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {(dependencyStats.totalCalls / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Activity size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {dependencyStats.avgLatency}<span className="text-sm font-normal">ms</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <Zap size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误率</div>
                <div className="text-xl font-bold mt-1" style={{ color: dependencyStats.errorRate > 1 ? "#FF4D4F" : "var(--foreground)" }}>
                  {dependencyStats.errorRate}<span className="text-sm font-normal">%</span>
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
      </div>
    </MainLayout>
  );
}
