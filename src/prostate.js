const PHONE = "02-2511-9488";

export function answerProstateQuestion(message) {
  if (!isProstateQuestion(message)) return null;

  if (asksTreatmentChoiceCostOrOutcome(message)) {
    return [
      "診所有提供攝護腺肥大評估與治療，官網列出雷射剜除、水蒸氣消融、綠光雷射汽化與 Urolift 等方式。",
      "夜尿、尿流變細可能有不同原因；哪一種適合、是否影響射精與費用，都需要醫師依攝護腺大小、症狀與身體狀況評估，LINE 不能直接判斷或報價。",
      `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "診所有提供攝護腺肥大相關評估與治療。",
    "頻尿、夜尿、尿流變細或排尿困難建議由醫師檢查後判斷原因。"
  ].join("");
}

function isProstateQuestion(message) {
  return /攝護腺|前列腺|夜尿|尿流變細|排尿困難|尿不順|水蒸氣消融|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除/i.test(message);
}

function asksTreatmentChoiceCostOrOutcome(message) {
  return /哪個|哪一種|比較適合|適合|水蒸氣|Urolift|影響射精|保留射精|費用|價格|多少錢|手術|治療|可以做|下一步/i.test(message);
}
