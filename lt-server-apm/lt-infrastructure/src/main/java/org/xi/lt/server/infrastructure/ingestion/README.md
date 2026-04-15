# Stream 基础设施层

## 📁 目录说明

本目录包含数据流接收和处理相关的组件。

```
stream/
├── LtStreamController.java       # HTTP 数据接收端点
├── ServletStreamProvider.java    # Servlet 流提供者（插件）
└── IndexCleanupTask.java         # 定时数据清理任务
```

## 🎯 职责

**核心职责：** 接收 Agent 上报的监控数据流，并触发处理流程

## 📊 各文件说明

### **1. LtStreamController.java**

**类型：** Spring MVC Controller  
**路径：** `/stream`  
**方法：** POST  
**功能：** 接收 Agent 上报的数据

**工作流程：**
```
Agent → POST /stream → LtStreamController 
                     → HandlerFactory.executeFirstHandler()
                     → StoreStreamHandler.save()
                     → UnifiedDataStore.save()
```

**示例请求：**
```bash
curl -X POST http://localhost:7001/stream \
  -H "Content-Type: application/json" \
  -d '{"type":"span","app":"my-app","spend":100,...}'
```

⚠️ **注意：** 这是一个 Web Controller，理论上应该放在 `web` 层，但目前位于 infrastructure 层是为了简化部署。

---

### **2. ServletStreamProvider.java**

**类型：** Stream Provider 插件  
**注解：** `@LtPlugin(type = "STREAM", name = "servlet")`  
**功能：** 提供基于 Servlet 的数据流接入能力

**作用：**
- 扩展点：可以添加其他类型的流提供者（如 Netty、gRPC）
- 当前实现：仅记录日志，实际工作由 LtStreamController 完成

**扩展示例：**
```java
@LtPlugin(type = "STREAM", name = "netty")
public class NettyStreamProvider extends AbstractStreamProvider {
    @Override
    public void start() {
        // 启动 Netty 服务器监听数据
    }
}
```

---

### **3. IndexCleanupTask.java** ⭐ 已优化

**类型：** Spring 定时任务  
**执行时间：** 每天凌晨 3:00  
**功能：** 清理过期的监控数据

**配置项：**
```yaml
lt:
  store:
    retention:
      days: 30  # 保留天数，默认 7 天
```

**工作流程：**
```
定时触发 → IndexCleanupTask.cleanupOldData()
         → StorageManager.getUnifiedStore()
         → UnifiedDataStore.clean(retentionDays)
         → 具体存储实现清理逻辑
```

✅ **已优化：** 使用新的 `StorageManager` 和 `UnifiedDataStore` API

---

## 🔄 数据流完整链路

```
┌─────────────┐
│   Agent     │ 采集应用监控数据
└──────┬──────┘
       │ HTTP POST
       ▼
┌──────────────────┐
│ LtStreamController│ 接收数据 (/stream)
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ HandlerFactory    │ 责任链模式处理
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ StoreStreamHandler│ 存储处理器
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ StorageManager    │ 统一存储管理器
└──────┬───────────┘
       │
       ▼
┌──────────────────┐
│ UnifiedDataStore  │ 统一数据接口
└──────┬───────────┘
       │
       ├──────────────┬──────────────┐
       ▼              ▼              ▼
  ┌────────┐   ┌────────┐   ┌──────────┐
  │ ES     │   │ H2     │   │ MySQL    │
  │Adapter │   │Adapter │   │ Adapter  │
  └────────┘   └────────┘   └──────────┘
```

---

## 🚀 最佳实践

### **1. 数据接收优化**

**批量上报：**
```java
// Agent 端应该批量发送数据，而不是逐条发送
POST /stream
[
  {"type":"span", ...},
  {"type":"span", ...},
  {"type":"log", ...}
]
```

**异步处理：**
```java
// Controller 中可以考虑异步处理
@RequestMapping("/stream")
@ResponseBody
public CompletableFuture<String> stream(@RequestBody String body) {
    return CompletableFuture.runAsync(() -> {
        HandlerFactory.getInstance().executeFirstHandler(new Stream(body));
    }).thenApply(v -> "ok");
}
```

### **2. 错误处理**

```java
// 当前实现返回简单的 ok/fail
// 建议增强为详细的响应
{
  "code": 200,
  "message": "success",
  "data": {
    "received": 100,
    "saved": 98,
    "errors": 2
  }
}
```

### **3. 限流保护**

```java
// 防止海量数据冲击
@Component
public class StreamRateLimiter {
    private final RateLimiter rateLimiter = RateLimiter.create(1000); // 1000 QPS
    
    public boolean tryAcquire() {
        return rateLimiter.tryAcquire();
    }
}
```

---

## ⚠️ 注意事项

### **1. Controller 位置问题**

**现状：** `LtStreamController` 位于 infrastructure 层  
**问题：** 违反了分层架构原则  
**建议：** 
- 短期：保持现状（简化部署）
- 长期：移动到 `lt-monitor-server-web` 模块

### **2. 定时任务配置**

**当前 cron：** `0 0 3 * * ?` （每天凌晨 3 点）  
**调整方法：**
```yaml
# 可以在配置文件中覆盖
spring.task.scheduling.cron.cleanup=0 0 4 * * ?
```

### **3. 清理策略**

**ES：** 删除整个索引（高效）  
**MySQL/H2：** 需要执行 DELETE SQL（较慢）  

**优化建议：**
- MySQL 使用分区表
- 按日期分区，直接 DROP PARTITION

---

## 🔧 扩展开发

### **添加新的流提供者**

1. **继承 AbstractStreamProvider**
```java
@LtPlugin(type = "STREAM", name = "grpc")
public class GrpcStreamProvider extends AbstractStreamProvider {
    @Override
    public void start() {
        // 启动 gRPC 服务
    }
}
```

2. **注册到配置文件**
```
# lt-stream.def
grpc=org.xi.lt.server.infrastructure.stream.GrpcStreamProvider
```

3. **配置启用**
```yaml
lt:
  stream:
    provider: grpc
```

---

## 📝 相关配置

```yaml
# 数据流配置
lt:
  # 流提供者类型
  stream:
    provider: servlet
  
  # 数据存储配置
  store:
    name: elasticsearch-adapter
    retention:
      days: 30  # 清理任务使用
  
  # 处理器链
  handlers:
    flow: parse > validate > store
```

---

## 🔗 相关文档

- [Store README](../store/README.md) - 数据存储层
- [Handler Factory](../../lt-monitor-server-core/src/main/java/org/xi/lt/server/core/handler/HandlerFactory.java)
- [Storage Manager](../../lt-monitor-server-core/src/main/java/org/xi/lt/server/core/store/StorageManager.java)
