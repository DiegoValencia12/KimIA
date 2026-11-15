import { scrapePage } from "../agent/agent-scraper.js";

export const scrapeUrl = async (req, res, next) => {
  try {
    let { url } = req.body;

    console.log("[DEBUG N8N] Body recibido:", JSON.stringify(req.body));
    console.log("[DEBUG N8N] URL extraída:", url);

    if (!url) return res.status(400).json({ error: "Falta la URL" });

    if (typeof url === "string") {
      url = url.replace(/^["']|["']$/g, "").trim();
    }

    const page = await scrapePage(url);

    res.json({
      title: page.title,
      url: page.finalUrl,
      content: page.content,
    });
  } catch (error) {
    console.log("[DEBUG N8N] Error:", error.message);
    res.status(500).json({ error: error.message });
  }
};
