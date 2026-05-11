import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Edit2, User, Trash2, Eye, X, Check, Download, RefreshCw, AlertTriangle, Settings, Activity, Shield, Zap, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu, CheckCircle, XCircle, Users, Key, Lock, UserCheck } from "lucide-react";
import { usersApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { User as UserType } from "../types";

const roleColors: Record<string, { bg: string; color: string }> = {
  "超级管理员": { bg: "rgba(255,77,79,0.1)",   color: "#FF4D4F" },
  "运维管理员": { bg: "rgba(22,93,255,0.1)",   color: "#165DFF" },
  "项目负责人": { bg: "rgba(168,85,247,0.1)",  color: "#A855F7" },
  "运维工程师": { bg: "rgba(0,214,143,0.1)",   color: "#00D68F" },
  "开发工程师": { bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
};

const allRoles = ["超级管理员", "运维管理员", "项目负责人", "运维工程师", "开发工程师"];

interface UserFormData {
  name: string;
  account: string;
  email: string;
  roles: string[];
  password?: string;
  status: string;
}

export default function Users() {
  const [tab, setTab] = useState<"users" | "logs">("users");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [viewingUser, setViewingUser] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserType | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const { showToast } = useToast();

  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    adminUsers: 0,
    newUsers: 0,
  });

  const [recentUsers] = useState([
    { name: "张伟", email: "zhangwei@bee.cn", role: "运维管理员", lastLogin: "2024-01-15 14:30", status: "online" },
    { name: "李娜", email: "lina@bee.cn", role: "开发工程师", lastLogin: "2024-01-15 13:20", status: "online" },
    { name: "王强", email: "wangqiang@bee.cn", role: "项目负责人", lastLogin: "2024-01-15 11:45", status: "offline" },
    { name: "赵敏", email: "zhaomin@bee.cn", role: "超级管理员", lastLogin: "2024-01-15 10:00", status: "online" },
    { name: "陈刚", email: "chengang@bee.cn", role: "运维工程师", lastLogin: "2024-01-14 18:30", status: "warning" },
  ]);

  const [userActivity] = useState([
    { user: "张伟", actions: 156, lastAction: "2分钟前" },
    { user: "李娜", actions: 89, lastAction: "15分钟前" },
    { user: "王强", actions: 234, lastAction: "1小时前" },
    { user: "赵敏", actions: 67, lastAction: "3小时前" },
    { user: "陈刚", actions: 123, lastAction: "昨天" },
  ]);

  const [formData, setFormData] = useState<UserFormData>({
    name: "",
    account: "",
    email: "",
    roles: ["开发工程师"],
    password: "",
    status: "online",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      if (response.data && response.data.length > 0) {
        const parsedUsers = response.data.map((user: any) => ({
          ...user,
          roleName: user.roleName || user.roles?.[0] || "开发工程师",
          roles: user.roles || [],
          lastLoginTime: user.lastLoginTime || "—",
        }));
        setUsers(parsedUsers);

        const totalUsers = parsedUsers.length;
        const activeUsers = parsedUsers.filter((u: any) => u.status === "online" || u.status === "warning").length;
        const adminUsers = parsedUsers.filter((u: any) => 
          u.roleName === "超级管理员" || u.roleName === "运维管理员" || 
          (u.roles && u.roles.some((r: string) => r === "超级管理员" || r === "运维管理员"))
        ).length;
        const newUsers = parsedUsers.filter((u: any) => {
          if (!u.createTime) return false;
          const createDate = new Date(u.createTime);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return createDate >= weekAgo;
        }).length;

        setUserStats({ totalUsers, activeUsers, adminUsers, newUsers });
      } else {
        setUsers([]);
        setUserStats({ totalUsers: 0, activeUsers: 0, adminUsers: 0, newUsers: 0 });
      }
    } catch (error) {
      console.error("加载用户数据失败:", error);
      showToast("获取用户数据失败", "error");
      setUsers([]);
      setUserStats({ totalUsers: 0, activeUsers: 0, adminUsers: 0, newUsers: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingUser(null);
    setFormData({
      name: "",
      account: "",
      email: "",
      roles: ["开发工程师"],
      password: "",
      status: "online",
    });
    setShowModal(true);
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      account: user.account,
      email: user.email,
      roles: user.roles || [user.roleName || "开发工程师"],
      password: "",
      status: user.status,
    });
    setShowModal(true);
  };

  const handleView = (user: UserType) => {
    setViewingUser(user);
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await usersApi.delete(deletingUser.id);
      setUsers(users.filter(u => u.id !== deletingUser.id));
      showToast(`用户 ${deletingUser.name} 删除成功`, "success");
      setDeletingUser(null);
    } catch (error) {
      console.error("删除用户失败:", error);
      showToast("删除用户失败，正在刷新列表...", "warning");
      fetchUsers();
      setDeletingUser(null);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.account.trim()) {
      showToast("请填写完整信息", "error");
      return;
    }

    try {
      const requestData: any = {
        name: formData.name,
        account: formData.account,
        email: formData.email,
        status: formData.status,
        roles: formData.roles,
      };

      if (!editingUser) {
        requestData.password = formData.password || "123456";
      }

      if (editingUser) {
        const response = await usersApi.update(editingUser.id, requestData);
        if (response.data) {
          const updatedUser = {
            ...response.data,
            roleName: response.data.roleName || response.data.roles?.[0] || formData.roles[0],
            roles: response.data.roles || formData.roles,
            lastLoginTime: response.data.lastLoginTime || "—",
          };
          setUsers(users.map(u => u.id === editingUser.id ? updatedUser : u));
          showToast(`用户 ${formData.name} 更新成功`, "success");
        }
      } else {
        const response = await usersApi.create(requestData);
        if (response.data) {
          const newUser = {
            ...response.data,
            roleName: response.data.roleName || response.data.roles?.[0] || formData.roles[0],
            roles: response.data.roles || formData.roles,
            lastLoginTime: response.data.lastLoginTime || "—",
          };
          setUsers([...users, newUser]);
          showToast(`用户 ${formData.name} 创建成功`, "success");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存用户失败:", error);
      showToast("操作失败，正在刷新列表...", "warning");
      setShowModal(false);
      fetchUsers();
    }
  };

  const handleToggleStatus = async (user: UserType) => {
    const newStatus = user.status === "disabled" ? "online" : "disabled";
    try {
      const response = await usersApi.update(user.id, { status: newStatus });
      if (response.data) {
        const updatedUser = {
          ...response.data,
          roleName: response.data.roleName || response.data.roles?.[0] || user.roleName,
          roles: response.data.roles || user.roles,
          lastLoginTime: response.data.lastLoginTime || user.lastLoginTime,
        };
        setUsers(users.map(u => u.id === user.id ? updatedUser : u));
        showToast(`用户 ${user.name} 已${newStatus === "disabled" ? "禁用" : "启用"}`, "success");
      }
    } catch (error) {
      console.error("更新用户状态失败:", error);
      showToast("更新用户状态失败，正在刷新列表...", "warning");
      fetchUsers();
    }
  };

  const handleRoleToggle = (role: string) => {
    setFormData({
      ...formData,
      roles: formData.roles.includes(role)
        ? formData.roles.filter(r => r !== role)
        : [...formData.roles, role],
    });
  };

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.account.toLowerCase().includes(search.toLowerCase())
  );

  const handleRefresh = () => {
    fetchUsers();
    showToast("正在刷新数据...", "info");
  };

  const handleExport = () => {
    const csvContent = [
      ["姓名", "账号", "邮箱", "角色", "状态", "最后登录"].join(","),
      ...filtered.map(u => [
        u.name,
        u.account,
        u.email,
        u.roles?.join(";") || u.roleName,
        u.status,
        u.lastLoginTime,
      ].join(",")),
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `users_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    showToast("用户数据导出成功", "success");
  };

  const getRoleDistribution = () => {
    const distribution: Record<string, number> = {};
    users.forEach(u => {
      const roles = u.roles && u.roles.length > 0 ? u.roles : [u.roleName];
      roles.forEach((role: string) => {
        distribution[role] = (distribution[role] || 0) + 1;
      });
    });
    return distribution;
  };

  if (loading) {
    return (
      <MainLayout title="用户管理">
        <div className="flex items-center justify-center h-64">
          <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>加载中...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="用户管理">
      <div data-cmp="Users" className="space-y-4">
        <PageHeader
          title="用户管理"
          subtitle={`${users.length} 个用户`}
          actions={
            <>
              <TechButton variant="ghost" icon={<RefreshCw size={13} />} onClick={handleRefresh}>
                刷新
              </TechButton>
              <TechButton variant="ghost" icon={<Download size={13} />} onClick={handleExport}>
                导出
              </TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>
                新建用户
              </TechButton>
            </>
          }
        />

        <div className="grid grid-cols-4 gap-3">
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
              <Users size={20} style={{ color: "#165DFF" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#165DFF" }}>{userStats.totalUsers}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总用户数</div>
            </div>
          </div>
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(0,214,143,0.15)" }}>
              <Activity size={20} style={{ color: "#00D68F" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{userStats.activeUsers}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃用户</div>
            </div>
          </div>
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(255,77,79,0.15)" }}>
              <Shield size={20} style={{ color: "#FF4D4F" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{userStats.adminUsers}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>管理员</div>
            </div>
          </div>
          <div className="rounded-lg p-4 flex items-center gap-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
              <TrendingUp size={20} style={{ color: "#A855F7" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "#A855F7" }}>{userStats.newUsers}</div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>本周新增</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Clock size={14} style={{ color: "#165DFF" }} />
              <span className="text-xs font-medium text-white">最近用户</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {recentUsers.map((user, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "rgba(22,93,255,0.15)", color: "#165DFF" }}>
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-white truncate">{user.name}</div>
                    <div className="text-xs truncate" style={{ color: "var(--muted-foreground)" }}>{user.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs" style={{ color: roleColors[user.role]?.color || "#94A3B8" }}>{user.role}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{user.lastLogin}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <Zap size={14} style={{ color: "#A855F7" }} />
              <span className="text-xs font-medium text-white">用户活跃度</span>
            </div>
            <div className="divide-y" style={{ borderColor: "var(--border)" }}>
              {userActivity.map((activity, idx) => (
                <div key={idx} className="px-4 py-2.5 flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-xs font-medium text-white">{activity.user}</div>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${Math.min((activity.actions / 250) * 100, 100)}%`,
                            background: "linear-gradient(90deg, #165DFF, #A855F7)" 
                          }} 
                        />
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium" style={{ color: "#165DFF" }}>{activity.actions}</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{activity.lastAction}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
              <BarChart3 size={14} style={{ color: "#00D68F" }} />
              <span className="text-xs font-medium text-white">角色分布</span>
            </div>
            <div className="p-4 space-y-3">
              {Object.entries(getRoleDistribution()).map(([role, count]) => {
                const colors = roleColors[role] || roleColors["开发工程师"];
                const percentage = users.length > 0 ? Math.round((count / users.length) * 100) : 0;
                return (
                  <div key={role}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: colors.color }}>{role}</span>
                      <span style={{ color: "var(--muted-foreground)" }}>{count} ({percentage}%)</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                      <div 
                        className="h-full rounded-full transition-all" 
                        style={{ width: `${percentage}%`, background: colors.color }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <Search size={13} style={{ color: "var(--muted-foreground)" }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索用户..."
                className="bg-transparent border-none outline-none text-xs flex-1"
                style={{ color: "var(--foreground)" }}
              />
            </div>

            <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
              <button
                onClick={() => setTab("users")}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{ color: tab === "users" ? "#165DFF" : "var(--muted-foreground)", borderBottom: tab === "users" ? "2px solid #165DFF" : "2px solid transparent" }}
              >
                用户列表
              </button>
              <button
                onClick={() => setTab("logs")}
                className="flex-1 py-2.5 text-xs font-medium transition-colors"
                style={{ color: tab === "logs" ? "#165DFF" : "var(--muted-foreground)", borderBottom: tab === "logs" ? "2px solid #165DFF" : "2px solid transparent" }}
              >
                操作日志
              </button>
            </div>

            {tab === "users" && (
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                    {["用户", "账号", "角色", "状态", "最后登录", "操作"].map((h) => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                        暂无用户数据
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <tr key={user.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: "rgba(22,93,255,0.15)", color: "#165DFF" }}>
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <div className="text-xs font-medium text-white">{user.name}</div>
                              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{user.account}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            {(user.roles && user.roles.length > 0 ? user.roles : [user.roleName]).map((role: string) => (
                              <span key={role} className="text-xs px-1.5 py-0.5 rounded" style={roleColors[role] || roleColors["开发工程师"]}>{role}</span>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2.5">
                          <StatusBadge status={user.status as any} />
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{user.lastLoginTime}</div>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex items-center gap-1">
                            <TechButton variant="ghost" size="xs" icon={<Eye size={11} />} onClick={() => handleView(user)}>查看</TechButton>
                            <TechButton variant="ghost" size="xs" icon={<Edit2 size={11} />} onClick={() => handleEdit(user)}>编辑</TechButton>
                            <TechButton variant="ghost" size="xs" onClick={() => handleToggleStatus(user)}>
                              {user.status === "disabled" ? "启用" : "禁用"}
                            </TechButton>
                            <TechButton variant="ghost" size="xs" icon={<Trash2 size={11} />} onClick={() => setDeletingUser(user)}>删除</TechButton>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}

            {tab === "logs" && (
              <div className="p-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                暂无操作日志
              </div>
            )}
          </div>

          <div className="w-72 rounded-lg flex-shrink-0 overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="text-xs font-medium text-white">用户详情</span>
            </div>
            {viewingUser ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold" style={{ background: "rgba(22,93,255,0.15)", color: "#165DFF" }}>
                    {viewingUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{viewingUser.name}</div>
                    <StatusBadge status={viewingUser.status as any} />
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    ["账号", viewingUser.account],
                    ["邮箱", viewingUser.email],
                    ["角色", (viewingUser.roles && viewingUser.roles.length > 0 ? viewingUser.roles.join(", ") : viewingUser.roleName)],
                    ["登录次数", String(viewingUser.loginCount || 0)],
                    ["最后登录IP", viewingUser.lastLoginIp || "—"],
                    ["最后登录时间", viewingUser.lastLoginTime],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                      <span className="text-white">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                点击查看按钮查看用户详情
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowModal(false)}>
          <div className="w-[500px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User size={15} style={{ color: "#165DFF" }} />
              {editingUser ? "编辑用户" : "新建用户"}
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>姓名 *</label>
                <input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 rounded-md text-xs" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} placeholder="请输入姓名" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>账号 *</label>
                <input value={formData.account} onChange={(e) => setFormData({ ...formData, account: e.target.value })} className="w-full px-3 py-2 rounded-md text-xs" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} placeholder="请输入账号" />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>邮箱</label>
                <input value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" className="w-full px-3 py-2 rounded-md text-xs" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} placeholder="请输入邮箱" />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>角色（可多选）</label>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <button
                      onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                      className="w-full px-3 py-2 rounded-md text-xs text-left bg-[var(--muted)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
                      style={{ minHeight: "40px" }}
                    >
                      <div className="flex flex-wrap gap-1 flex-1">
                        {formData.roles.length > 0 ? (
                          formData.roles.map((role) => (
                            <span 
                              key={role} 
                              className="text-xs px-2 py-0.5 rounded flex items-center gap-1"
                              style={{ 
                                background: (roleColors[role]?.bg || "rgba(148,163,184,0.1)"),
                                color: (roleColors[role]?.color || "#94A3B8"),
                              }}
                            >
                              {role}
                              <button 
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRoleToggle(role);
                                }}
                                className="hover:opacity-70"
                              >
                                <X size={10} />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span style={{ color: "var(--muted-foreground)" }}>请选择角色</span>
                        )}
                      </div>
                      <svg className={`w-4 h-4 transition-transform ${showRoleDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {showRoleDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
                        <div className="px-3 py-2 border-b border-[var(--border)]">
                          <button 
                            onClick={() => {
                              if (formData.roles.length === allRoles.length) {
                                setFormData({ ...formData, roles: [] });
                              } else {
                                setFormData({ ...formData, roles: [...allRoles] });
                              }
                            }}
                            className="text-xs text-[#165DFF] hover:text-[#2371f6]"
                          >
                            {formData.roles.length === allRoles.length ? "取消全选" : "全选"}
                          </button>
                        </div>
                        {allRoles.map((role) => {
                          const color = roleColors[role] || roleColors["开发工程师"];
                          return (
                            <label 
                              key={role} 
                              className="flex items-center gap-3 px-3 py-2.5 hover:bg-[var(--muted)] cursor-pointer transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={formData.roles.includes(role)}
                                onChange={() => handleRoleToggle(role)}
                                className="w-3.5 h-3.5 rounded border border-[var(--border)] bg-[var(--muted)] accent-[#165DFF]"
                              />
                              <span 
                                className="text-xs"
                                style={{ color: formData.roles.includes(role) ? color.color : "var(--foreground)" }}
                              >
                                {role}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {!editingUser && (
                <div>
                  <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>密码</label>
                  <input value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} type="password" className="w-full px-3 py-2 rounded-md text-xs" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} placeholder="默认密码: 123456" />
                </div>
              )}
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>状态</label>
                <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 rounded-md text-xs outline-none appearance-none cursor-pointer" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  <option value="online" style={{ color: "var(--foreground)", background: "var(--card)" }}>在线</option>
                  <option value="offline" style={{ color: "var(--foreground)", background: "var(--card)" }}>离线</option>
                  <option value="disabled" style={{ color: "var(--foreground)", background: "var(--card)" }}>禁用</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={handleSave}>{editingUser ? "保存" : "创建"}</TechButton>
            </div>
          </div>
        </div>
      )}

      {deletingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeletingUser(null)}>
          <div className="w-[400px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDeletingUser(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Trash2 size={15} style={{ color: "#FF4D4F" }} />确认删除
            </div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>确定要删除用户 "{deletingUser.name}" 吗？此操作不可恢复。</div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setDeletingUser(null)}>取消</TechButton>
              <TechButton variant="danger" onClick={handleDelete}>删除</TechButton>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}