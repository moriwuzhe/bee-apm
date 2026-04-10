<template>
    <div class="sidebar">
        <div class="sidebar-brand" :class="{ collapsed: collapse }">
            <div class="brand-mark">B</div>
            <div class="brand-text" v-show="!collapse">
                <div class="brand-title">LtMonitor</div>
                <div class="brand-sub">Observability</div>
            </div>
        </div>

        <div class="sidebar-menu">
            <el-menu class="sidebar-el-menu" :default-active="onRoutes" :collapse="collapse" unique-opened router>
                <template v-for="item in items">
                    <template v-if="item.subs">
                        <el-submenu :index="item.index" :key="item.index">
                            <template slot="title">
                                <i v-if="item.icon" :class="item.icon"></i><span slot="title">{{ item.title }}</span>
                            </template>
                            <template v-for="subItem in item.subs">
                                <el-submenu v-if="subItem.subs" :index="subItem.index" :key="subItem.index">
                                    <template slot="title">{{ subItem.title }}</template>
                                    <el-menu-item v-for="(threeItem,i) in subItem.subs" :key="i" :index="threeItem.index">
                                        {{ threeItem.title }}
                                    </el-menu-item>
                                </el-submenu>
                                <el-menu-item v-else :index="subItem.index" :key="subItem.index">
                                    {{ subItem.title }}
                                </el-menu-item>
                            </template>
                        </el-submenu>
                    </template>
                    <template v-else>
                        <el-menu-item :index="item.index" :key="item.index">
                            <i v-if="item.icon" :class="item.icon"></i><span slot="title">{{ item.title }}</span>
                        </el-menu-item>
                    </template>
                </template>
            </el-menu>
        </div>
    </div>
</template>

<script>
    import bus from '../common/bus';
    import navGroups from '../../config/navGroups';
    export default {
        data() {
            return {
                collapse: false
            }
        },
        computed:{
            onRoutes(){
                return this.$route.path;
            },
            items(){
                var routes = (this.$router && this.$router.options && this.$router.options.routes) ? this.$router.options.routes : [];
                var home = null;
                for (var i = 0; i < routes.length; i++) {
                    if (routes[i] && routes[i].path === '/' && routes[i].children && routes[i].children.length) {
                        home = routes[i];
                        break;
                    }
                }
                var children = (home && home.children) ? home.children : [];

                var getOrder = function (path) {
                    for (var j = 0; j < children.length; j++) {
                        if (children[j] && children[j].path === path) {
                            return (children[j].meta && children[j].meta.order) ? children[j].meta.order : 0;
                        }
                    }
                    return 0;
                };

                var groups = {};
                for (var g = 0; g < navGroups.length; g++) {
                    var def = navGroups[g];
                    groups[def.id] = {
                        id: def.id,
                        title: def.title,
                        icon: def.icon,
                        order: def.order,
                        index: 'group:' + def.id,
                        subs: []
                    };
                }

                var top = [];
                for (var r = 0; r < children.length; r++) {
                    var route = children[r];
                    var meta = route && route.meta ? route.meta : {};
                    if (!meta.title || meta.hidden) continue;
                    var item = { index: route.path, title: meta.title, icon: meta.icon };
                    if (meta.group && groups[meta.group]) {
                        groups[meta.group].subs.push(item);
                    } else {
                        top.push(item);
                    }
                }

                top.sort(function (a, b) { return getOrder(a.index) - getOrder(b.index); });

                var groupList = [];
                var sortedGroups = navGroups.slice().sort(function (a, b) { return (a.order || 0) - (b.order || 0); });
                for (var k = 0; k < sortedGroups.length; k++) {
                    var group = groups[sortedGroups[k].id];
                    if (!group || !group.subs.length) continue;
                    group.subs.sort(function (a, b) { return getOrder(a.index) - getOrder(b.index); });
                    groupList.push(group);
                }

                return top.concat(groupList);
            }
        },
        created(){
            bus.$on('collapse', this.onCollapse);
        },
        beforeDestroy(){
            bus.$off('collapse', this.onCollapse);
        },
        methods:{
            onCollapse(msg){
                this.collapse = msg;
            }
        }
    }
</script>

<style>
    .sidebar{
        display:flex;
        flex-direction:column;
        overflow:hidden;
        background: var(--sidebar-bg);
    }

    .sidebar-brand{
        height: 56px;
        display:flex;
        align-items:center;
        gap: 10px;
        padding: 0 14px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
        box-sizing: border-box;
    }

    .brand-mark{
        width: 32px;
        height: 32px;
        border-radius: 10px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight: 800;
        color: #fff;
        background: linear-gradient(135deg, rgba(59,130,246,1), rgba(59,130,246,0.55));
        box-shadow: 0 8px 18px rgba(0,0,0,.22);
    }

    .brand-title{
        color: rgba(255,255,255,.92);
        font-weight: 700;
        font-size: 14px;
        line-height: 1.1;
    }

    .brand-sub{
        color: rgba(255,255,255,.55);
        font-size: 12px;
        margin-top: 2px;
    }

    .sidebar-menu{
        flex: 1;
        min-height: 0;
        overflow: auto;
    }

    .sidebar-el-menu{
        height: 100%;
        border-right: 0;
        background: var(--sidebar-bg) !important;
        padding: 10px 10px 14px;
        box-sizing: border-box;
    }
    .sidebar-el-menu .el-menu-item,
    .sidebar-el-menu .el-submenu__title{
        color: var(--sidebar-text) !important;
        height: 40px;
        line-height: 40px;
        border-radius: 10px;
        margin: 4px 0;
    }

    .sidebar-el-menu .el-menu-item:hover,
    .sidebar-el-menu .el-submenu__title:hover{
        background: rgba(255,255,255,0.06) !important;
    }

    .sidebar-el-menu .el-menu-item.is-active{
        color: var(--sidebar-text-active) !important;
        background: var(--sidebar-active-bg) !important;
        position: relative;
    }

    .sidebar-el-menu .el-menu-item.is-active::before{
        content: '';
        position:absolute;
        left: 6px;
        top: 10px;
        bottom: 10px;
        width: 3px;
        border-radius: 3px;
        background: rgba(59,130,246,1);
    }
    .sidebar-el-menu:not(.el-menu--collapse){
        width: 100%;
    }
</style>
