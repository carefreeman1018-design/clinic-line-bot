const PHONE = "02-2511-9488";

export function answerProstateQuestion(message) {
  if (isScheduleRoutingQuestion(message)) return null;
  if (!isProstateQuestion(message)) return null;

  if (hasAcuteUrinaryRetentionRisk(message)) {
    return [
      "你描述幾乎尿不出來、下腹脹痛又冒冷汗，需警覺急性尿液滯留或泌尿道阻塞風險，LINE 不能直接診斷。",
      "這種情況不建議撐到明天門診，也不能先安排 Urolift、水蒸氣消融或直接報費用；可能需要立即評估是否需導尿、抽血/影像或其他處置。",
      `請現在先急診/立即就醫；若要同步確認診所能否協助，請電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  if (asksTreatmentChoiceCostOrOutcome(message)) {
    return [
      "診所有提供攝護腺肥大評估與治療，官網列出雷射剜除、水蒸氣消融、綠光雷射汽化與 Urolift 等方式。",
      "夜尿、尿流變細可能有不同原因；哪一種適合、是否影響射精與費用，都需要醫師依攝護腺大小、症狀與身體狀況評估，LINE 不能直接判斷或報價。",
      "也不能先保證保留射精、不用插尿管，或今天看完就能直接手術；需評估後再安排。",
      `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "診所有提供攝護腺肥大相關評估與治療。",
    "頻尿、夜尿、尿流變細或排尿困難建議由醫師檢查後判斷原因。"
  ].join("");
}

function isScheduleRoutingQuestion(message) {
  const hasDay = /週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|今天|明天|後天/.test(message);
  const asksSchedule = /掛|門診|看診|時段|哪一診|哪診|哪個時段|哪一個時段|可以看/.test(message);
  const asksTreatment = /攝護腺肥大|前列腺肥大|水蒸氣|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除|手術|治療|費用|價格|多少錢|保留射精|插尿管/i.test(message);
  return hasDay && asksSchedule && !asksTreatment;
}

function isProstateQuestion(message) {
  return /攝護腺|前列腺|夜尿|尿流變細|排尿困難|尿不順|水蒸氣消融|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除/i.test(message);
}

function asksTreatmentChoiceCostOrOutcome(message) {
  return /哪個|哪一種|比較適合|適合|水蒸氣|Urolift|影響射精|保留射精|費用|價格|多少錢|手術|治療|可以做|下一步/i.test(message);
}

function hasAcuteUrinaryRetentionRisk(message) {
  const hasRetention = /尿不出來|排不出尿|幾乎尿不出|尿不太出|急性尿液滯留|尿滯留|膀胱脹|下腹脹|下腹.*痛/.test(message);
  const hasUrgentCue = /很痛|痛|冒冷汗|發燒|血尿|今天|現在|從早上|撐到明天|等明天|急診|立即|導尿|老人|高齡|7[0-9]\s*歲|8[0-9]\s*歲/.test(message);
  return hasRetention && hasUrgentCue;
}
