import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { Plus, Bell, CheckCircle, XCircle, PauseCircle, Edit, Trash, X, ChevronDown, CheckSquare, Square, MinusSquare, Play, StopCircle, Eye, Zap, Clock, Users, Mail, MessageSquare, Webhook, Shield, Settings, History, BarChart3, AlertTriangle, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from "recharts";
import { useToast } from "../context/ToastContext";
import { alertRulesApi } from "../services/api";
import { usePagination } from "@/hooks/usePagination";
import { SearchBar, FilterDropdown, Pagination } from "@/components/business";

type Level = "critical" | "warning" | "info";
type RuleStatus = "enabled" | "disabled" | "muted";

interface AlertRule {
  id: number;
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  unit: string;
  level: Level;
  status: RuleStatus;
  channels: string[];
  triggerCount: number;
  lastTrigger: string;
  agentIds?: number[];
  expression?: string;
  cooldown?: number;
  autoRecover?: boolean;
}

const initRules: AlertRule[] = [];

const advancedMetricOptions = [
  { value: "cpu_usage", label: "CPU 使用率 (%)", category: "系统" },
  { value: "mem_usage", label: "内存使用率 (%)", category: "系统" },
  { value: "disk_usage", label: "磁盘使用率 (%)", category: "系统" },
  { value: "network_in", label: "网络入口流量 (MB/s)", category: "网络" },
  { value: "network_out", label: "网络出口流量 (MB/s)", category: "网络" },
  { value: "response_time", label: "接口响应时间 (ms)", category: "应用" },
  { value: "error_rate", label: "错误请求率 (%)", category: "应用" },
  { value: "qps", label: "每秒请求数 (req/s)", category: "应用" },
  { value: "jvm_heap", label: "JVM 堆内存 (%)", category: "JVM" },
  { value: "jvm_nonheap", label: "JVM 非堆内存 (%)", category: "JVM" },
  { value: "gc_pause", label: "GC 停顿时间 (ms)", category: "JVM" },
  { value: "gc_count", label: "GC 次数 (次/分钟)", category: "JVM" },
  { value: "thread_count", label: "线程数 (个)", category: "JVM" },
  { value: "tcp_conn", label: "TCP 连接数 (个)", category: "网络" },
  { value: "db_query_time", label: "数据库查询时间 (ms)", category: "数据库" },
  { value: "db_conn_pool", label: "数据库连接池使用率 (%)", category: "数据库" },
  { value: "cache_hit_rate", label: "缓存命中率 (%)", category: "缓存" },
  { value: "mq_lag", label: "消息队列积压 (条)", category: "消息" },
];

const historyData = [
  { time: "06-10", critical: 3, warning: 5, info: 1 }, { time: "06-11", critical: 6, warning: 8, info: 2 },
  { time: "06-12", critical: 2, warning: 3, info: 0 }, { time: "06-13", critical: 9, warning: 12, info: 3 },
  { time: "06-14", critical: 4, warning: 7, info: 1 }, { time: "06-15", critical: 11, warning: 9, info: 2 },
  { time: "06-16", critical: 7, warning: 14, info: 4 },
];

const metricOptions = [
  { value: "cpu_usage", label: "CPU 使用率 (%)" }, { value: "mem_usage", label: "内存使用率 (%)" },
  { value: "response_time", label: "接口响应时间 (ms)" }, { value: "disk_usage", label: "磁盘使用率 (%)" },
  { value: "error_rate", label: "错误请求率 (%)" }, { value: "jvm_heap", label: "JVM 堆内存 (%)" },
  { value: "gc_pause", label: "GC 停顿时间 (ms)" }, { value: "tcp_conn", label: "TCP 连接数 (个)" },
];

const levelStyle: Record<Level, { color: string; bg: string; border: string }> = {
  critical: { color: "#FF4D4F", bg: "rgba(255,77,79,0.12)", border: "rgba(255,77,79,0.3)" },
  warning: { color: "#FFAA00", bg: "rgba(255,170,0,0.12)", border: "rgba(255,170,0,0.3)" },
  info: { color: "#165DFF", bg: "rgba(22,93,255,0.12)", border: "rgba(22,93,255,0.3)" },
};

const statusIcon: Record<RuleStatus, React.ReactNode> = {
  enabled: <CheckCircle size={13} className="text-green-500" />,
  disabled: <XCircle size={13} className="text-gray-500" />,
  muted: <PauseCircle size={13} className="text-yellow-500" />,
};

const levelOptions = [
  { value: "all", label: "全部级别" }, { value: "critical", label: "严重" },
  { value: "warning", label: "警告" }, { value: "info", label: "提示" },
];

const statusOptions = [
  { value: "all", label: "全部状态" }, { value: "enabled", label: "启用" },
  { value: "disabled", label: "停用" }, { value: "muted", label: "静默" },
];

const channelOptions = ["钉钉", "邮件", "短信", "Slack", "Webhook", "飞书"];

const alertTemplates = [
  { id: 1, name: "CPU 过载告警", template: "【{level}】{name}检测到CPU使用率超过{threshold}%，当前值{current}%，请及时处理！" },
  { id: 2, name: "内存告警", template: "【{level}】{name}检测到内存使用率超过{threshold}%，当前值{current}%，请检查是否存在内存泄漏！" },
  { id: 3, name: "响应时间告警", template: "【{level}】{name}检测到响应时间超过{threshold}ms，当前值{current}ms，请优化性能！" },
  { id: 4, name: "错误率告警", template: "【{level}】{name}检测到错误率超过{threshold}%，当前值{current}%，请检查服务状态！" },
];

const escalationPolicies = [
  { id: 1, name: "5分钟升级", levels: [{ duration: 5, notifyChannels: ["钉钉"], escalateTo: "运维人员" }] },
  { id: 2, name: "15分钟升级", levels: [{ duration: 15, notifyChannels: ["钉钉", "邮件"], escalateTo: "运维经理" }] },
  { id: 3, name: "30分钟升级", levels: [{ duration: 30, notifyChannels: ["钉钉", "邮件", "短信"], escalateTo: "技术总监" }] },
];

export default function AlertRules() {
  const { showToast } = useToast();
  const [rules, setRules] = useState<AlertRule[]>(initRules);
  const [showModal, setShowModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showEscalationModal, setShowEscalationModal] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [showSilenceModal, setShowSilenceModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [viewingRule, setViewingRule] = useState<AlertRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AlertRule | null>(null);
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [advancedMode, setAdvancedMode] = useState(false);
  const [selectedRules, setSelectedRules] = useState<Set<number>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<"enable" | "disable" | "delete">("enable");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [formData, setFormData] = useState({ 
    name: "", 
    metric: "cpu_usage", 
    condition: ">", 
    threshold: 80, 
    level: "critical" as Level, 
    status: "enabled" as RuleStatus, 
    channels: [] as string[],
    expression: "",
    cooldown: 5,
    autoRecover: false,
    templateId: null as number | null,
    escalationPolicyId: null as number | null,
  });

  const [alertStatistics, setAlertStatistics] = useState({
    todayTotal: 156,
    criticalCount: 23,
    warningCount: 85,
    infoCount: 48,
    resolvedCount: 142,
    avgResolveTime: 12.5,
    topMetrics: [
      { metric: "CPU 使用率", count: 45, trend: 12 },
      { metric: "响应时间", count: 38, trend: -5 },
      { metric: "内存使用率", count: 32, trend: 8 },
      { metric: "错误率", count: 28, trend: 15 },
    ],
  });

  const [recentAlerts, setRecentAlerts] = useState([
    { id: 1, time: "14:35:22", rule: "CPU 过载告警", level: "critical", agent: "order-service", value: 95, status: "firing" },
    { id: 2, time: "14:32:15", rule: "响应时间告警", level: "warning", agent: "payment-service", value: 320, status: "firing" },
    { id: 3, time: "14:28:45", rule: "内存使用告警", level: "critical", agent: "user-service", value: 92, status: "resolved" },
    { id: 4, time: "14:25:30", rule: "错误率告警", level: "warning", agent: "gateway-service", value: 5.2, status: "resolved" },
    { id: 5, time: "14:20:12", rule: "磁盘使用告警", level: "info", agent: "inventory-service", value: 85, status: "firing" },
  ]);

  useEffect(() => { fetchRules(); }, []);

  const fetchRules = async () => {
    try {
      const response = await alertRulesApi.getAll();
      if (response.data?.length > 0) {
        setRules(response.data.map((rule: any) => ({ 
          ...rule, 
          channels: Array.isArray(rule.channels) ? rule.channels : (rule.channels ? rule.channels.split(",") : [])
        })));
      }
    } catch (error) { console.error("加载告警规则失败:", error); }
  };

  const filtered = useMemo(() =>
    rules.filter((r) =>
      (filterLevel === "all" || r.level === filterLevel) &&
      (filterStatus === "all" || r.status === filterStatus) &&
      (search === "" || r.name.toLowerCase().includes(search.toLowerCase()))
    ), [rules, filterLevel, filterStatus, search]);

  const { currentPage, pageSize, totalPages, startIndex, endIndex, paginatedData, setCurrentPage, setPageSize, canPrevPage, canNextPage } = usePagination({ data: filtered });

  const allChecked = filtered.length > 0 && filtered.every((r) => checkedIds.has(r.id));
  const someChecked = filtered.some((r) => checkedIds.has(r.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) setCheckedIds((prev) => { const next = new Set(prev); filtered.forEach((r) => next.delete(r.id)); return next; });
    else setCheckedIds((prev) => { const next = new Set(prev); filtered.forEach((r) => next.add(r.id)); return next; });
  };

  const toggleRow = (id: number) => setCheckedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const handleCreate = () => { setEditingRule(null); setFormData({ name: "", metric: "cpu_usage", condition: ">", threshold: 80, level: "critical", status: "enabled", channels: [] }); setShowModal(true); };

  const handleEdit = (rule: AlertRule) => { setEditingRule(rule); setFormData({ name: rule.name, metric: rule.metric, condition: rule.condition, threshold: rule.threshold, level: rule.level, status: rule.status, channels: rule.channels }); setShowModal(true); };

  const handleSave = async () => {
    if (!formData.name.trim()) { showToast("请输入规则名称", "warning"); return; }
    if (formData.channels.length === 0) { showToast("请选择至少一个通知渠道", "warning"); return; }
    try {
      const unit = metricOptions.find((m) => m.value === formData.metric)?.label.match(/\((.+)\)/)?.[1] || "";
      if (editingRule) {
        const response = await alertRulesApi.update(editingRule.id, { ...formData, unit, channels: formData.channels.join(",") });
        if (response.data) setRules((prev) => prev.map((r) => r.id === editingRule.id ? { ...response.data, channels: response.data.channels.split(",") } : r));
        showToast(`规则「${formData.name}」更新成功`, "success");
      } else {
        const response = await alertRulesApi.create({ ...formData, unit, channels: formData.channels.join(","), triggerCount: 0, lastTrigger: "—" });
        if (response.data) setRules((prev) => [{ ...response.data, channels: response.data.channels.split(",") }, ...prev]);
        showToast(`规则「${formData.name}」创建成功`, "success");
      }
      setShowModal(false);
    } catch (error) { showToast("保存规则失败", "error"); }
  };

  const handleToggleStatus = async (id: number) => {
    const rule = rules.find((r) => r.id === id); if (!rule) return;
    const newStatus: RuleStatus = rule.status === "enabled" ? "disabled" : "enabled";
    try {
      await alertRulesApi.toggleStatus(id, newStatus);
      setRules((prev) => prev.map((r) => r.id !== id ? r : { ...r, status: newStatus }));
      showToast(`规则「${rule.name}」已${newStatus === "enabled" ? "启用" : "停用"}`, "info");
    } catch (error) { showToast("更新规则状态失败", "error"); }
  };

  const handleDelete = async (id: number) => {
    const rule = rules.find((r) => r.id === id);
    try {
      await alertRulesApi.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast(`规则「${rule?.name}」已删除`, "success");
      if (selectedRuleId === id) setSelectedRuleId(null);
      setCheckedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch (error) { showToast("删除规则失败", "error"); }
  };

  const handleBulkEnable = async () => {
    try {
      for (const id of checkedIds) await alertRulesApi.toggleStatus(id, "enabled");
      setRules((prev) => prev.map((r) => checkedIds.has(r.id) ? { ...r, status: "enabled" } : r));
      showToast(`已批量启用 ${checkedIds.size} 条规则`, "success");
      setCheckedIds(new Set());
    } catch (error) { showToast("批量启用失败", "error"); }
  };

  const handleBulkDisable = async () => {
    try {
      for (const id of checkedIds) await alertRulesApi.toggleStatus(id, "disabled");
      setRules((prev) => prev.map((r) => checkedIds.has(r.id) ? { ...r, status: "disabled" } : r));
      showToast(`已批量停用 ${checkedIds.size} 条规则`, "info");
      setCheckedIds(new Set());
    } catch (error) { showToast("批量停用失败", "error"); }
  };

  const handleBulkDelete = async () => {
    try {
      for (const id of checkedIds) await alertRulesApi.delete(id);
      setRules((prev) => prev.filter((r) => !checkedIds.has(r.id)));
      showToast(`已批量删除 ${checkedIds.size} 条规则`, "success");
      setCheckedIds(new Set());
    } catch (error) { showToast("批量删除失败", "error"); }
  };

  const selectedRule = rules.find((r) => r.id === selectedRuleId);
  const ruleHistoryData = historyData.map((d) => ({ ...d, value: selectedRule ? selectedRule.level === "critical" ? d.critical * 1.2 : selectedRule.level === "warning" ? d.warning * 0.8 : d.info * 1.5 : 0, threshold: selectedRule?.threshold || 0 }));

  const stats = [
    { label: "规则总数", value: rules.length, color: "#165DFF" },
    { label: "启用规则", value: rules.filter((r) => r.status === "enabled").length, color: "#00D68F" },
    { label: "严重级别", value: rules.filter((r) => r.level === "critical" && r.status === "enabled").length, color: "#FF4D4F" },
    { label: "今日触发", value: rules.reduce((acc, r) => acc + (r.status === "enabled" ? r.triggerCount : 0), 0), color: "#FFAA00" },
  ];

  return (
    <MainLayout title="告警规则">
      <div data-cmp="AlertRules" className="space-y-4">
        <PageHeader
          title="告警规则管理"
          subtitle={`${rules.length} 规则 · ${stats[1].value} 启用 · ${stats[2].value} 严重`}
          actions={
            <>
              <SearchBar value={search} onChange={setSearch} onSearch={() => setCurrentPage(1)} placeholder="搜索规则名称..." />
              <FilterDropdown value={filterLevel} options={levelOptions} onChange={setFilterLevel} />
              <FilterDropdown value={filterStatus} options={statusOptions} onChange={setFilterStatus} />
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新增规则</TechButton>
              <TechButton variant="secondary" icon={<Zap size={13} />} onClick={() => setShowTemplateModal(true)}>模板管理</TechButton>
              <TechButton variant="secondary" icon={<TrendingUp size={13} />} onClick={() => setShowEscalationModal(true)}>升级策略</TechButton>
              <TechButton variant="secondary" icon={<Mail size={13} />} onClick={() => setShowChannelModal(true)}>渠道配置</TechButton>
              <TechButton variant="secondary" icon={<Shield size={13} />} onClick={() => setShowSilenceModal(true)}>静默管理</TechButton>
            </>
          }
        />

        <div className="grid grid-cols-6 gap-3">
          {[
            { label: "今日告警", value: alertStatistics.todayTotal, color: "#FF4D4F", icon: <AlertTriangle size={16} /> },
            { label: "严重告警", value: alertStatistics.criticalCount, color: "#FF4D4F", icon: <AlertTriangle size={16} /> },
            { label: "警告告警", value: alertStatistics.warningCount, color: "#FFAA00", icon: <AlertTriangle size={16} /> },
            { label: "已解决", value: alertStatistics.resolvedCount, color: "#00D68F", icon: <CheckCircle size={16} /> },
            { label: "平均解决时间", value: `${alertStatistics.avgResolveTime}min`, color: "#165DFF", icon: <Clock size={16} /> },
            { label: "活跃规则", value: rules.filter(r => r.status === "enabled").length, color: "#00D68F", icon: <Bell size={16} /> },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-4 bg-card border border-border hover:border-blue-500/50 transition-colors cursor-pointer">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-muted-foreground">{s.label}</div>
                <div style={{ color: s.color }}>{s.icon}</div>
              </div>
              <div className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-500" />
              <span className="text-sm font-medium text-white">TOP 告警指标</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">更新时间: </span>
              <span className="text-white">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {alertStatistics.topMetrics.map((item, index) => (
              <div key={item.metric} className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-muted-foreground">{index + 1}. {item.metric}</span>
                  <span className={`text-xs ${item.trend > 0 ? "text-red-400" : "text-green-400"}`}>
                    {item.trend > 0 ? "+" : ""}{item.trend}%
                  </span>
                </div>
                <div className="text-lg font-bold text-white">{item.count} 次</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl p-4 bg-card border border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History size={14} className="text-yellow-500" />
              <span className="text-sm font-medium text-white">最近告警</span>
            </div>
            <span className="text-xs text-muted-foreground">实时更新</span>
          </div>
          <div className="space-y-2">
            {recentAlerts.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg hover:bg-muted transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${alert.level === "critical" ? "bg-red-500" : alert.level === "warning" ? "bg-yellow-500" : "bg-blue-500"} ${alert.status === "firing" ? "animate-pulse" : ""}`} />
                  <div>
                    <div className="text-xs text-white">{alert.rule}</div>
                    <div className="text-xs text-muted-foreground">{alert.agent}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white">{alert.value}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${alert.status === "firing" ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                    {alert.status === "firing" ? "触发中" : "已解决"}
                  </span>
                  <span className="text-xs text-muted-foreground">{alert.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-3" style={{ height: 440 }}>
          <div className="flex-1 rounded-xl overflow-hidden flex flex-col bg-card border border-border">
            <div className="flex items-center px-4 py-2.5 text-xs flex-shrink-0 bg-muted border-b border-border text-muted-foreground">
              <div className="w-8 flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={toggleAll}>
                {allChecked ? <CheckSquare size={14} className="text-blue-500" /> : someChecked ? <MinusSquare size={14} className="text-blue-500" /> : <Square size={14} className="text-muted-foreground" />}
              </div>
              <span className="w-40 flex-shrink-0">规则名称</span>
              <span className="w-36 flex-shrink-0">指标</span>
              <span className="w-32 flex-shrink-0">阈值条件</span>
              <span className="w-20 flex-shrink-0">级别</span>
              <span className="w-20 flex-shrink-0">状态</span>
              <span className="w-20 flex-shrink-0">触发次数</span>
              <span className="flex-1">通知渠道</span>
              <span className="w-36 flex-shrink-0 text-right">操作</span>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              {paginatedData.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 h-full text-muted-foreground">
                  <Bell size={28} className="opacity-30" />
                  <span className="text-xs">暂无告警规则</span>
                </div>
              ) : paginatedData.map((rule) => {
                const ls = levelStyle[rule.level];
                const isSelected = selectedRuleId === rule.id;
                const isChecked = checkedIds.has(rule.id);
                const metricLabel = metricOptions.find((m) => m.value === rule.metric)?.label || rule.metric;
                return (
                  <div
                    key={rule.id}
                    className="flex items-center px-4 py-3 cursor-pointer transition-colors border-b border-border"
                    style={{ background: isChecked ? "rgba(22,93,255,0.06)" : isSelected ? "rgba(22,93,255,0.08)" : "transparent", borderLeft: isSelected ? "2px solid #165DFF" : isChecked ? "2px solid rgba(22,93,255,0.4)" : "2px solid transparent" }}
                    onClick={() => setSelectedRuleId(isSelected ? null : rule.id)}
                  >
                    <div className="w-8 flex-shrink-0 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toggleRow(rule.id); }}>
                      {isChecked ? <CheckSquare size={14} className="text-blue-500" /> : <Square size={14} className="text-muted-foreground opacity-50" />}
                    </div>
                    <div className="w-40 flex-shrink-0 pr-2">
                      <div className="text-xs text-white font-medium truncate">{rule.name}</div>
                      <div className="text-xs mt-0.5 text-muted-foreground">最近: {rule.lastTrigger}</div>
                    </div>
                    <div className="w-36 flex-shrink-0 pr-2"><span className="text-xs truncate block text-blue-400">{metricLabel}</span></div>
                    <div className="w-32 flex-shrink-0 pr-2">
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: ls.bg, color: ls.color, border: `1px solid ${ls.border}` }}>{rule.condition} {rule.threshold} {rule.unit}</span>
                    </div>
                    <div className="w-20 flex-shrink-0 pr-2"><span className="text-xs px-2 py-0.5 rounded" style={{ background: ls.bg, color: ls.color }}>{rule.level === "critical" ? "严重" : rule.level === "warning" ? "警告" : "提示"}</span></div>
                    <div className="w-20 flex-shrink-0 pr-2 flex items-center gap-1">{statusIcon[rule.status]}<span className="text-xs" style={{ color: rule.status === "enabled" ? "#00D68F" : rule.status === "muted" ? "#FFAA00" : "var(--muted-foreground)" }}>{rule.status === "enabled" ? "启用" : rule.status === "muted" ? "静默" : "停用"}</span></div>
                    <div className="w-20 flex-shrink-0 pr-2"><span className="text-xs font-medium" style={{ color: rule.triggerCount > 10 ? "#FF4D4F" : rule.triggerCount > 5 ? "#FFAA00" : "var(--muted-foreground)" }}>{rule.triggerCount} 次</span></div>
                    <div className="flex-1 pr-2 flex flex-wrap gap-1">
                      {rule.channels.map((ch) => (<span key={ch} className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">{ch}</span>))}
                    </div>
                    <div className="w-36 flex-shrink-0 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <TechButton variant="ghost" size="xs" icon={<Eye size={11} />} onClick={() => setViewingRule(rule)}>查看</TechButton>
                      <TechButton variant="ghost" size="xs" icon={<Edit size={11} />} onClick={() => handleEdit(rule)}>编辑</TechButton>
                      <button onClick={() => handleToggleStatus(rule.id)} className="px-2 py-1 rounded text-xs transition-colors" style={{ background: rule.status === "enabled" ? "rgba(255,77,79,0.1)" : "rgba(0,214,143,0.1)", color: rule.status === "enabled" ? "#FF4D4F" : "#00D68F" }}>{rule.status === "enabled" ? "停用" : "启用"}</button>
                      <button onClick={() => setDeletingRule(rule)} className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"><Trash size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <Pagination currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalCount={filtered.length} startIndex={startIndex} endIndex={endIndex} onPageChange={setCurrentPage} onPageSizeChange={setPageSize} canPrev={canPrevPage} canNext={canNextPage} />
          </div>

          <div className="w-72 flex-shrink-0 rounded-xl p-4 flex flex-col bg-card border border-border">
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
              <Bell size={13} className="text-blue-500" />
              <span className="text-sm font-medium text-white">告警触发历史</span>
            </div>
            <div className="text-xs mb-4 flex-shrink-0 text-muted-foreground">{selectedRule ? `「${selectedRule.name}」近7天` : "全局近 7 天趋势"}</div>
            <div className="flex-1 min-h-[250px]" style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ruleHistoryData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94A3B8" }} />
                  {selectedRule && <ReferenceLine y={selectedRule.threshold} stroke="#FFAA00" strokeDasharray="4 2" label={{ value: `阈值 ${selectedRule.threshold}`, fill: "#FFAA00", fontSize: 9 }} />}
                  <Line type="monotonic" dataKey="value" name="触发次数" stroke={selectedRule ? levelStyle[selectedRule.level].color : "#165DFF"} strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex-shrink-0 space-y-1.5 pt-3 border-t border-border">
              {([["严重告警", rules.filter((r) => r.level === "critical").length, "#FF4D4F"], ["警告告警", rules.filter((r) => r.level === "warning").length, "#FFAA00"], ["提示告警", rules.filter((r) => r.level === "info").length, "#165DFF"]] as [string, number, string][]).map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 rounded-full" style={{ width: value * 10, background: color, opacity: 0.7 }} />
                    <span className="text-xs font-medium" style={{ color }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/60" onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-md bg-card border border-border shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-white"><X size={14} /></button>
            <div className="flex items-center gap-2 mb-5">
              <Bell size={16} className="text-blue-500" />
              <span className="text-sm font-semibold text-white">{editingRule ? "编辑告警规则" : "新增告警规则"}</span>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1.5 block text-muted-foreground">规则名称</label>
                <input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="输入规则名称..." className="w-full px-3 py-2 rounded-md text-xs outline-none bg-input border border-border" style={{ color: "var(--foreground)" }} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block text-muted-foreground">监控指标</label>
                <select value={formData.metric} onChange={(e) => setFormData((prev) => ({ ...prev, metric: e.target.value }))} className="w-full px-3 py-2 rounded-md text-xs outline-none appearance-none cursor-pointer" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  {metricOptions.map((m) => <option key={m.value} value={m.value} style={{ color: "var(--foreground)", background: "var(--card)" }}>{m.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs mb-1.5 block text-muted-foreground">触发条件</label>
                <div className="flex gap-2 items-center">
                  <select value={formData.condition} onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value }))} className="w-20 px-2 py-2 rounded-md text-xs outline-none appearance-none cursor-pointer text-center" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    {[">", ">=", "<", "<=", "="].map((c) => <option key={c} value={c} style={{ color: "var(--foreground)", background: "var(--card)" }}>{c}</option>)}
                  </select>
                  <input type="number" value={formData.threshold} onChange={(e) => setFormData((prev) => ({ ...prev, threshold: Number(e.target.value) }))} className="flex-1 px-3 py-2 rounded-md text-xs outline-none bg-input border border-border" style={{ color: "var(--foreground)" }} />
                  <span className="text-xs text-muted-foreground">{metricOptions.find((m) => m.value === formData.metric)?.label.match(/\((.+)\)/)?.[1] || ""}</span>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block text-muted-foreground">告警级别</label>
                <div className="flex gap-2">
                  {([["critical", "严重"], ["warning", "警告"], ["info", "提示"]] as [Level, string][]).map(([v, l]) => {
                    const ls = levelStyle[v]; const active = formData.level === v;
                    return <button key={v} onClick={() => setFormData((prev) => ({ ...prev, level: v }))} className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all" style={{ background: active ? ls.bg : "var(--muted)", color: active ? ls.color : "var(--muted-foreground)", border: active ? `1px solid ${ls.border}` : "1px solid var(--border)" }}>{l}</button>;
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block text-muted-foreground">通知渠道 <span className="text-blue-500">（可多选）</span></label>
                <div className="flex flex-wrap gap-2">
                  {channelOptions.map((ch) => {
                    const active = formData.channels.includes(ch);
                    return <button key={ch} onClick={() => setFormData((prev) => ({ ...prev, channels: prev.channels.includes(ch) ? prev.channels.filter((c) => c !== ch) : [...prev.channels, ch] }))} className="px-3 py-1 rounded-full text-xs transition-all" style={{ background: active ? "rgba(22,93,255,0.2)" : "var(--muted)", color: active ? "#60A5FA" : "var(--muted-foreground)", border: active ? "1px solid rgba(22,93,255,0.4)" : "1px solid var(--border)" }}>{ch}</button>;
                  })}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <TechButton variant="ghost" onClick={() => setShowModal(false)}>取消</TechButton>
              <div className="flex-1" />
              <TechButton variant="primary" icon={<Bell size={12} />} onClick={handleSave}>保存规则</TechButton>
            </div>
          </div>
        </div>
      )}

      {viewingRule && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70" onClick={() => setViewingRule(null)}>
          <div className="w-[500px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingRule(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center text-muted-foreground"><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><Bell size={15} className="text-blue-500" />规则详情</div>
            <div className="space-y-4">
              <div><div className="text-xs mb-1 text-muted-foreground">规则名称</div><div className="text-sm text-white">{viewingRule.name}</div></div>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs mb-1 text-muted-foreground">监控指标</div><div className="text-xs text-white">{metricOptions.find((m) => m.value === viewingRule.metric)?.label || viewingRule.metric}</div></div>
                <div><div className="text-xs mb-1 text-muted-foreground">触发条件</div><span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: levelStyle[viewingRule.level].bg, color: levelStyle[viewingRule.level].color }}>{viewingRule.condition} {viewingRule.threshold} {viewingRule.unit}</span></div>
                <div><div className="text-xs mb-1 text-muted-foreground">告警级别</div><span className="text-xs px-2 py-0.5 rounded" style={{ background: levelStyle[viewingRule.level].bg, color: levelStyle[viewingRule.level].color }}>{viewingRule.level === "critical" ? "严重" : viewingRule.level === "warning" ? "警告" : "提示"}</span></div>
                <div><div className="text-xs mb-1 text-muted-foreground">状态</div><div className="flex items-center gap-1">{statusIcon[viewingRule.status]}<span className="text-xs">{viewingRule.status === "enabled" ? "启用" : viewingRule.status === "muted" ? "静默" : "停用"}</span></div></div>
                <div><div className="text-xs mb-1 text-muted-foreground">触发次数</div><div className="text-xs text-white">{viewingRule.triggerCount} 次</div></div>
                <div><div className="text-xs mb-1 text-muted-foreground">最后触发</div><div className="text-xs text-white">{viewingRule.lastTrigger}</div></div>
              </div>
              <div><div className="text-xs mb-1 text-muted-foreground">通知渠道</div><div className="flex flex-wrap gap-2">{viewingRule.channels.map((ch) => <span key={ch} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">{ch}</span>)}</div></div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setViewingRule(null)}>关闭</TechButton>
              <TechButton variant="primary" onClick={() => { setViewingRule(null); handleEdit(viewingRule); }}>编辑</TechButton>
            </div>
          </div>
        </div>
      )}

      {deletingRule && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70" onClick={() => setDeletingRule(null)}>
          <div className="w-[400px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2"><Trash size={15} className="text-red-500" />确认删除</div>
            <div className="text-sm text-muted-foreground">确定要删除规则 <span className="text-white font-medium">{deletingRule.name}</span> 吗？此操作不可撤销。</div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setDeletingRule(null)}>取消</TechButton>
              <TechButton variant="danger" onClick={() => handleDelete(deletingRule.id)}>确认删除</TechButton>
            </div>
          </div>
        </div>
      )}

      {checkedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl bg-slate-900/95 border border-blue-500/35 shadow-xl backdrop-blur">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-600/30">
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-blue-500 text-white">{checkedIds.size}</div>
            <span className="text-xs text-muted-foreground">条已选</span>
          </div>
          <button onClick={handleBulkEnable} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/12 text-green-500 border border-green-500/25 hover:bg-green-500/22 transition-colors"><Play size={11} />批量启用</button>
          <button onClick={handleBulkDisable} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-500/25 hover:bg-gray-500/25 transition-colors"><StopCircle size={11} />批量停用</button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/15 text-red-500 border border-red-500/35 hover:bg-red-500/28 transition-colors"><Trash size={11} />批量删除</button>
          <button onClick={() => setCheckedIds(new Set())} className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-gray-500/20 hover:text-white transition-colors"><X size={13} /></button>
        </div>
      )}

      {showChannelModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70" onClick={() => setShowChannelModal(false)}>
          <div className="w-[520px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowChannelModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center text-muted-foreground"><X size={14} /></button>
            <div className="flex items-center gap-2 mb-5">
              <Settings size={15} className="text-blue-500" />
              <span className="text-sm font-semibold text-white">通知渠道配置</span>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                { name: "钉钉", icon: <MessageSquare size={14} />, enabled: true, config: "已配置机器人" },
                { name: "邮件", icon: <Mail size={14} />, enabled: true, config: "SMTP 已配置" },
                { name: "短信", icon: <Users size={14} />, enabled: false, config: "待配置" },
                { name: "Slack", icon: <MessageSquare size={14} />, enabled: false, config: "待配置" },
                { name: "Webhook", icon: <Webhook size={14} />, enabled: true, config: "2 个端点" },
                { name: "飞书", icon: <MessageSquare size={14} />, enabled: true, config: "已配置机器人" },
              ].map((ch) => (
                <div key={ch.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${ch.enabled ? "bg-blue-500/15" : "bg-gray-500/10"}`}>
                      <span className={ch.enabled ? "text-blue-500" : "text-gray-500"}>{ch.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{ch.name}</div>
                      <div className="text-xs text-muted-foreground">{ch.config}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => showToast(`${ch.name}渠道配置页面开发中...`, "info")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${ch.enabled ? "bg-green-500/12 text-green-500 border border-green-500/25" : "bg-gray-500/15 text-gray-400 border border-gray-500/25"}`}
                  >
                    {ch.enabled ? "配置" : "启用"}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <TechButton variant="secondary" onClick={() => setShowChannelModal(false)}>关闭</TechButton>
            </div>
          </div>
        </div>
      )}

      {showSilenceModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/70" onClick={() => setShowSilenceModal(false)}>
          <div className="w-[520px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowSilenceModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center text-muted-foreground"><X size={14} /></button>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Shield size={15} className="text-yellow-500" />
                <span className="text-sm font-semibold text-white">静默管理</span>
              </div>
              <TechButton variant="primary" size="sm" icon={<Plus size={11} />}>添加静默</TechButton>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {[
                { id: 1, name: "夜间静默", scope: "全部规则", start: "22:00", end: "06:00", status: "active" },
                { id: 2, name: "运维窗口", scope: "生产环境", start: "2024-06-17 00:00", end: "2024-06-17 04:00", status: "pending" },
                { id: 3, name: "紧急维护", scope: "支付服务", start: "2024-06-16 14:00", end: "2024-06-16 15:00", status: "expired" },
              ].map((silence) => (
                <div key={silence.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-medium">{silence.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${silence.status === "active" ? "bg-green-500/15 text-green-400" : silence.status === "pending" ? "bg-yellow-500/15 text-yellow-400" : "bg-gray-500/15 text-gray-400"}`}>
                        {silence.status === "active" ? "生效中" : silence.status === "pending" ? "待生效" : "已过期"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>{silence.scope}</span>
                      <span>·</span>
                      <span>{silence.start} ~ {silence.end}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <TechButton variant="ghost" size="xs">编辑</TechButton>
                    <button className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-500/10"><Trash size={12} /></button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-5">
              <TechButton variant="secondary" onClick={() => setShowSilenceModal(false)}>关闭</TechButton>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
