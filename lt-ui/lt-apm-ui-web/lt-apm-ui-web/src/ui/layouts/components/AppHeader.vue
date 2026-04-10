<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Menu, Moon, Sunny } from '@element-plus/icons-vue'

import { useAuthStore } from '../../../stores/auth'
import { useUiStore } from '../../../stores/ui'
import { useTimeRangeStore } from '../../../stores/timeRange'

const auth = useAuthStore()
const ui = useUiStore()
const timeRange = useTimeRangeStore()

const router = useRouter()
const route = useRoute()

const breadcrumbs = computed(() => {
  const matched = route.matched || []
  const list = []
  for (let i = 0; i < matched.length; i += 1) {
    const m: any = matched[i]
    if (!m || !m.meta || !m.meta.title) continue
    list.push({ title: String(m.meta.title), path: m.path })
  }
  return list
})

const pickerShortcuts = [
  { text: '最近10分钟', value: () => [new Date(Date.now() - 10 * 60 * 1000), new Date()] },
  { text: '最近20分钟', value: () => [new Date(Date.now() - 20 * 60 * 1000), new Date()] },
  { text: '最近30分钟', value: () => [new Date(Date.now() - 30 * 60 * 1000), new Date()] },
  { text: '最近1小时', value: () => [new Date(Date.now() - 60 * 60 * 1000), new Date()] },
  { text: '最近2小时', value: () => [new Date(Date.now() - 2 * 60 * 60 * 1000), new Date()] },
]

function onLogout() {
  auth.logout()
  router.replace('/login')
}
</script>

<template>
  <div class="header">
    <div class="left">
      <button class="icon-btn" type="button" @click="ui.toggleSidebar()">
        <el-icon><Menu /></el-icon>
      </button>

      <el-breadcrumb separator="/" class="crumb">
        <el-breadcrumb-item v-for="c in breadcrumbs" :key="c.path">
          {{ c.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <div class="right">
      <el-date-picker
        class="range"
        type="datetimerange"
        :model-value="timeRange.range"
        :shortcuts="pickerShortcuts"
        range-separator="至"
        start-placeholder="开始"
        end-placeholder="结束"
        format="YYYY-MM-DD HH:mm"
        @update:model-value="(v:any) => v && timeRange.setRange(v)"
      />

      <button class="icon-btn" type="button" @click="ui.toggleTheme()">
        <el-icon v-if="ui.theme === 'dark'"><Sunny /></el-icon>
        <el-icon v-else><Moon /></el-icon>
      </button>

      <el-dropdown trigger="click">
        <span class="user">
          {{ auth.username || 'user' }}
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="onLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<style scoped>
.header{
  height: 100%;
  display:flex;
  align-items:center;
  justify-content: space-between;
  padding: 0 var(--space-4);
  gap: var(--space-3);
  box-sizing: border-box;
}

.left{
  display:flex;
  align-items:center;
  gap: var(--space-3);
  min-width: 0;
}

.crumb{
  min-width: 0;
}

.crumb :deep(.el-breadcrumb__inner){
  color: var(--text-muted);
  font-weight: 500;
}

.crumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner){
  color: var(--text);
  font-weight: 700;
}

.right{
  display:flex;
  align-items:center;
  gap: var(--space-2);
}

.range{
  width: 320px;
}

.icon-btn{
  width: 36px;
  height: 36px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  display:flex;
  align-items:center;
  justify-content:center;
  cursor:pointer;
  box-shadow: var(--shadow-sm);
}

.user{
  display:inline-flex;
  align-items:center;
  height: 36px;
  padding: 0 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--surface);
  color: var(--text);
  cursor:pointer;
  box-shadow: var(--shadow-sm);
}
</style>

