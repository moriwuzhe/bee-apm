import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { Plus, Search, Monitor, Clock, ExternalLink, Settings, X, Download, RefreshCw, AlertTriangle, Activity, Network, Shield, Database, Zap, TrendingUp, BarChart3, List, Filter, Server, Users, Target, Cpu } from "lucide-react";
import { applicationsApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { SearchBar, FilterDropdown, Pagination } from "@/components/business";

const statusLabels: Record<string, { label: string; color: string }> = {
  online: { label: "在线", color: "#00D68F" },
  warning: { label: "警告", color: "#FFAA00" },
  error: { label: "异常", color: "#FF4D4F" },
  offline: { label: "离线", color: "#94A3B8" },
};

const statusOptions = [
  { value: "all", label: "全部状态" },
  { value: "online", label: "在线" },
  { value: "warning", label: "警告" },
  { value: "error", label: "异常" },
  { value: "offline", label: "离线" },
];

interface AppStats {
  totalApps: number;
  healthyApps: number;
  warningApps: number;
  errorApps: number;
}

interface TopApp {
  name: string;
  instances: number;
  cpu: number;
  mem: number;
  status: string;
}

interface AppHealth {
  name: string;
  health: "healthy" | "warning" | "error";
  lastCheck: string;
  responseTime: number;
}

interface AppTypeDistribution {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

function HeapBar({ value = 0 }: { value?: number }) {
  const color = value > 85 ? "#FF4D4F" : value > 70 ? "#FFAA00" : "#00D68F";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full overflow-hidden bg-gray-500/20">
        <div className="h-full rounded-full transition-all" style={{ width: `${value}%`, background: color }} />
      </div>
      <span className="text-xs" style={{ color }}>{value}%</span>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: { title: string; value: string | number; icon: any; color: string; trend?: string }) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:border-opacity-70 transition-all">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs text-muted-foreground mb-1">{title}</div>
          <div className="text-2xl font-bold text-white">{value}</div>
          {trend && (
            <div className="flex items-center gap-1 mt-1 text-xs" style={{ color: trend.startsWith("+") ? "#00D68F" : trend.startsWith("-") ? "#FF4D4F" : "#94A3B8" }}>
              {trend.startsWith("+") && <TrendingUp size={12} />}
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div className="p-2 rounded-lg" style={{ background: `${color}15` }}>
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function PerformanceBar({ label, value, maxValue = 100, color }: { label: string; value: number; maxValue?: number; color: string }) {
  const percentage = (value / maxValue) * 100;
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 text-xs text-muted-foreground">{label}</div>
      <div className="flex-1 h-2 rounded-full overflow-hidden bg-gray-500/20">
        <div className="h-full rounded-full transition-all" style={{ width: `${percentage}%`, background: color }} />
      </div>
      <div className="w-12 text-xs text-right font-medium text-white">{value}%</div>
    </div>
  );
}

function HealthStatusIcon({ health }: { health: "healthy" | "warning" | "error" }) {
  const configs = {
    healthy: { icon: Activity, color: "#00D68F", bg: "rgba(0,214,143,0.15)" },
    warning: { icon: AlertTriangle, color: "#FFAA00", bg: "rgba(255,170,0,0.15)" },
    error: { icon: Shield, color: "#FF4D4F", bg: "rgba(255,77,79,0.15)" },
  };
  const config = configs[health];
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: config.bg }}>
      <config.icon size={16} style={{ color: config.color }} />
    </div>
  );
}

