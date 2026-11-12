<template>
  <AppHeader />

  <main class="page">
    <div class="container narrow">
      <section v-if="paid" class="card done">
        <div class="done__icon"><el-icon :size="34"><CircleCheck /></el-icon></div>
        <h2>支付成功</h2>
        <p class="muted">订单 {{ order?.id }} 已支付，我们会尽快为你发货。</p>
        <div class="done__actions">
          <el-button round @click="$router.push('/orders')">查看订单</el-button>
          <el-button type="primary" round @click="$router.push('/')">继续逛逛</el-button>
        </div>
      </section>

      <section v-else-if="isSeckill" class="card seckill">
        <div class="seckill__left">
          <h2>确认秒杀订单</h2>
          <p class="muted">
            秒杀订单不经过购物车，需在
            <b class="mono">{{ countdownText }}</b>
            内完成支付，超时自动释放库存。
          </p>

          <div class="sk-goods">
            <div v-for="g in order?.cartGoods" :key="g.goodId" class="sk-row">
              <img v-if="g.headerPic || skGoods?.headerPic" :src="g.headerPic || skGoods?.headerPic" alt="" />
              <div class="sk-info">
                <div class="sk-name">{{ g.goodsName || skGoods?.title || '秒杀商品' }}</div>
                <div class="muted">数量 {{ g.num }}</div>
              </div>
              <div class="price">¥{{ money(g.price) }}</div>
            </div>
          </div>
        </div>

        <aside class="pay__right">
          <div class="sum">
            <div class="sum-row"><span>订单号</span><span class="mono">{{ order?.id }}</span></div>
            <div class="sum-row"><span>订单类型</span><span>限时秒杀</span></div>
            <div class="sum-row total"><span>应付金额</span><span class="price big">¥{{ money(order?.payment) }}</span></div>
          </div>
          <el-button type="primary" class="again" round :loading="paying" :disabled="expired" @click="payNow">
            {{ expired ? '订单已超时' : '立即支付' }}
          </el-button>
          <el-button text class="cancel" @click="$router.push('/seckill')">返回秒杀</el-button>
          <p class="tip"><el-icon><Clock /></el-icon> 演示环境：秒杀订单直接扣减库存并落库，不走微信扫码</p>
        </aside>
      </section>

      <section v-else class="card pay">
        <div class="pay__left">
          <h2>微信扫码支付</h2>
          <p class="muted">请使用微信「扫一扫」完成支付，支付后本页会自动刷新。</p>

          <div class="qr">
            <img v-if="qr" :src="qr" alt="支付二维码" />
            <div v-else class="qr__ph">
              <el-icon class="is-loading" :size="26"><Loading /></el-icon>
              <span>正在生成二维码…</span>
            </div>
          </div>

          <div v-if="codeUrl" class="fallback">
            <span class="muted">二维码无法显示时，可复制支付链接：</span>
            <div class="fallback__row">
              <code>{{ codeUrl }}</code>
              <el-button size="small" text @click="copy">复制</el-button>
            </div>
          </div>
        </div>

        <aside class="pay__right">
          <div class="sum">
            <div class="sum-row"><span>订单号</span><span class="mono">{{ order?.id }}</span></div>
            <div class="sum-row"><span>收货人</span><span>{{ order?.receiver }}</span></div>
            <div class="sum-row"><span>地址</span><span class="addr">{{ order?.receiverAreaName }}</span></div>
            <div class="sum-row total"><span>应付金额</span><span class="price big">¥{{ money(order?.payment) }}</span></div>
          </div>
          <el-button class="again" round :loading="loading" @click="createPay">重新获取二维码</el-button>
          <el-button text class="cancel" @click="$router.push('/orders')">稍后支付</el-button>
          <p class="tip"><el-icon><Clock /></el-icon> 订单将在 30 分钟内关闭，请及时支付</p>
        </aside>
      </section>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import QRCode from 'qrcode'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { findOrder, findSeckill, findSeckillOrder, paySeckill, pcPay } from '@/api'
import type { Orders, SeckillGoods } from '@/api/types'

const route = useRoute()
const router = useRouter()
// 秒杀订单只存在 Redis（5 分钟），不能走订单库的查询和微信扫码支付，
// 所以由秒杀详情页跳转时带 type=seckill，这里分成两条完全不同的支付链路
const isSeckill = route.query.type === 'seckill'
const order = ref<Orders | null>(null)
const skGoods = ref<SeckillGoods | null>(null)
const codeUrl = ref('')
const qr = ref('')
const paid = ref(false)
const loading = ref(false)
const paying = ref(false)
const now = ref(Date.now())
let timer: number | undefined
let ticker: number | undefined

const money = (v?: number) => Number(v ?? 0).toFixed(2)

// 秒杀订单的剩余支付时间（后端 expire 是带了时区的 ISO 时间）
const remainMs = computed(() => {
  const exp = order.value?.expire ? new Date(order.value.expire).getTime() : 0
  return Number.isFinite(exp) ? Math.max(0, exp - now.value) : 0
})
const expired = computed(() => isSeckill && remainMs.value <= 0)
const countdownText = computed(() => {
  const s = Math.floor(remainMs.value / 1000)
  const m = String(Math.floor(s / 60)).padStart(2, '0')
  const sec = String(s % 60).padStart(2, '0')
  return `${m}:${sec}`
})

