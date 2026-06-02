const PHONE = "02-2511-9488";

export function answerAnalColorectalQuestion(message) {
  if (!isAnalColorectalQuestion(message)) return null;

  if (isAnalWartQuestion(message)) {
    return [
      "診所有肛門性病診斷與治療，也有肛門直腸外科。",
      "肛門菜花或其他病灶不能只用 LINE 判斷，需要醫師實際檢查確認。",
      `下一步：預約肛門直腸外科或泌尿相關門診評估；可先電話 ${PHONE} 確認適合時段。`
    ].join("");
  }

  return [
    "診所有肛門直腸外科，可評估痔瘡、廔管、肛裂等肛門疾病，也有痔瘡微創手術評估。",
    "大便後鮮紅色血、肛門痛或腫塊不能只用 LINE 判斷是不是痔瘡，需由醫師檢查後決定治療方式，不能保證當天直接手術。",
    `下一步：預約肛門直腸外科門診，或先電話 ${PHONE} 確認可評估時段；若大量出血、劇烈疼痛、發燒或化膿，請立即就醫。`
  ].join("");
}

function isAnalColorectalQuestion(message) {
  return /肛門|痔瘡|廔管|瘻管|肛裂|便血|大便.*血|解便.*血|鮮紅色血|肛門.*痛|肛門.*腫|腫塊|肛門性病|肛門菜花/i.test(message);
}

function isAnalWartQuestion(message) {
  return /肛門.*菜花|菜花.*肛門|肛門.*性病|肛門.*病灶|肛門.*疣|尖銳濕疣/i.test(message);
}
