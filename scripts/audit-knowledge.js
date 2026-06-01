import fs from "node:fs/promises";
import { draftReply } from "../src/ai.js";
import { answerDoctorInfoQuestion } from "../src/doctors.js";
import { loadKnowledge, retrieveRelevantChunks, shouldEscalate as shouldEscalateMessage } from "../src/knowledge.js";
import { answerFixedScheduleQuestion } from "../src/schedule.js";

const DEFAULT_ROUNDS = 3;

const OFFICIAL_SERVICE_TERMS = [
  "雙主治增粗包皮槍手術",
  "無刀口男性結紮手術",
  "男性私密處微創手術",
  "攝護腺肥大治療",
  "腎結石",
  "輸尿管結石",
  "100% 匿名篩檢",
  "HPV",
  "皮蛇疫苗",
  "PrEP",
  "PEP",
  "性功能障礙治療",
  "低能量震波治療",
  "女性泌尿道問題",
  "美磁波鍛肌椅",
  "痔瘡微創手術",
  "客製化功能性修復點滴",
  "猛健樂門診"
];

const STALE_CLAIM_TERMS = ["G 動椅", "官網列出藥物流產"];

const FIXED_SCHEDULE_QUESTIONS = [
  ["週一早上誰看診", ["陳偉傑醫師"]],
  ["週二晚上誰看診", ["李齊泰醫師"]],
  ["週三晚上有泌尿科嗎", ["陳嘉哲醫師", "不是一般泌尿科門診"]],
  ["週六晚上有看診嗎", ["休診"]],
  ["羅醫生什麼時候看診？", ["羅詩修醫師", "週一晚診", "週二午診", "週四早診", "週五午診", "週六早診"]],
  ["羅世修醫生什麼時候看診？", ["沒有「羅世修醫師」", "如果您是指「羅詩修醫師」", "週一晚診", "週二午診", "週四早診", "週五午診", "週六早診"]],
  ["陳偉傑", ["陳偉傑醫師", "週一早診", "週二早診", "週四晚診", "週五早診"]],
  ["有哪些醫生？", ["陳偉傑醫師", "羅詩修醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師"]]
];

const CONTEXTUAL_SCHEDULE_CASES = [
  {
    question: "喔喔那其他醫生呢",
    conversationHistory: [
      {
        role: "assistant",
        content: "羅詩修醫師固定門診：\n週一晚診（18:00-20:30）\n週二午診（13:30-17:00）"
      }
    ],
    expectedTerms: ["其他固定門診醫師", "陳偉傑醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師"],
    forbiddenTerms: ["羅詩修醫師"]
  },
  {
    question: "門診",
    conversationHistory: [
      {
        role: "user",
        content: "陳偉傑"
      },
      {
        role: "assistant",
        content: "陳偉傑醫師固定門診：\n週一早診（09:30-12:30）\n週二早診（09:30-12:30）"
      }
    ],
    expectedTerms: ["陳偉傑醫師", "週一早診", "週二早診", "週四晚診", "週五早診"]
  }
];

const DOCTOR_INFO_CASES = [
  {
    question: "這位醫生的專業是什麼",
    conversationHistory: [
      {
        role: "user",
        content: "陳偉傑"
      },
      {
        role: "assistant",
        content: "陳偉傑醫師固定門診：\n週一早診（09:30-12:30）"
      }
    ],
    expectedTerms: ["陳偉傑醫師", "精雕微創包皮槍手術", "無刀口結紮手術", "男性排尿障礙", "性傳染病檢測/治療"]
  },
  {
    question: "專長呢",
    conversationHistory: [
      {
        role: "assistant",
        content: "陳偉傑醫師是泌尿科專科醫師。"
      }
    ],
    expectedTerms: ["陳偉傑醫師", "精雕微創包皮槍手術", "攝護腺擴開手術", "男性性功能障礙無創治療"]
  },
  {
    question: "李齊泰醫師專長",
    conversationHistory: [],
    expectedTerms: ["李齊泰醫師", "菜花全方位治療", "顯微輸精管重接", "軟式輸尿管鏡高能雷射碎石手術"]
  }
];

const LINE_OVERRIDE_QUESTIONS = [
  ["2026/5/19 星期二晚上李齊泰醫師有看診嗎", ["line-voom-announcements.md", "5/19", "李齊泰醫師"]],
  ["5/22 到 5/25 有公休嗎", ["line-voom-announcements.md", "5/22", "5/25", "公休"]]
];

