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

export function buildDoctorReviewWaitingReply(message = "") {
  if (hasUrgentBleedingCue(message)) {
    return [
      "你描述術後一直流血、壓了也停不下來又很痛，請不要等線上回覆，先立即就醫或到急診。",
      "這題我也先幫你轉請醫師或診所人員確認，確認後會再回覆你。"
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
