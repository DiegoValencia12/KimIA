import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import DashboardView from '@/views/DashboardView.vue'
import AuthView from '@/views/AuthView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),

  routes: [
    {
      path: '/auth',
      name: 'auth',
      component: AuthView,
      meta: { guestOnly: true }
    },
    {
      path: '/',
      name: 'dashboard',
      component: DashboardView,
      meta: { requiresAuth: true }
    },
    {
      path: '/c/:chatId',
      name: 'chat',
      component: DashboardView,
      props: true,
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  if (!authStore.isSessionChecked) {
    await authStore.checkSession()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'auth' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'dashboard' }
  }

  return true
})

export default router