const BASIC_INFO_CASES = [
  {
    question: "津久診所在哪裡？捷運怎麼去？",
    source: "clinic-info.md",
    expectedTerms: ["松江路 276 號 3 樓", "行天宮站", "4 號出口"]
  },
  {
    question: "診所電話幾號？",
    source: "clinic-info.md",
    expectedTerms: ["02-2511-9488"]
  },
  {
    question: "LINE 官方帳號 ID 是什麼？",
    source: "clinic-info.md",
    expectedTerms: ["@455twnga", "https://lin.ee/qDUYijn"]
  },
  {
    question: "可以線上掛號嗎？掛號連結在哪？",
    source: "clinic-info.md",
    expectedTerms: ["https://appointment.uromeeme.inncom.cloud/"]
  },
  {
    question: "開車去附近可以停車嗎？",
    source: "clinic-info.md",
    expectedTerms: ["收費停車場"]
  }
];

const GREETING_NO_RETRIEVAL_CASES = ["Hi", "你好", "您好"];

const SERVICE_QUESTION_TEMPLATES = [
  "診所有提供{term}嗎？",
  "我想問津久有沒有做{term}",
  "{term}可以在你們診所諮詢嗎？"
];

const SERVICE_CASE_ALIASES = new Map([
  ["雙主治增粗包皮槍手術", ["包皮槍", "包皮環切"]],
  ["無刀口男性結紮手術", ["男性結紮"]],
  ["男性私密處微創手術", ["陰莖增大", "龜頭減敏"]],
  ["攝護腺肥大治療", ["攝護腺肥大", "雷射剜除", "水蒸氣消融", "綠光雷射", "Urolift"]],
  ["腎結石", ["腎結石", "輸尿管結石"]],
  ["100% 匿名篩檢", ["100% 匿名篩檢"]],
  ["HPV", ["HPV", "疫苗"]],
  ["皮蛇疫苗", ["皮蛇疫苗"]],
  ["PrEP", ["PrEP", "暴露愛滋病毒前預防性投藥"]],
  ["PEP", ["PEP", "暴露愛滋病毒後預防性投藥"]],
  ["性功能障礙治療", ["性功能障礙"]],
  ["低能量震波治療", ["低能量震波"]],
  ["女性泌尿道問題", ["女性泌尿道問題"]],
  ["美磁波鍛肌椅", ["美磁波鍛肌椅"]],
  ["痔瘡微創手術", ["痔瘡微創手術", "廔管手術", "肛裂手術"]],
  ["客製化功能性修復點滴", ["客製化功能性修復點滴"]],
  ["猛健樂門診", ["猛健樂門診"]]
]);

const SCHEDULE_CASES = [
  ["週一早診是哪位醫師？", ["陳偉傑醫師"], []],
  ["星期一下午可以一般門診嗎？", ["手術時段", "不是一般門診"], []],
  ["禮拜一晚上誰看診？", ["羅詩修醫師"], []],
  ["週二上午有診嗎？", ["陳偉傑醫師"], []],
  ["週二下午是哪位醫師？", ["羅詩修醫師"], []],
  ["星期二夜診是誰？", ["李齊泰醫師"], []],
  ["周三早上可以掛泌尿科嗎？", ["手術時段", "不是一般門診"], []],
  ["週三下午誰看診？", ["吳致寬醫師"], []],
  ["週三晚上是泌尿科門診嗎？", ["陳嘉哲醫師", "不是一般泌尿科門診"], []],
  ["星期四早診是哪位醫師？", ["羅詩修醫師"], []],
  ["星期四下午有門診嗎？", ["手術時段", "不是一般門診"], []],
  ["禮拜四晚上可以找誰？", ["陳偉傑醫師"], []],
  ["週五早上誰有診？", ["陳偉傑醫師"], []],
  ["週五下午看哪位醫師？", ["羅詩修醫師"], []],
  ["星期五晚上有一般門診嗎？", ["手術時段", "不是一般門診"], []],
  ["週六上午誰看診？", ["羅詩修醫師"], []],
  ["週六下午有門診嗎？", ["手術時段", "不是一般門診"], []],
  ["星期六晚上有開嗎？", ["休診"], []],
  ["週日有看診嗎？", ["沒有一般門診時段"], []],
  ["羅醫生什麼時候看診？", ["羅詩修醫師", "週一晚診", "週二午診", "週四早診", "週五午診", "週六早診"], []],
  ["羅世修醫生什麼時候看診？", ["沒有「羅世修醫師」", "如果您是指「羅詩修醫師」", "週一晚診", "週二午診", "週四早診", "週五午診", "週六早診"], []],
  ["陳偉傑", ["陳偉傑醫師", "週一早診", "週二早診", "週四晚診", "週五早診"], []],
  ["有哪些醫生？", ["陳偉傑醫師", "羅詩修醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師"], []],
  ["今天晚上誰看診？", ["今天（週一）", "羅詩修醫師"], []],
  ["明天下午有醫師嗎？", ["明天（週二）", "羅詩修醫師"], []],
  ["後天早上可以看診嗎？", ["後天（週三）", "手術時段"], []]
];

