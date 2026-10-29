import { ref } from 'vue';
import {
  listChats,
  deleteChat,
} from '@/services/chatService.js';

export function useChatHistory() {
  const chats = ref([]);
  const historyLoading = ref(false);
  const historyError = ref('');

  let historyVersion = 0;

  async function loadChats() {
    const currentVersion = ++historyVersion;

    historyLoading.value = true;
    historyError.value = '';

    try {
      const result = await listChats();

      if (currentVersion !== historyVersion) return;

      chats.value = Array.isArray(result)
        ? result
        : Array.isArray(result?.chats)
          ? result.chats
          : Array.isArray(result?.data?.chats)
            ? result.data.chats
            : [];
    } catch (error) {
      if (currentVersion !== historyVersion) return;

      historyError.value =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo cargar el historial.';
    } finally {
      if (currentVersion === historyVersion) {
        historyLoading.value = false;
      }
    }
  }

  async function removeChat(chatId) {
    if (!chatId) return false;

    historyError.value = '';

    try {
      await deleteChat(chatId);

      chats.value = chats.value.filter(
        (chat) => String(chat.id ?? chat.chatId) !== String(chatId),
      );

      return true;
    } catch (error) {
      historyError.value =
        error?.response?.data?.message ||
        error?.message ||
        'No se pudo eliminar la conversación.';

      return false;
    }
  }

  function getChatTitle(chat) {
    return chat?.title || chat?.name || 'Nueva conversación';
  }

  return {
    chats,
    historyLoading,
    historyError,
    loadChats,
    removeChat,
    getChatTitle,
  };
}