<script setup lang="ts">
import { onMounted } from 'vue'
import { useUiStore } from '../../stores/ui'
import AppHeader from '../layouts/components/AppHeader.vue'
import AppSidebar from '../layouts/components/AppSidebar.vue'

const ui = useUiStore()

onMounted(() => {
  ui.init()
})
</script>

<template>
  <div class="app-shell" :class="{ collapsed: ui.sidebarCollapsed }">
    <aside class="app-sidebar">
      <AppSidebar />
    </aside>

    <div class="app-main">
      <header class="app-header">
        <AppHeader />
      </header>

      <main class="app-content">
        <RouterView v-slot="{ Component, route }">
          <KeepAlive include="DashboardView,AppQueryView,AppListView">
            <component :is="Component" :key="route.fullPath" />
          </KeepAlive>
        </RouterView>
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell{
  height: 100vh;
  display:flex;
  background: var(--app-bg);
  color: var(--text);
}

.app-sidebar{
  width: var(--sidebar-w);
  background: var(--sidebar-bg);
  border-right: 1px solid var(--border);
  transition: width .18s ease;
  overflow:hidden;
}

.app-shell.collapsed .app-sidebar{
  width: var(--sidebar-collapsed-w);
}

.app-main{
  flex: 1;
  min-width: 0;
  display:flex;
  flex-direction: column;
}

.app-header{
  height: var(--header-h);
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  box-shadow: var(--shadow-sm);
}

.app-content{
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: var(--space-4);
}
</style>

