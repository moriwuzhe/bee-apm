<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <div class="nf">
    <div class="code">404</div>
    <div class="msg">页面不存在</div>
    <el-button type="primary" @click="router.replace('/dashboard')">返回仪表盘</el-button>
  </div>
</template>

<style scoped>
.nf{
  min-height: 60vh;
  display:flex;
  flex-direction: column;
  align-items:center;
  justify-content:center;
  gap: var(--space-2);
}
.code{
  font-size: 56px;
  font-weight: 900;
}
.msg{
  color: var(--text-muted);
  margin-bottom: var(--space-2);
}
</style>

