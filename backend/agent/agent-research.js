//Controla las 5 rondas: le pide a Ollama que piense, ejecuta la herramienta que elija
// (buscar o scrapear), guarda el contexto y al final manda todo a la base de datos.
import { randomUUID } from "node:crypto";
import { performance } from "node:perf_hooks";
import { CONFIG } from "../config/ollama.js";
import { logSection, logInfo, truncate, safeStringify } from "./agent-utils.js";
import {
  ollamaChatWithTimeout,
  cleanupOllama,
} from "../providers/ollama-provider.js";
import { executeTool, parseToolArguments } from "./agent-tools.js";
import { saveToMongoDB } from "../services/research.service.js";

async function runResearchPhase(state, userMessage) {
  const researchContext = [];
  const maxContextChars = 5500;
  let agentNotes = "";

  const buildConversation = () => {
    const visitedUrls = Array.from(state.visitedUrls).slice(-10);
    const context = researchContext.length
      ? researchContext.join("\n\n")
      : "Todavía no hay resultados de herramientas.";

    const content = [
      "Eres un asistente de investigación.",
      "OBJETIVO DEL USUARIO:",
      userMessage,
      "INSTRUCCIONES:",
      "Utiliza las herramientas disponibles si necesitas información externa.",
      "Si ya tienes información suficiente, termina la investigación con un resumen o la información extraída.",
      "RESULTADOS ANTERIORES:",
      context,
      visitedUrls.length ? `URLS YA VISITADAS:\n${visitedUrls.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return [{ role: "user", content }];
  };

  for (let round = 0; round < CONFIG.maxRounds; round++) {
    logSection(`FASE 1: RECOPILACIÓN ${round + 1}/${CONFIG.maxRounds}`);
    logInfo("Búsquedas", `${state.searchCount}/${CONFIG.maxSearchCalls}`);
    logInfo("Scrapeos", `${state.scrapeCount}/${CONFIG.maxScrapeCalls}`);
    logInfo("Documentos", state.documents.length);
    logInfo(
      "Motor búsqueda",
      state.tavilyExhausted ? "bing (tavily agotado)" : "tavily",
    );

    const conversation = buildConversation();
    console.log(
      "Contexto enviado a Ollama:",
      conversation[0].content.length,
      "caracteres.",
    );

    const roundT0 = performance.now();
    const response = await ollamaChatWithTimeout(
      CONFIG.researchModel,
      conversation,
      { timeoutMs: CONFIG.ollamaTimeout, enableTools: true, numPredict: 256 },
    );
    const roundDuration = Math.round(performance.now() - roundT0);
    const message = response.message;
    if (!message) throw new Error("Ollama devolvió una respuesta vacía.");

    const toolCalls = Array.isArray(message.tool_calls)
      ? message.tool_calls
      : [];
    logInfo("Ollama respondió en", `${roundDuration} ms`);
    logInfo("Tool calls", toolCalls.length);

    if (!toolCalls.length) {
      agentNotes = String(message.content || "").trim();
      logInfo("Agente decidió cerrar", "sí (sin tool calls)");
      if (agentNotes)
        logInfo("Notas del agente", `${agentNotes.length} caracteres`);
      break;
    }

    for (const call of toolCalls) {
      const toolName = call.function?.name;
      const args = parseToolArguments(call.function?.arguments);
      const result = toolName
        ? await executeTool(toolName, args, state)
        : "ERROR: llamada sin nombre.";
      const resultText =
        typeof result === "string" ? result : safeStringify(result);

      const contextEntry = [
        `RONDA: ${round + 1}`,
        `HERRAMIENTA: ${toolName || "unknown"}`,
        `ARGUMENTOS: ${safeStringify(args)}`,
        `RESULTADO:\n${truncate(resultText, CONFIG.maxToolResult)}`,
      ].join("\n");
      researchContext.push(contextEntry);

      let currentContextLength = researchContext.join("\n\n").length;
      while (
        currentContextLength > maxContextChars &&
        researchContext.length > 1
      ) {
        researchContext.shift();
        currentContextLength = researchContext.join("\n\n").length;
      }
    }
  }

  if (!agentNotes) {
    logSection("CIERRE DE RECOPILACIÓN");
    console.log(
      "El agente agotó las rondas sin emitir un mensaje final. Se armarán notas automáticas.",
    );
    const visitedUrls = Array.from(state.visitedUrls);
    agentNotes = [
      `OBJETIVO DE INVESTIGACIÓN:\n${userMessage}`,
      "RESULTADOS RECOPILADOS:",
      researchContext.length
        ? researchContext.join("\n\n")
        : "No se generaron resultados de herramientas.",
      visitedUrls.length ? `FUENTES VISITADAS:\n${visitedUrls.join("\n")}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");
  }

  return agentNotes;
}

export async function runAgent(userMessage) {
  const researchId = randomUUID();
  const startedAt = new Date().toISOString();

  logSection("AGENTE KIMIA");
  logInfo("Investigación", researchId);
  logInfo("Modelo de investigación", CONFIG.researchModel);
  logInfo("Usuario", CONFIG.userId);
  logInfo("Pregunta", userMessage);

  const state = {
    userMessage,
    searchCount: 0,
    scrapeCount: 0,
    visitedUrls: new Set(),
    searchedQueries: new Set(),
    documents: [],
    tavilyExhausted: false,
    lastSearchEngine: null,
  };

  try {
    const agentNotes = await runResearchPhase(state, userMessage);
    const finishedAt = new Date().toISOString();

    logSection("GUARDANDO EN MONGODB");
    const saved = await saveToMongoDB(
      researchId,
      userMessage,
      agentNotes,
      state,
      startedAt,
      finishedAt,
    );
    logInfo("Research guardado", saved.researchId);
    logInfo("Documentos guardados", saved.documentCount);

    logSection("NOTAS FINALES DEL AGENTE");
    console.log(agentNotes);

    logSection("RESULTADO GUARDADO");
    logInfo("MongoDB researchId", saved.researchId);
    logInfo("MongoDB documentos", saved.documentCount);

    return { researchId, documentCount: saved.documentCount };
  } finally {
    await cleanupOllama();
  }
}
