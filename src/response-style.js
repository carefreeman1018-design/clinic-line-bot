import fs from "node:fs/promises";
import path from "node:path";
import { supabase } from "./supabase.js";

const RESPONSE_STYLES_TABLE = process.env.SUPABASE_RESPONSE_STYLES_TABLE || "response_styles";
const DEFAULT_RESPONSE_STYLE_ID = process.env.RESPONSE_STYLE_ID || "uromeeme-doctor";
const LOCAL_RESPONSE_STYLE_DIR = path.join(process.cwd(), "data", "response-styles");
const styleCache = new Map();

export const DEFAULT_RESPONSE_STYLE = {
  id: "clinic-default",
  displayName: "津久診所預設語氣",
  voice: [
    "簡短、直接、溫和",
    "像診所櫃台或護理行政助理，不像公告或百科",
    "先回答重點，再給下一步",
    "不誇大療效，不保證結果，不線上診斷"
  ],
  preferredPhrases: [
    "我幫你看一下",
    "目前看起來",
    "這題需要醫師現場判斷",
    "下一步可以"
  ],
  avoidPhrases: [
    "您好",
    "感謝您的訊息",
    "祝您健康平安",
    "若有其他問題歡迎詢問"
  ],
  doctorPersona: null
};

export async function getResponseStyle(styleId = DEFAULT_RESPONSE_STYLE_ID) {
  const normalizedStyleId = String(styleId || DEFAULT_RESPONSE_STYLE_ID).trim() || DEFAULT_RESPONSE_STYLE_ID;
  if (styleCache.has(normalizedStyleId)) return styleCache.get(normalizedStyleId);

  const style =
    (await loadResponseStyleFromSupabase(normalizedStyleId)) ||
    (await loadResponseStyleFromLocalFile(normalizedStyleId)) ||
    DEFAULT_RESPONSE_STYLE;

  styleCache.set(normalizedStyleId, style);
  return style;
}

export function applyResponseStyle({
  reply,
  message = "",
  relevantChunks = [],
  conversationHistory = [],
  style = DEFAULT_RESPONSE_STYLE
}) {
  if (!reply) return reply;

  const styledReply = normalizeLineReply(reply);
  return enforceDefaultClinicVoice(styledReply, {
    message,
    relevantChunks,
    conversationHistory,
    style
  });
}

export function buildResponseStyleContext(overrides = {}) {
  return {
    ...DEFAULT_RESPONSE_STYLE,
    ...overrides
  };
}

export function buildResponseStylePrompt(style = DEFAULT_RESPONSE_STYLE) {
  const sections = [];

  if (style.displayName) sections.push(`目前使用回覆風格：${style.displayName}`);
  if (Array.isArray(style.voice) && style.voice.length > 0) {
    sections.push(`語氣規則：\n${style.voice.map((item) => `- ${item}`).join("\n")}`);
  }
  if (Array.isArray(style.preferredPhrases) && style.preferredPhrases.length > 0) {
    sections.push(`可自然使用的說法：${style.preferredPhrases.join("、")}`);
  }
  if (Array.isArray(style.avoidPhrases) && style.avoidPhrases.length > 0) {
    sections.push(`避免用語：${style.avoidPhrases.join("、")}`);
  }
  if (Array.isArray(style.boundaryPhrases) && style.boundaryPhrases.length > 0) {
    sections.push(`醫療邊界說法參考：\n${style.boundaryPhrases.map((item) => `- ${item}`).join("\n")}`);
  }
  if (style.doctorPersona?.notAllowed) {
    sections.push(`身分邊界：${style.doctorPersona.notAllowed}`);
  }
  if (Array.isArray(style.safetyNotes) && style.safetyNotes.length > 0) {
    sections.push(`安全提醒：\n${style.safetyNotes.map((item) => `- ${item}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

async function loadResponseStyleFromSupabase(styleId) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from(RESPONSE_STYLES_TABLE)
    .select("id, display_name, voice, preferred_phrases, avoid_phrases, boundary_phrases, example_rewrites, doctor_name, is_active")
    .eq("id", styleId)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    if (error.code === "PGRST205") return null;
    console.error(`Supabase response style load failed for ${styleId}:`, error);
    return null;
  }

  if (!data) return null;

  return buildResponseStyleContext({
    id: data.id,
    displayName: data.display_name,
    voice: Array.isArray(data.voice) ? data.voice : DEFAULT_RESPONSE_STYLE.voice,
    preferredPhrases: data.preferred_phrases ?? [],
    avoidPhrases: data.avoid_phrases ?? [],
    boundaryPhrases: data.boundary_phrases ?? [],
    exampleRewrites: data.example_rewrites ?? [],
    doctorName: data.doctor_name ?? null
  });
}

async function loadResponseStyleFromLocalFile(styleId) {
  try {
    const raw = await fs.readFile(path.join(LOCAL_RESPONSE_STYLE_DIR, `${styleId}.json`), "utf8");
    return normalizeLocalResponseStyle(JSON.parse(raw));
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.error(`Local response style load failed for ${styleId}:`, error);
    }
    return null;
  }
}

