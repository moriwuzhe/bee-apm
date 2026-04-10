<template>
    <div>
        <el-row :gutter="20">
            <el-col :span="24">
                <el-row :gutter="20" class="mgb20">
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}">
                            <div class="grid-content grid-con-error">
                                <i class="el-icon-lx-notice grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{statData.error}}</div>
                                    <div>异常量</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}">
                            <div class="grid-content grid-con-inst">
                                <i class="el-icon-lx-apps grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{statData.inst}}</div>
                                    <div>实例数</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}">
                            <div class="grid-content grid-con-visit">
                                <i class="el-icon-lx-people grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{statData.req}}</div>
                                    <div>请求量</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                    <el-col :span="6">
                        <el-card shadow="hover" :body-style="{padding: '0px'}">
                            <div class="grid-content grid-con-log">
                                <i class="el-icon-lx-rank grid-con-icon"></i>
                                <div class="grid-cont-right">
                                    <div class="grid-num">{{statData.log}}</div>
                                    <div>采集量</div>
                                </div>
                            </div>
                        </el-card>
                    </el-col>
                </el-row>
            </el-col>
        </el-row>
        <el-row :gutter="20" class="mgb20">
            <el-col :span="9">
                <el-card >
                    <ve-pie :data="errorPieData" :theme="light" :title="errorPieTitle" :extend="errorPieExtend"  :settings="errorPieSettings"></ve-pie>
                </el-card>
            </el-col>
            <el-col :span="15">
                <el-card>
                    <ve-line :data="errorLineData" :theme="light" :title="errorLineTitle" :extend="errorLineExtend" :settings="errorLineSettings"></ve-line>
                </el-card>
            </el-col>
        </el-row>
        <el-row :gutter="20">
            <el-col :span="9">
                <el-card shadow="hover">
                    <ve-bar :data="requestBarData" :theme="light" :legend-visible='false' :title="requestBarTitle" :extend="requestBarExtend" :settings="requestBarSettings"></ve-bar>
                </el-card>
            </el-col>
            <el-col :span="15">
                <el-card shadow="hover">
                    <ve-line :data="requestLineData" :theme="light" :title="requestLineTitle" :extend="requestLineExtend" :settings="requestLineSettings"></ve-line>
                </el-card>
            </el-col>
        </el-row>
    </div>
