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
                :class="{ 'conversation-mode': activeChatId || selectedPdf }"
            >
                <div class="chat-pdf-layout">
                    <div class="chat-column">
                        <div
                            v-if="
                                messages.length === 0 &&
                                !loading &&
                                !selectedPdf
                            "
                            class="welcome"
                        >
                            <h1>KIMIA</h1>
                            <p>
                                KIMIA combina inteligencia artificial, OCR y Web
                                Scraping para buscar, procesar y analizar
                                información pública, convirtiendo datos
                                dispersos en respuestas claras y relevantes.
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
                                @view-pdf="handleViewPdf"
                            />

                            <div
                                v-if="loading"
                                class="typing-row"
                                role="status"
                                aria-label="KIMIA está escribiendo"
                            >
                                <div class="typing-avatar">K</div>
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
                            <input
                                ref="pdfInput"
                                type="file"
                                accept="application/pdf,.pdf"
                                class="hidden-file-input"
                                @change="handlePdfSelection"
                            />

                            <ChatPdfMessage
                                v-if="selectedPdf"
                                :document="selectedPdf"
                                :visible="showPdfViewer"
                                @toggle-viewer="showPdfViewer = !showPdfViewer"
                            />

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
                                class="attach-button"
                                aria-label="Adjuntar PDF"
                                :disabled="loading || historyLoading"
                                @click="openPdfPicker"
                            >
                                <img src="/icons/attach.svg" alt="" />
                            </button>

                            <button
                                v-if="selectedPdf"
                                type="button"
                                class="viewer-toggle-button"
                                :class="{ active: showPdfViewer }"
                                aria-label="Mostrar u ocultar visor PDF"
                                @click="showPdfViewer = !showPdfViewer"
                            >
                                <img src="/icons/eye-off.svg" alt="" />
                            </button>

                            <button
                                type="button"
                                class="send-button"
                                :disabled="
                                    loading ||
                                    historyLoading ||
                                    (!messageInput.trim() && !selectedPdf)
                                "
                                aria-label="Enviar mensaje"
                                @click="handleSendMessage"
                            >
                                <img src="/icons/send.svg" alt="" />
                            </button>
                        </div>

                        <p class="input-hint">
                            Enter para enviar · Shift + Enter para salto de
                            línea
                        </p>
                    </div>

                    <aside
                        v-if="selectedPdf"
                        v-show="showPdfViewer"
                        class="pdf-panel"
                    >
                        <header class="pdf-panel-header">
                            <div class="pdf-panel-title">
                                <span>{{ selectedPdf.name }}</span>
                            </div>
                            <button
                                type="button"
                                class="pdf-close-button"
                                aria-label="Ocultar visor PDF"
                                @click="showPdfViewer = false"
                            >
                                <img src="/icons/eye-off.svg" alt="" />
                            </button>
                        </header>

                        <div class="pdf-panel-content">
                            <PDFComponent
                                :key="selectedPdf.id"
                                :documents="pdfDocuments"
                            />
                        </div>
                    </aside>
                </div>
            </section>
        </div>
    </main>
</template>

<script setup>
import { computed, onMounted, ref, watch, nextTick } from "vue";

import { useRoute, useRouter } from "vue-router";

import MenuBarComponent from "@/components/MenuBarComponent.vue";
import UserMenuComponent from "@/components/UserMenuComponent.vue";
import ChatMessage from "@/components/chat/ChatMessage.vue";
import ChatPdfMessage from "@/components/chat/ChatPdfMessage.vue";
import PDFComponent from "@/components/PDFComponent.vue";

import { useChat } from "@/composables/useChat.js";
import { useChatHistory } from "@/composables/useChatHistory.js";

const route = useRoute();
const router = useRouter();

const messageInput = ref("");
const questionInput = ref(null);
const conversationContainer = ref(null);

const pdfInput = ref(null);
const selectedPdf = ref(null);
const showPdfViewer = ref(false);
const pdfError = ref("");
const localPdfs = ref({});

const pdfDocuments = computed(() => {
    return selectedPdf.value ? [selectedPdf.value] : [];
});

