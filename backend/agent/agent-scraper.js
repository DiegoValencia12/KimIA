// Va a internet. Recibe una URL, descarga el HTML y se lo pasa a Trafilatura (Python)
//  para que saque el texto limpio.

import https from "node:https";
import http from "node:http";
import dns from "node:dns/promises";
import net from "node:net";
import { gunzipSync, inflateSync, brotliDecompressSync } from "node:zlib";
import { spawn } from "node:child_process";
import { truncate, decodeEntities } from "./agent-utils.js";
import { CONFIG } from "../config/ollama.js";

function isPrivateAddress(address) {
  const ip = String(address).toLowerCase().split("%")[0];
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 192 && b === 0) ||
      (a === 198 && (b === 18 || b === 19)) ||
      (a === 198 && b === 51) ||
      (a === 203 && b === 0) ||
      a >= 224
    );
  }
  if (family === 6) {
    if (ip === "::" || ip === "::1") return true;
    if (ip.startsWith("::ffff:")) {
      const mapped = ip.slice(7);
      if (net.isIP(mapped) === 4) return isPrivateAddress(mapped);
    }
    return (
      ip.startsWith("fc") ||
      ip.startsWith("fd") ||
      /^fe[89ab]/.test(ip) ||
      ip.startsWith("ff") ||
      ip.startsWith("2001:db8:")
    );
  }
  return true;
}

async function resolvePublicHost(hostname) {
  const host = String(hostname)
    .replace(/^\[|\]$/g, "")
    .toLowerCase();
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    throw new Error("Destino local o privado bloqueado.");
  }
  const addresses = await dns.lookup(host, { all: true, verbatim: true });
  if (
    !addresses.length ||
    addresses.some((entry) => isPrivateAddress(entry.address))
  ) {
    throw new Error(
      "El destino resuelve a una dirección privada o no pública; se bloqueó por seguridad.",
    );
  }
  return addresses;
}

function createPinnedLookup(addresses) {
  return (hostname, options, callback) => {
    let opts = options;
    let cb = callback;
    if (typeof opts === "function") {
      cb = opts;
      opts = {};
    }
    process.nextTick(() => {
      if (opts?.all) cb(null, addresses);
      else cb(null, addresses[0].address, addresses[0].family);
    });
  };
}

function isWeakDhError(error) {
  const message = `${error?.code || ""} ${error?.message || ""}`;
  return /dh key too small|dh_key_too_small|tls_process_ske_dhe/i.test(message);
}

function decodeResponseBody(buffer, contentEncoding = "") {
  const encoding = String(contentEncoding).toLowerCase().trim();
  if (!encoding || encoding === "identity") {
    if (buffer.length > CONFIG.maxResponseBytes)
      throw new Error(
        `El contenido supera el límite de ${CONFIG.maxResponseBytes} bytes.`,
      );
    return buffer.toString("utf8");
  }
  const options = { maxOutputLength: CONFIG.maxResponseBytes };
  let decoded;
  try {
    if (encoding === "gzip" || encoding === "x-gzip")
      decoded = gunzipSync(buffer, options);
    else if (encoding === "deflate") decoded = inflateSync(buffer, options);
    else if (encoding === "br") decoded = brotliDecompressSync(buffer, options);
    else throw new Error(`Codificación HTTP no compatible: ${encoding}`);
  } catch (error) {
    if (error.code === "ERR_BUFFER_TOO_LARGE")
      throw new Error(
        `El contenido descomprimido supera el límite de ${CONFIG.maxResponseBytes} bytes.`,
      );
    throw error;
  }
  return decoded.toString("utf8");
}

