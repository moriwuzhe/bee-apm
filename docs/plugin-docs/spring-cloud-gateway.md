# Spring Cloud Gateway插件使用文档

## 支持版本
- Spring Cloud Gateway 2.2.x（对应Spring Cloud Hoxton）
- Spring Cloud Gateway 3.0.x（对应Spring Cloud 2020.0.x）
- Spring Cloud Gateway 3.1.x（对应Spring Cloud 2021.0.x）
- Spring Cloud Gateway 4.0.x（对应Spring Cloud 2022.0.x）

## 功能说明
Spring Cloud Gateway插件支持网关层全链路追踪：
- 自动生成TraceId，作为整个链路的入口
- 自动透传链路ID到下游服务
- 采集路由信息、请求参数、响应状态等
- 记录网关请求耗时、限流、降级等事件
- 支持GlobalFilter、自定义Filter、断言等特性
- 支持网关限流、熔断降级集成

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.gateway.enable | true | 是否开启Spring Cloud Gateway插件 |
| lt.plugin.gateway.collect.request.headers | true | 是否采集请求头 |
| lt.plugin.gateway.collect.response.headers | false | 是否采集响应头 |
| lt.plugin.gateway.collect.request.params | false | 是否采集请求参数（默认关闭，避免敏感信息泄露） |
| lt.plugin.gateway.trace.header.name | traceId | 透传到下游的TraceId请求头名称 |

## 埋点标签
### 通用请求标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `gateway` |
| request_id | 网关请求ID |
| route_id | 路由ID |
| route_uri | 路由目标URI |
| http_method | HTTP请求方法：GET/POST/PUT/DELETE等 |
| http_path | 请求路径 |
| http_status | HTTP响应状态码 |
| scheme | 请求协议：http/https |
| host | 请求Host |
| remote_ip | 客户端IP |
| user_agent | User-Agent |
| referer | Referer |
| spend | 请求总耗时（毫秒） |
| status | 请求状态：`success` / `failed` |
| error_msg | 错误信息（请求失败时） |

### 路由信息标签
| 标签名称 | 说明 |
|---------|------|
| route_order | 路由优先级 |
| predicates | 匹配的断言列表 |
| filters | 应用的过滤器列表 |
| route_metadata | 路由元数据（JSON格式） |

### 限流/降级标签
| 标签名称 | 说明 |
|---------|------|
| blocked | 是否被限流/降级：`true` / `false` |
| block_type | 拒绝类型：`rate_limit` / `circuit_breaker` / `other` |
| block_reason | 拒绝原因 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在网关服务的JVM启动参数中添加Agent即可，Spring Cloud Gateway插件会自动生效。

### 2. 自定义TraceId透传头名称
```properties
# 修改透传到下游的TraceId头名称为X-B3-TraceId（和ZipKin兼容）
lt.plugin.gateway.trace.header.name=X-B3-TraceId
```
如果需要同时透传多个链路头，可以配置多个：
```properties
lt.plugin.gateway.trace.header.names=traceId,X-B3-TraceId,sw8
```
多个名称用逗号分隔。

### 3. 开启请求参数采集（谨慎开启）
```properties
lt.plugin.gateway.collect.request.params=true
```
开启后会采集GET的Query参数和POST的Form参数：
| 标签名称 | 说明 |
|---------|------|
| param.xxx | 请求参数xxx的值 |

> ⚠️ **安全警告**：请求参数可能包含密码、Token、手机号等敏感信息，开启前请确认不会泄露敏感数据。

### 4. 配置请求头黑名单
可以配置不需要采集的请求头：
```properties
lt.plugin.gateway.exclude.headers=Cookie,Authorization,Token,*Password*
```
支持通配符 `*` 匹配，匹配到的请求头不会被采集。

## 链路透传说明
Spring Cloud Gateway作为链路入口，会自动：
1. 检查请求中是否已经存在TraceId，如果存在则复用，不存在则生成新的TraceId
2. 将TraceId放到请求头中，透传到下游服务
3. 所有下游服务的调用都会关联到同一个TraceId
4. 响应时会将TraceId放到响应头中返回给客户端

默认透传的链路头包括：
- `traceId`：链路全局唯一ID
- `spanId`：当前SpanID
- `parentSpanId`：父SpanID
- `appName`：网关应用名称

## 支持的网关特性
✅ 路由转发  
✅ 断言匹配（Path、Method、Header、Query等）  
✅ 内置过滤器（AddRequestHeader、AddRequestParameter、RewritePath等）  
✅ 自定义GlobalFilter  
✅ 自定义GatewayFilter  
✅ 限流（RequestRateLimiter过滤器）  
✅ 熔断降级（CircuitBreaker过滤器）  
✅ 重试（Retry过滤器）  
✅ 跨域配置（CORS）  
✅ 路径重写、前缀裁剪

## 常见问题
### Q: 自定义Filter的调用会被采集吗？
A: 插件是基于网关的核心处理链路拦截，所有经过网关的请求都会被采集，和是否使用自定义Filter无关。自定义Filter内部的异常也会被捕获并上报。

### Q: 如何过滤不需要采集的路径？
A: 可以通过配置路径黑名单：
```properties
lt.plugin.gateway.exclude.paths=/actuator/**,/health,/favicon.ico,/webjars/**
```
支持Ant风格路径匹配，匹配到的路径不会被采集。

### Q: TraceId会和其他APM系统兼容吗？
A: 默认使用自定义的TraceId格式，如果需要和SkyWalking、ZipKin等其他APM系统兼容，可以通过配置`lt.plugin.gateway.trace.header.name`修改透传的头名称，同时配置TraceId生成策略为对应系统的格式。

### Q: 对网关性能有影响吗？
A: 插件只在请求进入和返回的时候插入埋点逻辑，没有额外IO操作，对网关性能的影响小于5%，QPS越高影响越小。
