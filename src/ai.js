import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function draftReply({ message, chunks, shouldEscalate, conversationHistory = [] }) {
  if (shouldEscalate) {
    return "這題不能隔空判，別硬撐。請先預約門診讓醫師看，或留下聯絡方式讓診所協助。";
  }

  if (chunks.length === 0) {
    return "目前沒查到明確公告，先別腦補。請留下問題重點，診所人員確認後回覆。";
  }

  if (!client) {
    const bestChunk = chunks[0];
    return summarizeChunk(bestChunk.content);
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
          "請用精簡、清楚、帶一點中二屁孩感的語氣回答，但仍要禮貌、可信、不能冒犯病人。",
          "可以輕微吐槽或用俏皮提醒，例如「先別腦補」、「這題不能隔空判」、「不要硬扛」，但不要粗俗、不要嘲笑病情、不要使用髒話。",
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
          "若資料不足，請簡短說目前無法確認，語氣可以俏皮但不要亂猜，並建議轉真人或預約門診。",
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

  return response.choices[0]?.message?.content?.trim() || "目前無法確認，別硬猜。建議由診所人員協助回覆。";
}

function summarizeChunk(content) {
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
