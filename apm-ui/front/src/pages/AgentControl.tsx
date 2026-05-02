import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Cpu, RefreshCw, Download, Trash2, Upload, Zap, Package, Settings, Search, CheckCircle, X } from "lucide-react";
import { useToast } from "../context/ToastContext";

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
  name: string;
  version: string;
  status: "online" | "warning" | "offline";
  desc: string;
  loaded: boolean;
}

interface MarketPlugin {
  name: string;
  desc: string;
  hot: boolean;
}

const agents: Agent[] = [
  { id: 1, host: "192.168.1.10", app: "order-service", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 5, lastHb: "2s前", connected: true },
  { id: 2, host: "192.168.1.11", app: "payment-gateway", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 4, lastHb: "1s前", connected: true },
  { id: 3, host: "192.168.1.12", app: "user-service", version: "v2.3.8", status: "warning", os: "Linux x64", plugins: 3, lastHb: "15s前", connected: true },
  { id: 4, host: "192.168.2.10", app: "route-scheduler", version: "v2.4.0", status: "warning", os: "Linux x64", plugins: 4, lastHb: "32s前", connected: true },
  { id: 5, host: "192.168.4.10", app: "growth-engine", version: "v2.3.5", status: "offline", os: "Linux x64", plugins: 0, lastHb: "2h前", connected: false },
  { id: 6, host: "192.168.5.10", app: "sms-gateway", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 3, lastHb: "3s前", connected: true },
];

const installedPlugins: Plugin[] = [
  { name: "JVM监控插件", version: "1.3.2", status: "online", desc: "堆内存、GC、线程监控", loaded: true },
  { name: "HTTP追踪插件", version: "1.2.0", status: "online", desc: "请求链路追踪与耗时统计", loaded: true },
  { name: "SQL监控插件", version: "1.1.5", status: "warning", desc: "慢SQL捕获与分析", loaded: true },
  { name: "系统资源插件", version: "1.4.1", status: "online", desc: "CPU/内存/磁盘IO监控", loaded: true },
  { name: "日志采集插件", version: "1.0.8", status: "offline", desc: "应用日志采集与告警", loaded: false },
];

const marketPlugins: MarketPlugin[] = [
  { name: "Redis监控插件", desc: "Redis连接池与命中率监控", hot: true },
  { name: "MQ消息插件", desc: "Kafka/RabbitMQ消息追踪", hot: true },
  { name: "链路追踪插件", desc: "分布式Trace全链路追踪", hot: false },
  { name: "网络流量插件", desc: "网络带宽与连接数监控", hot: false },
  { name: "线程分析插件", desc: "线程池状态与死锁检测", hot: true },
];

