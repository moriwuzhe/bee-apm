import { useState, useRef, useEffect, useCallback } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import {
  RefreshCwIcon,
  ZoomInIcon,
  ZoomOutIcon,
  FilterIcon,
  ActivityIcon,
  InfoIcon,
  TerminalIcon,
  RotateCcwIcon,
  BellIcon,
} from "lucide-react";
import { useToast } from "../context/ToastContext";

const nodes = [
  { id: "lb",        label: "负载均衡",      x: 380,  y: 60,   type: "gateway", status: "online"  },
  { id: "api-gw",    label: "API网关",       x: 380,  y: 160,  type: "gateway", status: "online"  },
  { id: "order",     label: "订单服务",      x: 130,  y: 290,  type: "service", status: "error"   },
  { id: "pay",       label: "支付服务",      x: 310,  y: 290,  type: "service", status: "online"  },
  { id: "user",      label: "用户服务",      x: 490,  y: 290,  type: "service", status: "warning" },
  { id: "inventory", label: "库存服务",      x: 670,  y: 290,  type: "service", status: "online"  },
  { id: "mq",        label: "消息队列",      x: 130,  y: 430,  type: "infra",   status: "online"  },
  { id: "db-order",  label: "订单DB",        x: 310,  y: 430,  type: "infra",   status: "online"  },
  { id: "db-user",   label: "用户DB",        x: 490,  y: 430,  type: "infra",   status: "online"  },
  { id: "redis",     label: "Redis集群",     x: 670,  y: 430,  type: "infra",   status: "warning" },
  { id: "es",        label: "Elasticsearch", x: 850,  y: 290,  type: "infra",   status: "online"  },
  { id: "notify",    label: "通知服务",      x: 850,  y: 430,  type: "service", status: "online"  },
];

// 同步依赖边（含 QPS 数据）
const syncEdges = [
  { from: "lb",        to: "api-gw",    latency: "2ms",   warn: false, qps: 1240 },
  { from: "api-gw",    to: "order",     latency: "12ms",  warn: false, qps: 320  },
  { from: "api-gw",    to: "pay",       latency: "8ms",   warn: false, qps: 180  },
  { from: "api-gw",    to: "user",      latency: "156ms", warn: true,  qps: 560  },
  { from: "api-gw",    to: "inventory", latency: "5ms",   warn: false, qps: 215  },
  { from: "order",     to: "db-order",  latency: "45ms",  warn: true,  qps: 98   },
  { from: "pay",       to: "db-order",  latency: "18ms",  warn: false, qps: 76   },
  { from: "user",      to: "db-user",   latency: "22ms",  warn: false, qps: 143  },
  { from: "inventory", to: "redis",     latency: "2ms",   warn: false, qps: 432  },
  { from: "inventory", to: "es",        latency: "8ms",   warn: false, qps: 67   },
  { from: "user",      to: "redis",     latency: "3ms",   warn: false, qps: 288  },
];

// 异步依赖边（消息队列 / 事件驱动）
const asyncEdges = [
  { from: "order",  to: "mq",      latency: "3ms",  topic: "order.created",   warn: false },
  { from: "mq",     to: "pay",     latency: "12ms", topic: "order.created",   warn: false },
  { from: "mq",     to: "inventory",latency:"8ms",  topic: "order.created",   warn: false },
  { from: "mq",     to: "notify",  latency: "5ms",  topic: "order.paid",      warn: false },
  { from: "pay",    to: "mq",      latency: "4ms",  topic: "payment.done",    warn: true  },
  { from: "inventory",to:"mq",     latency: "6ms",  topic: "stock.deducted",  warn: false },
  { from: "notify", to: "es",      latency: "9ms",  topic: "notify.log",      warn: false },
];

// 合并所有 edge，区分类型
const edges = [
  ...syncEdges.map(e => ({ ...e, edgeType: "sync" as const })),
  ...asyncEdges.map(e => ({ ...e, edgeType: "async" as const, qps: 0 })),
];

const statusColors: Record<string, string> = {
  online:  "#00D68F",
  warning: "#FFAA00",
  error:   "#FF4D4F",
  offline: "#64748B",
};

const statusLabels: Record<string, string> = {
  all:     "全部",
  online:  "正常",
  warning: "警告",
  error:   "异常",
};

