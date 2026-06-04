import fs from "node:fs";

const PHONE = "02-2511-9488";
const FIXED_SCHEDULE_CONFIG = loadFixedScheduleConfig();
const FIXED_SCHEDULE = FIXED_SCHEDULE_CONFIG.schedule;
const PERIOD_TIMES = FIXED_SCHEDULE_CONFIG.periodTimes;
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export function answerProstateQuestion(message, now = new Date()) {
  if (isScheduleRoutingQuestion(message)) return null;
  if (!isProstateQuestion(message)) return null;

  if (hasAcuteUrinaryRetentionRisk(message)) {
    return [
      "你描述幾乎尿不出來、下腹脹痛又冒冷汗，需警覺急性尿液滯留或泌尿道阻塞風險，光靠訊息無法診斷。",
      "這種情況不建議撐到明天門診，也不能先安排 Urolift、水蒸氣消融或直接報費用；可能需要立即評估是否需導尿、抽血/影像或其他處置。",
      `請現在先急診/立即就醫；若要同步確認診所能否協助，請電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  if (asksProstateVisitScheduleOrPrep(message)) {
    return buildProstateVisitScheduleReply(message, now);
  }

  const officialFaqReply = answerOfficialProstateFaq(message);
  if (officialFaqReply) return officialFaqReply;

  if (asksTreatmentChoiceCostOrOutcome(message)) {
    return [
      "診所有提供攝護腺肥大評估與治療，官網列出雷射剜除、水蒸氣消融、綠光雷射汽化與 Urolift 等方式。",
      "夜尿、尿流變細可能有不同原因；哪一種適合、是否影響射精與費用，都需要醫師依攝護腺大小、症狀與身體狀況評估，不能直接線上判斷或報價。",
      "也不能先保證保留射精、不用插尿管，或今天看完就能直接手術；需評估後再安排。",
      `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "診所有提供攝護腺肥大相關評估與治療。",
    "頻尿、夜尿、尿流變細或排尿困難建議由醫師檢查後判斷原因。"
  ].join("");
}

function answerOfficialProstateFaq(message) {
  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /原理|是什麼|怎麼|如何|作用/.test(message)) {
    return "官網說明，攝護腺水蒸氣消融是針對攝護腺肥大的低侵入治療；透過器械經尿道將約 103°C 水蒸氣以細針注入攝護腺，釋放熱能破壞肥大組織，之後被破壞的細胞會在 1–3 個月內逐漸被人體吸收，以緩解症狀。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /不適合|不能做|禁忌/.test(message)) {
    return "官網列出水蒸氣消融適用族群，但是否不適合仍需由醫師依攝護腺大小、症狀、用藥與身體狀況評估；若有相關疑慮，建議門診確認。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /適合|哪些人|對象|可以做/.test(message)) {
    return "官網提到，水蒸氣消融適合想避免傳統雷射併發症、特別是 40–50 歲想保留射精的族群；也適合無法長時間停用抗凝血劑、全身或半身麻醉風險較高，以及攝護腺體積約 30–80 c.c. 的患者。實際是否適合仍需醫師評估。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /多久|時間|幾分鐘/.test(message)) {
    return "官網說明，攝護腺水蒸氣消融手術本身過程約 10 分鐘，屬低侵入性治療；完整到院流程仍需依麻醉、檢查與個人狀況安排。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /傷口|低侵入|微創/.test(message)) {
    return "官網說明，攝護腺水蒸氣消融是順著尿道進行，手術本身約 10 分鐘，術後完全無傷口，屬極低侵入性治療。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /局部|舒眠|麻醉|半身|全身/.test(message)) {
    return "官網提到，攝護腺水蒸氣消融可在局部或舒眠麻醉下進行，對全身或半身麻醉風險較高的患者是可能的考量之一；實際麻醉方式仍需醫師評估。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /保留射精|射精/.test(message)) {
    return "官網提到，水蒸氣消融特別適合中壯年、想保留射精的患者；但是否適合與預期效果仍需由醫師依個人狀況評估。";
  }

  if (/水蒸氣|Rezum|Rezūm/i.test(message) && /大小|體積|c\.?c|CC|幾.*c/i.test(message)) {
    return "官網提到，攝護腺水蒸氣消融適用於攝護腺體積約 30–80 c.c. 的患者；實際仍需檢查攝護腺大小與症狀後由醫師評估。";
  }

  if (/不治療|放著|不處理|會怎樣/.test(message)) {
    return "攝護腺肥大若持續嚴重阻塞，可能造成排尿不順、頻尿、夜尿；嚴重時可能反覆感染、反覆血尿、膀胱結石和腎水腫。";
  }

  if (/一定.*手術|最後.*手術|都要.*手術|必須.*手術/.test(message)) {
    return "不是每位男性最後都一定需要攝護腺手術；是否需要手術和肥大嚴重度、是否早期診治與療程反應有關，有症狀或疑慮時建議找醫師評估。";
  }

  if (/尿管|導尿管|留置|置留|幾天/.test(message)) {
    return "攝護腺手術後會放置尿管監控止血與等待組織消腫，再依恢復狀況拔除。尿管留置時間約為：雷射剜除 1–2 天、綠光雷射汽化 1–2 天、水蒸氣攝護腺消融術 Rezūm 3–7 天、Urolift 攝護腺擴開術 0–1 天。";
  }

  if (/住院|住幾天|住院天數/.test(message)) {
    return "雷射剜除手術與綠光雷射汽化約住院 1.5–3 天；水蒸氣攝護腺消融術 Rezūm 與 Urolift 攝護腺擴開術則視個人狀況可不需住院。";
  }

  if (/性行為|性生活|多久.*性/.test(message)) {
    return "攝護腺手術後約一個月可逐漸恢復性生活。";
  }

  if (/影響.*性功能|性功能.*影響|勃起/.test(message)) {
    return "目前雷射與微創手術屬最低能量破壞，幾乎沒有能量傳導影響骨盆神經，性功能與控制排尿功能幾乎不會受影響。";
  }

  if (/攝護腺癌|前列腺癌|癌/.test(message)) {
    return "攝護腺肥大不等於攝護腺癌；攝護腺肥大有良性增生和攝護腺癌的差異，是否為哪一種需要手術後送檢驗才知道。";
  }

  return null;
}

