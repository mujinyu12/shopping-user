<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="section-head">
        <div>
          <h2>我的订单</h2>
          <p class="sub">共 {{ total }} 笔订单</p>
        </div>
      </div>

      <div class="card tabs">
        <button v-for="t in tabs" :key="String(t.value)" :class="{ on: status === t.value }" @click="switchTab(t.value)">
          {{ t.label }}
        </button>
      </div>

      <el-skeleton v-if="loading" :rows="5" animated />

      <template v-else-if="orders.length">
        <article v-for="o in orders" :key="o.id" class="card order">
          <header class="order__head">
            <div class="order__meta">
              <span class="mono">{{ o.id }}</span>
              <span class="muted">{{ datetime(o.createTime) }}</span>
            </div>
            <span class="status" :data-status="o.status">{{ statusText(o.status) }}</span>
          </header>

          <div class="order__body">
            <div class="thumbs">
              <img
                v-for="g in (o.cartGoods || []).slice(0, 4)"
                :key="g.goodId"
                :src="g.headerPic"
                :alt="g.goodsName"
                @click="$router.push(`/detail/${g.goodId}`)"
              />
              <span v-if="(o.cartGoods || []).length > 4" class="more">+{{ (o.cartGoods || []).length - 4 }}</span>
            </div>
            <div class="order__items">
              <p v-for="g in (o.cartGoods || []).slice(0, 2)" :key="g.goodId">
                {{ g.goodsName }} <span class="muted">× {{ g.num }}</span>
              </p>
              <span v-if="(o.cartGoods || []).length > 2" class="muted">等 {{ o.cartGoods?.length }} 件商品</span>
            </div>
            <div class="order__amount">
              <span class="muted">实付</span>
              <b class="price">¥{{ money(o.payment) }}</b>
            </div>
          </div>

          <footer class="order__actions">
            <el-button text @click="$router.push({ name: 'order-detail', params: { id: o.id! } })">订单详情</el-button>
            <el-button
              v-if="o.status === 2 || o.status === 3"
              round
              size="small"
              class="refund-entry"
              @click="$router.push({ name: 'order-detail', params: { id: o.id! }, query: { refund: '1' } })"
            >
              申请退款
            </el-button>
            <el-button v-if="o.status === 1" type="primary" round size="small" @click="$router.push({ name: 'pay', params: { id: o.id! } })">
              立即支付
            </el-button>
          </footer>
        </article>
      </template>

      <el-empty v-else description="还没有相关订单" />

      <div v-if="total > size" class="pager">
        <el-pagination background layout="prev, pager, next" :total="total" :page-size="size" :current-page="page" @current-change="onPage" />
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { findUserOrders } from '@/api'
import { ORDER_STATUS, type Orders } from '@/api/types'

const tabs = [
  { label: '全部', value: undefined as number | undefined },
  { label: '待付款', value: 1 },
  { label: '待发货', value: 3 },
  { label: '待收货', value: 4 },
  { label: '已完成', value: 5 },
  { label: '已关闭', value: 6 }
]

const status = ref<number | undefined>(undefined)
const orders = ref<Orders[]>([])
const total = ref(0)
const page = ref(1)
const size = 5
const loading = ref(true)

const money = (v?: number) => Number(v ?? 0).toFixed(2)
const statusText = (s?: number) => ORDER_STATUS[s ?? 0] || '未知'
// 后端 Date 序列化成 UTC 的 ISO 串（如 2026-11-12T09:18:05.496+00:00），
// 直接截字符串会把北京时间显示成 8 小时前，所以统一解析后按本地时区格式化
const datetime = (v?: string) => {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 16)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

async function load() {
  loading.value = true
  try {
    const res = await findUserOrders(status.value, page.value, size)
    orders.value = res?.list || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

function switchTab(v?: number) {
  status.value = v
  page.value = 1
  load()
}

function onPage(p: number) {
  page.value = p
  load()
}

onMounted(load)
</script>

<style scoped>
.section-head { margin-bottom: 18px; }
.tabs { display: flex; gap: 4px; padding: 8px; margin-bottom: 16px; overflow-x: auto; }
.tabs button {
  padding: 8px 16px; border: none; background: transparent; border-radius: 9px;
  color: var(--ink-2); cursor: pointer; font-size: 13.5px; white-space: nowrap;
  &:hover { color: var(--brand); }
  &.on { background: var(--brand-soft); color: var(--brand-dark); font-weight: 700; }
}
.order { padding: 16px 20px; margin-bottom: 14px; transition: box-shadow 0.2s; }
.order:hover { box-shadow: var(--shadow-lg); }
.order__head { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px dashed var(--line); }
.order__meta { display: flex; gap: 14px; align-items: baseline; font-size: 12.5px; }
.mono { font-family: var(--mono); color: var(--ink-2); }
.status { font-size: 12.5px; font-weight: 700; color: var(--brand); }
.status[data-status='5'], .status[data-status='6'], .status[data-status='9'] { color: var(--muted); }
.order__body { display: flex; align-items: center; gap: 18px; padding: 14px 0; }
.thumbs { display: flex; gap: 8px; align-items: center; }
.thumbs img { width: 62px; height: 62px; border-radius: 10px; object-fit: cover; background: #f4efe9; cursor: pointer; }
.more { color: var(--muted); font-size: 12px; }
.order__items { flex: 1; font-size: 13px; color: var(--ink-2); }
.order__items p { margin: 0 0 4px; }
.order__amount { display: flex; align-items: baseline; gap: 8px; }
.price { font-size: 19px; color: var(--ink); }
.order__actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px dashed var(--line); padding-top: 12px; }
.pager { display: flex; justify-content: center; margin-top: 22px; }
</style>