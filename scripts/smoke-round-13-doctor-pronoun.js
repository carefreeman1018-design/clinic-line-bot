process.env.NODE_ENV = "test";

const { buildReplyAndMatches } = await import("../src/index.js");

async function buildTestReply(message, conversationHistory = []) {
  const { reply } = await buildReplyAndMatches(message, [], conversationHistory);
  return reply;
}

const firstMessage = "那如果我改掛週五下午，羅醫師可以看一般泌尿嗎？還是一定要院長？請短一點。";
const firstReply = await buildTestReply(firstMessage);

const secondMessage = "他主要專長是什麼？如果只是頻尿，我掛他可以嗎？不要列太多。";
const secondReply = await buildTestReply(secondMessage, [
  { role: "user", content: firstMessage },
  { role: "assistant", content: firstReply }
]);

const cases = [
  {
    name: "friday afternoon general urology names Luo doctor",
    reply: firstReply,
    expected: ["一般頻尿或泌尿問題", "不一定要指定院長", "週五", "午診", "13:30-17:00", "羅詩修醫師", "可先參考固定門診"],
    forbidden: ["不需要只推薦唯一", "陳偉傑醫師主治專長", "精雕微創包皮槍手術", "無刀口結紮手術", "男性私密整形"]
  },
  {
    name: "pronoun follow-up keeps Luo doctor and answers frequency fit",
    reply: secondReply,
    expected: ["羅詩修醫師", "一般泌尿", "泌尿相關問題", "男性/女性排尿障礙", "頻尿可以先掛一般泌尿門診評估", "血尿", "尿不出來", "發燒"],
    forbidden: ["陳偉傑醫師", "津久診所院長", "攝護腺擴開手術", "精雕微創包皮槍手術", "無刀口結紮手術", "男性私密整形/陰莖增大手術", "性傳染病檢測/治療"]
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

console.log(JSON.stringify({ ok: issues.length === 0, cases, issues }, null, 2));

if (issues.length > 0) process.exitCode = 1;
