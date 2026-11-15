
<template>
  <main class="dashboard">
    <MenuBarComponent
      :chats="chats"
      :active-chat-id="activeChatId"
      :loading="historyLoading"
      :error="historyError"
      @new-chat="handleNewChat"
      @select-chat="handleSelectChat"
      @delete-chat="handleDeleteChat"
    />

    <div class="dashboard-main">
      <header class="header">
        <UserMenuComponent />
      </header>

      <section
        class="dashboard-content"
        :class="{ 'conversation-mode': activeChatId }"
      >
        <div
          v-if="messages.length === 0 && !loading"
          class="welcome"
        >
          <h1>KIMIA</h1>

          <p>
            KIMIA combina inteligencia artificial, OCR y Web Scraping
            para buscar, procesar y analizar información pública,
            convirtiendo datos dispersos en respuestas claras y relevantes.
          </p>
        </div>

        <div
          v-else
          ref="conversationContainer"
          class="conversation"
        >
          <ChatMessage
            v-for="(message, index) in messages"
            :key="message._id || `${message.role}-${index}`"
            :message="message"
          />

          <div
            v-if="loading"
            class="typing-row"
            role="status"
            aria-label="KIMIA está escribiendo"
          >
            <div class="typing-avatar">
              K
            </div>

            <div class="typing-bubble">
              <span class="typing-label">
                KIMIA está escribiendo
              </span>

              <div class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        </div>

        <p v-if="pageError" class="page-error">
          {{ pageError }}
        </p>

        <div class="question-box">
          <textarea
            ref="questionInput"
            v-model="messageInput"
            placeholder="Pregunta lo que quieras a KIMIA..."
            rows="1"
            :disabled="loading || historyLoading"
            @input="adjustTextarea"
            @keydown.enter.exact.prevent="handleSendMessage"
          ></textarea>

          <button
            type="button"
            class="send-button"
            :disabled="
              loading ||
              historyLoading ||
              !messageInput.trim()
            "
            aria-label="Enviar mensaje"
            @click="handleSendMessage"
          >
            <img src="/icons/send.svg" alt="" />
          </button>
        </div>

        <p class="input-hint">
          Enter para enviar · Shift + Enter para salto de línea
        </p>
      </section>
    </div>
  </main>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
  nextTick,
} from 'vue'

import { useRoute, useRouter } from 'vue-router'

import MenuBarComponent from '@/components/MenuBarComponent.vue'
import UserMenuComponent from '@/components/UserMenuComponent.vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'

import { useChat } from '@/composables/useChat.js'
import { useChatHistory } from '@/composables/useChatHistory.js'

const route = useRoute()
const router = useRouter()

const messageInput = ref('')
const questionInput = ref(null)
const conversationContainer = ref(null)

const activeChatId = computed(() => {
  return route.params.chatId
    ? String(route.params.chatId)
    : null
})

const {
  chats,
  historyLoading,
  historyError,
  loadChats,
  removeChat,
} = useChatHistory()

const {
  messages,
  loading,
  error,
  loadChat,
  sendMessage,
  consumeSkipNextChatLoad,
  clearMessages,
} = useChat({
  router,
  refreshChats: loadChats,
})

const pageError = computed(() => {
  return error.value || historyError.value || ''
})

onMounted(() => {
  loadChats()
})

watch(
  activeChatId,
  async (chatId) => {
    if (consumeSkipNextChatLoad()) {
      return
    }

    if (!chatId) {
      clearMessages()
      return
    }

    await loadChat(chatId)

    await nextTick()
    scrollToBottom()
  },
  { immediate: true },
)

function adjustTextarea() {
  const textarea = questionInput.value

  if (!textarea) return

  textarea.style.height = 'auto'
  textarea.style.height = `${textarea.scrollHeight}px`
}

function scrollToBottom() {
  const container = conversationContainer.value

  if (!container) return

  container.scrollTop = container.scrollHeight
}

async function handleNewChat() {
  messageInput.value = ''

  clearMessages()

  await router.push({
    name: 'dashboard',
  })

  await nextTick()
  adjustTextarea()
}

async function handleSelectChat(chatId) {
  if (!chatId) return

  await router.push({
    name: 'chat',
    params: { chatId },
  })
}

async function handleDeleteChat(chatId) {
  const deleted = await removeChat(chatId)

  if (!deleted) return

  if (activeChatId.value === String(chatId)) {
    clearMessages()
    messageInput.value = ''

    await router.push({
      name: 'dashboard',
    })
  }
}

