import "dotenv/config";
import fs from "node:fs/promises";
import { loadKnowledge, retrieveRelevantChunks } from "../src/knowledge.js";
import { answerFixedScheduleQuestion } from "../src/schedule.js";
import { isVectorKnowledgeConfigured, retrieveHybridRelevantChunks } from "../src/vector-knowledge.js";

const REQUIRED_ENV_KEYS = ["LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN"];
const REQUIRED_FILES = [
  "data/clinic-info.md",
  "data/doctor-schedule.md",
  "data/fixed-schedule.json",
  "data/website-clinic-hours.md",
  "data/line-voom-announcements.md",
  "supabase/schema.sql",
  "supabase/knowledge_chunks.sql",
  "supabase/conversation_messages.sql",
  "supabase/bot_settings.sql"
];
const SAMPLE_QUERIES = [
  "診所電話是多少",
  "週二晚上誰看診",
  "5/19李齊泰醫師有看診嗎",
  "血尿怎麼辦"
];
const SAMPLE_SCHEDULE_CASES = [
  {
    query: "週二晚上誰看診",
    expectedTerms: ["李齊泰醫師", "18:00-20:30"]
  },
  {
    query: "週六晚上有看診嗎",
    expectedTerms: ["休診", "18:00-20:30"]
  }
];

async function main() {
  const issues = [];

  for (const filePath of REQUIRED_FILES) {
    try {
      await fs.access(filePath);
    } catch {
      issues.push(`Missing required file: ${filePath}`);
    }
  }

  for (const key of REQUIRED_ENV_KEYS) {
    if (!process.env[key]) issues.push(`Missing environment variable: ${key}`);
  }

  await validateFixedScheduleJson(issues);

  const chunks = await loadKnowledge();
  if (chunks.length === 0) issues.push("Knowledge base loaded 0 chunks");

  const vectorKnowledgeConfigured = isVectorKnowledgeConfigured();
  const queryResults = await Promise.all(
    SAMPLE_QUERIES.map(async (query) => {
      const matches = vectorKnowledgeConfigured
        ? await retrieveHybridRelevantChunks(chunks, query, 2)
        : retrieveRelevantChunks(chunks, query, 2);

      return {
        query,
        matches: matches.map((chunk) => `${chunk.source}:${chunk.title}`)
      };
    })
  );

  for (const result of queryResults) {
    if (result.matches.length === 0) issues.push(`No knowledge match for sample query: ${result.query}`);
  }

  const scheduleResults = SAMPLE_SCHEDULE_CASES.map((testCase) => {
    const reply = answerFixedScheduleQuestion(testCase.query, new Date("2026-06-02T04:00:00Z"), []);
    const missingTerms = testCase.expectedTerms.filter((term) => !reply?.includes(term));
    if (missingTerms.length > 0) {
      issues.push(`Schedule reply missing terms for "${testCase.query}": ${missingTerms.join(", ")}`);
    }

    return {
      query: testCase.query,
      reply,
      missingTerms
    };
  });

  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        chunks: chunks.length,
        vectorKnowledgeConfigured,
        queryResults,
        scheduleResults,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function validateFixedScheduleJson(issues) {
  try {
    const raw = await fs.readFile("data/fixed-schedule.json", "utf8");
    const config = JSON.parse(raw);
    for (const key of ["updatedAt", "source", "periodTimes", "schedule", "temporaryChangeConfirmation"]) {
      if (!config[key]) issues.push(`fixed-schedule.json missing ${key}`);
    }
  } catch (error) {
    issues.push(`Unable to parse data/fixed-schedule.json: ${error.message}`);
  }
}