export default function Applications() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<number | null>(null);
  const [apps, setApps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingApp, setEditingApp] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    name: "", status: "online", ip: "", agentVersion: "", jvmVersion: "", heapUsage: 0, uptime: "", instanceCount: 1,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingApp, setDeletingApp] = useState<any | null>(null);
  const { showToast } = useToast();

  const [appStats, setAppStats] = useState<AppStats>({
    totalApps: 0,
    healthyApps: 0,
    warningApps: 0,
    errorApps: 0,
  });

  const [topApps, setTopApps] = useState<TopApp[]>([
    { name: "order-service", instances: 5, cpu: 78, mem: 65, status: "online" },
    { name: "user-service", instances: 3, cpu: 45, mem: 52, status: "online" },
    { name: "payment-service", instances: 4, cpu: 89, mem: 71, status: "warning" },
    { name: "inventory-service", instances: 2, cpu: 34, mem: 28, status: "online" },
    { name: "notification-service", instances: 2, cpu: 67, mem: 83, status: "warning" },
  ]);

  const [appHealth, setAppHealth] = useState<AppHealth[]>([
    { name: "order-service", health: "healthy", lastCheck: "2分钟前", responseTime: 120 },
    { name: "user-service", health: "healthy", lastCheck: "1分钟前", responseTime: 85 },
    { name: "payment-service", health: "warning", lastCheck: "3分钟前", responseTime: 450 },
    { name: "inventory-service", health: "healthy", lastCheck: "30秒前", responseTime: 95 },
    { name: "notification-service", health: "warning", lastCheck: "5分钟前", responseTime: 380 },
  ]);

  const [appTypeDistribution, setAppTypeDistribution] = useState<AppTypeDistribution[]>([
    { type: "微服务", count: 45, percentage: 42, color: "#165DFF" },
    { type: "Web应用", count: 28, percentage: 26, color: "#722ED1" },
    { type: "批处理作业", count: 18, percentage: 17, color: "#00D68F" },
    { type: "后台服务", count: 12, percentage: 11, color: "#FFAA00" },
    { type: "其他", count: 4, percentage: 4, color: "#94A3B8" },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await applicationsApi.getAll();
        if (response.data && response.data.length > 0) {
          setApps(response.data.map((a: any) => ({
            id: a.id, name: a.name, project: a.projectName || "未知项目",
            status: a.status || "offline", ip: a.ip || "-",
            agent: a.agentVersion || "-", runtime: a.runtime || "-",
            jvm: a.javaVersion || "JDK8", heap: Math.round((a.heapUsage || 0) * 100),
            uptime: a.uptime || "0%", inst: a.instanceCount || 1,
          })));

          const total = response.data.length;
          const healthy = response.data.filter((a: any) => a.status === "online").length;
          const warning = response.data.filter((a: any) => a.status === "warning").length;
          const error = response.data.filter((a: any) => a.status === "error").length;

          setAppStats({
            totalApps: total,
            healthyApps: healthy,
            warningApps: warning,
            errorApps: error,
          });
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

  const filtered = useMemo(() =>
    apps.filter((a) =>
      (statusFilter === "all" || a.status === statusFilter) &&
      (search === "" || a.name.includes(search))
    ),
    [apps, statusFilter, search]
  );

  const {
    currentPage, pageSize, totalPages, startIndex, endIndex,
    paginatedData, setCurrentPage, setPageSize, canPrevPage, canNextPage,
  } = usePagination({ data: filtered, defaultPageSize: 10 });

  const handleCreate = () => {
    setEditingApp(null);
    setFormData({ name: "", status: "online", ip: "", agentVersion: "", jvmVersion: "", heapUsage: 0, uptime: "", instanceCount: 1 });
    setShowModal(true);
  };

  const handleEdit = (app: any) => {
    setEditingApp(app);
    setFormData({
      name: app.name || "", status: app.status || "online", ip: app.ip || "",
      agentVersion: app.agent || "", jvmVersion: app.jvm || "",
      heapUsage: app.heap || 0, uptime: app.runtime || "", instanceCount: app.inst || 1,
    });
    setShowModal(true);
  };

  const handleDelete = (app: any) => {
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
      if (selected === deletingApp.id) setSelected(null);
    } catch (error) {
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
        name: formData.name, status: formData.status, ip: formData.ip,
        agentVersion: formData.agentVersion, jvmVersion: formData.jvmVersion,
        heapUsage: formData.heapUsage / 100, uptime: formData.uptime, instanceCount: formData.instanceCount,
      };
      if (editingApp) {
        await applicationsApi.update(editingApp.id, appData);
        setApps(apps.map((a) => a.id === editingApp.id ? { ...a, ...appData, agent: appData.agentVersion, jvm: appData.jvmVersion, runtime: appData.uptime, inst: appData.instanceCount, heap: Math.round(appData.heapUsage * 100) } : a));
        showToast("应用更新成功", "success");
      } else {
        const response = await applicationsApi.create(appData);
        setApps([...apps, { id: response.data.id, ...appData, project: "未知项目", agent: appData.agentVersion || "-", jvm: appData.jvmVersion || "JDK8", runtime: appData.uptime || "-", inst: appData.instanceCount || 1, heap: Math.round((appData.heapUsage || 0) * 100), uptime: appData.uptime || "0%" }]);
        showToast("应用创建成功", "success");
      }
      setShowModal(false);
    } catch (error) {
      showToast(editingApp ? "更新失败" : "创建失败", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showToast("数据已刷新", "success");
    }, 1000);
  };

  const handleExport = () => {
    const dataStr = JSON.stringify(apps, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `applications_${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showToast("导出成功", "success");
  };

  const selectedApp = apps.find((a) => a.id === selected);

  if (loading) {
    return (
      <MainLayout title="应用管理">
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
    <MainLayout title="应用管理">
      <div data-cmp="Applications" className="space-y-4">
        <PageHeader
          title="应用管理"
          subtitle={`共 ${apps.length} 个应用，${apps.filter(a => a.status === "online").length} 在线`}
          actions={
            <>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleExport}>导出</TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={handleRefresh}>刷新</TechButton>
              <TechButton variant="secondary" onClick={() => showToast("批量操作功能开发中...", "info")}>批量操作</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新增应用</TechButton>
            </>
          }
        />

        <div className="grid grid-cols-4 gap-4">
          <StatCard
            title="总应用数"
            value={appStats.totalApps}
            icon={Server}
            color="#165DFF"
            trend="+3 本月"
          />
          <StatCard
            title="健康应用"
            value={appStats.healthyApps}
            icon={Activity}
            color="#00D68F"
            trend="+2 本周"
          />
          <StatCard
            title="警告应用"
            value={appStats.warningApps}
            icon={AlertTriangle}
            color="#FFAA00"
          />
          <StatCard
            title="异常应用"
            value={appStats.errorApps}
            icon={Shield}
            color="#FF4D4F"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={16} className="text-blue-500" />
                <div className="text-sm font-medium text-white">TOP 应用性能</div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock size={12} />
                <span>实时监控</span>
              </div>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">应用名称</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">实例数</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">CPU</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">内存</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">状态</th>
                </tr>
              </thead>
              <tbody>
                {topApps.map((app, index) => (
                  <tr key={app.name} className="border-b border-border/50 hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500/15">
                          <Target size={12} className="text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Cpu size={11} />
                        <span>{app.instances}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <PerformanceBar label="" value={app.cpu} color={app.cpu > 80 ? "#FF4D4F" : app.cpu > 60 ? "#FFAA00" : "#00D68F"} />
                    </td>
                    <td className="px-3 py-2.5">
                      <PerformanceBar label="" value={app.mem} color={app.mem > 80 ? "#FF4D4F" : app.mem > 60 ? "#FFAA00" : "#00D68F"} />
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={app.status as "online" | "warning" | "error" | "offline"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={16} className="text-green-500" />
                <div className="text-sm font-medium text-white">应用健康状态</div>
              </div>
            </div>
            <div className="space-y-3">
              {appHealth.map((app) => (
                <div key={app.name} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-2">
                    <HealthStatusIcon health={app.health} />
                    <div>
                      <div className="text-xs font-medium text-white">{app.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock size={10} />
                        <span>{app.lastCheck}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium" style={{ color: app.responseTime > 300 ? "#FF4D4F" : app.responseTime > 150 ? "#FFAA00" : "#00D68F" }}>
                      {app.responseTime}ms
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-purple-500" />
              <div className="text-sm font-medium text-white">应用类型分布</div>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Network size={11} />
                <span>总计 {appTypeDistribution.reduce((sum, d) => sum + d.count, 0)} 个</span>
              </div>
            </div>
          </div>
          <div className="flex items-end gap-6 h-48">
            {appTypeDistribution.map((item, index) => (
              <div key={item.type} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full flex items-end justify-center" style={{ height: `${item.percentage * 1.5}px` }}>
                  <div
                    className="w-16 rounded-t-md transition-all hover:opacity-80 cursor-pointer"
                    style={{
                      height: `${item.percentage * 1.5}px`,
                      background: item.color,
                      minHeight: "8px"
                    }}
                    title={`${item.type}: ${item.count} (${item.percentage}%)`}
                  />
                </div>
                <div className="text-xs font-medium text-white">{item.count}</div>
                <div className="text-xs text-muted-foreground text-center">{item.type}</div>
                <div className="text-xs" style={{ color: item.color }}>{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={search} onChange={setSearch} onSearch={() => setCurrentPage(1)} placeholder="搜索应用名称..." />
          <FilterDropdown value={statusFilter} options={statusOptions} onChange={setStatusFilter} placeholder="状态" />
        </div>

        <div className="flex gap-3">
          <div className="flex-1 rounded-lg overflow-hidden bg-card border border-border">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border bg-blue-500/5">
                  {["应用名称", "所属项目", "状态", "实例IP", "Agent版本", "运行时长", "堆内存", "实例数", "操作"].map((h) => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.map((app) => (
                  <tr
                    key={app.id}
                    className={`table-row-hover transition-colors cursor-pointer border-b border-border ${selected === app.id ? "bg-blue-500/8" : ""}`}
                    onClick={() => setSelected(selected === app.id ? null : app.id)}
                  >
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded flex items-center justify-center bg-purple-500/15">
                          <Monitor size={12} className="text-purple-500" />
                        </div>
                        <span className="text-xs font-medium text-white">{app.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground">{app.project}</td>
                    <td className="px-3 py-2.5"><StatusBadge status={app.status as "online" | "error" | "warning" | "offline"} /></td>
                    <td className="px-3 py-2.5 text-xs text-foreground font-mono">{app.ip}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: app.agent === "-" ? "rgba(148,163,184,0.1)" : "rgba(22,93,255,0.1)", color: app.agent === "-" ? "#94A3B8" : "#165DFF" }}>{app.agent}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock size={11} />{app.runtime}</span>
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
            <Pagination
              currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalCount={filtered.length}
              startIndex={startIndex} endIndex={endIndex} onPageChange={setCurrentPage} onPageSizeChange={setPageSize}
              canPrev={canPrevPage} canNext={canNextPage}
            />
          </div>

          <div className={`w-72 rounded-lg p-4 flex-shrink-0 ${selectedApp ? "" : "hidden"} bg-card border border-border`}>
            <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Monitor size={14} className="text-purple-500" />{selectedApp?.name}
            </div>
            {selectedApp && (
              <div className="space-y-3">
                <div className="p-3 rounded-md bg-muted">
                  <div className="text-xs font-medium mb-2 text-muted-foreground">JVM 基础信息</div>
                  <div className="space-y-1.5">
                    {([["JDK版本", selectedApp.jvm], ["实例IP", selectedApp.ip], ["Agent版本", selectedApp.agent], ["运行时长", selectedApp.runtime]] as [string, any][]).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-xs">
                        <span className="text-muted-foreground">{k}</span>
                        <span className="text-white font-medium">{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-md bg-muted">
                  <div className="text-xs font-medium mb-2 text-muted-foreground">资源使用</div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">堆内存</span><span className="text-white">{selectedApp.heap}%</span></div>
                      <HeapBar value={selectedApp.heap} />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">可用率</span>
                      <span className="text-green-500">{selectedApp.uptime}</span>
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

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowModal(false)}>
            <div className="w-[500px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-lg font-semibold text-white">{editingApp ? "编辑应用" : "新增应用"}</div>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-medium block mb-1.5 text-muted-foreground">应用名称 *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="例如: order-service" />
                  </div>
                  <div>
                    <label className="text-xs font-medium block mb-1.5 text-muted-foreground">状态</label>
                    <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm outline-none appearance-none cursor-pointer" style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                      <option value="online" style={{ color: "var(--foreground)", background: "var(--card)" }}>在线</option><option value="warning" style={{ color: "var(--foreground)", background: "var(--card)" }}>警告</option><option value="error" style={{ color: "var(--foreground)", background: "var(--card)" }}>异常</option><option value="offline" style={{ color: "var(--foreground)", background: "var(--card)" }}>离线</option>
                    </select>
                  </div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">实例IP</label><input type="text" value={formData.ip} onChange={(e) => setFormData({ ...formData, ip: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="例如: 192.168.1.10" /></div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">Agent版本</label><input type="text" value={formData.agentVersion} onChange={(e) => setFormData({ ...formData, agentVersion: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="例如: v2.4.1" /></div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">JDK版本</label><input type="text" value={formData.jvmVersion} onChange={(e) => setFormData({ ...formData, jvmVersion: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="例如: JDK17" /></div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">堆内存使用(%)</label><input type="number" min="0" max="100" value={formData.heapUsage} onChange={(e) => setFormData({ ...formData, heapUsage: parseInt(e.target.value) || 0 })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} /></div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">运行时长</label><input type="text" value={formData.uptime} onChange={(e) => setFormData({ ...formData, uptime: e.target.value })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} placeholder="例如: 12d 4h" /></div>
                  <div><label className="text-xs font-medium block mb-1.5 text-muted-foreground">实例数</label><input type="number" min="1" value={formData.instanceCount} onChange={(e) => setFormData({ ...formData, instanceCount: parseInt(e.target.value) || 1 })} className="w-full h-9 px-3 rounded-md text-sm bg-input border border-border outline-none" style={{ color: "var(--foreground)" }} /></div>
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <TechButton variant="secondary" type="button" onClick={() => setShowModal(false)} disabled={actionLoading}>取消</TechButton>
                  <TechButton variant="primary" type="submit" disabled={actionLoading}>{actionLoading ? "保存中..." : "确定保存"}</TechButton>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && deletingApp && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[200]" onClick={() => setShowDeleteConfirm(false)}>
            <div className="w-[360px] rounded-xl p-6 bg-card border border-border" onClick={(e) => e.stopPropagation()}>
              <div className="text-sm font-semibold text-white mb-3">确认删除</div>
              <p className="text-xs mb-6 text-muted-foreground">您确定要删除应用 "{deletingApp.name}" 吗？此操作无法撤销。</p>
              <div className="flex justify-end gap-2">
                <TechButton variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={actionLoading}>取消</TechButton>
                <TechButton variant="danger" onClick={confirmDelete} disabled={actionLoading}>{actionLoading ? "删除中..." : "确认删除"}</TechButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
