import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { Bell, Mail, MessageSquare, Phone, Settings, Check, CheckCheck, Trash2, Search, Filter, Clock, AlertCircle, Info, CheckCircle, AlertTriangle, Volume2, VolumeX } from "lucide-react";

interface Notification {
  id: string;
  type: "alert" | "info" | "warning" | "success" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  priority: "low" | "medium" | "high" | "critical";
  source: string;
  actions?: Array<{ label: string; action: string }>;
}

interface Channel {
  id: string;
  name: string;
  type: "email" | "slack" | "webhook" | "sms" | "dingtalk";
  enabled: boolean;
  config: Record<string, any>;
  lastNotification?: string;
}

const mockNotifications: Notification[] = [
  { id: "1", type: "alert", title: "CPU使用率告警", message: "order-service CPU使用率超过85%，当前值89%", timestamp: new Date(Date.now() - 300000).toLocaleString(), read: false, priority: "high", source: "JVMMonitor", actions: [{ label: "查看详情", action: "view" }, { label: "处理", action: "handle" }] },
  { id: "2", type: "warning", title: "内存使用率警告", message: "payment-gateway 内存使用率达到82%", timestamp: new Date(Date.now() - 1800000).toLocaleString(), read: false, priority: "medium", source: "JVMMonitor" },
  { id: "3", type: "success", title: "部署完成", message: "order-service v2.3.1 部署成功", timestamp: new Date(Date.now() - 3600000).toLocaleString(), read: true, priority: "low", source: "Releases" },
  { id: "4", type: "info", title: "系统维护通知", message: "系统将于今晚23:00进行例行维护", timestamp: new Date(Date.now() - 7200000).toLocaleString(), read: true, priority: "medium", source: "System" },
  { id: "5", type: "alert", title: "服务不可用", message: "user-service 响应超时，当前失败率5.2%", timestamp: new Date(Date.now() - 10800000).toLocaleString(), read: true, priority: "critical", source: "AlertRules" },
  { id: "6", type: "warning", title: "磁盘空间不足", message: "日志服务器磁盘使用率达到78%", timestamp: new Date(Date.now() - 14400000).toLocaleString(), read: true, priority: "medium", source: "JVMMonitor" },
];

const mockChannels: Channel[] = [
  { id: "1", name: "邮件通知", type: "email", enabled: true, config: { recipients: ["admin@example.com", "ops@example.com"], frequency: "immediate" }, lastNotification: new Date(Date.now() - 600000).toLocaleString() },
  { id: "2", name: "Slack Webhook", type: "slack", enabled: true, config: { webhookUrl: "https://hooks.slack.com/...", channel: "#alerts" }, lastNotification: new Date(Date.now() - 300000).toLocaleString() },
  { id: "3", name: "钉钉群通知", type: "dingtalk", enabled: true, config: { webhookUrl: "https://oapi.dingtalk.com/...", secret: "******" }, lastNotification: new Date(Date.now() - 1800000).toLocaleString() },
  { id: "4", name: "SMS告警", type: "sms", enabled: false, config: { phoneNumbers: ["138****8888"] }, lastNotification: new Date(Date.now() - 86400000).toLocaleString() },
  { id: "5", name: "自定义Webhook", type: "webhook", enabled: false, config: { url: "https://custom.example.com/webhook" } },
];

