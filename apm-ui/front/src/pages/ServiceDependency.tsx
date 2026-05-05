import { useState, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Search, Filter, Download, RefreshCw, Server, ArrowRight, Activity, Database, Globe, Wifi } from "lucide-react";

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

const mockServices: ServiceNode[] = [
  { id: "1", name: "API Gateway", type: "gateway", status: "healthy", calls: 12500, avgResponseTime: 45, errorRate: 0.1 },
  { id: "2", name: "User Service", type: "app", status: "healthy", calls: 8900, avgResponseTime: 32, errorRate: 0.2 },
  { id: "3", name: "Order Service", type: "app", status: "warning", calls: 5600, avgResponseTime: 120, errorRate: 1.5 },
  { id: "4", name: "Payment Service", type: "app", status: "healthy", calls: 3200, avgResponseTime: 85, errorRate: 0.3 },
  { id: "5", name: "Inventory Service", type: "app", status: "healthy", calls: 4100, avgResponseTime: 28, errorRate: 0.1 },
  { id: "6", name: "MySQL", type: "database", status: "healthy", calls: 15000, avgResponseTime: 12, errorRate: 0 },
  { id: "7", name: "Redis", type: "cache", status: "healthy", calls: 28000, avgResponseTime: 2, errorRate: 0 },
  { id: "8", name: "Kafka", type: "external", status: "warning", calls: 5200, avgResponseTime: 15, errorRate: 0.8 },
];

const mockCalls: ServiceCall[] = [
  { source: "API Gateway", target: "User Service", calls: 4500, avgTime: 25 },
  { source: "API Gateway", target: "Order Service", calls: 3200, avgTime: 38 },
  { source: "API Gateway", target: "Payment Service", calls: 1800, avgTime: 42 },
  { source: "User Service", target: "MySQL", calls: 8900, avgTime: 8 },
  { source: "User Service", target: "Redis", calls: 12000, avgTime: 1 },
  { source: "Order Service", target: "MySQL", calls: 5600, avgTime: 15 },
  { source: "Order Service", target: "Redis", calls: 7800, avgTime: 2 },
  { source: "Order Service", target: "Inventory Service", calls: 2800, avgTime: 18 },
  { source: "Order Service", target: "Kafka", calls: 3500, avgTime: 12 },
  { source: "Payment Service", target: "MySQL", calls: 3200, avgTime: 10 },
  { source: "Payment Service", target: "Kafka", calls: 1700, avgTime: 8 },
  { source: "Inventory Service", target: "MySQL", calls: 4100, avgTime: 12 },
];

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
  const [selectedService, setSelectedService] = useState<ServiceNode | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredServices = useMemo(() => {
    return mockServices.filter((service) => {
      const matchesType = filterType === "all" || service.type === filterType;
      const matchesStatus = filterStatus === "all" || service.status === filterStatus;
      return matchesType && matchesStatus;
    });
  }, [filterType, filterStatus]);

  const stats = {
    totalCalls: mockCalls.reduce((sum, c) => sum + c.calls, 0),
    avgResponseTime: Math.round(mockServices.reduce((sum, s) => sum + s.avgResponseTime, 0) / mockServices.length),
    totalErrors: mockServices.reduce((sum, s) => sum + (s.calls * s.errorRate / 100), 0),
    healthyServices: mockServices.filter((s) => s.status === "healthy").length,
  };

  const getRelatedCalls = (serviceName: string) => {
    return mockCalls.filter((c) => c.source === serviceName || c.target === serviceName);
  };

  return (
    <MainLayout title="服务依赖">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总调用量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {(stats.totalCalls / 1000).toFixed(1)}K
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Activity size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均响应</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {stats.avgResponseTime}<span className="text-sm font-normal">ms</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Server size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误数/日</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>
                  {Math.round(stats.totalErrors)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <Activity size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康服务</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>
                  {stats.healthyServices}/{mockServices.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Server size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

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
                {mockServices.map((service) => {
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
                  {mockCalls.slice(0, 8).map((call, index) => (
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