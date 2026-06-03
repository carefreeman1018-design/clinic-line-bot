import fs from "node:fs";

const FIXED_SCHEDULE_CONFIG = loadFixedScheduleConfig();
const FIXED_SCHEDULE = FIXED_SCHEDULE_CONFIG.schedule;
const PERIOD_TIMES = FIXED_SCHEDULE_CONFIG.periodTimes;
const TEMPORARY_CHANGE_CONFIRMATION = FIXED_SCHEDULE_CONFIG.temporaryChangeConfirmation;

const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

const DAY_ALIASES = [
  ["週日", /週日|星期日|星期天|禮拜日|禮拜天|周日/],
  ["週一", /週一|星期一|禮拜一|周一/],
  ["週二", /週二|星期二|禮拜二|周二/],
  ["週三", /週三|星期三|禮拜三|周三/],
  ["週四", /週四|星期四|禮拜四|周四/],
  ["週五", /週五|星期五|禮拜五|周五/],
  ["週六", /週六|星期六|禮拜六|周六/]
];

const PERIOD_ALIASES = [
  ["早診", /早上|上午|早診|09:30|9:30/],
  ["午診", /下午|午診|13:30|1:30/],
  ["晚診", /今晚|今天晚上|晚上|晚診|夜診|18:00|6:00|週[一二三四五六日]晚|周[一二三四五六日]晚|星期[一二三四五六日天]晚|禮拜[一二三四五六日天]晚/]
];

const DOCTOR_SPECIALTIES = {
  "陳偉傑醫師": [
    "精雕微創包皮槍手術",
    "無刀口結紮手術",
    "男性私密整形/陰莖增大手術",
    "男性排尿障礙",
    "攝護腺擴開手術",
    "男性性功能障礙無創治療",
    "龜頭減敏治療",
    "性傳染病檢測/治療"
  ],
  "羅詩修醫師": [
    "精雕微創包皮槍手術",
    "無刀口結紮手術",
    "男性私密整形/陰莖增大手術",
    "男性/女性排尿障礙",
    "攝護腺水蒸氣消融手術",
    "男性性功能障礙無創治療",
    "龜頭減敏治療",
    "性傳染病檢測/治療"
  ],
  "李齊泰醫師": [
    "無刀口結紮手術",
    "菜花全方位治療",
    "低能量震波治療",
    "包皮槍包皮環切手術",
    "達文西泌尿道癌症手術",
    "達文西泌尿道重建手術",
    "單孔腹腔鏡疝氣修補",
    "單孔腹腔鏡腎上腺切除",
    "顯微精索靜脈曲張切除",
    "顯微輸精管重接（結紮逆轉）",
    "海福刀",
    "微創雷射攝護腺剜除手術",
    "軟式輸尿管鏡高能雷射碎石手術"
  ],
  "吳致寬醫師": [
    "微創雷射攝護腺剜除手術",
    "軟式輸尿管鏡高能雷射碎石手術",
    "單孔腹腔鏡疝氣修補",
    "無刀口結紮手術",
    "性傳染病檢測/治療",
    "男性性功能障礙無創治療",
    "精雕包皮環切手術",
    "顯微精索靜脈曲張切除",
    "海福刀"
  ],
  "蔡曜州醫師": [
    "新型微創疝氣手術",
    "腹腔鏡暨機器手臂手術",
    "攝護腺根除手術、膀胱根除與重建手術、腎臟部分切除術、腎根除術、腎上腺切除術",
    "迷你腹腔鏡手術",
    "單孔內視鏡手術",
    "雷射攝護腺手術",
    "攝護腺水蒸氣消融手術",
    "軟式輸尿管腎臟鏡",
    "經皮腎造廔取石術",
    "小兒泌尿學"
  ],
  "陳嘉哲醫師": [
    "痔瘡、廔管、肛裂等肛門疾病診斷及治療",
    "痔瘡微創手術、內外痔全切除合併整形手術、廔管手術、肛裂手術",
    "肛門性病診斷與治療",
    "一般外科"
  ],
  "李彥錞醫師": [
    "顯微輸精管重接（結紮逆轉）",
    "陰莖增大手術",
    "疤痕重建手術",
    "私密處雷射治療及微整形",
    "體型雕塑手術（自體脂肪移植）"
  ]
};

