
import { getOllamaConfig } from '../config/ollama.js'
import { generateOllamaResponse } from './ollamaService.js'

export const summarizeChat = async (messages) => {
  if (!messages.length) return ''

  const { summaryPrompt } = getOllamaConfig()

  if (!summaryPrompt) {
    throw new Error(
      'AI_SUMMARY_PROMPT no está configurado'
    )
  }

  const conversation = messages
    .filter(message => message.role !== 'system')
    .map(message => {
      const role = message.role === 'assistant'
        ? 'assistant'
        : 'user'

      return `${role}: ${message.content}`
    })
    .join('\n')

  const { content } = await generateOllamaResponse([
    {
      role: 'system',
      content: summaryPrompt
    },
    {
      role: 'user',
      content: conversation
    }
  ])

  return content
}
