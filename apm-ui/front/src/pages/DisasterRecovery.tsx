import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Plus, Play, RefreshCw, Database, Server, Wifi, Globe, Shield, AlertTriangle, CheckCircle, Clock, TrendingUp, Activity, Download, Upload, Settings, Eye } from "lucide-react";

interface DisasterRecoverySite {
  id: string;
  name: string;
  type: "primary" | "backup" | "dr";
  region: string;
  status: "active" | "standby" | "maintenance";
  health: "healthy" | "warning" | "critical";
  lastSync?: string;
  syncDelay: number;
  capacity: {
    total: number;
    used: number;
  };
}

interface BackupJob {
  id: string;
  name: string;
  type: "full" | "incremental";
  target: string;
  schedule: string;
  lastRun?: string;
  nextRun: string;
  status: "active" | "paused" | "failed";
  retention: number;
  size: string;
}

interface FailoverTest {
  id: string;
  name: string;
  site: string;
  status: "passed" | "failed" | "running" | "pending";
  lastTest?: string;
  duration?: number;
  rto: number;
  rpo: number;
}

interface Replication {
  id: string;
  source: string;
  target: string;
  type: "sync" | "async";
  lag: number;
  status: "healthy" | "degraded" | "broken";
  throughput: string;
}

const mockSites: DisasterRecoverySite[] = [
  { id: "1", name: "主站点 - 北京", type: "primary", region: "华北", status: "active", health: "healthy", lastSync: new Date(Date.now() - 60000).toLocaleString(), syncDelay: 0, capacity: { total: 1000, used: 680 } },
  { id: "2", name: "备站点 - 上海", type: "backup", region: "华东", status: "standby", health: "healthy", lastSync: new Date(Date.now() - 60000).toLocaleString(), syncDelay: 12, capacity: { total: 1000, used: 650 } },
  { id: "3", name: "DR站点 - 广州", type: "dr", region: "华南", status: "standby", health: "warning", lastSync: new Date(Date.now() - 300000).toLocaleString(), syncDelay: 45, capacity: { total: 500, used: 320 } },
];

const mockBackupJobs: BackupJob[] = [
  { id: "1", name: "每日全量备份", type: "full", target: "全部数据", schedule: "0 2 * * *", lastRun: new Date(Date.now() - 3600000).toLocaleString(), nextRun: new Date(Date.now() + 82800000).toLocaleString(), status: "active", retention: 30, size: "256 GB" },
  { id: "2", name: "每6小时增量备份", type: "incremental", target: "交易数据", schedule: "0 */6 * * *", lastRun: new Date(Date.now() - 1800000).toLocaleString(), nextRun: new Date(Date.now() + 10800000).toLocaleString(), status: "active", retention: 7, size: "45 GB" },
  { id: "3", name: "实时数据同步", type: "incremental", target: "用户数据", schedule: "实时", lastRun: new Date(Date.now() - 60000).toLocaleString(), nextRun: "持续", status: "active", retention: 90, size: "128 GB" },
];

const mockFailoverTests: FailoverTest[] = [
  { id: "1", name: "主站点故障切换", site: "北京→上海", status: "passed", lastTest: "2024-01-15 02:00", duration: 180, rto: 15, rpo: 5 },
  { id: "2", name: "网络中断测试", site: "北京→广州", status: "passed", lastTest: "2024-01-08 03:00", duration: 240, rto: 20, rpo: 10 },
  { id: "3", name: "数据库故障切换", site: "北京→上海", status: "pending", rto: 15, rpo: 5 },
];

const mockReplications: Replication[] = [
  { id: "1", source: "北京", target: "上海", type: "sync", lag: 0, status: "healthy", throughput: "1.2 GB/s" },
  { id: "2", source: "北京", target: "广州", type: "async", lag: 12, status: "healthy", throughput: "856 MB/s" },
  { id: "3", source: "上海", target: "广州", type: "async", lag: 25, status: "degraded", throughput: "456 MB/s" },
];