function loadFixedScheduleConfig() {
  const raw = fs.readFileSync(new URL("../data/fixed-schedule.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

function isScheduleRoutingQuestion(message) {
  const hasDay = /週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|今天|明天|後天/.test(message);
  const asksSchedule = /掛|門診|看診|時段|哪一診|哪診|哪個時段|哪一個時段|可以看/.test(message);
  const asksTreatment = /攝護腺肥大|前列腺肥大|水蒸氣|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除|手術|治療|費用|價格|多少錢|保留射精|插尿管|尿不出來|排不出尿|幾乎尿不出|尿不太出|急性尿液滯留|尿滯留|膀胱脹|下腹脹|冒冷汗/i.test(message);
  return hasDay && asksSchedule && !asksTreatment;
}

function isProstateQuestion(message) {
  return /攝護腺|前列腺|夜尿|尿流變細|排尿困難|尿不順|尿不出來|排不出尿|幾乎尿不出|尿不太出|急性尿液滯留|尿滯留|膀胱脹|下腹脹|水蒸氣消融|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除/i.test(message);
}

function asksTreatmentChoiceCostOrOutcome(message) {
  return /哪個|哪一種|比較適合|適合|水蒸氣|Urolift|影響射精|保留射精|費用|價格|多少錢|手術|治療|可以做|下一步/i.test(message);
}

function hasAcuteUrinaryRetentionRisk(message) {
  const hasRetention = /尿不出來|排不出尿|幾乎尿不出|尿不太出|急性尿液滯留|尿滯留|膀胱脹|下腹脹|下腹.*痛/.test(message);
  const hasUrgentCue = /很痛|痛|冒冷汗|發燒|血尿|今天|現在|從早上|撐到明天|等明天|急診|立即|導尿|老人|高齡|7[0-9]\s*歲|8[0-9]\s*歲/.test(message);
  return hasRetention && hasUrgentCue;
}

function asksProstateVisitScheduleOrPrep(message) {
  const hasScheduleCue = /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|下午|晚上|早診|午診|晚診|夜診|掛|門診|看診|時段|可以看|可以掛/.test(message);
  const asksPreparation = /帶什麼|要帶|準備什麼|攜帶|資料|檢查|用藥|藥單|健保卡|身分證/.test(message);
  return hasScheduleCue || asksPreparation;
}

function buildProstateVisitScheduleReply(message, now) {
  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const dayLabel = buildDayLabel(message, day);
  const periods = resolveRequestedPeriods(message);
  const scheduleLines = buildProstateScheduleLines(day, periods);
  const serviceIntro = hasProstateTreatmentServiceCue(message)
    ? "診所有提供攝護腺肥大評估與治療，官網列出水蒸氣消融、Urolift、綠光雷射汽化與雷射剜除等方式；能否適合要由醫師評估。"
    : "診所有看攝護腺肥大/排尿問題，需由醫師評估。";
  const scheduleReply = scheduleLines.length > 0
    ? [`${dayLabel}可先參考固定門診：`, ...scheduleLines]
    : [`${dayLabel}固定門診表沒有列到一般泌尿科門診時段。`];

  return [
    serviceIntro,
    ...scheduleReply,
    "可先諮詢；但不能先保證當天處置，費用與療程也需評估後確認。",
    "請帶健保卡、身分證；若有近期檢查報告、PSA/超音波資料或用藥資料也一起帶。",
    `當天能否安排處置、費用與名額，請電話 ${PHONE} 或現場確認。`
  ].join("\n");
}

function hasProstateTreatmentServiceCue(message) {
  return /攝護腺肥大|前列腺肥大|水蒸氣|Rezum|Rezūm|Urolift|綠光雷射|雷射剜除|治療|手術/i.test(message);
}

function resolveRequestedPeriods(message) {
  if (/白天/.test(message)) return ["早診", "午診"];

  const periods = [];
  if (/早上|上午|早診|09:30|9:30/.test(message)) periods.push("早診");
  if (/下午|午診|13:30|1:30/.test(message)) periods.push("午診");
  if (/晚上|晚診|夜診|18:00|6:00/.test(message)) periods.push("晚診");
  return periods;
}

function buildProstateScheduleLines(day, requestedPeriods) {
  const schedule = FIXED_SCHEDULE[day];
  if (!schedule) return [];

  const periods = requestedPeriods.length > 0 ? requestedPeriods : ["早診", "午診", "晚診"];
  return periods
    .map((period) => {
      const clinic = schedule[period];
      if (!clinic || clinic === "休診") return `${period}（${PERIOD_TIMES[period]}）：休診`;
      if (clinic === "手術") return `${period}（${PERIOD_TIMES[period]}）：手術時段，不是一般門診`;
      if (clinic.includes("肛門直腸外科")) return `${period}（${PERIOD_TIMES[period]}）：${clinic}，不是一般泌尿科`;
      return `${period}（${PERIOD_TIMES[period]}）：${clinic}`;
    });
}

function resolveRequestedDay(message, now) {
  if (/後天/.test(message)) return getTaipeiWeekday(addDays(now, 2));
  if (/明天|明日/.test(message)) return getTaipeiWeekday(addDays(now, 1));
  if (/今天|今日/.test(message)) return getTaipeiWeekday(now);

  const aliases = [
    ["週日", /週日|星期日|星期天|禮拜日|禮拜天|周日/],
    ["週一", /週一|星期一|禮拜一|周一/],
    ["週二", /週二|星期二|禮拜二|周二/],
    ["週三", /週三|星期三|禮拜三|周三/],
    ["週四", /週四|星期四|禮拜四|周四/],
    ["週五", /週五|星期五|禮拜五|周五/],
    ["週六", /週六|星期六|禮拜六|周六/]
  ];

  return aliases.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function buildDayLabel(message, day) {
  if (/今天|今日/.test(message)) return `今天（${day}）`;
  if (/明天|明日/.test(message)) return `明天（${day}）`;
  if (/後天/.test(message)) return `後天（${day}）`;
  return day;
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
