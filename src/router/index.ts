import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

declare module 'vue-router' {
  interface RouteMeta {
    title?: string
    auth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
  { path: '/list', name: 'list', component: () => import('@/views/List.vue'), meta: { title: '全部商品' } },
  { path: '/detail/:id', name: 'detail', component: () => import('@/views/Detail.vue'), meta: { title: '商品详情' } },
  { path: '/seckill', name: 'seckill', component: () => import('@/views/Seckill.vue'), meta: { title: '限时秒杀' } },
  { path: '/seckill/:id', name: 'seckill-detail', component: () => import('@/views/SeckillDetail.vue'), meta: { title: '秒杀详情' } },
  { path: '/cart', name: 'cart', component: () => import('@/views/Cart.vue'), meta: { title: '购物车', auth: true } },
  { path: '/checkout', name: 'checkout', component: () => import('@/views/Checkout.vue'), meta: { title: '确认订单', auth: true } },
  { path: '/pay/:id', name: 'pay', component: () => import('@/views/Pay.vue'), meta: { title: '收银台', auth: true } },
  { path: '/orders', name: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单', auth: true } },
  { path: '/order/:id', name: 'order-detail', component: () => import('@/views/OrderDetail.vue'), meta: { title: '订单详情', auth: true } },
  { path: '/address', name: 'address', component: () => import('@/views/Address.vue'), meta: { title: '收货地址', auth: true } },
  { path: '/login', name: 'login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  { path: '/register', name: 'register', component: () => import('@/views/Register.vue'), meta: { title: '注册' } },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/views/NotFound.vue'), meta: { title: '页面不存在' } }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: (_to, _from, saved) => saved || { top: 0 }
})

router.beforeEach(async (to) => {
  document.title = to.meta.title ? `${to.meta.title} · 慕今予商城` : '慕今予商城'
  const user = useUserStore()
  if (!user.loaded) await user.loadProfile()
  if (to.meta.auth && !user.isLogin) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }
  return true
})

export default router