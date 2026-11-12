<template>
  <!-- 根容器用 .ai-chat，避免与消息角色类 .msg.ai 冲突（角色类 ai 会命中根容器的 position:fixed） -->
  <div class="ai-chat">
    <!-- 聊天面板 -->
    <transition name="ai-pop">
      <section v-if="open" class="ai__panel" role="dialog" aria-label="AI 客服">
        <header class="ai__head">
          <div class="ai__id">
            <div class="ai__avatar">
              <el-icon :size="18"><ChatDotRound /></el-icon>
            </div>
            <div>
              <strong>慕今予 AI 客服</strong>
              <div class="ai__status"><i /> 在线 · 秒级响应</div>
            </div>
          </div>
          <div class="ai__head-actions">
            <button class="icon-btn" title="清空对话" @click="clear"><el-icon><Delete /></el-icon></button>
            <button class="icon-btn" title="收起" @click="open = false"><el-icon><Minus /></el-icon></button>
          </div>
        </header>

        <div ref="scroller" class="ai__body">
          <div v-for="m in messages" :key="m.id" class="msg" :class="m.role">
            <div v-if="m.role === 'ai'" class="msg__avatar"><el-icon><MagicStick /></el-icon></div>
            <div class="msg__bubble">
              <p v-if="m.text" class="msg__text">{{ m.text }}</p>
              <div v-if="m.typing" class="typing"><i /><i /><i /></div>
              <span class="msg__time">{{ m.time }}</span>
            </div>
          </div>

          <div v-if="!user.isLogin" class="login-hint">
            <p>登录后即可与 AI 客服对话，查询商品、订单与售后问题。</p>
            <el-button type="primary" size="small" round @click="toLogin">去登录</el-button>
          </div>
        </div>

        <div v-if="user.isLogin" class="ai__quick">
          <button v-for="q in quickQuestions" :key="q" class="chip" :disabled="sending" @click="send(q)">{{ q }}</button>
        </div>

        <footer class="ai__input">
          <el-input
            v-model="draft"
            type="textarea"
            :rows="1"
            :autosize="{ minRows: 1, maxRows: 4 }"
            resize="none"
            placeholder="请输入您的问题，Enter 发送"
            :disabled="!user.isLogin || sending"
            @keydown.enter.exact.prevent="send()"
          />
          <el-button type="primary" circle :loading="sending" :disabled="!canSend" @click="send()">
            <el-icon v-if="!sending"><Promotion /></el-icon>
          </el-button>
        </footer>
      </section>
    </transition>

    <!-- 左下角悬浮按钮 -->
    <button class="ai__fab" :class="{ 'is-open': open }" @click="toggle" :title="open ? '收起 AI 客服' : 'AI 客服'">
      <el-icon :size="22"><ChatLineRound /></el-icon>
      <span class="ai__fab-label">AI 客服</span>
      <i v-if="!open && unread" class="ai__dot" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { askAi } from '@/api'
import { useUserStore } from '@/stores/user'

interface ChatMessage {
  id: number
  role: 'ai' | 'user'
  text: string
  time: string
  typing?: boolean
}

const user = useUserStore()
const router = useRouter()

const open = ref(false)
const sending = ref(false)
const unread = ref(false)
const draft = ref('')
const scroller = ref<HTMLElement | null>(null)
const messages = reactive<ChatMessage[]>([])
let seq = 0

const quickQuestions = ['有哪些手机值得买？', '帮我查一下我的订单', '怎么退货？', '支持哪些支付方式？']

const canSend = computed(() => !!draft.value.trim() && !sending.value && user.isLogin)

const now = () =>
  new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

function push(role: ChatMessage['role'], text: string, typing = false) {
  const m: ChatMessage = { id: ++seq, role, text, time: now(), typing }
  messages.push(m)
  scrollBottom()
  return m
}

function scrollBottom() {
  nextTick(() => {
    const el = scroller.value
    if (el) el.scrollTop = el.scrollHeight
  })
}

function seed() {
  if (messages.length) return
  push('ai', '您好，我是慕今予 AI 客服 👋\n可以帮您找商品、查订单、解答配送与售后问题，请直接输入您的问题。')
}

async function send(preset?: string) {
  const text = (preset ?? draft.value).trim()
  if (!text || sending.value) return
  if (!user.isLogin) {
    toLogin()
    return
  }
  draft.value = ''
  push('user', text)
  sending.value = true
  const placeholder = push('ai', '', true)
  try {
    const answer = await askAi(text)
    placeholder.typing = false
    placeholder.text = (answer || '').trim() || '抱歉，我暂时没有理解您的问题，可以换个说法再试一次。'
  } catch (e: any) {
    placeholder.typing = false
    placeholder.text = e?.message?.includes('超时')
      ? '客服响应超时了，请稍后再试一次。'
      : '抱歉，AI 客服暂时不可用，请稍后再试。'
  } finally {
    sending.value = false
    placeholder.time = now()
    scrollBottom()
    if (!open.value) unread.value = true
  }
}

function toggle() {
  open.value = !open.value
  if (open.value) {
    seed()
    unread.value = false
    scrollBottom()
  }
}

function clear() {
  messages.splice(0, messages.length)
  seed()
}

function toLogin() {
  open.value = false
  router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
}

const onOpenEvent = () => {
  open.value = true
  seed()
  scrollBottom()
}

onMounted(() => {
  seed()
  window.addEventListener('mall:open-ai', onOpenEvent)
})
onBeforeUnmount(() => window.removeEventListener('mall:open-ai', onOpenEvent))
</script>

