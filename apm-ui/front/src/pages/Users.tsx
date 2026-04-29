import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Edit2, Lock, Shield, User, Clock, LogIn } from "lucide-react";

const users = [
  { id: 1, name: "张伟",   account: "zhangwei",  email: "zhangwei@corp.com",   role: "超级管理员", status: "online",  lastLogin: "2024-01-15 14:30", loginIp: "192.168.1.100", loginCount: 248, createdAt: "2023-01-01" },
  { id: 2, name: "李明",   account: "liming",    email: "liming@corp.com",     role: "运维管理员", status: "online",  lastLogin: "2024-01-15 12:10", loginIp: "192.168.1.101", loginCount: 186, createdAt: "2023-03-15" },
  { id: 3, name: "王芳",   account: "wangfang",  email: "wangfang@corp.com",   role: "项目负责人", status: "warning",  lastLogin: "2024-01-14 09:45", loginIp: "10.0.2.15",     loginCount: 132, createdAt: "2023-05-20" },
  { id: 4, name: "赵强",   account: "zhaoqiang", email: "zhaoqiang@corp.com",  role: "开发工程师", status: "offline", lastLogin: "2024-01-12 18:00", loginIp: "192.168.2.50",  loginCount: 95,  createdAt: "2023-07-01" },
  { id: 5, name: "陈静",   account: "chenjing",  email: "chenjing@corp.com",   role: "运维工程师", status: "online",  lastLogin: "2024-01-15 13:55", loginIp: "192.168.1.105", loginCount: 204, createdAt: "2023-02-10" },
  { id: 6, name: "刘博",   account: "liubo",     email: "liubo@corp.com",      role: "开发工程师", status: "online",  lastLogin: "2024-01-15 11:30", loginIp: "172.16.0.8",    loginCount: 78,  createdAt: "2023-09-01" },
  { id: 7, name: "黄磊",   account: "huanglei",  email: "huanglei@corp.com",   role: "项目负责人", status: "disabled", lastLogin: "2023-12-20 10:00", loginIp: "-",             loginCount: 42,  createdAt: "2023-06-15" },
];

const loginLogs = [
  { user: "zhangwei", time: "2024-01-15 14:30:22", ip: "192.168.1.100", result: "成功", ua: "Chrome 120" },
  { user: "liming",   time: "2024-01-15 12:10:08", ip: "192.168.1.101", result: "成功", ua: "Firefox 121" },
  { user: "wangfang", time: "2024-01-15 09:05:45", ip: "10.0.2.15",     result: "失败", ua: "Chrome 119" },
  { user: "chenjing", time: "2024-01-15 08:55:31", ip: "192.168.1.105", result: "成功", ua: "Chrome 120" },
  { user: "liubo",    time: "2024-01-14 17:42:10", ip: "172.16.0.8",    result: "成功", ua: "Edge 120" },
  { user: "wangfang", time: "2024-01-14 09:45:12", ip: "10.0.2.15",     result: "成功", ua: "Chrome 119" },
  { user: "zhaoqiang",time: "2024-01-12 18:00:05", ip: "192.168.2.50",  result: "成功", ua: "Chrome 118" },
];

