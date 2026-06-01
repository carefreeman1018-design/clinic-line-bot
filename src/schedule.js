const FIXED_SCHEDULE = {
  "週一": {
    早診: "陳偉傑醫師",
    午診: "手術",
    晚診: "羅詩修醫師"
  },
  "週二": {
    早診: "陳偉傑醫師",
    午診: "羅詩修醫師",
    晚診: "李齊泰醫師"
  },
  "週三": {
    早診: "手術",
    午診: "吳致寬醫師",
    晚診: "陳嘉哲醫師（肛門直腸外科門診）"
  },
  "週四": {
    早診: "羅詩修醫師",
    午診: "手術",
    晚診: "陳偉傑醫師"
  },
  "週五": {
    早診: "陳偉傑醫師",
    午診: "羅詩修醫師",
    晚診: "手術"
  },
  "週六": {
    早診: "羅詩修醫師",
    午診: "手術",
    晚診: "休診"
  }
};

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
  ["晚診", /晚上|晚診|夜診|18:00|6:00/]
];

const DOCTOR_ALIASES = [
  ["陳偉傑醫師", /陳偉傑|陳醫師|陳醫生/],
  ["羅詩修醫師", /羅詩修|羅醫師|羅醫生/],
  ["吳致寬醫師", /吳致寬|吳醫師|吳醫生/],
  ["李齊泰醫師", /李齊泰|李醫師|李醫生/],
  ["陳嘉哲醫師", /陳嘉哲/]
];

const FIXED_DOCTORS = ["陳偉傑醫師", "羅詩修醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師"];

const DOCTOR_MISSPELLINGS = [
  {
    pattern: /羅世修/,
    inputName: "羅世修醫師",
    intendedDoctor: "羅詩修醫師"
  }
];

const SCHEDULE_INTENT_PATTERN = /看診|門診|泌尿科|誰|醫師|醫生|有診|休診|停診|營業|有開|開嗎|時段|掛號|預約/;
const TEMPORARY_CHANGE_CONFIRMATION = "臨時異動請以 LINE VOOM / 官方 LINE、線上掛號或電話 02-2511-9488 確認。";

export function answerFixedScheduleQuestion(message, now = new Date(), conversationHistory = []) {
  if (!SCHEDULE_INTENT_PATTERN.test(message)) return null;
  if (hasExplicitDate(message) && !hasRelativeDay(message)) return null;

  const day = resolveRequestedDay(message, now);
  const period = PERIOD_ALIASES.find(([, pattern]) => pattern.test(message))?.[0];
  const doctor = resolveRequestedDoctor(message);
  const misspelledDoctor = resolveMisspelledDoctor(message);
  const doctorListReply = buildDoctorListReply(message, conversationHistory);
  if (!day && doctorListReply) return doctorListReply;
  if (!day && misspelledDoctor) return buildMisspelledDoctorScheduleReply(misspelledDoctor);
  if (!day && doctor) return buildDoctorScheduleReply(doctor);
  if (!day) return null;

  const dayLabel = buildDayLabel(message, day);

  if (!FIXED_SCHEDULE[day]) {
    return `${dayLabel}固定門診表沒有一般門診時段。${TEMPORARY_CHANGE_CONFIRMATION}`;
  }

  if (!period) {
    return buildFullDayReply(day, dayLabel);
  }

  const clinic = FIXED_SCHEDULE[day][period];
  const time = periodToTime(period);
  if (clinic === "休診") {
    return `${dayLabel}${period}（${time}）休診。${TEMPORARY_CHANGE_CONFIRMATION}`;
  }

  if (clinic === "手術") {
    return `${dayLabel}${period}（${time}）是手術時段，不是一般門診。可查看 LINE VOOM / 官方 LINE、線上掛號或電話 02-2511-9488 確認。`;
  }

  if (/泌尿科/.test(message) && clinic.includes("肛門直腸外科")) {
    return `${dayLabel}${period}（${time}）是${clinic}，不是一般泌尿科門診。想看泌尿科請換個時段。`;
  }

  return `${dayLabel}${period}（${time}）是${clinic}門診。${TEMPORARY_CHANGE_CONFIRMATION}`;
}

function resolveRequestedDay(message, now) {
  const relativeOffset = resolveRelativeDayOffset(message);
  if (relativeOffset !== null) return getTaipeiWeekday(addDays(now, relativeOffset));

  return DAY_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
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

function hasExplicitDate(message) {
  return (
    /\b20\d{2}[-/.年]\d{1,2}[-/.月]\d{1,2}/.test(message) ||
    /\b\d{1,2}\/\d{1,2}\b/.test(message) ||
    /\b\d{1,2}月\d{1,2}[日號]?/.test(message)
  );
}

function resolveRelativeDayOffset(message) {
  if (/後天/.test(message)) return 2;
  if (/明天|明日/.test(message)) return 1;
  if (/今天|今日/.test(message)) return 0;
  return null;
}

function hasRelativeDay(message) {
  return resolveRelativeDayOffset(message) !== null;
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
  if (period === "早診") return "09:30-12:30";
  if (period === "午診") return "13:30-17:00";
  return "18:00-20:30";
}
