import { supabase } from "./supabase.js";

const DOCTOR_REVIEW_TABLE = process.env.SUPABASE_DOCTOR_REVIEW_TABLE || "doctor_review_cases";
const DOCTOR_REVIEW_ENABLED = process.env.DOCTOR_REVIEW_ENABLED !== "false";
const MAX_CONTEXT_MESSAGES = Number(process.env.DOCTOR_REVIEW_CONTEXT_MESSAGES || 8);

export function isDoctorReviewConfigured() {
  return Boolean(DOCTOR_REVIEW_ENABLED && supabase);
}

export async function createDoctorReviewCase({
  lineUserId,
  userMessage,
  conversationHistory = [],
  botDraft,
  metadata = {}
}) {
  if (!isDoctorReviewConfigured()) return null;

  const conversationSnapshot = conversationHistory.slice(-MAX_CONTEXT_MESSAGES);
  const conversationSummary = summarizeConversation(conversationSnapshot);

  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .insert({
      line_user_id: lineUserId,
      user_message: userMessage,
      conversation_summary: conversationSummary,
      conversation_snapshot: conversationSnapshot,
      bot_draft: botDraft,
      metadata
    })
    .select("*")
    .single();

  if (error) {
    console.error("Doctor review case create failed:", error);
    return null;
  }

  return normalizeCase(data);
}

export async function loadDoctorReviewCase(caseId) {
  if (!isDoctorReviewConfigured()) return null;

  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .select("*")
    .eq("id", caseId)
    .single();

  if (error) {
    console.error("Doctor review case load failed:", error);
    return null;
  }

  return normalizeCase(data);
}

export async function markDoctorReviewCaseSending({
  caseId,
  reviewerLineUserId,
  reviewSourceId,
  doctorReply = null,
  finalReply
}) {
  if (!isDoctorReviewConfigured()) return null;

  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .update({
      status: "sending",
      reviewer_line_user_id: reviewerLineUserId,
      review_source_id: reviewSourceId,
      doctor_reply: doctorReply,
      final_reply: finalReply,
      updated_at: new Date().toISOString()
    })
    .eq("id", caseId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Doctor review case sending mark failed:", error);
    return null;
  }

  return data ? normalizeCase(data) : null;
}

export async function markDoctorReviewCaseSent(caseId) {
  if (!isDoctorReviewConfigured()) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .update({
      status: "sent",
      sent_at: now,
      updated_at: now
    })
    .eq("id", caseId)
    .eq("status", "sending")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Doctor review case sent mark failed:", error);
    return null;
  }

  return data ? normalizeCase(data) : null;
}

export async function markDoctorReviewCaseFailed(caseId, errorMessage) {
  if (!isDoctorReviewConfigured()) return null;

  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .update({
      status: "failed",
      metadata: {
        last_error: String(errorMessage).slice(0, 1000)
      },
      updated_at: new Date().toISOString()
    })
    .eq("id", caseId)
    .eq("status", "sending")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Doctor review case failed mark failed:", error);
    return null;
  }

  return data ? normalizeCase(data) : null;
}

export async function closeDoctorReviewCase({ caseId, reviewerLineUserId, reviewSourceId }) {
  if (!isDoctorReviewConfigured()) return null;

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(DOCTOR_REVIEW_TABLE)
    .update({
      status: "closed",
      reviewer_line_user_id: reviewerLineUserId,
      review_source_id: reviewSourceId,
      closed_at: now,
      updated_at: now
    })
    .eq("id", caseId)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();

  if (error) {
    console.error("Doctor review case close failed:", error);
    return null;
  }

  return data ? normalizeCase(data) : null;
}

export function buildDoctorReviewNotification(reviewCase, { waitingReply = "" } = {}) {
  return [
    `#${reviewCase.id} 待醫師覆核`,
    "",
    "【對話紀錄｜由舊到新】",
    formatConversationTimeline(reviewCase, { waitingReply }),
    "",
    "【bot 草稿】",
    indentText(truncateText(reviewCase.botDraft, 900)),
    "",
    "【可用指令】",
    `核准 ${reviewCase.id}`,
    `回覆 ${reviewCase.id} 內容...`,
    `關閉 ${reviewCase.id}`
  ].join("\n");
}

