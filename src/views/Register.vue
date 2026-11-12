<template>
  <div class="auth">
    <aside class="auth__brand">
      <router-link to="/" class="logo">慕今予<span>MALL</span></router-link>
      <div class="brand__body">
        <h1>加入我们，<br />开始你的第一条订单。</h1>
        <p>注册即可领取新人礼包 · 会员专享价</p>
        <ul>
          <li><el-icon><Present /></el-icon> 新人首单立减</li>
          <li><el-icon><Van /></el-icon> 全场满 99 包邮</li>
          <li><el-icon><RefreshLeft /></el-icon> 七天无理由退换</li>
        </ul>
      </div>
      <span class="copy">© {{ new Date().getFullYear() }} 慕今予商城</span>
    </aside>

    <main class="auth__panel">
      <div class="panel">
        <div class="panel__head">
          <h2>创建账号</h2>
          <p class="muted">已有账号？<router-link to="/login" class="link">直接登录</router-link></p>
        </div>

        <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent="submit">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="form.phone" size="large" maxlength="11" placeholder="用于接收验证码" :prefix-icon="Iphone" />
          </el-form-item>
          <el-form-item label="验证码" prop="checkCode">
            <div class="code-row">
              <el-input v-model="form.checkCode" size="large" maxlength="6" placeholder="6 位验证码" />
              <el-button size="large" :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" size="large" placeholder="4-20 位，登录时使用" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" size="large" type="password" show-password placeholder="至少 8 位，建议字母+数字" :prefix-icon="Lock" />
          </el-form-item>
          <el-form-item label="确认密码" prop="confirm">
            <el-input v-model="form.confirm" size="large" type="password" show-password placeholder="再输入一次密码" :prefix-icon="Lock" @keyup.enter="submit" />
          </el-form-item>
          <el-button type="primary" size="large" round class="submit" :loading="loading" @click="submit">注册并登录</el-button>
        </el-form>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormItemRule, type FormRules } from 'element-plus'
import { Iphone, Lock, User } from '@element-plus/icons-vue'
import { sendRegisterCode, verifyRegisterCode } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const user = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const countdown = ref(0)
let timer: number | undefined

const form = reactive({ phone: '', checkCode: '', username: '', password: '', confirm: '' })

const validateConfirm: FormItemRule['validator'] = (_rule, value, callback) => {
  if (!value) callback(new Error('请再次输入密码'))
  else if (value !== form.password) callback(new Error('两次输入的密码不一致'))
  else callback()
}

const rules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  checkCode: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为 6 位', trigger: 'blur' }
  ],
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 4, max: 20, message: '用户名长度 4-20 位', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, max: 32, message: '密码长度 8-32 位', trigger: 'blur' }
  ],
  confirm: [{ required: true, validator: validateConfirm, trigger: 'blur' }]
}

async function sendCode() {
  if (!/^1[3-9]\d{9}$/.test(form.phone)) return ElMessage.warning('请先输入正确的手机号')
  await sendRegisterCode(form.phone)
  ElMessage.success('验证码已发送')
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

async function submit() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    await verifyRegisterCode(form.phone, form.checkCode)
    await user.register({ username: form.username.trim(), password: form.password, phone: form.phone }, form.checkCode)
    await user.login(form.username.trim(), form.password)
    ElMessage.success('注册成功，已为你登录')
    router.replace('/')
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
.auth__brand {
  position: relative; overflow: hidden; padding: 44px 52px; color: #fff;
  background: radial-gradient(1200px 600px at 10% 0%, #ff7a53 0%, transparent 55%), linear-gradient(160deg, #1c1512, #3a241c 60%, #5c3324);
  display: flex; flex-direction: column;
}
.auth__brand::after {
  content: ''; position: absolute; right: -120px; bottom: -140px; width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.35), transparent 65%);
}
.logo { font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #fff; span { font-size: 11px; margin-left: 6px; letter-spacing: 3px; opacity: 0.7; } }
.brand__body { margin: auto 0; position: relative; z-index: 1; }
.brand__body h1 { font-size: 44px; line-height: 1.25; margin: 0 0 14px; }
.brand__body p { color: rgba(255, 255, 255, 0.72); margin-bottom: 26px; }
.brand__body ul { list-style: none; padding: 0; display: grid; gap: 12px; color: rgba(255, 255, 255, 0.85); font-size: 13.5px; }
.brand__body li { display: flex; align-items: center; gap: 8px; }
.copy { font-size: 12px; color: rgba(255, 255, 255, 0.45); }
.auth__panel { display: grid; place-items: center; background: var(--bg); padding: 30px; }
.panel { width: min(420px, 100%); background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 32px; box-shadow: var(--shadow-lg); }
.panel__head h2 { margin: 0 0 6px; font-size: 24px; }
.panel__head p { margin: 0 0 20px; font-size: 13px; }
.submit { width: 100%; margin-top: 4px; }
.code-row { display: flex; gap: 10px; width: 100%; }
.link { color: var(--brand); font-weight: 600; }
@media (max-width: 900px) {
  .auth { grid-template-columns: 1fr; }
  .auth__brand { display: none; }
}
</style>