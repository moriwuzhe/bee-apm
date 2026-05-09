# LT Agent Plugin Test - 架构图

## 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                     Test Client (curl/Postman)                   │
└────────────────────┬────────────────────────────────────────────┘
                     │ HTTP POST
                     ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Spring Boot Application (8088)                  │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              PluginTestController (REST API)              │  │
│  │  /api/plugin-test/test-all                               │  │
│  │  /api/plugin-test/test-jdbc                              │  │
│  │  /api/plugin-test/test-redis                             │  │
│  │  /api/plugin-test/test-http                              │  │
│  │  /api/plugin-test/test-mq                                │  │
│  │  /api/plugin-test/test-logger                            │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │              PluginTestService (Business Logic)          │  │
│  │  • testJdbcPlugin()      → H2 Database Operations        │  │
│  │  • testRedisPlugin()     → Jedis Redis Operations        │  │
│  │  • testHttpClientPlugins() → OkHttp/HttpClient/JDK Http  │  │
│  │  • testMQPlugins()       → Kafka/RabbitMQ Operations     │  │
│  │  • testLoggerPlugin()    → SLF4J Logging                 │  │
│  │  • testThreadPlugin()    → Thread/ThreadPool             │  │
│  │  • testProcessPlugin()   → Business Method Calls         │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                              │
└─────────────────┼──────────────────────────────────────────────┘
                  │ Method Invocations
                  ↓ (Intercepted by ByteBuddy)
┌─────────────────────────────────────────────────────────────────┐
│                    LT Agent (javaagent)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Agent Bootstrap & Core                       │  │
│  │  • Plugin Loader                                          │  │
│  │  • Class Transformer (ByteBuddy)                          │  │
│  │  • Trace Context Management                               │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │              Plugin Interceptors (27 Plugins)             │  │
│  │                                                           │  │
│  │  Database:                                                │  │
│  │    ├─ JDBC Plugin         → SQL Execution Monitor        │  │
│  │    ├─ MongoDB Plugin      → NoSQL Operations Monitor     │  │
│  │    ├─ Elasticsearch Plugin → Search Operations Monitor   │  │
│  │    └─ ShardingJDBC Plugin → Sharding Monitor             │  │
│  │                                                           │  │
│  │  Cache:                                                   │  │
│  │    └─ Redis Plugin        → Cache Operations Monitor     │  │
│  │                                                           │  │
│  │  HTTP Clients:                                            │  │
│  │    ├─ OkHttp3x Plugin     → OkHttp Requests Monitor      │  │
│  │    ├─ HttpClient4x Plugin → Apache HC Monitor            │  │
│  │    ├─ JDK Http Plugin     → HttpURLConnection Monitor    │  │
│  │    └─ Feign Plugin        → Declarative HTTP Monitor     │  │
│  │                                                           │  │
│  │  Message Queue:                                           │  │
│  │    ├─ Kafka Plugin        → Kafka Producer/Consumer      │  │
│  │    ├─ RabbitMQ Plugin     → RabbitMQ Operations          │  │
│  │    └─ RocketMQ Plugin     → RocketMQ Operations          │  │
│  │                                                           │  │
│  │  RPC Framework:                                           │  │
│  │    ├─ Dubbo Plugin        → Dubbo RPC Monitor            │  │
│  │    └─ Gateway Plugin      → API Gateway Monitor          │  │
│  │                                                           │  │
│  │  Config Center:                                           │  │
│  │    ├─ Nacos Plugin        → Nacos Config Monitor         │  │
│  │    └─ Apollo Plugin       → Apollo Config Monitor        │  │
│  │                                                           │  │
│  │  Resilience:                                              │  │
│  │    ├─ Hystrix Plugin      → Circuit Breaker Monitor      │  │
│  │    ├─ Sentinel Plugin     → Flow Control Monitor         │  │
│  │    └─ Resilience4j Plugin → Fault Tolerance Monitor      │  │
│  │                                                           │  │
│  │  Distributed Tx:                                          │  │
│  │    └─ Seata Plugin        → Distributed Transaction      │  │
│  │                                                           │  │
│  │  Job Scheduler:                                           │  │
│  │    └─ XXLJob Plugin       → Task Scheduling Monitor      │  │
│  │                                                           │  │
│  │  Infrastructure:                                          │  │
│  │    ├─ Servlet Plugin      → Web Container Monitor        │  │
│  │    ├─ Logger Plugin       → Logging Framework Monitor    │  │
│  │    ├─ Thread Plugin       → Thread/ThreadPool Monitor    │  │
│  │    ├─ Process Plugin      → Business Method Monitor      │  │
│  │    └─ SpringTx Plugin     → Transaction Monitor          │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │              Span Generation & Reporting                  │  │
│  │  • Create Trace Spans                                     │  │
│  │  • Collect Metrics                                        │  │
│  │  • Async Report to Server                                 │  │
│  └──────────────────────┬───────────────────────────────────┘  │
└─────────────────────────┼──────────────────────────────────────┘
                          │ HTTP/gRPC
                          ↓
