# Hystrix插件使用文档

## 支持版本
- Hystrix 1.4.x
- Hystrix 1.5.x
- Hystrix 1.6.x
- 支持Spring Cloud Hystrix集成

## 功能说明
Hystrix插件支持熔断器全场景事件采集：
- 采集熔断器开启、关闭、半开状态变更事件
- 采集请求成功、失败、超时、线程池拒绝等事件
- 统计QPS、成功率、失败率、响应时间等指标
- 记录降级逻辑执行情况
- 支持线程池隔离和信号量隔离两种模式
- 支持Hystrix注解和API两种使用方式

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.hystrix.enable | true | 是否开启Hystrix插件 |
| lt.plugin.hystrix.collect.blocked.only | false | 是否只采集被拒绝的请求（默认采集所有） |
| lt.plugin.hystrix.collect.metrics | true | 是否采集Metrics指标 |
| lt.plugin.hystrix.metrics.interval | 60000 | 指标采集间隔（毫秒，默认1分钟） |
| lt.plugin.hystrix.collect.fallback | true | 是否采集Fallback执行事件 |

## 埋点标签
### 命令执行事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `hystrix` |
| command_key | Hystrix命令Key |
| group_key | Hystrix组Key |
| thread_pool_key | 线程池Key |
| action | 操作类型：`success` / `failed` / `timeout` / `rejected` / `short_circuited` |
| execution_type | 执行类型：`THREAD`（线程池隔离） / `SEMAPHORE`（信号量隔离） |
| is_circuit_breaker_open | 熔断器是否开启：`true` / `false` |
| execution_time | 执行耗时（毫秒） |
| total_time | 总耗时（包含排队时间） |
| error_msg | 错误信息（执行失败时） |
| fallback_used | 是否执行了降级：`true` / `false` |
| fallback_success | 降级是否成功：`true` / `false` |
| fallback_error_msg | 降级失败错误信息 |

### 熔断器状态变更标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `hystrix_circuit_state` |
| command_key | Hystrix命令Key |
| old_state | 旧状态：`CLOSED` / `OPEN` / `HALF_OPEN` |
| new_state | 新状态：`CLOSED` / `OPEN` / `HALF_OPEN` |
| failure_count | 失败请求数 |
| request_count | 总请求数 |
| error_threshold | 错误率阈值（百分比） |
| sleep_window | 熔断窗口时长（毫秒） |

### 线程池事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `hystrix_thread_pool` |
| thread_pool_key | 线程池Key |
| action | 操作：`task_rejected` / `queue_full` |
| core_size | 核心线程数 |
| maximum_size | 最大线程数 |
| queue_size | 队列大小 |
| active_count | 活跃线程数 |
| queue_size_current | 当前队列大小 |
| remaining_capacity | 队列剩余容量 |

### Metrics指标标签
| 标签名称 | 说明 |
|---------|------|
| command_key | Hystrix命令Key |
| total_requests | 总请求数 |
| success_requests | 成功请求数 |
| failed_requests | 失败请求数 |
| timeout_requests | 超时请求数 |
| rejected_requests | 拒绝请求数 |
| short_circuited_requests | 熔断短路请求数 |
| error_rate | 错误率（百分比） |
| average_execution_time | 平均执行耗时（毫秒） |
| timestamp | 采集时间戳 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Hystrix插件会自动识别：
- 基于 `@HystrixCommand` 注解的命令
- 基于 `HystrixCommand` 类继承的自定义命令
- 熔断器状态变更事件
- 线程池拒绝事件
- Fallback降级执行事件

### 2. 只采集拒绝事件（推荐生产使用）
```properties
lt.plugin.hystrix.collect.blocked.only=true
```
开启后只有被熔断、超时、拒绝的请求才会上报，正常成功的请求不会上报，可以大幅减少上报数据量。

### 3. 关闭Fallback采集
如果不需要采集降级执行情况，可以关闭：
```properties
lt.plugin.hystrix.collect.fallback=false
```

### 4. 调整指标采集间隔
```properties
# 调整指标采集间隔为5分钟
lt.plugin.hystrix.metrics.interval=300000
```
不需要指标采集可以关闭：
```properties
lt.plugin.hystrix.collect.metrics=false
```

## 支持的Hystrix功能
✅ 命令执行（同步/异步/响应式）  
✅ 熔断器状态变更  
✅ 线程池隔离  
✅ 信号量隔离  
✅ 请求超时控制  
✅ 降级执行（Fallback）  
✅ 请求缓存  
✅ 请求合并  
✅ 线程池 metrics  
✅ 注解方式和API方式都支持  
✅ Spring Cloud Hystrix集成

## 常见问题
### Q: 和Hystrix Dashboard冲突吗？
A: 不冲突，插件是基于字节码拦截，不会影响Hystrix本身的功能、Metrics上报和Dashboard展示。

### Q: 支持Hystrix的请求合并吗？
A: 支持，合并后的请求会被作为独立的Span采集，每个子请求也会被独立统计。

### Q: 如何过滤不需要采集的命令？
A: 可以通过配置Command Key黑名单：
```properties
lt.plugin.hystrix.exclude.command_keys=test*,ignore*,temp-*
```
支持通配符 `*` 匹配，匹配到的命令事件不会上报。

### Q: 对性能有影响吗？
A: Hystrix本身就有一定的性能损耗，插件的埋点逻辑在Hystrix的执行流程中插入，对性能的额外影响小于1%，可以忽略不计。

### Q: Hystrix已经停止维护了，为什么还要支持？
A: 目前仍然有很多老项目在使用Hystrix，为了兼容这些老系统，我们提供了Hystrix插件支持。新项目推荐使用Resilience4j作为替代方案。