export function buildDoctorReviewWaitingReply(message = "", { botDraft = "" } = {}) {
  if (hasUrgentBleedingCue(message)) {
    return [
      "你描述術後一直流血、壓了也停不下來又很痛，請不要等線上回覆，先立即就醫或到急診。",
      "這題我也先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
    ].join("\n");
  }

  const urgentDraftSummary = buildUrgentDraftSummary(botDraft);
  if (urgentDraftSummary) {
    return [
      urgentDraftSummary,
      "這題我也先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
    ].join("\n");
  }

  const safetyDraftSummary = buildSafetyDraftSummary(botDraft);
  if (safetyDraftSummary) {
    return [
      safetyDraftSummary,
      "這題我先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
    ].join("\n");
  }

  const reportPickupDraft = buildReportPickupDraftSummary(botDraft);
  if (reportPickupDraft) {
    return [
      reportPickupDraft,
      "這題我先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
    ].join("\n");
  }

  const outsideReportDraft = buildOutsideReportVisitDraftSummary(botDraft);
  if (outsideReportDraft) {
    return [
      outsideReportDraft,
      "這題我先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
    ].join("\n");
  }

  if (isReportReviewQuestion(message) && !hasSymptomCue(message)) {
    return "這題我先幫你轉請醫師或診所人員確認，確認後會再回覆你。";
  }

  return [
    "這題我先幫你轉請醫師或診所人員確認，確認後會再回覆你。",
    "如果有劇烈疼痛、發燒、尿不出來、大量出血或明顯惡化，請不要等線上回覆，先立即就醫。"
  ].join("\n");
}

