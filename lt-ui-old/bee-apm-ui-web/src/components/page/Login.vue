<template>
    <div class="login-wrap">
        <div class="login-mask"></div>

        <div class="login-card">
            <div class="login-brand">
                <div class="brand-mark">B</div>
                <div class="brand-meta">
                    <div class="brand-title">BeeAPM</div>
                    <div class="brand-sub">登录控制台</div>
                </div>
            </div>

            <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="0px" class="login-form">
                <el-form-item prop="username">
                    <el-input v-model="ruleForm.username" placeholder="用户名">
                        <i slot="prefix" class="el-icon-user"></i>
                    </el-input>
                </el-form-item>
                <el-form-item prop="password">
                    <el-input type="password" placeholder="密码" v-model="ruleForm.password" @keyup.enter.native="submitForm('ruleForm')">
                        <i slot="prefix" class="el-icon-lock"></i>
                    </el-input>
                </el-form-item>

                <el-button class="login-btn" type="primary" @click="submitForm('ruleForm')">登录</el-button>
                <div class="login-tips">Tips：用户名和密码随便填（演示）。</div>
            </el-form>
        </div>
    </div>
</template>

<script>
    export default {
        data: function(){
            return {
                ruleForm: {
                    username: 'admin',
                    password: '123123'
                },
                rules: {
                    username: [
                        { required: true, message: '请输入用户名', trigger: 'blur' }
                    ],
                    password: [
                        { required: true, message: '请输入密码', trigger: 'blur' }
                    ]
                }
            }
        },
        methods: {
            submitForm(formName) {
                this.$refs[formName].validate((valid) => {
                    if (valid) {
                        localStorage.setItem('ms_username',this.ruleForm.username);
                        this.$router.push('/');
                    } else {
                        console.log('error submit!!');
                        return false;
                    }
                });
            }
        }
    }
</script>

<style scoped>
    .login-wrap{
        position: relative;
        width:100%;
        height:100%;
        display:flex;
        align-items:center;
        justify-content:center;
        background-image: url(../../assets/login-bg.jpg);
        background-size: cover;
        background-position: center;
    }

    .login-mask{
        position:absolute;
        inset:0;
        background:
            radial-gradient(900px 500px at 20% 20%, rgba(59,130,246,0.28), transparent 60%),
            radial-gradient(900px 500px at 80% 10%, rgba(16,185,129,0.18), transparent 55%),
            rgba(15, 23, 42, 0.55);
        backdrop-filter: blur(2px);
    }

    .login-card{
        position: relative;
        width: 380px;
        padding: 22px 22px 18px;
        border-radius: 14px;
        background: rgba(255,255,255,0.92);
        border: 1px solid rgba(255,255,255,0.45);
        box-shadow: 0 18px 60px rgba(0,0,0,0.28);
    }

    .login-brand{
        display:flex;
        align-items:center;
        gap: 12px;
        margin-bottom: 14px;
    }

    .brand-mark{
        width: 40px;
        height: 40px;
        border-radius: 12px;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight: 900;
        color:#fff;
        background: linear-gradient(135deg, rgba(59,130,246,1), rgba(59,130,246,0.55));
    }

    .brand-title{
        font-weight: 800;
        color: #0f172a;
        font-size: 16px;
        line-height: 1.1;
    }

    .brand-sub{
        color: #64748b;
        font-size: 12px;
        margin-top: 2px;
    }

    .login-form{
        margin-top: 8px;
    }

    .login-btn{
        width: 100%;
        margin-top: 8px;
    }

    .login-tips{
        margin-top: 10px;
        font-size: 12px;
        color: #64748b;
    }

    html[data-theme="dark"] .login-card{
        background: rgba(15,23,42,0.88);
        border-color: rgba(255,255,255,0.12);
    }

    html[data-theme="dark"] .brand-title{
        color: rgba(255,255,255,0.92);
    }

    html[data-theme="dark"] .brand-sub,
    html[data-theme="dark"] .login-tips{
        color: rgba(255,255,255,0.62);
    }
</style>
