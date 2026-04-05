<template>
    <div class="wrapper" :class="{ 'is-collapsed': collapse }">
        <v-head></v-head>
        <div class="app-body">
            <v-sidebar></v-sidebar>
            <div class="content-box">
                <v-tags></v-tags>
                <div class="content">
                    <transition name="move" mode="out-in">
                        <keep-alive :include="tagsList">
                            <router-view></router-view>
                        </keep-alive>
                    </transition>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import vHead from './Header.vue';
    import vSidebar from './Sidebar.vue';
    import vTags from './Tags.vue';
    import bus from './bus';
    export default {
        data(){
            return {
                tagsList: [],
                collapse: false
            }
        },
        components:{
            vHead, vSidebar, vTags
        },
        created(){
            bus.$on('collapse', this.onCollapse);
            bus.$on('tags', this.onTags);
        },
        beforeDestroy(){
            bus.$off('collapse', this.onCollapse);
            bus.$off('tags', this.onTags);
        },
        methods:{
            onCollapse(msg){
                this.collapse = msg;
            },
            onTags(msg){
                let arr = [];
                for(let i = 0, len = msg.length; i < len; i ++){
                    msg[i].name && arr.push(msg[i].name);
                }
                this.tagsList = arr;
            }
        }
    }
</script>
