import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import {
  Plus,
  Bell,
  CheckCircle,
  XCircle,
  PauseCircle,
  Edit,
  Trash,
  X,
  ChevronDown,
  CheckSquare,
  Square,
  MinusSquare,
  Play,
  StopCircle,
  Eye,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Legend,
} from "recharts";
import { useToast } from "../context/ToastContext";
import { alertRulesApi } from "../services/api";

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
}

const initRules: AlertRule[] = [
  { id: 1, name: "CPU 使用率过高", metric: "cpu_usage", condition: ">", threshold: 90, unit: "%", level: "critical", status: "enabled", channels: ["钉钉", "邮件"], triggerCount: 12, lastTrigger: "5分钟前" },
  { id: 2, name: "内存使用率告警", metric: "mem_usage", condition: ">", threshold: 85, unit: "%", level: "warning", status: "enabled", channels: ["邮件"], triggerCount: 4, lastTrigger: "2小时前" },
  { id: 3, name: "接口响应时间超标", metric: "response_time", condition: ">", threshold: 500, unit: "ms", level: "warning", status: "enabled", channels: ["钉钉", "Slack"], triggerCount: 28, lastTrigger: "3分钟前" },
  { id: 4, name: "磁盘空间不足", metric: "disk_usage", condition: ">", threshold: 80, unit: "%", level: "critical", status: "muted", channels: ["邮件", "短信"], triggerCount: 2, lastTrigger: "1天前" },
  { id: 5, name: "错误请求率超限", metric: "error_rate", condition: ">", threshold: 5, unit: "%", level: "critical", status: "enabled", channels: ["钉钉", "邮件", "短信"], triggerCount: 7, lastTrigger: "18分钟前" },
  { id: 6, name: "JVM 堆内存告警", metric: "jvm_heap", condition: ">", threshold: 75, unit: "%", level: "warning", status: "enabled", channels: ["邮件"], triggerCount: 3, lastTrigger: "45分钟前" },
  { id: 7, name: "GC 停顿时间", metric: "gc_pause", condition: ">", threshold: 200, unit: "ms", level: "info", status: "disabled", channels: ["钉钉"], triggerCount: 0, lastTrigger: "—" },
  { id: 8, name: "TCP 连接数过高", metric: "tcp_conn", condition: ">", threshold: 1000, unit: "个", level: "warning", status: "enabled", channels: ["钉钉", "邮件"], triggerCount: 1, lastTrigger: "3天前" },
];

const historyData = [
  { time: "06-10", critical: 3, warning: 5, info: 1 },
  { time: "06-11", critical: 6, warning: 8, info: 2 },
  { time: "06-12", critical: 2, warning: 3, info: 0 },
  { time: "06-13", critical: 9, warning: 12, info: 3 },
  { time: "06-14", critical: 4, warning: 7, info: 1 },
  { time: "06-15", critical: 11, warning: 9, info: 2 },
  { time: "06-16", critical: 7, warning: 14, info: 4 },
];

const metricOptions = [
  { value: "cpu_usage", label: "CPU 使用率 (%)" },
  { value: "mem_usage", label: "内存使用率 (%)" },
  { value: "response_time", label: "接口响应时间 (ms)" },
  { value: "disk_usage", label: "磁盘使用率 (%)" },
  { value: "error_rate", label: "错误请求率 (%)" },
  { value: "jvm_heap", label: "JVM 堆内存 (%)" },
  { value: "gc_pause", label: "GC 停顿时间 (ms)" },
  { value: "tcp_conn", label: "TCP 连接数 (个)" },
  { value: "qps", label: "QPS (次/秒)" },
  { value: "thread_count", label: "线程数 (个)" },
];

const conditionOptions = [">", ">=", "<", "<=", "="];

const levelOptions: { value: Level; label: string }[] = [
  { value: "critical", label: "严重" },
  { value: "warning", label: "警告" },
  { value: "info", label: "提示" },
];

const channelOptions = ["钉钉", "邮件", "短信", "Slack", "Webhook", "飞书"];

const levelStyle: Record<Level, { color: string; bg: string; border: string }> = {
  critical: { color: "#FF4D4F", bg: "rgba(255,77,79,0.12)", border: "rgba(255,77,79,0.3)" },
  warning: { color: "#FFAA00", bg: "rgba(255,170,0,0.12)", border: "rgba(255,170,0,0.3)" },
  info: { color: "#165DFF", bg: "rgba(22,93,255,0.12)", border: "rgba(22,93,255,0.3)" },
};

