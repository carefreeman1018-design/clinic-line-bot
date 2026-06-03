import { answerFixedScheduleQuestion } from "./schedule.js";
import { answerUrethralDischargeStdQuestion } from "./std-treatment.js";

const PHONE = "02-2511-9488";

export function answerMaleUtiUrgentQuestion(message, now = new Date()) {
  if (!isUtiQuestion(message)) return null;
  if (!hasUrgentOrMedicationConcern(message)) return null;

  const urethralDischargeReply = answerUrethralDischargeStdQuestion(message);
  if (urethralDischargeReply) return urethralDischargeReply;

  if (isChronicProstatitisLikeQuestion(message)) {
    return [
      "會陰或下腹悶痛、尿尿不太順、射精後酸痛，可能和慢性攝護腺炎、骨盆疼痛症候群或其他泌尿問題有關，但不能只靠訊息診斷。",
      "不建議自行吃之前剩的抗生素；是否需要抗生素、止痛或其他治療，要由醫師依尿液檢查、症狀與必要檢查評估。",
      "這不等於一定是癌症；但若症狀持續幾週，建議掛泌尿科門診評估。",
      `以你描述若沒有高燒、尿不出來、血尿變多或劇烈疼痛，通常不需要先急診；可先電話 ${PHONE} 確認可評估時段。若上述症狀出現或明顯很不舒服，請急診/立即就醫。`
    ].join("");
  }

  if (isScheduleOnlyUrologyQuestion(message)) {
    const requestedScheduleReply = answerFixedScheduleQuestion(message, now, []);
    if (requestedScheduleReply) return cleanScheduleReply(requestedScheduleReply, message);
  }

  if (hasUpperUrinaryEmergency(message)) {
    return [
      "血尿合併右腰/側腹劇痛和發燒，需要警覺腎臟或輸尿管感染、結石合併感染等急症風險，光靠訊息無法判斷原因。",
      "不建議只吃止痛藥撐到明天，也不要自行吃抗生素。",
      `請現在直接急診/立即就醫；若要同步確認診所能否協助，可電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  if (hasPainlessGrossHematuriaCancerConcern(message)) {
    return [
      "無痛肉眼血尿即使後來變正常，也不建議只觀察。",
      "這不等於一定是癌症，但中高年齡或有抽菸時，膀胱或泌尿道腫瘤、結石、感染等原因都需要排除，光靠訊息無法診斷。",
      `請盡快掛泌尿科做尿液、影像與必要時膀胱鏡等評估；若血尿很多、有血塊、尿不出來或明顯不舒服，請急診/立即就醫。門診可電話 ${PHONE}。`
    ].join("");
  }

  const parts = [
    buildSymptomSummary(message),
    "是否感染、該不該用抗生素，都需要醫師評估；請不要自行服藥或停藥。"
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
  return /尿尿.*痛|尿痛|排尿.*痛|小便.*痛|尿道炎|膀胱炎|泌尿道感染|攝護腺炎|頻尿|尿急|會陰|骨盆.*痛|射精.*痛|射精.*酸/.test(message);
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

function hasPainlessGrossHematuriaCancerConcern(message) {
  const hasGrossHematuria = /血尿|尿.*血|尿.*紅|尿裡.*紅|尿色.*紅|整杯.*紅|紅紅的/.test(message);
  const hasPainlessCue = /不會痛|不痛|無痛/.test(message);
  const hasCancerOrSmokingRisk = /癌|腫瘤|抽菸|抽煙|菸|煙|5[0-9]\s*歲|6[0-9]\s*歲|7[0-9]\s*歲/.test(message);

  return hasGrossHematuria && hasPainlessCue && hasCancerOrSmokingRisk;
}

function isChronicProstatitisLikeQuestion(message) {
  const hasPelvicOrProstateCue = /攝護腺炎|會陰|骨盆|射精.*痛|射精.*酸|陰囊.*悶|睪丸.*悶/.test(message);
  const hasChronicOrMedicationCue = /幾週|幾個禮拜|一陣子|慢性|悶痛|酸痛|抗生素|癌|急診|尿不太順/.test(message);

  return hasPelvicOrProstateCue && hasChronicOrMedicationCue;
}

function isScheduleOnlyUrologyQuestion(message) {
  return (
    hasExplicitScheduleRequest(message) &&
    !/尿痛|尿尿.*痛|小便.*痛|排尿.*痛|發燒|高燒|血尿|尿.*血|尿.*紅|尿不出|排不出尿|抗生素|吃藥|藥|很痛|劇痛|痛到/.test(message)
  );
}

function cleanScheduleReply(reply, message) {
  const symptomPrefix = /頻尿|夜尿/.test(message) ? "頻尿/夜尿想看一般泌尿科的話，" : "";
  return symptomPrefix + reply
    .replace(/臨時異動請以 LINE VOOM \/ 官方 LINE、線上掛號或電話 02-2511-9488 確認。?/g, "到診前請電話 02-2511-9488 確認名額與時段。")
    .replace(/可查看 LINE VOOM \/ 官方 LINE、線上掛號或電話 02-2511-9488 確認。?/g, "到診前請電話 02-2511-9488 確認名額與時段。");
}

function buildRequestedScheduleReply(message, now) {
  if (hasExplicitScheduleRequest(message)) {
    const requestedScheduleReply = answerFixedScheduleQuestion(message, now, []);
    if (requestedScheduleReply) {
      return `你問的時段可先參考：${requestedScheduleReply}`;
    }

    const scheduleOnlyQuestion = /今晚|今天晚上|晚上|夜診|晚診/.test(message)
      ? "今天晚上有診嗎？"
      : "今天有診嗎？";
    const scheduleReply = answerFixedScheduleQuestion(scheduleOnlyQuestion, now, []);
    if (scheduleReply) {
      const conciseSchedule = scheduleReply.split("。")[0];
      const scheduleLabel = scheduleOnlyQuestion === "今天晚上有診嗎？" ? "今天晚上時段" : "時段";
      return `你問的${scheduleLabel}可先參考：${conciseSchedule}。`;
    }
  }

  return null;
}

function hasExplicitScheduleRequest(message) {
  const hasDay = /今天|今日|明天|明日|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]/.test(message);
  const hasPeriod = /早上|上午|早診|下午|午診|晚上|晚診|夜診|09:30|9:30|13:30|1:30|18:00|6:00/.test(message);
  const hasScheduleIntent = /看診|門診|泌尿科|有診|休診|停診|時段|掛號|掛哪|改掛|該掛|預約|可以掛|能掛|能看|可以看|適合看|哪一診|哪診/.test(message);

  return hasDay && hasPeriod && hasScheduleIntent;
}
