import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function draftReply({ message, chunks, shouldEscalate, conversationHistory = [] }) {
  if (shouldEscalate) {
    return "這需要醫師看診判斷。請先預約門診，或留下聯絡方式讓診所協助。";
  }

  if (chunks.length === 0) {
    return "目前查不到明確公告。請留下問題重點，診所人員確認後回覆。";
  }

  if (!client) {
    const bestChunk = chunks.find((chunk) => /建議回覆/.test(chunk.content)) ?? chunks[0];
    return appendOfficialLinks(summarizeChunk(bestChunk.content), chunks, message);
  }

  const context = chunks
    .map((chunk) => `【${chunk.title}】\n${chunk.content}`)
    .join("\n\n---\n\n");

  const historyMessages = conversationHistory
    .filter((historyMessage) => ["user", "assistant"].includes(historyMessage.role))
    .map((historyMessage) => ({
      role: historyMessage.role,
      content: historyMessage.content
    }));

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: [
          "你是泌尿科診所 LINE 官方帳號的客服助理。",
          "請用精簡、清楚、自然的語氣回答。",
          "預設不要搞笑；只有遇到明顯誤會、錯字、使用者語氣輕鬆，或需要提醒不要自行判斷時，才可以輕輕補一句俏皮話。",
          "俏皮話要少量、短句、像輕鬆提醒，例如「先別急著腦補」、「這題不能隔空判」。不要每句都屁，不要粗俗、不要嘲笑病情、不要使用髒話。",
          "短答優先：一般問題最多 1 到 2 句；只有使用者要求詳細說明時才列點。",
          "不要使用多餘寒暄或結尾祝福，例如「您好」、「感謝您的訊息」、「祝您健康平安」、「若有其他問題歡迎詢問」。",
          "不要重複提醒同一件事；能直接回答就直接回答。",
          "只能根據提供的診所知識庫內容回答，不要編造資訊。",
          "你可以參考先前對話來理解代名詞、延續問題與使用者已提供的資訊。",
          "如果先前對話與目前診所知識庫衝突，請以目前提供的診所知識庫為準。",
          `今天日期是 ${getTaipeiToday()}。`,
          "使用者詢問固定每週門診時，優先依官網固定門診表回答；不要拿已過期或不同年份的 LINE VOOM 公告回答固定門診問題。",
          "LINE VOOM 的休診、公休、停診公告只有在使用者問到同一個日期、同一位醫師或同一段連假時才可覆蓋固定門診表。",
          "如果 LINE VOOM 公告日期已經過去，請明確說那是過去公告，不要把它當成未來或一般週期性門診狀態。",
          "不得診斷、開藥、判斷個人病情、解讀個人檢查報告。",
          "若資料不足，請簡短說目前無法確認，不要亂猜，並建議轉真人或預約門診。",
          "回答使用繁體中文，適合 LINE 閱讀。"
        ].join("\n")
      },
      ...historyMessages,
      {
        role: "user",
        content: `使用者問題：${message}\n\n診所知識庫：\n${context}`
      }
    ]
  });

  const reply = response.choices[0]?.message?.content?.trim() || "目前無法確認，建議由診所人員協助回覆。";
  return appendOfficialLinks(reply, chunks, message);
}

function summarizeChunk(content) {
  const suggestedReply = content.match(/建議回覆：\s*\n+「([\s\S]*?)」/)?.[1]?.trim();
  if (suggestedReply) return suggestedReply;

  return content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/>.+$/gm, "")
    .trim()
    .slice(0, 240);
}

function getTaipeiToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function appendOfficialLinks(reply, chunks, message) {
  const urls = extractOfficialWebsiteUrls(chunks, message);
  if (urls.length === 0) return reply;

  const label = urls.length === 1 ? "官網介紹：" : "官網介紹：";
  return `${reply}\n\n${label}\n${urls.join("\n")}`;
}

function extractOfficialWebsiteUrls(chunks, message) {
  const candidates = new Map();

  for (const chunk of chunks) {
    for (const url of chunk.sourceUrls ?? []) {
      if (!isOfficialWebsiteUrl(url)) continue;

      const existing = candidates.get(url);
      const score = scoreOfficialUrl(url, chunk, message);
      if (!existing || score > existing.score) {
        candidates.set(url, { url, score });
      }
    }
  }

  const scoredUrls = [...candidates.values()].sort((a, b) => b.score - a.score);
  const strongUrls = scoredUrls.filter((candidate) => candidate.score >= 6);
  const fallbackUrls = scoredUrls.filter((candidate) => candidate.score > 0);

  return (strongUrls.length > 0 ? strongUrls : fallbackUrls)
    .slice(0, strongUrls.length > 0 ? 2 : 1)
    .map((candidate) => candidate.url);
}

