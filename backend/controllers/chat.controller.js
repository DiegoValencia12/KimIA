import Chat from "../models/Chat.js";
import Message from "../models/Message.js";
import Response from "../models/Response.js";
import Research from "../models/Research.js";
import ResearchDocument from "../models/ResearchDocument.js";
import path from "path";
import { runAgent } from "../agent/agent-research.js";
import { useN8nAgent } from "../config/ollama.js";

export const createChat = async (req, res, next) => {
  try {
    const title =
      typeof req.body.title === "string" && req.body.title.trim()
        ? req.body.title.trim()
        : "Nuevo chat";

    const chat = await Chat.create({ title, userId: req.user.uid });

    return res.status(201).json(chat);
  } catch (error) {
    next(error);
  }
};

export const listChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      userId: req.user.uid,
    }).sort({ updatedAt: -1 });

    return res.status(200).json(chats);
  } catch (error) {
    next(error);
  }
};

export const getChatHistory = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.uid,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    const messages = await Message.find({
      chatId: chat._id,
    }).sort({ createdAt: 1 });

    const messageIds = messages.map((message) => message._id);

    const responses = await Response.find({
      messageId: { $in: messageIds },
    });

    const responseByMessageId = new Map(
      responses.map((response) => [response.messageId.toString(), response]),
    );

    const history = messages.map((message) => {
      const response = responseByMessageId.get(message._id.toString());

      return {
        ...message.toObject(),
        response: response
          ? {
              content: response.content,
              model: response.model,
              createdAt: response.createdAt,
            }
          : null,
      };
    });

    return res.status(200).json({
      chat,
      messages: history,
    });
  } catch (error) {
    next(error);
  }
};

export const sendMessage = async (req, res, next) => {
  try {
    const rawContent = req.body?.content;
    const content = typeof rawContent === "string" ? rawContent.trim() : "";
    const uploadedFile = req.file || null;

    if (!content && !uploadedFile) {
      return res.status(400).json({
        error: "El mensaje debe tener texto o un PDF adjunto",
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.uid,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    let attachment = null;

    if (uploadedFile) {
      attachment = {
        id: path.parse(uploadedFile.filename).name,
        name: uploadedFile.originalname,
        type: "application/pdf",
        url: `/uploads/${uploadedFile.filename}`,
        size: uploadedFile.size,
      };

      console.log(
        `📎 PDF recibido: "${attachment.name}" (${Math.round(
          attachment.size / 1024,
        )} KB) → ${attachment.url}`,
      );
    } else {
      console.log(`💬 Mensaje de texto normal (${content.length} chars)`);
    }

    const agentInput =
      content ||
      (attachment
        ? `El usuario adjuntó un PDF llamado "${attachment.name}".`
        : "");

    const n8nMode = useN8nAgent();
    let assistantContent = "";
    let metadata = { title: "", url: "" };
    let modelUsed = "";

    if (n8nMode) {
      try {
        const n8nUrl =
          process.env.N8N_URL ||
          process.env.N8N_WEBHOOK_URL ||
          "http://n8n:5678/webhook/KimIA/chat";

        const webhookUrl = n8nUrl.includes("/webhook/")
          ? n8nUrl
          : `${n8nUrl.replace(/\/$/, "")}/webhook/KimIA/chat`;

        const response = await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: content,
            sessionId: chat._id.toString(),
            model: "qwen2.5:7b",
            attachment,
          }),
          signal: AbortSignal.timeout(600000),
        });

        if (!response.ok) throw new Error(`n8n HTTP ${response.status}`);
        const data = await response.json();
        assistantContent = data.response;
        modelUsed = "n8n";
      } catch (error) {
        console.error("Error al ejecutar el agente n8n:", error);
        return res.status(502).json({
          error: "No se pudo obtener una respuesta del agente n8n",
          details: error.message,
        });
      }
    } else {
      try {
        const result = await runAgent(agentInput);

        if (result.documentCount > 0) {
          const lastDoc = await ResearchDocument.findOne({
            researchId: result.researchId,
          }).sort({ createdAt: -1 });
          if (lastDoc) {
            assistantContent = lastDoc.content;
            metadata = { title: lastDoc.title, url: lastDoc.url };
          }
        }

        if (!assistantContent) {
          const research = await Research.findOne({
            researchId: result.researchId,
          });
          if (research) {
            assistantContent = research.agentNotes;
          } else {
            assistantContent =
              "No se pudo extraer información de la solicitud.";
          }
        }
        modelUsed = "agente-scraper";
      } catch (error) {
        console.error("Error al ejecutar el agente Node.js:", error);
        return res.status(502).json({
          error: "No se pudo obtener una respuesta del agente Node.js",
          details: error.message,
        });
      }
    }

    const userMessage = await Message.create({
      chatId: chat._id,
      role: "user",
      content,
      attachment,
    });

    const assistantMessage = await Message.create({
      chatId: chat._id,
      role: "assistant",
      content: assistantContent || "No se recibió respuesta del agente.",
    });

    await Response.create({
      messageId: assistantMessage._id,
      content: assistantContent,
      model: modelUsed,
    });

    if (chat.title === "Nuevo chat") {
      chat.title = (content || attachment?.name || "Nuevo chat").slice(0, 60);
    }

    chat.updatedAt = new Date();
    await chat.save();

    res.status(201).json({
      userMessage,
      response: {
        messageId: assistantMessage._id,
        content: assistantContent,
        model: modelUsed,
        metadata,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteChat = async (req, res, next) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      userId: req.user.uid,
    });

    if (!chat) {
      return res.status(404).json({ error: "Chat no encontrado" });
    }

    const messages = await Message.find({
      chatId: chat._id,
    }).select("_id");

    const messageIds = messages.map((message) => message._id);

    await Response.deleteMany({
      messageId: { $in: messageIds },
    });

    await Message.deleteMany({
      chatId: chat._id,
    });

    await Chat.findByIdAndDelete(chat._id);

    return res.status(200).json({
      message: "Chat eliminado correctamente",
      chatId: chat._id,
    });
  } catch (error) {
    next(error);
  }
};
