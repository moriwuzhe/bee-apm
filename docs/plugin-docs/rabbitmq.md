# RabbitMQ插件使用文档

## 支持版本
- RabbitMQ 3.6.x+
- RabbitMQ 3.8.x/3.9.x/3.10.x（LTS版本）
- 支持amqp-client 4.x/5.x
- 支持Spring AMQP、Spring Boot Rabbit集成

## 功能说明
RabbitMQ插件支持消息生产和消费两端的全链路追踪：
- 自动在消息头中透传链路ID
- 采集Exchange、RoutingKey、Queue、消息体等信息
- 记录消息发送/消费耗时、成功/失败状态、异常信息
- 支持持久化消息、事务消息、确认机制
- 支持死信队列、延迟队列、优先级队列等特性
- 支持消费重试、批量消费、手动ACK等模式

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.rabbitmq.enable | true | 是否开启RabbitMQ插件 |
| lt.plugin.rabbitmq.collect.headers | true | 是否采集消息头 |
| lt.plugin.rabbitmq.collect.body | false | 是否采集消息体（默认关闭，避免敏感信息泄露） |
| lt.plugin.rabbitmq.body.max_length | 200 | 消息体截断长度 |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `rabbitmq` |
| host | RabbitMQ服务器IP |
| port | RabbitMQ服务器端口 |
| virtual_host | 虚拟主机 |
| connection_name | 连接名称 |
| channel_number | 通道号 |

### 生产端标签
| 标签名称 | 说明 |
|---------|------|
| role | 固定为 `producer` |
| exchange | 交换机名称 |
| routing_key | 路由Key |
| message_id | 消息ID |
| delivery_mode | 投递模式：1=非持久化，2=持久化 |
| priority | 消息优先级 |
| expiration | 消息过期时间（毫秒） |
| content_type | 消息Content-Type |
| msg_size | 消息大小（字节） |
| mandatory | mandatory标志：`true` / `false` |
| immediate | immediate标志：`true` / `false` |
| confirm_status | 确认状态：`ack` / `nack` / `return` |
| return_reason | 消息退回原因（mandatory=true且消息不可路由时） |
| status | 发送状态：`success` / `failed` |
| error_msg | 错误信息（发送失败时） |
| spend | 发送耗时（毫秒） |

### 消费端标签
| 标签名称 | 说明 |
|---------|------|
| role | 固定为 `consumer` |
| queue | 队列名称 |
| consumer_tag | 消费者标签 |
| message_id | 消息ID |
| delivery_tag | 投递标签 |
| redelivered | 是否重投递：`true` / `false` |
| exchange | 消息来源交换机 |
| routing_key | 消息路由Key |
| requeue | 是否重新入队（NACK时） |
| ack_status | ACK状态：`ack` / `nack` / `reject` |
| consume_mode | 消费模式：`auto` / `manual` |
| retry_count | 重试次数 |
| dlq | 是否进入死信队列：`true` / `false` |
| status | 消费状态：`success` / `failed` |
| error_msg | 错误信息（消费失败时） |
| spend | 消费耗时（毫秒） |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，RabbitMQ插件会自动识别：
- 原生amqp-client API
- Spring AMQP集成
- Spring Boot Rabbit Starter集成
- RabbitMQ事务消息
- 生产者确认、消费者手动ACK等高级特性

### 2. 开启消息体采集（谨慎开启）
```properties
lt.plugin.rabbitmq.collect.body=true
```
开启后会采集消息体内容，最多采集配置的截断长度。
> ⚠️ **安全警告**：消息体通常包含业务敏感数据，开启前请确认不会泄露用户隐私、密码、Token等敏感信息。

### 3. 关闭消息头采集
如果不需要采集消息头中的自定义属性，可以关闭：
```properties
lt.plugin.rabbitmq.collect.headers=false
```

### 4. 配置消息头黑名单
可以配置不需要采集的消息头：
```properties
lt.plugin.rabbitmq.exclude.headers=secret,token,password,*key*
```
支持通配符 `*` 匹配，匹配到的消息头不会被采集。

## 链路透传说明
RabbitMQ插件会自动在消息头中添加以下链路追踪属性：
- `traceId`：链路全局唯一ID
- `spanId`：当前SpanID
- `parentSpanId`：父SpanID
- `appName`：生产者应用名称

消费者端会自动从消息头中读取这些属性，实现跨进程链路追踪。

## 支持的RabbitMQ特性
✅ 普通消息发送/消费  
✅ 持久化消息  
✅ 事务消息  
✅ 生产者确认（Publisher Confirm）  
✅ 消息退回（Return Listener）  
✅ 消费者手动ACK/NACK  
✅ 批量消费  
✅ 消费重试  
✅ 死信队列（DLQ）  
✅ 延迟队列（延迟插件）  
✅ 优先级队列  
✅  RPC模式（Direct Reply-to）  
✅ 集群部署、镜像队列  
✅ TLS加密传输  

## 常见问题
### Q: 上下文透传不生效？
A: 请检查：
1. 确认生产者和消费者都接入了Lt-APM Agent
2. 确认没有自定义的消息拦截器过滤了链路头
3. 确认消息没有被重新发布时丢失了头信息

### Q: 消息被退回时会采集吗？
A: 会的，当mandatory=true且消息不可路由时，会记录退回事件，并且标记`confirm_status`为`return`，同时记录退回原因。

### Q: 如何过滤不需要采集的Exchange或Queue？
A: 可以通过配置黑名单：
```properties
# 过滤Exchange
lt.plugin.rabbitmq.exclude.exchanges=amq.*,test_exchange,temp_*
# 过滤Queue
lt.plugin.rabbitmq.exclude.queues=dlq.*,test_queue,temp_*
```
支持通配符 `*` 匹配，默认已经过滤了系统默认的Exchange。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑都是在消息发送和消费的前后执行的内存操作，没有额外IO，对性能的影响小于1ms，完全可以忽略。
