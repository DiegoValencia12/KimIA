```vue
<template>
  <main class="dashboard">
    <header class="header">
      <div class="header-left">
        <button
          class="menu-button"
          type="button"
          aria-label="Abrir menú"
          @click="menuOpen = !menuOpen"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="logo">KIMIA</div>
      </div>

      <button class="user-button" type="button" aria-label="Usuario">
        <img src="/icons/user.svg" alt="Usuario" />
      </button>
    </header>

    <Teleport to="body">
      <div
        v-if="menuOpen"
        class="menu-overlay"
        @click="menuOpen = false"
      ></div>

      <MenuBarComponent
        v-if="menuOpen"
        :chats="chats"
        :active-chat-id="activeChatId"
        :loading="historyLoading"
        :error="historyError"
        @new-chat="handleNewChat"
        @select-chat="handleSelectChat"
        @delete-chat="handleDeleteChat"
        @click.stop
      />
    </Teleport>

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
        <article
          v-for="(message, index) in messages"
          :key="message._id || `${message.role}-${index}`"
          class="message"
          :class="message.role"
        >
          <div class="message-label">
            {{ message.role === 'user' ? 'Tú' : 'KIMIA' }}
          </div>

          <div class="message-content">
            {{ message.content }}
          </div>
        </article>

        <article
          v-if="loading"
          class="message assistant"
        >
          <div class="message-label">KIMIA</div>

          <div class="message-content loading-response">
            Generando respuesta...
          </div>
        </article>
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
  </main>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
  watch,
  nextTick,
} from 'vue';

import { useRoute, useRouter } from 'vue-router';

import MenuBarComponent from '@/components/MenuBarComponent.vue';
import { useChat } from '@/composables/useChat.js';
import { useChatHistory } from '@/composables/useChatHistory.js';

const route = useRoute();
const router = useRouter();

// Estado de la interfaz
const menuOpen = ref(false);
const messageInput = ref('');
const questionInput = ref(null);
const conversationContainer = ref(null);

// Chat activo
const activeChatId = computed(() => {
  return route.params.chatId
    ? String(route.params.chatId)
    : null;
});

// Historial de conversaciones
const {
  chats,
  historyLoading,
  historyError,
  loadChats,
  removeChat,
} = useChatHistory();

// Mensajes y operaciones del chat
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
});

// Error que se muestra en pantalla
const pageError = computed(() => {
  return error.value || historyError.value || '';
});

// Cargar la lista de chats al iniciar
onMounted(() => {
  loadChats();
});

// Cargar el historial cuando cambia la conversación
watch(
  activeChatId,
  async (chatId) => {
    if (consumeSkipNextChatLoad()) {
      return;
    }

    if (!chatId) {
      clearMessages();
      return;
    }

    await loadChat(chatId);

    await nextTick();
    scrollToBottom();
  },
  { immediate: true },
);

// Ajustar la altura del campo de texto
function adjustTextarea() {
  const textarea = questionInput.value;

  if (!textarea) return;

  textarea.style.height = 'auto';

  textarea.style.height =
    `${textarea.scrollHeight}px`;
}

// Desplazar la conversación al último mensaje
function scrollToBottom() {
  const container = conversationContainer.value;

  if (!container) return;

  container.scrollTop = container.scrollHeight;
}

// Crear una conversación nueva
async function handleNewChat() {
  menuOpen.value = false;
  messageInput.value = '';

  clearMessages();

  await router.push({
    name: 'dashboard',
  });

  await nextTick();
  adjustTextarea();
}

// Abrir una conversación existente
async function handleSelectChat(chatId) {
  if (!chatId) return;

  menuOpen.value = false;

  await router.push({
    name: 'chat',
    params: { chatId },
  });
}

// Eliminar una conversación
async function handleDeleteChat(chatId) {
  const deleted = await removeChat(chatId);

  if (!deleted) return;

  if (activeChatId.value === String(chatId)) {
    clearMessages();
    messageInput.value = '';

    await router.push({
      name: 'dashboard',
    });
  }
}

// Enviar un mensaje
async function handleSendMessage() {
  const content = messageInput.value.trim();

  if (!content || loading.value || historyLoading.value) {
    return;
  }

  messageInput.value = '';

  await nextTick();
  adjustTextarea();

  try {
    await sendMessage(content, activeChatId.value);

    await nextTick();
    scrollToBottom();
  } catch (err) {
    console.error('Error al enviar el mensaje:', err);
  }
}

// Desplazar al final cuando cambian los mensajes
watch(
  () => messages.value.length,
  async () => {
    await nextTick();
    scrollToBottom();
  },
);
</script>

<style scoped>
.dashboard {
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  background: #09090B;
  color: #FAFAFA;
}

.header {
  position: relative;
  z-index: 110;
  flex-shrink: 0;
  width: 100%;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 30px;
  box-sizing: border-box;
  background: #111113;
  border-bottom: 1px solid #27272A;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 18px;
}

.menu-button {
  width: 40px;
  height: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0;
  border: 1px solid #27272A;
  border-radius: 7px;
  background: #18181B;
  cursor: pointer;
}

.menu-button span {
  width: 17px;
  height: 2px;
  border-radius: 2px;
  background: #A1A1AA;
}

.menu-button:hover {
  border-color: #3F3F46;
  background: #27272A;
}

.menu-button:hover span {
  background: #FAFAFA;
}

.logo {
  color: #FAFAFA;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: 3px;
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
  border-color: #3F3F46;
  background: #27272A;
}

.user-button:hover img {
  opacity: 1;
}

.menu-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 90;
}

.dashboard-content {
  width: 900px;
  max-width: calc(100% - 60px);
  margin: 0 auto;
  padding-top: 65px;
  padding-bottom: 24px;
  box-sizing: border-box;
}

.welcome {
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
  width: 100%;
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
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding-top: 28px;
}

.conversation {
  flex: 1;
  min-height: 180px;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  padding: 0 4px 24px;
  scrollbar-color: #3F3F46 transparent;
}

.message {
  max-width: 780px;
  margin: 0 auto 26px;
  padding: 18px 20px;
  border: 1px solid #27272A;
  border-radius: 12px;
  background: #111113;
}

.message.user {
  background: #18181B;
}

.message-label {
  margin-bottom: 10px;
  color: #A5B4FC;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.5px;
}

.message-content {
  color: #E4E4E7;
  font-size: 14px;
  line-height: 1.8;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.loading-response {
  color: #A1A1AA;
}

.conversation-mode .question-box {
  flex-shrink: 0;
}

.input-hint {
  margin: 10px 0 0;
  color: #52525B;
  font-size: 11px;
  text-align: center;
}

.page-error {
  margin: 14px 0;
  padding: 12px;
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
    max-width: calc(100% - 32px);
    padding-top: 40px;
  }

  .welcome h1 {
    font-size: 38px;
  }

  .welcome p {
    font-size: 14px;
  }

  .conversation {
    max-height: calc(100vh - 230px);
  }

  .message {
    padding: 14px;
  }
}
</style>
```