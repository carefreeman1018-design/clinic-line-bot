import "dotenv/config";
import express from "express";
import { syncLineVoomAnnouncements } from "../scripts/sync-line-voom.js";
import { answerLineVoomAnnouncementQuestion } from "./announcements.js";
import { draftReply } from "./ai.js";
import {
  isConversationMemoryConfigured,
  loadConversationHistory,
  rememberConversationExchange
} from "./conversation.js";
import { answerBasicInfoQuestion } from "./basic-info.js";
import { answerDoctorInfoQuestion } from "./doctors.js";
import { loadKnowledge, shouldEscalate } from "./knowledge.js";
import { replyText, verifyLineSignature } from "./line.js";
import { answerFixedScheduleQuestion, answerPepVisitScheduleFollowUp } from "./schedule.js";
import { getBotEnabled, isSettingsStoreConfigured, setBotEnabled } from "./settings.js";
import { isVectorKnowledgeConfigured, retrieveHybridRelevantChunks } from "./vector-knowledge.js";
import { answerVaccineQuestion } from "./vaccines.js";
import { answerCircumcisionFastPassQuestion } from "./surgery.js";
import { answerFemaleUrologyQuestion } from "./female-urology.js";
import { answerMalePrivateSurgeryQuestion } from "./male-private.js";
import { answerVasectomyQuestion } from "./vasectomy.js";
import { answerMaleUtiUrgentQuestion } from "./male-uti.js";
import { answerProstateQuestion } from "./prostate.js";
import { answerReportResultQuestion } from "./report-results.js";
import { answerStdTreatmentQuestion } from "./std-treatment.js";
import { answerStoneQuestion } from "./stone-treatment.js";
import { answerWellnessWeightQuestion } from "./wellness-weight.js";
import { answerWoundCareQuestion } from "./wound-care.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const debugToken = process.env.DEBUG_TEST_TOKEN;
const adminUserIds = new Set(
  (process.env.LINE_ADMIN_USER_IDS || "")
    .split(",")
    .map((userId) => userId.trim())
    .filter(Boolean)
);
const pendingAssistanceByUser = new Map();
const PENDING_ASSISTANCE_TTL_MS = 30 * 60 * 1000;
const voomSyncEnabled = process.env.LINE_VOOM_SYNC_ENABLED !== "false";
const voomSyncTime = process.env.LINE_VOOM_SYNC_TIME || "03:00";

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

