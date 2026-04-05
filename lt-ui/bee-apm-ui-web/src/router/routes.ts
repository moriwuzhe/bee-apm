import type { RouteRecordRaw } from 'vue-router'
import { Coin, Connection, DataLine, Grid, Link, Tickets } from '@element-plus/icons-vue'

import AppLayout from '../ui/layouts/AppLayout.vue'
import LoginView from '../ui/views/LoginView.vue'
import DashboardView from '../ui/views/DashboardView.vue'
import RequestView from '../ui/views/RequestView.vue'
import MethodView from '../ui/views/MethodView.vue'
import SqlView from '../ui/views/SqlView.vue'
import TxView from '../ui/views/TxView.vue'
import LoggerView from '../ui/views/LoggerView.vue'
import AppListView from '../ui/views/AppListView.vue'
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
        path: 'request',
        name: 'request',
        component: RequestView,
        meta: { title: '请求查询', nav: true, icon: Link, order: 20 },
      },
      {
        path: 'method',
        name: 'method',
        component: MethodView,
        meta: { title: '方法查询', nav: true, icon: Link, order: 30 },
      },
      {
        path: 'sql',
        name: 'sql',
        component: SqlView,
        meta: { title: 'SQL查询', nav: true, icon: Coin, order: 40 },
      },
      {
        path: 'tx',
        name: 'tx',
        component: TxView,
        meta: { title: '事务查询', nav: true, icon: Connection, order: 50 },
      },
      {
        path: 'logger',
        name: 'logger',
        component: LoggerView,
        meta: { title: 'Logger查询', nav: true, icon: Tickets, order: 60 },
      },
      {
        path: 'apps',
        name: 'apps',
        component: AppListView,
        meta: { title: '应用列表', nav: true, icon: Grid, order: 70 },
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