const DOCTOR_PROFILES = {
  "陳偉傑醫師": {
    current: ["津久診所院長"],
    education: ["臺北醫學大學臨床醫學研究所博士候選人", "長庚大學醫學士"],
    experience: [
      "臺北醫學大學附設醫院泌尿科主治醫師",
      "臺北醫學大學附設醫院泌尿科總醫師",
      "臺北醫學大學附設醫院病房主任",
      "史瓦帝尼王國駐診主治醫師",
      "臺灣泌尿科醫學會會員",
      "韓國 Proud Urology 認可私密整形醫師",
      "Rezūm 水蒸氣消融術原廠認證醫師"
    ],
    certificates: ["泌尿科專科醫師"]
  },
  "羅詩修醫師": {
    current: ["津久診所執行院長"],
    education: ["臺北醫學大學醫學士"],
    experience: [
      "臺北醫學大學附設醫院泌尿科主治醫師",
      "臺北醫學大學附設醫院泌尿科總醫師",
      "臺灣泌尿科醫學會會員",
      "臺灣尿失禁防治協會委員",
      "韓國 Proud Urology 認可私密整形醫師",
      "Rezūm 水蒸氣消融術原廠認證醫師"
    ],
    certificates: ["泌尿科專科醫師"]
  },
  "李齊泰醫師": {
    current: ["津久診所泌尿科主治醫師", "臺北醫學大學附設醫院泌尿科主治醫師"],
    education: ["臺北醫學大學醫學士"],
    experience: [
      "臺北醫學大學附設醫院泌尿科總醫師",
      "美國泌尿科醫學會會員",
      "台灣泌尿科醫學會會員",
      "性傳染症友善門診醫師",
      "IRCAD 國際微創中心高階腹腔鏡縫合認證",
      "Rezūm 水蒸氣消融術原廠認證醫師"
    ],
    certificates: ["泌尿科專科醫師"]
  },
  "吳致寬醫師": {
    current: ["津久診所泌尿科主治醫師", "臺北醫學大學附設醫院泌尿科主治醫師"],
    education: ["臺灣大學醫學士"],
    experience: [
      "臺北醫學大學附設醫院泌尿科總醫師",
      "臺灣泌尿科醫學會會員",
      "臺灣男性學醫學會會員",
      "Rezūm 水蒸氣消融術原廠認證醫師"
    ],
    certificates: ["泌尿科專科醫師"]
  },
  "蔡曜州醫師": {
    current: [
      "津久診所首席顧問",
      "教育部部定副教授",
      "臺北慈濟醫院泌尿科主任",
      "臺灣疝氣醫學會常務理事",
      "臺灣泌尿楓城學會理事",
      "臺灣皮質醛酮學會常務理事"
    ],
    education: ["國立臺灣大學醫工所博士", "臺北醫學院（現臺北醫學大學）醫學系"],
    experience: [
      "臺北醫學大學附設醫院泌尿科主任",
      "臺灣皮質醛酮學會秘書長",
      "花蓮慈濟大學專任副教授",
      "臺灣泌尿科醫學會腹腔鏡手術委員會副主委",
      "臺北慈濟醫院主治醫師",
      "教育部部定講師",
      "恩主公醫院主治醫師"
    ],
    certificates: ["泌尿科專科醫師"]
  },
  "陳嘉哲醫師": {
    current: ["津久診所肛門直腸外科主任"],
    education: ["臺北醫學大學醫學士"],
    experience: ["臺北醫學大學附設醫院大腸直腸外科主治醫師", "臺北醫學大學附設醫院急症外傷科主治醫師"],
    certificates: ["臺灣外科醫學會專科醫師", "臺灣大腸直腸外科醫學會專科醫師", "臺灣外傷醫學會專科醫師"]
  },
  "李彥錞醫師": {
    current: ["津久診所整形外科主治醫師", "聯新國際醫院整形外科主治醫師"],
    education: ["中山醫學大學醫學士"],
    experience: [
      "基隆長庚紀念醫院主治醫師",
      "林口長庚紀念醫院整形外科總醫師",
      "林口長庚紀念醫院整形外科住院醫師",
      "美國加州爾灣醫院整形外科臨床研究",
      "美國紐約 MSKCC 癌症醫學中心臨床研究",
      "美國密西根醫學中心臨床研究"
    ],
    certificates: ["整形外科專科醫師"]
  }
};

const DOCTOR_ALIASES = [
  ["陳偉傑醫師", /陳偉傑|陳醫師|陳醫生/],
  ["羅詩修醫師", /羅詩修|羅醫師|羅醫生/],
  ["李齊泰醫師", /李齊泰|李醫師|李醫生/],
  ["吳致寬醫師", /吳致寬|吳醫師|吳醫生/],
  ["蔡曜州醫師", /蔡曜州|蔡醫師|蔡醫生/],
  ["陳嘉哲醫師", /陳嘉哲/],
  ["李彥錞醫師", /李彥錞/]
];

