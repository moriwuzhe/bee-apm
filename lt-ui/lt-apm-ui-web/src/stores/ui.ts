import { defineStore } from 'pinia'

const LS_THEME = 'ms_theme'
const LS_COLLAPSED = 'ms_sidebar_collapsed'

type Theme = 'light' | 'dark'

function normalizeTheme(v: string | null): Theme {
  return v === 'dark' ? 'dark' : 'light'
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute('data-theme', theme)
}

export const useUiStore = defineStore('ui', {
  state: () => ({
    theme: normalizeTheme(localStorage.getItem(LS_THEME)),
    sidebarCollapsed: localStorage.getItem(LS_COLLAPSED) === '1',
  }),
  actions: {
    init() {
      applyTheme(this.theme)
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem(LS_THEME, this.theme)
      applyTheme(this.theme)
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
      localStorage.setItem(LS_COLLAPSED, this.sidebarCollapsed ? '1' : '0')
    },
  },
})

