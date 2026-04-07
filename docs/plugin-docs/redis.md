# Redis插件使用文档

## 支持客户端
- Jedis 2.x/3.x/4.x
- Lettuce 5.x/6.x
- Redisson 3.x

## 功能说明
Redis插件支持所有主流Java Redis客户端的链路追踪：
- 自动透传链路上下文
- 采集Redis命令、Key、操作类型
- 记录执行耗时、成功/失败状态、异常信息
- 支持单机、集群、哨兵、分片等部署模式

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.redis.enable | true | 是否开启Redis插件 |
| lt.plugin.redis.command.max_length | 100 | Redis命令截断长度（超过会截断） |
| lt.plugin.redis.collect.values | false | 是否采集SET等命令的Value值（默认关闭） |

## 埋点标签
| 标签名称 | 说明 |
|---------|------|
| command | Redis命令（如GET、SET、HGET等） |
| key | Redis Key |
| operation | 操作类型：`read` / `write` / `admin` |
| host | Redis服务器IP |
| port | Redis服务器端口 |
| db | 数据库编号（默认0） |
| cluster_node | 集群模式下的节点信息 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Redis插件会自动识别客户端类型并生效。

### 2. 开启Value采集（可选）
```properties
lt.plugin.redis.collect.values=true
```

开启后会额外采集Value标签：
| 标签名称 | 说明 |
|---------|------|
| value | SET等写入命令的Value值 |

> ⚠️ 注意：开启Value采集可能会泄露敏感信息，请在确认安全的场景下开启。

### 3. 命令长度调整
```properties
# 调整Redis命令最大长度为200字符
lt.plugin.redis.command.max_length=200
```

## 支持的命令列表
### String命令
GET、SET、SETNX、SETEX、APPEND、STRLEN、INCR、DECR、INCRBY、DECRBY、GETSET、MGET、MSET、MSETNX等
### Hash命令
HGET、HSET、HMGET、HMSET、HGETALL、HKEYS、HVALS、HLEN、HEXISTS、HDEL、HINCRBY等
### List命令
LPUSH、RPUSH、LPOP、RPOP、LLEN、LRANGE、LTRIM、LINDEX、LSET、LREM等
### Set命令
SADD、SMEMBERS、SREM、SPOP、SCARD、SISMEMBER、SINTER、SUNION、SDIFF等
### ZSet命令
ZADD、ZRANGE、ZREVRANGE、ZRANGEBYSCORE、ZREVRANGEBYSCORE、ZCARD、ZCOUNT、ZSCORE、ZINCRBY、ZREM等
### Key命令
DEL、EXISTS、EXPIRE、PEXPIRE、TTL、PTTL、PERSIST、TYPE、RENAME、RENAMENX、SORT等
### 事务命令
MULTI、EXEC、DISCARD、WATCH、UNWATCH等
### 连接命令
PING、AUTH、SELECT等

## 常见问题
### Q: Redisson客户端不生效？
A: 请确认Redisson版本在3.x以上，并且 `lt.plugin.redis.enable` 配置为 `true`。

### Q: 如何过滤不需要采集的Key前缀？
A: 可以通过配置Key前缀黑名单：
```properties
lt.plugin.redis.exclude.prefixes=temp:,test:,ignore:
```
