import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Edit2, Trash2, Eye, FolderOpen, Tag, X } from "lucide-react";
import { projectsApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import type { Project, ProjectFormData } from "../types";

const envColors: Record<string, { bg: string; color: string }> = {
  production: { bg: "rgba(0,214,143,0.1)", color: "#00D68F" },
  staging: { bg: "rgba(255,170,0,0.1)", color: "#FFAA00" },
  dev: { bg: "rgba(148,163,184,0.1)", color: "#94A3B8" },
};

const envLabels: Record<string, string> = {
  production: "生产",
  staging: "测试",
  dev: "开发",
};

const initialFormData: ProjectFormData = {
  name: "",
  groupName: "默认分组",
  environment: "dev",
  description: "",
  owner: "",
  status: "online",
};

export default function Projects() {
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [envFilter, setEnvFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [showEnvDropdown, setShowEnvDropdown] = useState(false);
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getAll();
      console.log("获取到的项目数据:", response);
      if (response.data) {
        setProjects(response.data);
      }
    } catch (error) {
      console.error("获取项目数据失败:", error);
      showToast("获取项目数据失败", "error");
    } finally {
      setLoading(false);
    }
  };

  const filtered = projects.filter(
    (p) =>
      (envFilter === "all" || p.environment === envFilter) &&
      (searchKeyword === "" || p.name.includes(searchKeyword) || (p.description && p.description.includes(searchKeyword)))
  );

  const handleSearch = () => {
    console.log("执行搜索:", search);
    setSearchKeyword(search);
    setCurrentPage(1);
    setSearching(true);
    setTimeout(() => setSearching(false), 300);
  };

  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProjects = filtered.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    console.log("点击新增项目");
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleView = (project: Project) => {
    console.log("点击查看项目:", project);
    setViewingProject(project);
  };

  const handleEdit = (project: Project) => {
    console.log("点击编辑项目:", project);
    setEditingId(project.id);
    setFormData({
      name: project.name,
      groupName: project.groupName,
      environment: project.environment,
      description: project.description,
      owner: project.owner,
      status: project.status,
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    console.log("点击删除项目, id:", id);
    setDeletingId(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setActionLoading(true);
      await projectsApi.delete(deletingId);
      setProjects(projects.filter((p) => p.id !== deletingId));
      setShowDeleteConfirm(false);
      showToast("项目删除成功", "success");
    } catch (error) {
      console.error("删除失败:", error);
      showToast("删除失败，请重试", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("提交表单, editingId:", editingId);
    try {
      setActionLoading(true);
      if (editingId) {
        await projectsApi.update(editingId, formData);
        showToast("项目更新成功", "success");
      } else {
        await projectsApi.create(formData);
        showToast("项目创建成功", "success");
      }
      await fetchData();
      setShowModal(false);
    } catch (error) {
      console.error("保存失败:", error);
      showToast("保存失败，请重试", "error");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout title="项目管理">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-sm" style={{ color: "#94A3B8" }}>加载中...</div>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="项目管理">
      <div data-cmp="Projects" className="space-y-4">
        <PageHeader
          title="项目管理"
          subtitle={`共 ${projects.length} 个项目`}
          actions={
            <>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>
                新增项目
              </TechButton>
            </>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="搜索项目名称..."
              className="bg-transparent border-none outline-none text-xs flex-1 text-white"
            />
          </div>
          <TechButton variant="primary" icon={<Search size={13} />} onClick={handleSearch} loading={searching}>
            查询
          </TechButton>
          <div className="relative">
            <button
              onClick={() => {
                setShowEnvDropdown(!showEnvDropdown);
                setShowViewDropdown(false);
              }}
              className="px-3 py-1.5 rounded-md text-xs text-left bg-[var(--card)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
            >
              <span style={{ color: envFilter === "all" ? "var(--muted-foreground)" : "var(--foreground)" }}>
                {envFilter === "all" ? "全部环境" : envLabels[envFilter]}
              </span>
              <svg className={`w-3 h-3 transition-transform ${showEnvDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showEnvDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 min-w-[100px]">
                {[["all", "全部"], ["production", "生产"], ["staging", "测试"], ["dev", "开发"]].map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => {
                      console.log("点击环境筛选:", val);
                      setEnvFilter(val);
                      setShowEnvDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-[var(--muted)] transition-colors ${envFilter === val ? "text-[#165DFF]" : ""}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => {
                setShowViewDropdown(!showViewDropdown);
                setShowEnvDropdown(false);
              }}
              className="px-3 py-1.5 rounded-md text-xs text-left bg-[var(--card)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
            >
              <span>{view === "table" ? "列表" : "卡片"}</span>
              <svg className={`w-3 h-3 transition-transform ${showViewDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showViewDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 min-w-[100px]">
                {[["table", "列表"], ["card", "卡片"]].map(([v, l]) => (
                  <button
                    key={v}
                    onClick={() => {
                      console.log("点击视图切换:", v);
                      setView(v as "table" | "card");
                      setShowViewDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-xs text-left hover:bg-[var(--muted)] transition-colors ${view === v ? "text-[#165DFF]" : ""}`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Table view */}
        <div className={`rounded-lg overflow-hidden ${view === "table" ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                {["项目名称", "分组", "环境", "应用数", "状态", "负责人", "操作"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedProjects.map((p) => {
                const ec = envColors[p.environment] || envColors.dev;
                return (
                  <tr key={p.id} className="table-row-hover transition-colors" style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                          <FolderOpen size={12} style={{ color: "#165DFF" }} />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">{p.name}</div>
                          {p.description && <div className="text-xs mt-0.5" style={{ color: "var(--muted-foreground)" }}>{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Tag size={11} />{p.groupName}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>
                        {envLabels[p.environment]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-white">{p.appCount}</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} />
                    </td>
                    <td className="px-4 py-3 text-xs" style={{ color: "var(--foreground)" }}>{p.owner || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TechButton variant="ghost" size="xs" icon={<Eye size={12} />} onClick={() => handleView(p)}>
                          查看
                        </TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />} onClick={() => handleEdit(p)}>
                          编辑
                        </TechButton>
                        <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleDelete(p.id)}>
                          删除
                        </TechButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Pagination inside table view */}
          <div className="flex items-center justify-between py-3 px-4" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              显示第 {startIndex + 1} - {Math.min(startIndex + pageSize, filtered.length)} 条，共 {filtered.length} 条
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                上一页
              </button>
              {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    currentPage === page
                      ? "bg-[#165DFF] text-white"
                      : "hover:bg-[var(--muted)]"
                  }`}
                  style={{ border: "1px solid var(--border)" }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                下一页
              </button>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="ml-2 px-2 py-1 rounded text-xs outline-none"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <option value={5} style={{ color: "#000", background: "#fff" }}>5条/页</option>
                <option value={10} style={{ color: "#000", background: "#fff" }}>10条/页</option>
                <option value={20} style={{ color: "#000", background: "#fff" }}>20条/页</option>
                <option value={50} style={{ color: "#000", background: "#fff" }}>50条/页</option>
              </select>
            </div>
          </div>
        </div>

        {/* Card view */}
        <div className={`${view === "card" ? "" : "hidden"}`}>
          <div className="flex flex-wrap gap-3">
            {paginatedProjects.map((p) => {
              const ec = envColors[p.environment] || envColors.dev;
              return (
                <div key={p.id} className="w-72 rounded-lg p-4 card-hover" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                        <FolderOpen size={16} style={{ color: "#165DFF" }} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>
                          {envLabels[p.environment]}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} />
                  </div>
                  {p.description && <p className="text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>{p.description}</p>}
                  <div className="flex items-center justify-between text-xs mb-3" style={{ color: "var(--muted-foreground)" }}>
                    <span>应用数: <span className="text-white">{p.appCount}</span></span>
                    <span>负责人: <span className="text-white">{p.owner || "-"}</span></span>
                  </div>
                  <div className="flex gap-2 pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                    <TechButton variant="ghost" size="xs" icon={<Eye size={12} />} onClick={() => handleView(p)}>
                      查看
                    </TechButton>
                    <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />} onClick={() => handleEdit(p)}>
                      编辑
                    </TechButton>
                    <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleDelete(p.id)}>
                      删除
                    </TechButton>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Pagination inside card view */}
          <div className="flex items-center justify-between py-3 mt-3" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
              显示第 {startIndex + 1} - {Math.min(startIndex + pageSize, filtered.length)} 条，共 {filtered.length} 条
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                上一页
              </button>
              {Array.from({ length: Math.max(totalPages, 1) }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-2 py-1 rounded text-xs transition-colors ${
                    currentPage === page
                      ? "bg-[#165DFF] text-white"
                      : "hover:bg-[var(--muted)]"
                  }`}
                  style={{ border: "1px solid var(--border)" }}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-2 py-1 rounded text-xs disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--muted)] transition-colors"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                下一页
              </button>
              <select
                value={pageSize}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                className="ml-2 px-2 py-1 rounded text-xs outline-none"
                style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
              >
                <option value={5} style={{ color: "#000", background: "#fff" }}>5条/页</option>
                <option value={10} style={{ color: "#000", background: "#fff" }}>10条/页</option>
                <option value={20} style={{ color: "#000", background: "#fff" }}>20条/页</option>
                <option value={50} style={{ color: "#000", background: "#fff" }}>50条/页</option>
              </select>
            </div>
          </div>
        </div>

        {/* 新增/编辑 Modal */}
        {showModal && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="w-[480px] rounded-xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold text-white">{editingId ? "编辑项目" : "新增项目"}</div>
                <button onClick={() => setShowModal(false)} className="p-1">
                  <X size={16} style={{ color: "#94A3B8" }} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>项目名称 *</label>
                  <input
                    required
                    className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                    placeholder="输入项目名称"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>描述</label>
                  <textarea
                    className="w-full px-3 py-2 rounded-md text-xs text-white outline-none resize-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                    placeholder="简短描述项目用途"
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>分组</label>
                    <input
                      className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                      style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                      placeholder="分组名称"
                      value={formData.groupName}
                      onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>负责人</label>
                    <input
                      className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                      style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                      placeholder="负责人姓名"
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>环境</label>
                    <select
                      className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                      style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                      value={formData.environment}
                      onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    >
                      <option value="dev">开发</option>
                      <option value="staging">测试</option>
                      <option value="production">生产</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>状态</label>
                    <select
                      className="w-full h-8 px-3 rounded-md text-xs text-white outline-none"
                      style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="online">在线</option>
                      <option value="warning">警告</option>
                      <option value="offline">离线</option>
                      <option value="error">错误</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <TechButton variant="secondary" type="button" onClick={() => setShowModal(false)} disabled={actionLoading}>
                    取消
                  </TechButton>
                  <TechButton variant="primary" type="submit" disabled={actionLoading}>
                    {actionLoading ? "保存中..." : "确定保存"}
                  </TechButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 删除确认 Modal */}
        {showDeleteConfirm && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }}
            onClick={() => setShowDeleteConfirm(false)}
          >
            <div
              className="w-[360px] rounded-xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-sm font-semibold text-white mb-3">确认删除</div>
              <p className="text-xs mb-6" style={{ color: "var(--muted-foreground)" }}>
                您确定要删除该项目吗？此操作无法撤销。
              </p>
              <div className="flex justify-end gap-2">
                <TechButton variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>
                  取消
                </TechButton>
                <TechButton variant="danger" onClick={confirmDelete} disabled={actionLoading}>
                  {actionLoading ? "删除中..." : "确认删除"}
                </TechButton>
              </div>
            </div>
          </div>
        )}

        {/* 查看详情 Modal */}
        {viewingProject && (
          <div
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }}
            onClick={() => setViewingProject(null)}
          >
            <div
              className="w-[500px] rounded-xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-white">项目详情</div>
                <button
                  onClick={() => setViewingProject(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>项目名称</label>
                  <div className="text-sm text-white mt-1">{viewingProject.name}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>所属分组</label>
                  <div className="text-sm text-white mt-1">{viewingProject.groupName || "-"}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>环境</label>
                  <div className="text-sm mt-1">
                    <span
                      className="px-2 py-1 rounded text-xs"
                      style={{
                        background: viewingProject.environment === "production" ? "#059669" : 
                                   viewingProject.environment === "staging" ? "#D97706" : "#6366F1"
                      }}
                    >
                      {viewingProject.environment === "production" ? "生产" : 
                       viewingProject.environment === "staging" ? "测试" : "开发"}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</label>
                  <div className="text-sm mt-1">
                    <StatusBadge status={viewingProject.status as "online" | "error" | "warning" | "offline"} />
                  </div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>描述</label>
                  <div className="text-sm text-white mt-1">{viewingProject.description || "-"}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>负责人</label>
                  <div className="text-sm text-white mt-1">{viewingProject.owner || "-"}</div>
                </div>
                
                <div>
                  <label className="text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>应用数量</label>
                  <div className="text-sm text-white mt-1">{viewingProject.appCount || 0}</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6 pt-4" style={{ borderTop: "1px solid var(--border)" }}>
                <TechButton variant="secondary" onClick={() => setViewingProject(null)}>
                  关闭
                </TechButton>
                <TechButton variant="primary" onClick={() => {
                  setViewingProject(null);
                  handleEdit(viewingProject);
                }}>
                  编辑
                </TechButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
