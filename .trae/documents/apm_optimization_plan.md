# APM 线上调试与前端展示优化计划

## 1. 现状分析 (Current State)
目前 APM 项目已具备基于 Elasticsearch 的历史请求存储（流量录制）和基于 ByteBuddy 的动态字节码注入（`debugAdd`, `debugDump`）能力。在后端 `RequestReplayService` 中也实现了流量回放逻辑。

**存在的问题：**
1. **前端交互初级**：当前 `DiagnosticView.vue` 采用全表单和折叠面板的聚合方式，操作门槛高，缺乏主流 APM 产品（如 Datadog, SkyWalking, ARMS）中直观的沉浸式调试体验和可视化链路呈现。
2. **生产安全隐患**：现有的“回放 Debug”默认将重放流量打回原始生产节点，这可能导致真实数据库或下游服务产生脏数据，违背了“不影响正常生产业务”的原则。

## 2. 优化目标 (Goals)
1. **前端样式升级（主流 APM 风格）**：打造专业的“线上调试工作台”，提供请求检索、断点配置和变量快照的可视化视图，实现所见即所得。
2. **无损线上 Debug（业务隔离）**：利用录制的流量回放到**隔离的依赖节点**（影子节点或测试节点），在不触碰实时生产请求的前提下，完成代码级堆栈和局部变量的抓取。

## 3. 具体实施步骤 (Proposed Changes)

### 阶段一：前端交互与展示样式优化 (主流 APM 风格)
- **步骤 1：重构“线上调试”工作台视图 (Online Debug Workspace)**
  - **文件**：新建 `lt-ui/bee-apm-ui-web/src/ui/views/OnlineDebugView.vue`。
  - **左侧面板 (流量集)**：列表化展示从 ES 拉取的历史请求快照（支持按耗时、接口、时间过滤），支持一键选中作为回放数据源。
  - **中间面板 (观测点配置)**：提供更友好的类名、方法名级联输入界面（未来可演进为代码结构树），直观配置 `ENTER / EXIT / THROW` 观测点和参数过滤条件。
  - **右侧/底侧面板 (堆栈与变量快照)**：引入结构化的树状组件或高级 JSON Viewer 展示 `debugDump` 返回的调用栈深度、入参、出参及方法耗时，彻底替代现有的纯文本 `textarea` 弹窗。

- **步骤 2：调试生命周期可视化**
  - **文件**：`OnlineDebugView.vue` / 现有回放逻辑。
  - **改造**：引入步骤条 (Steps 组件)，将原本黑盒的 `下发调试探针 -> 目标节点流量回放 -> 抓取变量快照 -> 自动清理探针` 过程可视化，让开发者清晰掌握每一步的执行状态。

### 阶段二：后端与回放隔离机制增强 (无损流量回放)
- **步骤 3：回放目标节点智能路由 (Target Node Selection)**
  - **文件**：`lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diag/web/ReplayDebugController.java` 及前端交互。
  - **改造**：废弃“默认回放到原始生产节点”的危险逻辑。在前端工作台强制要求用户在应用实例列表中，手动选择一个**非生产/隔离节点**（如 `staging` 实例、带 `shadow` 标签的实例）作为 `replayTargetBaseUrl`，确保流量打入安全区。

- **步骤 4：回放流量染色与标识 (Traffic Tagging)**
  - **文件**：`lt-server-apm/server-web/src/main/java/org/xi/lt/server/web/diag/replay/RequestReplayService.java`。
  - **改造**：在发起 `OkHttp` 回放请求时，统一注入特殊的 HTTP Header（例如 `X-APM-Replay-Traffic: true`），作为流量染色的标记，方便下游节点识别这是一次重放流量。

- **步骤 5 (进阶建议，按需实现)：Agent 级别写保护 (Mock Isolation)**
  - 针对接收回放流量的节点，若其仍连接着核心数据库，可以在 Agent 层增加拦截策略：识别到染色的回放流量头时，自动拦截或 Mock 掉 JDBC Update、外部 RPC 调用，彻底阻断副作用。

### 阶段三：测试与验证 (Verification)
- **步骤 6：全链路功能验证**
  - 启动 `lt-monitor-test-demo` 的两个实例（实例 A 模拟生产产生流量，实例 B 模拟隔离节点接收回放）。
  - 在全新打造的前端工作台中检索实例 A 的请求，配置好调试点并一键回放至实例 B。
  - 验证：实例 B 成功执行重放，前端正确且美观地结构化展示了实例 B 的局部变量和调用栈，同时业务数据未被二次修改（隔离生效）。

## 4. 假设与前置条件 (Assumptions & Decisions)
- **业务环境配合**：假设用户的基础设施（如 K8s 或普通虚机集群）支持部署专门接收重放流量的隔离节点或影子节点。
- **技术栈一致性**：前端新增的工作台将严格遵循当前项目使用的 Vue 3 + TypeScript + Element Plus 技术栈。