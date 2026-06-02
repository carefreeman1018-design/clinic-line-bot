const PHONE = "02-2511-9488";

export function answerStdTreatmentQuestion(message) {
  if (!isStdTreatmentQuestion(message)) return null;
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
  return /菜花|尖銳濕疣|HPV(?!\s*疫苗)|梅毒|淋病|披衣菌|性病|病灶|私密處.*顆粒|肉芽/i.test(message);
}

function isWartQuestion(message) {
  return /菜花|尖銳濕疣|HPV(?!\s*疫苗)|肉芽|私密處.*顆粒/i.test(message);
}

function asksMedicationDiagnosisOrTreatment(message) {
  return /藥膏|藥|擦幾天|擦多久|自己買|自己擦|治療|處理|處方|診斷|是不是|看起來|費用|價格|多少錢|多久會好|復發/.test(message);
}
