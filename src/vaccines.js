const PHONE = "02-2511-9488";

export function answerVaccineQuestion(message, conversationHistory = []) {
  const hasAnonymousScreeningRequest = asksAnonymousScreening(message);
  const isDirectVaccineQuestion = isVaccineQuestion(message) || hasAnonymousScreeningRequest;
  const followUpContext = isDirectVaccineQuestion ? null : resolveVaccineFollowUpContext(message, conversationHistory);
  if (!isDirectVaccineQuestion && !followUpContext) return null;
  if (hasAnonymousScreeningRequest && !isVaccineQuestion(message) && shouldDeferAnonymousScreeningToStd(message)) return null;

  const adverseReactionReply = answerPostVaccineReactionQuestion(message);
  if (adverseReactionReply) return adverseReactionReply;

  const parts = [];
  const hasHpvExposureConcern = hasHpvExposureOrInfectionConcern(message) && !hasCurrentHpvWartConcern(message);
  const hasCurrentWartConcern = hasCurrentHpvWartConcern(message);

  if (!isHpvVaccineQuestion(message) && hasAnonymousScreeningRequest) {
    return answerAnonymousScreeningAdminQuestion(message);
  }

  if ((isHpvVaccineQuestion(message) || followUpContext?.includesHpv) && hasAnonymousScreeningRequest) {
    return answerHpvVaccineWithAnonymousScreeningQuestion(message);
  }

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
    const adminTopic = asksExplicitPrice(message)
      ? "價格、庫存與可預約時段"
      : "今天能不能直接打、疫苗庫存與可預約時段";
    parts.push(`${adminTopic}我這邊不能直接確認，建議電話 ${PHONE} 先確認費用、庫存與當天能不能安排。`);
  }

  if (asksSameDayCoadministration(message)) {
    parts.push(`是否適合施打不能只靠訊息判斷；兩種疫苗能否同一天打與今天能不能直接打不能先保證，需由醫師或診所人員依年齡、是否懷孕/備孕、過敏史、過去疫苗反應、疫苗庫存與預約安排評估，請電話 ${PHONE} 或到現場確認。`);
  }

  if (asksVaccineDocuments(message)) {
    parts.push("到診建議帶健保卡/身分證；若有疫苗接種紀錄也一起帶，並先整理過敏史、用藥狀況與特殊身體狀況給櫃台/護理人員與醫師。");
  }

  if (asksPersonalSuitability(message) && hasCurrentWartConcern && !isSkinShinglesVaccineQuestion(message)) {
    parts.push(`伴侶也可一起評估是否需要檢查或篩檢；今天能不能打疫苗，請電話 ${PHONE} 由醫師或診所人員依病灶與個人狀況確認。`);
  } else if (asksPersonalSuitability(message) && hasHpvExposureConcern) {
    parts.push("是否適合施打不能只靠訊息判斷；是否需要檢查或今天能不能直接打，仍需依個人狀況評估。");
  } else if (asksPersonalSuitability(message) && !asksSameDayCoadministration(message)) {
    parts.push(buildPersonalSuitabilityBoundary(message));
  } else if (!asksPriceOrStock(message) && !asksVaccineDocuments(message) && !asksSameDayCoadministration(message)) {
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

function answerHpvVaccineWithAnonymousScreeningQuestion(message) {
  if (asksImmediateOnsiteNextStep(message)) {
    return [
      "你已經在診所外面，下一步先上 3 樓到櫃台或護理人員那邊說明：想問 HPV 疫苗、匿名篩檢，也要掛號。",
      `疫苗庫存、匿名篩檢流程、費用與今天能不能做，現場會依項目確認；也可先電話 ${PHONE}。`
    ].join("");
  }

  const parts = [
    "診所有提供 HPV 疫苗施打，也可詢問匿名篩檢；匿名篩檢包含性病相關篩檢服務。"
  ];

  if (asksSameDayWalkInOrPrice(message)) {
    parts.push(`價格、疫苗庫存、當天名額與今天現場能不能做，都需要電話 ${PHONE} 或到現場由診所人員確認，不能先保證今天一定能做。`);
  } else {
    parts.push(`是否適合施打、疫苗庫存、篩檢流程與費用，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  return parts.join("");
}

function answerAnonymousScreeningAdminQuestion(message) {
  const parts = [
    "診所有提供匿名篩檢相關服務，可到診後向護理人員詢問流程與項目。"
  ];

  if (asksPaymentOrIdentityDocuments(message)) {
    parts.push("刷卡、健保卡或身分證要不要用，需依現場匿名篩檢流程與項目確認；可先帶著，但不先保證一定可刷或一定不用證件。");
    return parts.join("");
  }

  if (asksSameDayWalkInOrPrice(message)) {
    parts.push(`費用、當天名額與今天現場能不能做，都需要電話 ${PHONE} 或到現場由診所人員確認，不能先保證今天一定能做。`);
  } else {
    parts.push(`篩檢流程、費用與可評估時段，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  return parts.join("");
}

function answerPostVaccineReactionQuestion(message) {
  if (!isPostVaccineReactionQuestion(message)) return null;

  const urgentNow = /現在|目前|還在|還有|持續/.test(message) && /喘|呼吸困難|胸悶|胸痛|喉嚨緊|喉嚨腫|嘴唇腫|臉腫|昏倒|快昏倒/.test(message);
  const urgentNote = urgentNow
    ? "若現在還有喘、呼吸困難、胸悶、喉嚨緊、臉或嘴唇腫、快昏倒等狀況，請不要等線上回覆，先急診/立即就醫。"
    : "若再出現喘、呼吸困難、胸悶、喉嚨緊、臉或嘴唇腫、全身紅疹快速擴散或快昏倒，請急診/立即就醫。";

  return [
    "打完 HPV/九價或其他疫苗後若出現全身起疹、喘或疑似過敏反應，下一劑能不能照打不能只靠訊息判斷。",
    "不建議自行先吃抗組織胺或其他藥把症狀壓下去再去打；是否延後、改期或需要醫師評估過敏風險，需由醫師或診所人員確認。",
    `下一步：請先電話 ${PHONE} 聯絡診所，說明上次接種後症狀與吃過的藥，再決定下一劑安排。${urgentNote}`
  ].join("");
}

function isPostVaccineReactionQuestion(message) {
  const hasVaccineCue = /HPV\s*疫苗|九價|子宮頸癌疫苗|皮蛇疫苗|帶狀皰疹疫苗|疫苗/.test(message);
  const hasAfterVaccineCue = /打完|接種後|施打後|上週打|昨天打|前天打|下一劑|下次打/.test(message);
  const hasReactionOrMedicationCue = /起疹|紅疹|蕁麻疹|疹子|過敏|喘|呼吸困難|胸悶|頭暈|昏倒|抗組織胺|吃藥|先吃藥|下一劑|照打|再打/.test(message);
  return hasVaccineCue && hasAfterVaccineCue && hasReactionOrMedicationCue;
}

function asksPriceOrStock(message) {
  return /價錢|價格|費用|多少錢|幾多錢|庫存|有貨|現貨|名額|預約時段|可預約|今天|直接打|馬上打/.test(message);
}

function asksExplicitPrice(message) {
  return /價錢|價格|費用|多少錢|幾多錢/.test(message);
}

function asksSameDayCoadministration(message) {
  return /同一天|一起打|同時打/.test(message)
    && /HPV\s*疫苗|九價|子宮頸癌疫苗/.test(message)
    && /皮蛇疫苗|帶狀皰疹疫苗/.test(message);
}

function asksVaccineDocuments(message) {
  return /健保卡|身分證|身份證|證件|疫苗.*紀錄|接種.*紀錄|帶什麼|要帶|攜帶|準備什麼/.test(message);
}

function asksAnonymousScreening(message) {
  return /匿名.*篩檢|篩檢.*匿名|匿名性病|匿名.*驗|驗.*匿名/.test(message);
}

function shouldDeferAnonymousScreeningToStd(message) {
  return /PEP|PrEP|HIV|愛滋|梅毒|淋病|披衣菌|暴露|保險套破|無套|高風險|家人|知道|真名|姓名|身分|身份|報告|結果|多久|隱私|保密|陽性|陰性|確診/i.test(message);
}

function asksSameDayWalkInOrPrice(message) {
  return /今天|今日|現場|直接|當天|費用|價錢|價格|多少錢|名額|庫存|有貨|可不可以|能不能|可以做|可以打/.test(message);
}

function asksPaymentOrIdentityDocuments(message) {
  return /刷卡|信用卡|現金|付款|付費|健保卡|身分證|身份證|證件|帶什麼|要帶/.test(message);
}

function asksImmediateOnsiteNextStep(message) {
  return /現在|已經|人在|我在/.test(message)
    && /診所外|外面|現場|門口|樓下|附近/.test(message)
    && /下一步|先做什麼|怎麼辦|先去哪|先問誰|掛號/.test(message);
}

function asksPersonalSuitability(message) {
  return /過敏|懷孕|備孕|慢性病|免疫|吃藥|用藥|藥物|適合|能不能|可不可以|是不是|不用擔心|陽性|感染|可以直接打|直接打|馬上打|今天.*打|副作用|禁忌|性行為|有用|有效|幾劑|幾針|劑數|間隔|時程/.test(message);
}

function buildPersonalSuitabilityBoundary(message) {
  const factors = [];

  if (/懷孕|備孕|月經|孕/.test(message)) {
    factors.push("是否懷孕/備孕");
  }
  if (/過敏|起疹|疹子|打針|疫苗.*反應/.test(message)) {
    factors.push("過敏史/過去打針或疫苗反應");
  }
  if (/吃藥|用藥|藥物/.test(message)) {
    factors.push("用藥狀況");
  }
  if (/慢性病|免疫/.test(message)) {
    factors.push("慢性病或免疫狀態");
  }
  if (/性行為|有用|有效/.test(message)) {
    factors.push("已發生性行為後是否仍適合");
  }
  if (/幾劑|幾針|劑數|間隔|時程/.test(message)) {
    factors.push("劑數/間隔");
  }

  if (factors.length === 0) {
    factors.push("個人狀況");
  }

  const sameDayText = /今天|直接打|馬上打|現場/.test(message)
    ? "，以及今天能不能直接打"
    : "";

  return `是否適合施打不能只靠訊息判斷；${factors.join("、")}${sameDayText}，都需由醫師或診所人員依個人狀況與庫存評估。建議預約門診，或先電話 ${PHONE} 確認可評估時段。`;
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
