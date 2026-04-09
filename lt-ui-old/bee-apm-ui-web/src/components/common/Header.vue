<template>
    <div class="header">
        <div class="header-left">
            <button class="icon-btn" @click="collapseChage" title="折叠侧栏">
                <i class="el-icon-menu"></i>
            </button>
            <div class="logo">BeeAPM</div>
            <div class="crumb">
                <el-breadcrumb class="crumb-breadcrumb" separator="/">
                    <el-breadcrumb-item v-for="(item, idx) in breadcrumbs" :key="idx" :to="item.to">
                        {{ item.title }}
                    </el-breadcrumb-item>
                </el-breadcrumb>
            </div>
        </div>
        <div class="header-right">
            <div id="date-picker">
                <el-date-picker v-model="datePicker.values" type="datetimerange" :picker-options="datePicker.options"
                    range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期"
                    :clearable="datePicker.clearable" :editable="datePicker.editable"
                    @change="sendPickerDate" format="yyyy-MM-dd HH:mm"
                    align="right">
                </el-date-picker>
            </div>
            <button class="icon-btn" @click="toggleTheme" :title="theme === 'dark' ? '切换浅色' : '切换深色'">
                <i :class="theme === 'dark' ? 'el-icon-sunny' : 'el-icon-moon'"></i>
            </button>
            <button class="icon-btn" @click="handleFullScreen" :title="fullscreen ? '退出全屏' : '全屏'">
                <i class="el-icon-rank"></i>
            </button>
            <div class="user-avator"><img src="static/img/img.jpg"></div>
            <el-dropdown class="user-name" trigger="click" @command="handleCommand">
                <span class="el-dropdown-link">
                    {{username}} <i class="el-icon-caret-bottom"></i>
                </span>
                <el-dropdown-menu slot="dropdown">
                    <el-dropdown-item divided command="loginout">退出登录</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
        </div>
    </div>
