
import { Router } from 'express'

import {
  createChat,
  listChats,
  getChatHistory,
  sendMessage,
  deleteChat
} from '../controllers/chat.controller.js'

import { verifyFirebaseToken } from '../middlewares/verifyFirebaseToken.js'

const router = Router()

router.use(verifyFirebaseToken)

router.post('/', createChat)
router.get('/', listChats)
router.get('/:chatId', getChatHistory)
router.post('/:chatId/messages', sendMessage)
router.delete('/:chatId', deleteChat)

export default router
