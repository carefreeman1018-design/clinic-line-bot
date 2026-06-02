import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const MAX_REPLY_CHARS = Number(process.env.MAX_REPLY_CHARS || 360);
const APPOINTMENT_URL = "https://appointment.uromeeme.inncom.cloud/";
const OFFICIAL_TOPIC_URLS = [
  { pattern: /PEP|事後預防|暴露後|72\s*小時|愛滋.*事後/i, url: "https://uromeeme.com/pep/" },
  { pattern: /PrEP|事前預防|暴露前|愛滋.*事前/i, url: "https://uromeeme.com/prep/" },
  { pattern: /猛健樂|Mounjaro|Tirzepatide|瘦瘦筆|體重管理|減重/i, url: "https://uromeeme.com/%e7%8c%9b%e5%81%a5%e6%a8%82%e9%96%80%e8%a8%ba/" },
  { pattern: /術後注意|術後照護|術後怎麼|手術後注意|包皮.*術後/, url: "https://uromeeme.com/after_surgery/" },
  { pattern: /換藥|包紮|生理食鹽水|水腫|釘子|紗布|傷口照顧/, url: "https://uromeeme.com/wound_care/" },
  { pattern: /低能量震波|線性震波|震波治療|LI-ESWT|Piezowave/i, url: "https://uromeeme.com/%e4%bd%8e%e8%83%bd%e9%87%8f%e9%9c%87%e6%b3%a2%e6%b2%bb%e7%99%82/" },
  { pattern: /性功能障礙|勃起功能|陽痿|不舉|硬度|容易軟|早洩|持久/i, url: "https://uromeeme.com/%e6%80%a7%e5%8a%9f%e8%83%bd%e9%9a%9c%e7%a4%99%e6%b2%bb%e7%99%82/" },
  { pattern: /女性泌尿|女性.*泌尿道感染|女性.*漏尿|漏尿|尿失禁|骨盆底肌|美磁波|鍛肌椅|高密度磁波/, url: "https://uromeeme.com/%e5%a5%b3%e6%80%a7%e6%b3%8c%e5%b0%bf%e9%81%93%e6%84%9f%e6%9f%93-%e6%bc%8f%e5%b0%bf/" },
  { pattern: /男性.*泌尿道感染|尿道炎|膀胱炎|睪丸炎|副睪丸炎|攝護腺炎|泌尿道感染/, url: "https://uromeeme.com/%e7%94%b7%e6%80%a7%e6%b3%8c%e5%b0%bf%e9%81%93%e6%84%9f%e6%9f%93/" },
  { pattern: /腎結石|輸尿管結石|尿路結石|膀胱結石|結石|軟式輸尿管鏡|FURS/i, url: "https://uromeeme.com/%e8%85%8e%e7%b5%90%e7%9f%b3-%e8%bc%b8%e5%b0%bf%e7%ae%a1%e7%b5%90%e7%9f%b3%e6%b2%bb%e7%99%82/" },
  { pattern: /水蒸氣消融|Rezum|攝護腺水蒸氣/i, url: "https://uromeeme.com/%e6%b0%b4%e8%92%b8%e6%b0%a3%e6%b6%88%e8%9e%8d%e6%89%8b%e8%a1%93/" },
  { pattern: /攝護腺肥大|前列腺肥大|BPH|夜尿|排尿困難|尿滯留/i, url: "https://uromeeme.com/%e6%94%9d%e8%ad%b7%e8%85%ba%e8%82%a5%e5%a4%a7%e6%b2%bb%e7%99%82/" },
  { pattern: /匿名篩檢|性病|菜花|梅毒|淋病|披衣菌|尖銳濕疣|HPV(?!\s*疫苗)|HIV|愛滋/i, url: "https://uromeeme.com/%e6%80%a7%e7%97%85%e6%b2%bb%e7%99%82/" },
  { pattern: /HPV\s*疫苗|九價|子宮頸癌疫苗/i, url: "https://uromeeme.com/video/hpv%e7%96%ab%e8%8b%97%e5%ae%a3%e5%b0%8e%e5%bd%b1%e7%89%87%ef%bd%9c%e8%a8%ba%e6%89%80%e7%af%87-2025%e5%b9%b4%e5%ba%a6/" },
  { pattern: /客製化功能性修復點滴|功能性修復點滴|點滴|疲勞|護肝|免疫提升|術後修復/, url: "https://uromeeme.com/%e5%ae%a2%e8%a3%bd%e5%8c%96%e5%8a%9f%e8%83%bd%e6%80%a7%e4%bf%ae%e5%be%a9%e9%bb%9e%e6%bb%b4/" },
  { pattern: /男性私密|私密處微創|陰莖增大|龜頭減敏|繫帶|珍珠丘疹|包皮繫帶|GG\s*增大/i, url: "https://uromeeme.com/%e7%94%b7%e6%80%a7%e7%a7%81%e5%af%86%e8%99%95%e9%86%ab%e7%be%8e%e5%be%ae%e5%89%b5%e6%89%8b%e8%a1%93/" },
  { pattern: /無刀口.*結紮|男性結紮|結紮|輸精管/, url: "https://uromeeme.com/%e7%84%a1%e5%88%80%e5%8f%a3%e7%b5%90%e7%b4%ae%e6%89%8b%e8%a1%93/" },
  { pattern: /割包皮|包皮槍|包皮環切|包莖|包皮過長/, url: "https://uromeeme.com/treatment1/" }
];

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
    return appendOfficialLinks(summarizeChunk(bestChunk.content, message), chunks, message);
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
          "使用者已經在 LINE 對話裡，不要叫他再加官方 LINE，也不要主動貼官方 LINE 加好友連結；除非使用者明確詢問官方 LINE ID 或加好友連結。",
          `若使用者問怎麼預約，可提供線上掛號：${APPOINTMENT_URL}，或請他留下姓名、電話與方便聯絡時段。`,
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

