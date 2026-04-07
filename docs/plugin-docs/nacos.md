# Nacos插件使用文档

## 支持版本
- Nacos 1.x
- Nacos 2.x
- 支持配置中心和服务注册发现两大功能

## 功能说明
Nacos插件支持配置中心和服务注册发现全场景的链路追踪：
- 采集配置拉取、配置变更、灰度发布事件
- 记录服务注册、注销、发现、订阅事件
- 统计配置拉取耗时、失败原因、变更次数
- 支持Nacos 2.x的gRPC通信协议
- 支持多环境、多命名空间

## 配置参数
| 参数名称 | 默认值 | 说明 |
|---------|--------|------|
| lt.plugin.nacos.enable | true | 是否开启Nacos插件 |
| lt.plugin.nacos.collect.config.content | false | 是否采集配置内容（默认关闭，避免敏感信息泄露） |
| lt.plugin.nacos.collect.instance.info | true | 是否采集服务实例信息 |
| lt.plugin.nacos.config.max_length | 500 | 配置内容截断长度 |

## 埋点标签
### 配置中心事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `config` |
| action | 操作类型：`get_property` / `load_config` / `change` / `add_listener` / `remove_listener` |
| data_id | 配置Data ID |
| group | 配置Group |
| namespace | 命名空间ID |
| content_length | 配置内容长度 |
| status | 操作状态：`success` / `failed` |
| error_msg | 失败原因 |
| changed_keys | 配置变更时的变更Key列表（多个用逗号分隔） |
| changed_count | 配置变更的Key数量 |

### 服务注册发现事件标签
| 标签名称 | 说明 |
|---------|------|
| type | 固定为 `service` |
| action | 操作类型：`register` / `deregister` / `discovery` / `subscribe` / `unsubscribe` |
| service_name | 服务名称 |
| group | 服务分组 |
| namespace | 命名空间ID |
| instance_count | 服务发现返回的实例数量 |
| instance_ip | 注册/注销的实例IP |
| instance_port | 注册/注销的实例端口 |
| status | 操作状态：`success` / `failed` |
| error_msg | 失败原因 |

## 使用示例
### 1. 接入方式
无需修改业务代码，只需要在JVM启动参数中添加Agent即可，Nacos插件会自动识别配置中心和服务注册发现的操作并生效。

### 2. 开启配置内容采集（谨慎开启）
```properties
lt.plugin.nacos.collect.config.content=true
```
开启后会采集配置内容，标签格式为：
| 标签名称 | 说明 |
|---------|------|
| content | 配置内容（会自动截断） |

> ⚠️ **安全警告**：配置通常包含数据库密码、密钥等敏感信息，开启配置内容采集可能导致敏感信息泄露，非必要场景请勿开启！

### 3. 关闭实例信息采集
如果不需要采集服务实例的具体IP和端口信息，可以关闭：
```properties
lt.plugin.nacos.collect.instance.info=false
```
关闭后 `instance_ip` 和 `instance_port` 标签将不会被采集。

## 功能支持列表
### 配置中心功能
✅ 配置拉取（getConfig、getConfigInner等）  
✅ 配置监听（addListener、removeListener）  
✅ 配置变更通知（配置推送）  
✅ 配置本地缓存加载  
✅ 灰度配置推送  
✅ 多命名空间支持

### 服务注册发现功能
✅ 服务注册（registerInstance）  
✅ 服务注销（deregisterInstance）  
✅ 服务发现（getAllInstances、selectInstances）  
✅ 服务订阅（subscribe、unsubscribe）  
✅ 服务心跳上报  
✅ 元数据获取

## 常见问题
### Q: Nacos 2.x gRPC协议支持吗？
A: 支持，Nacos 1.x的HTTP协议和2.x的gRPC协议都支持，插件会自动识别协议类型。

### Q: 会采集配置中的敏感信息吗？
A: 默认不会采集配置内容，只有手动开启 `lt.plugin.nacos.collect.config.content` 才会采集，生产环境建议保持默认关闭状态。

### Q: 如何过滤不需要采集的Data ID？
A: 可以通过配置Data ID黑名单：
```properties
lt.plugin.nacos.exclude.data_ids=*password*,*secret*,*key*
```
支持通配符 `*` 匹配，匹配到的Data ID配置操作不会上报。

### Q: 支持Nacos集群吗？
A: 支持，和Nacos部署模式无关，无论是单机、集群还是多地域部署都支持。
