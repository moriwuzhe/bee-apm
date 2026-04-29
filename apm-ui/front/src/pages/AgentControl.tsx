import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Cpu, RefreshCw, Download, Trash2, Upload, Zap, Package, Settings, Search, CheckCircle } from "lucide-react";

const agents = [
  { id: 1, host: "192.168.1.10", app: "order-service",     version: "v2.4.1", status: "online",  os: "Linux x64", plugins: 5, lastHb: "2s前",   connected: true  },
  { id: 2, host: "192.168.1.11", app: "payment-gateway",   version: "v2.4.1", status: "online",  os: "Linux x64", plugins: 4, lastHb: "1s前",   connected: true  },
  { id: 3, host: "192.168.1.12", app: "user-service",      version: "v2.3.8", status: "warning",  os: "Linux x64", plugins: 3, lastHb: "15s前",  connected: true  },
  { id: 4, host: "192.168.2.10", app: "route-scheduler",   version: "v2.4.0", status: "warning",  os: "Linux x64", plugins: 4, lastHb: "32s前",  connected: true  },
  { id: 5, host: "192.168.4.10", app: "growth-engine",     version: "v2.3.5", status: "offline", os: "Linux x64", plugins: 0, lastHb: "2h前",   connected: false },
  { id: 6, host: "192.168.5.10", app: "sms-gateway",       version: "v2.4.1", status: "online",  os: "Linux x64", plugins: 3, lastHb: "3s前",   connected: true  },
];

const installedPlugins = [
  { name: "JVM监控插件",    version: "1.3.2", status: "online", desc: "堆内存、GC、线程监控",    loaded: true  },
  { name: "HTTP追踪插件",   version: "1.2.0", status: "online", desc: "请求链路追踪与耗时统计",   loaded: true  },
  { name: "SQL监控插件",    version: "1.1.5", status: "warning", desc: "慢SQL捕获与分析",         loaded: true  },
  { name: "系统资源插件",   version: "1.4.1", status: "online", desc: "CPU/内存/磁盘IO监控",      loaded: true  },
  { name: "日志采集插件",   version: "1.0.8", status: "offline", desc: "应用日志采集与告警",       loaded: false },
];

const marketPlugins = [
  { name: "Redis监控插件",   desc: "Redis连接池与命中率监控",     hot: true  },
  { name: "MQ消息插件",      desc: "Kafka/RabbitMQ消息追踪",     hot: true  },
  { name: "链路追踪插件",    desc: "分布式Trace全链路追踪",       hot: false },
  { name: "网络流量插件",    desc: "网络带宽与连接数监控",         hot: false },
  { name: "线程分析插件",    desc: "线程池状态与死锁检测",         hot: true  },
];

export default function AgentControl() {
  const [tab, setTab] = useState<"list" | "plugins" | "market">("list");
  const [selectedAgent, setSelectedAgent] = useState<number>(1);

  return (
    <MainLayout title="Agent管控中心">
      <div data-cmp="AgentControl" className="space-y-4">
        <PageHeader
          title="Agent 管控中心"
          subtitle={`${agents.filter(a => a.status === "online").length}/${agents.length} 节点在线`}
          actions={
            <>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />}>全局刷新</TechButton>
              <TechButton variant="primary" icon={<Upload size={13} />}>一键升级</TechButton>
            </>
          }
        />

        {/* Stat cards */}
        <div className="flex gap-3">
          {[
            { label: "在线节点", value: agents.filter(a => a.status === "online").length, color: "#00D68F" },
            { label: "异常节点", value: agents.filter(a => a.status === "warning").length, color: "#FFAA00" },
            { label: "离线节点", value: agents.filter(a => a.status === "offline").length, color: "#94A3B8" },
            { label: "需升级",  value: agents.filter(a => a.version !== "v2.4.1").length, color: "#165DFF" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg p-3 flex items-center gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: `${s.color}1a`, color: s.color }}>{s.value}</div>
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{s.label}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Agent list */}
          <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <Search size={13} style={{ color: "var(--muted-foreground)" }} />
              <input placeholder="搜索Agent节点..." className="bg-transparent border-none outline-none text-xs flex-1 text-white" />
            </div>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                  {["主机IP", "关联应用", "版本", "状态", "插件数", "心跳", "操作"].map((h) => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {agents.map((ag) => (
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
                    <td className="px-4 py-2.5"><StatusBadge status={ag.status as "online" | "warning" | "offline"} /></td>
                    <td className="px-4 py-2.5 text-xs text-white">{ag.plugins}</td>
                    <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{ag.lastHb}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <TechButton variant="ghost" size="xs" icon={<Settings size={11} />}>配置</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />}>重启</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Download size={11} />}>升级</TechButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right panel - plugin management */}
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

            {/* Detail tab */}
            <div className={`p-4 ${tab === "list" ? "" : "hidden"}`}>
              {(() => {
                const ag = agents.find(a => a.id === selectedAgent);
                return ag ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                        <Cpu size={16} style={{ color: "#165DFF" }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{ag.host}</div>
                        <StatusBadge status={ag.status as "online" | "warning" | "offline"} />
                      </div>
                    </div>
                    <div className="p-3 rounded-md space-y-2" style={{ background: "var(--muted)" }}>
                      {[["操作系统", ag.os], ["Agent版本", ag.version], ["关联应用", ag.app], ["插件数量", String(ag.plugins)], ["最后心跳", ag.lastHb]].map(([k, v]) => (
                        <div key={k} className="flex justify-between text-xs">
                          <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                          <span className="text-white font-medium">{v}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-2">
                      <TechButton variant="primary" size="xs" icon={<Zap size={12} />}>热加载配置</TechButton>
                      <TechButton variant="secondary" size="xs" icon={<Upload size={12} />}>版本升级</TechButton>
                      <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />}>卸载 Agent</TechButton>
                    </div>
                  </div>
                ) : <div className="text-xs text-center py-8" style={{ color: "var(--muted-foreground)" }}>请选择 Agent 节点</div>;
              })()}
            </div>

            {/* Plugins tab */}
            <div className={`p-4 ${tab === "plugins" ? "" : "hidden"}`}>
              <div className="space-y-2">
                {installedPlugins.map((p, i) => (
                  <div key={i} className="p-3 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <Package size={12} style={{ color: "#165DFF" }} />
                        <span className="text-xs font-medium text-white">{p.name}</span>
                      </div>
                      <StatusBadge status={p.status as "online" | "warning" | "offline"} />
                    </div>
                    <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{p.version}</span>
                      <div className="flex gap-1">
                        <TechButton variant="ghost" size="xs" icon={<RefreshCw size={11} />}>热加载</TechButton>
                        <TechButton variant="danger" size="xs" icon={<Trash2 size={11} />}>卸载</TechButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Market tab */}
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
                      <TechButton variant="primary" size="xs" icon={<Download size={11} />}>安装</TechButton>
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
