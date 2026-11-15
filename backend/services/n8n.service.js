
import { getOllamaConfig, getN8nConfig } from '../config/ollama.js'

export const generateN8nResponse = async ({
  chatId,
  message
}) => {
  const { model } = getOllamaConfig()
  const { webhookUrl } = getN8nConfig()

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      sessionId: String(chatId),
      model
    }),
    signal: AbortSignal.timeout(180000)
  })

  if (!response.ok) {
    const details = await response.text()
    const hint = response.status === 404
      ? ' Comprueba que el workflow esté activo y que la URL sea correcta.'
      : ''

    throw new Error(
      `n8n respondió con HTTP ${response.status}.${hint} ${details}`
    )
  }

  const data = await response.json()
  const content = data.response?.trim()

  if (typeof content !== 'string' || !content) {
    throw new Error(
      'n8n no devolvió una respuesta válida en la propiedad "response"'
    )
  }

  return {
    content,
    model
  }
}
