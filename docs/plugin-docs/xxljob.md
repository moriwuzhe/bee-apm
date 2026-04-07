# XXL-Job定时任务插件使用文档

## 支持版本
- XXL-Job 2.0.x
- XXL-Job 2.1.x
- XXL-Job 2.2.x
- XXL-Job 2.3.x

## 功能说明
XXL-Job插件支持定时任务全生命周期的链路追踪：
- 采集定时任务执行、超时、失败、重试等事件
- 记录任务ID、任务名称、参数、执行结果
- 统计执行耗时、调度时间、重试次数
- 支持方法注解和自定义JobHandler两种方式
- 支持任务执行结果回调上报
- 支持分片广播、路由策略等特性

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.xxljob.enable | true | 是否开启XXL-Job插件 |
| lt.plugin.xxljob.collect.param | true | 是否采集任务参数 |
| lt.plugin.xxljob.collect.callback | true | 是否采集任务结果回调事件 |
| lt.plugin.xxljob.param.max_length | 200 | 任务参数截断长度 |

## 埋点标签
### 任务执行事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `job` |
| job_id | 任务ID（Long类型） |
| job_name | 任务名称（方法名或自定义Handler名称） |
| job_param | 任务参数 |
| executor_address | 执行器地址 |
| log_id | 执行日志ID |
| sharding_index | 分片索引（分片广播任务时） |
| sharding_total | 总分片数 |
| status | 执行状态：`success` / `failed` / `timeout` |
| handle_code | 执行结果码：200=成功，500=失败 |
| handle_msg | 执行结果信息 |
| retry_count | 重试次数 |
| spend | 执行耗时（毫秒） |
| error_msg | 异常信息（执行失败时） |

### 执行器操作事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `executor` |
| action | 操作类型：`start` / `destroy` / `register` |
| executor_name | 执行器名称 |
| address | 执行器地址 |
| port | 执行器端口 |
| app_name | 应用名称 |
| status | 操作状态：`success` / `failed` |

### 回调事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `callback` |
| job_id | 任务ID |
| log_id | 执行日志ID |
| handle_code | 执行结果码 |
| handle_msg | 执行结果信息 |
| callback_status | 回调状态：`success` / `failed` |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，XXL-Job插件会自动识别：
- 基于 `@XxlJob` 注解的方法任务
- 基于 `IJobHandler` 接口的自定义任务
- 执行器的启动、注册、销毁事件
- 任务结果的回调上报

### 2. 关闭参数采集
如果任务参数包含敏感信息，可以关闭参数采集：
```properties
lt.plugin.xxljob.collect.param=false
```
关闭后 `job_param` 标签将不会被采集。

### 3. 关闭回调采集
如果不需要采集任务结果回调事件，可以关闭：
```properties
lt.plugin.xxljob.collect.callback=false
```

## 功能支持列表
✅ 简单任务执行  
✅ 分片广播任务  
✅ 任务超时控制  
✅ 任务失败重试  
✅ 子任务依赖  
✅ 任务执行结果回调  
✅ 执行器自动注册  
✅ 路由策略（轮询、随机、一致性Hash等）  
✅ 日志上报  
✅ 命令式任务（GLUE模式）

## 链路关联说明
XXL-Job插件会自动为定时任务创建独立的链路：
1. 每个任务执行都会生成独立的TraceId
2. 任务执行过程中的所有调用（数据库、RPC、MQ等）都会关联到这个TraceId
3. 可以通过TraceId查询整个任务执行的全链路信息

## 常见问题
### Q: GLUE模式的任务支持吗？
A: 支持，无论是注解方式、自定义Handler方式还是GLUE模式的任务，都会被自动识别和埋点。

### Q: 任务执行的异常会被捕获吗？
A: 会的，任务执行抛出的异常会被捕获，并且记录在 `error_msg` 标签中，同时标记任务状态为 `failed`。

### Q: 如何过滤不需要采集的任务？
A: 可以通过配置任务名称黑名单：
```properties
lt.plugin.xxljob.exclude.job_names=testJob,temp*,*ignore*
```
支持通配符 `*` 匹配，匹配到的任务执行不会上报。

### Q: 对任务执行性能有影响吗？
A: 插件的埋点逻辑都是在任务执行前后的内存操作，没有额外IO，对任务执行性能的影响小于1ms，完全可以忽略。
