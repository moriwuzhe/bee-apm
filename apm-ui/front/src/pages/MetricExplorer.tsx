import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Activity, Search, Filter, Download, Plus, TrendingUp, TrendingDown, BarChart3, LineChart, PieChart, Maximize2, Settings, Clock } from "lucide-react";

interface Metric {
  id: string;
  name: string;
  category: string;
  unit: string;
  description: string;
  tags: string[];
  dataPoints: number;
  lastUpdated: string;
}

const mockMetrics: Metric[] = [
  { id: "1", name: "cpu_usage", category: "系统", unit: "%", description: "CPU使用率", tags: ["系统", "性能"], dataPoints: 15234, lastUpdated: "2024-01-15 14:35:00" },
  { id: "2", name: "memory_usage", category: "系统", unit: "%", description: "内存使用率", tags: ["系统", "性能"], dataPoints: 15234, lastUpdated: "2024-01-15 14:35:00" },
  { id: "3", name: "disk_io", category: "存储", unit: "MB/s", description: "磁盘IO", tags: ["存储", "性能"], dataPoints: 12345, lastUpdated: "2024-01-15 14:34:00" },
  { id: "4", name: "network_in", category: "网络", unit: "Mbps", description: "网络入口流量", tags: ["网络", "流量"], dataPoints: 14567, lastUpdated: "2024-01-15 14:35:00" },
  { id: "5", name: "network_out", category: "网络", unit: "Mbps", description: "网络出口流量", tags: ["网络", "流量"], dataPoints: 14567, lastUpdated: "2024-01-15 14:35:00" },
  { id: "6", name: "request_count", category: "应用", unit: "req/s", description: "请求数", tags: ["应用", "流量"], dataPoints: 18923, lastUpdated: "2024-01-15 14:35:00" },
  { id: "7", name: "error_rate", category: "应用", unit: "%", description: "错误率", tags: ["应用", "质量"], dataPoints: 18923, lastUpdated: "2024-01-15 14:35:00" },
  { id: "8", name: "response_time_p50", category: "应用", unit: "ms", description: "响应时间P50", tags: ["应用", "性能"], dataPoints: 18923, lastUpdated: "2024-01-15 14:35:00" },
  { id: "9", name: "response_time_p95", category: "应用", unit: "ms", description: "响应时间P95", tags: ["应用", "性能"], dataPoints: 18923, lastUpdated: "2024-01-15 14:35:00" },
  { id: "10", name: "response_time_p99", category: "应用", unit: "ms", description: "响应时间P99", tags: ["应用", "性能"], dataPoints: 18923, lastUpdated: "2024-01-15 14:35:00" },
  { id: "11", name: "gc_count", category: "JVM", unit: "次/s", description: "GC次数", tags: ["JVM", "内存"], dataPoints: 8734, lastUpdated: "2024-01-15 14:34:00" },
  { id: "12", name: "gc_time", category: "JVM", unit: "ms", description: "GC时间", tags: ["JVM", "内存"], dataPoints: 8734, lastUpdated: "2024-01-15 14:34:00" },
  { id: "13", name: "thread_count", category: "JVM", unit: "个", description: "线程数", tags: ["JVM", "线程"], dataPoints: 8734, lastUpdated: "2024-01-15 14:34:00" },
  { id: "14", name: "db_query_time", category: "数据库", unit: "ms", description: "数据库查询时间", tags: ["数据库", "性能"], dataPoints: 6543, lastUpdated: "2024-01-15 14:33:00" },
  { id: "15", name: "db_connection", category: "数据库", unit: "个", description: "数据库连接数", tags: ["数据库", "连接"], dataPoints: 6543, lastUpdated: "2024-01-15 14:33:00" },
];

const categories = ["全部", "系统", "存储", "网络", "应用", "JVM", "数据库"];

