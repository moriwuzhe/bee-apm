# LT Agent Plugin Test - 文件清单

## 项目文件总览

### 📁 核心代码文件 (4个)

| 文件路径 | 类型 | 说明 | 行数 |
|---------|------|------|------|
| `src/main/java/org/xi/lt/plugin/test/PluginTestApplication.java` | Java | Spring Boot应用启动类 | 17 |
| `src/main/java/org/xi/lt/plugin/test/controller/PluginTestController.java` | Java | REST API控制器 (6个接口) | 125 |
| `src/main/java/org/xi/lt/plugin/test/service/PluginTestService.java` | Java | 测试服务实现 (10+方法) | 257 |
| `src/test/java/org/xi/lt/plugin/test/PluginTest.java` | Java | 单元测试类 (6个测试) | 90 |

**代码总计**: ~489行Java代码

### 📄 配置文件 (2个)

| 文件路径 | 类型 | 说明 |
|---------|------|------|
| `pom.xml` | Maven | 项目依赖和构建配置 (235行) |
| `src/main/resources/application.yml` | YAML | 应用配置 (112行) |

### 🔧 脚本文件 (3个)

| 文件路径 | 平台 | 权限 | 说明 |
|---------|------|------|------|
| `startup.sh` | Linux/Mac | ✅ 可执行 | 完整功能启动脚本 (225行) |
| `startup.bat` | Windows | - | 交互式菜单启动脚本 (139行) |
| `quick-test.sh` | Linux/Mac | ✅ 可执行 | 快速测试脚本 (81行) |

### 📚 文档文件 (5个)

| 文件路径 | 类型 | 说明 | 行数 |
|---------|------|------|------|
| `README.md` | Markdown | 项目说明文档 | 243 |
| `TEST_GUIDE.md` | Markdown | 详细测试指南 | 412 |
| `QUICK_START.md` | Markdown | 快速开始指南 | 179 |
| `ARCHITECTURE.md` | Markdown | 系统架构文档 | 380 |
| `PROJECT_SUMMARY.md` | Markdown | 项目完成总结 | 367 |

**文档总计**: ~1,581行Markdown文档

## 文件统计

```
总文件数: 14个
├── Java源文件:     4个  (~489行代码)
├── 配置文件:       2个  (~347行配置)
├── 脚本文件:       3个  (~445行脚本)
└── 文档文件:       5个  (~1,581行文档)

总计: ~2,862行
```

## 目录结构

```
lt-agent-plugin-test/
│
├── 📄 pom.xml                              [Maven配置]
├── 🔧 startup.sh                           [Linux/Mac启动脚本] ⭐
├── 🔧 startup.bat                          [Windows启动脚本]
├── 🔧 quick-test.sh                        [快速测试脚本] ⭐
│
├── 📚 README.md                            [项目说明] ⭐
├── 📚 TEST_GUIDE.md                        [测试指南]
├── 📚 QUICK_START.md                       [快速开始] ⭐
├── 📚 ARCHITECTURE.md                      [架构文档]
├── 📚 PROJECT_SUMMARY.md                   [项目总结]
│
└── src/
    ├── main/
    │   ├── java/org/xi/lt/plugin/test/
    │   │   ├── 📄 PluginTestApplication.java          [启动类] ⭐
    │   │   ├── controller/
    │   │   │   └── 📄 PluginTestController.java       [REST控制器] ⭐
    │   │   └── service/
    │   │       └── 📄 PluginTestService.java          [测试服务] ⭐
    │   │
    │   └── resources/
    │       └── 📄 application.yml                     [应用配置] ⭐
    │
    └── test/
        └── java/org/xi/lt/plugin/test/
            └── 📄 PluginTest.java                     [单元测试] ⭐
```

⭐ = 关键文件

## 功能映射

### REST API接口 → Service方法

| API端点 | Service方法 | 测试的插件 |
|--------|------------|-----------|
| `/api/plugin-test/test-all` | `testAllPlugins()` | 所有插件 |
| `/api/plugin-test/test-jdbc` | `testJdbcPlugin()` | JDBC插件 |
| `/api/plugin-test/test-redis` | `testRedisPlugin()` | Redis插件 |
| `/api/plugin-test/test-http` | `testHttpClientPlugins()` | OkHttp3x, HttpClient4x, JDK Http |
| `/api/plugin-test/test-mq` | `testMQPlugins()` | Kafka, RabbitMQ |
| `/api/plugin-test/test-logger` | `testLoggerPlugin()` | Logger插件 |

### Service方法 → 具体实现

```
PluginTestService
├── testAllPlugins()
│   ├── testJdbcPlugin()         → MyBatis + H2操作
│   ├── testRedisPlugin()        → Jedis操作 (需Redis)
│   ├── testHttpClientPlugins()
│   │   ├── testOkHttp3x()       → OkHttp请求
│   │   ├── testHttpClient4x()   → Apache HttpClient请求
│   │   └── testJdkHttp()        → HttpURLConnection
│   ├── testMQPlugins()
│   │   ├── testKafkaPlugin()    → Kafka Producer (需Kafka)
│   │   └── testRabbitMQPlugin() → RabbitMQ Connection (需RabbitMQ)
│   ├── testLoggerPlugin()       → SLF4J日志输出
│   ├── testThreadPlugin()       → Thread + ExecutorService
│   └── testProcessPlugin()      → businessMethod()调用
```

### 单元测试 → 测试场景

