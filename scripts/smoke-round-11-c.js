process.env.NODE_ENV = "test";

const { buildReplyAndMatches } = await import("../src/index.js");

const cases = [
  {
    name: "Wednesday night mixed anal and urinary routing names colorectal slot",
    message: "週三晚上可以看痔瘡還是泌尿？我有肛門痛但也頻尿，該掛誰？講重點。",
    expected: [
      "週三晚診",
      "18:00-20:30",
      "陳嘉哲醫師",
      "肛門直腸外科",
      "不是一般泌尿科",
      "肛門痛",
      "痔瘡",
      "頻尿",
      "一般泌尿",
      "櫃台/電話確認",
      "立即就醫"
    ],
    forbidden: ["https://", "lin.ee", "官網介紹："]
  },
  {
    name: "two patients online registration avoids raw link dump",
    message: "我已經線上掛號了，但想陪我爸一起看，兩個人可以用同一個號嗎？還是要各自掛號？",
    expected: ["不要先假設", "共用同一個掛號號碼", "每位病人", "健保卡", "加掛另一位", "櫃台確認為準"],
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
  console.error(issues.join("\n\n"));
  process.exit(1);
}

console.log(`Round 11-C smoke passed (${cases.length} case).`);
