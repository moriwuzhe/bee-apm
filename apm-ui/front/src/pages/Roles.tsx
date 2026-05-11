import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { Plus, Shield, Edit2, Users, CheckSquare, Square, Trash2, X, ChevronDown, ChevronUp, Download, RefreshCw, AlertTriangle, Settings, Activity, Zap, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu, CheckCircle, XCircle, Key, Lock } from "lucide-react";
import { rolesApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Role as RoleType } from "../types";

const colors = ["#FF4D4F", "#165DFF", "#A855F7", "#00D68F", "#94A3B8", "#64748B"];

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

const defaultRoles: RoleType[] = [
  { id: 1, name: "超级管理员", description: "拥有全部系统权限，不可删除", userCount: 1, permissionCount: 20, isSystem: true, color: "#FF4D4F" },
  { id: 2, name: "运维管理员", description: "管理基础设施、监控、Agent等运维功能", userCount: 3, permissionCount: 15, isSystem: false, color: "#165DFF" },
  { id: 3, name: "项目负责人", description: "管理所属项目及应用，可查看监控数据", userCount: 5, permissionCount: 10, isSystem: false, color: "#A855F7" },
  { id: 4, name: "运维工程师", description: "执行运维操作，查看系统监控", userCount: 8, permissionCount: 8, isSystem: false, color: "#00D68F" },
  { id: 5, name: "开发工程师", description: "查看应用信息、发布版本、基本监控", userCount: 24, permissionCount: 5, isSystem: false, color: "#94A3B8" },
];

interface RoleFormData {
  name: string;
  description: string;
  permissions: string[];
}

