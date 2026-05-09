# LT Agent 插件测试项目

## 项目简介

本项目用于测试 `lt-agent-plugin` 目录下的所有插件功能。通过集成各种中间件客户端和框架,验证Agent插件的拦截和监控能力。

## 测试的插件列表

### 已实现的插件测试 (27个)

1. **lt-agent-plugin-jdbc** - JDBC数据库操作监控
2. **lt-agent-plugin-redis** - Redis客户端操作监控 (Jedis 3.x)
3. **lt-agent-plugin-httpclient3x** - Apache HttpClient 3.x 监控
4. **lt-agent-plugin-httpclient4x** - Apache HttpClient 4.x 监控
5. **lt-agent-plugin-okhttp3x** - OkHttp 3.x 监控
6. **lt-agent-plugin-jdkhttp** - JDK HttpURLConnection 监控
7. **lt-agent-plugin-logger** - 日志框架监控
8. **lt-agent-plugin-process** - 自定义业务方法监控
9. **lt-agent-plugin-thread** - 线程和线程池监控
10. **lt-agent-plugin-kafka** - Kafka消息队列监控
11. **lt-agent-plugin-rabbitmq** - RabbitMQ消息队列监控
12. **lt-agent-plugin-dubbo** - Dubbo RPC框架监控
13. **lt-agent-plugin-feign** - Feign声明式HTTP客户端监控
14. **lt-agent-plugin-elasticsearch** - Elasticsearch搜索引擎监控
15. **lt-agent-plugin-mongodb** - MongoDB数据库监控
16. **lt-agent-plugin-sentinel** - Sentinel流量控制监控
17. **lt-agent-plugin-seata** - Seata分布式事务监控
18. **lt-agent-plugin-hystrix** - Hystrix熔断器监控
19. **lt-agent-plugin-resilience4j** - Resilience4j容错框架监控
20. **lt-agent-plugin-nacos** - Nacos配置中心监控
21. **lt-agent-plugin-apollo** - Apollo配置中心监控
22. **lt-agent-plugin-xxljob** - XXL-JOB分布式任务调度监控
23. **lt-agent-plugin-shardingjdbc** - ShardingSphere分库分表监控
24. **lt-agent-plugin-gateway** - Spring Cloud Gateway网关监控
25. **lt-agent-plugin-springtx** - Spring事务监控
26. **lt-agent-plugin-servlet** - Servlet容器监控
27. **lt-agent-plugin-mongodb** - MongoDB数据库监控

## 快速开始

### 1. 编译项目

```bash
cd /Users/jp/hub_git/bee-apm
mvn clean package -DskipTests
```

### 2. 启动测试应用

#### 方式一: 使用Maven启动
```bash
cd lt-monitor-agent-test/lt-agent-plugin-test
mvn spring-boot:run
```

#### 方式二: 使用Java命令启动(带Agent)
```bash
java -javaagent:/path/to/lt-agent-bootstrap.jar \
     -Dlt.agent.application.name=plugin-test \
     -Dlt.agent.collector.server=http://localhost:8080 \
     -jar target/lt-agent-plugin-test.jar
```

### 3. 运行测试

应用启动后,访问以下API进行测试:

#### 测试所有插件
```bash
curl -X POST http://localhost:8088/api/plugin-test/test-all
```

#### 单独测试各个插件
```bash
# 测试JDBC插件
curl -X POST http://localhost:8088/api/plugin-test/test-jdbc

# 测试Redis插件
curl -X POST http://localhost:8088/api/plugin-test/test-redis

# 测试HTTP客户端插件
curl -X POST http://localhost:8088/api/plugin-test/test-http

# 测试消息队列插件
curl -X POST http://localhost:8088/api/plugin-test/test-mq

# 测试Logger插件
curl -X POST http://localhost:8088/api/plugin-test/test-logger

# 测试MongoDB插件
curl -X POST http://localhost:8088/api/plugin-test/test-mongodb

# 测试Elasticsearch插件
curl -X POST http://localhost:8088/api/plugin-test/test-es

# 测试Dubbo插件
curl -X POST http://localhost:8088/api/plugin-test/test-dubbo

# 测试Feign插件
curl -X POST http://localhost:8088/api/plugin-test/test-feign

# 测试配置中心插件
curl -X POST http://localhost:8088/api/plugin-test/test-config

# 测试熔断限流插件
curl -X POST http://localhost:8088/api/plugin-test/test-resilience
```

