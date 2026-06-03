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

export function answerDoctorInfoQuestion(message, conversationHistory = []) {
  const doctor = resolveDoctor(message);
  const isSpecialtyQuestion = /專長|專業|主治|擅長|強項|會看什麼|看什麼/.test(message);
  const isProfileQuestion = /現職|學歷|經歷|履歷|證照|證書|專科|認證|背景|資歷/.test(message)
    || (Boolean(doctor) && /是誰|哪位|介紹|職稱/.test(message));
  const isDoctorFollowUp = Boolean(doctor) && /那|呢|其他|其它|別的/.test(message);
  const comparisonReply = buildDoctorComparisonReply(message, doctor, conversationHistory);
  if (comparisonReply) return comparisonReply;

  const otherDoctorSpecialtyReply = buildOtherDoctorSpecialtyReply(message, conversationHistory);
  if (otherDoctorSpecialtyReply) return otherDoctorSpecialtyReply;

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

  return `${resolvedDoctor}主治專長：${specialties.join("、")}。`;
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
  return DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function findLastMentionedDoctor(conversationHistory, options = {}) {
  const { excludeDoctor = null } = options;
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