export default function AgentControl() {
  const { showToast } = useToast();
  const [tab, setTab] = useState<"list" | "plugins" | "market">("list");
  const [selectedAgent, setSelectedAgent] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filteredAgents = agents.filter(agent =>
    (searchKeyword === "" || agent.host.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    agent.app.toLowerCase().includes(searchKeyword.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredAgents.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedAgents = filteredAgents.slice(startIndex, startIndex + pageSize);

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

  const handleAction = (action: string, agent?: Agent, pluginName?: string) => {
    switch (action) {
      case "globalRefresh":
        showToast("正在刷新所有Agent节点...", "info");
        setTimeout(() => showToast("刷新完成", "success"), 1000);
        break;
      case "batchUpgrade":
        const outdatedAgents = agents.filter(a => a.version !== "v2.4.1").length;
        if (outdatedAgents === 0) {
          showToast("所有节点已是最新版本", "success");
        } else {
          confirmOperation(`确定要升级 ${outdatedAgents} 个节点吗？`, () => {
            showToast("正在一键升级...", "info");
            setTimeout(() => showToast(`成功升级 ${outdatedAgents} 个节点`, "success"), 1500);
          });
        }
        break;
      case "config":
        showToast(`正在打开 ${agent?.host} 的配置面板...`, "info");
        break;
      case "restart":
        confirmOperation(`确定要重启 ${agent?.host} 吗？`, () => {
          showToast(`正在重启 ${agent?.host}...`, "info");
          setTimeout(() => showToast(`${agent?.host} 重启成功`, "success"), 1500);
        });
        break;
      case "upgrade":
        confirmOperation(`确定要升级 ${agent?.host} 到最新版本吗？`, () => {
          showToast(`正在升级 ${agent?.host}...`, "info");
          setTimeout(() => showToast(`${agent?.host} 升级成功`, "success"), 1500);
        });
        break;
      case "hotReload":
        showToast(`正在热加载 ${agent?.host} 配置...`, "info");
        setTimeout(() => showToast(`${agent?.host} 配置热加载成功`, "success"), 1000);
        break;
      case "uninstallAgent":
        confirmOperation(`确定要卸载 ${agent?.host} 的Agent吗？此操作将停止监控。`, () => {
          showToast(`正在卸载 ${agent?.host} 的Agent...`, "info");
          setTimeout(() => showToast(`${agent?.host} 的Agent已卸载`, "success"), 1500);
        });
        break;
      case "pluginHotReload":
        showToast(`正在热加载 ${pluginName}...`, "info");
        setTimeout(() => showToast(`${pluginName} 热加载成功`, "success"), 1000);
        break;
      case "uninstallPlugin":
        confirmOperation(`确定要卸载 ${pluginName} 吗？`, () => {
          showToast(`正在卸载 ${pluginName}...`, "info");
          setTimeout(() => showToast(`${pluginName} 已卸载`, "success"), 1000);
        });
        break;
      case "installPlugin":
        showToast(`正在安装 ${pluginName}...`, "info");
        setTimeout(() => showToast(`${pluginName} 安装成功`, "success"), 1500);
        break;
      default:
        break;
    }
  };

  const confirmOperation = (message: string, onConfirm: () => void) => {
    setConfirmMessage(message);
    setConfirmAction(onConfirm);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    if (confirmAction) {
      confirmAction();
    }
    setShowConfirmModal(false);
    setConfirmAction(null);
    setConfirmMessage("");
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  return (
    <MainLayout title="Agent管控中心">
      <div data-cmp="AgentControl" className="space-y-4">
        <PageHeader
          title="Agent 管控中心"
          subtitle={`${agents.filter(a => a.status === "online").length}/${agents.length} 节点在线`}
          actions={
            <>
              <div className="flex items-center gap-2 px-2 h-7 rounded-md mr-2" style={{ background: "var(--input)", border: "1px solid var(--border)", width: "180px" }}>
                <Search size={12} style={{ color: "var(--muted-foreground)" }} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="搜索Agent节点..."
                  className="bg-transparent border-none outline-none text-xs flex-1 text-white"
                />
              </div>
              <TechButton variant="primary" icon={<Search size={12} />} onClick={handleSearch} loading={searching} size="sm">查询</TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={() => handleAction("globalRefresh")}>全局刷新</TechButton>
              <TechButton variant="primary" icon={<Upload size={13} />} onClick={() => handleAction("batchUpgrade")}>一键升级</TechButton>
            </>
          }
        />

        <div className="flex gap-3">
          {[
            { label: "在线节点", value: agents.filter(a => a.status === "online").length, color: "#00D68F" },
            { label: "异常节点", value: agents.filter(a => a.status === "warning").length, color: "#FFAA00" },
            { label: "离线节点", value: agents.filter(a => a.status === "offline").length, color: "#94A3B8" },
            { label: "需升级", value: agents.filter(a => a.version !== "v2.4.1").length, color: "#165DFF" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `${s.color}1a`, color: s.color }}>{s.value}</div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                  {["主机IP", "关联应用", "版本", "状态", "插件数", "心跳", "操作"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedAgents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                      未找到匹配的Agent节点
                    </td>
                  </tr>
                ) : (
                  paginatedAgents.map((ag) => (
                    <tr
                      key={ag.id}
                      className="table-row-hover transition-colors cursor-pointer"
                      style={{ borderBottom: "1px solid var(--border)", background: selectedAgent === ag.id ? "rgba(22,93,255,0.08)" : "transparent" }}
                      onClick={() => setSelectedAgent(ag.id)}
                    >
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <Cpu size={13} style={{ color: "#165DFF" }} />
                          <span className="text-xs font-medium text-white" style={{ fontFamily: "monospace" }}>{ag.host}</span>
                        </div>
                      </td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ag.app}</td>
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: ag.version === "v2.4.1" ? "rgba(0,214,143,0.1)" : "rgba(255,170,0,0.1)", color: ag.version === "v2.4.1" ? "#00D68F" : "#FFAA00" }}>{ag.version}</span>
                      </td>
                      <td className="px-4 py-2.5"><StatusBadge status={ag.status} /></td>
                      <td className="px-4 py-2.5 text-xs text-white">{ag.plugins}</td>
                      <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ag.lastHb}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex items-center gap-1">
                          <TechButton variant="ghost" size="xs" icon={<Settings size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("config", ag); }}>配置</TechButton>
                          <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("restart", ag); }}>重启</TechButton>
                          <TechButton variant="ghost" size="xs" icon={<Download size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("upgrade", ag); }}>升级</TechButton>
                        </div>
                      </td>
                    </tr>
                  )))}
              </tbody>
            </table>
            <div className="flex items-center justify-between py-3 px-4" style={{ borderTop: "1px solid var(--border)" }}>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                显示第 {startIndex + 1} - {Math.min(startIndex + pageSize, filteredAgents.length)} 条，共 {filteredAgents.length} 条
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

          <div className="w-80 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
              {[["list", "节点详情"], ["plugins", "已安装插件"], ["market", "插件市场"]].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "list" | "plugins" | "market")}
                  className="flex-1 py-2.5 text-xs font-medium transition-colors"
                  style={{ color: tab === key ? "#165DFF" : "var(--muted-foreground)", borderBottom: tab === key ? "2px solid #165DFF" : "2px solid transparent" }}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={`p-4 ${tab === "list" ? "" : "hidden"}`}>
              {selectedAgentData ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                      <Cpu size={16} style={{ color: "#165DFF" }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{selectedAgentData.host}</div>
                      <StatusBadge status={selectedAgentData.status} />
                    </div>
                  </div>
                  <div className="p-3 rounded-md space-y-2" style={{ background: "var(--muted)" }}>
                    {[["操作系统", selectedAgentData.os], ["Agent版本", selectedAgentData.version], ["关联应用", selectedAgentData.app], ["插件数量", String(selectedAgentData.plugins)], ["最后心跳", selectedAgentData.lastHb]].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <TechButton variant="primary" size="xs" icon={<Zap size={12} />} onClick={() => handleAction("hotReload", selectedAgentData)}>热加载配置</TechButton>
                    <TechButton variant="secondary" size="xs" icon={<Upload size={12} />} onClick={() => handleAction("upgrade", selectedAgentData)}>版本升级</TechButton>
                    <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleAction("uninstallAgent", selectedAgentData)}>卸载 Agent</TechButton>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-center py-8" style={{ color: "var(--muted-foreground)" }}>请选择 Agent 节点</div>
              )}
            </div>

            <div className={`p-4 ${tab === "plugins" ? "" : "hidden"}`}>
              <div className="space-y-2">
                {installedPlugins.map((p, i) => (
                  <div key={i} className="p-3 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Package size={12} style={{ color: "#165DFF" }} />
                        <span className="text-xs font-medium text-white">{p.name}</span>
                      </div>
                      <StatusBadge status={p.status} />
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{p.version}</span>
                      <div className="flex gap-1">
                        <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={() => handleAction("pluginHotReload", undefined, p.name)}>热加载</TechButton>
                        <TechButton variant="danger" size="xs" icon={<Trash2 size={11} />} onClick={() => handleAction("uninstallPlugin", undefined, p.name)}>卸载</TechButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`p-4 ${tab === "market" ? "" : "hidden"}`}>
              <div className="space-y-2">
                {marketPlugins.map((p, i) => (
                  <div key={i} className="p-3 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Package size={12} style={{ color: "#A855F7" }} />
                        <span className="text-xs font-medium text-white">{p.name}</span>
                        {p.hot && <span className="text-xs px-1 rounded" style={{ background: "rgba(255,77,79,0.1)", color: "#FF4D4F" }}>热门</span>}
                      </div>
                      <TechButton variant="primary" size="xs" icon={<Download size={11} />} onClick={() => handleAction("installPlugin", undefined, p.name)}>安装</TechButton>
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowConfirmModal(false)}>
          <div className="w-[400px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowConfirmModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle size={15} style={{ color: "#FFAA00" }} />确认操作
            </div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>{confirmMessage}</div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowConfirmModal(false)}>取消</TechButton>
              <TechButton variant="danger" onClick={handleConfirm}>确认</TechButton>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
