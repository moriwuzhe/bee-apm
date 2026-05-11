import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Store, Search, Plus, Download, Star, CheckCircle, Filter, Tag, ShoppingCart, Clock, Users, TrendingUp } from "lucide-react";

interface Plugin {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  category: string;
  tags: string[];
  downloads: number;
  rating: number;
  reviews: number;
  price: number;
  isFree: boolean;
  isInstalled: boolean;
  isFeatured: boolean;
  lastUpdated: string;
  compatibility: string;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
}

const mockPlugins: Plugin[] = [
  { id: "1", name: "MySQL性能监控插件", version: "2.1.0", description: "全方位监控MySQL数据库性能指标，包括连接数、查询性能、缓冲池等", author: "BeeAPM Team", category: "数据库", tags: ["MySQL", "数据库", "监控"], downloads: 12580, rating: 4.8, reviews: 156, price: 0, isFree: true, isInstalled: true, isFeatured: true, lastUpdated: "2024-01-15", compatibility: "BeeAPM 2.0+" },
  { id: "2", name: "Redis缓存监控插件", version: "1.5.2", description: "监控Redis内存使用、键空间、持久化等关键指标", author: "BeeAPM Team", category: "缓存", tags: ["Redis", "缓存", "监控"], downloads: 8956, rating: 4.7, reviews: 98, price: 0, isFree: true, isInstalled: true, isFeatured: true, lastUpdated: "2024-01-10", compatibility: "BeeAPM 2.0+" },
  { id: "3", name: "微服务链路增强", version: "3.0.0", description: "提供更详细的微服务调用链路追踪和可视化", author: "DevOps Pro", category: "链路追踪", tags: ["微服务", "链路追踪", "可视化"], downloads: 6234, rating: 4.9, reviews: 234, price: 299, isFree: false, isInstalled: false, isFeatured: true, lastUpdated: "2024-01-12", compatibility: "BeeAPM 2.1+" },
  { id: "4", name: "JVM深度分析", version: "2.3.1", description: "提供JVM内存泄漏检测、GC优化建议、线程分析等高级功能", author: "Java Expert", category: "JVM", tags: ["JVM", "性能分析", "内存"], downloads: 7823, rating: 4.6, reviews: 187, price: 199, isFree: false, isInstalled: false, isFeatured: false, lastUpdated: "2024-01-08", compatibility: "BeeAPM 2.0+" },
  { id: "5", name: "Kubernetes集成插件", version: "1.8.0", description: "支持Kubernetes环境下的自动服务发现和监控", author: "K8s Master", category: "容器", tags: ["Kubernetes", "容器", "编排"], downloads: 5432, rating: 4.5, reviews: 76, price: 0, isFree: true, isInstalled: false, isFeatured: false, lastUpdated: "2024-01-05", compatibility: "BeeAPM 2.0+" },
  { id: "6", name: "日志聚合分析", version: "2.0.0", description: "支持多来源日志统一收集、搜索和分析", author: "Log Analytics Co", category: "日志", tags: ["日志", "聚合", "分析"], downloads: 4123, rating: 4.4, reviews: 65, price: 149, isFree: false, isInstalled: false, isFeatured: false, lastUpdated: "2024-01-02", compatibility: "BeeAPM 1.9+" },
];

const categories = ["全部", "数据库", "缓存", "链路追踪", "JVM", "容器", "日志", "安全"];

