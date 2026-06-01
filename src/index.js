import "dotenv/config";
import express from "express";
import { draftReply } from "./ai.js";
import { loadKnowledge, retrieveRelevantChunks, shouldEscalate } from "./knowledge.js";
import { replyText, verifyLineSignature } from "./line.js";
import { answerFixedScheduleQuestion } from "./schedule.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const debugToken = process.env.DEBUG_TEST_TOKEN;
const pendingAssistanceByUser = new Map();
const PENDING_ASSISTANCE_TTL_MS = 30 * 60 * 1000;

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    }
  })
);

app.get("/", (_req, res) => {
  res.json({
    name: "clinic-line-bot",
    status: "ok",
    webhook: "/webhook"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    lineConfigured: Boolean(channelSecret && channelAccessToken),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/debug/draft-reply", async (req, res) => {
  if (!debugToken || req.header("authorization") !== `Bearer ${debugToken}`) {
    return res.status(404).json({ error: "Not found" });
  }

  const message = String(req.body.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });

  const chunks = await loadKnowledge();
  const relevantChunks = retrieveRelevantChunks(chunks, message);
  const reply = await buildReply(message, relevantChunks);

  res.json({
    reply,
    matches: relevantChunks.map((chunk) => ({
      source: chunk.source,
      title: chunk.title,
      score: chunk.score
    }))
  });
});

app.post("/webhook", async (req, res) => {
  const signature = req.header("x-line-signature");

  if (!verifyLineSignature(req.rawBody, signature, channelSecret)) {
    return res.status(401).json({ error: "Invalid LINE signature" });
  }

  res.status(200).end();

  const events = req.body.events ?? [];
  await Promise.allSettled(events.map(handleLineEvent));
});

async function handleLineEvent(event) {
  if (event.type !== "message" || event.message?.type !== "text") return;

  try {
    const message = event.message.text.trim();
    const userId = event.source?.userId;
    const followUpReply = buildAssistanceFollowUpReply(userId, message);
    if (followUpReply) {
      await safeReplyText(event.replyToken, followUpReply);
      return;
    }

    const chunks = await loadKnowledge();
    const relevantChunks = retrieveRelevantChunks(chunks, message);
    const reply = await buildReply(message, relevantChunks);
    rememberAssistanceIfNeeded(userId, message);

    await safeReplyText(event.replyToken, reply);
  } catch (error) {
    console.error(error);
    await safeReplyText(
      event.replyToken,
      "不好意思，系統剛剛沒有順利查到資料。請您稍後再試，或留下問題讓診所人員協助回覆。"
    );
  }
}

async function buildReply(message, relevantChunks) {
  if (shouldEscalate(message)) {
    return "您好，這個狀況需要醫師看過實際情形才比較安全判斷。建議您儘快預約門診，或留下姓名、電話與方便聯絡/看診的時段，我們請診所人員協助安排。\n\n如果有劇烈疼痛、發燒、完全排不出尿、大量出血或症狀快速惡化，請不要等 LINE 回覆，建議直接就近急診或立即就醫。";
  }

  const fixedScheduleReply = answerFixedScheduleQuestion(message);
  if (fixedScheduleReply) return fixedScheduleReply;

  return draftReply({
    message,
    chunks: relevantChunks,
    shouldEscalate: shouldEscalate(message)
  });
}

function buildAssistanceFollowUpReply(userId, message) {
  if (!userId) return null;

  const pending = pendingAssistanceByUser.get(userId);
  if (!pending) return null;

  if (Date.now() - pending.createdAt > PENDING_ASSISTANCE_TTL_MS) {
    pendingAssistanceByUser.delete(userId);
    return null;
  }

  if (!isAffirmative(message)) return null;

  pendingAssistanceByUser.delete(userId);
  return "好的，我們請診所人員協助您。\n\n請您留下：\n1. 姓名\n2. 聯絡電話\n3. 方便聯絡或想預約的時段\n4. 簡短狀況，例如疼痛位置、多久了、是否有發燒或血尿\n\n若目前疼痛劇烈、發燒、完全排不出尿或大量出血，請先直接就近急診或立即就醫。";
}

function rememberAssistanceIfNeeded(userId, message) {
  if (!userId || !shouldEscalate(message)) return;

  pendingAssistanceByUser.set(userId, {
    createdAt: Date.now()
  });
}

function isAffirmative(message) {
  return /^(好|好的|可以|需要|要|麻煩|麻煩你|請幫我|幫我|ok|OK|yes|Yes|好啊|可以啊)[。！!.\s]*$/.test(message.trim());
}

async function safeReplyText(replyToken, message) {
  try {
    await replyText(replyToken, message, channelAccessToken);
  } catch (error) {
    console.error(error);
  }
}

app.listen(port, () => {
  console.log(`Clinic LINE bot listening on port ${port}`);
});