const ROLE_DOCTOR_ALIASES = [
  ["羅詩修醫師", /執行院長/],
  ["陳偉傑醫師", /院長/]
];

function loadFixedScheduleConfig() {
  const raw = fs.readFileSync(new URL("../data/fixed-schedule.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

export function answerDoctorInfoQuestion(message, conversationHistory = [], now = new Date()) {
  const doctor = resolveDoctor(message);
  const isSpecialtyQuestion = /專長|專業|主治|擅長|強項|會看什麼|看什麼/.test(message);
  const isProfileQuestion = /現職|學歷|經歷|履歷|證照|證書|專科|認證|背景|資歷/.test(message)
    || (Boolean(doctor) && /是誰|哪位|介紹|職稱/.test(message));
  const isDoctorFollowUp = Boolean(doctor) && /那|呢|其他|其它|別的/.test(message);
  const comparisonReply = buildDoctorComparisonReply(message, doctor, conversationHistory);
  if (comparisonReply) return comparisonReply;

  const otherDoctorSpecialtyReply = buildOtherDoctorSpecialtyReply(message, conversationHistory);
  if (otherDoctorSpecialtyReply) return otherDoctorSpecialtyReply;

  const generalUrologyDoctorChoiceReply = buildGeneralUrologyDoctorChoiceReply(message, now);
  if (generalUrologyDoctorChoiceReply) return generalUrologyDoctorChoiceReply;

  const combinedDoctorScheduleReply = buildCombinedDoctorScheduleReply(message, doctor, conversationHistory, now);
  if (combinedDoctorScheduleReply) return combinedDoctorScheduleReply;

  if (hasScheduleOnlyDoctorQuestion(message)) return null;

  if (isProfileQuestion) {
    const resolvedDoctor = doctor ?? findLastMentionedDoctor(conversationHistory);
    if (!resolvedDoctor) return "想查哪位醫師的學經歷？請直接打醫師名字。";

    return buildDoctorProfileReply(resolvedDoctor, message);
  }

  const shouldAnswerSpecialty = isSpecialtyQuestion || (isDoctorFollowUp && hasRecentSpecialtyContext(conversationHistory));

  if (!shouldAnswerSpecialty) return null;

  const resolvedDoctor = doctor ?? findLastMentionedDoctor(conversationHistory);
  if (!resolvedDoctor) return "想查哪位醫師的專長？請直接打醫師名字。";

  const specialties = DOCTOR_SPECIALTIES[resolvedDoctor];
  if (!specialties) return `目前沒有整理到${resolvedDoctor}的主治專長。`;
  if (/主要|大概|簡單|重點/.test(message)) return buildConciseSpecialtyReply(resolvedDoctor);

  return `${resolvedDoctor}主治專長：${specialties.join("、")}。`;
}

function buildGeneralUrologyDoctorChoiceReply(message, now) {
  const hasGeneralUrologySymptom = /頻尿|夜尿|尿急|排尿|泌尿|一般泌尿/.test(message);
  const hasDoctorChoiceCue = /院長|醫師|醫生|掛他|掛誰|掛哪|推薦/.test(message);
  const hasNonExclusiveCue = /一定要|只能|唯一|不要推薦|不一定|非要/.test(message);
  if (!hasGeneralUrologySymptom || !hasDoctorChoiceCue || !hasNonExclusiveCue) return null;

  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const dayLabel = buildDayLabel(message, day);
  const periods = resolveRequestedPeriods(message);
  const periodText = periods.length > 0
    ? periods.map((period) => `${period}（${PERIOD_TIMES[period]}）`).join("、")
    : "一般門診時段";
  const scheduleNote = periods.includes("晚診") && day === "週四"
    ? "今天晚診若固定門診是院長陳偉傑醫師可先參考"
    : `${dayLabel}${periodText}可先參考固定門診`;

  return [
    "一般頻尿或泌尿問題不一定只能掛院長，也不需要只推薦唯一一位醫師。",
    `${scheduleNote}；也可以依一般門診時段與名額安排。`,
    "若發燒、尿不出來、血尿明顯或很不舒服，請盡快就醫。"
  ].join("");
}

function buildCombinedDoctorScheduleReply(message, doctor, conversationHistory, now) {
  if (!hasDoctorScheduleQuestion(message)) return null;

  const resolvedDoctor = doctor ?? findLastMentionedDoctor(conversationHistory);
  if (!resolvedDoctor) return null;

  const lines = [buildConciseDoctorIntro(resolvedDoctor)];
  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const periods = resolveRequestedPeriods(message);
  const scheduleLine = buildDoctorDayScheduleLine(resolvedDoctor, day, buildDayLabel(message, day), periods);
  if (scheduleLine) lines.push(scheduleLine);
  lines.push(TEMPORARY_CHANGE_CONFIRMATION);

  return lines.join("\n");
}

function hasDoctorScheduleQuestion(message) {
  const hasScheduleCue = /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|下午|今晚|今天晚上|晚上|早診|午診|晚診|夜診|看診|門診|有診/.test(message);
  const hasDoctorInfoCue = /是誰|哪位|介紹|職稱|院長|現職|主治|專長|擅長|看什麼/.test(message);
  return hasScheduleCue && hasDoctorInfoCue;
}

function hasScheduleOnlyDoctorQuestion(message) {
  const hasScheduleCue = /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|下午|今晚|今天晚上|晚上|早診|午診|晚診|夜診|看診|門診|有診/.test(message);
  const hasInfoCue = /是誰|哪位|介紹|職稱|院長|現職|學歷|經歷|履歷|證照|證書|專科|認證|背景|資歷|主治|專長|擅長|看什麼/.test(message);
  return hasScheduleCue && !hasInfoCue;
}

function buildConciseDoctorIntro(doctor) {
  const profile = DOCTOR_PROFILES[doctor];
  const specialties = DOCTOR_SPECIALTIES[doctor] ?? [];
  const role = profile?.current?.[0] ?? "津久診所醫師";
  const specialtyText = specialties.slice(0, 3).join("、");
  if (!specialtyText) return `${doctor}是${role}。`;
  return `${doctor}是${role}，主要看${specialtyText}。`;
}

function buildConciseSpecialtyReply(doctor) {
  const specialties = DOCTOR_SPECIALTIES[doctor] ?? [];
  const specialtyText = specialties.slice(0, 3).join("、");
  if (!specialtyText) return `目前沒有整理到${doctor}的主治專長。`;
  return `${doctor}主要看${specialtyText}。`;
}

function buildDoctorDayScheduleLine(doctor, day, dayLabel, requestedPeriods) {
  const schedule = FIXED_SCHEDULE[day];
  if (!schedule) return `${dayLabel}固定門診沒有列到${doctor}的一般門診。`;

  const periodsToCheck = requestedPeriods.length > 0 ? requestedPeriods : ["早診", "午診", "晚診"];
  const matchingLines = periodsToCheck
    .map((period) => {
      const clinic = schedule[period] ?? "休診";
      if (!clinic.includes(doctor)) return null;
      return `${period}（${PERIOD_TIMES[period]}）`;
    })
    .filter(Boolean);

  if (matchingLines.length > 0) return `${dayLabel}${matchingLines.join("、")}是${doctor}門診。`;

  if (requestedPeriods.length > 0) {
    const requestedText = requestedPeriods.map((period) => `${period}（${PERIOD_TIMES[period]}）`).join("、");
    const otherLines = buildDoctorAvailablePeriodsForDay(doctor, day);
    if (otherLines.length > 0) return `${dayLabel}${requestedText}沒有${doctor}門診；同一天${otherLines.join("、")}有。`;
    return `${dayLabel}${requestedText}沒有${doctor}門診。`;
  }

  return `${dayLabel}固定門診沒有列到${doctor}的一般門診。`;
}

function buildDoctorAvailablePeriodsForDay(doctor, day) {
  const schedule = FIXED_SCHEDULE[day];
  if (!schedule) return [];

  return ["早診", "午診", "晚診"]
    .map((period) => {
      const clinic = schedule[period] ?? "休診";
      if (!clinic.includes(doctor)) return null;
      return `${period}（${PERIOD_TIMES[period]}）`;
    })
    .filter(Boolean);
}

function buildDoctorComparisonReply(message, doctor, conversationHistory) {
  if (!/差別|不同|比較|差在哪/.test(message)) return null;

  const firstDoctor = findLastMentionedDoctor(conversationHistory, { excludeDoctor: doctor });
  const secondDoctor = doctor;
  if (!firstDoctor || !secondDoctor || firstDoctor === secondDoctor) return null;

  const firstSpecialties = DOCTOR_SPECIALTIES[firstDoctor];
  const secondSpecialties = DOCTOR_SPECIALTIES[secondDoctor];
  if (!firstSpecialties || !secondSpecialties) return null;

  const shared = firstSpecialties.filter((specialty) => secondSpecialties.includes(specialty));
  const firstUnique = firstSpecialties.filter((specialty) => !secondSpecialties.includes(specialty));
  const secondUnique = secondSpecialties.filter((specialty) => !firstSpecialties.includes(specialty));

  return [
    `${firstDoctor}和${secondDoctor}很多男性泌尿與私密手術專長重疊。`,
    `共同項目：${shared.slice(0, 4).join("、")}。`,
    `${firstDoctor}資料中特別列：${firstUnique.join("、") || "目前沒有額外列出不同項目"}。`,
    `${secondDoctor}資料中特別列：${secondUnique.join("、") || "目前沒有額外列出不同項目"}。`,
    "實際適合掛哪位，還是要看你想處理的問題與可掛時段。"
  ].join("\n");
}

function buildDoctorProfileReply(doctor, message) {
  const profile = DOCTOR_PROFILES[doctor];
  if (!profile) return `目前沒有整理到${doctor}的學經歷資料。`;

  const lines = [];
  if (/現職|職稱/.test(message)) lines.push(`${doctor}現職：${profile.current.join("、")}。`);
  if (/學歷/.test(message)) lines.push(`${doctor}學歷：${profile.education.join("、")}。`);
  if (/經歷|履歷|背景|資歷|認證/.test(message)) lines.push(`${doctor}經歷/認證：${profile.experience.join("、")}。`);
  if (/證照|證書|專科/.test(message)) lines.push(`${doctor}專科證書：${profile.certificates.join("、")}。`);

  if (lines.length > 0) return lines.join("\n");

  return [
    `${doctor}現職：${profile.current.join("、")}。`,
    `學歷：${profile.education.join("、")}。`,
    `經歷/認證：${profile.experience.slice(0, 4).join("、")}。`,
    `專科證書：${profile.certificates.join("、")}。`
  ].join("\n");
}

function buildOtherDoctorSpecialtyReply(message, conversationHistory) {
  if (!/其他|其它|別的/.test(message) || !/醫師|醫生/.test(message)) return null;
  if (!hasRecentSpecialtyContext(conversationHistory)) return null;

  const excludedDoctor = /不要再列|不要列|不用列|排除/.test(message)
    ? findLastMentionedDoctor(conversationHistory)
    : null;

  const doctors = Object.keys(DOCTOR_SPECIALTIES).filter((doctor) => doctor !== excludedDoctor);
  const lines = doctors.map((doctor) => `${doctor}：${DOCTOR_SPECIALTIES[doctor].slice(0, 3).join("、")}`);

  return ["以下列其他醫師主治專長摘要：", ...lines].join("\n");
}

function resolveDoctor(message) {
  return DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0]
    ?? ROLE_DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0]
    ?? null;
}

function findLastMentionedDoctor(conversationHistory, options = {}) {
  const { excludeDoctor = null } = options;
  const userMessages = conversationHistory.filter((historyMessage) => historyMessage.role === "user");
  for (const historyMessage of [...userMessages].reverse()) {
    const content = historyMessage.content ?? "";
    const doctor = resolveDoctor(content);
    if (doctor && doctor !== excludeDoctor) return doctor;
  }

  for (const historyMessage of [...conversationHistory].reverse()) {
    const content = historyMessage.content ?? "";
    const doctor = resolveDoctor(content);
    if (doctor && doctor !== excludeDoctor) return doctor;
  }

  return null;
}

function hasRecentSpecialtyContext(conversationHistory) {
  return [...conversationHistory]
    .reverse()
    .slice(0, 4)
    .some((historyMessage) => /主治專長|專長|專業|擅長|強項/.test(historyMessage.content ?? ""));
}

function resolveRequestedPeriods(message) {
  return PERIOD_ALIASES
    .filter(([, pattern]) => pattern.test(message))
    .map(([period]) => period);
}

function resolveRequestedDay(message, now) {
  const relativeOffset = resolveRelativeDayOffset(message);
  if (relativeOffset !== null) return getTaipeiWeekday(addDays(now, relativeOffset));

  return DAY_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function buildDayLabel(message, day) {
  if (/今天|今日|今晚|今天晚上/.test(message)) return `今天（${day}）`;
  if (/明天|明日/.test(message)) return `明天（${day}）`;
  if (/後天/.test(message)) return `後天（${day}）`;
  return day;
}

function resolveRelativeDayOffset(message) {
  if (/今天|今日|今晚|今天晚上/.test(message)) return 0;
  if (/明天|明日/.test(message)) return 1;
  if (/後天/.test(message)) return 2;
  return null;
}

function addDays(date, days) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function getTaipeiWeekday(date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short"
  }).format(date);

  return {
    Sun: "週日",
    Mon: "週一",
    Tue: "週二",
    Wed: "週三",
    Thu: "週四",
    Fri: "週五",
    Sat: "週六"
  }[weekday];
}
