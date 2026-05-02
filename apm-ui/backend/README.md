# APM UI Backend

APM UI 后端服务，基于 Spring Boot 2.x + JPA + H2 数据库构建。

## 技术栈

- Spring Boot 2.7.18
- Spring Data JPA
- H2 Database (默认，支持多数据源切换)
- MySQL / PostgreSQL (可选)
- Lombok
- Java 8

## 功能特性

- **用户管理**: 用户CRUD，角色分配
- **角色管理**: 角色CRUD，权限配置
- **项目管理**: 项目管理，环境分类
- **应用管理**: 应用监控，Agent管理
- **JVM监控**: 实时JVM指标展示
- **版本发布**: 发布记录，影响分析
- **告警管理**: 告警查看，处理
- **多数据源**: 支持H2/MySQL/PostgreSQL无缝切换

## 快速开始

### 环境要求

- JDK 8+
- Maven 3.6+

### 运行项目

```bash
# 进入项目目录
cd apm-ui/backend

# 使用 Maven 运行
mvn spring-boot:run

# 或先打包再运行
mvn clean package
java -jar target/apm-ui-backend-1.0.0.jar
```

### 切换数据源

修改 `src/main/resources/application.yml` 中的 `spring.profiles.active`：

```yaml
spring:
  profiles:
    active: h2  # 可选: h2, mysql, postgresql
```

或在运行时指定：

```bash
mvn spring-boot:run -Dspring-boot.run.profiles=mysql
```

### 通过 API 切换数据源

```bash
# 切换到 MySQL
curl -X POST http://localhost:8080/api/datasource/switch/mysql

# 切换到 PostgreSQL
curl -X POST http://localhost:8080/api/datasource/switch/postgresql

# 切换回 H2
curl -X POST http://localhost:8080/api/datasource/switch/h2

# 查看当前数据源
curl http://localhost:8080/api/datasource/current
```

## 访问地址

- API 服务: http://localhost:8080
- H2 控制台: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:apm_db`
  - 用户名: `sa`
  - 密码: (留空)

## API 文档

### 监控大盘

```bash
# 获取统计数据
GET /api/dashboard/stats

# 获取趋势数据
GET /api/dashboard/trend?range=24h

# 获取告警趋势
GET /api/dashboard/alert-trend

# 获取最近告警
GET /api/dashboard/recent-alerts

# 获取Top应用
GET /api/dashboard/top-apps
```

### 项目管理

```bash
# 获取所有项目
GET /api/projects

# 创建项目
POST /api/projects
Content-Type: application/json
{
  "name": "新项目",
  "groupName": "测试",
  "env": "dev",
  "description": "项目描述"
}

# 更新项目
PUT /api/projects/{id}

# 删除项目
DELETE /api/projects/{id}

# 搜索项目
GET /api/projects/search?keyword=xxx
```

### 应用管理

```bash
# 获取所有应用
GET /api/applications

# 按项目获取应用
GET /api/applications/project/{projectId}

# 创建应用
POST /api/applications

# 更新应用
PUT /api/applications/{id}

# 删除应用
DELETE /api/applications/{id}
```

### 用户管理

```bash
# 获取所有用户
GET /api/users

# 获取用户详情
GET /api/users/{id}

# 创建用户
POST /api/users

# 更新用户
PUT /api/users/{id}

# 删除用户
DELETE /api/users/{id}
```

### 角色管理

```bash
# 获取所有角色
GET /api/roles

# 创建角色
POST /api/roles

# 更新角色
PUT /api/roles/{id}

# 删除角色
DELETE /api/roles/{id}
```

### 版本发布

```bash
# 获取所有发布记录
GET /api/releases

# 获取应用的发布记录
GET /api/releases/app/{appName}

# 创建发布
POST /api/releases
```

### JVM监控

```bash
# 获取应用列表
GET /api/jvm/applications

# 获取主机指标
GET /api/jvm/host-metrics?appName=order-service

# 获取堆内存数据
GET /api/jvm/heap-mem

# 获取线程数据
GET /api/jvm/threads

# 获取GC数据
GET /api/jvm/gc

# 获取网络数据
GET /api/jvm/network

# 获取类加载统计
GET /api/jvm/class-loading
```

## 项目结构

```
src/main/java/org/xi/lt/apm/
├── ApmUiBackendApplication.java    # 启动类
├── config/                         # 配置类
│   ├── CorsConfig.java             # CORS配置
│   ├── DataInitializer.java        # 数据初始化
│   ├── DataSourceConfig.java       # 数据源配置
│   ├── DataSourceProperties.java   # 数据源属性
│   ├── DynamicDataSource.java      # 动态数据源
│   └── GlobalExceptionHandler.java # 全局异常处理
├── controller/                     # 控制器
├── entity/                         # 实体类
├── repository/                     # 数据访问层
├── service/                        # 业务逻辑层
└── common/                         # 通用类

src/main/resources/
├── application.yml                 # 主配置
├── application-h2.yml              # H2配置
├── application-mysql.yml           # MySQL配置
└── application-postgresql.yml      # PostgreSQL配置
```

## 初始化数据

项目启动时会自动初始化以下数据：

- **权限**: 19个系统权限
- **角色**: 5个预置角色（超级管理员、运维管理员、项目负责人、运维工程师、开发工程师）
- **用户**: 5个示例用户
- **项目**: 5个示例项目
- **应用**: 7个示例应用
- **告警**: 5条活跃告警
- **发布**: 4条发布记录

默认用户：
- 账号: `zhangwei`, 密码: `123456`, 角色: 超级管理员
- 账号: `liming`, 密码: `123456`, 角色: 运维管理员

## 前后端联调

### 前端配置

在前端项目中，修改 API 基础地址（如需要）：

```javascript
// 在前端项目中配置 API 地址
const API_BASE = 'http://localhost:8080/api';
```

### 前端启动

```bash
cd apm-ui/front
npm install
npm run dev
```

### 联调测试

1. 确保后端服务在 `http://localhost:8080` 运行
2. 启动前端服务
3. 访问前端地址，测试各功能模块

## 开发指南

### 添加新实体

1. 在 `entity` 包下创建实体类
2. 在 `repository` 包下创建 Repository 接口
3. 在 `service` 包下创建 Service 类
4. 在 `controller` 包下创建 Controller 类

### 添加新数据源

1. 在 `application-{type}.yml` 中添加配置
2. 在 `DataSourceConfig.java` 中配置对应 Bean
3. 在 `DynamicDataSource` 中注册

## License

MIT License
