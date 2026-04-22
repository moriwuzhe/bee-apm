import type { RouteRecordRaw } from 'vue-router'
import { Bell, Connection, DataLine, Grid, Tickets, Tools, Cpu, Monitor } from '@element-plus/icons-vue'

import AppLayout from '../ui/layouts/AppLayout.vue'
import LoginView from '../ui/views/LoginView.vue'
import DashboardView from '../ui/views/DashboardView.vue'
import RequestView from '../ui/views/RequestView.vue'
import MethodView from '../ui/views/MethodView.vue'
import SqlView from '../ui/views/SqlView.vue'
import TxView from '../ui/views/TxView.vue'
import LoggerView from '../ui/views/LoggerView.vue'
// import AppListView from '../ui/views/AppListView.vue' // 已合并到 ApplicationView
import AppDetailView from '../ui/views/AppDetailView.vue'
import DiagnosticView from '../ui/views/DiagnosticView.vue'
import OnlineDebugView from '../ui/views/OnlineDebugView.vue'
import ProfilerView from '../ui/views/ProfilerView.vue'
import AlertView from '../ui/views/AlertView.vue'
import AlertManagementView from '../ui/views/AlertManagementView.vue'
import AgentMonitorView from '../ui/views/AgentMonitorView.vue'
import ProjectView from '../ui/views/ProjectView.vue'
import ApplicationView from '../ui/views/ApplicationView.vue'
import AgentView from '../ui/views/AgentView.vue'
import PluginView from '../ui/views/PluginView.vue'
import AgentDiagView from '../ui/views/AgentDiagView.vue'
// JVM Monitoring Views
import JvmMemoryView from '../ui/views/jvm/JvmMemoryView.vue'
import JvmGcView from '../ui/views/jvm/JvmGcView.vue'
import JvmThreadView from '../ui/views/jvm/JvmThreadView.vue'
import JvmCpuView from '../ui/views/jvm/JvmCpuView.vue'
import JvmAdvancedView from '../ui/views/jvm/JvmAdvancedView.vue'
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
      // 应用列表不再单独显示，合并到应用管理中
      // {
      //   path: 'apps',
      //   name: 'apps',
      //   component: AppListView,
      //   meta: { title: '应用列表', nav: true, icon: Grid, order: 20 },
      // },
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
        path: 'alert-management',
        name: 'alert-management',
        component: AlertManagementView,
        meta: { title: 'Agent告警', nav: true, icon: Bell, order: 26 },
      },
      {
        path: 'agent-monitor',
        name: 'agent-monitor',
        component: AgentMonitorView,
        meta: { title: '实时监控', nav: true, icon: DataLine, order: 27 },
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
      {
        path: 'agent',
        name: 'agent',
        component: AgentView,
        meta: { title: 'Agent管理', nav: true, icon: Connection, order: 32 },
      },
      // ============================================
      // JVM Historical Monitoring (历史监控)
      // 数据来自数据库，支持时间范围查询和实时监控
      // ============================================
      {
        path: 'agent/jvm/memory',
        name: 'jvm-memory',
        component: JvmMemoryView,
        meta: { title: 'JVM内存监控', nav: true, icon: Monitor, order: 33, parent: 'agent', category: 'monitoring' },
      },
      {
        path: 'agent/jvm/gc',
        name: 'jvm-gc',
        component: JvmGcView,
        meta: { title: 'JVM GC分析', nav: true, icon: DataLine, order: 34, parent: 'agent', category: 'monitoring' },
      },
      {
        path: 'agent/jvm/thread',
        name: 'jvm-thread',
        component: JvmThreadView,
        meta: { title: 'JVM线程监控', nav: true, icon: Connection, order: 35, parent: 'agent', category: 'monitoring' },
      },
      {
        path: 'agent/jvm/cpu',
        name: 'jvm-cpu',
        component: JvmCpuView,
        meta: { title: 'JVM CPU监控', nav: true, icon: Cpu, order: 36, parent: 'agent', category: 'monitoring' },
      },
      {
        path: 'agent/jvm/advanced',
        name: 'jvm-advanced',
        component: JvmAdvancedView,
        meta: { title: 'JVM高级监控', nav: true, icon: Tools, order: 37, parent: 'agent', category: 'monitoring' },
      },
      {
        path: 'plugin',
        name: 'plugin',
        component: PluginView,
        meta: { title: '插件管理', nav: true, icon: Tools, order: 38 },
      },
      {
        path: 'agent-diag',
        name: 'agent-diag',
        component: AgentDiagView,
        meta: { title: 'Agent诊断分析', nav: true, icon: Monitor, order: 39 },
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

