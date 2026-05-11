import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Brain, Sparkles, Zap, AlertTriangle, CheckCircle, Activity, TrendingUp, Clock, Cpu, Database, Wifi, Server, BarChart3, LineChart, PieChart, Settings, Play, Pause, RefreshCw, Download, Eye, Edit2, Trash2, Plus } from "lucide-react";

interface AIAutomation {
  id: string;
  name: string;
  type: "anomaly_detection" | "auto_scaling" | "self_healing" | "predictive_maintenance" | "capacity_optimization";
  description: string;
  status: "active" | "paused" | "disabled";
  confidence: number;
  actions: number;
  lastTriggered?: string;
  successRate: number;
  enabled: boolean;
}

interface AnomalyEvent {
  id: string;
  service: string;
  metric: string;
  value: number;
  threshold: number;
  severity: "critical" | "warning" | "info";
  confidence: number;
  detectedAt: string;
  description: string;
  autoAction?: string;
  status: "detected" | "analyzing" | "resolved" | "escalated";
}

interface Prediction {
  metric: string;
  current: number;
  predicted: number;
  timeline: Array<{ time: string; value: number }>;
  confidence: number;
  daysUntilThreshold: number;
  recommendation: string;
}

interface AutomationWorkflow {
  id: string;
  name: string;
  trigger: {
    type: "metric" | "event" | "schedule" | "ai";
    condition: string;
  };
  actions: Array<{
    type: "scale" | "restart" | "notify" | "backup" | "script";
    config: Record<string, any>;
  }>;
  status: "active" | "paused" | "running" | "failed";
  executions: number;
  successRate: number;
  lastExecution?: string;
}

const mockAIAutomations: AIAutomation[] = [
  { id: "1", name: "异常检测引擎", type: "anomaly_detection", description: "实时检测系统异常并自动分类", status: "active", confidence: 95, actions: 156, lastTriggered: new Date(Date.now() - 300000).toLocaleString(), successRate: 98.5, enabled: true },
  { id: "2", name: "智能自动扩展", type: "auto_scaling", description: "基于AI预测自动调整资源", status: "active", confidence: 88, actions: 45, lastTriggered: new Date(Date.now() - 1800000).toLocaleString(), successRate: 96.2, enabled: true },
  { id: "3", name: "自愈系统", type: "self_healing", description: "自动修复常见故障", status: "active", confidence: 82, actions: 23, lastTriggered: new Date(Date.now() - 3600000).toLocaleString(), successRate: 91.3, enabled: true },
  { id: "4", name: "预测性维护", type: "predictive_maintenance", description: "预测潜在问题并提前处理", status: "paused", confidence: 75, actions: 12, lastTriggered: new Date(Date.now() - 86400000).toLocaleString(), successRate: 85.0, enabled: false },
  { id: "5", name: "容量优化", type: "capacity_optimization", description: "优化资源分配降低成本", status: "active", confidence: 80, actions: 8, lastTriggered: new Date(Date.now() - 172800000).toLocaleString(), successRate: 93.8, enabled: true },
];

const mockAnomalyEvents: AnomalyEvent[] = [
  { id: "1", service: "order-service", metric: "响应时间", value: 2456, threshold: 500, severity: "critical", confidence: 96, detectedAt: new Date(Date.now() - 300000).toLocaleString(), description: "响应时间异常飙升，超出基线387%", autoAction: "自动扩容实例", status: "resolved" },
  { id: "2", service: "payment-gateway", metric: "错误率", value: 5.8, threshold: 5, severity: "warning", confidence: 89, detectedAt: new Date(Date.now() - 1800000).toLocaleString(), description: "支付错误率略有上升", status: "analyzing" },
  { id: "3", service: "user-service", metric: "内存使用率", value: 92, threshold: 85, severity: "warning", confidence: 92, detectedAt: new Date(Date.now() - 2700000).toLocaleString(), description: "内存使用率持续高位", autoAction: "触发GC", status: "resolved" },
  { id: "4", service: "inventory-service", metric: "CPU使用率", value: 78, threshold: 80, severity: "info", confidence: 85, detectedAt: new Date(Date.now() - 3600000).toLocaleString(), description: "CPU使用率接近阈值", status: "detected" },
];

