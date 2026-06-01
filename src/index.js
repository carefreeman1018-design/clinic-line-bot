import "dotenv/config";
import express from "express";
import { draftReply } from "./ai.js";
import {
  isConversationMemoryConfigured,
  loadConversationHistory,
  rememberConversationExchange
} from "./conversation.js";
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
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    conversationMemoryConfigured: isConversationMemoryConfigured()
  });
});

app.post("/debug/draft-reply", async (req, res) => {
  if (!debugToken || req.header("authorization") !== `Bearer ${debugToken}`) {
    return res.status(404).json({ error: "Not found" });
  }

  const message = String(req.body.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });

  const lineUserId = String(req.body.lineUserId ?? "").trim();
  const conversationHistory = await loadConversationHistory(lineUserId);
  const chunks = await loadKnowledge();
  const relevantChunks = retrieveRelevantChunks(chunks, buildContextualQuery(message, conversationHistory));
  const reply = await buildReply(message, relevantChunks, conversationHistory);

  res.json({
    reply,
    conversationHistoryCount: conversationHistory.length,
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
      await rememberConversationExchange(userId, message, followUpReply);
      return;
    }

    const conversationHistory = await loadConversationHistory(userId);
    const chunks = await loadKnowledge();
    const relevantChunks = retrieveRelevantChunks(chunks, buildContextualQuery(message, conversationHistory));
    const reply = await buildReply(message, relevantChunks, conversationHistory);
    rememberAssistanceIfNeeded(userId, message);

    await safeReplyText(event.replyToken, reply);
    await rememberConversationExchange(userId, message, reply);
  } catch (error) {
    console.error(error);
    await safeReplyText(event.replyToken, "系統暫時查不到資料，請稍後再試或留下問題。");
  }
}

async function buildReply(message, relevantChunks, conversationHistory = []) {
  if (shouldEscalate(message)) {
    return "這需要醫師看診判斷。請預約門診，或留下姓名、電話與方便聯絡時段。若劇烈疼痛、發燒、完全排不出尿或大量出血，請立即就醫。";
  }

  const fixedScheduleReply = answerFixedScheduleQuestion(message);
  if (fixedScheduleReply) return fixedScheduleReply;

  return draftReply({
    message,
    chunks: relevantChunks,
    shouldEscalate: shouldEscalate(message),
    conversationHistory
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
  return "請留下姓名、電話、方便聯絡/預約時段、簡短狀況。若劇烈疼痛、發燒、完全排不出尿或大量出血，請立即就醫。";
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

function buildContextualQuery(message, conversationHistory) {
  const historyText = conversationHistory
    .map((historyMessage) => historyMessage.content)
    .join("\n");

  return [historyText, message].filter(Boolean).join("\n");
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
