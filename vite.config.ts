import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import { fileURLToPath, URL } from 'node:url'

// 用户端前端：一个 /api 前缀 + 按业务前缀分发到不同后端服务
// 后端每个业务是一个独立 Spring Boot 应用，所以这里要按路径分别代理
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const api = env.VITE_API_BASE || '/api'

  const proxy = (target?: string) =>
    target
      ? {
          target,
          changeOrigin: true,
          rewrite: (p: string) => p.replace(/^\/api/, '')
        }
      : undefined

  const routes: Record<string, string | undefined> = {
    '/api/user/category': env.VITE_CATEGORY_TARGET,
    '/api/user/shoppingUser': env.VITE_USER_TARGET,
    '/api/user/address': env.VITE_ORDER_TARGET,
    '/api/user/goodsSearch': env.VITE_SEARCH_TARGET,
    '/api/user/cart': env.VITE_CART_TARGET,
    '/api/user/orders': env.VITE_ORDER_TARGET,
    '/api/user/payment': env.VITE_ORDER_TARGET,
    // 退款接口在 shopping_order_customer_api 里（RefundController），与订单同一个服务
    '/api/user/refund': env.VITE_ORDER_TARGET,
    '/api/user/seckillGoods': env.VITE_SECKILL_TARGET,
    '/api/user/custcare': env.VITE_CUSTCARE_TARGET
  }

  const proxyMap: Record<string, import('vite').ProxyOptions> = {}
  for (const [prefix, target] of Object.entries(routes)) {
    const conf = proxy(target)
    if (conf) proxyMap[prefix] = conf
  }

  return {
    base: './',
    plugins: [
      vue(),
      AutoImport({ imports: ['vue', 'vue-router', 'pinia'], resolvers: [ElementPlusResolver()], dts: 'src/auto-imports.d.ts' }),
      Components({ resolvers: [ElementPlusResolver()], dts: 'src/components.d.ts' })
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) }
    },
    server: { port: 5174, open: true, proxy: proxyMap },
    build: {
      outDir: 'dist',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('element-plus')) return 'element'
              if (id.includes('/vue/') || id.includes('@vue/') || id.includes('vue-router') || id.includes('pinia')) return 'vue'
            }
            return undefined
          }
        }
      }
    },
    define: { __API_BASE__: JSON.stringify(api) }
  }
})