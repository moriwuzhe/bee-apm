# Bee-APM 插件测试用例

## 测试环境要求
- JDK 8+
- Maven 3.6+
- Docker & Docker Compose（用于启动中间件测试环境）

## 测试分类
### 1. 单元测试
- 测试各个插件的字节码拦截逻辑
- 测试参数解析、标签生成逻辑
- 测试边界条件和异常场景
- 无需外部中间件环境

### 2. 集成测试
- 测试插件在真实中间件环境下的埋点效果
- 测试跨进程链路追踪上下文透传
- 测试性能损耗和资源占用
- 需要Docker启动对应的中间件环境

## 测试框架
- JUnit 5 作为测试框架
- Mockito 用于Mock依赖
- ByteBuddy Agent 用于测试字节码拦截
- TestContainers 用于启动Docker中间件容器

## 运行测试
### 单元测试
```bash
cd bee-apm
mvn test -Dtest=unit
```

### 集成测试
```bash
# 先启动测试需要的中间件
cd bee-apm/test/docker
docker-compose up -d

# 运行集成测试
cd bee-apm
mvn test -Dtest=integration
```

### 单个插件测试
```bash
# 只运行Dubbo插件测试
mvn test -Dtest=DubboPluginTest

# 只运行Redis插件测试
mvn test -Dtest=RedisPluginTest
```

## 测试覆盖率要求
- 核心插件代码覆盖率 >= 80%
- 工具类代码覆盖率 >= 90%
- 异常场景覆盖率 100%

## 插件测试列表
| 插件名称 | 单元测试 | 集成测试 | 测试优先级 |
|---------|---------|---------|----------|
| Dubbo | ✅ | ✅ | P0 |
| Redis | ✅ | ✅ | P0 |
| Kafka | ✅ | ✅ | P0 |
| JDBC | ✅ | ✅ | P0 |
| Sentinel | ✅ | ✅ | P1 |
| Seata | ✅ | ✅ | P1 |
| Nacos | ✅ | ✅ | P1 |
| Apollo | ✅ | ✅ | P2 |
| XXL-Job | ✅ | ✅ | P2 |
| Feign | ✅ | ✅ | P0 |
| RocketMQ | ✅ | ✅ | P1 |
| RabbitMQ | ✅ | ✅ | P2 |
| MongoDB | ✅ | ✅ | P2 |
| Elasticsearch | ✅ | ✅ | P2 |
| Hystrix | ✅ | ✅ | P2 |
| Resilience4j | ✅ | ✅ | P2 |
| Sharding-JDBC | ✅ | ✅ | P2 |
| Spring Cloud Gateway | ✅ | ✅ | P1 |
