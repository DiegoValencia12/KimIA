const getOllamaConfig = () => ({
  url: (
    process.env.OLLAMA_URL || 'http://localhost:11434'
  ).replace(/\/$/, ''),
  model: process.env.OLLAMA_MODEL || 'qwen3:0.6b'
})

export const summarizeChat = async (messages) => {
  if (!messages.length) return ''

  const { url, model } = getOllamaConfig()

  const conversation = messages
    .map(message => {
      const role = message.role === 'assistant'
        ? 'Kim'
        : 'Usuario'

      return `${role}: ${message.content}`
    })
    .join('\n')

  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: 'system',
          content:
            'Resume la conversación conservando los datos importantes, preferencias, objetivos y decisiones del usuario. No inventes información. El resumen es únicamente para mantener el contexto de este chat. Devuelve solo el resumen.'
        },
        {
          role: 'user',
          content: conversation
        }
      ]
    }),
    signal: AbortSignal.timeout(120000)
  })

  if (!response.ok) {
    throw new Error(`Error de Ollama: HTTP ${response.status}`)
  }

  const data = await response.json()
  const summary = data.message?.content?.trim()

  if (!summary) {
    throw new Error('Ollama devolvió un resumen vacío')
  }

  return summary
}