export default function Roles() {
  const [selected, setSelected] = useState(1);
  const [roles, setRoles] = useState<RoleType[]>(defaultRoles);
  const [perms, setPerms] = useState<Record<number, Set<string>>>({
    1: new Set(permModules.flatMap(m => m.perms.map(p => p.key))),
    2: new Set(["project:view", "project:edit", "app:view", "app:deploy", "monitor:view", "monitor:alert", "agent:manage", "jvm:view", "release:view", "release:create", "release:rollback"]),
    3: new Set(["project:view", "project:create", "project:edit", "app:view", "app:create", "app:edit", "app:deploy", "monitor:view", "release:view", "release:create"]),
    4: new Set(["project:view", "app:view", "monitor:view", "monitor:alert", "agent:manage", "jvm:view", "release:view"]),
    5: new Set(["project:view", "app:view", "app:deploy", "monitor:view", "release:view", "release:create"]),
  });
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleType | null>(null);
  const [deletingRole, setDeletingRole] = useState<RoleType | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set(permModules.map(m => m.module)));
  const { showToast } = useToast();
  const [selectedRoles, setSelectedRoles] = useState<Set<number>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);

  const [roleStats, setRoleStats] = useState({
    totalRoles: defaultRoles.length,
    activeRoles: defaultRoles.filter(r => !r.isSystem).length,
    permissionsCount: permModules.reduce((sum, m) => sum + m.perms.length, 0),
    usersCount: defaultRoles.reduce((sum, r) => sum + (r.userCount || 0), 0),
  });

  const [recentRoleChanges, setRecentRoleChanges] = useState([
    { role: "运维管理员", action: "权限更新", user: "张明", time: "5分钟前" },
    { role: "项目负责人", action: "新增权限", user: "李华", time: "15分钟前" },
    { role: "运维工程师", action: "角色编辑", user: "王强", time: "1小时前" },
    { role: "开发工程师", action: "权限变更", user: "赵丽", time: "2小时前" },
    { role: "运维管理员", action: "新增用户", user: "陈刚", time: "3小时前" },
  ]);

  const [roleDistribution, setRoleDistribution] = useState(
    defaultRoles.map((r, index) => ({
      role: r.name,
      users: r.userCount || 0,
      permissions: r.permissionCount || 0,
      color: colors[index % colors.length],
    }))
  );

  const [formData, setFormData] = useState<RoleFormData>({
    name: "",
    description: "",
    permissions: [],
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await rolesApi.getAll();
      if (response.data && response.data.length > 0) {
        const convertedRoles = response.data.map((r: any, index: number) => ({
          ...r,
          color: colors[index % colors.length],
          userCount: 0,
          permissionCount: 0,
        }));
        setRoles(convertedRoles);
      }
    } catch (error) {
      console.error("加载角色数据失败:", error);
      showToast("获取角色数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const currentPerms = perms[selected] || new Set<string>();
  const currentRole = roles.find(r => r.id === selected);

  const toggleModule = (moduleName: string) => {
    const next = new Set(expandedModules);
    if (next.has(moduleName)) next.delete(moduleName);
    else next.add(moduleName);
    setExpandedModules(next);
  };

  const togglePerm = (key: string) => {
    if (currentRole?.isSystem) return;
    const next = new Set(currentPerms);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPerms({ ...perms, [selected]: next });
  };

  const toggleModulePerms = (moduleKeys: string[]) => {
    if (currentRole?.isSystem) return;
    const allChecked = moduleKeys.every(k => currentPerms.has(k));
    const next = new Set(currentPerms);
    if (allChecked) moduleKeys.forEach(k => next.delete(k));
    else moduleKeys.forEach(k => next.add(k));
    setPerms({ ...perms, [selected]: next });
  };

  const handleCreate = () => {
    setEditingRole(null);
    setFormData({
      name: "",
      description: "",
      permissions: [],
    });
    setShowModal(true);
  };

  const handleEdit = (role: RoleType) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description,
      permissions: Array.from(perms[role.id] || []),
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingRole) return;
    try {
      await rolesApi.delete(deletingRole.id);
      setRoles(roles.filter(r => r.id !== deletingRole.id));
      const newPerms = { ...perms };
      delete newPerms[deletingRole.id];
      setPerms(newPerms);
      if (selected === deletingRole.id && roles.length > 0) {
        setSelected(roles[0].id);
      }
      showToast(`角色 ${deletingRole.name} 删除成功`, "success");
      setDeletingRole(null);
    } catch (error) {
      console.error("删除角色失败:", error);
      showToast("删除角色失败", "error");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showToast("请输入角色名称", "error");
      return;
    }

    try {
      // 只发送后端需要的字段
      const payload = {
        name: formData.name,
        description: formData.description,
        color: editingRole ? editingRole.color : colors[roles.length % colors.length],
        isSystem: false,
      };
      
      console.log("Sending payload:", payload);

      if (editingRole) {
        const response = await rolesApi.update(editingRole.id, payload);
        if (response.data) {
          const updatedRole = {
            ...response.data,
            color: editingRole.color,
            userCount: editingRole.userCount,
            permissionCount: formData.permissions.length,
          };
          setRoles(roles.map(r => r.id === editingRole.id ? updatedRole : r));
          setPerms({
            ...perms,
            [editingRole.id]: new Set(formData.permissions),
          });
          showToast(`角色 ${formData.name} 更新成功`, "success");
        }
      } else {
        const response = await rolesApi.create(payload);
        if (response.data) {
          const newId = Math.max(...roles.map(r => r.id), 0) + 1;
          const newRole = {
            ...response.data,
            id: newId,
            color: colors[roles.length % colors.length],
            userCount: 0,
            permissionCount: formData.permissions.length,
            isSystem: false,
          };
          setRoles([...roles, newRole]);
          setPerms({
            ...perms,
            [newId]: new Set(formData.permissions),
          });
          showToast(`角色 ${formData.name} 创建成功`, "success");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存角色失败:", error);
      showToast("保存角色失败", "error");
    }
  };

  const handleSavePermissions = async () => {
    if (!currentRole || currentRole.isSystem) return;
    try {
      // 权限保存在前端状态，不用发送到后端
      setRoles(roles.map(r => r.id === currentRole.id ? { ...r, permissionCount: currentPerms.size } : r));
      showToast("权限保存成功", "success");
    } catch (error) {
      console.error("保存权限失败:", error);
      showToast("保存权限失败", "error");
    }
  };

  const toggleFormPerm = (key: string) => {
    const newPerms = formData.permissions.includes(key)
      ? formData.permissions.filter(k => k !== key)
      : [...formData.permissions, key];
    setFormData({ ...formData, permissions: newPerms });
  };

  if (loading) {
    return (
      <MainLayout title="角色管理">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm" style={{ color: "#94A3B8" }}>加载中...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="角色管理">
      <div data-cmp="Roles" className="space-y-4">
        <PageHeader
          title="角色与权限管理"
          subtitle={`${roles.length} 个角色 · ${roles.reduce((a, r) => a + (r.userCount || 0), 0)} 个用户`}
          actions={
            <div className="flex items-center gap-2">
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={fetchRoles}>刷新</TechButton>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={() => showToast("角色数据导出中...", "info")}>导出</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新建角色</TechButton>
            </div>
          }
        />

        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                <Shield size={18} style={{ color: "#165DFF" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总角色数</div>
                <div className="text-xl font-bold text-white">{roleStats.totalRoles}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,214,143,0.15)" }}>
                <Activity size={18} style={{ color: "#00D68F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃角色</div>
                <div className="text-xl font-bold text-white">{roleStats.activeRoles}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                <Key size={18} style={{ color: "#A855F7" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>权限总数</div>
                <div className="text-xl font-bold text-white">{roleStats.permissionsCount}</div>
              </div>
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,77,79,0.15)" }}>
                <Users size={18} style={{ color: "#FF4D4F" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>用户总数</div>
                <div className="text-xl font-bold text-white">{roleStats.usersCount}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <Clock size={14} style={{ color: "#165DFF" }} />
                最近角色变更
              </div>
            </div>
            <div className="space-y-3">
              {recentRoleChanges.slice(0, 5).map((change, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: "#165DFF" }}></div>
                    <span style={{ color: "var(--muted-foreground)" }}>{change.role}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: "var(--foreground)" }}>{change.action}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>{change.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <BarChart3 size={14} style={{ color: "#A855F7" }} />
                角色权限分布
              </div>
            </div>
            <div className="space-y-3">
              {roleDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span style={{ color: "var(--foreground)" }}>{item.role}</span>
                    <span style={{ color: "var(--muted-foreground)" }}>{item.permissions} 权限</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(item.permissions / Math.max(...roleDistribution.map(d => d.permissions))) * 100}%`,
                        background: item.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <Server size={14} style={{ color: "#00D68F" }} />
                角色配置列表
              </div>
            </div>
            <div className="space-y-2">
              {roles.slice(0, 5).map((role) => (
                <div key={role.id} className="flex items-center justify-between text-xs p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: role.color }}></div>
                    <span style={{ color: "var(--foreground)" }}>{role.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <Users size={10} />{role.userCount}
                    </span>
                    <span className="flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <Key size={10} />{role.permissionCount}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="w-72 flex-shrink-0 space-y-2">
            {roles.map((r, index) => (
              <div
                key={r.id}
                onClick={() => setSelected(r.id)}
                className="p-4 rounded-xl cursor-pointer transition-all flex items-start justify-between"
                style={{
                  background: selected === r.id ? "rgba(22,93,255,0.12)" : "var(--card)",
                  border: selected === r.id ? "1px solid #165DFF" : "1px solid var(--border)",
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${r.color}1a` }}>
                    <Shield size={16} style={{ color: r.color }} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white flex items-center gap-2">
                      {r.name}
                      {r.isSystem && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F", fontSize: "10px" }}>系统</span>}
                    </div>
                    <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{r.description}</div>
                    <div className="flex items-center gap-4 mt-2 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <span className="flex items-center gap-1"><Users size={10} />{r.userCount}人</span>
                      <span>{r.permissionCount}项权限</span>
                    </div>
                  </div>
                </div>
                {!r.isSystem && (
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleEdit(r); }}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#165DFF"; e.currentTarget.style.background = "rgba(22,93,255,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Edit2 size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingRole(r); }}
                      className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "#FF4D4F"; e.currentTarget.style.background = "rgba(255,77,79,0.1)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 rounded-xl overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {currentRole && (
              <>
                <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${currentRole.color}1a` }}>
                      <Shield size={18} style={{ color: currentRole.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{currentRole.name}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{currentRole.description}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>已选 {currentPerms.size} 项</span>
                    {!currentRole.isSystem && (
                      <TechButton variant="primary" size="xs" icon={<Edit2 size={11} />} onClick={handleSavePermissions}>保存权限</TechButton>
                    )}
                  </div>
                </div>

                <div className="p-5 space-y-5 max-h-[600px] overflow-y-auto">
                  {permModules.map((m) => {
                    const moduleKeys = m.perms.map(p => p.key);
                    const allChecked = moduleKeys.every(k => currentPerms.has(k));
                    const someChecked = moduleKeys.some(k => currentPerms.has(k)) && !allChecked;
                    const isExpanded = expandedModules.has(m.module);
                    return (
                      <div key={m.module}>
                        <div className="flex items-center gap-3 mb-3">
                          <button
                            className="flex items-center gap-2 text-xs font-medium text-white"
                            onClick={() => toggleModule(m.module)}
                            style={{ cursor: "pointer" }}
                          >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                            {m.module}
                          </button>
                          {!currentRole.isSystem && (
                            <button
                              className="flex items-center gap-1 text-xs text-white"
                              onClick={() => toggleModulePerms(moduleKeys)}
                              style={{ cursor: "pointer" }}
                            >
                              <div style={{ color: allChecked ? "#165DFF" : someChecked ? "#FFAA00" : "var(--muted-foreground)" }}>
                                <CheckSquare size={14} />
                              </div>
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {moduleKeys.filter(k => currentPerms.has(k)).length}/{moduleKeys.length}
                              </span>
                            </button>
                          )}
                          {currentRole.isSystem && (
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                              {moduleKeys.filter(k => currentPerms.has(k)).length}/{moduleKeys.length}
                            </span>
                          )}
                          <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
                        </div>
                        {isExpanded && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {m.perms.map((p) => {
                              const checked = currentPerms.has(p.key);
                              return (
                                <button
                                  key={p.key}
                                  onClick={() => togglePerm(p.key)}
                                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs transition-colors"
                                  style={{
                                    background: checked ? "rgba(22,93,255,0.15)" : "var(--muted)",
                                    border: `1px solid ${checked ? "#165DFF" : "var(--border)"}`,
                                    color: checked ? "#60A5FA" : "var(--muted-foreground)",
                                    cursor: currentRole.isSystem ? "default" : "pointer",
                                  }}
                                  disabled={currentRole.isSystem}
                                >
                                  {checked ? <CheckSquare size={12} /> : <Square size={12} />}
                                  {p.label}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowModal(false)}>
            <div className="w-[520px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                <X size={14} />
              </button>
              <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
                <Shield size={15} style={{ color: "#165DFF" }} />
                {editingRole ? "编辑角色" : "新建角色"}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>角色名称</label>
                  <input
                    className="w-full h-9 px-3 rounded-md text-xs outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    placeholder="输入角色名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>角色描述</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md text-xs outline-none resize-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)", minHeight: "80px" }}
                    placeholder="描述该角色的职责范围"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                {!editingRole && (
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>初始权限</label>
                    <div className="space-y-3">
                      {permModules.map((m) => {
                        const moduleKeys = m.perms.map(p => p.key);
                        const allChecked = moduleKeys.every(k => formData.permissions.includes(k));
                        const someChecked = moduleKeys.some(k => formData.permissions.includes(k)) && !allChecked;
                        const isModuleExpanded = true;
                        return (
                          <div key={m.module}>
                            <div className="flex items-center gap-3 mb-2">
                              <button
                                className="flex items-center gap-2 text-xs font-medium text-white"
                                onClick={() => {
                                  const allSelected = moduleKeys.every(k => formData.permissions.includes(k));
                                  const newPerms = allSelected
                                    ? formData.permissions.filter(k => !moduleKeys.includes(k))
                                    : [...formData.permissions, ...moduleKeys.filter(k => !formData.permissions.includes(k))];
                                  setFormData({ ...formData, permissions: newPerms });
                                }}
                                style={{ cursor: "pointer" }}
                              >
                                <div style={{ color: allChecked ? "#165DFF" : someChecked ? "#FFAA00" : "var(--muted-foreground)" }}>
                                  <CheckSquare size={14} />
                                </div>
                                {m.module}
                              </button>
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                                {moduleKeys.filter(k => formData.permissions.includes(k)).length}/{moduleKeys.length}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2 ml-6">
                              {m.perms.map((p) => {
                                const checked = formData.permissions.includes(p.key);
                                return (
                                  <button
                                    key={p.key}
                                    onClick={() => toggleFormPerm(p.key)}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs transition-colors"
                                    style={{
                                      background: checked ? "rgba(22,93,255,0.15)" : "transparent",
                                      border: `1px solid ${checked ? "#165DFF" : "var(--border)"}`,
                                      color: checked ? "#60A5FA" : "var(--muted-foreground)",
                                    }}
                                  >
                                    {checked ? <CheckSquare size={10} /> : <Square size={10} />}
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
                )}
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
                <TechButton variant="primary" onClick={handleSave}>保存</TechButton>
              </div>
            </div>
          </div>
        )}

        {deletingRole && (
          <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeletingRole(null)}>
            <div className="w-[400px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setDeletingRole(null)} className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                <X size={14} />
              </button>
              <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <Trash2 size={15} style={{ color: "#FF4D4F" }} />确认删除
              </div>
              <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                确定要删除角色 <span className="text-white font-medium">{deletingRole.name}</span> 吗？此操作不可撤销。
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <TechButton variant="secondary" onClick={() => setDeletingRole(null)}>取消</TechButton>
                <TechButton variant="danger" onClick={handleDelete}>确认删除</TechButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}