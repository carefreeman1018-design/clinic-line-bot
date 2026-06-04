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

const PROCEDURE_REVIEW_PATTERNS = [
  /(?:肛門|屁股|私密處|陰部|生殖器).*(?:肉芽|顆粒|病灶|菜花|疣|痔瘡|腫塊).*(?:直接|今天|今晚|當天|馬上).*(?:電燒|冷凍|雷射|手術|處理|治療|切除|費用|價格|多少錢)/,
  /(?:菜花|尖銳濕疣|HPV|痔瘡|廔管|肛裂).*(?:直接|今天|今晚|當天|馬上).*(?:電燒|冷凍|雷射|手術|處理|治療|切除|費用|價格|多少錢)/
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
  if (isGeneralMedicalInfoQuery(message)) return false;

  return MEDICAL_ESCALATION_PATTERNS.some((pattern) => pattern.test(message)) ||
    PROCEDURE_REVIEW_PATTERNS.some((pattern) => pattern.test(message));
}

function isGeneralMedicalInfoQuery(message) {
  const asksGeneralInfo = /原因|成因|為什麼|怎麼造成|是什麼|有哪些|症狀|治療方式|怎麼治療|預防|怎麼預防|反覆感染|高危險/.test(message);
  const hasSpecificPersonalCue = /我|本人|自己|今天|現在|這兩天|昨|前天|剛剛|正在|已經|尿痛|尿尿.*痛|排尿.*痛|血尿|尿.*血|發燒|腰痛|劇痛|很痛|尿不出|排不出尿|懷孕|月經|吃藥|抗生素|報告|檢查結果|照片|傷口|流膿|化膿/.test(message);

  return asksGeneralInfo && !hasSpecificPersonalCue;
}

export function retrieveRelevantChunks(chunks, query, limit = 4) {
  const queryTerms = tokenize(query);

  return chunks
    .map((chunk) => ({
      ...chunk,
      score: scoreChunk(chunk, queryTerms, query)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
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
    const metadata = buildChunkMetadata({ source, title, content });
    return {
      id: `${source}:${index + 1}`,
      source,
      sourceUrls: sourceUrls.length > 0 ? sourceUrls : fileSourceUrls,
      title,
      metadata,
      content
    };
  });
}

function extractUrls(text) {
  return [...new Set(text.match(/https?:\/\/[^\s)]+/g) ?? [])];
}

function buildChunkMetadata({ source, title, content }) {
  const text = `${title}\n${content}`;
  return {
    topic: sourceToTopic(source),
    intent: inferIntent(text),
    riskLevel: inferRiskLevel(text),
    answerType: inferAnswerType(text),
    sourceType: inferSourceType(source),
    styleScope: "clinic-default"
  };
}

function sourceToTopic(source) {
  return source.replace(/\.md$/, "");
}

function inferIntent(text) {
  if (/費用|價格|價錢|多少錢|報價/.test(text)) return "pricing";
  if (/預約|掛號|時段|門診|看診|今天|明天|後天/.test(text)) return "appointment";
  if (/術後|做完|傷口|換藥|回診|恢復|照護/.test(text)) return "aftercare";
  if (/交通|地址|捷運|停車|公車|位置|怎麼去/.test(text)) return "access";
  if (/醫師|醫生|專長|主治|推薦|哪位/.test(text)) return "doctor";
  if (/疫苗|HPV|皮蛇|九價/i.test(text)) return "vaccine";
  if (/檢查|篩檢|報告|檢驗|匿名/.test(text)) return "screening";
  if (/手術|治療|療程|雷射|震波|消融|Urolift|Rezum/i.test(text)) return "treatment";
  return "general";
}

function inferRiskLevel(text) {
  if (/急診|立即就醫|大量出血|尿不出來|排不出尿|劇烈疼痛|發燒|昏沉|皮膚變黑|扭轉|壞疽|陰莖折斷/.test(text)) {
    return "urgent";
  }

  if (/不能診斷|不能開藥|醫師評估|不可保證|不建議自行|副作用|過敏|懷孕|感染|化膿|血尿|報告/.test(text)) {
    return "caution";
  }

  return "normal";
}

function inferAnswerType(text) {
  if (/建議回覆|回覆範例|可回答/.test(text)) return "example_reply";
  if (/不能回答|不可|不得|不要|請勿/.test(text)) return "safety_boundary";
  if (/資料來源|更新日期|官網/.test(text)) return "source_summary";
  if (/流程|步驟|下一步|注意事項/.test(text)) return "workflow";
  return "knowledge";
}

function inferSourceType(source) {
  if (source.includes("line-voom")) return "announcement";
  if (source.includes("official") || source.includes("website")) return "official_web";
  if (source.includes("schedule")) return "schedule";
  return "curated_knowledge";
}

function scoreChunk(chunk, queryTerms, query) {
  const haystack = `${chunk.title}\n${chunk.content}`;
  const normalizedHaystack = haystack.toLowerCase();
  const haystackTerms = tokenize(haystack);
  const haystackSet = new Set(haystackTerms);

  const baseScore = queryTerms.reduce((score, term) => {
    if (normalizedHaystack.includes(term)) return score + 3;
    if (haystackSet.has(term)) return score + 1;
    return score;
  }, 0);

  return baseScore + topicPriorityBoost(chunk, query, haystack) - sourcePenalty(chunk.source);
}

function topicPriorityBoost(chunk, query, haystack) {
  if (isCircumcisionQuery(query)) return circumcisionPriorityBoost(chunk, query, haystack);
  return 0;
}

function isCircumcisionQuery(query) {
  return /割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(query) ||
    (/包皮/.test(query) && /術後|做完|傷口|換藥|包紮|紗布|釘子|水腫|流血|滲血|流膿|洗澡|恢復|復原|手術|費用|價格|價錢|多少錢|報價/.test(query));
}

function isCircumcisionAftercareQuery(query) {
  return /術後|做完|傷口|換藥|包紮|紗布|釘子|水腫|流血|滲血|流膿|洗澡|恢復|復原/.test(query);
}

function circumcisionPriorityBoost(chunk, query, haystack) {
  const source = chunk.source;
  const title = chunk.title ?? "";
  const text = `${title}\n${haystack}`;
  let boost = 0;

  if (isCircumcisionAftercareQuery(query)) {
    if (source === "wound-care.md") boost += 78;
    if (source === "circumcision.md") boost += 24;
    if (source === "official-service-pages.md" && /術後注意事項|包皮/.test(title)) boost += 20;
    if (source === "official-treatment-services.md" && /包皮槍|包皮環切/.test(title)) boost += 10;
    if (source === "official-health-education-index.md" && /割包皮|包皮/.test(title)) boost -= 8;
  } else {
    if (source === "circumcision.md") boost += 35;
    if (source === "official-treatment-services.md" && /包皮槍|包皮環切/.test(title)) boost += 24;
    if (source === "official-service-pages.md" && /割包皮|包皮槍|包皮環切/.test(title)) boost += 18;
    if (source === "doctor-specialties.md" && /醫師|醫生|推薦|哪位|誰|主治|專長/.test(query)) boost += 14;
  }

  if (/費用|價格|價錢|多少錢|報價/.test(query)) {
    if (source === "circumcision.md" && /費用|價格|價錢|多少錢|報價/.test(text)) boost += 18;
    if (!/割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(title)) boost -= 18;
  }

  if (!/割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(text)) boost -= 24;

  return boost;
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
