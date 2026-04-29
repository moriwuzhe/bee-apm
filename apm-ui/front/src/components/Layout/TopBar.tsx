import { useState } from "react";
import { Bell, Search, Settings, User, ChevronDown, AlertTriangle, CheckCircle, Info } from "lucide-react";

const alerts = [
  { type: "error", msg: "生产环境 order-service 出现 OOM 告警", time: "2分钟前" },
  { type: "warn", msg: "主机 192.168.1.15 CPU使用率超过85%", time: "8分钟前" },
  { type: "info", msg: "Agent v2.4.1 版本升级完成", time: "30分钟前" },
  { type: "ok", msg: "payment-gateway 健康检查恢复正常", time: "1小时前" },
];

export default function TopBar({
  title = "监控大盘",
}: {
  title?: string;
}) {
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUser, setShowUser] = useState(false);

  return (
    <div
      data-cmp="TopBar"
      className="flex items-center h-14 px-4 gap-3 flex-shrink-0"
      style={{
        background: "var(--sidebar)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 50,
      }}
    >
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>OpsWatch</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/</span>
        <span className="text-sm font-medium text-white">{title}</span>
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-3 h-8 rounded-md w-56" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
        <Search size={13} style={{ color: "var(--muted-foreground)" }} />
        <input
          placeholder="搜索应用、主机、告警..."
          className="bg-transparent border-none outline-none text-xs flex-1"
          style={{ color: "var(--foreground)" }}
        />
        <span className="text-xs px-1 rounded" style={{ background: "var(--border)", color: "var(--muted-foreground)" }}>⌘K</span>
      </div>

      {/* Alert Bell */}
      <div className="relative">
        <button
          onClick={() => { setShowAlerts(!showAlerts); setShowUser(false); }}
          className="relative flex items-center justify-center w-8 h-8 rounded-md transition-colors"
          style={{ background: showAlerts ? "rgba(22,93,255,0.15)" : "transparent", border: "1px solid var(--border)" }}
        >
          <Bell size={15} style={{ color: "var(--muted-foreground)" }} />
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-xs text-white font-medium" style={{ background: "#FF4D4F", fontSize: "10px" }}>3</span>
        </button>

        {/* Alert dropdown */}
        <div
          className={`absolute right-0 top-10 w-80 rounded-lg overflow-hidden ${showAlerts ? "" : "hidden"}`}
          style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <span className="text-sm font-medium text-white">消息告警</span>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(255,77,79,0.15)", color: "#FF4D4F" }}>3条未读</span>
          </div>
          {alerts.map((a, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 cursor-pointer table-row-hover" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex-shrink-0 mt-0.5">
                {a.type === "error" && <AlertTriangle size={14} style={{ color: "#FF4D4F" }} />}
                {a.type === "warn" && <AlertTriangle size={14} style={{ color: "#FFAA00" }} />}
                {a.type === "info" && <Info size={14} style={{ color: "#165DFF" }} />}
                {a.type === "ok" && <CheckCircle size={14} style={{ color: "#00D68F" }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{a.msg}</div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{a.time}</div>
              </div>
            </div>
          ))}
          <div className="px-4 py-2 text-center">
            <button className="text-xs" style={{ color: "#165DFF" }}>查看全部告警</button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md transition-colors"
        style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
      >
        <Settings size={15} />
      </button>

      {/* User */}
      <div className="relative">
        <button
          onClick={() => { setShowUser(!showUser); setShowAlerts(false); }}
          className="flex items-center gap-2 px-2 h-8 rounded-md transition-colors"
          style={{ background: showUser ? "rgba(22,93,255,0.1)" : "transparent", border: "1px solid var(--border)" }}
        >
          <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, #165DFF, #0A3FCC)" }}>A</div>
          <span className="text-xs text-white">admin</span>
          <ChevronDown size={12} style={{ color: "var(--muted-foreground)" }} />
        </button>

        <div
          className={`absolute right-0 top-10 w-44 rounded-lg overflow-hidden ${showUser ? "" : "hidden"}`}
          style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
        >
          <div className="px-3 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white">超级管理员</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>admin@opswatch.com</div>
          </div>
          {["个人设置", "操作日志", "退出登录"].map((item, i) => (
            <button key={i} className="w-full text-left px-3 py-2 text-xs table-row-hover transition-colors" style={{ color: i === 2 ? "#FF4D4F" : "var(--foreground)" }}>
              {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
