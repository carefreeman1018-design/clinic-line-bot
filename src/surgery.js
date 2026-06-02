import fs from "node:fs";

const PHONE = "02-2511-9488";
const CIRCUMCISION_DOCTORS = ["陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師"];
const FIXED_SCHEDULE_CONFIG = loadFixedScheduleConfig();
const FIXED_SCHEDULE = FIXED_SCHEDULE_CONFIG.schedule;
const PERIOD_TIMES = FIXED_SCHEDULE_CONFIG.periodTimes;
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export function answerCircumcisionFastPassQuestion(message, conversationHistory = [], now = new Date()) {
  const hasDirectCircumcisionQuestion = isCircumcisionQuestion(message);
  const hasRecentCircumcisionContext = hasRecentCircumcisionDoctorContext(conversationHistory);
  if (!hasDirectCircumcisionQuestion && !hasRecentCircumcisionContext) return null;
  if (!hasDirectCircumcisionQuestion && hasCompetingNonCircumcisionTopic(message)) return null;

  if (asksToCheckCircumcisionDoctorSchedule(message)) {
    return answerCircumcisionDoctorSchedule(now);
  }

  if (!hasDirectCircumcisionQuestion) return null;

  if (asksCircumcisionDoctorRecommendation(message)) {
    return answerCircumcisionDoctorRecommendation();
  }

  if (!asksFastPassPriceOrNextStep(message)) return null;

  const parts = [
    "診所有提供割包皮/包皮槍手術評估，也有快速通關服務可協助確認。",
  ];

  if (hasBloodThinnerOrCardiacRisk(message)) {
    parts.push("你有心臟支架且正在吃阿斯匹靈、保栓通或其他抗凝血/抗血小板藥時，不建議自行停藥，也不能先保證明天直接手術。");
    parts.push("需由醫師確認心血管病史、目前用藥與出血/血栓風險後，再決定能否手術、是否需調整藥物與時段。");
  }

  parts.push("能不能當天看診後手術、以及實際費用，需依醫師術前評估、手術方式與當天時段安排確認。");
  parts.push(`下一步請留下姓名、電話、方便時段與想做的項目；若有心臟病史或用藥，請一併提供，或直接電話 ${PHONE} 確認。`);

  return parts.join("");
}

function loadFixedScheduleConfig() {
  const raw = fs.readFileSync(new URL("../data/fixed-schedule.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

function answerCircumcisionDoctorRecommendation() {
  return [
    "割包皮/包皮槍可先掛泌尿科或男性門診評估。",
    "官網雙主治包皮槍流程提到陳偉傑醫師、羅詩修醫師；醫師專長資料也列李齊泰醫師有包皮槍包皮環切手術、吳致寬醫師有精雕包皮環切手術。",
    "哪位最適合仍要看可掛時段與術前評估，不在線上直接指定唯一人選。",
    `如果要查時段，可先電話 ${PHONE} 確認，或直接告訴我想查今天、明天還是哪一天。`
  ].join("");
}

function answerCircumcisionDoctorSchedule(now) {
  const day = getTaipeiWeekday(now);
  const slots = buildCircumcisionDoctorSlots(day);

  if (slots.length === 0) {
    return `可以。${day}固定門診表沒有列到陳偉傑、羅詩修、李齊泰或吳致寬醫師的一般門診時段；請電話 ${PHONE} 確認其他可評估時段或手術諮詢安排。`;
  }

  return [
    `可以。今天（${day}）可先參考這幾位有包皮手術相關專長的門診：`,
    ...slots,
    `到診前請電話 ${PHONE} 確認當天名額與是否能評估包皮手術；能不能當天手術仍需醫師術前評估。`
  ].join("\n");
}

function isCircumcisionQuestion(message) {
  return /割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(message);
}

function asksFastPassPriceOrNextStep(message) {
  return /今天|當天|看完就手術|看診.*手術|快速通關|費用|價格|價錢|多少錢|下一步|怎麼約|怎麼預約|預約|掛號/.test(message);
}

function hasBloodThinnerOrCardiacRisk(message) {
  return /抗凝血|抗血小板|阿斯匹靈|阿司匹靈|保栓通|Plavix|clopidogrel|warfarin|華法林|Xarelto|拜瑞妥|Eliquis|艾必克凝|Pradaxa|心臟支架|支架|心臟病|中風|血栓|自行停藥|自己停藥|停藥/.test(message);
}

function asksCircumcisionDoctorRecommendation(message) {
  return /推薦|醫師|醫生|哪位|哪個|誰|主治|專長/.test(message);
}

function asksToCheckCircumcisionDoctorSchedule(message) {
  return /^(好|好的|可以|麻煩|幫我|好 幫|好，幫|ok|OK)|幫我查|查一下|查時段|查門診|今天.*時段|明天.*時段|哪天.*時段|什麼時段|門診時段|看診時段|早午晚|早上.*下午.*晚上|早診.*午診.*晚診|分別.*找誰/.test(message.trim());
}

function hasCompetingNonCircumcisionTopic(message) {
  return /頻尿|夜尿|尿急|尿痛|排尿|小便|尿尿|泌尿道感染|膀胱炎|攝護腺|前列腺|尿流|尿不出|腎結石|輸尿管結石|血尿|腰痛|肛門|痔瘡|廔管|肛裂|性功能|勃起|威而鋼|犀利士|HPV|菜花|性病|猛健樂|點滴|疫苗/.test(message);
}

function hasRecentCircumcisionDoctorContext(conversationHistory) {
  return [...conversationHistory]
    .slice(-6)
    .some((historyMessage) =>
      /割包皮|包皮槍|包皮環切|推薦.*醫|醫師.*包皮|醫生.*包皮|陳偉傑醫師|羅詩修醫師|李齊泰醫師|吳致寬醫師/.test(historyMessage.content ?? "")
    );
}

function buildCircumcisionDoctorSlots(day) {
  const daySchedule = FIXED_SCHEDULE[day] ?? {};

  return Object.entries(daySchedule)
    .filter(([, clinic]) => CIRCUMCISION_DOCTORS.some((doctor) => clinic.includes(doctor)))
    .map(([period, clinic]) => `${period}（${PERIOD_TIMES[period]}）：${clinic}`);
}

function getTaipeiWeekday(date) {
  const weekdayName = date.toLocaleDateString("en-US", { timeZone: "Asia/Taipei", weekday: "short" });
  const nameToIndex = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return WEEKDAYS[nameToIndex[weekdayName] ?? date.getDay()];
}
