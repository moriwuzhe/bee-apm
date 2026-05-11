import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Database, Table, HardDrive, Activity, RefreshCw, Search, Download, MoreHorizontal, AlertTriangle, Settings, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu, Zap, Plus, Filter } from "lucide-react";

interface TableInfo {
  name: string;
  engine: string;
  rows: number;
  dataSize: string;
  indexSize: string;
  createTime: string;
  status: "normal" | "warning" | "error";
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: string;
}

interface TopDatabase {
  name: string;
  type: string;
  size: number;
  connections: number;
  qps: number;
}

interface QueryPerformance {
  query: string;
  executionTime: number;
  executions: number;
}

interface DbStats {
  totalDB: number;
  activeConnections: number;
  avgQueryTime: number;
  slowQueries: number;
}

const mockTables: TableInfo[] = [
  { name: "trace_spans", engine: "InnoDB", rows: 1523847, dataSize: "2.3 GB", indexSize: "856 MB", createTime: "2024-01-01", status: "normal" },
  { name: "agent_instances", engine: "InnoDB", rows: 128, dataSize: "12 MB", indexSize: "4 MB", createTime: "2024-01-01", status: "normal" },
  { name: "alert_records", engine: "InnoDB", rows: 45892, dataSize: "156 MB", indexSize: "48 MB", createTime: "2024-01-01", status: "warning" },
  { name: "metric_data", engine: "InnoDB", rows: 15238476, dataSize: "18.5 GB", indexSize: "6.2 GB", createTime: "2024-01-01", status: "normal" },
  { name: "log_data", engine: "InnoDB", rows: 8945234, dataSize: "45.2 GB", indexSize: "12.8 GB", createTime: "2024-01-01", status: "warning" },
  { name: "user_sessions", engine: "InnoDB", rows: 2341, dataSize: "8 MB", indexSize: "2 MB", createTime: "2024-01-01", status: "normal" },
];

const mockQueryResult: QueryResult = {
  columns: ["id", "trace_id", "app_name", "span_type", "duration", "success", "timestamp"],
  rows: [
    { id: 1, trace_id: "abc123", app_name: "order-service", span_type: "HTTP", duration: 45, success: true, timestamp: "2024-01-15 14:32:15" },
    { id: 2, trace_id: "abc123", app_name: "order-service", span_type: "SQL", duration: 12, success: true, timestamp: "2024-01-15 14:32:15" },
    { id: 3, trace_id: "abc124", app_name: "payment-gateway", span_type: "RPC", duration: 78, success: true, timestamp: "2024-01-15 14:32:16" },
    { id: 4, trace_id: "abc125", app_name: "user-service", span_type: "REDIS", duration: 3, success: false, timestamp: "2024-01-15 14:32:17" },
  ],
  rowCount: 4,
  executionTime: "12ms",
};

const mockDbStats: DbStats = {
  totalDB: 8,
  activeConnections: 156,
  avgQueryTime: 23,
  slowQueries: 12,
};

const mockTopDatabases: TopDatabase[] = [
  { name: "apm_production", type: "MySQL", size: 245.8, connections: 89, qps: 15234 },
  { name: "apm_metrics", type: "ClickHouse", size: 1024.5, connections: 45, qps: 45678 },
  { name: "apm_traces", type: "Elasticsearch", size: 512.3, connections: 67, qps: 34521 },
  { name: "apm_logs", type: "Elasticsearch", size: 768.9, connections: 34, qps: 23456 },
  { name: "apm_cache", type: "Redis", size: 12.4, connections: 123, qps: 98765 },
];

const mockQueryPerformance: QueryPerformance[] = [
  { query: "SELECT * FROM trace_spans WHERE app_name = ?", executionTime: 1234, executions: 45678 },
  { query: "SELECT * FROM metric_data WHERE timestamp > ?", executionTime: 892, executions: 34521 },
  { query: "INSERT INTO alert_records VALUES (?, ?, ?)", executionTime: 45, executions: 12345 },
  { query: "UPDATE user_sessions SET last_login = ?", executionTime: 234, executions: 8765 },
  { query: "DELETE FROM log_data WHERE timestamp < ?", executionTime: 1567, executions: 2345 },
];