┌─────────────────────────────────────────────────────────────────┐
│                   LT Monitor Server (8080)                       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Data Receiver & Storage                                  │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │  Analysis & Aggregation                                   │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                      │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │  Web UI Dashboard                                         │  │
│  │  • Application List                                       │  │
│  │  • Trace Details                                          │  │
│  │  • Performance Metrics                                    │  │
│  │  • Dependency Graph                                       │  │
│  │  • Alert & Notification                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## 插件拦截流程

```
User Request
     ↓
┌────────────────────────┐
│  Controller Method     │ ← Servlet Plugin intercepts
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  Service Method        │ ← Process Plugin intercepts
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  Database Query        │ ← JDBC Plugin intercepts
│  (MyBatis + H2)        │    - SQL statement
│                        │    - Parameters
│                        │    - Execution time
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  Cache Operation       │ ← Redis Plugin intercepts
│  (Jedis)               │    - Command type
│                        │    - Key/Value
│                        │    - Response time
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  HTTP Request          │ ← OkHttp/HttpClient Plugin intercepts
│  (OkHttp/HttpClient)   │    - URL
│                        │    - Method
│                        │    - Headers
│                        │    - Duration
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  MQ Message Send       │ ← Kafka/RabbitMQ Plugin intercepts
│  (Kafka/RabbitMQ)      │    - Topic/Queue
│                        │    - Message content
│                        │    - Latency
└──────────┬─────────────┘
           ↓
┌────────────────────────┐
│  Log Output            │ ← Logger Plugin intercepts
│  (SLF4J + Log4j2)      │    - Log level
│                        │    - Message
│                        │    - Location
└────────────────────────┘

All intercepted operations generate Spans
         ↓
    Trace Context
         ↓
   Async Report
         ↓
  Monitor Server
```

## 测试数据流

```
Test Script (quick-test.sh)
         ↓
   curl commands
         ↓
┌────────────────────┐
│  REST Controller   │
└────────┬───────────┘
         ↓
┌────────────────────┐
│  Test Service      │
└────────┬───────────┘
         ↓
┌────────────────────┐
│ Component Clients  │ → Triggers various plugins
└────────┬───────────┘
         ↓
┌────────────────────┐
│  Agent Plugins     │ → Intercept & Monitor
└────────┬───────────┘
         ↓
┌────────────────────┐
│  Span Reporter     │ → Send to server
└────────┬───────────┘
         ↓
┌────────────────────┐
│ Monitor Dashboard  │ → Visualize results
└────────────────────┘
```

## 依赖关系图

