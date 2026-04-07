# Lt-APM 插件使用文档

## 📦 插件总览
Lt-APM 是一款高性能、低侵入的Java微服务APM Agent，支持以下17个主流微服务组件的全链路埋点：

### 🌐 网关层
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Spring Cloud Gateway | 3.x | 网关层链路追踪，自动透传链路ID到下游服务 |

### 📞 RPC层
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Dubbo | 2.7.x | Dubbo RPC调用链路追踪，支持服务提供者/消费者两端 |
| Feign | 11.x/OpenFeign | Spring Cloud OpenFeign远程调用链路追踪，自动透传链路ID |

### 📨 消息队列
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| RocketMQ | 4.x/5.x | RocketMQ消息生产/消费链路追踪，自动透传链路ID |
| RabbitMQ | 3.x/5.x | RabbitMQ消息生产/消费链路追踪，自动透传链路ID |
| Kafka | 0.10.x+/2.x | Kafka Producer/Consumer链路追踪，自动透传链路ID |

### 💾 数据存储
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Redis | Jedis/Lettuce/Redisson | Redis客户端调用链路追踪，采集Key、操作类型等信息 |
| MongoDB | 3.x/4.x | MongoDB客户端调用链路追踪，采集集合名、操作类型等信息 |
| Elasticsearch | 6.x/7.x | Elasticsearch客户端调用链路追踪，采集索引、操作类型等信息 |
| Sharding-JDBC | 5.x | 分库分表SQL路由追踪，采集路由信息、分库分表执行详情 |

### 🛡️ 流量控制
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Sentinel | 1.8.x | 流量控制事件采集，支持限流、降级、熔断、系统保护等事件 |
| Hystrix | 1.5.x | 熔断限流事件采集，支持熔断、降级、超时、线程池拒绝等事件 |
| Resilience4j | 1.7.x | 韧性组件事件采集，支持熔断器、限流、隔离舱等事件 |

### 🔍 分布式事务
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Seata | 1.4.x+ | 分布式事务链路追踪，采集XID、事务状态、分支事务信息 |

### ⚙️ 配置中心/服务发现
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| Nacos | 1.x/2.x | 配置中心/服务注册发现事件采集，支持配置拉取、变更、服务注册/发现 |
| Apollo | 1.x/2.x | 配置中心事件采集，支持配置拉取、变更、灰度发布等 |

### ⏰ 定时任务
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| XXL-Job | 2.x | 定时任务执行链路追踪，采集任务执行、超时、失败、重试等事件 |

### 🛠️ 基础组件
| 插件名称 | 支持版本 | 功能说明 |
|---------|---------|----------|
| HTTP客户端 | HttpClient3.x/4.x、OkHttp3 | HTTP调用链路追踪，自动透传链路ID |
| JDBC | 所有JDBC兼容驱动 | 数据库SQL执行追踪，采集SQL、执行耗时、影响行数等 |
| Servlet | 3.x+ | Web入口链路追踪，自动生成链路ID |
| Spring事务 | 5.x | Spring事务执行追踪，采集事务状态、回滚信息等 |
| 线程池 | JDK ThreadPoolExecutor | 异步线程链路追踪，自动透传链路ID到子线程 |

---

## 🚀 快速接入
### 1. 下载Agent
从 `lt-monitor/packages/` 目录下载最新的 `lt-agent.jar`。

### 2. JVM参数配置
在应用启动参数中添加：
```bash
-javaagent:/path/to/lt-agent.jar \
-Dlt.app.name=your-application-name \
-Dlt.agent.enable=true \
-Dlt.reporter.type=elasticsearch \
-Dlt.reporter.elasticsearch.address=http://es-host:9200
```

### 3. 可选配置
```properties
# 采样率配置（默认100%采样）
lt.trace.sampling.rate=1.0

# 插件开关（默认全部开启）
lt.plugin.sentinel.enable=true
lt.plugin.dubbo.enable=true
lt.plugin.feign.enable=true

# 日志级别配置
lt.log.level=INFO
```

---

## 📊 上报格式
所有埋点数据统一使用Span格式上报：
```json
{
  "traceId": "字符串，链路全局唯一ID",
  "spanId": "字符串，当前Span唯一ID",
  "parentSpanId": "字符串，父SpanID",
  "type": "字符串，Span类型（如dubbo、redis、mq等）",
  "appName": "字符串，应用名称",
  "host": "字符串，主机IP",
  "startTime": "长整型，开始时间戳（毫秒）",
  "spend": "长整型，耗时（毫秒）",
  "tags": {
    "键值对，各个插件自定义标签"
  }
}
```

---

## 📝 插件文档
详细的每个插件的使用说明和配置参数请参考 [plugin-docs/](./plugin-docs/) 目录下的对应文档。
