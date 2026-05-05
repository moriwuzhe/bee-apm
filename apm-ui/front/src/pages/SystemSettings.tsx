import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Settings, Bell, Palette, Shield, Database, Globe, Save, RefreshCw, Moon, Sun, Monitor } from "lucide-react";

interface SystemSetting {
  id: string;
  name: string;
  description: string;
  value: string | boolean;
  type: "text" | "boolean" | "select";
  options?: string[];
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

  return (
    <MainLayout title="系统设置">
      <div className="flex gap-4">
        {/* 侧边标签 */}
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

        {/* 设置内容 */}
        <div className="flex-1 space-y-4">
          {/* 保存提示 */}
          {saved && (
            <div className="p-3 rounded-lg flex items-center gap-2" style={{ background: "rgba(0, 214, 143, 0.15)", border: "1px solid #00D68F" }}>
              <RefreshCw size={16} style={{ color: "#00D68F" }} />
              <span className="text-sm" style={{ color: "#00D68F" }}>设置已保存</span>
            </div>
          )}

          {/* 基本设置 */}
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

          {/* 外观设置 */}
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

                {/* 主题预览 */}
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

          {/* 通知设置 */}
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

          {/* 安全设置 */}
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

          {/* 数据设置 */}
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

          {/* 国际化设置 */}
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

          {/* 保存按钮 */}
          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--muted)", color: "var(--muted-foreground)" }}
            >
              重置
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "#165DFF", color: "#fff" }}
            >
              <Save size={14} />
              保存设置
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}