</template>
<script>
    import bus from '../common/bus';
    export default {
        data() {
            return {
                collapse: false,
                fullscreen: false,
                name: 'linxin',
                message: 2,
                theme: 'light',
                datePicker:{
                    clearable:false,
                    editable: false,
                    options: {
                        shortcuts: [{
                            text: '最近10分钟',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 10 * 60 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近20分钟',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 20 * 60 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近30分钟',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 30 * 60 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近1小时',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 3600 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近2小时',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 2 * 3600 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近4小时',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 4 * 3600 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '最近8小时',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 8 * 3600 * 1000);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '今天就今天',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setHours(0);
                                start.setMinutes(0);
                                start.setSeconds(0);
                                start.setMilliseconds(0);
                                end.setHours(23);
                                end.setMinutes(59);
                                end.setSeconds(59);
                                end.setMilliseconds(999);
                                picker.$emit('pick', [start, end]);
                            }
                        }, {
                            text: '昨天和今天',
                            onClick(picker) {
                                const end = new Date();
                                const start = new Date();
                                start.setTime(start.getTime() - 24 * 3600 * 1000);
                                start.setHours(0);
                                start.setMinutes(0);
                                start.setSeconds(0);
                                start.setMilliseconds(0);
                                end.setHours(23);
                                end.setMinutes(59);
                                end.setSeconds(59);
                                end.setMilliseconds(999);
                                picker.$emit('pick', [start, end]);
                            }
                        }]
                    },
                    values:[new Date(new Date().getTime() - 10 * 60 * 1000), new Date()]
                }

            }
        },
        computed:{
            username(){
                let username = localStorage.getItem('ms_username');
                return username ? username : this.name;
            },
            pageTitle(){
                return (this.$route && this.$route.meta && this.$route.meta.title) ? this.$route.meta.title : 'BeeAPM';
            },
            breadcrumbs(){
                const matched = (this.$route && this.$route.matched) ? this.$route.matched : [];
                const list = matched
                    .filter(r => r && r.meta && r.meta.title && !r.meta.hidden)
                const items = list
                    .map((r, idx) => {
                        const isLast = idx === list.length - 1;
                        const to = isLast ? undefined : { path: r.path === '/' ? '/dashboard' : r.path };
                        return { title: r.meta.title, to };
                    });
                if (!items.length) return [{ title: this.pageTitle, to: undefined }];
                return items;
            }
        },
        methods:{
            // 用户名下拉菜单选择事件
            handleCommand(command) {
                if(command == 'loginout'){
                    localStorage.removeItem('ms_username')
                    this.$router.push('/login');
                }
            },
            // 侧边栏折叠
            collapseChage(){
                this.collapse = !this.collapse;
                bus.$emit('collapse', this.collapse);
            },
            // 全屏事件
            handleFullScreen(){
                let element = document.documentElement;
                if (this.fullscreen) {
                    if (document.exitFullscreen) {
                        document.exitFullscreen();
                    } else if (document.webkitCancelFullScreen) {
                        document.webkitCancelFullScreen();
                    } else if (document.mozCancelFullScreen) {
                        document.mozCancelFullScreen();
                    } else if (document.msExitFullscreen) {
                        document.msExitFullscreen();
                    }
                } else {
                    if (element.requestFullscreen) {
                        element.requestFullscreen();
                    } else if (element.webkitRequestFullScreen) {
                        element.webkitRequestFullScreen();
                    } else if (element.mozRequestFullScreen) {
                        element.mozRequestFullScreen();
                    } else if (element.msRequestFullscreen) {
                        // IE11
                        element.msRequestFullscreen();
                    }
                }
                this.fullscreen = !this.fullscreen;
            },
            sendPickerDate(){
                bus.$emit("pickerDateEvent",this.datePicker.values);
            },
            onGetPickerDateEvent(){
                bus.$emit("pickerDateEvent",this.datePicker.values);
            },
            toggleTheme(){
                this.theme = this.theme === 'dark' ? 'light' : 'dark';
                localStorage.setItem('ms_theme', this.theme);
                document.documentElement.setAttribute('data-theme', this.theme);
            }
        },
        mounted(){
            if(document.body.clientWidth < 1500){
                this.collapseChage();
            }
        },
        created(){
            const saved = localStorage.getItem('ms_theme');
            this.theme = saved === 'dark' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', this.theme);
            bus.$on("getPickerDateEvent", this.onGetPickerDateEvent);
        },
        beforeDestroy(){
            bus.$off("getPickerDateEvent", this.onGetPickerDateEvent);
        }
    }
</script>
<style>
    .header {
        height: var(--header-h);
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-3);
        background: var(--surface);
        border-bottom: 1px solid var(--border);
        box-shadow: var(--shadow-sm);
    }
    .header-left{
        display: flex;
        align-items: center;
        min-width: 0;
        gap: var(--space-2);
    }
    .logo{
        font-size: 16px;
        font-weight: 700;
        color: var(--text);
        letter-spacing: .2px;
        padding: 0 var(--space-2);
        border-right: 1px solid var(--border);
    }
    .crumb{
        min-width: 0;
        display: flex;
        align-items: center;
        color: var(--text-muted);
        font-size: 13px;
    }
    .crumb-breadcrumb{
        min-width: 0;
    }
    .crumb-breadcrumb .el-breadcrumb__inner,
    .crumb-breadcrumb .el-breadcrumb__separator{
        color: var(--text-muted);
    }
    .crumb-breadcrumb .el-breadcrumb__item:last-child .el-breadcrumb__inner{
        color: var(--text);
        font-weight: 600;
    }
    .header-right{
        display: flex;
        align-items: center;
        gap: var(--space-2);
    }

    #date-picker .el-date-editor{
        width: 320px;
    }
    @media (max-width: 1400px){
        #date-picker .el-date-editor{
            width: 260px;
        }
    }
    .icon-btn{
        width: 34px;
        height: 34px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--shadow-sm);
    }
    .user-name{
        margin-left: 4px;
    }
    .user-avator{
        margin-left: 8px;
    }
    .user-avator img{
        display: block;
        width:32px;
        height:32px;
        border-radius: 50%;
        border: 1px solid var(--border);
    }
    .el-dropdown-link{
        color: var(--text);
        cursor: pointer;
    }
</style>
