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

const tableData = computed(() => (Array.isArray(props.data) ? props.data : []))
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
      <el-table-column label="链路" min-width="520">
        <template #default="{ row }">
          <span :class="row.type === 'req' ? 't-req' : row.type === 'sql' ? 't-sql' : ''">{{ row.text || '' }}</span>
          <span class="sep">|</span>
          <span class="app">{{ row.app || '' }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="spend" label="耗时(ms)" width="110" />

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
</style>

