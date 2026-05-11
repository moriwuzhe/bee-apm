import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { 
  Settings, Bell, Palette, Shield, Database, Globe, Save, RefreshCw, Moon, Sun, Monitor,
  Download, AlertTriangle, Activity, Zap, TrendingUp, Clock, BarChart3, Server, Wifi, Cpu,
  CheckCircle, XCircle, Users, Key, Lock, Plus
} from "lucide-react";

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | boolean;
  type: "text" | "boolean" | "select";
  options?: string[];
}

interface SystemStats {
  totalSettings: number;
  activeConfigs: number;
  lastUpdated: string;
  version: string;
}

interface RecentChange {
  setting: string;
  oldValue: string;
  newValue: string;
  changedBy: string;
  time: string;
}

interface SystemConfig {
  category: string;
  settings: number;
  lastModified: string;
}

interface SystemHealth {
  name: string;
  status: "healthy" | "warning" | "error";
  value: string;
}

const mockSettings: SystemSetting[] = [
  { id: "1", name: "系统名称", description: "显示在界面左上角的应用名称", value: "OpsWatch 运维监控平台", type: "text" },
  { id: "2", name: "默认主题", description: "用户登录后的默认界面主题", value: "dark", type: "select", options: ["dark", "light", "blue", "green", "purple"] },
  { id: "3", name: "告警声音", description: "收到告警时是否播放提示音", value: true, type: "boolean" },
  { id: "4", name: "自动刷新间隔", description: "页面数据自动刷新的时间间隔（秒）", value: "30", type: "select", options: ["10", "30", "60", "120", "300"] },
  { id: "5", name: "数据保留天数", description: "链路追踪数据的保留天数", value: "7", type: "select", options: ["3", "7", "14", "30", "90"] },
  { id: "6", name: "API限流", description: "启用API访问频率限制", value: true, type: "boolean" },
  { id: "7", name: "时区设置", description: "系统使用的时区", value: "Asia/Shanghai", type: "select", options: ["Asia/Shanghai", "America/New_York", "Europe/London", "Asia/Tokyo"] },
  { id: "8", name: "语言设置", description: "界面显示语言", value: "zh-CN", type: "select", options: ["zh-CN", "en-US"] },
];

const systemStats: SystemStats = {
  totalSettings: 48,
  activeConfigs: 42,
  lastUpdated: "2026-05-10 14:30",
  version: "2.4.1"
};

const recentChanges: RecentChange[] = [
  { setting: "告警声音", oldValue: "关闭", newValue: "开启", changedBy: "admin", time: "2026-05-10 14:25" },
  { setting: "数据保留天数", oldValue: "7", newValue: "14", changedBy: "operator", time: "2026-05-10 11:20" },
  { setting: "API限流", oldValue: "关闭", newValue: "开启", changedBy: "admin", time: "2026-05-09 16:45" },
  { setting: "自动刷新间隔", oldValue: "60", newValue: "30", changedBy: "monitor", time: "2026-05-09 09:30" },
];

const systemConfigs: SystemConfig[] = [
  { category: "基本设置", settings: 8, lastModified: "2026-05-10" },
  { category: "外观", settings: 12, lastModified: "2026-05-08" },
  { category: "通知", settings: 6, lastModified: "2026-05-10" },
  { category: "安全", settings: 10, lastModified: "2026-05-09" },
  { category: "数据", settings: 7, lastModified: "2026-05-07" },
  { category: "国际化", settings: 5, lastModified: "2026-05-05" },
];

const systemHealth: SystemHealth[] = [
  { name: "数据库连接", status: "healthy", value: "正常" },
  { name: "缓存服务", status: "healthy", value: "正常" },
  { name: "消息队列", status: "healthy", value: "正常" },
  { name: "API响应时间", status: "warning", value: "略高" },
  { name: "存储空间", status: "healthy", value: "充足" },
];

