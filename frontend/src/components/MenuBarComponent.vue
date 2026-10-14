
<template>
  <aside class="menu-bar">
    <button
      class="new-question"
      type="button"
      @click="$emit('new-chat')"
    >
      <span class="new-question-icon">+</span>
      <span>Nueva pregunta</span>
    </button>

    <div class="section">
      <button
        class="history-button"
        type="button"
        @click="historyOpen = !historyOpen"
      >
        <span
          class="history-arrow"
          :class="{ open: historyOpen }"
        >
          ▸
        </span>

        <span>Historial</span>

        <span class="history-count">
          {{ chats.length }}
        </span>
      </button>

      <div v-if="historyOpen" class="history-list">
        <p v-if="loading" class="history-message">
          Cargando conversaciones...
        </p>

        <p v-else-if="error" class="history-message history-error">
          {{ error }}
        </p>

        <p v-else-if="chats.length === 0" class="history-message">
          Todavía no hay conversaciones.
        </p>

        <button
          v-for="chat in chats"
          :key="chat._id"
          class="history-item"
          :class="{
            active: chat._id === activeChatId
          }"
          type="button"
          @click="$emit('select-chat', chat._id)"
        >
          <span class="history-title">
            {{ chat.title || 'Nuevo chat' }}
          </span>

          <span class="history-preview">
            {{ formatDate(chat.updatedAt) }}
          </span>
        </button>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  chats: {
    type: Array,
    default: () => []
  },

  activeChatId: {
    type: String,
    default: ''
  },

  loading: {
    type: Boolean,
    default: false
  },

  error: {
    type: String,
    default: ''
  }
})

defineEmits([
  'new-chat',
  'select-chat'
])

const historyOpen = ref(true)

const formatDate = (date) => {
  if (!date) return 'Conversación guardada'

  const parsedDate = new Date(date)

  if (Number.isNaN(parsedDate.getTime())) {
    return 'Conversación guardada'
  }

  return parsedDate.toLocaleString('es-MX', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.menu-bar {
  position: fixed;
  top: 80px;
  left: 20px;
  width: 285px;
  max-height: calc(100vh - 100px);
  padding: 12px;
  box-sizing: border-box;
  background: #111113;
  border: 1px solid #27272A;
  border-radius: 10px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4);
  overflow-y: auto;
  z-index: 100;
}

.new-question {
  width: 100%;
  height: 44px;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 0 14px;
  border: 1px solid #27272A;
  border-radius: 8px;
  background: #18181B;
  color: #FAFAFA;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.new-question:hover {
  background: #27272A;
  border-color: #3F3F46;
}

.new-question-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #818CF8;
  font-size: 20px;
  font-weight: 400;
  line-height: 1;
}

.section {
  margin-top: 14px;
}

.history-button {
  width: 100%;
  height: 38px;
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 0 10px;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #A1A1AA;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.history-button:hover {
  background: #18181B;
  color: #FAFAFA;
}

.history-arrow {
  width: 14px;
  color: #71717A;
  font-size: 13px;
  transition: transform 0.2s ease;
}

.history-arrow.open {
  transform: rotate(90deg);
}

.history-count {
  margin-left: auto;
  color: #52525B;
  font-size: 11px;
  font-weight: 400;
}

.history-list {
  margin-top: 5px;
  padding-left: 23px;
  border-left: 1px solid #27272A;
}

.history-message {
  padding: 10px;
  color: #71717A;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.history-error {
  color: #F87171;
}

.history-item {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 9px 10px;
  box-sizing: border-box;
  border: 0;
  border-radius: 7px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease;
}

.history-item:hover {
  background: #18181B;
}

.history-item.active {
  background: #27272A;
}

.history-title {
  width: 100%;
  overflow: hidden;
  color: #A1A1AA;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-preview {
  width: 100%;
  overflow: hidden;
  color: #52525B;
  font-size: 11px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item:hover .history-title,
.history-item.active .history-title {
  color: #FAFAFA;
}

.history-item:hover .history-preview,
.history-item.active .history-preview {
  color: #A1A1AA;
}
</style>
