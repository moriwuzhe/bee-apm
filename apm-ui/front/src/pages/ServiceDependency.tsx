import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { RefreshCw, GitBranch, ArrowRight } from "lucide-react";
import { useToast } from "../context/ToastContext";

const services = [
  { id: "api-gw",      name: "API Gateway",       lang: "Java",   qps: 4820, p99: 48,  err: 0.02, status: "online"  },
  { id: "order",       name: "order-service",      lang: "Java",   qps: 1240, p99: 352, err: 1.8,  status: "error"   },
  { id: "pay",         name: "payment-service",    lang: "Java",   qps: 420,  p99: 88,  err: 0.1,  status: "online"  },
  { id: "user",        name: "user-service",       lang: "Java",   qps: 2180, p99: 242, err: 0.5,  status: "warning" },
  { id: "inventory",   name: "inventory-service",  lang: "Go",     qps: 680,  p99: 32,  err: 0.0,  status: "online"  },
  { id: "search",      name: "search-service",     lang: "Python", qps: 3100, p99: 65,  err: 0.3,  status: "online"  },
  { id: "notify",      name: "notify-service",     lang: "Java",   qps: 380,  p99: 28,  err: 0.0,  status: "online"  },
  { id: "risk",        name: "risk-engine",        lang: "Java",   qps: 820,  p99: 120, err: 0.0,  status: "online"  },
];

const dependencies: Record<string, string[]> = {
  "api-gw":    ["order", "pay", "user", "inventory", "search"],
  "order":     ["pay", "inventory", "notify", "risk"],
  "pay":       ["risk", "notify"],
  "user":      ["notify"],
  "inventory": ["search"],
  "search":    [],
  "notify":    [],
  "risk":      [],
};

const statusColors: Record<string, string> = {
  online: "#00D68F",
  warning: "#FFAA00",
  error: "#FF4D4F",
};

const langColors: Record<string, string> = {
  Java: "#165DFF",
  Go: "#00D68F",
  Python: "#FFAA00",
};

const nodePositions: Record<string, { x: number; y: number }> = {
  "api-gw":    { x: 370, y: 60  },
  "order":     { x: 120, y: 200 },
  "pay":       { x: 310, y: 200 },
  "user":      { x: 500, y: 200 },
  "inventory": { x: 690, y: 200 },
  "search":    { x: 690, y: 340 },
  "notify":    { x: 310, y: 340 },
  "risk":      { x: 500, y: 340 },
};