const roleColors: Record<string, { bg: string; color: string }> = {
  "超级管理员": { bg: "rgba(255,77,79,0.1)",   color: "#FF4D4F" },
  "运维管理员": { bg: "rgba(22,93,255,0.1)",   color: "#165DFF" },
  "项目负责人": { bg: "rgba(168,85,247,0.1)",  color: "#A855F7" },
  "运维工程师": { bg: "rgba(0,214,143,0.1)",   color: "#00D68F" },
  "开发工程师": { bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
};

export default function Users() {
  const [tab, setTab] = useState<"users" | "logs">("users");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filtered = users.filter(u => u.name.includes(search) || u.account.includes(search));

  return (
    <MainLayout title="用户管理">
      <div data-cmp="Users" className="space-y-4">
        <PageHeader
          title="用户管理"
          subtitle={`${users.length} 个用户 · ${users.filter(u => u.status === "online").length} 人在线`}
          actions={
            <>
              <TechButton variant="secondary" icon={<Lock size={13} />}>重置密码</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>新增用户</TechButton>
            </>
          }
        />

        {/* Tab switch */}
        <div className="flex items-center gap-4">
          <div className="flex" style={{ borderBottom: "1px solid var(--border)" }}>
            {[["users", "用户列表", <User size={13} />], ["logs", "登录日志", <LogIn size={13} />]].map(([key, label, icon]) => (
              <button
                key={key as string}
                onClick={() => setTab(key as "users" | "logs")}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors"
                style={{ color: tab === key ? "#165DFF" : "var(--muted-foreground)", borderBottom: tab === key ? "2px solid #165DFF" : "2px solid transparent", marginBottom: "-1px" }}
              >
                {icon}{label}
              </button>
            ))}
          </div>
          <div className={`flex items-center gap-2 px-3 h-8 rounded-md max-w-xs ${tab === "users" ? "" : "hidden"}`} style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索用户..." className="bg-transparent border-none outline-none text-xs flex-1 text-white" />
          </div>
        </div>

        {/* Users table */}
        <div className={`rounded-lg overflow-hidden ${tab === "users" ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                {["用户", "账号", "角色", "状态", "最后登录", "登录IP", "登录次数", "操作"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const rc = roleColors[u.role] || roleColors["开发工程师"];
                return (
                  <tr key={u.id} className="table-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ background: `hsl(${u.id * 50}, 60%, 40%)` }}>{u.name.charAt(0)}</div>
                        <div>
                          <div className="text-xs font-medium text-white">{u.name}</div>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{u.account}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: rc.bg, color: rc.color }}>{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={u.status as "online" | "offline" | "warning" | "disabled"} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}><Clock size={10} />{u.lastLogin}</span>
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{u.loginIp}</td>
                    <td className="px-4 py-3 text-xs text-white">{u.loginCount}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <TechButton variant="ghost" size="xs" icon={<Edit2 size={11} />}>编辑</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Shield size={11} />}>权限</TechButton>
                        <TechButton variant={u.status === "disabled" ? "success" : "danger"} size="xs" icon={<Lock size={11} />}>{u.status === "disabled" ? "启用" : "禁用"}</TechButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Login logs table */}
        <div className={`rounded-lg overflow-hidden ${tab === "logs" ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                {["用户账号", "登录时间", "登录IP", "登录结果", "浏览器"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loginLogs.map((log, i) => (
                <tr key={i} className="table-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-2.5 text-xs font-medium text-white" style={{ fontFamily: "monospace" }}>{log.user}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{log.time}</td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{log.ip}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${log.result === "成功" ? "" : ""}`} style={{ background: log.result === "成功" ? "rgba(0,214,143,0.1)" : "rgba(255,77,79,0.1)", color: log.result === "成功" ? "#00D68F" : "#FF4D4F" }}>{log.result}</span>
                  </td>
                  <td className="px-4 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{log.ua}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        <div className={`fixed inset-0 flex items-center justify-center ${showModal ? "" : "hidden"}`} style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div className="w-[480px] rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2"><User size={15} style={{ color: "#165DFF" }} />新增用户</div>
            <div className="space-y-4">
              {[["姓名", "真实姓名"], ["账号", "登录账号"], ["邮箱", "企业邮箱"], ["初始密码", "初始密码"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input className="w-full h-8 px-3 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>角色</label>
                <div className="flex flex-wrap gap-2">
                  {Object.keys(roleColors).map((r) => (
                    <button key={r} className="text-xs px-2 py-1 rounded-full" style={{ background: roleColors[r].bg, color: roleColors[r].color }}>{r}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowModal(false)}>创建用户</TechButton>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
