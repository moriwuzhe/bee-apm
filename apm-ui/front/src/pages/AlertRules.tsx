import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import {
  PlusIcon,
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  PauseCircleIcon,
  EditIcon,
  TrashIcon,
  XIcon,
  ChevronDownIcon,
  CheckSquareIcon,
  SquareIcon,
  MinusSquareIcon,
  PlayIcon,
  StopCircleIcon,
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
import { toast } from "sonner";

// ─── 类型定义 ───────────────────────────────────────
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

// ─── Mock 数据 ────────────────────────────────────────
const initRules: AlertRule[] = [
  { id: 1, name: `CPU 使用率过高`,    metric: "cpu_usage",      condition: ">",  threshold: 90,  unit: "%",   level: "critical", status: "enabled",  channels: ["钉钉", "邮件"],        triggerCount: 12, lastTrigger: `5分钟前`  },
  { id: 2, name: `内存使用率告警`,    metric: "mem_usage",      condition: ">",  threshold: 85,  unit: "%",   level: "warning",  status: "enabled",  channels: ["邮件"],               triggerCount: 4,  lastTrigger: `2小时前`  },
  { id: 3, name: `接口响应时间超标`,  metric: "response_time",  condition: ">",  threshold: 500, unit: "ms",  level: "warning",  status: "enabled",  channels: ["钉钉", "Slack"],      triggerCount: 28, lastTrigger: `3分钟前`  },
  { id: 4, name: `磁盘空间不足`,      metric: "disk_usage",     condition: ">",  threshold: 80,  unit: "%",   level: "critical", status: "muted",    channels: ["邮件", "短信"],       triggerCount: 2,  lastTrigger: `1天前`    },
  { id: 5, name: `错误请求率超限`,    metric: "error_rate",     condition: ">",  threshold: 5,   unit: "%",   level: "critical", status: "enabled",  channels: ["钉钉", "邮件", "短信"],triggerCount: 7,  lastTrigger: `18分钟前` },
  { id: 6, name: `JVM 堆内存告警`,   metric: "jvm_heap",       condition: ">",  threshold: 75,  unit: "%",   level: "warning",  status: "enabled",  channels: ["邮件"],               triggerCount: 3,  lastTrigger: `45分钟前` },
  { id: 7, name: `GC 停顿时间`,      metric: "gc_pause",       condition: ">",  threshold: 200, unit: "ms",  level: "info",     status: "disabled", channels: ["钉钉"],               triggerCount: 0,  lastTrigger: `—`        },
  { id: 8, name: `TCP 连接数过高`,    metric: "tcp_conn",       condition: ">",  threshold: 1000,unit: "个",  level: "warning",  status: "enabled",  channels: ["钉钉", "邮件"],       triggerCount: 1,  lastTrigger: `3天前`    },
];

// 告警触发历史折线数据（近7天）
const historyData = [
  { time: "06-10", critical: 3,  warning: 5,  info: 1 },
  { time: "06-11", critical: 6,  warning: 8,  info: 2 },
  { time: "06-12", critical: 2,  warning: 3,  info: 0 },
  { time: "06-13", critical: 9,  warning: 12, info: 3 },
  { time: "06-14", critical: 4,  warning: 7,  info: 1 },
  { time: "06-15", critical: 11, warning: 9,  info: 2 },
  { time: "06-16", critical: 7,  warning: 14, info: 4 },
];

// 指标选项
const metricOptions = [
  { value: "cpu_usage",     label: `CPU 使用率 (%)` },
  { value: "mem_usage",     label: `内存使用率 (%)` },
  { value: "response_time", label: `接口响应时间 (ms)` },
  { value: "disk_usage",    label: `磁盘使用率 (%)` },
  { value: "error_rate",    label: `错误请求率 (%)` },
  { value: "jvm_heap",      label: `JVM 堆内存 (%)` },
  { value: "gc_pause",      label: `GC 停顿时间 (ms)` },
  { value: "tcp_conn",      label: `TCP 连接数 (个)` },
  { value: "qps",           label: `QPS (次/秒)` },
  { value: "thread_count",  label: `线程数 (个)` },
];

const conditionOptions = [">", ">=", "<", "<=", "="];
const levelOptions: { value: Level; label: string }[] = [
  { value: "critical", label: "严重" },
  { value: "warning",  label: "警告" },
  { value: "info",     label: "提示" },
];
const channelOptions = ["钉钉", "邮件", "短信", "Slack", "Webhook", "飞书"];

// ─── 样式工具 ──────────────────────────────────────────
const levelStyle: Record<Level, { color: string; bg: string; border: string }> = {
  critical: { color: "#FF4D4F", bg: "rgba(255,77,79,0.12)",   border: "rgba(255,77,79,0.3)"   },
  warning:  { color: "#FFAA00", bg: "rgba(255,170,0,0.12)",   border: "rgba(255,170,0,0.3)"   },
  info:     { color: "#165DFF", bg: "rgba(22,93,255,0.12)",   border: "rgba(22,93,255,0.3)"   },
};

const levelLabel: Record<Level, string> = {
  critical: "严重",
  warning:  "警告",
  info:     "提示",
};

const statusIcon: Record<RuleStatus, React.ReactNode> = {
  enabled:  <CheckCircleIcon size={13} style={{ color: "#00D68F" }} />,
  disabled: <XCircleIcon     size={13} style={{ color: "#64748B" }} />,
  muted:    <PauseCircleIcon size={13} style={{ color: "#FFAA00" }} />,
};

const statusLabel: Record<RuleStatus, string> = {
  enabled:  "启用",
  disabled: "停用",
  muted:    "静默",
};

// ─── 新增规则弹窗 ──────────────────────────────────────
function AddRuleModal({
  visible,
  onClose,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  onSave: (rule: Omit<AlertRule, "id" | "triggerCount" | "lastTrigger">) => void;
}) {
  const [form, setForm] = useState({
    name:      "",
    metric:    metricOptions[0].value,
    condition: ">",
    threshold: 80,
    level:     "critical" as Level,
    status:    "enabled" as RuleStatus,
    channels:  [] as string[],
  });

  const toggleChannel = (ch: string) => {
    setForm(f => ({
      ...f,
      channels: f.channels.includes(ch)
        ? f.channels.filter(c => c !== ch)
        : [...f.channels, ch],
    }));
  };

  const handleSave = () => {
    if (!form.name.trim()) { toast.error(`请输入规则名称`); return; }
    if (form.channels.length === 0) { toast.error(`请选择至少一个通知渠道`); return; }
    const metricObj = metricOptions.find(m => m.value === form.metric);
    const unit = metricObj?.label.match(/\((.+)\)/)?.[1] ?? "";
    onSave({ ...form, unit });
    setForm({ name: "", metric: metricOptions[0].value, condition: ">", threshold: 80, level: "critical", status: "enabled", channels: [] });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.6)", visibility: visible ? "visible" : "hidden", pointerEvents: visible ? "auto" : "none" }}
      onClick={onClose}
    >
      <div
        className="rounded-xl p-6 w-full max-w-md relative"
        style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* 标题 */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <BellIcon size={16} style={{ color: "#165DFF" }} />
            <span className="text-sm font-semibold text-white">新增告警规则</span>
          </div>
          <button onClick={onClose} className="w-6 h-6 rounded flex items-center justify-center transition-colors" style={{ color: "var(--muted-foreground)" }} onMouseEnter={e => e.currentTarget.style.color = "#fff"} onMouseLeave={e => e.currentTarget.style.color = "var(--muted-foreground)"}>
            <XIcon size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {/* 规则名称 */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>规则名称</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder={`输入规则名称...`}
              className="w-full px-3 py-2 rounded-md text-xs text-white outline-none transition-colors"
              style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            />
          </div>

          {/* 指标类型 */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>监控指标</label>
            <div className="relative">
              <select
                value={form.metric}
                onChange={e => setForm(f => ({ ...f, metric: e.target.value }))}
                className="w-full px-3 py-2 rounded-md text-xs text-white outline-none appearance-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              >
                {metricOptions.map(m => (
                  <option key={m.value} value={m.value} style={{ background: "#1E293B" }}>{m.label}</option>
                ))}
              </select>
              <ChevronDownIcon size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
            </div>
          </div>

          {/* 触发条件 */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>触发条件</label>
            <div className="flex gap-2 items-center">
              <div className="relative w-20">
                <select
                  value={form.condition}
                  onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                  className="w-full px-2 py-2 rounded-md text-xs text-white outline-none appearance-none text-center"
                  style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  {conditionOptions.map(c => (
                    <option key={c} value={c} style={{ background: "#1E293B" }}>{c}</option>
                  ))}
                </select>
              </div>
              <input
                type="number"
                value={form.threshold}
                onChange={e => setForm(f => ({ ...f, threshold: Number(e.target.value) }))}
                className="flex-1 px-3 py-2 rounded-md text-xs text-white outline-none"
                style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
              />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {metricOptions.find(m => m.value === form.metric)?.label.match(/\((.+)\)/)?.[1] ?? ""}
              </span>
            </div>
          </div>

          {/* 告警级别 */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>告警级别</label>
            <div className="flex gap-2">
              {levelOptions.map(l => {
                const ls = levelStyle[l.value];
                const active = form.level === l.value;
                return (
                  <button
                    key={l.value}
                    onClick={() => setForm(f => ({ ...f, level: l.value }))}
                    className="flex-1 py-1.5 rounded-md text-xs font-medium transition-all"
                    style={{
                      background: active ? ls.bg : "var(--muted)",
                      color: active ? ls.color : "var(--muted-foreground)",
                      border: active ? `1px solid ${ls.border}` : "1px solid var(--border)",
                    }}
                  >{l.label}</button>
                );
              })}
            </div>
          </div>

          {/* 通知渠道（多选） */}
          <div>
            <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>通知渠道 <span style={{ color: "#165DFF" }}>（可多选）</span></label>
            <div className="flex flex-wrap gap-2">
              {channelOptions.map(ch => {
                const active = form.channels.includes(ch);
                return (
                  <button
                    key={ch}
                    onClick={() => toggleChannel(ch)}
                    className="px-3 py-1 rounded-full text-xs transition-all"
                    style={{
                      background: active ? "rgba(22,93,255,0.2)" : "var(--muted)",
                      color: active ? "#60A5FA" : "var(--muted-foreground)",
                      border: active ? "1px solid rgba(22,93,255,0.4)" : "1px solid var(--border)",
                    }}
                  >{ch}</button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <TechButton variant="ghost" onClick={onClose}>取消</TechButton>
          <div className="flex-1" />
          <TechButton variant="primary" icon={<BellIcon size={12} />} onClick={handleSave}>创建规则</TechButton>
        </div>
      </div>
    </div>
  );
}

// ─── 批量操作浮动栏 ──────────────────────────────────────
function BulkActionBar({
  visible,
  count,
  onEnable,
  onDisable,
  onDelete,
  onClear,
}: {
  visible: boolean;
  count: number;
  onEnable: () => void;
  onDisable: () => void;
  onDelete: () => void;
  onClear: () => void;
}) {
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-5 py-3 rounded-2xl"
      style={{
        background: "rgba(15,23,42,0.95)",
        border: "1px solid rgba(22,93,255,0.35)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(22,93,255,0.08)",
        backdropFilter: "blur(12px)",
        transition: "opacity 0.2s, transform 0.2s",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(-50%) translateY(0)" : "translateX(-50%) translateY(16px)",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {/* 已选数量 */}
      <div className="flex items-center gap-2 pr-3" style={{ borderRight: "1px solid rgba(148,163,184,0.15)" }}>
        <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: "#165DFF", color: "#fff" }}>{count}</div>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>条已选</span>
      </div>

      {/* 批量启用 */}
      <button
        onClick={onEnable}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "rgba(0,214,143,0.12)", color: "#00D68F", border: "1px solid rgba(0,214,143,0.25)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(0,214,143,0.22)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(0,214,143,0.12)"; }}
      >
        <PlayIcon size={11} />
        批量启用
      </button>

      {/* 批量停用 */}
      <button
        onClick={onDisable}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "rgba(100,116,139,0.15)", color: "#94A3B8", border: "1px solid rgba(100,116,139,0.25)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(100,116,139,0.25)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(100,116,139,0.15)"; }}
      >
        <StopCircleIcon size={11} />
        批量停用
      </button>

      {/* 批量删除（红色高亮） */}
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F", border: "1px solid rgba(255,77,79,0.35)" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,77,79,0.28)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,77,79,0.15)"; }}
      >
        <TrashIcon size={11} />
        批量删除
      </button>

      {/* 取消选择 */}
      <button
        onClick={onClear}
        className="w-7 h-7 rounded-lg flex items-center justify-center transition-all"
        style={{ color: "var(--muted-foreground)", background: "transparent" }}
        onMouseEnter={e => { e.currentTarget.style.background = "rgba(148,163,184,0.1)"; e.currentTarget.style.color = "#fff"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
      >
        <XIcon size={13} />
      </button>
    </div>
  );
}

// ─── 主组件 ────────────────────────────────────────────
export default function AlertRules() {
  const [rules, setRules] = useState<AlertRule[]>(initRules);
  const [showModal, setShowModal] = useState(false);
  const [filterLevel, setFilterLevel] = useState<"all" | Level>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | RuleStatus>("all");
  const [selectedRuleId, setSelectedRuleId] = useState<number | null>(null);

  // 批量选择 state
  const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());

  const filteredRules = rules.filter(r =>
    (filterLevel === "all" || r.level === filterLevel) &&
    (filterStatus === "all" || r.status === filterStatus)
  );

  // 全选状态
  const allChecked = filteredRules.length > 0 && filteredRules.every(r => checkedIds.has(r.id));
  const someChecked = filteredRules.some(r => checkedIds.has(r.id)) && !allChecked;

  const toggleAll = () => {
    if (allChecked) {
      setCheckedIds(prev => {
        const next = new Set(prev);
        filteredRules.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setCheckedIds(prev => {
        const next = new Set(prev);
        filteredRules.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const toggleRow = (id: number) => {
    setCheckedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSaveRule = (rule: Omit<AlertRule, "id" | "triggerCount" | "lastTrigger">) => {
    const newRule: AlertRule = {
      ...rule,
      id: Date.now(),
      triggerCount: 0,
      lastTrigger: "—",
    };
    setRules(prev => [newRule, ...prev]);
    toast.success(`告警规则「${rule.name}」创建成功`);
  };

  const handleToggleStatus = (id: number) => {
    setRules(prev => prev.map(r => {
      if (r.id !== id) return r;
      const next: RuleStatus = r.status === "enabled" ? "disabled" : "enabled";
      toast.info(`规则「${r.name}」已${next === "enabled" ? "启用" : "停用"}`);
      return { ...r, status: next };
    }));
  };

  const handleDelete = (id: number) => {
    const rule = rules.find(r => r.id === id);
    setRules(prev => prev.filter(r => r.id !== id));
    toast.success(`规则「${rule?.name}」已删除`);
    if (selectedRuleId === id) setSelectedRuleId(null);
    setCheckedIds(prev => { const next = new Set(prev); next.delete(id); return next; });
  };

  // 批量操作
  const handleBulkEnable = () => {
    const count = checkedIds.size;
    setRules(prev => prev.map(r => checkedIds.has(r.id) ? { ...r, status: "enabled" } : r));
    toast.success(`已批量启用 ${count} 条规则`);
    setCheckedIds(new Set());
  };

  const handleBulkDisable = () => {
    const count = checkedIds.size;
    setRules(prev => prev.map(r => checkedIds.has(r.id) ? { ...r, status: "disabled" } : r));
    toast.info(`已批量停用 ${count} 条规则`);
    setCheckedIds(new Set());
  };

  const handleBulkDelete = () => {
    const count = checkedIds.size;
    setRules(prev => prev.filter(r => !checkedIds.has(r.id)));
    if (selectedRuleId && checkedIds.has(selectedRuleId)) setSelectedRuleId(null);
    toast.success(`已批量删除 ${count} 条规则`);
    setCheckedIds(new Set());
  };

  // 选中规则的历史数据（mock：level 越高，触发次数越多）
  const selectedRule = rules.find(r => r.id === selectedRuleId);

  const ruleHistoryData = historyData.map(d => ({
    ...d,
    value: selectedRule
      ? (selectedRule.level === "critical" ? d.critical * 1.2 : selectedRule.level === "warning" ? d.warning * 0.8 : d.info * 1.5)
      : 0,
    threshold: selectedRule?.threshold ?? 0,
  }));

  // 统计
  const total    = rules.length;
  const enabled  = rules.filter(r => r.status === "enabled").length;
  const critical = rules.filter(r => r.level === "critical" && r.status === "enabled").length;
  const todayTriggers = rules.reduce((acc, r) => acc + (r.status === "enabled" ? r.triggerCount : 0), 0);

  return (
    <MainLayout title="告警规则">
      <div data-cmp="AlertRules" className="space-y-4">
        <PageHeader
          title="告警规则管理"
          subtitle={`${total} 规则 · ${enabled} 启用 · ${critical} 严重活跃 · 今日触发 ${todayTriggers} 次`}
          actions={
            <>
              {/* 级别过滤 */}
              <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {([["all", "全部"], ["critical", "严重"], ["warning", "警告"], ["info", "提示"]] as [string, string][]).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilterLevel(v as "all" | Level)}
                    className="px-3 py-1 rounded text-xs transition-colors"
                    style={{ background: filterLevel === v ? "#165DFF" : "transparent", color: filterLevel === v ? "#fff" : "var(--muted-foreground)" }}
                  >{l}</button>
                ))}
              </div>
              {/* 状态过滤 */}
              <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {([["all", "全部"], ["enabled", "启用"], ["disabled", "停用"], ["muted", "静默"]] as [string,string][]).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setFilterStatus(v as "all" | RuleStatus)}
                    className="px-3 py-1 rounded text-xs transition-colors"
                    style={{ background: filterStatus === v ? "rgba(22,93,255,0.2)" : "transparent", color: filterStatus === v ? "#60A5FA" : "var(--muted-foreground)" }}
                  >{l}</button>
                ))}
              </div>
              <TechButton variant="primary" icon={<PlusIcon size={13} />} onClick={() => setShowModal(true)}>新增规则</TechButton>
            </>
          }
        />

        {/* 统计卡片行 */}
        <div className="flex gap-3">
          {[
            { label: "规则总数",    value: String(total),         color: "#165DFF", bg: "rgba(22,93,255,0.1)"   },
            { label: "启用规则",    value: String(enabled),       color: "#00D68F", bg: "rgba(0,214,143,0.1)"   },
            { label: "严重级别",    value: String(critical),      color: "#FF4D4F", bg: "rgba(255,77,79,0.1)"   },
            { label: "今日触发次数",value: String(todayTriggers), color: "#FFAA00", bg: "rgba(255,170,0,0.1)"   },
          ].map(card => (
            <div
              key={card.label}
              className="flex-1 rounded-xl p-4"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            >
              <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{card.label}</div>
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* 主区域：规则列表 + 历史图 */}
        <div className="flex gap-3" style={{ height: 440 }}>
          {/* 规则列表 */}
          <div className="flex-1 rounded-xl overflow-hidden flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* 表头 */}
            <div
              className="flex items-center px-4 py-2.5 text-xs flex-shrink-0"
              style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            >
              {/* 全选复选框 */}
              <div
                className="w-8 flex-shrink-0 flex items-center justify-center cursor-pointer"
                onClick={toggleAll}
              >
                {allChecked ? (
                  <CheckSquareIcon size={14} style={{ color: "#165DFF" }} />
                ) : someChecked ? (
                  <MinusSquareIcon size={14} style={{ color: "#165DFF" }} />
                ) : (
                  <SquareIcon size={14} style={{ color: "var(--muted-foreground)" }} />
                )}
              </div>
              <span className="w-40 flex-shrink-0">规则名称</span>
              <span className="w-36 flex-shrink-0">指标</span>
              <span className="w-32 flex-shrink-0">阈值条件</span>
              <span className="w-20 flex-shrink-0">级别</span>
              <span className="w-20 flex-shrink-0">状态</span>
              <span className="w-20 flex-shrink-0">触发次数</span>
              <span className="flex-1">通知渠道</span>
              <span className="w-28 flex-shrink-0 text-right">操作</span>
            </div>

            {/* 表体 */}
            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div
                className="flex flex-col items-center justify-center gap-2"
                style={{
                  display: filteredRules.length === 0 ? "flex" : "none",
                  height: "100%",
                  color: "var(--muted-foreground)",
                }}
              >
                <BellIcon size={28} style={{ opacity: 0.3 }} />
                <span className="text-xs">暂无告警规则</span>
              </div>
              {filteredRules.map(rule => {
                const ls = levelStyle[rule.level];
                const isSelected = selectedRuleId === rule.id;
                const isChecked = checkedIds.has(rule.id);
                const metricLabel = metricOptions.find(m => m.value === rule.metric)?.label ?? rule.metric;
                return (
                  <div
                    key={rule.id}
                    className="flex items-center px-4 py-3 cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isChecked
                        ? "rgba(22,93,255,0.06)"
                        : isSelected
                        ? "rgba(22,93,255,0.08)"
                        : "transparent",
                      borderLeft: isSelected ? "2px solid #165DFF" : isChecked ? "2px solid rgba(22,93,255,0.4)" : "2px solid transparent",
                    }}
                    onClick={() => setSelectedRuleId(isSelected ? null : rule.id)}
                    onMouseEnter={e => { if (!isSelected && !isChecked) e.currentTarget.style.background = "rgba(22,93,255,0.04)"; }}
                    onMouseLeave={e => { if (!isSelected && !isChecked) e.currentTarget.style.background = "transparent"; }}
                  >
                    {/* 单行复选框 */}
                    <div
                      className="w-8 flex-shrink-0 flex items-center justify-center"
                      onClick={e => { e.stopPropagation(); toggleRow(rule.id); }}
                    >
                      {isChecked ? (
                        <CheckSquareIcon size={14} style={{ color: "#165DFF" }} />
                      ) : (
                        <SquareIcon size={14} style={{ color: "var(--muted-foreground)", opacity: 0.5 }} />
                      )}
                    </div>

                    {/* 规则名 */}
                    <div className="w-40 flex-shrink-0 pr-2">
                      <div className="text-xs text-white font-medium truncate">{rule.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>最近: {rule.lastTrigger}</div>
                    </div>
                    {/* 指标 */}
                    <div className="w-36 flex-shrink-0 pr-2">
                      <span className="text-xs truncate block" style={{ color: "#60A5FA" }}>{metricLabel}</span>
                    </div>
                    {/* 阈值条件 */}
                    <div className="w-32 flex-shrink-0 pr-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded font-mono"
                        style={{ background: ls.bg, color: ls.color, border: `1px solid ${ls.border}` }}
                      >{rule.condition} {rule.threshold} {rule.unit}</span>
                    </div>
                    {/* 级别 */}
                    <div className="w-20 flex-shrink-0 pr-2">
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: ls.bg, color: ls.color }}
                      >{levelLabel[rule.level]}</span>
                    </div>
                    {/* 状态 */}
                    <div className="w-20 flex-shrink-0 pr-2 flex items-center gap-1">
                      {statusIcon[rule.status]}
                      <span className="text-xs" style={{ color: rule.status === "enabled" ? "#00D68F" : rule.status === "muted" ? "#FFAA00" : "var(--muted-foreground)" }}>
                        {statusLabel[rule.status]}
                      </span>
                    </div>
                    {/* 触发次数 */}
                    <div className="w-20 flex-shrink-0 pr-2">
                      <span className="text-xs font-medium" style={{ color: rule.triggerCount > 10 ? "#FF4D4F" : rule.triggerCount > 5 ? "#FFAA00" : "var(--muted-foreground)" }}>
                        {rule.triggerCount} 次
                      </span>
                    </div>
                    {/* 通知渠道 */}
                    <div className="flex-1 pr-2 flex flex-wrap gap-1">
                      {rule.channels.map(ch => (
                        <span key={ch} className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.12)", color: "#60A5FA", border: "1px solid rgba(22,93,255,0.2)" }}>{ch}</span>
                      ))}
                    </div>
                    {/* 操作 */}
                    <div className="w-28 flex-shrink-0 flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => handleToggleStatus(rule.id)}
                        className="px-2 py-1 rounded text-xs transition-colors"
                        style={{ background: rule.status === "enabled" ? "rgba(255,77,79,0.1)" : "rgba(0,214,143,0.1)", color: rule.status === "enabled" ? "#FF4D4F" : "#00D68F", border: "1px solid " + (rule.status === "enabled" ? "rgba(255,77,79,0.25)" : "rgba(0,214,143,0.25)") }}
                      >{rule.status === "enabled" ? "停用" : "启用"}</button>
                      <button
                        onClick={() => handleDelete(rule.id)}
                        className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                        style={{ color: "var(--muted-foreground)", background: "transparent" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "#FF4D4F"; e.currentTarget.style.background = "rgba(255,77,79,0.1)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                      >
                        <TrashIcon size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 右侧历史折线图 */}
          <div className="w-72 flex-shrink-0 rounded-xl p-4 flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-1 flex-shrink-0">
              <BellIcon size={13} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">告警触发历史</span>
            </div>
            <div className="text-xs mb-4 flex-shrink-0" style={{ color: "var(--muted-foreground)" }}>
              {selectedRule ? `「${selectedRule.name}」近7天` : `全局近 7 天趋势`}
            </div>

            {/* 选中规则时显示单条折线 + 阈值参考线 */}
            <div className={selectedRule ? "" : "hidden"} style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ruleHistoryData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94A3B8" }}
                  />
                  <ReferenceLine y={selectedRule?.threshold} stroke="#FFAA00" strokeDasharray="4 2" label={{ value: `阈值 ${selectedRule?.threshold}`, fill: "#FFAA00", fontSize: 9 }} />
                  <Line
                    type="monotone"
                    dataKey="value"
                    name="触发次数"
                    stroke={selectedRule ? levelStyle[selectedRule.level].color : "#165DFF"}
                    strokeWidth={2}
                    dot={{ r: 3, fill: selectedRule ? levelStyle[selectedRule.level].color : "#165DFF" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 未选中时显示全局三条折线 */}
            <div className={selectedRule ? "hidden" : ""} style={{ flex: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.08)" />
                  <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748B" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#1E293B", border: "1px solid rgba(148,163,184,0.15)", borderRadius: 8, fontSize: 11 }}
                    labelStyle={{ color: "#94A3B8" }}
                  />
                  <Legend wrapperStyle={{ fontSize: 9, color: "#64748B" }} />
                  <Line type="monotone" dataKey="critical" name="严重" stroke="#FF4D4F" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="warning"  name="警告" stroke="#FFAA00" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="info"     name="提示" stroke="#165DFF" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 快速统计 */}
            <div className="mt-3 flex-shrink-0 space-y-1.5" style={{ borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              {([["严重告警", rules.filter(r => r.level === "critical").length, "#FF4D4F"], ["警告告警", rules.filter(r => r.level === "warning").length, "#FFAA00"], ["提示告警", rules.filter(r => r.level === "info").length, "#165DFF"]] as [string,number,string][]).map(([l, v, c]) => (
                <div key={l} className="flex justify-between items-center">
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</span>
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 rounded-full" style={{ width: v * 10, background: c, opacity: 0.7 }} />
                    <span className="text-xs font-medium" style={{ color: c }}>{v}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 新增规则弹窗 */}
      <AddRuleModal visible={showModal} onClose={() => setShowModal(false)} onSave={handleSaveRule} />

      {/* 批量操作浮动栏 */}
      <BulkActionBar
        visible={checkedIds.size > 0}
        count={checkedIds.size}
        onEnable={handleBulkEnable}
        onDisable={handleBulkDisable}
        onDelete={handleBulkDelete}
        onClear={() => setCheckedIds(new Set())}
      />
    </MainLayout>
  );
}
