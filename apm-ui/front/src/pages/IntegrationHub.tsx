import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { 
  Link2, Plus, Settings, Trash2, RefreshCw, CheckCircle, XCircle, 
  AlertCircle, Database, Cloud, Code, Lock, Mail, MessageSquare, 
  Webhook, Bell, GitBranch, Server, Globe, Shield, Zap, Activity
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  category: "database" | "cloud" | "messaging" | "ci_cd" | "security" | "logging" | "monitoring" | "alerting";
  icon: string;
  status: "connected" | "disconnected" | "error" | "syncing";
  lastSync?: string;
  config: Record<string, any>;
  metrics: {
    requests: number;
    errors: number;
    latency: number;
  };
  enabled: boolean;
}

const mockIntegrations: Integration[] = [
  {
    id: "1",
    name: "MySQL",
    category: "database",
    icon: "database",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { host: "mysql.prod.internal", port: 3306, database: "apm_db" },
    metrics: { requests: 15420, errors: 2, latency: 12 },
    enabled: true
  },
  {
    id: "2",
    name: "PostgreSQL",
    category: "database",
    icon: "database",
    status: "connected",
    lastSync: "2024-01-15 14:29:00",
    config: { host: "pg.prod.internal", port: 5432, database: "metrics_db" },
    metrics: { requests: 8934, errors: 1, latency: 8 },
    enabled: true
  },
  {
    id: "3",
    name: "Redis",
    category: "database",
    icon: "database",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { host: "redis.prod.internal", port: 6379, db: 0 },
    metrics: { requests: 23456, errors: 0, latency: 3 },
    enabled: true
  },
  {
    id: "4",
    name: "Kafka",
    category: "messaging",
    icon: "message-square",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { brokers: ["kafka-1:9092", "kafka-2:9092"], topic: "apm-events" },
    metrics: { requests: 45678, errors: 5, latency: 15 },
    enabled: true
  },
  {
    id: "5",
    name: "RabbitMQ",
    category: "messaging",
    icon: "message-square",
    status: "disconnected",
    config: { host: "rabbitmq.prod.internal", port: 5672 },
    metrics: { requests: 0, errors: 0, latency: 0 },
    enabled: false
  },
  {
    id: "6",
    name: "GitHub",
    category: "ci_cd",
    icon: "code",
    status: "connected",
    lastSync: "2024-01-15 14:25:00",
    config: { owner: "company", repo: "apm-server", branch: "main" },
    metrics: { requests: 1234, errors: 0, latency: 45 },
    enabled: true
  },
  {
    id: "7",
    name: "GitLab",
    category: "ci_cd",
    icon: "code",
    status: "connected",
    lastSync: "2024-01-15 14:28:00",
    config: { url: "https://gitlab.internal", project: "apm/backend" },
    metrics: { requests: 890, errors: 1, latency: 52 },
    enabled: true
  },
  {
    id: "8",
    name: "Jenkins",
    category: "ci_cd",
    icon: "server",
    status: "error",
    lastSync: "2024-01-15 14:20:00",
    config: { url: "https://jenkins.internal", job: "apm-deploy" },
    metrics: { requests: 456, errors: 12, latency: 0 },
    enabled: true
  },
  {
    id: "9",
    name: "AWS CloudWatch",
    category: "cloud",
    icon: "cloud",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { region: "us-east-1", namespace: "AWS/EC2" },
    metrics: { requests: 7890, errors: 0, latency: 28 },
    enabled: true
  },
  {
    id: "10",
    name: "Kubernetes",
    category: "cloud",
    icon: "server",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { cluster: "prod-cluster", namespace: "apm-system" },
    metrics: { requests: 34567, errors: 3, latency: 18 },
    enabled: true
  },
  {
    id: "11",
    name: "Slack",
    category: "alerting",
    icon: "bell",
    status: "connected",
    lastSync: "2024-01-15 14:29:00",
    config: { webhook: "https://hooks.slack.com/xxx", channel: "#alerts" },
    metrics: { requests: 234, errors: 2, latency: 120 },
    enabled: true
  },
  {
    id: "12",
    name: "PagerDuty",
    category: "alerting",
    icon: "bell",
    status: "connected",
    lastSync: "2024-01-15 14:29:00",
    config: { integrationKey: "xxx", service: "APM" },
    metrics: { requests: 56, errors: 0, latency: 85 },
    enabled: true
  },
  {
    id: "13",
    name: "Elasticsearch",
    category: "logging",
    icon: "activity",
    status: "syncing",
    lastSync: "2024-01-15 14:30:00",
    config: { hosts: ["es-1:9200", "es-2:9200"], index: "apm-logs" },
    metrics: { requests: 56789, errors: 8, latency: 22 },
    enabled: true
  },
  {
    id: "14",
    name: "Prometheus",
    category: "monitoring",
    icon: "activity",
    status: "connected",
    lastSync: "2024-01-15 14:30:00",
    config: { url: "http://prometheus:9090", job: "apm" },
    metrics: { requests: 12345, errors: 1, latency: 10 },
    enabled: true
  },
  {
    id: "15",
    name: "Grafana",
    category: "monitoring",
    icon: "activity",
    status: "connected",
    lastSync: "2024-01-15 14:29:00",
    config: { url: "https://grafana.internal", dashboard: "APM Overview" },
    metrics: { requests: 4567, errors: 0, latency: 35 },
    enabled: true
  }
];

