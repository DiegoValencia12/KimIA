
import { getOllamaConfig } from '../config/ollama.js'
import { generateOllamaResponse } from './ollamaService.js'

export const summarizeChat = async (messages) => {
  if (!messages.length) return ''

  const { summaryPrompt } = getOllamaConfig()

  if (!summaryPrompt) {
    throw new Error('AI_SUMMARY_PROMPT no está configurado')
  }

  const conversation = messages
    .filter(message => message.role !== 'system')
    .map(message => {
      const role = message.role === 'assistant' ? 'Asistente' : 'Usuario'
      return `${role}: ${message.content}`
    })
    .join('\n')

  const { content } = await generateOllamaResponse([
    {
      role: 'system',
      content: `${summaryPrompt}

El resultado será utilizado como memoria interna de una conversación.
No respondas al usuario.
No escribas consejos ni recomendaciones nuevas.
No inventes información.
Conserva los acontecimientos, hechos, preferencias, objetivos y decisiones importantes.
Mantén los acontecimientos en orden cronológico.
Escribe un resumen breve, claro y fiel a la conversación.`
    },
    {
      role: 'user',
      content: conversation
    }
  ])

  return content
}
