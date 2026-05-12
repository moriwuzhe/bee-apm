import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Settings, Plus, Edit2, Trash2, ExternalLink, CheckCircle, AlertCircle, Copy, Check, ChevronRight, Save, RefreshCw } from "lucide-react";

interface Integration {
  id: string;
  name: string;
  type: "webhook" | "api" | "oauth" | "sso";
  status: "active" | "inactive" | "error";
  endpoint?: string;
  apiKey?: string;
  authType?: string;
  createdAt: string;
  lastUsed: string;
  usageCount: number;
}

interface WebhookPayload {
  id: string;
  integrationId: string;
  event: string;
  status: "success" | "failed";
  timestamp: string;
  responseCode?: number;
}

const mockIntegrations: Integration[] = [
  { id: "1", name: "Slack通知", type: "webhook", status: "active", endpoint: "https://hooks.slack.com/services/XXX", createdAt: "2024-01-15", lastUsed: "5分钟前", usageCount: 1234 },
  { id: "2", name: "钉钉机器人", type: "webhook", status: "active", endpoint: "https://oapi.dingtalk.com/robot/send", createdAt: "2024-01-20", lastUsed: "10分钟前", usageCount: 893 },
  { id: "3", name: "GitHub Actions", type: "oauth", status: "active", authType: "OAuth 2.0", createdAt: "2024-02-01", lastUsed: "1小时前", usageCount: 456 },
  { id: "4", name: "Jenkins CI", type: "api", status: "error", apiKey: "******", createdAt: "2024-02-10", lastUsed: "1天前", usageCount: 234 },
  { id: "5", name: "企业微信", type: "webhook", status: "inactive", endpoint: "https://qyapi.weixin.qq.com/cgi-bin/webhook/send", createdAt: "2024-02-15", lastUsed: "1周前", usageCount: 567 },
];

const mockWebhookPayloads: WebhookPayload[] = [
  { id: "1", integrationId: "1", event: "alert.triggered", status: "success", timestamp: "2分钟前", responseCode: 200 },
  { id: "2", integrationId: "1", event: "deployment.completed", status: "success", timestamp: "5分钟前", responseCode: 200 },
  { id: "3", integrationId: "4", event: "alert.triggered", status: "failed", timestamp: "10分钟前", responseCode: 500 },
];

export default function CustomIntegrations() {
  const [activeTab, setActiveTab] = useState<"integrations" | "webhooks" | "logs">("integrations");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "webhook": return <ExternalLink className="w-4 h-4" />;
      case "api": return <Settings className="w-4 h-4" />;
      case "oauth": return <ExternalLink className="w-4 h-4" />;
      case "sso": return <ExternalLink className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "webhook": return "Webhook";
      case "api": return "API密钥";
      case "oauth": return "OAuth";
      case "sso": return "SSO";
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "#00D68F";
      case "inactive": return "#94A3B8";
      case "error": return "#FF4D4F";
      default: return "#94A3B8";
    }
  };

  return (
    <MainLayout title="自定义集成">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("integrations")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "integrations" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "integrations" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "integrations" ? "white" : "var(--foreground)"
              }}
            >
              集成列表
            </button>
            <button
              onClick={() => setActiveTab("webhooks")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "webhooks" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "webhooks" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "webhooks" ? "white" : "var(--foreground)"
              }}
            >
              Webhook管理
            </button>
            <button
              onClick={() => setActiveTab("logs")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "logs" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "logs" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "logs" ? "white" : "var(--foreground)"
              }}
            >
              执行日志
            </button>
          </div>
          <div className="flex gap-2">
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--primary)",
                color: "white"
              }}
            >
              <Plus className="w-4 h-4" />
              添加集成
            </button>
          </div>
        </div>

        {activeTab === "integrations" && (
          <div className="grid grid-cols-2 gap-4">
            {mockIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="rounded-lg p-4"
                style={{ background: "var(--card)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="p-2 rounded-lg"
                      style={{
                        background: integration.status === "active" ? "rgba(0, 214, 143, 0.1)" :
                          integration.status === "error" ? "rgba(255, 77, 79, 0.1)" : "rgba(148, 163, 184, 0.1)"
                      }}
                    >
                      {getTypeIcon(integration.type)}
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                        {getTypeLabel(integration.type)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded hover:bg-muted transition-all">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 rounded hover:bg-red-50 transition-all">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>

                {integration.endpoint && (
                  <div className="text-sm font-mono truncate mb-2" style={{ color: "var(--muted-foreground)" }}>
                    {integration.endpoint}
                  </div>
                )}
                {integration.apiKey && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-mono" style={{ color: "var(--muted-foreground)" }}>{integration.apiKey}</span>
                    <button
                      onClick={() => handleCopy(integration.id)}
                      className="p-1 rounded hover:bg-muted transition-all"
                    >
                      {copiedId === integration.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                    <span>使用次数: {integration.usageCount}</span>
                    <span>最后使用: {integration.lastUsed}</span>
                  </div>
                  <span
                    className="flex items-center gap-1 text-xs font-medium"
                    style={{ color: getStatusColor(integration.status) }}
                  >
                    {integration.status === "active" ? <CheckCircle className="w-3 h-3" /> :
                     integration.status === "error" ? <AlertCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                    {integration.status === "active" ? "活跃" : integration.status === "error" ? "错误" : "停用"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "webhooks" && (
          <div className="rounded-lg p-6" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <h3 className="text-lg font-medium mb-4">添加Webhook</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Webhook名称</label>
                <input
                  type="text"
                  placeholder="例如: Slack通知"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--muted-foreground)" }}>Webhook URL</label>
                <input
                  type="text"
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{
                    background: "var(--background)",
                    border: "1px solid var(--border)",
                    color: "var(--foreground)"
                  }}
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-2" style={{ color: "var(--muted-foreground)" }}>触发事件</label>
                <div className="flex flex-wrap gap-2">
                  {["告警触发", "部署完成", "应用上线", "错误发生", "性能下降"].map((event) => (
                    <button
                      key={event}
                      className="px-3 py-1 rounded-lg text-sm"
                      style={{
                        background: "var(--muted)",
                        color: "var(--foreground)"
                      }}
                    >
                      {event}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 rounded-lg"
                style={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)"
                }}
              >
                取消
              </button>
              <button
                className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{
                  background: "var(--primary)",
                  color: "white"
                }}
              >
                <Save className="w-4 h-4" />
                保存
              </button>
            </div>
          </div>
        )}

        {activeTab === "logs" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>集成</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>事件类型</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>响应码</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>时间</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mockWebhookPayloads.map((payload) => {
                    const integration = mockIntegrations.find(i => i.id === payload.integrationId);
                    return (
                      <tr key={payload.id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-4 py-3 font-medium">{integration?.name}</td>
                        <td className="px-4 py-3">{payload.event}</td>
                        <td className="px-4 py-3">
                          <span
                            className="flex items-center gap-1 text-sm"
                            style={{ color: payload.status === "success" ? "#00D68F" : "#FF4D4F" }}
                          >
                            {payload.status === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                            {payload.status === "success" ? "成功" : "失败"}
                          </span>
                        </td>
                        <td className="px-4 py-3">{payload.responseCode}</td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--muted-foreground)" }}>{payload.timestamp}</td>
                        <td className="px-4 py-3">
                          <button className="text-sm flex items-center gap-1" style={{ color: "var(--primary)" }}>
                            查看详情 <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