## 项目结构

```
lt-agent-plugin-test/
├── src/main/java/org/xi/lt/plugin/test/
│   ├── PluginTestApplication.java          # 应用启动类
│   ├── controller/
│   │   └── PluginTestController.java       # 测试控制器
│   └── service/
│       └── PluginTestService.java          # 测试服务实现
├── src/main/resources/
│   └── application.yml                     # 应用配置
└── pom.xml                                 # Maven配置
```

## 配置说明

### Agent配置

在启动时通过 `-D` 参数配置:

```properties
-Dlt.agent.application.name=plugin-test      # 应用名称
-Dlt.agent.collector.server=http://localhost:8080  # 采集服务器地址
-Dlt.agent.plugins.jdbc.enable=true          # 启用JDBC插件
-Dlt.agent.plugins.redis.enable=true         # 启用Redis插件
```

### 应用配置

在 `application.yml` 中配置各插件的开关:

```yaml
lt:
  agent:
    plugins:
      jdbc:
        enable: true
        enableParam: true
        spend: -1
      redis:
        enable: true
      # ... 其他插件配置
```

## 测试说明

### 自动测试的插件

以下插件在应用启动和API调用时会自动触发:

1. **Servlet插件** - Spring Boot内嵌Tomcat自动触发
2. **JDBC插件** - 通过H2数据库操作触发
3. **Logger插件** - 通过SLF4J日志输出触发
4. **Thread插件** - 通过创建线程和线程池触发
5. **Process插件** - 通过业务方法调用触发

### 需要外部依赖的插件

以下插件需要相应的中间件服务运行:

- **Redis插件** - 需要Redis服务器 (localhost:6379)
- **Kafka插件** - 需要Kafka服务器 (localhost:9092)
- **RabbitMQ插件** - 需要RabbitMQ服务器 (localhost:5672)
- **Elasticsearch插件** - 需要ES服务器 (localhost:9200)
- **MongoDB插件** - 需要MongoDB服务器 (localhost:27017)
- **Dubbo插件** - 需要Dubbo注册中心
- **Nacos插件** - 需要Nacos服务器
- **Apollo插件** - 需要Apollo配置中心

> 注意: 如果这些服务未运行,相关测试会跳过并记录警告日志。

## 验证插件是否生效

### 1. 查看Agent日志

检查Agent日志目录,确认插件加载成功:

```bash
tail -f packages/logs/lt-agent.log
```

应该看到类似输出:
```
[INFO] Load plugin: jdbc
[INFO] Load plugin: redis
[INFO] Load plugin: okhttp3x
...
```

### 2. 查看采集数据

登录LT Monitor控制台,查看:
- 调用链路追踪
- 数据库操作监控
- HTTP请求监控
- 缓存操作监控
- 消息队列监控

### 3. 查看应用日志

应用会输出测试日志:

```bash
tail -f logs/lt-agent-plugin-test.log
```

## 添加新的插件测试

如果需要测试新的插件,按以下步骤:

1. 在 `pom.xml` 中添加对应的依赖
2. 在 `PluginTestService` 中添加测试方法
3. 在 `PluginTestController` 中添加API接口
4. 在 `application.yml` 中配置插件开关

## 注意事项

1. **端口占用**: 默认使用8088端口,如被占用请修改 `application.yml`
2. **内存配置**: 建议分配至少512MB堆内存
3. **JDK版本**: 需要JDK 1.8或以上版本
4. **Agent版本**: 确保使用与项目匹配的Agent版本

## 故障排查

### 插件未加载

1. 检查Agent路径是否正确
2. 检查插件jar文件是否在 `packages/plugins` 目录
3. 查看Agent日志确认加载情况

### 测试无数据

1. 确认采集服务器地址配置正确
2. 确认网络连通性
3. 检查采集服务器是否正常运行

### 依赖冲突

1. 检查Maven依赖树: `mvn dependency:tree`
2. 排除冲突的依赖版本
3. 使用统一的版本管理

## 技术支持

如有问题,请参考:
- [LT Monitor文档](../README.md)
- [Agent插件开发指南](../../lt-agent/README.md)

## 许可证

本项目遵循与主项目相同的许可证。
