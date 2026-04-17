# APM 系统功能测试指南

## 📋 前置条件

### 1. 启动依赖服务

```bash
# 启动 Elasticsearch（必需）
docker run -d \
  --name elasticsearch \
  -p 9200:9200 \
  -p 9300:9300 \
  -e "discovery.type=single-node" \
  -e "xpack.security.enabled=false" \
  elasticsearch:7.17.0

# 等待 ES 启动
sleep 15

# 验证 ES 是否启动成功
curl http://localhost:9200
```

### 2. 启动后端服务

```bash
cd /Users/jp/hub_git/bee-apm/lt-server-apm/lt-monitor-server-web
mvn spring-boot:run
```

**验证后端启动**：
```bash
curl http://localhost:8081/api/diag/agent/version/detail
```

应该返回：
```json
{
  "code": "0",
  "msg": "成功",
  "result": [...]
}
```

### 3. 启动前端服务

```bash
cd /Users/jp/hub_git/bee-apm/lt-server-apm/lt-apm-ui-web
npm run dev
```

访问：http://localhost:5173

### 4. 启动测试应用（可选，用于生成数据）

```bash
cd /Users/jp/hub_git/bee-apm/test-demo
./start.sh
```

---

## 🧪 功能测试清单

### ✅ 1. Agent 管理 - 配置数据反显

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/agent
   - 进入"Agent管理"页面

2. **保存应用配置**
   - 找到任意一个 Agent
   - 点击"应用配置"按钮
   - 在文本框中输入配置内容，例如：
     ```
     logging.level=DEBUG
     sampling.rate=100
     ```
   - 点击"确认更新"
   - 应该看到提示："配置更新成功"

3. **验证配置反显**
   - 刷新页面（F5）
   - 再次点击同一个 Agent 的"应用配置"
   - **预期结果**：文本框中应该显示之前保存的配置内容
   - 不应该显示空文本框

4. **测试实例配置**
   - 点击"实例配置"按钮
   - 输入不同的配置内容
   - 保存后刷新页面
   - 再次打开，验证配置是否正确显示

#### 验证要点：
- ✅ 打开配置对话框时显示"加载中..."
- ✅ 配置内容正确显示
- ✅ 保存后刷新页面，配置仍然存在
- ✅ 不同 Agent 的配置互不影响

---

### ✅ 2. 实时监控 - 历史趋势图

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/agent-monitor
   - 进入"实时监控"页面

2. **选择 Agent**
   - 在下拉框中选择一个 Agent
   - 系统应该自动开始数据采集

3. **观察数据采集**
   - 打开浏览器控制台（F12 → Console）
   - 应该看到类似日志：
     ```
     [Monitor] IndexedDB initialized successfully
     [Monitor] Loaded 1 agents
     [Monitor] Auto-selected agent: order@dev@test01@127.0.0.1:8081
     [Monitor] Saved metrics for order@dev@test01@127.0.0.1:8081, heap: 1%, threads: 38
     ```

4. **等待数据积累**
   - 等待 2-3 分钟（系统每 10 秒采集一次）
   - 应该看到多条 "Saved metrics" 日志

5. **查看趋势图**
   - 向下滚动页面
   - 应该看到两个图表：
     - **堆内存趋势（最近1小时）**
     - **线程数趋势（最近1小时）**
   - 图表应该有曲线显示

6. **调试数据**
   - 点击"调试数据"按钮
   - 查看控制台输出：
     ```
     === IndexedDB 调试信息 ===
     Agent ID: order@dev@test01@127.0.0.1:8081
     查询范围: 2026-04-17 xx:xx:xx - 2026-04-17 xx:xx:xx
     记录数量: 12
     第一条记录: {...}
     最后一条记录: {...}
     ```

#### 验证要点：
- ✅ IndexedDB 初始化成功
- ✅ 数据采集日志正常输出
- ✅ 2-3 分钟后图表显示曲线
- ✅ 点击"调试数据"能看到记录数量 > 0
- ✅ 图表支持鼠标悬停查看详细数据

---

### ✅ 3. 智能告警

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/alert
   - 进入"智能告警"页面

2. **查看告警列表**
   - 如果 Elasticsearch 中有告警数据，应该显示列表
   - 如果没有数据，显示空列表是正常的

3. **筛选告警**
   - 选择应用名
   - 调整"最近条数"
   - 点击"刷新"按钮

4. **导出 Excel**
   - 如果有数据，点击"导出Excel"按钮
   - 应该下载一个 .xlsx 文件

#### 验证要点：
- ✅ 页面能正常加载
- ✅ 不报 JavaScript 错误
- ✅ 可以筛选和刷新

---

### ✅ 4. Agent 告警

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/alert-management
   - 进入"Agent告警"页面

2. **查看告警规则**
   - 应该能看到告警规则列表
   - 可以添加、编辑、删除规则

#### 验证要点：
- ✅ 页面能正常加载
- ✅ 功能按钮可点击

---

### ✅ 5. 项目管理

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/project
   - 进入"项目管理"页面

2. **创建项目**
   - 点击"新建项目"
   - 填写项目信息
   - 保存

3. **验证数据持久化**
   - 刷新页面
   - 项目应该仍然存在

#### 验证要点：
- ✅ 可以创建项目
- ✅ 数据保存在 H2 数据库中
- ✅ 刷新后数据不丢失（在同一会话中）

---

### ✅ 6. 应用管理

#### 测试步骤：

