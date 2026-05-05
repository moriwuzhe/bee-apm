import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  AppWindow,
  Cpu,
  Monitor,
  Network,
  GitBranch,
  PackageOpen,
  Users,
  Shield,
  Key,
  ChevronLeft,
  ChevronRight,
  Activity,
  ChevronDown,
  ChevronUp,
  BellIcon,
  Heart,
  FileText,
  Book,
  Database,
  Settings,
} from "lucide-react";

interface NavItem {
  icon: React.ReactNode;
  label: string;
  path: string;
  children?: { label: string; path: string }[];
}

const navGroups = [
  {
    group: "监控运维",
    items: [
      { icon: <LayoutDashboard size={16} />, label: "监控大盘", path: "/dashboard" },
      { icon: <FolderKanban size={16} />, label: "项目管理", path: "/projects" },
      { icon: <AppWindow size={16} />, label: "应用管理", path: "/applications" },
      { icon: <Cpu size={16} />, label: "Agent管控", path: "/agent" },
      { icon: <Monitor size={16} />, label: "主机&JVM监控", path: "/jvm" },
      { icon: <Network size={16} />, label: "网络拓扑", path: "/topology" },
      { icon: <GitBranch size={16} />, label: "服务依赖", path: "/service-dep" },
      { icon: <PackageOpen size={16} />, label: "版本发布", path: "/releases" },
      { icon: <BellIcon size={16} />, label: "告警规则", path: "/alert-rules" },
      { icon: <Activity size={16} />, label: "链路追踪", path: "/trace-tracking" },
      { icon: <Heart size={16} />, label: "健康检查", path: "/health-check" },
      { icon: <FileText size={16} />, label: "日志查看", path: "/log-viewer" },
    ],
  },
  {
    group: "权限管控",
    items: [
      { icon: <Users size={16} />, label: "用户管理", path: "/users" },
      { icon: <Shield size={16} />, label: "角色管理", path: "/roles" },
      { icon: <Key size={16} />, label: "权限管理", path: "/permissions" },
    ],
  },
  {
    group: "开发工具",
    items: [
      { icon: <Book size={16} />, label: "API文档", path: "/api-docs" },
      { icon: <Database size={16} />, label: "数据库管理", path: "/database" },
      { icon: <Settings size={16} />, label: "系统设置", path: "/settings" },
    ],
  },
];

export default function Sidebar({
  collapsed = false,
  onToggle = () => {},
}: {
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(["监控运维", "权限管控", "开发工具"]);

  const toggleGroup = (group: string) => {
    setOpenGroups((prev) =>
      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]
    );
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div
      data-cmp="Sidebar"
      className={`flex flex-col h-full transition-all duration-300 ${collapsed ? "w-14" : "w-56"}`}
      style={{ background: "var(--sidebar)", borderRight: "1px solid var(--sidebar-border)" }}
    >
      {/* Logo */}
      <div className="flex items-center h-14 px-3 flex-shrink-0" style={{ borderBottom: "1px solid var(--sidebar-border)" }}>
        <div className="flex items-center justify-center w-8 h-8 rounded-md flex-shrink-0" style={{ background: "linear-gradient(135deg, #165DFF 0%, #0A3FCC 100%)" }}>
          <Activity size={16} className="text-white" />
        </div>
        <div className={`ml-2 overflow-hidden transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "w-auto opacity-100"}`}>
          <div className="text-sm font-semibold text-white whitespace-nowrap">OpsWatch</div>
          <div className="text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>运维监控平台</div>
        </div>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {navGroups.map((group) => (
          <div key={group.group} className="mb-1">
            {!collapsed && (
              <button
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium uppercase tracking-widest select-none"
                style={{ color: "var(--muted-foreground)" }}
                onClick={() => toggleGroup(group.group)}
              >
                <span>{group.group}</span>
                {openGroups.includes(group.group) ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
            <div className={`${!collapsed && !openGroups.includes(group.group) ? "hidden" : ""}`}>
              {group.items.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md mx-1 mb-0.5 text-sm transition-all duration-150 ${collapsed ? "justify-center" : ""} ${
                    isActive(item.path)
                      ? "text-white"
                      : "hover:text-white"
                  }`}
                  style={{
                    width: collapsed ? "calc(100% - 8px)" : "calc(100% - 8px)",
                    background: isActive(item.path)
                      ? "linear-gradient(90deg, rgba(22,93,255,0.35) 0%, rgba(22,93,255,0.1) 100%)"
                      : "transparent",
                    borderLeft: isActive(item.path) ? "2px solid #165DFF" : "2px solid transparent",
                    color: isActive(item.path) ? "#fff" : "var(--sidebar-foreground)",
                  }}
                  title={collapsed ? item.label : undefined}
                >
                  <span className={`flex-shrink-0 ${isActive(item.path) ? "text-tech-blue" : ""}`} style={{ color: isActive(item.path) ? "#165DFF" : undefined }}>
                    {item.icon}
                  </span>
                  <span className={`overflow-hidden whitespace-nowrap transition-all duration-300 ${collapsed ? "w-0 opacity-0" : "opacity-100"}`}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Toggle */}
      <div className="flex-shrink-0 p-2" style={{ borderTop: "1px solid var(--sidebar-border)" }}>
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center h-8 rounded-md transition-colors"
          style={{ color: "var(--muted-foreground)", background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(148,163,184,0.08)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {collapsed ? <ChevronRight size={16} /> : <><ChevronLeft size={16} /><span className="ml-1 text-xs">收起</span></>}
        </button>
      </div>
    </div>
  );
}