function buildUrgentDraftSummary(botDraft) {
  const normalized = String(botDraft || "").trim();
  if (!/(急診|立即就醫)/.test(normalized)) return null;

  const sentences = normalized
    .split(/(?<=[。！？])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  if (sentences.length === 0) return normalized;

  const selected = [];
  for (const sentence of sentences) {
    selected.push(sentence);
    if (hasActionableUrgentInstruction(sentence) || selected.length >= 4) break;
  }

  if (!selected.some(hasActionableUrgentInstruction)) {
    selected.push("請不要等線上回覆，先急診/立即就醫。");
  }

  return selected.join("");
}

function hasActionableUrgentInstruction(text) {
  return /立即就醫|請.*急診|先.*急診|直接.*急診|現在.*急診|就急診/.test(text);
}

function buildSafetyDraftSummary(botDraft) {
  const normalized = String(botDraft || "").trim();
  if (!hasSelfCareSafetyInstruction(normalized)) return null;

  const sentences = normalized
    .split(/(?<=[。！？])/u)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const selected = [];
  for (const sentence of sentences) {
    if (selected.length === 0 && isShortSafetyContext(sentence)) {
      selected.push(sentence);
      continue;
    }

    if (hasSelfCareSafetyInstruction(sentence)) {
      selected.push(sentence);
    }

    if (selected.length >= 3) break;
  }

  return selected.length > 0 ? selected.join("") : null;
}

function buildReportPickupDraftSummary(botDraft) {
  const normalized = String(botDraft || "").trim();
  if (!/報告涉及個人醫療資料|能不能由家人代領|代領人身分證|授權或關係資料/.test(normalized)) return null;
  return normalized;
}

function buildOutsideReportVisitDraftSummary(botDraft) {
  const normalized = String(botDraft || "").trim();
  if (!/別家醫院|外院/.test(normalized)) return null;
  if (!/帶來門診|不建議先在 LINE 傳個人醫療報告/.test(normalized)) return null;
  return normalized;
}

function hasSelfCareSafetyInstruction(text) {
  return /不要自行|不建議自行|不能.*自行|不要先自行|下一針不要|不要.*照打|不要.*調劑量|不要.*停藥|不建議使用朋友剩下|不建議自己|吃剩下的抗生素|不能只靠(?:線上)?(?:文字|訊息)(?:判斷|診斷|開藥)|只靠(?:線上)?(?:文字|訊息)不能(?:診斷|開藥)|先不要只靠訊息.*確診|不適合.*解讀個人報告|醫師或護理人員確認|需要複檢|治療安排|不能只靠.*(?:單一)?報告|不能.*直接安排手術|保證改善受孕|不能在線上告訴你最低劑量|不能在線上提供.*劑量|是否適合.*不能只靠訊息判斷|不能用來治療|不能取代檢查|不是保證|不等於一定是.*癌|PSA.*不能只靠訊息判斷|檢查報告需要醫師/.test(text);
}

function isShortServiceContext(text) {
  return text.length <= 80 && /診所有|門診/.test(text);
}

function isShortSafetyContext(text) {
  return (
    isShortServiceContext(text) ||
    (text.length <= 120 && /備孕|精液|精索靜脈曲張|陰囊超音波|心臟病|硝化甘油|陰莖水泡|破皮潰瘍|PSA|篩檢報告|HIV|陽性/.test(text))
  );
}

function hasUrgentBleedingCue(message) {
  return (
    /術後|手術後|做完/.test(message) &&
    /流血|出血|血流|大量出血|一直.*血|血.*不停|停不下來|壓不住/.test(message) &&
    /停不下來|壓不住|一直|大量|很多|很痛|劇痛|疼痛/.test(message)
  );
}

function isReportReviewQuestion(message) {
  return /報告|檢查結果|檢驗|數字|指數|PSA|攝護腺指數|超音波|切片|癌|癌症|腫瘤/.test(message);
}

function hasSymptomCue(message) {
  return /痛|疼|發燒|流血|出血|血尿|尿血|尿不出|排不出尿|腫|膿|流膿|化膿|傷口|裂開|昏沉|嘔吐|畏寒|發冷|不舒服|惡化/.test(message);
}

export function parseDoctorReviewCommand(message) {
  const normalized = message.trim().replace(/\s+/g, " ");
  let match = /^核准\s*#?(\d+)[。！!.\s]*$/i.exec(normalized);
  if (match) return { action: "approve", caseId: Number(match[1]) };

  match = /^關閉\s*#?(\d+)[。！!.\s]*$/i.exec(normalized);
  if (match) return { action: "close", caseId: Number(match[1]) };

  match = /^回覆\s*#?(\d+)\s+([\s\S]+)$/i.exec(message.trim());
  if (match) {
    return {
      action: "reply",
      caseId: Number(match[1]),
      doctorReply: match[2].trim()
    };
  }

  return null;
}

function summarizeConversation(conversationHistory) {
  return conversationHistory
    .map((message) => {
      const roleLabel = message.role === "assistant" ? "bot" : "病人";
      return `${roleLabel}：${truncateText(message.content ?? "", 180)}`;
    })
    .join("\n");
}

function formatConversationTimeline(reviewCase, { waitingReply = "" } = {}) {
  const historyMessages = Array.isArray(reviewCase.conversationSnapshot) ? reviewCase.conversationSnapshot : [];
  const messages = [
    ...historyMessages.map((message) => ({
      role: message.role,
      label: message.role === "assistant" ? "bot" : "病人",
      content: message.content
    })),
    {
      role: "user",
      label: "病人（本次待覆核）",
      content: reviewCase.userMessage
    }
  ];

  if (waitingReply) {
    messages.push({
      role: "assistant",
      label: "bot（已回覆病人）",
      content: waitingReply
    });
  }

  if (messages.length === 0) return reviewCase.conversationSummary || "無前文";

  return messages
    .map((message, index) => {
      const order = String(index + 1).padStart(2, "0");
      return [`${order} ${message.label}`, indentText(truncateText(message.content ?? "", 220))].join("\n");
    })
    .join("\n\n");
}

function indentText(text) {
  return String(text ?? "")
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}

function normalizeCase(row) {
  return {
    id: row.id,
    lineUserId: row.line_user_id,
    userMessage: row.user_message,
    conversationSummary: row.conversation_summary,
    conversationSnapshot: row.conversation_snapshot ?? [],
    botDraft: row.bot_draft,
    finalReply: row.final_reply,
    doctorReply: row.doctor_reply,
    status: row.status,
    reviewerLineUserId: row.reviewer_line_user_id,
    reviewSourceId: row.review_source_id,
    sentAt: row.sent_at,
    closedAt: row.closed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    metadata: row.metadata ?? {}
  };
}

function truncateText(text, maxLength) {
  const normalized = String(text ?? "").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}