export default function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<"notifications" | "channels">("notifications");
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [channels, setChannels] = useState<Channel[]>(mockChannels);
  const [filterType, setFilterType] = useState("all");
  const [filterPriority, setFilterPriority] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [muteAll, setMuteAll] = useState(false);
  const [selectedNotifications, setSelectedNotifications] = useState<Set<string>>(new Set());

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === "critical" && !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    const matchesType = filterType === "all" || n.type === filterType;
    const matchesPriority = filterPriority === "all" || n.priority === filterPriority;
    const matchesSearch = searchQuery === "" || n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.message.toLowerCase().includes(searchQuery.toLowerString());
    return matchesType && matchesPriority && matchesSearch;
  });

  const handleMarkAsRead = (id: string) => {
    setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(notifications.map(n => ({ ...n, read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleToggleChannel = (id: string) => {
    setChannels(channels.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "alert": return <AlertCircle size={16} style={{ color: "#FF4D4F" }} />;
      case "warning": return <AlertTriangle size={16} style={{ color: "#FFAA00" }} />;
      case "success": return <CheckCircle size={16} style={{ color: "#00D68F" }} />;
      case "info": return <Info size={16} style={{ color: "#165DFF" }} />;
      default: return <Bell size={16} style={{ color: "#94A3B8" }} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "critical": return "#FF4D4F";
      case "high": return "#FFAA00";
      case "medium": return "#165DFF";
      default: return "#94A3B8";
    }
  };

  return (
    <MainLayout title="通知中心">
      <div className="space-y-4">
        {/* 统计卡片 */}
        <div className="grid grid-cols-4 gap-4">
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>未读通知</div>
                <div className="text-xl font-bold mt-1" style={{ color: unreadCount > 0 ? "#FFAA00" : "#00D68F" }}>{unreadCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 170, 0, 0.1)" }}>
                <Bell size={20} style={{ color: "#FFAA00" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>严重告警</div>
                <div className="text-xl font-bold mt-1" style={{ color: criticalCount > 0 ? "#FF4D4F" : "#00D68F" }}>{criticalCount}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                <AlertCircle size={20} style={{ color: "#FF4D4F" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>通知渠道</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#165DFF" }}>{channels.filter(c => c.enabled).length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(22, 93, 255, 0.1)" }}>
                <MessageSquare size={20} style={{ color: "#165DFF" }} />
              </div>
            </div>
          </div>
          <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>已启用</div>
                <div className="text-xl font-bold mt-1" style={{ color: "#00D68F" }}>{channels.filter(c => c.enabled).length}/{channels.length}</div>
              </div>
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                <CheckCircle size={20} style={{ color: "#00D68F" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab切换 */}
        <div className="flex items-center justify-between p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("notifications")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "notifications" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
              }`}
            >
              <Bell size={16} />
              通知列表
            </button>
            <button
              onClick={() => setActiveTab("channels")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                activeTab === "channels" ? "bg-blue-500/20 text-blue-400" : "text-muted-foreground"
              }`}
            >
              <MessageSquare size={16} />
              通知渠道
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMuteAll(!muteAll)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                muteAll ? "bg-red-500/20 text-red-400" : "bg-muted text-muted-foreground"
              }`}
            >
              {muteAll ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {muteAll ? "取消静音" : "全部静音"}
            </button>
          </div>
        </div>

        {/* 通知列表 */}
        {activeTab === "notifications" && (
          <div className="space-y-4">
            {/* 筛选栏 */}
            <div className="flex items-center gap-3 p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--muted-foreground)" }} />
                <input
                  type="text"
                  placeholder="搜索通知..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="all">全部类型</option>
                <option value="alert">告警</option>
                <option value="warning">警告</option>
                <option value="success">成功</option>
                <option value="info">信息</option>
              </select>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--background)", borderColor: "var(--border)", color: "var(--foreground)" }}
              >
                <option value="all">全部优先级</option>
                <option value="critical">严重</option>
                <option value="high">高</option>
                <option value="medium">中</option>
                <option value="low">低</option>
              </select>
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
              >
                全部已读
              </button>
            </div>

            {/* 通知列表 */}
            <div className="space-y-2">
              {filteredNotifications.map(notification => (
                <div
                  key={notification.id}
                  className="p-4 rounded-lg transition-all"
                  style={{
                    background: notification.read ? "var(--card)" : "var(--card)",
                    border: `1px solid ${notification.read ? "var(--border)" : getPriorityColor(notification.priority)}30`
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getTypeIcon(notification.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white" style={{ color: notification.read ? "var(--foreground)" : "var(--foreground)" }}>
                            {notification.title}
                          </span>
                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full" style={{ background: getPriorityColor(notification.priority) }} />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-xs" style={{ background: `${getPriorityColor(notification.priority)}15`, color: getPriorityColor(notification.priority) }}>
                            {notification.priority === "critical" ? "严重" : notification.priority === "high" ? "高" : notification.priority === "medium" ? "中" : "低"}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted-foreground)" }}>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {notification.timestamp}
                          </span>
                          <span>来源: {notification.source}</span>
                        </div>
                        <div className="flex gap-2">
                          {notification.actions?.map((action, idx) => (
                            <button
                              key={idx}
                              className="px-3 py-1 rounded text-xs font-medium"
                              style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}
                            >
                              {action.label}
                            </button>
                          ))}
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="px-3 py-1 rounded text-xs"
                              style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}
                            >
                              标记已读
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(notification.id)}
                            className="p-1 rounded hover:bg-input"
                            style={{ color: "#FF4D4F" }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 通知渠道 */}
        {activeTab === "channels" && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#165DFF", color: "#fff" }}>
                <MessageSquare size={14} />
                添加渠道
              </button>
            </div>

            <div className="space-y-3">
              {channels.map(channel => {
                const ChannelIcon = channel.type === "email" ? Mail : channel.type === "slack" ? MessageSquare : channel.type === "sms" ? Phone : MessageSquare;
                return (
                  <div key={channel.id} className="p-4 rounded-lg" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: channel.enabled ? "rgba(0, 214, 143, 0.1)" : "var(--muted)" }}>
                          <ChannelIcon size={20} style={{ color: channel.enabled ? "#00D68F" : "#94A3B8" }} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white">{channel.name}</span>
                            {channel.enabled && (
                              <span className="px-2 py-0.5 rounded text-xs" style={{ background: "rgba(0, 214, 143, 0.1)", color: "#00D68F" }}>
                                已启用
                              </span>
                            )}
                          </div>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                            类型: {channel.type === "email" ? "邮件" : channel.type === "slack" ? "Slack" : channel.type === "sms" ? "短信" : channel.type === "dingtalk" ? "钉钉" : "Webhook"}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleToggleChannel(channel.id)}
                        className={`px-4 py-1.5 rounded text-xs font-medium ${
                          channel.enabled ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {channel.enabled ? "禁用" : "启用"}
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                        <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>配置</div>
                        <div className="text-xs text-white mt-1">
                          {channel.type === "email" && `收件人: ${(channel.config.recipients as string[]).join(", ")}`}
                          {channel.type === "slack" && `频道: ${channel.config.channel}`}
                          {channel.type === "sms" && `号码: ${(channel.config.phoneNumbers as string[]).join(", ")}`}
                          {channel.type === "webhook" && `URL: ${channel.config.url}`}
                        </div>
                      </div>
                      {channel.lastNotification && (
                        <div className="p-2 rounded" style={{ background: "var(--muted)" }}>
                          <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>上次通知</div>
                          <div className="text-xs text-white mt-1">{channel.lastNotification}</div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex-1 px-3 py-1.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                        测试
                      </button>
                      <button className="flex-1 px-3 py-1.5 rounded text-xs" style={{ background: "rgba(22, 93, 255, 0.1)", color: "#165DFF" }}>
                        配置
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
