import "dotenv/config";
import express from "express";
import { syncLineVoomAnnouncements } from "../scripts/sync-line-voom.js";
import { answerLineVoomAnnouncementQuestion } from "./announcements.js";
import { answerAdminMixedQuestion } from "./admin-mixed.js";
import { answerAnalColorectalQuestion } from "./anal-colorectal.js";
import { draftReply } from "./ai.js";
import {
  isConversationMemoryConfigured,
  loadConversationHistory,
  rememberConversationExchange,
  rememberConversationMessage
} from "./conversation.js";
import {
  buildDoctorReviewNotification,
  buildDoctorReviewWaitingReply,
  closeDoctorReviewCase,
  createDoctorReviewCase,
  isDoctorReviewConfigured,
  loadDoctorReviewCase,
  markDoctorReviewCaseFailed,
  markDoctorReviewCaseSending,
  markDoctorReviewCaseSent,
  parseDoctorReviewCommand
} from "./doctor-review.js";
import { answerBasicInfoQuestion } from "./basic-info.js";
import { answerDoctorInfoQuestion } from "./doctors.js";
import { loadKnowledge, shouldEscalate } from "./knowledge.js";
import { pushText, replyText, verifyLineSignature } from "./line.js";
import { applyResponseStyle, getResponseStyle } from "./response-style.js";
import { answerFixedScheduleQuestion, answerPepVisitScheduleFollowUp } from "./schedule.js";
import { getBotEnabled, getStringListSetting, isSettingsStoreConfigured, setBotEnabled } from "./settings.js";
import { answerSexualFunctionQuestion } from "./sexual-function.js";
import { isVectorKnowledgeConfigured, retrieveHybridRelevantChunks } from "./vector-knowledge.js";
import { answerVaccineQuestion } from "./vaccines.js";
import { answerCircumcisionFastPassQuestion } from "./surgery.js";
import { answerFemaleUrologyQuestion } from "./female-urology.js";
import { answerFournierGangreneQuestion } from "./fournier-gangrene.js";
import { answerHematospermiaQuestion } from "./hematospermia.js";
import { answerMaleFertilityQuestion } from "./male-fertility.js";
import { answerMalePrivateSurgeryQuestion } from "./male-private.js";
import { answerVasectomyQuestion } from "./vasectomy.js";
import { answerMaleUtiUrgentQuestion } from "./male-uti.js";
import { answerParaphimosisQuestion } from "./paraphimosis.js";
import { answerPenileFractureQuestion } from "./penile-fracture.js";
import { answerPriapismQuestion } from "./priapism.js";
import { answerProstateQuestion } from "./prostate.js";
import { answerReportResultQuestion } from "./report-results.js";
import { answerStdTreatmentQuestion } from "./std-treatment.js";
import { answerStoneQuestion } from "./stone-treatment.js";
import { answerTesticularTorsionQuestion } from "./testicular-torsion.js";
import { answerTesticularMassQuestion } from "./testicular-mass.js";
import { answerUrologyProcedureAftercareQuestion } from "./urology-procedure-aftercare.js";
import { answerWellnessWeightQuestion } from "./wellness-weight.js";
import { answerWoundCareQuestion } from "./wound-care.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const debugToken = process.env.DEBUG_TEST_TOKEN;
const envAdminUserIds = parseIdSet(process.env.LINE_ADMIN_USER_IDS);
const envReviewTargetIds = parseIdSet(process.env.LINE_REVIEW_TARGET_IDS);
const ADMIN_USER_IDS_SETTING_KEY = "line_admin_user_ids";
const REVIEW_TARGET_IDS_SETTING_KEY = "line_review_target_ids";
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
  const reviewTargetIds = await getReviewTargetIds();

  res.json({
    ok: true,
    lineConfigured: Boolean(channelSecret && channelAccessToken),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    vectorKnowledgeConfigured: isVectorKnowledgeConfigured(),
    conversationMemoryConfigured: isConversationMemoryConfigured(),
    settingsStoreConfigured: isSettingsStoreConfigured(),
    doctorReviewConfigured: isDoctorReviewConfigured() && reviewTargetIds.size > 0,
    doctorReviewTargetCount: reviewTargetIds.size,
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
    const reviewCommand = parseDoctorReviewCommand(message);
    if (reviewCommand) {
      await handleDoctorReviewCommand(event, reviewCommand);
      return;
    }

    const adminCommand = parseBotAdminCommand(message);
    if (adminCommand) {
      await handleBotAdminCommand(event.replyToken, userId, adminCommand);
      return;
    }

    const botEnabled = await getBotEnabled();
    if (!botEnabled) return;

    const patientMessage = normalizePatientQuestionForRouting(message);

    const followUpReply = buildAssistanceFollowUpReply(userId, patientMessage);
    if (followUpReply) {
      const styledReply = await styleReply({
        reply: followUpReply,
        message: patientMessage
      });
      await safeReplyText(event.replyToken, styledReply);
      await rememberConversationExchange(userId, message, styledReply);
      return;
    }

    const simpleReply = buildSimpleReply(patientMessage);
    if (simpleReply) {
      const styledReply = await styleReply({
        reply: simpleReply,
        message: patientMessage
      });
      await safeReplyText(event.replyToken, styledReply);
      await rememberConversationExchange(userId, message, styledReply);
      return;
    }

    const conversationHistory = await loadConversationHistory(userId);
    const chunks = await loadKnowledge();

    if (await shouldCreateDoctorReviewCase(patientMessage)) {
      const handled = await handleDoctorReviewRequest({
        replyToken: event.replyToken,
        userId,
        message: patientMessage,
        conversationHistory,
        chunks
      });
      if (handled) return;
    }

    const { reply } = await buildReplyAndMatches(patientMessage, chunks, conversationHistory);
    rememberAssistanceIfNeeded(userId, patientMessage);

    await safeReplyText(event.replyToken, reply);
    await rememberConversationExchange(userId, message, reply);
  } catch (error) {
    console.error(error);
    await safeReplyText(event.replyToken, "這題我現在暫時不能直接確認，請稍後再傳一次，或留下問題讓我們回覆。");
  }
}

