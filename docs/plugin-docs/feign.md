# Feign插件使用文档

## 支持版本
- OpenFeign 10.x
- OpenFeign 11.x
- OpenFeign 12.x
- Spring Cloud OpenFeign 2.x/3.x/4.x

## 功能说明
Feign插件支持Feign远程调用的全链路追踪：
- 自动透传链路ID到被调用服务
- 采集接口名称、方法名、参数等信息
- 记录调用耗时、响应状态、异常信息
- 支持GET/POST/PUT/DELETE等所有HTTP方法
- 支持请求/响应压缩
- 支持Feign自定义拦截器、编码器、解码器

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.feign.enable | true | 是否开启Feign插件 |
| lt.plugin.feign.collect.headers | true | 是否采集请求头 |
| lt.plugin.feign.collect.params | false | 是否采集请求参数（默认关闭） |
| lt.plugin.feign.collect.response | false | 是否采集响应内容（默认关闭） |
| lt.plugin.feign.header.blacklist | Authorization,Token,Cookie | 不采集的请求头列表 |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `feign` |
| interface | Feign接口全限定名 |
| method | 方法名 |
| http_method | HTTP请求方法：GET/POST/PUT/DELETE等 |
| url | 请求目标URL |
| host | 目标服务Host |
| path | 请求路径 |
| http_status | HTTP响应状态码 |
| spend | 请求耗时（毫秒） |
| status | 调用状态：`success` / `failed` |
| error_msg | 错误信息（调用失败时） |
| fallback_used | 是否触发了Fallback：`true` / `false` |

### 请求相关标签
| 标签名称 | 说明 |
|---------|------|
| param.xxx | 请求参数（开启参数采集时） |
| header.xxx | 请求头（不在黑名单内的头） |
| query.xxx | URL Query参数 |
| request_content_type | 请求Content-Type |

### 响应相关标签
| 标签名称 | 说明 |
|---------|------|
| response_content_type | 响应Content-Type |
| response_length | 响应内容长度 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Feign插件会自动识别所有Feign接口并生效。无论是使用`@FeignClient`注解的Spring Cloud Feign还是原生Feign都支持。

### 2. 开启请求参数采集（可选）
```properties
lt.plugin.feign.collect.params=true
```
开启后会采集方法参数和Query参数：
- GET请求：采集URL上的所有Query参数
- POST请求：采集Form表单参数或者JSON请求体（会自动截断）

> ⚠️ 注意：开启参数采集可能会泄露密码、Token等敏感信息，请在确认安全的场景下开启。

### 3. 开启响应内容采集（可选）
```properties
lt.plugin.feign.collect.response=true
```
开启后会采集响应内容，最多采集前200字符。

### 4. 自定义请求头黑名单
```properties
# 增加自定义的敏感头到黑名单
lt.plugin.feign.header.blacklist=Authorization,Token,Cookie,X-Secret,X-Password
```
黑名单中的请求头不会被采集。

## 链路透传说明
Feign插件会自动在请求头中添加以下链路追踪属性：
- `traceId`：链路全局唯一ID
- `spanId`：当前SpanID
- `parentSpanId`：父SpanID
- `appName`：调用方应用名称

被调用方如果也接入了Lt-APM Agent，会自动读取这些请求头，实现跨服务链路追踪。

## 支持的Feign特性
✅ `@FeignClient`注解方式  
✅ 原生Feign Builder方式  
✅ 自定义Interceptor拦截器  
✅ 自定义Encoder/Decoder  
✅ 服务发现（Nacos、Eureka等）  
✅ 负载均衡（Ribbon、Spring Cloud LoadBalancer）  
✅ 熔断降级（Sentinel、Hystrix、Resilience4j）  
✅ 重试机制  
✅ 请求/响应压缩  
✅ 多环境、多分组配置

## 常见问题
### Q: 上下文透传不生效？
A: 请检查：
1. 确认调用方和被调用方都接入了Lt-APM Agent
2. 确认没有自定义的Feign拦截器过滤了链路请求头
3. 确认`lt.plugin.feign.enable`配置为`true`

### Q: Feign调用的异常会被捕获吗？
A: 会的，所有Feign调用抛出的异常（包括业务异常、网络异常、超时异常等）都会被捕获，并且记录在`error_msg`标签中，同时标记状态为`failed`。

### Q: 如何过滤不需要采集的Feign接口？
A: 可以通过配置接口黑名单：
```properties
lt.plugin.feign.exclude.interfaces=com.example.service.IgnoreService,com.example.service.TestService
```
支持通配符 `*` 匹配，匹配到的接口调用不会上报。

### Q: 对Feign调用性能有影响吗？
A: 插件的埋点逻辑都是在发送请求前和收到响应后执行的内存操作，没有额外IO，对性能的影响小于1ms，完全可以忽略。
