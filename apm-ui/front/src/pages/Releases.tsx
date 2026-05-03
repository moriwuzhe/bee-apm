import { useState, useEffect } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { GitBranch, Package, AlertTriangle, CheckCircle, Clock, User, ArrowRight, Plus, ChevronDown, Edit, Trash, Eye, X } from "lucide-react";
import { releasesApi } from "../services/api";
import { useToast } from "../context/ToastContext";
import { usePagination } from "@/hooks/usePagination";
import { Pagination } from "@/components/business";

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

const defaultReleases: Release[] = [
  {
    id: 1, app: "order-service", version: "v3.2.1", prev: "v3.2.0",
    env: "production", status: "error", operator: "张伟",
    time: "2024-01-15 14:23",
    changes: ["修复订单状态同步问题", "优化数据库连接池配置", "升级支付SDK至v2.1.0"],
    impact: { services: 4, apis: 12, instances: 3 },
    alerts: 3,
  },
  {
    id: 2, app: "payment-gateway", version: "v2.0.5", prev: "v2.0.4",
    env: "production", status: "online", operator: "李明",
    time: "2024-01-15 10:15",
    changes: ["升级加密算法至AES-256", "新增支付渠道: 数字人民币"],
    impact: { services: 2, apis: 6, instances: 2 },
    alerts: 0,
  },
  {
    id: 3, app: "user-service", version: "v1.8.2", prev: "v1.8.1",
    env: "staging", status: "warning", operator: "王芳",
    time: "2024-01-14 16:40",
    changes: ["优化登录接口性能", "增加第三方OAuth支持"],
    impact: { services: 3, apis: 8, instances: 2 },
    alerts: 1,
  },
];

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
  const [releases, setReleases] = useState<Release[]>(defaultReleases);
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showModal, setShowModal] = useState(false);
  const [viewingRelease, setViewingRelease] = useState<Release | null>(null);
  const [editingRelease, setEditingRelease] = useState<Release | null>(null);
  const [deletingRelease, setDeletingRelease] = useState<Release | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

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
      if (response.data && response.data.length > 0) {
        const transformed = response.data.map((release: any) => ({
          ...release,
          changes: release.changes ? release.changes.split("\n") : [""],
          impact: {
            services: release.impactServices || 0,
            apis: release.impactApis || 0,
            instances: release.impactInstances || 0,
          },
          alerts: release.alertsCount || 0,
        }));
        setReleases(transformed);
      }
    } catch (error) {
      console.error("加载版本发布失败:", error);
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
          subtitle={`本月 ${releases.length} 次发布 · ${releases.filter(r => r.alerts > 0).length} 次触发告警`}
          actions={
            <>
              <TechButton variant="secondary" icon={<GitBranch size={13} />} onClick={() => showToast("发布对比功能开发中...", "info")}>发布对比</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate}>新建发布</TechButton>
            </>
          }
        />

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

        <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-card border border-border">
          <Pagination
            currentPage={currentPage} pageSize={pageSize} totalPages={totalPages} totalCount={releases.length}
            startIndex={startIndex} endIndex={endIndex} onPageChange={setCurrentPage} onPageSizeChange={setPageSize}
            canPrev={canPrevPage} canNext={canNextPage}
          />
        </div>
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
                  className="w-full h-9 px-3 rounded-md text-xs text-white outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>发布版本</label>
                  <input
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    placeholder="如 v3.2.2"
                    className="w-full h-9 px-3 rounded-md text-xs text-white outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                  />
                </div>
                <div>
                  <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>上一版本</label>
                  <input
                    value={formData.prev}
                    onChange={(e) => setFormData({ ...formData, prev: e.target.value })}
                    placeholder="如 v3.2.1"
                    className="w-full h-9 px-3 rounded-md text-xs text-white outline-none"
                    style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs mb-1.5 block" style={{ color: "var(--muted-foreground)" }}>目标环境</label>
                <select
                  value={formData.env}
                  onChange={(e) => setFormData({ ...formData, env: e.target.value as Env })}
                  className="w-full h-9 px-3 rounded-md text-xs text-white outline-none"
                  style={{ background: "var(--input)", border: "1px solid var(--border)" }}
                >
                  <option value="production" style={{ color: "#fff", background: "#1E293B" }}>生产环境</option>
                  <option value="staging" style={{ color: "#fff", background: "#1E293B" }}>测试环境</option>
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
