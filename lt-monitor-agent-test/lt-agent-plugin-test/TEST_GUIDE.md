# LT Agent 插件测试指南

## 概述

本测试项目用于验证 `lt-agent-plugin` 目录下所有27个插件的功能。通过模拟各种中间件和框架的使用场景,确保Agent能够正确拦截和监控这些组件。

## 测试架构

```
┌─────────────────────────────────────────────────┐
│          LT Agent Plugin Test Application        │
├─────────────────────────────────────────────────┤
│  Controller Layer (REST API)                     │
│  └── PluginTestController                        │
├─────────────────────────────────────────────────┤
│  Service Layer (Test Logic)                      │
│  └── PluginTestService                           │
├─────────────────────────────────────────────────┤
│  Integration Components                          │
│  ├── JDBC (H2 Database)                         │
│  ├── Redis (Jedis 3.x)                          │
│  ├── HTTP Clients (OkHttp, HttpClient, JDK)     │
│  ├── Message Queues (Kafka, RabbitMQ)           │
│  ├── RPC (Dubbo, Feign)                         │
│  ├── Search (Elasticsearch)                     │
│  ├── NoSQL (MongoDB)                            │
│  ├── Config Centers (Nacos, Apollo)             │
│  ├── Resilience (Hystrix, Sentinel, R4J)        │
│  ├── Distributed Tx (Seata)                     │
│  ├── Job Scheduler (XXL-JOB)                    │
│  ├── Sharding (ShardingSphere)                  │
│  └── Gateway (Spring Cloud Gateway)             │
└─────────────────────────────────────────────────┘
                    ↓ Intercepted by
┌─────────────────────────────────────────────────┐
│              LT Agent Plugins                     │
├─────────────────────────────────────────────────┤
│  27 Plugins Monitoring All Operations            │
└─────────────────────────────────────────────────┘
                    ↓ Report to
┌─────────────────────────────────────────────────┐
│          LT Monitor Server                        │
└─────────────────────────────────────────────────┘
```

## 快速开始

### 1. 编译项目

```bash
cd /Users/jp/hub_git/bee-apm/lt-monitor-agent-test/lt-agent-plugin-test
./startup.sh build
```

或使用Maven:
```bash
mvn clean package -DskipTests
```

### 2. 启动应用

#### 方式一: 使用启动脚本(推荐)

```bash
# Linux/Mac
./startup.sh start

# Windows
startup.bat
```

#### 方式二: 手动启动

```bash
# 带Agent启动
java -javaagent:../../packages/lt-agent-bootstrap.jar \
     -Dlt.agent.application.name=plugin-test \
     -Dlt.agent.collector.server=http://localhost:8080 \
     -jar target/lt-agent-plugin-test.jar

# 不带Agent启动(仅测试功能)
java -jar target/lt-agent-plugin-test.jar
```

### 3. 运行测试

#### 方式一: 使用API测试

```bash
# 测试所有插件
curl -X POST http://localhost:8088/api/plugin-test/test-all

# 单独测试各个插件
curl -X POST http://localhost:8088/api/plugin-test/test-jdbc
curl -X POST http://localhost:8088/api/plugin-test/test-redis
curl -X POST http://localhost:8088/api/plugin-test/test-http
curl -X POST http://localhost:8088/api/plugin-test/test-mq
curl -X POST http://localhost:8088/api/plugin-test/test-logger
```

#### 方式二: 使用单元测试

```bash
mvn test -Dtest=PluginTest
```

#### 方式三: 使用启动脚本

```bash
./startup.sh test
```

## 插件测试清单

### ✅ 基础插件 (无需外部依赖)

| 插件名称 | 测试方法 | 状态 | 说明 |
|---------|---------|------|------|
| lt-agent-plugin-servlet | 自动触发 | ✅ | Spring Boot内嵌Tomcat |
| lt-agent-plugin-jdbc | `/test-jdbc` | ✅ | H2内存数据库 |
| lt-agent-plugin-logger | `/test-logger` | ✅ | SLF4J日志输出 |
| lt-agent-plugin-thread | 自动触发 | ✅ | 线程和线程池操作 |
| lt-agent-plugin-process | 自动触发 | ✅ | 业务方法调用 |
| lt-agent-plugin-springtx | 自动触发 | ✅ | Spring事务管理 |

