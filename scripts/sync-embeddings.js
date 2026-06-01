import "dotenv/config";
import crypto from "node:crypto";
import { createEmbeddings, OPENAI_EMBEDDING_MODEL } from "../src/embeddings.js";
import { loadKnowledge } from "../src/knowledge.js";
import { supabase } from "../src/supabase.js";

const KNOWLEDGE_TABLE = process.env.SUPABASE_KNOWLEDGE_TABLE || "knowledge_chunks";
const EMBEDDING_BATCH_SIZE = Number(process.env.EMBEDDING_BATCH_SIZE || 64);
const UPSERT_BATCH_SIZE = Number(process.env.KNOWLEDGE_UPSERT_BATCH_SIZE || 100);

async function main() {
  if (!supabase) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required to sync embeddings.");
  }

  const chunks = await loadKnowledge();
  const rows = [];

  for (let index = 0; index < chunks.length; index += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(index, index + EMBEDDING_BATCH_SIZE);
    const embeddings = await createEmbeddings(batch.map(formatEmbeddingInput));

    rows.push(
      ...batch.map((chunk, batchIndex) => ({
        id: chunk.id,
        source: chunk.source,
        title: chunk.title,
        content: chunk.content,
        source_urls: chunk.sourceUrls ?? [],
        metadata: {
          topic: sourceToTopic(chunk.source),
          embeddingModel: OPENAI_EMBEDDING_MODEL,
          contentHash: hashContent(chunk.content)
        },
        embedding: embeddings[batchIndex],
        updated_at: new Date().toISOString()
      }))
    );

    console.log(`Embedded ${Math.min(index + batch.length, chunks.length)} / ${chunks.length} chunks`);
  }

  const { error: deleteError } = await supabase.from(KNOWLEDGE_TABLE).delete().neq("id", "");
  if (deleteError) throw deleteError;

  for (let index = 0; index < rows.length; index += UPSERT_BATCH_SIZE) {
    const batch = rows.slice(index, index + UPSERT_BATCH_SIZE);
    const { error } = await supabase.from(KNOWLEDGE_TABLE).upsert(batch, { onConflict: "id" });
    if (error) throw error;
    console.log(`Upserted ${Math.min(index + batch.length, rows.length)} / ${rows.length} chunks`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        table: KNOWLEDGE_TABLE,
        chunks: rows.length,
        embeddingModel: OPENAI_EMBEDDING_MODEL
      },
      null,
      2
    )
  );
}

function formatEmbeddingInput(chunk) {
  return [`來源：${chunk.source}`, `標題：${chunk.title}`, chunk.content].join("\n");
}

function sourceToTopic(source) {
  return source.replace(/\.md$/, "");
}

function hashContent(content) {
  return crypto.createHash("sha256").update(content).digest("hex");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
