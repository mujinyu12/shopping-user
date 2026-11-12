<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="section-head">
        <div>
          <h2>购物车</h2>
          <p class="sub">共 {{ cart.count }} 件商品</p>
        </div>
        <router-link to="/list" class="link">继续逛逛 <el-icon><ArrowRight /></el-icon></router-link>
      </div>

      <el-skeleton v-if="cart.loading && !cart.items.length" :rows="4" animated />

      <template v-else-if="cart.items.length">
        <div class="card list">
          <div class="row head">
            <el-checkbox :model-value="allChecked" :indeterminate="someChecked" @change="toggleAll" />
            <span>商品</span>
            <span>单价</span>
            <span>数量</span>
            <span>小计</span>
            <span />
          </div>

          <div v-for="item in cart.items" :key="item.goodId" class="row">
            <el-checkbox :model-value="checked.has(item.goodId)" @change="() => toggle(item.goodId)" />
            <div class="goods">
              <img :src="item.headerPic" :alt="item.goodsName" @click="goDetail(item.goodId)" />
              <div>
                <p class="name" @click="goDetail(item.goodId)">{{ item.goodsName || `商品 ${item.goodId}` }}</p>
                <span class="muted">官方正品 · 24 小时发货</span>
              </div>
            </div>
            <span class="price">¥{{ money(item.price) }}</span>
            <el-input-number
              :model-value="item.num"
              :min="1"
              :max="99"
              size="small"
              @change="(v: number | undefined) => cart.setNum(item.goodId, Number(v || 1))"
            />
            <span class="price strong">¥{{ money(Number(item.price) * item.num) }}</span>
            <button class="del" @click="cart.remove(item.goodId)">
              <el-icon><Delete /></el-icon>
            </button>
          </div>
        </div>

        <div class="checkout card">
          <div class="checkout__left">
            <el-checkbox :model-value="allChecked" :indeterminate="someChecked" @change="toggleAll">全选</el-checkbox>
            <button class="link" @click="removeChecked">删除选中</button>
          </div>
          <div class="checkout__right">
            <span class="muted">已选 {{ checked.size }} 件，合计</span>
            <span class="price big">¥{{ money(totalChecked) }}</span>
            <el-button type="primary" size="large" round :disabled="!checked.size" @click="goCheckout">
              去结算
            </el-button>
          </div>
        </div>
      </template>

      <el-empty v-else description="购物车还是空的，去挑点喜欢的吧">
        <el-button type="primary" round @click="$router.push('/list')">去逛逛</el-button>
      </el-empty>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const cart = useCartStore()
const user = useUserStore()

const checked = ref(new Set<number>())
const money = (v?: number) => Number(v ?? 0).toFixed(2)

const allChecked = computed(() => cart.items.length > 0 && checked.value.size === cart.items.length)
const someChecked = computed(() => checked.value.size > 0 && !allChecked.value)
const totalChecked = computed(() =>
  cart.items.filter((i) => checked.value.has(i.goodId)).reduce((s, i) => s + Number(i.price || 0) * i.num, 0)
)

function toggle(goodId: number) {
  const next = new Set(checked.value)
  next.has(goodId) ? next.delete(goodId) : next.add(goodId)
  checked.value = next
}

function toggleAll(v: boolean | string | number) {
  checked.value = v ? new Set(cart.items.map((i) => i.goodId)) : new Set()
}

async function removeChecked() {
  for (const id of checked.value) await cart.remove(id)
  checked.value = new Set()
}

function goDetail(goodId: number) {
  router.push(`/detail/${goodId}`)
}

function goCheckout() {
  const ids = Array.from(checked.value).join(',')
  router.push({ name: 'checkout', query: { goods: ids } })
}

onMounted(async () => {
  if (!user.loaded) await user.loadProfile()
  await cart.refresh()
  checked.value = new Set(cart.items.map((i) => i.goodId))
})
</script>

<style scoped>
.section-head { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 18px; }
.list { padding: 4px 20px 12px; }
.row {
  display: grid;
  grid-template-columns: 32px 1fr 120px 150px 120px 40px;
  align-items: center;
  gap: 14px;
  padding: 16px 0;
  border-bottom: 1px solid var(--line);
}
.row:last-child { border-bottom: none; }
.row.head { color: var(--muted); font-size: 12.5px; padding: 14px 0; }
.goods { display: flex; gap: 14px; align-items: center; }
.goods img {
  width: 84px; height: 84px; border-radius: 12px; object-fit: cover;
  background: #f4efe9; cursor: pointer; flex-shrink: 0;
}
.name { margin: 0 0 6px; font-size: 14px; cursor: pointer; &:hover { color: var(--brand); } }
.price { font-size: 15px; }
.price.strong { font-weight: 700; color: var(--ink); }
.del {
  border: none; background: transparent; color: var(--muted); cursor: pointer;
  &:hover { color: #d14343; }
}
.checkout {
  margin-top: 16px; padding: 14px 20px;
  display: flex; align-items: center; justify-content: space-between;
  position: sticky; bottom: 16px; z-index: 5;
  box-shadow: 0 12px 30px rgba(60, 40, 30, 0.12);
}
.checkout__left { display: flex; align-items: center; gap: 18px; }
.checkout__right { display: flex; align-items: center; gap: 16px; }
.price.big { font-size: 26px; color: var(--brand); font-weight: 800; }
.link { display: inline-flex; align-items: center; gap: 4px; color: var(--muted); font-size: 13px; }
.link:hover { color: var(--brand); }
@media (max-width: 900px) {
  .row { grid-template-columns: 28px 1fr 90px; }
  .row > span:nth-child(4), .row > span:nth-child(5) { display: none; }
}
</style>