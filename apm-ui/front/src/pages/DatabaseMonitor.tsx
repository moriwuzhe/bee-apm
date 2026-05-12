import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Database, Server, AlertCircle, CheckCircle, Clock, Download, Search, RefreshCw, HardDrive, Zap, Activity } from "lucide-react";

interface DatabaseInstance {
  id: string;
  name: string;
  type: "MySQL" | "PostgreSQL" | "MongoDB" | "Redis" | "Elasticsearch" | "Oracle";
  host: string;
  port: number;
  status: "healthy" | "warning" | "critical" | "offline";
  connections: {
    current: number;
    max: number;
  };
  performance: {
    qps: number;
    latency: number;
    throughput: number;
  };
  storage: {
    used: number;
    total: number;
  };
  slowQueries: number;
  lastBackup?: string;
  uptime: string;
}

const mockDatabases: DatabaseInstance[] = [
  {
    id: "1",
    name: "生产主库",
    type: "MySQL",
    host: "mysql-master.prod.internal",
    port: 3306,
    status: "healthy",
    connections: { current: 156, max: 500 },
    performance: { qps: 2456, latency: 2.3, throughput: 125.4 },
    storage: { used: 452, total: 500 },
    slowQueries: 3,
    lastBackup: "2024-01-15 02:00:00",
    uptime: "45天12小时"
  },
  {
    id: "2",
    name: "生产从库",
    type: "MySQL",
    host: "mysql-slave.prod.internal",
    port: 3306,
    status: "healthy",
    connections: { current: 89, max: 500 },
    performance: { qps: 1234, latency: 1.8, throughput: 67.8 },
    storage: { used: 445, total: 500 },
    slowQueries: 1,
    lastBackup: "2024-01-15 02:00:00",
    uptime: "45天12小时"
  },
  {
    id: "3",
    name: "缓存集群",
    type: "Redis",
    host: "redis-cluster.prod.internal",
    port: 6379,
    status: "warning",
    connections: { current: 234, max: 300 },
    performance: { qps: 15678, latency: 0.5, throughput: 0 },
    storage: { used: 8.5, total: 16 },
    slowQueries: 0,
    lastBackup: "N/A",
    uptime: "30天5小时"
  },
  {
    id: "4",
    name: "分析数据库",
    type: "PostgreSQL",
    host: "pg-analytics.prod.internal",
    port: 5432,
    status: "healthy",
    connections: { current: 45, max: 200 },
    performance: { qps: 567, latency: 5.2, throughput: 34.5 },
    storage: { used: 1.2, total: 2 },
    slowQueries: 8,
    lastBackup: "2024-01-15 03:00:00",
    uptime: "20天8小时"
  },
  {
    id: "5",
    name: "搜索引擎",
    type: "Elasticsearch",
    host: "es-cluster.prod.internal",
    port: 9200,
    status: "critical",
    connections: { current: 89, max: 100 },
    performance: { qps: 2345, latency: 45.6, throughput: 89.3 },
    storage: { used: 892, total: 1000 },
    slowQueries: 156,
    lastBackup: "2024-01-14 04:00:00",
    uptime: "12天2小时"
  },
  {
    id: "6",
    name: "文档存储",
    type: "MongoDB",
    host: "mongo.prod.internal",
    port: 27017,
    status: "healthy",
    connections: { current: 78, max: 300 },
    performance: { qps: 1234, latency: 3.4, throughput: 45.6 },
    storage: { used: 234, total: 500 },
    slowQueries: 2,
    lastBackup: "2024-01-15 01:00:00",
    uptime: "60天15小时"
  }
];

