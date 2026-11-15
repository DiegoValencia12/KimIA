//Habla con Ollama. Le manda los mensajes al modelo, recibe las respuestas y lo saca de la RAM cuando ya no se usa.

import { CONFIG } from "../config/ollama.js";
import { truncate } from "./agent-utils.js";
import { tools } from "./agent-tools.js";

let activeOllamaModel = null;

async function unloadOllamaModel(model = activeOllamaModel) {
  if (!model) return true;
  try {
    const response = await fetch(`${CONFIG.ollamaHost}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, prompt: "", stream: false, keep_alive: 0 }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    await response.text();
    if (activeOllamaModel === model) activeOllamaModel = null;
    console.log(`[OLLAMA] Modelo ${model} descargado de memoria.`);
    return true;
  } catch (error) {
    console.warn(
      `[OLLAMA] No se pudo confirmar la descarga de ${model}: ${error.message}`,
    );
    return false;
  }
}

export async function ollamaChatWithTimeout(
  model,
  messages,
  {
    timeoutMs = CONFIG.ollamaTimeout,
    enableTools = false,
    numPredict = 700,
    keepAlive = CONFIG.ollamaKeepAlive,
    temperature = 0.1,
  } = {},
) {
  if (activeOllamaModel && activeOllamaModel !== model) {
    const unloaded = await unloadOllamaModel(activeOllamaModel);
    if (!unloaded) throw new Error(`No se pudo liberar ${activeOllamaModel}`);
  }
  activeOllamaModel = model;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const payload = {
    model,
    messages,
    stream: false,
    think: false,
    keep_alive: keepAlive,
    options: {
      temperature,
      num_predict: numPredict,
      num_ctx: CONFIG.ollamaContext,
    },
  };
  if (enableTools) payload.tools = tools;

  try {
    const response = await fetch(`${CONFIG.ollamaHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const raw = await response.text();
    if (!response.ok)
      throw new Error(`Ollama HTTP ${response.status}: ${truncate(raw, 1000)}`);
    const parsed = JSON.parse(raw);
    if (!parsed.message)
      throw new Error("Ollama devolvió una respuesta sin message.");
    return parsed;
  } catch (error) {
    if (error.name === "AbortError")
      throw new Error(
        `Timeout de Ollama (${model}): ${timeoutMs} ms sin respuesta.`,
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function cleanupOllama() {
  if (activeOllamaModel) await unloadOllamaModel(activeOllamaModel);
}