async function load() {
  if (isSeckill) {
    try {
      order.value = await findSeckillOrder(String(route.params.id))
      // Redis 里的订单只带了 goodId，商品名和图片要回查秒杀商品
      const goodsId = order.value?.cartGoods?.[0]?.goodId
      if (goodsId) {
        try {
          skGoods.value = await findSeckill(goodsId)
        } catch {
          /* 商品信息拿不到时退回「秒杀商品」占位 */
        }
      }
    } catch {
      // 订单已过期（Redis 5 分钟到期）或不属于当前用户，退回秒杀列表
      ElMessage.warning('秒杀订单已过期，请重新抢购')
      router.replace('/seckill')
    }
    return
  }
  order.value = await findOrder(String(route.params.id))
  if ((order.value?.status ?? 0) >= 2) paid.value = true
}

async function payNow() {
  if (!order.value || expired.value) return
  paying.value = true
  try {
    order.value = await paySeckill(String(route.params.id))
    paid.value = true
  } finally {
    paying.value = false
  }
}

async function createPay() {
  loading.value = true
  try {
    codeUrl.value = await pcPay(String(route.params.id))
    qr.value = await QRCode.toDataURL(codeUrl.value, { margin: 1, width: 260, color: { dark: '#1b1a19', light: '#ffffff' } })
  } finally {
    loading.value = false
  }
}

async function copy() {
  await navigator.clipboard.writeText(codeUrl.value)
  ElMessage.success('已复制支付链接')
}

async function poll() {
  try {
    const o = await findOrder(String(route.params.id))
    order.value = o
    if ((o?.status ?? 0) >= 2) {
      paid.value = true
      window.clearInterval(timer)
    }
  } catch {
    /* 轮询失败忽略 */
  }
}

onMounted(async () => {
  await load()
  if (paid.value) return
  if (isSeckill) {
    // 秒杀订单没有二维码，只需要一个倒计时；支付成功或超时后停表
    ticker = window.setInterval(() => (now.value = Date.now()), 1000)
    return
  }
  await createPay()
  timer = window.setInterval(poll, 3000)
})

onBeforeUnmount(() => {
  window.clearInterval(timer)
  window.clearInterval(ticker)
})
</script>

<style scoped>
.narrow { max-width: 960px; }
.pay { display: grid; grid-template-columns: 1fr 320px; gap: 30px; padding: 28px; }
.seckill { display: grid; grid-template-columns: 1fr 320px; gap: 30px; padding: 28px; }
.seckill h2 { font-size: 20px; margin: 0 0 6px; }
.sk-goods { margin-top: 20px; border-top: 1px dashed var(--line); }
.sk-row {
  display: flex; align-items: center; gap: 14px; padding: 16px 0;
  border-bottom: 1px dashed var(--line);
  img { width: 64px; height: 64px; object-fit: cover; border-radius: 10px; background: #f7f3ee; }
}
.sk-info { flex: 1; min-width: 0; display: grid; gap: 6px; }
.sk-name { font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pay h2 { font-size: 20px; margin: 0 0 6px; }
.qr {
  width: 300px; height: 300px; margin: 22px 0 14px;
  border-radius: 16px; border: 1px solid var(--line); background: #fff;
  display: grid; place-items: center; padding: 20px;
  img { width: 100%; height: 100%; object-fit: contain; }
}
.qr__ph { display: grid; gap: 10px; justify-items: center; color: var(--muted); font-size: 12.5px; }
.fallback { margin-top: 6px; font-size: 12.5px; }
.fallback__row {
  display: flex; align-items: center; gap: 8px; margin-top: 8px;
  code { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; background: #f7f3ee; padding: 8px 10px; border-radius: 8px; font-size: 12px; }
}
.pay__right {
  border-left: 1px dashed var(--line); padding-left: 26px;
  display: flex; flex-direction: column;
}
.sum { display: flex; flex-direction: column; gap: 10px; }
.sum-row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; color: var(--ink-2); }
.sum-row .mono { font-family: var(--mono); font-size: 12px; }
.sum-row .addr { max-width: 180px; text-align: right; }
.sum-row.total { border-top: 1px dashed var(--line); padding-top: 12px; align-items: baseline; }
.price.big { font-size: 26px; color: var(--brand); font-weight: 800; }
.again { margin-top: 20px; }
.cancel { margin-top: 4px; color: var(--muted); }
.tip { display: flex; align-items: center; gap: 6px; margin-top: auto; color: var(--muted); font-size: 12px; }
.done { padding: 54px 30px; text-align: center; }
.done__icon {
  width: 68px; height: 68px; border-radius: 50%; margin: 0 auto 16px;
  display: grid; place-items: center; color: #1f9d63; background: #e7f7ef;
}
.done h2 { margin: 0 0 8px; }
.done__actions { display: flex; gap: 10px; justify-content: center; margin-top: 22px; }
@media (max-width: 860px) {
  .pay { grid-template-columns: 1fr; }
  .pay__right { border-left: none; border-top: 1px dashed var(--line); padding: 20px 0 0; }
}
</style>