<template>
  <AppHeader />

  <main class="page">
    <div class="container narrow">
      <div class="section-head">
        <div>
          <h2>确认订单</h2>
          <p class="sub">核对收货信息与商品清单</p>
        </div>
      </div>

      <section class="card block">
        <div class="block__head">
          <h3>收货地址</h3>
          <button class="link" @click="$router.push({ name: 'address', query: { from: 'checkout' } })">
            <el-icon><Plus /></el-icon> 管理地址
          </button>
        </div>

        <div v-if="addresses.length" class="addresses">
          <button
            v-for="a in addresses"
            :key="a.id"
            class="addr"
            :class="{ on: addrId === a.id }"
            @click="addrId = a.id!"
          >
            <div class="addr__top">
              <b>{{ a.contact }}</b>
              <span>{{ a.mobile }}</span>
            </div>
            <p>{{ a.provinceName }}{{ a.cityName }}{{ a.areaName }} {{ a.address }}</p>
          </button>
        </div>
        <el-empty v-else :image-size="70" description="还没有收货地址">
          <el-button round @click="$router.push({ name: 'address' })">去添加</el-button>
        </el-empty>
      </section>

      <section class="card block">
        <div class="block__head"><h3>商品清单</h3><span class="muted">{{ items.length }} 件</span></div>
        <div v-for="i in items" :key="i.goodId" class="line">
          <img :src="i.headerPic" :alt="i.goodsName" />
          <div class="line__info">
            <p>{{ i.goodsName }}</p>
            <span class="muted">¥{{ money(i.price) }} × {{ i.num }}</span>
          </div>
          <b>¥{{ money(Number(i.price) * i.num) }}</b>
        </div>
      </section>

      <section class="card block">
        <div class="block__head"><h3>买家留言</h3></div>
        <el-input v-model="buyerMessage" type="textarea" :rows="2" maxlength="120" show-word-limit placeholder="选填，如对发货时间、包装有要求" />
      </section>

      <section class="card block summary">
        <div class="sum-row"><span>商品金额</span><span>¥{{ money(goodsAmount) }}</span></div>
        <div class="sum-row"><span>运费</span><span>{{ postFee === 0 ? '免运费' : `¥${money(postFee)}` }}</span></div>
        <div class="sum-row total"><span>应付</span><span class="price big">¥{{ money(goodsAmount + postFee) }}</span></div>
        <el-button type="primary" size="large" round class="submit" :loading="submitting" @click="submit">
          提交订单
        </el-button>
      </section>
    </div>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { addOrder, findAddresses } from '@/api'
import type { Address, CartGoods } from '@/api/types'
import { useCartStore } from '@/stores/cart'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()

const addresses = ref<Address[]>([])
const addrId = ref<number>()
const buyerMessage = ref('')
const submitting = ref(false)
const postFee = ref(0)

const money = (v?: number) => Number(v ?? 0).toFixed(2)

const items = computed<CartGoods[]>(() => {
  const raw = String(route.query.goods || '')
  if (!raw) return cart.items
  const ids = new Set(raw.split(',').map(Number))
  return cart.items.filter((i) => ids.has(i.goodId))
})
const goodsAmount = computed(() => items.value.reduce((s, i) => s + Number(i.price || 0) * i.num, 0))
const address = computed(() => addresses.value.find((a) => a.id === addrId.value))

async function submit() {
  if (!items.value.length) return ElMessage.warning('请选择要结算的商品')
  const a = address.value
  if (!a) return ElMessage.warning('请先选择收货地址')

  submitting.value = true
  try {
    const order = await addOrder({
      cartGoods: items.value.map((i) => ({ goodId: i.goodId, num: i.num })),
      payment: goodsAmount.value + postFee.value,
      postFee: postFee.value,
      buyerMessage: buyerMessage.value || undefined,
      buyerNick: a.contact,
      receiver: a.contact,
      receiverMobile: a.mobile,
      receiverAreaName: `${a.provinceName}${a.cityName}${a.areaName}`,
      receiverZipCode: a.zipCode
    })
    await cart.refresh()
    ElMessage.success('订单已创建')
    router.replace({ name: 'pay', params: { id: order.id! } })
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  await cart.refresh()
  addresses.value = (await findAddresses()) || []
  addrId.value = addresses.value[0]?.id
})
</script>

<style scoped>
.narrow { max-width: 900px; }
.block { padding: 20px 22px; margin-bottom: 16px; }
.block__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.block__head h3 { font-size: 15px; margin: 0; }
.addresses { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
.addr {
  text-align: left; padding: 14px; border-radius: 12px; cursor: pointer;
  border: 1.5px solid var(--line); background: #fff; transition: all 0.16s;
  &:hover { border-color: #f0cabb; }
  &.on { border-color: var(--brand); background: var(--brand-soft); }
}
.addr__top { display: flex; gap: 10px; align-items: baseline; margin-bottom: 6px; font-size: 13.5px; }
.addr p { margin: 0; color: var(--muted); font-size: 12.5px; line-height: 1.6; }
.line { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-bottom: 1px dashed var(--line); }
.line:last-child { border-bottom: none; }
.line img { width: 64px; height: 64px; border-radius: 10px; object-fit: cover; background: #f4efe9; }
.line__info { flex: 1; }
.line__info p { margin: 0 0 4px; font-size: 13.5px; }
.summary { display: flex; flex-direction: column; gap: 10px; }
.sum-row { display: flex; justify-content: space-between; color: var(--ink-2); font-size: 13.5px; }
.sum-row.total { border-top: 1px dashed var(--line); padding-top: 12px; align-items: baseline; }
.price.big { font-size: 26px; color: var(--brand); font-weight: 800; }
.submit { margin-top: 6px; }
.link { display: inline-flex; align-items: center; gap: 4px; border: none; background: transparent; color: var(--muted); cursor: pointer; font-size: 13px; }
.link:hover { color: var(--brand); }
</style>