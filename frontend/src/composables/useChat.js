
import { ref } from 'vue';

import {
  createChat,
  getChatHistory,
  sendChatMessage,
} from '@/services/chatService.js';

function getPayload(result) {
  return result?.data ?? result;
}

function getChatId(result) {
  const payload = getPayload(result);

  return (
    payload?._id ??
    payload?.chatId ??
    payload?.chat?._id ??
    payload?.chat?.id ??
    payload?.id ??
    null
  );
}

function getMessages(result) {
  const payload = getPayload(result);

  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.messages)) return payload.messages;

  return [];
}

export function useChat({ router, refreshChats }) {
  const messages = ref([]);
  const loading = ref(false);
  const error = ref('');

  let requestVersion = 0;
  let skipNextChatLoad = false;

  function normalizeMessage(message, fallbackRole = 'assistant') {
    return {
      id:
        message?._id ??
        message?.id ??
        message?.messageId ??
        `${Date.now()}-${Math.random()}`,
      role: message?.role ?? message?.sender ?? fallbackRole,
      content: message?.content ?? message?.message ?? '',
      model: message?.model ?? null,
      createdAt: message?.createdAt ?? message?.created_at ?? null,
    };
  }

  async function loadChat(chatId) {
    if (!chatId) {
      requestVersion++;
      messages.value = [];
      loading.value = false;
      error.value = '';
      return;
    }

    const currentVersion = ++requestVersion;

    loading.value = true;
    error.value = '';

    try {
      const result = await getChatHistory(chatId);

      if (currentVersion !== requestVersion) return;

      messages.value = getMessages(result).map((message) =>
        normalizeMessage(message),
      );
    } catch (err) {
      if (currentVersion !== requestVersion) return;

      error.value =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo cargar la conversación.';
    } finally {
      if (currentVersion === requestVersion) {
        loading.value = false;
      }
    }
  }

  async function startNewChat() {
    error.value = '';

    try {
      const result = await createChat();
      const chatId = getChatId(result);

      if (!chatId) {
        throw new Error(
          'El servidor no devolvió el identificador de la conversación.',
        );
      }

      requestVersion++;
      messages.value = [];
      loading.value = false;
      skipNextChatLoad = true;

      await refreshChats?.();

      await router.push({
        name: 'chat',
        params: { chatId: String(chatId) },
      });

      return String(chatId);
    } catch (err) {
      skipNextChatLoad = false;

      error.value =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo crear la conversación.';

      return null;
    }
  }

  async function sendMessage(content, chatId) {
    const text = content?.trim();

    if (!text || loading.value) return false;

    error.value = '';

    let currentChatId = chatId;

    if (!currentChatId) {
      currentChatId = await startNewChat();

      if (!currentChatId) return false;
    }

    const currentVersion = ++requestVersion;

    const userMessage = normalizeMessage(
      {
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
      },
      'user',
    );

    messages.value.push(userMessage);
    loading.value = true;

    try {
      const result = await sendChatMessage(currentChatId, text);

      if (currentVersion !== requestVersion) return false;

      const payload = getPayload(result);

      const responseMessage =
        payload?.response ??
        payload?.assistantMessage ??
        payload?.message ??
        payload;

      if (responseMessage?.content || responseMessage?.message) {
        messages.value.push(
          normalizeMessage(responseMessage, 'assistant'),
        );
      }

      await refreshChats?.();

      return true;
    } catch (err) {
      if (currentVersion !== requestVersion) return false;

      error.value =
        err?.response?.data?.error ||
        err?.response?.data?.message ||
        err?.message ||
        'No se pudo enviar el mensaje.';

      return false;
    } finally {
      if (currentVersion === requestVersion) {
        loading.value = false;
      }
    }
  }

  function consumeSkipNextChatLoad() {
    if (!skipNextChatLoad) return false;

    skipNextChatLoad = false;
    return true;
  }

  function clearMessages() {
    requestVersion++;
    messages.value = [];
    loading.value = false;
    error.value = '';
  }

  return {
    messages,
    loading,
    error,
    loadChat,
    startNewChat,
    sendMessage,
    consumeSkipNextChatLoad,
    clearMessages,
  };
}