<style scoped lang="scss">
.ai-chat {
  position: fixed;
  left: 24px;
  bottom: 24px;
  z-index: 2000;
}

/* 悬浮按钮 */
.ai__fab {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 52px;
  padding: 0 20px 0 16px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #e8503a, #f3824f);
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 14px 30px rgba(232, 80, 58, 0.34);
  transition: transform 0.22s var(--ease), box-shadow 0.22s var(--ease);
  animation: floaty 3.6s ease-in-out infinite;
  &:hover { transform: translateY(-3px) scale(1.02); box-shadow: 0 18px 36px rgba(232, 80, 58, 0.4); }
  &.is-open { animation: none; }
}
.ai__fab-label { letter-spacing: 0.02em; }
.ai__dot {
  position: absolute;
  top: 10px;
  right: 12px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ffd76a;
  box-shadow: 0 0 0 3px rgba(255, 215, 106, 0.32);
}

/* 面板 */
.ai__panel {
  position: absolute;
  left: 0;
  bottom: 68px;
  width: 382px;
  height: 560px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 20px;
  border: 1px solid var(--line);
  box-shadow: 0 24px 60px rgba(27, 26, 31, 0.18);
  overflow: hidden;
  transform-origin: left bottom;
}
.ai__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 14px 14px 16px;
  background: linear-gradient(120deg, #1f1d24, #2c2730);
  color: #fff;
}
.ai__id { display: flex; align-items: center; gap: 10px; }
.ai__avatar {
  width: 36px; height: 36px; border-radius: 12px;
  display: grid; place-items: center;
  background: linear-gradient(135deg, #e8503a, #f6b73c);
  color: #fff;
}
.ai__status { font-size: 11px; color: rgba(255, 255, 255, 0.72); display: flex; align-items: center; gap: 6px; }
.ai__status i { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; display: inline-block; }
.ai__head-actions { display: flex; gap: 2px; }
.icon-btn {
  width: 28px; height: 28px; border: none; border-radius: 8px;
  background: transparent; color: rgba(255, 255, 255, 0.7);
  display: grid; place-items: center; cursor: pointer;
  &:hover { background: rgba(255, 255, 255, 0.12); color: #fff; }
}

.ai__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 14px 8px;
  background:
    radial-gradient(120% 60% at 0% 0%, #fdf3ef 0%, transparent 60%),
    #faf8f6;
}
.msg { display: flex; gap: 8px; margin-bottom: 14px; }
.msg.user { flex-direction: row-reverse; }
.msg__avatar {
  width: 28px; height: 28px; border-radius: 9px; flex-shrink: 0;
  display: grid; place-items: center;
  background: #fff; color: var(--brand); border: 1px solid #f1e3dc;
}
.msg__bubble { max-width: 78%; display: flex; flex-direction: column; }
.msg__text {
  margin: 0;
  padding: 10px 12px;
  border-radius: 14px;
  font-size: 13px;
  line-height: 1.65;
  white-space: pre-wrap;
  word-break: break-word;
}
.msg.ai .msg__text {
  background: #fff;
  border: 1px solid var(--line);
  border-top-left-radius: 6px;
  color: var(--ink);
  box-shadow: var(--shadow-sm);
}
.msg.user .msg__text {
  background: linear-gradient(135deg, #e8503a, #ef7256);
  color: #fff;
  border-top-right-radius: 6px;
}
.msg__time { font-size: 10px; color: #b6afa7; margin-top: 4px; }
.msg.user .msg__time { text-align: right; }

.typing { display: inline-flex; gap: 4px; padding: 12px 14px; }
.typing i {
  width: 6px; height: 6px; border-radius: 50%; background: #d6cec5;
  animation: blink 1.2s infinite ease-in-out;
  &:nth-child(2) { animation-delay: 0.18s; }
  &:nth-child(3) { animation-delay: 0.36s; }
}

.login-hint {
  margin: 6px 4px 16px;
  padding: 14px;
  border: 1px dashed #e6d5cc;
  border-radius: 14px;
  background: #fff;
  text-align: center;
  p { margin: 0 0 10px; font-size: 12.5px; color: var(--muted); line-height: 1.6; }
}

.ai__quick {
  display: flex;
  gap: 8px;
  padding: 0 14px 10px;
  overflow-x: auto;
  background: #faf8f6;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
.chip {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid #eddcd4;
  background: #fff;
  color: var(--ink-2);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.18s;
  &:hover { border-color: var(--brand); color: var(--brand); background: var(--brand-soft); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.ai__input {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 12px 12px;
  border-top: 1px solid var(--line);
  background: #fff;
}
.ai__input :deep(.el-textarea__inner) {
  border-radius: 12px;
  background: #f6f3ef;
  box-shadow: none;
  padding: 8px 12px;
  font-size: 13px;
}

.ai-pop-enter-active, .ai-pop-leave-active { transition: opacity 0.2s var(--ease), transform 0.2s var(--ease); }
.ai-pop-enter-from, .ai-pop-leave-to { opacity: 0; transform: translateY(10px) scale(0.97); }

@keyframes blink { 0%, 80%, 100% { opacity: 0.35; transform: translateY(0); } 40% { opacity: 1; transform: translateY(-3px); } }
@keyframes floaty { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }

@media (max-width: 520px) {
  .ai-chat { left: 12px; bottom: 12px; }
  .ai__panel { width: calc(100vw - 24px); height: min(72vh, 560px); }
  .ai__fab-label { display: none; }
  .ai__fab { padding: 0 16px; }
}
</style>
