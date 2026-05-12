import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { DollarSign, TrendingUp, TrendingDown, PieChart, BarChart3, Download, Filter, Calendar, Server, Cloud, Database, Activity } from "lucide-react";

interface CostItem {
  id: string;
  category: string;
  service: string;
  resource: string;
  cost: number;
  change: number;
  trend: "up" | "down" | "stable";
  budget: number;
  usage: number;
}

const mockCostItems: CostItem[] = [
  { id: "1", category: "计算", service: "order-service", resource: "EC2 t3.large x 4", cost: 456.78, change: 12.5, trend: "up", budget: 500, usage: 91 },
  { id: "2", category: "计算", service: "payment-gateway", resource: "EC2 t3.xlarge x 2", cost: 234.56, change: -5.2, trend: "down", budget: 300, usage: 78 },
  { id: "3", category: "存储", service: "order-service", resource: "EBS gp3 500GB", cost: 125.00, change: 3.8, trend: "up", budget: 150, usage: 83 },
  { id: "4", category: "存储", service: "inventory-service", resource: "RDS db.t3.medium", cost: 189.45, change: 8.9, trend: "up", budget: 200, usage: 95 },
  { id: "5", category: "网络", service: "all-services", resource: "Data Transfer OUT", cost: 345.67, change: -2.1, trend: "down", budget: 400, usage: 86 },
  { id: "6", category: "数据库", service: "user-service", resource: "RDS db.t3.large", cost: 278.90, change: 15.3, trend: "up", budget: 250, usage: 111 },
  { id: "7", category: "监控", service: "all-services", resource: "CloudWatch Metrics", cost: 89.45, change: 5.6, trend: "up", budget: 100, usage: 89 },
  { id: "8", category: "安全", service: "all-services", resource: "WAF Rules", cost: 67.89, change: 0, trend: "stable", budget: 80, usage: 85 },
];

export default function CostAnalysis() {
  const [timeRange, setTimeRange] = useState("30d");
  const [filterCategory, setFilterCategory] = useState("all");

  const filteredItems = mockCostItems.filter(item => {
    return filterCategory === "all" || item.category === filterCategory;
  });

  const totalCost = mockCostItems.reduce((sum, item) => sum + item.cost, 0);
  const totalBudget = mockCostItems.reduce((sum, item) => sum + item.budget, 0);
  const avgUsage = Math.round(
    mockCostItems.reduce((sum, item) => sum + item.usage, 0) / mockCostItems.length
  );
  const overBudgetCount = mockCostItems.filter(item => item.usage > 100).length;

  const categoryCosts = [
    { name: "计算", cost: mockCostItems.filter(i => i.category === "计算").reduce((sum, i) => sum + i.cost, 0), color: "#1890FF" },
    { name: "存储", cost: mockCostItems.filter(i => i.category === "存储").reduce((sum, i) => sum + i.cost, 0), color: "#52C41A" },
    { name: "网络", cost: mockCostItems.filter(i => i.category === "网络").reduce((sum, i) => sum + i.cost, 0), color: "#FAAD14" },
    { name: "数据库", cost: mockCostItems.filter(i => i.category === "数据库").reduce((sum, i) => sum + i.cost, 0), color: "#FF4D4F" },
    { name: "监控", cost: mockCostItems.filter(i => i.category === "监控").reduce((sum, i) => sum + i.cost, 0), color: "#722ED1" },
    { name: "安全", cost: mockCostItems.filter(i => i.category === "安全").reduce((sum, i) => sum + i.cost, 0), color: "#13C2C2" },
  ];

  return (
    <MainLayout title="成本分析">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium">成本概览</h2>
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
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
              <option value="1y">最近1年</option>
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
              导出报告
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <DollarSign className="w-6 h-6" style={{ color: "#00D68F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>本月成本</div>
                <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                <BarChart3 className="w-6 h-6" style={{ color: "#1890FF" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预算使用</div>
                <div className="text-2xl font-bold">{((totalCost / totalBudget) * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                <Activity className="w-6 h-6" style={{ color: "#FAAD14" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均使用率</div>
                <div className="text-2xl font-bold">{avgUsage}%</div>
              </div>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <TrendingUp className="w-6 h-6" style={{ color: "#FF4D4F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>超预算项</div>
                <div className="text-2xl font-bold" style={{ color: overBudgetCount > 0 ? "#FF4D4F" : "inherit" }}>
                  {overBudgetCount}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* 成本分布 */}
          <div className="col-span-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-sm font-medium mb-4">成本分布</h3>
            <div className="space-y-3">
              {categoryCosts.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ background: cat.color }} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">${cat.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 成本明细 */}
          <div className="col-span-2 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium">成本明细</h3>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-2 py-1 rounded text-xs"
                style={{
                  background: "var(--background)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <option value="all">全部</option>
                <option value="计算">计算</option>
                <option value="存储">存储</option>
                <option value="网络">网络</option>
                <option value="数据库">数据库</option>
                <option value="监控">监控</option>
                <option value="安全">安全</option>
              </select>
            </div>
            <div className="space-y-2">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg"
                  style={{ background: "var(--muted)" }}
                >
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="text-sm font-medium">{item.service}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.resource}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">${item.cost.toFixed(2)}</div>
                      <div className="flex items-center gap-1 text-xs">
                        {item.trend === "up" && <TrendingUp className="w-3 h-3 text-red-500" />}
                        {item.trend === "down" && <TrendingDown className="w-3 h-3 text-green-500" />}
                        <span style={{ color: item.trend === "up" ? "#FF4D4F" : item.trend === "down" ? "#52C41A" : "var(--muted-foreground)" }}>
                          {item.change > 0 ? "+" : ""}{item.change}%
                        </span>
                      </div>
                    </div>
                    <div className="w-20">
                      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{item.usage}%</div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--background)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(item.usage, 100)}%`,
                            background: item.usage > 100 ? "#FF4D4F" : item.usage > 80 ? "#FAAD14" : "#00D68F"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
