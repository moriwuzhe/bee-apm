import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Plus, Edit2, Trash2, Eye, Download, RefreshCw, FileText, BarChart3, PieChart, LineChart, Table, Calendar, TrendingUp, TrendingDown, Activity, Server, Wifi, Cpu, Database, Zap, Clock } from "lucide-react";

interface ReportTemplate {
  id: string;
  name: string;
  type: "performance" | "usage" | "alerts" | "custom";
  description: string;
  createdAt: string;
  lastGenerated: string;
  schedule?: "daily" | "weekly" | "monthly";
  metrics: string[];
  filters: {
    timeRange: string;
    applications: string[];
    environments: string[];
  };
}

interface GeneratedReport {
  id: string;
  name: string;
  type: string;
  generatedAt: string;
  format: "pdf" | "excel" | "csv";
  size: string;
  url?: string;
}

const mockReportTemplates: ReportTemplate[] = [
  {
    id: "1",
    name: "每日性能报告",
    type: "performance",
    description: "自动生成每日系统性能指标报告",
    createdAt: "2024-01-15",
    lastGenerated: "2024-01-20 09:00",
    schedule: "daily",
    metrics: ["CPU使用率", "内存使用率", "响应时间", "错误率"],
    filters: { timeRange: "24h", applications: ["全部"], environments: ["生产"] },
  },
  {
    id: "2",
    name: "告警汇总报告",
    type: "alerts",
    description: "每周告警汇总及趋势分析",
    createdAt: "2024-01-10",
    lastGenerated: "2024-01-19 09:00",
    schedule: "weekly",
    metrics: ["告警数量", "告警类型", "告警级别", "解决时间"],
    filters: { timeRange: "7d", applications: ["全部"], environments: ["全部"] },
  },
  {
    id: "3",
    name: "应用使用报告",
    type: "usage",
    description: "各应用使用情况统计",
    createdAt: "2024-01-08",
    lastGenerated: "2024-01-18 10:00",
    schedule: "weekly",
    metrics: ["请求量", "带宽使用", "存储使用"],
    filters: { timeRange: "7d", applications: ["order-service", "payment-gateway"], environments: ["生产"] },
  },
];

const mockGeneratedReports: GeneratedReport[] = [
  { id: "1", name: "性能报告-20240120", type: "performance", generatedAt: "2024-01-20 09:00", format: "pdf", size: "2.3 MB" },
  { id: "2", name: "告警报告-20240119", type: "alerts", generatedAt: "2024-01-19 09:00", format: "excel", size: "1.8 MB" },
  { id: "3", name: "使用报告-20240118", type: "usage", generatedAt: "2024-01-18 10:00", format: "csv", size: "856 KB" },
];

