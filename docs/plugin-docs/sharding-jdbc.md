# Sharding-JDBC分库分表插件使用文档

## 支持版本
- Sharding-JDBC 4.x
- Sharding-JDBC 5.x
- 支持ShardingSphere-JDBC所有版本

## 功能说明
Sharding-JDBC插件支持分库分表全场景链路追踪：
- 采集SQL路由信息，包括分库分表结果
- 记录实际执行的SQL、实际执行的库表
- 统计SQL解析、路由、改写、执行全流程耗时
- 支持分片、读写分离、分布式事务等特性
- 自动关联分库分表执行和数据库操作链路

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.shardingjdbc.enable | true | 是否开启Sharding-JDBC插件 |
| lt.plugin.shardingjdbc.collect.actual.sql | true | 是否采集实际执行的SQL |
| lt.plugin.shardingjdbc.collect.route.detail | true | 是否采集详细路由信息 |
| lt.plugin.shardingjdbc.sql.max_length | 1000 | SQL截断长度 |

## 埋点标签
### 分库分表执行标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `shardingjdbc` |
| logic_sql | 逻辑SQL（用户编写的原始SQL） |
| sql_type | SQL类型：`SELECT` / `INSERT` / `UPDATE` / `DELETE` |
| logic_table | 逻辑表名 |
| actual_ds_count | 实际路由到的数据源数量 |
| actual_table_count | 实际路由到的表数量 |
| actual_ds_list | 实际数据源列表（多个用逗号分隔） |
| actual_table_list | 实际表列表（多个用逗号分隔） |
| total_time | 总耗时（毫秒，包含解析、路由、改写、执行） |
| parse_time | SQL解析耗时（毫秒） |
| route_time | 路由耗时（毫秒） |
| rewrite_time | SQL改写耗时（毫秒） |
| execute_time | 执行耗时（毫秒） |
| merge_time | 结果合并耗时（毫秒） |
| status | 执行状态：`success` / `failed` |
| error_msg | 错误信息（执行失败时） |
| affected_rows | 影响行数（DML语句） |

### 路由详情标签（开启route.detail时）
| 标签名称 | 说明 |
|---------|------|
| route.actual_ds | 路由到的数据源 |
| route.actual_table | 路由到的实际表 |
| route.sharding_value | 分片键值 |
| route.sql | 该分片实际执行的SQL |
| route.time | 该分片执行耗时 |

### 读写分离标签
| 标签名称 | 说明 |
|---------|------|
| ds_type | 数据源类型：`master` / `slave` |
| load_balancer | 负载均衡策略：`ROUND_ROBIN` / `RANDOM` / `WEIGHT`等 |
| read_weight | 读库权重 |
| hit_cache | 是否命中查询缓存 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Sharding-JDBC插件会自动生效，无论是XML配置还是YAML配置都支持。

### 2. 关闭实际SQL采集
如果不需要采集每个分片实际执行的SQL，可以关闭：
```properties
lt.plugin.shardingjdbc.collect.actual.sql=false
```
关闭后只会采集逻辑SQL和路由结果，不会采集每个分片的实际SQL。

### 3. 关闭详细路由信息采集
如果分片数量很多，不需要采集每个分片的详细信息，可以关闭：
```properties
lt.plugin.shardingjdbc.collect.route.detail=false
```
关闭后只会统计路由到的数据源和表的数量，不会采集每个分片的详细信息，可以大幅减少上报数据量。

### 4. 调整SQL长度
```properties
# 调整SQL最大长度为2000字符
lt.plugin.shardingjdbc.sql.max_length=2000
```

## 支持的Sharding-JDBC功能
✅ 数据分片（分库分表）  
✅ 读写分离  
✅ 分布式事务（XA、BASE、Seata）  
✅ 分布式主键  
✅ 行表达式分片、标准分片、复合分片等所有分片策略  
✅ 绑定表、广播表  
✅ 分页查询  
✅ 关联查询  
✅ 聚合查询  
✅ SQL改写  
✅ 结果合并  

## 链路关联说明
Sharding-JDBC插件会自动关联分库分表操作和数据库执行链路：
1. 分库分表逻辑执行生成父Span（type=shardingjdbc）
2. 每个实际数据库执行生成子Span（type=jdbc）
3. 所有Span共享同一个TraceId，可以通过TraceId关联整个分库分表执行的全链路
4. 逻辑SQL和实际执行的SQL可以通过Span的父子关系对应

## 常见问题
### Q: 支持ShardingSphere-JDBC 5.x的新特性吗？
A: 支持，Sharding-JDBC 4.x和5.x的所有核心特性都支持，包括新的DistSQL、弹性伸缩等功能。

### Q: 会重复采集JDBC的SQL吗？
A: 不会，插件会自动识别是否已经被JDBC插件采集，避免重复上报。Sharding-JDBC插件采集分库分表的逻辑信息，JDBC插件采集实际数据库执行信息，两者是互补的。

### Q: 如何过滤不需要采集的逻辑表？
A: 可以通过配置逻辑表黑名单：
```properties
lt.plugin.shardingjdbc.exclude.logic_tables=temp_*,test_*,ignore_*
```
支持通配符 `*` 匹配，匹配到的逻辑表操作不会上报。

### Q: 对性能有影响吗？
A: 插件的埋点逻辑在Sharding-JDBC的执行流程中插入，都是内存操作，没有额外IO，对性能的影响小于3%，在可接受范围内。
