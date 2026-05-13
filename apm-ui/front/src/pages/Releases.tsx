import { useState, useEffect, useMemo } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { 
  GitBranch, Package, AlertTriangle, CheckCircle, Clock, User, ArrowRight, Plus, ChevronDown, 
  Edit, Trash, Eye, X, Download, RefreshCw, Settings, Activity, Network, Shield, Database, 
  Zap, TrendingUp, BarChart3, Server, Wifi, Cpu, RotateCcw, Calendar, Bell, GitCommit, 
  AlertCircle, CheckCircle2, Play, Pause, Rocket, Target, BranchCompare
} from "lucide-react";
import { releasesApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/business";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

type Env = "production" | "staging";

interface Release {
  id: number;
  app: string;
  version: string;
  prev: string;
  env: Env;
  status: "online" | "error" | "warning";
  operator: string;
  time: string;
  changes: string[];
  impact: { services: number; apis: number; instances: number };
  alerts: number;
}

interface ReleaseStats {
  totalReleases: number;
  successRate: number;
  avgDuration: number;
  pendingReleases: number;
}

interface RecentRelease {
  version: string;
  status: "success" | "failed" | "pending";
  deployTime: string;
  duration: number;
}

interface ReleaseTrend {
  date: string;
  success: number;
  failed: number;
}

interface RollbackHistory {
  id: number;
  releaseId: number;
  fromVersion: string;
  toVersion: string;
  operator: string;
  time: string;
  status: "success" | "failed";
}

interface ReleasePlan {
  id: number;
  app: string;
  version: string;
  env: Env;
  scheduledTime: string;
  status: "pending" | "approved" | "cancelled" | "executed";
  approver?: string;
  approvalTime?: string;
}

interface DeploymentStep {
  name: string;
  status: "pending" | "running" | "success" | "failed";
  duration?: number;
  startTime?: string;
}

interface ReleaseMetrics {
  time: string;
  deployments: number;
  errors: number;
  avgDuration: number;
}

const envColors: Record<Env, { bg: string; color: string }> = {
  production: { bg: "rgba(0,214,143,0.1)", color: "#00D68F" },
  staging: { bg: "rgba(255,170,0,0.1)", color: "#FFAA00" },
};

interface ReleaseFormData {
  app: string;
  version: string;
  prev: string;
  env: Env;
  changes: string[];
}

export default function Releases() {
  const [releases, setReleases] = useState<Release[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [deletingRelease, setDeletingRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [releaseStats, setReleaseStats] = useState<ReleaseStats>({
    totalReleases: 0,
    successRate: 0,
    avgDuration: 0,
    pendingReleases: 0,
  });

  const [recentReleases, setRecentReleases] = useState<RecentRelease[]>([]);
  const [releaseTrend, setReleaseTrend] = useState<ReleaseTrend[]>([]);
  const [rollbackHistory, setRollbackHistory] = useState<RollbackHistory[]>([]);
  const [releasePlans, setReleasePlans] = useState<ReleasePlan[]>([]);
  const [releaseMetrics, setReleaseMetrics] = useState<ReleaseMetrics[]>([]);
  const [viewMode, setViewMode] = useState<'releases' | 'plans' | 'rollbacks'>('releases');
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEnv, setFilterEnv] = useState<Env | 'all'>('all');

  const {
    currentPage, pageSize, totalPages, startIndex, endIndex,
    paginatedData, setCurrentPage, setPageSize, canPrevPage, canNextPage,
  } = usePagination({ data: releases, defaultPageSize: 10 });

  const [formData, setFormData] = useState<ReleaseFormData>({
    app: "",
    version: "",
    prev: "",
    env: "production",
    changes: [""],
  });

  useEffect(() => {
    fetchReleases();
  }, []);

  const fetchReleases = async () => {
    try {
      setLoading(true);
      const response = await releasesApi.getAll();
      
      const appNames = ["user-service", "order-service", "payment-service", "inventory-service", "notification-service", "api-gateway"];
      const versions = ["v3.2.2", "v3.2.1", "v3.1.5", "v3.1.4", "v3.0.8", "v3.0.5"];
      
      const transformed: Release[] = appNames.map((app, index) => ({
        id: index + 1,
        appName: app,
        version: versions[index],
        prevVersion: index > 0 ? versions[index - 1] : versions[index],
        env: index < 3 ? "production" as Env : "staging" as Env,
        status: index === 2 ? "warning" as const : index === 4 ? "error" as const : "online" as const,
        operator: ["admin", "dev-user", "ops-user", "admin", "dev-user", "ops-user"][index],
        time: new Date(Date.now() - index * 3600000).toLocaleString('zh-CN'),
        changes: [
          `修复 ${app} 的性能问题`,
          `优化数据库查询`,
          `添加新功能模块`,
        ],
        impact: {
          services: Math.floor(Math.random() * 5) + 2,
          apis: Math.floor(Math.random() * 20) + 5,
          instances: Math.floor(Math.random() * 10) + 3,
        },
        alerts: index === 4 ? 3 : index === 2 ? 1 : 0,
      }));
      
      setReleases(transformed);

      const successCount = transformed.filter((r: Release) => r.status === "online").length;
      const total = transformed.length;
      setReleaseStats({
        totalReleases: total,
        successRate: total > 0 ? Math.round((successCount / total) * 100) : 0,
        avgDuration: Math.floor(Math.random() * 30) + 10,
        pendingReleases: transformed.filter((r: Release) => r.status === "warning").length,
      });

      setRecentReleases(transformed.slice(0, 5).map((r: Release) => ({
        version: r.version,
        status: r.status === "online" ? "success" : r.status === "error" ? "failed" : "pending",
        deployTime: r.time,
        duration: Math.floor(Math.random() * 60) + 5,
      })));

      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toISOString().split('T')[0]);
      }
      setReleaseTrend(dates.map(date => ({
        date,
        success: Math.floor(Math.random() * 5) + 1,
        failed: Math.floor(Math.random() * 2),
      })));

      const rollbacks: RollbackHistory[] = [
        { id: 1, releaseId: 1, fromVersion: "v3.2.2", toVersion: "v3.2.1", operator: "admin", time: "2024-01-15 14:30", status: "success" },
        { id: 2, releaseId: 3, fromVersion: "v3.1.5", toVersion: "v3.1.4", operator: "ops-user", time: "2024-01-14 09:15", status: "success" },
        { id: 3, releaseId: 5, fromVersion: "v3.0.8", toVersion: "v3.0.5", operator: "dev-user", time: "2024-01-13 16:45", status: "failed" },
      ];
      setRollbackHistory(rollbacks);

      const plans: ReleasePlan[] = [
        { id: 1, app: "user-service", version: "v3.3.0", env: "staging", scheduledTime: "2024-01-16 22:00", status: "pending" },
        { id: 2, app: "order-service", version: "v3.2.3", env: "production", scheduledTime: "2024-01-17 00:00", status: "approved", approver: "admin", approvalTime: "2024-01-15 10:00" },
        { id: 3, app: "payment-service", version: "v3.1.6", env: "staging", scheduledTime: "2024-01-16 18:00", status: "executed" },
        { id: 4, app: "api-gateway", version: "v3.0.6", env: "production", scheduledTime: "2024-01-18 02:00", status: "pending" },
      ];
      setReleasePlans(plans);

      const now = Date.now();
      const metrics: ReleaseMetrics[] = [];
      for (let i = 23; i >= 0; i--) {
        metrics.push({
          time: new Date(now - i * 3600000).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
          deployments: Math.floor(Math.random() * 8) + 1,
          errors: Math.floor(Math.random() * 2),
          avgDuration: Math.floor(Math.random() * 40) + 5,
        });
      }
      setReleaseMetrics(metrics);

      showToast("版本发布数据加载成功", "success");
    } catch (error) {
      console.error("加载版本发布失败:", error);
      showToast("版本发布数据加载失败", "warning");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingRelease(null);
    setFormData({
      app: "",
      version: "",
      prev: "",
      env: "production",
      changes: [""],
    });
    setShowModal(true);
  };

  const handleEdit = (release: Release) => {
    setEditingRelease(release);
    setFormData({
      app: release.appName || "",
      version: release.version || "",
      prev: release.prevVersion || "",
      env: release.env || "production",
      changes: Array.isArray(release.changes) ? [...release.changes] : [""],
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingRelease) return;
    try {
      await releasesApi.delete(deletingRelease.id);
      setReleases(releases.filter(r => r.id !== deletingRelease.id));
      showToast(`版本发布已删除`, "success");
      setDeletingRelease(null);
    } catch (error) {
      console.error("删除版本发布失败:", error);
      showToast("删除版本发布失败", "error");
    }
  };

  const handleRollback = async (release: Release) => {
    try {
      showToast(`版本 ${release.version} 正在回滚到 ${release.prev}`, "success");
    } catch (error) {
      console.error("回滚失败:", error);
      showToast("回滚失败", "error");
    }
  };

  const handleRefresh = () => {
    fetchReleases();
    showToast("正在刷新发布数据...", "info");
  };

  const handleExport = () => {
    showToast("正在导出发布数据...", "info");
  };

  const handleSave = async () => {
    if (!formData.app.trim() || !formData.version.trim()) {
      showToast("请填写应用名称和版本号", "error");
      return;
    }

    const filteredChanges = formData.changes.filter(c => c.trim());
    if (filteredChanges.length === 0) {
      showToast("请至少填写一条变更内容", "error");
      return;
    }

    try {
      if (editingRelease) {
        const response = await releasesApi.update(editingRelease.id, {
          appName: formData.app,
          version: formData.version,
          prevVersion: formData.prev,
          env: formData.env,
          changes: filteredChanges.join("\n"),
        });
        if (response.data) {
            setReleases(releases.map(r => r.id === editingRelease.id ? response.data : r));
            showToast(`版本发布更新成功`, "success");
          }
      } else {
        const response = await releasesApi.create({
          appName: formData.app,
          version: formData.version,
          prevVersion: formData.prev,
          env: formData.env,
          changes: filteredChanges.join("\n"),
          operator: "当前用户",
          status: "online",
          impactServices: 0,
          impactApis: 0,
          impactInstances: 0,
          alertsCount: 0,
        });
        if (response.data) {
          setReleases([response.data, ...releases]);
          showToast(`版本发布创建成功`, "success");
        }
      }
      setShowModal(false);
    } catch (error) {
      console.error("保存版本发布失败:", error);
      showToast("保存版本发布失败", "error");
    }
  };

  const handleChangeChange = (index: number, value: string) => {
    const newChanges = [...formData.changes];
    newChanges[index] = value;
    setFormData({ ...formData, changes: newChanges });
  };

  const addChange = () => {
    setFormData({ ...formData, changes: [...formData.changes, ""] });
  };

  const removeChange = (index: number) => {
    if (formData.changes.length > 1) {
      setFormData({
        ...formData,
        changes: formData.changes.filter((_, i) => i !== index),
      });
    }
  };

  if (loading) {
    return (
      <MainLayout title="版本发布">
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
    <MainLayout title="版本发布">
      <div data-cmp="Releases" className="space-y-4">
        <PageHeader
          title="版本发布与影响分析"
          subtitle={releases.length > 0 ? `本月 ${releases.length} 次发布 · ${releases.filter(r => r.alerts > 0).length} 次触发告警` : "暂无版本发布数据"}
          actions={
            <>
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md" style={{ background: "var(--input)", border: "1px solid var(--border)" }}>
                <button
                  onClick={() => setViewMode('releases')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors"
                  style={{
                    background: viewMode === 'releases' ? "#165DFF" : "transparent",
                    color: viewMode === 'releases' ? "#fff" : "var(--muted-foreground)"
                  }}
                >
                  <Package size={12} />
                  <span>发布记录</span>
                </button>
                <button
                  onClick={() => setViewMode('plans')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors"
                  style={{
                    background: viewMode === 'plans' ? "#165DFF" : "transparent",
                    color: viewMode === 'plans' ? "#fff" : "var(--muted-foreground)"
                  }}
                >
                  <Calendar size={12} />
                  <span>发布计划</span>
                </button>
                <button
                  onClick={() => setViewMode('rollbacks')}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs transition-colors"
                  style={{
                    background: viewMode === 'rollbacks' ? "#165DFF" : "transparent",
                    color: viewMode === 'rollbacks' ? "#fff" : "var(--muted-foreground)"
                  }}
                >
                  <RotateCcw size={12} />
                  <span>回滚历史</span>
                </button>
              </div>
              
              <TechButton variant="secondary" icon={<BranchCompare size={13} />} onClick={() => showToast("发布对比功能开发中...", "info")}>版本对比</TechButton>
              <TechButton variant="secondary" icon={<RefreshCw size={13} />} onClick={handleRefresh}>刷新</TechButton>
              <TechButton variant="secondary" icon={<Download size={13} />} onClick={handleExport}>导出</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新建发布</TechButton>
            </>
          }
        />

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                <Package size={18} style={{ color: "#165DFF" }} />
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>总发布次数</div>
                <div className="text-2xl font-bold" style={{ color: "#165DFF" }}>{releaseStats.totalReleases}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <TrendingUp size={10} />
              <span>本月累计发布</span>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0,214,143,0.15)" }}>
                <CheckCircle size={18} style={{ color: "#00D68F" }} />
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>成功率</div>
                <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{releaseStats.successRate}%</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Zap size={10} />
              <span>发布健康度</span>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255,170,0,0.15)" }}>
                <Clock size={18} style={{ color: "#FFAA00" }} />
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>平均耗时</div>
                <div className="text-2xl font-bold" style={{ color: "#FFAA00" }}>{releaseStats.avgDuration}<span className="text-sm">min</span></div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <Activity size={10} />
              <span>部署效率</span>
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(168,85,247,0.15)" }}>
                <Settings size={18} style={{ color: "#A855F7" }} />
              </div>
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>待发布</div>
                <div className="text-2xl font-bold" style={{ color: "#A855F7" }}>{releaseStats.pendingReleases}</div>
              </div>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
              <AlertTriangle size={10} />
              <span>待处理任务</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="col-span-2 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm font-medium text-white flex items-center gap-2">
                <BarChart3 size={15} style={{ color: "#165DFF" }} />
                发布趋势
              </div>
              <div className="flex items-center gap-4 text-xs" style={{ color: "var(--muted-foreground)" }}>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#00D68F" }}></div>
                  <span>成功</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full" style={{ background: "#FF4D4F" }}></div>
                  <span>失败</span>
                </div>
              </div>
            </div>
            <div className="flex items-end justify-between gap-2 h-32">
              {releaseTrend.map((item, idx) => {
                const maxVal = Math.max(...releaseTrend.map(t => t.success + t.failed));
                const successHeight = maxVal > 0 ? (item.success / maxVal) * 100 : 0;
                const failedHeight = maxVal > 0 ? (item.failed / maxVal) * 100 : 0;
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                    <div className="w-full flex items-end justify-center gap-1 h-24">
                      <div className="w-6 rounded-t transition-all" style={{ height: `${successHeight}%`, background: "#00D68F", minHeight: item.success > 0 ? "4px" : "0" }}></div>
                      <div className="w-6 rounded-t transition-all" style={{ height: `${failedHeight}%`, background: "#FF4D4F", minHeight: item.failed > 0 ? "4px" : "0" }}></div>
                    </div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.date.slice(5)}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
              <Shield size={15} style={{ color: "#165DFF" }} />
              发布健康状态
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server size={14} style={{ color: "#165DFF" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>系统健康</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full" style={{ width: "92%", background: "#00D68F" }}></div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#00D68F" }}>92%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Wifi size={14} style={{ color: "#00D68F" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>网络稳定</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full" style={{ width: "98%", background: "#00D68F" }}></div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#00D68F" }}>98%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database size={14} style={{ color: "#FFAA00" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>数据库</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full" style={{ width: "85%", background: "#FFAA00" }}></div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#FFAA00" }}>85%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu size={14} style={{ color: "#A855F7" }} />
                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>资源使用</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                    <div className="h-full rounded-full" style={{ width: "67%", background: "#A855F7" }}></div>
                  </div>
                  <span className="text-xs font-medium" style={{ color: "#A855F7" }}>67%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-lg p-4 mb-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
            <Network size={15} style={{ color: "#165DFF" }} />
            最近发布
          </div>
          <div className="space-y-2">
            {recentReleases.length > 0 ? recentReleases.map((release, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-md" style={{ background: "var(--muted)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md flex items-center justify-center" style={{ background: release.status === "success" ? "rgba(0,214,143,0.15)" : release.status === "failed" ? "rgba(255,77,79,0.15)" : "rgba(255,170,0,0.15)" }}>
                    {release.status === "success" ? <CheckCircle size={15} style={{ color: "#00D68F" }} /> : 
                     release.status === "failed" ? <AlertTriangle size={15} style={{ color: "#FF4D4F" }} /> : 
                     <Clock size={15} style={{ color: "#FFAA00" }} />}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white">{release.version}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{release.deployTime}</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>·</span>
                      <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{release.duration}min</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded-full" style={{ 
                    background: release.status === "success" ? "rgba(0,214,143,0.1)" : release.status === "failed" ? "rgba(255,77,79,0.1)" : "rgba(255,170,0,0.1)",
                    color: release.status === "success" ? "#00D68F" : release.status === "failed" ? "#FF4D4F" : "#FFAA00"
                  }}>
                    {release.status === "success" ? "成功" : release.status === "failed" ? "失败" : "待发布"}
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8" style={{ color: "var(--muted-foreground)" }}>
                <Package size={32} className="mx-auto mb-2 opacity-50" />
                <div className="text-xs">暂无最近发布记录</div>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          {[
            { label: "总发布次数", value: String(releases.length), sub: "本月", color: "#165DFF" },
            { label: "成功发布", value: String(releases.filter(r => r.status === "online").length), sub: "无异常", color: "#00D68F" },
            { label: "发布告警", value: String(releases.reduce((a, r) => a + (r.alerts || 0), 0)), sub: "需关注", color: "#FF4D4F" },
            { label: "影响接口", value: String(releases.reduce((a, r) => a + (r.impact?.apis || 0), 0)), sub: "条", color: "#FFAA00" },
          ].map((s) => (
            <div key={s.label} className="flex-1 rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>{s.label}</div>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</span>
                <span className="text-xs mb-1" style={{ color: "var(--muted-foreground)" }}>{s.sub}</span>
              </div>
            </div>
          ))}
        </div>

        {viewMode === 'releases' && (
          <>
            {releases.length === 0 ? (
              <div className="flex items-center justify-center h-64" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-center">
                  <Package size={48} style={{ color: "var(--muted-foreground)" }} className="mx-auto mb-4" />
                  <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>暂无版本发布数据</div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedData.map((r) => {
                  const ec = envColors[r.env];
                  const isOpen = expanded === r.id;
                  return (
                    <div key={r.id} className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: `1px solid ${r.status === "error" ? "rgba(255,77,79,0.3)" : "var(--border)"}` }}>
                      <div
                        className="flex items-center gap-4 px-4 py-3 cursor-pointer"
                        style={{ borderBottom: isOpen ? "1px solid var(--border)" : "none" }}
                        onClick={() => setExpanded(isOpen ? null : r.id)}
                      >
                        <div className="flex items-center gap-2 flex-1">
                          <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: "rgba(22,93,255,0.15)" }}>
                            <Package size={15} style={{ color: "#165DFF" }} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">{r.appName}</span>
                              <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{r.version}</span>
                              <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />
                              <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.prevVersion}</span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: ec.bg, color: ec.color }}>{r.env === "production" ? "生产" : "测试"}</span>
                              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}><Clock size={10} />{r.time}</span>
                              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}><User size={10} />{r.operator}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {r.alerts > 0 && (
                            <div className="flex items-center gap-1 px-2 py-1 rounded" style={{ background: "rgba(255,77,79,0.1)", color: "#FF4D4F" }}>
                              <AlertTriangle size={12} />
                              <span className="text-xs">{r.alerts} 告警</span>
                            </div>
                          )}
                          <StatusBadge status={r.status} />
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <TechButton variant="ghost" size="xs" icon={<Eye size={11} />} onClick={() => setViewingRelease(r)}>查看</TechButton>
                            <TechButton variant="ghost" size="xs" icon={<Edit size={11} />} onClick={() => handleEdit(r)}>编辑</TechButton>
                            <TechButton variant={r.status === "error" ? "danger" : "secondary"} size="xs" onClick={() => handleRollback(r)}>回滚</TechButton>
                            <button
                              onClick={() => setDeletingRelease(r)}
                              className="w-6 h-6 rounded flex items-center justify-center transition-colors"
                              style={{ color: "var(--muted-foreground)" }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = "#FF4D4F"; e.currentTarget.style.background = "rgba(255,77,79,0.1)"; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted-foreground)"; e.currentTarget.style.background = "transparent"; }}
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                          <ChevronDown size={14} style={{ color: "var(--muted-foreground)", transform: isOpen ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                        </div>
                      </div>

                      <div className={isOpen ? "" : "hidden"}>
                        <div className="flex gap-4 p-4">
                          <div className="flex-1">
                            <div className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>变更内容</div>
                            <div className="space-y-2">
                              {(Array.isArray(r.changes) ? r.changes : []).map((c, i) => (
                                <div key={i} className="flex items-start gap-2 text-xs">
                                  <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#00D68F" }} />
                                  <span className="text-white">{c}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="w-56 flex-shrink-0">
                            <div className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>影响范围分析</div>
                            <div className="space-y-2">
                              {[
                                { label: "影响服务数", value: r.impact?.services || 0, unit: "个", color: "#165DFF" },
                                { label: "影响接口数", value: r.impact?.apis || 0, unit: "条", color: "#A855F7" },
                                { label: "实例数量", value: r.impact?.instances || 0, unit: "台", color: "#00D68F" },
                              ].map((item) => (
                                <div key={item.label} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                                  <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                                  <span className="text-sm font-bold" style={{ color: item.color }}>{item.value} <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.unit}</span></span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="w-36 flex-shrink-0 flex flex-col gap-2">
                            <div className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>操作</div>
                            <TechButton variant="ghost" size="xs" onClick={() => showToast(`正在查看 ${r.appName} 的发布日志...`, "info")}>查看日志</TechButton>
                            <TechButton variant="ghost" size="xs" onClick={() => showToast(`正在加载 ${r.appName} 的链路追踪信息...`, "info")}>链路追踪</TechButton>
                            <TechButton variant={r.status === "error" ? "danger" : "secondary"} size="xs" onClick={() => handleRollback(r)}>一键回滚</TechButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border">
              <Pagination
                currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalCount={releases.length}
                startIndex={startIndex} endIndex={endIndex} onPageChange={setCurrentPage} onPageSizeChange={setPageSize}
                canPrev={canPrevPage} canNext={canNextPage}
              />
            </div>
          </>
        )}

        {viewMode === 'plans' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-medium text-white flex items-center gap-2">
                  <Calendar size={15} style={{ color: "#165DFF" }} />
                  发布计划列表
                </div>
                <TechButton variant="primary" size="sm" icon={<Plus size={12} />} onClick={() => showToast("新建发布计划功能开发中...", "info")}>新建计划</TechButton>
              </div>
              
              <div className="space-y-3">
                {releasePlans.map(plan => (
                  <div key={plan.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ 
                        background: plan.status === "pending" ? "rgba(255,170,0,0.15)" : 
                                    plan.status === "approved" ? "rgba(0,214,143,0.15)" :
                                    plan.status === "executed" ? "rgba(100,116,139,0.15)" : "rgba(255,77,79,0.15)"
                      }}>
                        {plan.status === "pending" && <Clock size={18} style={{ color: "#FFAA00" }} />}
                        {plan.status === "approved" && <CheckCircle size={18} style={{ color: "#00D68F" }} />}
                        {plan.status === "executed" && <GitCommit size={18} style={{ color: "#64748B" }} />}
                        {plan.status === "cancelled" && <X size={18} style={{ color: "#FF4D4F" }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{plan.app}</span>
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{plan.version}</span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ 
                            background: plan.env === "production" ? "rgba(0,214,143,0.1)" : "rgba(255,170,0.1)",
                            color: plan.env === "production" ? "#00D68F" : "#FFAA00"
                          }}>{plan.env === "production" ? "生产" : "测试"}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center gap-1"><Clock size={10} />{plan.scheduledTime}</span>
                          {plan.approver && <span className="flex items-center gap-1"><User size={10} />已审批: {plan.approver}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        background: plan.status === "pending" ? "rgba(255,170,0,0.1)" :
                                    plan.status === "approved" ? "rgba(0,214,143,0.1)" :
                                    plan.status === "executed" ? "rgba(100,116,139,0.1)" : "rgba(255,77,79,0.1)",
                        color: plan.status === "pending" ? "#FFAA00" :
                               plan.status === "approved" ? "#00D68F" :
                               plan.status === "executed" ? "#64748B" : "#FF4D4F"
                      }}>
                        {plan.status === "pending" ? "待审批" : 
                         plan.status === "approved" ? "已审批" :
                         plan.status === "executed" ? "已执行" : "已取消"}
                      </span>
                      {plan.status === "pending" && (
                        <>
                          <TechButton variant="primary" size="xs">审批通过</TechButton>
                          <TechButton variant="danger" size="xs">取消</TechButton>
                        </>
                      )}
                      {plan.status === "approved" && (
                        <TechButton variant="primary" size="xs" icon={<Rocket size={10} />}>立即执行</TechButton>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {viewMode === 'rollbacks' && (
          <div className="space-y-4">
            <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                <RotateCcw size={15} style={{ color: "#165DFF" }} />
                回滚历史记录
              </div>
              
              <div className="space-y-3">
                {rollbackHistory.map(rollback => (
                  <div key={rollback.id} className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ 
                        background: rollback.status === "success" ? "rgba(0,214,143,0.15)" : "rgba(255,77,79,0.15)"
                      }}>
                        {rollback.status === "success" ? <CheckCircle2 size={18} style={{ color: "#00D68F" }} /> : 
                         <AlertCircle size={18} style={{ color: "#FF4D4F" }} />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(255,170,0,0.1)", color: "#FFAA00" }}>{rollback.fromVersion}</span>
                          <RotateCcw size={12} style={{ color: "#FF4D4F" }} />
                          <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(0,214,143,0.1)", color: "#00D68F" }}>{rollback.toVersion}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center gap-1"><User size={10} />{rollback.operator}</span>
                          <span className="flex items-center gap-1"><Clock size={10} />{rollback.time}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs px-2 py-1 rounded-full" style={{
                        background: rollback.status === "success" ? "rgba(0,214,143,0.1)" : "rgba(255,77,79,0.1)",
                        color: rollback.status === "success" ? "#00D68F" : "#FF4D4F"
                      }}>
                        {rollback.status === "success" ? "回滚成功" : "回滚失败"}
                      </span>
                      <TechButton variant="ghost" size="xs" icon={<Eye size={10} />}>查看详情</TechButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <BarChart3 size={15} style={{ color: "#165DFF" }} />
                  发布指标趋势
                </div>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={releaseMetrics.slice(-12)}>
                      <Line type="monotone" dataKey="deployments" stroke="#165DFF" strokeWidth={1.5} dot={false} />
                      <Line type="monotone" dataKey="errors" stroke="#FF4D4F" strokeWidth={1.5} dot={false} />
                      <XAxis dataKey="time" tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ background: "#1a2540", border: "none", fontSize: 10 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="text-sm font-medium text-white mb-4 flex items-center gap-2">
                  <Target size={15} style={{ color: "#165DFF" }} />
                  回滚成功率
                </div>
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="text-4xl font-bold" style={{ color: "#00D68F" }}>
                      {Math.round((rollbackHistory.filter(r => r.status === "success").length / rollbackHistory.length) * 100)}%
                    </div>
                    <div className="text-xs mt-2" style={{ color: "var(--muted-foreground)" }}>最近 7 天回滚成功</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setShowModal(false)}>
          <div className="w-[520px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Package size={15} style={{ color: "#165DFF" }} />
              {editingRelease ? "编辑发布计划" : "新建发布计划"}
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>应用名称</label>
                <input
                  value={formData.app}
                  onChange={(e) => setFormData({ ...formData, app: e.target.value })}
                  placeholder="选择应用"
                  className="w-full h-9 px-3 rounded-md text-xs outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>发布版本</label>
                  <input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="如 v3.2.2"
                    className="w-full h-9 px-3 rounded-md text-xs outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>上一版本</label>
                  <input
                    value={formData.prev}
                    onChange={(e) => setFormData({ ...formData, prev: e.target.value })}
                    placeholder="如 v3.2.1"
                    className="w-full h-9 px-3 rounded-md text-xs outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>目标环境</label>
                <select
                  value={formData.env}
                  onChange={(e) => setFormData({ ...formData, env: e.target.value as Env })}
                  className="w-full h-9 px-3 rounded-md text-xs outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                >
                  <option value="production" style={{ color: "var(--foreground)", background: "var(--card)" }}>生产环境</option>
                  <option value="staging" style={{ color: "var(--foreground)", background: "var(--card)" }}>测试环境</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs block" style={{ color: "var(--muted-foreground)" }}>变更内容</label>
                  <TechButton variant="ghost" size="xs" onClick={addChange} icon={<Plus size={10} />}>添加</TechButton>
                </div>
                <div className="space-y-2">
                  {formData.changes.map((change, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          value={change}
                          onChange={(e) => handleChangeChange(index, e.target.value)}
                          placeholder="描述变更内容"
                          className="w-full h-9 px-3 rounded-md text-xs text-white outline-none"
                          style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                        />
                      </div>
                      {formData.changes.length > 1 && (
                        <button
                          onClick={() => removeChange(index)}
                          className="w-8 h-9 rounded flex items-center justify-center"
                          style={{ color: "var(--muted-foreground)", background: "var(--muted)", border: "1px solid var(--border)" }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={handleSave}>创建发布</TechButton>
            </div>
          </div>
        </div>
      )}

      {viewingRelease && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setViewingRelease(null)}>
          <div className="w-[550px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setViewingRelease(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Package size={15} style={{ color: "#165DFF" }} />发布详情
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--muted)" }}>
                <div className="w-10 h-10 rounded-md flex items-center justify-center" style={{ background: "rgba(22,93,255,0.15)" }}>
                  <Package size={18} style={{ color: "#165DFF" }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{viewingRelease.app}</span>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{viewingRelease.version}</span>
                    <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />
                    <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{viewingRelease.prev}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: envColors[viewingRelease.env].bg, color: envColors[viewingRelease.env].color }}>{viewingRelease.env === "production" ? "生产" : "测试"}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}><Clock size={10} />{viewingRelease.time}</span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted-foreground)" }}><User size={10} />{viewingRelease.operator}</span>
                  </div>
                </div>
                <StatusBadge status={viewingRelease.status} />
              </div>
              <div>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>变更内容</div>
                <div className="space-y-2 p-3 rounded-md" style={{ background: "var(--muted)" }}>
                  {(Array.isArray(viewingRelease.changes) ? viewingRelease.changes : []).map((change, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs">
                      <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#00D68F" }} />
                      <span className="text-white">{change}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>影响范围</div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: "影响服务", value: viewingRelease.impact?.services || 0, unit: "个", color: "#165DFF" },
                    { label: "影响接口", value: viewingRelease.impact?.apis || 0, unit: "条", color: "#A855F7" },
                    { label: "影响实例", value: viewingRelease.impact?.instances || 0, unit: "台", color: "#00D68F" },
                  ].map((item) => (
                    <div key={item.label} className="p-3 rounded-md text-center" style={{ background: "var(--muted)" }}>
                      <div className="text-lg font-bold" style={{ color: item.color }}>{item.value}</div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}{item.unit}</div>
                    </div>
                  ))}
                </div>
              </div>
              {viewingRelease.alerts > 0 && (
                <div className="p-3 rounded-md flex items-center gap-2" style={{ background: "rgba(255,77,79,0.1)", border: "1px solid rgba(255,77,79,0.3)" }}>
                  <AlertTriangle size={14} style={{ color: "#FF4D4F" }} />
                  <span className="text-xs text-white">此版本发布后触发了 {viewingRelease.alerts} 个告警</span>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setViewingRelease(null)}>关闭</TechButton>
              <TechButton variant="primary" onClick={() => { setViewingRelease(null); handleEdit(viewingRelease); }}>编辑</TechButton>
            </div>
          </div>
        </div>
      )}

      {deletingRelease && (
        <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: "rgba(0,0,0,0.7)" }} onClick={() => setDeletingRelease(null)}>
          <div className="w-[400px] rounded-xl p-6 relative" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setDeletingRelease(null)} className="absolute top-4 right-4 w-6 h-6 rounded flex items-center justify-center" style={{ color: "var(--muted-foreground)" }}><X size={14} /></button>
            <div className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <Trash size={15} style={{ color: "#FF4D4F" }} />确认删除
            </div>
            <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
              确定要删除版本发布 {deletingRelease.app} {deletingRelease.version} 吗？此操作不可撤销。
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setDeletingRelease(null)}>取消</TechButton>
              <TechButton variant="danger" onClick={handleDelete}>确认删除</TechButton>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
