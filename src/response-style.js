const DEFAULT_RESPONSE_STYLE_ID = process.env.RESPONSE_STYLE_ID || "clinic-default";

export const DEFAULT_RESPONSE_STYLE = {
  id: DEFAULT_RESPONSE_STYLE_ID,
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

function normalizeLineReply(reply) {
  return reply
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function enforceDefaultClinicVoice(reply, _context) {
  return reply
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
