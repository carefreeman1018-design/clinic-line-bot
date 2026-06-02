const PHONE = "02-2511-9488";

export function answerStdTreatmentQuestion(message) {
  if (!isStdTreatmentQuestion(message)) return null;

  if (isPepQuestion(message)) {
    return answerPepQuestion(message);
  }

  if (!asksMedicationDiagnosisOrTreatment(message)) return null;

  if (isWartQuestion(message)) {
    return [
      "診所有提供菜花 HPV 相關篩檢與治療評估。",
      "菜花需要看病灶與檢查結果，LINE 不能診斷，也不能直接回答藥膏要擦幾天或建議自行買藥。",
      `治療方式可能包含外用藥物、電燒、冷凍或雷射等，需由醫師確認後安排；可電話 ${PHONE} 預約或確認時段。`
    ].join("");
  }

  return [
    "性病篩檢與治療需要依症狀、病灶與檢查結果由醫師判斷。",
    `LINE 不能線上診斷或開藥；建議預約門診，或電話 ${PHONE} 確認時段。`
  ].join("");
}

function isStdTreatmentQuestion(message) {
  return /PEP|暴露後|保險套破|無套|高風險|菜花|尖銳濕疣|HPV(?!\s*疫苗)|梅毒|淋病|披衣菌|性病|病灶|私密處.*顆粒|肉芽/i.test(message);
}

function isPepQuestion(message) {
  return /PEP|暴露後|保險套破|無套|高風險/i.test(message);
}

function answerPepQuestion(message) {
  const prefix = /60\s*小時|六十\s*小時/.test(message)
    ? "60 小時仍在官網提醒的 72 小時內，"
    : "PEP 需把握風險行為後 72 小時內，";

  const anonymousScreening = /匿名|篩檢|驗性病|性病/.test(message)
    ? "匿名篩檢可一起詢問，官網說明可透過官方 LINE 預約，到診所後由護理人員安排篩檢。"
    : "PEP 不能預防其他性病，是否需要篩檢也請一起讓醫師評估。";

  return [
    `${prefix}請今天盡快聯絡診所或到門診/急診由醫師評估；LINE 不能直接判斷或開藥。`,
    anonymousScreening,
    `下一步：先電話 ${PHONE} 確認最快可評估時段；若診所無法即時安排，請儘速就醫。`
  ].join("");
}

function isWartQuestion(message) {
  return /菜花|尖銳濕疣|HPV(?!\s*疫苗)|肉芽|私密處.*顆粒/i.test(message);
}

function asksMedicationDiagnosisOrTreatment(message) {
  return /藥膏|藥|擦幾天|擦多久|自己買|自己擦|治療|處理|處方|診斷|是不是|看起來|費用|價格|多少錢|多久會好|復發/.test(message);
}
