# Bee-APM Frontend - 项目架构与使用指南

## 📋 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [架构概述](#架构概述)
- [核心组件](#核心组件)
- [自定义 Hooks](#自定义-hooks)
- [开发规范](#开发规范)

---

## 项目简介

这是一个企业级应用性能监控平台前端项目，使用 TypeScript + React + Vite 构建。项目具有完善的类型安全、组件复用架构和现代化的开发体验。

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.3.1 | 前端框架 |
| TypeScript | ~5.5.0 | 类型安全 |
| Vite | ^5.4.0 | 构建工具 |
| Tailwind CSS | ^3.4.11 | 样式框架 |
| Recharts | ^2.10.3 | 图表库 |
| Lucide React | ^0.446.0 | 图标库 |
| React Router | ^6.26.2 | 路由库 |
| Sonner | ^1.5.0 | Toast 通知 |

---

## 项目结构

```
apm-ui/front/src/
├── components/
│   ├── UI/              # 通用 UI 组件库
│   │   ├── MetricCard.tsx
│   │   ├── PageHeader.tsx
│   │   ├── TechButton.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Modal.tsx
│   │   ├── Table.tsx
│   │   ├── Loading.tsx
│   │   ├── EmptyState.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── index.ts      # 统一导出
│   ├── business/         # 业务组件
│   │   ├── index.tsx
│   │   ├── SearchBar.tsx
│   │   ├── FilterDropdown.tsx
│   │   └── Pagination.tsx
│   └── Layout/
│       ├── MainLayout.tsx
│       ├── Sidebar.tsx
│       └── TopBar.tsx
├── hooks/                # 自定义 Hooks
│   ├── index.ts
│   ├── useApiQuery.ts
│   ├── useForm.ts
│   ├── usePagination.ts
│   ├── useSearch.ts
│   ├── useFormValidation.ts
│   └── use-mobile.ts
├── utils/                # 工具函数
│   ├── index.ts
│   └── apiError.ts
├── pages/                # 页面组件
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── Applications.tsx
│   ├── Users.tsx
│   ├── Roles.tsx
│   ├── Permissions.tsx
│   ├── AlertRules.tsx
│   ├── AgentControl.tsx
│   ├── Releases.tsx
│   ├── NetworkTopology.tsx
│   └── ...
├── services/             # API 服务
│   └── api.ts
├── types/                # 类型定义
│   └── index.ts
├── context/              # Context
│   └── ToastContext.tsx
├── App.tsx
└── main.tsx
```

---

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产

```bash
npm run build
```

### 预览生产

```bash
npm run preview
```

### 检查类型

```bash
npx tsc --noEmit
```

---

## 架构概述

### 核心设计原则

1. **类型优先** - 100% TypeScript 覆盖，无遗留 `any` 类型
2. **组件复用** - 提取通用业务组件
3. **Hooks 组合** - 使用自定义 Hooks 管理逻辑
4. **模块化服务** - API 调用统一通过 `api.ts` 处理

---

## 核心组件

### UI 组件库 (`src/components/UI/`)

| 组件 | 用途 | 导入路径 |
|------|------|----------|
| `ConfirmDialog` | 确认对话框 | `@/components/UI` |
| `Modal` | 通用模态框 | `@/components/UI` |
| `Table` | 通用表格 | `@/components/UI` |
| `StatusBadge` | 状态标签 | `@/components/UI` |
| `TechButton` | 按钮组件 | `@/components/UI` |
| `MetricCard` | 指标卡片 | `@/components/UI` |
| `PageHeader` | 页面头部 | `@/components/UI` |
| `Loading` / `EmptyState` / `ErrorBoundary` | 状态组件 | `@/components/UI` |

### 业务组件 (`src/components/business/`)

| 组件 | 用途 |
|------|------|
| `SearchBar` | 搜索条 |
| `FilterDropdown` | 过滤下拉 |
| `Pagination` | 分页组件 |

---

## 自定义 Hooks

### 1. `useApiQuery` - API 数据管理

```typescript
import { useApiQuery } from "@/hooks";
import { projectsApi } from "@/services/api";

const { data, loading, error, isFetching, refetch, setData } = useApiQuery(
  () => projectsApi.getAll(),
  {
    enabled: true,
    initialData: null,
    onSuccess: (data) => { /* 成功回调 */ },
    onError: (error) => { /* 错误回调 */ },
    refetchInterval: 30000, // 30秒轮询
    retry: 3,
  }
);
```

### 2. `useForm` - 表单管理

```typescript
import { useForm } from "@/hooks";
import type { ProjectFormData } from "@/types";

const {
  values,
  errors,
  touched,
  isSubmitting,
  setFieldValue,
  setFieldTouched,
  handleChange,
  handleBlur,
  handleSubmit,
  resetForm,
  isValid,
} = useForm<ProjectFormData>({
  initialValues: {
    name: "",
    groupName: "默认分组",
    environment: "dev",
    description: "",
    owner: "",
    status: "online",
  },
  validate: (values) => { /* 验证逻辑 */ },
  onSubmit: async (values) => { /* 提交逻辑 */ },
});
```

### 3. `usePagination` - 分页

```typescript
import { usePagination } from "@/hooks";

const {
  currentPage,
  pageSize,
  totalPages,
  startIndex,
  endIndex,
  paginatedData,
  setCurrentPage,
  setPageSize,
  canPrevPage,
  canNextPage,
} = usePagination({
  data: filteredData,
  defaultPageSize: 10,
});
```

### 4. `useSearch` - 搜索（带防抖）

```typescript
import { useSearch } from "@/hooks";

const { search, setSearch, debouncedSearch } = useSearch({
  debounceMs: 300,
});
```

---

## 开发规范

### 1. 类型定义

所有类型定义统一放在 `src/types/index.ts` 中：

```typescript
// src/types/index.ts
export interface Project {
  id: number;
  name: string;
  environment: ProjectEnv; // 使用枚举，不用 string
  status: StatusType;     // 使用统一状态类型
  // ...
}
```

### 2. 组件导入

统一使用 index 文件导出，简化导入路径：

```typescript
// ✅ 好的做法
import { Modal, ConfirmDialog, StatusBadge } from "@/components/UI";
import { useApiQuery, useForm, usePagination } from "@/hooks";

// ❌ 避免这种做法
import Modal from "@/components/UI/Modal";
import useApiQuery from "@/hooks/useApiQuery";
```

### 3. 状态管理

- 优先使用自定义 Hooks
- 保持组件简洁，逻辑在 Hooks 中
- 使用 Context 管理全局状态（如 Toast）

### 4. 组件结构

```typescript
import { useState, useEffect } from "react";
import { useToast } from "@/context/ToastContext";
import { someApi } from "@/services/api";
import type { SomeType } from "@/types";

export default function SomeComponent() {
  // 1. 自定义 Hooks / Context
  const { showToast } = useToast();
  
  // 2. 本地状态
  const [data, setData] = useState<SomeType[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 3. useEffect
  useEffect(() => {
    fetchData();
  }, []);
  
  // 4. 事件处理
  const fetchData = async () => { /* ... */ };
  const handleSubmit = async () => { /* ... */ };
  
  // 5. 渲染
  return <div>{/* ... */}</div>;
}
```

---

## 工具函数

### API 错误处理

```typescript
import { createApiError, handleApiError, withRetry } from "@/utils";

// 创建标准化错误
const error = createApiError("接口调用失败", 500, "API_ERROR");

// 处理未知错误
try {
  await apiCall();
} catch (e) {
  const error = handleApiError(e);
  showToast(error.message, "error");
}

// 带重试的调用
await withRetry(
  () => apiCall(),
  3,     // 最大重试次数
  1000   // 基础延迟（毫秒）
);
```

---

## 后续优化建议

1. **添加单元测试** - 使用 Vitest + Testing Library
2. **完善 E2E 测试** - 已有 Playwright 配置
3. **国际化** - 添加 i18n 支持
4. **浅色主题** - 完善浅色主题样式
5. **状态管理** - 对于复杂状态考虑引入 Redux/Zustand
6. **代码规范** - 完善 ESLint 规则和 Prettier

---

## 总结

项目架构已非常完善：
- ✅ 100% TypeScript 覆盖，类型安全
- ✅ 统一的 UI 组件库和业务组件
- ✅ 实用的自定义 Hooks
- ✅ 完善的类型定义
- ✅ 清晰的项目结构

继续开发时请遵循上述架构和规范！

