# Kafka插件使用文档

## 支持版本
- Kafka 0.10.x+
- Kafka 1.x/2.x/3.x
- 支持 Kafka Consumer 和 Producer 两端

## 功能说明
Kafka插件支持消息生产和消费两端的链路追踪：
- 自动在消息头中透传TraceId、SpanId
- 采集Topic、Partition、Offset、Key等信息
- 记录消息发送/消费耗时、成功/失败状态、异常信息
- 支持批量消息发送和消费
- 支持同步/异步发送模式

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| bee.plugin.kafka.enable | true | 是否开启Kafka插件 |
| bee.plugin.kafka.collect.headers | false | 是否采集消息头（默认关闭） |
| bee.plugin.kafka.collect.value | false | 是否采集消息体Value（默认关闭） |
| bee.plugin.kafka.value.max_length | 200 | 消息体截断长度 |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| topic | Kafka Topic名称 |
| bootstrap_servers | Kafka集群地址 |
| client_id | 客户端ID |

### Producer端额外标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `producer` |
| partition | 发送的分区号 |
| offset | 消息偏移量 |
| key | 消息Key |
| message_count | 批量发送时的消息数量 |
| acks | 生产者acks配置 |
| retries | 重试次数 |

### Consumer端额外标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `consumer` |
| group_id | 消费者组ID |
| partition | 消费的分区号 |
| offset | 消费的消息偏移量 |
| key | 消息Key |
| message_count | 批量消费时的消息数量 |
| poll_timeout | Consumer poll超时时间 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Kafka插件会自动生效。

### 2. 开启消息体采集（可选）
```properties
bee.plugin.kafka.collect.value=true
bee.plugin.kafka.value.max_length=500
```

开启后会额外采集消息体标签：
| 标签名称 | 说明 |
|---------|------|
| value | 消息体Value（会自动截断到配置的长度） |

> ⚠️ 注意：开启消息体采集可能会泄露敏感信息，请在确认安全的场景下开启。

### 3. 开启消息头采集（可选）
```properties
bee.plugin.kafka.collect.headers=true
```

开启后会采集消息头中的自定义属性：
| 标签名称 | 说明 |
|---------|------|
| header.xxx | 消息头中key为xxx的属性值 |

## 上下文透传说明
Kafka插件会自动在消息头中添加以下链路追踪属性：
- `traceId`: 链路全局唯一ID
- `spanId`: 当前SpanID
- `parentSpanId`: 父SpanID
- `appName`: 生产者应用名称

消费者端会自动从消息头中读取这些属性，实现跨进程链路追踪。

> 注意：如果使用了旧版本的Kafka客户端不支持消息头，上下文透传会自动失效，但基础的埋点功能不受影响。

## 常见问题
### Q: 上下文透传不生效？
A: 请检查：
1. 确认Kafka版本在0.11.0及以上（支持消息头）
2. 确认生产者和消费者都接入了Bee-APM Agent
3. 检查消息是否被序列化/反序列化框架过滤了消息头

### Q: 批量消息怎么采集？
A: 批量发送/消费时会自动统计消息数量，并生成对应的Span，每条消息的追踪信息会自动透传。

### Q: 如何过滤不需要采集的Topic？
A: 可以通过配置Topic黑名单：
```properties
bee.plugin.kafka.exclude.topics=__consumer_offsets,test-topic,temp-*
```
支持通配符 `*` 匹配多个Topic。
