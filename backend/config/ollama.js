
export const getOllamaConfig = () => ({
  url: (
    process.env.OLLAMA_URL || 'http://localhost:11434'
  ).replace(/\/+$/, ''),

  model: process.env.OLLAMA_MODEL || 'qwen3:0.6b',
                                                                                                                                                        
  systemPrompt: process.env.AI_SYSTEM_PROMPT?.trim() || '',

  summaryPrompt:
    process.env.AI_SUMMARY_PROMPT?.trim() ||
    'Resume la conversación conservando los datos importantes, preferencias, objetivos y decisiones. No inventes información. Devuelve únicamente el resumen.'
})

export const useN8nAgent = () =>
  String(process.env.USE_N8N_AGENT).toLowerCase() === 'true'

export const getN8nConfig = () => ({
  webhookUrl:
    process.env.N8N_WEBHOOK_URL ||
    'http://n8n:5678/webhook/KimIA/chat'
})