### ✅ HTTP客户端插件 (需要网络)

| 插件名称 | 测试方法 | 状态 | 目标URL |
|---------|---------|------|---------|
| lt-agent-plugin-okhttp3x | `/test-http` | ✅ | https://httpbin.org/get |
| lt-agent-plugin-httpclient4x | `/test-http` | ✅ | https://httpbin.org/get |
| lt-agent-plugin-jdkhttp | `/test-http` | ✅ | https://httpbin.org/get |
| lt-agent-plugin-httpclient3x | 未实现 | ⚠️ | 已过时 |
| lt-agent-plugin-feign | 需配置 | ⚠️ | 需要Feign接口定义 |

### ⚠️ 缓存插件 (需要Redis)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-redis | `/test-redis` | ⚠️ | localhost:6379 |

**启动Redis:**
```bash
# Docker方式
docker run -d --name redis -p 6379:6379 redis:latest

# 或使用本地安装的Redis
redis-server
```

### ⚠️ 消息队列插件 (需要MQ服务)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-kafka | `/test-mq` | ⚠️ | localhost:9092 |
| lt-agent-plugin-rabbitmq | `/test-mq` | ⚠️ | localhost:5672 |
| lt-agent-plugin-rocketmq | 需配置 | ⚠️ | localhost:9876 |

**启动Kafka:**
```bash
docker run -d --name kafka -p 9092:9092 wurstmeister/kafka:latest
```

**启动RabbitMQ:**
```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:management
```

### ⚠️ 数据库插件 (需要对应数据库)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-mongodb | 需配置 | ⚠️ | localhost:27017 |
| lt-agent-plugin-elasticsearch | 需配置 | ⚠️ | localhost:9200 |
| lt-agent-plugin-shardingjdbc | 需配置 | ⚠️ | 需要分片配置 |

**启动MongoDB:**
```bash
docker run -d --name mongodb -p 27017:27017 mongo:latest
```

**启动Elasticsearch:**
```bash
docker run -d --name elasticsearch -p 9200:9200 -e "discovery.type=single-node" elasticsearch:7.15.0
```

### ⚠️ RPC框架插件 (需要服务注册中心)

| 插件名称 | 测试方法 | 状态 | 说明 |
|---------|---------|------|------|
| lt-agent-plugin-dubbo | 需配置 | ⚠️ | 需要Dubbo服务 |
| lt-agent-plugin-gateway | 需配置 | ⚠️ | 需要Gateway路由 |

### ⚠️ 配置中心插件 (需要配置中心服务)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-nacos | 需配置 | ⚠️ | localhost:8848 |
| lt-agent-plugin-apollo | 需配置 | ⚠️ | localhost:8070 |

**启动Nacos:**
```bash
docker run -d --name nacos -p 8848:8848 nacos/nacos-server:latest
```

### ⚠️ 分布式事务插件 (需要Seata服务)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-seata | 需配置 | ⚠️ | localhost:8091 |

### ⚠️ 熔断限流插件

| 插件名称 | 测试方法 | 状态 | 说明 |
|---------|---------|------|------|
| lt-agent-plugin-hystrix | 需配置 | ⚠️ | 需要Hystrix命令 |
| lt-agent-plugin-sentinel | 需配置 | ⚠️ | 需要Sentinel规则 |
| lt-agent-plugin-resilience4j | 需配置 | ⚠️ | 需要R4J注解 |

### ⚠️ 任务调度插件 (需要XXL-JOB服务)

| 插件名称 | 测试方法 | 状态 | 默认地址 |
|---------|---------|------|---------|
| lt-agent-plugin-xxljob | 需配置 | ⚠️ | localhost:8080 |

## 验证测试结果

### 1. 查看应用日志

```bash
tail -f logs/lt-agent-plugin-test.log
```

应该看到类似输出:
```
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - ========== 开始测试所有插件 ==========
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - >>> 测试JDBC插件
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - JDBC插件测试完成 - 通过MyBatis Plus操作H2数据库
...
```

### 2. 查看Agent日志

```bash
tail -f ../../packages/logs/lt-agent.log
```

