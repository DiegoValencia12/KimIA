
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([])
  const timers = new Map()
  let nextId = 1

  function showNotification({
    type = 'info',
    title = 'Información',
    message = '',
    duration = 3500
  }) {
    const id = nextId++

    notifications.value.push({
      id,
      type,
      title,
      message,
      duration
    })

    const timer = setTimeout(() => {
      removeNotification(id)
    }, duration)

    timers.set(id, timer)

    return id
  }

  function removeNotification(id) {
    clearTimeout(timers.get(id))
    timers.delete(id)

    notifications.value = notifications.value.filter(
      notification => notification.id !== id
    )
  }

  function success(message, title = 'Éxito') {
    return showNotification({ type: 'success', title, message })
  }

  function error(message, title = 'Error') {
    return showNotification({ type: 'error', title, message })
  }

  function warning(message, title = 'Advertencia') {
    return showNotification({ type: 'warning', title, message })
  }

  function info(message, title = 'Información') {
    return showNotification({ type: 'info', title, message })
  }

  return {
    notifications,
    showNotification,
    removeNotification,
    success,
    error,
    warning,
    info
  }
})
