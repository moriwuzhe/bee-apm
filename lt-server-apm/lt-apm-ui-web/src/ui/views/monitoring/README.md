# 图表组件复用指南

## 📊 现有图表组件

所有图表组件已位于 `src/ui/views/monitoring/` 目录，可通过以下方式导入：

```typescript
import { 
  MemoryMonitoringView,
  GcAnalysisView, 
  ThreadMonitoringView,
  IoNetworkView,
  JvmInfoView
} from '@/ui/views/monitoring'
```

## 🎯 使用方式

### 基础用法

```vue
<template>
  <MemoryMonitoringView
    :memory-history="historyData"
    :history-time-range="24"
    :history-loading="loading"
    @refresh="handleRefresh"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MemoryMonitoringView } from '@/ui/views/monitoring'

const historyData = ref([])
const loading = ref(false)

const handleRefresh = () => {
  // 刷新数据逻辑
}
</script>
```

### Props 说明

#### MemoryMonitoringView / GcAnalysisView / ThreadMonitoringView / IoNetworkView

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| memoryHistory | Array | ✅ | 历史监控数据数组 |
| historyTimeRange | Number | ✅ | 时间范围（小时） |
| historyLoading | Boolean | ✅ | 加载状态 |
| enableAutoRefresh | Boolean | ❌ | 是否启用自动刷新 |
| autoRefreshInterval | Number | ❌ | 自动刷新间隔（秒） |

#### JvmInfoView

| Prop | 类型 | 必填 | 说明 |
|------|------|------|------|
| jvmData | Object | ✅ | JVM信息数据 |

### Events 说明

| Event | 参数 | 说明 |
|-------|------|------|
| refresh | - | 用户点击刷新按钮 |
| autoRefreshToggle | enabled: boolean | 自动刷新开关变化 |
| update:historyTimeRange | value: number | 时间范围变化（v-model支持） |
| update:enableAutoRefresh | value: boolean | 自动刷新启用状态变化 |
| update:autoRefreshInterval | value: number | 自动刷新间隔变化 |

## 💡 最佳实践

### 1. 数据格式

所有监控组件期望的 `memoryHistory` 数据格式：

```typescript
interface MemoryHistoryItem {
  collectTime: number  // 采集时间戳（毫秒）
  heapUsed: number     // 堆内存使用
  heapCommitted: number
  heapMax: number
  nonHeapUsed: number
  // ... 其他字段根据具体组件而定
}
```

### 2. 响应式更新

组件会自动监听 `memoryHistory` 的变化并重新渲染图表，无需手动调用刷新方法。

### 3. 可见性检测

组件内部已实现 `offsetParent` 检测，隐藏的组件不会渲染图表，避免ECharts报错。

## 🔧 扩展示例

### 创建自定义监控面板

```vue
<template>
  <el-card>
    <template #header>
      <span>我的监控面板</span>
    </template>
    
    <el-tabs v-model="activeTab">
      <el-tab-pane label="内存" name="memory">
        <MemoryMonitoringView
          :memory-history="memoryData"
          :history-time-range="timeRange"
          :history-loading="loading"
        />
      </el-tab-pane>
      
      <el-tab-pane label="GC" name="gc">
        <GcAnalysisView
          :memory-history="memoryData"
          :history-time-range="timeRange"
          :history-loading="loading"
        />
      </el-tab-pane>
    </el-tabs>
  </el-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MemoryMonitoringView, GcAnalysisView } from '@/ui/views/monitoring'

const activeTab = ref('memory')
const memoryData = ref([])
const timeRange = ref(24)
const loading = ref(false)
</script>
```

## ⚠️ 注意事项

1. **不要手动操作图表实例**：图表由组件内部管理，外部不应直接访问ECharts实例
2. **确保容器有尺寸**：图表容器必须有明确的宽高，否则ECharts无法渲染
3. **数据排序**：传入的数据应按 `collectTime` 升序排列
4. **空数据处理**：组件会自动处理空数据情况，显示友好提示

## 🚀 未来优化方向

1. **提取通用图表基类**：减少重复代码
2. **支持主题切换**：暗黑模式/明亮模式
3. **导出为图片**：支持图表下载
4. **实时数据流**：WebSocket推送实时更新
