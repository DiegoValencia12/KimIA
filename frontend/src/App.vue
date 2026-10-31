
<template>
  <router-view />

  <TransitionGroup name="notification" tag="div" class="notification-container">
    <Notification
      v-for="item in notificationStore.notifications"
      :key="item.id"
      :type="item.type"
      :title="item.title"
      :message="item.message"
      :duration="item.duration"
      @close="notificationStore.removeNotification(item.id)"
    />
  </TransitionGroup>
</template>

<script setup>
import Notification from '@/components/Notification.vue'
import { useNotificationStore } from '@/stores/notificationStore'

const notificationStore = useNotificationStore()
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #09090b;
  color: #fafafa;
}

.notification-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 99999;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  pointer-events: none;
}

.notification-container > * {
  pointer-events: auto;
}

.notification-enter-active,
.notification-leave-active,
.notification-move {
  transition: all 0.35s ease;
}

.notification-enter-from,
.notification-leave-to {
  opacity: 0;
  transform: translateX(110%);
}

.notification-leave-active {
  position: absolute;
}

@media (max-width: 480px) {
  .notification-container {
    top: 16px;
    right: 16px;
  }
}
</style>
