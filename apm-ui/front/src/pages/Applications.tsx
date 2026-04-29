import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Monitor, Cpu, HardDrive, Clock, ExternalLink, Settings } from "lucide-react";

const apps = [
  { id: 1, name: "order-service",     project: "电商核心平台", status: "error",   ip: "192.168.1.10", agent: "v2.4.1", runtime: "12d 4h", jvm: "JDK17", heap: 92, uptime: "98.2%",  inst: 3 },
  { id: 2, name: "payment-gateway",   project: "电商核心平台", status: "online",  ip: "192.168.1.11", agent: "v2.4.1", runtime: "24d 2h", jvm: "JDK11", heap: 65, uptime: "99.9%",  inst: 2 },
  { id: 3, name: "user-service",      project: "电商核心平台", status: "warning",  ip: "192.168.1.12", agent: "v2.3.8", runtime: "8d 16h",  jvm: "JDK17", heap: 78, uptime: "97.5%",  inst: 4 },
  { id: 4, name: "inventory-service", project: "电商核心平台", status: "online",  ip: "192.168.1.13", agent: "v2.4.1", runtime: "30d 0h",  jvm: "JDK11", heap: 45, uptime: "99.8%",  inst: 2 },
  { id: 5, name: "route-scheduler",   project: "物流调度系统", status: "warning",  ip: "192.168.2.10", agent: "v2.4.0", runtime: "5d 8h",   jvm: "JDK17", heap: 82, uptime: "96.1%",  inst: 3 },
  { id: 6, name: "track-service",     project: "物流调度系统", status: "online",  ip: "192.168.2.11", agent: "v2.4.1", runtime: "15d 12h", jvm: "JDK11", heap: 52, uptime: "99.6%",  inst: 2 },
  { id: 7, name: "analytics-core",    project: "数据分析平台", status: "online",  ip: "192.168.3.10", agent: "v2.4.1", runtime: "20d 6h",  jvm: "JDK17", heap: 71, uptime: "99.7%",  inst: 5 },
  { id: 8, name: "growth-engine",     project: "用户增长系统", status: "offline", ip: "192.168.4.10", agent: "-",      runtime: "-",       jvm: "JDK11", heap: 0,  uptime: "0%",     inst: 0 },
  { id: 9, name: "sms-gateway",       project: "消息通知中心", status: "online",  ip: "192.168.5.10", agent: "v2.4.1", runtime: "60d 0h",  jvm: "JDK11", heap: 38, uptime: "100%",   inst: 2 },
];

function HeapBar({ value = 0 }: { value?: number }) {
  const color = value > 85 ? "#FF4D4F" : value > 70 ? "#FFAA00" : "#00D68F";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.15)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{value}%</span>
    </div>
  );
}

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);

  const filtered = apps.filter(
    (a) =>
      (statusFilter === "all" || a.status === statusFilter) &&
      a.name.includes(search)
  );

  const selectedApp = apps.find((a) => a.id === selected);

  return (
    <MainLayout title="应用管理">
      <div data-cmp="Applications" className="space-y-4">
        <PageHeader
          title="应用管理"
          subtitle={`共 ${apps.length} 个应用，${apps.filter(a => a.status === "online").length} 在线`}
          actions={
            <>
              <TechButton variant="secondary">批量操作</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />}>接入应用</TechButton>
            </>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索应用名称..." className="bg-transparent border-none outline-none text-xs flex-1 text-white" />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {[["all", "全部"], ["online", "在线"], ["warning", "警告"], ["error", "异常"], ["offline", "离线"]].map(([val, label]) => (
              <button key={val} onClick={() => setStatusFilter(val)} className="px-3 py-1 rounded text-xs transition-colors" style={{ background: statusFilter === val ? "#165DFF" : "transparent", color: statusFilter === val ? "#fff" : "var(--muted-foreground)" }}>{label}</button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {/* Table */}
          <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                  {["应用名称", "所属项目", "状态", "实例IP", "Agent版本", "运行时长", "堆内存", "实例数", "操作"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr
                    key={app.id}
                    className="table-row-hover transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--border)", background: selected === app.id ? "rgba(22,93,255,0.08)" : "transparent" }}
                    onClick={() => setSelected(selected === app.id ? null : app.id)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                          <Monitor size={12} style={{ color: "#A855F7" }} />
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{app.project}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={app.status as "online" | "error" | "warning" | "offline"} /></td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{app.ip}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: app.agent === "-" ? "rgba(148,163,184,0.1)" : "rgba(22,93,255,0.1)", color: app.agent === "-" ? "#94A3B8" : "#165DFF" }}>{app.agent}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Clock size={11} />{app.runtime}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><HeapBar value={app.heap} /></td>
                    <td className="px-3 py-2.5 text-xs text-white">{app.inst}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <TechButton variant="ghost" size="xs" icon={<ExternalLink size={11} />}>监控</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Settings size={11} />}>配置</TechButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detail panel */}
          <div className={`w-72 rounded-lg p-4 flex-shrink-0 ${selectedApp ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Monitor size={14} style={{ color: "#A855F7" }} />
              {selectedApp?.name}
            </div>
            {selectedApp && (
              <div className="space-y-3">
                <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>JVM 基础信息</div>
                  <div className="space-y-1.5">
                    {[
                      ["JDK版本", selectedApp.jvm],
                      ["实例IP", selectedApp.ip],
                      ["Agent版本", selectedApp.agent],
                      ["运行时长", selectedApp.runtime],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>资源使用</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span style={{ color: "var(--muted-foreground)" }}>堆内存</span><span className="text-white">{selectedApp.heap}%</span></div>
                      <HeapBar value={selectedApp.heap} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>可用率</span>
                      <span style={{ color: "#00D68F" }}>{selectedApp.uptime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <TechButton variant="primary" size="xs">查看监控详情</TechButton>
                  <TechButton variant="secondary" size="xs" icon={<Settings size={12} />}>Agent 配置</TechButton>
                  <TechButton variant="ghost" size="xs">版本管理</TechButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
