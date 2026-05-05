import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Database, Table, HardDrive, Activity, RefreshCw, Search, Download, MoreHorizontal } from "lucide-react";

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

  const executeQuery = () => {
    setQueryResult(mockQueryResult);
  };

  return (
    <MainLayout title="数据库管理">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据表数量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.totalTables}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Table size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总数据量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{stats.totalSize}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <HardDrive size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总记录数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{(stats.totalRows / 1000000).toFixed(1)}M</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Database size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>告警表</div>
                <div className="text-xl font-bold mt-1" style={{ color: stats.warnings > 0 ? "#FFAA00" : "var(--foreground)" }}>{stats.warnings}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: stats.warnings > 0 ? "rgba(255, 170, 0, 0.1)" : "rgba(0, 214, 143, 0.1)" }}>
                <Activity size={20} style={{ color: stats.warnings > 0 ? "#FFAA00" : "#00D68F" }} />
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