const typeColors: Record<string, { bg: string; border: string; text: string }> = {
  gateway: { bg: "rgba(22,93,255,0.2)",   border: "#165DFF", text: "#60A5FA" },
  service: { bg: "rgba(168,85,247,0.2)",  border: "#A855F7", text: "#C084FC" },
  infra:   { bg: "rgba(0,214,143,0.12)",  border: "#00D68F", text: "#34D399" },
};

interface ContextMenu {
  visible: boolean;
  x: number;
  y: number;
  nodeId: string;
  nodeLabel: string;
}

export default function NetworkTopology() {
  const { showToast } = useToast();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");
  const [animated, setAnimated] = useState(true);
  const [showAsync, setShowAsync] = useState(true);
  const [showSync, setShowSync] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenu>({
    visible: false, x: 0, y: 0, nodeId: "", nodeLabel: "",
  });

  const visibleNodes = nodes.filter(n => filterStatus === "all" || n.status === filterStatus);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e =>
    visibleIds.has(e.from) && visibleIds.has(e.to) &&
    ((e.edgeType === "sync" && showSync) || (e.edgeType === "async" && showAsync))
  );

  const getNode = (id: string) => nodes.find(n => n.id === id);
  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
  const connectedEdges = selected ? edges.filter(e => e.from === selected || e.to === selected) : [];

  // 关闭右键菜单
  const closeMenu = useCallback(() => {
    setContextMenu(prev => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    const handler = () => closeMenu();
    window.addEventListener("click", handler);
    window.addEventListener("scroll", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("scroll", handler);
    };
  }, [closeMenu]);

  // 右键菜单处理
  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string, nodeLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
    // 防止菜单超出容器右侧/底部
    const menuW = 160;
    const menuH = 170;
    const x = rawX + menuW > rect.width  ? rawX - menuW : rawX;
    const y = rawY + menuH > rect.height ? rawY - menuH : rawY;
    setContextMenu({ visible: true, x, y, nodeId, nodeLabel });
  };

  const handleMenuAction = (action: string) => {
    const label = contextMenu.nodeLabel;
    closeMenu();
    switch (action) {
      case "detail":
        setSelected(contextMenu.nodeId);
        showToast(`正在加载 ${label} 详情...`, "info");
        break;
      case "ssh":
        showToast(`SSH 连接到 ${label}，请稍等...`, "warning");
        break;
      case "restart":
        showToast(`已发送重启指令：${label}`, "error");
        break;
      case "alert":
        showToast(`已为 ${label} 创建告警规则`, "success");
        break;
    }
  };

  // 计算 SVG 坐标系内的控制点（贝塞尔曲线，异步边用弧线）
  const getEdgePath = (fromX: number, fromY: number, toX: number, toY: number, edgeType: string, idx: number) => {
    if (edgeType === "sync") {
      return `M${fromX},${fromY} L${toX},${toY}`;
    }
    // 异步边用二次贝塞尔曲线，偏移量随 idx 变化防止重叠
    const offset = 40 + (idx % 3) * 20;
    const mx = (fromX + toX) / 2;
    const my = (fromY + toY) / 2;
    const dx = toY - fromY;
    const dy = fromX - toX;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    const cx = mx + (dx / len) * offset;
    const cy = my + (dy / len) * offset;
    return `M${fromX},${fromY} Q${cx},${cy} ${toX},${toY}`;
  };

  return (
    <MainLayout title="网络拓扑图">
      <div data-cmp="NetworkTopology" className="space-y-4">
        <PageHeader
          title="网络拓扑可视化"
          subtitle={`${nodes.length} 节点 · ${edges.length} 连接 · ${nodes.filter(n => n.status !== "online").length} 异常`}
          actions={
            <>
              <div className="flex items-center gap-1.5">
                {/* 状态过滤下拉 */}
                <div className="relative">
                  <button
                    onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  >
                    <span>{statusLabels[filterStatus]}</span>
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                      <path d="M5 6L0 0h10L5 6z" fill="var(--muted-foreground)" />
                    </svg>
                  </button>
                  {showStatusDropdown && (
                    <div className="absolute top-full left-0 mt-1 py-1 rounded-md z-10 min-w-[80px]" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 4px 12px rgba(0,0,0,0.3)" }}>
                      {([["all", "全部"], ["online", "正常"], ["warning", "警告"], ["error", "异常"]] as [string, string][]).map(([v, l]) => (
                        <button
                          key={v}
                          onClick={() => { setFilterStatus(v); setShowStatusDropdown(false); }}
                          className="w-full px-3 py-1.5 text-left text-xs transition-colors"
                          style={{ color: filterStatus === v ? "#165DFF" : "var(--foreground)" }}
                        >{l}</button>
                      ))}
                    </div>
                  )}
                </div>

                {/* 同步/异步切换 */}
                <div className="flex items-center gap-0.5 p-0.5 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <button
                    onClick={() => setShowSync(v => !v)}
                    className="px-2.5 py-1 rounded text-xs transition-colors"
                    style={{ background: showSync ? "#165DFF" : "transparent", color: showSync ? "#fff" : "var(--muted-foreground)" }}
                  >同步</button>
                  <button
                    onClick={() => setShowAsync(v => !v)}
                    className="px-2.5 py-1 rounded text-xs transition-colors"
                    style={{ background: showAsync ? "#A855F7" : "transparent", color: showAsync ? "#fff" : "var(--muted-foreground)" }}
                  >异步</button>
                </div>

                {/* 动画开关 */}
                <button
                  onClick={() => setAnimated(!animated)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                  style={{ background: animated ? "#00D68F" : "var(--card)", border: "1px solid var(--border)", color: animated ? "#0B1120" : "var(--muted-foreground)" }}
                >
                  <ActivityIcon size={12} />
                  <span>{animated ? "动画" : "静态"}</span>
                </button>

                {/* 刷新按钮 */}
                <button
                  onClick={() => { showToast("正在刷新拓扑图...", "info"); setTimeout(() => showToast("拓扑图刷新成功", "success"), 1000); }}
                  className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  title="刷新拓扑图"
                >
                  <RefreshCwIcon size={14} style={{ color: "var(--foreground)" }} />
                </button>
              </div>
            </>
          }
        />

        <div className="flex gap-3">
          {/* SVG Canvas */}
          <div
            ref={containerRef}
            className="flex-1 rounded-xl overflow-hidden relative"
            style={{ background: "#0B1120", border: "1px solid var(--border)", height: 560 }}
          >
            {/* Zoom controls */}
            <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
              <button className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
                <ZoomInIcon size={14} style={{ color: "var(--foreground)" }} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
                <ZoomOutIcon size={14} style={{ color: "var(--foreground)" }} />
              </button>
              <button className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={() => setZoom(1)}>
                <FilterIcon size={14} style={{ color: "var(--foreground)" }} />
              </button>
            </div>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 z-10">
              <div className="flex gap-3">
                {([["网关层", "#165DFF"], ["服务层", "#A855F7"], ["基础设施", "#00D68F"]] as [string,string][]).map(([l, c]) => (
                  <div key={l} className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-sm" style={{ background: c, opacity: 0.7 }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <div className="flex items-center gap-1.5">
                  <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#60A5FA" strokeWidth="1.5" /></svg>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>同步调用</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <svg width="22" height="10"><path d="M0,5 Q11,0 22,5" fill="none" stroke="#C084FC" strokeWidth="1.5" strokeDasharray="3,2" /></svg>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>异步消息</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>QPS标签</span>
                </div>
              </div>
            </div>

            {/* 右键菜单（始终在 DOM 中，用 visibility 控制） */}
            <div
              className="absolute z-50 rounded-lg py-1 overflow-hidden"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
                visibility: contextMenu.visible ? "visible" : "hidden",
                pointerEvents: contextMenu.visible ? "auto" : "none",
                background: "#1a2540",
                border: "1px solid rgba(22,93,255,0.35)",
                minWidth: 160,
                boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(22,93,255,0.1)",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div
                className="px-3 py-1.5 mb-0.5"
                style={{ borderBottom: "1px solid rgba(148,163,184,0.1)" }}
              >
                <span className="text-xs font-semibold" style={{ color: "#60A5FA" }}>{contextMenu.nodeLabel}</span>
              </div>
              {[
                { key: "detail", icon: <InfoIcon size={12} />,     label: "查看详情",  danger: false },
                { key: "ssh",    icon: <TerminalIcon size={12} />, label: "SSH 连接",  danger: true  },
                { key: "restart",icon: <RotateCcwIcon size={12} />,label: "重启服务",  danger: true  },
                { key: "alert",  icon: <BellIcon size={12} />,     label: "设置告警",  danger: false },
              ].map(item => (
                <button
                  key={item.key}
                  onClick={() => handleMenuAction(item.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-colors text-left"
                  style={{ color: item.danger ? "#FF4D4F" : "var(--foreground)", background: "transparent" }}
                  onMouseEnter={e => { e.currentTarget.style.background = item.danger ? "rgba(255,77,79,0.08)" : "rgba(22,93,255,0.1)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span style={{ color: item.danger ? "#FF4D4F" : "#60A5FA" }}>{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>

            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox="0 0 1000 520"
              style={{ cursor: "default" }}
              onContextMenu={e => e.preventDefault()}
            >
              <defs>
                <pattern id="grid" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.7" fill="rgba(100,116,139,0.2)" />
                </pattern>
                {/* 同步边箭头 */}
                <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(100,116,139,0.5)" />
                </marker>
                <marker id="arrow-warn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#FFAA00" />
                </marker>
                {/* 异步边箭头（紫色） */}
                <marker id="arrow-async" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#A855F7" />
                </marker>
                <marker id="arrow-async-warn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#FFAA00" />
                </marker>
                {/* 高亮同步边箭头 */}
                <marker id="arrow-highlight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#60A5FA" />
                </marker>
                {/* 异步边流动动画 */}
                <style>{`
                  @keyframes dashFlow {
                    to { stroke-dashoffset: -20; }
                  }
                  .async-flow {
                    animation: dashFlow 1.2s linear infinite;
                  }
                `}</style>
              </defs>
              <rect width="1000" height="520" fill="url(#grid)" />

              <g transform={`scale(${zoom}) translate(${(1000 * (1 - zoom)) / (2 * zoom)}, ${(520 * (1 - zoom)) / (2 * zoom)})`}>
                {/* Edges */}
                {visibleEdges.map((e, i) => {
                  const from = getNode(e.from);
                  const to   = getNode(e.to);
                  if (!from || !to) return null;
                  const isHighlighted = selected === e.from || selected === e.to;
                  const isAsync = e.edgeType === "async";
                  const edgeKey = `${e.from}-${e.to}-${e.edgeType}-${i}`;
                  const isHovered = hoveredEdge === edgeKey;

                  // 计算从/到节点边缘（缩短线段以避免与节点圆重叠）
                  const dx = to.x - from.x;
                  const dy = to.y - from.y;
                  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                  const r = 22;
                  const gap = 4;
                  const fx = from.x + (dx / dist) * (r + gap);
                  const fy = from.y + (dy / dist) * (r + gap);
                  const tx = to.x   - (dx / dist) * (r + gap);
                  const ty = to.y   - (dy / dist) * (r + gap);

                  const pathD = getEdgePath(fx, fy, tx, ty, e.edgeType, i);
                  // 标签中点位置（沿连线中点）
                  const mx = (from.x + to.x) / 2;
                  const my = (from.y + to.y) / 2;

                  let strokeColor: string;
                  if (isHovered && !isAsync) strokeColor = "#60A5FA";
                  else if (e.warn) strokeColor = "#FFAA00";
                  else if (isAsync) strokeColor = isHighlighted ? "#C084FC" : "rgba(168,85,247,0.5)";
                  else strokeColor = isHighlighted ? "#165DFF" : "rgba(100,116,139,0.4)";

                  const markerEnd = isHovered && !isAsync
                    ? "url(#arrow-highlight)"
                    : e.warn
                    ? (isAsync ? "url(#arrow-async-warn)" : "url(#arrow-warn)")
                    : isAsync ? "url(#arrow-async)" : "url(#arrow)";

                  // QPS 标签（同步边 + showAnimation=animated 时显示）
                  const qpsValue = (e as typeof syncEdges[0] & { edgeType: "sync" | "async" }).qps;
                  const showQps = animated && !isAsync && typeof qpsValue === "number" && qpsValue > 0;
                  // QPS标签背景宽高
                  const qpsText = `${qpsValue} QPS`;
                  const qpsW = qpsText.length * 5.4 + 8;
                  const qpsH = 14;

                  return (
                    <g
                      key={edgeKey}
                      opacity={selected && !isHighlighted ? 0.15 : 1}
                      style={{ cursor: isAsync ? "default" : "pointer" }}
                      onMouseEnter={() => { if (!isAsync) setHoveredEdge(edgeKey); }}
                      onMouseLeave={() => setHoveredEdge(null)}
                    >
                      {/* 宽透明路径用于鼠标捕获 */}
                      <path
                        d={pathD}
                        fill="none"
                        stroke="transparent"
                        strokeWidth={12}
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={isHighlighted || isHovered ? 2 : 1.2}
                        strokeDasharray={isAsync ? "5,3" : e.warn ? "5,3" : "none"}
                        strokeDashoffset="0"
                        markerEnd={markerEnd}
                        className={isAsync && animated ? "async-flow" : ""}
                      />
                      {/* 延迟标签 */}
                      <text
                        x={mx}
                        y={my - (showQps ? 14 : 6)}
                        textAnchor="middle"
                        fontSize="8.5"
                        fill={e.warn ? "#FFAA00" : isAsync ? "rgba(168,85,247,0.9)" : "rgba(100,116,139,0.8)"}
                      >
                        {e.latency}
                      </text>

                      {/* QPS 标签 —— 半透明深色圆角背景 + 白色文字，仅同步边且 animated=true 时显示 */}
                      <g style={{ visibility: showQps ? "visible" : "hidden" }}>
                        <rect
                          x={mx - qpsW / 2}
                          y={my - 3}
                          width={qpsW}
                          height={qpsH}
                          rx={4}
                          ry={4}
                          fill={isHovered ? "rgba(22,93,255,0.75)" : "rgba(15,23,42,0.72)"}
                          stroke={isHovered ? "rgba(96,165,250,0.6)" : "rgba(148,163,184,0.18)"}
                          strokeWidth={0.8}
                        />
                        <text
                          x={mx}
                          y={my + 8}
                          textAnchor="middle"
                          fontSize="8"
                          fontWeight={isHovered ? "600" : "400"}
                          fill={isHovered ? "#fff" : "rgba(226,232,240,0.88)"}
                        >
                          {qpsText}
                        </text>
                      </g>

                      {/* 异步 topic 标签 */}
                      {"topic" in e && e.topic && isHighlighted && (
                        <text x={mx} y={my + 8} textAnchor="middle" fontSize="7.5" fill="rgba(168,85,247,0.7)">{(e as typeof asyncEdges[0]).topic}</text>
                      )}
                    </g>
                  );
                })}

                {/* Nodes */}
                {visibleNodes.map((n) => {
                  const tc = typeColors[n.type];
                  const sc = statusColors[n.status];
                  const isSelected = selected === n.id;
                  return (
                    <g
                      key={n.id}
                      transform={`translate(${n.x}, ${n.y})`}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelected(selected === n.id ? null : n.id)}
                      onContextMenu={ev => {
                        // 将 SVG 坐标转换为容器像素坐标
                        handleNodeContextMenu(ev as unknown as React.MouseEvent, n.id, n.label);
                      }}
                    >
                      {/* 异常脉冲环 */}
                      {n.status !== "online" && animated && (
                        <circle r={28} fill="none" stroke={sc} strokeWidth={1.5} opacity={0.3}>
                          <animate attributeName="r" values="24;30;24" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      {n.status !== "online" && !animated && (
                        <circle r={28} fill="none" stroke={sc} strokeWidth={1.5} opacity={0.3} />
                      )}
                      {/* 选中高亮环 */}
                      {isSelected && (
                        <circle r={26} fill="none" stroke="#fff" strokeWidth={1} opacity={0.3} />
                      )}
                      {/* 主节点圆 */}
                      <circle r={22} fill={tc.bg} stroke={isSelected ? "#fff" : tc.border} strokeWidth={isSelected ? 2.5 : 1.5} />
                      {/* 状态圆点 */}
                      <circle cx={16} cy={-16} r={5} fill={sc} stroke="#0B1120" strokeWidth={1.5} />
                      {/* 节点文字 */}
                      <text y={38} textAnchor="middle" fontSize="10" fill="rgba(226,232,240,0.9)">{n.label}</text>
                      <text y={5} textAnchor="middle" fontSize="9" fill={tc.text}>
                        {n.type === "gateway" ? "GW" : n.type === "service" ? "SVC" : "INF"}
                      </text>
                    </g>
                  );
                })}
              </g>
            </svg>
          </div>

          {/* Side panel */}
          <div className="w-64 flex-shrink-0 rounded-xl p-4 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white">
              {selectedNode ? `节点详情` : `拓扑概览`}
            </div>

            {/* Overview */}
            <div className={selectedNode ? "hidden" : ""}>
              <div className="space-y-2 mb-4">
                {([["总节点数", String(nodes.length), "#165DFF"], ["正常", String(nodes.filter(n => n.status === "online").length), "#00D68F"], ["警告", String(nodes.filter(n => n.status === "warning").length), "#FFAA00"], ["异常", String(nodes.filter(n => n.status === "error").length), "#FF4D4F"]] as [string,string,string][]).map(([k, v, c]) => (
                  <div key={k} className="flex justify-between items-center p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k}</span>
                    <span className="text-sm font-bold" style={{ color: c }}>{v}</span>
                  </div>
                ))}
              </div>
              {/* 同步异常连接 */}
              <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>异常连接</div>
              {edges.filter(e => e.warn).map((e, i) => (
                <div key={i} className="p-2.5 rounded-md mb-1.5" style={{ background: "rgba(255,170,0,0.08)", border: "1px solid rgba(255,170,0,0.2)" }}>
                  <div className="flex items-center gap-1.5 text-xs text-white">
                    <span className="text-xs px-1 rounded" style={{ background: e.edgeType === "async" ? "rgba(168,85,247,0.2)" : "rgba(22,93,255,0.2)", color: "#C084FC" } as React.CSSProperties}>{e.edgeType === "async" ? "异步" : "同步"}</span>
                    {e.from} → {e.to}
                  </div>
                  <div className="text-xs" style={{ color: "#FFAA00" }}>延迟 {e.latency}</div>
                </div>
              ))}
              {/* 异步链路统计 */}
              <div className="mt-3 p-2.5 rounded-md" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                <div className="text-xs font-medium mb-1.5" style={{ color: "#C084FC" }}>消息驱动链路</div>
                {asyncEdges.map((e, i) => (
                  <div key={i} className="flex justify-between text-xs mb-0.5">
                    <span style={{ color: "var(--muted-foreground)" }}>{e.from}→{e.to}</span>
                    <span style={{ color: e.warn ? "#FFAA00" : "#C084FC" }}>{e.latency}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Node detail */}
            <div className={selectedNode ? "" : "hidden"}>
              {selectedNode && (
                <div className="space-y-3">
                  <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: statusColors[selectedNode.status] }} />
                      <span className="text-xs text-white font-medium">{selectedNode.label}</span>
                    </div>
                    {([["类型", selectedNode.type === "gateway" ? "网关层" : selectedNode.type === "service" ? "应用服务" : "基础设施"], ["状态", selectedNode.status === "online" ? "正常" : selectedNode.status === "warning" ? "警告" : "异常"]] as [string,string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                        <span className="text-white">{v}</span>
                      </div>
                    ))}
                  </div>
                  {/* 分组展示关联边 */}
                  {(["sync", "async"] as const).map(et => {
                    const group = connectedEdges.filter(e => e.edgeType === et);
                    return (
                      <div key={et}>
                        <div className="text-xs font-medium mb-1.5 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                          <span className="px-1 rounded text-xs" style={{ background: et === "async" ? "rgba(168,85,247,0.2)" : "rgba(22,93,255,0.2)", color: et === "async" ? "#C084FC" : "#60A5FA" }}>{et === "async" ? "异步" : "同步"}</span>
                          关联 ({group.length})
                        </div>
                        {group.map((e, i) => (
                          <div key={i} className="p-2 rounded mb-1.5 text-xs" style={{ background: "var(--muted)" }}>
                            <div className="text-white">{e.from} → {e.to}</div>
                            <div className="flex gap-2">
                              <span style={{ color: e.warn ? "#FFAA00" : et === "async" ? "#C084FC" : "#00D68F" }}>延迟 {e.latency}</span>
                              {"topic" in e && (e as typeof asyncEdges[0]).topic && (
                                <span style={{ color: "rgba(168,85,247,0.7)" }}>{(e as typeof asyncEdges[0]).topic}</span>
                              )}
                              {et === "sync" && (e as typeof syncEdges[0] & { edgeType: "sync" | "async" }).qps > 0 && (
                                <span style={{ color: "#60A5FA" }}>{(e as typeof syncEdges[0] & { edgeType: "sync" | "async" }).qps} QPS</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                  <TechButton variant="ghost" size="xs" onClick={() => setSelected(null)}>取消选中</TechButton>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
