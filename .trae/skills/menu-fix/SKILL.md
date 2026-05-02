---
name: "menu-fix"
description: "Fixes and completes frontend menu CRUD operations and backend API integration. Invoke when user reports menu functions not working or asks to fix/enhance menu functionality."
---

# 菜单功能修复技能

## 适用场景

当用户报告以下问题时，**立即**使用此技能：

1. 菜单点击无效果（URL不变化/页面不更新）
2. 增删改查功能失效（查看/编辑/删除/新增无效）
3. 前后端接口对接失败（API 500错误/前端数据不显示）
4. 需要完善某个菜单的完整CRUD功能
5. 用户要求"按项目管理菜单那样修复其他菜单"

---

## 修复流程（Checklist）

### Phase 1: 问题诊断（Diagnostic）

#### 1.1 检查前端页面功能
```bash
# 打开浏览器开发者工具(F12)
# 切换到Console标签
# 点击菜单，查看是否有输出日志
```

#### 1.2 检查网络请求
```bash
# 切换到Network标签
# 点击菜单操作（查看/编辑/删除）
# 检查：
#   - 请求是否发出？
#   - 请求方法和URL是否正确？
#   - 响应状态码（200/400/500/404）？
#   - 响应数据内容？
```

#### 1.3 检查后端服务状态
```bash
# 检查端口占用
netstat -ano | findstr "8081"

# 测试基础API
curl http://localhost:8081/api/projects
```

#### 1.4 检查前端控制台错误
```bash
# 查看浏览器控制台
# 常见错误类型：
#   - TypeError: Cannot read property 'xxx' of undefined
#   - CORS policy blocked
#   - 404 Not Found
#   - 500 Internal Server Error
```

---

### Phase 2: 前端修复（Frontend Fix）

#### 2.1 检查页面组件代码
```bash
# 读取页面文件
# 例如：src/pages/Projects.tsx

# 检查项：
# 1. 状态定义是否完整？
#    const [state, setState] = useState<Type | null>(null);
#
# 2. 处理函数是否定义？
#    const handleView = (item) => { /* ... */ };
#    const handleEdit = (item) => { /* ... */ };
#    const handleDelete = (id) => { /* ... */ };
#
# 3. 按钮是否绑定事件？
#    <Button onClick={() => handleView(item)}>查看</Button>
#
# 4. Modal弹窗是否正确渲染？
#    {showModal && (<Modal>...</Modal>)}
```

#### 2.2 常见前端问题修复

**问题1: 按钮没有绑定onClick**
```typescript
// 错误：<Button>查看</Button>
// 正确：
<Button onClick={() => handleView(item)}>查看</Button>
```

**问题2: 缺少状态管理**
```typescript
// 添加缺失的状态
const [viewingItem, setViewingItem] = useState<ItemType | null>(null);
const [editingItem, setEditingItem] = useState<ItemType | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

**问题3: Modal不显示**
```typescript
// 检查条件渲染
{item && (
  <div className="modal" onClick={() => setItem(null)}>
    <div onClick={(e) => e.stopPropagation()}>
      {/* Modal内容 */}
    </div>
  </div>
)}
```

#### 2.3 API服务层检查
```bash
# 检查 src/services/api.ts

# 验证API方法是否正确定义
export const serviceApi = {
  getAll: () => request<Type[]>("/items", { method: "GET" }),
  getById: (id) => request<Type>(`/items/${id}`, { method: "GET" }),
  create: (item) => request<Type>("/items", {
    method: "POST",
    body: JSON.stringify(item)
  }),
  update: (id, item) => request<Type>(`/items/${id}`, {
    method: "PUT",
    body: JSON.stringify(item)
  }),
  delete: (id) => request<void>(`/items/${id}`, { method: "DELETE" }),
};
```

---

### Phase 3: 后端修复（Backend Fix）

#### 3.1 检查实体类（Entity）
```bash
# 位置：src/main/java/org/xi/lt/apm/entity/

# 检查项：
# 1. 表名注解是否正确？
#    @Table(name = "table_name")
#
# 2. 字段映射是否正确？
#    @Column(name = "column_name")
#
# 3. 外键关系是否正确？
#    @ManyToOne / @OneToMany
#    @JoinColumn(name = "foreign_key_column")
#
# 4. 是否有直接的foreignKeyId字段？（重要！）
#    @Column(name = "foreign_key_id")
#    private Long foreignKeyId;
```

**关键修复：外键字段问题**
```java
// 错误：只有关系引用
@ManyToOne
@JoinColumn(name = "project_id")
private Project project;

// 正确：同时有外键字段和关系引用
@Column(name = "project_id")
private Long projectId;

@ManyToOne(fetch = FetchType.EAGER)
@JoinColumn(name = "project_id", insertable = false, updatable = false)
private Project project;
```

#### 3.2 检查Repository层
```bash
# 位置：src/main/java/org/xi/lt/apm/repository/

# 验证方法是否正确定义
@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByNameContaining(String name);
    List<Item> findByStatus(String status);
    Integer countByForeignKeyId(Long foreignKeyId);  // 用于统计
    void deleteByForeignKeyId(Long foreignKeyId);     // 用于删除
}
```

#### 3.3 检查Service层
```bash
# 位置：src/main/java/org/xi/lt/apm/service/

# 检查项：
# 1. 是否有@Service注解？
# 2. 是否有@Transactional注解？（重要！）
# 3. DTO转换方法是否完整？
@Service
@Transactional
public class ItemService {

    // DTO转Entity
    private Item toEntity(ItemDTO dto) {
        Item item = new Item();
        item.setName(dto.getName());
        // ... 其他字段映射
        return item;
    }