export default function MetricExplorer() {
  const [activeTab, setActiveTab] = useState<"metrics" | "dashboard" | "alerts">("metrics");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["1", "2", "6"]);
  const [timeRange, setTimeRange] = useState("1h");
  const [chartType, setChartType] = useState<"line" | "bar" | "area">("line");

  const filteredMetrics = mockMetrics.filter(metric => {
    const matchesSearch = searchQuery === "" || 
      metric.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      metric.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || metric.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleMetric = (id: string) => {
    if (selectedMetrics.includes(id)) {
      setSelectedMetrics(selectedMetrics.filter(m => m !== id));
    } else {
      setSelectedMetrics([...selectedMetrics, id]);
    }
  };

  const totalDataPoints = mockMetrics.reduce((sum, m) => sum + m.dataPoints, 0);
  const avgDataPoints = Math.round(totalDataPoints / mockMetrics.length);

  return (
    <MainLayout title="指标探索器">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("metrics")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "metrics" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "metrics" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "metrics" ? "white" : "var(--foreground)"
              }}
            >
              指标库
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "dashboard" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "dashboard" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "dashboard" ? "white" : "var(--foreground)"
              }}
            >
              自定义仪表盘
            </button>
            <button
              onClick={() => setActiveTab("alerts")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "alerts" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "alerts" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "alerts" ? "white" : "var(--foreground)"
              }}
            >
              指标告警
            </button>
          </div>
          <div className="flex gap-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 rounded-lg"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <option value="5m">最近5分钟</option>
              <option value="15m">最近15分钟</option>
              <option value="1h">最近1小时</option>
              <option value="6h">最近6小时</option>
              <option value="24h">最近24小时</option>
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
            </select>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <Download className="w-4 h-4" />
              导出
            </button>
          </div>
        </div>

        {activeTab === "metrics" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <Activity className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>指标总数</div>
                    <div className="text-2xl font-bold">{mockMetrics.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <BarChart3 className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据点数</div>
                    <div className="text-2xl font-bold">{avgDataPoints.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <TrendingUp className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已选指标</div>
                    <div className="text-2xl font-bold">{selectedMetrics.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(82, 196, 26, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#52C41A" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>更新时间</div>
                    <div className="text-sm font-medium">实时</div>
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
                  placeholder="搜索指标名称或描述..."
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
              <div className="flex gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                      selectedCategory === cat ? "text-white" : ""
                    }`}
                    style={{
                      background: selectedCategory === cat ? "var(--primary)" : "transparent",
                      color: selectedCategory === cat ? "white" : "var(--foreground)"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 指标网格 */}
            <div className="grid grid-cols-3 gap-4">
              {filteredMetrics.map((metric) => {
                const isSelected = selectedMetrics.includes(metric.id);
                return (
                  <div
                    key={metric.id}
                    onClick={() => toggleMetric(metric.id)}
                    className="rounded-lg p-4 cursor-pointer transition-all"
                    style={{
                      background: "var(--card)",
                      border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                      boxShadow: isSelected ? "0 0 0 3px rgba(var(--primary-rgb), 0.1)" : "none"
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Activity className="w-5 h-5" style={{ color: "var(--primary)" }} />
                        <div>
                          <div className="font-medium text-sm">{metric.name}</div>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {metric.description}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "var(--primary)" }}>
                          <TrendingUp className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="px-2 py-0.5 rounded" style={{ background: "var(--muted)" }}>
                        {metric.category}
                      </span>
                      <span>{metric.unit}</span>
                      <span>{metric.dataPoints.toLocaleString()} 点</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "dashboard" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">自定义仪表盘</h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                创建自定义仪表盘，将多个指标组合在一起进行可视化分析
              </p>
              <button
                className="px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: "var(--primary)" }}
              >
                创建仪表盘
              </button>
            </div>
          </div>
        )}

        {activeTab === "alerts" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">指标告警规则</h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                为指标设置告警规则，当指标超过阈值时自动触发告警
              </p>
              <button
                className="px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: "var(--primary)" }}
              >
                创建告警规则
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