export default function ServiceDependency() {
  const { showToast } = useToast();
  const [selected, setSelected] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);

  const focusServices = selected
    ? new Set([selected, ...(dependencies[selected] || []), ...Object.keys(dependencies).filter(k => (dependencies[k] || []).includes(selected!))])
    : new Set(services.map(s => s.id));

  const visibleSvcs = focusMode && selected ? services.filter(s => focusServices.has(s.id)) : services;
  const visibleIds = new Set(visibleSvcs.map(s => s.id));

  const selectedSvc = selected ? services.find(s => s.id === selected) : null;
  const deps = selected ? (dependencies[selected] || []) : [];
  const callers = selected ? Object.keys(dependencies).filter(k => (dependencies[k] || []).includes(selected!)) : [];

  return (
    <MainLayout title="服务依赖拓扑">
      <div data-cmp="ServiceDependency" className="space-y-4">
        <PageHeader
          title="服务依赖拓扑图"
          subtitle={`${services.length} 个微服务 · ${Object.values(dependencies).flat().length} 条依赖关系`}
          actions={
            <>
              <TechButton variant={focusMode ? "primary" : "secondary"} icon={<GitBranch size={13} />} onClick={() => setFocusMode(!focusMode)}>
                {focusMode ? "聚焦模式" : "全局模式"}
              </TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={() => { showToast("正在刷新服务依赖关系...", "info"); setTimeout(() => showToast("服务依赖刷新成功", "success"), 1000); }}>刷新</TechButton>
            </>
          }
        />

        <div className="flex gap-3">
          {/* Service list */}
          <div className="w-56 flex-shrink-0 rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-3 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>服务列表</div>
            {services.map((s) => (
              <div
                key={s.id}
                className="px-3 py-2.5 cursor-pointer transition-colors"
                style={{
                  borderBottom: "1px solid var(--border)",
                  background: selected === s.id ? "rgba(22,93,255,0.12)" : "transparent",
                  borderLeft: selected === s.id ? "2px solid #165DFF" : "2px solid transparent",
                }}
                onClick={() => setSelected(selected === s.id ? null : s.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-white truncate max-w-32">{s.name}</span>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusColors[s.status] ?? "#94A3B8" }} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-1 rounded" style={{ background: `${langColors[s.lang] ?? "#94A3B8"}1a`, color: langColors[s.lang] ?? "#94A3B8" }}>{s.lang}</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.qps} QPS</span>
                </div>
              </div>
            ))}
          </div>

          {/* Topology canvas */}
          <div className="flex-1 rounded-xl overflow-hidden relative" style={{ background: "#080E1A", border: "1px solid var(--border)", height: 480 }}>
            <svg width="100%" height="100%" viewBox="0 0 830 420">
              <defs>
                <pattern id="dots" x="0" y="0" width="25" height="25" patternUnits="userSpaceOnUse">
                  <circle cx="1" cy="1" r="0.6" fill="rgba(100,116,139,0.18)" />
                </pattern>
                <marker id="dep-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="rgba(22,93,255,0.7)" />
                </marker>
                <marker id="dep-arrow-hi" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill="#60A5FA" />
                </marker>
              </defs>
              <rect width="830" height="420" fill="url(#dots)" />

              {/* Edges */}
              {Object.entries(dependencies).map(([from, tos]) =>
                tos.map((to) => {
                  if (!visibleIds.has(from) || !visibleIds.has(to)) return null;
                  const fp = nodePositions[from];
                  const tp = nodePositions[to];
                  if (!fp || !tp) return null;
                  const isHighlighted = selected === from || selected === to;
                  const opacity = selected && !isHighlighted ? 0.08 : 1;
                  return (
                    <line
                      key={`${from}-${to}`}
                      x1={fp.x} y1={fp.y} x2={tp.x} y2={tp.y}
                      stroke={isHighlighted ? "#60A5FA" : "rgba(22,93,255,0.4)"}
                      strokeWidth={isHighlighted ? 2 : 1}
                      markerEnd={isHighlighted ? "url(#dep-arrow-hi)" : "url(#dep-arrow)"}
                      opacity={opacity}
                    />
                  );
                })
              )}

              {/* Nodes */}
              {visibleSvcs.map((s) => {
                const pos = nodePositions[s.id];
                if (!pos) return null;
                const isSelected = selected === s.id;
                const sc = statusColors[s.status] ?? "#94A3B8";
                const dimmed = selected && !focusServices.has(s.id);
                return (
                  <g
                    key={s.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    style={{ cursor: "pointer", opacity: dimmed ? 0.3 : 1 }}
                    onClick={() => setSelected(selected === s.id ? null : s.id)}
                  >
                    {/* Glow */}
                    {isSelected && <circle r={38} fill="rgba(22,93,255,0.1)" />}
                    {/* Body */}
                    <rect x={-50} y={-26} width={100} height={52} rx={8} fill={isSelected ? "rgba(22,93,255,0.25)" : "rgba(30,41,59,0.9)"} stroke={isSelected ? "#60A5FA" : sc} strokeWidth={isSelected ? 2 : 1.5} />
                    {/* Status dot */}
                    <circle cx={42} cy={-18} r={5} fill={sc} />
                    {/* Service name */}
                    <text y={-6} textAnchor="middle" fontSize="10" fill="rgba(226,232,240,0.95)" fontWeight="600">{s.name.replace("-service", "")}</text>
                    {/* QPS */}
                    <text y={12} textAnchor="middle" fontSize="9" fill="rgba(100,116,139,0.9)">{s.qps} QPS</text>
                    {/* Error rate */}
                    {s.err > 0 && <text y={25} textAnchor="middle" fontSize="9" fill={s.err > 1 ? "#FF4D4F" : "#FFAA00"}>ERR {s.err}%</text>}
                  </g>
                );
              })}
            </svg>

            {/* Legend */}
            <div className="absolute bottom-3 left-3 flex gap-3">
              {[["正常", "#00D68F"], ["警告", "#FFAA00"], ["异常", "#FF4D4F"]].map(([l, c]) => (
                <div key={l} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: c }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail panel */}
          <div className="w-60 flex-shrink-0 rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-3">
              {selectedSvc ? selectedSvc.name : "选择服务查看详情"}
            </div>
            {selectedSvc ? (
              <div className="space-y-3">
                <div className="p-3 rounded-md space-y-2" style={{ background: "var(--muted)" }}>
                  {[["QPS", `${selectedSvc.qps}/s`], ["P99延迟", `${selectedSvc.p99}ms`], ["错误率", `${selectedSvc.err}%`], ["语言", selectedSvc.lang]].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                      <span className="text-white font-medium">{v}</span>
                    </div>
                  ))}
                </div>
                {callers.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>上游调用者 ({callers.length})</div>
                    {callers.map((c) => {
                      const cs = services.find(s => s.id === c);
                      return cs ? (
                        <div key={c} className="flex items-center gap-1.5 p-2 rounded mb-1" style={{ background: "var(--muted)" }}>
                          <div className="w-2 h-2 rounded-full" style={{ background: statusColors[cs.status] ?? "#94A3B8" }} />
                          <span className="text-xs text-white">{cs.name}</span>
                          <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
                {deps.length > 0 && (
                  <div>
                    <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>下游依赖 ({deps.length})</div>
                    {deps.map((d) => {
                      const ds = services.find(s => s.id === d);
                      return ds ? (
                        <div key={d} className="flex items-center gap-1.5 p-2 rounded mb-1" style={{ background: "var(--muted)" }}>
                          <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />
                          <div className="w-2 h-2 rounded-full" style={{ background: statusColors[ds.status] ?? "#94A3B8" }} />
                          <span className="text-xs text-white">{ds.name}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-center py-12" style={{ color: "var(--muted-foreground)" }}>点击画布中的服务节点</div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