function summarizeChunk(content, message = "") {
  const suggestedReply = selectSuggestedReply(content, message);
  if (suggestedReply) return suggestedReply;

  return content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/>.+$/gm, "")
    .trim()
    .slice(0, 240);
}

function selectSuggestedReply(content, message) {
  const suggestions = [...content.matchAll(/使用者問：([\s\S]*?)\n\s*建議回覆：\s*\n+「([\s\S]*?)」/g)].map((match) => ({
    question: match[1].trim(),
    reply: match[2].trim()
  }));

  if (suggestions.length === 0) {
    return content.match(/建議回覆：\s*\n+「([\s\S]*?)」/)?.[1]?.trim() ?? null;
  }

  const scoredSuggestions = suggestions
    .map((suggestion) => ({
      ...suggestion,
      score: scoreSuggestedQuestion(suggestion.question, message)
    }))
    .sort((a, b) => b.score - a.score);

  return scoredSuggestions[0]?.reply ?? null;
}

function scoreSuggestedQuestion(suggestedQuestion, message) {
  const messageTerms = extractLinkTerms(message);
  const suggestedQuestionText = suggestedQuestion.toLowerCase();

  return messageTerms.reduce((score, term) => {
    return suggestedQuestionText.includes(term) ? score + term.length : score;
  }, 0);
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
  const normalizedReply = normalizeReplyForLineContext(reply, message);
  if (urls.length === 0) return normalizedReply;

  return `${normalizedReply}\n\n官網介紹：\n${urls[0]}`;
}

function extractOfficialWebsiteUrls(chunks, message) {
  if (isClinicAccessQuery(message)) return [];
  if (shouldSuppressExtraLinks(message)) return [];

  const canonicalTopicUrl = findCanonicalOfficialTopicUrl(message);
  if (canonicalTopicUrl) return [canonicalTopicUrl];
  if (isServiceTopicQuery(message)) return [];
  if (!hasUsefulLinkIntent(message)) return [];

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
    .slice(0, 1)
    .map((candidate) => candidate.url);
}

function normalizeReplyForLineContext(reply, message) {
  if (isOfficialLineRequested(message)) return reply;

  return reply
    .replace(/https:\/\/lin\.ee\/[^\s)）]+/gi, "")
    .replace(/(?:建議|可|可以)?先?(?:加|加入)官方\s*LINE\s*(?:預約)?(?:快速通關服務)?[，,、；;]?\s*/gi, "")
    .replace(/(?:官方\s*LINE\s*加好友連結|加好友連結)[:：]?\s*/gi, "")
    .replace(/(?:建議|可|可以)?先?透過官方\s*LINE\s*或電話/gi, "可以透過電話")
    .replace(/官方\s*LINE\s*或電話/gi, "電話")
    .replace(/透過官方\s*LINE\s*預約/gi, "由診所人員協助預約")
    .replace(/(?:諮詢|預約)[，,、；;]\s*或電話/gi, "可以電話")
    .replace(/報告可透過官方\s*LINE\s*查詢/gi, "報告查詢需由診所人員協助")
    .replace(/請拍照傳官方\s*LINE\s*或回診確認/gi, "請直接回診或電話確認；若診所人員需要照片，再依指示傳送")
    .replace(/拍照傳官方\s*LINE/gi, "依診所人員指示傳照片")
    .replace(/[（(]\s*[）)]/g, "")
    .replace(/(?:預約)?快速通關服務[，,、；;]?\s*或/gi, "可以")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findCanonicalOfficialTopicUrl(message) {
  return OFFICIAL_TOPIC_URLS.find((topic) => topic.pattern.test(message))?.url ?? null;
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
  return OFFICIAL_TOPIC_URLS.some((topic) => topic.pattern.test(message)) ||
    /痔瘡|痔|廔管|肛裂|肛門性病|肛門菜花|肛門疾病|肛門問題|大腸直腸|疫苗|皮蛇/.test(message);
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
  return /官網|官方網站|首頁|品牌|特色|團隊|一站式|醫師介紹|醫生介紹|官方介紹/.test(message) ||
    /(預約|掛號|交通|地址|醫師|醫生|專長).*(網址|連結|頁面|官網|介紹)/.test(message);
}

function isOfficialLineRequested(message) {
  return /官方\s*LINE|line\s*id|LINE\s*ID|加好友|好友連結|lin\.ee/i.test(message);
}

function isClinicAccessQuery(message) {
  return /診所|津久|你們|現場|門診/.test(message) && /如何去|怎麼去|怎麼走|怎麼到|交通|路線|地址|位置|在哪|到診|行天宮|捷運|公車|停車/.test(message);
}

function hasUsefulLinkIntent(message) {
  const withoutTestCode = message.replace(/\b[A-Z]\d{2}-\d{2}\b/gi, "");
  return hasExplicitOfficialLinkIntent(withoutTestCode) || isBroadUrlRequested(withoutTestCode);
}

function hasExplicitOfficialLinkIntent(message) {
  return /官網|官方網站|網址|連結|頁面|文章|衛教|影片|新聞|報導|案例|在哪|給我|提供|可以看|看得到|有沒有.*(文章|影片|新聞|報導|案例)/.test(message);
}

function shouldSuppressExtraLinks(message) {
  if (hasExplicitOfficialLinkIntent(message)) return false;

  return /講重點|重點就好|簡短|短答|不用.*連結|不要.*連結|不要貼|不用貼|先不要.*網址|只要.*重點/.test(message);
}
