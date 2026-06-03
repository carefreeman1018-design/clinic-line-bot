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
