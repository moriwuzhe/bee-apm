import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Container, RefreshCw, Download, AlertTriangle, CheckCircle, Activity, TrendingUp, TrendingDown, BarChart3, Clock, Zap, HardDrive, Cpu, Wifi, Server } from "lucide-react";

interface ContainerInfo {
  id: string;
  name: string;
  image: string;
  status: "running" | "pending" | "stopped" | "error";
  node: string;
  cpu: number;
  memory: { used: number; max: number };
  network: number;
  restartCount: number;
  uptime: string;
  pods: number;
  replicas: number;
}

interface Pod {
  id: string;
  name: string;
  containerId: string;
  status: "running" | "pending" | "crashloopbackoff" | "terminating";
  cpu: number;
  memory: number;
  node: string;
  restartCount: number;
}

const mockContainers: ContainerInfo[] = [
  { id: "1", name: "order-service", image: "registry.prod/order:v2.3.1", status: "running", node: "node-1.prod", cpu: 45, memory: { used: 256, max: 512 }, network: 1234, restartCount: 0, uptime: "2d 5h 30m", pods: 8, replicas: 8 },
  { id: "2", name: "payment-service", image: "registry.prod/payment:v1.8.0", status: "running", node: "node-2.prod", cpu: 67, memory: { used: 384, max: 512 }, network: 893, restartCount: 2, uptime: "1d 12h 15m", pods: 6, replicas: 6 },
  { id: "3", name: "user-service", image: "registry.prod/user:v3.1.0", status: "running", node: "node-1.prod", cpu: 32, memory: { used: 192, max: 256 }, network: 2345, restartCount: 0, uptime: "3d 8h 45m", pods: 10, replicas: 10 },
  { id: "4", name: "product-service", image: "registry.prod/product:v2.0.5", status: "error", node: "node-3.prod", cpu: 95, memory: { used: 500, max: 512 }, network: 456, restartCount: 5, uptime: "15m", pods: 4, replicas: 6 },
];

const mockPods: Pod[] = [
  { id: "1", name: "order-service-abc123", containerId: "1", status: "running", cpu: 42, memory: 245, node: "node-1.prod", restartCount: 0 },
  { id: "2", name: "order-service-def456", containerId: "1", status: "running", cpu: 48, memory: 267, node: "node-2.prod", restartCount: 0 },
  { id: "3", name: "payment-service-ghi789", containerId: "2", status: "running", cpu: 65, memory: 378, node: "node-2.prod", restartCount: 1 },
  { id: "4", name: "payment-service-jkl012", containerId: "2", status: "crashloopbackoff", cpu: 0, memory: 0, node: "node-3.prod", restartCount: 5 },
  { id: "5", name: "user-service-mno345", containerId: "3", status: "running", cpu: 30, memory: 189, node: "node-1.prod", restartCount: 0 },
  { id: "6", name: "product-service-pqr678", containerId: "4", status: "terminating", cpu: 98, memory: 498, node: "node-3.prod", restartCount: 3 },
];

