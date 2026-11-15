
<template>
  <aside
    class="menu-bar"
    :class="{ collapsed: sidebarCollapsed }"
  >
    <div class="sidebar-header">
      <span v-if="!sidebarCollapsed" class="brand-name">KimIA</span>

      <button
        class="sidebar-toggle"
        type="button"
        :aria-label="sidebarCollapsed ? 'Expandir panel' : 'Contraer panel'"
        :title="sidebarCollapsed ? 'Expandir panel' : 'Contraer panel'"
        @click="sidebarCollapsed = !sidebarCollapsed"
      >
        <span>{{ sidebarCollapsed ? '›' : '‹' }}</span>
      </button>
    </div>

    <div class="sidebar-divider"></div>

    <div class="menu-content">
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
            :class="{ active: chat._id === activeChatId }"
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
    </div>
  </aside>
</template>

<script setup>
import { ref } from 'vue'
import { useConfirmationStore } from '@/stores/confirmationStore'

const confirmation = useConfirmationStore()

const props = defineProps({
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
const sidebarCollapsed = ref(false)

const confirmDelete = async (chat) => {
  const title = chat.title || 'Nuevo chat'

  const confirmed = await confirmation.confirm({
    title: 'Eliminar conversación',
    message: `¿Eliminar la conversación "${title}"? Esta acción no se puede deshacer.`
  })

  if (!confirmed) return

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
  position: relative;
  display: flex;
  flex: 0 0 285px;
  flex-direction: column;
  width: 285px;
  height: 100%;
  min-height: 0;
  min-width: 0;
  box-sizing: border-box;
  padding: 16px 14px;
  overflow-x: hidden;
  overflow-y: auto;
  background: #111113;
  border-right: 1px solid #27272A;
  scrollbar-width: thin;
  scrollbar-color: #3F3F46 transparent;
  transition:
    width 0.3s ease,
    flex-basis 0.3s ease,
    padding 0.3s ease;
}

.menu-bar.collapsed {
  flex-basis: 64px;
  width: 64px;
  padding: 16px 10px;
}

.sidebar-header {
  display: flex;
  flex: 0 0 42px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
}

.brand-name {
  color: #FAFAFA;
  font-size: 19px;
  font-weight: 650;
  letter-spacing: -0.5px;
}

.sidebar-toggle {
  display: flex;
  flex: 0 0 32px;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: #A1A1AA;
  font-family: inherit;
  font-size: 23px;
  line-height: 1;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.sidebar-toggle:hover {
  background: #27272A;
  color: #FAFAFA;
}

.menu-bar.collapsed .sidebar-header {
  justify-content: center;
}

.sidebar-divider {
  flex: 0 0 1px;
  width: 100%;
  margin: 12px 0 18px;
  background: #27272A;
}

.menu-content {
  width: 100%;
  min-width: 0;
  opacity: 1;
  transition: opacity 0.15s ease;
}

.menu-bar.collapsed .menu-content {
  opacity: 0;
  pointer-events: none;
}

.new-question {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 42px;
  padding: 0 12px;
  border: 1px solid #303036;
  border-radius: 7px;
  background: #18181B;
  color: #E4E4E7;
  font-family: inherit;
  font-size: 12px;
  font-weight: 550;
  white-space: nowrap;
  cursor: pointer;
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
}

.new-question:hover {
  background: #222226;
  border-color: #414149;
}

.new-question-icon {
  color: #A5A5F5;
  font-size: 19px;
  line-height: 1;
}

.section {
  margin-top: 20px;
}

.history-button {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  height: 36px;
  padding: 0 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  color: #A1A1AA;
  font-family: inherit;
  font-size: 12px;
  font-weight: 550;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.history-button:hover {
  background: #1C1C20;
  color: #E4E4E7;
}

.history-arrow {
  width: 12px;
  color: #71717A;
  font-size: 12px;
  transition: transform 0.2s ease;
}

.history-arrow.open {
  transform: rotate(90deg);
}

.history-count {
  margin-left: auto;
  color: #71717A;
  font-size: 11px;
}

.history-list {
  margin-top: 5px;
  margin-left: 6px;
  padding-left: 9px;
  border-left: 1px solid #2D2D35;
}

.history-message {
  padding: 9px;
  color: #71717A;
  font-size: 11px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.history-error {
  color: #F87171;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 3px;
  width: 100%;
  margin-bottom: 2px;
  padding: 2px;
  box-sizing: border-box;
  border-radius: 6px;
  background: transparent;
  transition: background 0.18s ease;
}

.history-item:hover {
  background: #1C1C20;
}

.history-item.active {
  background: #27272A;
}

.history-select {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  min-width: 0;
  gap: 4px;
  padding: 7px;
  border: 0;
  border-radius: 5px;
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
  font-size: 11px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-preview {
  display: block;
  width: 100%;
  overflow: hidden;
  color: #62626D;
  font-size: 10px;
  line-height: 1.4;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item:hover .history-title,
.history-item.active .history-title {
  color: #E4E4E7;
}

.history-item:hover .history-preview,
.history-item.active .history-preview {
  color: #A1A1AA;
}

.delete-chat-button {
  display: flex;
  flex: 0 0 24px;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: #71717A;
  font-family: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  opacity: 0;
  transition:
    opacity 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
}

.history-item:hover .delete-chat-button,
.history-item.active .delete-chat-button,
.delete-chat-button:focus-visible {
  opacity: 1;
}

.delete-chat-button:hover {
  background: rgba(248, 113, 113, 0.1);
  color: #F87171;
}

.delete-chat-button:focus-visible {
  outline: 1px solid #818CF8;
  outline-offset: 1px;
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

@media (hover: none) {
  .delete-chat-button {
    opacity: 1;
  }
}

@media (max-width: 640px) {
  .menu-bar {
    flex-basis: 250px;
    width: 250px;
  }

  .menu-bar.collapsed {
    flex-basis: 58px;
    width: 58px;
  }

  .delete-chat-button {
    opacity: 1;
  }
}
</style>
