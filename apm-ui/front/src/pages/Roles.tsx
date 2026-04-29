import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { Plus, Shield, Edit2, Users, CheckSquare, Square } from "lucide-react";

const roles = [
  { id: 1, name: "超级管理员", desc: "拥有全部系统权限，不可删除", users: 1, perms: 48, system: true,  color: "#FF4D4F" },
  { id: 2, name: "运维管理员", desc: "管理基础设施、监控、Agent等运维功能", users: 3, perms: 36, system: false, color: "#165DFF" },
  { id: 3, name: "项目负责人", desc: "管理所属项目及应用，可查看监控数据", users: 5, perms: 22, system: false, color: "#A855F7" },
  { id: 4, name: "运维工程师", desc: "执行运维操作，查看系统监控", users: 8, perms: 18, system: false, color: "#00D68F" },
  { id: 5, name: "开发工程师", desc: "查看应用信息、发布版本、基本监控", users: 24, perms: 12, system: false, color: "#94A3B8" },
  { id: 6, name: "只读用户",   desc: "仅可查看，无法操作任何资源", users: 10, perms: 6,  system: false, color: "#64748B" },
];

const permModules = [
  {
    module: "项目管理",
    perms: [
      { key: "project:view",   label: "查看项目" },
      { key: "project:create", label: "创建项目" },
      { key: "project:edit",   label: "编辑项目" },
      { key: "project:delete", label: "删除项目" },
    ],
  },
  {
    module: "应用管理",
    perms: [
      { key: "app:view",   label: "查看应用" },
      { key: "app:create", label: "创建应用" },
      { key: "app:edit",   label: "编辑应用" },
      { key: "app:deploy", label: "部署应用" },
    ],
  },
  {
    module: "监控运维",
    perms: [
      { key: "monitor:view",   label: "查看监控" },
      { key: "monitor:alert",  label: "告警配置" },
      { key: "agent:manage",   label: "Agent管控" },
      { key: "jvm:view",       label: "JVM监控" },
    ],
  },
  {
    module: "版本发布",
    perms: [
      { key: "release:view",     label: "查看发布" },
      { key: "release:create",   label: "创建发布" },
      { key: "release:rollback", label: "回滚版本" },
    ],
  },
  {
    module: "系统设置",
    perms: [
      { key: "user:manage",   label: "用户管理" },
      { key: "role:manage",   label: "角色管理" },
      { key: "perm:manage",   label: "权限管理" },
      { key: "system:config", label: "系统配置" },
    ],
  },
];

const defaultPerms: Record<number, Set<string>> = {
  1: new Set(permModules.flatMap(m => m.perms.map(p => p.key))),
  2: new Set(["project:view","project:edit","app:view","app:deploy","monitor:view","monitor:alert","agent:manage","jvm:view","release:view","release:create","release:rollback"]),
  3: new Set(["project:view","project:create","project:edit","app:view","app:create","app:edit","app:deploy","monitor:view","release:view","release:create"]),
  4: new Set(["project:view","app:view","monitor:view","monitor:alert","agent:manage","jvm:view","release:view"]),
  5: new Set(["project:view","app:view","app:deploy","monitor:view","release:view","release:create"]),
  6: new Set(["project:view","app:view","monitor:view","release:view"]),
};

