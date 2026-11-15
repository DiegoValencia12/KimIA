import { getOllamaConfig } from "../config/ollama.js";
import { tools } from "../agent/agent-tools.js";

let activeOllamaModel = null;

export const generateOllamaResponse = async (messages) => {
  const { url, model } = getOllamaConfig();

  const response = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      stream: false,
      messages,
      options: {
        temperature: 0.7,
      },
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Ollama respondió con HTTP ${response.status}: ${details}`);
  }

  const data = await response.json();
  const content = data.message?.content?.trim();

  if (!content) {
    throw new Error("Ollama devolvió una respuesta vacía");
  }

  return {
    content,
    model,
  };
};

export async function cleanupOllama() {
  if (activeOllamaModel) {
    try {
      await fetch(`${getOllamaConfig().url}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: activeOllamaModel,
          prompt: "",
          stream: false,
          keep_alive: 0,
        }),
        signal: AbortSignal.timeout(30000),
      });
      console.log(
        `[OLLAMA] Modelo ${activeOllamaModel} descargado de memoria.`,
      );
      activeOllamaModel = null;
    } catch (error) {
      console.warn(
        `[OLLAMA] No se pudo confirmar la descarga: ${error.message}`,
      );
    }
  }
}

export async function ollamaChatWithTimeout(
  model,
  messages,
  {
    timeoutMs = 600000,
    enableTools = false,
    numPredict = 700,
    keepAlive = "5m",
    temperature = 0.1,
  } = {},
) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const { url } = getOllamaConfig();

  const payload = {
    model,
    messages,
    stream: false,
    think: false,
    keep_alive: keepAlive,
    options: {
      temperature,
      num_predict: numPredict,
      num_ctx: 4096,
    },
  };
  if (enableTools) payload.tools = tools;

  try {
    const response = await fetch(`${url}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    const raw = await response.text();
    if (!response.ok)
      throw new Error(`Ollama HTTP ${response.status}: ${raw.slice(0, 1000)}`);
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
