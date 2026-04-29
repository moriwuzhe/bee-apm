import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { Plus, Search, Key, Edit2, Trash2, ChevronRight } from "lucide-react";

const permTree = [
  {
    module: "项目管理",
    icon: "📁",
    color: "#165DFF",
    permissions: [
      { key: "project:view",   name: "查看项目",   method: "GET",    path: "/api/projects",       desc: "获取项目列表和详情" },
      { key: "project:create", name: "创建项目",   method: "POST",   path: "/api/projects",       desc: "新建项目" },
      { key: "project:edit",   name: "编辑项目",   method: "PUT",    path: "/api/projects/:id",   desc: "修改项目信息" },
      { key: "project:delete", name: "删除项目",   method: "DELETE", path: "/api/projects/:id",   desc: "删除项目（不可恢复）" },
    ],
  },
  {
    module: "应用管理",
    icon: "🚀",
    color: "#A855F7",
    permissions: [
      { key: "app:view",   name: "查看应用",   method: "GET",    path: "/api/apps",         desc: "获取应用列表和详情" },
      { key: "app:create", name: "创建应用",   method: "POST",   path: "/api/apps",         desc: "新建应用" },
      { key: "app:edit",   name: "编辑应用",   method: "PUT",    path: "/api/apps/:id",     desc: "修改应用配置" },
      { key: "app:deploy", name: "部署应用",   method: "POST",   path: "/api/apps/:id/deploy", desc: "触发应用部署" },
    ],
  },
  {
    module: "监控运维",
    icon: "📊",
    color: "#00D68F",
    permissions: [
      { key: "monitor:view",  name: "查看监控",   method: "GET",  path: "/api/monitor/**",  desc: "访问所有监控数据" },
      { key: "monitor:alert", name: "告警配置",   method: "PUT",  path: "/api/alerts",      desc: "配置告警规则" },
      { key: "agent:manage",  name: "Agent管控",  method: "POST", path: "/api/agents/**",   desc: "控制Agent节点" },
      { key: "jvm:view",      name: "JVM监控",    method: "GET",  path: "/api/jvm/**",      desc: "访问JVM监控数据" },
    ],
  },
  {
    module: "版本发布",
    icon: "📦",
    color: "#FFAA00",
    permissions: [
      { key: "release:view",     name: "查看发布",   method: "GET",    path: "/api/releases",           desc: "查看发布历史" },
      { key: "release:create",   name: "创建发布",   method: "POST",   path: "/api/releases",           desc: "创建新发布" },
      { key: "release:rollback", name: "回滚版本",   method: "POST",   path: "/api/releases/:id/rollback", desc: "执行版本回滚" },
    ],
  },
  {
    module: "拓扑图谱",
    icon: "🔗",
    color: "#60A5FA",
    permissions: [
      { key: "topology:view", name: "网络拓扑", method: "GET", path: "/api/topology", desc: "查看网络拓扑图" },
      { key: "service:view",  name: "服务依赖", method: "GET", path: "/api/services/deps", desc: "查看服务依赖关系" },
    ],
  },
  {
    module: "系统设置",
    icon: "⚙️",
    color: "#FF4D4F",
    permissions: [
      { key: "user:manage",   name: "用户管理",   method: "ALL",    path: "/api/users/**",   desc: "完整的用户管理权限" },
      { key: "role:manage",   name: "角色管理",   method: "ALL",    path: "/api/roles/**",   desc: "完整的角色管理权限" },
      { key: "perm:manage",   name: "权限管理",   method: "ALL",    path: "/api/perms/**",   desc: "完整的权限管理权限" },
      { key: "system:config", name: "系统配置",   method: "ALL",    path: "/api/system/**",  desc: "系统级配置修改" },
    ],
  },
];

const methodColors: Record<string, { bg: string; color: string }> = {
  GET:    { bg: "rgba(0,214,143,0.1)",  color: "#00D68F" },
  POST:   { bg: "rgba(22,93,255,0.1)",  color: "#165DFF" },
  PUT:    { bg: "rgba(255,170,0,0.1)",  color: "#FFAA00" },
  DELETE: { bg: "rgba(255,77,79,0.1)",  color: "#FF4D4F" },
  ALL:    { bg: "rgba(168,85,247,0.1)", color: "#A855F7" },
};

