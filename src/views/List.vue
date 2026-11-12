<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="crumb">
        <router-link to="/">首页</router-link>
        <el-icon><ArrowRight /></el-icon>
        <span>{{ keyword ? `搜索“${keyword}”` : '全部商品' }}</span>
      </div>

      <div class="layout">
        <aside class="filters card">
          <section v-if="brands.length">
            <h4>品牌</h4>
            <div class="opts">
              <button :class="{ on: !brand }" @click="setBrand('')">全部</button>
              <button v-for="b in brands" :key="b" :class="{ on: brand === b }" @click="setBrand(b)">{{ b }}</button>
            </div>
          </section>

          <section v-if="types.length">
            <h4>分类</h4>
            <div class="opts">
              <button :class="{ on: !type }" @click="setType('')">全部</button>
              <button v-for="t in types" :key="t" :class="{ on: type === t }" @click="setType(t)">{{ t }}</button>
            </div>
          </section>

          <section>
            <h4>价格区间</h4>
            <div class="price-row">
              <el-input v-model="low" placeholder="最低" size="small" />
              <span>—</span>
              <el-input v-model="high" placeholder="最高" size="small" />
            </div>
            <el-button class="apply" size="small" @click="applyPrice">应用筛选</el-button>
          </section>
        </aside>

        <section class="main">
          <div class="toolbar card">
            <div class="sorts">
              <button :class="{ on: !sortFiled }" @click="setSort('', '')">综合</button>
              <button :class="{ on: sortFiled === 'NEW' }" @click="setSort('NEW', sortFiled === 'NEW' && sort === 'ASC' ? 'DESC' : 'ASC')">
                最新 <el-icon v-if="sortFiled === 'NEW'"><component :is="sort === 'ASC' ? 'Bottom' : 'Top'" /></el-icon>
              </button>
              <button :class="{ on: sortFiled === 'PRICE' }" @click="setSort('PRICE', sortFiled === 'PRICE' && sort === 'ASC' ? 'DESC' : 'ASC')">
                价格 <el-icon v-if="sortFiled === 'PRICE'"><component :is="sort === 'ASC' ? 'Bottom' : 'Top'" /></el-icon>
              </button>
            </div>
            <span class="muted">共 {{ total }} 件商品</span>
          </div>

          <div v-if="loading" class="grid">
            <el-skeleton v-for="i in 8" :key="i" animated>
              <template #template>
                <div class="skeleton"><el-skeleton-item variant="image" style="width:100%;height:220px" /><div style="padding:12px"><el-skeleton-item variant="h3" /><el-skeleton-item variant="text" style="margin-top:8px" /></div></div>
              </template>
            </el-skeleton>
          </div>
          <div v-else-if="goods.length" class="grid">
            <ProductCard v-for="g in goods" :key="g.id" :goods="g" />
          </div>
          <el-empty v-else description="没有找到符合条件的商品">
            <el-button round @click="reset">清空筛选</el-button>
          </el-empty>

          <div v-if="total > size" class="pager">
            <el-pagination
              background
              layout="prev, pager, next"
              :total="total"
              :page-size="size"
              :current-page="page"
              @current-change="onPage"
            />
          </div>
        </section>
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import ProductCard from '@/components/ProductCard.vue'
import { searchGoods } from '@/api'
import type { Goods, GoodsSearchParam } from '@/api/types'

const route = useRoute()
const router = useRouter()

const keyword = ref('')
const brand = ref('')
const type = ref('')
const low = ref('')
const high = ref('')
const sortFiled = ref('')
const sort = ref('')

const goods = ref<Goods[]>([])
const brands = ref<string[]>([])
const types = ref<string[]>([])
const total = ref(0)
const page = ref(1)
const size = 12
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const param: GoodsSearchParam = {
      keyword: keyword.value || undefined,
      brand: brand.value || undefined,
      productType: type.value || undefined,
      lowPrice: low.value ? Number(low.value) : undefined,
      highPrice: high.value ? Number(high.value) : undefined,
      sortFiled: sortFiled.value || undefined,
      sort: sort.value || undefined,
      page: page.value,
      size
    }
    const res = await searchGoods(param)
    goods.value = res?.goodsPage?.records || []
    total.value = res?.goodsPage?.total || 0
    brands.value = Array.from(res?.brands || [])
    types.value = Array.from(res?.productType || [])
  } finally {
    loading.value = false
  }
}

function syncQuery() {
  router.replace({
    query: {
      ...(keyword.value ? { keyword: keyword.value } : {}),
      ...(brand.value ? { brand: brand.value } : {}),
      ...(type.value ? { productType: type.value } : {})
    }
  })
}

const setBrand = (b: string) => { brand.value = b; page.value = 1; syncQuery(); load() }
const setType = (t: string) => { type.value = t; page.value = 1; syncQuery(); load() }
const setSort = (f: string, s: string) => { sortFiled.value = f; sort.value = s; page.value = 1; load() }
const applyPrice = () => { page.value = 1; load() }
const onPage = (p: number) => { page.value = p; load(); window.scrollTo({ top: 0, behavior: 'smooth' }) }
const reset = () => { keyword.value = ''; brand.value = ''; type.value = ''; low.value = ''; high.value = ''; sortFiled.value = ''; sort.value = ''; page.value = 1; syncQuery(); load() }

function readQuery() {
  keyword.value = String(route.query.keyword || '')
  brand.value = String(route.query.brand || '')
  type.value = String(route.query.productType || '')
}

watch(
  () => route.query,
  () => {
    readQuery()
    page.value = 1
    load()
  }
)

onMounted(() => {
  readQuery()
  load()
})
</script>

<style scoped>
.crumb { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; margin-bottom: 16px; }
.layout { display: grid; grid-template-columns: 232px 1fr; gap: 20px; align-items: start; }
.filters { padding: 18px; position: sticky; top: 88px; section + section { margin-top: 20px; border-top: 1px dashed var(--line); padding-top: 18px; } }
.filters h4 { font-size: 13px; margin-bottom: 10px; }
.opts { display: flex; flex-wrap: wrap; gap: 6px; }
.opts button {
  padding: 5px 10px; border-radius: 8px; border: 1px solid var(--line);
  background: #fff; color: var(--ink-2); font-size: 12px; cursor: pointer;
  transition: all 0.16s;
  &:hover { border-color: #f0cfc3; color: var(--brand); }
  &.on { background: var(--brand-soft); border-color: #f3c9bc; color: var(--brand-dark); font-weight: 700; }
}
.price-row { display: flex; align-items: center; gap: 8px; color: var(--muted); }
.apply { margin-top: 10px; width: 100%; }
.toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; margin-bottom: 16px; font-size: 13px;
}
.sorts { display: flex; gap: 4px; }
.sorts button {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 6px 12px; border-radius: 8px; border: none; background: transparent;
  color: var(--ink-2); font-size: 13px; cursor: pointer;
  &:hover { color: var(--brand); }
  &.on { background: var(--brand-soft); color: var(--brand-dark); font-weight: 700; }
}
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.skeleton { background: #fff; border: 1px solid var(--line); border-radius: var(--radius); overflow: hidden; }
.pager { display: flex; justify-content: center; margin-top: 28px; }
@media (max-width: 1024px) {
  .layout { grid-template-columns: 1fr; }
  .filters { position: static; }
  .grid { grid-template-columns: repeat(2, 1fr); }
}
</style>