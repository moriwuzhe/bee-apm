import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Bell, Search, Settings, User, ChevronDown, AlertTriangle, CheckCircle, 
  Info, X, Palette, Check, Moon, Sun, Clock, Filter, RefreshCw,
  Activity, Server, Terminal, Wifi, WifiOff
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import { useLocalStorage } from "../../hooks";
import { Modal } from "../../components/UI";
import { useToast } from "../../context/ToastContext";

interface AlertItem {
  id: string;
  type: "error" | "warn" | "info" | "success";
  msg: string;
  time: string;
  read: boolean;
  source?: string;
}

const initialAlerts: AlertItem[] = [
  { id: "1", type: "error", msg: "生产环境 order-service 出现 OOM 告警", time: "2分钟前", read: false, source: "JVM" },
  { id: "2", type: "warn", msg: "主机 192.168.1.15 CPU使用率超过85%", time: "8分钟前", read: false, source: "主机监控" },
  { id: "3", type: "info", msg: "Agent v2.4.1 版本升级完成", time: "30分钟前", read: false, source: "Agent" },
  { id: "4", type: "success", msg: "payment-gateway 健康检查恢复正常", time: "1小时前", read: true, source: "健康检查" },
  { id: "5", type: "warn", msg: "API响应时间超过500ms阈值", time: "2小时前", read: true, source: "API监控" },
];

const searchHistory = ["order-service", "192.168.1.15", "CPU告警", "payment-gateway"];