app.get("/health", async (_req, res) => {
  const botEnabled = await getBotEnabled();

  res.json({
    ok: true,
    lineConfigured: Boolean(channelSecret && channelAccessToken),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    vectorKnowledgeConfigured: isVectorKnowledgeConfigured(),
    conversationMemoryConfigured: isConversationMemoryConfigured(),
    settingsStoreConfigured: isSettingsStoreConfigured(),
    lineVoomSyncEnabled: voomSyncEnabled,
    lineVoomSyncTime: voomSyncTime,
    botEnabled
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
  const { reply, relevantChunks } = await buildReplyAndMatches(message, chunks, conversationHistory);

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
    const adminCommand = parseBotAdminCommand(message);
    if (adminCommand) {
      await handleBotAdminCommand(event.replyToken, userId, adminCommand);
      return;
    }

    const botEnabled = await getBotEnabled();
    if (!botEnabled) return;

    const followUpReply = buildAssistanceFollowUpReply(userId, message);
    if (followUpReply) {
      await safeReplyText(event.replyToken, followUpReply);
      await rememberConversationExchange(userId, message, followUpReply);
      return;
    }

    const simpleReply = buildSimpleReply(message);
    if (simpleReply) {
      await safeReplyText(event.replyToken, simpleReply);
      await rememberConversationExchange(userId, message, simpleReply);
      return;
    }

    const conversationHistory = await loadConversationHistory(userId);
    const chunks = await loadKnowledge();
    const { reply } = await buildReplyAndMatches(message, chunks, conversationHistory);
    rememberAssistanceIfNeeded(userId, message);

    await safeReplyText(event.replyToken, reply);
    await rememberConversationExchange(userId, message, reply);
  } catch (error) {
    console.error(error);
    await safeReplyText(event.replyToken, "系統暫時查不到資料，請稍後再試或留下問題。");
  }
}

async function handleBotAdminCommand(replyToken, userId, command) {
  if (!isAdminUser(userId)) return;

  if (command === "status") {
    const botEnabled = await getBotEnabled();
    await safeReplyText(replyToken, `目前機器人狀態：${botEnabled ? "開啟" : "關閉"}`);
    return;
  }

  const enabled = command === "enable";
  await setBotEnabled(enabled);
  await safeReplyText(replyToken, `已${enabled ? "開啟" : "關閉"}機器人。`);
}

function parseBotAdminCommand(message) {
  const normalized = message.trim().replace(/\s+/g, " ");

  if (/^(bot|機器人)\s*開啟[。！!.\s]*$/i.test(normalized)) return "enable";
  if (/^(bot|機器人)\s*關閉[。！!.\s]*$/i.test(normalized)) return "disable";
  if (/^(bot|機器人)\s*狀態[。！!.\s]*$/i.test(normalized)) return "status";

  return null;
}

function isAdminUser(userId) {
  return Boolean(userId && adminUserIds.has(userId));
}

async function buildReplyAndMatches(message, chunks, conversationHistory = []) {
  const simpleReply = buildSimpleReply(message);
  if (simpleReply) return { reply: simpleReply, relevantChunks: [] };

  if (isLowInformationMessage(message)) {
    return {
      reply: "我看得到這則訊息，但問題內容不夠明確。可以直接告訴我想問門診、預約、交通，還是哪一項服務嗎？",
      relevantChunks: []
    };
  }

  const vaccineReply = answerVaccineQuestion(message);
  if (vaccineReply) return { reply: vaccineReply, relevantChunks: [] };

  const surgeryReply = answerCircumcisionFastPassQuestion(message);
  if (surgeryReply) return { reply: surgeryReply, relevantChunks: [] };

  const femaleUrologyReply = answerFemaleUrologyQuestion(message);
  if (femaleUrologyReply) return { reply: femaleUrologyReply, relevantChunks: [] };

  const malePrivateReply = answerMalePrivateSurgeryQuestion(message);
  if (malePrivateReply) return { reply: malePrivateReply, relevantChunks: [] };

  const vasectomyReply = answerVasectomyQuestion(message);
  if (vasectomyReply) return { reply: vasectomyReply, relevantChunks: [] };

  const maleUtiUrgentReply = answerMaleUtiUrgentQuestion(message);
  if (maleUtiUrgentReply) return { reply: maleUtiUrgentReply, relevantChunks: [] };

  const prostateReply = answerProstateQuestion(message);
  if (prostateReply) return { reply: prostateReply, relevantChunks: [] };

  const stoneReply = answerStoneQuestion(message);
  if (stoneReply) return { reply: stoneReply, relevantChunks: [] };

  const wellnessWeightReply = answerWellnessWeightQuestion(message);
  if (wellnessWeightReply) return { reply: wellnessWeightReply, relevantChunks: [] };

  const reportResultReply = answerReportResultQuestion(message);
  if (reportResultReply) return { reply: reportResultReply, relevantChunks: [] };

  const stdTreatmentReply = answerStdTreatmentQuestion(message);
  if (stdTreatmentReply) return { reply: stdTreatmentReply, relevantChunks: [] };

  const woundCareReply = answerWoundCareQuestion(message);
  if (woundCareReply) return { reply: woundCareReply, relevantChunks: [] };

  if (shouldEscalate(message)) {
    return {
      reply: "這需要醫師看診判斷。請預約門診，或留下姓名、電話與方便聯絡時段。若劇烈疼痛、發燒、尿不出來或大量出血，請立即就醫。",
      relevantChunks: []
    };
  }

  const basicInfoReply = answerBasicInfoQuestion(message);
  if (basicInfoReply) return { reply: basicInfoReply, relevantChunks: [] };

  const announcementReply = answerLineVoomAnnouncementQuestion(message);
  if (announcementReply) return { reply: announcementReply, relevantChunks: [] };

  const doctorInfoReply = answerDoctorInfoQuestion(message, conversationHistory);
  if (doctorInfoReply) return { reply: doctorInfoReply, relevantChunks: [] };

  const pepVisitReply = answerPepVisitScheduleFollowUp(message, new Date(), conversationHistory);
  if (pepVisitReply) return { reply: pepVisitReply, relevantChunks: [] };

  const fixedScheduleReply = answerFixedScheduleQuestion(message, new Date(), conversationHistory);
  if (fixedScheduleReply) return { reply: fixedScheduleReply, relevantChunks: [] };

  const relevantChunks = await retrieveHybridRelevantChunks(chunks, buildContextualQuery(message, conversationHistory));

  const reply = await draftReply({
    message,
    chunks: relevantChunks,
    shouldEscalate: shouldEscalate(message),
    conversationHistory
  });

  return { reply, relevantChunks };
}

function buildSimpleReply(message) {
  const normalized = message.trim();
  if (/^(hi|hello|hey|哈囉|嗨|你好|您好|早安|午安|晚安)[。！!.\s]*$/i.test(normalized)) {
    return "我在。你想查門診、預約、交通，還是想問診所有沒有提供某項服務？";
  }

  if (/^(謝謝|感謝|thanks|thank you|thx)[。！!.\s]*$/i.test(normalized)) {
    return "不客氣，有需要我再幫你查。";
  }

  if (/^(ok|okay|好|好的|了解|收到)[。！!.\s]*$/i.test(normalized)) {
    return "收到，我先幫你記著這個脈絡。";
  }

  return null;
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
  return "可以，請留下姓名、電話、方便聯絡或預約的時段，還有簡短狀況。若有劇烈疼痛、發燒、尿不出來或大量出血，請不要等 LINE 回覆，先立即就醫。";
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

function isLowInformationMessage(message) {
  const normalized = message
    .replace(/\b[A-Z]\d{2}-\d{2}\b/gi, "")
    .replace(/[。！!？?，,、；;：:\s-]/g, "")
    .trim();

  if (!normalized) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (/^[a-z]+$/i.test(normalized) && normalized.length <= 3) return true;

  return false;
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
  scheduleDailyLineVoomSync();
});

function scheduleDailyLineVoomSync() {
  if (!voomSyncEnabled) {
    console.log("LINE VOOM daily sync is disabled.");
    return;
  }

  const delayMs = getDelayUntilNextTaipeiTime(voomSyncTime);
  const nextRunAt = new Date(Date.now() + delayMs);
  console.log(`LINE VOOM daily sync scheduled at ${formatTaipeiDateTime(nextRunAt)}.`);

  setTimeout(async () => {
    await runLineVoomSync();
    scheduleDailyLineVoomSync();
  }, delayMs);
}

async function runLineVoomSync() {
  try {
    const result = await syncLineVoomAnnouncements();
    console.log(`LINE VOOM sync completed: ${result.postCount} announcement(s) -> ${result.outputPath}`);
  } catch (error) {
    console.error("LINE VOOM sync failed:", error);
  }
}

function getDelayUntilNextTaipeiTime(timeText) {
  const parsed = parseDailyTime(timeText);
  const now = new Date();
  const taipeiParts = getTaipeiDateParts(now);
  const nextRunUtcMs = Date.UTC(
    taipeiParts.year,
    taipeiParts.month - 1,
    taipeiParts.day,
    parsed.hour - 8,
    parsed.minute,
    0,
    0
  );

  const candidateMs = nextRunUtcMs > now.getTime() ? nextRunUtcMs : nextRunUtcMs + 24 * 60 * 60 * 1000;
  return candidateMs - now.getTime();
}

function parseDailyTime(timeText) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(timeText);
  if (!match) return { hour: 3, minute: 0 };

  return {
    hour: Number(match[1]),
    minute: Number(match[2])
  };
}

function getTaipeiDateParts(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === "year")?.value),
    month: Number(parts.find((part) => part.type === "month")?.value),
    day: Number(parts.find((part) => part.type === "day")?.value)
  };
}

function formatTaipeiDateTime(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}
