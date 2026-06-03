const PHONE = "02-2511-9488";

export function answerAnalColorectalQuestion(message) {
  if (isScheduleExclusionQuestion(message)) return null;
  if (!isAnalColorectalQuestion(message)) return null;

  if (isAnalWartQuestion(message)) {
    return [
      "診所有肛門性病診斷與治療，也有肛門直腸外科。",
      "肛門菜花或其他病灶只靠文字不能確認，需要醫師實際檢查。",
      "是否能當天直接電燒、處理痔瘡或安排手術，需由醫師評估病灶後決定，不能先保證；費用也需依評估後確認。",
      `下一步：預約肛門直腸外科或泌尿相關門診評估；若想今天晚上看，請先電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "診所有肛門直腸外科，可評估痔瘡、廔管、肛裂等肛門疾病，也有痔瘡微創手術評估。",
    "大便後鮮紅色血、肛門痛或腫塊不一定只是痔瘡，需由醫師檢查後決定治療方式，不能保證當天直接手術。",
    `下一步：預約肛門直腸外科門診，或先電話 ${PHONE} 確認可評估時段；若大量出血、劇烈疼痛、發燒或化膿，請立即就醫。`
  ].join("");
}

function isScheduleExclusionQuestion(message) {
  const excludesColorectal = /不要掛到?肛門直腸外科|不要.*肛門直腸外科|不是.*肛門直腸外科|不想.*肛門直腸外科/.test(message);
  const hasScheduleCue = /週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|今天|明天|後天|掛|門診|看診|時段|哪一診|哪診|哪個時段|哪一個時段/.test(message);
  return excludesColorectal && hasScheduleCue;
}

function isAnalColorectalQuestion(message) {
  return /肛門|痔瘡|廔管|瘻管|肛裂|便血|大便.*血|解便.*血|鮮紅色血|肛門.*痛|肛門.*腫|腫塊|肛門性病|肛門菜花/i.test(message);
}

function isAnalWartQuestion(message) {
  return /肛門.*菜花|菜花.*肛門|肛門.*性病|肛門.*病灶|肛門.*疣|尖銳濕疣/i.test(message);
}
