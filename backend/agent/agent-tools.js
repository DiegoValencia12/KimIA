// Define las herramientas que Ollama
// puede usar y contiene el código que las ejecuta cuando el modelo las pide.
// proximamente se agregaran mas
import { performance } from "node:perf_hooks";
import { CONFIG } from "../config/ollama.js";
import {
  logSection,
  logInfo,
  truncate,
  safeStringify,
  filterByRelevance,
} from "./agent-utils.js";
import { scrapePage } from "./agent-scraper.js";
import { searchWeb } from "./agent-search.js";

export const tools = [
  {
    type: "function",
    function: {
      name: "search_web",
      description:
        "Busca en internet y devuelve resultados con título y URL. Utiliza consultas concretas y variadas cuando sea necesario.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Consulta de búsqueda." },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "scrape_url",
      description:
        "Descarga una página HTTP/HTTPS pública y extrae su contenido principal con Trafilatura. Devuelve el estado HTTP, URL final, título y contenido. No consultes repetidamente una URL ya visitada.",
      parameters: {
        type: "object",
        properties: {
          url: { type: "string", description: "URL completa HTTP o HTTPS." },
        },
        required: ["url"],
      },
    },
  },
];

export function parseToolArguments(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
  return {};
}

export async function executeTool(name, args, state) {
  logSection(`EJECUTANDO TOOL: ${name}`);
  console.log("Argumentos:", safeStringify(args));
  const t0 = performance.now();

  switch (name) {
    case "search_web": {
      if (!args || typeof args.query !== "string" || !args.query.trim())
        return "ERROR: search_web requiere 'query'.";
      if (state.searchCount >= CONFIG.maxSearchCalls)
        return "LÍMITE DE BÚSQUEDAS ALCANZADO. Continúa con las fuentes ya recopiladas.";

      const normalizedQuery = args.query.trim().toLowerCase();
      if (!state.searchedQueries) state.searchedQueries = new Set();
      if (state.searchedQueries.has(normalizedQuery))
        return `Ya buscaste exactamente "${args.query}". No repitas. Reformula con palabras distintas, sinónimos, o el nombre técnico del trámite.`;
      state.searchedQueries.add(normalizedQuery);
      state.searchCount++;

      const rawResult = await searchWeb(args.query.trim(), state);
      const result = filterByRelevance(
        rawResult,
        args.query.trim(),
        state.userMessage || "",
      );

      const duration = Math.round(performance.now() - t0);
      logSection("RESULTADO BÚSQUEDA WEB");
      logInfo("Motor", state.lastSearchEngine || "desconocido");
      logInfo("Tavily agotado", state.tavilyExhausted ? "SÍ" : "no");
      logInfo("Duración total", `${duration} ms`);
      logInfo(
        "Búsquedas usadas",
        `${state.searchCount}/${CONFIG.maxSearchCalls}`,
      );
      const rawCount = rawResult
        .split("\n")
        .filter((l) => /^\d+\./.test(l)).length;
      const filteredCount = result
        .split("\n")
        .filter((l) => /^\d+\./.test(l)).length;
      logInfo("Resultados crudos", rawCount);
      logInfo("Resultados tras filtro", filteredCount);
      console.log(result);

      return result;
    }

    case "scrape_url": {
      if (!args || typeof args.url !== "string" || !args.url.trim())
        return "ERROR: scrape_url requiere 'url'.";

      let url;
      try {
        url = new URL(args.url.trim());
      } catch {
        return "ERROR: URL inválida.";
      }
      if (!["http:", "https:"].includes(url.protocol))
        return "ERROR: Solo HTTP/HTTPS.";
      if (url.username || url.password)
        return "ERROR: No se permiten credenciales dentro de la URL.";

      const normalizedUrl = url.href.split("#")[0];
      if (state.visitedUrls.has(normalizedUrl))
        return "URL YA CONSULTADA. No la repitas; utiliza otra fuente.";
      if (state.scrapeCount >= CONFIG.maxScrapeCalls)
        return "LÍMITE DE PÁGINAS ALCANZADO. Utiliza las fuentes recopiladas.";

      state.visitedUrls.add(normalizedUrl);
      state.scrapeCount++;

      try {
        const page = await scrapePage(normalizedUrl);
        const duration = Math.round(performance.now() - t0);

        if (page.statusCode < 200 || page.statusCode >= 300) {
          const errResult = [
            `ERROR HTTP ${page.statusCode}`,
            `URL: ${page.finalUrl}`,
            `Título: ${page.title || "no disponible"}`,
            truncate(page.content, 900),
          ].join("\n");
          logSection("RESULTADO SCRAPE (ERROR)");
          logInfo("Duración", `${duration} ms`);
          logInfo(
            "Scrapeos usados",
            `${state.scrapeCount}/${CONFIG.maxScrapeCalls}`,
          );
          console.log(errResult);
          return errResult;
        }

        if (page.content.length < 80) {
          const errResult = [
            "La página se descargó, pero no contiene suficiente texto extraíble.",
            `HTTP: ${page.statusCode}`,
            `URL: ${page.finalUrl}`,
            `Título: ${page.title || "no disponible"}`,
            `HTML recibido: ${page.htmlLength} caracteres`,
          ].join("\n");
          logSection("RESULTADO SCRAPE (SIN TEXTO)");
          logInfo("Duración", `${duration} ms`);
          logInfo(
            "Scrapeos usados",
            `${state.scrapeCount}/${CONFIG.maxScrapeCalls}`,
          );
          console.log(errResult);
          return errResult;
        }

        state.documents.push({
          title: page.title || "",
          url: page.requestedUrl,
          finalUrl: page.finalUrl,
          source: new URL(page.finalUrl).hostname,
          content: page.content,
          contentType: page.contentType,
          status: "collected",
          metadata: {
            httpStatus: page.statusCode,
            tlsMode: page.tlsMode,
            htmlLength: page.htmlLength,
            textLength: page.content.length,
            collectedAt: new Date().toISOString(),
          },
        });

        const preview = truncate(page.content, CONFIG.pagePreview);
        const result = [
          "PÁGINA DESCARGADA.",
          `Título: ${page.title || "Sin título"}`,
          `URL original: ${normalizedUrl}`,
          `URL final: ${page.finalUrl}`,
          `Texto extraído: ${page.content.length} caracteres.`,
          "Vista previa del contenido:",
          preview,
        ].join("\n");

        logSection("RESULTADO SCRAPE");
        logInfo("Duración", `${duration} ms`);
        logInfo("HTML original", `${page.htmlLength} caracteres`);
        logInfo("Texto extraído", `${page.content.length} caracteres`);
        logInfo(
          "Scrapeos usados",
          `${state.scrapeCount}/${CONFIG.maxScrapeCalls}`,
        );
        logInfo("Documentos en memoria", `${state.documents.length}`);
        console.log(preview);
        console.log(
          `\n[Scrape completo] ${page.content.length} caracteres extraídos de ${page.finalUrl}`,
        );

        return result;
      } catch (error) {
        const duration = Math.round(performance.now() - t0);
        const result = `ERROR AL DESCARGAR ${normalizedUrl}: ${error.message}`;
        logSection("RESULTADO SCRAPE (EXCEPCIÓN)");
        logInfo("Duración", `${duration} ms`);
        console.log(result);
        return result;
      }
    }
    default:
      return `ERROR: Herramienta no implementada: ${name}`;
  }
}
