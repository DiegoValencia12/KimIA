
import 'dotenv/config'
import mongoose from 'mongoose'

import app from './app.js'
import connectDB from './config/db.js'
import { getOllamaConfig, useN8nAgent } from './config/ollama.js'

const PORT = process.env.PORT || 3000

const removeLegacyIndexes = async () => {
  const obsoleteIndexes = [
    { collection: 'chats', index: 'chatId_1' },
    { collection: 'messages', index: 'messageId_1' },
    { collection: 'responses', index: 'responseId_1' }
  ]

  for (const item of obsoleteIndexes) {
    try {
      const collection = mongoose.connection.db.collection(
        item.collection
      )

      const indexes = await collection.indexes()

      if (indexes.some(index => index.name === item.index)) {
        await collection.dropIndex(item.index)

        console.log(
          `Índice antiguo eliminado: ${item.collection}.${item.index}`
        )
      }
    } catch (error) {
      if (
        error.code === 26 ||
        error.codeName === 'NamespaceNotFound'
      ) {
        console.log(
          `La colección ${item.collection} no existe; se omite.`
        )
      } else {
        throw error
      }
    }
  }
}

const startServer = async () => {
  try {
    await connectDB()
    await removeLegacyIndexes()

    const { model } = getOllamaConfig()
    const mode = useN8nAgent()
      ? 'agente n8n'
      : 'modelo directo (Ollama)'

    app.listen(PORT, () => {
      console.log(`KimIA API ejecutándose en el puerto ${PORT}`)
      console.log(`Modelo configurado: ${model}`)
      console.log(`Modo: ${mode}`)
    })
  } catch (error) {
    console.error(
      'No se pudo iniciar KimIA:',
      error.message
    )

    process.exit(1)
  }
}

startServer()
