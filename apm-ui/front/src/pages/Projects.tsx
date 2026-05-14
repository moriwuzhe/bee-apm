import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Edit2, Trash2, Eye, FolderOpen, Tag, X, Download, RefreshCw, Settings, Activity, BarChart3, Folder } from "lucide-react";
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
  const [selectedProjects, setSelectedProjects] = useState<Set<number>>(new Set());
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchAction, setBatchAction] = useState<"delete" | "export" | "archive">("delete");
  const [showImportModal, setShowImportModal] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    status: "all",
    health: "all",
    owner: "",
    dateRange: "all",
    sortBy: "name" as "name" | "health" | "created",
    sortOrder: "asc" as "asc" | "desc"
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

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

  const handleRefresh = () => {
    fetchData();
    initializeAdvancedData();
    showToast("数据已刷新", "success");
  };

  const toggleProjectSelection = (projectId: number) => {
    const newSelection = new Set(selectedProjects);
    if (newSelection.has(projectId)) {
      newSelection.delete(projectId);
    } else {
      newSelection.add(projectId);
    }
    setSelectedProjects(newSelection);
  };

  const selectAllProjects = () => {
    if (selectedProjects.size === filtered.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filtered.map(p => p.id)));
    }
  };

  const handleBatchDelete = () => {
    if (selectedProjects.size === 0) {
      showToast("请先选择要删除的项目", "warning");
      return;
    }
    setBatchAction("delete");
    setShowBatchModal(true);
  };

  const handleBatchExport = () => {
    if (selectedProjects.size === 0) {
      showToast("请先选择要导出的项目", "warning");
      return;
    }
    const selectedData = projects.filter(p => selectedProjects.has(p.id));
    const csvContent = [
      ["项目名称", "分组", "环境", "应用数", "状态", "负责人", "描述"],
      ...selectedData.map(p => [
        p.name,
        p.groupName,
        envLabels[p.environment],
        p.appCount.toString(),
        p.status,
        p.owner || "-",
        p.description || "-"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `projects_batch_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`已导出 ${selectedProjects.size} 个项目`, "success");
    setSelectedProjects(new Set());
  };

  const confirmBatchAction = async () => {
    try {
      setActionLoading(true);
      if (batchAction === "delete") {
        await Promise.all(Array.from(selectedProjects).map(id => projectsApi.delete(id)));
        setProjects(projects.filter(p => !selectedProjects.has(p.id)));
        showToast(`成功删除 ${selectedProjects.size} 个项目`, "success");
      }
      setSelectedProjects(new Set());
      setShowBatchModal(false);
    } catch (error) {
      showToast("批量操作失败，请重试", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleImport = () => {
    setShowImportModal(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim());
        const headers = lines[0].split(",").map(h => h.trim());
        
        const importedProjects: Partial<Project>[] = [];
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          if (values.length >= headers.length) {
            importedProjects.push({
              name: values[0].trim(),
              groupName: values[1].trim(),
              environment: values[2].trim() as any,
              appCount: parseInt(values[3]) || 0,
              status: values[4].trim() as any,
              owner: values[5].trim(),
              description: values[6]?.trim(),
            });
          }
        }

        setProjects([...projects, ...importedProjects.map((p, idx) => ({
          id: Date.now() + idx,
          ...p,
        }))]);
        
        showToast(`成功导入 ${importedProjects.length} 个项目`, "success");
        setShowImportModal(false);
      } catch (error) {
        showToast("导入失败，请检查文件格式", "error");
      }
    };
    reader.readAsText(file);
  };

  const handleExport = () => {
    const csvContent = [
      ["项目名称", "分组", "环境", "应用数", "状态", "负责人", "描述"],
      ...projects.map(p => [
        p.name,
        p.groupName,
        envLabels[p.environment],
        p.appCount.toString(),
        p.status,
        p.owner || "-",
        p.description || "-"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `projects_export_${Date.now()}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("项目数据已导出", "success");
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
          actions={
            <div className="flex gap-2">
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleExport}>导出</TechButton>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleImport}>导入</TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={handleRefresh}>刷新</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新建项目</TechButton>
            </div>
          }
        />

        {/* 批量操作栏 */}
        {selectedProjects.size > 0 && (
          <div className="flex items-center justify-between p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-blue-400">已选择 {selectedProjects.size} 个项目</span>
              <button
                onClick={() => setSelectedProjects(new Set())}
                className="text-xs text-muted-foreground hover:text-white"
              >
                取消选择
              </button>
            </div>
            <div className="flex gap-2">
              <TechButton variant="secondary" size="sm" icon={<Download size={12} />} onClick={handleBatchExport}>
                批量导出
              </TechButton>
              <TechButton variant="danger" size="sm" icon={<Trash2 size={12} />} onClick={handleBatchDelete}>
                批量删除
              </TechButton>
            </div>
          </div>
        )}

        {/* 高级筛选 */}
        <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <input
            type="text"
            placeholder="搜索项目名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border text-sm"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          />
          <select
            value={envFilter}
            onChange={(e) => setEnvFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border text-sm"
            style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
          >
            {envOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
              showAdvancedFilters ? "bg-blue-500/20 text-blue-400" : "bg-muted text-muted-foreground"
            }`}
          >
            <Settings size={14} />
            高级筛选
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setView("table")}
              className={`px-3 py-2 rounded-lg ${view === "table" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"}`}
            >
              <BarChart3 size={16} />
            </button>
            <button
              onClick={() => setView("card")}
              className={`px-3 py-2 rounded-lg ${view === "card" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"}`}
            >
              <FolderOpen size={16} />
            </button>
          </div>
        </div>

        {/* 高级筛选面板 */}
        {showAdvancedFilters && (
          <div className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>状态</label>
                <select
                  value={advancedFilters.status}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, status: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="all">全部</option>
                  <option value="online">在线</option>
                  <option value="offline">离线</option>
                  <option value="warning">告警</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>健康度</label>
                <select
                  value={advancedFilters.health}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, health: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="all">全部</option>
                  <option value="good">良好</option>
                  <option value="warning">警告</option>
                  <option value="critical">严重</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>负责人</label>
                <input
                  type="text"
                  value={advancedFilters.owner}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, owner: e.target.value })}
                  placeholder="输入负责人..."
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>排序方式</label>
                <select
                  value={advancedFilters.sortBy}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, sortBy: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="name">名称</option>
                  <option value="health">健康度</option>
                  <option value="created">创建时间</option>
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>排序</label>
                <select
                  value={advancedFilters.sortOrder}
                  onChange={(e) => setAdvancedFilters({ ...advancedFilters, sortOrder: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  <option value="asc">升序</option>
                  <option value="desc">降序</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <TechButton variant="secondary" size="sm" onClick={() => setShowAdvancedFilters(false)}>收起</TechButton>
              <TechButton variant="primary" size="sm" onClick={() => showToast("筛选已应用", "success")}>应用筛选</TechButton>
            </div>
          </div>
        )}

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
        {/* 批量操作确认模态框 */}
        {showBatchModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBatchModal(false)}>
            <div
              className="bg-card rounded-lg w-full max-w-md mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">确认批量操作</h3>
                <button onClick={() => setShowBatchModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  确定要删除选中的 <span className="text-red-400 font-medium">{selectedProjects.size}</span> 个项目吗？
                </p>
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <div className="text-xs text-red-400">⚠️ 此操作不可恢复</div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowBatchModal(false)}
                  className="flex-1 px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  取消
                </button>
                <button
                  onClick={confirmBatchAction}
                  disabled={actionLoading}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
                >
                  {actionLoading ? "删除中..." : "确认删除"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 导入模态框 */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowImportModal(false)}>
            <div
              className="bg-card rounded-lg w-full max-w-lg mx-4 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">导入项目</h3>
                <button onClick={() => setShowImportModal(false)} className="text-muted-foreground hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <div className="mb-6">
                <div className="p-6 rounded-lg border-2 border-dashed" style={{ borderColor: "var(--border)" }}>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="text-center">
                      <Download size={32} className="mx-auto mb-3 text-blue-400" />
                      <div className="text-sm font-medium text-white mb-2">点击选择文件或拖拽到此处</div>
                      <div className="text-xs text-muted-foreground">支持 CSV、TXT 格式</div>
                    </div>
                  </label>
                </div>
                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <div className="text-xs text-blue-400 mb-2">CSV 格式要求：</div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>项目名称,分组,环境,应用数,状态,负责人,描述</div>
                    <div>示例: 电商核心系统,默认分组,生产,5,online,张三,核心电商业务</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-lg border text-sm"
                  style={{ borderColor: "var(--border)", color: "var(--foreground)" }}
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
