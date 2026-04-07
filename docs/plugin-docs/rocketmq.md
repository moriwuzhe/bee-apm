# RocketMQ插件使用文档

## 支持版本
- RocketMQ 4.3.x+
- RocketMQ 4.8.x/4.9.x（LTS版本）
- RocketMQ 5.x
- 支持RocketMQ-Spring、RocketMQ-Spring-Boot-Starter集成

## 功能说明
RocketMQ插件支持消息生产和消费两端的全链路追踪：
- 自动在消息属性中透传链路ID
- 采集Topic、Tag、Key、消息体等信息
- 记录消息发送/消费耗时、成功/失败状态、异常信息
- 支持同步、异步、单向三种发送模式
- 支持批量消息、顺序消息、事务消息
- 支持消费重试、死信队列、消费过滤等特性

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.rocketmq.enable | true | 是否开启RocketMQ插件 |
| lt.plugin.rocketmq.collect.properties | true | 是否采集消息属性 |
| lt.plugin.rocketmq.collect.body | false | 是否采集消息体（默认关闭，避免敏感信息泄露） |
| lt.plugin.rocketmq.body.max_length | 200 | 消息体截断长度 |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `rocketmq` |
| topic | Topic名称 |
| namesrv_addr | NameServer地址 |
| producer_group | 生产者组（生产端） |
| consumer_group | 消费者组（消费端） |
| region | 地域（多地域部署时） |

### 生产端标签
| 标签名称 | 说明 |
|---------|------|
| role | 固定为 `producer` |
| msg_id | 消息ID |
| tag | 消息Tag |
| keys | 消息Key列表（多个用逗号分隔） |
| send_mode | 发送模式：`sync` / `async` / `oneway` |
| partition | 发送的队列ID |
| offset | 消息偏移量 |
| msg_size | 消息大小（字节） |
| delay_level | 延迟消息级别（0表示非延迟消息） |
| is_batch | 是否批量消息：`true` / `false` |
| batch_count | 批量消息数量 |
| send_result | 发送结果：`SEND_OK` / `FLUSH_DISK_TIMEOUT` / `FLUSH_SLAVE_TIMEOUT` / `SLAVE_NOT_AVAILABLE` |
| status | 发送状态：`success` / `failed` |
| error_msg | 错误信息（发送失败时） |
| spend | 发送耗时（毫秒） |

### 消费端标签
| 标签名称 | 说明 |
|---------|------|
| role | 固定为 `consumer` |
| msg_id | 消息ID |
| tag | 消息Tag |
| keys | 消息Key列表 |
| queue_id | 消费的队列ID |
| offset | 消费的消息偏移量 |
| reconsume_times | 重试次数 |
| consume_mode | 消费模式：`CONCURRENTLY` / `ORDERLY` |
| consume_result | 消费结果：`CONSUME_SUCCESS` / `RECONSUME_LATER` |
| status | 消费状态：`success` / `failed` |
| error_msg | 错误信息（消费失败时） |
| spend | 消费耗时（毫秒） |
| dlq | 是否进入死信队列：`true` / `false` |

### 事务消息标签
| 标签名称 | 说明 |
|---------|------|
| transaction_id | 事务ID |
| transaction_state | 事务状态：`COMMIT` / `ROLLBACK` / `UNKNOWN` |
| check_times | 回查次数 |
| check_result | 回查结果 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，RocketMQ插件会自动识别：
- 原生RocketMQ Producer/Consumer API
- RocketMQ-Spring集成
- RocketMQ-Spring-Boot-Starter集成
- 事务消息生产者/消费者

### 2. 开启消息体采集（谨慎开启）
```properties
lt.plugin.rocketmq.collect.body=true
```
开启后会采集消息体内容，最多采集配置的截断长度。
> ⚠️ **安全警告**：消息体通常包含业务敏感数据，开启前请确认不会泄露用户隐私、密码、Token等敏感信息。

### 3. 关闭消息属性采集
如果不需要采集消息自定义属性，可以关闭：
```properties
lt.plugin.rocketmq.collect.properties=false
```

### 4. 配置属性黑名单
可以配置不需要采集的消息属性：
```properties
lt.plugin.rocketmq.exclude.properties=secret,token,password,*key*
```
支持通配符 `*` 匹配，匹配到的属性不会被采集。

## 链路透传说明
RocketMQ插件会自动在消息属性中添加以下链路追踪属性：
- `traceId`：链路全局唯一ID
- `spanId`：当前SpanID
- `parentSpanId`：父SpanID
- `appName`：生产者应用名称

消费者端会自动从消息属性中读取这些属性，实现跨进程链路追踪。

## 支持的RocketMQ特性
✅ 普通消息（同步/异步/单向发送）  
✅ 批量消息  
✅ 顺序消息  
✅ 延迟消息  
✅ 事务消息  
✅ 消息重试  
✅ 死信队列  
✅ 消费过滤（Tag过滤、SQL92过滤）  
✅ 消费模式（集群消费、广播消费）  
✅ ACL权限控制  
✅ TLS加密传输  
✅ 多Namesrv、多地域部署

## 常见问题
### Q: 上下文透传不生效？
A: 请检查：
1. 确认生产者和消费者都接入了Lt-APM Agent
2. 确认RocketMQ版本在4.3.x以上（支持消息属性）
3. 确认没有自定义的消息过滤器过滤了链路属性

### Q: 事务消息会被采集几次？
A: 事务消息会被采集三次：
1. 半消息发送时生成生产端Span
2. 事务回查时生成回查Span
3. 消费者消费时生成消费端Span
所有Span共享同一个TraceId，可以关联整个事务消息的生命周期。

### Q: 如何过滤不需要采集的Topic？
A: 可以通过配置Topic黑名单：
```properties
lt.plugin.rocketmq.exclude.topics=RMQ_SYS_*,test_topic,temp_*,%DLQ%
```
支持通配符 `*` 匹配，默认已经过滤了系统Topic和死信队列Topic。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑都是在消息发送和消费的前后执行的内存操作，没有额外IO，对性能的影响小于1ms，完全可以忽略。
