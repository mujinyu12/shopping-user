<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="wrap">
        <div class="code">404</div>
        <h1>这个页面好像走丢了</h1>
        <p class="muted">链接可能已失效，或者商品已经被下架。</p>
        <div class="actions">
          <el-button type="primary" round @click="$router.push('/')">回到首页</el-button>
          <el-button round @click="$router.push('/list')">去逛逛商品</el-button>
        </div>
      </div>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
</script>

<style scoped>
.wrap { text-align: center; padding: 90px 20px 120px; }
.code {
  font-size: 120px; font-weight: 900; line-height: 1;
  background: linear-gradient(120deg, #f0a48b, #e8503a 60%, #b8382a);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: 4px;
}
.wrap h1 { font-size: 24px; margin: 18px 0 8px; }
.actions { display: flex; gap: 10px; justify-content: center; margin-top: 24px; }
</style>