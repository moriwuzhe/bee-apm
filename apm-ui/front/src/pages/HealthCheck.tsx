import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Heart, Activity, Clock, Server, Database, AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from "lucide-react";

interface ServiceStatus {
  id: string;
  name: string;
  type: "backend" | "database" | "redis" | "agent";
  status: "online" | "offline" | "warning";
  responseTime: number;
  lastChecked: string;
  version?: string;
  host?: string;
}

const mockServices: ServiceStatus[] = [
  { id: "1", name: "APM Backend", type: "backend", status: "online", responseTime: 12, lastChecked: "刚刚", version: "v2.4.1", host: "localhost:8081" },
  { id: "2", name: "MySQL Database", type: "database", status: "online", responseTime: 8, lastChecked: "刚刚", version: "8.0.33", host: "localhost:3306" },
  { id: "3", name: "Redis Cache", type: "redis", status: "online", responseTime: 2, lastChecked: "刚刚", version: "7.0.11", host: "localhost:6379" },
  { id: "4", name: "Agent Service", type: "agent", status: "online", responseTime: 15, lastChecked: "刚刚", version: "v1.2.0", host: "localhost:9999" },
  { id: "5", name: "Prometheus", type: "backend", status: "warning", responseTime: 156, lastChecked: "5秒前", version: "v2.45.0", host: "localhost:9090" },
  { id: "6", name: "Grafana", type: "backend", status: "offline", responseTime: 0, lastChecked: "1分钟前", version: "v10.1.0", host: "localhost:3000" },
];

const statusConfig = {
  online: { color: "#00D68F", bgColor: "rgba(0, 214, 143, 0.1)", label: "正常" },
  offline: { color: "#FF4D4F", bgColor: "rgba(255, 77, 79, 0.1)", label: "离线" },
  warning: { color: "#FFAA00", bgColor: "rgba(255, 170, 0, 0.1)", label: "警告" },
};

const typeConfig = {
  backend: { icon: Server, label: "后端服务" },
  database: { icon: Database, label: "数据库" },
  redis: { icon: Activity, label: "缓存" },
  agent: { icon: Heart, label: "Agent" },
};

export default function HealthCheck() {
  const [services, setServices] = useState<ServiceStatus[]>(mockServices);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setServices(prev => prev.map(service => ({
      ...service,
      responseTime: service.status === "offline" ? 0 : Math.floor(Math.random() * 100) + 5,
      lastChecked: "刚刚",
    })));
    setIsRefreshing(false);
  };

  useEffect(() => {
    const interval = setInterval(refreshStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const stats = {
    total: services.length,
    online: services.filter(s => s.status === "online").length,
    warning: services.filter(s => s.status === "warning").length,
    offline: services.filter(s => s.status === "offline").length,
  };

  const avgResponseTime = services
    .filter(s => s.status !== "offline")
    .reduce((sum, s) => sum + s.responseTime, 0) / (services.filter(s => s.status !== "offline").length || 1);

  return (
    <MainLayout title="健康检查">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>服务总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.total}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Server size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>正常运行</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{stats.online}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告状态</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FFAA00" }}>{stats.warning}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertCircle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>离线服务</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FF4D4F" }}>{stats.offline}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <WifiOff size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 平均响应时间 */}
        <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Clock size={24} style={{ color: "#165DFF" }} />
              </div>
              <div>
                <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>平均响应时间</div>
                <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>
                  {avgResponseTime.toFixed(1)} <span className="text-sm font-normal" style={{ color: "var(--muted-foreground)" }}>ms</span>
                </div>
              </div>
            </div>
            <button
              onClick={refreshStatus}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
              disabled={isRefreshing}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              {isRefreshing ? "刷新中..." : "刷新状态"}
            </button>
          </div>
        </div>

        {/* 服务列表 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>服务状态列表</span>
          </div>
          <div className="divide-y" style={{ borderColor: "var(--border)" }}>
            {services.map((service) => {
              const StatusIcon = service.status === "online" ? CheckCircle : service.status === "warning" ? AlertCircle : WifiOff;
              const TypeIcon = typeConfig[service.type].icon;
              const config = statusConfig[service.status];
              
              return (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 hover:bg-input transition-colors"
                  style={{ background: service.status !== "online" ? config.bgColor : "transparent" }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${config.color}15` }}
                    >
                      <TypeIcon size={18} style={{ color: config.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {service.name}
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ background: config.bgColor, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span>{service.host}</span>
                        <span>|</span>
                        <span>v{service.version}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    {service.status !== "offline" && (
                      <div className="text-center">
                        <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                          {service.responseTime}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>ms</div>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <StatusIcon size={16} style={{ color: config.color }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {service.lastChecked}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 最近检查记录 */}
        <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} style={{ color: "var(--muted-foreground)" }} />
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>最近检查记录</span>
          </div>
          <div className="space-y-2">
            {[
              { time: "14:32:15", service: "MySQL Database", status: "online", latency: "8ms" },
              { time: "14:32:14", service: "APM Backend", status: "online", latency: "12ms" },
              { time: "14:32:13", service: "Redis Cache", status: "online", latency: "2ms" },
              { time: "14:32:12", service: "Grafana", status: "offline", latency: "-" },
              { time: "14:32:11", service: "Prometheus", status: "warning", latency: "156ms" },
            ].map((log, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-xs py-2 px-3 rounded-lg"
                style={{ background: "var(--input)" }}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: "var(--muted-foreground)" }}>{log.time}</span>
                  <span style={{ color: "var(--foreground)" }}>{log.service}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span style={{ color: "var(--muted-foreground)" }}>{log.latency}</span>
                  <span
                    className="px-2 py-0.5 rounded"
                    style={{
                      background: log.status === "online" ? "rgba(0, 214, 143, 0.1)" : 
                                  log.status === "warning" ? "rgba(255, 170, 0, 0.1)" : "rgba(255, 77, 79, 0.1)",
                      color: log.status === "online" ? "#00D68F" : 
                             log.status === "warning" ? "#FFAA00" : "#FF4D4F",
                    }}
                  >
                    {log.status === "online" ? "正常" : log.status === "warning" ? "警告" : "离线"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}