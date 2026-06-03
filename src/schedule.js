import fs from "node:fs";
import { answerLineVoomAnnouncementQuestion } from "./announcements.js";

const FIXED_SCHEDULE_CONFIG = loadFixedScheduleConfig();
const FIXED_SCHEDULE = FIXED_SCHEDULE_CONFIG.schedule;
const PERIOD_TIMES = FIXED_SCHEDULE_CONFIG.periodTimes;

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
  ["晚診", /晚上|晚診|夜診|18:00|6:00|週[一二三四五六日]晚|周[一二三四五六日]晚|星期[一二三四五六日天]晚|禮拜[一二三四五六日天]晚/]
];

const DOCTOR_ALIASES = [
  ["陳偉傑醫師", /陳偉傑|陳醫師|陳醫生/],
  ["羅詩修醫師", /羅詩修|羅醫師|羅醫生/],
  ["吳致寬醫師", /吳致寬|吳醫師|吳醫生/],
  ["李齊泰醫師", /李齊泰|李醫師|李醫生/],
  ["陳嘉哲醫師", /陳嘉哲/]
];

const FIXED_DOCTORS = deriveFixedDoctors(FIXED_SCHEDULE);

const DOCTOR_MISSPELLINGS = [
  {
    pattern: /羅世修/,
    inputName: "羅世修醫師",
    intendedDoctor: "羅詩修醫師"
  }
];

const SCHEDULE_INTENT_PATTERN = /看診|門診|泌尿科|誰|醫師|醫生|有診|休診|停診|營業|有開|開嗎|時段|掛號|掛哪|改掛|該掛|可以掛|能掛|哪一診|哪診|預約/;
const TEMPORARY_CHANGE_CONFIRMATION = FIXED_SCHEDULE_CONFIG.temporaryChangeConfirmation;
const WALK_IN_CONFIRMATION = "現場掛號可先到現場、也可先參考固定門診；但名額與臨時異動仍需以電話 02-2511-9488 或現場/線上掛號確認，不能保證一定掛得到。";

