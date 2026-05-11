import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Plus, Play, Pause, Trash2, Edit2, Eye, Settings, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Activity, Zap, Database, Server, Wifi, Cpu } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: {
    type: "metric" | "schedule" | "manual" | "event";
    condition: string;
    threshold?: number;
    schedule?: string;
  };
  actions: Array<{
    type: "scale" | "restart" | "notify" | "script" | "backup";
    config: Record<string, any>;
  }>;
  status: "active" | "paused" | "disabled";
  lastTriggered?: string;
  executions: number;
  successRate: number;
  createdAt: string;
  lastModified: string;
}

interface ExecutionLog {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "failed" | "running";
  triggeredBy: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  details?: string;
}

const mockWorkflows: Workflow[] = [
  {
    id: "1",
    name: "自动扩容",
    description: "当CPU使用率超过85%时，自动扩容实例",
    trigger: { type: "metric", condition: "cpu_usage", threshold: 85 },
    actions: [
      { type: "scale", config: { instances: "+2" } },
      { type: "notify", config: { channel: "slack", message: "CPU使用率过高，已自动扩容" } },
    ],
    status: "active",
    lastTriggered: new Date(Date.now() - 1800000).toLocaleString(),
    executions: 156,
    successRate: 98.7,
    createdAt: "2024-01-15",
    lastModified: "2024-01-20",
  },
  {
    id: "2",
    name: "内存告警处理",
    description: "当内存使用率超过90%时，重启相关服务",
    trigger: { type: "metric", condition: "memory_usage", threshold: 90 },
    actions: [
      { type: "restart", config: { service: "all", delay: 30 } },
      { type: "notify", config: { channel: "email", message: "内存使用率过高，服务已重启" } },
    ],
    status: "active",
    lastTriggered: new Date(Date.now() - 7200000).toLocaleString(),
    executions: 23,
    successRate: 95.6,
    createdAt: "2024-01-10",
    lastModified: "2024-01-19",
  },
  {
    id: "3",
    name: "每日备份",
    description: "每天凌晨2点自动备份数据库",
    trigger: { type: "schedule", condition: "cron", schedule: "0 2 * * *" },
    actions: [
      { type: "backup", config: { target: "all", retention: 7 } },
      { type: "notify", config: { channel: "slack", message: "数据库备份完成" } },
    ],
    status: "active",
    lastTriggered: new Date(Date.now() - 86400000).toLocaleString(),
    executions: 30,
    successRate: 100,
    createdAt: "2024-01-05",
    lastModified: "2024-01-18",
  },
  {
    id: "4",
    name: "错误率告警",
    description: "当错误率超过5%时，自动切换流量",
    trigger: { type: "metric", condition: "error_rate", threshold: 5 },
    actions: [
      { type: "scale", config: { action: "switch_traffic", target: "backup" } },
      { type: "notify", config: { channel: "all", message: "错误率过高，流量已切换" } },
    ],
    status: "paused",
    lastTriggered: new Date(Date.now() - 172800000).toLocaleString(),
    executions: 8,
    successRate: 100,
    createdAt: "2024-01-08",
    lastModified: "2024-01-17",
  },
];

const mockExecutionLogs: ExecutionLog[] = [
  { id: "1", workflowId: "1", workflowName: "自动扩容", status: "success", triggeredBy: "自动触发", startTime: "2024-01-20 14:30:15", endTime: "2024-01-20 14:32:20", duration: 125, details: "成功扩容2个实例" },
  { id: "2", workflowId: "2", workflowName: "内存告警处理", status: "failed", triggeredBy: "自动触发", startTime: "2024-01-20 13:15:00", endTime: "2024-01-20 13:16:30", duration: 90, details: "重启失败，目标服务无响应" },
  { id: "3", workflowId: "1", workflowName: "自动扩容", status: "running", triggeredBy: "自动触发", startTime: "2024-01-20 14:35:00", details: "正在执行扩容操作..." },
  { id: "4", workflowId: "3", workflowName: "每日备份", status: "success", triggeredBy: "定时任务", startTime: "2024-01-20 02:00:00", endTime: "2024-01-20 02:15:30", duration: 930, details: "备份完成，耗时15分30秒" },
];