const categories = [
  { id: "all", label: "全部", icon: Globe },
  { id: "database", label: "数据库", icon: Database },
  { id: "cloud", label: "云平台", icon: Cloud },
  { id: "messaging", label: "消息队列", icon: MessageSquare },
  { id: "ci_cd", label: "CI/CD", icon: GitBranch },
  { id: "security", label: "安全", icon: Shield },
  { id: "logging", label: "日志", icon: Activity },
  { id: "monitoring", label: "监控", icon: Activity },
  { id: "alerting", label: "告警", icon: Bell }
];

export default function IntegrationHub() {
  const [activeTab, setActiveTab] = useState<"integrations" | "webhooks" | "api-keys" | "oauth">("integrations");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [showAddModal, setShowAddModal] = useState(false);
  const [syncingIds, setSyncingIds] = useState<string[]>([]);

  const filteredIntegrations = integrations.filter(integration => {
    return selectedCategory === "all" || integration.category === selectedCategory;
  });

  const connectedCount = integrations.filter(i => i.status === "connected" && i.enabled).length;
  const totalRequests = integrations.reduce((sum, i) => sum + i.metrics.requests, 0);
  const totalErrors = integrations.reduce((sum, i) => sum + i.metrics.errors, 0);
  const avgLatency = Math.round(
    integrations.filter(i => i.enabled && i.metrics.latency > 0)
      .reduce((sum, i) => sum + i.metrics.latency, 0) / 
    integrations.filter(i => i.enabled && i.metrics.latency > 0).length
  );

  const handleSync = (id: string) => {
    setSyncingIds([...syncingIds, id]);
    setTimeout(() => {
      setSyncingIds(syncingIds.filter(sid => sid !== id));
    }, 2000);
  };

  const handleToggle = (id: string) => {
    setIntegrations(integrations.map(i => 
      i.id === id ? { ...i, enabled: !i.enabled } : i
    ));
  };

  const handleDelete = (id: string) => {
    setIntegrations(integrations.filter(i => i.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected": return <CheckCircle className="w-4 h-4" style={{ color: "#00D68F" }} />;
      case "disconnected": return <XCircle className="w-4 h-4" style={{ color: "#94A3B8" }} />;
      case "error": return <AlertCircle className="w-4 h-4" style={{ color: "#FF4D4F" }} />;
      case "syncing": return <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#1890FF" }} />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "connected": return "已连接";
      case "disconnected": return "未连接";
      case "error": return "错误";
      case "syncing": return "同步中";
      default: return status;
    }
  };

  return (
    <MainLayout title="集成中心">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "integrations" ? "text-white shadow-lg" : ""
              }`}
              style={{
                background: activeTab === "integrations" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "integrations" ? "white" : "var(--foreground)"
              }}
            >
              集成管理
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "webhooks" ? "text-white shadow-lg" : ""
              }`}
              style={{
                background: activeTab === "webhooks" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "webhooks" ? "white" : "var(--foreground)"
              }}
            >
              Webhook
            </button>
            <button
              onClick={() => setActiveTab("api-keys")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "api-keys" ? "text-white shadow-lg" : ""
              }`}
              style={{
                background: activeTab === "api-keys" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "api-keys" ? "white" : "var(--foreground)"
              }}
            >
              API密钥
            </button>
            <button
              onClick={() => setActiveTab("oauth")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                activeTab === "oauth" ? "text-white shadow-lg" : ""
              }`}
              style={{
                background: activeTab === "oauth" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "oauth" ? "white" : "var(--foreground)"
              }}
            >
              OAuth
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-white"
            style={{ background: "var(--primary)" }}
          >
            <Plus className="w-4 h-4" />
            添加集成
          </button>
        </div>

        {activeTab === "integrations" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <Link2 className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已连接</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{connectedCount}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <Activity className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总请求数</div>
                    <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <XCircle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误数</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{totalErrors}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Zap className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</div>
                    <div className="text-2xl font-bold">{avgLatency}ms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 分类筛选 */}
            <div className="flex items-center gap-2 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
                      selectedCategory === cat.id ? "text-white" : ""
                    }`}
                    style={{
                      background: selectedCategory === cat.id ? "var(--primary)" : "transparent",
                      color: selectedCategory === cat.id ? "white" : "var(--foreground)"
                    }}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* 集成列表 */}
            <div className="grid grid-cols-3 gap-4">
              {filteredIntegrations.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-lg p-4 transition-all"
                  style={{ 
                    background: "var(--card)", 
                    border: "1px solid var(--border)",
                    opacity: integration.enabled ? 1 : 0.6
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg" style={{ background: "var(--muted)" }}>
                        <Link2 className="w-5 h-5" style={{ color: "var(--primary)" }} />
                      </div>
                      <div>
                        <div className="font-medium">{integration.name}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {getStatusIcon(integration.status)}
                          <span className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            {getStatusLabel(integration.status)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={integration.enabled}
                        onChange={() => handleToggle(integration.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all"
                        style={{
                          background: integration.enabled ? "var(--primary)" : "var(--muted)"
                        }}
                      />
                    </label>
                  </div>

                  {integration.enabled && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>请求</div>
                          <div className="text-sm font-medium">{integration.metrics.requests.toLocaleString()}</div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>错误</div>
                          <div className="text-sm font-medium" style={{ color: integration.metrics.errors > 0 ? "#FF4D4F" : "inherit" }}>
                            {integration.metrics.errors}
                          </div>
                        </div>
                        <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>延迟</div>
                          <div className="text-sm font-medium">{integration.metrics.latency}ms</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSync(integration.id)}
                          disabled={syncingIds.includes(integration.id)}
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs transition-all"
                          style={{
                            background: "var(--muted)",
                            color: "var(--foreground)"
                          }}
                        >
                          <RefreshCw className={`w-3 h-3 ${syncingIds.includes(integration.id) ? "animate-spin" : ""}`} />
                          同步
                        </button>
                        <button
                          className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded text-xs transition-all"
                          style={{
                            background: "var(--muted)",
                            color: "var(--foreground)"
                          }}
                        >
                          <Settings className="w-3 h-3" />
                          配置
                        </button>
                        <button
                          onClick={() => handleDelete(integration.id)}
                          className="flex items-center justify-center px-3 py-1.5 rounded text-xs transition-all"
                          style={{
                            background: "rgba(255, 77, 79, 0.1)",
                            color: "#FF4D4F"
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </>
                  )}

                  {!integration.enabled && (
                    <div className="text-xs text-center py-2" style={{ color: "var(--muted-foreground)" }}>
                      已禁用 - 启用以查看详情
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "webhooks" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Webhook className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">Webhook 管理</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                在此处配置和管理 Webhook 端点
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: "var(--primary)" }}
              >
                创建 Webhook
              </button>
            </div>
          </div>
        )}

        {activeTab === "api-keys" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">API 密钥管理</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                管理应用程序的 API 密钥和访问凭证
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: "var(--primary)" }}
              >
                生成密钥
              </button>
            </div>
          </div>
        )}

        {activeTab === "oauth" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Code className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">OAuth 应用</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                配置 OAuth 2.0 应用程序以进行第三方集成
              </p>
              <button
                className="mt-4 px-4 py-2 rounded-lg text-white transition-all"
                style={{ background: "var(--primary)" }}
              >
                创建应用
              </button>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
