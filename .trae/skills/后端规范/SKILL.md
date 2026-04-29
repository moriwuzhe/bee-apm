---
name: 后端规范
description: "---
name: Java8-SpringBoot2-JPA-Lombok-H2-多数据源后端规范
version: 1.0
author: Trae后端规范
description: 严格约束 Java8 + SpringBoot2.x + SpringDataJPA + Lombok + H2 开发，支持H2/MySQL/PostgreSQL/Oracle 多数据源无缝动态切换，统一工程结构、编码分层、命名、事务、异常、统一返回、代码模板
system: 后端Java开发
tags: Java8,SpringBoot2,JPA,Lombok,H2,多数据源,规范
---

# 一、技术栈强制约束
## 固定版本&组件
1. JDK 固定：**Java 8**，编译级别、源码版本、运行环境全部锁定 Java8
2. 框架：**SpringBoot 2.7.x 系列**，禁止升级 SpringBoot3、禁止使用 Jakarta 包
3. ORM：**Spring Data JPA + Hibernate5**
4. 工具：**Lombok 全局启用**，必须使用注解代替手写 getter/setter/构造器
5. 数据库：
   - 开发默认：**H2 内嵌内存数据库**
   - 支持无缝切换：H2 / MySQL / PostgreSQL / Oracle，不改业务代码
6. 多数据源实现：基于 `AbstractRoutingDataSource + ThreadLocal + AOP注解` 动态切换，无侵入、类/方法级粒度
7. 构建：Maven，禁止 Gradle

## 必引依赖约定
必须引入：spring-boot-starter-web、spring-boot-starter-data-jpa、lombok、h2、spring-boot-starter-aop
数据库驱动按需引入，配置即可切换，不用改代码。

# 二、标准工程目录结构（强制必须遵守）
com.xxx.project
├── config                # 全局配置
│   ├── datasource        # 多数据源路由、上下文、AOP切面、DS注解
│   ├── jpa               # JPA全局配置、审计配置
│   └── web               # 跨域、web配置
├── entity                # JPA数据库实体
│   ├── h2
│   ├── mysql
│   └── oracle
├── repository            # JPA持久层接口
│   ├── h2
│   ├── mysql
│   └── oracle
├── service               # 业务层
│   ├── interface         # Service接口
│   └── impl              # Service实现类
├── controller            # REST接口控制器
├── dto                   # 请求DTO/响应DTO
├── common                # 公共通用
│   ├── result            # 统一返回Result、分页结果
│   ├── exception         # 自定义业务异常
│   ├── enums             # 状态码枚举
│   └── util              # 工具类
├── handler               # 全局异常处理器
└── mapper                # DTO与Entity转换层

# 三、命名规范（强制）
1. 包名：全小写，层级清晰，禁止大写、下划线、数字开头
2. 类名：大驼峰
   - 控制器：XxxController
   - 业务：XxxService / XxxServiceImpl
   - 持久层：XxxRepository
   - 实体：与表名对应单数 User、Order
   - DTO：XxxRequest、XxxResponse、XxxDTO
3. 方法名：小驼峰，动词开头 getById、save、listByCondition
4. JPA Repository：遵循 JPA 命名规约 findByXxx、existsByXxx、countByXxx
5. 常量：全大写下划线分隔 MAX_PAGE_SIZE、SUCCESS_CODE

# 四、分层职责规范（严格分层，禁止跨层）
## Controller 层
- 只做：接收请求、参数校验、调用Service、统一返回Result
- 禁止：写业务逻辑、直接调用Repository、手写数据库操作
- 统一注解：@RestController、@RequestMapping 接口版本 /api/v1/xxx
- 入参使用 @Valid 做参数校验

## Service 层
- 接口+实现分离
- 负责：业务逻辑、事务控制、数据组装、业务校验
- 事务规范：
  - 查询方法：@Transactional(readOnly = true)
  - 增删改方法：@Transactional(rollbackFor = Exception.class)
- 禁止Controller加事务

## Repository 层
- 继承 JpaRepository<T,ID>
- 只做数据库CRUD，不写业务
- 多数据源按包隔离，不同库Repository分开放

## Entity 实体层
- 必须 @Entity + @Table 映射表
- 主键使用自增/序列适配多数据库
- 字段必须标注 @Column 长度、非空、唯一约束
- 严禁使用基本类型，全部用包装类 Long、Integer、Boolean
- 必须使用Lombok注解

# 五、Lombok 使用强制规范
1. 实体、DTO 统一标配：
   @Data
   @NoArgsConstructor
   @AllArgsConstructor
   @Builder
2. 禁止手动编写 getter、setter、toString、构造器
3. 业务类使用 @Slf4j 注入日志，禁止手动new Logger

# 六、JPA 编码规范
1. 禁止滥用原生SQL，优先使用 JPA 命名查询、Specification 动态条件
2. 实体创建时间、更新时间使用 JPA 生命周期注解 @PrePersist、@PreUpdate
3. 全局JPA配置：自动建表 ddl-auto 开发update、生产none
4. 格式化SQL、打印SQL，开发环境开启，生产关闭

# 七、多数据源无缝切换规范（核心能力）
## 核心组件固定结构
1. @DS 注解：作用于类、方法，指定数据源key
2. DataSourceContextHolder：ThreadLocal 存放当前数据源标识
3. DynamicDataSource：继承 AbstractRoutingDataSource 路由数据源
4. DataSourceAspect：AOP前置切换、后置清空，优先级最高
5. 配置文件统一配置多数据源：h2、mysql、oracle 等
6. 默认数据源可配置，未加@DS自动走默认库

## 使用规则
- 方法级 @DS 优先级 > 类级 @DS
- 线程隔离，多数据源切换互不干扰
- 切换数据库只改配置+注解，**不用改业务代码**
- 支持任意数据库无缝插拔切换

# 八、H2 数据库规范
1. 开发环境默认使用 H2 内存模式
2. 开启 h2-console 可视化控制台
3. 配置兼容 MySQL 模式，切换MySQL无需改实体和JPA代码
4. 生产直接注释H2，切换为MySQL/PG/Oracle即可

# 九、统一响应 & 全局异常
1. 全局统一返回体 Result<T>，所有Controller 必须统一返回，禁止直接返回实体
2. 全局异常处理器 @RestControllerAdvice
3. 拦截：自定义业务异常、参数校验异常、系统全局异常
4. 统一错误码、错误信息格式

# 十、代码编写强制约束
1. 所有接口 RESTful 风格
2. 入参必做非空、长度、格式校验
3. 禁止SQL拼接、禁止硬编码常量
4. 敏感数据禁止日志打印
5. 分页统一使用 JPA 分页 Pageable、Page
6. DTO 和 Entity 严格分离，禁止实体直接返给前端"
---

# 后端规范
# 后端开发
# 后端