async function handleSendMessage() {
  const content = messageInput.value.trim()

  if (!content || loading.value || historyLoading.value) {
    return
  }

  messageInput.value = ''

  await nextTick()
  adjustTextarea()

  try {
    await sendMessage(content, activeChatId.value)

    await nextTick()
    scrollToBottom()
  } catch (err) {
    console.error('Error al enviar el mensaje:', err)
  }
}

watch(
  () => messages.value.length,
  async () => {
    await nextTick()
    scrollToBottom()
  },
)
</script>

<style scoped>
.dashboard {
  width: 100%;
  height: 100vh;
  min-height: 100vh;
  display: flex;
  overflow: hidden;
  background: #09090B;
  color: #FAFAFA;
  box-sizing: border-box;
}

.dashboard-main {
  flex: 1;
  width: 0;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  position: relative;
  z-index: 110;
  flex: 0 0 70px;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 30px;
  box-sizing: border-box;
  background: #111113;
  border-bottom: 1px solid #27272A;
}

.dashboard-content {
  flex: 1;
  width: 100%;
  height: 0;
  min-height: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding: 40px 40px 24px;
  box-sizing: border-box;
  overflow: hidden;
}

.dashboard-content:not(.conversation-mode) {
  justify-content: center;
  align-items: center;
}

.welcome {
  width: 100%;
  max-width: 720px;
  margin: 0 auto 35px;
  text-align: center;
}

.welcome h1 {
  margin: 0 0 20px;
  color: #FAFAFA;
  font-size: 48px;
  font-weight: 700;
  letter-spacing: -2px;
}

.welcome p {
  margin: 0;
  color: #A1A1AA;
  font-size: 15px;
  line-height: 1.8;
}

.question-box {
  position: relative;
  flex-shrink: 0;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.question-box textarea {
  width: 100%;
  min-height: 58px;
  padding: 17px 60px 17px 20px;
  box-sizing: border-box;
  border: 1px solid #27272A;
  border-radius: 10px;
  outline: none;
  resize: none;
  overflow-y: hidden;
  background: #18181B;
  color: #FAFAFA;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

.question-box textarea::placeholder {
  color: #71717A;
}

.question-box textarea:hover {
  border-color: #3F3F46;
}

.question-box textarea:focus {
  border-color: #6366F1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.question-box textarea:disabled {
  opacity: 0.7;
}

.send-button {
  position: absolute;
  right: 9px;
  bottom: 9px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: #4338CA;
  cursor: pointer;
}

.send-button img {
  width: 18px;
  height: 18px;
}

.send-button:hover:not(:disabled) {
  background: #4F46E5;
}

.send-button:active:not(:disabled) {
  transform: scale(0.96);
}

.send-button:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.conversation-mode {
  padding-top: 28px;
}

.conversation {
  flex: 1;
  height: 0;
  min-height: 0;
  max-height: none;
  overflow-y: auto;
  padding: 0 4px 24px;
  scrollbar-color: #3F3F46 transparent;
}

.typing-row {
  display: flex;
  align-items: flex-end;
  gap: 10px;
  width: 100%;
  margin: 12px 0 26px;
  padding: 0;
  box-sizing: border-box;
  animation: typing-appear 0.25s ease-out;
}
.typing-avatar {
  display: flex;
  flex: 0 0 34px;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #312E81;
  color: #C7D2FE;
  font-size: 14px;
  font-weight: 700;
}

.typing-bubble {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 11px 15px;
  border: 1px solid #303036;
  border-radius: 15px 15px 15px 4px;
  background: #1C1C20;
}

.typing-label {
  color: #A5B4FC;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
}

.typing-dots {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 10px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #A5B4FC;
  animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
  animation-delay: 0.3s;
}

@keyframes typing-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }

  30% {
    transform: translateY(-5px);
    opacity: 1;
  }
}

@keyframes typing-appear {
  from {
    opacity: 0;
    transform: translateY(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.conversation-mode .question-box {
  flex-shrink: 0;
}

.input-hint {
  flex-shrink: 0;
  margin: 10px auto 0;
  color: #52525B;
  font-size: 11px;
  text-align: center;
}

.page-error {
  flex-shrink: 0;
  width: 100%;
  max-width: 900px;
  margin: 14px auto;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #7F1D1D;
  border-radius: 8px;
  background: #271313;
  color: #FCA5A5;
  font-size: 13px;
  line-height: 1.5;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .header {
    padding: 0 16px;
  }

  .dashboard-content {
    padding: 30px 16px 20px;
  }

  .welcome h1 {
    font-size: 38px;
  }

  .welcome p {
    font-size: 14px;
  }

  .typing-avatar {
    flex-basis: 29px;
    width: 29px;
    height: 29px;
  }

  .typing-bubble {
    padding: 10px 12px;
  }
}
</style>
