import Vue from 'vue';
import Router from 'vue-router';

Vue.use(Router);

export default new Router({
    routes: [
        {
            path: '/',
            redirect: '/dashboard'
        },
        {
            path: '/',
            component: resolve => require(['../components/common/Home.vue'], resolve),
            meta: { title: 'BeeAPM' },
            children:[
                {
                    path: '/dashboard',
                    component: resolve => require(['../components/page/Dashboard.vue'], resolve),
                    name: 'dashboard',
                    meta: { title: '仪表盘', icon: 'el-icon-lx-home', order: 10 }
                },
                {
                    path: '/request',
                    component: resolve => require(['../components/page/Request.vue'], resolve),
                    name: 'request',
                    meta: { title: '请求查询', icon: 'el-icon-lx-people', order: 20 }
                },
                {
                    path: '/method',
                    component: resolve => require(['../components/page/Method.vue'], resolve),
                    name: 'method',
                    meta: { title: '方法查询', icon: 'el-icon-lx-searchlist', order: 25 }
                },
                {
                    path: '/logger',
                    component: resolve => require(['../components/page/Logger.vue'], resolve),
                    name: 'logger',
                    meta: { title: 'Logger查询', icon: 'el-icon-lx-info', order: 40 }
                },
                {
                    path: '/table',
                    component: resolve => require(['../components/page/BaseTable.vue'], resolve),
                    name: 'table',
                    meta: { title: '基础表格', hidden: true }
                },
                {
                    path: '/tabs',
                    component: resolve => require(['../components/page/Tabs.vue'], resolve),
                    name: 'tabs',
                    meta: { title: 'tab选项卡', hidden: true }
                },
                {
                    // 应用列表
                    path: '/appList',
                    component: resolve => require(['../components/page/AppList.vue'], resolve),
                    name: 'appList',
                    meta: { title: '应用列表', icon: 'el-icon-lx-apps', order: 50 }
                },
                {
                    // 权限页面
                    path: '/permission',
                    component: resolve => require(['../components/page/Permission.vue'], resolve),
                    name: 'permission',
                    meta: { title: '权限测试', permission: true, group: 'more', order: 91 }
                },
                {
                    path: '/404',
                    component: resolve => require(['../components/page/404.vue'], resolve),
                    name: '404',
                    meta: { title: '404', hidden: true }
                },
                {
                    path: '/403',
                    component: resolve => require(['../components/page/403.vue'], resolve),
                    name: '403',
                    meta: { title: '403', hidden: true }
                },
                {
                    path: '/sql',
                    component: resolve => require(['../components/page/Sql.vue'], resolve),
                    name: 'sql',
                    meta: { title: 'SQL查询', group: 'db', order: 31 }
                },
                {
                    path: '/tx',
                    component: resolve => require(['../components/page/Tx.vue'], resolve),
                    name: 'tx',
                    meta: { title: '事务查询', group: 'db', order: 32 }
                },
                {
                    path: '/diagnostic',
                    component: resolve => require(['../components/page/Diagnostic.vue'], resolve),
                    name: 'diagnostic',
                    meta: { title: '诊断平台', icon: 'el-icon-lx-repair', order: 60 }
                }
            ]
        },
        {
            path: '/login',
            component: resolve => require(['../components/page/Login.vue'], resolve)
        },
        {
            path: '*',
            redirect: '/404'
        }
    ]
})
