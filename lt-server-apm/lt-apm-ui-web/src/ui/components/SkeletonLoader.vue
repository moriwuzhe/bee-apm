<script setup lang="ts">
defineProps<{
  rows?: number
  columns?: number
}>()
</script>

<template>
  <div class="skeleton-loader">
    <div v-for="i in (rows || 5)" :key="i" class="skeleton-row">
      <div v-for="j in (columns || 4)" :key="j" class="skeleton-cell" />
    </div>
  </div>
</template>

<style scoped>
.skeleton-loader {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.skeleton-row {
  display: flex;
  gap: var(--space-2);
}

.skeleton-cell {
  height: 32px;
  flex: 1;
  border-radius: 4px;
  background: linear-gradient(90deg, var(--el-fill-color-light) 25%, var(--el-fill-color-lighter) 37%, var(--el-fill-color-light) 63%);
  background-size: 400% 100%;
  animation: skeleton-loading 1.4s ease infinite;
}

@keyframes skeleton-loading {
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0 50%;
  }
}
</style>