<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <!-- Hero -->
      <section class="hero">
        <div class="hero__copy">
          <span class="tag-soft">NEW · 2026 秋季新品</span>
          <h1>把喜欢的<br /><em>带回家</em></h1>
          <p>严选旗舰手机与数码好物，官方正品 · 极速发货 · 七天无理由。</p>
          <div class="hero__actions">
            <el-button type="primary" size="large" round @click="$router.push('/list')">开始选购</el-button>
            <el-button size="large" round @click="$router.push('/seckill')">看限时秒杀</el-button>
          </div>
          <div class="hero__stats">
            <div><b>8+</b><span>精选商品</span></div>
            <div><b>3</b><span>热门品牌</span></div>
            <div><b>24h</b><span>极速发货</span></div>
          </div>
        </div>
        <div class="hero__media">
          <el-carousel v-if="banners.length" height="420px" :interval="4200" indicator-position="outside">
            <el-carousel-item v-for="b in banners" :key="b.id">
              <div class="banner" @click="openBanner(b)">
                <img v-if="b.pic" :src="b.pic" :alt="b.title" />
                <div v-else class="banner__fallback">{{ b.title }}</div>
                <div class="banner__mask"><span>{{ b.title }}</span></div>
              </div>
            </el-carousel-item>
          </el-carousel>
          <div v-else class="hero__placeholder">
            <el-icon :size="40"><Iphone /></el-icon>
            <p>暂无轮播广告</p>
          </div>
        </div>
      </section>

      <!-- 分类快捷入口 -->
      <section class="cats">
        <button v-for="c in categories" :key="c.id" class="cat" @click="goCategory(c)">
          <el-icon :size="20"><component :is="c.icon" /></el-icon>
          <span>{{ c.name }}</span>
        </button>
      </section>

      <!-- 秒杀 -->
      <section v-if="seckill.length">
        <div class="section-head">
          <div>
            <h2>限时秒杀 <span class="flash">FLASH</span></h2>
            <p class="sub">整点开抢，售完即止</p>
          </div>
          <router-link to="/seckill" class="more">全部秒杀 <el-icon><ArrowRight /></el-icon></router-link>
        </div>
        <div class="sk-grid">
          <article v-for="s in seckill" :key="s.id" class="sk" @click="$router.push(`/seckill/${s.goodsId}`)">
            <div class="sk__media"><img v-if="s.headerPic" :src="s.headerPic" :alt="s.title" /></div>
            <div class="sk__body">
              <h3>{{ s.title }}</h3>
              <div class="sk__price">
                <span class="price"><span class="unit">¥</span>{{ money(s.costPrice) }}</span>
                <span class="price origin">¥{{ money(s.price) }}</span>
              </div>
              <div class="sk__bar">
                <div class="bar"><i :style="{ width: soldPercent(s) + '%' }" /></div>
                <span>已抢 {{ soldPercent(s) }}%</span>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 推荐 -->
      <section>
        <div class="section-head">
          <div>
            <h2>为你推荐</h2>
            <p class="sub">买过的人都说好</p>
          </div>
          <router-link to="/list" class="more">查看全部 <el-icon><ArrowRight /></el-icon></router-link>
        </div>
        <div v-if="loading" class="p-grid">
          <el-skeleton v-for="i in 8" :key="i" animated>
            <template #template>
              <div class="sk-card"><el-skeleton-item variant="image" style="width:100%;height:200px" /><div style="padding:12px"><el-skeleton-item variant="h3" /><el-skeleton-item variant="text" style="margin-top:8px" /></div></div>
            </template>
          </el-skeleton>
        </div>
        <div v-else-if="recommend.length" class="p-grid">
          <ProductCard v-for="g in recommend" :key="g.id" :goods="g" />
        </div>
        <el-empty v-else description="暂无商品，请先启动后端商品服务" />
      </section>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ProductCard from '@/components/ProductCard.vue'
import { findSeckillPage, listBanners, searchGoods } from '@/api'
import type { Category, Goods, SeckillGoods } from '@/api/types'

const router = useRouter()
const banners = ref<Category[]>([])
const recommend = ref<Goods[]>([])
const seckill = ref<SeckillGoods[]>([])
const loading = ref(true)

const categories = [
  { id: 1, name: '手机数码', icon: 'Iphone' },
  { id: 2, name: '电脑办公', icon: 'Monitor' },
  { id: 3, name: '家用电器', icon: 'Dish' },
  { id: 4, name: '服饰鞋包', icon: 'ShoppingBag' },
  { id: 5, name: '美妆个护', icon: 'MagicStick' }
]

