# LT Monitor APM系统演进与优化计划

为了将 `LT Monitor` 打造为一个符合主流标准、易部署、高可用且具备强大竞争力的现代化 APM (Application Performance Monitoring) 系统，制定以下演进与优化计划。本计划参考了业界主流开源 APM（如 SkyWalking、Pinpoint、Elastic APM 等）的最佳实践。

## 1. 架构演进与高可用设计 (Architecture & HA)
主流 APM 系统的核心是**无状态**、**高吞吐**和**高可用**。

*   **计算与存储分离**：确保 `lt-server-apm` (OAP端) 是完全无状态的，所有的状态保留在消息队列（Kafka/RocketMQ）和存储层（Elasticsearch）。
*   **多级集群部署模式**：
    *   **接入层 (Receiver/Gateway)**：专门负责接收 Agent 数据，支持水平扩容。通过 Nginx 或 LB 进行负载均衡，接收数据后快速写入 Kafka，实现流量削峰。
    *   **计算层 (Aggregator/Processor)**：消费 Kafka 消息，进行流式计算、Metrics 聚合（如 RED 指标：请求量、错误率、延迟）、拓扑生成，然后批量入库。
    *   **存储层 (Storage)**：目前已支持 Elasticsearch，建议未来引入 ClickHouse，以大幅提升海量 Trace 数据的写入和聚合查询性能。
*   **服务自发现与动态配置**：引入 Nacos/Consul，使得 Agent 能自动感知 Server 节点的增减；支持在 UI 端动态下发采样率、黑白名单等配置给 Agent。

## 2. 容器化与易部署方案 (Containerization & Easy Deployment)
易部署是开源项目推广的生命线。

*   **全面 Docker 化**：为 `lt-agent` (以基础镜像形式)、`lt-server-apm`、`lt-ui` 提供官方 Dockerfile 和镜像。
*   **一键单机部署 (Docker Compose)**：提供开箱即用的 `docker-compose.yml`，一键拉起依赖组件（Elasticsearch, Kafka）和 LT Monitor 的所有服务，做到“3分钟内体验”。
*   **云原生/K8s 友好 (Helm Chart)**：
    *   提供 Helm Chart，支持在 Kubernetes 中一键部署高可用集群。
    *   提供 `InitContainer` 模式或 `Kubernetes Operator`，实现在 K8s 环境下对 Java 应用的**零侵入无感注入 Agent**。

## 3. 核心观测能力补齐 (Core Observability Features)
现代 APM 已从单纯的 Trace 演进为涵盖 Trace、Metrics、Logs 的大可观测性平台。

*   **Metrics (指标监控)**：除了基础的 JVM 指标外，需支持基于 Trace 自动计算出服务/实例/接口的黄金三指标（TPS, 响应时间, 错误率）。
*   **Logs (日志关联)**：实现 Trace 与 Log 的深度绑定。Agent 自动将 `TraceId` 注入到 Log4j2/Logback 的 MDC 中，在 UI 上实现“从异常链路一键跳转到对应日志”。
*   **Topology (拓扑分析)**：基于 RPC/HTTP/DB 调用关系，在后台实时计算并生成全局/服务级别的拓扑图，直观展示系统依赖和网络瓶颈。
*   **Alerting (告警引擎)**：内置规则引擎，支持基于接口超时、错误率飙升、JVM 内存告警，支持 Webhook、钉钉、企业微信等通知渠道。

## 4. 性能与扩展性极致优化 (Performance & Scalability)
*   **Agent 性能极客化**：
    *   引入无锁队列（如 Disruptor/RingBuffer）替代传统的阻塞队列，实现 Agent 数据的异步打包发送。
    *   对象池化复用，极力减少 Agent 运行期间的 Young GC。
*   **智能采样 (Smart Sampling)**：
    *   **头部采样**：固定比例、限流采样。
    *   **尾部采样 (Tail-based Sampling)**：将所有 Trace 头部数据发送到 Server 端，由 Server 判断如果包含 Error 或慢请求则全量保留，否则丢弃，既节省存储又不漏掉关键问题。
*   **gRPC/Protobuf 通信**：在 HTTP 之外引入 gRPC 协议进行 Agent 和 Server 的通信，使用 Protobuf 序列化，大幅降低网络带宽占用和序列化 CPU 开销。

## 5. 生态融合与标准化 (Ecosystem & Standardization)
*   **拥抱 OpenTelemetry**：在 Server 端增加 OTLP (OpenTelemetry Protocol) Receiver。这样除了 Java 以外，Go、Python、Node.js 的微服务也能通过标准的 OTel 探针接入 LT Monitor，实现多语言支持。
*   **微服务生态全覆盖**：持续完善 Plugin，确保对 Spring Cloud Alibaba全家桶、Dubbo3、gRPC、主流消息队列和缓存的全面支持。

## 6. 实施路线图建议 (Roadmap)

### Phase 1: 易用性与基础重构 (1-2个月)
- [ ] 编写 Dockerfile 并提供 Docker Compose 一键启动脚本。
- [ ] UI 界面现代化升级（支持拓扑图基础版）。
- [ ] 优化现有配置方式，梳理并完善文档（如中英文 README、Quick Start）。

### Phase 2: 高可用与性能进阶 (2-3个月)
- [ ] 增加 gRPC 通信协议支持。
- [ ] Agent 内部引入 RingBuffer 异步发送机制。
- [ ] Server 端完全解耦：接入节点 -> Kafka -> 计算节点 -> Elasticsearch。

### Phase 3: 全面可观测性与生态 (3-6个月)
- [ ] 实现 TraceId 与应用日志 MDC 的自动打通。
- [ ] 增加基于 Trace 数据聚合的 Metrics 统计面板。
- [ ] Server 兼容 OpenTelemetry OTLP 协议，支持多语言。
- [ ] 提供 Kubernetes Helm 部署脚本和注入方案。
