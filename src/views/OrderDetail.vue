<template>
  <AppHeader />

  <main class="page">
    <div class="container">
      <div class="crumb">
        <router-link to="/orders">我的订单</router-link>
        <el-icon><ArrowRight /></el-icon>
        <span>订单详情</span>
      </div>

      <el-skeleton v-if="loading" :rows="6" animated />

      <template v-else-if="order">
        <section class="card status-card" :data-status="order.status">
          <div class="status-card__icon">
            <el-icon :size="28"><component :is="statusIcon" /></el-icon>
          </div>
          <div class="status-card__text">
            <h2>{{ statusText(order.status) }}</h2>
            <p class="muted">{{ statusHint }}</p>
          </div>
          <el-button v-if="order.status === 1" type="primary" round @click="$router.push({ name: 'pay', params: { id: order.id! } })">
            立即支付
          </el-button>
          <el-button v-if="canApplyRefund" round class="ghost-btn" @click="openRefund">申请退款</el-button>
          <el-button v-else-if="order.status === 8" round disabled>退款审核中</el-button>
        </section>

        <section class="card block">
          <h3>物流与收货</h3>
          <div class="kv">
            <span>收货人</span><b>{{ order.receiver }} {{ order.receiverMobile }}</b>
          </div>
          <div class="kv"><span>收货地址</span><b>{{ order.receiverAreaName }} {{ order.receiverZipCode || '' }}</b></div>
          <div v-if="order.shippingCode" class="kv"><span>运单号</span><b class="mono">{{ order.shippingCode }}</b></div>
          <div v-if="order.buyerMessage" class="kv"><span>买家留言</span><b>{{ order.buyerMessage }}</b></div>
        </section>

        <section class="card block">
          <h3>商品清单</h3>
          <div v-for="g in order.cartGoods || []" :key="g.goodId" class="line">
            <img :src="g.headerPic" :alt="g.goodsName" @click="$router.push(`/detail/${g.goodId}`)" />
            <div class="line__info">
              <p>{{ g.goodsName }}</p>
              <span class="muted">¥{{ money(g.price) }} × {{ g.num }}</span>
            </div>
            <b>¥{{ money(Number(g.price) * g.num) }}</b>
          </div>
          <div class="total-line">
            <span class="muted">运费 ¥{{ money(order.postFee) }}</span>
            <span>实付 <b class="price">¥{{ money(order.payment) }}</b></span>
          </div>
        </section>

        <section v-if="refund" class="card block refund-block">
          <h3>退款信息</h3>
          <div class="kv"><span>退款状态</span>
            <b :class="['refund-state', `refund-state--${refund.status}`]">{{ refundStatusText(refund.status) }}</b>
          </div>
          <div class="kv"><span>退款金额</span><b>¥{{ money(refund.amount) }}</b></div>
          <div class="kv"><span>退款原因</span><b>{{ refund.reason || '未填写' }}</b></div>
          <div class="kv"><span>申请时间</span><b>{{ datetime(refund.createTime) }}</b></div>
          <div v-if="refund.auditTime" class="kv"><span>审核时间</span><b>{{ datetime(refund.auditTime) }}</b></div>
          <div v-if="refund.auditRemark" class="kv"><span>审核备注</span><b>{{ refund.auditRemark }}</b></div>
          <div v-if="canApplyRefund && refund?.status === 3" class="refund-tip">
            退款申请已被驳回，你可以重新提交申请。
          </div>
          <div v-else-if="refund?.status === 0" class="refund-tip">商家审核通过后将原路退回，请留意账户到账通知。</div>
        </section>

        <section class="card block">
          <h3>订单信息</h3>
          <div class="kv"><span>订单编号</span><b class="mono">{{ order.id }}</b></div>
          <div class="kv"><span>下单时间</span><b>{{ datetime(order.createTime) }}</b></div>
          <div v-if="order.paymentTime" class="kv"><span>支付时间</span><b>{{ datetime(order.paymentTime) }}</b></div>
          <div v-if="order.consignTime" class="kv"><span>发货时间</span><b>{{ datetime(order.consignTime) }}</b></div>
          <div v-if="order.closeTime" class="kv"><span>关闭时间</span><b>{{ datetime(order.closeTime) }}</b></div>
        </section>
      </template>

      <el-empty v-else description="订单不存在" />
    </div>
  </main>

  <el-dialog v-model="refundVisible" title="申请退款" width="460px" :close-on-click-modal="false" align-center>
    <div class="refund-dialog">
      <p class="refund-dialog__tip">
        将整单退款 <b>¥{{ money(order?.payment) }}</b>，提交后需商家审核，审核通过后原路退回。
      </p>
      <el-form label-width="76px" label-position="left">
        <el-form-item label="退款原因">
          <el-select v-model="reasonType" placeholder="请选择退款原因" style="width: 100%">
            <el-option v-for="r in REASONS" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
        <el-form-item label="补充说明">
          <el-input
            v-model="reasonExtra"
            type="textarea"
            :rows="3"
            maxlength="120"
            show-word-limit
            placeholder="选填，便于商家了解情况"
          />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="refundVisible = false">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="submitRefund">提交申请</el-button>
    </template>
  </el-dialog>

  <AppFooter />
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import { applyRefund, findOrder, findRefundByOrderId } from '@/api'
import { ORDER_STATUS, REFUND_STATUS, type Orders, type Refund } from '@/api/types'

