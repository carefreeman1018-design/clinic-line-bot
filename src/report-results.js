const PHONE = "02-2511-9488";

export function answerReportResultQuestion(message) {
  if (!isReportResultQuestion(message)) return null;

  if (isPsaQuestion(message)) {
    return [
      "PSA 偏高不等於一定是攝護腺癌，但也不能只用 LINE 判斷。",
      "PSA、超音波或其他檢查報告需要醫師搭配病史、症狀與檢查結果判讀；是否需要切片也要由醫師評估。",
      `下一步建議預約泌尿科門診或回診說明；若要確認可看診時段，可電話 ${PHONE}。`
    ].join("");
  }

  return [
    "檢查報告需要醫師搭配病史、症狀與檢查結果一起判讀，LINE 不適合直接解讀個人報告。",
    `建議預約門診或回診讓醫師說明；若要確認可看診時段，可電話 ${PHONE}。`
  ].join("");
}

function isReportResultQuestion(message) {
  return /報告|檢查結果|PSA|攝護腺指數|超音波|尿流速|切片|癌|腫瘤/.test(message);
}

function isPsaQuestion(message) {
  return /PSA|攝護腺指數|攝護腺癌|攝護腺.*癌|切片/.test(message);
}
