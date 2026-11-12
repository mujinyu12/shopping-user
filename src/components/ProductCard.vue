<template>
  <article class="pcard" @click="go">
    <div class="pcard__media">
      <img v-if="!broken && img" :src="img" :alt="goods.goodsName" loading="lazy" @error="broken = true" />
      <div v-else class="ph"><el-icon :size="30"><Picture /></el-icon></div>
      <span v-if="goods.tags?.length" class="pcard__tag">{{ goods.tags[0] }}</span>
    </div>
    <div class="pcard__body">
      <h3 class="pcard__name" :title="goods.goodsName">{{ goods.goodsName }}</h3>
      <p class="pcard__caption">{{ goods.caption || goods.brand || '精选好物' }}</p>
      <div class="pcard__foot">
        <span class="price"><span class="unit">¥</span>{{ money(goods.price) }}</span>
        <el-button circle size="small" class="pcard__buy" @click.stop="quickAdd">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Goods } from '@/api/types'
import { useCartStore } from '@/stores/cart'
import { useUserStore } from '@/stores/user'

const props = defineProps<{ goods: Goods }>()
const router = useRouter()
const cart = useCartStore()
const user = useUserStore()
const broken = ref(false)

const img = computed(() => props.goods.headerPic || '')
const money = (v?: number) => Number(v ?? 0).toFixed(2)

const go = () => router.push({ name: 'detail', params: { id: props.goods.id } })

const quickAdd = async () => {
  if (!user.isLogin) {
    router.push({ name: 'login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  await cart.add(props.goods.id, 1)
  ElMessage.success('已加入购物车')
}
</script>

<style scoped>
.pcard {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.24s var(--ease), box-shadow 0.24s var(--ease), border-color 0.24s;
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow);
    border-color: #f0ded6;
  }
  &:hover .pcard__buy { opacity: 1; transform: translateY(0); }
}
.pcard__media {
  position: relative;
  aspect-ratio: 1 / 1;
  background: linear-gradient(160deg, #fbf7f3, #f3ece5);
  display: grid;
  place-items: center;
  img { width: 100%; height: 100%; object-fit: cover; }
}
.ph { color: #c8bdb1; }
.pcard__tag {
  position: absolute;
  left: 10px;
  top: 10px;
  background: rgba(27, 26, 31, 0.72);
  color: #fff;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 999px;
  backdrop-filter: blur(4px);
}
.pcard__body { padding: 12px 14px 14px; }
.pcard__name {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.45;
  height: 2.9em;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.pcard__caption {
  margin: 4px 0 10px;
  color: var(--muted);
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.pcard__foot { display: flex; align-items: center; justify-content: space-between; }
.price { font-size: 18px; }
.pcard__buy {
  opacity: 0;
  transform: translateY(4px);
  transition: all 0.2s var(--ease);
  border: none;
  background: var(--brand-soft);
  color: var(--brand-dark);
}
</style>