import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Edit2, Trash2, Eye, FolderOpen, Tag, X } from "lucide-react";
import { projectsApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { SearchBar, FilterDropdown, Pagination } from "@/components/business";
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

const envOptions = [
  { value: "all", label: "全部环境" },
  { value: "production", label: "生产" },
  { value: "staging", label: "测试" },
  { value: "dev", label: "开发" },
];

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
  const { showToast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await projectsApi.getAll();
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

  const filtered = useMemo(() =>
    projects.filter((p) =>
      (envFilter === "all" || p.environment === envFilter) &&
      (search === "" || p.name.includes(search) || (p.description?.includes(search)))
    ),
    [projects, envFilter, search]
  );

  const {
    currentPage,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    paginatedData,
    setCurrentPage,
    setPageSize,
    canPrevPage,
    canNextPage,
  } = usePagination({ data: filtered, defaultPageSize: 10 });

  const handleCreate = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleView = (project: Project) => setViewingProject(project);

  const handleEdit = (project: Project) => {
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
      showToast("删除失败，请重试", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
            <div className="text-sm text-muted-foreground">加载中...</div>
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
          actions={<TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新增项目</TechButton>}
        />

        {/* Filters - 使用新的业务组件 */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar
            value={search}
            onChange={setSearch}
            onSearch={() => setCurrentPage(1)}
            placeholder="搜索项目名称..."
          />
          <FilterDropdown
            value={envFilter}
            options={envOptions}
            onChange={setEnvFilter}
            placeholder="环境"
          />
          <select
            value={view}
            onChange={(e) => setView(e.target.value as "table" | "card")}
            className="px-3 py-1.5 rounded-md text-xs outline-none appearance-none cursor-pointer hover:border-primary transition-colors"
            style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)", minWidth: "100px" }}
          >
            <option value="table" style={{ color: "var(--foreground)", background: "var(--card)" }}>列表视图</option>
            <option value="card" style={{ color: "var(--foreground)", background: "var(--card)" }}>卡片视图</option>
          </select>
        </div>

        {/* Table view */}
        <div className={`rounded-lg overflow-hidden ${view === "table" ? "" : "hidden"} bg-card border border-border`}>
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-blue-500/5">
                {["项目名称", "分组", "环境", "应用数", "状态", "负责人", "操作"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((p) => {
                const ec = envColors[p.environment] || envColors.dev;
                return (
                  <tr key={p.id} className="table-row-hover border-b border-border transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-blue-500/15">
                          <FolderOpen size={12} className="text-blue-500" />
                        </div>
                        <div>
                          <div className="text-xs font-medium text-white">{p.name}</div>
                          {p.description && <div className="text-xs mt-0.5 text-muted-foreground">{p.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Tag size={11} />{p.groupName}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>{envLabels[p.environment]}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-white">{p.appCount}</td>
                    <td className="px-4 py-3"><StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} /></td>
                    <td className="px-4 py-3 text-xs text-foreground">{p.owner || "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <TechButton variant="ghost" size="xs" icon={<Eye size={12} />} onClick={() => handleView(p)}>查看</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />} onClick={() => handleEdit(p)}>编辑</TechButton>
                        <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleDelete(p.id)}>删除</TechButton>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={filtered.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            canPrev={canPrevPage}
            canNext={canNextPage}
          />
        </div>

        {/* Card view */}
        <div className={`${view === "card" ? "" : "hidden"}`}>
          <div className="flex flex-wrap gap-3">
            {paginatedData.map((p) => {
              const ec = envColors[p.environment] || envColors.dev;
              return (
                <div key={p.id} className="w-72 rounded-lg p-4 card-hover bg-card border border-border">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-500/15">
                        <FolderOpen size={16} className="text-blue-500" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-white">{p.name}</div>
                        <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>{envLabels[p.environment]}</span>
                      </div>
                    </div>
                    <StatusBadge status={p.status as "online" | "error" | "warning" | "offline"} />
                  </div>
                  {p.description && <p className="text-xs mb-3 text-muted-foreground">{p.description}</p>}
                  <div className="flex items-center justify-between text-xs mb-3 text-muted-foreground">
                    <span>应用数: <span className="text-white">{p.appCount}</span></span>
                    <span>负责人: <span className="text-white">{p.owner || "-"}</span></span>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-border">
                    <TechButton variant="ghost" size="xs" icon={<Eye size={12} />} onClick={() => handleView(p)}>查看</TechButton>
                    <TechButton variant="ghost" size="xs" icon={<Edit2 size={12} />} onClick={() => handleEdit(p)}>编辑</TechButton>
                    <TechButton variant="danger" size="xs" icon={<Trash2 size={12} />} onClick={() => handleDelete(p.id)}>删除</TechButton>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={filtered.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            onPageSizeChange={setPageSize}
            canPrev={canPrevPage}
            canNext={canNextPage}
          />
        </div>

        {/* Modal - 保持原有结构，仅简化样式 */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowModal(false)}>
            <div className="w-[480px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div className="text-sm font-semibold text-white">{editingId ? "编辑项目" : "新增项目"}</div>
                <button onClick={() => setShowModal(false)} className="p-1 text-muted-foreground hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs mb-1.5 text-muted-foreground">项目名称 *</label>
                  <input required className="w-full h-8 px-3 rounded-md text-xs bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="输入项目名称" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs mb-1.5 text-muted-foreground">描述</label>
                  <textarea className="w-full px-3 py-2 rounded-md text-xs bg-input border border-border outline-none resize-none" style={{ color: "var(--foreground)" }} placeholder="简短描述项目用途" rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 text-muted-foreground">分组</label>
                    <input className="w-full h-8 px-3 rounded-md text-xs bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="分组名称" value={formData.groupName} onChange={(e) => setFormData({ ...formData, groupName: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 text-muted-foreground">负责人</label>
                    <input className="w-full h-8 px-3 rounded-md text-xs bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="负责人姓名" value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs mb-1.5 text-muted-foreground">环境</label>
                    <select className="w-full h-8 px-3 rounded-md text-xs outline-none appearance-none cursor-pointer" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} value={formData.environment} onChange={(e) => setFormData({ ...formData, environment: e.target.value })}>
                      <option value="dev" style={{ color: "var(--foreground)", background: "var(--card)" }}>开发</option>
                      <option value="staging" style={{ color: "var(--foreground)", background: "var(--card)" }}>测试</option>
                      <option value="production" style={{ color: "var(--foreground)", background: "var(--card)" }}>生产</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 text-muted-foreground">状态</label>
                    <select className="w-full h-8 px-3 rounded-md text-xs outline-none appearance-none cursor-pointer" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }} value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>
                      <option value="online" style={{ color: "var(--foreground)", background: "var(--card)" }}>在线</option>
                      <option value="warning" style={{ color: "var(--foreground)", background: "var(--card)" }}>警告</option>
                      <option value="offline" style={{ color: "var(--foreground)", background: "var(--card)" }}>离线</option>
                      <option value="error" style={{ color: "var(--foreground)", background: "var(--card)" }}>错误</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <TechButton variant="secondary" type="button" onClick={() => setShowModal(false)} disabled={actionLoading}>取消</TechButton>
                  <TechButton variant="primary" type="submit" disabled={actionLoading}>{actionLoading ? "保存中..." : "确定保存"}</TechButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowDeleteConfirm(false)}>
            <div className="w-[360px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="text-sm font-semibold text-white mb-3">确认删除</div>
              <p className="text-xs mb-6 text-muted-foreground">您确定要删除该项目吗？此操作无法撤销。</p>
              <div className="flex justify-end gap-2">
                <TechButton variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>取消</TechButton>
                <TechButton variant="danger" onClick={confirmDelete} disabled={actionLoading}>{actionLoading ? "删除中..." : "确认删除"}</TechButton>
              </div>
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {viewingProject && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setViewingProject(null)}>
            <div className="w-[500px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-white">项目详情</div>
                <button onClick={() => setViewingProject(null)} className="text-gray-400 hover:text-white">✕</button>
              </div>
              <div className="space-y-4">
                <div><label className="text-xs font-medium text-muted-foreground">项目名称</label><div className="text-sm text-white mt-1">{viewingProject.name}</div></div>
                <div><label className="text-xs font-medium text-muted-foreground">所属分组</label><div className="text-sm text-white mt-1">{viewingProject.groupName || "-"}</div></div>
                <div><label className="text-xs font-medium text-muted-foreground">环境</label>
                  <div className="text-sm mt-1">
                    <span className="px-2 py-1 rounded text-xs" style={{ background: viewingProject.environment === "production" ? "#059669" : viewingProject.environment === "staging" ? "#D97706" : "#6366F1" }}>
                      {viewingProject.environment === "production" ? "生产" : viewingProject.environment === "staging" ? "测试" : "开发"}
                    </span>
                  </div>
                </div>
                <div><label className="text-xs font-medium text-muted-foreground">状态</label><div className="text-sm mt-1"><StatusBadge status={viewingProject.status as "online" | "error" | "warning" | "offline"} /></div></div>
                <div><label className="text-xs font-medium text-muted-foreground">描述</label><div className="text-sm text-white mt-1">{viewingProject.description || "-"}</div></div>
                <div><label className="text-xs font-medium text-muted-foreground">负责人</label><div className="text-sm text-white mt-1">{viewingProject.owner || "-"}</div></div>
                <div><label className="text-xs font-medium text-muted-foreground">应用数量</label><div className="text-sm text-white mt-1">{viewingProject.appCount || 0}</div></div>
              </div>
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
                <TechButton variant="secondary" onClick={() => setViewingProject(null)}>关闭</TechButton>
                <TechButton variant="primary" onClick={() => { setViewingProject(null); handleEdit(viewingProject); }}>编辑</TechButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
