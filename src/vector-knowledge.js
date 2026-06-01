import { createEmbedding, isEmbeddingConfigured } from "./embeddings.js";
import { retrieveRelevantChunks } from "./knowledge.js";
import { supabase } from "./supabase.js";

const KNOWLEDGE_MATCH_RPC = process.env.SUPABASE_KNOWLEDGE_MATCH_RPC || "match_knowledge_chunks";
const VECTOR_MATCH_COUNT = Number(process.env.VECTOR_KNOWLEDGE_MATCH_COUNT || 6);
const VECTOR_MIN_SIMILARITY = Number(process.env.VECTOR_KNOWLEDGE_MIN_SIMILARITY || 0.25);
const VECTOR_ENABLED = process.env.VECTOR_KNOWLEDGE_ENABLED !== "false";

export function isVectorKnowledgeConfigured() {
  return Boolean(VECTOR_ENABLED && supabase && isEmbeddingConfigured());
}

export async function retrieveHybridRelevantChunks(chunks, query, limit = 4) {
  const keywordMatches = retrieveRelevantChunks(chunks, query, limit);
  const vectorMatches = await retrieveVectorRelevantChunks(query, limit);

  return mergeMatches(vectorMatches, keywordMatches, limit);
}

async function retrieveVectorRelevantChunks(query, limit) {
  if (!isVectorKnowledgeConfigured()) return [];

  try {
    const embedding = await createEmbedding(query);
    const { data, error } = await supabase.rpc(KNOWLEDGE_MATCH_RPC, {
      query_embedding: embedding,
      match_count: Math.max(VECTOR_MATCH_COUNT, limit),
      min_similarity: VECTOR_MIN_SIMILARITY
    });

    if (error) {
      console.error("Supabase vector knowledge search failed:", error);
      return [];
    }

    return (data ?? []).map((row) => ({
      id: row.id,
      source: row.source,
      title: row.title,
      content: row.content,
      sourceUrls: row.source_urls ?? row.sourceUrls ?? [],
      metadata: row.metadata ?? {},
      score: Number(row.similarity ?? 0) * 12,
      vectorSimilarity: Number(row.similarity ?? 0)
    }));
  } catch (error) {
    console.error("Vector knowledge search failed:", error);
    return [];
  }
}

function mergeMatches(vectorMatches, keywordMatches, limit) {
  const merged = new Map();

  for (const chunk of [...vectorMatches, ...keywordMatches]) {
    const existing = merged.get(chunk.id);
    if (!existing || Number(chunk.score ?? 0) > Number(existing.score ?? 0)) {
      merged.set(chunk.id, chunk);
    }
  }

  return [...merged.values()]
    .sort((a, b) => Number(b.score ?? 0) - Number(a.score ?? 0))
    .slice(0, limit);
}
