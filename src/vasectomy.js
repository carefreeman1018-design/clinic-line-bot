import fs from "node:fs";

const PHONE = "02-2511-9488";
const FIXED_SCHEDULE_CONFIG = loadFixedScheduleConfig();
const FIXED_SCHEDULE = FIXED_SCHEDULE_CONFIG.schedule;
const PERIOD_TIMES = FIXED_SCHEDULE_CONFIG.periodTimes;
const VASECTOMY_DOCTORS = new Set(["陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師"]);
const WEEKDAYS = ["週日", "週一", "週二", "週三", "週四", "週五", "週六"];

export function answerVasectomyQuestion(message, now = new Date(), conversationHistory = []) {
  const hasDirectVasectomyQuestion = isVasectomyQuestion(message);
  const hasRecentVasectomyContext = hasRecentVasectomyConsultContext(conversationHistory);
  if (!hasDirectVasectomyQuestion && !hasRecentVasectomyContext) return null;
  if (!hasDirectVasectomyQuestion && isClearlyNewNonVasectomyTopic(message)) return null;

  if (hasDirectVasectomyQuestion && isPostVasectomyUrgentQuestion(message)) {
    const procedureDay = resolveVasectomyProcedureDay(message);
    return [
      `${procedureDay}陰囊越來越腫、瘀青變大、傷口滲血，又很痛或發燒，光靠訊息無法判斷嚴重度。`,
      "這可能需要排除術後血腫、感染或持續出血；不建議只冰敷、吃止痛藥等到明天。",
      `請現在先電話 ${PHONE} 聯絡診所確認最快處理方式，並預約門診或依診所指示處理；若聯絡不上、腫痛快速加劇、發燒或出血變多，請直接急診/立即就醫。`
    ].join("");
  }

  if (asksVasectomyConsultSchedule(message)) {
    return buildVasectomyConsultScheduleReply(message, now);
  }

  if (hasDirectVasectomyQuestion && asksFirstConsultOrDirectorQuestion(message)) {
    return [
      "第一次可以先諮詢，不一定要直接處理。",
      "男性結紮通常要先由醫師評估；不一定只能找院長，實際由哪位醫師評估和能否安排，要看門診時段與櫃台安排。",
      `到診時可先到 3 樓櫃台說想諮詢男性結紮；也可先電話 ${PHONE} 確認可諮詢時段。`
    ].join("\n");
  }

  if (!hasDirectVasectomyQuestion) return null;
  const officialFaqReply = answerOfficialVasectomyFaq(message);
  if (officialFaqReply) return officialFaqReply;

  if (asksVasectomyAvailabilityOrOfficialKind(message)) {
    return [
      "有，官網列出的項目是「雷射無刀口男性結紮手術」，也就是男性無刀口結紮/輸精管結紮評估。",
      "官網說明手術會阻斷輸精管，達到避孕效果；是否適合、能否當天安排與費用仍需醫師術前評估並依當天時段確認。",
      `下一步可先預約男性結紮諮詢，或電話 ${PHONE} 確認可評估時段。`
    ].join("\n");
  }

  if (!asksSchedulePriceReversalOrSafety(message)) return null;

  if (asksSexualFunctionImpact(message)) {
    return [
      "官網說明輸精管結紮不會阻斷男性荷爾蒙運作。",
      "手術後仍會射精，通常不會明顯影響性慾、勃起功能、射精感或精液量；但個人狀況仍建議門診由醫師評估與說明。",
      `下一步：先預約男性結紮諮詢，或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  if (asksPostVasectomyContraception(message)) {
    return [
      "結紮後不能馬上停止避孕。",
      "官網提醒輸精管與儲精囊可能還有殘存精子，需等殘存精子排出，並做精液檢查確認後，才能依醫師指示調整避孕方式。",
      `若要確認回診或檢查時程，可電話 ${PHONE} 詢問。`
    ].join("");
  }

  return [
    "診所有提供男性無刀口結紮手術評估。",
    "能不能當天安排、手術方式與費用，需由醫師術前評估並依當天時段確認。",
    "結紮屬於重大生育決定；之後可評估輸精管重接，但不能保證恢復生育。",
    `下一步可留下姓名、電話、方便時段與想諮詢結紮，或電話 ${PHONE} 確認。`
  ].join("");
}

function answerOfficialVasectomyFaq(message) {
  if (/阻斷|原理|怎麼做|如何做|輸精管|精子.*精液|避孕效果/.test(message)) {
    return "官網說明，結紮手術是阻斷輸精管，讓精子無法進入精液，達到避孕效果；精子無法輸送後，會在副睪丸堆積，之後自然被身體代謝。";
  }

  if (/傷口|切口|開口|位置|在哪|哪裡/.test(message) && /無刀口|結紮|輸精管/.test(message)) {
    return "官網說明，無刀口結紮會在陰囊中間開一個很小的傷口，將輸精管拉出、剪斷，並封住精子的通道；整個手術過程約 15–20 分鐘。";
  }

  if (/生小孩|懷孕|恢復|復原|可逆|接回來|重接|後悔/.test(message)) {
    return "官網說明，結紮屬於永久絕育方式；若之後想生小孩，可以評估輸精管重接等恢復手術，但不是絕對有效，也不能保證恢復生育。";
  }

  if (/多久|多長|幾分鐘|時間|洗澡|沖澡|碰水/.test(message)) {
    return [
      "無刀口式結紮手術一般約 15–20 分鐘即可完成，無須住院，可於當日或隔日正常上班。",
      "如果手術中選用醫療用凝膠，當天返家後即可正常洗澡。"
    ].join("");
  }

  if (/睪固酮|男性賀爾蒙|荷爾蒙/.test(message)) {
    return "結紮不會影響睪固酮/男性賀爾蒙；睪固酮由睪丸製造後經血管進入全身循環，沒有切除睪丸就不會影響。";
  }

  if (/性慾|性功能|勃起|性能力/.test(message)) {
    return "結紮只是將輸精管切斷與燒灼，不影響睪固酮和男性賀爾蒙，所以通常不會影響性功能或性慾。";
  }

  if (/射精|精液量|沒有精液/.test(message)) {
    return "結紮後仍會有精液；精液中精子只占小部分，所以精液量肉眼通常沒有太大差異。";
  }

  if (/精子.*去哪|精子.*哪裡|精子.*代謝/.test(message)) {
    return "精子無法從輸精管出去後，會堆積在副睪丸，之後自然被身體代謝掉，不會傷身。";
  }

  if (/併發症|後遺症|副作用|腫脹|副睪丸|持續出血|傷口/.test(message)) {
    return "結紮後一個月內可能有射精睪丸腫脹感、偶發性副睪丸發炎等情況；若術後睪丸持續腫脹變大與疼痛、傷口持續出血或陰囊左右大小明顯不同，請儘速透過 LINE 向醫師確認並安排回診。";
  }

  if (/割包皮.*一起|一起.*割包皮|同時.*包皮|一起做/.test(message)) {
    return "結紮可以和割包皮一起評估處理；若還有燒菜花、珍珠丘疹去除、龜頭增大、陰莖減敏等想一併處理，需經雙主治醫師評估，並建議先透過官方 LINE 事先討論。";
  }

  if (/外縣市|離島|海外|當天看診|當天手術|快速通關|看完診.*手術/.test(message)) {
    return "可以使用當日看診、當日手術的「快速通關」服務；不只結紮，割包皮、燒菜花、珍珠丘疹去除手術等也可提前預約快速通關，建議先透過官方 LINE 預約。";
  }

  return null;
}

function loadFixedScheduleConfig() {
  const raw = fs.readFileSync(new URL("../data/fixed-schedule.json", import.meta.url), "utf8");
  return JSON.parse(raw);
}

function isVasectomyQuestion(message) {
  return /男性結紮|無刀口結紮|雷射結紮|輸精管結紮|避孕手術|結紮/.test(message);
}

function asksSchedulePriceReversalOrSafety(message) {
  return /今天|當天|直接做|看完就手術|快速通關|費用|價格|價錢|多少錢|保證|接回來|恢復|復原|可逆|後悔|避孕|無套|精液|驗精|殘存精子|性慾|勃起|性能力|射精|射精量|荷爾蒙|預約|掛號|諮詢|下一步|怎麼約|怎麼預約|術後|做完|傷口|陰囊|瘀青|發燒|滲血|出血|血腫|很痛|急診|回診/.test(message);
}

function asksVasectomyConsultSchedule(message) {
  return /諮詢|先問|問一下|哪位|醫師|醫生|早上|上午|下午|晚上|早診|午診|晚診|時段|掛|看哪|比較適合/.test(message) &&
    /今天|明天|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]|早上|上午|下午|晚上/.test(message);
}

function buildVasectomyConsultScheduleReply(message, now) {
  const day = resolveRequestedDay(message, now) ?? getTaipeiWeekday(now);
  const dayLabel = buildDayLabel(message, day);
  const lines = buildVasectomyConsultLines(day);

  if (lines.length === 0) {
    return `${dayLabel}固定門診沒有列到無刀口結紮相關醫師的一般門診。到診前可電話 ${PHONE} 確認可諮詢時段。`;
  }

  return [
    `${dayLabel}可先諮詢結紮的固定門診：`,
    ...lines,
    asksCost(message) ? "費用與是否可當天安排需由電話或現場確認，不能先保證或線上報價。" : null,
    `能否當天評估或安排仍需醫師確認；到診前請電話 ${PHONE} 確認名額與時段。`
  ].filter(Boolean).join("\n");
}

function buildVasectomyConsultLines(day) {
  const schedule = FIXED_SCHEDULE[day];
  if (!schedule) return [];

  return ["早診", "午診", "晚診"]
    .map((period) => {
      const doctor = normalizeDoctorName(schedule[period]);
      if (!doctor || !VASECTOMY_DOCTORS.has(doctor)) return null;
      return `${period}（${PERIOD_TIMES[period]}）：${doctor}`;
    })
    .filter(Boolean);
}

function normalizeDoctorName(clinic) {
  if (!clinic || clinic === "手術" || clinic === "休診") return null;
  return clinic.replace(/（.+?）/g, "");
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

function asksPostVasectomyContraception(message) {
  return /術後|做完|結紮後|馬上|立即|不用避孕|停止避孕|無套|精液|驗精|殘存精子/.test(message);
}

function asksSexualFunctionImpact(message) {
  return /性慾|勃起|性能力|射精量|射精感|荷爾蒙|精液量|影響.*射精|影響.*性/.test(message);
}

function asksCost(message) {
  return /費用|價格|價錢|多少錢|報價/.test(message);
}

function asksVasectomyAvailabilityOrOfficialKind(message) {
  return /有做|有沒有|提供|哪一種|哪種|官網.*說|官網.*寫|官網.*列|服務項目|診療項目|治療項目/.test(message);
}

function asksFirstConsultOrDirectorQuestion(message) {
  const asksFirstConsult = /第一次|初次|第一次去|先諮詢|只是諮詢|先問|問一下/.test(message);
  const asksDirectorOnly = /院長|一定要找|只能找|指定/.test(message);
  const asksCanConsult = /可以嗎|可不可以|能不能|要不要|需要/.test(message);

  return (asksFirstConsult || asksDirectorOnly) && asksCanConsult;
}

function hasRecentVasectomyConsultContext(conversationHistory) {
  return [...conversationHistory]
    .slice(-6)
    .some((historyMessage) =>
      /結紮|輸精管|男性結紮|避孕手術|想諮詢男性結紮|可先諮詢結紮/.test(historyMessage.content ?? "")
    );
}

function isClearlyNewNonVasectomyTopic(message) {
  return (
    /頻尿|夜尿|尿急|排尿|尿尿|小便|泌尿|一般泌尿|線上掛號.*滿|線上.*滿|掛號.*滿|額滿|現場等|候補|初診|第一次去|第一次到診|報到|健保卡|身分證/.test(message)
    && !/結紮|輸精管|避孕手術/.test(message)
  );
}

function isPostVasectomyUrgentQuestion(message) {
  return (
    /結紮|輸精管/.test(message) &&
    /術後|做完|結紮後|第\s*\d{1,2}\s*天|第\s*[一二三四五六七八九十]\s*天/.test(message) &&
    /陰囊|傷口|睪丸/.test(message) &&
    /越來越腫|腫|瘀青|滲血|出血|血腫|很痛|疼痛|發燒|化膿|流膿|急診|回診/.test(message)
  );
}

function resolveVasectomyProcedureDay(message) {
  const numericDay = message.match(/第\s*(\d{1,2})\s*天/);
  if (numericDay) return `結紮後第 ${numericDay[1]} 天`;

  const chineseDay = message.match(/第\s*([一二三四五六七八九十])\s*天/);
  if (chineseDay) return `結紮後第 ${chineseDay[1]} 天`;

  return "結紮術後";
}