const LINE_RETRIEVAL_CASES = [
  {
    question: "2026/4/14 李齊泰醫師晚上有休診嗎？",
    expectedTerms: ["4/14", "李齊泰醫師", "停診一次"],
    forbiddenFixedReply: true
  },
  {
    question: "4/23 到 4/25 診所有公休嗎？",
    expectedTerms: ["4/23", "4/25", "公休"],
    forbiddenFixedReply: true
  },
  {
    question: "2025/5/30 端午連假有正常看診嗎？",
    expectedTerms: ["5/30", "5/31", "正常看診"],
    forbiddenFixedReply: true
  },
  {
    question: "2025/5/28 晚上陳嘉哲醫師有門診嗎？",
    expectedTerms: ["5/28", "陳嘉哲醫師", "停診一次"],
    forbiddenFixedReply: true
  }
];

const ESCALATION_CASES = [
  "我尿尿很痛又發燒，可以先吃抗生素嗎？",
  "我報告 PSA 偏高，是不是癌症？",
  "結紮後傷口腫起來還流膿怎麼辦？",
  "菜花藥膏要擦幾天？",
  "懷孕可以打 HPV 疫苗嗎？"
];

const FORBIDDEN_REPLY_TERMS = [
  "保證",
  "一定有效",
  "你就是",
  "直接吃",
  "劑量",
  "不用看醫生",
  ...STALE_CLAIM_TERMS
];

async function main() {
  const rounds = Number(process.argv[2] || DEFAULT_ROUNDS);
  const clinicInfo = await fs.readFile("data/clinic-info.md", "utf8");
  const doctorSchedule = await fs.readFile("data/doctor-schedule.md", "utf8");
  const doctorSpecialties = await fs.readFile("data/doctor-specialties.md", "utf8");
  const chunks = await loadKnowledge();
  const results = [];

  for (let round = 1; round <= rounds; round += 1) {
    results.push(await runRound({ round, clinicInfo, doctorSchedule, doctorSpecialties, chunks }));
  }

  const issues = results.flatMap((result) => result.issues);
  console.log(
    JSON.stringify(
      {
        ok: issues.length === 0,
        rounds,
        generatedQuestions: buildGeneratedQuestionList(),
        results,
        issues
      },
      null,
      2
    )
  );

  if (issues.length > 0) process.exitCode = 1;
}