export default function Roles() {
  const [selected, setSelected] = useState(1);
  const [perms, setPerms] = useState<Record<number, Set<string>>>(defaultPerms);
  const [showModal, setShowModal] = useState(false);

  const currentPerms = perms[selected] || new Set<string>();
  const currentRole = roles.find(r => r.id === selected)!;

  const togglePerm = (key: string) => {
    if (currentRole?.system) return;
    const next = new Set(currentPerms);
    if (next.has(key)) next.delete(key); else next.add(key);
    setPerms({ ...perms, [selected]: next });
  };

  const toggleModule = (keys: string[]) => {
    if (currentRole?.system) return;
    const allChecked = keys.every(k => currentPerms.has(k));
    const next = new Set(currentPerms);
    if (allChecked) keys.forEach(k => next.delete(k)); else keys.forEach(k => next.add(k));
    setPerms({ ...perms, [selected]: next });
  };

  return (
    <MainLayout title="角色管理">
      <div data-cmp="Roles" className="space-y-4">
        <PageHeader
          title="角色与权限管理"
          subtitle={`${roles.length} 个角色 · ${roles.reduce((a, r) => a + r.users, 0)} 个用户`}
          actions={
            <TechButton variant="primary" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>新建角色</TechButton>
          }
        />

        <div className="flex gap-4">
          {/* Role list */}
          <div className="w-64 flex-shrink-0 space-y-2">
            {roles.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="p-3.5 rounded-lg cursor-pointer transition-all"
                style={{
                  background: selected === r.id ? "rgba(22,93,255,0.12)" : "var(--card)",
                  border: selected === r.id ? "1px solid #165DFF" : "1px solid var(--border)",
                }}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}1a` }}>
                    <Shield size={14} style={{ color: r.color }} />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white flex items-center gap-1">
                      {r.name}
                      {r.system && <span className="text-xs px-1 rounded" style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F", fontSize: "9px" }}>系统</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                  <span className="flex items-center gap-1"><Users size={10} />{r.users}人</span>
                  <span>{r.perms}项权限</span>
                </div>
              </div>
            ))}
          </div>

          {/* Permission editor */}
          <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: `${currentRole?.color ?? "#165DFF"}1a` }}>
                  <Shield size={16} style={{ color: currentRole?.color ?? "#165DFF" }} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{currentRole?.name}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{currentRole?.desc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>已选 {currentPerms.size} 项</span>
                {!currentRole?.system && <TechButton variant="primary" size="xs" icon={<Edit2 size={11} />}>保存权限</TechButton>}
              </div>
            </div>

            {/* Permission grid */}
            <div className="p-5 space-y-5">
              {permModules.map((m) => {
                const moduleKeys = m.perms.map(p => p.key);
                const allChecked = moduleKeys.every(k => currentPerms.has(k));
                const someChecked = moduleKeys.some(k => currentPerms.has(k));
                return (
                  <div key={m.module}>
                    {/* Module header */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        className="flex items-center gap-2 text-xs font-medium text-white"
                        onClick={() => toggleModule(moduleKeys)}
                        style={{ cursor: currentRole?.system ? "default" : "pointer" }}
                      >
                        <div style={{ color: allChecked ? "#165DFF" : someChecked ? "#FFAA00" : "var(--muted-foreground)" }}>
                          <CheckSquare size={14} />
                        </div>
                        {m.module}
                      </button>
                      <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{moduleKeys.filter(k => currentPerms.has(k)).length}/{moduleKeys.length}</span>
                    </div>
                    {/* Perm items */}
                    <div className="flex flex-wrap gap-2">
                      {m.perms.map((p) => {
                        const checked = currentPerms.has(p.key);
                        return (
                          <button
                            key={p.key}
                            onClick={() => togglePerm(p.key)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs transition-colors"
                            style={{
                              background: checked ? "rgba(22,93,255,0.15)" : "var(--muted)",
                              border: `1px solid ${checked ? "#165DFF" : "var(--border)"}`,
                              color: checked ? "#60A5FA" : "var(--muted-foreground)",
                              cursor: currentRole?.system ? "default" : "pointer",
                            }}
                          >
                            {checked ? <CheckSquare size={12} /> : <Square size={12} />}
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* New role modal */}
        <div className={`fixed inset-0 flex items-center justify-center ${showModal ? "" : "hidden"}`} style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div className="w-[420px] rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><Shield size={15} style={{ color: "#165DFF" }} />新建角色</div>
            <div className="space-y-4">
              {[["角色名称", "输入角色名称"], ["角色描述", "描述该角色的职责范围"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input className="w-full h-8 px-3 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>基于角色复制权限</label>
                <div className="flex flex-wrap gap-2">
                  {roles.filter(r => !r.system).map(r => (
                    <button key={r.id} className="text-xs px-2 py-1 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}>{r.name}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowModal(false)}>创建角色</TechButton>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
