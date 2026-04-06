import type { RouteRecordRaw } from 'vue-router'
import { Coin, Connection, DataLine, Grid, Link, Tickets, Tools, Search } from '@element-plus/icons-vue'

import AppLayout from '../ui/layouts/AppLayout.vue'
import LoginView from '../ui/views/LoginView.vue'
import DashboardView from '../ui/views/DashboardView.vue'
import AppQueryView from '../ui/views/AppQueryView.vue'
import AppListView from '../ui/views/AppListView.vue'
import DiagnosticView from '../ui/views/DiagnosticView.vue'
import NotFoundView from '../ui/views/NotFoundView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginView,
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: AppLayout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: DashboardView,
        meta: { title: '仪表盘', nav: true, icon: DataLine, order: 10 },
      },
      {
        path: 'query',
        name: 'query',
        component: AppQueryView,
        meta: { title: '应用查询', nav: true, icon: Search, order: 20 },
      },
      {
        path: 'apps',
        name: 'apps',
        component: AppListView,
        meta: { title: '应用列表', nav: true, icon: Grid, order: 70 },
      },
      {
        path: 'diagnostic',
        name: 'diagnostic',
        component: DiagnosticView,
        meta: { title: '诊断', nav: true, icon: Tools, order: 80 },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFoundView,
    meta: { title: '404', public: true },
  },
]