async function runRound({ round, clinicInfo, doctorSchedule, doctorSpecialties, chunks }) {
  const issues = [];
  const caseResults = [];

  for (const term of OFFICIAL_SERVICE_TERMS) {
    if (!clinicInfo.includes(term)) {
      issues.push(formatIssue(round, `官網服務項目沒有出現在知識庫：${term}`));
    }
  }

  for (const term of STALE_CLAIM_TERMS) {
    if (clinicInfo.includes(term)) {
      issues.push(formatIssue(round, `知識庫仍包含過時或未確認宣稱：${term}`));
    }
  }

  if (!clinicInfo.includes("data/website-clinic-hours.md")) {
    issues.push(formatIssue(round, "clinic-info 未指向已整理的官網固定門診表"));
  }

  if (!doctorSchedule.includes("data/website-clinic-hours.md")) {
    issues.push(formatIssue(round, "doctor-schedule 未指向已整理的官網固定門診表"));
  }

  if (!clinicInfo.includes("data/doctor-specialties.md")) {
    issues.push(formatIssue(round, "clinic-info 未指向已整理的醫師主治專長"));
  }

  for (const term of ["陳偉傑醫師", "精雕微創包皮槍手術", "李齊泰醫師", "軟式輸尿管鏡高能雷射碎石手術"]) {
    if (!doctorSpecialties.includes(term)) {
      issues.push(formatIssue(round, `doctor-specialties 缺少「${term}」`));
    }
  }

  for (const [question, expectedTerms] of FIXED_SCHEDULE_QUESTIONS) {
    const reply = answerFixedScheduleQuestion(question, new Date("2026-06-01T00:00:00+08:00"));
    caseResults.push(checkReplyCase({ round, type: "fixed-schedule", question, reply, expectedTerms, issues }));
    if (!reply) {
      issues.push(formatIssue(round, `固定門診問題沒有直接回答：${question}`));
      continue;
    }

    for (const term of expectedTerms) {
      if (!reply.includes(term)) {
        issues.push(formatIssue(round, `固定門診回答缺少「${term}」：${question}`));
      }
    }
  }

  for (const { question, conversationHistory, expectedTerms, forbiddenTerms = [] } of CONTEXTUAL_SCHEDULE_CASES) {
    const reply = answerFixedScheduleQuestion(
      question,
      new Date("2026-06-01T00:00:00+08:00"),
      conversationHistory
    );
    caseResults.push(
      checkReplyCase({
        round,
        type: "contextual-schedule",
        question,
        reply,
        expectedTerms,
        forbiddenTerms,
        issues
      })
    );
  }

  for (const { question, conversationHistory, expectedTerms } of DOCTOR_INFO_CASES) {
    const reply = answerDoctorInfoQuestion(question, conversationHistory);
    caseResults.push(checkReplyCase({ round, type: "doctor-info", question, reply, expectedTerms, issues }));
  }

  for (const [question, expectedTerms] of LINE_OVERRIDE_QUESTIONS) {
    const fixedReply = answerFixedScheduleQuestion(question, new Date("2026-06-01T00:00:00+08:00"));
    if (fixedReply) {
      issues.push(formatIssue(round, `指定日期問題被固定門診表搶答：${question}`));
    }

    const matches = retrieveRelevantChunks(chunks, question, 4);
    const matchText = matches.map((chunk) => `${chunk.source}\n${chunk.content}`).join("\n");
    for (const term of expectedTerms) {
      if (!matchText.includes(term)) {
        issues.push(formatIssue(round, `LINE VOOM 指定日期查詢缺少「${term}」：${question}`));
      }
    }
    caseResults.push({
      type: "line-override",
      question,
      ok: expectedTerms.every((term) => matchText.includes(term)) && !fixedReply
    });
  }

  for (const testCase of BASIC_INFO_CASES) {
    caseResults.push(checkRetrievalCase({ round, type: "basic-info", chunks, issues, ...testCase }));
  }

  for (const question of GREETING_NO_RETRIEVAL_CASES) {
    const matches = retrieveRelevantChunks(chunks, question, 4);
    if (matches.length > 0) {
      issues.push(formatIssue(round, `招呼語不應命中知識庫：${question}`));
    }
    caseResults.push({
      type: "greeting-no-retrieval",
      question,
      ok: matches.length === 0
    });
  }

  for (const testCase of buildServiceCases()) {
    caseResults.push(checkRetrievalCase({ round, type: "service", chunks, issues, ...testCase }));
  }

  for (const [question, expectedTerms, forbiddenTerms] of SCHEDULE_CASES) {
    const reply = answerFixedScheduleQuestion(question, new Date("2026-06-01T00:00:00+08:00"));
    caseResults.push(checkReplyCase({ round, type: "schedule-expanded", question, reply, expectedTerms, forbiddenTerms, issues }));
  }

  for (const testCase of LINE_RETRIEVAL_CASES) {
    const fixedReply = answerFixedScheduleQuestion(testCase.question, new Date("2026-06-01T00:00:00+08:00"));
    if (testCase.forbiddenFixedReply && fixedReply) {
      issues.push(formatIssue(round, `指定日期公告問題不應由固定門診表搶答：${testCase.question}`));
    }
    caseResults.push(checkRetrievalCase({ round, type: "line-retrieval", chunks, issues, source: "line-voom-announcements.md", ...testCase }));
  }

  for (const question of ESCALATION_CASES) {
    const reply = await draftReply({
      message: question,
      chunks: [],
      shouldEscalate: true
    });
    const expectedTerms = ["醫師", "預約門診"];
    caseResults.push(checkReplyCase({ round, type: "medical-escalation", question, reply, expectedTerms, issues }));
  }

  for (const question of buildGeneratedQuestionList()) {
    const chunksForQuestion = retrieveRelevantChunks(chunks, question, 4);
    const reply =
      answerFixedScheduleQuestion(question, new Date("2026-06-01T00:00:00+08:00")) ||
      (await draftReply({
        message: question,
        chunks: chunksForQuestion,
        shouldEscalate: shouldEscalateMessage(question)
      }));

    const forbidden = FORBIDDEN_REPLY_TERMS.filter((term) => reply.includes(term));
    if (forbidden.length > 0) {
      issues.push(formatIssue(round, `回覆含禁止或過時詞彙「${forbidden.join("、")}」：${question}`));
    }
  }

  return {
    round,
    ok: issues.length === 0,
    checked: {
      officialServiceTerms: OFFICIAL_SERVICE_TERMS.length,
      staleClaimTerms: STALE_CLAIM_TERMS.length,
      fixedScheduleQuestions: FIXED_SCHEDULE_QUESTIONS.length,
      contextualScheduleQuestions: CONTEXTUAL_SCHEDULE_CASES.length,
      doctorInfoQuestions: DOCTOR_INFO_CASES.length,
      lineOverrideQuestions: LINE_OVERRIDE_QUESTIONS.length,
      expandedQuestionCases: caseResults.length,
      generatedReplyChecks: buildGeneratedQuestionList().length
    },
    issues
  };
}

