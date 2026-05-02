import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Monitor, Cpu, HardDrive, Clock, ExternalLink, Settings } from "lucide-react";
import { applicationsApi } from "../services/api";
import { useToast } from "../context/ToastContext";

const defaultApps = [
  { id: 1, name: "order-service",     project: "电商核心平台", status: "error",   ip: "192.168.1.10", agent: "v2.4.1", runtime: "12d 4h", jvm: "JDK17", heap: 92, uptime: "98.2%",  inst: 3 },
  { id: 2, name: "payment-gateway",   project: "电商核心平台", status: "online",  ip: "192.168.1.11", agent: "v2.4.1", runtime: "24d 2h", jvm: "JDK11", heap: 65, uptime: "99.9%",  inst: 2 },
  { id: 3, name: "user-service",      project: "电商核心平台", status: "warning", ip: "192.168.1.12", agent: "v2.3.8", runtime: "8d 16h",  jvm: "JDK17", heap: 78, uptime: "97.5%",  inst: 4 },
  { id: 4, name: "inventory-service", project: "电商核心平台", status: "online",  ip: "192.168.1.13", agent: "v2.4.1", runtime: "30d 0h",  jvm: "JDK11", heap: 45, uptime: "99.8%",  inst: 2 },
  { id: 5, name: "route-scheduler",   project: "物流调度系统", status: "warning", ip: "192.168.2.10", agent: "v2.4.0", runtime: "5d 8h",   jvm: "JDK17", heap: 82, uptime: "96.1%",  inst: 3 },
  { id: 6, name: "track-service",     project: "物流调度系统", status: "online",  ip: "192.168.2.11", agent: "v2.4.1", runtime: "15d 12h", jvm: "JDK11", heap: 52, uptime: "99.6%",  inst: 2 },
  { id: 7, name: "analytics-core",    project: "数据分析平台", status: "online",  ip: "192.168.3.10", agent: "v2.4.1", runtime: "20d 6h",  jvm: "JDK17", heap: 71, uptime: "99.7%",  inst: 5 },
  { id: 8, name: "growth-engine",     project: "用户增长系统", status: "offline", ip: "192.168.4.10", agent: "-",      runtime: "-",       jvm: "JDK11", heap: 0,  uptime: "0%",     inst: 0 },
  { id: 9, name: "sms-gateway",       project: "消息通知中心", status: "online",  ip: "192.168.5.10", agent: "v2.4.1", runtime: "60d 0h",  jvm: "JDK11", heap: 38, uptime: "100%",   inst: 2 },
];

function HeapBar({ value = 0 }: { value?: number }) {
  const color = value > 85 ? "#FF4D4F" : value > 70 ? "#FFAA00" : "#00D68F";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(148,163,184,0.15)" }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{value}%</span>
    </div>
  );
}

const statusLabels: Record<string, { label: string; color: string }> = {
  online: { label: "在线", color: "#00D68F" },
  warning: { label: "警告", color: "#FFAA00" },
  error: { label: "异常", color: "#FF4D4F" },
  offline: { label: "离线", color: "#94A3B8" },
};

