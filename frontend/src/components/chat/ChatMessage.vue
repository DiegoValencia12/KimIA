
<template>
  <div
    class="message-row"
    :class="isUser ? 'user-row' : 'assistant-row'"
  >
    <div v-if="!isUser" class="assistant-avatar">
      K
    </div>

    <div
      class="message-bubble"
      :class="isUser ? 'user-bubble' : 'assistant-bubble'"
    >
      <div v-if="!isUser" class="message-author">
        KIMIA
      </div>

      <div class="message-content">
        <MarkdownRenderer
          v-if="!isUser"
          :content="message.content"
        />

        <template v-else>
          {{ message.content }}
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import MarkdownRenderer from '@/components/chat/MarkdownRenderer.vue'

const props = defineProps({
  message: {
    type: Object,
    required: true
  }
})

const isUser = computed(() => props.message.role === 'user')
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
  background: #312E81;
  color: #C7D2FE;
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
  background: #3730A3;
  color: #FFFFFF;
}

.assistant-bubble {
  border: 1px solid #303036;
  border-radius: 16px 16px 16px 4px;
  background: #1C1C20;
  color: #E4E4E7;
}

.message-author {
  margin-bottom: 6px;
  color: #A5B4FC;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 1px;
}

.message-content {
  min-width: 0;
  overflow-wrap: anywhere;
  word-break: break-word;
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