function isOfficialWebsiteUrl(url) {
  return /^https:\/\/(www\.)?uromeeme\.com\//.test(url);
}

function scoreOfficialUrl(url, chunk, message) {
  if (isServiceTopicQuery(message) && isBroadOfficialUrl(url) && !isBroadUrlRequested(message)) {
    return 0;
  }

  const urlText = decodeURIComponent(url).toLowerCase();
  const chunkText = `${chunk.title}\n${chunk.content}`.toLowerCase();
  const queryTerms = extractLinkTerms(message);
  const chunkTerms = extractLinkTerms(chunkText);
  const urlTerms = extractLinkTerms(urlText);
  const urlLabel = buildUrlLabel(url);

  let score = 0;

  for (const term of queryTerms) {
    if (chunkText.includes(term)) score += 3;
    if (urlText.includes(term) || urlLabel.includes(term)) score += 5;
  }

  for (const term of chunkTerms) {
    if (urlText.includes(term) || urlLabel.includes(term)) score += 2;
  }

  for (const term of urlTerms) {
    if (chunkText.includes(term)) score += 1;
  }

  if (/\/about-us\/?$/.test(url)) score += /醫師|醫生|專長|肛門直腸|大腸直腸|陳嘉哲/.test(message) ? 3 : -2;
  if (/\/about_uromeeme_tsuku\/?$/.test(url)) score += /特色|團隊|一站式|大腸直腸/.test(message) ? 3 : -3;
  if (/^https:\/\/(www\.)?uromeeme\.com\/?$/.test(url)) score += /首頁|官網|網站/.test(message) ? 3 : -4;
  if (isServiceTopicQuery(message) && isBroadOfficialUrl(url)) score -= 6;

  return score;
}

function extractLinkTerms(text) {
  const normalized = text.toLowerCase();
  const terms = [
    ...(normalized.match(/[a-z0-9]+/g) ?? []),
    ...(normalized.match(/[\u4e00-\u9fff]{2,}/g) ?? []).flatMap(expandCjkLinkTerms)
  ];

  return [...new Set(terms)].filter(isUsefulLinkTerm);
}

function expandCjkLinkTerms(sequence) {
  const terms = [sequence];
  for (let index = 0; index < sequence.length; index += 1) {
    for (const length of [2, 3, 4]) {
      const term = sequence.slice(index, index + length);
      if (term.length === length) terms.push(term);
    }
  }
  return terms;
}

function isUsefulLinkTerm(term) {
  if (term.length < 2) return false;
  return !/^(https?|www|com|官網|介紹|診所|津久|提供|服務|可以|有沒有|想問|請問|相關|治療|手術)$/.test(term);
}

function buildUrlLabel(url) {
  if (/\/about-us\/?$/.test(url)) return "醫師介紹 陳嘉哲 肛門直腸 大腸直腸";
  if (/\/about_uromeeme_tsuku\/?$/.test(url)) return "品牌介紹 診所特色 一站式";
  if (/^https:\/\/(www\.)?uromeeme\.com\/?$/.test(url)) return "首頁 治療項目";
  return "";
}

function isServiceTopicQuery(message) {
  return /痔瘡|痔|廔管|肛裂|肛門性病|肛門菜花|肛門疾病|肛門問題|大腸直腸/.test(message);
}

function isBroadOfficialUrl(url) {
  return (
    /^https:\/\/(www\.)?uromeeme\.com\/?$/.test(url) ||
    /\/contact-us\/?$/.test(url) ||
    /\/about-us\/?$/.test(url) ||
    /\/about_uromeeme_tsuku\/?$/.test(url) ||
    /\/%e8%a8%ba%e6%89%80%e7%89%b9%e8%89%b2\/?$/i.test(url) ||
    /\/診所特色\/?$/.test(decodeURIComponent(url))
  );
}

function isBroadUrlRequested(message) {
  return /醫師|醫生|專長|陳嘉哲|官網|官方網站|首頁|品牌|特色|團隊|一站式|預約|掛號|交通|地址/.test(message);
}
