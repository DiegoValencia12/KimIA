
import Chat from '../models/Chat.js'
import Message from '../models/Message.js'
import Response from '../models/Response.js'

import { useN8nAgent } from '../config/ollama.js'
import { generateAssistantResponse } from '../services/assistantService.js'
import { buildChatContext } from '../services/chatContextService.js'
import { summarizeChat } from '../services/chatMemoryService.js'

export const createChat = async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : 'Nuevo chat'

    const chat = await Chat.create({ title })

    return res.status(201).json(chat)
  } catch (error) {
    next(error)
  }
}

export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 })

    return res.status(200).json(chats)
  } catch (error) {
    next(error)
  }
}

export const getChatHistory = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId)

    if (!chat) {
      return res.status(404).json({
        error: 'Chat no encontrado'
      })
    }

    const messages = await Message.find({
      chatId: chat._id
    }).sort({ createdAt: 1 })

    const messageIds = messages.map(message => message._id)

    const responses = await Response.find({
      messageId: { $in: messageIds }
    })

    const responseByMessageId = new Map(
      responses.map(response => [
        response.messageId.toString(),
        response
      ])
    )

    const history = messages.map(message => {
      const response = responseByMessageId.get(
        message._id.toString()
      )

      return {
        ...message.toObject(),
        response: response
          ? {
              content: response.content,
              model: response.model,
              createdAt: response.createdAt
            }
          : null
      }
    })

    return res.status(200).json({
      chat,
      messages: history
    })
  } catch (error) {
    next(error)
  }
}

export const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body

    if (typeof content !== 'string' || !content.trim()) {
      return res.status(400).json({
        error: 'El contenido del mensaje es obligatorio'
      })
    }

    const chat = await Chat.findById(req.params.chatId)

    if (!chat) {
      return res.status(404).json({
        error: 'Chat no encontrado'
      })
    }

    const userContent = content.trim()
    const n8nMode = useN8nAgent()

    let conversation = []

    // El modo Ollama directo utiliza la memoria de MongoDB.
    // En modo n8n, la memoria conversacional la gestiona n8n.
    if (!n8nMode) {
      const previousMessages = await Message.find({
        chatId: chat._id
      }).sort({ createdAt: 1 })

      conversation = buildChatContext({
        chat,
        previousMessages,
        userContent
      })
    }

    let result

    try {
      result = await generateAssistantResponse({
        chatId: chat._id,
        message: userContent,
        conversation
      })
    } catch (error) {
      console.error('Error al generar respuesta:', error)

      return res.status(502).json({
        error: n8nMode
          ? 'No se pudo obtener una respuesta del agente de n8n'
          : 'No se pudo obtener una respuesta de Ollama',
        details: error.message
      })
    }

    const { content: assistantContent, model } = result

    const userMessage = await Message.create({
      chatId: chat._id,
      role: 'user',
      content: userContent
    })

    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: assistantContent
    })

    await Response.create({
      messageId: assistantMessage._id,
      content: assistantContent,
      model
    })

    if (chat.title === 'Nuevo chat') {
      chat.title = userContent.slice(0, 60)
    }

    chat.updatedAt = new Date()
    await chat.save()

    res.status(201).json({
      userMessage,
      response: {
        messageId: assistantMessage._id,
        content: assistantContent,
        model
      }
    })

    // El resumen de MongoDB solo se utiliza en modo directo.
    // En modo n8n, Simple Memory gestiona el contexto del agente.
    if (!n8nMode) {
      try {
        const messagesForSummary = await Message.find({
          chatId: chat._id
        }).sort({ createdAt: 1 })

        const summarizedCount = Math.min(
          chat.summarizedMessageCount || 0,
          messagesForSummary.length
        )

        const newMessageCount =
          messagesForSummary.length - summarizedCount

        if (newMessageCount >= 3) {
          const summary = await summarizeChat(messagesForSummary)

          chat.summary = summary
          chat.summarizedMessageCount = messagesForSummary.length

          await chat.save()
        }
      } catch (error) {
        console.error(
          'No se pudo actualizar la memoria del chat:',
          error
        )
      }
    }
  } catch (error) {
    next(error)
  }
}

export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findById(req.params.chatId)

    if (!chat) {
      return res.status(404).json({
        error: 'Chat no encontrado'
      })
    }

    const messages = await Message.find({
      chatId: chat._id
    }).select('_id')

    const messageIds = messages.map(message => message._id)

    await Response.deleteMany({
      messageId: { $in: messageIds }
    })

    await Message.deleteMany({
      chatId: chat._id
    })

    await Chat.findByIdAndDelete(chat._id)

    return res.status(200).json({
      message: 'Chat eliminado correctamente',
      chatId: chat._id
    })
  } catch (error) {
    next(error)
  }
}
