
<template>
  <div class="user-menu">
    <button
      class="user-button"
      type="button"
      aria-label="Menú de usuario"
      @click="menuOpen = !menuOpen"
    >
      <img src="/icons/user.svg" alt="" />
    </button>

    <Transition name="dropdown">
      <div v-if="menuOpen" class="dropdown-menu">
        <div class="user-info">
          <div class="user-avatar">
            <img src="/icons/user.svg" alt="" />
          </div>

          <div class="user-details">
            <strong>{{ authStore.user?.displayName || 'Usuario' }}</strong>
            <span>{{ authStore.user?.email }}</span>
          </div>
        </div>

        <div class="menu-divider"></div>

        <button
          type="button"
          class="menu-item"
          @click="handleSettings"
        >
          <span>Configuración</span>
        </button>

        <button
          type="button"
          class="menu-item logout"
          :disabled="loggingOut"
          @click="handleLogout"
        >
          <span>{{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationStore()

const menuOpen = ref(false)
const loggingOut = ref(false)

function handleSettings() {
  menuOpen.value = false
  console.log('....');
}

async function handleLogout() {
  if (loggingOut.value) return

  loggingOut.value = true
  menuOpen.value = false

  try {
    await authStore.logout()
    notifications.success('Sesión cerrada correctamente.')
    await router.push({ name: 'auth' })
  } finally {
    loggingOut.value = false
  }
}
</script>

<style scoped>
.user-menu {
  position: relative;
}

.user-button {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #27272A;
  border-radius: 50%;
  background: #18181B;
  cursor: pointer;
}

.user-button img {
  width: 19px;
  height: 19px;
  opacity: 0.7;
}

.user-button:hover {
  border-color: #6366F1;
  background: #27272A;
}

.dropdown-menu {
  position: absolute;
  top: 52px;
  right: 0;
  width: 250px;
  padding: 10px;
  border: 1px solid #27272A;
  border-radius: 12px;
  background: #18181B;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
  z-index: 200;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
}

.user-avatar {
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #27272A;
}

.user-avatar img {
  width: 19px;
  height: 19px;
}

.user-details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.user-details strong {
  color: #FAFAFA;
  font-size: 13px;
}

.user-details span {
  color: #A1A1AA;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.menu-divider {
  height: 1px;
  margin: 7px 0;
  background: #27272A;
}

.menu-item {
  width: 100%;
  padding: 11px 10px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: #D4D4D8;
  text-align: left;
  font-size: 13px;
  cursor: pointer;
}

.menu-item:hover {
  background: #27272A;
  color: #FAFAFA;
}

.menu-item.logout {
  color: #F87171;
}

.menu-item.logout:hover {
  background: #3F1919;
}

.menu-item:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.18s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