function loadFixedScheduleConfig() {
  const raw = fs.readFileSync(new URL("../data/fixed-schedule.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

function deriveFixedDoctors(schedule) {
  const doctors = new Set();
  for (const daySchedule of Object.values(schedule)) {
    for (const clinic of Object.values(daySchedule)) {
      if (clinic === "手術" || clinic === "休診") continue;
      doctors.add(clinic.replace(/（.+?）/g, ""));
    }
  }
  return [...doctors];
}

export function answerFixedScheduleQuestion(message, now = new Date(), conversationHistory = []) {
  if (hasDoctorInfoIntent(message)) return null;

  const announcementReply = answerLineVoomAnnouncementQuestion(message);

  const day = resolveRequestedDay(message, now) ?? resolveFollowUpDay(message, conversationHistory, now);
  const periods = resolveRequestedPeriods(message);
  const period = periods[0];
  const requestedDoctors = resolveRequestedDoctors(message);
  const doctor = resolveRequestedDoctor(message);
  const misspelledDoctor = resolveMisspelledDoctor(message);
  const doctorListReply = buildDoctorListReply(message, conversationHistory);
  const followUpDoctor = resolveFollowUpDoctor(message, conversationHistory);
  const hasScheduleIntent = SCHEDULE_INTENT_PATTERN.test(message);
  const shouldBlendScheduleWithAnnouncement = Boolean(announcementReply && day && !hasExplicitFullDate(message));

  if (!hasScheduleIntent && !doctor && !misspelledDoctor && !doctorListReply && !followUpDoctor) return null;
  if (announcementReply && !shouldBlendScheduleWithAnnouncement) return null;

  if (day && asksAppointmentChange(message)) {
    return compactLines([
      buildAppointmentChangeReply(message, day, periods),
      TEMPORARY_CHANGE_CONFIRMATION
    ]);
  }

  if (!day && doctorListReply) return doctorListReply;
  if (!day && misspelledDoctor) return buildMisspelledDoctorScheduleReply(misspelledDoctor);
  if (!day && doctor) return buildDoctorScheduleReply(doctor);
  if (!day && followUpDoctor) return buildDoctorScheduleReply(followUpDoctor);
  if (!day) return null;

  const dayLabel = buildDayLabel(message, day);
  const staleStopAnnouncementNote = buildStaleStopAnnouncementNote(message);
  const temporaryChangeConfirmation = staleStopAnnouncementNote
    ? "當週是否臨時異動可電話 02-2511-9488 確認。"
    : TEMPORARY_CHANGE_CONFIRMATION;
  const contextNotes = [
    staleStopAnnouncementNote,
    buildPastAnnouncementNote(message, now),
  ].filter(Boolean);
  const routeNote = asksRouteInScheduleQuestion(message) ? buildMrtRouteNote() : null;
  const walkInNote = asksWalkInRegistration(message) ? WALK_IN_CONFIRMATION : null;

  if (!FIXED_SCHEDULE[day]) {
    return compactLines([...contextNotes, `${dayLabel}固定門診表沒有一般門診時段。`, walkInNote ?? temporaryChangeConfirmation, routeNote]);
  }

  if (!period && doctor) {
    return compactLines([
      ...contextNotes,
      buildDoctorDayAvailabilityReply(doctor, day, dayLabel),
      staleStopAnnouncementNote ? temporaryChangeConfirmation : `名額與臨時異動請電話 02-2511-9488 確認。`,
      routeNote
    ]);
  }

  if (!period) {
    if (asksForUrologyCare(message) && asksForAlternativeClinicTime(message)) {
      return compactLines([
        ...contextNotes,
        buildAvailableGeneralClinicTimesReply(day),
        walkInNote ?? temporaryChangeConfirmation,
        routeNote
      ]);
    }

    return compactLines([...contextNotes, buildFullDayReply(day, dayLabel, walkInNote ?? temporaryChangeConfirmation), routeNote]);
  }

  if (periods.length > 1) {
    return compactLines([...contextNotes, buildSelectedPeriodsReply(day, dayLabel, periods, walkInNote ?? temporaryChangeConfirmation), routeNote]);
  }

  const clinic = FIXED_SCHEDULE[day][period];
  const time = periodToTime(period);

  if (requestedDoctors.length > 0 && !(asksForUrologyCare(message) && clinic.includes("肛門直腸外科"))) {
    return compactLines([
      ...contextNotes,
      buildRequestedDoctorPeriodReply(dayLabel, period, time, clinic, requestedDoctors),
      walkInNote ?? temporaryChangeConfirmation,
      routeNote
    ]);
  }

  if (clinic === "休診") {
    if (asksForAlternativeClinicTime(message)) {
      return compactLines([
        ...contextNotes,
        `${dayLabel}${period}（${time}）休診。`,
        buildAvailableClinicTimesReply(day),
        walkInNote ?? temporaryChangeConfirmation,
        routeNote
      ]);
    }

    return compactLines([...contextNotes, `${dayLabel}${period}（${time}）休診。`, walkInNote ?? temporaryChangeConfirmation, routeNote]);
  }

  if (clinic === "手術") {
    if (asksForAlternativeClinicTime(message)) {
      return compactLines([
        ...contextNotes,
        `${dayLabel}${period}（${time}）是手術時段，不是一般門診。`,
        buildAvailableGeneralClinicTimesReply(day),
        walkInNote ?? temporaryChangeConfirmation,
        routeNote
      ]);
    }

    return compactLines([
      ...contextNotes,
      `${dayLabel}${period}（${time}）是手術時段，不是一般門診。`,
      walkInNote ?? "可查看 LINE VOOM、線上掛號或電話 02-2511-9488 確認。",
      routeNote
    ]);
  }

  if (asksForUrologyCare(message) && clinic.includes("肛門直腸外科")) {
    const prefix = /不要掛|不適合|對嗎|可以掛|能掛/.test(message) ? "對，" : "";
    if (asksForAlternativeClinicTime(message)) {
      return compactLines([
        ...contextNotes,
        `${prefix}${dayLabel}${period}（${time}）是${clinic}，不是一般泌尿科門診。`,
        buildAvailableGeneralClinicTimesReply(day),
        walkInNote ?? temporaryChangeConfirmation,
        routeNote
      ]);
    }

    return compactLines([...contextNotes, `${prefix}${dayLabel}${period}（${time}）是${clinic}，不是一般泌尿科門診。想看泌尿科請換個時段。`, walkInNote, routeNote]);
  }

  return compactLines([...contextNotes, `${dayLabel}${period}（${time}）是${clinic}門診。`, walkInNote ?? temporaryChangeConfirmation, routeNote]);
}

export function answerPepVisitScheduleFollowUp(message, now = new Date(), conversationHistory = []) {
  if (!hasRecentPepContext(conversationHistory)) return null;
  if (hasCompetingMedicalTopic(message)) return null;
  if (hasNewPepRiskOrMedicationQuestion(message)) return null;
  if (!hasPepVisitFollowUpIntent(message)) return null;

  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const dayLabel = buildDayLabel(message, day);
  const periods = resolveRequestedPeriods(message);
  const requestedPeriods = periods.length > 0 ? periods : ["午診", "晚診"];
  const scheduleText = buildPeriodSummary(day, requestedPeriods);
  const anonymousScreeningNote = /匿名|篩檢|驗性病|性病/.test(message)
    ? "匿名篩檢可一起詢問，但若還在 PEP 時效內，先讓醫師評估 PEP 較優先。"
    : "";

  return [
    "PEP 是越早評估越好，不能直接線上判斷或保證拿藥。",
    anonymousScreeningNote,
    `${dayLabel}可先參考：${scheduleText}。`,
    "下一步建議先電話 02-2511-9488 確認當天可評估時段，或盡快到診由醫師評估。"
  ].join("");
}

function hasPepVisitFollowUpIntent(message) {
  return /今天|下午|晚上|晚診|夜診|時段|掛|門診|看診|預約|現場|直接到|到診|急診|下一步|怎麼去/.test(message);
}

function hasDoctorInfoIntent(message) {
  const hasScheduleSlotCue = Boolean(resolveRequestedDay(message, new Date()))
    || resolveRequestedPeriods(message).length > 0
    || /早診|午診|晚診|夜診|早上|上午|下午|晚上/.test(message);
  if (hasScheduleSlotCue && /誰|哪位|哪個醫師|哪個醫生|看哪位/.test(message)) return false;

  return /專長|專業|主治|擅長|強項|會看什麼|看什麼|現職|學歷|經歷|履歷|證照|證書|專科|認證|背景|資歷|是誰|哪位|介紹|職稱|差別|不同|比較|差在哪/.test(message);
}

function hasNewPepRiskOrMedicationQuestion(message) {
  return /(\d{1,3})\s*小時|上週|昨天|保險套破|無套|PrEP|補救|超過時間|已經過|還能吃\s*PEP|能不能吃\s*PEP/i.test(message);
}

function hasCompetingMedicalTopic(message) {
  return /包皮|手術後|術後|紗布|傷口|換藥|洗澡|釘子|水腫|流血|滲血|流膿|發燒|龜頭|攝護腺|前列腺|夜尿|尿流變細|水蒸氣消融|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除|腎結石|輸尿管結石|尿路結石|腎絞痛|腰痛|血尿|尿.*紅|體外震波|軟式輸尿管鏡|鈥雷射|碎石|肛門|痔瘡|廔管|瘻管|肛裂|便血|大便.*血|肛門.*痛|肛門性病|肛門菜花|菜花|尖銳濕疣|HPV(?!\s*疫苗)|私密處|肉芽|病灶|腫塊|化膿|性功能障礙|勃起|陽痿|不舉|硬度|容易軟|軟掉|早洩|低能量震波|線性震波/.test(message);
}

function hasRecentPepContext(conversationHistory) {
  return [...conversationHistory]
    .slice(-8)
    .some((historyMessage) => /PEP|暴露後|72\s*小時|無套性行為|直接拿藥|預防性投藥/.test(historyMessage.content ?? ""));
}

function resolveRequestedPeriods(message) {
  return PERIOD_ALIASES
    .filter(([, pattern]) => pattern.test(message))
    .map(([period]) => period);
}

function resolveRequestedDay(message, now) {
  const explicitDateDay = resolveExplicitDateDay(message);
  if (explicitDateDay) return explicitDateDay;

  const relativeOffset = resolveRelativeDayOffset(message);
  if (relativeOffset !== null) return getTaipeiWeekday(addDays(now, relativeOffset));

  return DAY_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function resolveFollowUpDay(message, conversationHistory, now) {
  if (!isScheduleDayFollowUp(message)) return null;

  for (const historyMessage of [...conversationHistory].slice(-8).reverse()) {
    const content = historyMessage.content ?? "";
    const day = resolveRequestedDay(content, now);
    if (day) return day;
  }

  return null;
}

function isScheduleDayFollowUp(message) {
  if (/其他|其它|別的|哪些醫師|哪些醫生|有誰|哪幾位|醫師名單|醫生名單/.test(message)) return false;

  const hasFollowUpCue = /那|剛剛|剛才|前面|上一個|上面|同一天|那天|那個日期|改/.test(message);
  const hasScheduleCue = /早上|上午|下午|午診|晚上|晚診|夜診|門診|泌尿科|醫師|醫生|時段|看診/.test(message);
  return hasFollowUpCue && hasScheduleCue;
}

function resolveExplicitDateDay(message) {
  const match = message.match(/\b(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return getTaipeiWeekday(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 4)));
}

function hasExplicitFullDate(message) {
  return /\b20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}/.test(message);
}

function resolveRequestedDoctor(message) {
  return DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function resolveRequestedDoctors(message) {
  return DOCTOR_ALIASES
    .map(([doctor, pattern]) => ({ doctor, index: message.search(pattern) }))
    .filter(({ index }) => index >= 0)
    .sort((a, b) => a.index - b.index)
    .map(({ doctor }) => doctor);
}

function resolveMisspelledDoctor(message) {
  return DOCTOR_MISSPELLINGS.find(({ pattern }) => pattern.test(message)) ?? null;
}

function buildDoctorListReply(message, conversationHistory) {
  if (!/哪些醫師|哪些醫生|有誰|哪幾位|醫師名單|醫生名單|其他醫師|其他醫生|別的醫師|別的醫生/.test(message)) {
    return null;
  }

  const excludedDoctor = /其他|其它|別的/.test(message) ? findLastMentionedDoctor(conversationHistory) : null;
  const doctors = FIXED_DOCTORS.filter((doctor) => doctor !== excludedDoctor);
  const doctorText = doctors
    .map((doctor) => (doctor === "陳嘉哲醫師" ? "陳嘉哲醫師（肛門直腸外科）" : doctor))
    .join("、");

  if (excludedDoctor && doctors.length > 0) {
    return `其他固定門診醫師有：${doctorText}。想查哪位的時段，直接打醫師名字即可。`;
  }

  return `固定門診表目前有：${doctorText}。想查哪位的時段，直接打醫師名字即可。`;
}

function findLastMentionedDoctor(conversationHistory) {
  for (const historyMessage of [...conversationHistory].reverse()) {
    const content = historyMessage.content ?? "";
    const doctor = FIXED_DOCTORS.find((name) => content.includes(name));
    if (doctor) return doctor;
  }

  return null;
}

function resolveFollowUpDoctor(message, conversationHistory) {
  if (!/門診|時間|時段|看診|哪時|什麼時候|幾點/.test(message)) return null;
  return findLastMentionedDoctor(conversationHistory);
}

function resolveRelativeDayOffset(message) {
  if (/後天/.test(message)) return 2;
  if (/明天|明日/.test(message)) return 1;
  if (/今天|今日/.test(message)) return 0;
  return null;
}

function getTaipeiWeekday(date) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    weekday: "short"
  }).format(date);
  const weekdayIndexByName = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6
  };
  return WEEKDAYS[weekdayIndexByName[weekday]];
}

