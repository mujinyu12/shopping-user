<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="crumb">
        <router-link to="/">首页</router-link>
        <el-icon><ArrowRight /></el-icon>
        <router-link to="/list">全部商品</router-link>
        <el-icon><ArrowRight /></el-icon>
        <span>{{ goods?.goodsName || '商品详情' }}</span>
      </div>

      <el-skeleton v-if="loading" :rows="8" animated />

      <template v-else-if="goods">
        <div class="detail card">
          <div class="gallery">
            <div class="gallery__main">
              <img v-if="activeImage" :src="activeImage" :alt="goods.goodsName" />
              <div v-else class="ph"><el-icon :size="36"><Picture /></el-icon></div>
            </div>
            <div v-if="images.length > 1" class="thumbs">
              <button
                v-for="(im, i) in images"
                :key="i"
                :class="{ on: activeImage === im }"
                @click="activeImage = im"
              >
                <img :src="im" :alt="`图${i + 1}`" />
              </button>
            </div>
          </div>

          <div class="info">
            <div class="info__tags">
              <span v-if="goods.brand?.name" class="tag-soft">{{ goods.brand.name }}</span>
              <span v-if="!goods.isMarketable" class="tag-soft" style="background:#f4f4f5;color:#8b8694">已下架</span>
              <span v-for="t in productPath" :key="t" class="tag-soft" style="background:#f4f1ec;color:#6b6459">{{ t }}</span>
            </div>
            <h1>{{ goods.goodsName }}</h1>
            <p class="caption">{{ goods.caption }}</p>

            <div class="pricebox">
              <div>
                <span class="price"><span class="unit">¥</span>{{ money(goods.price) }}</span>
                <span class="muted price-note">含税 · 包邮</span>
              </div>
              <div class="sales">30 天售出 <b>{{ 120 + (goods.id % 90) }}</b> 件</div>
            </div>

            <div v-if="specGroups.length" class="specs">
              <div v-for="sp in specGroups" :key="sp.id" class="spec">
                <span class="spec__label">{{ sp.specName }}</span>
                <div class="spec__opts">
                  <button
                    v-for="op in sp.specificationOptions || []"
                    :key="op.id"
                    :class="{ on: chosen[sp.specName] === op.optionName }"
                    @click="chosen[sp.specName] = op.optionName"
                  >
                    {{ op.optionName }}
                  </button>
                </div>
              </div>
            </div>

            <div class="qty">
              <span class="spec__label">数量</span>
              <el-input-number v-model="num" :min="1" :max="99" />
              <span class="muted">库存充足</span>
            </div>

            <div class="actions">
              <el-button size="large" round :disabled="goods.isMarketable === false" @click="add(true)">
                加入购物车
              </el-button>
              <el-button type="primary" size="large" round :disabled="goods.isMarketable === false" @click="buyNow">
                立即购买
              </el-button>
              <button class="ai-link" @click="openAi">
                <el-icon><ChatDotRound /></el-icon> 问问 AI 客服
              </button>
            </div>

            <ul class="promise">
              <li><el-icon><CircleCheck /></el-icon> 官方正品</li>
              <li><el-icon><Van /></el-icon> 24 小时发货</li>
              <li><el-icon><RefreshLeft /></el-icon> 七天无理由</li>
              <li><el-icon><Service /></el-icon> 一年质保</li>
            </ul>
          </div>
        </div>

        <section class="desc card">
          <div class="tabs">
            <button :class="{ on: tab === 'intro' }" @click="tab = 'intro'">商品介绍</button>
            <button :class="{ on: tab === 'param' }" @click="tab = 'param'">规格参数</button>
          </div>
          <div v-if="tab === 'intro'" class="intro">
            <p v-if="goods.introduction">{{ goods.introduction }}</p>
            <p v-else class="muted">商家暂未填写详细介绍。</p>
          </div>
          <el-descriptions v-else :column="2" border>
            <el-descriptions-item label="商品名称">{{ goods.goodsName }}</el-descriptions-item>
            <el-descriptions-item label="品牌">{{ goods.brand?.name || '-' }}</el-descriptions-item>
            <el-descriptions-item label="分类">{{ productPath.join(' / ') || '-' }}</el-descriptions-item>
            <el-descriptions-item label="价格">¥{{ money(goods.price) }}</el-descriptions-item>
            <el-descriptions-item v-for="sp in specGroups" :key="sp.id" :label="sp.specName">
              {{ (sp.specificationOptions || []).map((o) => o.optionName).join('、') }}
            </el-descriptions-item>
          </el-descriptions>
        </section>

        <section v-if="related.length">
          <div class="section-head"><div><h2>看了又看</h2><p class="sub">同类目下的其他好物</p></div></div>
          <div class="grid"><ProductCard v-for="g in related" :key="g.id" :goods="g" /></div>
        </section>
      </template>

      <el-empty v-else description="商品不存在或已下架" />
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ProductCard from '@/components/ProductCard.vue'
import { findGoodsDesc, searchGoods } from '@/api'
import type { Goods, GoodsDesc } from '@/api/types'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const user = useUserStore()
const cart = useCartStore()

const goods = ref<GoodsDesc | null>(null)
const related = ref<Goods[]>([])
const loading = ref(true)
const activeImage = ref('')
const num = ref(1)
const tab = ref<'intro' | 'param'>('intro')
const chosen = reactive<Record<string, string>>({})