export default function WorkflowAutomation() {
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>(mockExecutionLogs);
  const [activeTab, setActiveTab] = useState<"workflows" | "logs">("workflows");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<Workflow | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchKeyword, setSearchKeyword] = useState("");

  const filteredWorkflows = workflows.filter(w => {
    const matchesStatus = filterStatus === "all" || w.status === filterStatus;
    const matchesKeyword = searchKeyword === "" || w.name.toLowerCase().includes(searchKeyword.toLowerCase()) || w.description.toLowerCase().includes(searchKeyword.toLowerCase());
    return matchesStatus && matchesKeyword;
  });

  const handleToggleStatus = (workflowId: string) => {
    setWorkflows(workflows.map(w => {
      if (w.id === workflowId) {
        return { ...w, status: w.status === "active" ? "paused" : "active" };
      }
      return w;
    }));
  };

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId));
  };

  const handleTriggerWorkflow = (workflow: Workflow) => {
    const newLog: ExecutionLog = {
      id: `log-${Date.now()}`,
      workflowId: workflow.id,
      workflowName: workflow.name,
      status: "running",
      triggeredBy: "手动触发",
      startTime: new Date().toLocaleString(),
    };
    setExecutionLogs([newLog, ...executionLogs]);
  };

  return (
    <MainLayout title="运维自动化">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>工作流总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{workflows.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Zap size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>运行中</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>
                  {workflows.filter(w => w.status === "active").length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Play size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总执行次数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>
                  {workflows.reduce((sum, w) => sum + w.executions, 0)}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168, 85, 247, 0.1)" }}>
                <Activity size={20} style={{ color: "#A855F7" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均成功率</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>
                  {(workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length).toFixed(1)}%
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("workflows")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "workflows" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Zap size={16} />
            工作流管理
          </button>
          <button
            onClick={() => setActiveTab("logs")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "logs" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
            }`}
          >
            <Clock size={16} />
            执行日志
          </button>
        </div>

        {/* 工作流列表 */}
        {activeTab === "workflows" && (
          <>
            {/* 控制栏 */}
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="搜索工作流..."
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  className="px-4 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="all">全部状态</option>
                  <option value="active">运行中</option>
                  <option value="paused">已暂停</option>
                  <option value="disabled">已禁用</option>
                </select>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "#165DFF", color: "#fff" }}
              >
                <Plus size={14} />
                创建工作流
              </button>
            </div>

            {/* 工作流卡片 */}
            <div className="grid grid-cols-2 gap-4">
              {filteredWorkflows.map((workflow) => (
                <div key={workflow.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white">{workflow.name}</span>
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{
                            background: workflow.status === "active" ? "rgba(0, 214, 143, 0.1)" : workflow.status === "paused" ? "rgba(255, 170, 0, 0.1)" : "rgba(134, 144, 156, 0.1)",
                            color: workflow.status === "active" ? "#00D68F" : workflow.status === "paused" ? "#FFAA00" : "#94A3B8"
                          }}
                        >
                          {workflow.status === "active" ? "运行中" : workflow.status === "paused" ? "已暂停" : "已禁用"}
                        </span>
                      </div>
                      <div className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                        {workflow.description}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(workflow.id)}
                        className="p-1.5 rounded hover:bg-input"
                        style={{ color: workflow.status === "active" ? "#FFAA00" : "#00D68F" }}
                        title={workflow.status === "active" ? "暂停" : "启动"}
                      >
                        {workflow.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                      <button
                        onClick={() => setEditingWorkflow(workflow)}
                        className="p-1.5 rounded hover:bg-input"
                        style={{ color: "var(--muted-foreground)" }}
                        title="编辑"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteWorkflow(workflow.id)}
                        className="p-1.5 rounded hover:bg-input"
                        style={{ color: "#FF4D4F" }}
                        title="删除"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>触发条件</div>
                    <div className="flex items-center gap-2">
                      <Zap size={14} style={{ color: "#165DFF" }} />
                      <span className="text-xs text-white">
                        {workflow.trigger.type === "metric" && `${workflow.trigger.condition} ${workflow.trigger.threshold}%`}
                        {workflow.trigger.type === "schedule" && `定时: ${workflow.trigger.schedule}`}
                        {workflow.trigger.type === "manual" && "手动触发"}
                      </span>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>执行动作</div>
                    <div className="space-y-1">
                      {workflow.actions.map((action, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs" style={{ color: "var(--foreground)" }}>
                          {action.type === "scale" && <Server size={12} style={{ color: "#165DFF" }} />}
                          {action.type === "restart" && <RefreshCw size={12} style={{ color: "#FFAA00" }} />}
                          {action.type === "notify" && <Zap size={12} style={{ color: "#A855F7" }} />}
                          {action.type === "backup" && <Database size={12} style={{ color: "#00D68F" }} />}
                          {action.type === "scale" && "扩容"}
                          {action.type === "restart" && "重启服务"}
                          {action.type === "notify" && "发送通知"}
                          {action.type === "backup" && "数据备份"}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>执行次数</div>
                      <div className="text-sm font-medium text-white mt-1">{workflow.executions}</div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                      <div className="text-sm font-medium mt-1" style={{ color: workflow.successRate > 95 ? "#00D68F" : workflow.successRate > 90 ? "#FFAA00" : "#FF4D4F" }}>
                        {workflow.successRate}%
                      </div>
                    </div>
                    <div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>上次执行</div>
                      <div className="text-xs text-white mt-1">{workflow.lastTriggered || "从未执行"}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedWorkflow(workflow)}
                      className="flex-1 px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                    >
                      详情
                    </button>
                    <button
                      onClick={() => handleTriggerWorkflow(workflow)}
                      className="flex-1 px-3 py-1.5 rounded text-xs font-medium"
                      style={{ background: "#165DFF", color: "#fff" }}
                    >
                      立即执行
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* 执行日志 */}
        {activeTab === "logs" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "var(--input)" }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>工作流</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>触发方式</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>开始时间</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>耗时</th>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>详情</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                  {executionLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-input">
                      <td className="px-4 py-3 text-sm text-white">{log.workflowName}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs"
                          style={{
                            background: log.status === "success" ? "rgba(0, 214, 143, 0.1)" : log.status === "failed" ? "rgba(255, 77, 79, 0.1)" : "rgba(255, 170, 0, 0.1)",
                            color: log.status === "success" ? "#00D68F" : log.status === "failed" ? "#FF4D4F" : "#FFAA00"
                          }}
                        >
                          {log.status === "success" && <CheckCircle size={12} />}
                          {log.status === "failed" && <XCircle size={12} />}
                          {log.status === "running" && <Activity size={12} />}
                          {log.status === "success" ? "成功" : log.status === "failed" ? "失败" : "运行中"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{log.triggeredBy}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{log.startTime}</td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {log.duration ? `${Math.floor(log.duration / 60)}分${log.duration % 60}秒` : "-"}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
