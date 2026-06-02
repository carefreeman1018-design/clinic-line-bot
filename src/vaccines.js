const PHONE = "02-2511-9488";

export function answerVaccineQuestion(message, conversationHistory = []) {
  const isDirectVaccineQuestion = isVaccineQuestion(message);
  const followUpContext = isDirectVaccineQuestion ? null : resolveVaccineFollowUpContext(message, conversationHistory);
  if (!isDirectVaccineQuestion && !followUpContext) return null;

  const parts = [];

  if (isHpvVaccineQuestion(message) || followUpContext?.includesHpv) {
    parts.push("官網列出診所有提供 HPV 疫苗施打，也有提到 HPV 九價疫苗。");
  }

  if (isSkinShinglesVaccineQuestion(message) || followUpContext?.includesSkinShingles) {
    parts.push("官網主要診療項目有列出皮蛇疫苗施打。");
  }

  if (parts.length === 0) {
    parts.push("官網列出診所有提供 HPV、皮蛇疫苗施打。");
  }

  if (asksPriceOrStock(message)) {
    parts.push(`價格、庫存與可預約時段目前知識庫沒有公開明確數字，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  if (asksPersonalSuitability(message)) {
    parts.push("LINE 不能直接判斷是否適合施打；是否懷孕/備孕、已發生性行為後是否仍適合、過敏史、劑數/間隔、兩種疫苗能否同一天打，以及今天能不能直接打，都需由醫師或診所人員依個人狀況與庫存評估。");
  } else if (!asksPriceOrStock(message)) {
    parts.push(`是否適合、庫存與費用，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  return parts.join("");
}

function isVaccineQuestion(message) {
  return /HPV\s*疫苗|九價|子宮頸癌疫苗|皮蛇疫苗|帶狀皰疹疫苗|疫苗/.test(message);
}

function isHpvVaccineQuestion(message) {
  return /HPV\s*疫苗|九價|子宮頸癌疫苗/.test(message);
}

function isSkinShinglesVaccineQuestion(message) {
  return /皮蛇疫苗|帶狀皰疹疫苗/.test(message);
}

function asksPriceOrStock(message) {
  return /價錢|價格|費用|多少錢|幾多錢|庫存|有貨|現貨|名額|預約時段|可預約|今天|直接打|馬上打|同一天|一起打|同時打/.test(message);
}

function asksPersonalSuitability(message) {
  return /過敏|懷孕|備孕|慢性病|免疫|吃藥|用藥|藥物|適合|能不能|可不可以|可以直接打|直接打|馬上打|今天.*打|副作用|禁忌|性行為|有用|有效|幾劑|幾針|劑數|間隔|時程/.test(message);
}

function resolveVaccineFollowUpContext(message, conversationHistory) {
  if (!isVaccineFollowUpQuestion(message)) return null;

  const recentMessages = [...conversationHistory].slice(-8);
  const recentText = recentMessages.map((historyMessage) => historyMessage.content ?? "").join("\n");
  if (!isVaccineQuestion(recentText)) return null;

  return {
    includesHpv: isHpvVaccineQuestion(recentText),
    includesSkinShingles: isSkinShinglesVaccineQuestion(recentText)
  };
}

function isVaccineFollowUpQuestion(message) {
  if (/點滴|護肝|解酒|疲勞|修復|營養素|保健點滴|免疫提升.*點滴|功能性修復/.test(message)) return false;

  const hasFollowUpCue = /那|一起|同一天|同時|也可以|也能|老公|先生|太太|伴侶|家人|他|她/.test(message);
  const hasVaccineActionCue = /打|施打|接種|過敏|懷孕|備孕|幾歲|年齡|費用|價格|庫存|預約/.test(message);
  return hasFollowUpCue && hasVaccineActionCue;
}
