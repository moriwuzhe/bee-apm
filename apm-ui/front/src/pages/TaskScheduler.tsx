import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { 
  Terminal, Play, Square, Plus, Trash2, Settings, Search, Filter, 
  Clock, CheckCircle, XCircle, AlertCircle, Download, Upload, Copy, RefreshCw,
  Code, Database, Server, Globe, Lock, Activity
} from "lucide-react";

interface Task {
  id: string;
  name: string;
  description: string;
  type: string;
  status: "running" | "completed" | "failed" | "pending";
  progress: number;
  startTime: string;
  duration?: number;
  command?: string;
  output?: string;
  user: string;
}

const mockTasks: Task[] = [
  { id: "1", name: "日志收集任务", description: "收集过去24小时的日志数据", type: "数据采集", status: "running", progress: 67, startTime: "2024-01-15 14:30:00", command: "python collect_logs.py --hours 24", output: "Collecting logs... 67% complete", user: "admin" },
  { id: "2", name: "性能报告生成", description: "生成月度性能分析报告", type: "报告生成", status: "completed", progress: 100, startTime: "2024-01-15 14:00:00", duration: 25, command: "python generate_report.py --type monthly", user: "zhang.san" },
  { id: "3", name: "数据库备份", description: "备份MySQL数据库", type: "数据备份", status: "completed", progress: 100, startTime: "2024-01-15 13:00:00", duration: 45, command: "mysqldump -u root -p apm_db > backup.sql", user: "admin" },
  { id: "4", name: "指标数据同步", description: "同步指标到Elasticsearch", type: "数据同步", status: "failed", progress: 45, startTime: "2024-01-15 12:30:00", duration: 15, command: "python sync_metrics.py --target es", output: "Connection timeout after 30s", user: "li.si" },
  { id: "5", name: "Agent批量升级", description: "升级所有Agent到最新版本", type: "批量操作", status: "pending", progress: 0, startTime: "2024-01-15 15:00:00", command: "python upgrade_agents.py --version 2.5.0", user: "admin" },
  { id: "6", name: "健康检查扫描", description: "全量健康检查所有服务", type: "健康检查", status: "running", progress: 82, startTime: "2024-01-15 14:35:00", command: "python health_check.py --all", output: "Checking service health... 82/100 complete", user: "wang.wu" },
];

const taskTemplates = [
  { id: "1", name: "日志收集", icon: Database, command: "python collect_logs.py --hours {hours}" },
  { id: "2", name: "报告生成", icon: Terminal, command: "python generate_report.py --type {type}" },
  { id: "3", name: "数据备份", icon: Server, command: "python backup_data.py --target {target}" },
  { id: "4", name: "健康检查", icon: Activity, command: "python health_check.py --service {service}" },
  { id: "5", name: "Agent升级", icon: RefreshCw, command: "python upgrade_agents.py --version {version}" },
  { id: "6", name: "数据同步", icon: Globe, command: "python sync_data.py --target {target}" },
];