const money = (v?: number) => Number(v ?? 0).toFixed(2)
const images = computed(() => {
  const list = (goods.value?.images || []).map((i) => i.imageUrl).filter(Boolean)
  const head = goods.value?.headerPic
  return [...new Set([head, ...list].filter(Boolean) as string[])]
})
const productPath = computed(() =>
  [goods.value?.productType1?.name, goods.value?.productType2?.name, goods.value?.productType3?.name].filter(Boolean) as string[]
)
const specGroups = computed(() => (goods.value?.specifications || []).filter((s) => s.specificationOptions?.length))

async function load() {
  loading.value = true
  try {
    const id = String(route.params.id)
    goods.value = await findGoodsDesc(id)
    activeImage.value = images.value[0] || ''
    if (!activeImage.value && goods.value?.headerPic) activeImage.value = goods.value.headerPic
    // 默认选中每个规格的第一项
    specGroups.value.forEach((s) => {
      if (s.specificationOptions?.length) chosen[s.specName] = s.specificationOptions[0].optionName
    })
    const kw = goods.value?.productType3?.name || goods.value?.brand?.name || ''
    if (kw) {
      const res = await searchGoods({ keyword: kw, page: 1, size: 4 })
      related.value = (res?.goodsPage?.records || []).filter((g) => g.id !== goods.value?.id).slice(0, 4)
    }
  } finally {
    loading.value = false
  }
}

function requireLogin() {
  if (user.isLogin) return true
  router.push({ name: 'login', query: { redirect: route.fullPath } })
  return false
}

async function add(silent = false) {
  if (!requireLogin()) return
  await cart.add(Number(route.params.id), num.value)
  if (!silent) ElMessage.success('已加入购物车')
}

async function buyNow() {
  if (!requireLogin()) return
  await cart.add(Number(route.params.id), num.value)
  router.push({ name: 'checkout' })
}

const openAi = () => window.dispatchEvent(new CustomEvent('mall:open-ai'))

watch(() => route.params.id, load)
onMounted(load)
</script>

<style scoped>
.crumb { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; margin-bottom: 16px; }
.detail { display: grid; grid-template-columns: 480px 1fr; gap: 34px; padding: 24px; }
.gallery__main {
  aspect-ratio: 1 / 1;
  border-radius: var(--radius);
  overflow: hidden;
  background: linear-gradient(160deg, #fbf7f3, #f1e9e1);
  img { width: 100%; height: 100%; object-fit: cover; }
}
.ph { height: 100%; display: grid; place-items: center; color: #c9bdb2; }
.thumbs { display: flex; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
.thumbs button {
  width: 68px; height: 68px; padding: 0; border-radius: 10px; overflow: hidden;
  border: 2px solid transparent; background: #f4efe9; cursor: pointer;
  img { width: 100%; height: 100%; object-fit: cover; }
  &.on { border-color: var(--brand); }
}
.info h1 { font-size: 26px; line-height: 1.35; margin: 10px 0 6px; }
.caption { color: var(--muted); margin: 0 0 16px; }
.info__tags { display: flex; gap: 6px; flex-wrap: wrap; }
.pricebox {
  display: flex; align-items: flex-end; justify-content: space-between;
  background: linear-gradient(120deg, #fff5f1, #fffaf6);
  border: 1px solid #f7e2d9; border-radius: var(--radius);
  padding: 18px 20px; margin: 18px 0;
  .price { font-size: 34px; }
  .price-note { font-size: 12px; margin-left: 10px; }
  .sales { color: var(--muted); font-size: 12px; b { color: var(--ink); } }
}
.specs { display: flex; flex-direction: column; gap: 14px; margin-bottom: 16px; }
.spec { display: flex; gap: 14px; align-items: flex-start; }
.spec__label { width: 56px; color: var(--muted); font-size: 13px; line-height: 30px; flex-shrink: 0; }
.spec__opts { display: flex; gap: 8px; flex-wrap: wrap; }
.spec__opts button {
  padding: 5px 14px; border-radius: 9px; border: 1px solid var(--line);
  background: #fff; cursor: pointer; font-size: 13px; color: var(--ink-2);
  &:hover { border-color: #f0cabb; }
  &.on { border-color: var(--brand); color: var(--brand-dark); background: var(--brand-soft); font-weight: 600; }
}
.qty { display: flex; align-items: center; gap: 14px; margin: 18px 0 24px; }
.actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.ai-link {
  display: inline-flex; align-items: center; gap: 6px;
  border: none; background: transparent; color: var(--muted); cursor: pointer; font-size: 13px;
  &:hover { color: var(--brand); }
}
.promise { list-style: none; display: flex; gap: 22px; padding: 18px 0 0; margin: 22px 0 0; border-top: 1px dashed var(--line); color: var(--muted); font-size: 12.5px; flex-wrap: wrap; }
.promise li { display: inline-flex; align-items: center; gap: 5px; }
.desc { margin-top: 20px; padding: 6px 24px 24px; }
.tabs { display: flex; gap: 6px; border-bottom: 1px solid var(--line); margin-bottom: 18px; }
.tabs button {
  padding: 14px 16px; border: none; background: transparent; cursor: pointer;
  font-size: 14px; color: var(--muted); border-bottom: 2px solid transparent;
  &.on { color: var(--brand); border-bottom-color: var(--brand); font-weight: 700; }
}
.intro { color: var(--ink-2); line-height: 1.9; font-size: 14px; white-space: pre-wrap; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
@media (max-width: 980px) {
  .detail { grid-template-columns: 1fr; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}
</style>