    // Entity转DTO（包含空值处理）
    private ItemDTO toDTO(Item item) {
        Integer count = repository.countByForeignKeyId(item.getId());
        if (count == null) count = 0;
        return new ItemDTO(
            item.getId(),
            item.getName(),
            // ... 其他字段
            count
        );
    }

    // CRUD方法
    public ItemDTO saveDTO(ItemDTO dto) {
        Item item = toEntity(dto);
        Item saved = repository.save(item);
        return toDTO(saved);
    }

    public ItemDTO updateDTO(Long id, ItemDTO dto) {
        Optional<Item> existing = repository.findById(id);
        if (existing.isPresent()) {
            Item item = existing.get();
            // 只更新非空字段
            if (dto.getName() != null) item.setName(dto.getName());
            // ... 其他字段
            Item saved = repository.save(item);
            return toDTO(saved);
        }
        return null;
    }

    public void deleteById(Long id) {
        // 先删除关联数据
        repository.deleteByForeignKeyId(id);
        // 再删除主数据
        repository.deleteById(id);
    }
}
```

#### 3.4 检查Controller层
```bash
# 位置：src/main/java/org/xi/lt/apm/controller/

# 检查项：
# 1. 返回类型是否是DTO？（不是Entity！）
# 2. @RequestBody是否正确接收DTO？
@RestController
@RequestMapping("/api/items")
public class ItemController {

    @GetMapping
    public Result<List<ItemDTO>> getAll() {
        return Result.success(itemService.getAllDTO());
    }

    @GetMapping("/{id}")
    public Result<ItemDTO> getById(@PathVariable Long id) {
        ItemDTO item = itemService.getDTOById(id);
        if (item != null) {
            return Result.success(item);
        }
        return Result.error("Item not found");
    }

    @PostMapping
    public Result<ItemDTO> create(@RequestBody ItemDTO dto) {
        return Result.success(itemService.saveDTO(dto));
    }

    @PutMapping("/{id}")
    public Result<ItemDTO> update(@PathVariable Long id, @RequestBody ItemDTO dto) {
        ItemDTO updated = itemService.updateDTO(id, dto);
        if (updated != null) {
            return Result.success(updated);
        }
        return Result.error("Item not found");
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        itemService.deleteById(id);
        return Result.success();
    }
}
```

---

### Phase 4: 验证测试（Verification）

#### 4.1 API测试
```bash
# 测试GET（列表）
curl http://localhost:8081/api/projects

# 测试GET（单个）
curl http://localhost:8081/api/projects/1

# 测试POST（新增）
curl -X POST -H "Content-Type: application/json" \
  -d '{"name":"新项目"}' \
  http://localhost:8081/api/projects

# 测试PUT（更新）
curl -X PUT -H "Content-Type: application/json" \
  -d '{"name":"更新后的项目"}' \
  http://localhost:8081/api/projects/1

# 测试DELETE（删除）
curl -X DELETE http://localhost:8081/api/projects/5
```

#### 4.2 前端功能测试
```bash
# 在浏览器中测试：
# 1. 查看列表是否显示数据
# 2. 点击"查看"按钮，弹出详情
# 3. 点击"编辑"按钮，修改数据并保存
# 4. 点击"删除"按钮，确认删除
# 5. 点击"新增"按钮，填写表单并提交
# 6. 测试搜索和筛选功能
```

#### 4.3 控制台检查
```bash
# 检查浏览器控制台
# 确认没有以下错误：
#   - CORS policy blocked
#   - 404 Not Found
#   - 500 Internal Server Error
#   - TypeError: Cannot read property
```

---

## 常见问题速查表

| 症状 | 可能原因 | 解决方案 |
|------|---------|---------|
| 按钮点击无反应 | 没有绑定onClick | 添加 `onClick={() => handler(id)}` |
| API 500错误 | 外键约束/事务问题 | 添加`@Transactional`，修复外键字段 |
| 前端不显示数据 | API调用失败/CORS | 检查网络请求，配置CORS |
| 删除失败 | 有关联数据未删除 | 先删关联数据，再删主数据 |
| 更新失败 | 事务未提交 | 添加`@Transactional` |
| 编译错误 | 方法不存在 | 添加Repository方法 |
| 类型不匹配 | DTO/Entity字段不一致 | 统一前后端字段命名 |

---

## 修复完成标准

✅ **所有CRUD操作正常**：
- 查看（GET）- 显示详情弹窗
- 新增（POST）- 表单提交成功
- 编辑（PUT）- 修改数据保存
- 删除（DELETE）- 确认后删除

✅ **API接口测试通过**：
- 所有HTTP方法都返回正确状态码
- 响应数据格式正确

✅ **前端交互流畅**：
- 按钮有视觉反馈
- 操作有Toast提示
- 加载状态显示

✅ **无控制台错误**：
- 无CORS错误
- 无404/500错误
- 无TypeError

---

## 输出格式

修复完成后，输出以下总结：

```markdown
## ✅ [菜单名] 修复完成

### 🔍 问题诊断
1. [问题1]：[诊断结果]
2. [问题2]：[诊断结果]

### ✅ 修复方案
1. [修复1]：[代码片段/说明]
2. [修复2]：[代码片段/说明]

### 📊 验证结果
| 功能 | 状态 | 说明 |
|------|------|------|
| 查看 | ✅ | 详情弹窗正常显示 |
| 编辑 | ✅ | 数据保存成功 |
| 删除 | ✅ | 关联数据一并删除 |
| 新增 | ✅ | 表单提交正常 |

### 🛠 技术改进
- [改进1]
- [改进2]

### 📍 当前状态
- 后端服务：http://localhost:8081
- 前端服务：http://localhost:3000
```