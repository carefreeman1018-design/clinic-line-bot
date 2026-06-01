import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const OPENAI_EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-small";

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export function isEmbeddingConfigured() {
  return Boolean(client);
}

export async function createEmbedding(input) {
  const embeddings = await createEmbeddings([input]);
  return embeddings[0];
}

export async function createEmbeddings(inputs) {
  if (!client) {
    throw new Error("OPENAI_API_KEY is required to create embeddings.");
  }

  const response = await client.embeddings.create({
    model: OPENAI_EMBEDDING_MODEL,
    input: inputs
  });

  return response.data.map((item) => item.embedding);
}