async function requestPageOnce(url, relaxedTls = false) {
  const parsed = new URL(url);
  const protocol = parsed.protocol;
  const port = Number(parsed.port || (protocol === "https:" ? 443 : 80));
  if (![80, 443].includes(port))
    throw new Error("Por seguridad, solo se permiten los puertos 80 y 443.");

  const addresses = await resolvePublicHost(parsed.hostname);
  const lookup = createPinnedLookup(addresses);
  const isHttps = protocol === "https:";
  const agent = isHttps
    ? new https.Agent({
        keepAlive: false,
        rejectUnauthorized: true,
        minVersion: "TLSv1.2",
        ...(relaxedTls ? { ciphers: "DEFAULT@SECLEVEL=1" } : {}),
      })
    : new http.Agent({ keepAlive: false });

  const transport = isHttps ? https : http;
  const hostname = parsed.hostname.replace(/^\[|\]$/g, "");

  try {
    return await new Promise((resolve, reject) => {
      const request = transport.request(
        parsed,
        {
          method: "GET",
          agent,
          lookup,
          servername: isHttps && !net.isIP(hostname) ? hostname : undefined,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,text/plain;q=0.8,*/*;q=0.7",
            "Accept-Language": "es-MX,es;q=0.9,en;q=0.7",
            "Accept-Encoding": "identity",
            Connection: "close",
          },
        },
        (response) => {
          const chunks = [];
          let totalBytes = 0;
          response.on("data", (chunk) => {
            totalBytes += chunk.length;
            if (totalBytes > CONFIG.maxResponseBytes) {
              request.destroy(
                new Error(
                  `La página supera el límite de ${CONFIG.maxResponseBytes} bytes.`,
                ),
              );
              return;
            }
            chunks.push(chunk);
          });
          response.on("end", () => {
            resolve({
              statusCode: response.statusCode || 0,
              headers: response.headers,
              body: decodeResponseBody(
                Buffer.concat(chunks),
                response.headers["content-encoding"],
              ),
              tlsMode: relaxedTls ? "SECLEVEL=1" : "TLS normal",
            });
          });
          response.on("aborted", () =>
            reject(
              new Error(
                "La conexión se interrumpió antes de completar la respuesta.",
              ),
            ),
          );
          response.on("error", reject);
        },
      );
      request.setTimeout(CONFIG.scrapeTimeout, () =>
        request.destroy(
          new Error(`Timeout de descarga (${CONFIG.scrapeTimeout} ms).`),
        ),
      );
      request.on("error", reject);
      request.end();
    });
  } finally {
    agent.destroy();
  }
}

async function downloadPage(initialUrl) {
  let currentUrl = new URL(initialUrl);
  for (let redirect = 0; redirect <= CONFIG.maxRedirects; redirect++) {
    if (!["http:", "https:"].includes(currentUrl.protocol))
      throw new Error("La redirección intentó usar un protocolo no permitido.");
    let response;
    try {
      response = await requestPageOnce(currentUrl.href, false);
    } catch (error) {
      if (!isWeakDhError(error) || currentUrl.protocol !== "https:")
        throw error;
      console.log(
        "[TLS] DH débil detectado. Reintentando esta URL con SECLEVEL=1 y certificado verificado.",
      );
      response = await requestPageOnce(currentUrl.href, true);
    }
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      const location = response.headers.location;
      if (!location)
        throw new Error(`HTTP ${response.statusCode} sin encabezado Location.`);
      if (redirect === CONFIG.maxRedirects)
        throw new Error("Se superó el límite de redirecciones.");
      currentUrl = new URL(location, currentUrl);
      continue;
    }
    return { url: currentUrl.href, ...response };
  }
  throw new Error("No se pudo completar la descarga.");
}

function extractHtmlTitle(html) {
  const match = String(html || "").match(/<title\b[^>]*>([\s\S]*?)<\/title>/i);
  return match
    ? decodeEntities(match[1].replace(/<[^>]+>/g, " "))
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

async function extractWithTrafilatura(html, url) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(CONFIG.pythonBin, [CONFIG.trafilaturaScript, url], {
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout = [];
    const stderr = [];
    let stdoutLength = 0;
    let stderrLength = 0;
    let settled = false;

    const finish = (error, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) rejectPromise(error);
      else resolvePromise(result);
    };

    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(
        new Error(
          `Trafilatura superó el tiempo límite de ${CONFIG.pythonTimeout} ms.`,
        ),
      );
    }, CONFIG.pythonTimeout);

    child.stdout.on("data", (chunk) => {
      stdoutLength += chunk.length;
      if (stdoutLength > CONFIG.maxExtractedCharsPerDocument * 8) {
        child.kill("SIGKILL");
        finish(
          new Error("La salida de Trafilatura superó el límite permitido."),
        );
        return;
      }
      stdout.push(chunk);
    });

    child.stderr.on("data", (chunk) => {
      if (stderrLength >= 5000) return;
      const remaining = 5000 - stderrLength;
      const part = chunk.subarray(0, remaining);
      stderr.push(part);
      stderrLength += part.length;
    });

    child.on("error", (error) => finish(error));

    child.on("close", (code) => {
      if (settled) return;
      const errorText = Buffer.concat(stderr).toString("utf8").trim();
      if (code !== 0) {
        finish(
          new Error(
            `Trafilatura terminó con código ${code}: ${truncate(errorText, 1000)}`,
          ),
        );
        return;
      }
      try {
        const parsed = JSON.parse(Buffer.concat(stdout).toString("utf8"));
        const content = String(parsed.content || "").trim();
        if (!content) {
          finish(new Error("Trafilatura no pudo extraer contenido principal."));
          return;
        }
        finish(null, truncate(content, CONFIG.maxExtractedCharsPerDocument));
      } catch (error) {
        finish(
          new Error(`Respuesta inválida de Trafilatura: ${error.message}`),
        );
      }
    });

    child.stdin.on("error", (error) => {
      if (error.code !== "EPIPE") finish(error);
    });
    child.stdin.end(String(html || ""), "utf8");
  });
}

export async function scrapePage(url) {
  const response = await downloadPage(url);
  const title = extractHtmlTitle(response.body);
  const content = await extractWithTrafilatura(response.body, response.url);
  const contentType = response.headers["content-type"] || "desconocido";

  return {
    requestedUrl: url,
    finalUrl: response.url,
    statusCode: response.statusCode,
    tlsMode: response.tlsMode,
    title,
    contentType,
    content,
    htmlLength: Buffer.byteLength(response.body, "utf8"),
  };
}