export default function DisasterRecovery() {
  const [activeTab, setActiveTab] = useState<"overview" | "backups" | "sites" | "tests">("overview");
  const [sites, setSites] = useState<DisasterRecoverySite[]>(mockSites);
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>(mockBackupJobs);
  const [failoverTests, setFailoverTests] = useState<FailoverTest[]>(mockFailoverTests);
  const [replications, setReplications] = useState<Replication[]>(mockReplications);

  const handleTestFailover = (test: FailoverTest) => {
    setFailoverTests(failoverTests.map(t => {
      if (t.id === test.id) {
        return { ...t, status: "running" as const };
      }
      return t;
    }));
  };

  const handleToggleBackup = (jobId: string) => {
    setBackupJobs(backupJobs.map(j => {
      if (j.id === jobId) {
        return { ...j, status: j.status === "active" ? "paused" as const : "active" as const };
      }
      return j;
    }));
  };

  return (
    <MainLayout title="灾难恢复中心">
      <div className="space-y-4">
        {/* 统计概览 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>RTO (恢复时间目标)</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>15分钟</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Clock size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>RPO (恢复点目标)</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#165DFF" }}>5分钟</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <Activity size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>备份站点</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{sites.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Globe size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>容灾测试</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>
                  {failoverTests.filter(t => t.status === "passed").length}/{failoverTests.length}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <Shield size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center gap-4 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          {[
            { key: "overview", label: "总览", icon: Activity },
            { key: "backups", label: "备份管理", icon: Database },
            { key: "sites", label: "站点管理", icon: Globe },
            { key: "tests", label: "容灾测试", icon: Shield },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground hover:text-white"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 总览 */}
        {activeTab === "overview" && (
          <div className="space-y-4">
            {/* 数据复制状态 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Globe size={16} style={{ color: "#165DFF" }} />
                  <span className="text-sm font-medium text-white">数据复制状态</span>
                </div>
              </div>
              <div className="space-y-3">
                {replications.map((rep) => (
                  <div key={rep.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{rep.source}</span>
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>→</span>
                        <span className="text-sm font-medium text-white">{rep.target}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                        {rep.type === "sync" ? "同步" : "异步"}
                      </span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>延迟</div>
                        <div className="text-sm font-medium text-white">{rep.lag}s</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>吞吐量</div>
                        <div className="text-sm font-medium text-white">{rep.throughput}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ background: rep.status === "healthy" ? "#00D68F" : rep.status === "degraded" ? "#FFAA00" : "#FF4D4F" }}
                        />
                        <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                          {rep.status === "healthy" ? "健康" : rep.status === "degraded" ? "降级" : "故障"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 最近备份 */}
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Database size={16} style={{ color: "#165DFF" }} />
                  <span className="text-sm font-medium text-white">最近备份</span>
                </div>
                <button className="text-xs px-3 py-1.5 rounded" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                  查看全部
                </button>
              </div>
              <div className="space-y-2">
                {backupJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 rounded-lg" style={{ background: "var(--muted)" }}>
                    <div className="flex items-center gap-3">
                      <Database size={16} style={{ color: "#165DFF" }} />
                      <div>
                        <div className="text-sm font-medium text-white">{job.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{job.target}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>大小</div>
                        <div className="text-sm text-white">{job.size}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>上次运行</div>
                        <div className="text-xs text-white">{job.lastRun}</div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: job.status === "active" ? "rgba(0, 214, 143, 0.1)" : "rgba(255, 170, 0, 0.1)",
                          color: job.status === "active" ? "#00D68F" : "#FFAA00"
                        }}
                      >
                        {job.status === "active" ? "运行中" : "已暂停"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 备份管理 */}
        {activeTab === "backups" && (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="p-4 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">备份任务列表</span>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                    <Plus size={14} />
                    创建备份任务
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: "var(--input)" }}>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>任务名称</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>类型</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>目标</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>计划</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>上次运行</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>大小</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                      <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                    {backupJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-input">
                        <td className="px-4 py-3 text-sm text-white">{job.name}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                            {job.type === "full" ? "全量" : "增量"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{job.target}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{job.schedule}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{job.lastRun || "-"}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--muted-foreground)" }}>{job.size}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: job.status === "active" ? "rgba(0, 214, 143, 0.1)" : "rgba(255, 170, 0, 0.1)", color: job.status === "active" ? "#00D68F" : "#FFAA00" }}>
                            {job.status === "active" ? "运行中" : "已暂停"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleBackup(job.id)}
                              className="p-1 rounded hover:bg-input"
                              style={{ color: job.status === "active" ? "#FFAA00" : "#00D68F" }}
                            >
                              {job.status === "active" ? <Pause size={14} /> : <Play size={14} />}
                            </button>
                            <button className="p-1 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                              <RefreshCw size={14} />
                            </button>
                            <button className="p-1 rounded hover:bg-input" style={{ color: "var(--muted-foreground)" }}>
                              <Settings size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 站点管理 */}
        {activeTab === "sites" && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              {sites.map((site) => (
                <div key={site.id} className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Globe size={16} style={{ color: "#165DFF" }} />
                        <span className="text-sm font-medium text-white">{site.name}</span>
                      </div>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>{site.region}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs" style={{ background: site.type === "primary" ? "rgba(0, 214, 143, 0.1)" : "rgba(22, 93, 255, 0.1)", color: site.type === "primary" ? "#00D68F" : "#165DFF" }}>
                        {site.type === "primary" ? "主站点" : site.type === "backup" ? "备站点" : "DR站点"}
                      </span>
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: site.status === "active" ? "#00D68F" : site.status === "standby" ? "#FFAA00" : "#94A3B8" }}
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span style={{ color: "var(--muted-foreground)" }}>容量使用</span>
                        <span className="text-white">{site.capacity.used}/{site.capacity.total} TB</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(site.capacity.used / site.capacity.total) * 100}%`,
                            background: site.capacity.used / site.capacity.total > 0.8 ? "#FFAA00" : "#165DFF"
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>同步延迟</div>
                        <div className="text-sm font-medium" style={{ color: site.syncDelay > 30 ? "#FFAA00" : "#00D68F" }}>
                          {site.syncDelay}s
                        </div>
                      </div>
                      <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康状态</div>
                        <div className="text-sm font-medium" style={{ color: site.health === "healthy" ? "#00D68F" : site.health === "warning" ? "#FFAA00" : "#FF4D4F" }}>
                          {site.health === "healthy" ? "健康" : site.health === "warning" ? "警告" : "严重"}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                      详情
                    </button>
                    <button className="flex-1 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                      同步
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 容灾测试 */}
        {activeTab === "tests" && (
          <div className="space-y-4">
            <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield size={16} style={{ color: "#165DFF" }} />
                  <span className="text-sm font-medium text-white">容灾测试记录</span>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                  <Plus size={14} />
                  创建测试
                </button>
              </div>
              <div className="space-y-3">
                {failoverTests.map((test) => (
                  <div key={test.id} className="p-4 rounded-lg border" style={{ background: "var(--muted)", borderColor: "var(--border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-sm font-medium text-white mb-1">{test.name}</div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>站点: {test.site}</div>
                      </div>
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{
                          background: test.status === "passed" ? "rgba(0, 214, 143, 0.1)" : test.status === "failed" ? "rgba(255, 77, 79, 0.1)" : test.status === "running" ? "rgba(255, 170, 0, 0.1)" : "rgba(22, 93, 255, 0.1)",
                          color: test.status === "passed" ? "#00D68F" : test.status === "failed" ? "#FF4D4F" : test.status === "running" ? "#FFAA00" : "#165DFF"
                        }}
                      >
                        {test.status === "passed" ? "已通过" : test.status === "failed" ? "已失败" : test.status === "running" ? "测试中" : "待测试"}
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-3 mb-3">
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>RTO</div>
                        <div className="text-sm font-medium text-white">{test.rto}分钟</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>RPO</div>
                        <div className="text-sm font-medium text-white">{test.rpo}分钟</div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>实际耗时</div>
                        <div className="text-sm font-medium" style={{ color: test.duration && test.duration / 60 > test.rto ? "#FFAA00" : "#00D68F" }}>
                          {test.duration ? `${Math.floor(test.duration / 60)}分${test.duration % 60}秒` : "-"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>上次测试</div>
                        <div className="text-sm text-white">{test.lastTest || "从未测试"}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="flex-1 px-3 py-1.5 rounded text-xs font-medium" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                        查看详情
                      </button>
                      <button
                        onClick={() => handleTestFailover(test)}
                        disabled={test.status === "running"}
                        className="flex-1 px-3 py-1.5 rounded text-xs font-medium"
                        style={{ background: "#165DFF", color: "#fff" }}
                      >
                        {test.status === "running" ? "测试中..." : "立即测试"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
