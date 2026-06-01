import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const TODAY = "2026-06-01";

const client = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;

export async function draftReply({ message, chunks, shouldEscalate }) {
  if (shouldEscalate) {
    return "您好，這個狀況需要醫師看過實際情形才比較安全判斷。建議您直接預約門診，或留下方便聯絡的方式，我們請診所人員協助安排。";
  }

  if (chunks.length === 0) {
    return "您好，這個問題我目前沒有查到診所已公告的明確資訊。為了避免回覆不準確，建議您留下想詢問的重點，我們請診所人員確認後再回覆您。";
  }

  if (!client) {
    const bestChunk = chunks[0];
    return `您好，根據目前診所資訊：\n\n${summarizeChunk(bestChunk.content)}\n\n若您要確認個人狀況或預約門診，也可以留下方便的時段，我們協助您安排。`;
  }

  const context = chunks
    .map((chunk) => `【${chunk.title}】\n${chunk.content}`)
    .join("\n\n---\n\n");

  const response = await client.chat.completions.create({
    model: OPENAI_MODEL,
    temperature: 0.3,
    messages: [
      {
        role: "system",
        content: [
          "你是泌尿科診所 LINE 官方帳號的客服助理。",
          "請用溫和、專業、簡潔、像醫師本人親切回覆病人的語氣。",
          "只能根據提供的診所知識庫內容回答，不要編造資訊。",
          `今天日期是 ${TODAY}。`,
          "使用者詢問固定每週門診時，優先依官網固定門診表回答；不要拿已過期或不同年份的 LINE VOOM 公告回答固定門診問題。",
          "LINE VOOM 的休診、公休、停診公告只有在使用者問到同一個日期、同一位醫師或同一段連假時才可覆蓋固定門診表。",
          "如果 LINE VOOM 公告日期已經過去，請明確說那是過去公告，不要把它當成未來或一般週期性門診狀態。",
          "不得診斷、開藥、判斷個人病情、解讀個人檢查報告。",
          "若資料不足，請誠實說目前無法確認，並建議轉真人或預約門診。",
          "回答使用繁體中文，長度以 LINE 訊息好讀為主。"
        ].join("\n")
      },
      {
        role: "user",
        content: `使用者問題：${message}\n\n診所知識庫：\n${context}`
      }
    ]
  });

  return response.choices[0]?.message?.content?.trim() || "您好，這個問題我目前無法確認，建議由診所人員協助回覆會比較準確。";
}

function summarizeChunk(content) {
  return content
    .replace(/^#+\s+.+$/gm, "")
    .replace(/>.+$/gm, "")
    .trim()
    .slice(0, 700);
}
