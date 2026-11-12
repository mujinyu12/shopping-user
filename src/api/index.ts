import { del, form, formConfig, get, post, put } from './request'
import type {
  Address,
  Area,
  CartGoods,
  Category,
  City,
  GoodsDesc,
  GoodsSearchParam,
  GoodsSearchResult,
  Orders,
  PageResult,
  Province,
  Refund,
  SeckillGoods,
  MpPage
} from './types'

/* ---------------- 广告位 ---------------- */
export const listBanners = () => get<Category[]>('/user/category/all')

/* ---------------- 用户 ---------------- */
export interface RegisterPayload {
  username: string
  password: string
  phone: string
}
export const loginByPassword = (username: string, password: string) =>
  post<string>('/user/shoppingUser/loginPassword', { username, password })
export const loginByCode = (phone: string, checkCode: string) =>
  post<string>(`/user/shoppingUser/loginCheckCode?phone=${encodeURIComponent(phone)}&checkCode=${encodeURIComponent(checkCode)}`)
export const sendLoginCode = (phone: string) => get(`/user/shoppingUser/sendLoginCheckCode`, { phone })
export const sendRegisterCode = (phone: string) => get(`/user/shoppingUser/sendMessage`, { phone })
export const verifyRegisterCode = (phone: string, checkCode: string) =>
  get(`/user/shoppingUser/registerCheckCode`, { phone, checkCode })
export const register = (payload: RegisterPayload, checkCode: string) =>
  post(`/user/shoppingUser/register?checkCode=${encodeURIComponent(checkCode)}`, payload)
export const getUsername = () => get<string>('/user/shoppingUser/getName')

/* ---------------- 商品搜索 ---------------- */
export const searchGoods = (param: GoodsSearchParam) =>
  post<GoodsSearchResult>('/user/goodsSearch/search', param)
export const findGoodsDesc = (id: number | string) => get<GoodsDesc>('/user/goodsSearch/findDesc', { id })
export const autoSuggest = (keyword: string) => get<string[]>('/user/goodsSearch/autoSuggest', { keyword })

/* ---------------- 购物车 ---------------- */
export const findCartList = () => get<CartGoods[]>('/user/cart/findCartList')
export const addCart = (goodId: number, num: number) => post('/user/cart/addCart', { goodId, num })
export const changeCartNum = (goodId: number, num: number) =>
  get('/user/cart/handleCart', { goodId, num })
export const deleteCart = (goodId: number) => del('/user/cart/deleteCart', { goodId })

/* ---------------- 订单 / 支付 ---------------- */
export const addOrder = (orders: Orders) => post<Orders>('/user/orders/add', orders)
export const findOrder = (id: string) => get<Orders>('/user/orders/findById', { id })
export const findUserOrders = (status: number | undefined, page: number, size: number) =>
  get<PageResult<Orders>>('/user/orders/findUserOrders', { status, page, size })
export const pcPay = (orderId: string) =>
  post<string>(`/user/payment/pcPay?orderId=${encodeURIComponent(orderId)}`, undefined, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  })

/* ---------------- 退款 ---------------- */
/** 申请整单退款（订单 2/3 → 8），reason 为用户填写的退款原因 */
export const applyRefund = (orderId: string, reason?: string) =>
  post<Refund>(`/user/refund/apply?orderId=${encodeURIComponent(orderId)}${reason ? `&reason=${encodeURIComponent(reason)}` : ''}`)
/** 按订单 id 查询退款单，没有则返回 null */
export const findRefundByOrderId = (orderId: string) =>
  get<Refund | null>('/user/refund/findByOrderId', { orderId })

/* ---------------- 秒杀 ---------------- */
export const findSeckillPage = (page: number, size: number) =>
  get<MpPage<SeckillGoods>>('/user/seckillGoods/findPage', { page, size })
export const findSeckill = (id: number | string) => get<SeckillGoods>('/user/seckillGoods/findById', { id })
export const addSeckillOrder = (orders: Orders) => post<Orders>('/user/seckillGoods/add', orders)
export const findSeckillOrder = (id: string) => get<Orders>('/user/seckillGoods/findOrder', { id })
export const paySeckill = (id: string) => post<Orders>('/user/seckillGoods/pay', form({ id }), formConfig)

/* ---------------- 收货地址 ---------------- */
export const findAddresses = () => get<Address[]>('/user/address/findByUser')
export const findAddress = (id: number) => get<Address>('/user/address/findById', { id })
export const addAddress = (address: Address) => post('/user/address/add', address)
export const updateAddress = (address: Address) => put('/user/address/update', address)
export const deleteAddress = (id: number) => del('/user/address/delete', { id })
export const findProvinces = () => get<Province[]>('/user/address/findAllProvince')
export const findCities = (provinceId: string) => get<City[]>('/user/address/findCityByProvince', { provinceId })
export const findAreas = (cityId: string) => get<Area[]>('/user/address/findAreaByCity', { cityId })

/* ---------------- AI 客服 ---------------- */
/** 大模型链路较慢（含工具调用 + 知识库检索），超时给到 310s */
export const askAi = (message: string) =>
  get<string>('/user/custcare/answer', { message }, { timeout: 310000 })