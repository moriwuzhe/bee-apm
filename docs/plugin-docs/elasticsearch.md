# Elasticsearch插件使用文档

## 支持版本
- Elasticsearch Java High Level REST Client 6.x
- Elasticsearch Java High Level REST Client 7.x
- Elasticsearch Java Client 8.x
- 支持Elasticsearch 6.x/7.x/8.x服务端
- 支持Spring Data Elasticsearch集成

## 功能说明
Elasticsearch插件支持Elasticsearch操作的全链路追踪：
- 采集索引名、操作类型、查询DSL、聚合条件等信息
- 记录执行耗时、命中数量、分片信息、成功/失败状态
- 支持CRUD、搜索、聚合、索引管理、集群管理等所有操作
- 支持批量操作、异步请求、响应式客户端
- 支持ES集群、跨集群搜索、索引别名等特性

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| bee.plugin.elasticsearch.enable | true | 是否开启Elasticsearch插件 |
| bee.plugin.elasticsearch.collect.query | true | 是否采集查询DSL |
| bee.plugin.elasticsearch.collect.result | false | 是否采集返回结果（默认关闭） |
| bee.plugin.elasticsearch.dsl.max_length | 1000 | 查询DSL截断长度 |
| bee.plugin.elasticsearch.slow_threshold | 1000 | 慢查询阈值（毫秒） |

## 埋点标签
### 通用标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `elasticsearch` |
| host | ES节点IP（请求发送的节点） |
| port | ES节点端口 |
| cluster_name | 集群名称 |
| index | 索引名称（支持多个索引，逗号分隔） |
| operation | 操作类型：`index` / `get` / `update` / `delete` / `search` / `aggregate` / `bulk` / `create_index` / `delete_index`等 |
| http_method | HTTP请求方法：GET/POST/PUT/DELETE等 |
| endpoint | REST API端点（如`/_search`、`/_bulk`） |
| spend | 执行耗时（毫秒） |
| is_slow | 是否慢查询：`true` / `false` |
| status | 执行状态：`success` / `failed` |
| http_status | HTTP响应状态码 |
| error_msg | 错误信息（执行失败时） |

### 操作详情标签
| 操作类型 | 额外标签 | 说明 |
|---------|---------|------|
| index | document_id | 文档ID |
| index | version | 文档版本号 |
| index | result | 结果：`created` / `updated` |
| get | document_id | 文档ID |
| get | exists | 文档是否存在：`true` / `false` |
| get | version | 文档版本号 |
| update | document_id | 文档ID |
| update | updated | 是否更新：`true` / `false` |
| update | version | 文档版本号 |
| delete | document_id | 文档ID |
| delete | deleted | 是否删除：`true` / `false` |
| delete | version | 文档版本号 |
| search | query_dsl | 查询DSL JSON |
| search | from | 分页起始位置 |
| search | size | 分页大小 |
| search | total_hits | 命中总数量 |
| search | took | ES服务端执行耗时（毫秒） |
| search | timed_out | 是否超时：`true` / `false` |
| search | total_shards | 总分片数 |
| search | successful_shards | 成功分片数 |
| search | failed_shards | 失败分片数 |
| aggregate | agg_dsl | 聚合DSL JSON |
| aggregate | agg_name | 聚合名称 |
| aggregate | took | ES服务端执行耗时（毫秒） |
| bulk | operation_count | 批量操作数量 |
| bulk | success_count | 成功数量 |
| bulk | failed_count | 失败数量 |
| create_index | settings | 索引配置JSON |
| create_index | mappings | 索引映射JSON |
| delete_index | ack | 操作是否确认：`true` / `false` |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Elasticsearch插件会自动识别：
- High Level REST Client 6.x/7.x
- 新的Java Client 8.x
- Spring Data Elasticsearch集成
- Reactive Elasticsearch响应式客户端
- 异步请求和批量操作

### 2. 开启结果采集（可选）
```properties
bee.plugin.elasticsearch.collect.result=true
```
开启后会采集查询返回的结果JSON，最多采集前200字符。
> ⚠️ 注意：开启结果采集可能会泄露敏感数据，同时会增加数据上报量，请在确认安全的场景下开启。

### 3. 调整慢查询阈值
```properties
# 调整慢查询阈值为2000毫秒
bee.plugin.elasticsearch.slow_threshold=2000
```

### 4. 关闭查询DSL采集
如果查询DSL包含敏感信息，可以关闭采集：
```properties
bee.plugin.elasticsearch.collect.query=false
```
关闭后只会采集操作类型、索引名，不会采集具体的查询DSL内容。

## 支持的Elasticsearch操作
✅ 文档操作：index、get、update、delete、bulk、updateByQuery、deleteByQuery  
✅ 搜索操作：search、scroll、clearScroll、searchTemplate、multiSearch  
✅ 聚合操作：aggregate、terms、avg、sum、min、max、cardinality、nested等所有聚合类型  
✅ 索引操作：createIndex、deleteIndex、exists、putMapping、getMapping、updateSettings、refresh、flush  
✅ 集群操作：health、stats、info、nodesStats、clusterStats  
✅ 其他操作：count、explain、validate、suggest、highlight、percolate  
✅ 异步请求、流式响应、响应式编程  
✅ 跨集群搜索（CCS）、索引别名、索引模板

## 链路关联说明
Elasticsearch插件会自动将ES操作关联到业务链路：
- 每个ES操作都会生成独立的子Span
- 父Span是触发ES操作的业务调用（如HTTP请求、RPC调用、定时任务等）
- 所有操作共享同一个TraceId，可以通过TraceId关联整个业务链路的ES操作

## 常见问题
### Q: 支持Elasticsearch 8.x的新Java客户端吗？
A: 支持，旧的High Level REST Client和新的Java Client都支持，插件会自动识别客户端类型。

### Q: 支持批量操作吗？
A: 支持，批量操作会统计操作总数、成功数量、失败数量，每个子操作的详细信息不会单独采集，避免数据量过大。

### Q: 如何过滤不需要采集的索引？
A: 可以通过配置索引黑名单：
```properties
bee.plugin.elasticsearch.exclude.indexes=.kibana*,.security*,test_*,temp_*,ignore_*
```
支持通配符 `*` 匹配，默认已经过滤了系统索引和Kibana索引。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑都是在ES客户端执行前后的内存操作，没有额外IO，对性能的影响小于1ms，完全可以忽略。
