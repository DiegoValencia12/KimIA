//Busca URLs. Usa Tavily primero y, si falla o se
// agotan los créditos, se pasa a Bing por medio de n8n.
import { performance } from "node:perf_hooks";
import { CONFIG } from "../config/ollama.js";
import { logSection, logInfo, truncate, safeStringify } from "./agent-utils.js";

async function tavilySearch(query) {
  if (!CONFIG.tavilyApiKey)
    return {
      ok: false,
      reason: "no_api_key",
      content: "Tavily: falta TAVILY_API_KEY.",
    };

  const t0 = performance.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.tavilyTimeout);

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: CONFIG.tavilyApiKey,
        query,
        max_results: 10,
        search_depth: "basic",
      }),
      signal: controller.signal,
    });

    const duration = Math.round(performance.now() - t0);
    const rawBody = await response.text();

    if (!response.ok) {
      const quotaExhausted =
        response.status === 429 ||
        response.status === 432 ||
        /quota|usage|limit|exhausted|credit/i.test(rawBody);
      logSection("DIAGNÓSTICO TAVILY (ERROR)");
      logInfo("Query", query);
      logInfo("Status", response.status);
      logInfo("Duración", `${duration} ms`);
      logInfo("Cuota agotada", quotaExhausted ? "SÍ" : "no");
      logInfo("Preview", truncate(rawBody, 400));
      return {
        ok: false,
        reason: quotaExhausted ? "quota_exhausted" : "http_error",
        content: `Tavily HTTP ${response.status}: ${truncate(rawBody, 400)}`,
      };
    }

    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return {
        ok: false,
        reason: "bad_json",
        content: "Tavily: respuesta no es JSON.",
      };
    }

    const results = Array.isArray(parsed.results) ? parsed.results : [];

    logSection("DIAGNÓSTICO TAVILY");
    logInfo("Query", query);
    logInfo("Status", `${response.status} | OK: ${response.ok}`);
    logInfo("Duración", `${duration} ms`);
    logInfo("Resultados", results.length);

    if (!results.length)
      return {
        ok: true,
        content: "Tavily no devolvió resultados.",
        empty: true,
      };

    const formatted = results
      .map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}`)
      .join("\n\n");
    return {
      ok: true,
      content: `Resultados (${results.length}):\n\n${formatted}`,
    };
  } catch (error) {
    if (error.name === "AbortError")
      return {
        ok: false,
        reason: "timeout",
        content: `Tavily timeout (${CONFIG.tavilyTimeout} ms).`,
      };
    return {
      ok: false,
      reason: "fetch_error",
      content: `Tavily error: ${error.message}`,
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function callN8n(payload) {
  const url = `${CONFIG.n8nUrl}/webhook/kimia-tools`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CONFIG.n8nTimeout);
  const t0 = performance.now();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const duration = Math.round(performance.now() - t0);
    const rawBody = await response.text();
    let parsed;
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      parsed = rawBody;
    }

    logSection("DIAGNÓSTICO N8N (BING RSS)");
    logInfo("Action", payload.action);
    logInfo("Query", payload.query || "(sin query)");
    logInfo("Status", `${response.status} | OK: ${response.ok}`);
    logInfo("Duración", `${duration} ms`);
    logInfo("Preview", truncate(rawBody, CONFIG.diagnosticPreview));

    if (!response.ok)
      return `ERROR HTTP ${response.status} en n8n: ${truncate(rawBody, 500)}`;

    let content;
    if (typeof parsed === "string") content = parsed;
    else if (Array.isArray(parsed)) content = safeStringify(parsed);
    else if (parsed && typeof parsed === "object") {
      content =
        parsed.content ??
        parsed.data ??
        parsed.body ??
        parsed.text ??
        parsed.message ??
        parsed.error ??
        safeStringify(parsed);
      if (typeof content !== "string") content = safeStringify(content);
    } else content = String(parsed ?? "");

    content = String(content);
    if (content.length > CONFIG.maxToolResult)
      content = truncate(content, CONFIG.maxToolResult);
    if (!content.trim())
      return "La herramienta de búsqueda no devolvió contenido útil.";
    return content;
  } catch (error) {
    if (error.name === "AbortError")
      return `ERROR: timeout n8n (${CONFIG.n8nTimeout} ms).`;
    return `ERROR n8n: ${error.message}`;
  } finally {
    clearTimeout(timeout);
  }
}

export async function searchWeb(query, state) {
  if (!state.tavilyExhausted) {
    const tavily = await tavilySearch(query);
    if (tavily.ok && !tavily.empty) {
      state.lastSearchEngine = "tavily";
      return tavily.content;
    }
    if (tavily.reason === "quota_exhausted") {
      state.tavilyExhausted = true;
      console.log(
        "[BÚSQUEDA] Cuota de Tavily agotada. A partir de ahora se usará Bing RSS (n8n).",
      );
    } else if (tavily.reason === "no_api_key") {
      state.tavilyExhausted = true;
      console.log("[BÚSQUEDA] Sin TAVILY_API_KEY. Se usará Bing RSS (n8n).");
    } else if (tavily.ok && tavily.empty) {
      console.log(
        "[BÚSQUEDA] Tavily devolvió 0 resultados. Se usará Bing RSS (n8n) para esta query.",
      );
    } else {
      console.log(
        `[BÚSQUEDA] Tavily falló (${tavily.reason}). Se usará Bing RSS (n8n) para esta query.`,
      );
    }
  }
  state.lastSearchEngine = "bing";
  return await callN8n({ action: "search", query });
}
