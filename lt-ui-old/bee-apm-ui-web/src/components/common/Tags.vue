<template>
    <div class="tags" v-if="showTags">
        <ul>
            <li class="tags-li" v-for="(item,index) in tagsList" :class="{'active': isActive(item.path)}" :key="index">
                <router-link :to="item.path" class="tags-li-title">
                    {{item.title}}
                </router-link>
                <span class="tags-li-icon" @click="closeTags(index)"><i class="el-icon-close"></i></span>
            </li>
        </ul>
        <div class="tags-close-box">
            <el-dropdown @command="handleTags">
                <el-button size="mini" type="primary">
                    标签管理<i class="el-icon-arrow-down el-icon--right"></i>
                </el-button>
                <el-dropdown-menu size="small" slot="dropdown">
                    <el-dropdown-item command="refresh">刷新当前</el-dropdown-item>
                    <el-dropdown-item command="other">关闭其他</el-dropdown-item>
                    <el-dropdown-item command="all">关闭所有</el-dropdown-item>
                </el-dropdown-menu>
            </el-dropdown>
        </div>
    </div>
</template>

<script>
    import bus from './bus';
    export default {
        data() {
            return {
                tagsList: []
            }
        },
        methods: {
            isActive(path) {
                return path === this.$route.fullPath;
            },
            // 关闭单个标签
            closeTags(index) {
                const tmpItem = this.tagsList[index];
                if(tmpItem.name == "dashboard"){
                    return;
                }
                const delItem = this.tagsList.splice(index, 1)[0];
                const item = this.tagsList[index] ? this.tagsList[index] : this.tagsList[index - 1];
                if (item) {
                    delItem.path === this.$route.fullPath && this.$router.push(item.path);
                }else{
                    this.$router.push('/');
                }
            },
            // 关闭全部标签
            closeAll(){
                this.tagsList = [];
                this.$router.push('/');
            },
            // 关闭其他标签
            closeOther(){
                const curItem = this.tagsList.filter(item => {
                    return item.path === this.$route.fullPath;
                })
                this.tagsList = curItem;
            },
            refreshCurTag(){
                const curItem = this.tagsList.filter(item => {
                    if(item.path === this.$route.fullPath){
                        bus.$emit("refreshTag",this.$route.matched[1].components.default.name);
                    }
                })
            },
            // 设置标签
            setTags(route){
                const isExist = this.tagsList.some(item => {
                    return item.path === route.fullPath;
                })
                if(!isExist){
                    if(this.tagsList.length >= 8){
                        this.tagsList.shift();
                    }
                    this.tagsList.push({
                        title: route.meta.title,
                        path: route.fullPath,
                        name: route.matched[1].components.default.name
                    })
                }
                bus.$emit('tags', this.tagsList);
            },
            handleTags(command){
                if(command === 'other'){
                    this.closeOther()
                }else if(command === 'all'){
                    this.closeAll();
                }else if(command === 'refresh'){
                    this.refreshCurTag();
                }
            }
        },
        computed: {
            showTags() {
                return this.tagsList.length > 0;
            }
        },
        watch:{
            $route(newValue, oldValue){
                this.setTags(newValue);
            }
        },
        created(){
            this.setTags(this.$route);
        }
    }

</script>

<style>
    .tags {
        position: relative;
        height: 40px;
        display: flex;
        align-items: center;
        background: var(--surface);
        padding: 0 var(--space-3);
        border-bottom: 1px solid var(--border);
    }

    .tags ul {
        box-sizing: border-box;
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        gap: 6px;
    }

    .tags-li {
        border-radius: 999px;
        font-size: 12px;
        overflow: hidden;
        cursor: pointer;
        height: 28px;
        line-height: 28px;
        border: 1px solid var(--border);
        background: var(--surface);
        padding: 0 10px 0 12px;
        vertical-align: middle;
        color: var(--text);
        transition: all .2s ease;
        display: inline-flex;
        align-items: center;
    }

    .tags-li:not(.active):hover {
        background: rgba(59, 130, 246, 0.06);
    }

    .tags-li.active {
        color: var(--primary);
        border-color: rgba(59, 130, 246, 0.35);
        background: rgba(59, 130, 246, 0.10);
    }

    .tags-li-title {
        max-width: 120px;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
        margin-right: 5px;
        color: inherit;
    }

    .tags-li.active .tags-li-title {
        color: inherit;
    }

    .tags-close-box {
        margin-left: auto;
        height: 40px;
        display: flex;
        align-items: center;
    }
</style>
