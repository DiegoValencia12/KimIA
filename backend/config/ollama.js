import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));

// configuracion de ollama y n8n
export const getOllamaConfig = () => ({
  url: (process.env.OLLAMA_URL || "http://localhost:11434").replace(/\/+$/, ""),

  model: process.env.KIMIA_RESEARCH_MODEL || "qwen2.5:7b",

  systemPrompt: process.env.AI_SYSTEM_PROMPT?.trim() || "",

  summaryPrompt:
    process.env.AI_SUMMARY_PROMPT?.trim() ||
    "Resume la conversación conservando los datos importantes, preferencias, objetivos y decisiones. No inventes información. Devuelve únicamente el resumen.",
});

export const useN8nAgent = () =>
  String(process.env.USE_N8N_AGENT).toLowerCase() === "true";

export const getN8nConfig = () => ({
  webhookUrl:
    process.env.N8N_WEBHOOK_URL || "http://n8n:5678/webhook/KimIA/chat",
});

// configuracion del agente scraping
export const CONFIG = {
  // Reutilizamos la URL de Ollama y n8n
  ollamaHost: (process.env.OLLAMA_URL || "http://ollama:11434").replace(
    /\/+$/,
    "",
  ),
  n8nUrl: (process.env.N8N_URL || "http://n8n:5678").replace(/\/+$/, ""),

  // Variables específicas del scraper
  tavilyApiKey: process.env.TAVILY_API_KEY,
  userId:
    process.env.KIMIA_USER_ID || process.env.USER_ID || "local-agent-test",
  researchModel: process.env.OLLAMA_MODEL || "llama3.1:8b",
  pythonBin: process.env.PYTHON_BIN || "/opt/trafilatura/bin/python",
  trafilaturaScript: resolve(
    SCRIPT_DIR,
    "../services/trafilatura-extractor.py",
  ),
  maxRounds: 5,
  maxSearchCalls: 4,
  maxScrapeCalls: 5,
  tavilyTimeout: 20000,
  n8nTimeout: 30000,
  ollamaTimeout: 600000,
  scrapeTimeout: 25000,
  pythonTimeout: 30000,
  maxToolResult: 1500,
  pagePreview: 1000,
  maxResponseBytes: 2000000,
  maxExtractedCharsPerDocument: 30000,
  maxRedirects: 5,
  diagnosticPreview: 700,
  ollamaKeepAlive: "5m",
  ollamaContext: 4096,
  mongoUri: process.env.MONGODB_URI || "",
};
