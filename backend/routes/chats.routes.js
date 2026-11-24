import { Router } from "express";

import {
  createChat,
  listChats,
  getChatHistory,
  sendMessage,
  deleteChat,
} from "../controllers/chat.controller.js";

import { authenticateToken } from "../middlewares/authenticateToken.js";
import { uploadPdfSingle } from "../middlewares/uploadPdf.js";

const router = Router();

router.use(authenticateToken);

router.post("/", createChat);
router.get("/", listChats);
router.get("/:chatId", getChatHistory);

router.post("/:chatId/messages", uploadPdfSingle("file"), sendMessage);

router.delete("/:chatId", deleteChat);

export default router;