export default function ReportBuilder() {
  const [activeTab, setActiveTab] = useState<"templates" | "generated" | "builder">("templates");
  const [reportTemplates, setReportTemplates] = useState<ReportTemplate[]>(mockReportTemplates);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>(mockGeneratedReports);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(["CPU使用率", "内存使用率"]);
  const [reportName, setReportName] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [reportType, setReportType] = useState<"performance" | "usage" | "alerts" | "custom">("performance");

  const availableMetrics = [
    { id: "cpu", name: "CPU使用率", icon: Cpu, category: "性能" },
    { id: "memory", name: "内存使用率", icon: Database, category: "性能" },
    { id: "response", name: "响应时间", icon: Clock, category: "性能" },
    { id: "errors", name: "错误率", icon: Activity, category: "性能" },
    { id: "requests", name: "请求量", icon: TrendingUp, category: "使用" },
    { id: "bandwidth", name: "带宽使用", icon: Wifi, category: "使用" },
    { id: "alerts", name: "告警数量", icon: Zap, category: "告警" },
    { id: "incidents", name: "故障事件", icon: Server, category: "告警" },
  ];

  const handleGenerateReport = (template: ReportTemplate) => {
    const newReport: GeneratedReport = {
      id: `report-${Date.now()}`,
      name: `${template.name}-${new Date().toISOString().split("T")[0]}`,
      type: template.type,
      generatedAt: new Date().toLocaleString(),
      format: "pdf",
      size: `${(Math.random() * 3 + 1).toFixed(1)} MB`,
    };
    setGeneratedReports([newReport, ...generatedReports]);
  };

  const handleDeleteTemplate = (templateId: string) => {
    setReportTemplates(reportTemplates.filter(t => t.id !== templateId));
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    console.log("下载报告:", report);
  };

  return (
    <MainLayout title="报表中心">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>报表模板</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{reportTemplates.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <FileText size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已生成报告</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{generatedReports.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Download size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>自动调度</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{reportTemplates.filter(t => t.schedule).length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Calendar size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总下载量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>156</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(250, 204, 21, 0.1)" }}>
                <TrendingUp size={20} style={{ color: "#FACC15" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "templates" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <FileText size={16} />
            报表模板
          </button>
          <button
            onClick={() => setActiveTab("generated")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "generated" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Download size={16} />
            已生成报告
          </button>
          <button
            onClick={() => setActiveTab("builder")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "builder" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Plus size={16} />
            创建报表
          </button>
        </div>

        {/* 报表模板列表 */}
        {activeTab === "templates" && (
          <div className="space-y-4">
            {reportTemplates.map((template) => (
              <div key={template.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white">{template.name}</span>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                        {template.type === "performance" ? "性能" : template.type === "alerts" ? "告警" : "使用"}
                      </span>
                      {template.schedule && (
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#A855F7" }}>
                          {template.schedule === "daily" ? "每日" : template.schedule === "weekly" ? "每周" : "每月"}
                        </span>
                      )}
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{template.description}</div>
                    <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span>创建: {template.createdAt}</span>
                      <span>上次生成: {template.lastGenerated}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleGenerateReport(template)}
                      className="px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                    >
                      立即生成
                    </button>
                    <button className="p-1.5 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 rounded hover:bg-input"
                      style={{ color: "#FF4D4F" }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>包含指标:</div>
                  <div className="flex flex-wrap gap-2">
                    {template.metrics.map((metric, idx) => (
                      <span key={idx} className="px-2 py-1 rounded text-xs" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        {metric}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>时间范围</div>
                    <div className="text-xs mt-1 text-white">{template.filters.timeRange}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>应用</div>
                    <div className="text-xs mt-1 text-white">{template.filters.applications.join(", ")}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>环境</div>
                    <div className="text-xs mt-1 text-white">{template.filters.environments.join(", ")}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 已生成报告列表 */}
        {activeTab === "generated" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--input)" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>报告名称</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>类型</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>生成时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>格式</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>大小</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {generatedReports.map((report) => (
                    <tr key={report.id} className="hover:bg-input">
                      <td className="px-4 py-3 text-sm text-white">{report.name}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                          {report.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{report.generatedAt}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{report.format.toUpperCase()}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{report.size}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleDownloadReport(report)}
                            className="flex items-center gap-1 px-2 py-1 rounded text-xs"
                            style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}
                          >
                            <Download size={12} />
                            下载
                          </button>
                          <button className="p-1 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                            <Eye size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 报表构建器 */}
        {activeTab === "builder" && (
          <div className="grid grid-cols-3 gap-4">
            {/* 左侧: 配置面板 */}
            <div className="col-span-2 space-y-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-medium text-white mb-4">报表配置</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>报表名称</label>
                    <input
                      type="text"
                      value={reportName}
                      onChange={(e) => setReportName(e.target.value)}
                      placeholder="输入报表名称"
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>报表类型</label>
                    <select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    >
                      <option value="performance">性能报告</option>
                      <option value="usage">使用报告</option>
                      <option value="alerts">告警报告</option>
                      <option value="custom">自定义报告</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>报表描述</label>
                    <textarea
                      value={reportDescription}
                      onChange={(e) => setReportDescription(e.target.value)}
                      placeholder="输入报表描述"
                      rows={3}
                      className="w-full px-3 py-2 rounded-lg border text-sm"
                      style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-medium text-white mb-4">选择指标</h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableMetrics.map((metric) => {
                    const Icon = metric.icon;
                    const isSelected = selectedMetrics.includes(metric.name);
                    return (
                      <button
                        key={metric.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedMetrics(selectedMetrics.filter(m => m !== metric.name));
                          } else {
                            setSelectedMetrics([...selectedMetrics, metric.name]);
                          }
                        }}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-transparent bg-[var(--muted)] hover:bg-[var(--input)]"
                        }`}
                      >
                        <Icon size={18} style={{ color: isSelected ? "#165DFF" : "var(--muted-foreground)" }} />
                        <div className="flex-1">
                          <div className="text-xs font-medium" style={{ color: isSelected ? "#165DFF" : "var(--foreground)" }}>
                            {metric.name}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{metric.category}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                >
                  保存模板
                </button>
                <button
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium"
                  style={{ background: "#165DFF", color: "#fff" }}
                >
                  立即生成
                </button>
              </div>
            </div>

            {/* 右侧: 预览 */}
            <div className="space-y-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-medium text-white mb-4">报表预览</h3>
                <div className="space-y-3">
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>报表名称</div>
                    <div className="text-sm font-medium text-white mt-1">{reportName || "未设置"}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>报表类型</div>
                    <div className="text-sm font-medium text-white mt-1">
                      {reportType === "performance" ? "性能报告" : reportType === "usage" ? "使用报告" : reportType === "alerts" ? "告警报告" : "自定义报告"}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>已选指标 ({selectedMetrics.length})</div>
                    <div className="space-y-1">
                      {selectedMetrics.map((metric, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                          {metric}
                        </div>
                      ))}
                      {selectedMetrics.length === 0 && (
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>请选择指标</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <h3 className="text-sm font-medium text-white mb-4">报表样式</h3>
                <div className="space-y-2">
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-blue-500 bg-blue-500/10">
                    <BarChart3 size={18} style={{ color: "#165DFF" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>柱状图</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent bg-[var(--muted)]">
                    <LineChart size={18} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>折线图</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent bg-[var(--muted)]">
                    <PieChart size={18} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>饼图</span>
                  </button>
                  <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-transparent bg-[var(--muted)]">
                    <Table size={18} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-sm" style={{ color: "var(--foreground)" }}>数据表格</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