async function handleDoctorReviewRequest({ replyToken, userId, message, conversationHistory, chunks }) {
  if (!userId || !(await isDoctorReviewReady())) return false;

  const { reply: botDraft, relevantChunks } = await buildReplyAndMatches(message, chunks, conversationHistory);
  const reviewCase = await createDoctorReviewCase({
    lineUserId: userId,
    userMessage: message,
    conversationHistory,
    botDraft,
    metadata: {
      relevant_chunks: relevantChunks.map((chunk) => ({
        source: chunk.source,
        title: chunk.title,
        score: chunk.score
      }))
    }
  });

  if (!reviewCase) return false;

  const waitingReply = await styleReply({
    reply: buildDoctorReviewWaitingReply(message, { botDraft }),
    message,
    relevantChunks,
    conversationHistory
  });
  await notifyDoctorReviewTargets(reviewCase, { waitingReply });
  await safeReplyText(replyToken, waitingReply);
  await rememberConversationExchange(userId, message, waitingReply);
  return true;
}

async function handleDoctorReviewCommand(event, command) {
  const userId = event.source?.userId;
  const sourceId = getLineSourceId(event.source);

  if (!(await isDoctorReviewCommandAuthorized(userId, sourceId))) return;

  if (!isDoctorReviewConfigured()) {
    await safeReplyText(event.replyToken, "醫師覆核佇列尚未啟用，請確認 Supabase 與 DOCTOR_REVIEW_ENABLED。");
    return;
  }

  if (command.action === "close") {
    const closedCase = await closeDoctorReviewCase({
      caseId: command.caseId,
      reviewerLineUserId: userId,
      reviewSourceId: sourceId
    });

    if (closedCase) {
      await safeReplyText(event.replyToken, `#${command.caseId} 已關閉，不會發送給病人。`);
      return;
    }

    await replyDoctorReviewCaseUnavailable(event.replyToken, command.caseId);
    return;
  }

  const reviewCase = await loadDoctorReviewCase(command.caseId);
  if (!reviewCase) {
    await safeReplyText(event.replyToken, `找不到 #${command.caseId} 覆核案件。`);
    return;
  }

  const finalReply = await buildDoctorApprovedReply(reviewCase, command);
  const sendingCase = await markDoctorReviewCaseSending({
    caseId: command.caseId,
    reviewerLineUserId: userId,
    reviewSourceId: sourceId,
    doctorReply: command.doctorReply ?? null,
    finalReply
  });

  if (!sendingCase) {
    await replyDoctorReviewCaseUnavailable(event.replyToken, command.caseId);
    return;
  }

  try {
    await pushText(sendingCase.lineUserId, finalReply, channelAccessToken);
    await markDoctorReviewCaseSent(command.caseId);
    await rememberConversationMessage(sendingCase.lineUserId, "assistant", finalReply);
    await safeReplyText(event.replyToken, `#${command.caseId} 已發送給病人。`);
  } catch (error) {
    console.error(error);
    await markDoctorReviewCaseFailed(command.caseId, error.message);
    await safeReplyText(event.replyToken, `#${command.caseId} 發送失敗：${error.message}`);
  }
}

