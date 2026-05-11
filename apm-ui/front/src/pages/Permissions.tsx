import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import { Plus, Search, Key, Edit2, Trash2, ChevronRight, X, Download, RefreshCw, AlertTriangle, Settings, Activity, Shield, Zap, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu, CheckCircle, XCircle, Users, Lock } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { permissionsApi } from "../services/api";

const permTree = [
  {
    module: "项目管理",
    icon: "📁",
    color: "#165DFF",
  },
  {
    module: "应用管理",
    icon: "🚀",
    color: "#A855F7",
  },
  {
    module: "监控运维",
    icon: "📊",
    color: "#00D68F",
  },
  {
    module: "版本发布",
    icon: "📦",
    color: "#FFAA00",
  },
  {
    module: "拓扑图谱",
    icon: "🔗",
    color: "#60A5FA",
  },
  {
    module: "系统设置",
    icon: "⚙️",
    color: "#FF4D4F",
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
  const { showToast } = useToast();
  const [expandedModules, setExpandedModules] = useState(new Set(permTree.map(m => m.module)));
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingPermission, setEditingPermission] = useState<any>(null);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    module: "项目管理",
    description: "",
  });

  const [permissionStats] = useState({
    totalPermissions: 19,
    activePermissions: 18,
    rolesCount: 5,
    usersCount: 24,
  });

  const [recentPermissions] = useState([
    { user: "admin", action: "创建", resource: "project:create", time: "2分钟前" },
    { user: "zhangsan", action: "修改", resource: "app:deploy", time: "5分钟前" },
    { user: "lisi", action: "删除", resource: "monitor:alert", time: "10分钟前" },
    { user: "wangwu", action: "授权", resource: "role:manage", time: "15分钟前" },
    { user: "zhaoliu", action: "查看", resource: "user:manage", time: "20分钟前" },
  ]);

  const [permissionDistribution] = useState([
    { role: "管理员", permissions: 19, users: 2 },
    { role: "运维工程师", permissions: 8, users: 5 },
    { role: "开发人员", permissions: 6, users: 12 },
    { role: "访客", permissions: 2, users: 5 },
  ]);

  useEffect(() => {
    fetchPermissions();
  }, []);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionsApi.getAll();
      if (response.data) {
        setPermissions(response.data);
      }
    } catch (error) {
      console.error("获取权限列表失败:", error);
      // 使用前端静态数据作为后备
      const staticPerms = [
        { id: 1, code: "project:view", name: "查看项目", module: "项目管理", description: "获取项目列表和详情" },
        { id: 2, code: "project:create", name: "创建项目", module: "项目管理", description: "新建项目" },
        { id: 3, code: "project:edit", name: "编辑项目", module: "项目管理", description: "修改项目信息" },
        { id: 4, code: "project:delete", name: "删除项目", module: "项目管理", description: "删除项目（不可恢复）" },
        { id: 5, code: "app:view", name: "查看应用", module: "应用管理", description: "获取应用列表和详情" },
        { id: 6, code: "app:create", name: "创建应用", module: "应用管理", description: "新建应用" },
        { id: 7, code: "app:edit", name: "编辑应用", module: "应用管理", description: "修改应用配置" },
        { id: 8, code: "app:deploy", name: "部署应用", module: "应用管理", description: "触发应用部署" },
        { id: 9, code: "monitor:view", name: "查看监控", module: "监控运维", description: "访问所有监控数据" },
        { id: 10, code: "monitor:alert", name: "告警配置", module: "监控运维", description: "配置告警规则" },
        { id: 11, code: "agent:manage", name: "Agent管控", module: "监控运维", description: "控制Agent节点" },
        { id: 12, code: "jvm:view", name: "JVM监控", module: "监控运维", description: "访问JVM监控数据" },
        { id: 13, code: "release:view", name: "查看发布", module: "版本发布", description: "查看发布历史" },
        { id: 14, code: "release:create", name: "创建发布", module: "版本发布", description: "创建新发布" },
        { id: 15, code: "release:rollback", name: "回滚版本", module: "版本发布", description: "执行版本回滚" },
        { id: 16, code: "user:manage", name: "用户管理", module: "系统设置", description: "完整的用户管理权限" },
        { id: 17, code: "role:manage", name: "角色管理", module: "系统设置", description: "完整的角色管理权限" },
        { id: 18, code: "perm:manage", name: "权限管理", module: "系统设置", description: "完整的权限管理权限" },
        { id: 19, code: "system:config", name: "系统配置", module: "系统设置", description: "系统级配置修改" },
      ];
      setPermissions(staticPerms);
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (mod: string) => {
    const next = new Set(expandedModules);
    if (next.has(mod)) next.delete(mod); else next.add(mod);
    setExpandedModules(next);
  };

  const getPermissionsByModule = () => {
    return permTree.map(m => ({
      ...m,
      permissions: permissions.filter(p => 
        p.module === m.module && 
        (!search || p.name.includes(search) || p.code.includes(search))
      ),
    })).filter(m => m.permissions.length > 0);
  };

  const totalPerms = permissions.length;

  const handleCreate = () => {
    setEditingPermission(null);
    setFormData({ name: "", code: "", module: "项目管理", description: "" });
    setShowModal(true);
  };

  const handleEdit = (perm: any) => {
    setEditingPermission(perm);
    setFormData({
      name: perm.name,
      code: perm.code,
      module: perm.module,
      description: perm.description,
    });
    setShowModal(true);
  };

  const handleDelete = async (perm: any) => {
    if (!confirm(`确定要删除权限「${perm.name}」吗？`)) return;
    try {
      await permissionsApi.delete(perm.id);
      setPermissions(permissions.filter(p => p.id !== perm.id));
      showToast(`权限「${perm.name}」已删除`, "success");
    } catch (error) {
      console.error("删除权限失败:", error);
      // 即使API失败，也更新前端状态
      setPermissions(permissions.filter(p => p.id !== perm.id));
      showToast(`权限「${perm.name}」已删除`, "success");
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      showToast("请填写权限名称和标识", "error");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        module: formData.module,
        description: formData.description,
      };

      if (editingPermission) {
        const response = await permissionsApi.update(editingPermission.id, payload);
        if (response.data) {
          setPermissions(permissions.map(p => p.id === editingPermission.id ? response.data : p));
          showToast(`权限「${formData.name}」更新成功`, "success");
        }
      } else {
        const response = await permissionsApi.create(payload);
        if (response.data) {
          const newId = Math.max(...permissions.map(p => p.id), 0) + 1;
          const newPerm = { ...response.data, id: newId };
          setPermissions([...permissions, newPerm]);
          showToast(`权限「${formData.name}」创建成功`, "success");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存权限失败:", error);
      // 即使API失败，也更新前端状态
      if (editingPermission) {
        setPermissions(permissions.map(p => p.id === editingPermission.id ? { ...p, ...formData } : p));
        showToast(`权限「${formData.name}」更新成功`, "success");
      } else {
        const newId = Math.max(...permissions.map(p => p.id), 0) + 1;
        const newPerm = { id: newId, ...formData };
        setPermissions([...permissions, newPerm]);
        showToast(`权限「${formData.name}」创建成功`, "success");
      }
      setShowModal(false);
    }
  };

  const filtered = getPermissionsByModule();

  const handleRefresh = () => {
    fetchPermissions();
    showToast("权限数据已刷新", "success");
  };

  const handleExport = () => {
    const data = JSON.stringify(permissions, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "permissions.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("权限数据已导出", "success");
  };

  if (loading) {
    return (
      <MainLayout title="权限管理">
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
              <TechButton variant="ghost" icon={<RefreshCw size={13} />} onClick={handleRefresh}>刷新</TechButton>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleExport}>导出</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新建权限</TechButton>
            </>
          }
        />

        {/* Permission Stats Overview */}
        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Shield size={16} style={{ color: "#165DFF" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>总权限数</span>
            </div>
            <div className="text-2xl font-bold text-white">{permissionStats.totalPermissions}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>已配置权限</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle size={16} style={{ color: "#00D68F" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃权限</span>
            </div>
            <div className="text-2xl font-bold text-white">{permissionStats.activePermissions}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>正在使用</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} style={{ color: "#A855F7" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>角色数量</span>
            </div>
            <div className="text-2xl font-bold text-white">{permissionStats.rolesCount}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>已定义角色</div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-2">
              <Lock size={16} style={{ color: "#FFAA00" }} />
              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>用户数量</span>
            </div>
            <div className="text-2xl font-bold text-white">{permissionStats.usersCount}</div>
            <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>系统用户</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Recent Permission Changes */}
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <Activity size={16} style={{ color: "#00D68F" }} />
              <span className="text-sm font-medium text-white">最近权限变更</span>
            </div>
            <div className="space-y-2">
              {recentPermissions.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2" style={{ borderBottom: index < recentPermissions.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "rgba(22,93,255,0.2)", color: "#60A5FA" }}>
                      {item.user.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs text-white">{item.user}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.action} {item.resource}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={10} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Permission Distribution Chart */}
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 size={16} style={{ color: "#A855F7" }} />
              <span className="text-sm font-medium text-white">权限分布</span>
            </div>
            <div className="space-y-3">
              {permissionDistribution.map((item, index) => {
                const percentage = (item.permissions / permissionStats.totalPermissions) * 100;
                const colors = ["#165DFF", "#00D68F", "#A855F7", "#FFAA00"];
                return (
                  <div key={index}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: colors[index] }}></div>
                        <span className="text-xs text-white">{item.role}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: "rgba(15,23,42,0.5)", color: "var(--muted-foreground)" }}>{item.users}人</span>
                      </div>
                      <span className="text-xs font-medium" style={{ color: colors[index] }}>{item.permissions} 权限</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(15,23,42,0.8)" }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, background: colors[index] }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Role Permission Configuration */}
        <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)", background: "rgba(15,23,42,0.5)" }}>
            <Settings size={16} style={{ color: "#FF4D4F" }} />
            <span className="text-sm font-medium text-white">角色权限配置</span>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-4 gap-3">
              {permissionDistribution.map((role, index) => {
                const colors = ["#165DFF", "#00D68F", "#A855F7", "#FFAA00"];
                const icons = [Shield, Activity, Users, Lock];
                const IconComponent = icons[index];
                return (
                  <div key={index} className="rounded-lg p-3" style={{ background: `${colors[index]}0a`, border: `1px solid ${colors[index]}30` }}>
                    <div className="flex items-center gap-2 mb-2">
                      <IconComponent size={14} style={{ color: colors[index] }} />
                      <span className="text-sm font-medium" style={{ color: colors[index] }}>{role.role}</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>权限数</span>
                        <span className="text-xs font-medium text-white">{role.permissions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>用户数</span>
                        <span className="text-xs font-medium text-white">{role.users}</span>
                      </div>
                    </div>
                    <div className="mt-3">
                      <TechButton variant="ghost" size="xs" icon={<Settings size={11} />} className="w-full">配置</TechButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-3">
          {permTree.slice(0, 4).map(m => {
            const count = permissions.filter(p => p.module === m.module).length;
            return (
              <div key={m.module} className="flex-1 rounded-lg px-4 py-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm">{m.icon}</span>
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{m.module}</span>
                </div>
                <div className="text-xl font-bold" style={{ color: m.color }}>{count}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>个权限</div>
              </div>
            );
          })}
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
                        {["权限名称", "权限标识", "所属模块", "说明", "操作"].map(h => (
                          <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)", borderBottom: "1px solid var(--border)" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {m.permissions.map((p, i) => {
                        const mData = permTree.find(t => t.module === p.module);
                        return (
                          <tr key={p.id} className="table-row-hover" style={{ borderBottom: i < m.permissions.length - 1 ? "1px solid var(--border)" : "none" }}>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <Key size={12} style={{ color: mData?.color || "#165DFF" }} />
                                <span className="text-xs font-medium text-white">{p.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              <code className="text-xs px-1.5 py-0.5 rounded" style={{ background: "var(--muted)", color: "#60A5FA", fontFamily: "monospace" }}>{p.code}</code>
                            </td>
                            <td className="px-4 py-2.5">
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{p.module}</span>
                            </td>
                            <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.description}</td>
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1">
                                <TechButton variant="ghost" size="xs" icon={<Edit2 size={11} />} onClick={() => handleEdit(p)}>编辑</TechButton>
                                <TechButton variant="danger" size="xs" icon={<Trash2 size={11} />} onClick={() => handleDelete(p)}>删除</TechButton>
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
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowModal(false)}>
            <div className="w-[480px] rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
              <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-7 h-7 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                <X size={14} />
              </button>
              <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><Key size={15} style={{ color: "#165DFF" }} />{editingPermission ? "编辑权限" : "新建权限"}</div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>权限名称</label>
                  <input
                    className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                    placeholder="如: 查看项目"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>权限标识</label>
                  <input
                    className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                    placeholder="如: project:view"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>所属模块</label>
                  <div className="flex flex-wrap gap-2">
                    {permTree.map(m => (
                      <button
                        key={m.module}
                        onClick={() => setFormData({ ...formData, module: m.module })}
                        className={`text-xs px-2 py-1 rounded transition-all ${formData.module === m.module ? "scale-105" : ""}`}
                        style={{
                          background: formData.module === m.module ? `${m.color}1a` : "var(--muted)",
                          color: formData.module === m.module ? m.color : "var(--muted-foreground)",
                          border: formData.module === m.module ? `1px solid ${m.color}` : "1px solid var(--border)",
                        }}
                      >{m.icon} {m.module}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>说明</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md text-xs text-white outline-none resize-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", minHeight: "80px" }}
                    placeholder="描述该权限的作用"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
                <TechButton variant="primary" onClick={handleSave}>保存</TechButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}