const getStatusLabel = (status: string) => {
  return statusLabels[status]?.label || status;
};

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { showToast } = useToast();

  // CRUD状态
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    status: "online",
    ip: "",
    agentVersion: "",
    jvmVersion: "",
    heapUsage: 0,
    uptime: "",
    instanceCount: 1,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingApp, setDeletingApp] = useState<any | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("开始加载应用数据...");
        const response = await applicationsApi.getAll();
        console.log("应用数据响应:", response);
        if (response.data && response.data.length > 0) {
          const convertedApps = response.data.map((a: any) => ({
            id: a.id,
            name: a.name,
            project: a.projectName || "未知项目",
            status: a.status || "offline",
            ip: a.ip || "-",
            agent: a.agentVersion || "-",
            runtime: a.runtime || "-",
            jvm: a.javaVersion || "JDK8",
            heap: Math.round((a.heapUsage || 0) * 100),
            uptime: a.uptime || "0%",
            inst: a.instanceCount || 1,
          }));
          setApps(convertedApps);
          console.log("成功加载应用数据:", convertedApps.length);
        }
      } catch (error) {
        console.error("加载应用数据失败:", error);
        showToast("获取应用数据失败", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // CRUD处理函数
  const handleCreate = () => {
    setEditingApp(null);
    setFormData({
      name: "",
      status: "online",
      ip: "",
      agentVersion: "",
      jvmVersion: "",
      heapUsage: 0,
      uptime: "",
      instanceCount: 1,
    });
    setShowModal(true);
  };

  const handleEdit = (app: any) => {
    console.log("编辑应用:", app);
    setEditingApp(app);
    setFormData({
      name: app.name || "",
      status: app.status || "online",
      ip: app.ip || "",
      agentVersion: app.agent || "",
      jvmVersion: app.jvm || "",
      heapUsage: app.heap || 0,
      uptime: app.runtime || "",
      instanceCount: app.inst || 1,
    });
    setShowModal(true);
  };

  const handleDelete = (app: any) => {
    console.log("删除应用:", app);
    setDeletingApp(app);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!deletingApp) return;
    try {
      setActionLoading(true);
      await applicationsApi.delete(deletingApp.id);
      setApps(apps.filter((a) => a.id !== deletingApp.id));
      setShowDeleteConfirm(false);
      showToast("应用删除成功", "success");
      if (selected === deletingApp.id) {
        setSelected(null);
      }
    } catch (error) {
      console.error("删除失败:", error);
      showToast("删除失败，请重试", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("请输入应用名称", "warning");
      return;
    }
    try {
      setActionLoading(true);
      const appData = {
        name: formData.name,
        status: formData.status,
        ip: formData.ip,
        agentVersion: formData.agentVersion,
        jvmVersion: formData.jvmVersion,
        heapUsage: formData.heapUsage / 100,
        uptime: formData.uptime,
        instanceCount: formData.instanceCount,
      };

      if (editingApp) {
        await applicationsApi.update(editingApp.id, appData);
        setApps(apps.map((a) =>
          a.id === editingApp.id
            ? { ...a, ...appData, agent: appData.agentVersion, jvm: appData.jvmVersion, runtime: appData.uptime, inst: appData.instanceCount, heap: Math.round(appData.heapUsage * 100) }
            : a
        ));
        showToast("应用更新成功", "success");
      } else {
        const response = await applicationsApi.create(appData);
        const newApp = {
          id: response.data.id,
          ...appData,
          project: "未知项目",
          agent: appData.agentVersion || "-",
          jvm: appData.jvmVersion || "JDK8",
          runtime: appData.uptime || "-",
          inst: appData.instanceCount || 1,
          heap: Math.round((appData.heapUsage || 0) * 100),
          uptime: appData.uptime || "0%",
        };
        setApps([...apps, newApp]);
        showToast("应用创建成功", "success");
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存失败:", error);
      showToast(editingApp ? "更新失败" : "创建失败", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = apps.filter(
    (a) =>
      (statusFilter === "all" || a.status === statusFilter) &&
      (searchKeyword === "" || a.name.includes(searchKeyword))
  );

  const totalPages = Math.ceil(filtered.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedApps = filtered.slice(startIndex, startIndex + pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearch = () => {
    setSearchKeyword(search);
    setCurrentPage(1);
    setSearching(true);
    setTimeout(() => setSearching(false), 300);
  };

  const selectedApp = apps.find((a) => a.id === selected);

  if (loading) {
    return (
      <MainLayout title="应用管理">
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
    <MainLayout title="应用管理">
      <div data-cmp="Applications" className="space-y-4">
        <PageHeader
          title="应用管理"
          subtitle={`共 ${apps.length} 个应用，${apps.filter(a => a.status === "online").length} 在线`}
          actions={
            <>
              <TechButton variant="secondary" onClick={() => showToast("批量操作功能开发中...", "info")}>批量操作</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新增应用</TechButton>
            </>
          }
        />

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 h-8 rounded-md flex-1 max-w-xs" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
            <Search size={13} style={{ color: "var(--muted-foreground)" }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索应用名称..." className="bg-transparent border-none outline-none text-xs flex-1 text-white" />
          </div>
          <TechButton variant="primary" icon={<Search size={13} />} onClick={handleSearch} loading={searching}>查询</TechButton>
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-3 py-1.5 rounded-md text-xs text-left bg-[var(--card)] border border-[var(--border)] flex items-center justify-between hover:border-[#165DFF] transition-colors"
            >
              <span>{statusFilter === "all" ? "全部状态" : getStatusLabel(statusFilter)}</span>
              <svg className={`w-3 h-3 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} style={{ color: "var(--muted-foreground)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showStatusDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg z-50 min-w-[120px]">
                {[["all", "全部"], ["online", "在线"], ["warning", "警告"], ["error", "异常"], ["offline", "离线"]].map(([val, label]) => {
                  const statusInfo = statusLabels[val];
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        console.log("切换状态筛选:", val);
                        setStatusFilter(val);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-3 py-2 text-xs text-left hover:bg-[var(--muted)] transition-colors flex items-center gap-2 ${statusFilter === val ? "text-[#165DFF]" : ""}`}
                    >
                      {val !== "all" && (
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: statusInfo?.color || "#94A3B8" }}
                        />
                      )}
                      {label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {/* Table */}
          <div className="flex-1 rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)", background: "rgba(22,93,255,0.05)" }}>
                  {["应用名称", "所属项目", "状态", "实例IP", "Agent版本", "运行时长", "堆内存", "实例数", "操作"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedApps.map((app) => (
                  <tr
                    key={app.id}
                    className="table-row-hover transition-colors cursor-pointer"
                    style={{ borderBottom: "1px solid var(--border)", background: selected === app.id ? "rgba(22,93,255,0.08)" : "transparent" }}
                    onClick={() => {
                      console.log("选择应用:", app.name);
                      setSelected(selected === app.id ? null : app.id);
                    }}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                          <Monitor size={12} style={{ color: "#A855F7" }} />
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--muted-foreground)" }}>{app.project}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={app.status as "online" | "error" | "warning" | "offline"} /></td>
                    <td className="px-3 py-2.5 text-xs" style={{ color: "var(--foreground)", fontFamily: "monospace" }}>{app.ip}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: app.agent === "-" ? "rgba(148,163,184,0.1)" : "rgba(22,93,255,0.1)", color: app.agent === "-" ? "#94A3B8" : "#165DFF" }}>{app.agent}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                        <Clock size={11} />{app.runtime}
                      </span>
                    </td>
                    <td className="px-3 py-2.5"><HeapBar value={app.heap} /></td>
                    <td className="px-3 py-2.5 text-xs text-white">{app.inst}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1">
                        <TechButton variant="ghost" size="xs" icon={<ExternalLink size={11} />} onClick={() => setSelected(app.id)}>查看</TechButton>
                        <TechButton variant="ghost" size="xs" icon={<Settings size={11} />} onClick={() => handleEdit(app)}>编辑</TechButton>
                        <TechButton variant="danger" size="xs" onClick={() => handleDelete(app)}>删除</TechButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

          {/* Detail panel */}
          <div className={`w-72 rounded-lg p-4 flex-shrink-0 ${selectedApp ? "" : "hidden"}`} style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Monitor size={14} style={{ color: "#A855F7" }} />
              {selectedApp?.name}
            </div>
            {selectedApp && (
              <div className="space-y-3">
                <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>JVM 基础信息</div>
                  <div className="space-y-1.5">
                    {[
                      ["JDK版本", selectedApp.jvm],
                      ["实例IP", selectedApp.ip],
                      ["Agent版本", selectedApp.agent],
                      ["运行时长", selectedApp.runtime],
                    ].map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span style={{ color: "var(--muted-foreground)" }}>{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  <div className="text-xs font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>资源使用</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span style={{ color: "var(--muted-foreground)" }}>堆内存</span><span className="text-white">{selectedApp.heap}%</span></div>
                      <HeapBar value={selectedApp.heap} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>可用率</span>
                      <span style={{ color: "#00D68F" }}>{selectedApp.uptime}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <TechButton variant="primary" size="xs" onClick={() => setSelected(null)}>关闭详情</TechButton>
                  <TechButton variant="secondary" size="xs" icon={<Settings size={12} />} onClick={() => handleEdit(selectedApp)}>编辑应用</TechButton>
                </div>
              </div>
            )}
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
              className="w-[500px] rounded-xl p-6"
              style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-white">{editingApp ? "编辑应用" : "新增应用"}</div>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>应用名称 *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                      placeholder="例如: order-service"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>状态</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                    >
                      <option value="online">在线</option>
                      <option value="warning">警告</option>
                      <option value="error">异常</option>
                      <option value="offline">离线</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>实例IP</label>
                    <input
                      type="text"
                      value={formData.ip}
                      onChange={(e) => setFormData({ ...formData, ip: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                      placeholder="例如: 192.168.1.10"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>Agent版本</label>
                    <input
                      type="text"
                      value={formData.agentVersion}
                      onChange={(e) => setFormData({ ...formData, agentVersion: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                      placeholder="例如: v2.4.1"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>JDK版本</label>
                    <input
                      type="text"
                      value={formData.jvmVersion}
                      onChange={(e) => setFormData({ ...formData, jvmVersion: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                      placeholder="例如: JDK17"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>堆内存使用(%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.heapUsage}
                      onChange={(e) => setFormData({ ...formData, heapUsage: parseInt(e.target.value) || 0 })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>运行时长</label>
                    <input
                      type="text"
                      value={formData.uptime}
                      onChange={(e) => setFormData({ ...formData, uptime: e.target.value })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                      placeholder="例如: 12d 4h"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5" style={{ color: "var(--muted-foreground)" }}>实例数</label>
                    <input
                      type="number"
                      min="1"
                      value={formData.instanceCount}
                      onChange={(e) => setFormData({ ...formData, instanceCount: parseInt(e.target.value) || 1 })}
                      className="w-full h-9 px-3 rounded-md text-sm bg-transparent border"
                      style={{ background: "var(--input)", borderColor: "var(--border)", color: "white" }}
                    />
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
        {showDeleteConfirm && deletingApp && (
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
                您确定要删除应用 "{deletingApp.name}" 吗？此操作无法撤销。
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
      </div>
    </MainLayout>
  );
}