export default function DatabaseManagement() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [query, setQuery] = useState("SELECT * FROM trace_spans LIMIT 10");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(mockQueryResult);
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredTables = mockTables.filter((t) =>
    t.name.toLowerCase().includes(searchKeyword.toLowerCase())
  );

  const stats = {
    totalTables: mockTables.length,
    totalSize: "65.8 GB",
    totalRows: mockTables.reduce((sum, t) => sum + t.rows, 0),
    warnings: mockTables.filter((t) => t.status === "warning").length,
  };

  const dbStats = mockDbStats;
  const topDatabases = mockTopDatabases;
  const queryPerformance = mockQueryPerformance;

  const executeQuery = () => {
    setQueryResult(mockQueryResult);
  };

  const handleRefresh = () => {
    console.log("刷新数据");
  };

  const handleExport = () => {
    console.log("导出数据");
  };

  const handleCreateDB = () => {
    console.log("新建数据库");
  };

  const getHealthStatus = () => {
    const healthScore = 87;
    const status = healthScore >= 80 ? "healthy" : healthScore >= 60 ? "warning" : "critical";
    return { score: healthScore, status };
  };

  const healthStatus = getHealthStatus();

  const pageActions = (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCreateDB}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
        style={{ background: "#165DFF", color: "#fff" }}
      >
        <Plus size={16} />
        新建数据库
      </button>
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
        style={{ background: "var(--muted)", color: "var(--foreground)" }}
      >
        <RefreshCw size={16} />
        刷新
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-4 py-2 rounded text-sm font-medium"
        style={{ background: "var(--muted)", color: "var(--foreground)" }}
      >
        <Download size={16} />
        导出
      </button>
    </div>
  );

  return (
    <MainLayout title="数据库管理" actions={pageActions}>
      <div className="space-y-4">
        {/* 数据库统计概览 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据库总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{dbStats.totalDB}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Database size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃连接数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{dbStats.activeConnections}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Wifi size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均查询时间</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{dbStats.avgQueryTime}ms</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Clock size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>慢查询数</div>
                <div className="text-xl font-bold mt-1" style={{ color: dbStats.slowQueries > 10 ? "#FFAA00" : "var(--foreground)" }}>{dbStats.slowQueries}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: dbStats.slowQueries > 10 ? "rgba(255, 170, 0, 0.1)" : "rgba(0, 214, 143, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: dbStats.slowQueries > 10 ? "#FFAA00" : "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* 数据库健康状态 */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-3 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>数据库健康状态</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#00D68F" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FFAA00" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>警告</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ background: "#FF4D4F" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>异常</span>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              {topDatabases.slice(0, 4).map((db, index) => (
                <div key={db.name} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--input)" }}>
                  <div className="flex items-center gap-3">
                    <Server size={16} style={{ color: "var(--muted-foreground)" }} />
                    <div>
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{db.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{db.type}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>QPS</div>
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{(db.qps / 1000).toFixed(1)}K</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>连接</div>
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{db.connections}</div>
                    </div>
                    <div className="w-24 h-2 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min((db.connections / 150) * 100, 100)}%`,
                          background: db.connections > 100 ? "#FFAA00" : "#00D68F"
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 健康分数 */}
          <div className="rounded-lg p-4 flex flex-col items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="relative w-32 h-32">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke="var(--border)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="56"
                  stroke={healthStatus.status === "healthy" ? "#00D68F" : healthStatus.status === "warning" ? "#FFAA00" : "#FF4D4F"}
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${(healthStatus.score / 100) * 352} 352`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: "var(--foreground)" }}>{healthStatus.score}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康分</span>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm font-medium" style={{ color: healthStatus.status === "healthy" ? "#00D68F" : healthStatus.status === "warning" ? "#FFAA00" : "#FF4D4F" }}>
                {healthStatus.status === "healthy" ? "运行良好" : healthStatus.status === "warning" ? "需要注意" : "需要关注"}
              </div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                上次检查: 2分钟前
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 表列表 */}
          <div className="lg:col-span-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>数据表</span>
                <button className="p-1 rounded hover:bg-input">
                  <RefreshCw size={14} style={{ color: "var(--muted-foreground)" }} />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="搜索表名..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded text-sm"
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {filteredTables.map((table) => (
                <div
                  key={table.name}
                  className={`p-3 cursor-pointer transition-colors ${selectedTable === table.name ? "" : "hover:bg-input"}`}
                  style={{ background: selectedTable === table.name ? "var(--accent)" : "transparent" }}
                  onClick={() => setSelectedTable(table.name)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Table size={14} style={{ color: "var(--muted-foreground)" }} />
                      <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{table.name}</span>
                    </div>
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ background: table.status === "normal" ? "#00D68F" : table.status === "warning" ? "#FFAA00" : "#FF4D4F" }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>{table.rows.toLocaleString()} 行</span>
                    <span>{table.dataSize}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SQL查询 */}
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>SQL 查询</span>
                <div className="flex items-center gap-2">
                  <button className="px-3 py-1.5 rounded text-xs font-medium" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    格式化
                  </button>
                  <button
                    onClick={executeQuery}
                    className="px-3 py-1.5 rounded text-xs font-medium"
                    style={{ background: "#165DFF", color: "#fff" }}
                  >
                    执行 (F8)
                  </button>
                </div>
              </div>
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full h-32 p-3 rounded-lg text-sm font-mono resize-none"
                style={{ background: "#0B1120", border: "1px solid var(--border)", color: "#94A3B8" }}
              />
            </div>

            {/* 查询结果 */}
            {queryResult && (
              <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>查询结果</span>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {queryResult.rowCount} 行 | 执行时间: {queryResult.executionTime}
                    </span>
                  </div>
                  <button className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                    <Download size={12} />
                    导出
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: "var(--input)" }}>
                        {queryResult.columns.map((col) => (
                          <th key={col} className="px-4 py-2 text-left font-medium" style={{ color: "var(--foreground)" }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                      {queryResult.rows.map((row, index) => (
                        <tr key={index} className="hover:bg-input">
                          {queryResult.columns.map((col) => (
                            <td key={col} className="px-4 py-2" style={{ color: "var(--muted-foreground)" }}>
                              {String(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TOP 数据库表格 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>TOP 数据库</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <Filter size={12} />
                筛选
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                <Download size={12} />
                导出
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--input)" }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--foreground)" }}>数据库名称</th>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--foreground)" }}>类型</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--foreground)" }}>数据大小</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--foreground)" }}>连接数</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--foreground)" }}>QPS</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: "var(--foreground)" }}>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {topDatabases.map((db) => (
                  <tr key={db.name} className="hover:bg-input">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Database size={16} style={{ color: "var(--muted-foreground)" }} />
                        <span className="font-medium" style={{ color: "var(--foreground)" }}>{db.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>{db.type}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--muted-foreground)" }}>{db.size} GB</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--muted-foreground)" }}>{db.connections}</td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--foreground)" }}>{(db.qps / 1000).toFixed(1)}K</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 rounded hover:bg-muted" style={{ color: "var(--muted-foreground)" }}>
                        <Settings size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 慢查询列表 */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} style={{ color: "#FFAA00" }} />
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>慢查询列表</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "rgba(255, 170, 0, 0.1)", color: "#FFAA00" }}>
                {queryPerformance.length} 条
              </span>
            </div>
            <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
              <Settings size={12} />
              配置阈值
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: "var(--input)" }}>
                  <th className="px-4 py-3 text-left font-medium" style={{ color: "var(--foreground)" }}>SQL 语句</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--foreground)" }}>执行时间</th>
                  <th className="px-4 py-3 text-right font-medium" style={{ color: "var(--foreground)" }}>执行次数</th>
                  <th className="px-4 py-3 text-center font-medium" style={{ color: "var(--foreground)" }}>操作</th>
                </tr>
              </thead>
              <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                {queryPerformance.map((qp, index) => (
                  <tr key={index} className="hover:bg-input">
                    <td className="px-4 py-3">
                      <code className="text-xs px-2 py-1 rounded" style={{ background: "var(--input)", color: "var(--foreground)" }}>
                        {qp.query.length > 60 ? qp.query.substring(0, 60) + "..." : qp.query}
                      </code>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="px-2 py-1 rounded text-xs font-medium" style={{ background: qp.executionTime > 1000 ? "rgba(255, 170, 0, 0.1)" : "rgba(0, 214, 143, 0.1)", color: qp.executionTime > 1000 ? "#FFAA00" : "#00D68F" }}>
                        {qp.executionTime}ms
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right" style={{ color: "var(--muted-foreground)" }}>{qp.executions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="px-2 py-1 rounded text-xs" style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}>
                        分析
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 表详情 */}
        {selectedTable && (
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Table size={16} style={{ color: "#165DFF" }} />
                <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{selectedTable} 表结构</span>
              </div>
              <button className="p-1 rounded hover:bg-input">
                <MoreHorizontal size={16} style={{ color: "var(--muted-foreground)" }} />
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "存储引擎", value: "InnoDB" },
                { label: "字符集", value: "utf8mb4" },
                { label: "自增主键", value: "id" },
                { label: "创建时间", value: "2024-01-01" },
              ].map((item) => (
                <div key={item.label} className="p-3 rounded-lg" style={{ background: "var(--input)" }}>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{item.label}</div>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
