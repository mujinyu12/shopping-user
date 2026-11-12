<template>
  <AppHeader />

  <main class="page">
    <div class="container narrow">
      <div class="section-head">
        <div>
          <h2>收货地址</h2>
          <p class="sub">最多保存 10 个常用地址</p>
        </div>
        <el-button type="primary" round :icon="Plus" @click="openCreate">新增地址</el-button>
      </div>

      <el-skeleton v-if="loading" :rows="3" animated />

      <div v-else-if="list.length" class="cards">
        <article v-for="a in list" :key="a.id" class="card addr">
          <div class="addr__head">
            <b>{{ a.contact }}</b>
            <span class="muted">{{ a.mobile }}</span>
          </div>
          <p>{{ a.provinceName }}{{ a.cityName }}{{ a.areaName }}</p>
          <p class="detail">{{ a.address }}</p>
          <div class="addr__actions">
            <el-button text size="small" @click="openEdit(a)">编辑</el-button>
            <el-button text size="small" class="danger" @click="remove(a)">删除</el-button>
          </div>
        </article>

        <button class="card add" @click="openCreate">
          <el-icon :size="22"><Plus /></el-icon>
          <span>新增收货地址</span>
        </button>
      </div>

      <el-empty v-else description="还没有收货地址">
        <el-button round @click="openCreate">添加第一个地址</el-button>
      </el-empty>

      <div v-if="fromCheckout" class="back">
        <el-button text @click="$router.push({ name: 'checkout' })">
          <el-icon><ArrowLeft /></el-icon> 返回结算
        </el-button>
      </div>
    </div>

    <el-dialog v-model="visible" :title="form.id ? '编辑地址' : '新增地址'" width="520px" destroy-on-close>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="84px">
        <el-form-item label="收货人" prop="contact">
          <el-input v-model="form.contact" maxlength="20" placeholder="请填写收货人姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" maxlength="11" placeholder="请填写手机号" />
        </el-form-item>
        <el-form-item label="所在地区" prop="provinceName">
          <div class="region">
            <el-select v-model="form.provinceName" placeholder="省份" @change="onProvince">
              <el-option v-for="p in provinces" :key="p.id" :label="p.provinceName" :value="p.provinceName" />
            </el-select>
            <el-select v-model="form.cityName" placeholder="城市" :disabled="!cities.length" @change="onCity">
              <el-option v-for="c in cities" :key="c.id" :label="c.city" :value="c.city" />
            </el-select>
            <el-select v-model="form.areaName" placeholder="区/县" :disabled="!areas.length">
              <el-option v-for="a in areas" :key="a.id" :label="a.area" :value="a.area" />
            </el-select>
          </div>
        </el-form-item>
        <el-form-item label="详细地址" prop="address">
          <el-input v-model="form.address" type="textarea" :rows="2" maxlength="120" show-word-limit placeholder="街道、门牌号、楼层等" />
        </el-form-item>
        <el-form-item label="邮编">
          <el-input v-model="form.zipCode" maxlength="6" placeholder="选填" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </main>

  <AppFooter />
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import AppHeader from '@/components/AppHeader.vue'
import AppFooter from '@/components/AppFooter.vue'
import {
  addAddress,
  deleteAddress,
  findAddresses,
  findAreas,
  findCities,
  findProvinces,
  updateAddress
} from '@/api'
import type { Address, Area, City, Province } from '@/api/types'

const route = useRoute()
const fromCheckout = route.query.from === 'checkout'

const list = ref<Address[]>([])
const provinces = ref<Province[]>([])
const cities = ref<City[]>([])
const areas = ref<Area[]>([])
const loading = ref(true)
const visible = ref(false)
const saving = ref(false)
const formRef = ref<FormInstance>()

const blank = (): Address => ({
  contact: '',
  mobile: '',
  provinceName: '',
  cityName: '',
  areaName: '',
  address: '',
  zipCode: ''
})
const form = reactive<Address>(blank())

const rules: FormRules = {
  contact: [{ required: true, message: '请填写收货人', trigger: 'blur' }],
  mobile: [
    { required: true, message: '请填写手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  provinceName: [{ required: true, message: '请选择所在地区', trigger: 'change' }],
  address: [
    { required: true, message: '请填写详细地址', trigger: 'blur' },
    { min: 5, message: '详细地址至少 5 个字', trigger: 'blur' }
  ]
}

async function load() {
  loading.value = true
  try {
    list.value = (await findAddresses()) || []
  } finally {
    loading.value = false
  }
}

function reset(a?: Address) {
  Object.assign(form, blank(), a || {})
  cities.value = []
  areas.value = []
}

async function openCreate() {
  reset()
  visible.value = true
  if (!provinces.value.length) provinces.value = (await findProvinces()) || []
}

async function openEdit(a: Address) {
  reset(a)
  visible.value = true
  if (!provinces.value.length) provinces.value = (await findProvinces()) || []
  const p = provinces.value.find((x) => x.provinceName === a.provinceName)
  if (p) {
    cities.value = (await findCities(p.id)) || []
    const c = cities.value.find((x) => x.city === a.cityName)
    if (c) areas.value = (await findAreas(c.id)) || []
  }
}

async function onProvince(name: string) {
  form.cityName = ''
  form.areaName = ''
  areas.value = []
  const p = provinces.value.find((x) => x.provinceName === name)
  cities.value = p ? (await findCities(p.id)) || [] : []
}

async function onCity(name: string) {
  form.areaName = ''
  const c = cities.value.find((x) => x.city === name)
  areas.value = c ? (await findAreas(c.id)) || [] : []
}

async function save() {
  if (!(await formRef.value?.validate().catch(() => false))) return
  if (!form.areaName) return ElMessage.warning('请选择区/县')
  saving.value = true
  try {
    if (form.id) await updateAddress(form)
    else await addAddress(form)
    ElMessage.success('地址已保存')
    visible.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function remove(a: Address) {
  await ElMessageBox.confirm(`确定删除「${a.contact} ${a.mobile}」这条地址吗？`, '删除地址', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  })
  await deleteAddress(a.id!)
  ElMessage.success('已删除')
  await load()
}

onMounted(load)
</script>

<style scoped>
.narrow { max-width: 900px; }
.section-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px; }
.addr { padding: 18px; }
.addr__head { display: flex; gap: 10px; align-items: baseline; margin-bottom: 8px; font-size: 14px; }
.addr p { margin: 0 0 4px; color: var(--ink-2); font-size: 13px; line-height: 1.6; }
.addr .detail { color: var(--muted); }
.addr__actions { display: flex; justify-content: flex-end; gap: 4px; margin-top: 12px; border-top: 1px dashed var(--line); padding-top: 8px; }
.danger { color: #d14343; }
.add {
  min-height: 150px; display: grid; place-items: center; gap: 8px; cursor: pointer;
  border: 1.5px dashed #e3d8cd; background: #fffdfb; color: var(--muted);
  &:hover { border-color: var(--brand); color: var(--brand); }
}
.region { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; width: 100%; }
.back { margin-top: 20px; }
</style>