1. **访问页面**
   - 打开浏览器访问：http://localhost:5173/application
   - 进入"应用管理"页面

2. **创建应用**
   - 点击"新建应用"
   - 填写应用信息
   - 关联项目
   - 保存

3. **查看运行实例**
   - 点击应用的"运行实例"
   - 应该能看到该应用的 Agent 实例

#### 验证要点：
- ✅ 可以创建应用
- ✅ 可以查看运行实例
- ✅ 应用和实例关联正确

---

## 🔍 问题排查

### 问题 1：配置反显不工作

**症状**：打开配置对话框时文本框为空

**排查步骤**：
1. 打开浏览器控制台（F12）
2. 查看 Network 标签
3. 点击"应用配置"
4. 检查是否有请求发送到 `/api/agent/config/get`
5. 查看响应内容

**可能原因**：
- 后端服务未启动
- API 路径错误
- 数据库中没有配置数据

**解决方案**：
```bash
# 检查后端是否运行
curl http://localhost:8081/api/agent/config/get?app=test

# 查看后端日志
tail -f lt-server-apm/lt-monitor-server-web/backend.log
```

---

### 问题 2：历史趋势图不显示

**症状**：图表区域空白或没有曲线

**排查步骤**：
1. 打开浏览器控制台（F12 → Console）
2. 查看是否有错误日志
3. 点击"调试数据"按钮
4. 检查记录数量

**可能原因**：
- IndexedDB 初始化失败
- Agent 未连接
- 数据采集间隔太短

**解决方案**：
```javascript
// 在控制台执行
indexedDB.databases().then(dbs => console.log('Databases:', dbs))
// 应该看到: [{name: "lt-agent-monitor", version: 1}]

// 手动触发数据采集
location.reload()
// 重复 3-5 次
```

---

### 问题 3：告警页面空白

**症状**：告警列表为空或页面报错

**排查步骤**：
1. 检查 Elasticsearch 是否运行
   ```bash
   curl http://localhost:9200
   ```
2. 查看浏览器控制台错误
3. 检查 Network 标签中的 API 请求

**可能原因**：
- Elasticsearch 未启动
- ES 中没有告警数据（正常）
- API 路径错误

**解决方案**：
```bash
# 启动 Elasticsearch
docker start elasticsearch

# 检查 ES 索引
curl http://localhost:9200/_cat/indices?v
```

---

## 📊 预期效果总结

| 功能模块 | 状态 | 说明 |
|---------|------|------|
| **配置数据反显** | ✅ | 从后端加载，刷新后仍存在 |
| **历史趋势图** | ✅ | 2-3 分钟后显示曲线 |
| **智能告警** | ✅ | 页面可用（可能需要数据） |
| **Agent告警** | ✅ | 页面可用 |
| **项目管理** | ✅ | H2 数据库存储 |
| **应用管理** | ✅ | H2 数据库存储 |
| **实时监控** | ✅ | 需要 Agent 连接 |
| **插件管理** | ✅ | H2 数据库存储 |

---

## 🚀 快速测试脚本

```bash
#!/bin/bash

echo "=== APM 系统快速测试 ==="
echo ""

# 1. 检查 ES
echo "1. 检查 Elasticsearch..."
if curl -s http://localhost:9200 > /dev/null; then
    echo "   ✅ ES 正在运行"
else
    echo "   ❌ ES 未运行"
    exit 1
fi

# 2. 检查后端
echo "2. 检查后端服务..."
if curl -s http://localhost:8081/api/diag/agent/version/detail > /dev/null; then
    echo "   ✅ 后端正在运行"
else
    echo "   ❌ 后端未运行"
    exit 1
fi

# 3. 检查 Agent
echo "3. 检查 Agent 连接..."
AGENTS=$(curl -s http://localhost:8081/api/diag/agent/version/detail | python3 -c "import sys, json; print(len(json.load(sys.stdin)['result']))")
echo "   ✅ 已连接 $AGENTS 个 Agent"

# 4. 测试配置 API
echo "4. 测试配置 API..."
RESPONSE=$(curl -s http://localhost:8081/api/agent/config/get?app=test)
if echo $RESPONSE | grep -q "success"; then
    echo "   ✅ 配置 API 正常"
else
    echo "   ⚠️  配置 API 异常"
fi

echo ""
echo "=== 测试完成！==="
echo ""
echo "请访问以下地址进行测试："
echo "  - Agent管理: http://localhost:5173/agent"
echo "  - 实时监控: http://localhost:5173/agent-monitor"
echo "  - 智能告警: http://localhost:5173/alert"
echo ""
```

保存为 `test-apm.sh`，然后运行：
```bash
chmod +x test-apm.sh
./test-apm.sh
```

---

## 💡 使用建议

1. **首次使用**
   - 先启动所有依赖服务
   - 等待后端完全启动（约 30 秒）
   - 刷新浏览器加载最新代码

2. **测试配置反显**
   - 保存配置后务必刷新页面
   - 验证配置是否正确显示

3. **测试历史趋势图**
   - 至少等待 2-3 分钟
   - 使用"调试数据"按钮验证数据采集
   - 查看控制台日志确认

4. **遇到问题**
   - 首先查看浏览器控制台
   - 检查 Network 标签的 API 请求
   - 查看后端日志

---

## 📞 技术支持

如果遇到问题，请提供：
1. 浏览器控制台的错误日志
2. Network 标签中失败的请求
3. 后端日志的相关部分
4. 具体的操作步骤和预期结果

祝测试顺利！🎉
