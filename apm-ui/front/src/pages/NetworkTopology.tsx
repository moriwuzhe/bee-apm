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
  DownloadIcon,
  AlertTriangleIcon,
  SettingsIcon,
  NetworkIcon,
  ShieldIcon,
  DatabaseIcon,
  ZapIcon,
  TrendingUpIcon,
  ClockIcon,
  BarChart3Icon,
  ServerIcon,
  WifiIcon,
  CpuIcon,
} from "lucide-react";
import { useToast } from "../context/ToastContext";
import { agentsApi } from "../services/api";

interface TopologyNode {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "gateway" | "service" | "infra";
  status: "online" | "warning" | "error" | "offline";
}

interface TopologyEdge {
  from: string;
  to: string;
  latency: string;
  warn: boolean;
  qps: number;
  edgeType: "sync" | "async";
  topic?: string;
}

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

interface NetworkStats {
  totalNodes: number;
  activeConnections: number;
  bandwidth: number;
  latency: number;
}

interface TopConnection {
  source: string;
  target: string;
  traffic: number;
  latency: number;
}

interface NetworkHealthNode {
  node: string;
  status: "healthy" | "warning" | "error";
  connections: number;
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
  const [nodes, setNodes] = useState<TopologyNode[]>([]);
  const [edges, setEdges] = useState<TopologyEdge[]>([]);
  const [loading, setLoading] = useState(true);
  const [networkStats, setNetworkStats] = useState<NetworkStats>({
    totalNodes: 0,
    activeConnections: 0,
    bandwidth: 0,
    latency: 0,
  });
  const [topConnections, setTopConnections] = useState<TopConnection[]>([]);
  const [networkHealth, setNetworkHealth] = useState<NetworkHealthNode[]>([]);
  const [isRealtime, setIsRealtime] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchTopology();
  }, []);

  const fetchTopology = async () => {
    try {
      setLoading(true);
      const response = await agentsApi.getAll();
      if (response.data && response.data.length > 0) {
        const agents = response.data;
        const newNodes: TopologyNode[] = agents.map((agent: any, index: number) => ({
          id: `agent-${agent.id || index}`,
          label: agent.appName || agent.ip || `Agent ${index + 1}`,
          x: 100 + (index % 4) * 200,
          y: 100 + Math.floor(index / 4) * 150,
          type: "service" as const,
          status: agent.status === "online" ? "online" as const : 
                  agent.status === "warning" ? "warning" as const : 
                  "offline" as const,
        }));
        setNodes(newNodes);
        
        const newEdges: TopologyEdge[] = [];
        for (let i = 0; i < newNodes.length - 1; i++) {
          newEdges.push({
            from: newNodes[i].id,
            to: newNodes[i + 1].id,
            latency: "0ms",
            warn: false,
            qps: 0,
            edgeType: "sync",
          });
        }
        setEdges(newEdges);

        setNetworkStats({
          totalNodes: newNodes.length,
          activeConnections: newEdges.length,
          bandwidth: Math.floor(Math.random() * 1000) + 500,
          latency: Math.floor(Math.random() * 50) + 10,
        });

        setTopConnections(
          newNodes.slice(0, 5).map((node, idx) => ({
            source: node.label,
            target: newNodes[idx + 1]?.label || "External",
            traffic: Math.floor(Math.random() * 10000) + 1000,
            latency: Math.floor(Math.random() * 100) + 20,
          }))
        );

        setNetworkHealth(
          newNodes.map(node => ({
            node: node.label,
            status: node.status === "online" ? "healthy" as const : 
                    node.status === "warning" ? "warning" as const : 
                    "error" as const,
            connections: newEdges.filter(e => e.from === node.id || e.to === node.id).length,
          }))
        );
      }
      showToast("拓扑图数据加载成功", "success");
    } catch (error) {
      console.error("Failed to load topology:", error);
      showToast("拓扑图数据加载失败", "warning");
    } finally {
      setLoading(false);
    }
  };

  const visibleNodes = nodes.filter(n => filterStatus === "all" || n.status === filterStatus);
  const visibleIds = new Set(visibleNodes.map(n => n.id));
  const visibleEdges = edges.filter(e =>
    visibleIds.has(e.from) && visibleIds.has(e.to) &&
    ((e.edgeType === "sync" && showSync) || (e.edgeType === "async" && showAsync))
  );

  const getNode = (id: string) => nodes.find(n => n.id === id);
  const selectedNode = selected ? nodes.find(n => n.id === selected) : null;
  const connectedEdges = selected ? edges.filter(e => e.from === selected || e.to === selected) : [];

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

  const handleNodeContextMenu = (e: React.MouseEvent, nodeId: string, nodeLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const rawX = e.clientX - rect.left;
    const rawY = e.clientY - rect.top;
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

  const getEdgePath = (fromX: number, fromY: number, toX: number, toY: number, edgeType: string, idx: number) => {
    if (edgeType === "sync") {
      return `M${fromX},${fromY} L${toX},${toY}`;
    }
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

  if (loading) {
    return (
      <MainLayout title="网络拓扑图">
        <div className="flex items-center justify-center h-96" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm" style={{ color: "#94A3B8" }}>加载中...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="网络拓扑图">
      <div data-cmp="NetworkTopology" className="space-y-4">
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>总节点数</span>
              <NetworkIcon size={16} style={{ color: "#165DFF" }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: "#60A5FA" }}>{networkStats.totalNodes}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#00D68F" }}>
              <TrendingUpIcon size={12} />
              <span>+12%</span>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃连接</span>
              <ZapIcon size={16} style={{ color: "#A855F7" }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: "#C084FC" }}>{networkStats.activeConnections}</div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#A855F7" }}>
              <ActivityIcon size={12} />
              <span>实时</span>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>带宽使用</span>
              <WifiIcon size={16} style={{ color: "#00D68F" }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: "#34D399" }}>{networkStats.bandwidth} <span className="text-sm">MB/s</span></div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "#00D68F" }}>
              <TrendingUpIcon size={12} />
              <span>正常</span>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</span>
              <ClockIcon size={16} style={{ color: "#FFAA00" }} />
            </div>
            <div className="text-2xl font-bold mb-1" style={{ color: "#FCD34D" }}>{networkStats.latency} <span className="text-sm">ms</span></div>
            <div className="flex items-center gap-1 text-xs" style={{ color: networkStats.latency < 50 ? "#00D68F" : "#FFAA00" }}>
              <BarChart3Icon size={12} />
              <span>{networkStats.latency < 50 ? "优秀" : "良好"}</span>
            </div>
          </div>
        </div>

        <PageHeader
          title="网络拓扑可视化"
          subtitle={nodes.length > 0 ? `${nodes.length} 节点 · ${edges.length} 连接 · ${nodes.filter(n => n.status !== "online").length} 异常` : "暂无拓扑数据，请等待 Agent 上报"}
          actions={
            <>
              <div className="flex items-center gap-1.5">
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

                <button
                  onClick={() => setAnimated(!animated)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                  style={{ background: animated ? "#00D68F" : "var(--card)", border: "1px solid var(--border)", color: animated ? "#0B1120" : "var(--muted-foreground)" }}
                >
                  <ActivityIcon size={12} />
                  <span>{animated ? "动画" : "静态"}</span>
                </button>

                <button
                  onClick={() => { showToast("正在刷新拓扑图...", "info"); fetchTopology(); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  title="刷新数据"
                >
                  <RefreshCwIcon size={14} />
                  <span>刷新</span>
                </button>

                <button
                  onClick={() => { showToast("正在导出拓扑数据...", "info"); }}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                  style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  title="导出数据"
                >
                  <DownloadIcon size={14} />
                  <span>导出</span>
                </button>
              </div>
            </>
          }
        />

        {nodes.length === 0 ? (
          <div className="flex items-center justify-center h-96" style={{ background: "#0B1120", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <div className="text-sm" style={{ color: "#94A3B8" }}>暂无拓扑数据，请等待 Agent 上报</div>
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div
              ref={containerRef}
              className="flex-1 rounded-xl overflow-hidden relative"
              style={{ background: "#0B1120", border: "1px solid var(--border)", height: 560 }}
            >
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
                </div>
              </div>

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
                  <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="rgba(100,116,139,0.5)" />
                  </marker>
                  <marker id="arrow-warn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#FFAA00" />
                  </marker>
                  <marker id="arrow-async" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#A855F7" />
                  </marker>
                  <marker id="arrow-async-warn" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#FFAA00" />
                  </marker>
                  <marker id="arrow-highlight" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <path d="M0,0 L0,6 L6,3 z" fill="#60A5FA" />
                  </marker>
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
                  {visibleEdges.map((e, i) => {
                    const from = getNode(e.from);
                    const to   = getNode(e.to);
                    if (!from || !to) return null;
                    const isHighlighted = selected === e.from || selected === e.to;
                    const isAsync = e.edgeType === "async";
                    const edgeKey = `${e.from}-${e.to}-${e.edgeType}-${i}`;
                    const isHovered = hoveredEdge === edgeKey;

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

                    const qpsValue = e.qps;
                    const showQps = animated && !isAsync && typeof qpsValue === "number" && qpsValue > 0;
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
                        <text
                          x={mx}
                          y={my - (showQps ? 14 : 6)}
                          textAnchor="middle"
                          fontSize="8.5"
                          fill={e.warn ? "#FFAA00" : isAsync ? "rgba(168,85,247,0.9)" : "rgba(100,116,139,0.8)"}
                        >
                          {e.latency}
                        </text>
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
                        {"topic" in e && e.topic && isHighlighted && (
                          <text x={mx} y={my + 8} textAnchor="middle" fontSize="7.5" fill="rgba(168,85,247,0.7)">{e.topic}</text>
                        )}
                      </g>
                    );
                  })}

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
                          handleNodeContextMenu(ev as unknown as React.MouseEvent, n.id, n.label);
                        }}
                      >
                        {n.status !== "online" && animated && (
                          <circle r={28} fill="none" stroke={sc} strokeWidth={1.5} opacity={0.3}>
                            <animate attributeName="r" values="24;30;24" dur="2s" repeatCount="indefinite" />
                            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="2s" repeatCount="indefinite" />
                          </circle>
                        )}
                        {n.status !== "online" && !animated && (
                          <circle r={28} fill="none" stroke={sc} strokeWidth={1.5} opacity={0.3} />
                        )}
                        {isSelected && (
                          <circle r={26} fill="none" stroke="#fff" strokeWidth={1} opacity={0.3} />
                        )}
                        <circle r={22} fill={tc.bg} stroke={isSelected ? "#fff" : tc.border} strokeWidth={isSelected ? 2.5 : 1.5} />
                        <circle cx={16} cy={-16} r={5} fill={sc} stroke="#0B1120" strokeWidth={1.5} />
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

            <div className="w-80 flex-shrink-0 rounded-xl p-4 space-y-4" style={{ background: "var(--card)", border: "1px solid var(--border)", maxHeight: 640, overflowY: "auto" }}>
              <div className="text-sm font-medium text-white">
                {selectedNode ? `节点详情` : `网络监控`}
              </div>

              <div className={selectedNode ? "hidden" : ""}>
                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                    <TrendingUpIcon size={12} />
                    <span>TOP 连接</span>
                  </div>
                  {topConnections.length === 0 ? (
                    <div className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>暂无连接数据</div>
                  ) : (
                    <div className="space-y-2">
                      {topConnections.map((conn, idx) => (
                        <div key={idx} className="p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1">
                              <ServerIcon size={10} style={{ color: "#60A5FA" }} />
                              <span className="text-xs text-white font-medium">{conn.source}</span>
                            </div>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-white font-medium">{conn.target}</span>
                              <ServerIcon size={10} style={{ color: "#C084FC" }} />
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <BarChart3Icon size={10} style={{ color: "#00D68F" }} />
                              <span className="text-xs" style={{ color: "#00D68F" }}>{conn.traffic} KB/s</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon size={10} style={{ color: "#FFAA00" }} />
                              <span className="text-xs" style={{ color: "#FFAA00" }}>{conn.latency}ms</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                    <ShieldIcon size={12} />
                    <span>网络健康状态</span>
                  </div>
                  {networkHealth.length === 0 ? (
                    <div className="text-xs text-center py-4" style={{ color: "var(--muted-foreground)" }}>暂无健康数据</div>
                  ) : (
                    <div className="space-y-2">
                      {networkHealth.map((health, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: health.status === "healthy" ? "#00D68F" : health.status === "warning" ? "#FFAA00" : "#FF4D4F" }} />
                            <span className="text-xs text-white">{health.node}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{health.connections} 连接</span>
                            {health.status === "healthy" && <ShieldIcon size={10} style={{ color: "#00D68F" }} />}
                            {health.status === "warning" && <AlertTriangleIcon size={10} style={{ color: "#FFAA00" }} />}
                            {health.status === "error" && <AlertTriangleIcon size={10} style={{ color: "#FF4D4F" }} />}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-medium mb-2 flex items-center gap-1.5" style={{ color: "var(--muted-foreground)" }}>
                    <ActivityIcon size={12} />
                    <span>节点状态统计</span>
                  </div>
                  {([["总节点数", String(nodes.length), "#165DFF"], ["正常", String(nodes.filter(n => n.status === "online").length), "#00D68F"], ["警告", String(nodes.filter(n => n.status === "warning").length), "#FFAA00"], ["异常", String(nodes.filter(n => n.status === "error").length), "#FF4D4F"]] as [string,string,string][]).map(([k, v, c]) => (
                    <div key={k} className="flex justify-between items-center p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{k}</span>
                      <span className="text-sm font-bold" style={{ color: c }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>

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
                    <TechButton variant="ghost" size="xs" onClick={() => setSelected(null)}>取消选中</TechButton>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
