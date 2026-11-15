//logs de consola, cortar texto largo, limpiar caracteres raros y el filtro que descarta la basura que devuelve el buscador.

export function logSection(title) {
  console.log("\n" + "=".repeat(65));
  console.log(` ${title}`);
  console.log("=".repeat(65));
}

export function logInfo(label, value) {
  console.log(`  ${label}: ${value}`);
}

export function truncate(value, max) {
  const s = String(value ?? "");
  return s.length <= max
    ? s
    : s.slice(0, max) + `\n[TRUNCADO: ${s.length - max} más]`;
}

export function safeStringify(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function decodeEntities(value) {
  const named = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    nbsp: " ",
    quot: '"',
    copy: "©",
    reg: "®",
    ndash: "–",
    mdash: "—",
    hellip: "…",
  };
  return String(value ?? "").replace(
    /&(#x[\da-f]+|#\d+|[a-z]+);/gi,
    (match, entity) => {
      if (entity[0] !== "#") return named[entity.toLowerCase()] ?? match;
      const hex = entity[1]?.toLowerCase() === "x";
      const number = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(number) || number < 0 || number > 0x10ffff)
        return " ";
      try {
        return String.fromCodePoint(number);
      } catch {
        return " ";
      }
    },
  );
}

export function filterByRelevance(resultText, query, userMessage) {
  if (typeof resultText !== "string") return resultText;
  if (!resultText.startsWith("Resultados (")) return resultText;

  const lines = resultText.split("\n");
  const results = [];
  let current = null;

  for (const line of lines) {
    if (/^\d+\.\s/.test(line)) {
      if (current) results.push(current);
      current = { title: line.replace(/^\d+\.\s*/, "").trim(), url: "" };
    } else if (current && /^\s+https?:\/\//.test(line)) {
      current.url = line.trim();
    }
  }
  if (current) results.push(current);
  if (!results.length) return resultText;

  const stopwords = new Set([
    "el",
    "la",
    "los",
    "las",
    "un",
    "una",
    "unos",
    "unas",
    "lo",
    "al",
    "de",
    "del",
    "en",
    "con",
    "por",
    "para",
    "a",
    "ante",
    "bajo",
    "contra",
    "desde",
    "durante",
    "entre",
    "hacia",
    "hasta",
    "mediante",
    "sin",
    "sobre",
    "tras",
    "y",
    "o",
    "e",
    "u",
    "que",
    "ni",
    "pero",
    "sino",
    "porque",
    "pues",
    "mi",
    "tu",
    "su",
    "mis",
    "tus",
    "sus",
    "me",
    "te",
    "se",
    "nos",
    "le",
    "les",
    "este",
    "esta",
    "esto",
    "estos",
    "estas",
    "ese",
    "esa",
    "eso",
    "esos",
    "esas",
    "busca",
    "buscar",
    "encuentra",
    "encontrar",
    "dame",
    "dar",
    "quiero",
    "necesito",
    "saber",
    "conocer",
    "obtener",
    "muestra",
    "mostrar",
    "más",
    "mas",
    "muy",
    "también",
    "tambien",
    "tampoco",
    "aquí",
    "aqui",
    "allí",
    "alli",
    "ya",
    "no",
    "si",
    "sí",
    "the",
    "and",
    "or",
    "of",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
  ]);

  const normalize = (s) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const stem = (t) => {
    if (t.length >= 6 && t.endsWith("es")) return t.slice(0, -2);
    if (t.length >= 5 && t.endsWith("s")) return t.slice(0, -1);
    return t;
  };

  const combined = normalize(`${userMessage || ""} ${query || ""}`);
  const tokens = [
    ...new Set(
      combined
        .split(/\s+/)
        .map((t) => t.replace(/[.,;:!?()"']/g, ""))
        .filter(Boolean)
        .filter((t) => !stopwords.has(t) && t.length >= 3)
        .map(stem),
    ),
  ];

  if (!tokens.length) return resultText;

  const docTexts = results.map((r) => normalize(`${r.title} ${r.url}`));

  const scored = results.map((r, i) => {
    const text = docTexts[i];
    const hits = tokens.filter((t) => text.includes(t)).length;
    return { ...r, hits };
  });

  scored.sort((a, b) => b.hits - a.hits);

  const top = scored.filter((r) => r.hits >= 1).slice(0, 5);

  if (!top.length) {
    return `Sin resultados relevantes para "${query}". El buscador devolvió ${results.length} resultados pero ninguno menciona los términos de tu búsqueda. Intenta con otras palabras.`;
  }

  return `Resultados (${top.length}):\n\n${top.map((r, i) => `${i + 1}. ${r.title}\n   ${r.url}`).join("\n\n")}`;
}