const levelLabel: Record<Level, string> = {
  critical: "严重",
  warning: "警告",
  info: "提示",
};

const statusIcon: Record<RuleStatus, React.ReactNode> = {
  enabled: <CheckCircle size={13} style={{ color: "#00D68F" }} />,
  disabled: <XCircle size={13} style={{ color: "#64748B" }} />,
  muted: <PauseCircle size={13} style={{ color: "#FFAA00" }} />,
};

const statusLabel: Record<RuleStatus, string> = {
  enabled: "启用",
  disabled: "停用",
  muted: "静默",
};

interface AlertRuleFormData {
  name: string;
  metric: string;
  condition: string;
  threshold: number;
  level: Level;
  status: RuleStatus;
  channels: string[];
}

export default function AlertRules() {
  const { showToast } = useToast();
  const [rules, setRules] = useState<AlertRule[]>(initRules);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [viewingRule, setViewingRule] = useState<AlertRule | null>(null);
  const [deletingRule, setDeletingRule] = useState<AlertRule | null>(null);
  const [filterLevel, setFilterLevel] = useState<"all" | Level>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | RuleStatus>("all");
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [showLevelDropdown, setShowLevelDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const [formData, setFormData] = useState<AlertRuleFormData>({
    name: "",
    metric: metricOptions[0].value,
    condition: ">",
    threshold: 80,
    level: "critical",
    status: "enabled",
    channels: [],
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await alertRulesApi.getAll();
      if (response.data && response.data.length > 0) {
        // 转换后端返回的channels字符串为数组
        const parsedRules = response.data.map((rule: any) => ({
          ...rule,
          channels: rule.channels ? rule.channels.split(",") : []
        }));
        setRules(parsedRules);
      }
    } catch (error) {
      console.error("加载告警规则失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRules = rules.filter((r) =>
    (filterLevel === "all" || r.level === filterLevel) &&
    (filterStatus === "all" || r.status === filterStatus) &&
    (searchKeyword === "" || r.name.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredRules.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRules = filteredRules.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchKeyword(searchTerm);
    setCurrentPage(1);
    setSearching(true);
    setTimeout(() => setSearching(false), 300);
  };

  const allChecked = filteredRules.length > 0 && filteredRules.every((r) => checkedIds.has(r.id));
  const someChecked = filteredRules.some((r) => checkedIds.has(r.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredRules.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setCheckedIds((prev) => {
        const next = new Set(prev);
        filteredRules.forEach((r) => next.add(r.id));
        return next;
      });
    }
  };

  const toggleRow = (id: number) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = () => {
    setEditingRule(null);
    setFormData({
      name: "",
      metric: metricOptions[0].value,
      condition: ">",
      threshold: 80,
      level: "critical",
      status: "enabled",
      channels: [],
    });
    setShowModal(true);
  };

  const handleEdit = (rule: AlertRule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      metric: rule.metric,
      condition: rule.condition,
      threshold: rule.threshold,
      level: rule.level,
      status: rule.status,
      channels: rule.channels,
    });
    setShowModal(true);
  };

  const handleToggleStatus = async (id: number) => {
    const rule = rules.find((r) => r.id === id);
    if (!rule) return;

    const newStatus: RuleStatus = rule.status === "enabled" ? "disabled" : "enabled";
    try {
      await alertRulesApi.toggleStatus(id, newStatus);
      setRules((prev) => prev.map((r) => (r.id !== id ? r : { ...r, status: newStatus })));
      showToast(`规则「${rule.name}」已${newStatus === "enabled" ? "启用" : "停用"}`, "info");
    } catch (error) {
      console.error("更新规则状态失败:", error);
      showToast("更新规则状态失败", "error");
    }
  };

  const handleDelete = async (id: number) => {
    const rule = rules.find((r) => r.id === id);
    try {
      await alertRulesApi.delete(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
      showToast(`规则「${rule?.name}」已删除`, "success");
      if (selectedRuleId === id) setSelectedRuleId(null);
      setCheckedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeletingRule(null);
    } catch (error) {
      console.error("删除规则失败:", error);
      showToast("删除规则失败", "error");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("请输入规则名称", "error");
      return;
    }
    if (formData.channels.length === 0) {
      showToast("请选择至少一个通知渠道", "error");
      return;
    }

    const metricObj = metricOptions.find((m) => m.value === formData.metric);
    const unit = metricObj?.label.match(/\((.+)\)/)?.[1] || "";

    try {
      if (editingRule) {
        const response = await alertRulesApi.update(editingRule.id, {
          ...formData,
          unit,
          channels: formData.channels.join(","), // 数组转字符串
        });
        if (response.data) {
          const updatedRule = {
            ...response.data,
            channels: response.data.channels ? response.data.channels.split(",") : []
          };
          setRules((prev) => prev.map((r) => (r.id === editingRule.id ? updatedRule : r)));
          showToast(`规则「${formData.name}」更新成功`, "success");
        }
      } else {
        const response = await alertRulesApi.create({
          ...formData,
          unit,
          channels: formData.channels.join(","), // 数组转字符串
          triggerCount: 0,
          lastTrigger: "—",
        });
        if (response.data) {
          const newRule = {
            ...response.data,
            channels: response.data.channels ? response.data.channels.split(",") : []
          };
          setRules((prev) => [newRule, ...prev]);
          showToast(`规则「${formData.name}」创建成功`, "success");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存规则失败:", error);
      showToast("保存规则失败", "error");
    }
  };

  const handleBulkEnable = async () => {
    const count = checkedIds.size;
    try {
      for (const id of checkedIds) {
        await alertRulesApi.toggleStatus(id, "enabled");
      }
      setRules((prev) => prev.map((r) => (checkedIds.has(r.id) ? { ...r, status: "enabled" } : r)));
      showToast(`已批量启用 ${count} 条规则`, "success");
      setCheckedIds(new Set());
    } catch (error) {
      console.error("批量启用失败:", error);
      showToast("批量启用失败", "error");
    }
  };

  const handleBulkDisable = async () => {
    const count = checkedIds.size;
    try {
      for (const id of checkedIds) {
        await alertRulesApi.toggleStatus(id, "disabled");
      }
      setRules((prev) => prev.map((r) => (checkedIds.has(r.id) ? { ...r, status: "disabled" } : r)));
      showToast(`已批量停用 ${count} 条规则`, "info");
      setCheckedIds(new Set());
    } catch (error) {
      console.error("批量停用失败:", error);
      showToast("批量停用失败", "error");
    }
  };

  const handleBulkDelete = async () => {
    const count = checkedIds.size;
    try {
      for (const id of checkedIds) {
        await alertRulesApi.delete(id);
      }
      setRules((prev) => prev.filter((r) => !checkedIds.has(r.id)));
      if (selectedRuleId && checkedIds.has(selectedRuleId)) setSelectedRuleId(null);
      showToast(`已批量删除 ${count} 条规则`, "success");
      setCheckedIds(new Set());
    } catch (error) {
      console.error("批量删除失败:", error);
      showToast("批量删除失败", "error");
    }
  };

  const toggleChannel = (ch: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(ch)
        ? prev.channels.filter((c) => c !== ch)
        : [...prev.channels, ch],
    }));
  };

  const selectedRule = rules.find((r) => r.id === selectedRuleId);

  const ruleHistoryData = historyData.map((d) => ({
    ...d,
    value: selectedRule
      ? selectedRule.level === "critical"
        ? d.critical * 1.2
        : selectedRule.level === "warning"
        ? d.warning * 0.8
        : d.info * 1.5
      : 0,
    threshold: selectedRule?.threshold || 0,
  }));

  const total = rules.length;
  const enabled = rules.filter((r) => r.status === "enabled").length;
  const critical = rules.filter((r) => r.level === "critical" && r.status === "enabled").length;
  const todayTriggers = rules.reduce((acc, r) => acc + (r.status === "enabled" ? (r.triggerCount || 0) : 0), 0);

  if (loading) {
    return (
      <MainLayout title="告警规则">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm" style={{ color: "#94A3B8" }}>加载中...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="告警规则">
      <div data-cmp="AlertRules" className="space-y-4">
        <PageHeader
          title="告警规则管理"
          subtitle={`${total} 规则 · ${enabled} 启用 · ${critical} 严重活跃 · 今日触发 ${todayTriggers} 次`}
          actions={
            <>
              <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
                <Search size={13} style={{ color: "var(--muted-foreground)" }} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索规则名称..."
                  className="bg-transparent border-none outline-none text-xs flex-1 text-white"
                />
              </div>
              <TechButton variant="primary" icon={<Search size={13} />} onClick={handleSearch} loading={searching}>查询</TechButton>
              <div className="relative">
                <button
                  onClick={() => { setShowLevelDropdown(!showLevelDropdown); setShowStatusDropdown(false); }}
                  className="px-3 py-1.5 rounded-md text-xs text-left bg-[var(--card)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
                >
                  <span>{filterLevel === "all" ? "全部级别" : levelLabel[filterLevel]}</span>
                  <svg className={`w-3 h-3 transition-transform ${showLevelDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showLevelDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 min-w-[100px]">
                    {(["all", "critical", "warning", "info"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => { setFilterLevel(v); setShowLevelDropdown(false); }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-[var(--muted)] transition-colors ${filterLevel === v ? "text-[#165DFF]" : ""}`}
                      >
                        {v === "all" ? "全部" : levelLabel[v]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowLevelDropdown(false); }}
                  className="px-3 py-1.5 rounded-md text-xs text-left bg-[var(--card)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
                >
                  <span>{filterStatus === "all" ? "全部状态" : statusLabel[filterStatus]}</span>
                  <svg className={`w-3 h-3 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 min-w-[100px]">
                    {(["all", "enabled", "disabled", "muted"] as const).map((v) => (
                      <button
                        key={v}
                        onClick={() => { setFilterStatus(v); setShowStatusDropdown(false); }}
                        className={`w-full px-3 py-2 text-xs text-left hover:bg-[var(--muted)] transition-colors ${filterStatus === v ? "text-[#165DFF]" : ""}`}
                      >
                        {v === "all" ? "全部" : statusLabel[v]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>
                新增规则
              </TechButton>
            </>
          }
        />

        <div className="flex gap-3">
          {[
            { label: "规则总数", value: String(total), color: "#165DFF", bg: "rgba(22,93,255,0.1)" },
            { label: "启用规则", value: String(enabled), color: "#00D68F", bg: "rgba(0,214,143,0.1)" },
            { label: "严重级别", value: String(critical), color: "#FF4D4F", bg: "rgba(255,77,79,0.1)" },
            { label: "今日触发次数", value: String(todayTriggers), color: "#FFAA00", bg: "rgba(255,170,0,0.1)" },
          ].map((card) => (
            <div key={card.label} className="flex-1 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{card.label}</div>
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        <div className="flex gap-3" style={{ height: 440 }}>
          <div className="flex-1 rounded-xl overflow-hidden flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div
              className="flex items-center px-4 py-2.5 text-xs flex-shrink-0"
              style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              <div className="w-8 flex-shrink-0 flex items-center justify-center cursor-pointer" onClick={toggleAll}>
                {allChecked ? <CheckSquare size={14} style={{ color: "#165DFF" }} /> : someChecked ? <MinusSquare size={14} style={{ color: "#165DFF" }} /> : <Square size={14} style={{ color: "var(--muted-foreground)" }} />}
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
              {filteredRules.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2" style={{ height: "100%", color: "var(--muted-foreground)" }}>
                  <Bell size={28} style={{ opacity: 0.3 }} />
                  <span className="text-xs">暂无告警规则</span>
                </div>
              ) :
                paginatedRules.map((rule) => {
                  const ls = levelStyle[rule.level];
                  const isSelected = selectedRuleId === rule.id;
                  const isChecked = checkedIds.has(rule.id);
                  const metricLabel = metricOptions.find((m) => m.value === rule.metric)?.label || rule.metric;
                  return (
                    <div
                      key={rule.id}
                      className="flex items-center px-4 py-3 cursor-pointer transition-colors"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: isChecked ? "rgba(22,93,255,0.06)" : isSelected ? "rgba(22,93,255,0.08)" : "transparent",
                        borderLeft: isSelected ? "2px solid #165DFF" : isChecked ? "2px solid rgba(22,93,255,0.4)" : "2px solid transparent",
                      }}
                      onClick={() => setSelectedRuleId(isSelected ? null : rule.id)}
                      onMouseEnter={(e) => { if (!isSelected && !isChecked) e.currentTarget.style.background = "rgba(22,93,255,0.04)"; }}
                      onMouseLeave={(e) => { if (!isSelected && !isChecked) e.currentTarget.style.background = "transparent"; }}
                    >
                    <div className="w-8 flex-shrink-0 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); toggleRow(rule.id); }}>
                      {isChecked ? <CheckSquare size={14} style={{ color: "#165DFF" }} /> : <Square size={14} style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />}
                    </div>

                    <div className="w-40 flex-shrink-0 pr-2">
                      <div className="text-xs text-white font-medium truncate">{rule.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>最近: {rule.lastTrigger}</div>
                    </div>
                    <div className="w-36 flex-shrink-0 pr-2">
                      <span className="text-xs truncate block" style={{ color: "#60A5FA" }}>{metricLabel}</span>
                    </div>
                    <div className="w-32 flex-shrink-0 pr-2">
                      <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: ls.bg, color: ls.color, border: `1px solid ${ls.border}` }}>{rule.condition} {rule.threshold} {rule.unit}</span>
                    </div>
                    <div className="w-20 flex-shrink-0 pr-2">
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: ls.bg, color: ls.color }}>{levelLabel[rule.level]}</span>
                    </div>
                    <div className="w-20 flex-shrink-0 pr-2 flex items-center gap-1">
                      {statusIcon[rule.status]}
                      <span className="text-xs" style={{ color: rule.status === "enabled" ? "#00D68F" : rule.status === "muted" ? "#FFAA00" : "var(--muted-foreground)" }}>{statusLabel[rule.status]}</span>
                    </div>
                    <div className="w-20 flex-shrink-0 pr-2">
                      <span className="text-xs font-medium" style={{ color: rule.triggerCount > 10 ? "#FF4D4F" : rule.triggerCount > 5 ? "#FFAA00" : "var(--muted-foreground)" }}>{rule.triggerCount} 次</span>
                    </div>
                    <div className="flex-1 pr-2 flex flex-wrap gap-1">
                      {(Array.isArray(rule.channels) ? rule.channels : []).map((ch) => (
                        <span key={ch} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.12)", color: "#60A5FA", border: "1px solid rgba(22,93,255,0.2)" }}>{ch}</span>
                      ))}
                    </div>
                    <div className="w-36 flex-shrink-0 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <TechButton variant="ghost" size="xs" icon={<Eye size={11} />} onClick={() => setViewingRule(rule)}>查看</TechButton>
                      <TechButton variant="ghost" size="xs" icon={<Edit size={11} />} onClick={() => handleEdit(rule)}>编辑</TechButton>
                      <button onClick={() => handleToggleStatus(rule.id)} className="px-2 py-1 rounded text-xs transition-colors" style={{ background: rule.status === "enabled" ? "rgba(255,77,79,0.1)" : "rgba(0,214,143,0.1)", color: rule.status === "enabled" ? "#FF4D4F" : "#00D68F", border: "1px solid " + (rule.status === "enabled" ? "rgba(255,77,79,0.25)" : "rgba(0,214,143,0.25)") }}>{rule.status === "enabled" ? "停用" : "启用"}</button>
                      <button onClick={() => setDeletingRule(rule)} className="w-6 h-6 rounded flex items-center justify-center transition-colors" style={{ color: "var(--muted-foreground)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#FF4D4F"; e.currentTarget.style.background = "rgba(255,77,79,0.1)"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}><Trash size={12} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between py-3 px-4 flex-shrink-0" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                显示第 {startIndex + 1} - {Math.min(startIndex + pageSize, filteredRules.length)} 条，共 {filteredRules.length} 条
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  上一页
                </button>
                {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      currentPage === page
                        ? "bg-[#165DFF] text-white"
                        : "hover:bg-[var(--muted)]"
                    }`}
                    style={{ border: "1px solid var(--border)" }}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  下一页
                </button>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  className="ml-2 px-2 py-1 rounded text-xs outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value={5} style={{ color: "#000", background: "#fff" }}>5条/页</option>
                  <option value={10} style={{ color: "#000", background: "#fff" }}>10条/页</option>
                  <option value={20} style={{ color: "#000", background: "#fff" }}>20条/页</option>
                  <option value={50} style={{ color: "#000", background: "#fff" }}>50条/页</option>
                </select>
              </div>
            </div>
          </div>

          <div className="w-72 flex-shrink-0 rounded-xl p-4 flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
              <Bell size={13} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">告警触发历史</span>
            </div>
            <div className="text-xs mb-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>{selectedRule ? `「${selectedRule.name}」近7天` : "全局近 7 天趋势"}</div>

            <div className={selectedRule ? "" : "hidden"} style={{ flex: 1, minHeight: 250, height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={ruleHistoryData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94A3B8" }} />
                  <ReferenceLine y={selectedRule?.threshold} stroke="#FFAA00" strokeDasharray="4 2" label={{ value: `阈值 ${selectedRule?.threshold}`, fill: "#FFAA00", fontSize: 9 }} />
                  <Line type="monotonic" dataKey="value" name="触发次数" stroke={selectedRule ? levelStyle[selectedRule.level].color : "#165DFF"} strokeWidth={2} dot={{ r: 3, fill: selectedRule ? levelStyle[selectedRule.level].color : "#165DFF" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className={selectedRule ? "hidden" : ""} style={{ flex: 1, minHeight: 250, height: 250 }}>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={historyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "#94A3B8" }} />
                  <Legend wrapperStyle={{ fontSize: 9, color: "#64748B" }} />
                  <Line type="monotonic" dataKey="critical" name="严重" stroke="#FF4D4F" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotonic" dataKey="warning" name="警告" stroke="#FFAA00" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotonic" dataKey="info" name="提示" stroke="#165DFF" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="mt-3 flex-shrink-0 space-y-1.5" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {([["严重告警", rules.filter((r) => r.level === "critical").length, "#FF4D4F"], ["警告告警", rules.filter((r) => r.level === "warning").length, "#FFAA00"], ["提示告警", rules.filter((r) => r.level === "info").length, "#165DFF"]] as const).map(([label, value, color]) => (
                <div key={label} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{label}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 rounded-full" style={{ width: value * 10, background: color, opacity: 0.7 }} />
                    <span className="text-xs font-medium" style={{ color: color }}>{value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.6)", visibility: "visible", pointerEvents: "auto" }} onClick={() => setShowModal(false)}>
          <div className="rounded-xl p-6 w-full max-w-md relative" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center transition-colors" style={{ color: "var(--muted-foreground)" }} onMouseEnter={(e) => { e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; }}><X size={14} /></button>
            <div className="flex items-center gap-2 mb-5">
              <Bell size={16} style={{ color: "#165DFF" }} />
              <span className="text-sm font-semibold text-white">{editingRule ? "编辑告警规则" : "新增告警规则"}</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>规则名称</label>
                <input value={formData.name} onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))} placeholder="输入规则名称..." className="w-full px-3 py-2 rounded-md text-xs text-white outline-none transition-colors" style={{ background: "var(--input)", border: "1px solid var(--border)" }} />
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>监控指标</label>
                <div className="relative">
                  <select value={formData.metric} onChange={(e) => setFormData((prev) => ({ ...prev, metric: e.target.value }))} className="w-full px-3 py-2 rounded-md text-xs text-white outline-none appearance-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
                    {metricOptions.map((m) => <option key={m.value} value={m.value} style={{ background: "#1E293B" }}>{m.label}</option>)}
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>触发条件</label>
                <div className="flex gap-2 items-center">
                  <div className="relative w-20">
                    <select value={formData.condition} onChange={(e) => setFormData((prev) => ({ ...prev, condition: e.target.value }))} className="w-full px-2 py-2 rounded-md text-xs text-white outline-none appearance-none text-center" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
                      {conditionOptions.map((c) => <option key={c} value={c} style={{ background: "#1E293B" }}>{c}</option>)}
                    </select>
                  </div>
                  <input type="number" value={formData.threshold} onChange={(e) => setFormData((prev) => ({ ...prev, threshold: Number(e.target.value) }))} className="flex-1 px-3 py-2 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{metricOptions.find((m) => m.value === formData.metric)?.label.match(/\((.+)\)/)?.[1] || ""}</span>
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>告警级别</label>
                <div className="flex gap-2">
                  {levelOptions.map((l) => {
                    const ls = levelStyle[l.value];
                    const active = formData.level === l.value;
                    return (
                      <button key={l.value} onClick={() => setFormData((prev) => ({ ...prev, level: l.value }))} className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all" style={{ background: active ? ls.bg : "var(--muted)", color: active ? ls.color : "var(--muted-foreground)", border: active ? `1px solid ${ls.border}` : "1px solid var(--border)" }}>{l.label}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>通知渠道 <span style={{ color: "#165DFF" }}>（可多选）</span></label>
                <div className="flex flex-wrap gap-2">
                  {channelOptions.map((ch) => {
                    const active = formData.channels.includes(ch);
                    return (
                      <button key={ch} onClick={() => toggleChannel(ch)} className="px-3 py-1 rounded-full text-xs transition-all" style={{ background: active ? "rgba(22,93,255,0.2)" : "var(--muted)", color: active ? "#60A5FA" : "var(--muted-foreground)", border: active ? "1px solid rgba(22,93,255,0.4)" : "1px solid var(--border)" }}>{ch}</button>
                    );
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
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setViewingRule(null)}>
          <div className="w-[500px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingRule(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Bell size={15} style={{ color: "#165DFF" }} />规则详情
            </div>
            <div className="space-y-4">
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>规则名称</div>
                <div className="text-sm text-white">{viewingRule.name}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>监控指标</div>
                  <div className="text-xs text-white">{metricOptions.find((m) => m.value === viewingRule.metric)?.label || viewingRule.metric}</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>触发条件</div>
                  <span className="text-xs px-2 py-0.5 rounded font-mono" style={{ background: levelStyle[viewingRule.level].bg, color: levelStyle[viewingRule.level].color, border: `1px solid ${levelStyle[viewingRule.level].border}` }}>{viewingRule.condition} {viewingRule.threshold} {viewingRule.unit}</span>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>告警级别</div>
                  <span className="text-xs px-2 py-0.5 rounded" style={{ background: levelStyle[viewingRule.level].bg, color: levelStyle[viewingRule.level].color }}>{levelLabel[viewingRule.level]}</span>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>状态</div>
                  <div className="flex items-center gap-1">
                    {statusIcon[viewingRule.status]}
                    <span className="text-xs">{statusLabel[viewingRule.status]}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>触发次数</div>
                  <div className="text-xs text-white">{viewingRule.triggerCount} 次</div>
                </div>
                <div>
                  <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>最后触发</div>
                  <div className="text-xs text-white">{viewingRule.lastTrigger}</div>
                </div>
              </div>
              <div>
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>通知渠道</div>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(viewingRule.channels) ? viewingRule.channels : []).map((ch) => <span key={ch} className="text-xs px-2 py-1 rounded-full" style={{ background: "rgba(22,93,255,0.12)", color: "#60A5FA", border: "1px solid rgba(22,93,255,0.2)" }}>{ch}</span>)}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setViewingRule(null)}>关闭</TechButton>
              <TechButton variant="primary" onClick={() => { setViewingRule(null); handleEdit(viewingRule); }}>编辑</TechButton>
            </div>
          </div>
        </div>
      )}

      {deletingRule && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeletingRule(null)}>
          <div className="w-[400px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDeletingRule(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Trash size={15} style={{ color: "#FF4D4F" }} />确认删除
            </div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              确定要删除规则 <span className="text-white font-medium">{deletingRule.name}</span> 吗？此操作不可撤销。
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setDeletingRule(null)}>取消</TechButton>
              <TechButton variant="danger" onClick={() => handleDelete(deletingRule.id)}>确认删除</TechButton>
            </div>
          </div>
        </div>
      )}

      {checkedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl" style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(22,93,255,0.35)", boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(22,93,255,0.08)", backdropFilter: "blur(12px)", transition: "opacity 0.2s, transform 0.2s", opacity: 1, transform: "translateX(-50%) translateY(0)", pointerEvents: "auto" }}>
          <div className="flex items-center gap-2 pr-3" style={{ borderRight: "1px solid rgba(148,163,184,0.15)" }}>
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#165DFF", color: "#fff" }}>{checkedIds.size}</div>
            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>条已选</span>
          </div>
          <button onClick={handleBulkEnable} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(0,214,143,0.12)", color: "#00D68F", border: "1px solid rgba(0,214,143,0.25)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,214,143,0.22)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(0,214,143,0.12)"; }}><Play size={11} />批量启用</button>
          <button onClick={handleBulkDisable} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.25)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(100,116,139,0.25)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(100,116,139,0.15)"; }}><StopCircle size={11} />批量停用</button>
          <button onClick={handleBulkDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all" style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F", border: "1px solid rgba(255,77,79,0.35)" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,77,79,0.28)"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,77,79,0.15)"; }}><Trash size={11} />批量删除</button>
          <button onClick={() => setCheckedIds(new Set())} className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors" style={{ color: "var(--muted-foreground)", background: "transparent" }} onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(148,163,184,0.1)"; e.currentTarget.style.color = "#fff"; }} onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}><X size={13} /></button>
        </div>
      )}
    </MainLayout>
  );
}