export default function ContainerMonitor() {
  const [activeTab, setActiveTab] = useState<"containers" | "pods" | "nodes">("containers");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const totalCpu = (mockContainers.reduce((sum, c) => sum + c.cpu, 0) / mockContainers.length).toFixed(0);
  const totalMemory = mockContainers.reduce((sum, c) => sum + c.memory.used, 0);
  const runningCount = mockContainers.filter(c => c.status === "running").length;
  const totalPods = mockPods.length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "pending": return <Clock className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "stopped": return <Activity className="w-5 h-5" style={{ color: "#94A3B8" }} />;
      case "error": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      case "crashloopbackoff": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      case "terminating": return <Activity className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "running": return "rgba(0, 214, 143, 0.1)";
      case "pending": return "rgba(250, 173, 20, 0.1)";
      case "stopped": return "rgba(148, 163, 184, 0.1)";
      case "error": return "rgba(255, 77, 79, 0.1)";
      case "crashloopbackoff": return "rgba(255, 77, 79, 0.1)";
      case "terminating": return "rgba(250, 173, 20, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return "#00D68F";
      case "pending": return "#FAAD14";
      case "stopped": return "#94A3B8";
      case "error": return "#FF4D4F";
      case "crashloopbackoff": return "#FF4D4F";
      case "terminating": return "#FAAD14";
      default: return "#94A3B8";
    }
  };

  return (
    <MainLayout title="容器监控">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("containers")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "containers" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "containers" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "containers" ? "white" : "var(--foreground)"
              }}
            >
              容器列表
            </button>
            <button
              onClick={() => setActiveTab("pods")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "pods" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "pods" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "pods" ? "white" : "var(--foreground)"
              }}
            >
              Pod管理
            </button>
            <button
              onClick={() => setActiveTab("nodes")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "nodes" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "nodes" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "nodes" ? "white" : "var(--foreground)"
              }}
            >
              节点监控
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
              {autoRefresh ? "自动刷新" : "已暂停"}
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
              导出报告
            </button>
          </div>
        </div>

        {activeTab === "containers" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <Container className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>运行中容器</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{runningCount}/{mockContainers.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <Cpu className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均CPU</div>
                    <div className="text-2xl font-bold">{totalCpu}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <HardDrive className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已用内存</div>
                    <div className="text-2xl font-bold">{totalMemory} MB</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                    <Server className="w-6 h-6" style={{ color: "#52C41A" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总Pod数</div>
                    <div className="text-2xl font-bold">{totalPods}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 容器列表 */}
            <div className="grid grid-cols-2 gap-4">
              {mockContainers.map((container) => {
                const memoryPercent = (container.memory.used / container.memory.max) * 100;
                
                return (
                  <div
                    key={container.id}
                    className="rounded-lg p-4"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg" style={{ background: getStatusBg(container.status) }}>
                          <Container className="w-6 h-6" style={{ color: getStatusColor(container.status) }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{container.name}</h3>
                            {getStatusIcon(container.status)}
                          </div>
                          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            {container.image.split("/").pop()}
                          </div>
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ background: getStatusBg(container.status), color: getStatusColor(container.status) }}
                      >
                        {container.status === "running" ? "运行中" : 
                         container.status === "pending" ? "等待中" : 
                         container.status === "stopped" ? "已停止" : "错误"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>CPU</div>
                        <div className="font-bold">{container.cpu}%</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>内存</div>
                        <div className="font-bold">{container.memory.used}MB</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Pod数</div>
                        <div className="font-bold">{container.pods}/{container.replicas}</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>重启</div>
                        <div className="font-bold">{container.restartCount}</div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: "var(--muted-foreground)" }}>内存使用</span>
                          <span>{container.memory.used} / {container.memory.max} MB</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${memoryPercent}%`,
                              background: memoryPercent > 90 ? "#FF4D4F" : memoryPercent > 70 ? "#FAAD14" : "#00D68F"
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>运行时间</span>
                        <span className="font-medium">{container.uptime}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "pods" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Pod名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>所属容器</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>节点</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>CPU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>内存</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>重启次数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {mockPods.map((pod) => (
                    <tr key={pod.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 font-medium">{pod.name}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {mockContainers.find(c => c.id === pod.containerId)?.name}
                      </td>
                      <td className="px-4 py-3">{pod.node}</td>
                      <td className="px-4 py-3">{pod.cpu}%</td>
                      <td className="px-4 py-3">{pod.memory} MB</td>
                      <td className="px-4 py-3">
                        {pod.restartCount > 0 ? <span className="text-red-500">{pod.restartCount}</span> : pod.restartCount}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: getStatusBg(pod.status),
                            color: getStatusColor(pod.status)
                          }}
                        >
                          {pod.status === "running" ? "运行中" : 
                           pod.status === "pending" ? "等待中" : 
                           pod.status === "crashloopbackoff" ? "崩溃循环" : "终止中"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "nodes" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Server className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">节点监控</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                查看和管理Kubernetes节点状态
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
