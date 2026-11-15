import Research from "../models/Research.js";
import ResearchDocument from "../models/ResearchDocument.js";
import { CONFIG } from "../config/ollama.js";
import { truncate } from "../agent/agent-utils.js";

export async function saveToMongoDB(
  researchId,
  userMessage,
  agentNotes,
  state,
  startedAt,
  finishedAt,
) {
  const researchData = {
    researchId,
    userId: CONFIG.userId,
    query: userMessage,
    title: truncate(userMessage, 120),
    status: "collected",
    documentCount: state.documents.length,
    agentNotes,
    result: agentNotes,
    error: "",
    startedAt: new Date(startedAt),
    collectedAt: new Date(finishedAt),
    completedAt: new Date(finishedAt),
  };

  const documentsData = state.documents.map((doc) => ({
    researchId,
    userId: CONFIG.userId,
    title: doc.title || "",
    url: doc.url,
    finalUrl: doc.finalUrl || "",
    source: doc.source || "",
    content: doc.content,
    contentType: doc.contentType || "text/html",
    status: "collected",
    metadata: doc.metadata || {},
  }));

  await ResearchDocument.deleteMany({ researchId });
  await Research.deleteOne({ researchId });

  const savedResearch = await Research.create(researchData);

  if (documentsData.length > 0) {
    await ResearchDocument.insertMany(documentsData);
  }

  return {
    researchId: savedResearch.researchId,
    documentCount: documentsData.length,
  };
}
