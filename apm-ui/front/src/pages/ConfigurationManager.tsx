import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Settings, Save, RefreshCw, Download, Upload, Plus, Edit2, Trash2, Eye, Search, Filter, CheckCircle, AlertCircle, Info } from "lucide-react";

interface ConfigItem {
  id: string;
  name: string;
  category: string;
  key: string;
  value: string;
  description: string;
  type: "string" | "number" | "boolean" | "json";
  editable: boolean;
  status: "active" | "inactive";
  lastModified: string;
}

const mockConfigs: ConfigItem[] = [
  { id: "1", name: "日志级别", category: "logging", key: "logging.level", value: "INFO", description: "系统日志输出级别", type: "string", editable: true, status: "active", lastModified: "2小时前" },
  { id: "2", name: "请求超时", category: "api", key: "api.timeout", value: "30000", description: "API请求超时时间(毫秒)", type: "number", editable: true, status: "active", lastModified: "1天前" },
  { id: "3", name: "启用缓存", category: "cache", key: "cache.enabled", value: "true", description: "是否启用缓存", type: "boolean", editable: true, status: "active", lastModified: "3天前" },
  { id: "4", name: "缓存过期时间", category: "cache", key: "cache.ttl", value: "3600", description: "缓存过期时间(秒)", type: "number", editable: true, status: "active", lastModified: "3天前" },
  { id: "5", name: "告警阈值", category: "alert", key: "alert.threshold.cpu", value: "80", description: "CPU告警阈值(%)", type: "number", editable: true, status: "active", lastModified: "1周前" },
  { id: "6", name: "告警阈值", category: "alert", key: "alert.threshold.memory", value: "90", description: "内存告警阈值(%)", type: "number", editable: true, status: "active", lastModified: "1周前" },
  { id: "7", name: "数据库连接池", category: "database", key: "db.pool.size", value: "20", description: "数据库连接池大小", type: "number", editable: true, status: "active", lastModified: "2周前" },
  { id: "8", name: "调试模式", category: "system", key: "system.debug", value: "false", description: "是否启用调试模式", type: "boolean", editable: false, status: "inactive", lastModified: "1个月前" },
];

const categories = ["全部", "logging", "api", "cache", "alert", "database", "system"];

export default function ConfigurationManager() {
  const [activeTab, setActiveTab] = useState<"list" | "edit" | "import">("list");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConfig, setSelectedConfig] = useState<ConfigItem | null>(null);

  const filteredConfigs = mockConfigs.filter(config => {
    const matchesCategory = selectedCategory === "全部" || config.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      config.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      config.key.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleEdit = (config: ConfigItem) => {
    setSelectedConfig(config);
    setActiveTab("edit");
  };

  const handleSave = () => {
    if (selectedConfig) {
      setActiveTab("list");
    }
  };

  return (
    <MainLayout title="配置管理">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("list")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "list" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "list" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "list" ? "white" : "var(--foreground)"
              }}
            >
              配置列表
            </button>
            <button
              onClick={() => setActiveTab("import")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "import" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "import" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "import" ? "white" : "var(--foreground)"
              }}
            >
              导入导出
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--primary)",
                color: "white"
              }}
            >
              <Plus className="w-4 h-4" />
              添加配置
            </button>
          </div>
        </div>

        {activeTab === "list" && (
          <>
            {/* 搜索和筛选 */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="搜索配置名称或键..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--card)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 配置列表 */}
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>配置名称</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>键</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>值</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>类别</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>最后修改</th>
                      <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredConfigs.map((config) => (
                      <tr key={config.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{config.name}</span>
                            {!config.editable && (
                              <Info className="w-4 h-4" style={{ color: "#FAAD14" }} title="只读" />
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono text-sm" style={{ color: "var(--muted-foreground)" }}>{config.key}</td>
                        <td className="px-4 py-3 font-mono text-sm">{config.value}</td>
                        <td className="px-4 py-3">
                          <span
                            className="px-2 py-1 rounded text-xs"
                            style={{
                              background: "rgba(24, 144, 255, 0.1)",
                              color: "#1890FF"
                            }}
                          >
                            {config.category}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className="flex items-center gap-1"
                            style={{ color: config.status === "active" ? "#00D68F" : "#94A3B8" }}
                          >
                            {config.status === "active" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {config.status === "active" ? "启用" : "禁用"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{config.lastModified}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(config)}
                              disabled={!config.editable}
                              className="p-2 rounded hover:bg-muted transition-all disabled:opacity-50"
                              style={{ background: "var(--muted)" }}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded hover:bg-red-50 transition-all">
                              <Eye className="w-4 h-4" />
                            </button>
                            {config.editable && (
                              <button className="p-2 rounded hover:bg-red-50 transition-all">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === "edit" && selectedConfig && (
          <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-medium mb-4">编辑配置</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>配置名称</label>
                <input
                  type="text"
                  defaultValue={selectedConfig.name}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>配置键</label>
                <input
                  type="text"
                  defaultValue={selectedConfig.key}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>配置值</label>
                <input
                  type="text"
                  defaultValue={selectedConfig.value}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>类型</label>
                <select
                  defaultValue={selectedConfig.type}
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                >
                  <option value="string">字符串</option>
                  <option value="number">数字</option>
                  <option value="boolean">布尔</option>
                  <option value="json">JSON</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>描述</label>
                <textarea
                  defaultValue={selectedConfig.description}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg resize-none"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setActiveTab("list")}
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: "var(--primary)",
                  color: "white"
                }}
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        )}

        {activeTab === "import" && (
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">导出配置</h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                将当前配置导出为JSON文件，便于备份和迁移。
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: "var(--primary)",
                  color: "white"
                }}
              >
                <Download className="w-4 h-4" />
                导出配置
              </button>
            </div>
            <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <h3 className="text-lg font-medium mb-4">导入配置</h3>
              <p className="text-sm mb-4" style={{ color: "var(--muted-foreground)" }}>
                从JSON文件导入配置，支持增量更新。
              </p>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                <Upload className="w-4 h-4" />
                选择文件
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
