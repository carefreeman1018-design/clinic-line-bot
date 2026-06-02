import { draftReply } from "../src/ai.js";

const cases = [
  {
    name: "medical escalation",
    reply: await draftReply({
      message: "我尿血是不是很嚴重",
      chunks: [],
      shouldEscalate: true
    }),
    expected: ["醫師", "預約門診"],
    forbidden: ["系統暫時", "請稍後再試", "感謝您的訊息", "祝您健康平安"]
  },
  {
    name: "missing knowledge",
    reply: await draftReply({
      message: "這個醫師明天臨時有沒有休",
      chunks: [],
      shouldEscalate: false
    }),
    expected: ["目前", "明確", "補"],
    forbidden: ["系統暫時", "請稍後再試", "感謝您的訊息", "祝您健康平安"]
  }
];

const issues = [];

for (const testCase of cases) {
  for (const term of testCase.expected) {
    if (!testCase.reply.includes(term)) {
      issues.push(`${testCase.name} missing expected term: ${term}`);
    }
  }

  for (const term of testCase.forbidden) {
    if (testCase.reply.includes(term)) {
      issues.push(`${testCase.name} includes forbidden term: ${term}`);
    }
  }
}

console.log(
  JSON.stringify(
    {
      ok: issues.length === 0,
      cases: cases.map(({ name, reply }) => ({ name, reply })),
      issues
    },
    null,
    2
  )
);

if (issues.length > 0) process.exitCode = 1;
