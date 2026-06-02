import { answerFixedScheduleQuestion } from "./schedule.js";

const PHONE = "02-2511-9488";

export function answerMaleUtiUrgentQuestion(message, now = new Date()) {
  if (!isUtiQuestion(message)) return null;
  if (!hasUrgentOrMedicationConcern(message)) return null;

  const parts = [
    "尿痛合併發燒需要盡快由醫師評估。",
    "LINE 不能判斷是否感染、也不能建議先吃哪種抗生素；請不要自行服藥或停藥。"
  ];

  const scheduleReply = buildSameDayScheduleReply(message, now);
  if (scheduleReply) {
    parts.push(`${scheduleReply}到診前請電話 ${PHONE} 確認當天名額。`);
  } else {
    parts.push(`請先電話 ${PHONE} 確認可看診時段，或盡快到泌尿科就醫。`);
  }

  parts.push("若高燒、劇痛、尿不出來、血尿或明顯很不舒服，請直接急診/立即就醫。");

  return parts.join("");
}

function isUtiQuestion(message) {
  return /尿尿.*痛|尿痛|排尿.*痛|小便.*痛|尿道炎|膀胱炎|泌尿道感染|攝護腺炎|頻尿|尿急/.test(message);
}

function hasUrgentOrMedicationConcern(message) {
  return /發燒|很痛|劇痛|血尿|尿不出來|排不出尿|抗生素|吃藥|藥|今天|晚上|夜診|晚診|現在|急/.test(message);
}

function buildSameDayScheduleReply(message, now) {
  if (!/今天|晚上|夜診|晚診|現在/.test(message)) return null;

  const scheduleReply = answerFixedScheduleQuestion("今天晚上有診嗎？", now, []);
  if (!scheduleReply) return null;

  const conciseSchedule = scheduleReply.split("。")[0];
  return `今天晚上可先參考：${conciseSchedule}。`;
}
