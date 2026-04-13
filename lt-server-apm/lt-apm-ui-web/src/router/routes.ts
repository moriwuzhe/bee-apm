import type { RouteRecordRaw } from 'vue-router'
import { Bell, Coin, Connection, DataLine, Grid, Link, Tickets, Tools } from '@element-plus/icons-vue'

import AppLayout from '../ui/layouts/AppLayout.vue'
import LoginView from '../ui/views/LoginView.vue'
import DashboardView from '../ui/views/DashboardView.vue'
import RequestView from '../ui/views/RequestView.vue'
import MethodView from '../ui/views/MethodView.vue'
import SqlView from '../ui/views/SqlView.vue'
import TxView from '../ui/views/TxView.vue'
import LoggerView from '../ui/views/LoggerView.vue'
import AppListView from '../ui/views/AppListView.vue'
import AppDetailView from '../ui/views/AppDetailView.vue'
import DiagnosticView from '../ui/views/DiagnosticView.vue'
import OnlineDebugView from '../ui/views/OnlineDebugView.vue'
import ProfilerView from '../ui/views/ProfilerView.vue'
import AlertView from '../ui/views/AlertView.vue'
import ProjectView from '../ui/views/ProjectView.vue'
import ApplicationView from '../ui/views/ApplicationView.vue'
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
        path: 'apps',
        name: 'apps',
        component: AppListView,
        meta: { title: '应用列表', nav: true, icon: Grid, order: 20 },
      },
      {
        path: 'apps/:app',
        component: AppDetailView,
        redirect: (to) => ({ path: `/apps/${encodeURIComponent(String((to.params as any).app || ''))}/request`, query: to.query }),
        meta: { title: '应用', nav: false, icon: Grid, order: 21 },
        children: [
          { path: 'request', name: 'app-request', component: RequestView, meta: { title: '请求查询', nav: false } },
          { path: 'method', name: 'app-method', component: MethodView, meta: { title: '方法查询', nav: false } },
          { path: 'sql', name: 'app-sql', component: SqlView, meta: { title: 'SQL查询', nav: false } },
          { path: 'tx', name: 'app-tx', component: TxView, meta: { title: '事务查询', nav: false } },
          { path: 'logger', name: 'app-logger', component: LoggerView, meta: { title: 'Logger查询', nav: false } },
          { path: 'diagnostic', name: 'app-diagnostic', component: DiagnosticView, meta: { title: '诊断', nav: false } },
        ],
      },
      // 查询类页面只在应用详情页的标签页中，不单独在侧边栏显示
      { path: 'online-debug', name: 'online-debug', component: OnlineDebugView, meta: { title: '线上调试', nav: true, icon: Tools, order: 90 } },
      { path: 'profiler', name: 'profiler', component: ProfilerView, meta: { title: '性能剖析(火焰图)', nav: true, icon: Tools, order: 100 } },
      {
        path: 'alert',
        name: 'alert',
        component: AlertView,
        meta: { title: '智能告警', nav: true, icon: Bell, order: 25 },
      },
      {
        path: 'project',
        name: 'project',
        component: ProjectView,
        meta: { title: '项目管理', nav: true, icon: Tickets, order: 30 },
      },
      {
        path: 'application',
        name: 'application',
        component: ApplicationView,
        meta: { title: '应用管理', nav: true, icon: Connection, order: 31 },
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