const activeChatId = computed(() => {
    return route.params.chatId ? String(route.params.chatId) : null;
});

const { chats, historyLoading, historyError, loadChats, removeChat } =
    useChatHistory();

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

const pageError = computed(() => {
    return pdfError.value || error.value || historyError.value || "";
});

onMounted(() => {
    loadChats();
});

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

function adjustTextarea() {
    const textarea = questionInput.value;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
}

function scrollToBottom() {
    const container = conversationContainer.value;
    if (!container) return;

    container.scrollTop = container.scrollHeight;
}

async function handleNewChat() {
    messageInput.value = "";
    clearMessages();

    await router.push({
        name: "dashboard",
    });

    await nextTick();
    adjustTextarea();
}

async function handleSelectChat(chatId) {
    if (!chatId) return;

    await router.push({
        name: "chat",
        params: { chatId },
    });
}

async function handleDeleteChat(chatId) {
    const deleted = await removeChat(chatId);
    if (!deleted) return;

    if (activeChatId.value === String(chatId)) {
        clearMessages();
        messageInput.value = "";

        await router.push({
            name: "dashboard",
        });
    }
}

async function handleSendMessage() {
    const content = messageInput.value.trim();

    if (
        (!content && !selectedPdf.value) ||
        loading.value ||
        historyLoading.value
    ) {
        return;
    }

    messageInput.value = "";

    let finalContent = content;

    if (selectedPdf.value) {
        const pdfId = selectedPdf.value.id;
        localPdfs.value[pdfId] = selectedPdf.value;

        finalContent =
            `[PDF:${pdfId}:${selectedPdf.value.name}]\n\n${content}`.trim();

        selectedPdf.value = null;
        showPdfViewer.value = false;
    }

    await nextTick();
    adjustTextarea();

    try {
        await sendMessage(finalContent, activeChatId.value);
        await nextTick();
        scrollToBottom();
    } catch (err) {
        console.error("Error al enviar el mensaje:", err);
    }
}

function handleViewPdf(pdfId) {
    const pdf = localPdfs.value[pdfId];
    if (pdf) {
        selectedPdf.value = pdf;
        showPdfViewer.value = true;
    }
}

function openPdfPicker() {
    pdfInput.value?.click();
}

async function handlePdfSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        pdfError.value = "Selecciona un archivo PDF válido.";
        event.target.value = "";
        return;
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        selectedPdf.value = {
            id: crypto.randomUUID(),
            name: file.name,
            source: uint8Array,
            local: true,
            file,
        };

        pdfError.value = "";
        showPdfViewer.value = true;
    } catch (err) {
        console.error("Error al procesar el archivo:", err);
        pdfError.value = "No se pudo leer el archivo seleccionado.";
    }

    event.target.value = "";

    await nextTick();
    scrollToBottom();
}

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
    display: flex;
    width: 100%;
    height: 100vh;
    min-height: 100vh;
    overflow: hidden;
    box-sizing: border-box;
    background: #09090b;
    color: #fafafa;
}

