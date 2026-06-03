import fs from "node:fs/promises";
import path from "node:path";

const KNOWLEDGE_DIR = path.join(process.cwd(), "data");

const STOP_TERMS = new Set([
  "我想",
  "想問",
  "津久",
  "診所",
  "你們",
  "有沒",
  "沒有",
  "有做",
  "可以",
  "在你",
  "是什",
  "什麼",
  "諮詢",
  "請問",
  "官網",
  "官方",
  "方帳",
  "帳號",
  "官方帳",
  "方帳號",
  "官方帳號",
  "客服",
  "您好",
  "line",
  "hi",
  "hello",
  "hey"
]);

const GENERIC_TERM_PATTERNS = [
  /津久/,
  /診所/,
  /你們/,
  /可以/,
  /有沒/,
  /沒有/,
  /提供/,
  /諮詢/,
  /請問/,
  /客服/,
  /官方/,
  /哪裡/,
  /怎麼預約/
];

const MEDICAL_ESCALATION_PATTERNS = [
  /血尿|尿血|流血|出血|發燒|劇痛|很痛|疼痛|痛痛|不舒服|排不出尿|尿不出來|傷口|感染|腫起來|化膿/,
  /報告|檢查結果|癌|腫瘤|攝護腺指數|PSA|超音波|切片/,
  /吃藥|藥物|抗生素|副作用|過敏|劑量|停藥|懷孕/
];

export async function loadKnowledge() {
  const filenames = await fs.readdir(KNOWLEDGE_DIR);
  const markdownFiles = filenames
    .filter((filename) => filename.endsWith(".md"))
    .sort();

  const chunksByFile = await Promise.all(
    markdownFiles.map(async (filename) => {
      const filePath = path.join(KNOWLEDGE_DIR, filename);
      const raw = await fs.readFile(filePath, "utf8");
      return splitMarkdown(raw, filename);
    })
  );

  return chunksByFile.flat();
}

export function shouldEscalate(message) {
  return MEDICAL_ESCALATION_PATTERNS.some((pattern) => pattern.test(message));
}

export function retrieveRelevantChunks(chunks, query, limit = 4) {
  const queryTerms = tokenize(query);

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTerms)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => adjustedScore(b) - adjustedScore(a) || b.score - a.score)
    .slice(0, limit);
}

function splitMarkdown(raw, source) {
  const fileSourceUrls = extractUrls(raw);
  const sections = raw
    .split(/\n(?=#{1,6}\s+)/g)
    .map((section) => section.trim())
    .filter(Boolean);

  return sections.map((content, index) => {
    const title = content.match(/^#{1,6}\s+(.+)$/m)?.[1] ?? `段落 ${index + 1}`;
    const sourceUrls = extractUrls(content);
    return {
      id: `${source}:${index + 1}`,
      source,
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : fileSourceUrls,
      title,
      content
    };
  });
}

function extractUrls(text) {
  return [...new Set(text.match(/https?:\/\/[^\s)]+/g) ?? [])];
}

function scoreChunk(chunk, queryTerms) {
  const haystack = `${chunk.title}\n${chunk.content}`;
  const normalizedHaystack = haystack.toLowerCase();
  const haystackTerms = tokenize(haystack);
  const haystackSet = new Set(haystackTerms);

  return queryTerms.reduce((score, term) => {
    if (normalizedHaystack.includes(term)) return score + 3;
    if (haystackSet.has(term)) return score + 1;
    return score;
  }, 0);
}

function adjustedScore(chunk) {
  return chunk.score - sourcePenalty(chunk.source);
}

function sourcePenalty(source) {
  return source.includes("index.md") ? 5 : 0;
}

function tokenize(text) {
  const normalized = text.toLowerCase();
  const dateTerms = normalized.match(/\b\d{1,2}\/\d{1,2}\b/g) ?? [];
  const latinTerms = normalized.match(/[a-z0-9]+/g) ?? [];
  const cjkTerms = extractCjkTerms(normalized);
  return [...dateTerms, ...latinTerms, ...cjkTerms].filter(isUsefulQueryTerm);
}

function isUsefulQueryTerm(term) {
  if (term.length === 0) return false;
  if (STOP_TERMS.has(term)) return false;
  return !GENERIC_TERM_PATTERNS.some((pattern) => pattern.test(term));
}

function extractCjkTerms(text) {
  const sequences = text.match(/[\u4e00-\u9fff]+/g) ?? [];
  const terms = [];

  for (const sequence of sequences) {
    for (let index = 0; index < sequence.length; index += 1) {
      for (let length = 2; length <= 4; length += 1) {
        const term = sequence.slice(index, index + length);
        if (term.length === length) terms.push(term);
      }
    }
  }

  return terms;
}
