import axios, { type AxiosRequestConfig } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const TOKEN_KEY = 'mall:token'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY) || '',
  set: (t: string) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY)
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api',
  timeout: 30000
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

http.interceptors.response.use(
  (res) => {
    const body = res.data
    // 后端业务错误同样是 HTTP 200，必须看 code
    if (body && typeof body === 'object' && 'code' in body) {
      if (body.code === 200) return body.data
      if (body.code === 401) {
        tokenStorage.clear()
        const current = router.currentRoute.value
        if (current.name !== 'login') {
          router.push({ name: 'login', query: { redirect: current.fullPath } })
        }
      }
      ElMessage.error(body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return body
  },
  (error) => {
    const status = error.response?.status
    const body = error.response?.data
    if (status === 401) {
      tokenStorage.clear()
      const current = router.currentRoute.value
      if (current.name !== 'login') {
        router.push({ name: 'login', query: { redirect: current.fullPath } })
      }
    }
    ElMessage.error(body?.message || error.message || '网络异常，请稍后重试')
    return Promise.reject(error)
  }
)

export const get = <T = any>(url: string, params?: Record<string, any>, config?: AxiosRequestConfig) =>
  http.get<any, T>(url, { params, ...config })

export const post = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  http.post<any, T>(url, data, config)

export const put = <T = any>(url: string, data?: any, config?: AxiosRequestConfig) =>
  http.put<any, T>(url, data, config)

export const del = <T = any>(url: string, params?: Record<string, any>) =>
  http.delete<any, T>(url, { params })

/** 后端用 @RequestParam 接收时，必须发 form-urlencoded */
export const form = (obj: Record<string, any>) => {
  const usp = new URLSearchParams()
  Object.entries(obj).forEach(([k, v]) => {
    if (v !== undefined && v !== null) usp.append(k, String(v))
  })
  return usp
}

export const formConfig = { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }

export default http