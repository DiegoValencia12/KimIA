<template>
    <div class="message-row" :class="isUser ? 'user-row' : 'assistant-row'">
        <div v-if="!isUser" class="assistant-avatar">K</div>

        <div
            class="message-bubble"
            :class="isUser ? 'user-bubble' : 'assistant-bubble'"
        >
            <div v-if="!isUser" class="message-author">KIMIA</div>

            <div v-if="attachment" class="message-attachment-wrapper">
                <ChatPdfMessage
                    :document="attachment"
                    :visible="false"
                    @toggle-viewer="$emit('view-pdf', attachment.id)"
                />
            </div>

            <div class="message-content">
                <MarkdownRenderer
                    v-if="!isUser"
                    :content="parsedContent.text"
                />

                <template v-else>
                    {{ parsedContent.text }}
                </template>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from "vue";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer.vue";
import ChatPdfMessage from "@/components/chat/ChatPdfMessage.vue";

const props = defineProps({
    message: {
        type: Object,
        required: true,
    },
});

const emit = defineEmits(["view-pdf"]);

const isUser = computed(() => props.message.role === "user");

const parsedContent = computed(() => {
    const content = props.message.content || "";
    const match = content.match(/^\[PDF:([^:]+):([^\]]+)\]\n*/);

    if (match) {
        return {
            attachment: { id: match[1], name: match[2] },
            text: content.slice(match[0].length),
        };
    }

    return { attachment: null, text: content };
});

const attachment = computed(() => parsedContent.value.attachment);
</script>

<style scoped>
.message-row {
    display: flex;
    width: 100%;
    margin: 12px 0;
    gap: 10px;
    align-items: flex-end;
    box-sizing: border-box;
}

.user-row {
    justify-content: flex-end;
}

.assistant-row {
    justify-content: flex-start;
}

.assistant-avatar {
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

.message-bubble {
    position: relative;
    max-width: min(75%, 720px);
    min-width: 60px;
    padding: 12px 15px 8px;
    box-sizing: border-box;
    overflow-wrap: anywhere;
    line-height: 1.65;
    font-size: 13px;
}

.user-bubble {
    border-radius: 16px 16px 4px 16px;
    background: #3730a3;
    color: #ffffff;
}

.assistant-bubble {
    border: 1px solid #303036;
    border-radius: 16px 16px 16px 4px;
    background: #1c1c20;
    color: #e4e4e7;
}

.message-author {
    margin-bottom: 6px;
    color: #a5b4fc;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1px;
}

.message-content {
    min-width: 0;
    overflow-wrap: anywhere;
    word-break: break-word;
}

.message-attachment-wrapper {
    margin-bottom: 10px;
}

.message-attachment-wrapper :deep(.attached-file) {
    margin-bottom: 0;
    background: rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.15);
}

.message-attachment-wrapper :deep(.file-details strong) {
    color: inherit;
}

.message-attachment-wrapper :deep(.view-button:hover) {
    background: rgba(255, 255, 255, 0.1);
    border-color: transparent;
}

@media (max-width: 640px) {
    .message-bubble {
        max-width: 85%;
        padding: 10px 12px 7px;
        font-size: 12px;
    }

    .assistant-avatar {
        flex-basis: 29px;
        width: 29px;
        height: 29px;
    }
}
</style>
