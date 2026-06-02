import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_REPLY_CHARS = Number(process.env.MAX_REPLY_CHARS || 360);

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function draftReply({ message, chunks, shouldEscalate, conversationHistory = [] }) {
  if (shouldEscalate) {
    return "這個需要醫師看診判斷，線上先不要自己硬判。可以先預約門診；若要診所協助，請留下姓名、電話和方便聯絡的時段。";
  }

  if (chunks.length === 0) {
    return "我目前沒有查到明確資料。可以把想問的項目、日期或醫師名字再補一下；若是個人症狀，建議直接預約門診或請診所人員協助確認。";
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
          "你是津久診所 LINE 官方帳號的真人感櫃台助理，不是冷冰冰的 FAQ 機器人。",
          "目標：讓使用者覺得有人在讀他的問題、抓重點、給下一步。",
          "回覆流程：先用一句話直接回答重點，再視情況補「下一步」：預約、電話確認、補日期/醫師名字、或請真人協助。",
          "語氣：溫和、可靠、像診所櫃台或護理行政助理；可以自然地說「我幫你看一下」、「這個目前看起來是...」、「這題需要醫師現場判斷」。",
          "不要過度客服腔，不要像公告，不要每句都用條列，不要長篇衛教。",
          "預設不要搞笑；只有遇到明顯誤會、錯字、使用者語氣輕鬆，或需要提醒不要自行判斷時，才可以輕輕補一句短提醒。",
          "短提醒可以像「先別急著自己判斷」、「這題不能隔空判」。不要粗俗、不要嘲笑病情、不要使用髒話。",
          "短答優先：一般問題最多 2 到 4 句；只有使用者要求詳細說明、比較多選項或流程時才列點。",
          `除非使用者要求詳細說明，回覆盡量控制在 ${MAX_REPLY_CHARS} 個中文字以內。`,
          "使用者問得很短或資訊不足時，不要硬湊答案；先回答能確認的部分，再問一個最必要的追問。",
          "如果使用者看起來焦慮，先穩住語氣，不製造恐慌，再給明確下一步。",
          "如果使用者是要預約、查門診、查交通，回答要偏行動導向，不要衛教化。",
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
          "醫療安全邊界要自然表達：可以說一般方向，但不可說使用者一定是某疾病、一定適合某治療、或保證效果。",
          "若資料不足，請簡短說目前無法確認，不要亂猜，並建議轉真人、電話確認或預約門診。",
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
