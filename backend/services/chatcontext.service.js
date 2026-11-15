
import { getOllamaConfig } from '../config/ollama.js'

export const buildChatContext = ({
  chat,
  previousMessages,
  userContent
}) => {
  const { systemPrompt } = getOllamaConfig()

  const summarizedCount = Math.min(
    chat.summarizedMessageCount || 0,
    previousMessages.length
  )

  const recentMessages = previousMessages
    .slice(summarizedCount)
    .filter(message => message.role !== 'system')
    .map(message => ({
      role: message.role,
      content: message.content
    }))

  const conversation = []

  const contextParts = [
    systemPrompt,
    chat.summary
      ? `Resumen de la conversación:\n${chat.summary}`
      : ''
  ].filter(Boolean)

  if (contextParts.length > 0) {
    conversation.push({
      role: 'system',
      content: contextParts.join('\n\n')
    })
  }

  conversation.push(...recentMessages)

  conversation.push({
    role: 'user',
    content: userContent
  })

  return conversation
}
