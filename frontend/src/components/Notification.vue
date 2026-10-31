
<template>
  <div class="notification" :class="type" role="alert">
    <div class="notification-icon">
      <svg v-if="type === 'success'" viewBox="0 0 24 24">
        <path d="M5 12.5 10 17l9-10" />
      </svg>
      <svg v-else-if="type === 'error'" viewBox="0 0 24 24">
        <path d="m7 7 10 10M17 7 7 17" />
      </svg>
      <svg v-else-if="type === 'warning'" viewBox="0 0 24 24">
        <path d="M12 3 2.8 20h18.4L12 3Z" />
        <path d="M12 9v5m0 3h.01" />
      </svg>
      <svg v-else viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </svg>
    </div>

    <div class="notification-content">
      <strong>{{ title }}</strong>
      <p>{{ message }}</p>
    </div>

    <button
      class="close-button"
      type="button"
      aria-label="Cerrar notificación"
      @click="$emit('close')"
    >
      ×
    </button>

    <div
      class="notification-progress"
      :style="{ animationDuration: `${duration}ms` }"
    ></div>
  </div>
</template>

<script setup>
defineProps({
  type: {
    type: String,
    default: 'info'
  },
  title: {
    type: String,
    default: 'Información'
  },
  message: {
    type: String,
    default: ''
  },
  duration: {
    type: Number,
    default: 3500
  }
})

defineEmits(['close'])
</script>

<style scoped>
.notification {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
  width: min(380px, calc(100vw - 32px));
  min-height: 76px;
  padding: 16px 40px 16px 16px;
  overflow: hidden;
  border: 1px solid;
  border-radius: 12px;
  background: #18181b;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.35);
}

.notification-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
}

.notification-icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.notification-content {
  min-width: 0;
}

.notification-content strong {
  display: block;
  margin-bottom: 4px;
  color: #fafafa;
  font-size: 14px;
}

.notification-content p {
  color: #d4d4d8;
  font-size: 12px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.close-button {
  position: absolute;
  top: 9px;
  right: 12px;
  border: none;
  background: transparent;
  color: #a1a1aa;
  font-size: 22px;
  cursor: pointer;
}

.success {
  border-color: #166534;
}
.success .notification-icon {
  color: #4ade80;
  background: #14532d;
}

.error {
  border-color: #991b1b;
}
.error .notification-icon {
  color: #f87171;
  background: #7f1d1d;
}

.warning {
  border-color: #a16207;
}
.warning .notification-icon {
  color: #facc15;
  background: #713f12;
}

.info {
  border-color: #1d4ed8;
}
.info .notification-icon {
  color: #60a5fa;
  background: #1e3a8a;
}

.notification-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: currentColor;
  transform-origin: left;
  animation: progress linear forwards;
}

.success .notification-progress { color: #4ade80; }
.error .notification-progress { color: #f87171; }
.warning .notification-progress { color: #facc15; }
.info .notification-progress { color: #60a5fa; }

@keyframes progress {
  from { transform: scaleX(1); }
  to { transform: scaleX(0); }
}
</style>
