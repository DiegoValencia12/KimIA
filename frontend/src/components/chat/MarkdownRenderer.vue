<script setup>
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  content: {
    type: String,
    default: ''
  }
})

const renderedContent = computed(() => {
  const html = marked.parse(props.content, {
    gfm: true,
    breaks: true
  })

  return DOMPurify.sanitize(html)
})
</script>

<template>
  <div class="markdown-content" v-html="renderedContent"></div>
</template>

<style scoped>
.markdown-content {
  width: 100%;
  color: #E4E4E7;
  font-size: 14px;
  line-height: 1.8;
  overflow-wrap: anywhere;
}

.markdown-content :deep(.table-wrapper) {
  width: 100%;
  overflow-x: auto;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 18px 0;
  border: 1px solid #3F3F46;
  border-radius: 8px;
  font-size: 13px;
  text-align: left;
}

.markdown-content :deep(thead) {
  background: #27272A;
}

.markdown-content :deep(th) {
  padding: 12px 15px;
  color: #A5B4FC;
  font-weight: 700;
  border: 1px solid #3F3F46;
  white-space: nowrap;
}

.markdown-content :deep(td) {
  padding: 11px 15px;
  border: 1px solid #3F3F46;
  color: #E4E4E7;
}

.markdown-content :deep(tbody tr:nth-child(even)) {
  background: #18181B;
}

.markdown-content :deep(tbody tr:hover) {
  background: #27272A;
}
</style>