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
  },
  {
    name: "line add friend in service reply",
    reply: await draftReply({
      message: "我想問一下割包皮手術",
      chunks: [
        {
          title: "割包皮與包皮槍",
          content: "診所有提供包皮槍手術（包皮槍 5.0）與包皮環切手術。建議先加官方 LINE（https://lin.ee/qDUYijn）預約快速通關服務，或透過線上掛號系統預約門診。",
          sourceUrls: [
            "https://lin.ee/qDUYijn",
            "https://uromeeme.com/contact-us/",
            "https://uromeeme.com/",
            "https://uromeeme.com/treatment1/"
          ]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["包皮", "官網介紹：", "https://uromeeme.com/treatment1/"],
    forbidden: ["lin.ee", "contact-us", "https://uromeeme.com/\n", "加官方 LINE", "雙主治增粗包皮槍", "（）", "快速通關"]
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
