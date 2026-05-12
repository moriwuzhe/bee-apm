import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Database, RefreshCw, Download, AlertTriangle, CheckCircle, Activity, TrendingUp, TrendingDown, BarChart3, Clock, Zap, HardDrive, Wifi } from "lucide-react";

interface CacheNode {
  id: string;
  name: string;
  type: "Redis" | "Memcached" | "LocalCache";
  host: string;
  port: number;
  status: "healthy" | "warning" | "critical";
  memory: { used: number; max: number };
  keys: number;
  hits: number;
  misses: number;
  tps: number;
  latency: number;
  connections: number;
  maxConnections: number;
}

interface CacheKey {
  id: string;
  key: string;
  ttl: number;
  size: string;
  type: "string" | "hash" | "list" | "set" | "zset";
  nodeId: string;
}

const mockNodes: CacheNode[] = [
  { id: "1", name: "Redis-主节点", type: "Redis", host: "redis-master.prod", port: 6379, status: "healthy", memory: { used: 2.4, max: 4 }, keys: 156789, hits: 2345678, misses: 12345, tps: 12345, latency: 1.2, connections: 128, maxConnections: 1000 },
  { id: "2", name: "Redis-从节点1", type: "Redis", host: "redis-slave1.prod", port: 6379, status: "healthy", memory: { used: 2.3, max: 4 }, keys: 156789, hits: 893456, misses: 4567, tps: 4567, latency: 1.5, connections: 64, maxConnections: 1000 },
  { id: "3", name: "Redis-从节点2", type: "Redis", host: "redis-slave2.prod", port: 6379, status: "warning", memory: { used: 3.8, max: 4 }, keys: 156789, hits: 765432, misses: 8934, tps: 3890, latency: 2.3, connections: 45, maxConnections: 1000 },
  { id: "4", name: "Memcached-集群", type: "Memcached", host: "memcached.prod", port: 11211, status: "critical", memory: { used: 7.8, max: 8 }, keys: 234567, hits: 1234567, misses: 45678, tps: 8934, latency: 3.5, connections: 256, maxConnections: 500 },
];

const mockKeys: CacheKey[] = [
  { id: "1", key: "user:session:abc123", ttl: 3600, size: "1.2KB", type: "hash", nodeId: "1" },
  { id: "2", key: "product:cache:456", ttl: 7200, size: "4.5KB", type: "string", nodeId: "1" },
  { id: "3", key: "order:summary:789", ttl: 1800, size: "2.1KB", type: "hash", nodeId: "2" },
  { id: "4", key: "config:app:settings", ttl: 86400, size: "8.9KB", type: "string", nodeId: "1" },
  { id: "5", key: "cache:hot:items", ttl: 300, size: "15.3KB", type: "list", nodeId: "1" },
];

export default function CacheMonitor() {
  const [activeTab, setActiveTab] = useState<"nodes" | "keys" | "analytics">("nodes");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const totalMemory = mockNodes.reduce((sum, n) => sum + n.memory.used, 0);
  const totalKeys = mockNodes.reduce((sum, n) => sum + n.keys, 0);
  const totalHits = mockNodes.reduce((sum, n) => sum + n.hits, 0);
  const totalMisses = mockNodes.reduce((sum, n) => sum + n.misses, 0);
  const hitRate = ((totalHits / (totalHits + totalMisses)) * 100).toFixed(2);
  const healthyCount = mockNodes.filter(n => n.status === "healthy").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertTriangle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "critical": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy": return "rgba(0, 214, 143, 0.1)";
      case "warning": return "rgba(250, 173, 20, 0.1)";
      case "critical": return "rgba(255, 77, 79, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#00D68F";
      case "warning": return "#FAAD14";
      case "critical": return "#FF4D4F";
      default: return "#94A3B8";
    }
  };

  return (
    <MainLayout title="缓存监控">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("nodes")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "nodes" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "nodes" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "nodes" ? "white" : "var(--foreground)"
              }}
            >
              缓存节点
            </button>
            <button
              onClick={() => setActiveTab("keys")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "keys" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "keys" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "keys" ? "white" : "var(--foreground)"
              }}
            >
              Key管理
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "analytics" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "analytics" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "analytics" ? "white" : "var(--foreground)"
              }}
            >
              分析报表
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

        {activeTab === "nodes" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康节点</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{healthyCount}/{mockNodes.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <HardDrive className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已用内存</div>
                    <div className="text-2xl font-bold">{totalMemory.toFixed(1)} GB</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                    <Activity className="w-6 h-6" style={{ color: "#52C41A" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>缓存命中率</div>
                    <div className="text-2xl font-bold" style={{ color: "#52C41A" }}>{hitRate}%</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Database className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总Key数</div>
                    <div className="text-2xl font-bold">{totalKeys.toLocaleString()}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 节点列表 */}
            <div className="grid grid-cols-2 gap-4">
              {mockNodes.map((node) => {
                const memoryPercent = (node.memory.used / node.memory.max) * 100;
                const connPercent = (node.connections / node.maxConnections) * 100;
                
                return (
                  <div
                    key={node.id}
                    className="rounded-lg p-4"
                    style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-lg" style={{ background: getStatusBg(node.status) }}>
                          <Database className="w-6 h-6" style={{ color: getStatusColor(node.status) }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{node.name}</h3>
                            {getStatusIcon(node.status)}
                          </div>
                          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                            {node.type} • {node.host}:{node.port}
                          </div>
                        </div>
                      </div>
                      <span
                        className="px-3 py-1 rounded text-xs font-medium"
                        style={{ background: getStatusBg(node.status), color: getStatusColor(node.status) }}
                      >
                        {node.status === "healthy" ? "健康" : node.status === "warning" ? "警告" : "严重"}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 mb-4">
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>Key数</div>
                        <div className="font-bold">{(node.keys / 1000).toFixed(1)}K</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>TPS</div>
                        <div className="font-bold">{node.tps}</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>延迟</div>
                        <div className="font-bold">{node.latency}ms</div>
                      </div>
                      <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>连接数</div>
                        <div className="font-bold">{node.connections}</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: "var(--muted-foreground)" }}>内存使用</span>
                          <span>{node.memory.used} / {node.memory.max} GB</span>
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
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span style={{ color: "var(--muted-foreground)" }}>连接使用</span>
                          <span>{node.connections} / {node.maxConnections}</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${connPercent}%`,
                              background: connPercent > 80 ? "#FF4D4F" : "#00D68F"
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "keys" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Key名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>大小</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>TTL</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>所在节点</th>
                  </tr>
                </thead>
                <tbody>
                  {mockKeys.map((key) => (
                    <tr key={key.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 font-mono text-sm">{key.key}</td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: "rgba(24, 144, 255, 0.1)",
                            color: "#1890FF"
                          }}
                        >
                          {key.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">{key.size}</td>
                      <td className="px-4 py-3">
                        {key.ttl > 3600 ? `${(key.ttl / 3600).toFixed(1)}小时` : 
                         key.ttl > 60 ? `${(key.ttl / 60).toFixed(0)}分钟` : `${key.ttl}秒`}
                      </td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {mockNodes.find(n => n.id === key.nodeId)?.name}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">内存使用趋势</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                折线图显示内存使用趋势
              </div>
            </div>
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">命中率分析</h3>
              <div className="h-64 flex items-center justify-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                柱状图显示命中率变化
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