export default function PluginMarketplace() {
  const [activeTab, setActiveTab] = useState<"plugins" | "integrations" | "templates">("plugins");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [plugins] = useState<Plugin[]>(mockPlugins);
  const [installedPlugins, setInstalledPlugins] = useState<string[]>(["1", "2"]);
  const [cart, setCart] = useState<string[]>([]);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = searchQuery === "" || 
      plugin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plugin.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || plugin.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleInstall = (pluginId: string) => {
    if (!installedPlugins.includes(pluginId)) {
      setInstalledPlugins([...installedPlugins, pluginId]);
    }
  };

  const handleAddToCart = (pluginId: string) => {
    if (!cart.includes(pluginId)) {
      setCart([...cart, pluginId]);
    }
  };

  const featuredPlugins = plugins.filter(p => p.isFeatured);
  const totalDownloads = plugins.reduce((sum, p) => sum + p.downloads, 0);
  const avgRating = (plugins.reduce((sum, p) => sum + p.rating, 0) / plugins.length).toFixed(1);

  return (
    <MainLayout title="插件市场">
      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="搜索插件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
              <ShoppingCart size={14} />
              购物车 ({cart.length})
            </button>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>插件总数</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{plugins.length}</div>
              </div>
              <Store size={20} style={{ color: "#165DFF" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已安装</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{installedPlugins.length}</div>
              </div>
              <CheckCircle size={20} style={{ color: "#00D68F" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总下载量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{(totalDownloads / 1000).toFixed(1)}K</div>
              </div>
              <Download size={20} style={{ color: "#A855F7" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均评分</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FACC15" }}>{avgRating}</div>
              </div>
              <Star size={20} style={{ color: "#FACC15" }} />
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("plugins")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "plugins" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <Store size={16} />
            插件
          </button>
          <button
            onClick={() => setActiveTab("integrations")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "integrations" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <TrendingUp size={16} />
            集成
          </button>
          <button
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "templates" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <Tag size={16} />
            模板
          </button>
        </div>

        {/* 精选插件 */}
        {activeTab === "plugins" && (
          <div className="space-y-4">
            {/* 分类筛选 */}
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg text-sm ${
                    selectedCategory === category
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 精选推荐 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Star size={16} style={{ color: "#FACC15" }} />
                  <span className="text-sm font-medium text-white">精选推荐</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {featuredPlugins.map(plugin => (
                  <div key={plugin.id} className="p-4 rounded-lg border-2" style={{ background: "var(--muted)", borderColor: "#165DFF" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{plugin.name}</span>
                          {plugin.isFeatured && <Star size={12} style={{ color: "#FACC15" }} />}
                        </div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{plugin.author}</div>
                      </div>
                      {plugin.isFree ? (
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>免费</span>
                      ) : (
                        <span className="text-sm font-medium text-white">¥{plugin.price}</span>
                      )}
                    </div>
                    <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                      {plugin.description.substring(0, 80)}...
                    </p>
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Star size={12} style={{ color: "#FACC15" }} />
                          {plugin.rating}
                        </span>
                        <span className="flex items-center gap-1">
                          <Download size={12} />
                          {plugin.downloads}
                        </span>
                      </div>
                      <span style={{ color: "var(--muted-foreground)" }}>v{plugin.version}</span>
                    </div>
                    <button
                      onClick={() => plugin.isInstalled ? null : plugin.isFree ? handleInstall(plugin.id) : handleAddToCart(plugin.id)}
                      className={`w-full px-3 py-1.5 rounded text-xs font-medium ${
                        plugin.isInstalled
                          ? "bg-green-500/20 text-green-400"
                          : plugin.isFree
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-blue-500 text-white"
                      }`}
                    >
                      {plugin.isInstalled ? "已安装" : plugin.isFree ? "立即安装" : "加入购物车"}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 所有插件 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-white">所有插件 ({filteredPlugins.length})</span>
              </div>
              <div className="space-y-3">
                {filteredPlugins.map(plugin => (
                  <div key={plugin.id} className="p-4 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">{plugin.name}</span>
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                            {plugin.category}
                          </span>
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>v{plugin.version}</span>
                        </div>
                        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                          {plugin.description}
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          {plugin.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--input)", color: "var(--foreground)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="text-right">
                        {plugin.isFree ? (
                          <span className="text-sm font-medium" style={{ color: "#00D68F" }}>免费</span>
                        ) : (
                          <span className="text-sm font-medium text-white">¥{plugin.price}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <span className="flex items-center gap-1">
                          <Star size={12} style={{ color: "#FACC15" }} />
                          {plugin.rating} ({plugin.reviews})
                        </span>
                        <span className="flex items-center gap-1">
                          <Download size={12} />
                          {plugin.downloads}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {plugin.lastUpdated}
                        </span>
                        <span>兼容性: {plugin.compatibility}</span>
                      </div>
                      <button
                        onClick={() => plugin.isInstalled ? null : plugin.isFree ? handleInstall(plugin.id) : handleAddToCart(plugin.id)}
                        className={`px-4 py-1.5 rounded text-xs font-medium ${
                          plugin.isInstalled
                            ? "bg-green-500/20 text-green-400"
                            : plugin.isFree
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-blue-500 text-white"
                        }`}
                      >
                        {plugin.isInstalled ? "已安装" : plugin.isFree ? "安装" : "购买"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 集成 */}
        {activeTab === "integrations" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <TrendingUp size={48} style={{ color: "#165DFF" }} className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">第三方集成</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                支持与主流监控、日志、CI/CD工具集成
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <button className="px-6 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                  查看集成文档
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 模板 */}
        {activeTab === "templates" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Tag size={48} style={{ color: "#A855F7" }} className="mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">监控模板</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                使用预置模板快速创建监控配置
              </p>
              <div className="flex justify-center gap-4 mt-6">
                <button className="px-6 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                  浏览模板
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
