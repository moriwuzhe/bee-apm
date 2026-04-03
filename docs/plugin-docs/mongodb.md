# MongoDB插件使用文档

## 支持版本
- MongoDB Java Driver 3.x
- MongoDB Java Driver 4.x
- 支持MongoDB 3.x/4.x/5.x/6.x服务端
- 支持Spring Data MongoDB集成

## 功能说明
MongoDB插件支持MongoDB操作的全链路追踪：
- 采集数据库名、集合名、操作类型、查询条件等信息
- 记录执行耗时、影响行数、成功/失败状态、异常信息
- 支持CRUD、聚合、索引、事务等所有操作
- 支持副本集、分片集群部署模式
- 支持响应式MongoDB驱动（Reactive Streams）

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| bee.plugin.mongodb.enable | true | 是否开启MongoDB插件 |
| bee.plugin.mongodb.collect.query | true | 是否采集查询条件 |
| bee.plugin.mongodb.collect.result | false | 是否采集返回结果（默认关闭） |
| bee.plugin.mongodb.command.max_length | 1000 | 命令JSON截断长度 |
| bee.plugin.mongodb.slow_threshold | 500 | 慢查询阈值（毫秒） |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `mongodb` |
| db | 数据库名 |
| collection | 集合名 |
| operation | 操作类型：`find` / `insert` / `update` / `delete` / `aggregate` / `count` / `distinct` / `createIndex`等 |
| host | MongoDB服务器IP（集群时显示主节点IP） |
| port | MongoDB服务器端口 |
| cluster_mode | 集群模式：`standalone` / `replica_set` / `sharded` |
| read_preference | 读偏好：`primary` / `primaryPreferred` / `secondary` / `secondaryPreferred` / `nearest` |
| write_concern | 写策略：`ACKNOWLEDGED` / `W1` / `W2` / `MAJORITY` / `UNACKNOWLEDGED`等 |
| spend | 执行耗时（毫秒） |
| is_slow | 是否慢查询：`true` / `false` |
| status | 执行状态：`success` / `failed` |
| error_msg | 错误信息（执行失败时） |

### 操作详情标签
| 操作类型 | 额外标签 | 说明 |
|---------|---------|------|
| find | query | 查询条件JSON |
| find | projection | 返回字段过滤JSON |
| find | sort | 排序条件JSON |
| find | limit | 限制返回条数 |
| find | skip | 跳过条数 |
| find | has_more | 是否有更多结果：`true` / `false` |
| insert | document_count | 插入文档数量 |
| insert | upsert | 是否upsert：`true` / `false` |
| update | query | 更新条件JSON |
| update | update | 更新内容JSON |
| update | updated_count | 更新影响行数 |
| update | matched_count | 匹配行数 |
| update | upsert | 是否upsert：`true` / `false` |
| delete | query | 删除条件JSON |
| delete | deleted_count | 删除行数 |
| aggregate | pipeline | 聚合管道JSON |
| aggregate | result_count | 聚合结果数量 |
| count | query | 统计条件JSON |
| count | count | 统计结果 |
| createIndex | index_keys | 索引键JSON |
| createIndex | index_options | 索引选项JSON |
| createIndex | index_name | 索引名称 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，MongoDB插件会自动识别：
- 原生MongoDB Java Driver API
- Spring Data MongoDB集成
- Reactive MongoDB响应式驱动
- MongoDB事务操作

### 2. 开启结果采集（可选）
```properties
bee.plugin.mongodb.collect.result=true
```
开启后会采集查询返回的结果JSON，最多采集前200字符。
> ⚠️ 注意：开启结果采集可能会泄露敏感数据，同时会增加数据上报量，请在确认安全的场景下开启。

### 3. 调整慢查询阈值
```properties
# 调整慢查询阈值为1000毫秒
bee.plugin.mongodb.slow_threshold=1000
```

### 4. 关闭查询条件采集
如果查询条件包含敏感信息，可以关闭采集：
```properties
bee.plugin.mongodb.collect.query=false
```
关闭后只会采集操作类型、库名、集合名，不会采集具体的查询条件。

## 支持的MongoDB操作
✅ 文档操作：insert、insertOne、insertMany、find、findOne、update、updateOne、updateMany、delete、deleteOne、deleteMany、replaceOne、bulkWrite  
✅ 聚合操作：aggregate、count、countDocuments、estimatedDocumentCount、distinct  
✅ 索引操作：createIndex、createIndexes、listIndexes、dropIndex、dropIndexes  
✅ 数据库操作：createCollection、dropCollection、listCollections、runCommand  
✅ 事务操作：startTransaction、commitTransaction、abortTransaction  
✅ 变更流（Change Stream）  
✅ 网格存储（GridFS）  
✅ 地理空间查询

## 链路关联说明
MongoDB插件会自动将数据库操作关联到业务链路：
- 每个MongoDB操作都会生成独立的子Span
- 父Span是触发MongoDB操作的业务调用（如HTTP请求、RPC调用、定时任务等）
- 所有操作共享同一个TraceId，可以通过TraceId关联整个业务链路的数据库操作

## 常见问题
### Q: 支持分片集群吗？
A: 支持，无论是单机、副本集还是分片集群都支持，会自动识别集群模式和实际执行的节点。

### Q: 支持MongoDB事务吗？
A: 支持，事务内的多个操作会被独立采集，并且共享同一个TraceId，可以关联整个事务的所有操作。

### Q: 如何过滤不需要采集的集合？
A: 可以通过配置集合黑名单：
```properties
bee.plugin.mongodb.exclude.collections=system.*,temp_*,test_*,ignore_*
```
支持通配符 `*` 匹配，默认已经过滤了系统集合。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑都是在MongoDB驱动执行前后的内存操作，没有额外IO，对性能的影响小于1ms，完全可以忽略。