export default function Permissions() {
  const [expandedModules, setExpandedModules] = useState(new Set(permTree.map(m => m.module)));
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const toggleModule = (mod: string) => {
    const next = new Set(expandedModules);
    if (next.has(mod)) next.delete(mod); else next.add(mod);
    setExpandedModules(next);
  };

  const filtered = permTree.map(m => ({
    ...m,
    permissions: m.permissions.filter(p =>
      !search || p.name.includes(search) || p.key.includes(search) || p.path.includes(search)
    ),
  })).filter(m => m.permissions.length > 0);

  const totalPerms = permTree.reduce((a, m) => a + m.permissions.length, 0);

  return (
    <MainLayout title="权限管理">
      <div data-cmp="Permissions" className="space-y-4">
        <PageHeader
          title="权限管理"
          subtitle={`${permTree.length} 个模块 · ${totalPerms} 个权限点`}
          actions={
            <>
              <div className="flex items-center gap-2 px-3 h-8 rounded-md" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
                <Search size={13} style={{ color: "var(--muted-foreground)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索权限..." className="bg-transparent border-none outline-none text-xs" style={{ color: "var(--foreground)", width: 160 }} />
              </div>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>新建权限</TechButton>
            </>
          }
        />

        {/* Stats */}
        <div className="flex gap-3">
          {permTree.slice(0, 4).map(m => (
            <div key={m.module} className="flex-1 rounded-lg px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm">{m.icon}</span>
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.module}</span>
              </div>
              <div className="text-xl font-bold" style={{ color: m.color }}>{m.permissions.length}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>个权限</div>
            </div>
          ))}
        </div>

        {/* Permission tree */}
        <div className="space-y-2">
          {filtered.map((m) => {
            const expanded = expandedModules.has(m.module);
            return (
              <div key={m.module} className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                {/* Module header */}
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer"
                  style={{ borderBottom: expanded ? "1px solid var(--border)" : "none", background: expanded ? `${m.color}08` : "transparent" }}
                  onClick={() => toggleModule(m.module)}
                >
                  <span className="text-base">{m.icon}</span>
                  <span className="text-sm font-medium text-white">{m.module}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${m.color}1a`, color: m.color }}>{m.permissions.length} 个权限</span>
                  <div className="flex-1" />
                  <ChevronRight size={14} style={{ color: "var(--muted-foreground)", transform: expanded ? "rotate(90deg)" : "", transition: "transform 0.2s" }} />
                </div>

                {/* Permissions */}
                <div className={expanded ? "" : "hidden"}>
                  <table className="w-full border-collapse">
                    <thead>
                      <tr style={{ background: "rgba(15,23,42,0.5)" }}>
                        {["权限名称", "权限标识", "HTTP方法", "接口路径", "说明", "操作"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {m.permissions.map((p, i) => {
                        const mc = methodColors[p.method] || methodColors.GET;
                        return (
                          <tr key={p.key} className="table-row-hover" style={{ borderBottom: i < m.permissions.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <Key size={12} style={{ color: m.color }} />
                                <span className="text-xs font-medium text-white">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--muted)", color: "#60A5FA", fontFamily: "monospace" }}>{p.key}</code>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs px-2 py-0.5 rounded font-medium" style={{ background: mc.bg, color: mc.color }}>{p.method}</span>
                            </td>
                            <td className="px-4 py-2.5">
                              <code className="text-xs" style={{ color: "var(--muted-foreground)", fontFamily: "monospace" }}>{p.path}</code>
                            </td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.desc}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <TechButton variant="ghost" size="xs" icon={<Edit2 size={11} />}>编辑</TechButton>
                                <TechButton variant="danger" size="xs" icon={<Trash2 size={11} />}>删除</TechButton>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* New permission modal */}
        <div className={`fixed inset-0 flex items-center justify-center ${showModal ? "" : "hidden"}`} style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div className="w-[480px] rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><Key size={15} style={{ color: "#165DFF" }} />新建权限点</div>
            <div className="space-y-4">
              {[["权限名称", "如: 查看项目"], ["权限标识", "如: project:view"], ["接口路径", "如: /api/projects"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input className="w-full h-8 px-3 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>HTTP方法</label>
                <div className="flex gap-2">
                  {["GET", "POST", "PUT", "DELETE", "ALL"].map(m => {
                    const mc = methodColors[m];
                    return (
                      <button key={m} className="text-xs px-3 py-1 rounded font-medium" style={{ background: mc.bg, color: mc.color, border: `1px solid ${mc.color}40` }}>{m}</button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>所属模块</label>
                <div className="flex flex-wrap gap-2">
                  {permTree.map(m => (
                    <button key={m.module} className="text-xs px-2 py-1 rounded" style={{ background: `${m.color}1a`, color: m.color }}>{m.icon} {m.module}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowModal(false)}>创建权限</TechButton>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
