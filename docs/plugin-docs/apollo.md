# Apollo配置中心插件使用文档

## 支持版本
- Apollo 1.x
- Apollo 2.x
- 支持开放平台、灰度发布、多环境等所有特性

## 功能说明
Apollo插件支持配置中心全场景的链路追踪：
- 采集配置拉取、配置变更、灰度发布事件
- 记录配置监听、配置同步、缓存加载事件
- 统计配置拉取耗时、失败原因、变更次数
- 支持多环境、多集群、多命名空间
- 支持配置加密场景

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.apollo.enable | true | 是否开启Apollo插件 |
| lt.plugin.apollo.collect.config.content | false | 是否采集配置内容（默认关闭，避免敏感信息泄露） |
| lt.plugin.apollo.collect.change.detail | true | 是否采集配置变更详情 |
| lt.plugin.apollo.config.max_length | 500 | 配置内容截断长度 |

## 埋点标签
### 配置操作事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `config` |
| action | 操作类型：`get_property` / `load_config` / `fetch_config` / `sync` / `change` |
| app_id | 应用AppId |
| namespace | 命名空间名称（默认application） |
| env | 环境：DEV、FAT、UAT、PRO等 |
| cluster | 集群名称 |
| key | 配置Key（查询单个配置时） |
| status | 操作状态：`success` / `failed` |
| error_msg | 失败原因 |
| cache_hit | 是否命中本地缓存：`true` / `false` |
| source | 配置来源：`remote` / `local_cache` / `backup_file` |

### 配置变更事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `config_change` |
| app_id | 应用AppId |
| namespace | 命名空间名称 |
| env | 环境 |
| cluster | 集群名称 |
| changed_keys_count | 变更的Key数量 |
| changed_keys | 变更的Key列表（最多显示10个，超过显示前N个加...） |
| release_key | 发布Key |
| gray | 是否灰度发布：`true` / `false` |
| gray_rule | 灰度规则（IP、标签等） |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Apollo插件会自动生效。无论是通过Spring Boot集成还是API方式使用Apollo，都无需额外配置。

### 2. 开启配置内容采集（谨慎开启）
```properties
lt.plugin.apollo.collect.config.content=true
```
开启后会采集配置内容，标签格式为：
| 标签名称 | 说明 |
|---------|------|
| content | 配置内容（会自动截断） |
| value | 单个Key查询时的Value值 |

> ⚠️ **安全警告**：配置通常包含数据库密码、密钥、Token等敏感信息，开启配置内容采集可能导致敏感信息泄露，生产环境建议保持默认关闭状态！

### 3. 关闭变更详情采集
如果不需要采集具体变更的Key列表，可以关闭：
```properties
lt.plugin.apollo.collect.change.detail=false
```
关闭后只会上报变更数量，不会上报具体的变更Key。

## 功能支持列表
✅ 配置查询（getProperty、getIntProperty等各种类型查询）  
✅ 全量配置拉取（getConfig、loadApolloConfig）  
✅ 配置监听（addChangeListener、removeChangeListener）  
✅ 配置变更通知（服务端推送的配置变更）  
✅ 本地配置加载（本地缓存、备份文件）  
✅ 灰度发布配置推送  
✅ 多环境、多集群、多命名空间支持  
✅ 配置加密（加密内容不会被采集，保持密文状态）  
✅ 开放API调用支持

## 常见问题
### Q: 会采集加密配置的明文吗？
A: 不会，插件采集的是Apollo客户端返回的内容，如果配置在Apollo中是加密的，客户端返回的就是密文，插件只会采集到密文，不会泄露明文。

### Q: 支持Apollo的各种客户端集成方式吗？
A: 支持所有集成方式：
1. Spring Boot Starter集成
2. 原生API方式使用
3. 第三方框架集成
4. 自定义配置加载

### Q: 如何过滤不需要采集的Key？
A: 可以通过配置Key黑名单：
```properties
lt.plugin.apollo.exclude.keys=*password*,*secret*,*token*,*key*
```
支持通配符 `*` 匹配，匹配到的Key操作不会上报。

### Q: 对Apollo客户端性能有影响吗？
A: 插件只在配置操作的前后插入埋点逻辑，没有额外的IO操作，对性能的影响极小，几乎可以忽略不计。
