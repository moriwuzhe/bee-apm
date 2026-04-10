<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const app = computed(() => String((route.params as any)?.app || ''))
const env = computed(() => String((route.query as any)?.env || ''))
const inst = computed(() => String((route.query as any)?.inst || ''))
const ip = computed(() => String((route.query as any)?.ip || ''))
const port = computed(() => String((route.query as any)?.port || ''))

const active = computed(() => {
  const p = String(route.path || '')
  if (p.includes('/method')) return 'method'
  if (p.includes('/sql')) return 'sql'
  if (p.includes('/tx')) return 'tx'
  if (p.includes('/logger')) return 'logger'
  if (p.includes('/diagnostic')) return 'diagnostic'
  return 'request'
})

const subtitle = computed(() => {
  const parts: string[] = []
  if (env.value) parts.push(`env=${env.value}`)
  if (inst.value) parts.push(`inst=${inst.value}`)
  if (ip.value) parts.push(`ip=${ip.value}${port.value ? ':' + port.value : ''}`)
  return parts.join('  ')
})

function go(tab: string) {
  router.push({
    path: `/apps/${encodeURIComponent(app.value)}/${tab}`,
    query: route.query,
  })
}
</script>

<template>
  <div class="shell">
    <div class="head">
      <div class="title">应用：{{ app }}</div>
      <div class="subtitle">{{ subtitle }}</div>
    </div>

    <el-card shadow="never" class="panel">
      <el-tabs :model-value="active" @update:model-value="(v:any)=>go(String(v))">
        <el-tab-pane label="请求" name="request" />
        <el-tab-pane label="方法" name="method" />
        <el-tab-pane label="SQL" name="sql" />
        <el-tab-pane label="事务" name="tx" />
        <el-tab-pane label="Logger" name="logger" />
        <el-tab-pane label="诊断" name="diagnostic" />
      </el-tabs>
    </el-card>

    <RouterView />
  </div>
</template>

<style scoped>
.shell{
  max-width: 1400px;
  display:flex;
  flex-direction: column;
  gap: var(--space-4);
}

.head{
  display:flex;
  flex-direction: column;
  gap: 6px;
}

.title{
  font-size: 18px;
  font-weight: 900;
  letter-spacing: .2px;
}

.subtitle{
  color: var(--text-muted);
  font-size: 13px;
}

.panel :deep(.el-card__body){
  padding: 10px 14px 2px;
}
</style>

