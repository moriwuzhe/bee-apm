import { useState, useRef } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import {
  GitBranchIcon,
  AlertTriangleIcon,
  ZoomInIcon,
  ZoomOutIcon,
  RotateCcwIcon,
  BellIcon,
  PlusIcon,
  MinusIcon,
  ChevronRightIcon,
  LockIcon,
  UnlockIcon,
  FilterIcon,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

// ─── 类型定义 ────────────────────────────────────────
type ChangeType = "add" | "modify" | "delete";
type RiskLevel = "high" | "medium" | "low";

interface HeatCell {
  service: string;
  version: string;
  count: number;
  scope: number;
  risk: RiskLevel;
  changeType: ChangeType;
}

interface GraphNode {
  id: string;
  label: string;
  type: "service" | "db" | "mq" | "gateway";
  x: number;
  y: number;
  risk: RiskLevel | "none";
  alerts: string[];
  affectedBy: string[];   // 哪些版本 id 影响了它
}

interface GraphEdge {
  from: string;
  to: string;
  label: string;
}

interface VersionItem {
  id: string;
  app: string;
  version: string;
  time: string;
  changes: ChangeType[];
  affectsNodes: string[];
}

interface MockAlert {
  id: string;
  node: string;
  level: RiskLevel;
  message: string;
  time: string;
}

// ─── Mock 数据 ────────────────────────────────────────
const heatData: HeatCell[] = [
  { service: "order-service",   version: "v3.2.1", count: 8,  scope: 4, risk: "high",   changeType: "modify" },
  { service: "order-service",   version: "v3.1.0", count: 3,  scope: 2, risk: "low",    changeType: "add"    },
  { service: "payment-gateway", version: "v2.0.5", count: 5,  scope: 3, risk: "medium", changeType: "modify" },
  { service: "payment-gateway", version: "v2.0.4", count: 2,  scope: 1, risk: "low",    changeType: "add"    },
  { service: "user-service",    version: "v1.8.2", count: 4,  scope: 3, risk: "medium", changeType: "modify" },
  { service: "user-service",    version: "v1.7.0", count: 1,  scope: 1, risk: "low",    changeType: "delete" },
  { service: "inventory",       version: "v2.3.0", count: 6,  scope: 2, risk: "medium", changeType: "add"    },
  { service: "inventory",       version: "v2.2.9", count: 2,  scope: 1, risk: "low",    changeType: "modify" },
  { service: "search-service",  version: "v1.5.0", count: 9,  scope: 5, risk: "high",   changeType: "modify" },
  { service: "search-service",  version: "v1.4.8", count: 3,  scope: 2, risk: "low",    changeType: "add"    },
  { service: "notify-service",  version: "v1.2.1", count: 1,  scope: 1, risk: "low",    changeType: "add"    },
  { service: "notify-service",  version: "v1.1.5", count: 2,  scope: 1, risk: "low",    changeType: "modify" },
];

const versionList: VersionItem[] = [
  { id: "v-order-321",   app: "order-service",   version: "v3.2.1", time: "01-15 14:23", changes: ["modify"],          affectsNodes: ["order", "db-order", "mq", "pay"] },
  { id: "v-pay-205",     app: "payment-gateway", version: "v2.0.5", time: "01-15 10:15", changes: ["modify", "add"],   affectsNodes: ["pay", "db-order"] },
  { id: "v-user-182",    app: "user-service",    version: "v1.8.2", time: "01-14 16:40", changes: ["modify"],          affectsNodes: ["user", "db-user", "redis"] },
  { id: "v-inv-230",     app: "inventory",       version: "v2.3.0", time: "01-14 09:00", changes: ["add"],             affectsNodes: ["inventory", "es", "redis"] },
  { id: "v-search-150",  app: "search-service",  version: "v1.5.0", time: "01-13 11:30", changes: ["modify", "add"],   affectsNodes: ["es", "notify"] },
];

const graphNodes: GraphNode[] = [
  { id: "gateway",   label: "API网关",  type: "gateway", x: 320, y: 50,  risk: "none",   alerts: [],                                           affectedBy: [] },
  { id: "order",     label: "订单服务", type: "service", x: 100, y: 160, risk: "high",   alerts: ["CPU使用率 > 90%", "接口超时 > 500ms"],       affectedBy: ["v-order-321"] },
  { id: "pay",       label: "支付服务", type: "service", x: 270, y: 160, risk: "medium", alerts: ["错误率 > 5%"],                               affectedBy: ["v-order-321", "v-pay-205"] },
  { id: "user",      label: "用户服务", type: "service", x: 440, y: 160, risk: "medium", alerts: ["响应延迟告警"],                               affectedBy: ["v-user-182"] },
  { id: "inventory", label: "库存服务", type: "service", x: 600, y: 160, risk: "none",   alerts: [],                                           affectedBy: ["v-inv-230"] },
  { id: "mq",        label: "消息队列", type: "mq",      x: 100, y: 300, risk: "none",   alerts: [],                                           affectedBy: ["v-order-321"] },
  { id: "db-order",  label: "订单DB",   type: "db",      x: 270, y: 300, risk: "high",   alerts: ["慢查询告警 > 45ms", "连接数超限"],           affectedBy: ["v-order-321", "v-pay-205"] },
  { id: "db-user",   label: "用户DB",   type: "db",      x: 440, y: 300, risk: "none",   alerts: [],                                           affectedBy: ["v-user-182"] },
  { id: "redis",     label: "Redis",    type: "db",      x: 600, y: 300, risk: "none",   alerts: [],                                           affectedBy: ["v-user-182", "v-inv-230"] },
  { id: "es",        label: "ES",       type: "db",      x: 730, y: 220, risk: "medium", alerts: ["索引延迟 > 200ms"],                         affectedBy: ["v-inv-230", "v-search-150"] },
  { id: "notify",    label: "通知服务", type: "service", x: 730, y: 330, risk: "none",   alerts: [],                                           affectedBy: ["v-search-150"] },
];

const graphEdges: GraphEdge[] = [
  { from: "gateway",   to: "order",     label: "REST" },
  { from: "gateway",   to: "pay",       label: "REST" },
  { from: "gateway",   to: "user",      label: "REST" },
  { from: "gateway",   to: "inventory", label: "REST" },
  { from: "order",     to: "mq",        label: "MQ"   },
  { from: "order",     to: "db-order",  label: "SQL"  },
  { from: "pay",       to: "db-order",  label: "SQL"  },
  { from: "user",      to: "db-user",   label: "SQL"  },
  { from: "user",      to: "redis",     label: "Cache"},
  { from: "inventory", to: "redis",     label: "Cache"},
  { from: "inventory", to: "es",        label: "Index"},
  { from: "mq",        to: "notify",    label: "Event"},
  { from: "notify",    to: "es",        label: "Log"  },
];

const mockAlerts: MockAlert[] = [
  { id: "a1", node: "order",    level: "high",   message: "CPU使用率 > 90%",      time: "5分钟前"  },
  { id: "a2", node: "order",    level: "high",   message: "接口超时 > 500ms",     time: "3分钟前"  },
  { id: "a3", node: "pay",      level: "medium", message: "错误率 > 5%",           time: "18分钟前" },
  { id: "a4", node: "user",     level: "medium", message: "响应延迟告警",          time: "45分钟前" },
  { id: "a5", node: "db-order", level: "high",   message: "慢查询告警 > 45ms",    time: "2分钟前"  },
  { id: "a6", node: "db-order", level: "high",   message: "连接数超限",            time: "1分钟前"  },
  { id: "a7", node: "es",       level: "medium", message: "索引延迟 > 200ms",     time: "20分钟前" },
];

// ─── 样式辅助 ─────────────────────────────────────────
const riskColor: Record<RiskLevel | "none", { bg: string; border: string; text: string; glow: string }> = {
  high:   { bg: "rgba(255,77,79,0.2)",    border: "#FF4D4F", text: "#FF4D4F", glow: "rgba(255,77,79,0.5)"  },
  medium: { bg: "rgba(255,170,0,0.15)",   border: "#FFAA00", text: "#FFAA00", glow: "rgba(255,170,0,0.4)"  },
  low:    { bg: "rgba(0,214,143,0.12)",   border: "#00D68F", text: "#00D68F", glow: "rgba(0,214,143,0.3)"  },
  none:   { bg: "rgba(22,93,255,0.15)",   border: "#165DFF", text: "#60A5FA", glow: "rgba(22,93,255,0.25)" },
};

const changeTypeColor: Record<ChangeType, { text: string; bg: string }> = {
  add:    { text: "#00D68F", bg: "rgba(0,214,143,0.15)"  },
  modify: { text: "#FFAA00", bg: "rgba(255,170,0,0.15)"  },
  delete: { text: "#FF4D4F", bg: "rgba(255,77,79,0.15)"  },
};

const nodeTypeColor: Record<string, { fill: string; stroke: string; label: string }> = {
  gateway: { fill: "rgba(22,93,255,0.25)",  stroke: "#165DFF", label: "#60A5FA" },
  service: { fill: "rgba(168,85,247,0.2)",  stroke: "#A855F7", label: "#C084FC" },
  db:      { fill: "rgba(0,214,143,0.15)",  stroke: "#00D68F", label: "#34D399" },
  mq:      { fill: "rgba(255,170,0,0.15)",  stroke: "#FFAA00", label: "#FFAA00" },
};

// ─── 热力图单元格 tooltip ─────────────────────────────
function HeatTooltip({ cell, x, y }: { cell: HeatCell; x: number; y: number }) {
  const riskLabel: Record<RiskLevel, string> = { high: "高风险", medium: "中风险", low: "低风险" };
  const changeLabel: Record<ChangeType, string> = { add: "新增", modify: "修改", delete: "删除" };
  return (
    <div
      className="absolute z-30 rounded-lg p-3 pointer-events-none"
      style={{
        left: x + 10,
        top: y - 10,
        background: "rgba(15,23,42,0.97)",
        border: "1px solid rgba(148,163,184,0.2)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 160,
      }}
    >
      <div className="text-xs font-semibold text-white mb-2">{cell.service}</div>
      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>版本：<span className="text-white">{cell.version}</span></div>
      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>变更数：<span style={{ color: "#60A5FA" }}>{cell.count} 处</span></div>
      <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>影响范围：<span style={{ color: "#A855F7" }}>{cell.scope} 个服务</span></div>
      <div className="flex items-center gap-1.5 mt-2">
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: riskColor[cell.risk].bg, color: riskColor[cell.risk].text, border: `1px solid ${riskColor[cell.risk].border}` }}>
          {riskLabel[cell.risk]}
        </span>
        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: changeTypeColor[cell.changeType].bg, color: changeTypeColor[cell.changeType].text }}>
          {changeLabel[cell.changeType]}
        </span>
      </div>
    </div>
  );
}

