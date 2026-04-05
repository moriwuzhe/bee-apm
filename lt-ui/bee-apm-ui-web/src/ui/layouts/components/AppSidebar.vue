<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUiStore } from '../../../stores/ui'

type NavItem = {
  path: string
  title: string
  order: number
  icon?: any
}

const ui = useUiStore()
const route = useRoute()
const router = useRouter()

const navItems = computed<NavItem[]>(() => {
  const list: NavItem[] = []
  const all = router.getRoutes()
  for (let i = 0; i < all.length; i += 1) {
    const r = all[i]
    const meta: any = r.meta || {}
    if (!meta.nav) continue
    if (!r.path || r.path.indexOf('/:') === 0) continue
    list.push({
      path: r.path,
      title: meta.title ? String(meta.title) : r.path,
      order: Number(meta.order || 0),
      icon: meta.icon,
    })
  }
  list.sort((a, b) => a.order - b.order)
  return list
})
</script>

<template>
  <div class="sidebar">
    <div class="brand" :class="{ collapsed: ui.sidebarCollapsed }">
      <div class="brand-mark">B</div>
      <div v-show="!ui.sidebarCollapsed" class="brand-text">
        <div class="brand-title">BeeAPM</div>
        <div class="brand-sub">Console</div>
      </div>
    </div>

    <div class="menu">
      <el-menu
        class="menu-inner"
        :default-active="route.path"
        :collapse="ui.sidebarCollapsed"
        router
      >
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          <el-icon v-if="item.icon">
            <component :is="item.icon" />
          </el-icon>
          <span>{{ item.title }}</span>
        </el-menu-item>
      </el-menu>
    </div>
  </div>
</template>

<style scoped>
.sidebar{
  height: 100%;
  display:flex;
  flex-direction: column;
  background: var(--sidebar-bg);
}

.brand{
  height: var(--header-h);
  display:flex;
  align-items:center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255,255,255,0.10);
  box-sizing: border-box;
}

.brand-mark{
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display:flex;
  align-items:center;
  justify-content:center;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, rgba(59,130,246,1), rgba(59,130,246,0.55));
  box-shadow: 0 10px 24px rgba(0,0,0,0.25);
}

.brand-title{
  color: rgba(255,255,255,.92);
  font-weight: 800;
  font-size: 14px;
  line-height: 1.1;
}

.brand-sub{
  margin-top: 2px;
  color: rgba(255,255,255,.58);
  font-size: 12px;
}

.menu{
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 10px 14px;
  box-sizing: border-box;
}

.menu-inner{
  border-right: 0;
  background: transparent;
}

.menu-inner :deep(.el-menu-item),
.menu-inner :deep(.el-sub-menu__title){
  height: 40px;
  line-height: 40px;
  border-radius: 10px;
  margin: 4px 0;
  color: var(--sidebar-text);
}

.menu-inner :deep(.el-menu-item:hover){
  background: rgba(255,255,255,0.06);
}

.menu-inner :deep(.el-menu-item.is-active){
  color: var(--sidebar-text-active);
  background: var(--sidebar-active-bg);
}
</style>

