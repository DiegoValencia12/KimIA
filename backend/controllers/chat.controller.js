
import Chat from '../models/Chat.js'
import Message from '../models/Message.js'
import Response from '../models/Response.js'

const getOllamaConfig = () => ({
  url: (
    process.env.OLLAMA_URL || 'http://localhost:11434'
  ).replace(/\/$/, ''),
  model: process.env.OLLAMA_MODEL || 'qwen3:0.6b'
})

export const createChat = async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === 'string' && req.body.title.trim()
        ? req.body.title.trim()
        : 'Nuevo chat'

    const chat = await Chat.create({ title })

    res.status(201).json(chat)
  } catch (error) {
    next(error)
  }
}

export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 })

    res.json(chats)
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

    res.json({
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

    const { url, model } = getOllamaConfig()

    const previousMessages = await Message.find({
      chatId: chat._id
    }).sort({ createdAt: 1 })

    const conversation = [
      ...previousMessages.map(message => ({
        role: message.role,
        content: message.content
      })),
      {
        role: 'user',
        content: content.trim()
      }
    ]

    let assistantContent

    try {
      const ollamaResponse = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: conversation
        }),
        signal: AbortSignal.timeout(120000)
      })

      if (!ollamaResponse.ok) {
        const details = await ollamaResponse.text()

        throw new Error(
          `Ollama respondió con HTTP ${ollamaResponse.status}: ${details}`
        )
      }

      const data = await ollamaResponse.json()
      assistantContent = data.message?.content

      if (
        typeof assistantContent !== 'string' ||
        !assistantContent.trim()
      ) {
        throw new Error('Ollama devolvió una respuesta vacía')
      }
    } catch (error) {
      return res.status(502).json({
        error: 'No se pudo obtener una respuesta de Ollama',
        details: error.message
      })
    }

    const userMessage = await Message.create({
      chatId: chat._id,
      role: 'user',
      content: content.trim()
    })

    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: 'assistant',
      content: assistantContent.trim()
    })

    await Response.create({
      messageId: assistantMessage._id,
      content: assistantContent.trim(),
      model
    })

    if (chat.title === 'Nuevo chat') {
      chat.title = content.trim().slice(0, 60)
    }

    chat.updatedAt = new Date()
    await chat.save()

    res.status(201).json({
      userMessage,
      response: {
        messageId: assistantMessage._id,
        content: assistantContent.trim(),
        model
      }
    })
  } catch (error) {
    next(error)
  }
}
