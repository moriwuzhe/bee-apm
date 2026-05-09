# LT Agent Plugin Test - 快速开始

## 5分钟快速上手

### 步骤1: 编译项目 (1分钟)

```bash
cd /Users/jp/hub_git/bee-apm/lt-monitor-agent-test/lt-agent-plugin-test
./startup.sh build
```

看到以下输出表示成功:
```
[INFO] BUILD SUCCESS
```

### 步骤2: 启动应用 (1分钟)

```bash
./startup.sh start
```

看到以下输出表示成功:
```
[INFO] 应用已启动
[INFO] 访问地址: http://localhost:8088
```

### 步骤3: 运行测试 (1分钟)

打开新终端,执行:

```bash
./quick-test.sh
```

或手动测试:

```bash
curl -X POST http://localhost:8088/api/plugin-test/test-all
```

期望响应:
```json
{
  "success": true,
  "message": "所有插件测试完成"
}
```

### 步骤4: 查看结果 (2分钟)

#### 查看应用日志
```bash
tail -f logs/lt-agent-plugin-test.log
```

应该看到:
```
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - ========== 开始测试所有插件 ==========
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - >>> 测试JDBC插件
2026-05-07 10:00:00 [main] INFO  o.x.l.p.t.s.PluginTestService - JDBC插件测试完成
...
```

#### 查看Agent日志 (如果带Agent启动)
```bash
tail -f ../../packages/logs/lt-agent.log
```

应该看到:
```
[INFO] Load plugin: jdbc
[INFO] Load plugin: logger
[INFO] Transform class: org.apache.ibatis.executor.statement.StatementHandler
...
```

#### 访问H2控制台
浏览器打开: http://localhost:8088/h2-console

连接信息:
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`
- Password: (留空)

## 常用测试命令

### 测试单个插件

```bash
# JDBC插件
curl -X POST http://localhost:8088/api/plugin-test/test-jdbc

# Logger插件
curl -X POST http://localhost:8088/api/plugin-test/test-logger

# HTTP客户端插件
curl -X POST http://localhost:8088/api/plugin-test/test-http

# Redis插件 (需要Redis服务)
curl -X POST http://localhost:8088/api/plugin-test/test-redis

# 消息队列插件 (需要MQ服务)
curl -X POST http://localhost:8088/api/plugin-test/test-mq

# MongoDB插件 (需要MongoDB服务)
curl -X POST http://localhost:8088/api/plugin-test/test-mongodb

# Elasticsearch插件 (需要ES服务)
curl -X POST http://localhost:8088/api/plugin-test/test-es

# Dubbo插件 (需要Dubbo服务)
curl -X POST http://localhost:8088/api/plugin-test/test-dubbo

# Feign插件
curl -X POST http://localhost:8088/api/plugin-test/test-feign

# 配置中心插件 (需要Nacos/Apollo)
curl -X POST http://localhost:8088/api/plugin-test/test-config

# 熔断限流插件
curl -X POST http://localhost:8088/api/plugin-test/test-resilience
```

### 使用Postman测试

1. 创建POST请求: `http://localhost:8088/api/plugin-test/test-all`
2. Headers: `Content-Type: application/json`
3. Body: (不需要)
4. 点击Send

### 使用单元测试

```bash
mvn test -Dtest=PluginTest#testAllBasicPlugins
```

## 常见问题

### Q: 端口8088被占用怎么办?

修改 `src/main/resources/application.yml`:
```yaml
server:
  port: 8089  # 改为其他端口
```

### Q: 如何不带Agent启动?

```bash
./startup.sh start-no
```

### Q: 如何停止应用?

```bash
./startup.sh stop
```

### Q: 如何重启应用?

```bash
./startup.sh restart
```

### Q: 想测试更多插件?

编辑 `application.yml`,启用更多插件:
```yaml
lt:
  agent:
    plugins:
      redis:
        enable: true
      kafka:
        enable: true
      # ... 其他插件
```

然后启动对应的服务 (Redis, Kafka等)。

## 下一步

- 📖 阅读 [README.md](README.md) 了解完整功能
- 📚 阅读 [TEST_GUIDE.md](TEST_GUIDE.md) 学习详细测试方法
- 🏗️ 阅读 [ARCHITECTURE.md](ARCHITECTURE.md) 理解系统架构
- 📊 查看 [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) 了解项目总结

## 需要帮助?

查看完整文档或提交Issue到Git仓库。

---

**Happy Testing!** 🚀
