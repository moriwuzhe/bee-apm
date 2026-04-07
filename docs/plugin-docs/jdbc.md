# JDBC数据库插件使用文档

## 支持驱动
- 所有兼容JDBC 4.0及以上标准的数据库驱动
- MySQL 5.x/8.x
- PostgreSQL 9.x+
- Oracle 11g/12c/19c
- SQL Server 2012+
- DB2 9.x+
- H2、HSQLDB等内存数据库

## 功能说明
JDBC插件支持所有关系型数据库的SQL执行链路追踪：
- 采集完整SQL语句、参数、执行耗时
- 记录数据库地址、库名、表名等信息
- 统计影响行数、是否慢SQL
- 支持PreparedStatement预编译SQL
- 支持数据库连接池（Druid、HikariCP、C3P0、DBCP等）

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.jdbc.enable | true | 是否开启JDBC插件 |
| lt.plugin.jdbc.sql.max_length | 1000 | SQL语句截断长度 |
| lt.plugin.jdbc.slow_sql.threshold | 1000 | 慢SQL阈值（毫秒），超过会标记为慢SQL |
| lt.plugin.jdbc.collect.parameters | true | 是否采集PreparedStatement参数 |
| lt.plugin.jdbc.parameter.max_length | 100 | 参数值截断长度 |

## 埋点标签
| 标签名称 | 说明 |
|---------|------|
| sql | SQL语句（会自动截断） |
| sql_type | SQL类型：`SELECT` / `INSERT` / `UPDATE` / `DELETE` / `OTHER` |
| database | 数据库名 |
| table | 操作的表名（多表操作时取第一个） |
| host | 数据库服务器IP |
| port | 数据库服务器端口 |
| jdbc_url | 完整JDBC连接URL |
| driver | 驱动类名 |
| affected_rows | 影响行数（UPDATE/DELETE/INSERT时） |
| is_slow | 是否为慢SQL：`true` / `false` |
| param.x | PreparedStatement第x个参数的值（x从0开始） |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，JDBC插件会自动识别驱动并生效。

### 2. 慢SQL阈值调整
```properties
# 调整慢SQL阈值为500毫秒
lt.plugin.jdbc.slow_sql.threshold=500
```

### 3. 关闭参数采集（可选）
如果担心参数泄露敏感信息，可以关闭参数采集：
```properties
lt.plugin.jdbc.collect.parameters=false
```

### 4. SQL长度调整
```properties
# 调整SQL最大长度为2000字符
lt.plugin.jdbc.sql.max_length=2000
```

## SQL解析说明
插件会自动解析SQL语句，提取以下信息：
- SQL类型：SELECT、INSERT、UPDATE、DELETE等
- 表名：从SQL中解析操作的表名
- 关键字：自动识别DROP、ALTER等高危操作

> 注意：复杂SQL（如多表关联、子查询、存储过程等）可能解析不完整，但不影响SQL本身的采集和耗时统计。

## 支持的操作
1. **DDL语句**：CREATE、ALTER、DROP、TRUNCATE等
2. **DML语句**：SELECT、INSERT、UPDATE、DELETE等
3. **DCL语句**：GRANT、REVOKE等
4. **事务语句**：BEGIN、COMMIT、ROLLBACK等
5. **存储过程调用**：CALL、EXECUTE等

## 常见问题
### Q: 连接池环境下不生效？
A: JDBC插件是基于驱动层拦截，和连接池无关，所有主流连接池都支持，不需要额外配置。

### Q: 多数据源环境下支持吗？
A: 支持多数据源，每个数据源的SQL都会被独立采集，并且会带上对应的jdbc_url、host、database等标签。

### Q: 如何过滤不需要采集的SQL？
A: 可以通过配置SQL前缀黑名单：
```properties
lt.plugin.jdbc.exclude.sql.prefixes=SHOW,SELECT 1,SET NAMES
```
匹配到前缀的SQL会被过滤，不会上报。

### Q: 会影响数据库性能吗？
A: JDBC插件的埋点逻辑在客户端执行，不会额外访问数据库，对数据库性能没有影响；对应用的性能影响小于1%。
