<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useUiStore } from '../../stores/ui'

const router = useRouter()
const auth = useAuthStore()
const ui = useUiStore()

ui.init()

const formRef = ref<FormInstance>()
const form = reactive({
  username: auth.username || 'admin',
  password: '123123',
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function onSubmit() {
  await formRef.value?.validate()
  auth.login(form.username)
  router.replace('/dashboard')
}
</script>

<template>
  <div class="login">
    <div class="mask" />
    <div class="card">
      <div class="brand">
        <div class="mark">B</div>
        <div class="meta">
          <div class="title">BeeAPM</div>
          <div class="sub">登录控制台</div>
        </div>
      </div>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="0" class="form">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password @keyup.enter="onSubmit" />
        </el-form-item>

        <el-button type="primary" size="large" class="btn" @click="onSubmit">登录</el-button>
        <div class="tips">Tips：用户名和密码随便填（演示）。</div>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login{
  position: relative;
  min-height: 100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  background:
    radial-gradient(900px 500px at 20% 20%, rgba(59,130,246,0.22), transparent 60%),
    radial-gradient(900px 500px at 80% 10%, rgba(16,185,129,0.16), transparent 55%),
    linear-gradient(180deg, rgba(2,6,23,0.75), rgba(2,6,23,0.65));
}

.mask{
  position:absolute;
  inset:0;
  background:
    radial-gradient(900px 600px at 50% 10%, rgba(255,255,255,0.05), transparent 55%),
    radial-gradient(900px 600px at 60% 70%, rgba(59,130,246,0.10), transparent 60%);
  pointer-events:none;
}

.card{
  position: relative;
  width: 380px;
  padding: 22px 22px 18px;
  border-radius: 14px;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(255,255,255,0.45);
  box-shadow: 0 18px 60px rgba(0,0,0,0.28);
}

html[data-theme="dark"] .card{
  background: rgba(15,23,42,0.88);
  border-color: rgba(255,255,255,0.12);
}

.brand{
  display:flex;
  align-items:center;
  gap: 12px;
  margin-bottom: 14px;
}

.mark{
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

.title{
  font-weight: 800;
  color: #0f172a;
  font-size: 16px;
  line-height: 1.1;
}

html[data-theme="dark"] .title{
  color: rgba(255,255,255,0.92);
}

.sub{
  margin-top: 2px;
  font-size: 12px;
  color: #64748b;
}

html[data-theme="dark"] .sub{
  color: rgba(255,255,255,0.62);
}

.form{
  margin-top: 8px;
}

.btn{
  width: 100%;
  margin-top: 6px;
}

.tips{
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

html[data-theme="dark"] .tips{
  color: rgba(255,255,255,0.62);
}
</style>

