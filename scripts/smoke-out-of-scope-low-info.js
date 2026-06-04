process.env.NODE_ENV = "test";

const { buildReplyAndMatches } = await import("../src/index.js");

const clinicForbiddenTerms = [
  "官網介紹：",
  "https://",
  "uromeeme",
  "包皮",
  "手術",
  "尿尿",
  "泌尿",
  "門診時段",
  "醫師時段",
  "早診",
  "午診",
  "晚診"
];

const codeForbiddenTerms = [
  "function",
  "class",
  "async",
  "await",
  "Node",
  "nullptr",
  "程式碼",
  "程式範例",
  "演算法",
  "概念整理",
  "Python 範例",
  "JavaScript 範例",
  "C++",
  "VBA"
];

const cases = [
  {
    name: "linked list python food prompt",
    message: "我想吃麥克雞塊，但吃之前要先學會反轉 Linked List 的 Python 程式，可以幫我寫嗎？",
    expected: ["診所服務無關"],
    forbidden: [...clinicForbiddenTerms, ...codeForbiddenTerms]
  },
  {
    name: "javascript async food prompt",
    message: "我今天想訂披薩，但先幫我寫一段 JavaScript async/await 的範例，越短越好。",
    expected: ["診所服務無關"],
    forbidden: [...clinicForbiddenTerms, ...codeForbiddenTerms]
  },
  {
    name: "cpp data structure homework prompt",
    message: "我在做資料結構作業，請直接給我 C++ 反轉 linked list 的完整程式碼。",
    expected: ["診所服務無關"],
    forbidden: [...clinicForbiddenTerms, ...codeForbiddenTerms]
  },
  {
    name: "explicit unrelated excel vba prompt",
    message: "幫我寫 Excel VBA，把 A 欄資料整理成報表，這跟診所無關，只是測試你會不會亂回。",
    expected: ["診所服務無關"],
    forbidden: [...clinicForbiddenTerms, ...codeForbiddenTerms]
  },
  ...["喔", "哈哈", "嘿嘿", "無聊", "隨便", "你在幹嘛"].map((message) => ({
    name: `low information chat: ${message}`,
    message,
    expected: ["我在", "門診", "預約", "交通"],
    forbidden: clinicForbiddenTerms
  })),
  ...["好喔", "嗯嗯"].map((message) => ({
    name: `acknowledgement: ${message}`,
    message,
    expected: ["好", "有需要"],
    forbidden: clinicForbiddenTerms
  }))
];

const priorMedicalHistory = [
  { role: "user", content: "我尿很痛，今天還有一點血尿。" },
  { role: "assistant", content: "尿痛合併血尿需要醫師評估。" }
];

const issues = [];

for (const testCase of cases) {
  const history = /low information chat|acknowledgement/.test(testCase.name) ? priorMedicalHistory : [];
  const { reply } = await buildReplyAndMatches(testCase.message, [], history);

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

console.log(`Out-of-scope and low-info smoke passed (${cases.length} cases).`);
