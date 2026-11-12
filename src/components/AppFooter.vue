<template>
  <footer class="ftr">
    <div class="container ftr__grid">
      <div class="ftr__brand">
        <div class="mark">慕</div>
        <h3>慕今予商城</h3>
        <p class="muted">好物精选 · 极速发货 · 七天无理由</p>
      </div>
      <div class="ftr__col">
        <h4>购物指南</h4>
        <router-link to="/list">全部商品</router-link>
        <router-link to="/seckill">限时秒杀</router-link>
        <router-link to="/orders">订单查询</router-link>
      </div>
      <div class="ftr__col">
        <h4>客户服务</h4>
        <span @click="openAi">在线客服</span>
        <span class="muted">服务时间 9:00 - 22:00</span>
        <span class="muted">售后 7 天无理由</span>
      </div>
      <div class="ftr__col">
        <h4>关于</h4>
        <span class="muted">Spring Cloud + Dubbo 微服务商城</span>
      </div>
    </div>
    <div class="container ftr__bottom">
      <span>© {{ year }} 慕今予商城 </span>
    </div>
  </footer>
</template>

<script setup lang="ts">
const year = new Date().getFullYear()
const openAi = () => window.dispatchEvent(new CustomEvent('mall:open-ai'))
</script>

<style scoped>
.ftr {
  margin-top: 60px;
  border-top: 1px solid var(--line);
  background: #fff;
  padding: 40px 0 22px;
}
.ftr__grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr 1fr;
  gap: 28px;
}
.ftr__brand h3 { margin: 10px 0 6px; font-size: 17px; }
.ftr__brand .mark {
  width: 36px; height: 36px; border-radius: 10px;
  background: linear-gradient(135deg, var(--brand), #f07a54);
  color: #fff; font-weight: 800; display: grid; place-items: center;
}
.ftr__col { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: var(--ink-2); }
.ftr__col h4 { font-size: 13px; margin-bottom: 4px; color: var(--ink); }
.ftr__col a:hover, .ftr__col span:first-of-type:hover { color: var(--brand); }
.ftr__col span { cursor: default; }
.ftr__bottom {
  margin-top: 28px; padding-top: 16px; border-top: 1px solid var(--line);
  display: flex; justify-content: space-between; font-size: 12px; color: var(--muted);
}
@media (max-width: 860px) {
  .ftr__grid { grid-template-columns: 1fr 1fr; }
}
</style>