function normalizeLocalResponseStyle(style) {
  return buildResponseStyleContext({
    id: style.id,
    displayName: style.displayName,
    voice: style.voice,
    preferredPhrases: style.preferredPhrases,
    avoidPhrases: style.avoidPhrases,
    boundaryPhrases: style.boundaryPhrases,
    doctorPersona: style.doctorPersona,
    exampleRewrites: style.exampleRewrites,
    safetyNotes: style.safetyNotes,
    source: style.source,
    extractionNotes: style.extractionNotes,
    testScenarios: style.testScenarios
  });
}

function normalizeLineReply(reply) {
  return reply
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceDefaultClinicVoice(reply, _context) {
  return rewriteInternalBoundaryLanguage(reply)
    .replace(/^(您好|你好)[，,：:\s]+/g, "")
    .replace(/(?:^|\n)(感謝您的訊息|謝謝您的詢問)[。！!.\s]*$/g, "")
    .replace(/(?:^|\n)(祝您健康平安|祝您早日康復)[。！!.\s]*$/g, "")
    .replace(/(?:^|\n)(若有其他問題歡迎詢問|如有其他問題歡迎詢問)[。！!.\s]*$/g, "")
    .replace(/(?:^|\n)如果你(?:是)?(?:要|想要)?，?我(?:也)?可以幫你(?:改成|整理成|寫成)[^\n。！？]*(?:LINE|櫃台|短回覆|短版|話術)[^\n。！？]*[。！？]?/g, "")
    .replace(/([。！？])\s*如果你(?:是)?(?:要|想要)?，?我(?:也)?可以幫你(?:改成|整理成|寫成)[^\n。！？]*(?:LINE|櫃台|短回覆|短版|話術)[^\n。！？]*[。！？]?/g, "$1")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function rewriteInternalBoundaryLanguage(reply) {
  return reply
    .replace(/知識庫沒有寫死/g, "這部分需要櫃台依實際門診安排確認")
    .replace(/知識庫沒有(?:公開)?明確(?:資訊|數字|資料)?/g, "這部分建議向櫃台確認")
    .replace(/公開資料沒有明確(?:保證|確認)?/g, "這部分建議向櫃台確認")
    .replace(/目前沒有明確公開資訊/g, "這部分建議向櫃台確認")
    .replace(/不能在\s*LINE\s*先保證固定天數/g, "每個檢查項目的時間不一定相同")
    .replace(/不能在\s*LINE\s*直接保證金額/g, "實際金額請以櫃台或現場說明為準")
    .replace(/LINE\s*或櫃台初問不能保證最後金額/g, "櫃台可先協助了解大概範圍，最後金額以現場評估與流程為準")
    .replace(/LINE\s*不能保證價格或一定可刷卡/g, "實際費用和付款方式請以現場確認為準")
    .replace(/不能保證一定可刷卡/g, "付款方式請先向櫃台確認")
    .replace(/不能保證可刷卡/g, "付款方式請先向櫃台確認")
    .replace(/刷卡\/付款方式[^；。\n]*；建議/g, "付款方式建議")
    .replace(/是否能用\s*LINE\s*只通知狀態，涉及個人資料與身[份分]確認；/g, "若只是想確認報告狀態，也需要先核對身分；")
    .replace(/，不能在\s*LINE\s*先保證/g, "，需要由櫃台確認")
    .replace(/不能在\s*LINE\s*先保證/g, "需要由櫃台確認")
    .replace(/不能在\s*LINE\s*直接保證/g, "需要由櫃台確認")
    .replace(/不能直接在\s*LINE\s*幫/g, "這裡不能直接幫")
    .replace(/不能只靠\s*LINE\s*訊息直接保證/g, "需要由櫃台確認")
    .replace(/LINE\s*這裡不能/g, "這裡無法")
    .replace(/LINE\s*這裡/g, "這裡")
    .replace(/也不需要只推薦唯一一位醫師/g, "可以依你方便的時段和名額安排")
    .replace(/不需要只推薦唯一一位醫師/g, "可以依你方便的時段和名額安排")
    .replace(/不要推薦唯一(?:一位)?醫師/g, "可以依你方便的時段和名額安排")
    .replace(/([；。])\s*不能保證一定/g, "$1 是否能")
    .replace(/；不能先保證/g, "，請以現場確認為準")
    .replace(/；\s+是否能/g, "；是否能")
    .replace(/但\s+這裡/g, "但這裡");
}
