import "dotenv/config";
import { createEmbedding, isEmbeddingConfigured } from "../src/embeddings.js";
import { loadKnowledge } from "../src/knowledge.js";
import { retrieveHybridRelevantChunks, isVectorKnowledgeConfigured } from "../src/vector-knowledge.js";
import { supabase } from "../src/supabase.js";

const KNOWLEDGE_MATCH_RPC = process.env.SUPABASE_KNOWLEDGE_MATCH_RPC || "match_knowledge_chunks";
const KNOWLEDGE_TABLE = process.env.SUPABASE_KNOWLEDGE_TABLE || "knowledge_chunks";

const CASES = [
  {
    query: "腎結石怎麼辦 腎結石治療方法",
    expectedSources: ["stone-treatment.md", "official-health-education-index.md", "official-service-pages.md"]
  },
  {
    query: "HPV疫苗 皮蛇疫苗 可以預約嗎",
    expectedSources: ["vaccines.md", "official-service-pages.md", "clinic-info.md"]
  },
  {
    query: "男性泌尿道感染 尿道炎",
    expectedSources: ["male-uti.md", "official-service-pages.md"]
  },
  {
    query: "如何預約手術 掛號系統在哪",
    expectedSources: ["clinic-info.md", "website-clinic-hours.md"]
  },
  {
    query: "行天宮站怎麼走 有停車場嗎",
    expectedSources: ["clinic-info.md", "website-clinic-hours.md"]
  }
];

async function main() {
  const issues = [];
  const chunks = await loadKnowledge();
  const tableCount = await getTableCount(issues);

  if (chunks.length === 0) issues.push("Knowledge base loaded 0 chunks.");
  if (!isEmbeddingConfigured()) issues.push("OPENAI_API_KEY is required for vector smoke tests.");
  if (!supabase) issues.push("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for vector smoke tests.");

  const vectorKnowledgeConfigured = isVectorKnowledgeConfigured();
  if (!vectorKnowledgeConfigured) issues.push("Vector knowledge is not configured.");

  const caseResults = [];

  if (supabase && isEmbeddingConfigured()) {
    for (const testCase of CASES) {
      const rpcMatches = await retrieveRpcMatches(testCase.query);
      const hybridMatches = vectorKnowledgeConfigured
        ? await retrieveHybridRelevantChunks(chunks, testCase.query, 4)
        : [];

      const rpcOk = hasExpectedSource(rpcMatches, testCase.expectedSources);
      const hybridOk = hasExpectedSource(hybridMatches, testCase.expectedSources);

      if (!rpcOk) {
        issues.push(`Vector RPC missed expected source for query: ${testCase.query}`);
      }

      if (!hybridOk) {
        issues.push(`Hybrid retrieval missed expected source for query: ${testCase.query}`);
      }

      caseResults.push({
        query: testCase.query,
        expectedSources: testCase.expectedSources,
        rpcOk,
        rpcMatches: summarizeMatches(rpcMatches),
        hybridOk,
        hybridMatches: summarizeMatches(hybridMatches)
      });
    }
  }

  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        chunks: chunks.length,
        table: KNOWLEDGE_TABLE,
        tableCount,
        vectorKnowledgeConfigured,
        cases: caseResults,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) process.exitCode = 1;
}

async function getTableCount(issues) {
  if (!supabase) return null;

  const { count, error } = await supabase.from(KNOWLEDGE_TABLE).select("id", {
    count: "exact",
    head: true
  });

  if (error) {
    issues.push(`Unable to count ${KNOWLEDGE_TABLE}: ${error.message}`);
    return null;
  }

  return count;
}

async function retrieveRpcMatches(query) {
  const queryEmbedding = await createEmbedding(query);
  const { data, error } = await supabase.rpc(KNOWLEDGE_MATCH_RPC, {
    query_embedding: queryEmbedding,
    match_count: 6,
    min_similarity: 0.15
  });

  if (error) {
    return [{ source: "__rpc_error__", title: error.message, similarity: 0 }];
  }

  return data ?? [];
}

function hasExpectedSource(matches, expectedSources) {
  return matches.some((match) => expectedSources.includes(match.source));
}

function summarizeMatches(matches) {
  return matches.slice(0, 4).map((match) => ({
    source: match.source,
    title: match.title,
    similarity:
      match.similarity === undefined
        ? undefined
        : Number(match.similarity).toFixed(3),
    vectorSimilarity:
      match.vectorSimilarity === undefined
        ? undefined
        : Number(match.vectorSimilarity).toFixed(3)
  }));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