const mockPredictions: Prediction[] = [
  { metric: "CPU使用率", current: 68, predicted: 85, timeline: Array.from({ length: 7 }, (_, i) => ({ time: `第${i + 1}天`, value: 60 + Math.random() * 25 + i * 3 })), confidence: 88, daysUntilThreshold: 12, recommendation: "建议在第10天进行扩容" },
  { metric: "内存使用率", current: 75, predicted: 92, timeline: Array.from({ length: 7 }, (_, i) => ({ time: `第${i + 1}天`, value: 70 + Math.random() * 20 + i * 2 })), confidence: 85, daysUntilThreshold: 8, recommendation: "建议优化内存使用或扩容" },
  { metric: "存储空间", current: 65, predicted: 85, timeline: Array.from({ length: 7 }, (_, i) => ({ time: `第${i + 1}天`, value: 60 + Math.random() * 20 + i * 2 })), confidence: 82, daysUntilThreshold: 15, recommendation: "考虑清理旧数据或扩容" },
];

const mockWorkflows: AutomationWorkflow[] = [
  { id: "1", name: "CPU峰值自动处理", trigger: { type: "metric", condition: "cpu > 85%" }, actions: [{ type: "scale", config: { instances: "+2" } }, { type: "notify", config: { channel: "slack" } }], status: "active", executions: 156, successRate: 98.5, lastExecution: new Date(Date.now() - 300000).toLocaleString() },
  { id: "2", name: "内存泄漏自愈", trigger: { type: "metric", condition: "memory > 90%" }, actions: [{ type: "restart", config: { service: "target" } }, { type: "notify", config: { channel: "email" } }], status: "active", executions: 23, successRate: 91.3, lastExecution: new Date(Date.now() - 3600000).toLocaleString() },
  { id: "3", name: "每日健康检查", trigger: { type: "schedule", condition: "0 2 * * *" }, actions: [{ type: "backup", config: { target: "all" } }, { type: "notify", config: { channel: "slack" } }], status: "active", executions: 30, successRate: 100, lastExecution: new Date(Date.now() - 86400000).toLocaleString() },
  { id: "4", name: "异常自动分析", trigger: { type: "ai", condition: "anomaly detected" }, actions: [{ type: "notify", config: { channel: "all" } }, { type: "script", config: { command: "analyze_logs" } }], status: "paused", executions: 45, successRate: 95.6, lastExecution: new Date(Date.now() - 172800000).toLocaleString() },
];