.dashboard-main {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 0;
    height: 100%;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.header {
    position: relative;
    z-index: 110;
    display: flex;
    flex: 0 0 54px;
    align-items: center;
    justify-content: flex-end;
    width: 100%;
    height: 54px;
    padding: 0 24px;
    box-sizing: border-box;
    border-bottom: 1px solid #27272a;
    background: #111113;
}

.dashboard-content {
    display: flex;
    flex: 1;
    flex-direction: column;
    width: 100%;
    height: 0;
    min-width: 0;
    min-height: 0;
    padding: 16px 24px 20px;
    box-sizing: border-box;
    overflow: hidden;
}

.dashboard-content:not(.conversation-mode) {
    justify-content: flex-start;
    align-items: stretch;
}

.conversation-mode {
    padding-top: 16px;
}

.chat-pdf-layout {
    display: flex;
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 0;
    gap: 16px;
    overflow: hidden;
}

.chat-column {
    display: flex;
    flex: 1;
    flex-direction: column;
    justify-content: center;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #27272a;
    border-radius: 12px;
    background: #111113;
}

.welcome {
    width: 100%;
    max-width: 720px;
    margin: auto;
    padding: 0 24px;
    text-align: center;
}

.welcome h1 {
    margin: 0 0 20px;
    color: #fafafa;
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -2px;
}

.welcome p {
    margin: 0;
    color: #a1a1aa;
    font-size: 15px;
    line-height: 1.8;
}

.conversation {
    flex: 1;
    width: 100%;
    height: 0;
    min-height: 0;
    max-height: none;
    padding: 24px 20px;
    box-sizing: border-box;
    overflow-y: auto;
    scrollbar-color: #3f3f46 transparent;
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
    background: #312e81;
    color: #c7d2fe;
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
    background: #1c1c20;
}

.typing-label {
    color: #a5b4fc;
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
    background: #a5b4fc;
    animation: typing-bounce 1.2s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.15s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes typing-bounce {
    0%,
    60%,
    100% {
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

.question-box {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    max-width: none;
    margin: 0;
    padding: 0 20px;
}

.question-box textarea {
    display: block;
    width: 100%;
    min-height: 58px;
    padding: 17px 110px 17px 58px;
    box-sizing: border-box;
    border: 1px solid #27272a;
    border-radius: 10px;
    outline: none;
    resize: none;
    overflow-y: hidden;
    background: #18181b;
    color: #fafafa;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.5;
}

.question-box textarea::placeholder {
    color: #71717a;
}

.question-box textarea:hover {
    border-color: #3f3f46;
}

.question-box textarea:focus {
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
}

.question-box textarea:disabled {
    opacity: 0.7;
}

.send-button,
.attach-button,
.viewer-toggle-button {
    position: absolute;
    bottom: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 7px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.send-button {
    right: 29px;
    border: 0;
    background: #4338ca;
}

.send-button img {
    width: 18px;
    height: 18px;
}

.send-button:hover:not(:disabled) {
    background: #4f46e5;
}

.send-button:active:not(:disabled) {
    transform: scale(0.96);
}

.send-button:disabled {
    opacity: 0.45;
    cursor: not-allowed;
}

.attach-button {
    left: 29px;
    background: transparent;
}

.viewer-toggle-button {
    right: 77px;
    background: transparent;
}

.attach-button:hover,
.viewer-toggle-button:hover,
.viewer-toggle-button.active {
    border-color: #3f3f46;
    background: #27272a;
}

.attach-button img,
.viewer-toggle-button img {
    width: 19px;
    height: 19px;
    opacity: 0.75;
}

.attach-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.hidden-file-input {
    display: none;
}

.input-hint {
    flex-shrink: 0;
    margin: 10px auto 18px;
    padding: 0 20px;
    color: #52525b;
    font-size: 11px;
    text-align: center;
}

.page-error {
    flex-shrink: 0;
    width: calc(100% - 40px);
    max-width: 900px;
    margin: 14px 20px;
    padding: 12px;
    box-sizing: border-box;
    border: 1px solid #7f1d1d;
    border-radius: 8px;
    background: #271313;
    color: #fca5a5;
    font-size: 13px;
    line-height: 1.5;
    overflow-wrap: anywhere;
}

.pdf-panel {
    display: flex;
    flex: 0 0 46%;
    flex-direction: column;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    border: 1px solid #27272a;
    border-radius: 12px;
    background: #111113;
}

.pdf-panel-header {
    display: flex;
    flex: 0 0 48px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 14px;
    border-bottom: 1px solid #27272a;
}

.pdf-panel-title {
    display: flex;
    align-items: center;
    gap: 9px;
    min-width: 0;
    color: #fafafa;
    font-size: 12px;
    font-weight: 600;
}

.pdf-panel-title span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.pdf-close-button {
    display: flex;
    flex: 0 0 30px;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 7px;
    background: transparent;
    cursor: pointer;
}

.pdf-close-button:hover {
    border-color: #3f3f46;
    background: #27272a;
}

.pdf-close-button img {
    width: 16px;
    height: 16px;
}

.pdf-panel-content {
    flex: 1;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
}

.pdf-panel-content :deep(.pdf-component) {
    height: 100%;
    min-height: 0;
}
</style>