export default function SystemSettings() {
  const [settings, setSettings] = useState(mockSettings);
  const [activeTab, setActiveTab] = useState("general");
  const [saved, setSaved] = useState(false);

  const updateSetting = (id: string, newValue: string | boolean) => {
    setSettings((prev) =>
      prev.map((s) => (s.id === id ? { ...s, value: newValue } : s))
    );
    setSaved(false);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleRefresh = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleExport = () => {
    const config = JSON.stringify(settings, null, 2);
    const blob = new Blob([config], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "system-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: "general", label: "基本设置", icon: Settings },
    { id: "appearance", label: "外观", icon: Palette },
    { id: "notifications", label: "通知", icon: Bell },
    { id: "security", label: "安全", icon: Shield },
    { id: "data", label: "数据", icon: Database },
    { id: "localization", label: "国际化", icon: Globe },
  ];

  const getValueDisplay = (setting: SystemSetting) => {
    if (setting.type === "boolean") {
      return (
        <button
          onClick={() => updateSetting(setting.id, !setting.value)}
          className={`relative w-12 h-6 rounded-full transition-colors ${setting.value ? "bg-blue-500" : "bg-gray-600"}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${setting.value ? "translate-x-6" : "translate-x-0.5"}`} />
        </button>
      );
    }
    if (setting.type === "select") {
      return (
        <select
          value={setting.value as string}
          onChange={(e) => updateSetting(setting.id, e.target.value)}
          className="px-3 py-1.5 rounded-lg border text-sm"
          style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}
        >
          {setting.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    return (
      <input
        type="text"
        value={setting.value as string}
        onChange={(e) => updateSetting(setting.id, e.target.value)}
        className="px-3 py-1.5 rounded-lg border text-sm max-w-xs"
        style={{ background: "var(--input)", borderColor: "var(--border)", color: "var(--foreground)" }}
      />
    );
  };

  const renderHealthStatus = (status: SystemHealth["status"]) => {
    if (status === "healthy") {
      return <CheckCircle size={16} style={{ color: "#00D68F" }} />;
    } else if (status === "warning") {
      return <AlertTriangle size={16} style={{ color: "#FFB020" }} />;
    } else {
      return <XCircle size={16} style={{ color: "#FF3B30" }} />;
    }
  };

  const renderStatsCards = () => (
    <div className="grid grid-cols-4 gap-4 mb-4">
      <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总设置项</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{systemStats.totalSettings}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(22, 93, 255, 0.15)" }}>
            <Settings size={24} style={{ color: "#165DFF" }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>活跃配置</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{systemStats.activeConfigs}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.15)" }}>
            <Activity size={24} style={{ color: "#00D68F" }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>最后更新</div>
            <div className="text-sm font-bold mt-1" style={{ color: "var(--foreground)" }}>{systemStats.lastUpdated}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(255, 176, 32, 0.15)" }}>
            <Clock size={24} style={{ color: "#FFB020" }} />
          </div>
        </div>
      </div>

      <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>系统版本</div>
            <div className="text-2xl font-bold mt-1" style={{ color: "var(--foreground)" }}>v{systemStats.version}</div>
          </div>
          <div className="p-3 rounded-lg" style={{ background: "rgba(155, 77, 250, 0.15)" }}>
            <Zap size={24} style={{ color: "#9B4DF6" }} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecentChanges = () => (
    <div className="rounded-lg mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <TrendingUp size={16} style={{ color: "#165DFF" }} />
          <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>最近变更历史</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="space-y-3">
          {recentChanges.map((change, index) => (
            <div key={index} className="flex items-start gap-3 p-2 rounded" style={{ background: "var(--input)" }}>
              <div className="flex-1">
                <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{change.setting}</div>
                <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>
                  <span style={{ color: "#FF3B30" }}>{change.oldValue}</span>
                  <span className="mx-2">→</span>
                  <span style={{ color: "#00D68F" }}>{change.newValue}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{change.changedBy}</div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{change.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemConfigs = () => (
    <div className="rounded-lg mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <BarChart3 size={16} style={{ color: "#165DFF" }} />
          <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>系统配置分类</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {systemConfigs.map((config, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--input)" }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.15)" }}>
                  <Settings size={16} style={{ color: "#165DFF" }} />
                </div>
                <div>
                  <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{config.category}</div>
                  <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{config.settings} 项设置</div>
                </div>
              </div>
              <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{config.lastModified}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderSystemHealth = () => (
    <div className="rounded-lg mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-2">
          <Shield size={16} style={{ color: "#165DFF" }} />
          <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>系统健康状态</h2>
        </div>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-5 gap-3">
          {systemHealth.map((health, index) => (
            <div key={index} className="p-3 rounded-lg text-center" style={{ background: "var(--input)" }}>
              <div className="flex justify-center mb-2">{renderHealthStatus(health.status)}</div>
              <div className="text-xs font-medium" style={{ color: "var(--foreground)" }}>{health.name}</div>
              <div className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>{health.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderActions = () => (
    <div className="flex gap-2">
      <button
        onClick={handleSave}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: "#165DFF", color: "#fff" }}
      >
        <Save size={14} />
        保存设置
      </button>
      <button
        onClick={handleRefresh}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "var(--foreground)" }}
      >
        <RefreshCw size={14} />
        刷新
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium"
        style={{ background: "var(--accent)", color: "var(--foreground)" }}
      >
        <Download size={14} />
        导出配置
      </button>
    </div>
  );

  return (
    <MainLayout title="系统设置" actions={renderActions()}>
      {renderStatsCards()}
      {renderRecentChanges()}
      {renderSystemConfigs()}
      {renderSystemHealth()}

      <div className="flex gap-4">
        <div className="w-48 flex-shrink-0">
          <div className="rounded-lg p-2" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors mb-1"
                  style={{
                    background: activeTab === tab.id ? "var(--accent)" : "transparent",
                    color: activeTab === tab.id ? "var(--foreground)" : "var(--muted-foreground)",
                  }}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex-1 space-y-4">
          {saved && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(0, 214, 143, 0.15)", border: "1px solid #00D68F" }}>
              <RefreshCw size={16} style={{ color: "#00D68F" }} />
              <span className="text-sm" style={{ color: "#00D68F" }}>设置已保存</span>
            </div>
          )}

          {activeTab === "general" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>基本设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>配置系统的基本参数</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => ["1", "4", "5", "6"].includes(s.id)).map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>外观设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>自定义界面外观和主题</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => s.id === "2").map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}

                <div className="mt-6">
                  <div className="text-sm font-medium mb-3" style={{ color: "var(--foreground)" }}>主题预览</div>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "dark", name: "深空蓝", color: "#0F172A", icon: Moon },
                      { id: "light", name: "晨曦白", color: "#F8FAFC", icon: Sun },
                      { id: "blue", name: "科技蓝", color: "#165DFF", icon: Monitor },
                    ].map((theme) => (
                      <div
                        key={theme.id}
                        className="p-3 rounded-lg cursor-pointer transition-all hover:scale-105"
                        style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                        onClick={() => updateSetting("2", theme.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 rounded" style={{ background: theme.color }} />
                          <span className="text-xs" style={{ color: "var(--foreground)" }}>{theme.name}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>通知设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>配置系统通知和提醒方式</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => s.id === "3").map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>安全设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>配置系统安全策略</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => s.id === "6").map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "data" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>数据设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>配置数据存储和保留策略</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => ["5"].includes(s.id)).map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "localization" && (
            <div className="rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-sm font-medium" style={{ color: "var(--foreground)" }}>国际化设置</h2>
                <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>配置语言和时区</p>
              </div>
              <div className="p-4 space-y-4">
                {settings.filter(s => ["7", "8"].includes(s.id)).map((setting) => (
                  <div key={setting.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{setting.name}</div>
                      <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{setting.description}</div>
                    </div>
                    <div className="ml-4">{getValueDisplay(setting)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
