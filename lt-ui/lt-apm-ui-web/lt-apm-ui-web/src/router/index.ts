import { createRouter, createWebHashHistory } from 'vue-router'
import { routes } from './routes'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores/pinia'

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore(pinia)

  const isPublic = Boolean(to.meta && (to.meta as any).public)
  if (isPublic) return true

  if (!auth.isAuthed) return { path: '/login', replace: true }

  return true
})

router.afterEach((to) => {
  const title = (to.meta && (to.meta as any).title) ? String((to.meta as any).title) : 'LtMonitor'
  document.title = title
})

