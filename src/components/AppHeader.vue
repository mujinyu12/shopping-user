<template>
  <header class="hdr">
    <div class="container hdr__inner">
      <router-link to="/" class="brand">
        <span class="brand__mark">慕</span>
        <span class="brand__name">慕今予<em>商城</em></span>
      </router-link>

      <nav class="nav">
        <router-link to="/" class="nav__item" active-class="is-active" exact-active-class="is-active">首页</router-link>
        <router-link to="/list" class="nav__item" active-class="is-active">全部商品</router-link>
        <router-link to="/seckill" class="nav__item" active-class="is-active">限时秒杀</router-link>
        <router-link to="/orders" class="nav__item" active-class="is-active">我的订单</router-link>
      </nav>

      <div class="search">
        <el-autocomplete
          v-model="keyword"
          :fetch-suggestions="suggest"
          placeholder="搜索商品 / 品牌，如 iphone13pro"
          clearable
          @keyup.enter="goSearch"
          @select="goSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-autocomplete>
      </div>

      <div class="actions">
        <router-link to="/cart" class="act">
          <el-badge :value="cart.count" :hidden="!cart.count" :max="99">
            <el-icon :size="20"><ShoppingCart /></el-icon>
          </el-badge>
          <span>购物车</span>
        </router-link>

        <template v-if="user.isLogin">
          <el-dropdown @command="onCommand">
            <span class="act user">
              <span class="avatar">{{ (user.username || 'U').slice(0, 1) }}</span>
              <span class="ellipsis">{{ user.username || '已登录' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="orders">我的订单</el-dropdown-item>
                <el-dropdown-item command="address">收货地址</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
        <router-link v-else to="/login" class="btn-login">登录 / 注册</router-link>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { autoSuggest } from '@/api'
import { useUserStore } from '@/stores/user'
import { useCartStore } from '@/stores/cart'

const router = useRouter()
const user = useUserStore()
const cart = useCartStore()
const keyword = ref('')

const suggest = async (q: string, cb: (items: { value: string }[]) => void) => {
  if (!q?.trim()) return cb([])
  try {
    const list = await autoSuggest(q.trim())
    cb((list || []).map((v) => ({ value: v })))
  } catch {
    cb([])
  }
}

const goSearch = () => {
  router.push({ name: 'list', query: keyword.value.trim() ? { keyword: keyword.value.trim() } : {} })
}

const onCommand = (cmd: string) => {
  if (cmd === 'logout') {
    user.logout()
    cart.clear()
    router.push('/')
    return
  }
  router.push(`/${cmd}`)
}

onMounted(() => {
  if (user.isLogin) cart.refresh()
})
</script>

<style scoped>
.hdr {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: saturate(180%) blur(12px);
  border-bottom: 1px solid var(--line);
}
.hdr__inner {
  display: flex;
  align-items: center;
  gap: 22px;
  height: 68px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}
.brand__mark {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand), #f07a54);
  color: #fff;
  font-weight: 800;
  display: grid;
  place-items: center;
  font-size: 18px;
  box-shadow: 0 6px 16px rgba(232, 80, 58, 0.28);
}
.brand__name {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: 0.02em;
  em {
    font-style: normal;
    font-size: 12px;
    font-weight: 600;
    color: var(--muted);
    margin-left: 4px;
  }
}
.nav {
  display: flex;
  gap: 4px;
}
.nav__item {
  padding: 8px 12px;
  border-radius: 999px;
  color: var(--ink-2);
  font-weight: 500;
  transition: all 0.18s var(--ease);
  &:hover { color: var(--brand); background: var(--brand-soft); }
  &.is-active { color: var(--brand); background: var(--brand-soft); font-weight: 700; }
}
.search {
  flex: 1;
  max-width: 380px;
  margin-left: auto;
}
.search :deep(.el-input__wrapper) {
  border-radius: 999px;
  background: #f5f2ee;
  box-shadow: none;
  padding-left: 14px;
}
.search :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px rgba(232, 80, 58, 0.18);
  background: #fff;
}
.actions {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}
.act {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-2);
  font-size: 13px;
  cursor: pointer;
  &:hover { color: var(--brand); }
}
.avatar {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--brand-soft);
  color: var(--brand-dark);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 12px;
}
.ellipsis { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.btn-login {
  padding: 8px 16px;
  border-radius: 999px;
  background: var(--brand);
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  box-shadow: 0 8px 18px rgba(232, 80, 58, 0.24);
  &:hover { background: #ef6a55; }
}
@media (max-width: 1080px) {
  .nav { display: none; }
}
</style>