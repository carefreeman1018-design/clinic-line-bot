const PHONE = "02-2511-9488";

export function answerReportResultQuestion(message, conversationHistory = []) {
  if (!isReportResultQuestion(message)) return null;
  if (isAnonymousScreeningQuestion(message)) return null;
  if (isStdReportQuestion(message)) return null;

  if (isOutsideHospitalReportVisitQuestion(message)) {
    return [
      "可以，別家醫院或外院做的紙本、影像或檢查報告，可以帶來門診給醫師評估。",
      "不建議先在 LINE 傳個人醫療報告讓我們線上判讀；報告需要醫師搭配病史、症狀與現場評估一起看。",
      `若不確定要帶哪些資料，可先電話 ${PHONE} 或到櫃台確認；通常建議帶完整紙本報告、影像光碟/截圖、用藥資料與健保卡。`
    ].join("");
  }

  if (isUrineKidneyReportQuestion(message)) {
    const medicationBoundary = asksMedicationDecision(message)
      ? "也不能在線上直接判斷要不要吃藥或抗生素；請不要自行吃抗生素或用家裡剩藥。"
      : "";

    return [
      "尿蛋白、潛血或 eGFR/腎功能報告需要醫師搭配病史、症狀、血壓、用藥與必要時複檢一起判讀。",
      "這不等於一定是腎臟壞掉，也不能只靠訊息判斷是不是感染、結石或腎臟問題。",
      medicationBoundary,
      `下一步建議帶完整健檢報告預約泌尿科門診或回診說明；若有發燒、腰痛加劇、血尿很多、有血塊、尿不出來或明顯不舒服，請急診/立即就醫。可電話 ${PHONE} 確認可看診時段。`
    ].join("");
  }

  if (isProstateCancerTreatmentReportQuestion(message)) {
    const treatmentBoundary = asksProstateCancerTreatmentDecision(message)
      ? "手術、放射治療、荷爾蒙針或是否開藥，都不能只靠訊息直接決定，也不能先線上安排打針或開藥。"
      : "後續治療方式需要由醫師依完整報告與分期評估。";

    return [
      "切片報告若已寫攝護腺癌、Gleason 分數或 PSA 數值，需要由泌尿科醫師搭配完整病理報告、影像分期、年齡、身體狀況與個人偏好一起判讀。",
      treatmentBoundary,
      `下一步建議帶完整切片與檢查報告回診或預約泌尿科門診討論治療選擇；若要確認可評估時段，可電話 ${PHONE}。`
    ].join("");
  }

  if (isPsaQuestion(message) || isPsaReportFollowUp(message, conversationHistory)) {
    if (asksSurgeryBeforeReportReview(message)) {
      return [
        "對，這種情況建議先掛泌尿科門診看 PSA、超音波與其他檢查報告，不要先把自己排成手術。",
        "PSA 偏高不等於一定是攝護腺癌，但也不能只靠訊息判斷；是否需要切片、追蹤或治療要由醫師評估。",
        "水蒸氣消融、Urolift 等攝護腺肥大治療不能用來取代 PSA/癌症風險評估，也不能用來保證跳過必要切片。",
      `下一步：預約門診/泌尿科門診或回診說明；若要確認可看診時段，可電話 ${PHONE}。`
      ].join("");
    }

    const procedureBoundary = asksProstateProcedureInPsaContext(message)
      ? "水蒸氣消融、Urolift 等攝護腺肥大治療不能用來取代 PSA/癌症風險評估，也不能用來保證跳過必要切片；是否能做、費用與方式都需門診評估後決定。"
      : "";

    return [
      "PSA 偏高不等於一定是攝護腺癌，但也不能只靠訊息判斷。",
      "PSA、超音波或其他檢查報告需要醫師搭配病史、症狀與檢查結果判讀；是否需要切片也要由醫師評估。",
      procedureBoundary,
      `下一步建議預約門診/泌尿科門診或回診說明；若要確認可看診時段，可電話 ${PHONE}。`
    ].join("");
  }

  return [
    "檢查報告需要醫師搭配病史、症狀與檢查結果一起判讀，不適合只靠訊息直接解讀個人報告。",
    `建議預約門診或回診讓醫師說明；若要確認可看診時段，可電話 ${PHONE}。`
  ].join("");
}

function isReportResultQuestion(message) {
  return /報告|檢查結果|PSA|攝護腺指數|超音波|尿流速|切片|癌|腫瘤|尿蛋白|潛血|腎功能|eGFR|肌酸酐|creatinine/i.test(message);
}

function isAnonymousScreeningQuestion(message) {
  return /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message);
}

function isStdReportQuestion(message) {
  return /梅毒|RPR|TPPA|淋病|披衣菌|HIV|愛滋/i.test(message) && /報告|檢查結果|篩檢|陽性|陰性|數值/.test(message);
}

function isOutsideHospitalReportVisitQuestion(message) {
  const hasOutsideSource = /別家|外院|外面|其他醫院|他院|別的醫院|健檢中心/.test(message);
  const hasReportCue = /報告|檢查結果|檢驗結果|影像|光碟|片子|檢查資料/.test(message);
  const asksBringOrSend = /拿來|帶來|帶去|給醫師看|給醫生看|醫師看|醫生看|先傳|傳.*LINE|LINE.*傳|可以.*看|需要.*傳/i.test(message);

  return hasOutsideSource && hasReportCue && asksBringOrSend;
}

function isPsaQuestion(message) {
  return /PSA|攝護腺指數|攝護腺癌|攝護腺.*癌|切片/.test(message);
}

function isProstateCancerTreatmentReportQuestion(message) {
  const hasConfirmedCancerReport = (
    /Gleason|格里森/i.test(message) ||
    /(?:切片|病理|報告).{0,16}(?:寫|顯示|診斷|為|是).{0,12}(?:攝護腺癌|前列腺癌)|(?:切片|病理|報告).{0,12}(?:攝護腺癌|前列腺癌)/.test(message)
  );
  const hasTreatmentDecision = /手術|開刀|放射|電療|荷爾蒙|打針|開藥|治療|要不要/.test(message);
  return hasConfirmedCancerReport && hasTreatmentDecision;
}

function asksProstateCancerTreatmentDecision(message) {
  return /要不要|需不需要|可以.*建議|直接.*建議|安排|手術|開刀|放射|電療|荷爾蒙|打針|開藥|藥/.test(message);
}

function asksProstateProcedureInPsaContext(message) {
  return /水蒸氣|Urolift|優立服|雷射|消融|攝護腺肥大.*治療|前列腺肥大.*治療/.test(message);
}

function asksSurgeryBeforeReportReview(message) {
  return /先不要.*手術|不要.*先.*手術|被直接.*手術|直接安排手術/.test(message);
}

function isUrineKidneyReportQuestion(message) {
  return /尿蛋白|潛血|腎功能|eGFR|肌酸酐|creatinine/i.test(message) && /報告|健檢|檢查|數值|陽性|\+|腎臟|腎/.test(message);
}

function asksMedicationDecision(message) {
  return /吃藥|用藥|藥物|抗生素|開藥|要不要.*藥|需不需要.*藥|直接.*藥/.test(message);
}

function isPsaReportFollowUp(message, conversationHistory) {
  if (!asksSurgeryBeforeReportReview(message)) return false;

  const recentText = conversationHistory
    .slice(-8)
    .map((entry) => entry?.content || "")
    .join("\n");

  return /PSA|攝護腺指數|攝護腺癌|超音波|切片|水蒸氣|Urolift|攝護腺肥大/.test(recentText);
}
