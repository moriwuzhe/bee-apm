<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useUiStore } from '../../../stores/ui'
import {
  DataLine, Connection, Monitor, Tools, Cpu, Setting,
  Grid, Tickets, Bell, Warning,
} from '@element-plus/icons-vue'

const ui = useUiStore()
const route = useRoute()

// 菜单配置 - 明确分类
interface MenuItem {
  path?: string
  title: string
  icon?: any
  children?: MenuItem[]
  divider?: boolean
}

const menuData: MenuItem[] = [
  { path: '/dashboard', title: '仪表盘', icon: DataLine },
  { path: '/alert', title: '智能告警', icon: Bell },
  { path: '/agent-monitor', title: '实时监控', icon: DataLine },
  { path: '/project', title: '项目管理', icon: Tickets },
  { path: '/application', title: '应用管理', icon: Connection },
  {
    path: '/agent',
    title: 'Agent管理',
    icon: Setting,
    children: [
      { path: '/agent', title: 'Agent列表' },
      { divider: true, title: '──────────────' },
      { title: '📊 历史监控', icon: DataLine },
      { path: '/agent/jvm/memory', title: 'JVM内存监控', icon: Monitor },
      { path: '/agent/jvm/gc', title: 'JVM GC分析', icon: DataLine },
      { path: '/agent/jvm/thread', title: 'JVM线程监控', icon: Connection },
      { path: '/agent/jvm/cpu', title: 'JVM CPU监控', icon: Cpu },
      { path: '/agent/jvm/advanced', title: 'JVM高级监控', icon: Tools },
    ],
  },
  { path: '/plugin', title: '插件管理', icon: Tools },
]

// 当前激活的菜单
const activeMenu = computed(() => {
  return route.path
})

const handleMenuClick = (path: string) => {
  if (path) {
    // router.push(path) // 使用router模式自动处理
  }
}

const isDivider = (item: MenuItem) => item.divider || item.title.startsWith('─')
</script>

<template>
  <div class="sidebar">
    <div class="brand" :class="{ collapsed: ui.sidebarCollapsed }">
      <div class="brand-mark">B</div>
      <div v-show="!ui.sidebarCollapsed" class="brand-text">
        <div class="brand-title">Bee APM</div>
        <div class="brand-sub">Performance Monitoring</div>
      </div>
    </div>

    <div class="menu">
      <el-menu
        class="menu-inner"
        :default-active="activeMenu"
        :collapse="ui.sidebarCollapsed"
        router
      >
        <template v-for="item in menuData" :key="item.path || item.title">
          <!-- 分割线 -->
          <div v-if="isDivider(item)" class="menu-divider" v-show="!ui.sidebarCollapsed">
            {{ item.title }}
          </div>
          
          <!-- 子菜单（有children） -->
          <el-sub-menu v-else-if="item.children" :index="item.path || item.title">
            <template #title>
              <el-icon v-if="item.icon">
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </template>
            <el-menu-item
              v-for="child in item.children"
              :key="child.path || child.title"
              :index="child.path"
              class="sub-menu-item"
              :class="{ 'sub-divider': isDivider(child) }"
            >
              <el-icon v-if="child.icon">
                <component :is="child.icon" />
              </el-icon>
              <span>{{ child.title }}</span>
            </el-menu-item>
          </el-sub-menu>
          
          <!-- 普通菜单项 -->
          <el-menu-item v-else :index="item.path">
            <el-icon v-if="item.icon">
              <component :is="item.icon" />
            </el-icon>
            <span>{{ item.title }}</span>
          </el-menu-item>
        </template>
      </el-menu>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--sidebar-bg);
}

.brand {
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  box-sizing: border-box;
}

.brand-mark {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  color: #fff;
  background: linear-gradient(135deg, rgba(59, 130, 246, 1), rgba(59, 130, 246, 0.55));
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
}

.brand-title {
  color: rgba(255, 255, 255, .92);
  font-weight: 800;
  font-size: 14px;
  line-height: 1.1;
}

.brand-sub {
  margin-top: 2px;
  color: rgba(255, 255, 255, .58);
  font-size: 12px;
}

.menu {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 10px 10px 14px;
  box-sizing: border-box;
}

.menu-inner {
  border-right: 0;
  background: transparent;
}

.menu-divider {
  padding: 8px 12px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.3);
  letter-spacing: 1px;
}

.sub-menu-item {
  padding-left: 20px !important;
}

.sub-menu-item.sub-divider {
  pointer-events: none;
  opacity: 0.5;
  font-size: 11px;
}

.menu-inner :deep(.el-menu-item),
.menu-inner :deep(.el-sub-menu__title) {
  height: 40px;
  line-height: 40px;
  border-radius: 10px;
  margin: 4px 0;
  color: var(--sidebar-text);
}

.menu-inner :deep(.el-menu-item:hover) {
  background: rgba(255, 255, 255, 0.06);
}

.menu-inner :deep(.el-menu-item.is-active) {
  color: var(--sidebar-text-active);
  background: var(--sidebar-active-bg);
}
</style>
