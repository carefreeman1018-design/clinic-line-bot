import { answerAdminMixedQuestion } from "../src/admin-mixed.js";

process.env.NODE_ENV = "test";

const { buildReplyAndMatches } = await import("../src/index.js");

const cases = [
  {
    name: "fee card counter question overrides prior service context",
    message: "如果只是想先問費用跟能不能刷卡，不想看診，可以到櫃台問嗎？",
    conversationHistory: [
      { role: "user", content: "男性更年期可以檢查睪固酮嗎？" },
      { role: "assistant", content: "男性更年期或睪固酮問題建議由泌尿科醫師評估。" }
    ],
    expected: ["櫃台", "診所人員", "費用", "付款方式", "醫師評估", "不能保證一定可刷卡", "02-2511-9488"],
    forbidden: ["睪固酮", "男性荷爾蒙", "性功能", "勃起", "testosterone", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "online registration forgot screenshot answers check-in without link",
    message: "我剛剛線上掛號了但忘記截圖，到現場怎麼報到？要帶健保卡嗎？",
    expected: ["3 樓櫃台", "姓名", "電話", "身分資料", "報到", "健保卡", "初診", "現場確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "保證"]
  },
  {
    name: "medication bag refill without visit avoids doctor schedule routing",
    message: "我上次的藥吃完了，等一下只拿藥袋給櫃台看，可以不看診直接拿一樣的藥嗎？",
    expected: ["不能先保證", "不用看診", "直接拿藥", "一樣的藥", "藥袋", "健保卡", "身分證", "櫃台", "醫師確認", "適合續拿", "需要看診調整", "發燒", "劇烈疼痛", "尿不出來", "02-2511-9488"],
    forbidden: ["固定門診", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "早診", "午診", "晚診", "https://", "lin.ee", "官網介紹：", "可以不看診"]
  }
];

const issues = [];

for (const testCase of cases) {
  const directReply = answerAdminMixedQuestion(testCase.message) ?? "";
  const { reply } = await buildReplyAndMatches(testCase.message, [], testCase.conversationHistory ?? []);

  if (directReply !== reply) {
    issues.push(`${testCase.name} routed reply differs from admin-mixed reply`);
  }

  for (const term of testCase.expected) {
    if (!reply.includes(term)) {
      issues.push(`${testCase.name} missing expected term: ${term}`);
    }
  }

  for (const term of testCase.forbidden) {
    if (reply.includes(term)) {
      issues.push(`${testCase.name} includes forbidden term: ${term}`);
    }
  }
}

if (issues.length > 0) {
  console.error(issues.join("\n"));
  process.exit(1);
}

console.log(`Admin mixed smoke passed (${cases.length} case).`);
