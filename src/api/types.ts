/** 后端统一响应体：{ code, message, data } */
export interface ApiEnvelope<T> {
  code: number
  message: string
  data: T
}

/** MyBatis-Plus 分页 */
export interface MpPage<T> {
  records: T[]
  total: number
  size: number
  current: number
  pages: number
}

/** 订单分页（后端 PageResult） */
export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  size: number
}

export interface Category {
  id: number
  title: string
  url?: string
  pic?: string
  status?: number
}

export interface Brand {
  id?: number
  name: string
}

export interface ProductType {
  id: number
  name: string
  parentId: number
  level?: number
}

export interface SpecificationOption {
  id: number
  optionName: string
  specId: number
}

export interface Specification {
  id: number
  specName: string
  productTypeId: number
  specificationOptions: SpecificationOption[]
}

export interface GoodsImage {
  id?: number
  imageTitle?: string
  imageUrl: string
  goodsId?: number
}

/** 搜索列表项（ES 文档） */
export interface Goods {
  id: number
  goodsName: string
  caption?: string
  price: number
  headerPic?: string
  brand?: string
  tags?: string[]
  productType?: string[]
  specification?: Record<string, string[]>
  isMarketable?: boolean
}

/** 商品详情（MySQL 聚合） */
export interface GoodsDesc {
  id: number
  goodsName: string
  caption?: string
  price: number
  headerPic?: string
  isMarketable?: boolean
  introduction?: string
  brand?: Brand
  productType1?: ProductType
  productType2?: ProductType
  productType3?: ProductType
  images?: GoodsImage[]
  specifications?: Specification[]
}

export interface GoodsSearchParam {
  keyword?: string
  brand?: string
  productType?: string
  highPrice?: number
  lowPrice?: number
  page?: number
  size?: number
  /** NEW | PRICE */
  sortFiled?: string
  /** ASC | DESC */
  sort?: string
}

export interface GoodsSearchResult {
  goodsPage: MpPage<Goods>
  goodsSearchParam: GoodsSearchParam
  brands?: string[]
  productType?: string[]
  specifications?: Record<string, string[]>
}

export interface CartGoods {
  id?: number
  userId?: number
  goodId: number
  num: number
  price?: number
  goodsName?: string
  headerPic?: string
  orderId?: string
  status?: number
  createTime?: string
}

export interface Orders {
  id?: string
  cartGoods?: CartGoods[]
  payment?: number
  paymentType?: number
  postFee?: number
  status?: number
  createTime?: string
  paymentTime?: string
  consignTime?: string
  endTime?: string
  closeTime?: string
  shippingName?: string
  shippingCode?: string
  userId?: number
  buyerMessage?: string
  buyerNick?: string
  receiverAreaName?: string
  receiverMobile?: string
  receiverZipCode?: string
  receiver?: string
  expire?: string
  orderType?: number
  seckillId?: number
}

export interface SeckillGoods {
  id: number
  goodsId: number
  title: string
  introduction?: string
  headerPic?: string
  price: number
  costPrice: number
  startTime: string
  endTime: string
  num: number
  stockCount: number
}

export interface Address {
  id?: number
  userId?: number
  provinceName?: string
  cityName?: string
  areaName?: string
  address?: string
  mobile?: string
  contact?: string
  zipCode?: string
}

export interface Province {
  id: string
  provinceName: string
}

export interface City {
  id: string
  city: string
  provinceId: string
}

export interface Area {
  id: string
  area: string
  cityId: string
}

/** 退款单状态：0待审核 1退款中 2已退款 3已驳回 4退款失败 */
export const REFUND_STATUS: Record<number, string> = {
  0: '待审核',
  1: '退款中',
  2: '已退款',
  3: '已驳回',
  4: '退款失败'
}

/** 退款单（一个订单最多一张，驳回/失败后可再次申请） */
export interface Refund {
  id?: string
  orderId?: string
  userId?: number
  refundNo?: string
  amount?: number
  reason?: string
  status?: number
  orderStatusBefore?: number
  auditBy?: string
  auditTime?: string
  auditRemark?: string
  createTime?: string
  successTime?: string
}

/** 订单状态：1未付款 2已付款 3未发货 4已发货 5交易成功 6交易关闭 7待评价 8退款中 9已退款 */
export const ORDER_STATUS: Record<number, string> = {
  1: '待付款',
  2: '已付款',
  3: '待发货',
  4: '已发货',
  5: '交易成功',
  6: '交易关闭',
  7: '待评价',
  8: '退款中',
  9: '已退款'
}