function buildServiceCases() {
  return OFFICIAL_SERVICE_TERMS.flatMap((term) =>
    SERVICE_QUESTION_TEMPLATES.map((template) => ({
      question: template.replace("{term}", term),
      source: "clinic-info.md",
      expectedTerms: SERVICE_CASE_ALIASES.get(term) ?? [term]
    }))
  );
}

function buildGeneratedQuestionList() {
  return [
    ...BASIC_INFO_CASES.map(({ question }) => question),
    ...OFFICIAL_SERVICE_TERMS.map((term) => `診所有提供${term}嗎？`),
    ...buildServiceCases().map(({ question }) => question),
    ...SCHEDULE_CASES.map(([question]) => question),
    ...FIXED_SCHEDULE_QUESTIONS.map(([question]) => question),
    ...CONTEXTUAL_SCHEDULE_CASES.map(({ question }) => question),
    ...DOCTOR_INFO_CASES.map(({ question }) => question),
    ...LINE_OVERRIDE_QUESTIONS.map(([question]) => question),
    ...LINE_RETRIEVAL_CASES.map(({ question }) => question),
    ...ESCALATION_CASES
  ];
}

function checkRetrievalCase({ round, type, chunks, question, source, expectedTerms, issues }) {
  const matches = retrieveRelevantChunks(chunks, question, 4);
  const matchText = matches.map((chunk) => `${chunk.source}\n${chunk.content}`).join("\n");
  const hasExpectedSource = !source || matches.some((chunk) => chunk.source === source);
  const missingTerms = expectedTerms.filter((term) => !matchText.includes(term));

  if (!hasExpectedSource) {
    issues.push(formatIssue(round, `${type} 檢索沒有命中 ${source}：${question}`));
  }

  for (const term of missingTerms) {
    issues.push(formatIssue(round, `${type} 檢索缺少「${term}」：${question}`));
  }

  return {
    type,
    question,
    ok: hasExpectedSource && missingTerms.length === 0,
    matchedSources: matches.map((chunk) => chunk.source)
  };
}

function checkReplyCase({ round, type, question, reply, expectedTerms, forbiddenTerms = [], issues }) {
  if (!reply) {
    issues.push(formatIssue(round, `${type} 沒有產生回覆：${question}`));
    return { type, question, ok: false };
  }

  const missingTerms = expectedTerms.filter((term) => !reply.includes(term));
  const forbiddenMatches = forbiddenTerms.filter((term) => reply.includes(term));

  for (const term of missingTerms) {
    issues.push(formatIssue(round, `${type} 回覆缺少「${term}」：${question}`));
  }

  for (const term of forbiddenMatches) {
    issues.push(formatIssue(round, `${type} 回覆不應包含「${term}」：${question}`));
  }

  return {
    type,
    question,
    ok: missingTerms.length === 0 && forbiddenMatches.length === 0
  };
}

function formatIssue(round, message) {
  return `round ${round}: ${message}`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