function addDays(date, days) {
  const copy = new Date(date);
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function buildDayLabel(message, day) {
  if (/今天|今日/.test(message)) return `今天（${day}）`;
  if (/明天|明日/.test(message)) return `明天（${day}）`;
  if (/後天/.test(message)) return `後天（${day}）`;
  return day;
}

function buildFullDayReply(day, dayLabel, confirmationText = TEMPORARY_CHANGE_CONFIRMATION) {
  const schedule = FIXED_SCHEDULE[day];
  const lines = ["早診", "午診", "晚診"].map((period) => {
    const clinic = schedule[period];
    const time = periodToTime(period);
    if (clinic === "手術") return `${period}（${time}）：手術時段，不是一般門診`;
    if (clinic === "休診") return `${period}（${time}）：休診`;
    return `${period}（${time}）：${clinic}`;
  });

  return [
    `${dayLabel}固定門診：`,
    ...lines,
    confirmationText
  ].join("\n");
}

function buildSelectedPeriodsReply(day, dayLabel, periods, confirmationText = TEMPORARY_CHANGE_CONFIRMATION) {
  return [
    `${dayLabel}固定門診：`,
    ...periods.map((period) => buildPeriodLine(day, period)),
    confirmationText
  ].join("\n");
}

function buildPeriodSummary(day, periods) {
  return periods.map((period) => buildPeriodLine(day, period)).join("；");
}

function buildPeriodLine(day, period) {
  const clinic = FIXED_SCHEDULE[day]?.[period] ?? "休診";
  const time = periodToTime(period);
  if (clinic === "手術") return `${period}（${time}）手術時段，不是一般門診`;
  if (clinic === "休診") return `${period}（${time}）休診`;
  return `${period}（${time}）${clinic}`;
}

function buildDoctorDayAvailabilityReply(doctor, day, dayLabel) {
  const matchingPeriods = ["早診", "午診", "晚診"]
    .filter((period) => (FIXED_SCHEDULE[day]?.[period] ?? "").includes(doctor))
    .map((period) => `${period} ${periodToTime(period)}`);

  if (matchingPeriods.length === 0) {
    return `${doctor}${dayLabel}固定門診沒有列到一般門診。`;
  }

  return `${doctor}${dayLabel}${matchingPeriods.join("、")} 有診。`;
}

function asksForUrologyCare(message) {
  return /泌尿科|頻尿|夜尿|尿痛|尿道炎|膀胱炎|排尿|小便|尿尿|尿急|尿流/.test(message);
}

function asksForAlternativeClinicTime(message) {
  return /如果沒有|若沒有|哪個時段|哪一個時段|哪時段|該掛|掛哪|改哪|換哪|比較適合|有診|可以看|可以掛|能掛|適合看|不適合|一般泌尿|不是一般泌尿|那診不是|下一步/.test(message)
    || asksWalkInRegistration(message);
}

function asksWalkInRegistration(message) {
  return /現場掛號|現場|直接到|直接去|到現場|第一次去|初診/.test(message);
}

function asksAppointmentChange(message) {
  return /改掛|改約|改預約|更改預約|改時間|改今天|改明天|換時段|換到|已經.*掛號|已線上掛號|線上掛號.*改/.test(message);
}

function buildAppointmentChangeReply(message, day, periods) {
  const dayLabel = buildDayLabel(message, day);
  const requestedPeriods = periods.length > 0 ? periods : ["早診", "午診", "晚診"];
  const scheduleText = buildPeriodSummary(day, requestedPeriods);
  return [
    "已線上掛號要改時間，這裡不能直接幫你改或保證改成功。",
    `${dayLabel}可先參考：${scheduleText}。`,
    "請用原本線上掛號系統、電話 02-2511-9488，或到現場櫃台確認是否能改與是否還有名額。"
  ].join("\n");
}

function buildAvailableClinicTimesReply(day) {
  const schedule = FIXED_SCHEDULE[day];
  const lines = ["早診", "午診", "晚診"]
    .map((period) => {
      const clinic = schedule[period];
      if (clinic === "休診") return null;
      const time = periodToTime(period);
      if (clinic === "手術") return `${period}（${time}）：手術時段，不是一般門診`;
      return `${period}（${time}）：${clinic}`;
    })
    .filter(Boolean);

  return `${day}其他時段：\n${lines.join("\n")}`;
}

function buildAvailableGeneralClinicTimesReply(day) {
  const schedule = FIXED_SCHEDULE[day];
  const lines = ["早診", "午診", "晚診"]
    .map((period) => {
      const clinic = schedule[period];
      if (clinic === "休診" || clinic === "手術") return null;
      if (clinic.includes("肛門直腸外科")) return null;
      return `${period}（${periodToTime(period)}）：${clinic}`;
    })
    .filter(Boolean);

  if (lines.length === 0) return `${day}沒有一般泌尿科門診時段。`;
  return `${day}可改一般門診時段：\n${lines.join("\n")}`;
}

function buildPastAnnouncementNote(message, now) {
  if (!/LINE\s*VOOM|VOOM|公告|公休|休診|停診/i.test(message)) return null;

  const pastDates = extractRequestedMonthDays(message)
    .filter((date) => isPastMonthDay(date, now));
  if (pastDates.length === 0) return null;

  return `${pastDates.join(" 到 ")} 是過去 LINE VOOM 公告，不能直接當成這週或之後的門診狀態。`;
}

function buildStaleStopAnnouncementNote(message) {
  if (!/LINE\s*VOOM|VOOM|公告/i.test(message)) return null;
  if (!/以前|之前|過去|舊|以前說|之前說/.test(message)) return null;
  if (!/停診|休診|停/.test(message)) return null;
  if (!/每週|每個|固定|都沒有|都停|長期|以後|是不是.*都/.test(message)) return null;

  return "不是。舊 LINE VOOM 停診公告通常是單次/臨時異動，不能當成每週都停診。";
}

function extractRequestedMonthDays(text) {
  const dates = [];
  const numericMatches = text.matchAll(/(?:^|[^\dA-Za-z])(?:20\d{2}[/-])?(\d{1,2})[/-](\d{1,2})(?=$|[^\d])/g);
  for (const match of numericMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  const chineseMatches = text.matchAll(/(\d{1,2})月(\d{1,2})[日號]?/g);
  for (const match of chineseMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  return [...new Set(dates)];
}

function normalizeMonthDay(month, day) {
  return `${Number(month)}/${Number(day)}`;
}

function isPastMonthDay(date, now) {
  const [month, day] = date.split("/").map(Number);
  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(now);
  const values = Object.fromEntries(nowParts.map((part) => [part.type, Number(part.value)]));
  const requested = Date.UTC(values.year, month - 1, day);
  const today = Date.UTC(values.year, values.month - 1, values.day);
  return requested < today;
}

function asksRouteInScheduleQuestion(message) {
  return /行天宮|捷運|MRT|4\s*號出口|四號出口|怎麼走|怎麼去|路線|交通/.test(message);
}

function buildMrtRouteNote() {
  return "捷運可搭到行天宮站 4 號出口，出站右轉步行約 40 秒，搭電梯上 3 樓。";
}

function compactLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function buildRequestedDoctorPeriodReply(dayLabel, period, time, clinic, doctors) {
  const slotLabel = `${dayLabel}${period}（${time}）`;
  const clinicDoctor = clinic === "手術" || clinic === "休診" ? null : clinic.replace(/（.+?）/g, "");
  const doctorStatuses = doctors.map((doctor) => `${doctor}${clinicDoctor === doctor ? "有診" : "沒有診"}`);

  if (!clinicDoctor) {
    const slotStatus = clinic === "手術" ? "是手術時段，不是一般門診" : "休診";
    return `${slotLabel}：${doctorStatuses.join("；")}。該時段${slotStatus}。`;
  }

  const hasAnyRequestedDoctor = doctors.some((doctor) => doctor === clinicDoctor);
  const actualClinicNote = hasAnyRequestedDoctor ? "" : `，該時段是${clinic}門診`;
  return `${slotLabel}：${doctorStatuses.join("；")}${actualClinicNote}。`;
}

function buildDoctorScheduleReply(doctor) {
  const lines = [];

  for (const [day, schedule] of Object.entries(FIXED_SCHEDULE)) {
    for (const period of ["早診", "午診", "晚診"]) {
      const clinic = schedule[period];
      if (clinic.includes(doctor)) {
        lines.push(`${day}${period}（${periodToTime(period)}）`);
      }
    }
  }

  if (lines.length === 0) return `${doctor}固定門診表沒有一般門診時段。`;

  return [`${doctor}固定門診：`, ...lines, TEMPORARY_CHANGE_CONFIRMATION].join("\n");
}

function buildMisspelledDoctorScheduleReply({ inputName, intendedDoctor }) {
  return [
    `固定門診表沒有「${inputName}」，這位應該是打錯字。`,
    `如果您是指「${intendedDoctor}」，固定門診如下：`,
    ...buildDoctorScheduleLines(intendedDoctor),
    TEMPORARY_CHANGE_CONFIRMATION
  ].join("\n");
}

function buildDoctorScheduleLines(doctor) {
  const lines = [];

  for (const [day, schedule] of Object.entries(FIXED_SCHEDULE)) {
    for (const period of ["早診", "午診", "晚診"]) {
      const clinic = schedule[period];
      if (clinic.includes(doctor)) {
        lines.push(`${day}${period}（${periodToTime(period)}）`);
      }
    }
  }

  return lines;
}

function periodToTime(period) {
  return PERIOD_TIMES[period] ?? "";
}
