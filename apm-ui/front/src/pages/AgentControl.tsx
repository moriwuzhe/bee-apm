import { useState, useMemo, useEffect, useCallback } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Cpu, RefreshCw, Download, Trash2, Upload, Zap, Package, Settings, X, CheckCircle, Plus, Edit, Power, Clock, Activity, HardDrive, Wifi, BarChart3, Terminal, AlertCircle, TrendingUp, Shield, SlidersHorizontal, History, LayoutDashboard, BellRing, Lightbulb, Network, AlertTriangle, Building2, Award, Bug, Database, GitBranch, MessageSquare, Container, Globe, Hexagon, Cloud, Key, Layers, UserCheck, FileKey } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { SearchBar, Pagination } from "@/components/business";
import { agentsApi, agentManagementApi } from "../services/api";

// 数据缓存工具类
class DataCache<T> {
  private cache: Map<string, { data: T; timestamp: number }> = new Map();
  private defaultTTL: number = 60000; // 默认缓存时间 1分钟

  set(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, { data, timestamp: Date.now() + ttl });
  }

  get(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.timestamp) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  setTTL(ttl: number): void {
    this.defaultTTL = ttl;
  }
}

// 全局数据缓存实例
const agentCache = new DataCache<any>();
const metricsCache = new DataCache<any>();
const configCache = new DataCache<any>();

interface Agent {
  id: number;
  host: string;
  app: string;
  version: string;
  status: "online" | "warning" | "offline";
  os: string;
  plugins: number;
  lastHb: string;
  connected: boolean;
}

interface Plugin {
  id: number;
  name: string;
  version: string;
  status: "online" | "warning" | "offline";
  desc: string;
  loaded: boolean;
  enabled: boolean;
}

interface MarketPlugin {
  name: string;
  desc: string;
  hot: boolean;
}

interface AgentConfig {
  id: number;
  configKey: string;
  configValue: string;
  description: string;
  configType: string;
  isOverridden: boolean;
}

interface AgentCommand {
  id: number;
  commandType: string;
  status: string;
  resultData?: string;
  errorMessage?: string;
  executedAt?: string;
  createdAt: string;
}