// ─── 风险节点 tooltip ─────────────────────────────────
function NodeAlertTooltip({ node, alerts, x, y }: { node: GraphNode; alerts: MockAlert[]; x: number; y: number }) {
  if (alerts.length === 0) return null;
  return (
    <div
      className="absolute z-40 rounded-lg p-3 pointer-events-none"
      style={{
        left: x + 14,
        top: y - 14,
        background: "rgba(15,23,42,0.97)",
        border: "1px solid rgba(255,77,79,0.35)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        minWidth: 200,
      }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <AlertTriangleIcon size={12} style={{ color: "#FF4D4F" }} />
        <span className="text-xs font-semibold text-white">{node.label} 关联告警</span>
      </div>
      {alerts.map(a => (
        <div key={a.id} className="flex items-start gap-1.5 mb-1.5">
          <div
            className="mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: a.level === "high" ? "#FF4D4F" : "#FFAA00" }}
          />
          <div>
            <div className="text-xs text-white">{a.message}</div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── 主组件 ───────────────────────────────────────────
export default function ReleaseAnalysis() {
  const { showToast } = useToast();
  const [changeFilter, setChangeFilter] = useState<"all" | ChangeType>("all");
  const [hoveredCell, setHoveredCell] = useState<{ cell: HeatCell; x: number; y: number } | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [graphZoom, setGraphZoom] = useState(1);
  const [lockedNodes, setLockedNodes] = useState<Set<string>>(new Set());
  const [hoveredNode, setHoveredNode] = useState<{ node: GraphNode; x: number; y: number } | null>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const filteredHeat = heatData.filter(c => changeFilter === "all" || c.changeType === changeFilter);

  // 热力图服务列表（去重）
  const services = Array.from(new Set(filteredHeat.map(c => c.service)));

  // 影响链路图：高亮逻辑
  const selectedVer = versionList.find(v => v.id === selectedVersion);
  const affectedNodes = selectedVer ? new Set(selectedVer.affectsNodes) : null;

  const getNodeOpacity = (nodeId: string) => {
    if (!affectedNodes) return 1;
    return affectedNodes.has(nodeId) ? 1 : 0.2;
  };

  const getEdgeOpacity = (from: string, to: string) => {
    if (!affectedNodes) return 1;
    return affectedNodes.has(from) && affectedNodes.has(to) ? 1 : 0.08;
  };

  const toggleLock = (nodeId: string) => {
    setLockedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) next.delete(nodeId);
      else next.add(nodeId);
      return next;
    });
  };

  // 跳转到告警列表（带过滤参数，模拟）
  const navigateToAlerts = (nodeId: string) => {
    showToast(`已跳转到告警列表，筛选节点: ${nodeId}`, "info");
    console.log(`navigate to /alert-rules?node=${nodeId}`);
  };

  // 点击热力格：跳转变更详情
  const handleCellClick = (cell: HeatCell) => {
    showToast(`查看 ${cell.service} ${cell.version} 变更详情`, "info");
    console.log(`navigate to change detail: ${cell.service}@${cell.version}`);
  };

  // 热力图颜色（根据 count 深浅 + risk）
  const getHeatColor = (cell: HeatCell): string => {
    const alpha = 0.15 + Math.min(cell.count / 10, 1) * 0.65;
    if (cell.risk === "high")   return `rgba(255,77,79,${alpha})`;
    if (cell.risk === "medium") return `rgba(255,170,0,${alpha})`;
    return `rgba(0,214,143,${alpha})`;
  };

  const riskLabel: Record<RiskLevel, string> = { high: "高", medium: "中", low: "低" };
  const changeLabel: Record<ChangeType, string> = { add: "新增", modify: "修改", delete: "删除" };

  return (
    <MainLayout title="发布影响分析">
      <div data-cmp="ReleaseAnalysis" className="space-y-4">
        <PageHeader
          title="发布影响分析"
          subtitle={`${versionList.length} 个版本 · ${mockAlerts.length} 条活跃告警 · ${heatData.filter(c => c.risk === "high").length} 处高风险变更`}
          actions={
            <>
              <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {([["all", "全部"], ["add", "新增"], ["modify", "修改"], ["delete", "删除"]] as [string, string][]).map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => setChangeFilter(v as "all" | ChangeType)}
                    className="px-3 py-1 rounded text-xs transition-colors"
                    style={{ background: changeFilter === v ? "#165DFF" : "transparent", color: changeFilter === v ? "#fff" : "var(--muted-foreground)" }}
                  >{l}</button>
                ))}
              </div>
              <TechButton variant="secondary" icon={<FilterIcon size={13} />} onClick={() => { showToast("正在生成发布影响分析报告...", "info"); setTimeout(() => showToast("报告已生成并下载", "success"), 1500); }}>导出报告</TechButton>
            </>
          }
        />

        {/* ── 顶部统计卡 ── */}
        <div className="flex gap-3">
          {[
            { label: "版本发布数",   value: versionList.length,                                    color: "#165DFF" },
            { label: "高风险变更",   value: heatData.filter(c => c.risk === "high").length,         color: "#FF4D4F" },
            { label: "受影响服务",   value: new Set(graphEdges.flatMap(e => [e.from, e.to])).size,  color: "#FFAA00" },
            { label: "活跃告警数",   value: mockAlerts.length,                                      color: "#A855F7" },
          ].map(card => (
            <div key={card.label} className="flex-1 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{card.label}</div>
              <div className="text-2xl font-bold" style={{ color: card.color }}>{card.value}</div>
            </div>
          ))}
        </div>

        {/* ── 热力图区域 ── */}
        <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <GitBranchIcon size={14} style={{ color: "#165DFF" }} />
              <span className="text-sm font-medium text-white">变更热力图</span>
              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.12)", color: "#60A5FA" }}>悬停查看详情 · 点击进入变更</span>
            </div>
            {/* 图例 */}
            <div className="flex items-center gap-4">
              {([["高风险", "#FF4D4F"], ["中风险", "#FFAA00"], ["低风险", "#00D68F"]] as [string, string][]).map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: c, opacity: 0.7 }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 热力格网格（相对定位容器，tooltip 绝对定位） */}
          <div className="relative overflow-x-auto">
            <div className="flex flex-wrap gap-2 pb-2">
              {services.map(svc => {
                const cells = filteredHeat.filter(c => c.service === svc);
                return (
                  <div key={svc} className="flex-shrink-0">
                    <div className="text-xs mb-1.5 truncate max-w-40" style={{ color: "var(--muted-foreground)" }}>{svc}</div>
                    <div className="flex gap-1.5">
                      {cells.map((cell, ci) => (
                        <div
                          key={ci}
                          className="relative rounded-md cursor-pointer transition-all"
                          style={{
                            width: 56,
                            height: 48,
                            background: getHeatColor(cell),
                            border: `1px solid ${riskColor[cell.risk].border}`,
                          }}
                          onMouseEnter={e => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const containerRect = e.currentTarget.closest(".relative")?.getBoundingClientRect();
                            if (containerRect) {
                              setHoveredCell({ cell, x: rect.left - containerRect.left + 56, y: rect.top - containerRect.top });
                            }
                          }}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() => handleCellClick(cell)}
                        >
                          <div className="flex flex-col items-center justify-center h-full gap-0.5">
                            <span className="text-xs font-bold" style={{ color: riskColor[cell.risk].text }}>{cell.count}</span>
                            <span className="text-xs" style={{ color: changeTypeColor[cell.changeType].text, fontSize: 9 }}>{changeLabel[cell.changeType]}</span>
                          </div>
                          {/* 风险角标 */}
                          <div
                            className="absolute top-0.5 right-0.5 text-xs rounded px-0.5"
                            style={{ fontSize: 8, background: riskColor[cell.risk].bg, color: riskColor[cell.risk].text }}
                          >{riskLabel[cell.risk]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tooltip */}
            {hoveredCell && (
              <HeatTooltip cell={hoveredCell.cell} x={hoveredCell.x} y={hoveredCell.y} />
            )}
          </div>
        </div>

        {/* ── 影响链路图 + 版本列表 ── */}
        <div className="flex gap-3" style={{ height: 480 }}>
          {/* 版本列表侧边栏 */}
          <div className="w-56 flex-shrink-0 rounded-xl flex flex-col overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-3 py-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="text-xs font-medium text-white">版本列表</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>点击版本高亮影响节点</div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {/* 全部版本选项 */}
              <div
                className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: selectedVersion === null ? "rgba(22,93,255,0.1)" : "transparent",
                  borderLeft: selectedVersion === null ? "2px solid #165DFF" : "2px solid transparent",
                }}
                onClick={() => setSelectedVersion(null)}
              >
                <span className="text-xs text-white">全部版本</span>
              </div>
              {versionList.map(ver => {
                const isSelected = selectedVersion === ver.id;
                return (
                  <div
                    key={ver.id}
                    className="px-3 py-2.5 cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isSelected ? "rgba(22,93,255,0.1)" : "transparent",
                      borderLeft: isSelected ? "2px solid #165DFF" : "2px solid transparent",
                    }}
                    onClick={() => setSelectedVersion(isSelected ? null : ver.id)}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(22,93,255,0.05)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white truncate">{ver.app}</span>
                      {isSelected && <ChevronRightIcon size={10} style={{ color: "#165DFF", flexShrink: 0 }} />}
                    </div>
                    <div className="text-xs mb-1" style={{ color: "#60A5FA" }}>{ver.version}</div>
                    <div className="text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{ver.time}</div>
                    <div className="flex flex-wrap gap-1">
                      {ver.changes.map(ct => (
                        <span key={ct} className="text-xs px-1 py-0.5 rounded" style={{ background: changeTypeColor[ct].bg, color: changeTypeColor[ct].text, fontSize: 9 }}>
                          {changeLabel[ct]}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 影响链路图 SVG */}
          <div
            ref={graphRef}
            className="flex-1 rounded-xl overflow-hidden relative"
            style={{ background: "#0B1120", border: "1px solid var(--border)" }}
          >
            {/* 标题 + zoom */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <span className="text-xs font-medium text-white">影响链路图</span>
              {selectedVer && (
                <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.2)", color: "#60A5FA", border: "1px solid rgba(22,93,255,0.3)" }}>
                  {selectedVer.app} {selectedVer.version}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 flex gap-1.5 z-10">
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                onClick={() => setGraphZoom(z => Math.min(z + 0.15, 2))}
              >
                <ZoomInIcon size={13} style={{ color: "var(--foreground)" }} />
              </button>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                onClick={() => setGraphZoom(z => Math.max(z - 0.15, 0.4))}
              >
                <ZoomOutIcon size={13} style={{ color: "var(--foreground)" }} />
              </button>
              <button
                className="w-7 h-7 rounded-md flex items-center justify-center"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                onClick={() => setGraphZoom(1)}
              >
                <RotateCcwIcon size={13} style={{ color: "var(--foreground)" }} />
              </button>
            </div>

            {/* 图例 */}
            <div className="absolute bottom-3 left-3 z-10 flex gap-3">
              {([["高风险", "#FF4D4F"], ["中风险", "#FFAA00"], ["正常", "#165DFF"]] as [string, string][]).map(([l, c]) => (
                <div key={l} className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.8 }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</span>
                </div>
              ))}
              <div className="flex items-center gap-1">
                <LockIcon size={10} style={{ color: "var(--muted-foreground)" }} />
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>右键锁定节点</span>
              </div>
            </div>

            {/* 节点 Tooltip（在 SVG 容器外绝对定位） */}
            {hoveredNode && hoveredNode.node.risk !== "none" && (
              <NodeAlertTooltip
                node={hoveredNode.node}
                alerts={mockAlerts.filter(a => a.node === hoveredNode.node.id)}
                x={hoveredNode.x}
                y={hoveredNode.y}
              />
            )}

            <svg
              width="100%"
              height="100%"
              viewBox="0 0 850 420"
              style={{ cursor: "default" }}
            >
              <defs>
                <pattern id="graph-grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.6" fill="rgba(100,116,139,0.18)" />
                </pattern>
                <marker id="graph-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(100,116,139,0.5)" />
                </marker>
                <marker id="graph-arrow-highlight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#165DFF" />
                </marker>
                {/* 风险节点红色发光滤镜 */}
                <filter id="risk-glow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>
              <rect width="850" height="420" fill="url(#graph-grid)" />

              <g transform={`scale(${graphZoom}) translate(${(850 * (1 - graphZoom)) / (2 * graphZoom)}, ${(420 * (1 - graphZoom)) / (2 * graphZoom)})`}>
                {/* 先渲染边 */}
                {graphEdges.map((edge, i) => {
                  const fromN = graphNodes.find(n => n.id === edge.from);
                  const toN   = graphNodes.find(n => n.id === edge.to);
                  if (!fromN || !toN) return null;

                  const dx = toN.x - fromN.x;
                  const dy = toN.y - fromN.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                  const rr = 20;
                  const gap = 4;
                  const fx = fromN.x + (dx / dist) * (rr + gap);
                  const fy = fromN.y + (dy / dist) * (rr + gap);
                  const tx = toN.x   - (dx / dist) * (rr + gap);
                  const ty = toN.y   - (dy / dist) * (rr + gap);
                  const mx = (fromN.x + toN.x) / 2;
                  const my = (fromN.y + toN.y) / 2;

                  const isActive = getEdgeOpacity(edge.from, edge.to) > 0.5;

                  return (
                    <g key={i} opacity={getEdgeOpacity(edge.from, edge.to)}>
                      <line
                        x1={fx} y1={fy} x2={tx} y2={ty}
                        stroke={isActive ? "#165DFF" : "rgba(100,116,139,0.4)"}
                        strokeWidth={isActive ? 1.8 : 1}
                        markerEnd={isActive ? "url(#graph-arrow-highlight)" : "url(#graph-arrow)"}
                      />
                      <text x={mx} y={my - 5} textAnchor="middle" fontSize="7.5" fill="rgba(100,116,139,0.7)">{edge.label}</text>
                    </g>
                  );
                })}

                {/* 渲染节点 */}
                {graphNodes.map(node => {
                  const tc = nodeTypeColor[node.type];
                  const isRisk = node.risk === "high" || node.risk === "medium";
                  const rc = riskColor[node.risk];
                  const opacity = getNodeOpacity(node.id);
                  const isLocked = lockedNodes.has(node.id);
                  const nodeAlerts = mockAlerts.filter(a => a.node === node.id);

                  const fillColor = isRisk ? rc.bg : tc.fill;
                  const strokeColor = isRisk ? rc.border : tc.stroke;

                  return (
                    <g
                      key={node.id}
                      transform={`translate(${node.x}, ${node.y})`}
                      opacity={opacity}
                      style={{ cursor: "pointer" }}
                      onMouseEnter={e => {
                        const svgEl = e.currentTarget.ownerSVGElement;
                        if (!svgEl || !graphRef.current) return;
                        const containerRect = graphRef.current.getBoundingClientRect();
                        const pt = svgEl.createSVGPoint();
                        pt.x = e.clientX;
                        pt.y = e.clientY;
                        setHoveredNode({
                          node,
                          x: e.clientX - containerRect.left + 14,
                          y: e.clientY - containerRect.top - 14,
                        });
                      }}
                      onMouseLeave={() => setHoveredNode(null)}
                      onClick={() => {
                        if (isRisk && nodeAlerts.length > 0) {
                          navigateToAlerts(node.id);
                        }
                      }}
                      onContextMenu={e => {
                        e.preventDefault();
                        toggleLock(node.id);
                        showToast(`节点 ${node.label} ${isLocked ? "已解锁" : "已锁定"}`, "info");
                      }}
                    >
                      {/* 高风险节点脉冲环 */}
                      {node.risk === "high" && (
                        <circle r={26} fill="none" stroke="#FF4D4F" strokeWidth={1.5} opacity={0.4}>
                          <animate attributeName="r" values="22;28;22" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* 受版本影响高亮环 */}
                      {affectedNodes && affectedNodes.has(node.id) && (
                        <circle r={24} fill="none" stroke="#165DFF" strokeWidth={2} opacity={0.6}>
                          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1.5s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {/* 主圆 */}
                      <circle r={20} fill={fillColor} stroke={strokeColor} strokeWidth={isRisk ? 2 : 1.5} />
                      {/* 节点标签（内） */}
                      <text y={4} textAnchor="middle" fontSize="8" fill={isRisk ? rc.text : tc.label} fontWeight="600">
                        {node.type === "gateway" ? "GW" : node.type === "db" ? "DB" : node.type === "mq" ? "MQ" : "SVC"}
                      </text>
                      {/* 节点名称（外） */}
                      <text y={34} textAnchor="middle" fontSize="9" fill="rgba(226,232,240,0.9)">{node.label}</text>
                      {/* 告警计数徽章 */}
                      {nodeAlerts.length > 0 && (
                        <g transform="translate(14, -14)">
                          <circle r={7} fill="#FF4D4F" stroke="#0B1120" strokeWidth={1.5} />
                          <text y={4} textAnchor="middle" fontSize="8" fill="#fff" fontWeight="bold">{nodeAlerts.length}</text>
                        </g>
                      )}
                      {/* 锁定图标 */}
                      {isLocked && (
                        <g transform="translate(-14, -14)">
                          <circle r={7} fill="rgba(255,170,0,0.3)" stroke="#FFAA00" strokeWidth={1} />
                          <text y={4} textAnchor="middle" fontSize="9" fill="#FFAA00">🔒</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* ── 告警联动区域 ── */}
        <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BellIcon size={14} style={{ color: "#FF4D4F" }} />
              <span className="text-sm font-medium text-white">风险节点告警联动</span>
              <span
                className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F", border: "1px solid rgba(255,77,79,0.3)" }}
              >
                {mockAlerts.length} 条活跃
              </span>
            </div>
            <TechButton variant="ghost" size="xs" onClick={() => showToast(`已跳转到告警规则列表`, "info")}>
              查看全部告警
            </TechButton>
          </div>

          <div className="flex gap-2 flex-wrap">
            {mockAlerts.map(alert => {
              const node = graphNodes.find(n => n.id === alert.node);
              const isHighAlert = alert.level === "high";
              return (
                <div
                  key={alert.id}
                  className="rounded-lg p-3 cursor-pointer transition-all"
                  style={{
                    background: isHighAlert ? "rgba(255,77,79,0.08)" : "rgba(255,170,0,0.08)",
                    border: `1px solid ${isHighAlert ? "rgba(255,77,79,0.25)" : "rgba(255,170,0,0.25)"}`,
                    minWidth: 180,
                    flex: "1 1 180px",
                    maxWidth: 260,
                  }}
                  onClick={() => navigateToAlerts(alert.node)}
                  onMouseEnter={e => { e.currentTarget.style.background = isHighAlert ? "rgba(255,77,79,0.15)" : "rgba(255,170,0,0.15)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isHighAlert ? "rgba(255,77,79,0.08)" : "rgba(255,170,0,0.08)"; }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <AlertTriangleIcon size={11} style={{ color: isHighAlert ? "#FF4D4F" : "#FFAA00", flexShrink: 0 }} />
                    <span className="text-xs font-medium" style={{ color: isHighAlert ? "#FF4D4F" : "#FFAA00" }}>
                      {node?.label ?? alert.node}
                    </span>
                    <span
                      className="text-xs px-1 py-0.5 rounded ml-auto"
                      style={{ background: isHighAlert ? "rgba(255,77,79,0.2)" : "rgba(255,170,0,0.2)", color: isHighAlert ? "#FF4D4F" : "#FFAA00", fontSize: 9 }}
                    >
                      {isHighAlert ? "高" : "中"}
                    </span>
                  </div>
                  <div className="text-xs text-white mb-1">{alert.message}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{alert.time}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