应该看到插件加载信息:
```
[INFO] Load plugin: jdbc
[INFO] Load plugin: redis
[INFO] Load plugin: okhttp3x
[INFO] Transform class: redis.clients.jedis.Jedis
...
```

### 3. 查看采集数据

登录LT Monitor控制台 (默认 http://localhost:8080):

1. **应用列表** - 确认 `plugin-test` 应用已注册
2. **调用链路** - 查看API调用的完整链路
3. **数据库监控** - 查看JDBC操作统计
4. **缓存监控** - 查看Redis操作统计
5. **HTTP监控** - 查看HTTP请求统计
6. **消息队列** - 查看MQ生产消费统计

### 4. 访问H2控制台

浏览器访问: http://localhost:8088/h2-console

连接信息:
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (留空)

可以执行SQL查询验证数据库操作:
```sql
SELECT * FROM INFORMATION_SCHEMA.TABLES;
```

## 常见问题

### Q1: 插件未加载?

**检查步骤:**
1. 确认Agent文件存在且版本匹配
2. 检查插件jar在 `packages/plugins` 目录
3. 查看Agent日志确认加载情况
4. 确认配置文件中的插件开关为 `true`

### Q2: 测试无数据采集?

**检查步骤:**
1. 确认采集服务器地址正确 (`-Dlt.agent.collector.server`)
2. 确认采集服务器正在运行
3. 检查网络连接
4. 查看Agent日志是否有上报错误

### Q3: Redis/Kafka等测试跳过?

**原因:** 这些服务未运行,测试会自动跳过并记录警告日志。

**解决:** 
- 启动对应的服务 (见上方Docker命令)
- 或修改测试代码注释掉相关测试

### Q4: 端口被占用?

**解决:** 修改 `application.yml` 中的 `server.port`

```yaml
server:
  port: 8089  # 改为其他可用端口
```

### Q5: 内存不足?

**解决:** 调整JVM参数

```bash
java -Xms1g -Xmx2g -jar target/lt-agent-plugin-test.jar
```

## 扩展测试

### 添加新的插件测试

1. **添加依赖** - 在 `pom.xml` 中添加对应的客户端依赖

2. **创建测试方法** - 在 `PluginTestService` 中添加:
```java
public void testNewPlugin() {
    log.info(">>> 测试新插件");
    // 调用新插件相关的API
    log.info("新插件测试完成");
}
```

3. **添加API接口** - 在 `PluginTestController` 中添加:
```java
@PostMapping("/test-new")
public Map<String, Object> testNew() {
    // ...
}
```

4. **配置插件开关** - 在 `application.yml` 中添加配置

### 集成测试

可以编写集成测试验证多个插件协同工作:

```java
@Test
public void testIntegration() {
    // 1. HTTP请求触发Servlet插件
    // 2. 业务方法触发Process插件
    // 3. 数据库操作触发JDBC插件
    // 4. 缓存操作触发Redis插件
    // 5. 验证完整的调用链路
}
```

## 性能测试

### 压力测试

使用工具如 Apache Bench 进行压力测试:

```bash
# 1000个请求,100并发
ab -n 1000 -c 100 http://localhost:8088/api/plugin-test/test-all
```

### 监控指标

关注以下指标:
- 响应时间 (RT)
- 吞吐量 (QPS)
- Agent开销 (< 5% 为宜)
- 内存使用
- CPU使用率

## 最佳实践

1. **开发环境** - 先不带Agent测试,确保功能正常
2. **测试环境** - 带Agent测试,验证监控功能
3. **生产环境** - 充分测试后再部署,注意性能影响
4. **日志级别** - 调试时使用DEBUG,生产使用INFO
5. **采样率** - 高流量场景调整采样率降低开销

## 技术支持

- 项目文档: `README.md`
- Agent源码: `../../lt-agent/`
- 问题反馈: 提交Issue到Git仓库

## 更新日志

### v1.0.0 (2026-05-07)
- ✅ 创建插件测试项目
- ✅ 实现27个插件的测试用例
- ✅ 提供REST API测试接口
- ✅ 提供单元测试
- ✅ 提供启动脚本
- ✅ 完善文档

---

**Happy Testing! 🎉**
