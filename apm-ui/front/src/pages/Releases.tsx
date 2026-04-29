import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import PageHeader from "../components/UI/PageHeader";
import TechButton from "../components/UI/TechButton";
import StatusBadge from "../components/UI/StatusBadge";
import { GitBranch, Package, AlertTriangle, CheckCircle, Clock, User, ArrowRight, Plus, ChevronDown } from "lucide-react";

const releases = [
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
  {
    id: 4, app: "inventory-service", version: "v2.3.0", prev: "v2.2.9",
    env: "production", status: "online", operator: "赵强",
    time: "2024-01-14 09:00",
    changes: ["库存扣减逻辑重构", "新增库存预占接口"],
    impact: { services: 2, apis: 5, instances: 3 },
    alerts: 0,
  },
  {
    id: 5, app: "search-service", version: "v1.5.0", prev: "v1.4.8",
    env: "staging", status: "online", operator: "陈静",
    time: "2024-01-13 11:30",
    changes: ["引入向量搜索能力", "ES版本升级至8.11"],
    impact: { services: 1, apis: 4, instances: 2 },
    alerts: 0,
  },
];

const envColors: Record<string, { bg: string; color: string }> = {
  production: { bg: "rgba(0,214,143,0.1)",  color: "#00D68F" },
  staging:    { bg: "rgba(255,170,0,0.1)",  color: "#FFAA00" },
};

export default function Releases() {
  const [expanded, setExpanded] = useState<number | null>(1);
  const [showModal, setShowModal] = useState(false);

  return (
    <MainLayout title="版本发布">
      <div data-cmp="Releases" className="space-y-4">
        <PageHeader
          title="版本发布与影响分析"
          subtitle={`本月 ${releases.length} 次发布 · ${releases.filter(r => r.alerts > 0).length} 次触发告警`}
          actions={
            <>
              <TechButton variant="secondary" icon={<GitBranch size={13} />}>发布对比</TechButton>
              <TechButton variant="primary" icon={<Plus size={13} />} onClick={() => setShowModal(true)}>新建发布</TechButton>
            </>
          }
        />

        {/* Summary cards */}
        <div className="flex gap-3">
          {[
            { label: "总发布次数", value: releases.length, sub: "本月", color: "#165DFF" },
            { label: "成功发布",   value: releases.filter(r => r.status === "online").length, sub: "无异常", color: "#00D68F" },
            { label: "发布告警",   value: releases.reduce((a, r) => a + r.alerts, 0), sub: "需关注", color: "#FF4D4F" },
            { label: "影响接口",   value: releases.reduce((a, r) => a + r.impact.apis, 0), sub: "条", color: "#FFAA00" },
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

        {/* Release list */}
        <div className="space-y-2">
          {releases.map((r) => {
            const ec = envColors[r.env] || envColors.staging;
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: `1px solid ${r.status === "error" ? "rgba(255,77,79,0.3)" : "var(--border)"}` }}>
                {/* Header */}
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
                        <span className="text-sm font-medium text-white">{r.app}</span>
                        <span className="text-xs px-2 py-0.5 rounded" style={{ background: "rgba(22,93,255,0.1)", color: "#165DFF" }}>{r.version}</span>
                        <ArrowRight size={10} style={{ color: "var(--muted-foreground)" }} />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{r.prev}</span>
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
                    <StatusBadge status={r.status as "online" | "error" | "warning"} />
                    <ChevronDown size={14} style={{ color: "var(--muted-foreground)", transform: isOpen ? "rotate(180deg)" : "", transition: "transform 0.2s" }} />
                  </div>
                </div>

                {/* Expanded content */}
                <div className={isOpen ? "" : "hidden"}>
                  <div className="flex gap-4 p-4">
                    {/* Changes */}
                    <div className="flex-1">
                      <div className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>变更内容</div>
                      <div className="space-y-2">
                        {r.changes.map((c, i) => (
                          <div key={i} className="flex items-start gap-2 text-xs">
                            <CheckCircle size={12} className="mt-0.5 flex-shrink-0" style={{ color: "#00D68F" }} />
                            <span className="text-white">{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Impact analysis */}
                    <div className="w-56 flex-shrink-0">
                      <div className="text-xs font-medium mb-3" style={{ color: "var(--muted-foreground)" }}>影响范围分析</div>
                      <div className="space-y-2">
                        {[
                          { label: "影响服务数", value: r.impact.services, unit: "个", color: "#165DFF" },
                          { label: "影响接口数", value: r.impact.apis, unit: "条", color: "#A855F7" },
                          { label: "实例数量",   value: r.impact.instances, unit: "台", color: "#00D68F" },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between p-2.5 rounded-md" style={{ background: "var(--muted)" }}>
                            <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.label}</span>
                            <span className="text-sm font-bold" style={{ color: item.color }}>{item.value} <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>{item.unit}</span></span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-36 flex-shrink-0 flex flex-col gap-2">
                      <div className="text-xs font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>操作</div>
                      <TechButton variant="ghost" size="xs">查看日志</TechButton>
                      <TechButton variant="ghost" size="xs">链路追踪</TechButton>
                      <TechButton variant={r.status === "error" ? "danger" : "secondary"} size="xs">
                        {r.status === "error" ? "一键回滚" : "回滚版本"}
                      </TechButton>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* New release modal */}
        <div className={`fixed inset-0 flex items-center justify-center ${showModal ? "" : "hidden"}`} style={{ background: "rgba(0,0,0,0.7)", zIndex: 200 }} onClick={() => setShowModal(false)}>
          <div className="w-[520px] rounded-xl p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-white mb-5 flex items-center gap-2">
              <Package size={16} style={{ color: "#165DFF" }} />新建发布计划
            </div>
            <div className="space-y-4">
              {[["应用名称", "选择应用"], ["发布版本", "如 v3.2.2"], ["目标环境", "选择环境"], ["发布说明", "本次变更内容说明"]].map(([label, ph]) => (
                <div key={label}>
                  <label className="block text-xs mb-1.5" style={{ color: "var(--muted-foreground)" }}>{label}</label>
                  <input className="w-full h-8 px-3 rounded-md text-xs text-white outline-none" style={{ background: "var(--input)", border: "1px solid var(--border)" }} placeholder={ph} />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <TechButton variant="secondary" onClick={() => setShowModal(false)}>取消</TechButton>
              <TechButton variant="primary" onClick={() => setShowModal(false)}>创建发布</TechButton>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
