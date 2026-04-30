import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Edit2, Trash2, Eye, FolderOpen, Tag } from "lucide-react";
import { projectsApi } from "../services/api";

const defaultProjects = [
  { id: 1, name: "电商核心平台",    group: "生产",  env: "production", appCount: 12, status: "online",  owner: "张伟",  updated: "2024-01-15", desc: "包含订单、支付、用户等核心服务" },
  { id: 2, name: "物流调度系统",    group: "生产",  env: "production", appCount: 8,  status: "warning", owner: "李明",  updated: "2024-01-14", desc: "货物追踪与路由调度" },
  { id: 3, name: "数据分析平台",    group: "测试",  env: "staging",    appCount: 5,  status: "online",  owner: "王芳",  updated: "2024-01-13", desc: "实时数据处理与分析" },
  { id: 4, name: "用户增长系统",    group: "开发",  env: "dev",        appCount: 3,  status: "offline", owner: "赵强",  updated: "2024-01-12", desc: "用户拉新留存" },
  { id: 5, name: "消息通知中心",    group: "生产",  env: "production", appCount: 4,  status: "online",  owner: "陈静",  updated: "2024-01-11", desc: "SMS/邮件/Push 统一网关" },
  { id: 6, name: "风控决策引擎",    group: "生产",  env: "production", appCount: 6,  status: "online",  owner: "刘博",  updated: "2024-01-10", desc: "实时风险决策" },
  { id: 7, name: "内容管理平台",    group: "测试",  env: "staging",    appCount: 7,  status: "error",   owner: "黄磊",  updated: "2024-01-09", desc: "图文视频内容审核与分发" },
  { id: 8, name: "搜索推荐系统",    group: "生产",  env: "production", appCount: 9,  status: "online",  owner: "吴敏",  updated: "2024-01-08", desc: "个性化搜索与推荐" },
];

const envColors: Record<string, { bg: string; color: string }> = {
  production: { bg: "rgba(0,214,143,0.1)",  color: "#00D68F" },
  staging:    { bg: "rgba(255,170,0,0.1)",  color: "#FFAA00" },
  dev:        { bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
};

const envLabels: Record<string, string> = {
  production: "生产",
  staging: "测试",
  dev: "开发",
};

export default function Projects() {
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState(defaultProjects);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await projectsApi.getAll();
        if (response.data && response.data.length > 0) {
          // 转换后端数据格式以匹配前端需求
          const convertedProjects = response.data.map((p: any) => ({
            id: p.id,
            name: p.name,
            group: p.groupName || "默认分组",
            env: p.environment || "dev",
            appCount: p.appCount || 0,
            status: p.status || "online",
            owner: p.owner || "未知",
            updated: p.updatedAt || new Date().toISOString().split('T')[0],
            desc: p.description || "",
          }));
          setProjects(convertedProjects);
        }
      } catch (error) {
        console.log("使用默认项目数据");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = projects.filter(
    (p) =>
      (envFilter === "all" || p.env === envFilter) &&
      p.name.includes(search)
  );

  return (
    <MainLayout title="项目管理">
      <div data-cmp="Projects" className="space-y-4">
        <PageHeader
          title="项目管理"
          subtitle={`共 ${projects.length} 个项目`}
          actions={
            <>
              <TechButton variant="secondary" icon={<Search size={13} />}>搜索</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>新增项目</TechButton>
            </>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目名称..."
              className="bg-transparent border-none outline-none text-xs flex-1 text-white"
            />
          </div>
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {[["all", "全部"], ["production", "生产"], ["staging", "测试"], ["dev", "开发"]].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setEnvFilter(val)}
                className="px-3 py-1 rounded text-xs transition-colors"
                style={{
                  background: envFilter === val ? "#165DFF" : "transparent",
                  color: envFilter === val ? "#fff" : "var(--muted-foreground)",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 p-1 rounded-md" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            {[["table", "列表"], ["card", "卡片"]].map(([v, l]) => (
              <button key={v} onClick={() => setView(v as "table" | "card")} className="px-3 py-1 rounded text-xs transition-colors" style={{ background: view === v ? "#165DFF" : "transparent", color: view === v ? "#fff" : "var(--muted-foreground)" }}>{l}</button>
            ))}
          </div>
        </div>

        {/* Table view */}
        <div className={`rounded-lg overflow-hidden ${view === "table" ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                {["项目名称", "分组", "环境", "应用数", "状态", "负责人", "最后更新", "操作"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const ec = envColors[p.env] || envColors.dev;
                return (
                  <tr key={p.id} className="table-row-hover transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                          <FolderOpen size={12} style={{ color: "#165DFF" }} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">{p.name}</div>
                          <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{p.desc}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Tag size={11} />{p.group}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>{envLabels[p.env]}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white">{p.appCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{p.owner}</td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{p.updated}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TechButton variant="ghost" size="xs" icon={<Eye size={12} />}>查看</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />}>编辑</TechButton>
                        <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />}>禁用</TechButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Card view */}
        <div className={`${view === "card" ? "" : "hidden"}`}>
          <div className="flex flex-wrap gap-3">
            {filtered.map((p) => {
              const ec = envColors[p.env] || envColors.dev;
              return (
                <div key={p.id} className="w-72 rounded-lg p-4 card-hover" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                        <FolderOpen size={16} style={{ color: "#165DFF" }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>{envLabels[p.env]}</span>
                      </div>
                    </div>
                    <StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} />
                  </div>
                  <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{p.desc}</p>
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                    <span>应用数: <span className="text-white">{p.appCount}</span></span>
                    <span>负责人: <span className="text-white">{p.owner}</span></span>
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <TechButton variant="primary" size="xs" icon={<Eye size={12} />}>查看应用</TechButton>
                    <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />}>编辑</TechButton>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal */}
        <div
          className={`fixed inset-0 flex items-center justify-center ${showModal ? "" : "hidden"}`}
          style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }}
          onClick={() => setShowModal(false)}
        >
          <div
            className="w-[480px] rounded-xl p-6"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-sm font-semibold text-white mb-5">新增项目</div>
            <div className="space-y-4">
              {[["项目名称", "输入项目名称"], ["项目描述", "简短描述项目用途"], ["负责人", "输入负责人账号"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input className="w-full h-8 px-3 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} placeholder={ph} />
                </div>
              ))}
              <div>
                <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>环境</label>
                <div className="flex gap-2">
                  {["生产", "测试", "开发"].map((env) => (
                    <button key={env} className="px-3 py-1.5 rounded text-xs" style={{ background: "var(--input)", color: "var(--foreground)", border: "1px solid var(--border)" }}>{env}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowModal(false)}>确认创建</TechButton>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
