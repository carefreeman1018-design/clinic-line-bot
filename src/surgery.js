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

  const officialFaqReply = answerOfficialCircumcisionFaq(message);
  if (officialFaqReply) return officialFaqReply;

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

function answerOfficialCircumcisionFaq(message) {
  if (/恢復|上班|上學|休息|多久.*工作|幾天.*工作/.test(message)) {
    return "大部分割包皮患者術後隔天可正常上學、上班；如果工作需要走動、搬重物或容易流汗，建議休息數天後再返回職場。";
  }

  if (/健保|給付|自費|包皮槍.*費用|包皮槍.*錢/.test(message)) {
    return "包皮槍屬於自費耗材，健保沒有給付；實際費用仍需依手術方式與門診評估確認。";
  }

  if (/痛|疼痛|麻醉/.test(message) && !/舒眠/.test(message)) {
    return "割包皮手術前會先打局部麻醉，入針當下難免有一定程度不適，但手術過程不會痛。";
  }

  if (/發炎|龜頭炎|包皮炎|糖尿病|血糖|體重|過重|減重/.test(message)) {
    return "若龜頭或包皮有嚴重發炎，通常會先在門診開抗生素控制，等發炎穩定後再手術；若體重過重、血糖控制較差或有糖尿病，也建議先減重或把血糖控制好，再由醫師全面評估是否適合手術。";
  }

  if (/舒眠|睡著|全身麻醉/.test(message)) {
    return "割包皮手術可以選擇舒眠麻醉；若不恐懼手術，官網建議局部麻醉即可。舒眠麻醉會先以靜脈注射讓患者睡著，再施打局部麻醉，可減少對陰莖打麻醉的恐懼，但費用會比局部麻醉高一些。";
  }

  if (/照顧|傷口|洗澡|擦澡|碰水|換藥/.test(message)) {
    return "割包皮術後會提供包紮換藥影片，也會提供藥品和泌尿科護理包方便自行換藥。術後前 7 天請擦澡；之後只要能讓患處碰不到水，例如用保鮮膜包覆患處，即可洗澡。";
  }

  if (/回診|回幾次|幾次/.test(message)) {
    return "割包皮術後原則上回診 3 次：術後第 2 天、第 9 天，以及約 1 個月左右。官網強烈建議盡量回診，讓雙主治醫師追蹤傷口癒合與術後狀況。";
  }

  if (/騎車|機車|開車|駕駛|交通工具|回家/.test(message)) {
    return "割包皮手術當天建議盡量搭大眾交通工具或計程車往返；若路程不長、約 30 分鐘內且路面平順，可自行斟酌騎車。平常有騎車需求者，通常手術隔天可開始騎機車。若當天採舒眠麻醉，術後絕對不要自行開車或騎車離開。";
  }

  if (/運動|慢跑|籃球|健身|重訓|深蹲/.test(message)) {
    return "割包皮術後 1 個月內建議不要做會摩擦到小兄弟的激烈運動，例如慢跑、籃球等；較不會摩擦的運動，例如負重深蹲，可在傷口癒合良好的前提下開始。";
  }

  if (/釘子|釘書針|脫落|掉/.test(message)) {
    return "只要好好照顧傷口，包皮槍釘子平均約 3–4 週會全數自然脫落；若滿 4 週後還沒掉光，可回診由雙主治醫師處理。";
  }

  if (/性生活|性行為|開機|自慰|DIY/.test(message)) {
    return "割包皮術後建議等傷口完全恢復，滿 1 個月之後再重啟性生活。";
  }

  return null;
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
  const normalized = message.trim();
  if (/^(好|好的|可以|麻煩|幫我|好 幫|好，幫|ok|OK)[。！!.\s]*$/.test(normalized)) return true;
  return /幫我查|查一下|查時段|查門診|今天.*時段|明天.*時段|哪天.*時段|什麼時段|門診時段|看診時段|早午晚|早上.*下午.*晚上|早診.*午診.*晚診|分別.*找誰/.test(normalized);
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
