# 使用测试工程生成准生产数据

目标：用 `lt-agent-test/bee-apm-sb-demo` 产生包含 HTTP/JDBC/日志/异常/链路互调 的 Span 数据，并通过 `/stream` Collector 写入 Elasticsearch 的 `bee-*` 按天索引，供 `lt-ui-old/bee-apm-ui-server` 查询展示。

## 1. 启动依赖（准生产或本地）

- Elasticsearch：建议 5.x/6.x/7.x（本仓库的写入实现仍使用 type，ES8 不适配）
- Collector：运行 `bee-stream-server`，对外提供 `POST /stream`

本地可以用仓库根目录的 `docker-compose.yml` 起 ES/ZK/Kafka（只造数时 Kafka/ZK 可不启）。

## 2. 启动 Collector（写入 ES）

Collector 模块：`lt-server-apm/server-stream/bee-stream-server`

- 默认端口：7001
- 默认 ES：`http://127.0.0.1:9200`
- 写入索引：`bee-<type>-yyyy.MM.dd`（type 到前缀映射见 `application.yml`）

示例（在模块目录执行）：

```bash
mvn -DskipTests package
java -jar target/bee-stream-server-1.0.0.jar
```

如需改 ES 地址或端口，修改该模块的 `src/main/resources/application.yml` 后重新打包。

## 3. 启动 Demo 自动造数（上报到 Collector）

脚本会：
- 生成一份临时 Agent 配置（YAML），设置 `reporter.serverUrl` 为 Collector 的 `/stream`
- 启动 demo，并开启内置压测线程持续请求入口接口，自动产生链路与异常

### Linux/macOS/Git Bash

```bash
cd lt-agent-test/bee-apm-sb-demo
bin/generate-preprod-data.sh http://127.0.0.1:7001/stream
```

可选环境变量：
- `BEE_APP` / `BEE_ENV` / `BEE_INST` / `SERVER_PORT`
- `LOAD_QPS` / `LOAD_THREADS` / `LOAD_DURATION_SECONDS`（0 表示一直跑）

### Windows PowerShell

```powershell
cd lt-agent-test/bee-apm-sb-demo
.\bin\generate-preprod-data.ps1 http://127.0.0.1:7001/stream
```

## 4. UI 侧指向准生产 ES

`lt-ui-old/bee-apm-ui-server/src/main/resources/application.yml`：
- `elasticsearch.url` 指向准生产 ES（例如 `http://es-preprod:9200`）

