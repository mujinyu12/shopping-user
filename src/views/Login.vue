<template>
  <div class="auth">
    <aside class="auth__brand">
      <router-link to="/" class="logo">慕今予<span>MALL</span></router-link>
      <div class="brand__body">
        <h1>好物，<br />值得慢慢挑。</h1>
        <p>正品保障 · 极速发货 · 七天无理由退换</p>
        <ul>
          <li><el-icon><CircleCheck /></el-icon> 官方授权，假一赔十</li>
          <li><el-icon><Van /></el-icon> 现货 24 小时内发出</li>
          <li><el-icon><ChatDotRound /></el-icon> 左下角 AI 客服随时待命</li>
        </ul>
      </div>
      <span class="copy">© {{ new Date().getFullYear() }} 慕今予商城</span>
    </aside>

    <main class="auth__panel">
      <div class="panel">
        <div class="panel__head">
          <h2>欢迎回来</h2>
          <p class="muted">还没有账号？<router-link to="/register" class="link">立即注册</router-link></p>
        </div>

        <div class="switch">
          <button :class="{ on: mode === 'password' }" @click="mode = 'password'">账号登录</button>
          <button :class="{ on: mode === 'code' }" @click="mode = 'code'">验证码登录</button>
        </div>

        <el-form v-if="mode === 'password'" ref="pwdForm" :model="pwd" :rules="pwdRules" label-position="top" @submit.prevent="doLogin">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="pwd.username" size="large" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="pwd.password" size="large" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" @keyup.enter="doLogin" />
          </el-form-item>
          <el-button type="primary" size="large" round class="submit" :loading="loading" @click="doLogin">登录</el-button>
        </el-form>

        <el-form v-else ref="codeForm" :model="phoneForm" :rules="phoneRules" label-position="top" @submit.prevent="doLoginByCode">
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="phoneForm.phone" size="large" maxlength="11" placeholder="请输入手机号" :prefix-icon="Iphone" />
          </el-form-item>
          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input v-model="phoneForm.code" size="large" maxlength="6" placeholder="6 位验证码" />
              <el-button size="large" :disabled="countdown > 0" @click="sendCode">
                {{ countdown > 0 ? `${countdown}s` : '获取验证码' }}
              </el-button>
            </div>
          </el-form-item>
          <el-button type="primary" size="large" round class="submit" :loading="loading" @click="doLoginByCode">登录</el-button>
        </el-form>

        <p class="hint muted">登录即表示同意《用户协议》与《隐私政策》</p>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { Iphone, Lock, User } from '@element-plus/icons-vue'
import { loginByCode, sendLoginCode } from '@/api'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const route = useRoute()
const user = useUserStore()

const mode = ref<'password' | 'code'>('password')
const loading = ref(false)
const countdown = ref(0)
let timer: number | undefined

const pwdForm = ref<FormInstance>()
const codeForm = ref<FormInstance>()
const pwd = reactive({ username: '', password: '' })
const phoneForm = reactive({ phone: '', code: '' })

const pwdRules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}
const phoneRules: FormRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }]
}

function afterLogin() {
  const redirect = String(route.query.redirect || '/')
  ElMessage.success('登录成功')
  router.replace(redirect)
}

async function doLogin() {
  if (!(await pwdForm.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    await user.login(pwd.username.trim(), pwd.password)
    afterLogin()
  } finally {
    loading.value = false
  }
}

async function sendCode() {
  if (!/^1[3-9]\d{9}$/.test(phoneForm.phone)) return ElMessage.warning('请先输入正确的手机号')
  await sendLoginCode(phoneForm.phone)
  ElMessage.success('验证码已发送，请注意查收')
  countdown.value = 60
  timer = window.setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) window.clearInterval(timer)
  }, 1000)
}

async function doLoginByCode() {
  if (!(await codeForm.value?.validate().catch(() => false))) return
  loading.value = true
  try {
    const token = await loginByCode(phoneForm.phone, phoneForm.code)
    user.setToken(token)
    await user.loadProfile()
    afterLogin()
  } finally {
    loading.value = false
  }
}

onBeforeUnmount(() => window.clearInterval(timer))
</script>

<style scoped>
.auth { min-height: 100vh; display: grid; grid-template-columns: 1.05fr 1fr; }
.auth__brand {
  position: relative; overflow: hidden;
  padding: 44px 52px; color: #fff;
  background: radial-gradient(1200px 600px at 10% 0%, #ff7a53 0%, transparent 55%), linear-gradient(160deg, #1c1512, #3a241c 60%, #5c3324);
  display: flex; flex-direction: column;
}
.auth__brand::after {
  content: ''; position: absolute; right: -120px; bottom: -140px;
  width: 420px; height: 420px; border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 140, 90, 0.35), transparent 65%);
}
.logo { font-size: 22px; font-weight: 800; letter-spacing: 1px; color: #fff; span { font-size: 11px; margin-left: 6px; letter-spacing: 3px; opacity: 0.7; } }
.brand__body { margin: auto 0; position: relative; z-index: 1; }
.brand__body h1 { font-size: 48px; line-height: 1.2; margin: 0 0 14px; letter-spacing: 1px; }
.brand__body p { color: rgba(255, 255, 255, 0.72); margin-bottom: 26px; }
.brand__body ul { list-style: none; padding: 0; display: grid; gap: 12px; color: rgba(255, 255, 255, 0.85); font-size: 13.5px; }
.brand__body li { display: flex; align-items: center; gap: 8px; }
.copy { font-size: 12px; color: rgba(255, 255, 255, 0.45); }
.auth__panel { display: grid; place-items: center; background: var(--bg); padding: 30px; }
.panel { width: min(400px, 100%); background: #fff; border: 1px solid var(--line); border-radius: 20px; padding: 34px 32px; box-shadow: var(--shadow-lg); }
.panel__head h2 { margin: 0 0 6px; font-size: 24px; }
.panel__head p { margin: 0 0 22px; font-size: 13px; }
.switch { display: flex; gap: 6px; background: #f5f1ec; border-radius: 11px; padding: 4px; margin-bottom: 22px; }
.switch button { flex: 1; border: none; background: transparent; padding: 9px; border-radius: 8px; cursor: pointer; color: var(--ink-2); font-size: 13.5px; }
.switch button.on { background: #fff; color: var(--brand-dark); font-weight: 700; box-shadow: 0 2px 8px rgba(80, 50, 30, 0.08); }
.submit { width: 100%; margin-top: 6px; }
.code-row { display: flex; gap: 10px; width: 100%; }
.hint { text-align: center; margin-top: 18px; font-size: 12px; }
.link { color: var(--brand); font-weight: 600; }
@media (max-width: 900px) {
  .auth { grid-template-columns: 1fr; }
  .auth__brand { display: none; }
}
</style>