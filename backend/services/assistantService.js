
import { useN8nAgent } from '../config/ollama.js'
import { generateOllamaResponse } from './ollamaService.js'
import { generateN8nResponse } from './n8nService.js'

const stripThinking = (text) =>
  text.replace(/<think>[\s\S]*?<\/think>/g, '').trim()

export const generateAssistantResponse = async ({
  chatId,
  message,
  conversation
}) => {
  const result = useN8nAgent()
    ? await generateN8nResponse({
        chatId,
        message
      })
    : await generateOllamaResponse(conversation)

  const content = stripThinking(result.content)

  if (!content) {
    throw new Error('El asistente devolvió una respuesta vacía')
  }

  return {
    content,
    model: result.model,
    provider: useN8nAgent() ? 'n8n' : 'ollama'
  }
}
