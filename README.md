# 慕今予商城 · 用户端

商城前台，Vue 3 + Vite + TypeScript + Element Plus。包含首页、分类、商品详情、搜索、购物车、下单支付、订单与退款、限时秒杀、AI 客服等页面。

> 后端：[mujinyu-shopping](https://github.com/mujinyu12/mujinyu-shopping) · 管理端：[shopping-admin](https://github.com/mujinyu12/shopping-admin)

## 技术栈

| 分类 | 选型 |
| --- | --- |
| 框架 | Vue 3.5（`<script setup>`）、TypeScript |
| 构建 | Vite 6 |
| UI | Element Plus 2.9 |
| 状态管理 | Pinia 2 |
| 路由 | Vue Router 4（history 模式） |
| 请求 | Axios（统一拦截器 + 401 跳登录） |
| 其他 | qrcode（支付二维码）、vue-tsc（类型检查） |

## 快速开始

```bash
npm install
npm run dev        # 默认 http://localhost:5174
```

```bash
npm run build      # vue-tsc -b && vite build
npm run preview    # 预览构建产物
npm run typecheck  # 只做类型检查
```

> 前端必须先启动后端接口层（`localhost:8002~8008`），否则页面会一直转圈或报网络错误。

## 开发代理与接口映射

`vite.config.ts` 按路径前缀把 `/api/*` 分发到不同后端服务，地址来自 `.env.development`：

| 环境变量 | 默认值 | 对应后端 |
| --- | --- | --- |
| `VITE_API_BASE` | `/api` | 请求前缀 |
| `VITE_CATEGORY_TARGET` | `http://localhost:8002` | 分类/品牌 |
| `VITE_USER_TARGET` | `http://localhost:8003` | 用户、地址 |
| `VITE_SEARCH_TARGET` | `http://localhost:8004` | 商品搜索 |
| `VITE_CART_TARGET` | `http://localhost:8005` | 购物车 |
| `VITE_ORDER_TARGET` | `http://localhost:8006` | 订单、支付、退款 |
| `VITE_SECKILL_TARGET` | `http://localhost:8007` | 秒杀 |
| `VITE_CUSTCARE_TARGET` | `http://localhost:8008` | AI 客服 |

接口地址以 `/api` 开头，例如 `GET /api/user/orders/findUserOrders` → `http://localhost:8006/user/orders/findUserOrders`。

**新增接口时**：如果路径前缀不在上表里，需要同步在 `vite.config.ts` 的 proxy 中加一条规则，否则开发环境会 404。

## 目录结构

```
shopping-user/
├── src/
│   ├── api/            # 接口封装（index.ts）、类型定义（types.ts）
│   ├── components/     # 公共组件（AiChat、GoodsCard、AppHeader…）
│   ├── router/         # 路由表与守卫
│   ├── stores/         # Pinia（用户、购物车）
│   ├── utils/          # 请求封装、格式化、文本处理
│   └── views/          # 页面（Home、Search、Detail、Cart、Pay、Orders、Seckill…）
├── public/
├── .env.development    # 开发环境后端地址（无密钥，随仓库提交）
└── vite.config.ts      # 代理规则 + 构建配置
```

## 主要页面

| 路由 | 说明 |
| --- | --- |
| `/` | 首页（轮播、分类、推荐、秒杀入口） |
| `/search` | 搜索结果（走 ES，支持品牌/价格/规格筛选） |
| `/detail/:id` | 商品详情、规格选择、加入购物车 |
| `/cart` | 购物车 |
| `/order/confirm` | 确认订单 |
| `/pay/:id` | 支付页（普通订单微信扫码；秒杀订单为倒计时确认页） |
| `/orders`、`/order/:id` | 订单列表 / 详情，含**申请退款**入口 |
| `/seckill`、`/seckill/:goodsId` | 秒杀列表 / 详情（支持未开始、进行中、已结束三态） |
| `/login`、`/register` | 登录注册 |

## 接口约定

- 登录后 token 存 `localStorage` 的 `mall:token`，请求头 `Authorization: Bearer <token>`
- 统一响应体：`{ code, message, data }`，`code !== 200` 视为业务失败并弹出提示
- 时间字段后端返回 ISO 字符串（UTC），页面统一用 `new Date(v)` 转本地时区格式化，**不要**直接字符串截断

## 已知说明

- 支付为演示实现：普通订单走微信 Native 扫码（需要真实的商户配置），秒杀订单走模拟支付接口，不产生真实扣款
- `dist/`、`node_modules/` 不入库，需要时自行构建

## 声明

个人学习 / 毕业设计项目，仅供学习参考。