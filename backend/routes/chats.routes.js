
import { Router } from 'express'

import {
  createChat,
  listChats,
  getChatHistory,
  sendMessage,
  deleteChat
} from '../controllers/chat.controller.js'

const router = Router()

router.post('/', createChat)
router.get('/', listChats)
router.get('/:chatId', getChatHistory)
router.post('/:chatId/messages', sendMessage)
router.delete('/:chatId', deleteChat)

export default router
