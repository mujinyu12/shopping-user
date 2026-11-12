<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <section class="hero">
        <div class="hero__text">
          <span class="pill"><el-icon><Timer /></el-icon> 限时秒杀</span>
          <h1>整点开抢，<br />手慢真的无。</h1>
          <p>每日 10:00 / 14:00 / 20:00 三场，库存有限，售完即止。</p>
        </div>
        <div class="hero__clock">
          <span class="muted">下一场</span>
          <b class="clock">{{ countdown }}</b>
        </div>
      </section>

      <el-skeleton v-if="loading" :rows="4" animated />

      <div v-else-if="list.length" class="grid">
        <article v-for="s in list" :key="s.id" class="card item" @click="$router.push({ name: 'seckill-detail', params: { id: s.goodsId } })">
          <div class="item__pic">
            <img :src="s.headerPic" :alt="s.title" />
            <span v-if="s.stockCount <= 0" class="soldout">已抢光</span>
          </div>
          <div class="item__body">
            <h3>{{ s.title }}</h3>
            <p class="muted intro">{{ htmlToText(s.introduction) || '限时特惠，售完即止' }}</p>
            <div class="prices">
              <span class="price big">¥{{ money(s.costPrice) }}</span>
              <span class="origin">¥{{ money(s.price) }}</span>
            </div>
            <div class="bar"><i :style="{ width: `${progress(s)}%` }" /></div>
            <div class="meta">
              <span class="muted">已抢 {{ progress(s) }}%</span>
              <span class="muted">剩 {{ Math.max(s.stockCount, 0) }} 件</span>
            </div>
            <el-button type="primary" round class="btn" :disabled="s.stockCount <= 0 || !inWindow(s)">
              {{ s.stockCount <= 0 ? '已抢光' : inWindow(s) ? '立即抢购' : '未开始' }}
            </el-button>
          </div>
        </article>
      </div>

      <el-empty v-else description="当前没有进行中的秒杀活动" />

      <div v-if="total > size" class="pager">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="size" :current-page="page" @current-change="onPage" />
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { findSeckillPage } from '@/api'
import type { SeckillGoods } from '@/api/types'
import { htmlToText } from '@/utils/text'

const list = ref<SeckillGoods[]>([])
const total = ref(0)
const page = ref(1)
const size = 8
const loading = ref(true)
const now = ref(Date.now())
let timer: number | undefined

const money = (v?: number) => Number(v ?? 0).toFixed(2)
const progress = (s: SeckillGoods) => (s.num ? Math.min(100, Math.round(((s.num - s.stockCount) / s.num) * 100)) : 0)
const inWindow = (s: SeckillGoods) => {
  const t = now.value
  return (!s.startTime || new Date(s.startTime).getTime() <= t) && (!s.endTime || new Date(s.endTime).getTime() >= t)
}

const countdown = computed(() => {
  const t = now.value
  const next = list.value
    .map((s) => new Date(s.startTime).getTime())
    .filter((v) => v > t)
    .sort((a, b) => a - b)[0]
  if (!next) return '进行中'
  const diff = Math.max(0, next - t)
  const h = String(Math.floor(diff / 3600000)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600000) / 60000)).padStart(2, '0')
  const s = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0')
  return `${h}:${m}:${s}`
})

async function load() {
  loading.value = true
  try {
    const res = await findSeckillPage(page.value, size)
    list.value = res?.records || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

function onPage(p: number) {
  page.value = p
  load()
}

onMounted(() => {
  load()
  timer = window.setInterval(() => (now.value = Date.now()), 1000)
})
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<style scoped>
.hero {
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  padding: 30px 32px; border-radius: 18px; margin-bottom: 20px; color: #fff;
  background: radial-gradient(900px 400px at 90% 0%, rgba(255, 150, 90, 0.5), transparent 60%), linear-gradient(120deg, #241713, #4a2a1e 70%, #6b3524);
}
.pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(255, 255, 255, 0.14); padding: 5px 12px; border-radius: 999px; font-size: 12px; }
.hero h1 { font-size: 34px; line-height: 1.25; margin: 14px 0 8px; }
.hero p { margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px; }
.hero__clock { text-align: right; display: grid; gap: 6px; }
.clock { font-family: var(--mono); font-size: 34px; letter-spacing: 2px; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.item { overflow: hidden; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s; }
.item:hover { transform: translateY(-3px); box-shadow: var(--shadow-lg); }
.item__pic { position: relative; aspect-ratio: 1 / 1; background: #f4efe9; }
.item__pic img { width: 100%; height: 100%; object-fit: cover; }
.soldout {
  position: absolute; inset: 0; display: grid; place-items: center;
  background: rgba(30, 22, 18, 0.55); color: #fff; font-size: 18px; font-weight: 700; letter-spacing: 2px;
}
.item__body { padding: 14px 14px 16px; }
.item h3 { font-size: 14.5px; margin: 0 0 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.intro { font-size: 12px; margin: 0 0 10px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.prices { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.price.big { font-size: 22px; color: var(--brand); font-weight: 800; }
.origin { color: var(--muted); text-decoration: line-through; font-size: 12.5px; }
.bar { height: 6px; border-radius: 999px; background: #f2ece6; overflow: hidden; }
.bar i { display: block; height: 100%; background: linear-gradient(90deg, #ff8a5c, #e8503a); }
.meta { display: flex; justify-content: space-between; font-size: 11.5px; margin: 6px 0 12px; }
.btn { width: 100%; }
.pager { display: flex; justify-content: center; margin-top: 24px; }
@media (max-width: 1024px) { .grid { grid-template-columns: repeat(2, 1fr); } }
</style>