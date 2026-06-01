import fs from "node:fs/promises";
import { loadKnowledge, retrieveRelevantChunks } from "../src/knowledge.js";

const REQUIRED_ENV_KEYS = ["LINE_CHANNEL_SECRET", "LINE_CHANNEL_ACCESS_TOKEN"];
const REQUIRED_FILES = [
  "data/clinic-info.md",
  "data/doctor-schedule.md",
  "data/website-clinic-hours.md",
  "data/line-voom-announcements.md"
];
const SAMPLE_QUERIES = [
  "診所電話是多少",
  "週二晚上誰看診",
  "5/19李齊泰醫師有看診嗎",
  "血尿怎麼辦"
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

  const chunks = await loadKnowledge();
  if (chunks.length === 0) issues.push("Knowledge base loaded 0 chunks");

  const queryResults = SAMPLE_QUERIES.map((query) => ({
    query,
    matches: retrieveRelevantChunks(chunks, query, 2).map((chunk) => `${chunk.source}:${chunk.title}`)
  }));

  for (const result of queryResults) {
    if (result.matches.length === 0) issues.push(`No knowledge match for sample query: ${result.query}`);
  }

  console.log(JSON.stringify({ ok: issues.length === 0, chunks: chunks.length, queryResults, issues }, null, 2));

  if (issues.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