export default function AIAutomationCenter() {
  const [activeTab, setActiveTab] = useState<"overview" | "anomalies" | "predictions" | "workflows" | "settings">("overview");
  const [aiAutomations, setAIAutomations] = useState<AIAutomation[]>(mockAIAutomations);
  const [anomalyEvents, setAnomalyEvents] = useState<AnomalyEvent[]>(mockAnomalyEvents);
  const [predictions, setPredictions] = useState<Prediction[]>(mockPredictions);
  const [workflows, setWorkflows] = useState<AutomationWorkflow[]>(mockWorkflows);
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyEvent | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);

  const handleToggleAutomation = (id: string) => {
    setAIAutomations(aiAutomations.map(a => {
      if (a.id === id) {
        return { ...a, enabled: !a.enabled, status: !a.enabled ? "active" : "paused" };
      }
      return a;
    }));
  };

  const handleResolveAnomaly = (id: string) => {
    setAnomalyEvents(anomalyEvents.map(e => {
      if (e.id === id) {
        return { ...e, status: "resolved" as const };
      }
      return e;
    }));
  };

  const handleExecuteWorkflow = (workflow: AutomationWorkflow) => {
    setWorkflows(workflows.map(w => {
      if (w.id === workflow.id) {
        return { ...w, status: "running" as const };
      }
      return w;
    }));
  };

  const activeAutomations = aiAutomations.filter(a => a.status === "active").length;
  const totalActions = aiAutomations.reduce((sum, a) => sum + a.actions, 0);
  const avgSuccessRate = (aiAutomations.reduce((sum, a) => sum + a.successRate, 0) / aiAutomations.length).toFixed(1);
  const unresolvedAnomalies = anomalyEvents.filter(e => e.status !== "resolved").length;

  return (
    <MainLayout title="智能运维中心">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃AI能力</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{activeAutomations}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Brain size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>AI执行次数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{totalActions}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Sparkles size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均成功率</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{avgSuccessRate}%</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <TrendingUp size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>待处理异常</div>
                <div className="text-xl font-bold mt-1" style={{ color: unresolvedAnomalies > 0 ? "#FFAA00" : "#00D68F" }}>
                  {unresolvedAnomalies}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <AlertTriangle size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预测模型</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{predictions.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Activity size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab 切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {[
            { key: "overview", label: "AI能力总览", icon: Brain },
            { key: "anomalies", label: "异常检测", icon: AlertTriangle },
            { key: "predictions", label: "智能预测", icon: TrendingUp },
            { key: "workflows", label: "自动化工作流", icon: Zap },
            { key: "settings", label: "AI设置", icon: Settings },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* AI能力总览 */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* AI能力列表 */}
            <div className="grid grid-cols-3 gap-4">
              {aiAutomations.map((automation) => (
                <div key={automation.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Brain size={16} style={{ color: automation.enabled ? "#A855F7" : "#94A3B8" }} />
                        <span className="text-sm font-medium text-white">{automation.name}</span>
                      </div>
                      <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                        {automation.description}
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleAutomation(automation.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        automation.enabled
                          ? "bg-green-500/20 text-green-400"
                          : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {automation.enabled ? "运行中" : "已暂停"}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>置信度</div>
                      <div className="text-sm font-medium text-white">{automation.confidence}%</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>执行次数</div>
                      <div className="text-sm font-medium text-white">{automation.actions}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                      <div className="text-sm font-medium" style={{ color: automation.successRate > 95 ? "#00D68F" : automation.successRate > 90 ? "#FFAA00" : "#FF4D4F" }}>
                        {automation.successRate}%
                      </div>
                    </div>
                  </div>
                  {automation.lastTriggered && (
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                      上次触发: {automation.lastTriggered}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 预测概览 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <TrendingUp size={16} style={{ color: "#165DFF" }} />
                  <span className="text-sm font-medium text-white">预测概览</span>
                </div>
                <button className="text-xs px-3 py-1.5 rounded" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                  查看全部
                </button>
              </div>
              <div className="space-y-3">
                {predictions.map((pred) => (
                  <div key={pred.metric} className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{pred.metric}</span>
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                          {pred.daysUntilThreshold}天后达阈值
                        </span>
                      </div>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        置信度: {pred.confidence}%
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>当前值</div>
                        <div className="text-sm font-medium text-white">{pred.current}%</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预测值</div>
                        <div className="text-sm font-medium" style={{ color: pred.predicted > 85 ? "#FFAA00" : "#00D68F" }}>
                          {pred.predicted}%
                        </div>
                      </div>
                    </div>
                    <div className="text-xs" style={{ color: "#A855F7" }}>
                      💡 {pred.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 异常检测 */}
        {activeTab === "anomalies" && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <span className="text-sm font-medium text-white">异常事件列表</span>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {anomalyEvents.map((event) => (
                  <div key={event.id} className="p-4 hover:bg-input transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {event.severity === "critical" && <AlertTriangle size={16} style={{ color: "#FF4D4F" }} />}
                        {event.severity === "warning" && <AlertTriangle size={16} style={{ color: "#FFAA00" }} />}
                        {event.severity === "info" && <Activity size={16} style={{ color: "#165DFF" }} />}
                        <span className="text-sm font-medium text-white">{event.service}</span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{event.metric}</span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: event.severity === "critical" ? "rgba(255, 77, 79, 0.1)" : event.severity === "warning" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                            color: event.severity === "critical" ? "#FF4D4F" : event.severity === "warning" ? "#FFAA00" : "#165DFF"
                          }}
                        >
                          {event.severity === "critical" ? "严重" : event.severity === "warning" ? "警告" : "信息"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#A855F7" }}>
                          置信度 {event.confidence}%
                        </span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: event.status === "resolved" ? "rgba(0, 214, 143, 0.1)" : event.status === "analyzing" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                            color: event.status === "resolved" ? "#00D68F" : event.status === "analyzing" ? "#FFAA00" : "#165DFF"
                          }}
                        >
                          {event.status === "resolved" ? "已解决" : event.status === "analyzing" ? "分析中" : event.status === "escalated" ? "已升级" : "待处理"}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                      {event.description}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span>当前: <span className="text-white">{event.value}</span></span>
                        <span>阈值: <span className="text-white">{event.threshold}</span></span>
                        <span>检测时间: {event.detectedAt}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedAnomaly(event);
                            setShowDetailModal(true);
                          }}
                          className="px-3 py-1 rounded text-xs"
                          style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                        >
                          详情
                        </button>
                        {event.status !== "resolved" && (
                          <button
                            onClick={() => handleResolveAnomaly(event.id)}
                            className="px-3 py-1 rounded text-xs font-medium"
                            style={{ background: "#165DFF", color: "#fff" }}
                          >
                            标记解决
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 智能预测 */}
        {activeTab === "predictions" && (
          <div className="space-y-4">
            {predictions.map((pred) => (
              <div key={pred.metric} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={16} style={{ color: "#165DFF" }} />
                    <span className="text-sm font-medium text-white">{pred.metric}</span>
                    <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(168, 85, 247, 0.1)", color: "#A855F7" }}>
                      置信度 {pred.confidence}%
                    </span>
                  </div>
                  <div className="text-xs px-3 py-1 rounded" style={{ background: "rgba(255, 170, 0, 0.1)", color: "#FFAA00" }}>
                    预计 {pred.daysUntilThreshold} 天后达到阈值
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>当前值</div>
                    <div className="text-lg font-bold" style={{ color: "var(--foreground)" }}>{pred.current}%</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>预测值</div>
                    <div className="text-lg font-bold" style={{ color: pred.predicted > 85 ? "#FFAA00" : "#00D68F" }}>{pred.predicted}%</div>
                  </div>
                </div>
                <div className="p-3 rounded-lg" style={{ background: "rgba(168, 85, 247, 0.05)", border: "1px solid rgba(168, 85, 247, 0.2)" }}>
                  <div className="text-xs mb-1" style={{ color: "#A855F7" }}>💡 AI建议</div>
                  <div className="text-sm text-white">{pred.recommendation}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 自动化工作流 */}
        {activeTab === "workflows" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => setShowCreateWorkflow(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "#165DFF", color: "#fff" }}
              >
                <Plus size={14} />
                创建工作流
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {workflows.map((workflow) => (
                <div key={workflow.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Zap size={16} style={{ color: "#FACC15" }} />
                        <span className="text-sm font-medium text-white">{workflow.name}</span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        触发条件: {workflow.trigger.type === "metric" ? workflow.trigger.condition : workflow.trigger.type === "schedule" ? `定时: ${workflow.trigger.condition}` : `AI: ${workflow.trigger.condition}`}
                      </div>
                    </div>
                    <button
                      onClick={() => handleExecuteWorkflow(workflow)}
                      className="px-3 py-1 rounded text-xs"
                      style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}
                    >
                      立即执行
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>执行次数</div>
                      <div className="text-sm font-medium text-white">{workflow.executions}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                      <div className="text-sm font-medium" style={{ color: workflow.successRate > 95 ? "#00D68F" : "#FFAA00" }}>
                        {workflow.successRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>状态</div>
                      <div className="text-xs" style={{ color: workflow.status === "active" ? "#00D68F" : workflow.status === "running" ? "#FFAA00" : "#94A3B8" }}>
                        {workflow.status === "active" ? "活跃" : workflow.status === "running" ? "运行中" : "暂停"}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                    上次执行: {workflow.lastExecution || "从未执行"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI设置 */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-sm font-medium text-white mb-4">AI模型配置</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">异常检测模型</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>使用机器学习模型检测系统异常</div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                    配置
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">容量预测模型</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>预测未来资源使用趋势</div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                    配置
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-white mb-1">自愈策略引擎</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>自动执行故障修复策略</div>
                  </div>
                  <button className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                    配置
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