export default function TopBar({
  title = "监控大盘",
}: {
  title?: string;
}) {
  const navigate = useNavigate();
  const { theme, setTheme, themes } = useTheme();
  const { showToast } = useToast();
  const [showAlerts, setShowAlerts] = useState(false);
  const [showUser, setShowUser] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);
  const [darkMode, setDarkMode] = useLocalStorage("theme", true);
  const [filterType, setFilterType] = useState<string>("all");

  const alertsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target as Node)) {
        setShowAlerts(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUser(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setShowTheme(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (value: string) => {
    if (value.trim()) {
      showToast(`搜索: "${value}"`, "info");
      setShowSearch(false);
      setSearchValue("");
    }
  };

  const unreadCount = alerts.filter(a => !a.read).length;

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const markAllAsRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
    showToast("全部已读", "success");
  };

  const deleteAlert = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setAlerts(prev => prev.filter(a => a.id !== id));
    showToast("已删除", "info");
  };

  const handleLogout = () => {
    showToast("已退出登录", "success");
    setShowUser(false);
    setTimeout(() => {
      navigate("/");
    }, 800);
  };

  const handleThemeChange = (themeId: string) => {
    setTheme(themeId);
    setDarkMode(themeId !== "light");
    setShowTheme(false);
    const selectedTheme = themes.find(t => t.id === themeId);
    showToast(`已切换到${selectedTheme?.name || themeId}主题`, "success");
  };

  const filteredAlerts = filterType === "all" 
    ? alerts 
    : alerts.filter(a => a.type === filterType);

  return (
    <div
      data-cmp="TopBar"
      className="flex items-center h-14 px-4 gap-2 flex-shrink-0"
      style={{
        background: "var(--sidebar)",
        borderBottom: "1px solid var(--border)",
        position: "relative",
        zIndex: 50,
      }}
    >
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>OpsWatch</span>
        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>/</span>
        <span className="text-sm font-medium text-white">{title}</span>
      </div>

      <div className="relative flex-1 max-w-md" ref={searchRef}>
        <div
          className="flex items-center gap-2 px-3 h-9 rounded-lg transition-all duration-200 cursor-pointer"
          style={{ 
            background: showSearch ? "var(--input)" : "var(--card)", 
            border: `1px solid ${showSearch ? "var(--primary)" : "var(--border)"}`, 
            color: "var(--muted-foreground)",
            boxShadow: showSearch ? "0 0 0 3px rgba(22, 93, 255, 0.1)" : "none"
          }}
          onClick={() => { setShowSearch(!showSearch); setShowAlerts(false); setShowUser(false); setShowTheme(false); }}
        >
          <Search size={14} style={{ opacity: showSearch ? 1 : 0.6 }} />
          <input
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch(searchValue)}
            placeholder="搜索应用、主机、告警..."
            className="flex-1 bg-transparent border-none outline-none text-sm"
            style={{ color: "var(--foreground)" }}
            onClick={(e) => e.stopPropagation()}
          />
          <span className="text-xs px-2 py-0.5 rounded-md" style={{ background: "var(--muted)", color: "var(--muted-foreground)", fontSize: "10px" }}>⌘K</span>
        </div>

        {showSearch && (
          <div
            className="absolute left-0 top-10 w-full rounded-lg overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
          >
            <div className="p-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Search size={14} style={{ color: "var(--muted-foreground)" }} />
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch(searchValue)}
                  placeholder="输入搜索内容..."
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                  style={{ color: "var(--foreground)" }}
                  autoFocus
                />
                {searchValue && (
                  <button onClick={() => setSearchValue("")} className="p-1 hover:bg-input rounded">
                    <X size={14} style={{ color: "var(--muted-foreground)" }} />
                  </button>
                )}
              </div>
            </div>

            {searchHistory.length > 0 && (
              <div className="p-2">
                <div className="text-xs px-2 py-1" style={{ color: "var(--muted-foreground)" }}>搜索历史</div>
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 text-xs rounded hover:bg-input transition-colors"
                    style={{ color: "var(--foreground)" }}
                  >
                    <Search size={12} style={{ color: "var(--muted-foreground)" }} />
                    {item}
                  </button>
                ))}
              </div>
            )}

            <div className="px-3 py-2" style={{ background: "var(--input)" }}>
              <div className="text-xs text-center" style={{ color: "var(--muted-foreground)" }}>
                按 Enter 搜索，按 Esc 关闭
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => { setShowTheme(!showTheme); setShowUser(false); setShowAlerts(false); setShowSearch(false); }}
            className="flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
            style={{ background: showTheme ? "var(--accent)" : "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
            title="切换主题"
          >
            {theme.id === "light" ? <Moon size={15} /> : <Sun size={15} />}
          </button>

          {showTheme && (
            <div
              className="absolute right-0 top-10 w-60 rounded-lg overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
            >
              <div className="px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                <span className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>选择主题</span>
              </div>
              <div className="grid grid-cols-2 gap-1 p-2">
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-lg transition-all"
                    style={{ background: theme.id === t.id ? "var(--accent)" : "transparent", border: theme.id === t.id ? "1px solid var(--primary)" : "none" }}
                  >
                    <div className="flex gap-1">
                      <div className="w-3 h-3 rounded-full" style={{ background: t.colors.primary }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: t.colors.chart2 }} />
                      <div className="w-3 h-3 rounded-full" style={{ background: t.colors.chart3 }} />
                    </div>
                    <span className="text-xs" style={{ color: "var(--foreground)" }}>{t.name}</span>
                    {theme.id === t.id && (
                      <Check size={12} style={{ color: "var(--primary)" }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={alertsRef}>
          <button
            onClick={() => { setShowAlerts(!showAlerts); setShowUser(false); setShowTheme(false); setShowSearch(false); }}
            className="relative flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
            style={{ background: showAlerts ? "var(--accent)" : "transparent", border: "1px solid var(--border)" }}
          >
            <Bell size={15} style={{ color: "var(--muted-foreground)" }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 rounded-full text-xs text-white font-medium" style={{ background: "#FF4D4F", fontSize: "10px" }}>
                {unreadCount}
              </span>
            )}
          </button>

          {showAlerts && (
            <div
              className="absolute right-0 top-10 w-80 rounded-lg overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
            >
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Bell size={14} style={{ color: "var(--primary)" }} />
                  <span className="text-sm font-medium text-white">消息通知</span>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button onClick={markAllAsRead} className="text-xs px-2 py-0.5 rounded-full hover:bg-input transition-colors" style={{ color: "var(--primary)" }}>
                      全部已读
                    </button>
                  )}
                  <button onClick={() => showToast("刷新中...", "info")} className="p-1 hover:bg-input rounded">
                    <RefreshCw size={12} style={{ color: "var(--muted-foreground)" }} />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-1 px-3 py-2" style={{ borderBottom: "1px solid var(--border)" }}>
                {["all", "error", "warn", "success"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setFilterType(type)}
                    className="flex-1 px-2 py-1 text-xs rounded transition-colors"
                    style={{ 
                      background: filterType === type ? "var(--accent)" : "transparent",
                      color: filterType === type ? "var(--primary)" : "var(--muted-foreground)"
                    }}
                  >
                    {type === "all" && "全部"}
                    {type === "error" && "错误"}
                    {type === "warn" && "警告"}
                    {type === "success" && "成功"}
                  </button>
                ))}
              </div>

              {filteredAlerts.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>暂无{filterType === "all" ? "" : (filterType === "error" ? "错误" : filterType === "warn" ? "警告" : "成功")}消息</div>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {filteredAlerts.map((a) => (
                    <div 
                      key={a.id} 
                      className="flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors" 
                      style={{ 
                        borderBottom: "1px solid var(--border)", 
                        opacity: a.read ? 0.6 : 1,
                        backgroundColor: !a.read ? "rgba(22, 93, 255, 0.05)" : "transparent"
                      }} 
                      onClick={() => markAsRead(a.id)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {a.type === "error" && <AlertTriangle size={14} style={{ color: "#FF4D4F" }} />}
                        {a.type === "warn" && <AlertTriangle size={14} style={{ color: "#FFAA00" }} />}
                        {a.type === "info" && <Info size={14} style={{ color: "#165DFF" }} />}
                        {a.type === "success" && <CheckCircle size={14} style={{ color: "#00D68F" }} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{a.msg}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.source}</span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{a.time}</span>
                        </div>
                      </div>
                      <button onClick={(e) => deleteAlert(e, a.id)} className="opacity-0 hover:opacity-100 text-xs p-1 hover:bg-input rounded transition-all" style={{ color: "var(--muted-foreground)" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="px-4 py-2 text-center">
                <button className="text-xs" style={{ color: "var(--primary)" }} onClick={() => navigate("/alert-rules")}>查看全部告警</button>
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowSettings(true)}
          className="flex items-center justify-center w-8 h-8 rounded-md transition-all hover:bg-input"
          style={{ background: "transparent", border: "1px solid var(--border)", color: "var(--muted-foreground)" }}
          title="设置"
        >
          <Settings size={15} />
        </button>

        <div className="relative" ref={userRef}>
          <button
            onClick={() => { setShowUser(!showUser); setShowAlerts(false); setShowTheme(false); setShowSearch(false); }}
            className="flex items-center gap-2 px-2 h-8 rounded-md transition-all hover:bg-input"
            style={{ background: showUser ? "var(--accent)" : "transparent", border: "1px solid var(--border)" }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--sidebar-primary))" }}>A</div>
            <span className="text-xs text-white">admin</span>
            <ChevronDown size={12} style={{ color: "var(--muted-foreground)" }} />
          </button>

          {showUser && (
            <div
              className="absolute right-0 top-10 w-52 rounded-lg overflow-hidden"
              style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "0 8px 32px rgba(0,0,0,0.5)", zIndex: 100 }}
            >
              <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white" style={{ background: "linear-gradient(135deg, var(--primary), var(--sidebar-primary))" }}>A</div>
                  <div>
                    <div className="text-sm font-medium text-white">超级管理员</div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>admin@opswatch.com</div>
                  </div>
                </div>
              </div>

              <div className="p-2">
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); setShowSettings(true); }}>
                  <User size={13} /> 个人资料
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); setShowTheme(true); }}>
                  <Palette size={13} /> 主题设置
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); showToast("开发中...", "info"); }}>
                  <Activity size={13} /> 操作日志
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); showToast("开发中...", "info"); }}>
                  <Server size={13} /> 系统监控
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); showToast("开发中...", "info"); }}>
                  <Terminal size={13} /> API文档
                </button>
              </div>

              <div style={{ height: "1px", background: "var(--border)" }} />

              <div className="p-2">
                <button className="w-full flex items-center justify-between px-2 py-2 text-xs rounded hover:bg-input transition-colors" style={{ color: "var(--foreground)" }} onClick={() => { setShowUser(false); showToast("开发中...", "info"); }}>
                  <span className="flex items-center gap-2">
                    {darkMode ? <Moon size={13} /> : <Sun size={13} />}
                    {darkMode ? "深色模式" : "浅色模式"}
                  </span>
                  {darkMode ? <Check size={12} style={{ color: "var(--primary)" }} /> : null}
                </button>
              </div>

              <div style={{ height: "1px", background: "var(--border)" }} />

              <button className="w-full flex items-center gap-2 px-4 py-2 text-xs transition-colors" style={{ color: "#FF4D4F" }} onClick={handleLogout}>
                <X size={13} /> 退出登录
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showSettings} onClose={() => setShowSettings(false)} title="设置">
        <div className="space-y-6">
          <div>
            <div className="text-sm font-medium text-white mb-3">外观设置</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--input)" }}>
                <div className="flex items-center gap-2">
                  <Palette size={16} style={{ color: "var(--foreground)" }} />
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>当前主题</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: theme.colors.primary }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: theme.colors.chart2 }} />
                    <div className="w-3 h-3 rounded-full" style={{ background: theme.colors.chart3 }} />
                  </div>
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>{theme.name}</span>
                </div>
              </div>
              <button onClick={() => { setShowSettings(false); setShowTheme(true); }} className="flex items-center justify-center gap-2 p-3 rounded-lg transition-colors" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                <Palette size={16} />
                <span className="text-xs">切换主题</span>
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-white mb-3">快捷操作</div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Activity, label: "系统监控", color: "#165DFF" },
                { icon: Server, label: "服务器管理", color: "#00D68F" },
                { icon: Terminal, label: "命令行", color: "#FFAA00" },
                { icon: Wifi, label: "网络状态", color: "#A855F7" },
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => showToast(`${item.label} 开发中...`, "info")}
                  className="flex items-center gap-2 p-3 rounded-lg transition-colors hover:bg-input"
                  style={{ background: "var(--input)" }}
                >
                  <item.icon size={16} style={{ color: item.color }} />
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm font-medium text-white mb-3">系统状态</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "服务状态", status: "online", color: "#00D68F" },
                { label: "数据库", status: "online", color: "#00D68F" },
                { label: "缓存", status: "online", color: "#00D68F" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--input)" }}>
                  <span className="text-xs" style={{ color: "var(--foreground)" }}>{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs" style={{ color: item.color }}>{item.status === "online" ? "正常" : "异常"}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
