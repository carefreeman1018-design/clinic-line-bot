import { answerFixedScheduleQuestion } from "./schedule.js";

const PHONE = "02-2511-9488";

export function answerMaleUtiUrgentQuestion(message, now = new Date()) {
  if (!isUtiQuestion(message)) return null;
  if (!hasUrgentOrMedicationConcern(message)) return null;

  if (hasUpperUrinaryEmergency(message)) {
    return [
      "血尿合併右腰/側腹劇痛和發燒，需要警覺腎臟或輸尿管感染、結石合併感染等急症風險，LINE 不能判斷原因。",
      "不建議只吃止痛藥撐到明天，也不要自行吃抗生素。",
      `請現在直接急診/立即就醫；若要同步確認診所能否協助，可電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  const parts = [
    buildSymptomSummary(message),
    "LINE 不能判斷是否感染、也不能建議先吃哪種抗生素；請不要自行服藥或停藥。"
  ];

  const scheduleReply = buildRequestedScheduleReply(message, now);
  if (scheduleReply) {
    parts.push(`${scheduleReply}到診前請電話 ${PHONE} 確認當天名額。`);
  } else {
    parts.push(`請先電話 ${PHONE} 確認可看診時段，或盡快到泌尿科就醫。`);
  }

  parts.push("若高燒、劇痛、尿不出來、血尿或明顯很不舒服，請直接急診/立即就醫。");

  return parts.join("");
}

function buildSymptomSummary(message) {
  if (/發燒|高燒/.test(message)) {
    return "尿痛合併發燒需要盡快由醫師評估。";
  }

  if (/血尿|尿.*血|尿.*紅/.test(message)) {
    return "尿痛合併疑似血尿需要盡快由醫師評估。";
  }

  return "尿痛、頻尿或急尿可能有不同原因，需要由醫師評估。";
}

function isUtiQuestion(message) {
  return /尿尿.*痛|尿痛|排尿.*痛|小便.*痛|尿道炎|膀胱炎|泌尿道感染|攝護腺炎|頻尿|尿急/.test(message);
}

function hasUrgentOrMedicationConcern(message) {
  return /發燒|很痛|劇痛|血尿|尿不出來|排不出尿|抗生素|吃藥|藥|今天|晚上|夜診|晚診|現在|急/.test(message);
}

function hasUpperUrinaryEmergency(message) {
  const hasBloodUrine = /血尿|尿.*血|尿.*紅/.test(message);
  const hasFlankOrWaistPain = /腰.*痛|側腹.*痛|腰腹.*痛|右腰|左腰|腎絞痛|痛到|劇痛|很痛/.test(message);
  const hasFever = /發燒|高燒|體溫\s*3[89](?:\.\d)?|燒到\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);

  return hasBloodUrine && hasFlankOrWaistPain && hasFever;
}

function buildRequestedScheduleReply(message, now) {
  if (hasExplicitScheduleRequest(message)) {
    const requestedScheduleReply = answerFixedScheduleQuestion(message, now, []);
    if (requestedScheduleReply) {
      return `你問的時段可先參考：${requestedScheduleReply}`;
    }
  }

  if (!/今天|晚上|夜診|晚診|現在/.test(message)) return null;

  const scheduleReply = answerFixedScheduleQuestion("今天晚上有診嗎？", now, []);
  if (!scheduleReply) return null;

  const conciseSchedule = scheduleReply.split("。")[0];
  return `今天晚上可先參考：${conciseSchedule}。`;
}

function hasExplicitScheduleRequest(message) {
  const hasDay = /今天|今日|明天|明日|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]/.test(message);
  const hasPeriod = /早上|上午|早診|下午|午診|晚上|晚診|夜診|09:30|9:30|13:30|1:30|18:00|6:00/.test(message);
  const hasScheduleIntent = /看診|門診|泌尿科|有診|休診|停診|時段|掛號|預約|可以掛|能掛|適合看/.test(message);

  return hasDay && hasPeriod && hasScheduleIntent;
}
