# Sentinel插件使用文档

## 支持版本
- Sentinel 1.7.x
- Sentinel 1.8.x
- Sentinel 2.x（待验证）

## 功能说明
Sentinel插件支持流量控制事件的全链路追踪：
- 采集限流、降级、熔断、系统保护等流量控制事件
- 记录资源名称、限制类型、拒绝原因、异常信息
- 统计QPS、线程数、响应时间等指标
- 支持Sentinel注解和API两种使用方式
- 支持热点参数限流、集群限流

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.sentinel.enable | true | 是否开启Sentinel插件 |
| lt.plugin.sentinel.collect.blocked.only | false | 是否只采集被拒绝的请求（默认采集所有请求） |
| lt.plugin.sentinel.collect.metrics | true | 是否采集Sentinel metrics指标 |
| lt.plugin.sentinel.metrics.interval | 60000 | 指标采集间隔（毫秒，默认1分钟） |

## 埋点标签
### 流量控制事件标签
| 标签名称 | 说明 |
|---------|------|
| resource | 资源名称 |
| block_type | 拒绝类型：<br>`flow_control` - 限流<br>`degrade` - 降级<br>`system_block` - 系统保护<br>`param_flow_control` - 热点参数限流<br>`block` - 其他类型拒绝 |
| blocked | 是否被拒绝：`true` / `false` |
| rule_limit | 规则阈值 |
| rule_type | 规则类型：`qps` / `thread_count` |
| error_msg | 拒绝原因（异常信息） |
| fallback_used | 是否触发了降级：`true` / `false` |

### Metrics指标标签（定时采集）
| 标签名称 | 说明 |
|---------|------|
| resource | 资源名称 |
| pass_qps | 每秒通过请求数 |
| block_qps | 每秒拒绝请求数 |
| success_qps | 每秒成功请求数 |
| exception_qps | 每秒异常请求数 |
| rt | 平均响应时间（毫秒） |
| thread_count | 占用线程数 |
| timestamp | 指标采集时间戳 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Sentinel插件会自动生效。

### 2. 只采集拒绝事件（推荐）
生产环境建议开启只采集被拒绝的请求，减少数据量：
```properties
lt.plugin.sentinel.collect.blocked.only=true
```
开启后只有被Sentinel拦截的请求才会上报，正常通过的请求不会上报，可以大幅减少上报数据量。

### 3. 调整指标采集间隔
```properties
# 调整指标采集间隔为5分钟
lt.plugin.sentinel.metrics.interval=300000
```
不需要指标采集可以关闭：
```properties
lt.plugin.sentinel.collect.metrics=false
```

## 支持的Sentinel功能
1. ✅ 流量控制（QPS限流、线程数限流）
2. ✅ 熔断降级（响应时间、异常比例、异常数降级）
3. ✅ 系统自适应保护
4. ✅ 热点参数限流
5. ✅ 集群限流
6. ✅ 授权规则（黑白名单）

## 常见问题
### Q: 和Sentinel自带的监控冲突吗？
A: 不冲突，Lt-APM的Sentinel插件是基于字节码拦截，不会影响Sentinel本身的功能和自带监控。

### Q: 自定义资源名能支持吗？
A: 支持所有方式定义的资源，包括注解方式、API方式、Web埋点、Dubbo埋点等自动创建的资源。

### Q: 如何过滤不需要采集的资源？
A: 可以通过配置资源名黑名单：
```properties
lt.plugin.sentinel.exclude.resources=web_ignore,test_*,/health
```
支持通配符 `*` 匹配多个资源。
