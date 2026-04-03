# Resilience4j插件使用文档

## 支持版本
- Resilience4j 1.5.x
- Resilience4j 1.6.x
- Resilience4j 1.7.x
- 支持所有Resilience4j核心组件

## 功能说明
Resilience4j插件支持所有韧性组件的事件采集：
- 采集熔断器（CircuitBreaker）的开启、关闭、半开事件
- 采集限流（RateLimiter）的请求通过、拒绝事件
- 采集隔离舱（Bulkhead）的请求通过、拒绝事件
- 采集重试（Retry）的重试次数、重试结果事件
- 采集限时器（TimeLimiter）的超时事件
- 统计各个组件的QPS、成功率、响应时间等指标

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| bee.plugin.resilience4j.enable | true | 是否开启Resilience4j插件 |
| bee.plugin.resilience4j.collect.blocked.only | false | 是否只采集被拒绝的请求（默认采集所有） |
| bee.plugin.resilience4j.collect.metrics | true | 是否采集Metrics指标 |
| bee.plugin.resilience4j.metrics.interval | 60000 | 指标采集间隔（毫秒，默认1分钟） |
| bee.plugin.resilience4j.components | circuitbreaker,ratelimiter,bulkhead,retry,timelimiter | 要采集的组件列表，逗号分隔 |

## 埋点标签
### 熔断器（CircuitBreaker）标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `resilience4j_circuitbreaker` |
| name | 熔断器名称 |
| state | 熔断器状态：`CLOSED` / `OPEN` / `HALF_OPEN` |
| transition | 状态转换：`CLOSED_TO_OPEN` / `OPEN_TO_HALF_OPEN` / `HALF_OPEN_TO_CLOSED` / `HALF_OPEN_TO_OPEN` |
| action | 操作：`call_permitted` / `call_not_permitted` / `call_success` / `call_failed` |
| failure_rate | 失败率（百分比） |
| slow_call_rate | 慢调用率（百分比） |
| permitted_number_of_calls_in_half_open_state | 半开状态允许的请求数 |
| failure_threshold | 失败率阈值 |
| slow_call_threshold | 慢调用率阈值 |
| wait_duration_in_open_state | 熔断时长（毫秒） |
| error_msg | 错误信息（调用失败时） |

### 限流（RateLimiter）标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `resilience4j_ratelimiter` |
| name | 限流器名称 |
| action | 操作：`acquired` / `rejected` |
| limit_for_period | 周期内允许的请求数 |
| limit_refresh_period | 周期时长（毫秒） |
| timeout | 获取许可超时时间（毫秒） |
| available_permissions | 剩余许可数 |
| waiting_threads | 等待线程数 |

### 隔离舱（Bulkhead）标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `resilience4j_bulkhead` |
| name | 隔离舱名称 |
| action | 操作：`permitted` / `rejected` |
| max_concurrent_calls | 最大并发数 |
| max_wait_duration | 最大等待时长（毫秒） |
| available_concurrent_calls | 可用并发数 |

### 重试（Retry）标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `resilience4j_retry` |
| name | 重试器名称 |
| action | 操作：`success` / `retry` / `failed` |
| attempt | 当前重试次数（第N次重试） |
| max_attempts | 最大重试次数 |
| wait_duration | 重试等待时长（毫秒） |
| retry_exception | 触发重试的异常类型 |
| include_exceptions | 包含的异常列表 |
| exclude_exceptions | 排除的异常列表 |

### 限时器（TimeLimiter）标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `resilience4j_timelimiter` |
| name | 限时器名称 |
| action | 操作：`success` / `timeout` |
| timeout_duration | 超时时间（毫秒） |
| cancel_running_future | 是否取消运行中的Future |

### Metrics指标标签
| 标签名称 | 说明 |
|---------|------|
| component | 组件类型：`circuitbreaker` / `ratelimiter` 等 |
| name | 组件名称 |
| total_calls | 总调用次数 |
| successful_calls | 成功调用次数 |
| failed_calls | 失败调用次数 |
| rejected_calls | 拒绝调用次数 |
| timeout_calls | 超时调用次数 |
| average_duration | 平均耗时（毫秒） |
| failure_rate | 失败率（百分比） |
| timestamp | 采集时间戳 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Resilience4j插件会自动识别所有组件并生效。无论是注解方式还是API方式使用Resilience4j都支持。

### 2. 只采集拒绝事件（推荐生产使用）
```properties
bee.plugin.resilience4j.collect.blocked.only=true
```
开启后只有被拒绝的请求才会上报，正常通过的请求不会上报，可以大幅减少上报数据量。

### 3. 指定要采集的组件
如果只需要采集部分组件，可以配置：
```properties
# 只采集熔断器和限流
bee.plugin.resilience4j.components=circuitbreaker,ratelimiter
```

### 4. 调整指标采集间隔
```properties
# 调整指标采集间隔为5分钟
bee.plugin.resilience4j.metrics.interval=300000
```
不需要指标采集可以关闭：
```properties
bee.plugin.resilience4j.collect.metrics=false
```

## 支持的Resilience4j功能
✅ CircuitBreaker 熔断器  
✅ RateLimiter 限流  
✅ Bulkhead 隔离舱（信号量隔离和线程池隔离都支持）  
✅ Retry 重试  
✅ TimeLimiter 限时器  
✅ Fallback 降级  
✅ 注解方式（`@CircuitBreaker`、`@RateLimiter`等）  
✅ API方式  
✅ Spring Boot集成  
✅ Reactor/RxJava响应式编程支持  
✅ 指标暴露（Micrometer、Prometheus等）

## 常见问题
### Q: 和Resilience4j自带的Metrics冲突吗？
A: 不冲突，插件是基于字节码拦截，不会影响Resilience4j本身的功能和自带的Metrics统计。

### Q: 支持响应式编程（Reactor/RxJava）吗？
A: 支持，无论是同步调用还是异步响应式调用都会被正确采集。

### Q: 如何过滤不需要采集的组件？
A: 可以通过配置组件名称黑名单：
```properties
bee.plugin.resilience4j.exclude.names=test*,ignore*,temp-*
```
支持通配符 `*` 匹配，匹配到的组件事件不会上报。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑都是在事件触发时的内存操作，没有额外IO，对性能的影响极小，几乎可以忽略不计。
