<script setup lang="ts">
import { computed } from 'vue'

type CallTreeNode = {
  id?: string
  gid?: string
  time?: string
  type?: string
  text?: string
  app?: string
  spend?: number
  children?: CallTreeNode[]
  timeStartOffset?: number
}

const props = defineProps<{
  modelValue: boolean
  loading: boolean
  data: CallTreeNode[]
  title?: string
  onParams?: (node: CallTreeNode) => void
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
}>()

function nodeKey(n: any) {
  if (!n) return Math.random().toString(16).slice(2)
  if (n.id) return String(n.id)
  if (n.gid && n.time && n.type) return `${n.gid}-${n.time}-${n.type}`
  return JSON.stringify([n.gid, n.time, n.type, n.text, n.spend])
}

const tableData = computed(() => {
  if (!Array.isArray(props.data) || props.data.length === 0) return []
  // Add a simple linear time offset for visual waterfall simulation if the backend doesn't provide absolute timestamp differences.
  // In a real scenario, this should be calculated using actual absolute timestamps (span start time - trace start time).
  let currentOffset = 0
  const assignOffsets = (nodes: CallTreeNode[], parentOffset: number) => {
    nodes.forEach(node => {
      node.timeStartOffset = parentOffset
      if (node.children && node.children.length > 0) {
        assignOffsets(node.children, parentOffset + Math.max((node.spend || 0) * 0.1, 2))
      }
      currentOffset += 2
    })
  }
  assignOffsets(props.data, 0)
  return props.data
})

const maxTotalTime = computed(() => {
  if (tableData.value.length === 0) return 100
  return tableData.value[0].spend || 100
})
</script>

<template>
  <el-drawer
    :model-value="modelValue"
    :title="title || '链路'"
    size="78%"
    @update:model-value="(v:boolean)=>emit('update:modelValue', v)"
  >
    <el-table
      v-loading="loading"
      :data="tableData"
      border
      stripe
      :row-key="nodeKey"
      :tree-props="{ children: 'children' }"
      default-expand-all
    >
      <el-table-column label="链路" min-width="420">
        <template #default="{ row }">
          <span :class="row.type === 'req' ? 't-req' : row.type === 'sql' ? 't-sql' : ''">{{ row.text || '' }}</span>
          <span class="sep">|</span>
          <span class="app">{{ row.app || '' }}</span>
        </template>
      </el-table-column>

      <el-table-column label="耗时瀑布图(ms)" min-width="250">
        <template #default="{ row }">
          <div class="waterfall-container">
            <div class="waterfall-bar" 
                 :style="{ 
                   left: `${Math.min((row.timeStartOffset / maxTotalTime) * 100, 95)}%`, 
                   width: `${Math.max((row.spend / maxTotalTime) * 100, 1)}%`,
                   backgroundColor: row.type === 'sql' ? '#e6a23c' : (row.type === 'req' ? '#409eff' : '#909399')
                 }">
            </div>
            <span class="waterfall-label" :style="{ left: `calc(${Math.min((row.timeStartOffset / maxTotalTime) * 100, 95)}% + ${Math.max((row.spend / maxTotalTime) * 100, 1)}% + 5px)` }">
              {{ row.spend }}ms
            </span>
          </div>
        </template>
      </el-table-column>

      <el-table-column label="操作" width="110" align="center">
        <template #default="{ row }">
          <el-button v-if="onParams" link type="primary" @click="onParams(row)">参数</el-button>
        </template>
      </el-table-column>
    </el-table>
  </el-drawer>
</template>

<style scoped>
.sep{
  margin: 0 8px;
  color: var(--text-muted);
}

.app{
  color: var(--primary);
}

.t-req{
  color: #3b82f6;
  font-weight: 700;
}

.t-sql{
  color: #c05d06;
  font-weight: 700;
}

.waterfall-container {
  position: relative;
  height: 24px;
  width: 100%;
  background: #f5f7fa;
  border-radius: 4px;
  overflow: hidden;
}

.waterfall-bar {
  position: absolute;
  top: 4px;
  height: 16px;
  border-radius: 2px;
  min-width: 2px;
}

.waterfall-label {
  position: absolute;
  top: 4px;
  font-size: 12px;
  line-height: 16px;
  color: #606266;
  white-space: nowrap;
}
</style>

