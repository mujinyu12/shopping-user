<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="crumb">
        <router-link to="/seckill">限时秒杀</router-link>
        <el-icon><ArrowRight /></el-icon>
        <span>{{ goods?.title || '秒杀详情' }}</span>
      </div>

      <el-skeleton v-if="loading" :rows="6" animated />

      <template v-else-if="goods">
        <section class="card detail">
          <div class="pic"><img :src="goods.headerPic" :alt="goods.title" /></div>

          <div class="info">
            <span class="pill"><el-icon><Timer /></el-icon> 秒杀专享</span>
            <h1>{{ goods.title }}</h1>
            <p class="muted">{{ introText }}</p>

            <div class="pricebox">
              <div>
                <span class="price">¥{{ money(goods.costPrice) }}</span>
                <span class="origin">原价 ¥{{ money(goods.price) }}</span>
              </div>
              <div class="stock">
                <span class="muted">剩余</span>
                <b>{{ Math.max(goods.stockCount, 0) }}</b>
                <span class="muted">/ {{ goods.num }}</span>
              </div>
            </div>

            <div class="bar"><i :style="{ width: `${progress}%` }" /></div>

            <div class="timebox">
              <el-icon><Clock /></el-icon>
              <span v-if="state === 'upcoming'">距开始 {{ clock }}</span>
              <span v-else-if="state === 'running'">距结束 {{ clock }}</span>
              <span v-else>本场已结束</span>
            </div>

            <el-button type="primary" size="large" round class="buy" :loading="buying" :disabled="!buyable" @click="buy">
              {{ state === 'upcoming' ? '未开始' : state === 'ended' ? '已结束' : goods.stockCount <= 0 ? '已抢光' : '立即抢购' }}
            </el-button>

            <ul class="notes">
              <li>秒杀订单需在 5 分钟内完成支付，超时自动取消并回补库存</li>
              <li>每人限购 1 件，同一商品重复下单会被拒绝</li>
            </ul>
          </div>
        </section>

        <section class="card explain">
          <h3>活动说明</h3>
          <p>秒杀价格为限时专享价，不与其他优惠叠加；下单后请在 5 分钟内支付，否则订单将自动关闭。</p>
        </section>
      </template>

      <el-empty v-else description="活动不存在或已结束" />
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { addSeckillOrder, findSeckill } from '@/api'
import type { SeckillGoods } from '@/api/types'
import { htmlToText } from '@/utils/text'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()

const goods = ref<SeckillGoods | null>(null)
const loading = ref(true)
const buying = ref(false)
const now = ref(Date.now())
let timer: number | undefined

const money = (v?: number) => Number(v ?? 0).toFixed(2)
/** 活动介绍统一按纯文本展示（历史数据里可能是 HTML） */
const introText = computed(() => htmlToText(goods.value?.introduction) || '限时特惠，售完即止')
const progress = computed(() => {
  const g = goods.value
  if (!g || !g.num) return 0
  return Math.min(100, Math.round(((g.num - g.stockCount) / g.num) * 100))
})

const state = computed<'upcoming' | 'running' | 'ended'>(() => {
  const g = goods.value
  if (!g) return 'ended'
  const t = now.value
  if (g.startTime && new Date(g.startTime).getTime() > t) return 'upcoming'
  if (g.endTime && new Date(g.endTime).getTime() < t) return 'ended'
  return 'running'
})

const buyable = computed(() => state.value === 'running' && (goods.value?.stockCount ?? 0) > 0)

const clock = computed(() => {
  const g = goods.value
  if (!g) return '--:--:--'
  const target = state.value === 'upcoming' ? new Date(g.startTime).getTime() : new Date(g.endTime).getTime()
  const diff = Math.max(0, target - now.value)
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
})

async function buy() {
  if (!user.isLogin) {
    return router.push({ name: 'login', query: { redirect: route.fullPath } })
  }
  if (!goods.value) return
  buying.value = true
  try {
    const order = await addSeckillOrder({
      seckillId: goods.value.id,
      cartGoods: [{ goodId: goods.value.goodsId, num: 1, price: goods.value.costPrice }]
    })
    ElMessage.success('抢购成功，请尽快支付')
    router.push({ name: 'pay', params: { id: order.id! }, query: { type: 'seckill' } })
  } finally {
    buying.value = false
  }
}

onMounted(async () => {
  try {
    goods.value = await findSeckill(String(route.params.id))
  } finally {
    loading.value = false
  }
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<style scoped>
.crumb { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; margin-bottom: 16px; }
.detail { display: grid; grid-template-columns: 460px 1fr; gap: 34px; padding: 24px; }
.pic { aspect-ratio: 1 / 1; border-radius: var(--radius); overflow: hidden; background: #f4efe9; }
.pic img { width: 100%; height: 100%; object-fit: cover; }
.pill { display: inline-flex; align-items: center; gap: 6px; background: var(--brand-soft); color: var(--brand-dark); padding: 5px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; }
.info h1 { font-size: 26px; margin: 12px 0 8px; }
.info > p { margin: 0 0 18px; }
.pricebox {
  display: flex; align-items: flex-end; justify-content: space-between;
  background: linear-gradient(120deg, #fff5f1, #fffaf6); border: 1px solid #f7e2d9;
  border-radius: var(--radius); padding: 16px 20px;
}
.price { font-size: 34px; color: var(--brand); font-weight: 800; }
.origin { color: var(--muted); text-decoration: line-through; font-size: 13px; margin-left: 10px; }
.stock b { font-size: 20px; color: var(--brand); }
.bar { height: 8px; border-radius: 999px; background: #f2ece6; overflow: hidden; margin: 14px 0; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #ff8a5c, #e8503a); }
.timebox { display: flex; align-items: center; gap: 8px; color: var(--ink-2); font-size: 13.5px; margin-bottom: 18px; }
.buy { width: 220px; }
.notes { list-style: none; padding: 16px 0 0; margin: 20px 0 0; border-top: 1px dashed var(--line); color: var(--muted); font-size: 12.5px; display: grid; gap: 6px; }
.explain { margin-top: 18px; padding: 20px 24px; }
.explain h3 { margin: 0 0 10px; font-size: 15px; }
.explain p { margin: 0; color: var(--ink-2); font-size: 13.5px; line-height: 1.8; }
@media (max-width: 980px) { .detail { grid-template-columns: 1fr; } }
</style>