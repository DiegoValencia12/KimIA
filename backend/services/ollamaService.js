
import { getOllamaConfig } from '../config/ollama.js'

export const generateOllamaResponse = async (messages) => {
  const { url, model } = getOllamaConfig()

  const response = await fetch(`${url}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages
    }),
    signal: AbortSignal.timeout(120000)
  })

  if (!response.ok) {
    const details = await response.text()

    throw new Error(
      `Ollama respondió con HTTP ${response.status}: ${details}`
    )
  }

  const data = await response.json()
  const content = data.message?.content?.trim()

  if (!content) {
    throw new Error('Ollama devolvió una respuesta vacía')
  }

  return {
    content,
    model
  }
}