</template>
<style src="../css/dashboard.css"></style>
<script>
    import bus from '../common/bus';
    let moment = require("moment");
    const light = require('echarts/lib/theme/light');
    export default {
        name: 'dashboard',
        data() {
            return {
                light:light,
                pickerDate:[],
                activeTagTitle:'仪表盘',
                name: localStorage.getItem('ms_username'),
                statData:{
                    req: 0,
                    log: 0,
                    inst: 0,
                    error: 0
                },
                errorPieData: {
                    title:'异常占比',
                    columns: ['name', 'value'],
                    rows: []
                },
                errorLineData: {
                    columns: [],
                    rows: []
                },
                requestBarData:{
                    columns: ['区间', '请求数量'],
                    rows: []
                },
                requestLineData: {
                    columns: ['time', '0-200',"200-500","500-1000","1000-2000","2000-5000","5000-*"],
                    rows: []
                },
                errorLineExtend: {
                    'xAxis.0.axisLabel.rotate': 60,
                    'xAxis.0.boundaryGap':false,
                    series(v) {
                        v.forEach(i => {
                            i.barMaxWidth = 30
                        })
                        return v
                    },
                    toolbox: {
                        y:15,
                        feature: {
                            mark : {show: true},
                            magicType : {show: true, type: ['line', 'bar','stack','tiled']}
                        }
                    },
                },
                errorPieSettings : {
                    limitShowNum: 8
                },
                errorPieExtend : {
                },
                errorPieTitle : {
                    text:"异常占比",
                    bottom:"10",
                    left: 'middle'
                },
                errorLineSettings : {
                    area: true
                },
                errorLineTitle : {
                    text:"异常趋势图",
                    bottom:"10",
                    left: 'middle'
                },
                requestBarSettings : {
                },
                requestBarExtend : {
                    series(v) {
                        v.forEach(i => {
                            i.barMaxWidth = 30
                        })
                        return v
                    },
                },
                requestBarTitle : {
                    text:'请求耗时区间统计',
                    bottom:"10",
                    left: 'middle'
                },
                requestLineSettings: {
                },
                requestLineExtend: {
                    series(v) {
                        v.forEach(i => {
                            i.barMaxWidth = 30
                        })
                        return v
                    },
                    'xAxis.0.axisLabel.rotate': 60,
                    'xAxis.0.boundaryGap':false,
                    toolbox: {
                        feature: {
                            mark : {show: true},
                            magicType : {show: true, type: ['line', 'bar','stack','tiled']}
                        }
                    }
                },
                requestLineTitle : {
                    text:"请求量趋势图（耗时区间）",
                    bottom:"10",
                    left: 'middle'
                },

            }
        },
        components: {
        },
        computed: {
            role() {
                return this.name === 'admin' ? '超级管理员' : '普通用户';
            }
        },
        created(){
            bus.$on("refreshTag", this.onRefreshTag);
            bus.$on("pickerDateEvent", this.onPickerDateEvent);
            bus.$emit("getPickerDateEvent");
            this.reloadAll();
        },
        beforeDestroy(){
            bus.$off("refreshTag", this.onRefreshTag);
            bus.$off("pickerDateEvent", this.onPickerDateEvent);
        },
        activated(){
        },
        deactivated(){
        },
        methods: {
            reloadAll(){
                this.getStatData();
                this.getErrorPieData();
                this.getErrorLineData();
                this.getRequestBarData();
                this.getRequestLineData();
            },
            onRefreshTag(val){
                if(val === 'dashboard'){
                    this.reloadAll();
                }
            },
            onPickerDateEvent(val){
                this.pickerDate = Array.isArray(val) ? val : [];
            },
            getBeginTime(){
                const start = (this.pickerDate && this.pickerDate[0]) ? this.pickerDate[0] : new Date(new Date().getTime() - 10 * 60 * 1000);
                return moment(start).format('YYYY-MM-DD HH:mm');
            },
            getEndTime(){
                const end = (this.pickerDate && this.pickerDate[1]) ? this.pickerDate[1] : new Date();
                return moment(end).format('YYYY-MM-DD HH:mm');
            },
            getStatData(){
                const url = "/api/dashboard/stat";
                this.$axios.post(url, {
                    beginTime: this.getBeginTime(),
                    endTime:this.getEndTime(),
                }).then((res) => {
                    this.statData = (res && res.data) ? res.data : { req: 0, log: 0, inst: 0, error: 0 };
                }).catch(() => {
                    this.statData = { req: 0, log: 0, inst: 0, error: 0 };
                })
            },
            getErrorPieData(){
                const url = "/api/dashboard/getErrorPieData";
                this.$axios.post(url, {
                    beginTime: this.getBeginTime(),
                    endTime:this.getEndTime(),
                }).then((res) => {
                    const rows = (res && res.data && Array.isArray(res.data.result)) ? res.data.result : [];
                    this.errorPieData.rows = rows;
                }).catch(() => {
                    this.errorPieData.rows = [];
                })
            },
            getErrorLineData(){
                const url = "/api/dashboard/getErrorLineData";
                this.$axios.post(url, {
                    beginTime: this.getBeginTime(),
                    endTime:this.getEndTime(),
                }).then((res) => {
                    const rows = (res && res.data && Array.isArray(res.data.rows)) ? res.data.rows : [];
                    const columns = (res && res.data && Array.isArray(res.data.columns)) ? res.data.columns : [];
                    this.errorLineData.rows = rows;
                    this.errorLineData.columns = columns;
                }).catch(() => {
                    this.errorLineData.rows = [];
                    this.errorLineData.columns = [];
                })
            },
            getRequestBarData(){
                const url = "/api/dashboard/getRequestBarData";
                this.$axios.post(url, {
                    beginTime: this.getBeginTime(),
                    endTime:this.getEndTime(),
                }).then((res) => {
                    const rows = (res && res.data && Array.isArray(res.data.result)) ? res.data.result : [];
                    this.requestBarData.rows = rows;
                }).catch(() => {
                    this.requestBarData.rows = [];
                })
            },
            getRequestLineData(){
                const url = "/api/dashboard/getRequestLineData";
                this.$axios.post(url, {
                    beginTime: this.getBeginTime(),
                    endTime:this.getEndTime(),
                }).then((res) => {
                    const rows = (res && res.data && Array.isArray(res.data.rows)) ? res.data.rows : [];
                    this.requestLineData.rows = rows;
                }).catch(() => {
                    this.requestLineData.rows = [];
                })
            }
        }
    }
</script>