async function buildDoctorApprovedReply(reviewCase, command) {
  const reply = command.action === "reply" ? command.doctorReply : reviewCase.botDraft;

  return styleReply({
    reply,
    message: reviewCase.userMessage,
    relevantChunks: [],
    conversationHistory: reviewCase.conversationSnapshot
  });
}

async function notifyDoctorReviewTargets(reviewCase, options = {}) {
  const notification = buildDoctorReviewNotification(reviewCase, options);
  const reviewTargetIds = await getReviewTargetIds();
  await Promise.all([...reviewTargetIds].map((targetId) => safePushText(targetId, notification)));
}

async function replyDoctorReviewCaseUnavailable(replyToken, caseId) {
  const reviewCase = await loadDoctorReviewCase(caseId);
  const statusText = reviewCase ? `目前狀態是 ${reviewCase.status}` : "找不到案件";
  await safeReplyText(replyToken, `#${caseId} 不能處理，${statusText}。`);
}

async function handleBotAdminCommand(replyToken, userId, command) {
  if (!(await isAdminUser(userId))) return;

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

async function isAdminUser(userId) {
  const adminUserIds = await getAdminUserIds();
  return Boolean(userId && adminUserIds.has(userId));
}

async function isDoctorReviewReady() {
  const reviewTargetIds = await getReviewTargetIds();
  return isDoctorReviewConfigured() && reviewTargetIds.size > 0;
}

async function shouldCreateDoctorReviewCase(message) {
  if (shouldBypassDoctorReviewForRoutedSafety(message)) return false;
  if (shouldBypassDoctorReviewForOfficialGeneralInfo(message)) return false;
  if (shouldBypassDoctorReviewForAnonymousScreeningLogistics(message)) return false;
  if (shouldBypassDoctorReviewForReportLogistics(message)) return false;
  if (shouldBypassDoctorReviewForRoutineAdmin(message)) return false;
  return (await isDoctorReviewReady()) && shouldEscalate(message);
}

export function shouldBypassDoctorReviewForRoutedSafety(message) {
  return Boolean(
    answerTesticularMassQuestion(message) ||
    answerMaleUtiUrgentQuestion(message) ||
    answerWoundCareQuestion(message) ||
    answerCircumcisionFastPassQuestion(message) ||
    answerVasectomyQuestion(message) ||
    answerMalePrivateSurgeryQuestion(message) ||
    answerProstateQuestion(message)
  );
}

export function shouldBypassDoctorReviewForOfficialGeneralInfo(message) {
  const asksGeneralProstateCancerInfo = (
    /攝護腺肥大|前列腺肥大/.test(message) &&
    /攝護腺癌|前列腺癌|癌/.test(message)
  );
  const hasPersonalReportOrDecisionCue = /我|爸爸|媽媽|家人|報告|檢查結果|PSA|攝護腺指數|超音波|尿流速|切片|數值|Gleason|格里森|要不要|需不需要|治療|手術|開刀|打針|開藥/i.test(message);

  const asksOfficialShockwaveFaqInfo = (
    /低能量震波|線性震波|震波治療|LI-ESWT|Piezowave/i.test(message) &&
    /痛|疼痛|不適合|哪些人|不能做|禁忌|自費|健保|給付|費用|維持|效果.*多久|撐多久|幾次|時間|療程|恢復期|恢復|休息|壯陽藥|威而鋼|犀利士|口服藥|搭配|副作用|腫脹|不適/.test(message)
  );
  const hasPersonalShockwaveSymptomCue = /我|本人|自己|今天|現在|剛|剛剛|昨|前天|術後|治療後|做完|打完|發燒|尿不出|大量出血|感染|傷口|潰瘍|劇烈疼痛|很痛|痛到|越來越痛|明顯惡化/.test(message);

  return (asksGeneralProstateCancerInfo && !hasPersonalReportOrDecisionCue) ||
    (asksOfficialShockwaveFaqInfo && !hasPersonalShockwaveSymptomCue);
}

export function shouldBypassDoctorReviewForAnonymousScreeningLogistics(message) {
  const hasAnonymousScreening = /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message);
  const asksNotificationOrPrivacy = /報告.*出來|結果.*通知|通知|打電話|電話|講.*內容|檢查內容|家人|隱私|保密|流程/.test(message);
  const asksMedicalInterpretation = /陽性|陰性|數值|正常|不正常|判讀|確診|是不是/.test(message);
  const hasExposureOrTreatmentRisk = /PEP|PrEP|HIV|愛滋|暴露|無套|高風險|淋病|梅毒|披衣菌|症狀|水泡|潰瘍|流膿|發燒|睪丸痛|下腹痛/i.test(message);

  return hasAnonymousScreening && asksNotificationOrPrivacy && !asksMedicalInterpretation && !hasExposureOrTreatmentRisk;
}