| 测试方法 | 测试内容 | 需要外部服务 |
|---------|---------|-------------|
| `testJdbcPlugin()` | JDBC数据库操作 | ❌ 否 (H2内存) |
| `testLoggerPlugin()` | 日志框架输出 | ❌ 否 |
| `testHttpClientPlugins()` | HTTP客户端请求 | ❌ 否 (需网络) |
| `testThreadPlugin()` | 线程和线程池 | ❌ 否 |
| `testProcessPlugin()` | 业务方法拦截 | ❌ 否 |
| `testAllBasicPlugins()` | 综合测试 | ❌ 否 |

## 依赖组件清单

### 已集成的中间件/框架 (27个)

#### 数据库 (4个)
1. H2 Database - 内存数据库 ✅
2. MyBatis Plus - ORM框架 ✅
3. MongoDB Driver - NoSQL数据库 ⚠️
4. ShardingSphere - 分库分表 ⚠️

#### 缓存 (1个)
5. Jedis - Redis客户端 ⚠️

#### HTTP客户端 (4个)
6. OkHttp 3.x ✅
7. Apache HttpClient 4.x ✅
8. JDK HttpURLConnection ✅
9. OpenFeign ⚠️

#### 消息队列 (3个)
10. Kafka Clients ⚠️
11. RabbitMQ AMQP ⚠️
12. RocketMQ ⚠️

#### RPC框架 (2个)
13. Apache Dubbo ⚠️
14. Spring Cloud Gateway ⚠️

#### 搜索引擎 (1个)
15. Elasticsearch Client ⚠️

#### 配置中心 (2个)
16. Alibaba Nacos ⚠️
17. Ctrip Apollo ⚠️

#### 熔断限流 (3个)
18. Netflix Hystrix ⚠️
19. Alibaba Sentinel ⚠️
20. Resilience4j ⚠️

#### 分布式事务 (1个)
21. Seata ⚠️

#### 任务调度 (1个)
22. XXL-JOB ⚠️

#### 基础设施 (5个)
23. Servlet容器 ✅
24. SLF4J + Log4j2 ✅
25. Thread/ThreadPool ✅
26. Process/Business Method ✅
27. Spring Transaction ✅

✅ = 可直接测试  
⚠️ = 需要外部服务

## 使用场景

### 场景1: 开发调试
```bash
# 1. 编译
./startup.sh build

# 2. 不带Agent启动 (快速调试)
./startup.sh start-no

# 3. 访问H2控制台
open http://localhost:8088/h2-console
```

### 场景2: Agent测试
```bash
# 1. 确保Agent已编译
cd ../../..
mvn clean package -DskipTests

# 2. 带Agent启动
cd lt-monitor-agent-test/lt-agent-plugin-test
./startup.sh start

# 3. 运行测试
./quick-test.sh

# 4. 查看Agent日志
tail -f ../../packages/logs/lt-agent.log
```

### 场景3: 自动化测试
```bash
# 运行单元测试
mvn test

# 或指定测试类
mvn test -Dtest=PluginTest
```

### 场景4: 性能测试
```bash
# 使用Apache Bench
ab -n 1000 -c 100 http://localhost:8088/api/plugin-test/test-all

# 或使用JMeter
# 导入JMX脚本 (需创建)
```

## 维护指南

### 添加新插件测试

1. **在pom.xml中添加依赖**
```xml
<dependency>
    <groupId>xxx</groupId>
    <artifactId>yyy</artifactId>
    <version>z.z.z</version>
</dependency>
```

2. **在PluginTestService中添加测试方法**
```java
public void testNewPlugin() {
    log.info(">>> 测试新插件");
    // 测试代码
    log.info("新插件测试完成");
}
```

3. **在PluginTestController中添加API**
```java
@PostMapping("/test-new")
public Map<String, Object> testNew() {
    // ...
}
```

4. **在application.yml中配置**
```yaml
lt:
  agent:
    plugins:
      newplugin:
        enable: true
```

### 更新依赖版本

定期执行:
```bash
mvn versions:display-dependency-updates
```

然后更新pom.xml中的版本号。

### 文档维护

修改代码后,同步更新:
- README.md - 如有新功能
- TEST_GUIDE.md - 如有新测试方法
- QUICK_START.md - 如有流程变化
- ARCHITECTURE.md - 如有架构调整

## 版本历史

### v1.0.0 (2026-05-07)
- ✅ 初始版本发布
- ✅ 27个插件测试框架
- ✅ 6个REST API接口
- ✅ 6个单元测试
- ✅ 完整的文档体系
- ✅ 跨平台启动脚本

## 检查清单

部署前检查:
- [ ] Java 1.8+ 已安装
- [ ] Maven 3.x 已安装
- [ ] 端口8088可用
- [ ] Agent已编译 (如需带Agent测试)
- [ ] 外部服务已启动 (如需要)

测试前检查:
- [ ] 应用已启动
- [ ] 日志正常输出
- [ ] API可访问
- [ ] Agent日志正常 (如使用)

## 相关资源

- **项目位置**: `/Users/jp/hub_git/bee-apm/lt-monitor-agent-test/lt-agent-plugin-test`
- **Agent源码**: `/Users/jp/hub_git/bee-apm/lt-agent`
- **主项目**: `/Users/jp/hub_git/bee-apm`

---

**最后更新**: 2026-05-07  
**维护者**: LT Monitor Dev  
**版本**: 1.0.0