const money = (v?: number) => Number(v ?? 0).toFixed(2)
const soldPercent = (s: SeckillGoods) => {
  const total = Math.max(1, s.num || 1)
  const left = Math.max(0, s.stockCount ?? 0)
  return Math.min(100, Math.round(((total - left) / total) * 100))
}

const openBanner = (b: Category) => {
  if (b.url) window.open(b.url, '_blank')
  else router.push('/list')
}
const goCategory = (c: { id: number; name: string }) =>
  router.push({ name: 'list', query: { productType: c.name } })

onMounted(async () => {
  const [b, s, g] = await Promise.allSettled([
    listBanners(),
    findSeckillPage(1, 4),
    searchGoods({ page: 1, size: 8 })
  ])
  if (b.status === 'fulfilled') banners.value = b.value || []
  if (s.status === 'fulfilled') seckill.value = s.value?.records || []
  if (g.status === 'fulfilled') recommend.value = g.value?.goodsPage?.records || []
  loading.value = false
})
</script>

<style scoped>
.hero {
  display: grid;
  grid-template-columns: 1.05fr 1.2fr;
  gap: 40px;
  align-items: center;
  padding: 35px 0 10px;
}
.hero__copy h1 {
  font-size: 56px;
  line-height: 1.08;
  margin: 16px 0 14px;
  letter-spacing: -0.03em;
  em { font-style: normal; color: var(--brand); }
}
.hero__copy p { color: var(--muted); font-size: 15px; max-width: 380px; }
.hero__actions { display: flex; gap: 12px; margin: 26px 0 30px; }
.hero__stats {
  display: flex;
  gap: 34px;
  div { display: flex; flex-direction: column; }
  b { font-size: 24px; letter-spacing: -0.02em; }
  span { font-size: 12px; color: var(--muted); }
}
.hero__media { min-width: 0; }
.banner {
  position: relative;
  height: 420px;
  border-radius: 24px;
  overflow: hidden;
  cursor: pointer;
  background: #f2ece6;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.banner__mask {
  position: absolute;
  inset: auto 0 0 0;
  padding: 40px 22px 18px;
  background: linear-gradient(transparent, rgba(0, 0, 0, 0.55));
  color: #fff;
  font-weight: 700;
  font-size: 18px;
}
.banner__fallback {
  height: 100%;
  display: grid;
  place-items: center;
  color: var(--muted);
  background: linear-gradient(140deg, #fdf1ec, #f5e7dc);
  font-weight: 700;
}
.hero__placeholder {
  height: 420px;
  border-radius: 24px;
  border: 1px dashed #e6d8cf;
  display: grid;
  place-items: center;
  color: #c9b8ac;
  background: linear-gradient(140deg, #fdf7f3, #f6ece4);
}
.cats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
  margin: 34px 0 6px;
}
.cat {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px;
  border-radius: var(--radius);
  border: 1px solid var(--line);
  background: #fff;
  color: var(--ink-2);
  cursor: pointer;
  font-weight: 600;
  font-size: 13px;
  transition: all 0.2s var(--ease);
  &:hover { border-color: #f0d8ce; color: var(--brand); transform: translateY(-2px); box-shadow: var(--shadow-sm); }
}
.flash {
  display: inline-block;
  margin-left: 8px;
  font-size: 10px;
  letter-spacing: 0.16em;
  padding: 2px 7px;
  border-radius: 6px;
  background: var(--brand);
  color: #fff;
  vertical-align: middle;
}
.more { color: var(--muted); font-size: 13px; display: inline-flex; align-items: center; gap: 2px; &:hover { color: var(--brand); } }
.sk-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.sk {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.22s var(--ease);
  &:hover { transform: translateY(-3px); box-shadow: var(--shadow); }
}
.sk__media { aspect-ratio: 16 / 10; background: linear-gradient(160deg, #fbf3ef, #f2e6de); img { width: 100%; height: 100%; object-fit: cover; } }
.sk__body { padding: 12px 14px 14px; }
.sk__body h3 { font-size: 13.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.sk__price { display: flex; align-items: baseline; gap: 8px; margin: 6px 0 10px; }
.sk__bar { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--muted); }
.bar { flex: 1; height: 5px; border-radius: 99px; background: #f1e7e1; overflow: hidden; i { display: block; height: 100%; border-radius: 99px; background: linear-gradient(90deg, #f6b73c, #e8503a); } }
.p-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 18px; }
.sk-card { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
@media (max-width: 1024px) {
  .hero { grid-template-columns: 1fr; }
  .hero__copy h1 { font-size: 42px; }
  .p-grid, .sk-grid { grid-template-columns: repeat(2, 1fr); }
  .cats { grid-template-columns: repeat(3, 1fr); }
}
</style>