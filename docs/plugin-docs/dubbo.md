# Dubbo插件使用文档

## 支持版本
- Dubbo 2.7.x
- Dubbo 3.x

## 功能说明
Dubbo插件支持服务提供者和消费者两端的链路追踪：
- 自动生成/透传TraceId、SpanId
- 采集服务名、方法名、版本号、分组等信息
- 记录调用耗时、成功/失败状态、异常信息
- 支持Dubbo泛化调用

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.dubbo.enable | true | 是否开启Dubbo插件 |
| lt.plugin.dubbo.collect.arguments | false | 是否采集方法参数（默认关闭，避免敏感信息泄露） |
| lt.plugin.dubbo.collect.result | false | 是否采集方法返回值（默认关闭，避免敏感信息泄露） |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| service | 服务接口全限定名 |
| method | 方法名 |
| version | 服务版本号 |
| group | 服务分组 |
| side | 调用端：`consumer` / 服务端：`provider` |

### 消费者端额外标签
| 标签名称 | 说明 |
|---------|------|
| remote_host | 服务提供者IP |
| remote_port | 服务提供者端口 |
| timeout | 调用超时时间 |

### 服务端额外标签
| 标签名称 | 说明 |
|---------|------|
| client_host | 消费者IP |
| client_port | 消费者端口 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Dubbo插件会自动生效。

### 2. 开启参数采集（可选）
```properties
lt.plugin.dubbo.collect.arguments=true
lt.plugin.dubbo.collect.result=true
```

开启后会额外采集以下标签：
| 标签名称 | 说明 |
|---------|------|
| arguments.0 | 第一个参数JSON序列化值 |
| arguments.1 | 第二个参数JSON序列化值 |
| ... | ... |
| result | 返回值JSON序列化值 |

> ⚠️ 注意：开启参数和返回值采集可能会泄露敏感信息（如密码、手机号等），请在确认安全的场景下开启。

## 常见问题
### Q: Dubbo插件不生效？
A: 请检查：
1. 确认Dubbo版本在支持范围内
2. 确认 `lt.plugin.dubbo.enable` 配置为 `true`
3. 检查应用日志中是否有Dubbo插件初始化日志

### Q: 如何过滤不需要采集的服务？
A: 可以通过配置黑名单：
```properties
lt.plugin.dubbo.exclude.services=com.example.service.IgnoreService,com.example.service.TestService
```