export function shouldBypassDoctorReviewForReportLogistics(message) {
  if (asksLabReportTimingNotificationLogistics(message)) return true;

  const mentionsOutsideMaterials = /別家診所|外院|別家醫院|其他診所|其他醫院|藥袋|用藥資料|影像光碟|檢查報告|醫療報告/.test(message);
  const asksBringOrSendLogistics = /帶去|帶來|帶過去|要帶|需要帶|可以先傳|先傳 LINE|傳 LINE|補傳|要帶哪些資料|不要幫我判讀|不要判讀/.test(message);
  const asksPersonalInterpretation = /正常不正常|正不正常|需不需要回診|要不要回診|有沒有問題|嚴不嚴重|是不是.*病|幫我看|幫我判讀/.test(message)
    && !/不要.*判讀|不用.*判讀|不需要.*判讀/.test(message);

  return mentionsOutsideMaterials && asksBringOrSendLogistics && !asksPersonalInterpretation;
}

function asksLabReportTimingNotificationLogistics(message) {
  if (/匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)) return false;

  const hasLabReportCue = /抽血報告|驗血報告|血液報告/.test(message)
    || (/報告/.test(message) && /抽血|驗血|血液/.test(message))
    || (/報告|檢查結果|檢驗結果/.test(message) && /醫師開檢查|醫生開檢查|醫師.*檢查|醫生.*檢查|開檢查|做檢查/.test(message));
  const asksTimingOrNotification = /幾天|多久|什麼時候|出來|好了沒|通知|LINE|line|打電話|電話/.test(message);
  const asksPersonalInterpretation = /數值|正常|不正常|陽性|陰性|判讀|解讀|是不是|要不要回診|嚴不嚴重|幫我看|幫我判讀/.test(message);

  return hasLabReportCue && asksTimingOrNotification && !asksPersonalInterpretation;
}

export function shouldBypassDoctorReviewForRoutineAdmin(message) {
  const asksTomorrowAfternoon = /明天.*(下午|午診)|(?:下午|午診).*明天/.test(message);
  if (!asksTomorrowAfternoon) return false;

  const asksClinicTimeOrDoctor = /門診時間|時間|哪位醫師|哪位醫生|醫師|醫生|誰看|一般泌尿|泌尿/.test(message);
  const asksRoutineFlow = /同一個號|同一號|同一天|同日|順便|分開掛號|分開.*掛|掛一般泌尿|只是問|只問|不想做治療|請直接回答|跟前面.*無關|無關/.test(message);
  const mentionsReportOrVaccine = /報告|抽血報告|檢查結果|檢驗結果|HPV\s*疫苗|HPV|九價|疫苗/i.test(message);

  return asksClinicTimeOrDoctor && (asksRoutineFlow || mentionsReportOrVaccine);
}

async function isDoctorReviewCommandAuthorized(userId, sourceId) {
  const reviewTargetIds = await getReviewTargetIds();
  return (await isAdminUser(userId)) || Boolean(sourceId && reviewTargetIds.has(sourceId));
}

function getLineSourceId(source) {
  return source?.groupId || source?.roomId || source?.userId || null;
}

async function getAdminUserIds() {
  const settingUserIds = await getStringListSetting(ADMIN_USER_IDS_SETTING_KEY, []);
  if (settingUserIds.length > 0) return new Set(settingUserIds);
  return envAdminUserIds;
}

async function getReviewTargetIds() {
  const settingTargetIds = await getStringListSetting(REVIEW_TARGET_IDS_SETTING_KEY, []);
  if (settingTargetIds.length > 0) return new Set(settingTargetIds);
  return envReviewTargetIds;
}

