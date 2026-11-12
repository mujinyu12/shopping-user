import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { addCart, changeCartNum, deleteCart, findCartList } from '@/api'
import type { CartGoods } from '@/api/types'
import { useUserStore } from './user'

export const useCartStore = defineStore('cart', () => {
  const items = ref<CartGoods[]>([])
  const loading = ref(false)

  const count = computed(() => items.value.reduce((s, i) => s + (i.num || 0), 0))
  const amount = computed(() => items.value.reduce((s, i) => s + Number(i.price || 0) * (i.num || 0), 0))

  async function refresh() {
    const user = useUserStore()
    if (!user.isLogin) {
      items.value = []
      return
    }
    loading.value = true
    try {
      items.value = (await findCartList()) || []
    } finally {
      loading.value = false
    }
  }

  async function add(goodId: number, num = 1) {
    await addCart(goodId, num)
    await refresh()
  }

  async function setNum(goodId: number, num: number) {
    if (num <= 0) return remove(goodId)
    await changeCartNum(goodId, num)
    await refresh()
  }

  async function remove(goodId: number) {
    await deleteCart(goodId)
    await refresh()
  }

  function clear() {
    items.value = []
  }

  return { items, loading, count, amount, refresh, add, setNum, remove, clear }
})