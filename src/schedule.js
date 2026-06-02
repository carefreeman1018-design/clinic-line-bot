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

const SCHEDULE_INTENT_PATTERN = /看診|門診|泌尿科|誰|醫師|醫生|有診|休診|停診|營業|有開|開嗎|時段|掛號|預約/;
const TEMPORARY_CHANGE_CONFIRMATION = FIXED_SCHEDULE_CONFIG.temporaryChangeConfirmation;

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
  if (answerLineVoomAnnouncementQuestion(message)) return null;

  const day = resolveRequestedDay(message, now);
  const periods = resolveRequestedPeriods(message);
  const period = periods[0];
  const doctor = resolveRequestedDoctor(message);
  const misspelledDoctor = resolveMisspelledDoctor(message);
  const doctorListReply = buildDoctorListReply(message, conversationHistory);
  const followUpDoctor = resolveFollowUpDoctor(message, conversationHistory);
  const hasScheduleIntent = SCHEDULE_INTENT_PATTERN.test(message);

  if (!hasScheduleIntent && !doctor && !misspelledDoctor && !doctorListReply && !followUpDoctor) return null;

  if (!day && doctorListReply) return doctorListReply;
  if (!day && misspelledDoctor) return buildMisspelledDoctorScheduleReply(misspelledDoctor);
  if (!day && doctor) return buildDoctorScheduleReply(doctor);
  if (!day && followUpDoctor) return buildDoctorScheduleReply(followUpDoctor);
  if (!day) return null;

  const dayLabel = buildDayLabel(message, day);

  if (!FIXED_SCHEDULE[day]) {
    return `${dayLabel}固定門診表沒有一般門診時段。${TEMPORARY_CHANGE_CONFIRMATION}`;
  }

  if (!period) {
    return buildFullDayReply(day, dayLabel);
  }

  if (periods.length > 1) {
    return buildSelectedPeriodsReply(day, dayLabel, periods);
  }

  const clinic = FIXED_SCHEDULE[day][period];
  const time = periodToTime(period);
  if (clinic === "休診") {
    if (asksForAlternativeClinicTime(message)) {
      return [
        `${dayLabel}${period}（${time}）休診。`,
        buildAvailableClinicTimesReply(day),
        TEMPORARY_CHANGE_CONFIRMATION
      ].join("\n");
    }

    return `${dayLabel}${period}（${time}）休診。${TEMPORARY_CHANGE_CONFIRMATION}`;
  }

  if (clinic === "手術") {
    return `${dayLabel}${period}（${time}）是手術時段，不是一般門診。可查看 LINE VOOM / 官方 LINE、線上掛號或電話 02-2511-9488 確認。`;
  }

  if (/泌尿科/.test(message) && clinic.includes("肛門直腸外科")) {
    const prefix = /不要掛|不適合|對嗎|可以掛|能掛/.test(message) ? "對，" : "";
    return `${prefix}${dayLabel}${period}（${time}）是${clinic}，不是一般泌尿科門診。想看泌尿科請換個時段。`;
  }

  return `${dayLabel}${period}（${time}）是${clinic}門診。${TEMPORARY_CHANGE_CONFIRMATION}`;
}

export function answerPepVisitScheduleFollowUp(message, now = new Date(), conversationHistory = []) {
  if (!hasRecentPepContext(conversationHistory)) return null;
  if (hasCompetingMedicalTopic(message)) return null;
  if (!hasPepVisitFollowUpIntent(message)) return null;

  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const dayLabel = buildDayLabel(message, day);
  const periods = resolveRequestedPeriods(message);
  const requestedPeriods = periods.length > 0 ? periods : ["午診", "晚診"];
  const scheduleText = buildPeriodSummary(day, requestedPeriods);

  return [
    "PEP 是越早評估越好，不能直接線上判斷或保證拿藥。",
    `${dayLabel}可先參考：${scheduleText}。`,
    "下一步建議先電話 02-2511-9488 確認當天可評估時段，或盡快到診由醫師評估。"
  ].join("");
}

function hasPepVisitFollowUpIntent(message) {
  return /下午|晚上|晚診|夜診|時段|掛|門診|看診|預約|現場|直接到|到診|下一步|怎麼去/.test(message);
}

function hasCompetingMedicalTopic(message) {
  return /包皮|手術後|術後|紗布|傷口|換藥|洗澡|釘子|水腫|流血|滲血|流膿|發燒|龜頭/.test(message);
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

function resolveExplicitDateDay(message) {
  const match = message.match(/\b(20\d{2})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
  if (!match) return null;

  const [, year, month, day] = match;
  return getTaipeiWeekday(new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 4)));
}

function resolveRequestedDoctor(message) {
  return DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
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

function buildFullDayReply(day, dayLabel) {
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
    TEMPORARY_CHANGE_CONFIRMATION
  ].join("\n");
}

function buildSelectedPeriodsReply(day, dayLabel, periods) {
  return [
    `${dayLabel}固定門診：`,
    ...periods.map((period) => buildPeriodLine(day, period)),
    TEMPORARY_CHANGE_CONFIRMATION
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

function asksForAlternativeClinicTime(message) {
  return /如果沒有|若沒有|哪個時段|哪一個時段|哪時段|有診|可以看/.test(message);
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