```
lt-agent-plugin-test
│
├── Spring Boot 2.0.1
│   ├── spring-boot-starter-web
│   └── spring-boot-starter-log4j2
│
├── Database
│   ├── MyBatis Plus 3.3.1
│   └── H2 Database
│
├── Cache
│   └── Jedis 3.6.3
│
├── HTTP Clients
│   ├── OkHttp 3.14.9
│   └── Apache HttpClient 4.5.13
│
├── Message Queue
│   ├── Kafka Clients 2.8.1
│   └── RabbitMQ AMQP 5.13.1
│
├── RPC
│   ├── Apache Dubbo 2.7.15
│   └── OpenFeign 11.8
│
├── Search & NoSQL
│   ├── Elasticsearch Client 7.15.0
│   └── MongoDB Driver 4.3.3
│
├── Resilience
│   ├── Hystrix 1.5.18
│   ├── Resilience4j 1.7.1
│   └── Sentinel 1.8.3
│
├── Config Center
│   ├── Nacos Client 2.0.3
│   └── Apollo Client 1.9.1
│
├── Distributed Tx
│   └── Seata 1.4.2
│
├── Job Scheduler
│   └── XXL-JOB 2.3.1
│
├── Sharding
│   └── ShardingSphere 4.1.1
│
├── Gateway
│   └── Spring Cloud Gateway 2.2.9
│
└── Common
    ├── FastJSON 1.2.68
    └── Commons Lang3 3.8
```

## 文件组织结构

```
lt-agent-plugin-test/
│
├── pom.xml                          # Maven dependencies & build config
│
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── org/xi/lt/plugin/test/
│   │   │       ├── PluginTestApplication.java    # Entry point
│   │   │       ├── controller/
│   │   │       │   └── PluginTestController.java # REST endpoints
│   │   │       └── service/
│   │   │           └── PluginTestService.java    # Test logic
│   │   │
│   │   └── resources/
│   │       └── application.yml       # App configuration
│   │
│   └── test/
│       └── java/
│           └── org/xi/lt/plugin/test/
│               └── PluginTest.java   # Unit tests
│
├── startup.sh                        # Linux/Mac launcher
├── startup.bat                       # Windows launcher
├── quick-test.sh                     # Quick test script
│
└── Documentation/
    ├── README.md                     # Project overview
    ├── TEST_GUIDE.md                 # Detailed testing guide
    ├── PROJECT_SUMMARY.md            # Completion summary
    └── ARCHITECTURE.md               # This file
```

## 关键设计模式

### 1. 插件化架构
```
AbstractPlugin (base)
    ├── JDBCPlugin
    ├── RedisPlugin
    ├── OkHttp3xPlugin
    └── ... (27 plugins)

Each plugin implements:
    - buildTypesMatcher()    → Which classes to intercept
    - buildMethodsMatcher()  → Which methods to intercept
    - interceptorAdviceClass() → Advice implementation
```

### 2. 拦截器模式
```
@Advice.OnMethodEnter()
    ↓
Before Handler (create span, start timing)
    ↓
Original Method Execution
    ↓
@Advice.OnMethodExit()
    ↓
After Handler (end span, collect metrics, report)
```

### 3. 上下文传递
```
TraceContext (ThreadLocal)
    ├── traceId
    ├── spanId
    ├── parentSpanId
    └── sampling decision

Propagated across:
    - Thread boundaries (Thread Plugin)
    - HTTP requests (HTTP Plugins)
    - RPC calls (Dubbo/Feign Plugins)
    - MQ messages (Kafka/RabbitMQ Plugins)
```

## 性能考虑

```
Agent Overhead:
    ├─ Class Loading: ~100ms per plugin
    ├─ Method Interception: < 1μs per call
    ├─ Span Creation: ~5μs
    ├─ Context Propagation: ~2μs
    └─ Async Reporting: Background thread

Total overhead: Typically < 5% of application performance

Optimization strategies:
    ├─ Sampling (configurable rate)
    ├─ Async reporting (non-blocking)
    ├─ Batch sending (reduce network calls)
    └─ Smart filtering (skip low-value spans)
```

---

**Created**: 2026-05-07  
**Version**: 1.0.0
