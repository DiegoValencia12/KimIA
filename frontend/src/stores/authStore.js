import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  login as loginService,
  logout as logoutService,
  verifySession
} from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const idToken = ref(localStorage.getItem('idToken') || null)
  const isAuthenticated = ref(false)
  const isCheckingSession = ref(false)
  const isSessionChecked = ref(false)

  function saveSession(data) {
    user.value = data.user
    idToken.value = data.tokens.idToken
    isAuthenticated.value = true

    localStorage.setItem('user', JSON.stringify(data.user))
    localStorage.setItem('idToken', data.tokens.idToken)
  }

  function clearSession() {
    user.value = null
    idToken.value = null
    isAuthenticated.value = false

    localStorage.removeItem('user')
    localStorage.removeItem('idToken')
  }

  async function login(credentials) {
    const data = await loginService(credentials)
    saveSession(data)
    isSessionChecked.value = true
    return data
  }

  async function checkSession() {
    if (isSessionChecked.value) {
      return isAuthenticated.value
    }

    isCheckingSession.value = true

    try {
      if (!idToken.value) {
        clearSession()
        return false
      }

      const response = await verifySession(idToken.value)

      user.value = {
        ...user.value,
        ...response.user
      }

      localStorage.setItem('user', JSON.stringify(user.value))
      isAuthenticated.value = true

      return true
    } catch {
      clearSession()
      return false
    } finally {
      isSessionChecked.value = true
      isCheckingSession.value = false
    }
  }

  async function logout() {
    const token = idToken.value

    clearSession()
    isSessionChecked.value = true

    if (token) {
      try {
        await logoutService(token)
      } catch {
      }
    }
  }

  return {
    user,
    idToken,
    isAuthenticated,
    isCheckingSession,
    isSessionChecked,
    login,
    logout,
    checkSession,
    clearSession
  }
})