export default function TaskScheduler() {
  const [activeTab, setActiveTab] = useState<"tasks" | "templates" | "history">("tasks");
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = searchQuery === "" || 
      task.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || task.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const runningTasks = tasks.filter(t => t.status === "running").length;
  const completedTasks = tasks.filter(t => t.status === "completed").length;
  const failedTasks = tasks.filter(t => t.status === "failed").length;

  const handleStop = (id: string) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, status: "failed" as const, progress: t.progress } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(tasks.filter(t => t.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running": return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#1890FF" }} />;
      case "completed": return <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />;
      case "failed": return <XCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />;
      case "pending": return <Clock className="w-4 h-4" style={{ color: "#94A3B8" }} />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running": return { bg: "rgba(24, 144, 255, 0.1)", color: "#1890FF" };
      case "completed": return { bg: "rgba(0, 214, 143, 0.1)", color: "#00D68F" };
      case "failed": return { bg: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" };
      case "pending": return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8" };
      default: return { bg: "rgba(148, 163, 184, 0.1)", color: "#94A3B8" };
    }
  };

  return (
    <MainLayout title="任务调度">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("tasks")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "tasks" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "tasks" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "tasks" ? "white" : "var(--foreground)"
              }}
            >
              任务列表
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "templates" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "templates" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "templates" ? "white" : "var(--foreground)"
              }}
            >
              任务模板
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "history" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "history" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "history" ? "white" : "var(--foreground)"
              }}
            >
              执行历史
            </button>
          </div>
          <button
            onClick={() => setShowNewTaskModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white"
            style={{ background: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" />
            新建任务
          </button>
        </div>

        {activeTab === "tasks" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <RefreshCw className="w-6 h-6 animate-spin" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>运行中</div>
                    <div className="text-2xl font-bold" style={{ color: "#1890FF" }}>{runningTasks}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已完成</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{completedTasks}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <XCircle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>失败</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{failedTasks}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Terminal className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总任务</div>
                    <div className="text-2xl font-bold">{tasks.length}</div>
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
                  placeholder="搜索任务名称..."
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
                <option value="running">运行中</option>
                <option value="completed">已完成</option>
                <option value="failed">失败</option>
                <option value="pending">待执行</option>
              </select>
            </div>

            {/* 任务列表 */}
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg" style={getStatusColor(task.status)}>
                        {getStatusIcon(task.status)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{task.name}</h3>
                          <span className="px-2 py-0.5 rounded text-xs" style={getStatusColor(task.status)}>
                            {task.status === "running" ? "运行中" :
                             task.status === "completed" ? "已完成" :
                             task.status === "failed" ? "失败" : "待执行"}
                          </span>
                        </div>
                        <p className="text-sm mb-2" style={{ color: "var(--muted-foreground)" }}>{task.description}</p>
                        <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            {task.type}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {task.startTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <Terminal className="w-3 h-3" />
                            {task.user}
                          </span>
                          {task.duration && (
                            <span>耗时: {task.duration}秒</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === "running" && (
                        <button
                          onClick={() => handleStop(task.id)}
                          className="p-2 rounded-lg transition-all"
                          style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}
                        >
                          <Square className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        className="p-2 rounded-lg transition-all"
                        style={{ background: "var(--muted)", color: "var(--foreground)" }}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-2 rounded-lg transition-all"
                        style={{ background: "rgba(255, 77, 79, 0.1)", color: "#FF4D4F" }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {task.status === "running" && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "var(--muted-foreground)" }}>进度</span>
                        <span style={{ color: "var(--foreground)" }}>{task.progress}%</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${task.progress}%`,
                            background: "linear-gradient(90deg, #1890FF, #1890FF)"
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {task.command && (
                    <div className="p-3 rounded-lg font-mono text-xs" style={{ background: "var(--background)" }}>
                      <div className="flex items-center gap-2 mb-1" style={{ color: "var(--muted-foreground)" }}>
                        <Terminal className="w-3 h-3" />
                        命令
                      </div>
                      <div style={{ color: "var(--foreground)" }}>{task.command}</div>
                    </div>
                  )}

                  {task.output && (
                    <div className="mt-2 p-3 rounded-lg font-mono text-xs" style={{ background: "var(--muted)" }}>
                      <div className="flex items-center gap-2 mb-1" style={{ color: "var(--muted-foreground)" }}>
                        <Activity className="w-3 h-3" />
                        输出
                      </div>
                      <div style={{ color: "var(--foreground)" }}>{task.output}</div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "templates" && (
          <div className="grid grid-cols-3 gap-4">
            {taskTemplates.map((template) => {
              const Icon = template.icon;
              return (
                <div
                  key={template.id}
                  className="rounded-lg p-4 cursor-pointer transition-all hover:scale-105"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  onClick={() => setShowNewTaskModal(true)}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                      <Icon className="w-5 h-5" style={{ color: "var(--primary)" }} />
                    </div>
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="text-xs font-mono p-2 rounded" style={{ background: "var(--background)", color: "var(--muted-foreground)" }}>
                    {template.command}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "history" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">执行历史</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                查看所有任务的执行历史记录
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