function parseIdSet(value) {
  return new Set(
    String(value || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

export async function buildReplyAndMatches(message, chunks, conversationHistory = []) {
  const responseStyle = await getResponseStyle();
  const patientMessage = normalizePatientQuestionForRouting(message);
  const patientConversationHistory = normalizeConversationHistoryForRouting(conversationHistory);
  const result = await buildRawReplyAndMatches(patientMessage, chunks, patientConversationHistory);
  return {
    ...result,
    reply: applyResponseStyle({
      reply: result.reply,
      message: patientMessage,
      relevantChunks: result.relevantChunks,
      conversationHistory: patientConversationHistory,
      style: responseStyle
    })
  };
}

function normalizeConversationHistoryForRouting(conversationHistory = []) {
  return conversationHistory.map((item) => ({
    ...item,
    content: item.role === "user"
      ? normalizePatientQuestionForRouting(item.content ?? "")
      : item.content
  }));
}

function normalizePatientQuestionForRouting(message) {
  return String(message || "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^(?:第[一二三四五六七八九十\d]+次)?\s*重測(?:一|二|三|四|五|\d+)?\s*[：:、-]?\s*/u, "")
    .replace(/^Round\s*\d+(?:[-_]\d+)?\s*[：:、-]\s*/iu, "")
    .replace(/^R\s*\d+(?:[-_]\d+)?\s*[：:、-]\s*/iu, "")
    .replace(/^(?:第三次|第二次|第一次)?\s*重測\s*Round\s*\d+(?:[-_]\d+)?\s*[：:、-]\s*/iu, "")
    .trim();
}

async function buildRawReplyAndMatches(message, chunks, conversationHistory = []) {
  const simpleReply = buildSimpleReply(message);
  if (simpleReply) return { reply: simpleReply, relevantChunks: [] };

  if (isLowInformationMessage(message)) {
    return {
      reply: "我收到，但問題內容還不夠明確。可以直接告訴我想問門診、預約、交通，還是哪一項服務嗎？",
      relevantChunks: []
    };
  }

  if (isClearlyOutOfScopeMessage(message)) {
    return {
      reply: "這題跟診所服務無關，我不能協助處理這類內容。若要問門診、預約、交通或診所有沒有提供某項服務，可以直接傳訊息給我。",
      relevantChunks: []
    };
  }

  if (isClearlyOutOfScopeMessage(message)) {
    return {
      reply: "這題跟診所服務無關，我不能協助處理這類內容。若要問門診、預約、交通或診所有沒有提供某項服務，可以直接傳訊息給我。",
      relevantChunks: []
    };
  }

  const announcementReply = answerLineVoomAnnouncementQuestion(message);
  if (announcementReply) return { reply: announcementReply, relevantChunks: [] };

  if (shouldPrioritizeDoctorNameSchedule(message)) {
    const fixedScheduleReply = answerFixedScheduleQuestion(message, new Date(), conversationHistory);
    if (fixedScheduleReply) return { reply: fixedScheduleReply, relevantChunks: [] };
  }

  if (shouldPrioritizeProstateServiceSchedule(message)) {
    const prostateReply = answerProstateQuestion(message);
    if (prostateReply) return { reply: prostateReply, relevantChunks: [] };
  }

  const priorityStdTreatmentReply = answerStdTreatmentQuestion(message);
  if (priorityStdTreatmentReply) return { reply: priorityStdTreatmentReply, relevantChunks: [] };

  const adminMixedReply = answerAdminMixedQuestion(message);
  if (adminMixedReply) return { reply: adminMixedReply, relevantChunks: [] };

  const wellnessWeightReply = answerWellnessWeightQuestion(message);
  if (wellnessWeightReply) return { reply: wellnessWeightReply, relevantChunks: [] };

  const femaleUrologyReply = answerFemaleUrologyQuestion(message, conversationHistory);
  if (femaleUrologyReply) return { reply: femaleUrologyReply, relevantChunks: [] };

  const vaccineReply = answerVaccineQuestion(message, conversationHistory);
  if (vaccineReply) return { reply: vaccineReply, relevantChunks: [] };

  const paraphimosisReply = answerParaphimosisQuestion(message);
  if (paraphimosisReply) return { reply: paraphimosisReply, relevantChunks: [] };

  const priapismReply = answerPriapismQuestion(message);
  if (priapismReply) return { reply: priapismReply, relevantChunks: [] };

  const penileFractureReply = answerPenileFractureQuestion(message);
  if (penileFractureReply) return { reply: penileFractureReply, relevantChunks: [] };

  const fournierGangreneReply = answerFournierGangreneQuestion(message);
  if (fournierGangreneReply) return { reply: fournierGangreneReply, relevantChunks: [] };

  const testicularTorsionReply = answerTesticularTorsionQuestion(message);
  if (testicularTorsionReply) return { reply: testicularTorsionReply, relevantChunks: [] };

  const testicularMassReply = answerTesticularMassQuestion(message);
  if (testicularMassReply) return { reply: testicularMassReply, relevantChunks: [] };

  const maleFertilityReply = answerMaleFertilityQuestion(message);
  if (maleFertilityReply) return { reply: maleFertilityReply, relevantChunks: [] };

  const woundCareReply = answerWoundCareQuestion(message);
  if (woundCareReply) return { reply: woundCareReply, relevantChunks: [] };

  const procedureAftercareReply = answerUrologyProcedureAftercareQuestion(message);
  if (procedureAftercareReply) return { reply: procedureAftercareReply, relevantChunks: [] };

  const surgeryReply = answerCircumcisionFastPassQuestion(message, conversationHistory);
  if (surgeryReply) return { reply: surgeryReply, relevantChunks: [] };

  const malePrivateReply = answerMalePrivateSurgeryQuestion(message);
  if (malePrivateReply) return { reply: malePrivateReply, relevantChunks: [] };

  const sexualFunctionReply = answerSexualFunctionQuestion(message);
  if (sexualFunctionReply) return { reply: sexualFunctionReply, relevantChunks: [] };

  const vasectomyReply = answerVasectomyQuestion(message, new Date(), conversationHistory);
  if (vasectomyReply) return { reply: vasectomyReply, relevantChunks: [] };

  const maleUtiUrgentReply = answerMaleUtiUrgentQuestion(message);
  if (maleUtiUrgentReply) return { reply: maleUtiUrgentReply, relevantChunks: [] };

  const hematospermiaReply = answerHematospermiaQuestion(message);
  if (hematospermiaReply) return { reply: hematospermiaReply, relevantChunks: [] };

  const reportResultReply = answerReportResultQuestion(message, conversationHistory);
  if (reportResultReply) return { reply: reportResultReply, relevantChunks: [] };

  const prostateReply = answerProstateQuestion(message);
  if (prostateReply) return { reply: prostateReply, relevantChunks: [] };

  const stoneReply = answerStoneQuestion(message);
  if (stoneReply) return { reply: stoneReply, relevantChunks: [] };

  const analColorectalReply = answerAnalColorectalQuestion(message);
  if (analColorectalReply) return { reply: analColorectalReply, relevantChunks: [] };

  const stdTreatmentReply = answerStdTreatmentQuestion(message);
  if (stdTreatmentReply) return { reply: stdTreatmentReply, relevantChunks: [] };

  const pepVisitReply = answerPepVisitScheduleFollowUp(message, new Date(), conversationHistory);
  if (pepVisitReply) return { reply: pepVisitReply, relevantChunks: [] };

  const doctorInfoReply = answerDoctorInfoQuestion(message, conversationHistory);
  if (doctorInfoReply) return { reply: doctorInfoReply, relevantChunks: [] };

  const fixedScheduleReply = answerFixedScheduleQuestion(message, new Date(), conversationHistory);
  if (fixedScheduleReply) return { reply: fixedScheduleReply, relevantChunks: [] };

  if (shouldEscalate(message)) {
    return {
      reply: "這需要到門診看一下。請先預約，或留下姓名、電話與方便聯絡時段。若劇烈疼痛、發燒、尿不出來或大量出血，請立即就醫。",
      relevantChunks: []
    };
  }

  const basicInfoReply = answerBasicInfoQuestion(message);
  if (basicInfoReply) return { reply: basicInfoReply, relevantChunks: [] };

  const relevantChunks = await retrieveHybridRelevantChunks(chunks, buildContextualQuery(message, conversationHistory));

  const reply = await draftReply({
    message,
    chunks: relevantChunks,
    shouldEscalate: shouldEscalate(message),
    conversationHistory,
    responseStyle: await getResponseStyle()
  });

  return { reply, relevantChunks };
}

function buildSimpleReply(message) {
  const normalized = message.trim();
  if (/^(hi|hello|hey|哈囉|嗨|你好|您好|早安|午安|晚安)[。！!.\s]*$/i.test(normalized)) {
    return "我在。你想查門診、預約、交通，還是想問診所有沒有提供某項服務？";
  }

  if (/^(等一下|等等|稍等|先等一下|先等等|等我一下|我等一下|我等等)[。！!.\s]*$/i.test(normalized)) {
    return "好，我先等你。";
  }

  if (/^(喔+|哦+|噢+|哈哈+|呵呵+|嘿嘿+|無聊|隨便|你在幹嘛|你在做什麼|在幹嘛|在做什麼)[。！!?.？\s]*$/i.test(normalized)) {
    return "我在，有需要可以直接問門診、預約、交通或服務項目。";
  }

  if (/^(搞笑喔|搞笑哦|搞笑嗎|屁啦|亂回|你在亂回|不要亂回|回錯了|不是啦|蛤|蛤\?|蛤？|啥|什麼鬼)[。！!?.？\s]*$/i.test(normalized)) {
    return "抱歉，剛剛回得不對。我重來，你直接說想問的內容就好。";
  }

  if (/^(謝謝|感謝|thanks|thank you|thx)[。！!.\s]*$/i.test(normalized)) {
    return "不客氣，有需要我再幫你查。";
  }

  if (/^(ok|okay|好|好的|好喔|好哦|好啦|了解|收到|知道了|明白|喔+好|喔+喔+好|哦+好|嗯+好|恩+好|嗯+嗯+|恩+恩+)[。！!.\s]*$/i.test(normalized)) {
    return "好，有需要再直接傳訊息給我。";
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

  const intakeReply = buildAppointmentIntakeReply(userId, message, pending);
  if (intakeReply) return intakeReply;

  if (!isAffirmative(message)) return null;

  pendingAssistanceByUser.set(userId, {
    ...pending,
    awaitingAppointmentInfo: true,
    lastUpdatedAt: Date.now()
  });
  return "可以，請留下姓名、電話、方便聯絡或預約的時段，還有簡短狀況。若有劇烈疼痛、發燒、尿不出來或大量出血，請不要等線上回覆，先立即就醫。";
}

function rememberAssistanceIfNeeded(userId, message) {
  if (!userId || !shouldEscalate(message)) return;

  pendingAssistanceByUser.set(userId, {
    createdAt: Date.now(),
    topic: inferAppointmentTopic(message)
  });
}

function buildAppointmentIntakeReply(userId, message, pending) {
  if (!pending.awaitingAppointmentInfo || !looksLikeAppointmentIntake(message)) return null;

  const collected = {
    name: Boolean(pending.collected?.name || hasLikelyName(message)),
    phone: Boolean(pending.collected?.phone || hasTaiwanPhone(message)),
    time: Boolean(pending.collected?.time || hasTimePreference(message)),
    topic: pending.collected?.topic || inferAppointmentTopic(message) || pending.topic || null
  };

  const missing = [];
  if (!collected.phone) missing.push("電話");
  if (!collected.name) missing.push("姓名");
  if (!collected.time) missing.push("方便聯絡或預約的時段");
  if (!collected.topic) missing.push("想預約/詢問的項目或簡短狀況");

  if (missing.length === 0) {
    pendingAssistanceByUser.delete(userId);
    return "收到，我先幫你記下資料。診所人員會再依現場時段與項目確認安排；如果症狀突然變嚴重、發燒、尿不出來或大量出血，請先立即就醫。";
  }

  pendingAssistanceByUser.set(userId, {
    ...pending,
    collected,
    lastUpdatedAt: Date.now()
  });
  return `收到，我先幫你記下已提供的資料。還差：${missing.join("、")}。`;
}

function looksLikeAppointmentIntake(message) {
  return hasTaiwanPhone(message) ||
    hasLikelyName(message) ||
    hasTimePreference(message) ||
    Boolean(inferAppointmentTopic(message));
}

function hasTaiwanPhone(message) {
  return /(?:09\d{2}[-\s]?\d{3}[-\s]?\d{3}|0\d{1,2}[-\s]?\d{3,4}[-\s]?\d{4})/.test(message);
}

function hasLikelyName(message) {
  if (/^[\u4e00-\u9fff]{2,5}\s+(?=09\d{2}|0\d{1,2})/.test(message.trim())) return true;
  const text = message.replace(/[0-9０-９+\-()\s]/g, "").trim();
  if (/^(HPV|HIV|PEP|PrEP)$/i.test(text)) return false;
  if (/今天|明天|後天|早上|上午|中午|下午|晚上|晚診|午診|早診|週|周|星期|禮拜|疫苗|篩檢|門診|回診|預約|掛號/.test(text)) return false;
  return /^[\u4e00-\u9fff]{2,5}$/.test(text) || /(?:姓名|名字|我叫|我是)[：:\s]*[\u4e00-\u9fff]{2,5}/.test(message);
}

function hasTimePreference(message) {
  return /方便|早上|上午|中午|下午|晚上|晚診|午診|早診|今天|明天|後天|週[一二三四五六日天]|周[一二三四五六日天]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|\d{1,2}[：:點]\d{0,2}|\d{1,2}\/\d{1,2}/.test(message);
}

function inferAppointmentTopic(message) {
  if (/HPV\s*疫苗|九價|子宮頸癌疫苗/i.test(message)) return "HPV 疫苗";
  if (/皮蛇疫苗|帶狀皰疹疫苗/.test(message)) return "皮蛇疫苗";
  if (/匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)) return "匿名篩檢";
  if (/菜花|尖銳濕疣|HPV(?!\s*疫苗)/i.test(message)) return "菜花/HPV 評估";
  if (/包皮|結紮|震波|猛健樂|攝護腺|結石|血尿|頻尿|漏尿|泌尿|肛門|痔瘡|廔管|肛裂/.test(message)) return "門診評估";
  return null;
}

function isAffirmative(message) {
  return /^(好|好的|可以|需要|要|麻煩|麻煩你|請幫我|幫我|ok|OK|yes|Yes|好啊|可以啊)(?:[，,、\s]*(下一步|麻煩你|請幫我|幫我))?[。！!.\s]*$/.test(message.trim());
}

function isLowInformationMessage(message) {
  const normalized = message
    .replace(/\b[A-Z]\d{2}-\d{2}\b/gi, "")
    .replace(/[。！!？?，,、；;：:\s-]/g, "")
    .trim();

  if (!normalized) return true;
  if (/^\d+$/.test(normalized)) return true;
  if (/^[a-z]+$/i.test(normalized) && normalized.length <= 3) return true;
  if (/^([\u4e00-\u9fff])\1{2,}$/.test(normalized)) return true;
  if (/^[\u4e00-\u9fff]{1,2}$/.test(normalized) && !hasShortClinicIntent(normalized)) return true;

  return false;
}

function hasShortClinicIntent(text) {
  return /包皮|結紮|血尿|頻尿|漏尿|菜花|皰疹|梅毒|淋病|HPV|HIV|PEP|PrEP|疫苗|門診|掛號|地址|電話|交通|報告|醫師|醫生/i.test(text);
}

function isClearlyOutOfScopeMessage(message) {
  if (hasExplicitOutOfScopeProgrammingIntent(message)) return true;
  if (hasClinicOrMedicalIntent(message)) return false;

  return [
    /(?:python|javascript|typescript|java|c\+\+|c#|vba|excel|程式|腳本|巨集|macro|script|code|coding|演算法|資料結構|資料結構作業)/i,
    /(?:linked\s*list|連結串列|鏈結串列|反轉.*(?:串列|list)|reverse.*list)/i,
    /(?:幫我寫|寫一個|給我.*範例|提供.*範例|念一段|唸一段|教我|完整程式碼).*(?:python|javascript|c\+\+|vba|excel|程式|腳本|巨集|linked\s*list|連結串列|鏈結串列)/i
  ].some((pattern) => pattern.test(message));
}

function hasExplicitOutOfScopeProgrammingIntent(message) {
  const saysOutOfScope = /(?:跟|和|與)?(?:診所|醫療|門診|服務)(?:完全)?無關|不是(?:診所|醫療|門診|服務)|只是測試|不要.*診所|不要.*醫療|不要.*官網/.test(message);
  const hasProgrammingCue = /python|javascript|typescript|java|c\+\+|c#|vba|excel|程式|腳本|巨集|macro|script|code|coding|演算法|資料結構|linked\s*list|連結串列|鏈結串列/i.test(message);
  return saysOutOfScope && hasProgrammingCue;
}

function hasClinicOrMedicalIntent(message) {
  return /津久|診所|門診|掛號|預約|交通|地址|電話|醫師|醫生|櫃台|看診|回診|檢查|報告|費用|價格|收據|診斷證明|泌尿|肛門|大腸直腸|包皮|結紮|性病|篩檢|疫苗|HPV|HIV|PEP|PrEP|菜花|梅毒|淋病|披衣菌|皰疹|血尿|頻尿|漏尿|尿痛|尿不出來|攝護腺|結石|睪丸|陰莖|陰囊|會陰|割包皮|猛健樂|美磁波|震波|水蒸氣|痔瘡|肛裂|廔管/i.test(message);
}

function shouldPrioritizeDoctorNameSchedule(message) {
  const hasDoctorNameCorrection = /羅世修|羅詩修嗎|羅醫師是羅詩修|羅醫生是羅詩修/.test(message);
  const hasScheduleCue = /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|白天|下午|晚上|早診|午診|晚診|有診|門診|看診/.test(message);
  return hasDoctorNameCorrection && hasScheduleCue;
}

function shouldPrioritizeProstateServiceSchedule(message) {
  const hasProstateService = /攝護腺肥大|前列腺肥大|水蒸氣|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除/i.test(message);
  const hasScheduleOrRoutingCue = /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|白天|下午|晚上|早診|午診|晚診|掛|門診|看診|哪一診|哪診|可以先諮詢|先諮詢/.test(message);
  return hasProstateService && hasScheduleOrRoutingCue;
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

async function styleReply({ reply, message = "", relevantChunks = [], conversationHistory = [] }) {
  return applyResponseStyle({
    reply,
    message,
    relevantChunks,
    conversationHistory,
    style: await getResponseStyle()
  });
}

async function safePushText(to, message) {
  try {
    await pushText(to, message, channelAccessToken);
  } catch (error) {
    console.error(error);
  }
}

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => {
    console.log(`Clinic LINE bot listening on port ${port}`);
    scheduleDailyLineVoomSync();
  });
}

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