export default function DatabaseMonitor() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const filteredDatabases = mockDatabases.filter(db => {
    const matchesSearch = searchQuery === "" || 
      db.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      db.host.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || db.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const healthyCount = mockDatabases.filter(db => db.status === "healthy").length;
  const warningCount = mockDatabases.filter(db => db.status === "warning").length;
  const criticalCount = mockDatabases.filter(db => db.status === "critical").length;
  const totalQPS = mockDatabases.reduce((sum, db) => sum + db.performance.qps, 0);
  const totalConnections = mockDatabases.reduce((sum, db) => sum + db.connections.current, 0);
  const totalStorage = mockDatabases.reduce((sum, db) => sum + db.storage.used, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertCircle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "critical": return <AlertCircle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      case "offline": return <AlertCircle className="w-5 h-5" style={{ color: "#94A3B8" }} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "healthy": return "健康";
      case "warning": return "警告";
      case "critical": return "严重";
      case "offline": return "离线";
      default: return status;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "healthy": return "rgba(0, 214, 143, 0.1)";
      case "warning": return "rgba(250, 173, 20, 0.1)";
      case "critical": return "rgba(255, 77, 79, 0.1)";
      case "offline": return "rgba(148, 163, 184, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  return (
    <MainLayout title="数据库监控">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">数据库健康状态</h2>
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

        {/* 统计卡片 */}
        <div className="grid grid-cols-6 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康</div>
                <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{healthyCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                <AlertCircle className="w-6 h-6" style={{ color: "#FAAD14" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告</div>
                <div className="text-2xl font-bold" style={{ color: "#FAAD14" }}>{warningCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertCircle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>严重</div>
                <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{criticalCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                <Zap className="w-6 h-6" style={{ color: "#1890FF" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总QPS</div>
                <div className="text-2xl font-bold">{totalQPS.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                <Server className="w-6 h-6" style={{ color: "#52C41A" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>连接数</div>
                <div className="text-2xl font-bold">{totalConnections}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                <HardDrive className="w-6 h-6" style={{ color: "#FAAD14" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>存储使用</div>
                <div className="text-2xl font-bold">{totalStorage.toFixed(1)}GB</div>
              </div>
            </div>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
            <input
              type="text"
              placeholder="搜索数据库名称或主机..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg"
              style={{
                background: "var(--background)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 rounded-lg"
            style={{
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)"
            }}
          >
            <option value="all">全部状态</option>
            <option value="healthy">健康</option>
            <option value="warning">警告</option>
            <option value="critical">严重</option>
            <option value="offline">离线</option>
          </select>
        </div>

        {/* 数据库列表 */}
        <div className="grid grid-cols-2 gap-4">
          {filteredDatabases.map((db) => (
            <div
              key={db.id}
              className="rounded-lg p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: getStatusBgColor(db.status) }}>
                    <Database className="w-6 h-6" style={{ color: db.status === "healthy" ? "#00D68F" : db.status === "warning" ? "#FAAD14" : "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{db.name}</h3>
                      {getStatusIcon(db.status)}
                    </div>
                    <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                      {db.type} • {db.host}:{db.port}
                    </div>
                  </div>
                </div>
                <span
                  className="px-3 py-1 rounded text-xs font-medium"
                  style={{ background: getStatusBgColor(db.status), color: db.status === "healthy" ? "#00D68F" : db.status === "warning" ? "#FAAD14" : "#FF4D4F" }}
                >
                  {getStatusLabel(db.status)}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>QPS</div>
                  <div className="text-lg font-bold">{db.performance.qps.toLocaleString()}</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>延迟</div>
                  <div className="text-lg font-bold">{db.performance.latency}ms</div>
                </div>
                <div className="text-center p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>慢查询</div>
                  <div className="text-lg font-bold" style={{ color: db.slowQueries > 10 ? "#FF4D4F" : "inherit" }}>
                    {db.slowQueries}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--muted-foreground)" }}>连接数</span>
                    <span>{db.connections.current} / {db.connections.max}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(db.connections.current / db.connections.max) * 100}%`,
                        background: (db.connections.current / db.connections.max) > 0.8 ? "#FF4D4F" : "#00D68F"
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--muted-foreground)" }}>存储空间</span>
                    <span>{db.storage.used}GB / {db.storage.total}GB</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(db.storage.used / db.storage.total) * 100}%`,
                        background: (db.storage.used / db.storage.total) > 0.8 ? "#FF4D4F" : "#00D68F"
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <Clock className="w-3 h-3 inline mr-1" />
                  运行时间: {db.uptime}
                </div>
                {db.lastBackup && (
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    上次备份: {db.lastBackup}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MainLayout>
  );
}
