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

const DAY_ALIASES = [
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

export function answerFixedScheduleQuestion(message) {
  if (hasSpecificDate(message)) return null;

  const day = DAY_ALIASES.find(([, pattern]) => pattern.test(message))?.[0];
  const period = PERIOD_ALIASES.find(([, pattern]) => pattern.test(message))?.[0];
  if (!day || !period) return null;

  const clinic = FIXED_SCHEDULE[day]?.[period];
  if (!clinic) return null;

  const time = periodToTime(period);
  if (clinic === "休診") {
    return `您好，依官網固定門診表，${day}${period}（${time}）是休診。若遇臨時公告或連假，仍建議以線上掛號頁、LINE 或電話 02-2511-9488 確認。`;
  }

  if (clinic === "手術") {
    return `您好，依官網固定門診表，${day}${period}（${time}）為手術時段，不是一般門診。若要安排看診，建議查看線上掛號頁，或透過 LINE / 電話 02-2511-9488 確認可預約時段。`;
  }

  if (/泌尿科/.test(message) && clinic.includes("肛門直腸外科")) {
    return `您好，依官網固定門診表，${day}${period}（${time}）是${clinic}，不是一般泌尿科門診。若要看泌尿科，建議改查其他時段，或透過線上掛號頁、LINE / 電話 02-2511-9488 確認。`;
  }

  return `您好，依官網固定門診表，${day}${period}（${time}）是${clinic}門診。若遇醫師臨時休診或連假公告，仍以 LINE VOOM 最新公告、線上掛號頁或電話 02-2511-9488 確認為準。`;
}

function periodToTime(period) {
  if (period === "早診") return "09:30-12:30";
  if (period === "午診") return "13:30-17:00";
  return "18:00-20:30";
}

function hasSpecificDate(message) {
  return /\d{1,2}\s*[/-]\s*\d{1,2}|\d{1,2}\s*月\s*\d{1,2}\s*[日號]?|今天|明天|後天|本週|這週|下週/.test(message);
}
