import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginRequest, SignupRequest } from '../api/auth'
import { login as apiLogin, signup as apiSignup } from '../api/auth'

const STORAGE_KEY = 'petify.auth.token'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem(STORAGE_KEY) ?? '')

  const isAuthenticated = computed(() => !!token.value)

  function setToken(next: string) {
    token.value = next
    if (next) localStorage.setItem(STORAGE_KEY, next)
    else localStorage.removeItem(STORAGE_KEY)
  }

  async function login(payload: LoginRequest) {
    const result = await apiLogin(payload)
    setToken(result.token)
  }

  async function signup(payload: SignupRequest): Promise<{ tokenReturned: boolean }> {
    const result = await apiSignup(payload)
    if (result.token) {
      setToken(result.token)
      return { tokenReturned: true }
    }
    return { tokenReturned: false }
  }

  function logout() {
    setToken('')
  }

  return {
    token,
    isAuthenticated,
    login,
    signup,
    logout,
  }
})
