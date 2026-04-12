<script setup lang="ts">
defineProps<{
  title: string
  subtitle?: string
}>()
</script>

<template>
  <div class="shell">
    <div class="head">
      <div class="head-left">
        <div class="title">{{ title }}</div>
        <div v-if="subtitle" class="subtitle">{{ subtitle }}</div>
      </div>
      <div class="head-right">
        <slot name="actions" />
      </div>
    </div>

    <el-card v-if="$slots.filters" shadow="never" class="panel">
      <slot name="filters" />
    </el-card>

    <el-card shadow="never" class="panel">
      <slot />
      <div v-if="$slots.footer" class="footer">
        <slot name="footer" />
      </div>
    </el-card>
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
  align-items:flex-end;
  justify-content: space-between;
  gap: var(--space-3);
}

.head-left{
  min-width: 0;
}

.title{
  font-size: 18px;
  font-weight: 900;
  letter-spacing: .2px;
}

.subtitle{
  margin-top: 6px;
  color: var(--text-muted);
  font-size: 13px;
}

.head-right{
  display:flex;
  align-items:center;
  gap: var(--space-2);
}

.panel :deep(.el-card__body){
  padding: 14px;
}

.footer{
  margin-top: var(--space-3);
  display:flex;
  justify-content:flex-end;
}
</style>