export default function AgentControl() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"list" | "plugins" | "config" | "market" | "commands">("list");
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [plugins, setPlugins] = useState<Plugin[]>([]);
  const [configs, setConfigs] = useState<AgentConfig[]>([]);
  const [commands, setCommands] = useState<AgentCommand[]>([]);
  const [marketPlugins, setMarketPlugins] = useState<MarketPlugin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgents, setSelectedAgents] = useState<Set<number>>(new Set());
  const [batchOperationProgress, setBatchOperationProgress] = useState<number | null>(null);
  const [batchOperationResult, setBatchOperationResult] = useState<{ success: number; failed: number } | null>(null);
  const [editingConfigId, setEditingConfigId] = useState<number | null>(null);
  const [editingConfigValue, setEditingConfigValue] = useState("");
  const [agentMetrics, setAgentMetrics] = useState<any>(null);
  const [agentLogs, setAgentLogs] = useState<any[]>([]);
  const [logLevelFilter, setLogLevelFilter] = useState<string>("all");
  const [performanceHistory, setPerformanceHistory] = useState<any[]>([]);
  const [showPerformanceChart, setShowPerformanceChart] = useState(false);
  const [agentHeartbeat, setAgentHeartbeat] = useState<Record<number, { lastTime: string; status: string; latency: number }>>({});
  const [agentGroups, setAgentGroups] = useState<{ id: number; name: string; color: string; agentIds: number[] }[]>([
    { id: 1, name: "生产环境", color: "#FF4D4F", agentIds: [1, 2, 3] },
    { id: 2, name: "预发环境", color: "#FFAA00", agentIds: [4, 5] },
    { id: 3, name: "测试环境", color: "#165DFF", agentIds: [6, 7, 8] },
  ]);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [agentHealthScores, setAgentHealthScores] = useState<Record<number, {
    score: number;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
    plugins: number;
    status: "healthy" | "warning" | "critical";
  }>>({});
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugOutput, setDebugOutput] = useState<string>("");
  const [debugCommand, setDebugCommand] = useState("");
  const [autoScaleRules, setAutoScaleRules] = useState<{
    enabled: boolean;
    minAgents: number;
    maxAgents: number;
    rules: Array<{
      id: number;
      metric: string;
      condition: string;
      threshold: number;
      action: "scale_up" | "scale_down";
      cooldown: number;
    }>;
  }>({
    enabled: false,
    minAgents: 2,
    maxAgents: 10,
    rules: [
      { id: 1, metric: "CPU使用率", condition: ">", threshold: 80, action: "scale_up", cooldown: 5 },
      { id: 2, metric: "CPU使用率", condition: "<", threshold: 30, action: "scale_down", cooldown: 10 },
      { id: 3, metric: "内存使用率", condition: ">", threshold: 85, action: "scale_up", cooldown: 5 },
      { id: 4, metric: "请求延迟", condition: ">", threshold: 500, action: "scale_up", cooldown: 3 },
    ],
  });
  const [showAutoScaleModal, setShowAutoScaleModal] = useState(false);
  const [trafficMirroring, setTrafficMirroring] = useState<{
    enabled: boolean;
    rules: Array<{
      id: number;
      name: string;
      sourceAgent: string;
      targetAgent: string;
      percentage: number;
      status: "active" | "paused" | "stopped";
    }>;
  }>({
    enabled: true,
    rules: [
      { id: 1, name: "生产到预发", sourceAgent: "prod-agent-1", targetAgent: "staging-agent-1", percentage: 10, status: "active" },
      { id: 2, name: "流量复制测试", sourceAgent: "prod-agent-2", targetAgent: "test-agent-1", percentage: 5, status: "paused" },
    ],
  });
  const [showTrafficMirrorModal, setShowTrafficMirrorModal] = useState(false);
  const [capacityPlanning, setCapacityPlanning] = useState<{
    currentCapacity: number;
    predictedCapacity: number;
    utilizationRate: number;
    growthRate: number;
    prediction: Array<{
      date: string;
      predicted: number;
      actual?: number;
    }>;
  }>({
    currentCapacity: 68,
    predictedCapacity: 85,
    utilizationRate: 72,
    growthRate: 15,
    prediction: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() + i * 86400000).toLocaleDateString("zh-CN"),
      predicted: 60 + Math.random() * 30,
      actual: i < 7 ? 60 + Math.random() * 20 : undefined,
    })),
  });
  const [showCapacityModal, setShowCapacityModal] = useState(false);
  const [backupList, setBackupList] = useState<Array<{
    id: number;
    name: string;
    agentId: number;
    size: string;
    createdAt: string;
    status: "completed" | "in_progress" | "failed";
  }>>([
    { id: 1, name: "config-backup-2024-01-15", agentId: 1, size: "125MB", createdAt: "2024-01-15 10:30:00", status: "completed" },
    { id: 2, name: "config-backup-2024-01-10", agentId: 1, size: "120MB", createdAt: "2024-01-10 09:15:00", status: "completed" },
    { id: 3, name: "config-backup-2024-01-05", agentId: 2, size: "118MB", createdAt: "2024-01-05 14:20:00", status: "completed" },
  ]);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [performanceBaseline, setPerformanceBaseline] = useState<{
    enabled: boolean;
    baselines: Array<{
      id: number;
      name: string;
      metric: string;
      baselineValue: number;
      upperThreshold: number;
      lowerThreshold: number;
      lastUpdated: string;
    }>;
  }>({
    enabled: true,
    baselines: [
      { id: 1, name: "CPU基线", metric: "cpu", baselineValue: 45, upperThreshold: 80, lowerThreshold: 20, lastUpdated: "2024-01-15" },
      { id: 2, name: "内存基线", metric: "memory", baselineValue: 65, upperThreshold: 85, lowerThreshold: 30, lastUpdated: "2024-01-15" },
      { id: 3, name: "响应时间基线", metric: "responseTime", baselineValue: 120, upperThreshold: 200, lowerThreshold: 50, lastUpdated: "2024-01-14" },
      { id: 4, name: "错误率基线", metric: "errorRate", baselineValue: 0.5, upperThreshold: 2, lowerThreshold: 0, lastUpdated: "2024-01-15" },
    ],
  });
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [optimizationSuggestions, setOptimizationSuggestions] = useState<Array<{
    id: number;
    type: "critical" | "warning" | "info";
    title: string;
    description: string;
    suggestion: string;
    impact: string;
    metric: string;
    currentValue: number;
    recommendedValue: number;
    status: "pending" | "in_progress" | "completed" | "dismissed";
  }>>([
    { id: 1, type: "critical", title: "内存使用率过高", description: "当前内存使用率达到85%，超过警戒线", suggestion: "建议增加堆内存配置或优化内存使用", impact: "高", metric: "memory", currentValue: 85, recommendedValue: 70, status: "pending" },
    { id: 2, type: "warning", title: "GC频率过高", description: "最近1小时GC次数达到23次", suggestion: "建议调整GC参数或优化对象创建", impact: "中", metric: "gc", currentValue: 23, recommendedValue: 10, status: "pending" },
    { id: 3, type: "warning", title: "响应时间偏高", description: "P95响应时间达到180ms", suggestion: "建议优化慢查询或增加资源", impact: "中", metric: "responseTime", currentValue: 180, recommendedValue: 150, status: "pending" },
    { id: 4, type: "info", title: "线程池使用率偏高", description: "线程池使用率达到78%", suggestion: "建议增加线程池大小", impact: "低", metric: "threadPool", currentValue: 78, recommendedValue: 70, status: "pending" },
    { id: 5, type: "info", title: "连接池等待时间增加", description: "数据库连接池等待时间增加20%", suggestion: "建议增加连接池大小", impact: "低", metric: "connectionPool", currentValue: 20, recommendedValue: 10, status: "completed" },
  ]);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState<Array<{
    id: number;
    timestamp: string;
    action: string;
    target: string;
    operator: string;
    ipAddress: string;
    result: "success" | "failed";
    details: string;
  }>>([
    { id: 1, timestamp: "2024-01-15 10:35:23", action: "插件安装", target: "mysql-plugin", operator: "admin", ipAddress: "192.168.1.100", result: "success", details: "安装 MySQL 监控插件 v2.1.0" },
    { id: 2, timestamp: "2024-01-15 10:32:15", action: "配置修改", target: "agent-config", operator: "admin", ipAddress: "192.168.1.100", result: "success", details: "修改采样率为 10%" },
    { id: 3, timestamp: "2024-01-15 10:28:45", action: "命令执行", target: "hot-reload", operator: "dev-user", ipAddress: "192.168.1.105", result: "success", details: "执行热加载命令" },
    { id: 4, timestamp: "2024-01-15 10:15:30", action: "登录", target: "system", operator: "admin", ipAddress: "192.168.1.100", result: "success", details: "管理员登录系统" },
    { id: 5, timestamp: "2024-01-15 09:45:12", action: "插件卸载", target: "redis-plugin", operator: "dev-user", ipAddress: "192.168.1.105", result: "failed", details: "权限不足，无法卸载插件" },
  ]);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [resourceQuotas, setResourceQuotas] = useState<{
    enabled: boolean;
    quotas: Array<{
      id: number;
      name: string;
      type: "cpu" | "memory" | "disk" | "network";
      limit: number;
      unit: string;
      currentUsage: number;
      enforced: boolean;
      warningThreshold: number;
    }>;
  }>({
    enabled: true,
    quotas: [
      { id: 1, name: "CPU配额", type: "cpu", limit: 4, unit: "核", currentUsage: 2.5, enforced: true, warningThreshold: 80 },
      { id: 2, name: "内存配额", type: "memory", limit: 8, unit: "GB", currentUsage: 5.2, enforced: true, warningThreshold: 85 },
      { id: 3, name: "磁盘配额", type: "disk", limit: 100, unit: "GB", currentUsage: 45, enforced: true, warningThreshold: 90 },
      { id: 4, name: "网络带宽", type: "network", limit: 100, unit: "Mbps", currentUsage: 35, enforced: false, warningThreshold: 85 },
    ],
  });
  const [showQuotaModal, setShowQuotaModal] = useState(false);
  const [changeHistory, setChangeHistory] = useState<Array<{
    id: number;
    timestamp: string;
    changeType: "plugin" | "config" | "command" | "quota" | "baseline";
    changeTitle: string;
    description: string;
    beforeValue?: string;
    afterValue?: string;
    operator: string;
    status: "applied" | "pending" | "rolled_back";
    rollbackAvailable: boolean;
  }>>([
    { id: 1, timestamp: "2024-01-15 10:35:23", changeType: "plugin", changeTitle: "插件安装", description: "安装 MySQL 监控插件 v2.1.0", operator: "admin", status: "applied", rollbackAvailable: true },
    { id: 2, timestamp: "2024-01-15 10:32:15", changeType: "config", changeTitle: "配置修改", description: "修改采样率", beforeValue: "5%", afterValue: "10%", operator: "admin", status: "applied", rollbackAvailable: true },
    { id: 3, timestamp: "2024-01-15 10:28:45", changeType: "command", changeTitle: "热加载", description: "执行插件热加载命令", operator: "dev-user", status: "applied", rollbackAvailable: false },
    { id: 4, timestamp: "2024-01-15 09:50:30", changeType: "quota", changeTitle: "配额调整", description: "调整内存配额", beforeValue: "6GB", afterValue: "8GB", operator: "admin", status: "applied", rollbackAvailable: true },
    { id: 5, timestamp: "2024-01-15 09:30:00", changeType: "baseline", changeTitle: "基线更新", description: "更新 CPU 性能基线", beforeValue: "40%", afterValue: "45%", operator: "admin", status: "applied", rollbackAvailable: true },
  ]);
  const [showChangeHistoryModal, setShowChangeHistoryModal] = useState(false);
  const [historicalReports, setHistoricalReports] = useState<Array<{
    id: number;
    name: string;
    reportType: "daily" | "weekly" | "monthly" | "custom";
    period: string;
    generatedAt: string;
    status: "generated" | "generating" | "failed";
    data: {
      totalRequests: number;
      avgResponseTime: number;
      errorRate: number;
      cpuUsage: number;
      memoryUsage: number;
      peakTime: string;
    };
  }>>([
    { id: 1, name: "每日报告 - 2024-01-15", reportType: "daily", period: "2024-01-15", generatedAt: "2024-01-15 00:05:00", status: "generated", data: { totalRequests: 125634, avgResponseTime: 125, errorRate: 0.3, cpuUsage: 42, memoryUsage: 65, peakTime: "14:30" } },
    { id: 2, name: "周报 - 第2周", reportType: "weekly", period: "2024-01-08 ~ 2024-01-14", generatedAt: "2024-01-14 23:55:00", status: "generated", data: { totalRequests: 892345, avgResponseTime: 132, errorRate: 0.4, cpuUsage: 45, memoryUsage: 68, peakTime: "15:00" } },
    { id: 3, name: "月报 - 2024年1月", reportType: "monthly", period: "2024-01-01 ~ 2024-01-31", generatedAt: "2024-01-31 23:59:00", status: "generating", data: { totalRequests: 0, avgResponseTime: 0, errorRate: 0, cpuUsage: 0, memoryUsage: 0, peakTime: "" } },
  ]);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [customDashboards, setCustomDashboards] = useState<Array<{
    id: number;
    name: string;
    description: string;
    widgets: Array<{
      id: number;
      type: "chart" | "metric" | "table" | "gauge";
      title: string;
      metric: string;
      position: { x: number; y: number; w: number; h: number };
    }>;
    isDefault: boolean;
    lastModified: string;
  }>>([
    {
      id: 1,
      name: "默认仪表盘",
      description: "系统默认监控仪表盘",
      widgets: [
        { id: 1, type: "gauge", title: "CPU使用率", metric: "cpu", position: { x: 0, y: 0, w: 2, h: 2 } },
        { id: 2, type: "gauge", title: "内存使用率", metric: "memory", position: { x: 2, y: 0, w: 2, h: 2 } },
        { id: 3, type: "chart", title: "响应时间趋势", metric: "responseTime", position: { x: 0, y: 2, w: 4, h: 3 } },
        { id: 4, type: "table", title: "插件状态", metric: "plugins", position: { x: 0, y: 5, w: 4, h: 2 } },
      ],
      isDefault: true,
      lastModified: "2024-01-15 10:00:00",
    },
    {
      id: 2,
      name: "性能分析仪表盘",
      description: "专注于性能指标分析",
      widgets: [
        { id: 5, type: "chart", title: "CPU趋势", metric: "cpuTrend", position: { x: 0, y: 0, w: 4, h: 3 } },
        { id: 6, type: "chart", title: "内存趋势", metric: "memoryTrend", position: { x: 0, y: 3, w: 4, h: 3 } },
        { id: 7, type: "metric", title: "活跃连接数", metric: "connections", position: { x: 0, y: 6, w: 2, h: 1 } },
        { id: 8, type: "metric", title: "QPS", metric: "qps", position: { x: 2, y: 6, w: 2, h: 1 } },
      ],
      isDefault: false,
      lastModified: "2024-01-14 15:30:00",
    },
  ]);
  const [showDashboardModal, setShowDashboardModal] = useState(false);
  const [smartAlertPolicies, setSmartAlertPolicies] = useState<Array<{
    id: number;
    name: string;
    description: string;
    type: "anomaly" | "threshold" | "trend" | "composite";
    severity: "critical" | "warning" | "info";
    enabled: boolean;
    autoAdjust: boolean;
    sensitivity: number;
    conditions: Array<{
      metric: string;
      operator: string;
      value: number;
      window: string;
    }>;
    lastTriggered?: string;
    triggerCount: number;
  }>>([
    {
      id: 1,
      name: "CPU异常检测",
      description: "基于机器学习的CPU异常检测",
      type: "anomaly",
      severity: "critical",
      enabled: true,
      autoAdjust: true,
      sensitivity: 80,
      conditions: [{ metric: "cpu", operator: "anomaly", value: 3, window: "5m" }],
      lastTriggered: "2024-01-15 09:30:00",
      triggerCount: 5,
    },
    {
      id: 2,
      name: "内存阈值告警",
      description: "内存使用率超过85%时告警",
      type: "threshold",
      severity: "warning",
      enabled: true,
      autoAdjust: false,
      sensitivity: 50,
      conditions: [{ metric: "memory", operator: ">", value: 85, window: "1m" }],
      lastTriggered: "2024-01-14 16:45:00",
      triggerCount: 12,
    },
    {
      id: 3,
      name: "响应时间趋势",
      description: "响应时间持续上升趋势检测",
      type: "trend",
      severity: "warning",
      enabled: true,
      autoAdjust: true,
      sensitivity: 70,
      conditions: [{ metric: "responseTime", operator: "trendUp", value: 20, window: "10m" }],
      lastTriggered: "2024-01-15 10:00:00",
      triggerCount: 3,
    },
    {
      id: 4,
      name: "复合健康告警",
      description: "多指标综合健康评估",
      type: "composite",
      severity: "critical",
      enabled: true,
      autoAdjust: true,
      sensitivity: 60,
      conditions: [
        { metric: "cpu", operator: ">", value: 90, window: "1m" },
        { metric: "memory", operator: ">", value: 85, window: "1m" },
      ],
      triggerCount: 0,
    },
  ]);
  const [showAlertPoliciesModal, setShowAlertPoliciesModal] = useState(false);
  
  // 批量导入导出和模板管理
  const [importExportModal, setImportExportModal] = useState(false);
  const [templateList, setTemplateList] = useState<Array<{
    id: number;
    name: string;
    description: string;
    type: "agent" | "plugin" | "config" | "alert";
    createdAt: string;
    updatedAt: string;
    usageCount: number;
  }>>([
    { id: 1, name: "标准Agent配置模板", description: "包含常用插件和配置", type: "agent", createdAt: "2024-01-10", updatedAt: "2024-01-15", usageCount: 25 },
    { id: 2, name: "MySQL监控插件集", description: "MySQL性能监控插件组合", type: "plugin", createdAt: "2024-01-08", updatedAt: "2024-01-12", usageCount: 18 },
    { id: 3, name: "生产环境配置", description: "生产环境标准配置", type: "config", createdAt: "2024-01-05", updatedAt: "2024-01-14", usageCount: 12 },
    { id: 4, name: "告警规则模板", description: "常见告警规则集", type: "alert", createdAt: "2024-01-03", updatedAt: "2024-01-10", usageCount: 30 },
  ]);
  const [agentTags, setAgentTags] = useState<Array<{
    id: number;
    name: string;
    color: string;
    agentCount: number;
  }>>([
    { id: 1, name: "生产环境", color: "#FF4D4F", agentCount: 15 },
    { id: 2, name: "测试环境", color: "#165DFF", agentCount: 8 },
    { id: 3, name: "开发环境", color: "#00D68F", agentCount: 5 },
    { id: 4, name: "高可用", color: "#FFAA00", agentCount: 10 },
    { id: 5, name: "核心服务", color: "#A855F7", agentCount: 12 },
  ]);
  const [scheduledTasks, setScheduledTasks] = useState<Array<{
    id: number;
    name: string;
    type: "backup" | "upgrade" | "report" | "cleanup";
    cron: string;
    nextRun: string;
    lastRun?: string;
    status: "active" | "paused" | "failed";
    targetAgents: string[];
  }>>([
    { id: 1, name: "每日配置备份", type: "backup", cron: "0 2 * * *", nextRun: "明天 02:00", lastRun: "今天 02:00", status: "active", targetAgents: ["prod-agent-1", "prod-agent-2"] },
    { id: 2, name: "周版本检查", type: "upgrade", cron: "0 10 * * 1", nextRun: "周一 10:00", lastRun: "周一 10:00", status: "active", targetAgents: ["all"] },
    { id: 3, name: "性能周报", type: "report", cron: "0 9 * * 1", nextRun: "周一 09:00", lastRun: "周一 09:00", status: "active", targetAgents: ["all"] },
    { id: 4, name: "日志清理", type: "cleanup", cron: "0 3 * * *", nextRun: "明天 03:00", lastRun: "今天 03:00", status: "paused", targetAgents: ["dev-agent-1", "dev-agent-2"] },
  ]);
  const [showScheduledTasksModal, setShowScheduledTasksModal] = useState(false);
  const [notificationChannels, setNotificationChannels] = useState<Array<{
    id: number;
    name: string;
    type: "email" | "webhook" | "dingtalk" | "feishu";
    enabled: boolean;
    config: Record<string, any>;
    lastNotification?: string;
  }>>([
    { id: 1, name: "运维邮件组", type: "email", enabled: true, config: { recipients: ["ops@company.com"], smtp: "smtp.company.com" }, lastNotification: "2024-01-15 10:30:00" },
    { id: 2, name: "告警Webhook", type: "webhook", enabled: true, config: { url: "https://alert.company.com/webhook", method: "POST" } },
    { id: 3, name: "钉钉群通知", type: "dingtalk", enabled: true, config: { webhook: "https://oapi.dingtalk.com/robot/send?access_token=xxx" }, lastNotification: "2024-01-15 09:15:00" },
    { id: 4, name: "飞书群通知", type: "feishu", enabled: false, config: { webhook: "https://open.feishu.cn/open-apis/bot/v2/hook/xxx" } },
  ]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [agentEnvironments, setAgentEnvironments] = useState<Array<{
    id: number;
    name: string;
    description: string;
    agentCount: number;
    color: string;
  }>>([
    { id: 1, name: "生产环境", description: "生产服务器集群", agentCount: 25, color: "#FF4D4F" },
    { id: 2, name: "预发布环境", description: "预发布测试集群", agentCount: 8, color: "#FFAA00" },
    { id: 3, name: "测试环境", description: "测试服务器集群", agentCount: 12, color: "#165DFF" },
    { id: 4, name: "开发环境", description: "开发环境集群", agentCount: 5, color: "#00D68F" },
  ]);
  const [showEnvironmentsModal, setShowEnvironmentsModal] = useState(false);
  
  // 性能对比和报表导出
  const [performanceComparison, setPerformanceComparison] = useState<{
    enabled: boolean;
    agents: Array<{
      id: number;
      host: string;
      metrics: {
        cpu: number;
        memory: number;
        disk: number;
        network: number;
      };
    }>;
  }>({
    enabled: false,
    agents: [
      { id: 1, host: "192.168.1.10", metrics: { cpu: 45, memory: 62, disk: 38, network: 75 } },
      { id: 2, host: "192.168.1.11", metrics: { cpu: 52, memory: 58, disk: 42, network: 68 } },
      { id: 3, host: "192.168.1.12", metrics: { cpu: 38, memory: 71, disk: 35, network: 82 } },
    ],
  });
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [reportExportModal, setReportExportModal] = useState(false);
  
  // WebSocket实时通信状态
  const [websocketStatus, setWebsocketStatus] = useState<{
    connected: boolean;
    lastHeartbeat: string;
    messageCount: number;
    reconnectAttempts: number;
  }>({
    connected: true,
    lastHeartbeat: new Date().toLocaleTimeString(),
    messageCount: 0,
    reconnectAttempts: 0,
  });
  
  // 模拟实时性能对比数据
  const mockComparisonData = useCallback(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      agent1: 30 + Math.random() * 30 + Math.sin(i / 4) * 15,
      agent2: 35 + Math.random() * 25 + Math.cos(i / 4) * 10,
      agent3: 40 + Math.random() * 20 + Math.sin(i / 6) * 12,
    }));
  }, []);
  
  const [comparisonHistory, setComparisonHistory] = useState(mockComparisonData());
  
  // 高级性能指标
  const [advancedMetrics, setAdvancedMetrics] = useState<{
    ioStats: Array<{ time: string; read: number; write: number }>;
    tcpConnections: Array<{ time: string; established: number; timeWait: number; closeWait: number }>;
    processStats: Array<{ time: string; threads: number; files: number; sockets: number }>;
  }>({
    ioStats: Array.from({ length: 30 }, (_, i) => ({
      time: `${i}:00`,
      read: 50 + Math.random() * 100,
      write: 30 + Math.random() * 80,
    })),
    tcpConnections: Array.from({ length: 30 }, (_, i) => ({
      time: `${i}:00`,
      established: 100 + Math.random() * 50,
      timeWait: 20 + Math.random() * 30,
      closeWait: 5 + Math.random() * 15,
    })),
    processStats: Array.from({ length: 30 }, (_, i) => ({
      time: `${i}:00`,
      threads: 200 + Math.random() * 100,
      files: 1000 + Math.random() * 500,
      sockets: 150 + Math.random() * 80,
    })),
  });
  
  // Agent依赖关系
  const [agentDependencies, setAgentDependencies] = useState<Array<{
    id: number;
    source: string;
    target: string;
    type: "calls" | "uses" | "monitored_by";
    latency?: number;
  }>>([
    { id: 1, source: "gateway-agent", target: "order-agent", type: "calls", latency: 15 },
    { id: 2, source: "gateway-agent", target: "user-agent", type: "calls", latency: 12 },
    { id: 3, source: "order-agent", target: "payment-agent", type: "calls", latency: 45 },
    { id: 4, source: "order-agent", target: "inventory-agent", type: "calls", latency: 28 },
    { id: 5, source: "user-agent", target: "mysql-agent", type: "uses", latency: 8 },
    { id: 6, source: "order-agent", target: "redis-agent", type: "uses", latency: 2 },
    { id: 7, source: "monitoring-agent", target: "gateway-agent", type: "monitored_by" },
    { id: 8, source: "monitoring-agent", target: "order-agent", type: "monitored_by" },
  ]);
  
  // 故障注入配置
  const [faultInjectionConfig, setFaultInjectionConfig] = useState<{
    enabled: boolean;
    rules: Array<{
      id: number;
      name: string;
      type: "delay" | "error" | "timeout" | "exception";
      targetAgent: string;
      probability: number;
      duration: number;
      enabled: boolean;
    }>;
  }>({
    enabled: false,
    rules: [
      { id: 1, name: "网络延迟注入", type: "delay", targetAgent: "order-agent", probability: 10, duration: 5000, enabled: false },
      { id: 2, name: "随机错误注入", type: "error", targetAgent: "payment-agent", probability: 5, duration: 10000, enabled: false },
      { id: 3, name: "超时模拟", type: "timeout", targetAgent: "user-agent", probability: 3, duration: 30000, enabled: false },
    ],
  });
  const [showFaultInjectionModal, setShowFaultInjectionModal] = useState(false);
  
  // AIOps智能分析
  const [aiAnalysis, setAiAnalysis] = useState<{
    anomalyDetection: boolean;
    rootCauseAnalysis: boolean;
    capacityPrediction: boolean;
    insights: Array<{
      id: number;
      type: "anomaly" | "insight" | "recommendation";
      title: string;
      description: string;
      confidence: number;
      timestamp: string;
    }>;
  }>({
    anomalyDetection: true,
    rootCauseAnalysis: true,
    capacityPrediction: true,
    insights: [
      { id: 1, type: "anomaly", title: "检测到异常流量模式", description: "order-agent在过去10分钟内请求量突增150%", confidence: 92, timestamp: "2024-01-15 10:35:00" },
      { id: 2, type: "insight", title: "性能瓶颈识别", description: "payment-agent与数据库的连接延迟较高，建议优化SQL查询", confidence: 85, timestamp: "2024-01-15 10:30:00" },
      { id: 3, type: "recommendation", title: "容量扩展建议", description: "基于当前增长趋势，建议在3天内扩容20%以应对即将到来的促销活动", confidence: 88, timestamp: "2024-01-15 10:25:00" },
      { id: 4, type: "insight", title: "资源利用率优化", description: "dev-agent的CPU利用率持续低于20%，建议缩减资源配置以降低成本", confidence: 90, timestamp: "2024-01-15 10:20:00" },
    ],
  });
  const [showAiAnalysisModal, setShowAiAnalysisModal] = useState(false);
  
  // 运维知识库
  const [knowledgeBase, setKnowledgeBase] = useState<Array<{
    id: number;
    title: string;
    category: string;
    tags: string[];
    viewCount: number;
    updatedAt: string;
  }>>([
    { id: 1, title: "Agent安装部署最佳实践", category: "运维指南", tags: ["部署", "最佳实践"], viewCount: 1250, updatedAt: "2024-01-10" },
    { id: 2, title: "JVM性能调优手册", category: "性能优化", tags: ["JVM", "调优"], viewCount: 980, updatedAt: "2024-01-08" },
    { id: 3, title: "常见问题排查流程", category: "故障处理", tags: ["排查", "流程"], viewCount: 1560, updatedAt: "2024-01-12" },
    { id: 4, title: "插件开发指南", category: "开发文档", tags: ["插件", "开发"], viewCount: 450, updatedAt: "2024-01-05" },
  ]);
  const [showKnowledgeBaseModal, setShowKnowledgeBaseModal] = useState(false);
  
  // Agent监控策略配置
  const [monitoringPolicies, setMonitoringPolicies] = useState<Array<{
    id: number;
    name: string;
    description: string;
    interval: number;
    metrics: Array<{
      name: string;
      enabled: boolean;
      retention: string;
    }>;
    alerts: Array<{
      metric: string;
      condition: string;
      threshold: number;
      severity: string;
    }>;
    enabled: boolean;
    appliedAgents: number;
  }>>([
    {
      id: 1,
      name: "生产环境监控策略",
      description: "生产环境高频率监控配置",
      interval: 10,
      metrics: [
        { name: "cpu", enabled: true, retention: "30d" },
        { name: "memory", enabled: true, retention: "30d" },
        { name: "disk", enabled: true, retention: "90d" },
        { name: "network", enabled: true, retention: "30d" },
      ],
      alerts: [
        { metric: "cpu", condition: ">", threshold: 90, severity: "critical" },
        { metric: "memory", condition: ">", threshold: 85, severity: "warning" },
      ],
      enabled: true,
      appliedAgents: 25,
    },
    {
      id: 2,
      name: "测试环境监控策略",
      description: "测试环境低频率监控配置",
      interval: 60,
      metrics: [
        { name: "cpu", enabled: true, retention: "7d" },
        { name: "memory", enabled: true, retention: "7d" },
      ],
      alerts: [],
      enabled: true,
      appliedAgents: 12,
    },
    {
      id: 3,
      name: "开发环境监控策略",
      description: "开发环境基础监控配置",
      interval: 120,
      metrics: [
        { name: "cpu", enabled: true, retention: "3d" },
        { name: "memory", enabled: true, retention: "3d" },
      ],
      alerts: [],
      enabled: false,
      appliedAgents: 5,
    },
  ]);
  const [showMonitoringPoliciesModal, setShowMonitoringPoliciesModal] = useState(false);
  
  // 性能基准测试
  const [performanceBenchmarks, setPerformanceBenchmarks] = useState<Array<{
    id: number;
    name: string;
    type: "load" | "stress" | "soak" | "spike";
    status: "idle" | "running" | "completed" | "failed";
    duration: number;
    targetAgent: string;
    results?: {
      avgResponseTime: number;
      maxResponseTime: number;
      requestsPerSecond: number;
      errorRate: number;
      throughput: number;
    };
    createdAt: string;
    completedAt?: string;
  }>>([
    {
      id: 1,
      name: "订单服务负载测试",
      type: "load",
      status: "completed",
      duration: 3600,
      targetAgent: "order-agent",
      results: {
        avgResponseTime: 125,
        maxResponseTime: 500,
        requestsPerSecond: 250,
        errorRate: 0.5,
        throughput: 50000,
      },
      createdAt: "2024-01-14 10:00:00",
      completedAt: "2024-01-14 11:00:00",
    },
    {
      id: 2,
      name: "支付服务压力测试",
      type: "stress",
      status: "running",
      duration: 1800,
      targetAgent: "payment-agent",
      createdAt: "2024-01-15 09:00:00",
    },
  ]);
  const [showBenchmarksModal, setShowBenchmarksModal] = useState(false);
  
  // 灰度发布配置
  const [canaryReleases, setCanaryReleases] = useState<Array<{
    id: number;
    name: string;
    version: string;
    targetAgents: string[];
    canaryAgents: string[];
    canaryPercentage: number;
    status: "planning" | "running" | "paused" | "completed" | "rolledback";
    progress: number;
    healthCheck: {
      metric: string;
      threshold: number;
    };
    rolloutPolicy: "linear" | "exponential" | "custom";
    createdAt: string;
    updatedAt: string;
  }>>([
    {
      id: 1,
      name: "Agent v2.1.0 灰度发布",
      version: "v2.1.0",
      targetAgents: ["order-agent", "payment-agent", "user-agent"],
      canaryAgents: ["order-agent"],
      canaryPercentage: 10,
      status: "running",
      progress: 35,
      healthCheck: {
        metric: "errorRate",
        threshold: 2.0,
      },
      rolloutPolicy: "linear",
      createdAt: "2024-01-15 08:00:00",
      updatedAt: "2024-01-15 10:30:00",
    },
    {
      id: 2,
      name: "Agent v2.0.5 灰度发布",
      version: "v2.0.5",
      targetAgents: ["gateway-agent", "user-agent"],
      canaryAgents: ["gateway-agent"],
      canaryPercentage: 5,
      status: "completed",
      progress: 100,
      healthCheck: {
        metric: "errorRate",
        threshold: 1.0,
      },
      rolloutPolicy: "exponential",
      createdAt: "2024-01-10 10:00:00",
      updatedAt: "2024-01-11 15:00:00",
    },
  ]);
  const [showCanaryModal, setShowCanaryModal] = useState(false);
  
  // 成本分析和优化
  const [costAnalysis, setCostAnalysis] = useState<{
    totalCost: number;
    costByAgent: Array<{
      id: number;
      name: string;
      cpuCost: number;
      memoryCost: number;
      networkCost: number;
      storageCost: number;
      total: number;
    }>;
    optimizationSuggestions: Array<{
      id: number;
      type: "savings" | "performance";
      description: string;
      estimatedSavings: number;
      priority: "high" | "medium" | "low";
    }>;
    costTrend: Array<{
      date: string;
      cost: number;
    }>;
  }>({
    totalCost: 12500.50,
    costByAgent: [
      { id: 1, name: "gateway-agent", cpuCost: 450, memoryCost: 320, networkCost: 180, storageCost: 80, total: 1030 },
      { id: 2, name: "order-agent", cpuCost: 680, memoryCost: 420, networkCost: 220, storageCost: 120, total: 1440 },
      { id: 3, name: "payment-agent", cpuCost: 520, memoryCost: 380, networkCost: 190, storageCost: 95, total: 1185 },
    ],
    optimizationSuggestions: [
      { id: 1, type: "savings", description: "dev-agent的CPU利用率持续低于20%，建议降级为更小的配置", estimatedSavings: 120, priority: "high" },
      { id: 2, type: "savings", description: "合并闲置的测试环境Agent，减少资源浪费", estimatedSavings: 250, priority: "medium" },
      { id: 3, type: "performance", description: "payment-agent的内存配置接近上限，建议适当扩容以避免性能问题", estimatedSavings: 0, priority: "high" },
    ],
    costTrend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 86400000).toLocaleDateString("zh-CN"),
      cost: 11500 + Math.random() * 2000,
    })),
  });
  const [showCostAnalysisModal, setShowCostAnalysisModal] = useState(false);
  
  // 审计报告
  const [auditReports, setAuditReports] = useState<Array<{
    id: number;
    name: string;
    type: "daily" | "weekly" | "monthly" | "custom";
    period: string;
    status: "generated" | "generating" | "failed";
    metrics: {
      totalOperations: number;
      successfulOperations: number;
      failedOperations: number;
      criticalAlerts: number;
      agentChanges: number;
      configurationChanges: number;
    };
    generatedAt: string;
  }>>([
    {
      id: 1,
      name: "2024年1月15日审计报告",
      type: "daily",
      period: "2024-01-15",
      status: "generated",
      metrics: {
        totalOperations: 1250,
        successfulOperations: 1235,
        failedOperations: 15,
        criticalAlerts: 5,
        agentChanges: 8,
        configurationChanges: 12,
      },
      generatedAt: "2024-01-16 00:05:00",
    },
    {
      id: 2,
      name: "2024年1月审计周报",
      type: "weekly",
      period: "2024-01-08 ~ 2024-01-14",
      status: "generated",
      metrics: {
        totalOperations: 8950,
        successfulOperations: 8820,
        failedOperations: 130,
        criticalAlerts: 35,
        agentChanges: 25,
        configurationChanges: 48,
      },
      generatedAt: "2024-01-15 00:10:00",
    },
  ]);
  const [showAuditReportsModal, setShowAuditReportsModal] = useState(false);
  
  // API限流配置
  const [rateLimitConfig, setRateLimitConfig] = useState<{
    globalLimit: number;
    rules: Array<{
      id: number;
      endpoint: string;
      limit: number;
      window: string;
      burstLimit: number;
      enabled: boolean;
    }>;
  }>({
    globalLimit: 1000,
    rules: [
      { id: 1, endpoint: "/api/v1/orders", limit: 500, window: "1m", burstLimit: 100, enabled: true },
      { id: 2, endpoint: "/api/v1/payments", limit: 200, window: "1m", burstLimit: 50, enabled: true },
      { id: 3, endpoint: "/api/v1/users", limit: 800, window: "1m", burstLimit: 150, enabled: false },
    ],
  });
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  
  // 服务熔断配置
  const [circuitBreakerConfig, setCircuitBreakerConfig] = useState<{
    services: Array<{
      id: number;
      name: string;
      failureThreshold: number;
      successThreshold: number;
      timeout: number;
      fallback: string;
      enabled: boolean;
      status: "closed" | "open" | "half-open";
    }>;
  }>({
    services: [
      { id: 1, name: "payment-service", failureThreshold: 5, successThreshold: 2, timeout: 30000, fallback: "retry-later", enabled: true, status: "closed" },
      { id: 2, name: "inventory-service", failureThreshold: 3, successThreshold: 3, timeout: 60000, fallback: "cache", enabled: true, status: "closed" },
      { id: 3, name: "email-service", failureThreshold: 10, successThreshold: 1, timeout: 300000, fallback: "queue", enabled: false, status: "closed" },
    ],
  });
  const [showCircuitBreakerModal, setShowCircuitBreakerModal] = useState(false);
  
  // 性能对比分析模块
  const [performanceComparisonData, setPerformanceComparisonData] = useState<{
    selectedAgents: Array<{ id: number; name: string; color: string }>;
    metrics: Array<{
      name: string;
      values: Array<{ agentId: number; value: number; unit: string }>;
    }>;
    trendData: Array<{
      time: string;
      values: Array<{ agentId: number; cpu: number; memory: number; network: number }>;
    }>;
  }>({
    selectedAgents: [
      { id: 1, name: "order-agent", color: "#165DFF" },
      { id: 2, name: "payment-agent", color: "#00D68F" },
      { id: 3, name: "user-agent", color: "#FFAA00" },
    ],
    metrics: [
      { name: "CPU使用率", values: [{ agentId: 1, value: 45, unit: "%" }, { agentId: 2, value: 52, unit: "%" }, { agentId: 3, value: 38, unit: "%" }] },
      { name: "内存使用率", values: [{ agentId: 1, value: 62, unit: "%" }, { agentId: 2, value: 58, unit: "%" }, { agentId: 3, value: 71, unit: "%" }] },
      { name: "网络延迟", values: [{ agentId: 1, value: 15, unit: "ms" }, { agentId: 2, value: 45, unit: "ms" }, { agentId: 3, value: 12, unit: "ms" }] },
      { name: "请求成功率", values: [{ agentId: 1, value: 99.2, unit: "%" }, { agentId: 2, value: 98.5, unit: "%" }, { agentId: 3, value: 99.8, unit: "%" }] },
    ],
    trendData: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      values: [
        { agentId: 1, cpu: 30 + Math.random() * 30 + Math.sin(i / 4) * 15, memory: 55 + Math.random() * 20, network: 40 + Math.random() * 30 },
        { agentId: 2, cpu: 35 + Math.random() * 25 + Math.cos(i / 4) * 10, memory: 50 + Math.random() * 25, network: 45 + Math.random() * 25 },
        { agentId: 3, cpu: 28 + Math.random() * 22 + Math.sin(i / 6) * 12, memory: 60 + Math.random() * 18, network: 35 + Math.random() * 35 },
      ],
    })),
  });
  const [showPerformanceComparisonModal, setShowPerformanceComparisonModal] = useState(false);
  
  // 服务依赖关系图
  const [serviceDependencies, setServiceDependencies] = useState<{
    nodes: Array<{ id: string; name: string; type: "agent" | "database" | "service"; status: "online" | "warning" | "error" }>;
    edges: Array<{ source: string; target: string; latency: number; requests: number }>;
  }>({
    nodes: [
      { id: "gateway", name: "网关", type: "agent", status: "online" },
      { id: "order", name: "订单服务", type: "agent", status: "online" },
      { id: "payment", name: "支付服务", type: "agent", status: "warning" },
      { id: "user", name: "用户服务", type: "agent", status: "online" },
      { id: "inventory", name: "库存服务", type: "agent", status: "online" },
      { id: "mysql", name: "MySQL", type: "database", status: "online" },
      { id: "redis", name: "Redis", type: "database", status: "online" },
    ],
    edges: [
      { source: "gateway", target: "order", latency: 15, requests: 5000 },
      { source: "gateway", target: "user", latency: 12, requests: 8000 },
      { source: "order", target: "payment", latency: 45, requests: 3000 },
      { source: "order", target: "inventory", latency: 28, requests: 4000 },
      { source: "order", target: "mysql", latency: 8, requests: 12000 },
      { source: "order", target: "redis", latency: 2, requests: 20000 },
      { source: "user", target: "mysql", latency: 10, requests: 6000 },
    ],
  });
  const [showServiceDependenciesModal, setShowServiceDependenciesModal] = useState(false);
  
  // 告警升级策略配置
  const [alertEscalationPolicies, setAlertEscalationPolicies] = useState<Array<{
    id: number;
    name: string;
    description: string;
    levels: Array<{
      level: number;
      threshold: number;
      duration: number;
      channels: string[];
      notifyUsers: string[];
    }>;
    enabled: boolean;
  }>>([
    {
      id: 1,
      name: "生产环境告警升级策略",
      description: "生产环境告警逐级升级配置",
      levels: [
        { level: 1, threshold: 1, duration: 0, channels: ["email"], notifyUsers: ["dev@example.com"] },
        { level: 2, threshold: 3, duration: 5, channels: ["email", "webhook"], notifyUsers: ["dev@example.com", "ops@example.com"] },
        { level: 3, threshold: 5, duration: 15, channels: ["email", "webhook", "dingtalk"], notifyUsers: ["dev@example.com", "ops@example.com", "manager@example.com"] },
        { level: 4, threshold: 10, duration: 30, channels: ["email", "webhook", "dingtalk", "sms"], notifyUsers: ["dev@example.com", "ops@example.com", "manager@example.com", "oncall@example.com"] },
      ],
      enabled: true,
    },
    {
      id: 2,
      name: "测试环境告警策略",
      description: "测试环境简化告警配置",
      levels: [
        { level: 1, threshold: 5, duration: 0, channels: ["email"], notifyUsers: ["test@example.com"] },
      ],
      enabled: true,
    },
  ]);
  const [showAlertEscalationModal, setShowAlertEscalationModal] = useState(false);
  
  // 多租户管理功能
  const [tenants, setTenants] = useState<Array<{
    id: number;
    name: string;
    description: string;
    status: "active" | "suspended";
    agents: number;
    applications: number;
    createdAt: string;
    quota: { cpu: number; memory: number; storage: number };
    usedQuota: { cpu: number; memory: number; storage: number };
  }>>([
    {
      id: 1,
      name: "企业客户A",
      description: "主要企业客户",
      status: "active",
      agents: 25,
      applications: 8,
      createdAt: "2024-01-01",
      quota: { cpu: 100, memory: 500, storage: 1000 },
      usedQuota: { cpu: 65, memory: 320, storage: 450 },
    },
    {
      id: 2,
      name: "企业客户B",
      description: "中型企业客户",
      status: "active",
      agents: 12,
      applications: 4,
      createdAt: "2024-02-15",
      quota: { cpu: 50, memory: 200, storage: 500 },
      usedQuota: { cpu: 35, memory: 180, storage: 320 },
    },
    {
      id: 3,
      name: "测试租户",
      description: "内部测试租户",
      status: "active",
      agents: 5,
      applications: 2,
      createdAt: "2024-03-01",
      quota: { cpu: 20, memory: 50, storage: 100 },
      usedQuota: { cpu: 8, memory: 35, storage: 45 },
    },
  ]);
  const [showTenantsModal, setShowTenantsModal] = useState(false);
  
  // 应用性能评分（APM Score）
  const [apmScores, setApmScores] = useState<Array<{
    id: number;
    name: string;
    score: number;
    components: Array<{ name: string; score: number; weight: number }>;
    trend: "up" | "down" | "stable";
    trendValue: number;
  }>>([
    {
      id: 1,
      name: "订单服务",
      score: 87,
      components: [
        { name: "可用性", score: 99.2, weight: 30 },
        { name: "性能", score: 82, weight: 25 },
        { name: "错误率", score: 98.5, weight: 20 },
        { name: "资源效率", score: 78, weight: 15 },
        { name: "可观测性", score: 95, weight: 10 },
      ],
      trend: "up",
      trendValue: 2.3,
    },
    {
      id: 2,
      name: "支付服务",
      score: 76,
      components: [
        { name: "可用性", score: 97.8, weight: 30 },
        { name: "性能", score: 65, weight: 25 },
        { name: "错误率", score: 95.2, weight: 20 },
        { name: "资源效率", score: 72, weight: 15 },
        { name: "可观测性", score: 88, weight: 10 },
      ],
      trend: "down",
      trendValue: -1.8,
    },
    {
      id: 3,
      name: "用户服务",
      score: 92,
      components: [
        { name: "可用性", score: 99.9, weight: 30 },
        { name: "性能", score: 88, weight: 25 },
        { name: "错误率", score: 99.8, weight: 20 },
        { name: "资源效率", score: 85, weight: 15 },
        { name: "可观测性", score: 98, weight: 10 },
      ],
      trend: "stable",
      trendValue: 0.1,
    },
  ]);
  const [showApmScoreModal, setShowApmScoreModal] = useState(false);
  
  // 错误追踪和分析
  const [errorTracking, setErrorTracking] = useState<{
    errors: Array<{
      id: number;
      type: string;
      message: string;
      count: number;
      firstOccurrence: string;
      lastOccurrence: string;
      affectedAgents: number;
      stackTrace: string;
      status: "open" | "acknowledged" | "resolved";
    }>;
    trends: Array<{ time: string; count: number }>;
  }>({
    errors: [
      {
        id: 1,
        type: "NullPointerException",
        message: "Cannot invoke method on null object",
        count: 156,
        firstOccurrence: "2024-01-15 08:30:00",
        lastOccurrence: "2024-01-15 14:22:00",
        affectedAgents: 3,
        stackTrace: "com.example.service.OrderService.processOrder(OrderService.java:45)\n  at com.example.controller.OrderController.createOrder(OrderController.java:23)",
        status: "open",
      },
      {
        id: 2,
        type: "TimeoutException",
        message: "Database query timeout after 30s",
        count: 45,
        firstOccurrence: "2024-01-15 10:15:00",
        lastOccurrence: "2024-01-15 13:45:00",
        affectedAgents: 2,
        stackTrace: "com.example.repository.OrderRepository.findByStatus(OrderRepository.java:67)",
        status: "acknowledged",
      },
      {
        id: 3,
        type: "ConnectionPoolExhaustedException",
        message: "Connection pool exhausted, no available connections",
        count: 23,
        firstOccurrence: "2024-01-15 11:00:00",
        lastOccurrence: "2024-01-15 12:30:00",
        affectedAgents: 1,
        stackTrace: "com.example.config.DataSourceConfig.getConnection(DataSourceConfig.java:89)",
        status: "resolved",
      },
    ],
    trends: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      count: Math.floor(Math.random() * 50) + 20,
    })),
  });
  const [showErrorTrackingModal, setShowErrorTrackingModal] = useState(false);
  
  // 数据库查询分析
  const [dbQueryAnalysis, setDbQueryAnalysis] = useState<Array<{
    id: number;
    query: string;
    avgDuration: number;
    maxDuration: number;
    minDuration: number;
    calls: number;
    rows: number;
    indexUsage: string;
    status: "optimal" | "warning" | "critical";
    suggestion: string;
  }>>([
    {
      id: 1,
      query: "SELECT * FROM orders WHERE status = ?",
      avgDuration: 15,
      maxDuration: 45,
      minDuration: 5,
      calls: 15000,
      rows: 1200,
      indexUsage: "idx_orders_status",
      status: "optimal",
      suggestion: "查询性能良好，索引使用正常",
    },
    {
      id: 2,
      query: "SELECT * FROM order_items JOIN orders ON ...",
      avgDuration: 125,
      maxDuration: 520,
      minDuration: 45,
      calls: 3200,
      rows: 5000,
      indexUsage: "无",
      status: "critical",
      suggestion: "建议添加联合索引优化查询",
    },
    {
      id: 3,
      query: "SELECT COUNT(*) FROM transactions",
      avgDuration: 85,
      maxDuration: 210,
      minDuration: 35,
      calls: 8500,
      rows: 1,
      indexUsage: "部分使用",
      status: "warning",
      suggestion: "考虑使用缓存优化计数查询",
    },
  ]);
  const [showDbAnalysisModal, setShowDbAnalysisModal] = useState(false);
  
  // 缓存命中率分析
  const [cacheAnalysis, setCacheAnalysis] = useState<{
    caches: Array<{
      name: string;
      hits: number;
      misses: number;
      hitRate: number;
      evictions: number;
      memoryUsage: number;
      maxMemory: number;
    }>;
    hitRateTrend: Array<{ time: string; rate: number }>;
  }>({
    caches: [
      { name: "用户缓存", hits: 156000, misses: 8500, hitRate: 94.8, evictions: 1200, memoryUsage: 256, maxMemory: 512 },
      { name: "订单缓存", hits: 89000, misses: 15000, hitRate: 85.5, evictions: 3500, memoryUsage: 198, maxMemory: 256 },
      { name: "产品缓存", hits: 234000, misses: 3200, hitRate: 98.6, evictions: 450, memoryUsage: 312, maxMemory: 512 },
      { name: "配置缓存", hits: 45000, misses: 800, hitRate: 98.2, evictions: 120, memoryUsage: 64, maxMemory: 128 },
    ],
    hitRateTrend: Array.from({ length: 7 }, (_, i) => ({
      time: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
      rate: 88 + Math.random() * 10,
    })),
  });
  const [showCacheAnalysisModal, setShowCacheAnalysisModal] = useState(false);
  
  // 服务等级协议（SLA）监控
  const [slaMonitoring, setSlaMonitoring] = useState<Array<{
    id: number;
    name: string;
    target: string;
    actual: string;
    status: "met" | "warning" | "breached";
    period: string;
    history: Array<{ period: string; value: number; target: number }>;
  }>>([
    {
      id: 1,
      name: "订单服务可用性",
      target: "99.9%",
      actual: "99.92%",
      status: "met",
      period: "今日",
      history: Array.from({ length: 7 }, (_, i) => ({
        period: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
        value: 99.5 + Math.random() * 0.5,
        target: 99.9,
      })),
    },
    {
      id: 2,
      name: "API响应时间",
      target: "< 200ms",
      actual: "185ms",
      status: "met",
      period: "今日",
      history: Array.from({ length: 7 }, (_, i) => ({
        period: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
        value: 150 + Math.random() * 80,
        target: 200,
      })),
    },
    {
      id: 3,
      name: "支付成功率",
      target: "99.8%",
      actual: "99.1%",
      status: "warning",
      period: "今日",
      history: Array.from({ length: 7 }, (_, i) => ({
        period: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
        value: 98.5 + Math.random() * 1.5,
        target: 99.8,
      })),
    },
    {
      id: 4,
      name: "数据库连接池使用率",
      target: "< 80%",
      actual: "85%",
      status: "breached",
      period: "今日",
      history: Array.from({ length: 7 }, (_, i) => ({
        period: ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][i],
        value: 60 + Math.random() * 35,
        target: 80,
      })),
    },
  ]);
  const [showSlaModal, setShowSlaModal] = useState(false);
  
  // 分布式事务追踪
  const [distributedTransactions, setDistributedTransactions] = useState<{
    transactions: Array<{
      id: string;
      name: string;
      status: "success" | "failed" | "pending";
      startTime: string;
      duration: number;
      spans: Array<{
        service: string;
        operation: string;
        duration: number;
        status: string;
      }>;
      participants: number;
    }>;
    stats: { total: number; success: number; failed: number; avgDuration: number };
  }>({
    transactions: [
      {
        id: "txn-001",
        name: "订单创建",
        status: "success",
        startTime: "2024-01-15 14:30:00",
        duration: 456,
        spans: [
          { service: "gateway", operation: "HTTP POST /orders", duration: 45, status: "success" },
          { service: "order-service", operation: "createOrder", duration: 156, status: "success" },
          { service: "payment-service", operation: "charge", duration: 185, status: "success" },
          { service: "inventory-service", operation: "reserveStock", duration: 70, status: "success" },
        ],
        participants: 4,
      },
      {
        id: "txn-002",
        name: "用户登录",
        status: "success",
        startTime: "2024-01-15 14:29:30",
        duration: 123,
        spans: [
          { service: "gateway", operation: "HTTP POST /login", duration: 25, status: "success" },
          { service: "user-service", operation: "authenticate", duration: 98, status: "success" },
        ],
        participants: 2,
      },
      {
        id: "txn-003",
        name: "订单支付",
        status: "failed",
        startTime: "2024-01-15 14:28:00",
        duration: 890,
        spans: [
          { service: "gateway", operation: "HTTP POST /payments", duration: 35, status: "success" },
          { service: "payment-service", operation: "processPayment", duration: 855, status: "failed" },
        ],
        participants: 2,
      },
    ],
    stats: { total: 1568, success: 1542, failed: 26, avgDuration: 342 },
  });
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  
  // 消息队列监控
  const [mqMonitoring, setMqMonitoring] = useState<Array<{
    name: string;
    type: "kafka" | "rabbitmq" | "rocketmq";
    status: "healthy" | "warning" | "critical";
    messageCount: number;
    pendingMessages: number;
    consumers: number;
    producers: number;
    throughput: number;
    avgLatency: number;
    topics: Array<{ name: string; messages: number; lag: number }>;
  }>>([
    {
      name: "订单消息队列",
      type: "kafka",
      status: "healthy",
      messageCount: 125000,
      pendingMessages: 120,
      consumers: 8,
      producers: 12,
      throughput: 15000,
      avgLatency: 8,
      topics: [
        { name: "order.created", messages: 45000, lag: 15 },
        { name: "order.updated", messages: 38000, lag: 45 },
        { name: "order.deleted", messages: 42000, lag: 60 },
      ],
    },
    {
      name: "支付消息队列",
      type: "kafka",
      status: "warning",
      messageCount: 89000,
      pendingMessages: 1500,
      consumers: 4,
      producers: 6,
      throughput: 8500,
      avgLatency: 45,
      topics: [
        { name: "payment.success", messages: 52000, lag: 890 },
        { name: "payment.failed", messages: 37000, lag: 610 },
      ],
    },
    {
      name: "日志收集队列",
      type: "rabbitmq",
      status: "healthy",
      messageCount: 234000,
      pendingMessages: 85,
      consumers: 12,
      producers: 25,
      throughput: 28000,
      avgLatency: 5,
      topics: [
        { name: "logs.app", messages: 156000, lag: 45 },
        { name: "logs.system", messages: 78000, lag: 40 },
      ],
    },
  ]);
  const [showMqModal, setShowMqModal] = useState(false);
  
  // 容器化监控（Docker/Kubernetes）
  const [containerMonitoring, setContainerMonitoring] = useState<{
    clusters: Array<{
      name: string;
      status: "healthy" | "warning" | "critical";
      nodes: number;
      pods: number;
      runningPods: number;
      pendingPods: number;
      failedPods: number;
      cpuUsage: number;
      memoryUsage: number;
      namespaces: Array<{ name: string; pods: number; status: string }>;
    }>;
  }>({
    clusters: [
      {
        name: "生产集群",
        status: "healthy",
        nodes: 8,
        pods: 156,
        runningPods: 154,
        pendingPods: 2,
        failedPods: 0,
        cpuUsage: 67,
        memoryUsage: 72,
        namespaces: [
          { name: "default", pods: 45, status: "running" },
          { name: "monitoring", pods: 23, status: "running" },
          { name: "backend", pods: 88, status: "running" },
        ],
      },
      {
        name: "测试集群",
        status: "warning",
        nodes: 4,
        pods: 68,
        runningPods: 65,
        pendingPods: 1,
        failedPods: 2,
        cpuUsage: 45,
        memoryUsage: 52,
        namespaces: [
          { name: "default", pods: 32, status: "running" },
          { name: "test", pods: 36, status: "running" },
        ],
      },
    ],
  });
  const [showContainerModal, setShowContainerModal] = useState(false);
  
  // CDN/边缘节点监控
  const [cdnMonitoring, setCdnMonitoring] = useState<{
    nodes: Array<{
      id: string;
      name: string;
      location: string;
      status: "healthy" | "warning" | "critical";
      requests: number;
      bandwidth: number;
      hitRate: number;
      latency: number;
      cacheSize: number;
    }>;
    globalStats: { totalRequests: number; avgLatency: number; avgHitRate: number };
  }>({
    nodes: [
      { id: "cdn-01", name: "北京节点", location: "北京", status: "healthy", requests: 1250000, bandwidth: 850, hitRate: 94.5, latency: 15, cacheSize: 2048 },
      { id: "cdn-02", name: "上海节点", location: "上海", status: "healthy", requests: 1580000, bandwidth: 920, hitRate: 96.2, latency: 12, cacheSize: 2048 },
      { id: "cdn-03", name: "广州节点", location: "广州", status: "warning", requests: 980000, bandwidth: 650, hitRate: 88.3, latency: 28, cacheSize: 1536 },
      { id: "cdn-04", name: "成都节点", location: "成都", status: "healthy", requests: 720000, bandwidth: 480, hitRate: 92.8, latency: 22, cacheSize: 1024 },
    ],
    globalStats: { totalRequests: 4530000, avgLatency: 19, avgHitRate: 92.95 },
  });
  const [showCdnModal, setShowCdnModal] = useState(false);

  // 服务网格监控
  const [serviceMeshData, setServiceMeshData] = useState<{
    services: Array<{
      name: string;
      status: "healthy" | "degraded" | "critical";
      requests: number;
      errors: number;
      latency: number;
      connections: number;
    }>;
    meshStatus: {
      name: string;
      version: string;
      proxies: number;
      activeConnections: number;
      totalRequests: number;
    };
    trafficMetrics: Array<{ time: string; requests: number; errors: number }>;
  }>({
    services: [
      { name: "frontend", status: "healthy", requests: 125000, errors: 125, latency: 15, connections: 856 },
      { name: "gateway", status: "healthy", requests: 234000, errors: 234, latency: 25, connections: 1250 },
      { name: "order-service", status: "degraded", requests: 89000, errors: 890, latency: 125, connections: 456 },
      { name: "payment-service", status: "healthy", requests: 56000, errors: 56, latency: 45, connections: 234 },
    ],
    meshStatus: {
      name: "Istio",
      version: "1.18.2",
      proxies: 24,
      activeConnections: 5680,
      totalRequests: 1560000,
    },
    trafficMetrics: Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      requests: 5000 + Math.random() * 5000,
      errors: Math.floor(Math.random() * 50),
    })),
  });
  const [showServiceMeshModal, setShowServiceMeshModal] = useState(false);

  // 云原生监控
  const [cloudNativeData, setCloudNativeData] = useState<{
    providers: Array<{
      name: string;
      type: "aws" | "azure" | "gcp" | "aliyun";
      status: "healthy" | "warning" | "critical";
      resources: number;
      activeResources: number;
      cost: number;
      regions: string[];
    }>;
    resourceUsage: Array<{ type: string; used: number; total: number; percentage: number }>;
  }>({
    providers: [
      { name: "阿里云", type: "aliyun", status: "healthy", resources: 125, activeResources: 118, cost: 12500, regions: ["华东1", "华东2", "华北1"] },
      { name: "AWS", type: "aws", status: "warning", resources: 45, activeResources: 42, cost: 8500, regions: ["us-east-1", "ap-northeast-1"] },
      { name: "Azure", type: "azure", status: "healthy", resources: 32, activeResources: 30, cost: 6200, regions: ["East Asia", "Southeast Asia"] },
    ],
    resourceUsage: [
      { type: "ECS/VM", used: 185, total: 200, percentage: 92.5 },
      { type: "存储", used: 2.5, total: 5, percentage: 50 },
      { type: "数据库", used: 12, total: 15, percentage: 80 },
      { type: "负载均衡", used: 8, total: 10, percentage: 80 },
    ],
  });
  const [showCloudNativeModal, setShowCloudNativeModal] = useState(false);

  // 安全审计
  const [securityAuditData, setSecurityAuditData] = useState<{
    incidents: Array<{
      id: number;
      type: "intrusion" | "anomaly" | "policy_violation" | "credential_leak";
      severity: "critical" | "high" | "medium" | "low";
      title: string;
      description: string;
      detectedAt: string;
      status: "open" | "investigating" | "resolved";
      affectedAgents: number;
    }>;
    stats: {
      totalIncidents: number;
      critical: number;
      high: number;
      medium: number;
      resolved: number;
    };
  }>({
    incidents: [
      { id: 1, type: "intrusion", severity: "critical", title: "异常登录检测", description: "检测到来自未知IP的多次登录尝试", detectedAt: "2024-01-15 14:30:00", status: "investigating", affectedAgents: 2 },
      { id: 2, type: "anomaly", severity: "high", title: "异常流量模式", description: "发现异常的API调用模式，可能存在DDoS攻击", detectedAt: "2024-01-15 14:25:00", status: "open", affectedAgents: 5 },
      { id: 3, type: "policy_violation", severity: "medium", title: "权限越权访问", description: "检测到用户尝试访问未授权的资源", detectedAt: "2024-01-15 13:45:00", status: "resolved", affectedAgents: 1 },
      { id: 4, type: "credential_leak", severity: "critical", title: "敏感信息泄露", description: "检测到配置文件中包含明文密码", detectedAt: "2024-01-15 12:00:00", status: "investigating", affectedAgents: 3 },
    ],
    stats: { totalIncidents: 23, critical: 5, high: 8, medium: 7, resolved: 12 },
  });
  const [showSecurityAuditModal, setShowSecurityAuditModal] = useState(false);

  // API安全
  const [apiSecurityData, setApiSecurityData] = useState<{
    endpoints: Array<{
      path: string;
      method: string;
      status: "secure" | "warning" | "vulnerable";
      threats: number;
      rateLimit: number;
      requests: number;
    }>;
    vulnerabilities: Array<{
      id: number;
      type: "sql_injection" | "xss" | "csrf" | "path_traversal" | "authentication_bypass";
      endpoint: string;
      severity: "critical" | "high" | "medium";
      status: "detected" | "patched" | "ignored";
      detectedAt: string;
    }>;
  }>({
    endpoints: [
      { path: "/api/v1/orders", method: "POST", status: "secure", threats: 0, rateLimit: 500, requests: 12500 },
      { path: "/api/v1/payments", method: "POST", status: "warning", threats: 2, rateLimit: 200, requests: 8500 },
      { path: "/api/v1/users", method: "GET", status: "secure", threats: 0, rateLimit: 800, requests: 23000 },
      { path: "/api/v1/admin/config", method: "PUT", status: "vulnerable", threats: 3, rateLimit: 50, requests: 150 },
    ],
    vulnerabilities: [
      { id: 1, type: "sql_injection", endpoint: "/api/v1/search", severity: "critical", status: "detected", detectedAt: "2024-01-15 14:00:00" },
      { id: 2, type: "xss", endpoint: "/api/v1/comments", severity: "high", status: "patched", detectedAt: "2024-01-14 10:30:00" },
      { id: 3, type: "csrf", endpoint: "/api/v1/orders", severity: "medium", status: "detected", detectedAt: "2024-01-15 11:00:00" },
    ],
  });
  const [showApiSecurityModal, setShowApiSecurityModal] = useState(false);

  // 用户行为分析
  const [userBehaviorData, setUserBehaviorData] = useState<{
    sessions: number;
    activeUsers: number;
    avgSessionDuration: number;
    conversionRate: number;
    pages: Array<{ name: string; views: number; avgTime: number; bounceRate: number }>;
    funnels: Array<{ step: string; users: number; conversion: number }>;
  }>({
    sessions: 12560,
    activeUsers: 3250,
    avgSessionDuration: 185,
    conversionRate: 3.2,
    pages: [
      { name: "首页", views: 12500, avgTime: 45, bounceRate: 45 },
      { name: "商品列表", views: 8900, avgTime: 120, bounceRate: 32 },
      { name: "商品详情", views: 6500, avgTime: 180, bounceRate: 25 },
      { name: "购物车", views: 4200, avgTime: 90, bounceRate: 18 },
      { name: "结算页", views: 2800, avgTime: 150, bounceRate: 12 },
    ],
    funnels: [
      { step: "访问首页", users: 12500, conversion: 100 },
      { step: "浏览商品", users: 8900, conversion: 71.2 },
      { step: "查看详情", users: 6500, conversion: 52 },
      { step: "加入购物车", users: 4200, conversion: 33.6 },
      { step: "完成购买", users: 402, conversion: 3.2 },
    ],
  });
  const [showUserBehaviorModal, setShowUserBehaviorModal] = useState(false);

  // 配置版本管理
  const [configVersionData, setConfigVersionData] = useState<{
    versions: Array<{
      id: number;
      version: string;
      createdAt: string;
      author: string;
      changes: string;
      status: "active" | "archived" | "deprecated";
      rollbackAvailable: boolean;
    }>;
    rollbackHistory: Array<{
      id: number;
      fromVersion: string;
      toVersion: string;
      rolledBackBy: string;
      rolledBackAt: string;
      reason: string;
    }>;
  }>({
    versions: [
      { id: 1, version: "v2.1.0", createdAt: "2024-01-15 10:30:00", author: "admin", changes: "新增支付服务监控插件", status: "active", rollbackAvailable: false },
      { id: 2, version: "v2.0.5", createdAt: "2024-01-10 14:20:00", author: "dev-user", changes: "优化日志收集性能", status: "archived", rollbackAvailable: true },
      { id: 3, version: "v2.0.0", createdAt: "2024-01-05 09:00:00", author: "admin", changes: "重构配置管理模块", status: "archived", rollbackAvailable: true },
      { id: 4, version: "v1.9.5", createdAt: "2023-12-28 16:45:00", author: "dev-user", changes: "修复内存泄漏问题", status: "deprecated", rollbackAvailable: false },
    ],
    rollbackHistory: [
      { id: 1, fromVersion: "v2.0.5", toVersion: "v2.0.0", rolledBackBy: "admin", rolledBackAt: "2024-01-12 11:30:00", reason: "新版本引入bug" },
      { id: 2, fromVersion: "v2.0.0", toVersion: "v1.9.5", rolledBackBy: "dev-user", rolledBackAt: "2024-01-06 14:00:00", reason: "配置格式错误" },
    ],
  });
  const [showConfigVersionModal, setShowConfigVersionModal] = useState(false);

  // 自动化运维
  const [autoOpsData, setAutoOpsData] = useState<{
    enabled: boolean;
    tasks: Array<{
      id: number;
      name: string;
      type: "auto_recovery" | "auto_scale" | "auto_cleanup" | "auto_backup";
      status: "running" | "paused" | "completed";
      lastRun: string;
      nextRun: string;
      successRate: number;
    }>;
    recentActions: Array<{
      id: number;
      action: string;
      target: string;
      result: "success" | "failed";
      timestamp: string;
    }>;
  }>({
    enabled: true,
    tasks: [
      { id: 1, name: "自动故障恢复", type: "auto_recovery", status: "running", lastRun: "2024-01-15 14:30:00", nextRun: "即时", successRate: 98.5 },
      { id: 2, name: "自动弹性伸缩", type: "auto_scale", status: "running", lastRun: "2024-01-15 14:25:00", nextRun: "每5分钟", successRate: 99.2 },
      { id: 3, name: "自动日志清理", type: "auto_cleanup", status: "running", lastRun: "2024-01-15 03:00:00", nextRun: "明天 03:00", successRate: 100 },
      { id: 4, name: "自动配置备份", type: "auto_backup", status: "paused", lastRun: "2024-01-14 02:00:00", nextRun: "待定", successRate: 100 },
    ],
    recentActions: [
      { id: 1, action: "自动恢复", target: "payment-agent", result: "success", timestamp: "2024-01-15 14:30:00" },
      { id: 2, action: "扩容实例", target: "order-agent", result: "success", timestamp: "2024-01-15 14:25:00" },
      { id: 3, action: "自动恢复", target: "user-agent", result: "failed", timestamp: "2024-01-15 13:45:00" },
    ],
  });
  const [showAutoOpsModal, setShowAutoOpsModal] = useState(false);

  // 智能调度
  const [smartSchedulingData, setSmartSchedulingData] = useState<{
    enabled: boolean;
    strategies: Array<{
      id: number;
      name: string;
      type: "round_robin" | "least_load" | "weighted" | "adaptive";
      status: "active" | "inactive";
      targets: string[];
      metrics: { cpu: number; memory: number; latency: number };
    }>;
    schedulingStats: {
      totalRequests: number;
      avgLatency: number;
      loadBalance: number;
    };
  }>({
    enabled: true,
    strategies: [
      { id: 1, name: "自适应负载均衡", type: "adaptive", status: "active", targets: ["gateway-agent", "order-agent", "payment-agent"], metrics: { cpu: 45, memory: 62, latency: 15 } },
      { id: 2, name: "加权轮询", type: "weighted", status: "active", targets: ["user-agent", "inventory-agent"], metrics: { cpu: 38, memory: 55, latency: 12 } },
      { id: 3, name: "最小负载优先", type: "least_load", status: "inactive", targets: ["search-agent"], metrics: { cpu: 72, memory: 68, latency: 28 } },
    ],
    schedulingStats: { totalRequests: 1250000, avgLatency: 18, loadBalance: 94.5 },
  });
  const [showSmartSchedulingModal, setShowSmartSchedulingModal] = useState(false);

  // 全链路追踪
  const [fullTraceData, setFullTraceData] = useState<{
    traces: Array<{
      traceId: string;
      name: string;
      duration: number;
      status: "success" | "failed" | "partial";
      startTime: string;
      services: Array<{ name: string; duration: number; status: string }>;
      spans: number;
    }>;
    stats: { totalTraces: number; successRate: number; avgDuration: number; slowestTrace: number };
  }>({
    traces: [
      { traceId: "trace-001", name: "订单创建流程", duration: 456, status: "success", startTime: "2024-01-15 14:30:00", services: [{ name: "gateway", duration: 45, status: "success" }, { name: "order-service", duration: 156, status: "success" }, { name: "payment-service", duration: 185, status: "success" }, { name: "inventory-service", duration: 70, status: "success" }], spans: 12 },
      { traceId: "trace-002", name: "用户登录", duration: 123, status: "success", startTime: "2024-01-15 14:29:30", services: [{ name: "gateway", duration: 25, status: "success" }, { name: "user-service", duration: 98, status: "success" }], spans: 5 },
      { traceId: "trace-003", name: "商品搜索", duration: 850, status: "partial", startTime: "2024-01-15 14:28:00", services: [{ name: "gateway", duration: 35, status: "success" }, { name: "search-service", duration: 815, status: "warning" }], spans: 8 },
    ],
    stats: { totalTraces: 15680, successRate: 99.2, avgDuration: 234, slowestTrace: 850 },
  });
  const [showFullTraceModal, setShowFullTraceModal] = useState(false);

  // 异常检测
  const [anomalyDetectionData, setAnomalyDetectionData] = useState<{
    enabled: boolean;
    anomalies: Array<{
      id: number;
      type: "spike" | "trend" | "pattern" | "threshold";
      severity: "critical" | "warning" | "info";
      title: string;
      description: string;
      metric: string;
      currentValue: number;
      baselineValue: number;
      detectedAt: string;
      status: "active" | "resolved" | "investigating";
    }>;
    detectionStats: { totalAnomalies: number; critical: number; warning: number; resolved: number };
  }>({
    enabled: true,
    anomalies: [
      { id: 1, type: "spike", severity: "critical", title: "请求量突增", description: "order-agent请求量在5分钟内增长150%", metric: "requests", currentValue: 15000, baselineValue: 6000, detectedAt: "2024-01-15 14:30:00", status: "active" },
      { id: 2, type: "trend", severity: "warning", title: "响应时间持续上升", description: "payment-agent响应时间连续10分钟上升", metric: "responseTime", currentValue: 280, baselineValue: 120, detectedAt: "2024-01-15 14:20:00", status: "investigating" },
      { id: 3, type: "pattern", severity: "info", title: "异常访问模式", description: "检测到非工作时间的异常访问模式", metric: "accessPattern", currentValue: 0, baselineValue: 0, detectedAt: "2024-01-15 02:15:00", status: "resolved" },
    ],
    detectionStats: { totalAnomalies: 45, critical: 8, warning: 15, resolved: 22 },
  });
  const [showAnomalyModal, setShowAnomalyModal] = useState(false);

  // 服务发现
  const [serviceDiscoveryData, setServiceDiscoveryData] = useState<{
    services: Array<{
      id: string;
      name: string;
      type: "http" | "grpc" | "tcp" | "udp";
      status: "healthy" | "degraded" | "unavailable";
      instances: number;
      healthyInstances: number;
      endpoints: string[];
      lastRegistered: string;
    }>;
    discoveryStats: { totalServices: number; healthyServices: number; instances: number };
  }>({
    services: [
      { id: "svc-001", name: "gateway-service", type: "http", status: "healthy", instances: 4, healthyInstances: 4, endpoints: ["http://192.168.1.10:8080", "http://192.168.1.11:8080"], lastRegistered: "2024-01-15 14:30:00" },
      { id: "svc-002", name: "order-service", type: "grpc", status: "healthy", instances: 3, healthyInstances: 3, endpoints: ["grpc://192.168.1.20:9090"], lastRegistered: "2024-01-15 14:25:00" },
      { id: "svc-003", name: "payment-service", type: "http", status: "degraded", instances: 2, healthyInstances: 1, endpoints: ["http://192.168.1.30:8081"], lastRegistered: "2024-01-15 14:20:00" },
      { id: "svc-004", name: "user-service", type: "http", status: "healthy", instances: 2, healthyInstances: 2, endpoints: ["http://192.168.1.40:8082", "http://192.168.1.41:8082"], lastRegistered: "2024-01-15 14:15:00" },
    ],
    discoveryStats: { totalServices: 15, healthyServices: 12, instances: 45 },
  });
  const [showServiceDiscoveryModal, setShowServiceDiscoveryModal] = useState(false);

  // 模拟 Agent 性能指标数据
  const mockAgentMetrics = (agentId: number) => {
    return {
      cpu: { usage: 35 + Math.random() * 20, cores: 4, loadAvg: "1.2, 0.8, 0.5" },
      memory: { used: 2.5 + Math.random() * 1, total: 8, heapUsage: 65 + Math.random() * 15 },
      network: { inSpeed: 125 + Math.random() * 50, outSpeed: 89 + Math.random() * 30, connections: 156 },
      disk: { usage: 45 + Math.random() * 10, readOps: 1234, writeOps: 567 },
      uptime: "15d 4h 32m",
      processCount: 89,
      threadCount: 234,
      gcCount: 125,
      lastGc: "2m 30s ago"
    };
  };

  // 模拟 Agent 日志数据
  const mockAgentLogs = () => {
    const levels = ["DEBUG", "INFO", "WARN", "ERROR"];
    const logMessages = [
      "Agent started successfully",
      "Plugin loaded: servlet",
      "Collecting metrics...",
      "Sending heartbeat",
      "Configuration updated",
      "Warning: High CPU usage detected",
      "Error: Failed to connect to server",
      "GC performed, released 256MB",
      "Agent version: v2.4.1",
      "Connected to application: order-service"
    ];
    
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: logMessages[Math.floor(Math.random() * logMessages.length)],
      thread: `thread-${Math.floor(Math.random() * 10) + 1}`,
      class: `org.xi.lt.apm.${["agent", "plugin", "collector", "transport"][Math.floor(Math.random() * 4)]}`
    }));
  };

  // 模拟性能历史数据
  const mockPerformanceHistory = () => {
    const now = Date.now();
    return Array.from({ length: 60 }, (_, i) => ({
      time: new Date(now - (60 - i) * 60000).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      cpu: 30 + Math.random() * 30 + Math.sin(i / 5) * 10,
      memory: 60 + Math.random() * 20 + Math.cos(i / 8) * 8,
      networkIn: 100 + Math.random() * 80,
      networkOut: 60 + Math.random() * 50,
      disk: 45 + Math.random() * 10,
    }));
  };

  // 模拟心跳数据
  const mockHeartbeat = (agentId: number) => {
    const statuses = ["在线", "心跳延迟", "离线"];
    const weights = [0.7, 0.2, 0.1];
    const random = Math.random();
    let statusIndex = 0;
    let cumulative = 0;
    for (let i = 0; i < weights.length; i++) {
      cumulative += weights[i];
      if (random < cumulative) {
        statusIndex = i;
        break;
      }
    }
    return {
      lastTime: new Date().toLocaleTimeString("zh-CN"),
      status: statuses[statusIndex],
      latency: statusIndex === 2 ? 0 : Math.floor(Math.random() * 50) + 10,
    };
  };

  // 模拟健康度评分
  const mockHealthScore = (agentId: number) => {
    const baseScore = 60 + Math.random() * 40;
    const cpu = Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 20));
    const memory = Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 20));
    const disk = Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 15));
    const network = Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 10));
    const plugins = Math.min(100, Math.max(0, baseScore + (Math.random() - 0.5) * 5));
    
    const overallScore = (cpu + memory + disk + network + plugins) / 5;
    let status: "healthy" | "warning" | "critical" = "healthy";
    if (overallScore < 60) status = "critical";
    else if (overallScore < 80) status = "warning";
    
    return {
      score: Math.round(overallScore),
      cpu: Math.round(cpu),
      memory: Math.round(memory),
      disk: Math.round(disk),
      network: Math.round(network),
      plugins: Math.round(plugins),
      status,
    };
  };

  // 模拟调试命令输出
  const mockDebugCommand = (command: string, agentId: number) => {
    const outputs: Record<string, string> = {
      "status": `[Agent ${agentId}] Status Report
==================
Uptime: 15d 4h 32m
Status: Running
CPU Usage: 35.2%
Memory Usage: 62.8%
Thread Count: 234
GC Count: 125`,
      "threads": `[Agent ${agentId}] Thread Dump
====================
Thread-1: RUNNABLE (cpu=12ms)
Thread-2: TIMED_WAITING (cpu=5ms)
Thread-3: BLOCKED (cpu=0ms)
Total Threads: 234`,
      "heap": `[Agent ${agentId}] Heap Info
=================
Heap Size: 4096 MB
Used: 2560 MB
Free: 1536 MB
Usage: 62.5%`,
      "gc": `[Agent ${agentId}] GC Status
==============
GC Count: 125
GC Time: 2345ms
Last GC: 2m 30s ago
GC Type: G1GC`,
      "plugins": `[Agent ${agentId}] Plugin List
===================
1. servlet v2.4.1 [ENABLED]
2. jdbc v1.8.0 [ENABLED]
3. redis v2.1.0 [DISABLED]
4. kafka v2.3.0 [ENABLED]
5. spring v3.0.0 [ENABLED]`,
      "config": `[Agent ${agentId}] Config Summary
=====================
Max Heap: 4096MB
Plugin Dir: /opt/agent/plugins
Log Level: INFO
Heartbeat Interval: 30s`,
    };
    return outputs[command] || `Unknown command: ${command}`;
  };

  const loadAgents = async () => {
    try {
      setLoading(true);
      const res = await agentsApi.getAll();
      if (res.data && res.data.length > 0) {
        const mappedAgents: Agent[] = res.data.map((agent: any) => ({
          id: agent.id || 0,
          host: agent.ip || agent.hostname || "unknown",
          app: agent.appName || agent.app || "unknown",
          version: agent.agentVersion || "v2.4.1",
          status: agent.status === "online" ? "online" as const : 
                  agent.status === "warning" ? "warning" as const : "offline" as const,
          os: "Linux x64",
          plugins: 5,
          lastHb: agent.lastHb || "2min ago",
          connected: agent.status === "online",
        }));
        setAgents(mappedAgents);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
      // Fallback to empty
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAgentDetail = async (agentId: number) => {
    try {
      // Load plugins
      const pluginRes = await agentManagementApi.getPlugins(agentId);
      if (pluginRes.data) {
        setPlugins(pluginRes.data.map((p: any) => ({
          ...p,
          loaded: p.enabled,
        })));
      }

      // Load configs
      const configRes = await agentManagementApi.getConfigs(agentId);
      if (configRes.data) {
        setConfigs(configRes.data);
      }

      // Load commands
      const commandRes = await agentManagementApi.getCommands(agentId);
      if (commandRes.data) {
        setCommands(commandRes.data);
      }

      // Load metrics
      setAgentMetrics(mockAgentMetrics(agentId));
      
      // Load logs
      setAgentLogs(mockAgentLogs());
      
      // Load performance history
      setPerformanceHistory(mockPerformanceHistory());
      
      // Load heartbeat
      const heartbeat = mockHeartbeat(agentId);
      setAgentHeartbeat(prev => ({
        ...prev,
        [agentId]: heartbeat,
      }));
      
      // Load health score
      const healthScore = mockHealthScore(agentId);
      setAgentHealthScores(prev => ({
        ...prev,
        [agentId]: healthScore,
      }));
    } catch (error) {
      console.error("Failed to load agent detail:", error);
    }
  };

  const loadMarketPlugins = async () => {
    try {
      const res = await agentManagementApi.getMarketPlugins();
      if (res.data) {
        setMarketPlugins(res.data);
      }
    } catch (error) {
      console.error("Failed to load market plugins:", error);
    }
  };

  useEffect(() => {
    loadAgents();
    loadMarketPlugins();
  }, []);

  useEffect(() => {
    if (selectedAgent) {
      loadAgentDetail(selectedAgent);
    }
  }, [selectedAgent]);

  const filteredAgents = useMemo(() =>
    agents.filter(agent =>
      search === "" ||
      agent.host.toLowerCase().includes(search.toLowerCase()) ||
      agent.app.toLowerCase().includes(search.toLowerCase())
    ),
    [search, agents]
  );

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    setCurrentPage,
    setPageSize,
    canPrevPage,
    canNextPage,
  } = usePagination({ data: filteredAgents, defaultPageSize: 10 });

  const confirmOperation = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(() => onConfirm);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    confirmAction?.();
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const toggleAgentSelection = (agentId: number) => {
    const newSelection = new Set(selectedAgents);
    if (newSelection.has(agentId)) {
      newSelection.delete(agentId);
    } else {
      newSelection.add(agentId);
    }
    setSelectedAgents(newSelection);
  };

  const handleAction = async (action: string, agent?: Agent, pluginName?: string, pluginId?: number, configId?: number) => {
    switch (action) {
      case "globalRefresh":
        showToast("正在刷新所有Agent节点...", "info");
        await loadAgents();
        showToast("刷新成功", "success");
        break;
      case "batchUpgrade":
        if (selectedAgents.size === 0) {
          showToast("请先选择要升级的节点", "warning");
          return;
        }
        confirmOperation(`确定要升级 ${selectedAgents.size} 个节点吗？`, async () => {
          showToast(`正在批量升级 ${selectedAgents.size} 个节点...`, "info");
          setBatchOperationProgress(0);
          let success = 0;
          let failed = 0;
          const agents = Array.from(selectedAgents);
          
          for (let i = 0; i < agents.length; i++) {
            try {
              await agentManagementApi.upgradeAgent(agents[i]);
              success++;
            } catch (error) {
              failed++;
            }
            setBatchOperationProgress(Math.round(((i + 1) / agents.length) * 100));
          }
          
          setBatchOperationProgress(null);
          setBatchOperationResult({ success, failed });
          showToast(`批量升级完成：成功 ${success} 个，失败 ${failed} 个`, failed > 0 ? "warning" : "success");
          setSelectedAgents(new Set());
        });
        break;
      case "batchReload":
        if (selectedAgents.size === 0) {
          showToast("请先选择要热加载的节点", "warning");
          return;
        }
        confirmOperation(`确定要热加载 ${selectedAgents.size} 个节点吗？`, async () => {
          showToast(`正在批量热加载 ${selectedAgents.size} 个节点...`, "info");
          setBatchOperationProgress(0);
          let success = 0;
          let failed = 0;
          const agents = Array.from(selectedAgents);
          
          for (let i = 0; i < agents.length; i++) {
            try {
              await agentManagementApi.hotReloadAgent(agents[i]);
              success++;
            } catch (error) {
              failed++;
            }
            setBatchOperationProgress(Math.round(((i + 1) / agents.length) * 100));
          }
          
          setBatchOperationProgress(null);
          setBatchOperationResult({ success, failed });
          showToast(`批量热加载完成：成功 ${success} 个，失败 ${failed} 个`, failed > 0 ? "warning" : "success");
          setSelectedAgents(new Set());
        });
        break;
      case "config":
        if (agent) {
          setSelectedAgent(agent.id);
          setTab("config");
        }
        break;
      case "restart":
        if (agent) {
          confirmOperation(`确定要重启 ${agent.host} 吗？`, async () => {
            showToast(`正在重启 ${agent.host}...`, "info");
            try {
              await agentManagementApi.restartAgent(agent.id);
              showToast(`${agent.host} 重启指令已发送`, "success");
            } catch (error) {
              showToast("重启失败", "error");
            }
          });
        }
        break;
      case "upgrade":
        if (agent) {
          confirmOperation(`确定要升级 ${agent.host} 到最新版本吗？`, async () => {
            showToast(`正在升级 ${agent.host}...`, "info");
            try {
              await agentManagementApi.upgradeAgent(agent.id);
              showToast(`${agent.host} 升级指令已发送`, "success");
            } catch (error) {
              showToast("升级失败", "error");
            }
          });
        }
        break;
      case "hotReload":
        if (agent) {
          showToast(`正在热加载 ${agent.host} 配置...`, "info");
          try {
            await agentManagementApi.hotReloadAgent(agent.id);
            showToast(`${agent.host} 配置热加载指令已发送`, "success");
          } catch (error) {
            showToast("热加载失败", "error");
          }
        }
        break;
      case "uninstallAgent":
        if (agent) {
          confirmOperation(`确定要卸载 ${agent.host} 的Agent吗？此操作将停止监控。`, () => {
            showToast(`正在卸载 ${agent.host} 的Agent...`, "info");
            setTimeout(() => showToast(`${agent.host} 的Agent已卸载`, "success"), 1500);
          });
        }
        break;
      case "pluginEnable":
        if (pluginId) {
          try {
            await agentManagementApi.enablePlugin(pluginId);
            showToast("插件已启用", "success");
            if (selectedAgent) loadAgentDetail(selectedAgent);
          } catch (error) {
            showToast("启用插件失败", "error");
          }
        }
        break;
      case "pluginDisable":
        if (pluginId) {
          try {
            await agentManagementApi.disablePlugin(pluginId);
            showToast("插件已禁用", "success");
            if (selectedAgent) loadAgentDetail(selectedAgent);
          } catch (error) {
            showToast("禁用插件失败", "error");
          }
        }
        break;
      case "pluginHotReload":
        if (pluginName) {
          showToast(`正在热加载 ${pluginName}...`, "info");
          setTimeout(() => showToast(`${pluginName} 热加载成功`, "success"), 1000);
        }
        break;
      case "uninstallPlugin":
        if (pluginId) {
          confirmOperation(`确定要卸载此插件吗？`, async () => {
            try {
              await agentManagementApi.deletePlugin(pluginId);
              showToast("插件已卸载", "success");
              if (selectedAgent) loadAgentDetail(selectedAgent);
            } catch (error) {
              showToast("卸载插件失败", "error");
            }
          });
        }
        break;
      case "installPlugin":
        if (selectedAgent && pluginName) {
          showToast(`正在安装 ${pluginName}...`, "info");
          try {
            await agentManagementApi.addPlugin(selectedAgent, {
              pluginName: pluginName,
              pluginVersion: "1.0.0",
              description: "从插件市场安装",
              status: "online",
              enabled: true,
            });
            showToast(`${pluginName} 安装成功`, "success");
            loadAgentDetail(selectedAgent);
          } catch (error) {
            showToast("安装插件失败", "error");
          }
        }
        break;
      case "editConfig":
        if (configId !== undefined) {
          const config = configs.find(c => c.id === configId);
          if (config) {
            setEditingConfigId(configId);
            setEditingConfigValue(config.configValue);
          }
        }
        break;
      case "saveConfig":
        if (editingConfigId !== null) {
          try {
            await agentManagementApi.updateConfig(editingConfigId, editingConfigValue);
            showToast("配置更新成功", "success");
            setEditingConfigId(null);
            if (selectedAgent) loadAgentDetail(selectedAgent);
          } catch (error) {
            showToast("配置更新失败", "error");
          }
        }
        break;
      case "cancelEditConfig":
        setEditingConfigId(null);
        break;
      case "resetConfig":
        if (configId !== undefined) {
          confirmOperation("确定要重置此配置为默认值吗？", async () => {
            try {
              await agentManagementApi.resetConfig(configId);
              showToast("配置已重置", "success");
              if (selectedAgent) loadAgentDetail(selectedAgent);
            } catch (error) {
              showToast("配置重置失败", "error");
            }
          });
        }
        break;
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  const stats = [
    { label: "在线节点", value: agents.filter(a => a.status === "online").length, color: "#00D68F" },
    { label: "异常节点", value: agents.filter(a => a.status === "warning").length, color: "#FFAA00" },
    { label: "离线节点", value: agents.filter(a => a.status === "offline").length, color: "#94A3B8" },
    { label: "需升级", value: agents.filter(a => a.version !== "v2.4.1").length, color: "#165DFF" },
  ];

  // Render plugins tab content
  const renderPluginsTab = () => {
    if (plugins.length === 0) {
      return (
        <div className="p-4 text-center">
          <Package className="mx-auto mb-3 text-gray-500" size={32} />
          <p className="text-gray-500 text-sm">暂无已安装插件</p>
          <TechButton 
            variant="primary" 
            size="sm" 
            className="mt-3"
            icon={<Plus size={12} />}
            onClick={() => setTab("market")}
          >
            从市场安装
          </TechButton>
        </div>
      );
    }

    const getPluginDependencies = (pluginName: string) => {
      const dependencies: Record<string, { required: boolean; version: string; compatible: boolean }> = {
        "servlet": { required: true, version: "v2.0.0", compatible: true },
        "jdbc": { required: false, version: "v1.8.0", compatible: true },
        "redis": { required: false, version: "v2.1.0", compatible: false },
        "kafka": { required: false, version: "v2.3.0", compatible: true },
        "spring": { required: true, version: "v3.0.0", compatible: true },
        "dubbo": { required: false, version: "v2.7.0", compatible: true },
        "rabbitmq": { required: false, version: "v2.2.0", compatible: false },
      };
      return dependencies[pluginName] || null;
    };

    const getAgentVersion = () => selectedAgentData?.version || "v2.4.1";
    const isCompatible = (pluginVersion: string) => {
      const agentVer = getAgentVersion().replace("v", "").split(".").map(Number);
      const pluginVer = pluginVersion.replace("v", "").split(".").map(Number);
      return agentVer[0] >= pluginVer[0] && agentVer[1] >= pluginVer[1];
    };

    return (
      <div className="divide-y">
        {plugins.map((plugin) => {
          const depInfo = getPluginDependencies(plugin.name);
          const compatible = isCompatible(`v${plugin.version}`);
          
          return (
            <div key={plugin.id} className="p-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{plugin.name}</span>
                    <StatusBadge status={plugin.status} />
                    {!compatible && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded">版本不兼容</span>
                    )}
                    {compatible && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-600 rounded">兼容</span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{plugin.desc}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-gray-400">v{plugin.version}</span>
                    {depInfo && (
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400">依赖:</span>
                        <span className={`${depInfo.compatible ? "text-green-500" : "text-red-500"}`}>
                          {depInfo.required ? "必需" : "可选"} {depInfo.version}
                        </span>
                        {!depInfo.compatible && (
                          <span className="text-red-400">不兼容</span>
                        )}
                      </div>
                    )}
                  </div>
                  {!compatible && (
                    <div className="mt-2 p-2 rounded bg-red-50 text-xs text-red-600">
                      当前 Agent 版本 {getAgentVersion()} 与该插件版本不兼容，建议升级 Agent 或插件
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {plugin.enabled ? (
                    <TechButton variant="ghost" size="xs" icon={<Power size={10} />} onClick={() => handleAction("pluginDisable", undefined, undefined, plugin.id)}>
                      禁用
                    </TechButton>
                  ) : (
                    <TechButton variant="ghost" size="xs" icon={<Power size={10} />} onClick={() => handleAction("pluginEnable", undefined, undefined, plugin.id)}>
                      启用
                    </TechButton>
                  )}
                  <TechButton variant="ghost" size="xs" icon={<RefreshCw size={10} />} onClick={() => handleAction("pluginHotReload", undefined, plugin.name)}>
                    热加载
                  </TechButton>
                  <TechButton variant="ghost" size="xs" icon={<Trash2 size={10} />} onClick={() => handleAction("uninstallPlugin", undefined, undefined, plugin.id)}>
                    卸载
                  </TechButton>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render config tab content
  const renderConfigTab = () => {
    if (configs.length === 0) {
      return (
        <div className="p-4 text-center">
          <Settings className="mx-auto mb-3 text-gray-500" size={32} />
          <p className="text-gray-500 text-sm">暂无配置项</p>
        </div>
      );
    }

    return (
      <div className="divide-y max-h-96 overflow-y-auto">
        {configs.map((config) => (
          <div key={config.id} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{config.configKey}</span>
              {config.isOverridden && (
                <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">已覆盖</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mb-2">{config.description}</p>
            {editingConfigId === config.id ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editingConfigValue}
                  onChange={(e) => setEditingConfigValue(e.target.value)}
                  className="flex-1 text-sm px-2 py-1 border rounded"
                  autoFocus
                />
                <TechButton variant="primary" size="xs" icon={<CheckCircle size={10} />} onClick={() => handleAction("saveConfig")}>
                  保存
                </TechButton>
                <TechButton variant="ghost" size="xs" icon={<X size={10} />} onClick={() => handleAction("cancelEditConfig")}>
                  取消
                </TechButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={config.configValue}
                  className="flex-1 text-sm px-2 py-1 border rounded"
                  readOnly
                />
                <TechButton variant="ghost" size="xs" icon={<Edit size={10} />} onClick={() => handleAction("editConfig", undefined, undefined, undefined, config.id)}>
                  编辑
                </TechButton>
                {config.isOverridden && (
                  <TechButton variant="ghost" size="xs" onClick={() => handleAction("resetConfig", undefined, undefined, undefined, config.id)}>
                    重置
                  </TechButton>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render commands tab content
  const renderCommandsTab = () => {
    if (commands.length === 0) {
      return (
        <div className="p-4 text-center">
          <Clock className="mx-auto mb-3 text-gray-500" size={32} />
          <p className="text-gray-500 text-sm">暂无命令历史</p>
        </div>
      );
    }

    return (
      <div className="divide-y max-h-96 overflow-y-auto">
        {commands.map((command) => (
          <div key={command.id} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-sm">{command.commandType}</span>
              <StatusBadge status={command.status as any} />
            </div>
            <p className="text-xs text-gray-500">{command.createdAt}</p>
            {command.resultData && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                <pre className="whitespace-pre-wrap">{command.resultData}</pre>
              </div>
            )}
            {command.errorMessage && (
              <div className="mt-2 p-2 bg-red-50 text-red-500 rounded text-xs">
                {command.errorMessage}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Render performance chart tab
  const renderPerformanceChartTab = () => {
    const CustomTooltip = ({ active, payload, label }: any) => {
      if (active && payload && payload.length) {
        return (
          <div className="px-3 py-2 rounded-lg shadow-lg" style={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.2)" }}>
            <p className="text-xs mb-2" style={{ color: "#94A3B8" }}>{label}</p>
            {payload.map((entry: any, index: number) => (
              <p key={index} className="text-xs" style={{ color: entry.color }}>
                {entry.name}: {typeof entry.value === "number" ? entry.value.toFixed(1) : entry.value}{entry.unit || ""}
              </p>
            ))}
          </div>
        );
      }
      return null;
    };

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-blue-500" />
            <span className="text-sm font-medium text-white">实时性能趋势</span>
          </div>
          <button
            onClick={() => setPerformanceHistory(mockPerformanceHistory())}
            className="px-2 py-1 rounded text-xs transition-colors"
            style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
          >
            刷新数据
          </button>
        </div>
        
        {/* CPU & Memory Chart */}
        <div className="mb-4">
          <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>CPU & 内存使用率</div>
          <ResponsiveContainer width="100%" height={120}>
            <LineChart data={performanceHistory}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="cpu" name="CPU" stroke="#165DFF" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="memory" name="内存" stroke="#00D68F" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Network Traffic Chart */}
        <div className="mb-4">
          <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>网络流量 (KB/s)</div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={performanceHistory}>
              <defs>
                <linearGradient id="gradNetworkIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#165DFF" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#165DFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradNetworkOut" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A855F7" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#A855F7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="networkIn" name="入站" stroke="#165DFF" fill="url(#gradNetworkIn)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="networkOut" name="出站" stroke="#A855F7" fill="url(#gradNetworkOut)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Disk Usage Chart */}
        <div>
          <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>磁盘使用率 (%)</div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={performanceHistory}>
              <defs>
                <linearGradient id="gradDisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFAA00" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#FFAA00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="disk" name="磁盘" stroke="#FFAA00" fill="url(#gradDisk)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render logs tab content
  const renderLogsTab = () => {
    const filteredLogs = logLevelFilter === "all" 
      ? agentLogs 
      : agentLogs.filter(log => log.level === logLevelFilter);
    
    if (filteredLogs.length === 0) {
      return (
        <div className="p-4 text-center">
          <Terminal className="mx-auto mb-3 text-gray-500" size={32} />
          <p className="text-gray-500 text-sm">暂无日志数据</p>
        </div>
      );
    }

    const getLevelColor = (level: string) => {
      switch (level) {
        case "ERROR": return "text-red-400 bg-red-400/10";
        case "WARN": return "text-yellow-400 bg-yellow-400/10";
        case "INFO": return "text-blue-400 bg-blue-400/10";
        default: return "text-gray-400 bg-gray-400/10";
      }
    };

    return (
      <div>
        {/* 日志级别过滤器 */}
        <div className="p-3 border-b border-border flex gap-2">
          {["all", "DEBUG", "INFO", "WARN", "ERROR"].map((level) => (
            <button
              key={level}
              onClick={() => setLogLevelFilter(level)}
              className={`px-2 py-1 rounded text-xs transition-colors ${
                logLevelFilter === level 
                  ? "bg-blue-500 text-white" 
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {level === "all" ? "全部" : level}
            </button>
          ))}
        </div>
        
        {/* 日志列表 */}
        <div className="divide-y max-h-72 overflow-y-auto">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-2 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-2">
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium shrink-0 ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                    <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    <span className="text-xs text-gray-500">[{log.thread}]</span>
                    <span className="text-xs text-gray-500 truncate">{log.class}</span>
                  </div>
                  <div className="text-xs text-white break-all">{log.message}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render market tab content
  const renderMarketTab = () => {
    if (marketPlugins.length === 0) {
      return (
        <div className="p-4 text-center">
          <Package className="mx-auto mb-3 text-gray-500" size={32} />
          <p className="text-gray-500 text-sm">暂无插件市场数据</p>
        </div>
      );
    }

    return (
      <div className="divide-y max-h-96 overflow-y-auto">
        {marketPlugins.map((plugin, index) => (
          <div key={index} className="p-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{plugin.name}</span>
                  {plugin.hot && <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded">热门</span>}
                </div>
                <p className="text-xs text-gray-500 mt-1">{plugin.desc}</p>
              </div>
              <TechButton 
                variant="primary" 
                size="xs" 
                icon={<Plus size={10} />}
                onClick={() => handleAction("installPlugin", undefined, plugin.name)}
              >
                安装
              </TechButton>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <MainLayout title="Agent管控中心">
      <div data-cmp="AgentControl" className="space-y-4">
        <PageHeader
          title="Agent 管控中心"
          subtitle={`${agents.filter(a => a.status === "online").length}/${agents.length} 节点在线`}
          actions={
            <div className="flex items-center gap-2">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSearch={() => setCurrentPage(1)}
                placeholder="搜索Agent节点..."
              />
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={() => handleAction("globalRefresh")}>
                全局刷新
              </TechButton>
              <TechButton variant="primary" icon={<Upload size={13} />} onClick={() => handleAction("batchUpgrade")}>
                批量升级
              </TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={() => handleAction("batchReload")}>
                批量热加载
              </TechButton>
            </div>
          }
        />

        <div className="flex gap-3">
          {stats.map((s) => (
            <div key={s.label} className="flex-1 rounded-lg p-3 flex items-center gap-3 bg-card border border-border">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `${s.color}1a`, color: s.color }}>{s.value}</div>
              <span className="text-xs text-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>

        {/* 分组管理 */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">分组筛选:</span>
            <select
              value={selectedGroup || ""}
              onChange={(e) => setSelectedGroup(e.target.value ? Number(e.target.value) : null)}
              className="px-2 py-1 rounded text-xs border bg-muted"
            >
              <option value="">全部分组</option>
              {agentGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name} ({group.agentIds.length}个节点)
                </option>
              ))}
            </select>
            {/* 分组标签 */}
            <div className="flex items-center gap-1">
              {agentGroups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => setSelectedGroup(selectedGroup === group.id ? null : group.id)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    selectedGroup === group.id 
                      ? "bg-white/20" 
                      : "bg-muted hover:bg-muted-foreground/20"
                  }`}
                  style={{ borderLeft: `3px solid ${group.color}` }}
                >
                  {group.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TechButton variant="secondary" size="sm" icon={<Plus size={12} />} onClick={() => setShowGroupModal(true)}>
              新建分组
            </TechButton>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg overflow-hidden bg-card border border-border">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedAgents.size === filteredAgents.length && filteredAgents.length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedAgents(new Set(filteredAgents.map(a => a.id)));
                    } else {
                      setSelectedAgents(new Set());
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm text-gray-600">
                  {selectedAgents.size > 0 ? `已选择 ${selectedAgents.size} 个` : ""}
                </span>
              </div>
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-blue-500/5">
                  {["选择", "主机IP", "关联应用", "版本", "状态", "插件数", "心跳", "操作"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-xs text-muted-foreground">未找到匹配的Agent节点</td>
                  </tr>
                ) : (
                  paginatedData.map((ag) => (
                    <tr
                      key={ag.id}
                      className={`table-row-hover transition-colors cursor-pointer border-b border-border ${selectedAgent === ag.id ? "bg-blue-500/8" : ""}`}
                      onClick={() => setSelectedAgent(ag.id)}
                    >
                      <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedAgents.has(ag.id)}
                          onChange={() => toggleAgentSelection(ag.id)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Cpu size={13} className="text-blue-500" />
                          <span className="text-xs font-medium text-white font-mono">{ag.host}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{ag.app}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ag.version === "v2.4.1" ? "rgba(0,214,143,0.1)" : "rgba(255,170,0,0.1)", color: ag.version === "v2.4.1" ? "#00D68F" : "#FFAA00" }}>{ag.version}</span>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={ag.status} /></td>
                      <td className="px-4 py-2.5 text-xs text-white">{ag.plugins}</td>
                      <td className="px-4 py-2.5 text-xs text-muted-foreground">{ag.lastHb}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <TechButton variant="ghost" size="xs" icon={<Settings size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("config", ag); }}>
                            配置
                          </TechButton>
                          <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("restart", ag); }}>
                            重启
                          </TechButton>
                          <TechButton variant="ghost" size="xs" icon={<Download size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("upgrade", ag); }}>
                            升级
                          </TechButton>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
            <Pagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalPages={totalPages}
              totalCount={filteredAgents.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
              canPrev={canPrevPage}
              canNext={canNextPage}
            />
          </div>

          <div className="w-96 rounded-lg flex-shrink-0 overflow-hidden bg-card border border-border">
            <div className="flex border-b border-border overflow-x-auto">
              {([
                ["list", "节点详情"],
                ["plugins", "已安装插件"],
                ["config", "配置管理"],
                ["commands", "命令历史"],
                ["performance", "性能趋势"],
                ["logs", "Agent日志"],
                ["market", "插件市场"],
              ] as [string, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as any)}
                  className={`flex-1 py-2.5 px-2 text-xs font-medium transition-colors whitespace-nowrap ${tab === key ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={`p-4 ${tab === "list" ? "" : "hidden"}`}>
              {selectedAgentData ? (
                <div className="space-y-4">
                  {/* 基础信息 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/15">
                      <Cpu size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{selectedAgentData.host}</div>
                      <StatusBadge status={selectedAgentData.status} />
                    </div>
                  </div>
                  
                  {/* 心跳监控状态 */}
                  {agentHeartbeat[selectedAgentData.id] && (
                    <div className="p-3 rounded-md bg-card border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Activity size={12} className="text-green-500" />
                          <span>心跳监控</span>
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          agentHeartbeat[selectedAgentData.id].status === "在线" 
                            ? "bg-green-500/15 text-green-400" 
                            : agentHeartbeat[selectedAgentData.id].status === "心跳延迟"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {agentHeartbeat[selectedAgentData.id].status}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-muted-foreground mb-0.5">最后心跳</div>
                          <div className="text-white font-medium">{agentHeartbeat[selectedAgentData.id].lastTime}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-0.5">延迟</div>
                          <div className={`font-medium ${
                            agentHeartbeat[selectedAgentData.id].latency > 100 
                              ? "text-red-400" 
                              : agentHeartbeat[selectedAgentData.id].latency > 50
                              ? "text-yellow-400"
                              : "text-green-400"
                          }`}>
                            {agentHeartbeat[selectedAgentData.id].latency}ms
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* 健康度评分 */}
                  {agentHealthScores[selectedAgentData.id] && (
                    <div className="p-3 rounded-md bg-card border border-border">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Activity size={12} className="text-green-500" />
                          <span>健康度评估</span>
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded ${
                          agentHealthScores[selectedAgentData.id].status === "healthy" 
                            ? "bg-green-500/15 text-green-400" 
                            : agentHealthScores[selectedAgentData.id].status === "warning"
                            ? "bg-yellow-500/15 text-yellow-400"
                            : "bg-red-500/15 text-red-400"
                        }`}>
                          {agentHealthScores[selectedAgentData.id].status === "healthy" ? "健康" : 
                           agentHealthScores[selectedAgentData.id].status === "warning" ? "亚健康" : "危险"}
                        </div>
                      </div>
                      <div className="flex items-center justify-center mb-3">
                        <div className="relative w-20 h-20">
                          <svg className="w-20 h-20 transform -rotate-90">
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              className="text-gray-700"
                            />
                            <circle
                              cx="40"
                              cy="40"
                              r="36"
                              stroke="currentColor"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${(agentHealthScores[selectedAgentData.id].score / 100) * 226} 226`}
                              className={agentHealthScores[selectedAgentData.id].score >= 80 ? "text-green-500" : 
                                         agentHealthScores[selectedAgentData.id].score >= 60 ? "text-yellow-500" : "text-red-500"}
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className={`text-xl font-bold ${
                              agentHealthScores[selectedAgentData.id].score >= 80 ? "text-green-400" : 
                               agentHealthScores[selectedAgentData.id].score >= 60 ? "text-yellow-400" : "text-red-400"
                            }`}>
                              {agentHealthScores[selectedAgentData.id].score}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          { label: "CPU", value: agentHealthScores[selectedAgentData.id].cpu, weight: 0.25 },
                          { label: "内存", value: agentHealthScores[selectedAgentData.id].memory, weight: 0.25 },
                          { label: "磁盘", value: agentHealthScores[selectedAgentData.id].disk, weight: 0.2 },
                          { label: "网络", value: agentHealthScores[selectedAgentData.id].network, weight: 0.15 },
                          { label: "插件", value: agentHealthScores[selectedAgentData.id].plugins, weight: 0.15 },
                        ].map((metric) => (
                          <div key={metric.label} className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-10">{metric.label}</span>
                            <div className="flex-1 h-2 rounded-full bg-gray-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  metric.value >= 80 ? "bg-green-500" : metric.value >= 60 ? "bg-yellow-500" : "bg-red-500"
                                }`}
                                style={{ width: `${metric.value}%` }}
                              />
                            </div>
                            <span className="text-xs text-white w-8 text-right">{metric.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* 性能指标卡片 */}
                  {agentMetrics && (
                    <>
                      {/* CPU & 内存 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-md bg-card border border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Activity size={12} />
                            <span>CPU</span>
                          </div>
                          <div className="text-lg font-bold text-blue-400">{agentMetrics.cpu.usage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">{agentMetrics.cpu.cores} 核</div>
                        </div>
                        <div className="p-3 rounded-md bg-card border border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <HardDrive size={12} />
                            <span>内存</span>
                          </div>
                          <div className="text-lg font-bold text-green-400">{agentMetrics.memory.used.toFixed(1)}G</div>
                          <div className="text-xs text-muted-foreground">{agentMetrics.memory.total}G 总量</div>
                        </div>
                      </div>

                      {/* 网络 & 磁盘 */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-3 rounded-md bg-card border border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <Wifi size={12} />
                            <span>网络</span>
                          </div>
                          <div className="text-xs">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">入站</span>
                              <span className="text-blue-400">{agentMetrics.network.inSpeed.toFixed(0)} KB/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">出站</span>
                              <span className="text-green-400">{agentMetrics.network.outSpeed.toFixed(0)} KB/s</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-3 rounded-md bg-card border border-border">
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                            <BarChart3 size={12} />
                            <span>磁盘</span>
                          </div>
                          <div className="text-lg font-bold text-purple-400">{agentMetrics.disk.usage.toFixed(1)}%</div>
                          <div className="text-xs text-muted-foreground">已使用</div>
                        </div>
                      </div>

                      {/* 运行信息 */}
                      <div className="p-3 rounded-md bg-muted">
                        {([
                          ["运行时间", agentMetrics.uptime],
                          ["进程数", agentMetrics.processCount],
                          ["线程数", agentMetrics.threadCount],
                          ["GC 次数", agentMetrics.gcCount],
                          ["最后 GC", agentMetrics.lastGc],
                          ["连接数", agentMetrics.network.connections],
                        ] as [string, any][]).map(([k, v]) => (
                          <div key={k} className="flex justify-between text-xs py-1">
                            <span className="text-muted-foreground">{k}</span>
                            <span className="text-white font-medium">{v}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  {/* 基础信息 */}
                  <div className="p-3 rounded-md bg-muted">
                    {([
                      ["操作系统", selectedAgentData.os],
                      ["Agent版本", selectedAgentData.version],
                      ["关联应用", selectedAgentData.app],
                      ["插件数量", String(selectedAgentData.plugins)],
                      ["最后心跳", selectedAgentData.lastHb],
                    ] as [string, any][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs py-1">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>

                  {/* 操作按钮 */}
                  <div className="space-y-2">
                    <TechButton variant="primary" size="xs" icon={<Zap size={12} />} onClick={() => handleAction("hotReload", selectedAgentData)}>
                      热加载配置
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Upload size={12} />} onClick={() => handleAction("upgrade", selectedAgentData)}>
                      版本升级
                    </TechButton>
                    <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleAction("uninstallAgent", selectedAgentData)}>
                      卸载 Agent
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Terminal size={12} />} onClick={() => {
                      setShowDebugModal(true);
                      setDebugCommand("status");
                      setDebugOutput(mockDebugCommand("status", selectedAgentData.id));
                    }}>
                      远程调试
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Zap size={12} />} onClick={() => setShowAutoScaleModal(true)}>
                      自动扩缩容
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Activity size={12} />} onClick={() => setShowTrafficMirrorModal(true)}>
                      流量镜像
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<BarChart3 size={12} />} onClick={() => setShowCapacityModal(true)}>
                      容量规划
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Download size={12} />} onClick={() => setShowBackupModal(true)}>
                      备份管理
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Lightbulb size={12} />} onClick={() => setShowSuggestionsModal(true)}>
                      优化建议
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Shield size={12} />} onClick={() => setShowAuditModal(true)}>
                      安全审计
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<SlidersHorizontal size={12} />} onClick={() => setShowQuotaModal(true)}>
                      资源配额
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<History size={12} />} onClick={() => setShowChangeHistoryModal(true)}>
                      变更历史
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<BarChart3 size={12} />} onClick={() => setShowReportsModal(true)}>
                      分析报表
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<LayoutDashboard size={12} />} onClick={() => setShowDashboardModal(true)}>
                      自定义仪表盘
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<BellRing size={12} />} onClick={() => setShowAlertPoliciesModal(true)}>
                      智能告警
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<BarChart3 size={12} />} onClick={() => setShowPerformanceComparisonModal(true)}>
                      性能对比分析
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Network size={12} />} onClick={() => setShowServiceDependenciesModal(true)}>
                      服务依赖关系
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<AlertTriangle size={12} />} onClick={() => setShowAlertEscalationModal(true)}>
                      告警升级策略
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Building2 size={12} />} onClick={() => setShowTenantsModal(true)}>
                      多租户管理
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Award size={12} />} onClick={() => setShowApmScoreModal(true)}>
                      性能评分
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Bug size={12} />} onClick={() => setShowErrorTrackingModal(true)}>
                      错误追踪
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Database size={12} />} onClick={() => setShowDbAnalysisModal(true)}>
                      数据库分析
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<HardDrive size={12} />} onClick={() => setShowCacheAnalysisModal(true)}>
                      缓存分析
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Award size={12} />} onClick={() => setShowSlaModal(true)}>
                      SLA监控
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<GitBranch size={12} />} onClick={() => setShowTransactionModal(true)}>
                      分布式事务
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<MessageSquare size={12} />} onClick={() => setShowMqModal(true)}>
                      消息队列监控
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Container size={12} />} onClick={() => setShowContainerModal(true)}>
                      容器监控
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Globe size={12} />} onClick={() => setShowCdnModal(true)}>
                      CDN监控
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Hexagon size={12} />} onClick={() => setShowServiceMeshModal(true)}>
                      服务网格
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Cloud size={12} />} onClick={() => setShowCloudNativeModal(true)}>
                      云原生监控
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Key size={12} />} onClick={() => setShowSecurityAuditModal(true)}>
                      安全审计
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<FileKey size={12} />} onClick={() => setShowApiSecurityModal(true)}>
                      API安全
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<UserCheck size={12} />} onClick={() => setShowUserBehaviorModal(true)}>
                      用户行为分析
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Layers size={12} />} onClick={() => setShowConfigVersionModal(true)}>
                      配置版本管理
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Zap size={12} />} onClick={() => setShowAutoOpsModal(true)}>
                      自动化运维
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<TrendingUp size={12} />} onClick={() => setShowCostAnalysisModal(true)}>
                      成本分析
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Activity size={12} />} onClick={() => setShowSmartSchedulingModal(true)}>
                      智能调度
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Network size={12} />} onClick={() => setShowFullTraceModal(true)}>
                      全链路追踪
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<AlertTriangle size={12} />} onClick={() => setShowAnomalyModal(true)}>
                      异常检测
                    </TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Wifi size={12} />} onClick={() => setShowServiceDiscoveryModal(true)}>
                      服务发现
                    </TechButton>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center py-8 text-muted-foreground">请选择 Agent 节点</div>
              )}
            </div>

            <div className={`${tab === "plugins" ? "" : "hidden"}`}>
              {renderPluginsTab()}
            </div>

            <div className={`${tab === "config" ? "" : "hidden"}`}>
              {renderConfigTab()}
            </div>

            <div className={`${tab === "commands" ? "" : "hidden"}`}>
              {renderCommandsTab()}
            </div>

            <div className={`${tab === "performance" ? "" : "hidden"}`}>
              {renderPerformanceChartTab()}
            </div>

            <div className={`${tab === "logs" ? "" : "hidden"}`}>
              {renderLogsTab()}
            </div>

            <div className={`${tab === "market" ? "" : "hidden"}`}>
              {renderMarketTab()}
            </div>
          </div>
        </div>
      </div>

      {/* 新建分组模态框 */}
      {showGroupModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowGroupModal(false)}>
          <div className="bg-card border border-border rounded-lg p-4 w-80" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-white">新建分组</h3>
              <button onClick={() => setShowGroupModal(false)} className="text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">分组名称</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border rounded bg-muted"
                  placeholder="请输入分组名称"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">分组颜色</label>
                <div className="flex gap-2">
                  {["#FF4D4F", "#FFAA00", "#165DFF", "#00D68F", "#A855F7", "#06B6D4"].map((color) => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded-full border-2 border-transparent hover:border-white"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        const newGroup = {
                          id: Date.now(),
                          name: newGroupName || "未命名分组",
                          color,
                          agentIds: [],
                        };
                        setAgentGroups([...agentGroups, newGroup]);
                        setShowGroupModal(false);
                        setNewGroupName("");
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <TechButton variant="ghost" onClick={() => setShowGroupModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => {
                const newGroup = {
                  id: Date.now(),
                  name: newGroupName || "未命名分组",
                  color: "#165DFF",
                  agentIds: [],
                };
                setAgentGroups([...agentGroups, newGroup]);
                setShowGroupModal(false);
                setNewGroupName("");
              }}>创建</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 远程调试模态框 */}
      {showDebugModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowDebugModal(false)}>
          <div className="bg-card border border-border rounded-lg p-4 w-[600px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Terminal size={16} className="text-blue-500" />
                <h3 className="text-sm font-medium text-white">远程调试</h3>
                {selectedAgentData && (
                  <span className="text-xs text-muted-foreground">Agent: {selectedAgentData.host}</span>
                )}
              </div>
              <button onClick={() => setShowDebugModal(false)} className="text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>
            
            {/* 快速命令按钮 */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {["status", "threads", "heap", "gc", "plugins", "config"].map((cmd) => (
                <button
                  key={cmd}
                  onClick={() => {
                    setDebugCommand(cmd);
                    setDebugOutput(mockDebugCommand(cmd, selectedAgentData?.id || 0));
                  }}
                  className={`px-3 py-1.5 rounded text-xs transition-colors ${
                    debugCommand === cmd ? "bg-blue-500 text-white" : "bg-muted text-muted-foreground hover:bg-muted-foreground/20"
                  }`}
                >
                  {cmd.toUpperCase()}
                </button>
              ))}
            </div>

            {/* 输出区域 */}
            <div className="flex-1 overflow-hidden rounded bg-slate-900 border border-slate-700">
              <div className="p-3 h-full overflow-y-auto">
                <pre className="text-xs text-green-400 whitespace-pre-wrap font-mono leading-relaxed">
                  {debugOutput || "执行命令后结果将显示在这里..."}
                </pre>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <TechButton variant="secondary" onClick={() => setShowDebugModal(false)}>关闭</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 自动扩缩容配置模态框 */}
      {showAutoScaleModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowAutoScaleModal(false)}>
          <div className="bg-card border border-border rounded-lg p-4 w-[700px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-green-500" />
                <h3 className="text-sm font-medium text-white">自动扩缩容配置</h3>
              </div>
              <button onClick={() => setShowAutoScaleModal(false)} className="text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* 扩缩容开关 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted mb-4">
              <div>
                <div className="text-sm font-medium text-white">启用自动扩缩容</div>
                <div className="text-xs text-muted-foreground">根据规则自动调整 Agent 数量</div>
              </div>
              <button
                onClick={() => setAutoScaleRules(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  autoScaleRules.enabled ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  autoScaleRules.enabled ? "translate-x-7" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* 扩缩容范围 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">最小 Agent 数量</label>
                <input
                  type="number"
                  value={autoScaleRules.minAgents}
                  onChange={(e) => setAutoScaleRules(prev => ({ ...prev, minAgents: parseInt(e.target.value) || 1 }))}
                  className="w-full px-3 py-2 text-sm border rounded bg-muted"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">最大 Agent 数量</label>
                <input
                  type="number"
                  value={autoScaleRules.maxAgents}
                  onChange={(e) => setAutoScaleRules(prev => ({ ...prev, maxAgents: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 text-sm border rounded bg-muted"
                  min="1"
                />
              </div>
            </div>

            {/* 扩缩容规则 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">扩缩容规则</span>
                <TechButton variant="ghost" size="xs" icon={<Plus size={12} />}>
                  添加规则
                </TechButton>
              </div>
              <div className="space-y-2">
                {autoScaleRules.rules.map((rule) => (
                  <div key={rule.id} className="p-3 rounded-lg bg-muted border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rule.action === "scale_up" ? "bg-green-500/15 text-green-400" : "bg-red-500/15 text-red-400"
                        }`}>
                          {rule.action === "scale_up" ? "扩容" : "缩容"}
                        </span>
                        <span className="text-sm text-white">{rule.metric}</span>
                        <span className="text-xs text-muted-foreground">{rule.condition} {rule.threshold}</span>
                      </div>
                      <button className="text-xs text-red-400 hover:text-red-300">删除</button>
                    </div>
                    <div className="text-xs text-muted-foreground">冷却时间: {rule.cooldown} 分钟</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 预览 */}
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
              <div className="text-xs text-blue-400 mb-1">扩缩容预览</div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{autoScaleRules.minAgents}</div>
                  <div className="text-xs text-muted-foreground">最小</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="h-1 flex-1 rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-blue-500" />
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{autoScaleRules.maxAgents}</div>
                  <div className="text-xs text-muted-foreground">最大</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <TechButton variant="ghost" onClick={() => setShowAutoScaleModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowAutoScaleModal(false)}>保存配置</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 流量镜像配置模态框 */}
      {showTrafficMirrorModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowTrafficMirrorModal(false)}>
          <div className="bg-card border border-border rounded-lg p-4 w-[800px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-purple-500" />
                <h3 className="text-sm font-medium text-white">流量镜像配置</h3>
              </div>
              <button onClick={() => setShowTrafficMirrorModal(false)} className="text-muted-foreground hover:text-white">
                <X size={16} />
              </button>
            </div>

            {/* 流量镜像开关 */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted mb-4">
              <div>
                <div className="text-sm font-medium text-white">启用流量镜像</div>
                <div className="text-xs text-muted-foreground">将生产流量复制到测试环境进行验证</div>
              </div>
              <button
                onClick={() => setTrafficMirroring(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  trafficMirroring.enabled ? "bg-green-500" : "bg-gray-600"
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                  trafficMirroring.enabled ? "translate-x-7" : "translate-x-1"
                }`} />
              </button>
            </div>

            {/* 镜像规则列表 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">镜像规则</span>
                <TechButton variant="ghost" size="xs" icon={<Plus size={12} />}>
                  添加规则
                </TechButton>
              </div>
              <div className="space-y-2">
                {trafficMirroring.rules.map((rule) => (
                  <div key={rule.id} className="p-4 rounded-lg bg-muted border border-border">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{rule.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          rule.status === "active" ? "bg-green-500/15 text-green-400" : 
                          rule.status === "paused" ? "bg-yellow-500/15 text-yellow-400" : 
                          "bg-gray-500/15 text-gray-400"
                        }`}>
                          {rule.status === "active" ? "运行中" : rule.status === "paused" ? "已暂停" : "已停止"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button className="text-xs text-blue-400 hover:text-blue-300">
                          {rule.status === "active" ? "暂停" : "启动"}
                        </button>
                        <button className="text-xs text-red-400 hover:text-red-300">删除</button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-muted-foreground mb-1">源 Agent</div>
                        <div className="text-white">{rule.sourceAgent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">目标 Agent</div>
                        <div className="text-white">{rule.targetAgent}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1">镜像比例</div>
                        <div className="text-white">{rule.percentage}%</div>
                      </div>
                    </div>
                    {/* 流量统计 */}
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <div className="text-muted-foreground">镜像流量</div>
                          <div className="text-purple-400 font-medium">{(Math.random() * 100).toFixed(1)} MB/s</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">请求数</div>
                          <div className="text-white font-medium">{Math.floor(Math.random() * 1000)}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">延迟增加</div>
                          <div className="text-yellow-400 font-medium">{Math.random().toFixed(1)}ms</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 流量可视化 */}
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20 mb-4">
              <div className="text-xs text-purple-400 mb-2">流量流向图</div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-2">
                    <Cpu size={24} className="text-purple-500" />
                  </div>
                  <div className="text-xs text-white">生产环境</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="relative h-2 flex-1 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500">
                    <div className="absolute inset-y-0 left-0 w-1/3 bg-purple-400 rounded-l-full" />
                  </div>
                  <Activity size={16} className="text-purple-500 mx-2" />
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                    <Cpu size={24} className="text-blue-500" />
                  </div>
                  <div className="text-xs text-white">测试环境</div>
                </div>
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <TechButton variant="ghost" onClick={() => setShowTrafficMirrorModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowTrafficMirrorModal(false)}>保存配置</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 批量操作进度显示 */}
      {batchOperationProgress !== null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl bg-slate-900/95 border border-blue-500/35 shadow-xl backdrop-blur">
          <div className="text-sm font-medium text-white mb-2">批量操作进行中...</div>
          <div className="w-64 h-2 rounded-full bg-gray-700 mb-2 overflow-hidden">
            <div 
              className="h-full rounded-full transition-all duration-300"
              style={{ 
                width: `${batchOperationProgress}%`,
                background: "linear-gradient(to right, #165DFF, #00D68F)"
              }}
            />
          </div>
          <div className="text-xs text-muted-foreground text-center">{batchOperationProgress}%</div>
        </div>
      )}

      {/* 批量操作结果提示 */}
      {batchOperationResult && batchOperationProgress === null && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-4 rounded-xl bg-slate-900/95 border border-green-500/35 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <CheckCircle size={16} className="text-green-500" />
              <span className="text-sm font-medium text-green-400">{batchOperationResult.success} 个成功</span>
            </div>
            {batchOperationResult.failed > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle size={16} className="text-red-500" />
                <span className="text-sm font-medium text-red-400">{batchOperationResult.failed} 个失败</span>
              </div>
            )}
            <button 
              onClick={() => setBatchOperationResult(null)}
              className="ml-4 px-2 py-1 rounded text-xs bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              关闭
            </button>
          </div>
        </div>
      )}

      {/* 性能优化建议模态框 */}
      {showSuggestionsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowSuggestionsModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[900px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Lightbulb size={20} className="text-yellow-500" />
                <h3 className="text-lg font-semibold text-white">智能优化建议</h3>
              </div>
              <button onClick={() => setShowSuggestionsModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {optimizationSuggestions.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className={`p-5 rounded-xl border ${
                    suggestion.type === "critical" 
                      ? "bg-red-500/10 border-red-500/20" 
                      : suggestion.type === "warning"
                      ? "bg-yellow-500/10 border-yellow-500/20"
                      : "bg-blue-500/10 border-blue-500/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-2 py-1 text-xs rounded ${
                          suggestion.type === "critical" ? "bg-red-500/20 text-red-400" :
                          suggestion.type === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {suggestion.type === "critical" ? "严重" : suggestion.type === "warning" ? "警告" : "建议"}
                        </span>
                        <span className="text-xs text-muted-foreground">影响: {suggestion.impact}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{suggestion.description}</p>
                      <div className="bg-muted/50 p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-2">优化建议</div>
                        <div className="text-sm text-white">{suggestion.suggestion}</div>
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-xs text-muted-foreground mb-1">当前值</div>
                      <div className="text-lg font-bold text-white">{suggestion.currentValue}</div>
                      <div className="text-xs text-muted-foreground mt-2 mb-1">建议值</div>
                      <div className="text-lg font-bold text-green-400">{suggestion.recommendedValue}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border">
                    {suggestion.status === "pending" && (
                      <TechButton variant="primary" size="sm">应用优化</TechButton>
                    )}
                    {suggestion.status === "in_progress" && (
                      <TechButton variant="secondary" size="sm" disabled>正在应用...</TechButton>
                    )}
                    {suggestion.status === "completed" && (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle size={12} /> 已优化
                      </span>
                    )}
                    <TechButton variant="ghost" size="sm">忽略</TechButton>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 安全审计日志模态框 */}
      {showAuditModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowAuditModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[1000px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-purple-500" />
                <h3 className="text-lg font-semibold text-white">安全审计日志</h3>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <input 
                type="text" 
                placeholder="搜索操作..."
                className="flex-1 px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white placeholder:text-muted-foreground"
              />
              <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white">
                <option>全部操作</option>
                <option>插件安装</option>
                <option>配置修改</option>
                <option>命令执行</option>
                <option>登录</option>
              </select>
              <TechButton variant="primary" size="sm">导出日志</TechButton>
            </div>

            <div className="flex-1 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">时间</th>
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">操作</th>
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">目标</th>
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">操作人</th>
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">IP地址</th>
                    <th className="text-left text-xs text-muted-foreground pb-3 font-medium">结果</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-muted/30">
                      <td className="py-3 text-xs text-white">{log.timestamp}</td>
                      <td className="py-3 text-sm text-white">{log.action}</td>
                      <td className="py-3 text-sm text-white">{log.target}</td>
                      <td className="py-3 text-sm text-white">{log.operator}</td>
                      <td className="py-3 text-xs text-muted-foreground">{log.ipAddress}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          log.result === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                        }`}>
                          {log.result === "success" ? "成功" : "失败"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 资源配额管理模态框 */}
      {showQuotaModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowQuotaModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[800px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={20} className="text-blue-500" />
                <h3 className="text-lg font-semibold text-white">资源配额管理</h3>
              </div>
              <button onClick={() => setShowQuotaModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">启用配额限制</span>
                <button 
                  className={`w-10 h-5 rounded-full relative ${resourceQuotas.enabled ? "bg-green-500" : "bg-gray-600"}`}
                  onClick={() => setResourceQuotas({ ...resourceQuotas, enabled: !resourceQuotas.enabled })}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${resourceQuotas.enabled ? "right-0.5" : "left-0.5"}`} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {resourceQuotas.quotas.map((quota) => (
                <div key={quota.id} className="p-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        quota.type === "cpu" ? "bg-blue-500/20 text-blue-500" :
                        quota.type === "memory" ? "bg-green-500/20 text-green-500" :
                        quota.type === "disk" ? "bg-purple-500/20 text-purple-500" :
                        "bg-yellow-500/20 text-yellow-500"
                      }`}>
                        {quota.type === "cpu" ? <Cpu size={18} /> :
                         quota.type === "memory" ? <MemoryStick size={18} /> :
                         quota.type === "disk" ? <HardDrive size={18} /> :
                         <Network size={18} />}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">{quota.name}</div>
                        <div className="text-xs text-muted-foreground">
                          限制: {quota.limit} {quota.unit} | 当前: {quota.currentUsage} {quota.unit}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${
                        quota.enforced ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                      }`}>
                        {quota.enforced ? "已启用" : "未启用"}
                      </span>
                    </div>
                  </div>
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">使用率</span>
                      <span className="text-white">{((quota.currentUsage / quota.limit) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          ((quota.currentUsage / quota.limit) * 100) > 80 ? "bg-red-500" :
                          ((quota.currentUsage / quota.limit) * 100) > 60 ? "bg-yellow-500" :
                          "bg-green-500"
                        }`}
                        style={{ width: `${Math.min((quota.currentUsage / quota.limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    警告阈值: {quota.warningThreshold}% | 强制限制: {quota.enforced ? "是" : "否"}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <TechButton variant="ghost" onClick={() => setShowQuotaModal(false)}>取消</TechButton>
              <TechButton variant="primary">保存配额</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 变更追踪历史模态框 */}
      {showChangeHistoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowChangeHistoryModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[900px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <History size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-white">变更追踪历史</h3>
              </div>
              <button onClick={() => setShowChangeHistoryModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white">
                <option>全部类型</option>
                <option>插件变更</option>
                <option>配置变更</option>
                <option>命令执行</option>
                <option>配额变更</option>
                <option>基线变更</option>
              </select>
              <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white">
                <option>全部状态</option>
                <option>已应用</option>
                <option>待处理</option>
                <option>已回滚</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto">
              {changeHistory.map((change) => (
                <div key={change.id} className="p-4 mb-4 rounded-lg bg-muted border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-xs px-2 py-1 rounded ${
                          change.changeType === "plugin" ? "bg-blue-500/20 text-blue-400" :
                          change.changeType === "config" ? "bg-purple-500/20 text-purple-400" :
                          change.changeType === "command" ? "bg-green-500/20 text-green-400" :
                          change.changeType === "quota" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-orange-500/20 text-orange-400"
                        }`}>
                          {change.changeType === "plugin" ? "插件" :
                           change.changeType === "config" ? "配置" :
                           change.changeType === "command" ? "命令" :
                           change.changeType === "quota" ? "配额" : "基线"}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          change.status === "applied" ? "bg-green-500/20 text-green-400" :
                          change.status === "pending" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {change.status === "applied" ? "已应用" :
                           change.status === "pending" ? "待处理" : "已回滚"}
                        </span>
                        <span className="text-xs text-muted-foreground">{change.timestamp}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-white mb-2">{change.changeTitle}</h4>
                      <p className="text-sm text-muted-foreground mb-3">{change.description}</p>
                      {change.beforeValue && change.afterValue && (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-red-500/10 p-3 rounded-lg">
                            <div className="text-xs text-red-400 mb-1">变更前</div>
                            <div className="text-sm text-white">{change.beforeValue}</div>
                          </div>
                          <div className="bg-green-500/10 p-3 rounded-lg">
                            <div className="text-xs text-green-400 mb-1">变更后</div>
                            <div className="text-sm text-white">{change.afterValue}</div>
                          </div>
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-2">操作人: {change.operator}</div>
                    </div>
                    {change.rollbackAvailable && (
                      <TechButton variant="secondary" size="sm">回滚</TechButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 历史数据分析报表模态框 */}
      {showReportsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowReportsModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[1000px] max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-cyan-500" />
                <h3 className="text-lg font-semibold text-white">历史数据分析报表</h3>
              </div>
              <button onClick={() => setShowReportsModal(false)} className="text-muted-foreground hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex items-center gap-4 mb-6">
              <select className="px-3 py-2 bg-muted border border-border rounded-lg text-sm text-white">
                <option>日报</option>
                <option>周报</option>
                <option>月报</option>
                <option>自定义</option>
              </select>
              <TechButton variant="primary" size="sm">生成新报表</TechButton>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {historicalReports.map((report) => (
                <div key={report.id} className="p-5 rounded-xl bg-muted border border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-semibold text-white">{report.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          report.reportType === "daily" ? "bg-blue-500/20 text-blue-400" :
                          report.reportType === "weekly" ? "bg-purple-500/20 text-purple-400" :
                          report.reportType === "monthly" ? "bg-green-500/20 text-green-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>
                          {report.reportType === "daily" ? "日报" :
                           report.reportType === "weekly" ? "周报" :
                           report.reportType === "monthly" ? "月报" : "自定义"}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          report.status === "generated" ? "bg-green-500/20 text-green-400" :
                          report.status === "generating" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {report.status === "generated" ? "已生成" :
                           report.status === "generating" ? "生成中" : "生成失败"}
                        </span>
                        <span className="text-xs text-muted-foreground">{report.generatedAt}</span>
                      </div>
                      <div className="text-xs text-muted-foreground mb-3">报告周期: {report.period}</div>
                      {report.status === "generated" && (
                        <div className="grid grid-cols-5 gap-4 mt-4">
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">总请求</div>
                            <div className="text-xl font-bold text-white">{report.data.totalRequests.toLocaleString()}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">平均响应</div>
                            <div className="text-xl font-bold text-blue-400">{report.data.avgResponseTime}ms</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">错误率</div>
                            <div className="text-xl font-bold text-red-400">{report.data.errorRate}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">CPU使用</div>
                            <div className="text-xl font-bold text-green-400">{report.data.cpuUsage}%</div>
                          </div>
                          <div className="text-center">
                            <div className="text-xs text-muted-foreground">内存使用</div>
                            <div className="text-xl font-bold text-purple-400">{report.data.memoryUsage}%</div>
                          </div>
                        </div>
                      )}
                    </div>
                    {report.status === "generated" && (
                      <div className="flex gap-2">
                        <TechButton variant="secondary" size="sm">下载</TechButton>
                        <TechButton variant="ghost" size="sm">查看详情</TechButton>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 自定义监控仪表盘模态框 */}
      {showDashboardModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowDashboardModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[1100px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <LayoutDashboard size={20} className="text-pink-500" />
                <h3 className="text-lg font-semibold text-white">自定义监控仪表盘</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">新建仪表盘</TechButton>
                <button onClick={() => setShowDashboardModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              {customDashboards.map((dashboard) => (
                <div key={dashboard.id} className="p-5 rounded-xl bg-muted border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-semibold text-white">{dashboard.name}</h4>
                        {dashboard.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-400">默认</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{dashboard.description}</p>
                      <div className="text-xs text-muted-foreground mt-1">最后修改: {dashboard.lastModified}</div>
                    </div>
                    <div className="flex gap-2">
                      <TechButton variant="secondary" size="sm">编辑</TechButton>
                      <TechButton variant="primary" size="sm">打开</TechButton>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {dashboard.widgets.map((widget) => (
                      <div 
                        key={widget.id}
                        className="p-3 rounded-lg bg-card/50 border border-border"
                      >
                        <div className="text-xs text-muted-foreground mb-2">{widget.title}</div>
                        <div className={`text-center py-3 rounded ${
                          widget.type === "gauge" ? "bg-blue-500/10" :
                          widget.type === "chart" ? "bg-green-500/10" :
                          widget.type === "table" ? "bg-purple-500/10" :
                          "bg-yellow-500/10"
                        }`}>
                          <div className="text-sm text-white">
                            {widget.type === "gauge" ? "仪表盘组件" :
                             widget.type === "chart" ? "图表组件" :
                             widget.type === "table" ? "表格组件" :
                             "指标组件"}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 智能告警策略模态框 */}
      {showAlertPoliciesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowAlertPoliciesModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BellRing size={20} className="text-red-500" />
                <h3 className="text-lg font-semibold text-white">智能告警策略</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">添加策略</TechButton>
                <button onClick={() => setShowAlertPoliciesModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {smartAlertPolicies.map((policy) => (
                <div key={policy.id} className="p-5 rounded-xl bg-muted border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h4 className="text-sm font-semibold text-white">{policy.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          policy.type === "anomaly" ? "bg-pink-500/20 text-pink-400" :
                          policy.type === "threshold" ? "bg-blue-500/20 text-blue-400" :
                          policy.type === "trend" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-purple-500/20 text-purple-400"
                        }`}>
                          {policy.type === "anomaly" ? "异常检测" :
                           policy.type === "threshold" ? "阈值告警" :
                           policy.type === "trend" ? "趋势分析" : "复合告警"}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          policy.severity === "critical" ? "bg-red-500/20 text-red-400" :
                          policy.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-blue-500/20 text-blue-400"
                        }`}>
                          {policy.severity === "critical" ? "严重" :
                           policy.severity === "warning" ? "警告" : "信息"}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          policy.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {policy.enabled ? "已启用" : "已禁用"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{policy.description}</p>
                      <div className="mb-4">
                        <div className="text-xs text-muted-foreground mb-2">告警条件</div>
                        {policy.conditions.map((cond, idx) => (
                          <div key={idx} className="mb-2 p-3 bg-card/50 rounded-lg">
                            <span className="text-sm text-white">
                              {cond.metric} {cond.operator} {cond.value} ({cond.window})
                            </span>
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center gap-6 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>自动调整:</span>
                          <span className={policy.autoAdjust ? "text-green-400" : "text-gray-400"}>
                            {policy.autoAdjust ? "是" : "否"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>敏感度:</span>
                          <span className="text-white">{policy.sensitivity}%</span>
                        </div>
                        {policy.lastTriggered && (
                          <div className="flex items-center gap-1">
                            <span>最后触发:</span>
                            <span className="text-white">{policy.lastTriggered}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <span>触发次数:</span>
                          <span className="text-white">{policy.triggerCount}次</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 ml-6">
                      <TechButton variant="secondary" size="sm">编辑</TechButton>
                      <TechButton variant={policy.enabled ? "danger" : "primary"} size="sm">
                        {policy.enabled ? "禁用" : "启用"}
                      </TechButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowConfirmModal(false)}>
          <div className="w-[400px] rounded-xl p-6 bg-card border border-border relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center text-muted-foreground"><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={15} className="text-yellow-500" />确认操作
            </div>
            <div className="text-sm text-muted-foreground">{confirmMessage}</div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowConfirmModal(false)}>取消</TechButton>
              <TechButton variant="danger" onClick={handleConfirm}>确认</TechButton>
            </div>
          </div>
        </div>
      )}

      {/* 性能对比分析模态框 */}
      {showPerformanceComparisonModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowPerformanceComparisonModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-500" />
                <h3 className="text-lg font-semibold text-white">Agent 性能对比分析</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">导出报告</TechButton>
                <button onClick={() => setShowPerformanceComparisonModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6">
              <div className="flex gap-4">
                {performanceComparisonData.selectedAgents.map((agent) => (
                  <div key={agent.id} className="flex-1 p-4 rounded-xl bg-muted border border-border">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.color }} />
                      <span className="text-sm font-semibold text-white">{agent.name}</span>
                    </div>
                    <div className="space-y-3">
                      {performanceComparisonData.metrics.map((metric) => {
                        const value = metric.values.find(v => v.agentId === agent.id);
                        return (
                          <div key={metric.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span className="text-muted-foreground">{metric.name}</span>
                              <span className="text-white font-medium">{value?.value}{value?.unit}</span>
                            </div>
                            <div className="h-1.5 bg-card rounded-full overflow-hidden">
                              <div 
                                className="h-full rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(value?.value || 0, 100)}%`,
                                  backgroundColor: agent.color 
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-muted border border-border">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-semibold text-white">24小时性能趋势对比</span>
                  <div className="flex gap-4 text-xs">
                    {performanceComparisonData.selectedAgents.map((agent) => (
                      <div key={agent.id} className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: agent.color }} />
                        <span className="text-muted-foreground">{agent.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-48 flex items-end gap-1">
                  {performanceComparisonData.trendData.slice(0, 24).map((item, idx) => (
                    <div key={idx} className="flex-1 flex gap-0.5 items-end">
                      {item.values.map((v) => {
                        const agent = performanceComparisonData.selectedAgents.find(a => a.id === v.agentId);
                        return (
                          <div 
                            key={v.agentId} 
                            className="w-1 rounded-t-sm transition-all hover:opacity-80"
                            style={{ 
                              height: `${v.cpu}%`, 
                              backgroundColor: agent?.color,
                              maxHeight: '180px'
                            }}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>0:00</span>
                  <span>6:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>24:00</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 服务依赖关系图模态框 */}
      {showServiceDependenciesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowServiceDependenciesModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Network size={20} className="text-green-500" />
                <h3 className="text-lg font-semibold text-white">服务依赖关系图</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">刷新</TechButton>
                <button onClick={() => setShowServiceDependenciesModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-4 rounded-xl bg-muted border border-border">
                <svg viewBox="0 0 900 500" className="w-full">
                  <defs>
                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                      <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
                    </marker>
                  </defs>
                  
                  {serviceDependencies.edges.map((edge, idx) => (
                    <line
                      key={idx}
                      x1={getNodePosition(edge.source).x}
                      y1={getNodePosition(edge.source).y}
                      x2={getNodePosition(edge.target).x}
                      y2={getNodePosition(edge.target).y}
                      stroke="#6b7280"
                      strokeWidth={Math.log(edge.requests) / 5}
                      markerEnd="url(#arrowhead)"
                    />
                  ))}

                  {serviceDependencies.nodes.map((node) => {
                    const pos = getNodePosition(node.id);
                    const isWarning = node.status === "warning";
                    const isError = node.status === "error";
                    const isAgent = node.type === "agent";
                    
                    return (
                      <g key={node.id} transform={`translate(${pos.x}, ${pos.y})`}>
                        <rect
                          x="-40"
                          y="-25"
                          width="80"
                          height="50"
                          rx="8"
                          fill={isAgent ? "#1e293b" : "#0f172a"}
                          stroke={isError ? "#ef4444" : isWarning ? "#f59e0b" : "#334155"}
                          strokeWidth="2"
                        />
                        <text
                          textAnchor="middle"
                          y="-3"
                          fill="white"
                          fontSize="12"
                          fontWeight="500"
                        >{node.name}</text>
                        <circle
                          r="4"
                          cy="12"
                          fill={isError ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e"}
                        />
                        <text
                          textAnchor="middle"
                          y="18"
                          fill={isError ? "#ef4444" : isWarning ? "#f59e0b" : "#22c55e"}
                          fontSize="8"
                        >
                          {isError ? "异常" : isWarning ? "警告" : "正常"}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-4">
                {serviceDependencies.nodes.map((node) => {
                  const edgesTo = serviceDependencies.edges.filter(e => e.source === node.id);
                  const totalRequests = edgesTo.reduce((sum, e) => sum + e.requests, 0);
                  const avgLatency = edgesTo.length > 0 ? (edgesTo.reduce((sum, e) => sum + e.latency, 0) / edgesTo.length).toFixed(0) : "0";
                  
                  return (
                    <div key={node.id} className="p-3 rounded-lg bg-muted border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-white">{node.name}</span>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          node.status === "online" ? "bg-green-500/20 text-green-400" :
                          node.status === "warning" ? "bg-yellow-500/20 text-yellow-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          {node.status === "online" ? "在线" : node.status === "warning" ? "警告" : "异常"}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">请求数:</span>
                          <span className="text-white ml-1">{totalRequests.toLocaleString()}/min</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">平均延迟:</span>
                          <span className="text-white ml-1">{avgLatency}ms</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 告警升级策略配置模态框 */}
      {showAlertEscalationModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowAlertEscalationModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle size={20} className="text-orange-500" />
                <h3 className="text-lg font-semibold text-white">告警升级策略配置</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">添加策略</TechButton>
                <button onClick={() => setShowAlertEscalationModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4">
              {alertEscalationPolicies.map((policy) => (
                <div key={policy.id} className="p-5 rounded-xl bg-muted border border-border">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-sm font-semibold text-white">{policy.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded ${
                          policy.enabled ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                        }`}>
                          {policy.enabled ? "已启用" : "已禁用"}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{policy.description}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <TechButton variant="secondary" size="sm">编辑</TechButton>
                      <TechButton variant={policy.enabled ? "danger" : "primary"} size="sm">
                        {policy.enabled ? "禁用" : "启用"}
                      </TechButton>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">升级级别配置</div>
                    <div className="flex gap-2">
                      {policy.levels.map((level) => (
                        <div key={level.level} className="flex-1 p-3 bg-card/50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-white">级别 {level.level}</span>
                            <span className="text-xs text-muted-foreground">延迟 {level.duration}分钟</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            触发条件: {level.threshold}次告警
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {level.channels.map((channel) => (
                              <span key={channel} className="text-xs px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">
                                {channel}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 多租户管理模态框 */}
      {showTenantsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowTenantsModal(false)}>
          <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Building2 size={20} className="text-purple-500" />
                <h3 className="text-lg font-semibold text-white">多租户管理</h3>
              </div>
              <div className="flex items-center gap-3">
                <TechButton variant="secondary" size="sm">新增租户</TechButton>
                <button onClick={() => setShowTenantsModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="space-y-4">
                {tenants.map((tenant) => (
                  <div key={tenant.id} className="p-5 rounded-xl bg-muted border border-border">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-sm font-semibold text-white">{tenant.name}</h4>
                          <span className={`text-xs px-2 py-1 rounded ${
                            tenant.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"
                          }`}>
                            {tenant.status === "active" ? "活跃" : "暂停"}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{tenant.description}</p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <TechButton variant="secondary" size="sm">编辑配额</TechButton>
                        <TechButton variant={tenant.status === "active" ? "danger" : "primary"} size="sm">
                          {tenant.status === "active" ? "暂停" : "激活"}
                        </TechButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">Agent数量</div>
                        <div className="text-lg font-semibold text-white">{tenant.agents}</div>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">应用数量</div>
                        <div className="text-lg font-semibold text-white">{tenant.applications}</div>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">创建时间</div>
                        <div className="text-sm text-white">{tenant.createdAt}</div>
                      </div>
                      <div className="p-3 bg-card/50 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">状态</div>
                        <div className="text-sm text-white">{tenant.status === "active" ? "活跃" : "暂停"}</div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-xs text-muted-foreground mb-2">资源配额使用情况</div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">CPU</span>
                            <span className="text-white">{tenant.usedQuota.cpu}/{tenant.quota.cpu}%</span>
                          </div>
                          <div className="h-1.5 bg-card rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-blue-500"
                              style={{ width: `${(tenant.usedQuota.cpu / tenant.quota.cpu) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">内存</span>
                            <span className="text-white">{tenant.usedQuota.memory}/{tenant.quota.memory}GB</span>
                          </div>
                          <div className="h-1.5 bg-card rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-green-500"
                              style={{ width: `${(tenant.usedQuota.memory / tenant.quota.memory) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">存储</span>
                            <span className="text-white">{tenant.usedQuota.storage}/{tenant.quota.storage}GB</span>
                          </div>
                          <div className="h-1.5 bg-card rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full bg-purple-500"
                              style={{ width: `${(tenant.usedQuota.storage / tenant.quota.storage) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 应用性能评分模态框 */}
      <ApmScoreModal data={apmScores} isOpen={showApmScoreModal} onClose={() => setShowApmScoreModal(false)} />
      
      {/* 错误追踪模态框 */}
      <ErrorTrackingModal data={errorTracking} isOpen={showErrorTrackingModal} onClose={() => setShowErrorTrackingModal(false)} />
      
      {/* 数据库查询分析模态框 */}
      <DbAnalysisModal data={dbQueryAnalysis} isOpen={showDbAnalysisModal} onClose={() => setShowDbAnalysisModal(false)} />
      
      {/* 缓存命中率分析模态框 */}
      <CacheAnalysisModal data={cacheAnalysis} isOpen={showCacheAnalysisModal} onClose={() => setShowCacheAnalysisModal(false)} />
      
      {/* SLA监控模态框 */}
      <SlaModal data={slaMonitoring} isOpen={showSlaModal} onClose={() => setShowSlaModal(false)} />
    </MainLayout>
  );
}

function getNodePosition(nodeId: string) {
  const positions: Record<string, { x: number; y: number }> = {
    gateway: { x: 450, y: 50 },
    order: { x: 300, y: 180 },
    payment: { x: 450, y: 180 },
    user: { x: 600, y: 180 },
    inventory: { x: 300, y: 320 },
    mysql: { x: 450, y: 320 },
    redis: { x: 600, y: 320 },
  };
  return positions[nodeId] || { x: 450, y: 250 };
}

// 应用性能评分模态框
function ApmScoreModal({ data, isOpen, onClose }: { data: typeof apmScores; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Award size={20} className="text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">应用性能评分 (APM Score)</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.map((app) => (
            <div key={app.id} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">{app.score}</span>
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      app.trend === "up" ? "bg-green-500 text-white" :
                      app.trend === "down" ? "bg-red-500 text-white" : "bg-gray-500 text-white"
                    }`}>
                      {app.trend === "up" ? "↑" : app.trend === "down" ? "↓" : "→"}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{app.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>趋势:</span>
                      <span className={app.trend === "up" ? "text-green-400" : app.trend === "down" ? "text-red-400" : "text-gray-400"}>
                        {app.trend === "up" ? "上升" : app.trend === "down" ? "下降" : "稳定"}
                      </span>
                      <span>({app.trendValue > 0 ? "+" : ""}{app.trendValue}%)</span>
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${
                  app.score >= 90 ? "bg-green-500/20 text-green-400" :
                  app.score >= 70 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                }`}>
                  {app.score >= 90 ? "优秀" : app.score >= 70 ? "良好" : "需优化"}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {app.components.map((comp) => (
                  <div key={comp.name} className="p-3 bg-card/50 rounded-lg">
                    <div className="text-xs text-muted-foreground mb-1">{comp.name}</div>
                    <div className="text-lg font-bold text-white">{comp.score}{comp.name === "可用性" || comp.name === "错误率" ? "%" : ""}</div>
                    <div className="text-xs text-muted-foreground">权重 {comp.weight}%</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 错误追踪模态框
function ErrorTrackingModal({ data, isOpen, onClose }: { data: typeof errorTracking; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Bug size={20} className="text-red-500" />
            <h3 className="text-lg font-semibold text-white">错误追踪和分析</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="text-xs text-muted-foreground mb-2">24小时错误趋势</div>
            <div className="h-32 flex items-end gap-1">
              {data.trends.slice(0, 24).map((item, idx) => (
                <div key={idx} className="flex-1 bg-red-500/60 rounded-t-sm" style={{ height: `${(item.count / 70) * 100}%` }} />
              ))}
            </div>
          </div>
          {data.errors.map((error) => (
            <div key={error.id} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-red-400">{error.type}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    error.status === "open" ? "bg-red-500/20 text-red-400" :
                    error.status === "acknowledged" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                  }`}>
                    {error.status === "open" ? "未处理" : error.status === "acknowledged" ? "已确认" : "已解决"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">出现 {error.count} 次</div>
              </div>
              <p className="text-sm text-white mb-3">{error.message}</p>
              <div className="bg-card/50 rounded-lg p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-1">堆栈跟踪</div>
                <pre className="text-xs text-gray-400 whitespace-pre-wrap max-h-20 overflow-auto">{error.stackTrace}</pre>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                <span>首次出现: {error.firstOccurrence}</span>
                <span>最后出现: {error.lastOccurrence}</span>
                <span>影响 Agent: {error.affectedAgents} 个</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 数据库查询分析模态框
function DbAnalysisModal({ data, isOpen, onClose }: { data: typeof dbQueryAnalysis; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Database size={20} className="text-cyan-500" />
            <h3 className="text-lg font-semibold text-white">数据库查询分析</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.map((query) => (
            <div key={query.id} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    query.status === "optimal" ? "bg-green-500/20 text-green-400" :
                    query.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {query.status === "optimal" ? "最优" : query.status === "warning" ? "警告" : "严重"}
                  </span>
                  <span className="text-xs text-muted-foreground">索引: {query.indexUsage}</span>
                </div>
                <div className="text-xs text-muted-foreground">调用 {query.calls.toLocaleString()} 次</div>
              </div>
              <div className="bg-card/50 rounded-lg p-3 mb-3">
                <div className="text-xs text-muted-foreground mb-1">SQL查询</div>
                <code className="text-sm text-white">{query.query}</code>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">平均耗时</div>
                  <div className="text-sm font-medium text-white">{query.avgDuration}ms</div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">最大耗时</div>
                  <div className="text-sm font-medium text-red-400">{query.maxDuration}ms</div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">最小耗时</div>
                  <div className="text-sm font-medium text-green-400">{query.minDuration}ms</div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">返回行数</div>
                  <div className="text-sm font-medium text-white">{query.rows.toLocaleString()}</div>
                </div>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg">
                <div className="text-xs text-yellow-400">{query.suggestion}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 缓存命中率分析模态框
function CacheAnalysisModal({ data, isOpen, onClose }: { data: typeof cacheAnalysis; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Cache size={20} className="text-orange-500" />
            <h3 className="text-lg font-semibold text-white">缓存命中率分析</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {data.caches.map((cache) => (
              <div key={cache.name} className="p-4 rounded-xl bg-muted border border-border">
                <div className="text-sm font-medium text-white mb-3">{cache.name}</div>
                <div className="relative w-full h-24 flex items-end justify-center">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="#334155" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={cache.hitRate >= 95 ? "#22c55e" : cache.hitRate >= 85 ? "#f59e0b" : "#ef4444"} strokeWidth="8" strokeDasharray={`${cache.hitRate * 2.51} 251`} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-white">{cache.hitRate}</span>
                    <span className="text-xs text-muted-foreground">命中率</span>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">命中</span>
                    <span className="text-white">{(cache.hits / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">未命中</span>
                    <span className="text-white">{(cache.misses / 1000).toFixed(0)}k</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">驱逐</span>
                    <span className="text-white">{cache.evictions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">内存</span>
                    <span className="text-white">{cache.memoryUsage}/{cache.maxMemory}MB</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-muted border border-border">
            <div className="text-xs text-muted-foreground mb-2">本周命中率趋势</div>
            <div className="h-24 flex items-end gap-4">
              {data.hitRateTrend.map((item, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className="w-full bg-gradient-to-t from-orange-500/60 to-orange-400/60 rounded-t-sm" style={{ height: `${(item.rate / 100) * 80}%` }} />
                  <span className="text-xs text-muted-foreground mt-1">{item.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



// SLA监控模态框
function SlaModal({ data, isOpen, onClose }: { data: typeof slaMonitoring; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Target size={20} className="text-purple-500" />
            <h3 className="text-lg font-semibold text-white">服务等级协议 (SLA) 监控</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.map((sla) => (
            <div key={sla.id} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="text-sm font-semibold text-white">{sla.name}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`text-xs px-2 py-1 rounded ${
                      sla.status === "met" ? "bg-green-500/20 text-green-400" :
                      sla.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {sla.status === "met" ? "达标" : sla.status === "warning" ? "警告" : "违约"}
                    </span>
                    <span className="text-xs text-muted-foreground">{sla.period}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-white">{sla.actual}</div>
                  <div className="text-xs text-muted-foreground">目标: {sla.target}</div>
                </div>
              </div>
              <div className="h-16 flex items-end gap-2">
                {sla.history.map((item, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col gap-1">
                      <div 
                        className={`w-full rounded-t-sm ${
                          item.value >= item.target ? "bg-green-500/60" : "bg-red-500/60"
                        }`} 
                        style={{ height: `${(item.value / (sla.name.includes("时间") ? 300 : 100)) * 60}px` }} 
                      />
                      <div 
                        className="w-full h-px bg-dashed border-dashed border-yellow-500/50"
                        style={{ marginTop: `${item.target > item.value ? (item.target - item.value) * 0.6 : 0}px` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{item.period}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 分布式事务追踪模态框
function TransactionModal({ data, isOpen, onClose }: { data: typeof distributedTransactions; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <GitBranch size={20} className="text-cyan-500" />
            <h3 className="text-lg font-semibold text-white">分布式事务追踪</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">总事务数</div>
            <div className="text-xl font-bold text-white">{data.stats.total.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">成功数</div>
            <div className="text-xl font-bold text-green-400">{data.stats.success.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">失败数</div>
            <div className="text-xl font-bold text-red-400">{data.stats.failed.toLocaleString()}</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">平均耗时</div>
            <div className="text-xl font-bold text-white">{data.stats.avgDuration}ms</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.transactions.map((txn) => (
            <div key={txn.id} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{txn.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    txn.status === "success" ? "bg-green-500/20 text-green-400" :
                    txn.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {txn.status === "success" ? "成功" : txn.status === "failed" ? "失败" : "进行中"}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  耗时 {txn.duration}ms | {txn.participants} 个参与者
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">{txn.startTime}</div>
              <div className="flex gap-2">
                {txn.spans.map((span, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className={`p-2 rounded ${
                      span.status === "success" ? "bg-green-500/20" : "bg-red-500/20"
                    }`}>
                      <div className="text-xs font-medium text-white">{span.service}</div>
                      <div className="text-xs text-muted-foreground">{span.duration}ms</div>
                    </div>
                    {idx < txn.spans.length - 1 && (
                      <div className="w-4 h-px bg-gray-600 mt-3" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 消息队列监控模态框
function MqModal({ data, isOpen, onClose }: { data: typeof mqMonitoring; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MessageSquare size={20} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-white">消息队列监控</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.map((mq) => (
            <div key={mq.name} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{mq.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    mq.type === "kafka" ? "bg-purple-500/20 text-purple-400" :
                    mq.type === "rabbitmq" ? "bg-orange-500/20 text-orange-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {mq.type === "kafka" ? "Kafka" : mq.type === "rabbitmq" ? "RabbitMQ" : "RocketMQ"}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    mq.status === "healthy" ? "bg-green-500/20 text-green-400" :
                    mq.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {mq.status === "healthy" ? "健康" : mq.status === "warning" ? "警告" : "异常"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-4">
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">消息总数</div>
                  <div className="text-sm font-medium text-white">{mq.messageCount.toLocaleString()}</div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">待处理</div>
                  <div className={`text-sm font-medium ${mq.pendingMessages > 1000 ? "text-red-400" : "text-white"}`}>
                    {mq.pendingMessages}
                  </div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">吞吐量</div>
                  <div className="text-sm font-medium text-white">{mq.throughput}/s</div>
                </div>
                <div className="p-2 bg-card/50 rounded">
                  <div className="text-xs text-muted-foreground">延迟</div>
                  <div className="text-sm font-medium text-white">{mq.avgLatency}ms</div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">Topics/Queues</div>
              <div className="space-y-2">
                {mq.topics.map((topic) => (
                  <div key={topic.name} className="flex items-center justify-between p-2 bg-card/50 rounded">
                    <span className="text-sm text-white">{topic.name}</span>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-muted-foreground">{topic.messages.toLocaleString()} 消息</span>
                      <span className={topic.lag > 500 ? "text-red-400" : "text-white"}>延迟 {topic.lag}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// 容器监控模态框
function ContainerModal({ data, isOpen, onClose }: { data: typeof containerMonitoring; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Container size={20} className="text-blue-500" />
            <h3 className="text-lg font-semibold text-white">容器化监控 (Kubernetes)</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.clusters.map((cluster) => (
            <div key={cluster.name} className="p-5 rounded-xl bg-muted border border-border">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-white">{cluster.name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    cluster.status === "healthy" ? "bg-green-500/20 text-green-400" :
                    cluster.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                  }`}>
                    {cluster.status === "healthy" ? "健康" : cluster.status === "warning" ? "警告" : "异常"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">节点数</div>
                  <div className="text-xl font-bold text-white">{cluster.nodes}</div>
                </div>
                <div className="p-3 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">Pod数</div>
                  <div className="text-xl font-bold text-white">{cluster.pods}</div>
                  <div className="text-xs text-green-400">{cluster.runningPods} 运行中</div>
                </div>
                <div className="p-3 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">失败Pod</div>
                  <div className={`text-xl font-bold ${cluster.failedPods > 0 ? "text-red-400" : "text-green-400"}`}>
                    {cluster.failedPods}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">CPU使用率</span>
                    <span className="text-white">{cluster.cpuUsage}%</span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500" style={{ width: `${cluster.cpuUsage}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">内存使用率</span>
                    <span className="text-white">{cluster.memoryUsage}%</span>
                  </div>
                  <div className="h-2 bg-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-green-500" style={{ width: `${cluster.memoryUsage}%` }} />
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-2">Namespaces</div>
              <div className="flex flex-wrap gap-2">
                {cluster.namespaces.map((ns) => (
                  <span key={ns.name} className="px-2 py-1 bg-card/50 rounded text-xs">
                    {ns.name} ({ns.pods} pods)
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// CDN监控模态框
function CdnModal({ data, isOpen, onClose }: { data: typeof cdnMonitoring; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Globe size={20} className="text-green-500" />
            <h3 className="text-lg font-semibold text-white">CDN/边缘节点监控</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">总请求数</div>
            <div className="text-xl font-bold text-white">{(data.globalStats.totalRequests / 10000).toFixed(0)}万</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">平均延迟</div>
            <div className="text-xl font-bold text-white">{data.globalStats.avgLatency}ms</div>
          </div>
          <div className="p-3 rounded-lg bg-muted">
            <div className="text-xs text-muted-foreground">平均命中率</div>
            <div className="text-xl font-bold text-white">{data.globalStats.avgHitRate}%</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {data.nodes.map((node) => (
              <div key={node.id} className="p-4 rounded-xl bg-muted border border-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{node.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      node.status === "healthy" ? "bg-green-500/20 text-green-400" :
                      node.status === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"
                    }`}>
                      {node.status === "healthy" ? "健康" : node.status === "warning" ? "警告" : "异常"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{node.location}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">请求数</span>
                    <span className="text-white">{(node.requests / 10000).toFixed(0)}万</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">带宽</span>
                    <span className="text-white">{node.bandwidth}Mbps</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">命中率</span>
                    <span className={`font-medium ${node.hitRate >= 90 ? "text-green-400" : node.hitRate >= 80 ? "text-yellow-400" : "text-red-400"}`}>
                      {node.hitRate}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">延迟</span>
                    <span className="text-white">{node.latency}ms</span>
                  </div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">缓存大小</span>
                    <span className="text-white">{node.cacheSize}GB</span>
                  </div>
                  <div className="h-1.5 bg-card rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500" style={{ width: `${(node.cacheSize / 2048) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// 自动化运维模态框
function AutoOpsModal({ data, isOpen, onClose }: { data: typeof autoOpsData; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap size={20} className="text-yellow-500" />
            <h3 className="text-lg font-semibold text-white">自动化运维</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">自动化任务</div>
            {data.tasks.map((task) => (
              <div key={task.id} className="p-4 bg-muted rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{task.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded ${task.status === "running" ? "bg-green-500/20 text-green-400" : task.status === "paused" ? "bg-yellow-500/20 text-yellow-400" : "bg-gray-500/20 text-gray-400"}`}>
                      {task.status === "running" ? "运行中" : task.status === "paused" ? "已暂停" : "已完成"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">上次运行: </span><span className="text-white">{task.lastRun}</span></div>
                  <div><span className="text-muted-foreground">下次运行: </span><span className="text-white">{task.nextRun}</span></div>
                </div>
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">成功率</span>
                    <span className={`${task.successRate >= 95 ? "text-green-400" : task.successRate >= 90 ? "text-yellow-400" : "text-red-400"}`}>{task.successRate}%</span>
                  </div>
                  <div className="h-1.5 bg-card rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${task.successRate >= 95 ? "bg-green-500" : task.successRate >= 90 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${task.successRate}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <div className="text-sm font-semibold text-white">最近操作</div>
            {data.recentActions.map((action) => (
              <div key={action.id} className="p-4 bg-muted rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">{action.action}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${action.result === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                    {action.result === "success" ? "成功" : "失败"}
                  </span>
                </div>
                <div className="text-xs">
                  <span className="text-muted-foreground">目标: </span><span className="text-white">{action.target}</span>
                </div>
                <div className="text-xs text-muted-foreground mt-1">{action.timestamp}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SmartSchedulingModal({ data, isOpen, onClose }: { data: typeof smartSchedulingData; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity size={20} className="text-cyan-500" />
            <h3 className="text-lg font-semibold text-white">智能调度</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">总请求数</div>
            <div className="text-xl font-bold text-white">{(data.schedulingStats.totalRequests / 10000).toFixed(1)}万</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">平均延迟</div>
            <div className="text-xl font-bold text-white">{data.schedulingStats.avgLatency}ms</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">负载均衡度</div>
            <div className="text-xl font-bold text-cyan-400">{data.schedulingStats.loadBalance}%</div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="text-sm font-semibold text-white">调度策略</div>
          {data.strategies.map((strategy) => (
            <div key={strategy.id} className="p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{strategy.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${strategy.status === "active" ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}`}>
                    {strategy.status === "active" ? "活跃" : "停用"}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">{strategy.type === "round_robin" ? "轮询" : strategy.type === "least_load" ? "最小负载" : strategy.type === "weighted" ? "加权" : "自适应"}</span>
              </div>
              <div className="text-xs text-muted-foreground mb-2">目标服务: {strategy.targets.join(", ")}</div>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">CPU</div>
                  <div className="text-sm font-medium text-white">{strategy.metrics.cpu}%</div>
                </div>
                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">内存</div>
                  <div className="text-sm font-medium text-white">{strategy.metrics.memory}%</div>
                </div>
                <div className="text-center p-2 bg-card/50 rounded-lg">
                  <div className="text-xs text-muted-foreground">延迟</div>
                  <div className="text-sm font-medium text-white">{strategy.metrics.latency}ms</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function FullTraceModal({ data, isOpen, onClose }: { data: typeof fullTraceData; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Network size={20} className="text-indigo-500" />
            <h3 className="text-lg font-semibold text-white">全链路追踪</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">总追踪数</div>
            <div className="text-xl font-bold text-white">{data.stats.totalTraces.toLocaleString()}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">成功率</div>
            <div className="text-xl font-bold text-green-400">{data.stats.successRate}%</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">平均耗时</div>
            <div className="text-xl font-bold text-white">{data.stats.avgDuration}ms</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">最慢追踪</div>
            <div className="text-xl font-bold text-orange-400">{data.stats.slowestTrace}ms</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.traces.map((trace) => (
            <div key={trace.traceId} className="p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{trace.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${trace.status === "success" ? "bg-green-500/20 text-green-400" : trace.status === "failed" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                    {trace.status === "success" ? "成功" : trace.status === "failed" ? "失败" : "部分成功"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-muted-foreground">{trace.spans} spans</span>
                  <span className="text-white">{trace.duration}ms</span>
                </div>
              </div>
              <div className="text-xs text-muted-foreground mb-3">{trace.startTime}</div>
              <div className="space-y-2">
                {trace.services.map((service, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-card/50 rounded-lg">
                    <span className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs">{index + 1}</span>
                    <div className="flex-1">
                      <div className="text-sm text-white">{service.service}</div>
                      <div className="text-xs text-muted-foreground">{service.operation}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-white">{service.duration}ms</div>
                      <div className={`text-xs ${service.status === "success" ? "text-green-400" : "text-orange-400"}`}>{service.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnomalyModal({ data, isOpen, onClose }: { data: typeof anomalyDetectionData; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            <h3 className="text-lg font-semibold text-white">异常检测</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">总异常数</div>
            <div className="text-xl font-bold text-white">{data.detectionStats.totalAnomalies}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">严重</div>
            <div className="text-xl font-bold text-red-400">{data.detectionStats.critical}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">警告</div>
            <div className="text-xl font-bold text-yellow-400">{data.detectionStats.warning}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">已解决</div>
            <div className="text-xl font-bold text-green-400">{data.detectionStats.resolved}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.anomalies.map((anomaly) => (
            <div key={anomaly.id} className="p-4 bg-muted rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${anomaly.severity === "critical" ? "bg-red-500/20 text-red-400" : anomaly.severity === "warning" ? "bg-yellow-500/20 text-yellow-400" : "bg-blue-500/20 text-blue-400"}`}>
                    {anomaly.severity === "critical" ? "严重" : anomaly.severity === "warning" ? "警告" : "信息"}
                  </span>
                  <span className="text-sm font-medium text-white">{anomaly.title}</span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${anomaly.status === "active" ? "bg-red-500/20 text-red-400" : anomaly.status === "investigating" ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"}`}>
                  {anomaly.status === "active" ? "活跃" : anomaly.status === "investigating" ? "调查中" : "已解决"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">{anomaly.description}</p>
              <div className="flex items-center gap-4 text-xs">
                <span className="text-muted-foreground">指标: {anomaly.metric}</span>
                {anomaly.currentValue > 0 && (
                  <span className="text-white">当前值: {anomaly.currentValue} (基线: {anomaly.baselineValue})</span>
                )}
                <span className="text-muted-foreground">检测时间: {anomaly.detectedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ServiceDiscoveryModal({ data, isOpen, onClose }: { data: typeof serviceDiscoveryData; isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl p-6 w-[950px] max-h-[85vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wifi size={20} className="text-green-500" />
            <h3 className="text-lg font-semibold text-white">服务发现</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">服务总数</div>
            <div className="text-xl font-bold text-white">{data.discoveryStats.totalServices}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">健康服务</div>
            <div className="text-xl font-bold text-green-400">{data.discoveryStats.healthyServices}</div>
          </div>
          <div className="p-3 bg-muted rounded-lg">
            <div className="text-xs text-muted-foreground">实例数</div>
            <div className="text-xl font-bold text-white">{data.discoveryStats.instances}</div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4">
          {data.services.map((service) => (
            <div key={service.id} className="p-4 bg-muted rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{service.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${service.type === "http" ? "bg-green-500/20 text-green-400" : service.type === "grpc" ? "bg-blue-500/20 text-blue-400" : service.type === "tcp" ? "bg-yellow-500/20 text-yellow-400" : "bg-purple-500/20 text-purple-400"}`}>
                    {service.type.toUpperCase()}
                  </span>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${service.status === "healthy" ? "bg-green-500/20 text-green-400" : service.status === "degraded" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                  {service.status === "healthy" ? "健康" : service.status === "degraded" ? "降级" : "不可用"}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                <div><span className="text-muted-foreground">实例: </span><span className="text-white">{service.healthyInstances}/{service.instances}</span></div>
                <div><span className="text-muted-foreground">注册时间: </span><span className="text-white">{service.lastRegistered}</span></div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">端点:</div>
                <div className="flex flex-wrap gap-2">
                  {service.endpoints.map((endpoint, index) => (
                    <span key={index} className="text-xs px-2 py-1 bg-card/50 rounded text-white">{endpoint}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


