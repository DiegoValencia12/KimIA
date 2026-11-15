
<template>
  <div class="user-menu">
    <button
      class="profile-trigger"
      type="button"
      aria-label="Menú de usuario"
      :aria-expanded="menuOpen"
      @click="menuOpen = !menuOpen"
    >
      <span class="user-name">{{ userName }}</span>

      <svg
        class="chevron"
        :class="{ rotated: menuOpen }"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="m7 10 5 5 5-5" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Transition name="dropdown">
      <div v-if="menuOpen" class="dropdown-menu">
        <div class="user-info">
          <strong>{{ userName }}</strong>
          <span>{{ authStore.user?.email }}</span>
        </div>

        <div class="menu-divider"></div>

        <button
          type="button"
          class="menu-item"
          @click="handleSettings"
        >
          Configuración
        </button>

        <button
          type="button"
          class="menu-item logout"
          :disabled="loggingOut"
          @click="handleLogout"
        >
          {{ loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión' }}
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationStore } from '@/stores/notificationStore'

const router = useRouter()
const authStore = useAuthStore()
const notifications = useNotificationStore()

const menuOpen = ref(false)
const loggingOut = ref(false)

const userName = computed(() => {
  return authStore.user?.displayName || 'Usuario'
})

function handleSettings() {
  menuOpen.value = false
  console.log('....')
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
  display: flex;
  align-items: center;
}

.profile-trigger {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #E4E4E7;
  cursor: pointer;
  transition: background 0.2s ease;
}

.profile-trigger:hover,
.profile-trigger[aria-expanded="true"] {
  background: #202024;
}

.user-name {
  max-width: 180px;
  overflow: hidden;
  font-size: 13px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron {
  width: 15px;
  height: 15px;
  color: #A1A1AA;
  transition: transform 0.2s ease;
}

.chevron.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 200;
  width: 245px;
  padding: 9px;
  border: 1px solid #303036;
  border-radius: 12px;
  background: #18181B;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px 10px;
  min-width: 0;
}

.user-info strong {
  overflow: hidden;
  color: #FAFAFA;
  font-size: 13px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info span {
  overflow: hidden;
  color: #A1A1AA;
  font-size: 11px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.menu-divider {
  height: 1px;
  margin: 5px 0;
  background: #303036;
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
  transition: background 0.2s ease;
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
  transform: translateY(-7px);
}

@media (max-width: 640px) {
  .user-name {
    max-width: 120px;
    font-size: 12px;
  }
}
</style>
