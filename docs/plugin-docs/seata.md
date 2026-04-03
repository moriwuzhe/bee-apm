# Seata分布式事务插件使用文档

## 支持版本
- Seata 1.4.x
- Seata 1.5.x
- Seata 1.6.x/1.7.x
- 支持 AT、TCC、SAGA、XA 四种事务模式

## 功能说明
Seata插件支持分布式事务的全链路追踪：
- 采集全局事务XID、事务状态、执行耗时
- 记录分支事务ID、分支类型、执行结果
- 追踪事务提交、回滚、超时等事件
- 自动关联业务链路和分布式事务链路
- 支持全局事务和分支事务的父子Span关联

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| bee.plugin.seata.enable | true | 是否开启Seata插件 |
| bee.plugin.seata.collect.branch | true | 是否采集分支事务详情 |
| bee.plugin.seata.collect.xid.in.log | true | 是否自动将XID注入到MDC日志上下文 |

## 埋点标签
### 全局事务标签
| 标签名称 | 说明 |
|---------|------|
| xid | 全局事务XID（全局唯一） |
| transaction_name | 事务名称 |
| transaction_type | 事务模式：`AT` / `TCC` / `SAGA` / `XA` |
| action | 事务操作：`begin` / `commit` / `rollback` |
| status | 事务状态：`begin` / `commit_success` / `commit_failed` / `rollback_success` / `rollback_failed` |
| timeout | 事务超时时间（毫秒） |
| branch_count | 分支事务数量 |
| error_msg | 事务失败原因 |

### 分支事务标签
| 标签名称 | 说明 |
|---------|------|
| xid | 所属全局事务XID |
| branch_id | 分支事务ID |
| branch_type | 分支类型：`AT` / `TCC` / `SAGA` / `XA` |
| resource_id | 分支资源ID（如数据库表名） |
| action | 分支操作：`prepare` / `commit` / `rollback` |
| status | 分支状态：`success` / `failed` |
| retry_count | 重试次数 |
| error_msg | 分支失败原因 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Seata插件会自动生效。
如果使用的是Spring Cloud Alibaba集成Seata，同样无需任何额外配置。

### 2. 开启MDC日志注入（推荐）
```properties
bee.plugin.seata.collect.xid.in.log=true
```
开启后会自动将XID注入到SLF4J的MDC上下文，键为 `SEATA_XID`，可以在日志pattern中配置打印：
```xml
<pattern>%d{yyyy-MM-dd HH:mm:ss.SSS} [%thread] %-5level %logger{36} - XID:%X{SEATA_XID} - %msg%n</pattern>
```
这样可以通过XID直接搜索到整个分布式事务相关的所有日志。

### 3. 关闭分支事务采集
如果只需要全局事务信息，可以关闭分支事务采集，减少数据量：
```properties
bee.plugin.seata.collect.branch=false
```

## 链路关联说明
Seata插件会自动将分布式事务链路和业务调用链路关联：
1. 全局事务Span的父Span是触发事务的业务入口（如HTTP请求、Dubbo调用）
2. 每个分支事务Span的父Span是对应的本地调用（如数据库操作、RPC调用）
3. 全局事务XID会自动透传到整个链路中，可以通过XID关联所有相关的Span

## 常见问题
### Q: 为什么看不到事务的提交/回滚事件？
A: 请检查：
1. 确认Seata版本在支持范围内
2. 确认全局事务正确开启（注解 `@GlobalTransactional` 生效）
3. 检查 `bee.plugin.seata.enable` 配置为 `true`

### Q: 不同服务的事务链路能关联吗？
A: 可以，只要参与分布式事务的所有服务都接入了Bee-APM Agent，就可以通过XID关联整个分布式事务的全链路。

### Q: 支持Seata的哪些配置中心？
A: 支持所有Seata支持的配置中心（Nacos、Apollo、ZooKeeper、Consul等），插件和Seata的配置方式无关。

### Q: 对事务性能有影响吗？
A: Seata插件的埋点逻辑都是内存操作，没有IO操作，对事务性能的影响小于0.5%，不会影响分布式事务的正常执行。
