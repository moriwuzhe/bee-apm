import { useState } from "react";
import MainLayout from "../components/Layout/MainLayout";
import { MessageSquare, ListOrdered, ArrowRight, AlertTriangle, CheckCircle, Clock, Download, RefreshCw, Activity, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface MessageQueue {
  id: string;
  name: string;
  type: "Kafka" | "RabbitMQ" | "Redis" | "ActiveMQ";
  broker: string;
  status: "healthy" | "warning" | "critical";
  partitions: number;
  replication: number;
  messages: {
    total: number;
    pending: number;
    processed: number;
  };
  throughput: number;
  latency: number;
  consumers: number;
  producers: number;
}

interface Topic {
  id: string;
  name: string;
  queueId: string;
  partitions: number;
  messages: number;
  lag: number;
  status: "active" | "warning" | "error";
}

const mockQueues: MessageQueue[] = [
  { id: "1", name: "订单事件队列", type: "Kafka", broker: "kafka-1.prod:9092", status: "healthy", partitions: 8, replication: 3, messages: { total: 125432, pending: 123, processed: 125309 }, throughput: 2567, latency: 12.3, consumers: 12, producers: 8 },
  { id: "2", name: "支付通知队列", type: "Kafka", broker: "kafka-2.prod:9092", status: "warning", partitions: 4, replication: 3, messages: { total: 89345, pending: 2345, processed: 86900 }, throughput: 1234, latency: 45.6, consumers: 6, producers: 4 },
  { id: "3", name: "用户事件队列", type: "RabbitMQ", broker: "rabbit.prod:5672", status: "healthy", partitions: 1, replication: 2, messages: { total: 234567, pending: 45, processed: 234522 }, throughput: 3456, latency: 8.2, consumers: 15, producers: 12 },
  { id: "4", name: "日志收集队列", type: "Kafka", broker: "kafka-3.prod:9092", status: "critical", partitions: 16, replication: 3, messages: { total: 567890, pending: 15678, processed: 552212 }, throughput: 8934, latency: 125.4, consumers: 8, producers: 20 },
];

const mockTopics: Topic[] = [
  { id: "1", name: "order.created", queueId: "1", partitions: 8, messages: 15678, lag: 23, status: "active" },
  { id: "2", name: "order.updated", queueId: "1", partitions: 8, messages: 12345, lag: 45, status: "active" },
  { id: "3", name: "payment.completed", queueId: "2", partitions: 4, messages: 8934, lag: 1234, status: "warning" },
  { id: "4", name: "user.registered", queueId: "3", partitions: 1, messages: 45678, lag: 12, status: "active" },
  { id: "5", name: "logs.app", queueId: "4", partitions: 16, messages: 234567, lag: 8934, status: "error" },
];

export default function MessageQueueMonitor() {
  const [activeTab, setActiveTab] = useState<"queues" | "topics" | "consumers">("queues");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const totalMessages = mockQueues.reduce((sum, q) => sum + q.messages.total, 0);
  const pendingMessages = mockQueues.reduce((sum, q) => sum + q.messages.pending, 0);
  const avgLatency = (mockQueues.reduce((sum, q) => sum + q.latency, 0) / mockQueues.length).toFixed(1);
  const healthyCount = mockQueues.filter(q => q.status === "healthy").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle className="w-5 h-5" style={{ color: "#00D68F" }} />;
      case "warning": return <AlertTriangle className="w-5 h-5" style={{ color: "#FAAD14" }} />;
      case "critical": return <AlertTriangle className="w-5 h-5" style={{ color: "#FF4D4F" }} />;
      default: return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case "healthy": return "rgba(0, 214, 143, 0.1)";
      case "warning": return "rgba(250, 173, 20, 0.1)";
      case "critical": return "rgba(255, 77, 79, 0.1)";
      default: return "rgba(148, 163, 184, 0.1)";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy": return "#00D68F";
      case "warning": return "#FAAD14";
      case "critical": return "#FF4D4F";
      default: return "#94A3B8";
    }
  };

  return (
    <MainLayout title="消息队列监控">
      <div className="space-y-4">
        {/* 控制栏 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("queues")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "queues" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "queues" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "queues" ? "white" : "var(--foreground)"
              }}
            >
              队列列表
            </button>
            <button
              onClick={() => setActiveTab("topics")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "topics" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "topics" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "topics" ? "white" : "var(--foreground)"
              }}
            >
              Topic管理
            </button>
            <button
              onClick={() => setActiveTab("consumers")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${activeTab === "consumers" ? "text-white shadow-lg" : ""}`}
              style={{
                background: activeTab === "consumers" ? "var(--primary)" : "var(--card)",
                border: "1px solid var(--border)",
                color: activeTab === "consumers" ? "white" : "var(--foreground)"
              }}
            >
              消费者监控
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: autoRefresh ? "rgba(0, 214, 143, 0.1)" : "var(--card)",
                border: `1px solid ${autoRefresh ? "#00D68F" : "var(--border)"}`,
                color: autoRefresh ? "#00D68F" : "var(--foreground)"
              }}
            >
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? "animate-spin" : ""}`} />
              {autoRefresh ? "自动刷新" : "已暂停"}
            </button>
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all"
              style={{
                background: "var(--card)",
                border: "1px solid var(--border)",
                color: "var(--foreground)"
              }}
            >
              <Download className="w-4 h-4" />
              导出报告
            </button>
          </div>
        </div>

        {activeTab === "queues" && (
          <>
            {/* 统计卡片 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(0, 214, 143, 0.1)" }}>
                    <CheckCircle className="w-6 h-6" style={{ color: "#00D68F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>健康队列</div>
                    <div className="text-2xl font-bold" style={{ color: "#00D68F" }}>{healthyCount}/{mockQueues.length}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(24, 144, 255, 0.1)" }}>
                    <ListOrdered className="w-6 h-6" style={{ color: "#1890FF" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>总消息数</div>
                    <div className="text-2xl font-bold">{totalMessages.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(255, 77, 79, 0.1)" }}>
                    <AlertTriangle className="w-6 h-6" style={{ color: "#FF4D4F" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>待处理消息</div>
                    <div className="text-2xl font-bold" style={{ color: "#FF4D4F" }}>{pendingMessages.toLocaleString()}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg" style={{ background: "rgba(250, 173, 20, 0.1)" }}>
                    <Clock className="w-6 h-6" style={{ color: "#FAAD14" }} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>平均延迟</div>
                    <div className="text-2xl font-bold">{avgLatency}ms</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 队列列表 */}
            <div className="grid grid-cols-2 gap-4">
              {mockQueues.map((queue) => (
                <div
                  key={queue.id}
                  className="rounded-lg p-4"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg" style={{ background: getStatusBg(queue.status) }}>
                        <MessageSquare className="w-6 h-6" style={{ color: getStatusColor(queue.status) }} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{queue.name}</h3>
                          {getStatusIcon(queue.status)}
                        </div>
                        <div className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                          {queue.type} • {queue.broker}
                        </div>
                      </div>
                    </div>
                    <span
                      className="px-3 py-1 rounded text-xs font-medium"
                      style={{ background: getStatusBg(queue.status), color: getStatusColor(queue.status) }}
                    >
                      {queue.status === "healthy" ? "健康" : queue.status === "warning" ? "警告" : "严重"}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 mb-4">
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>分区</div>
                      <div className="font-bold">{queue.partitions}</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>副本</div>
                      <div className="font-bold">{queue.replication}</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>消费者</div>
                      <div className="font-bold">{queue.consumers}</div>
                    </div>
                    <div className="text-center p-2 rounded" style={{ background: "var(--muted)" }}>
                      <div className="text-xs" style={{ color: "var(--muted-foreground)" }}>生产者</div>
                      <div className="font-bold">{queue.producers}</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span style={{ color: "var(--muted-foreground)" }}>待处理消息</span>
                        <span>{queue.messages.pending.toLocaleString()}</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--muted)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min((queue.messages.pending / queue.messages.total) * 100, 100)}%`,
                            background: queue.messages.pending > 1000 ? "#FF4D4F" : "#00D68F"
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span style={{ color: "var(--muted-foreground)" }}>吞吐量</span>
                      <span className="font-medium">{queue.throughput.toLocaleString()} msg/s</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === "topics" && (
          <div className="rounded-lg overflow-hidden" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ background: "var(--muted)", borderBottom: "1px solid var(--border)" }}>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>Topic名称</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>队列</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>分区数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>消息数</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>延迟</th>
                    <th className="px-4 py-3 text-left text-xs font-medium" style={{ color: "var(--muted-foreground)" }}>状态</th>
                  </tr>
                </thead>
                <tbody>
                  {mockTopics.map((topic) => (
                    <tr key={topic.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-4 py-3 font-medium">{topic.name}</td>
                      <td className="px-4 py-3" style={{ color: "var(--muted-foreground)" }}>
                        {mockQueues.find(q => q.id === topic.queueId)?.name}
                      </td>
                      <td className="px-4 py-3">{topic.partitions}</td>
                      <td className="px-4 py-3">{topic.messages.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={topic.lag > 1000 ? "text-red-500" : "inherit"}>{topic.lag}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="px-2 py-1 rounded text-xs"
                          style={{
                            background: topic.status === "active" ? "rgba(0, 214, 143, 0.1)" :
                              topic.status === "warning" ? "rgba(250, 173, 20, 0.1)" : "rgba(255, 77, 79, 0.1)",
                            color: topic.status === "active" ? "#00D68F" :
                              topic.status === "warning" ? "#FAAD14" : "#FF4D4F"
                          }}
                        >
                          {topic.status === "active" ? "活跃" : topic.status === "warning" ? "延迟" : "错误"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "consumers" && (
          <div className="rounded-lg p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="text-center">
              <Activity className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--muted-foreground)" }} />
              <h3 className="text-lg font-medium mb-2">消费者监控</h3>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>
                查看和管理消息队列消费者状态
              </p>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
