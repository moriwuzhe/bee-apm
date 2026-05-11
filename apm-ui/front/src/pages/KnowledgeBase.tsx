import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Book, Search, Plus, Clock, CheckCircle, AlertTriangle, ThumbsUp, MessageSquare, Tag, Filter, Edit2, Trash2, Eye, Star } from "lucide-react";

interface KnowledgeArticle {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  createdAt: string;
  updatedAt: string;
  views: number;
  likes: number;
  rating: number;
  content: string;
  related: string[];
}

interface CaseStudy {
  id: string;
  title: string;
  problem: string;
  solution: string;
  result: string;
  category: string;
  rating: number;
  helpful: number;
  date: string;
}

const mockArticles: KnowledgeArticle[] = [
  { id: "1", title: "JVM内存泄漏排查指南", category: "性能优化", tags: ["JVM", "内存泄漏", "排查"], author: "张三", createdAt: "2024-01-10", updatedAt: "2024-01-15", views: 1256, likes: 45, rating: 4.8, content: "JVM内存泄漏是常见的性能问题之一...", related: ["2", "3"] },
  { id: "2", title: "数据库连接池配置最佳实践", category: "数据库", tags: ["数据库", "连接池", "配置"], author: "李四", createdAt: "2024-01-08", updatedAt: "2024-01-12", views: 987, likes: 38, rating: 4.6, content: "数据库连接池的配置对系统性能至关重要...", related: ["1"] },
  { id: "3", title: "微服务链路追踪实战", category: "架构", tags: ["微服务", "链路追踪", "SkyWalking"], author: "王五", createdAt: "2024-01-05", updatedAt: "2024-01-10", views: 1543, likes: 62, rating: 4.9, content: "微服务架构中，链路追踪是定位问题的重要手段...", related: ["1", "4"] },
  { id: "4", title: "容器化部署经验总结", category: "运维", tags: ["Docker", "Kubernetes", "部署"], author: "赵六", createdAt: "2024-01-03", updatedAt: "2024-01-08", views: 876, likes: 31, rating: 4.5, content: "容器化部署可以提高系统的可移植性和可扩展性...", related: ["3"] },
];

const mockCaseStudies: CaseStudy[] = [
  { id: "1", title: "订单服务响应超时问题排查", problem: "订单服务在高峰期响应时间超过5秒", solution: "通过APM工具定位到数据库慢查询，优化索引后响应时间降至200ms", result: "响应时间降低96%，系统吞吐量提升3倍", category: "性能优化", rating: 4.9, helpful: 156, date: "2024-01-15" },
  { id: "2", title: "支付服务频繁超时处理", problem: "支付服务在并发时出现大量超时", solution: "增加连接池大小，优化事务管理，添加熔断机制", result: "超时率从5%降至0.1%，系统稳定性显著提升", category: "高可用", rating: 4.8, helpful: 123, date: "2024-01-12" },
  { id: "3", title: "用户服务内存溢出故障", problem: "用户服务内存持续增长，最终OOM", solution: "通过heap dump分析定位内存泄漏代码，修复对象引用问题", result: "内存使用稳定，故障彻底解决", category: "故障处理", rating: 4.7, helpful: 98, date: "2024-01-10" },
];

const categories = ["全部", "性能优化", "数据库", "架构", "运维", "高可用", "故障处理"];
const popularTags = ["JVM", "数据库", "微服务", "容器", "性能", "排查", "优化", "部署"];

