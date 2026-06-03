process.env.NODE_ENV = "test";

const { buildReplyAndMatches } = await import("../src/index.js");

const cases = [
  {
    name: "hpv vaccine allergy same-day bring list stays focused",
    message: "我今天想打 HPV 疫苗，但以前打針會過敏起疹子，現場可以直接打嗎？要帶什麼？講重點。",
    expected: ["HPV", "疫苗", "不能只靠訊息判斷", "過敏史", "今天能不能直接打", "醫師或診所人員", "健保卡", "身分證", "疫苗接種紀錄", "用藥狀況"],
    forbidden: ["皮蛇疫苗", "兩種疫苗", "同一天打", "https://", "lin.ee", "可以直接打", "保證"]
  },
  {
    name: "outside hospital report for visit avoids proxy pickup route",
    message: "我上次在別家醫院做檢查，報告可以拿來給醫師看嗎？需要先傳 LINE 給你們嗎？",
    expected: ["別家醫院", "紙本", "影像", "檢查報告", "帶來門診", "醫師評估", "不建議先在 LINE 傳個人醫療報告", "02-2511-9488", "櫃台確認", "健保卡"],
    forbidden: ["能不能只領報告", "能不能由家人代領", "代領人身分證", "授權", "關係資料", "家人代領", "https://", "lin.ee"]
  },
  {
    name: "anonymous screening privacy avoids report pickup route",
    message: "我想做匿名篩檢，但不想留真名，報告怎麼拿？家人會知道嗎？不要貼連結。",
    expected: ["匿名篩檢", "重視隱私", "是否需填哪些資料", "報告通知方式", "不能先保證完全不需任何資料", "不能用聊天直接保證某一種報告領取方式", "不會因為你在 LINE 詢問就主動通知家人", "護理人員", "02-2511-9488"],
    forbidden: ["能不能只領報告", "能不能由家人代領", "代領人身分證", "授權", "關係資料", "家人代領", "https://", "lin.ee"]
  },
  {
    name: "wednesday night anal urinary mixed routing answers schedule",
    message: "週三晚上可以看痔瘡還是泌尿？我有肛門痛但也頻尿，該掛誰？講重點。",
    expected: ["週三晚診", "18:00-20:30", "肛門直腸外科", "不是一般泌尿科門診", "肛門痛", "痔瘡", "一般泌尿", "頻尿", "02-2511-9488"],
    forbidden: ["HPV 疫苗", "匿名篩檢", "https://", "lin.ee"]
  },
  {
    name: "two patients should not get appointment link dump",
    message: "我已經線上掛號了，但想陪我爸一起看，兩個人可以用同一個號嗎？還是要各自掛號？",
    expected: ["不要先假設", "共用同一個掛號號碼", "每位病人", "各自的掛號資料", "身分資料", "健保卡", "爸爸", "加掛另一位", "相近時段", "櫃台確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  }
];

const issues = [];

for (const testCase of cases) {
  const { reply } = await buildReplyAndMatches(testCase.message, [], []);

  for (const term of testCase.expected) {
    if (!reply.includes(term)) {
      issues.push(`${testCase.name} missing expected term: ${term}\nReply: ${reply}`);
    }
  }

  for (const term of testCase.forbidden) {
    if (reply.includes(term)) {
      issues.push(`${testCase.name} includes forbidden term: ${term}\nReply: ${reply}`);
    }
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Round 11 smoke passed (${cases.length} case).`);
