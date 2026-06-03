const PHONE = "02-2511-9488";

export function answerVaccineQuestion(message, conversationHistory = []) {
  const isDirectVaccineQuestion = isVaccineQuestion(message);
  const followUpContext = isDirectVaccineQuestion ? null : resolveVaccineFollowUpContext(message, conversationHistory);
  if (!isDirectVaccineQuestion && !followUpContext) return null;

  const parts = [];
  const hasHpvExposureConcern = hasHpvExposureOrInfectionConcern(message) && !hasCurrentHpvWartConcern(message);
  const hasCurrentWartConcern = hasCurrentHpvWartConcern(message);

  if (isHpvVaccineQuestion(message) || followUpContext?.includesHpv) {
    parts.push("官網列出診所有提供 HPV 疫苗施打，也有提到 HPV 九價疫苗。");
    if (hasHpvExposureConcern) {
      parts.push("HPV 疫苗可降低部分型別感染與菜花風險，但不是保證不會感染或長菜花；若已感染 HPV，疫苗不能處理既有感染或讓病毒消失。");
      parts.push(`伴侶有菜花或 HPV 陽性時，疫苗不能取代檢查；今天能不能打、費用與庫存，建議電話 ${PHONE}，由醫師或診所人員評估是否需 HPV/性病篩檢與施打。`);
    }
    if (hasCurrentWartConcern) {
      parts.push("HPV 疫苗主要是預防方向，不能用來治療已經出現的菜花或肉芽病灶；目前有疑似菜花時，需先由醫師看病灶並評估篩檢與治療。");
    }
  }

  if (isSkinShinglesVaccineQuestion(message) || followUpContext?.includesSkinShingles) {
    parts.push("官網主要診療項目有列出皮蛇疫苗施打。");
  }

  if (parts.length === 0) {
    parts.push("官網列出診所有提供 HPV、皮蛇疫苗施打。");
  }

  if (asksPriceOrStock(message) && !hasHpvExposureConcern && (!hasCurrentWartConcern || isSkinShinglesVaccineQuestion(message))) {
    parts.push(`價格、庫存與可預約時段目前知識庫沒有公開明確數字，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  if (asksPersonalSuitability(message) && hasCurrentWartConcern && !isSkinShinglesVaccineQuestion(message)) {
    parts.push(`伴侶也可一起評估是否需要檢查或篩檢；今天能不能打疫苗，請電話 ${PHONE} 由醫師或診所人員依病灶與個人狀況確認。`);
  } else if (asksPersonalSuitability(message) && hasHpvExposureConcern) {
    parts.push("是否適合施打不能只靠訊息判斷；是否需要檢查或今天能不能直接打，仍需依個人狀況評估。");
  } else if (asksPersonalSuitability(message)) {
    parts.push("是否適合施打不能只靠訊息判斷；是否懷孕/備孕、已發生性行為後是否仍適合、過敏史、劑數/間隔、兩種疫苗能否同一天打，以及今天能不能直接打，都需由醫師或診所人員依個人狀況與庫存評估。");
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
  return /過敏|懷孕|備孕|慢性病|免疫|吃藥|用藥|藥物|適合|能不能|可不可以|是不是|不用擔心|陽性|感染|可以直接打|直接打|馬上打|今天.*打|副作用|禁忌|性行為|有用|有效|幾劑|幾針|劑數|間隔|時程/.test(message);
}

function hasCurrentHpvWartConcern(message) {
  if (/沒有長東西|沒.*長東西|沒有.*肉芽|沒.*肉芽|沒有.*病灶|沒.*病灶/.test(message)) {
    return false;
  }

  if (/尖銳濕疣|肉芽|疣|病灶|小顆粒|顆粒|突起|私密處.*長|生殖器.*長|陰莖.*長|陰部.*長|肛門.*長/.test(message)) {
    return true;
  }

  return /菜花/.test(message) && /會不會.*好|治好|直接好|藥膏|電燒|冷凍|雷射|病灶|長出來|長東西/.test(message);
}

function hasHpvExposureOrInfectionConcern(message) {
  return /HPV.*陽性|陽性.*HPV|已經感染|已感染|感染.*HPV|HPV.*感染|伴侶|女朋友|男朋友|另一半|性伴侶|不用擔心|保證|預防菜花|得到菜花|菜花.*風險|沒有長東西/.test(message);
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
  if (hasNonVaccineClinicalTopic(message)) return false;

  const hasFollowUpCue = /那|一起|同一天|同時|也可以|也能|老公|先生|太太|伴侶|家人|他|她/.test(message);
  const hasVaccineActionCue = /打|施打|接種|過敏|懷孕|備孕|幾歲|年齡|費用|價格|庫存|預約/.test(message);
  return hasFollowUpCue && hasVaccineActionCue;
}

function hasNonVaccineClinicalTopic(message) {
  return /攝護腺|前列腺|夜尿|尿流|尿不出來|排不出尿|尿滯留|下腹|冒冷汗|Urolift|水蒸氣消融|Rezum|Rezūm|雷射剜除|綠光雷射|腎結石|輸尿管結石|血尿|腰痛|睪丸|包皮|龜頭|陰莖|痔瘡|肛門|猛健樂|點滴|震波|結紮|割包皮/.test(message);
}
