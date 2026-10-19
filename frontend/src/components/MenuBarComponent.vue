
<template>
  <aside class="menu-bar">
    <button
      class="new-question"
      type="button"
      @click="emit('new-chat')"
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

        <p
          v-else-if="error"
          class="history-message history-error"
        >
          {{ error }}
        </p>

        <p
          v-else-if="chats.length === 0"
          class="history-message"
        >
          Todavía no hay conversaciones.
        </p>

        <div
          v-for="chat in chats"
          :key="chat._id"
          class="history-item"
          :class="{
            active: chat._id === activeChatId
          }"
        >
          <button
            class="history-select"
            type="button"
            @click="emit('select-chat', chat._id)"
          >
            <span class="history-title">
              {{ chat.title || 'Nuevo chat' }}
            </span>

            <span class="history-preview">
              {{ formatDate(chat.updatedAt) }}
            </span>
          </button>

          <button
            class="delete-chat-button"
            type="button"
            title="Eliminar conversación"
            aria-label="Eliminar conversación"
            @click.stop="confirmDelete(chat)"
          >
            ×
          </button>
        </div>
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

const emit = defineEmits([
  'new-chat',
  'select-chat',
  'delete-chat'
])

const historyOpen = ref(true)

const confirmDelete = (chat) => {
  const title = chat.title || 'Nuevo chat'

  if (
    !window.confirm(
      `¿Eliminar la conversación "${title}"?\n\nEsta acción no se puede deshacer.`
    )
  ) {
    return
  }

  emit('delete-chat', chat._id)
}

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

/* Nueva conversación */
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

/* Sección del historial */
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

/* Lista de conversaciones */
.history-list {
  margin-top: 5px;
  margin-left: 7px;
  padding-left: 10px;
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

/* Elemento individual del historial */
.history-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 3px 4px 3px 0;
  box-sizing: border-box;
  border-radius: 7px;
  background: transparent;
  transition: background 0.18s ease;
}

.history-item:hover {
  background: #18181B;
}

.history-item.active {
  background: #27272A;
}

/* Botón que abre la conversación */
.history-select {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
  padding: 7px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;
}

.history-title {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #A1A1AA;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-preview {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #52525B;
  font-size: 10px;
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

/* Botón pequeño para eliminar */
.delete-chat-button {
  flex: 0 0 24px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid transparent;
  border-radius: 5px;
  background: transparent;
  color: #71717A;
  font-family: inherit;
  font-size: 16px;
  font-weight: 400;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease,
    background 0.15s ease,
    border-color 0.15s ease;
}

/* Mostrar la X al pasar el cursor */
.history-item:hover .delete-chat-button,
.history-item.active .delete-chat-button,
.delete-chat-button:focus-visible {
  opacity: 1;
}

/* Estado de eliminación */
.delete-chat-button:hover {
  background: rgba(248, 113, 113, 0.12);
  border-color: rgba(248, 113, 113, 0.15);
  color: #F87171;
}

.delete-chat-button:focus-visible {
  outline: 1px solid #818CF8;
  outline-offset: 1px;
}

/* Accesibilidad para pantallas táctiles */
@media (hover: none) {
  .delete-chat-button {
    opacity: 1;
  }
}

/* Barra de desplazamiento discreta */
.menu-bar {
  scrollbar-width: thin;
  scrollbar-color: #3F3F46 transparent;
}

.menu-bar::-webkit-scrollbar {
  width: 5px;
}

.menu-bar::-webkit-scrollbar-track {
  background: transparent;
}

.menu-bar::-webkit-scrollbar-thumb {
  background: #3F3F46;
  border-radius: 10px;
}

.menu-bar::-webkit-scrollbar-thumb:hover {
  background: #52525B;
}
</style>