const route = useRoute()
const order = ref<Orders | null>(null)
const refund = ref<Refund | null>(null)
const loading = ref(true)

/* ---------------- 退款 ---------------- */
const refundVisible = ref(false)
const submitting = ref(false)
const reasonType = ref('不想要了')
const reasonExtra = ref('')
const REASONS = ['不想要了', '拍错了 / 信息填写错误', '商家迟迟未发货', '商品缺货', '价格变动', '其他原因']

/** 订单 2 已付款 / 3 待发货 且没有审核中的退款单时，可以申请 */
const canApplyRefund = computed(() => {
  const s = order.value?.status
  if (s !== 2 && s !== 3) return false
  const rs = refund.value?.status
  return !refund.value || rs === 3 || rs === 4
})

const refundStatusText = (s?: number) => REFUND_STATUS[s ?? -1] || '未知'

const money = (v?: number) => Number(v ?? 0).toFixed(2)
// 后端返回 UTC 的 ISO 时间串，转成本地时区显示（含秒），避免差 8 小时
const datetime = (v?: string) => {
  if (!v) return '-'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return String(v).replace('T', ' ').slice(0, 19)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`
}
const statusText = (s?: number) => ORDER_STATUS[s ?? 0] || '未知'

const statusIcon = computed(() => {
  switch (order.value?.status) {
    case 1: return 'Wallet'
    case 2:
    case 3: return 'Box'
    case 4: return 'Van'
    case 5: return 'CircleCheck'
    default: return 'Document'
  }
})

const statusHint = computed(() => {
  switch (order.value?.status) {
    case 1: return '请在 30 分钟内完成支付，超时订单会自动关闭'
    case 2: return '支付成功，商家正在备货'
    case 3: return '商家已接单，正在打包'
    case 4: return '商品已发出，注意查收'
    case 5: return '交易已完成，感谢你的支持'
    case 6: return '订单已关闭，如有需要可重新下单'
    case 8: return '退款处理中，请耐心等待'
    case 9: return '退款已完成'
    default: return ''
  }
})

onMounted(async () => {
  try {
    await load()
    // 从订单列表「申请退款」跳过来时直接打开弹窗
    if (route.query.refund === '1' && canApplyRefund.value) openRefund()
  } finally {
    loading.value = false
  }
})

async function load() {
  const id = String(route.params.id)
  const [o, r] = await Promise.all([
    findOrder(id),
    findRefundByOrderId(id).catch(() => null)
  ])
  order.value = o
  refund.value = r
}

function openRefund() {
  reasonType.value = '不想要了'
  reasonExtra.value = ''
  refundVisible.value = true
}

async function submitRefund() {
  if (!order.value?.id) return
  const reason = [reasonType.value, reasonExtra.value.trim()].filter(Boolean).join('：')
  submitting.value = true
  try {
    await applyRefund(order.value.id, reason)
    ElMessage.success('退款申请已提交，等待商家审核')
    refundVisible.value = false
    await load()
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.crumb { display: flex; align-items: center; gap: 6px; color: var(--muted); font-size: 12.5px; margin-bottom: 16px; }
.status-card {
  display: flex; align-items: center; gap: 18px; padding: 24px; margin-bottom: 16px;
  background: linear-gradient(120deg, #fff8f5, #fffdfb);
}
.status-card__icon {
  width: 56px; height: 56px; border-radius: 16px; display: grid; place-items: center;
  background: var(--brand-soft); color: var(--brand);
}
.status-card__text { flex: 1; }
.status-card h2 { margin: 0 0 4px; font-size: 19px; }
.block { padding: 20px 22px; margin-bottom: 16px; }
.block h3 { font-size: 15px; margin: 0 0 14px; }
.kv { display: flex; gap: 16px; padding: 7px 0; font-size: 13.5px; color: var(--ink-2); }
.kv span { width: 82px; color: var(--muted); flex-shrink: 0; }
.kv b { font-weight: 500; color: var(--ink); word-break: break-all; }
.mono { font-family: var(--mono); font-size: 12.5px; }
.line { display: flex; align-items: center; gap: 14px; padding: 10px 0; border-bottom: 1px dashed var(--line); }
.line img { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; background: #f4efe9; cursor: pointer; }
.line__info { flex: 1; }
.line__info p { margin: 0 0 4px; font-size: 13.5px; }
.total-line { display: flex; justify-content: space-between; align-items: baseline; padding-top: 14px; font-size: 13.5px; }
.price { font-size: 20px; color: var(--brand); }

.ghost-btn { border-color: var(--line); color: var(--ink-2); background: #fff; }
.ghost-btn:hover { border-color: var(--brand); color: var(--brand); background: #fff; }

.refund-state { font-weight: 600; }
.refund-state--0 { color: #b26a00; }
.refund-state--1 { color: #b26a00; }
.refund-state--2 { color: #1a7f37; }
.refund-state--3,
.refund-state--4 { color: #c0392b; }

.refund-tip {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  background: #fff7f2;
  color: var(--ink-2);
  font-size: 12.5px;
  line-height: 1.6;
}

.refund-dialog__tip {
  margin: 0 0 16px;
  font-size: 13px;
  color: var(--ink-2);
  line-height: 1.7;
}
.refund-dialog__tip b { color: var(--brand); }
</style>