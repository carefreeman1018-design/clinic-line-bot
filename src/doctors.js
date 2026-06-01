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
  if (!/專長|專業|主治|擅長|強項|會看什麼|看什麼/.test(message)) return null;

  const doctor = resolveDoctor(message) ?? findLastMentionedDoctor(conversationHistory);
  if (!doctor) return "想查哪位醫師的專長？請直接打醫師名字。";

  const specialties = DOCTOR_SPECIALTIES[doctor];
  if (!specialties) return `目前沒有整理到${doctor}的主治專長。`;

  return `${doctor}主治專長：${specialties.join("、")}。`;
}

function resolveDoctor(message) {
  return DOCTOR_ALIASES.find(([, pattern]) => pattern.test(message))?.[0] ?? null;
}

function findLastMentionedDoctor(conversationHistory) {
  for (const historyMessage of [...conversationHistory].reverse()) {
    const content = historyMessage.content ?? "";
    const doctor = resolveDoctor(content);
    if (doctor) return doctor;
  }

  return null;
}
