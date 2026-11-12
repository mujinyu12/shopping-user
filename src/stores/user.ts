import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { getUsername, loginByPassword, type RegisterPayload } from '@/api'
import { tokenStorage } from '@/api/request'
import { register as registerApi } from '@/api'

export const useUserStore = defineStore('user', () => {
  const token = ref(tokenStorage.get())
  const username = ref('')
  const loaded = ref(false)

  const isLogin = computed(() => !!token.value)

  function setToken(t: string) {
    token.value = t
    tokenStorage.set(t)
  }

  async function login(name: string, password: string) {
    const t = await loginByPassword(name, password)
    setToken(t)
    await loadProfile()
    return t
  }

  async function register(payload: RegisterPayload, checkCode: string) {
    await registerApi(payload, checkCode)
  }

  async function loadProfile() {
    if (!token.value) {
      username.value = ''
      loaded.value = true
      return
    }
    try {
      username.value = await getUsername()
    } catch {
      username.value = ''
    }
    loaded.value = true
  }

  function logout() {
    token.value = ''
    username.value = ''
    tokenStorage.clear()
  }

  return { token, username, loaded, isLogin, setToken, login, register, loadProfile, logout }
})