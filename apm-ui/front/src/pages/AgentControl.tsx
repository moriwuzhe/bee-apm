import { useState, useMemo, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Cpu, RefreshCw, Download, Trash2, Upload, Zap, Package, Settings, X, CheckCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { SearchBar, Pagination } from "@/components/business";
import { agentsApi } from "../services/api";

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
  const [search, setSearch] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

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
          plugins: Math.floor(Math.random() * 5) + 1,
          lastHb: agent.lastHb || "just now",
          connected: agent.status === "online",
        }));
        setAgents(mappedAgents);
        showToast("Agent数据加载成功", "success");
      } else {
        setAgents([
          { id: 1, host: "192.168.1.10", app: "order-service", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 5, lastHb: "2s前", connected: true },
          { id: 2, host: "192.168.1.11", app: "payment-gateway", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 4, lastHb: "1s前", connected: true },
          { id: 3, host: "192.168.1.12", app: "user-service", version: "v2.3.8", status: "warning", os: "Linux x64", plugins: 3, lastHb: "15s前", connected: true },
        ]);
      }
    } catch (error) {
      console.error("Failed to load agents:", error);
      setAgents([
        { id: 1, host: "192.168.1.10", app: "order-service", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 5, lastHb: "2s前", connected: true },
        { id: 2, host: "192.168.1.11", app: "payment-gateway", version: "v2.4.1", status: "online", os: "Linux x64", plugins: 4, lastHb: "1s前", connected: true },
        { id: 3, host: "192.168.1.12", app: "user-service", version: "v2.3.8", status: "warning", os: "Linux x64", plugins: 3, lastHb: "15s前", connected: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAgents();
  }, []);

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
    setConfirmAction(onConfirm);
    setShowConfirmModal(true);
  };

  const handleConfirm = () => {
    confirmAction?.();
    setShowConfirmModal(false);
    setConfirmAction(null);
  };

  const handleAction = (action: string, agent?: Agent, pluginName?: string) => {
    switch (action) {
      case "globalRefresh":
        showToast("正在刷新所有Agent节点...", "info");
        setTimeout(() => showToast("刷新完成", "success"), 1000);
        break;
      case "batchUpgrade": {
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
      }
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
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);

  const stats = [
    { label: "在线节点", value: agents.filter(a => a.status === "online").length, color: "#00D68F" },
    { label: "异常节点", value: agents.filter(a => a.status === "warning").length, color: "#FFAA00" },
    { label: "离线节点", value: agents.filter(a => a.status === "offline").length, color: "#94A3B8" },
    { label: "需升级", value: agents.filter(a => a.version !== "v2.4.1").length, color: "#165DFF" },
  ];

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
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={() => handleAction("globalRefresh")}>全局刷新</TechButton>
              <TechButton variant="primary" icon={<Upload size={13} />} onClick={() => handleAction("batchUpgrade")}>一键升级</TechButton>
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

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg overflow-hidden bg-card border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-blue-500/5">
                  {["主机IP", "关联应用", "版本", "状态", "插件数", "心跳", "操作"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-xs text-muted-foreground">未找到匹配的Agent节点</td>
                  </tr>
                ) : (
                  paginatedData.map((ag) => (
                    <tr
                      key={ag.id}
                      className={`table-row-hover transition-colors cursor-pointer border-b border-border ${selectedAgent === ag.id ? "bg-blue-500/8" : ""}`}
                      onClick={() => setSelectedAgent(ag.id)}
                    >
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
                          <TechButton variant="ghost" size="xs" icon={<Settings size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("config", ag); }}>配置</TechButton>
                          <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("restart", ag); }}>重启</TechButton>
                          <TechButton variant="ghost" size="xs" icon={<Download size={11} />} onClick={(e) => { e.stopPropagation(); handleAction("upgrade", ag); }}>升级</TechButton>
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

          <div className="w-80 rounded-lg flex-shrink-0 overflow-hidden bg-card border border-border">
            <div className="flex border-b border-border">
              {([["list", "节点详情"], ["plugins", "已安装插件"], ["market", "插件市场"]] as [string, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "list" | "plugins" | "market")}
                  className={`flex-1 py-2.5 text-xs font-medium transition-colors ${tab === key ? "text-blue-500 border-b-2 border-blue-500" : "text-muted-foreground"}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className={`p-4 ${tab === "list" ? "" : "hidden"}`}>
              {selectedAgentData ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/15">
                      <Cpu size={16} className="text-blue-500" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">{selectedAgentData.host}</div>
                      <StatusBadge status={selectedAgentData.status} />
                    </div>
                  </div>
                  <div className="p-3 rounded-md space-y-2 bg-muted">
                    {([["操作系统", selectedAgentData.os], ["Agent版本", selectedAgentData.version], ["关联应用", selectedAgentData.app], ["插件数量", String(selectedAgentData.plugins)], ["最后心跳", selectedAgentData.lastHb]] as [string, string][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
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
                <div className="text-xs text-center py-8 text-muted-foreground">请选择 Agent 节点</div>
              )}
            </div>

            <div className={`p-4 space-y-2 ${tab === "plugins" ? "" : "hidden"}`}>
              {installedPlugins.map((p, i) => (
                <div key={i} className="p-3 rounded-md bg-muted border border-border">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-blue-500" />
                      <span className="text-xs font-medium text-white">{p.name}</span>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs mb-2 text-muted-foreground">{p.desc}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500">{p.version}</span>
                    <div className="flex gap-1">
                      <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />} onClick={() => handleAction("pluginHotReload", undefined, p.name)}>热加载</TechButton>
                      <TechButton variant="danger" size="xs" icon={<Trash2 size={11} />} onClick={() => handleAction("uninstallPlugin", undefined, p.name)}>卸载</TechButton>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-4 space-y-2 ${tab === "market" ? "" : "hidden"}`}>
              {marketPlugins.map((p, i) => (
                <div key={i} className="p-3 rounded-md bg-muted border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <Package size={12} className="text-purple-500" />
                      <span className="text-xs font-medium text-white">{p.name}</span>
                      {p.hot && <span className="text-xs px-1 rounded bg-red-500/10 text-red-500">热门</span>}
                    </div>
                    <TechButton variant="primary" size="xs" icon={<Download size={11} />} onClick={() => handleAction("installPlugin", undefined, p.name)}>安装</TechButton>
                  </div>
                  <div className="text-xs text-muted-foreground">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

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
    </MainLayout>
  );
}