export default function KnowledgeBase() {
  const [activeTab, setActiveTab] = useState<"articles" | "cases">("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("全部");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [articles] = useState<KnowledgeArticle[]>(mockArticles);
  const [caseStudies] = useState<CaseStudy[]>(mockCaseStudies);
  const [selectedArticle, setSelectedArticle] = useState<KnowledgeArticle | null>(null);
  const [showArticleModal, setShowArticleModal] = useState(false);

  const filteredArticles = articles.filter(article => {
    const matchesSearch = searchQuery === "" || article.title.toLowerCase().includes(searchQuery.toLowerCase()) || article.content.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "全部" || article.category === selectedCategory;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => article.tags.includes(tag));
    return matchesSearch && matchesCategory && matchesTags;
  });

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <MainLayout title="运维知识库">
      <div className="space-y-4">
        {/* 搜索栏 */}
        <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
              <input
                type="text"
                placeholder="搜索知识库..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
              <Plus size={14} />
              创建文章
            </button>
          </div>

          {/* 标签筛选 */}
          <div className="flex items-center gap-2 flex-wrap">
            <Tag size={14} style={{ color: "var(--muted-foreground)" }} />
            {popularTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-blue-500/20 text-blue-400"
                    : "bg-muted text-muted-foreground hover:bg-input"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>知识文章</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{articles.length}</div>
              </div>
              <Book size={20} style={{ color: "#165DFF" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>优秀案例</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{caseStudies.length}</div>
              </div>
              <CheckCircle size={20} style={{ color: "#00D68F" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总浏览量</div>
                <div className="text-xl font-bold mt-1" style={{ color: "var(--foreground)" }}>{(articles.reduce((sum, a) => sum + a.views, 0) / 1000).toFixed(1)}K</div>
              </div>
              <Eye size={20} style={{ color: "#A855F7" }} />
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均评分</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#FACC15" }}>{(articles.reduce((sum, a) => sum + a.rating, 0) / articles.length).toFixed(1)}</div>
              </div>
              <Star size={20} style={{ color: "#FACC15" }} />
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <button
            onClick={() => setActiveTab("articles")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "articles" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <Book size={16} />
            知识文章
          </button>
          <button
            onClick={() => setActiveTab("cases")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === "cases" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
            }`}
          >
            <CheckCircle size={16} />
            优秀案例
          </button>
        </div>

        {/* 知识文章 */}
        {activeTab === "articles" && (
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

            {/* 文章列表 */}
            <div className="grid grid-cols-2 gap-4">
              {filteredArticles.map(article => (
                <div
                  key={article.id}
                  className="rounded-lg p-4 cursor-pointer transition-all hover:scale-[1.02]"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  onClick={() => {
                    setSelectedArticle(article);
                    setShowArticleModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                          {article.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-medium text-white mb-1">{article.title}</h3>
                      <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                        {article.content.substring(0, 100)}...
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    {article.tags.map(tag => (
                      <span key={tag} className="px-2 py-0.5 rounded text-xs" style={{ background: "var(--muted)", color: "var(--foreground)" }}>
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {article.views}
                      </span>
                      <span className="flex items-center gap-1">
                        <ThumbsUp size={12} />
                        {article.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star size={12} style={{ color: "#FACC15" }} />
                        {article.rating}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} />
                      {article.updatedAt}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 优秀案例 */}
        {activeTab === "cases" && (
          <div className="space-y-4">
            {caseStudies.map(caseItem => (
              <div key={caseItem.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                        {caseItem.category}
                      </span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{caseItem.date}</span>
                    </div>
                    <h3 className="text-sm font-medium text-white mb-2">{caseItem.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs" style={{ color: "#FACC15" }}>
                      <Star size={12} />
                      {caseItem.rating}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                      <ThumbsUp size={12} />
                      {caseItem.helpful}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.05)", border: "1px solid rgba(255, 77, 79, 0.1)" }}>
                    <div className="text-xs mb-1" style={{ color: "#FF4D4F" }}>问题描述</div>
                    <div className="text-xs" style={{ color: "var(--foreground)" }}>{caseItem.problem}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(22, 93, 255, 0.05)", border: "1px solid rgba(22, 93, 255, 0.1)" }}>
                    <div className="text-xs mb-1" style={{ color: "#165DFF" }}>解决方案</div>
                    <div className="text-xs" style={{ color: "var(--foreground)" }}>{caseItem.solution}</div>
                  </div>
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.05)", border: "1px solid rgba(0, 214, 143, 0.1)" }}>
                    <div className="text-xs mb-1" style={{ color: "#00D68F" }}>处理结果</div>
                    <div className="text-xs" style={{ color: "var(--foreground)" }}>{caseItem.result}</div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                    查看详情
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 rounded text-xs" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                    <ThumbsUp size={12} />
                    有用 ({caseItem.helpful})
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
