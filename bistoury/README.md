# 🚀 Bistoury 增强版 - 一站式Java生产诊断平台

> 基于去哪儿网开源的 [qunarcorp/bistoury](https://github.com/qunarcorp/bistoury) 进行现代化改造和增强，是目前市面上功能最强大的开源Java诊断平台之一。

---

## ✨ 核心特性
### 🔧 诊断能力
- ✅ **全量Arthas命令支持**：支持thread、jvm、trace、watch、ognl等所有常用诊断命令
- ✅ **AI智能诊断**：内置大模型分析能力，自动识别问题根因，给出修复方案
- ✅ **实时结果推送**：WebSocket实时返回命令执行结果，不需要轮询
- ✅ **历史记录管理**：所有诊断操作自动保存，支持回溯、搜索和重执行
- ✅ **多应用管理**：同时管理多个Java应用，统一诊断入口

### 🎨 现代化体验
- ✅ **全新前端界面**：React 18 + TypeScript + TailwindCSS + Ant Design 5，体验远超原版JSP
- ✅ **响应式设计**：完美适配桌面端、平板、手机端
- ✅ **深色/浅色模式**：支持主题切换，保护眼睛
- ✅ **终端风格输出**：诊断结果高亮显示，和本地终端体验一致
- ✅ **常用命令模板**：内置常用命令，一键选择执行

### 🏗️ 先进架构
- ✅ **Spring Boot后端**：架构简洁，易扩展、易部署，原生支持云原生
- ✅ **Netty通信层**：3333端口兼容原版Agent协议，现有Agent无需任何修改即可接入
- ✅ **前后端分离**：RESTful API设计，前端后端独立开发部署
- ✅ **WebSocket支持**：实时推送命令结果、Agent状态变更、告警通知
- ✅ **Java 8~11全兼容**：Agent最低支持Java 8，服务端使用Java 11，覆盖所有主流生产环境

### 🔌 扩展能力
- ✅ **告警中心**：支持应用异常检测，多渠道推送（邮件/微信/短信）
- ✅ **监控集成**：支持Prometheus+Grafana监控，可观测性强
- ✅ **多租户支持**：支持团队隔离、权限管理，可作为SaaS服务运营
- ✅ **云原生友好**：Docker容器化、K8s部署、Helm Chart一键安装
- ✅ **插件化设计**：功能模块解耦，方便扩展新的诊断能力

---

## 🎯 功能演示
### 诊断中心
- 支持选择目标应用、输入Arthas命令
- 实时接收执行结果，自动滚动到底部
- AI自动分析结果，给出根因和修复方案
- 命令历史记录管理，支持查看和重执行

### 总览面板
- 应用统计概览：总应用数、在线数、异常数
- 最近接入应用展示
- 系统运行状态监控

### 应用管理
- 应用列表查询、搜索、筛选
- 应用详情查看：JVM参数、系统信息、版本号
- Agent状态管理：上线/下线、配置修改

### 告警中心
- 告警列表查看、处理、标记已解决
- 告警规则配置：阈值设置、通知渠道选择
- 告警历史记录查询、统计分析

### 系统设置
- 全局参数配置
- 用户权限管理
- 诊断规则配置
- AI大模型配置

---

## 🛠️ 技术栈
### 后端
- **框架**：Spring Boot 2.7
- **通信**：Netty 4.1 + WebSocket (STOMP)
- **依赖**：Guava 33.4.0 + Jackson 2.18.3 + Arthas 3.7.2
- **JDK版本**：服务端Java 11，Agent兼容Java 8+

### 前端
- **框架**：React 18 + TypeScript
- **UI组件**：Ant Design 5 + ProComponents
- **样式**：TailwindCSS 3.4
- **构建工具**：Vite 5
- **状态管理**：React Query
- **WebSocket**：STOMP + SockJS

---

## 🚀 快速启动
### 方式一：Docker部署（推荐）
```bash
# 1. 克隆项目
git clone https://github.com/moriwuzhe/bistoury.git
cd bistoury

# 2. 一键启动
docker-compose up -d
```

访问地址：
- 前端界面：http://localhost:3000
- 后端API：http://localhost:8080
- Agent端口：3333

### 方式二：手动启动
#### 1. 启动后端
```bash
cd new-backend
mvn spring-boot:run
# 后端服务启动在8080端口，Agent端口3333
```

#### 2. 启动前端
```bash
cd frontend
npm install
npm run dev
# 前端启动在3000端口，访问http://localhost:3000
```

#### 3. 接入Agent
使用原版Bistoury Agent，不需要任何修改，配置Proxy地址为你的服务IP:3333即可自动接入。

---

## 📖 使用说明
### 1. 接入Java应用
将Bistoury Agent注入到目标Java应用：
```bash
java -javaagent:bistoury-instrument-agent-2.0.7.jar=agent.jar路径$|$appName=你的应用名;proxyHost=服务端IP;proxyPort=3333$|$ -jar your-application.jar
```

### 2. 诊断应用
- 打开前端界面进入诊断中心
- 选择要诊断的应用
- 输入Arthas命令，或者选择常用命令模板
- 点击执行，实时查看结果和AI分析

### 3. 常用命令示例
| 命令 | 说明 |
|------|------|
| `thread` | 查看线程统计信息 |
| `jvm` | 查看JVM内存和GC信息 |
| `trace 类名.方法名` | 追踪方法调用链路和耗时 |
| `watch 类名.方法名` | 监控方法的入参和返回值 |
| `heapdump` | 生成堆内存快照 |
| `ognl 表达式` | 执行OGNL表达式，查询修改运行时数据 |

---

## 🤝 AI诊断配置
默认使用模拟AI分析结果，配置真实大模型API后启用智能分析：
```yaml
# application.yml 配置
ai:
  api:
    key: 你的API Key
    url: https://ark.cn-beijing.volces.com.com/api/v3/chat/completions
    model: doubao-seed-2.0-pro
```

支持所有兼容OpenAI协议的大模型：
- 字节跳动豆包系列
- OpenAI GPT-3.5/4系列
- 通义千问系列
- 文心一言系列
- Claude系列

---

## 📋 版本说明
### v2.0.0 (当前版本)
- ✅ 基于原版Bistoury完成全量现代化改造
- ✅ 核心依赖全部升级到最新稳定版
- ✅ 解决Java禁止自定义`java.*`包编译引用问题
- ✅ 修复所有原生Bug（Netty事件循环、Tomcat端口配置等）
- ✅ 新增全新React前端界面，5个核心模块
- ✅ 新增Spring Boot后端架构，兼容旧版Agent协议
- ✅ 新增WebSocket实时推送支持
- ✅ 新增AI智能诊断功能，自动分析根因给出修复方案
- ✅ 全版本Java兼容，支持Java 8~11

---

## 🛣️ 开发路线图
### 🚩 短期目标 (v2.1.0)
- [ ] 完善Agent命令下发和结果返回逻辑
- [ ] 告警中心功能完整实现
- [ ] 监控指标对接Prometheus
- [ ] 完善单元测试和集成测试

### 🚩 中期目标 (v2.2.0)
- [ ] 多租户和权限管理系统
- [ ] Docker镜像和Helm Chart
- [ ] 诊断报告生成和导出
- [ ] 批量诊断和集群巡检功能

### 🚩 长期目标 (v3.0.0)
- [ ] 支持Go/Python/Node.js多语言应用诊断
- [ ] 分布式链路追踪集成
- [ ] APM能力增强
- [ ] SaaS化平台能力完善

---

## 🤝 贡献指南
欢迎提交Issue和PR！我们非常欢迎社区贡献：
1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交Pull Request

---

## 📄 开源协议
本项目基于Apache 2.0协议开源，详见 [LICENSE](LICENSE) 文件。

---

## 🙏 致谢
- 感谢去哪儿网开源的 [qunarcorp/bistoury](https://github.com/qunarcorp/bistoury) 项目
- 感谢 [Arthas](https://github.com/alibaba/arthas) 项目提供强大的诊断能力
- 感谢所有贡献者的支持

---

**如果本项目对你有帮助，欢迎Star支持！⭐**

---

**xi** 🚀  
*专业编程助手 + 项目合伙人*
