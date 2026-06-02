import { draftReply } from "../src/ai.js";
import { answerBasicInfoQuestion } from "../src/basic-info.js";

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
    forbidden: ["lin.ee", "contact-us", "加官方 LINE", "雙主治增粗包皮槍", "（）", "快速通關"],
    forbiddenPatterns: [/官網介紹：\nhttps:\/\/uromeeme\.com\/?$/]
  },
  {
    name: "vasectomy service link",
    reply: await draftReply({
      message: "我想問男性結紮",
      chunks: [
        {
          title: "無刀口男性結紮",
          content: "診所有提供無刀口男性結紮手術。建議先加官方 LINE（https://lin.ee/qDUYijn）諮詢，或電話確認。",
          sourceUrls: [
            "https://lin.ee/qDUYijn",
            "https://uromeeme.com/contact-us/",
            "https://uromeeme.com/",
            "https://uromeeme.com/%E7%84%A1%E5%88%80%E5%8F%A3%E7%B5%90%E7%B4%AE%E6%89%8B%E8%A1%93/"
          ]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["結紮", "官網介紹：", "https://uromeeme.com/%e7%84%a1%e5%88%80%e5%8f%a3%e7%b5%90%e7%b4%ae%e6%89%8b%e8%a1%93/"],
    forbidden: ["lin.ee", "contact-us", "加官方 LINE"],
    forbiddenPatterns: [/官網介紹：\nhttps:\/\/uromeeme\.com\/?$/]
  },
  {
    name: "shockwave service link",
    reply: await draftReply({
      message: "低能量震波適合嗎",
      chunks: [
        {
          title: "低能量震波治療",
          content: "低能量震波治療需經醫師評估是否適合。",
          sourceUrls: [
            "https://uromeeme.com/contact-us/",
            "https://uromeeme.com/",
            "https://uromeeme.com/%E4%BD%8E%E8%83%BD%E9%87%8F%E9%9C%87%E6%B3%A2%E6%B2%BB%E7%99%82/"
          ]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["震波", "官網介紹：", "https://uromeeme.com/%e4%bd%8e%e8%83%bd%e9%87%8f%e9%9c%87%e6%b3%a2%e6%b2%bb%e7%99%82/"],
    forbidden: ["contact-us", "https://lin.ee"],
    forbiddenPatterns: [/官網介紹：\nhttps:\/\/uromeeme\.com\/?$/]
  },
  {
    name: "hpv vaccine does not use broad link",
    reply: await draftReply({
      message: "HPV疫苗可以打嗎",
      chunks: [
        {
          title: "HPV 疫苗",
          content: "官網列出診所有提供 HPV 疫苗施打。是否適合、庫存、費用與施打時程，建議先透過官方 LINE 或電話 02-2511-9488 確認。",
          sourceUrls: [
            "https://lin.ee/qDUYijn",
            "https://uromeeme.com/contact-us/",
            "https://uromeeme.com/",
            "https://uromeeme.com/video/hpv%E7%96%AB%E8%8B%97%E5%AE%A3%E5%B0%8E%E5%BD%B1%E7%89%87%EF%BD%9C%E8%A8%BA%E6%89%80%E7%AF%87-2025%E5%B9%B4%E5%BA%A6/"
          ]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["HPV", "官網介紹：", "https://uromeeme.com/video/hpv%e7%96%ab%e8%8b%97%e5%ae%a3%e5%b0%8e%e5%bd%b1%e7%89%87%ef%bd%9c%e8%a8%ba%e6%89%80%e7%af%87-2025%e5%b9%b4%e5%ba%a6/"],
    forbidden: ["lin.ee", "contact-us", "加官方 LINE", "官方 LINE 或電話"],
    forbiddenPatterns: [/官網介紹：\nhttps:\/\/uromeeme\.com\/?$/]
  },
  {
    name: "basic surgery appointment stays in current LINE context",
    reply: answerBasicInfoQuestion("如何預約手術"),
    expected: ["https://appointment.uromeeme.inncom.cloud/", "留下姓名", "02-2511-9488"],
    forbidden: ["lin.ee", "加官方 LINE", "contact-us"]
  },
  {
    name: "clinic access reply respects no-link patient request",
    reply: answerBasicInfoQuestion("我從行天宮捷運站要去你們診所，能不能只告訴我怎麼走？不用貼連結，謝謝。"),
    expected: ["行天宮站", "4 號出口", "步行約 40 秒", "3 樓"],
    forbidden: ["https://", "contact-us", "appointment", "官網介紹"]
  },
  {
    name: "contextual urology follow-up does not append homepage",
    reply: await draftReply({
      message: "那我如果只是頻尿想看泌尿科，剛剛那一診就不要掛，對嗎？",
      chunks: [
        {
          title: "男性泌尿道感染與頻尿",
          content: "頻尿、夜尿或排尿不順可能有不同原因，建議掛一般泌尿科門診由醫師評估。",
          sourceUrls: ["https://uromeeme.com/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["頻尿", "泌尿科"],
    forbidden: ["官網介紹：", "https://uromeeme.com/"]
  },
  {
    name: "test code alone does not inherit old article link",
    reply: await draftReply({
      message: "H27-01",
      chunks: [
        {
          title: "割包皮衛教",
          content: "割包皮有什麼好處？可以參考官網文章。",
          sourceUrls: ["https://uromeeme.com/health-education/%e5%89%b2%e5%8c%85%e7%9a%ae%e7%9a%84%e5%a5%bd%e8%99%95/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["割包皮"],
    forbidden: ["官網介紹：", "health-education"]
  },
  {
    name: "anal service does not borrow unrelated service link",
    reply: await draftReply({
      message: "痔瘡可以看嗎",
      chunks: [
        {
          title: "痔瘡、廔管、肛裂與肛門性病",
          content: "診所有肛門直腸外科，官網列出痔瘡、廔管、肛裂等肛門疾病診斷與治療。",
          sourceUrls: ["https://uromeeme.com/", "https://uromeeme.com/about-us/"]
        },
        {
          title: "女性泌尿與鍛肌椅",
          content: "美磁波鍛肌椅可用於骨盆底肌訓練。",
          sourceUrls: ["https://uromeeme.com/%E9%AB%98%E5%AF%86%E5%BA%A6%E7%A3%81%E6%B3%A2%E6%B2%BB%E7%99%82%E9%8D%9B%E8%82%8C%E6%A4%85/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["痔瘡"],
    forbidden: ["官網介紹：", "鍛肌椅", "%E9%AB%98%E5%AF%86%E5%BA%A6"]
  },
  {
    name: "skin shingles vaccine uses matching suggested reply",
    reply: await draftReply({
      message: "皮蛇疫苗可以打嗎",
      chunks: [
        {
          title: "HPV、皮蛇疫苗與疫苗預約",
          content: [
            "## LINE 回覆建議",
            "使用者問：「你們有 HPV 疫苗嗎？」「可以打九價 HPV 嗎？」",
            "",
            "建議回覆：",
            "",
            "「官網列出診所有提供 HPV 疫苗施打。」",
            "",
            "使用者問：「你們有皮蛇疫苗嗎？」",
            "",
            "建議回覆：",
            "",
            "「官網主要診療項目有列出皮蛇疫苗施打。建議先透過官方 LINE 或電話 02-2511-9488 確認庫存、費用與可預約時段。」"
          ].join("\n"),
          sourceUrls: ["https://uromeeme.com/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["皮蛇疫苗"],
    forbidden: ["HPV 疫苗施打", "官網介紹："]
  },
  {
    name: "anal wart uses matching suggested reply",
    reply: await draftReply({
      message: "肛門菜花可以處理嗎",
      chunks: [
        {
          title: "痔瘡、廔管、肛裂與肛門性病",
          content: [
            "## LINE 回覆建議",
            "使用者問：「痔瘡可以看嗎？」",
            "",
            "建議回覆：",
            "",
            "「診所有肛門直腸外科，官網列出痔瘡、廔管、肛裂等肛門疾病診斷與治療，也有痔瘡微創手術評估。建議預約門診由醫師檢查。」",
            "",
            "使用者問：「肛門菜花可以處理嗎？」",
            "",
            "建議回覆：",
            "",
            "「官網列出肛門性病診斷與治療。肛門菜花或其他病灶需要醫師實際檢查確認，建議預約肛門直腸外科或泌尿相關門診評估。」"
          ].join("\n"),
          sourceUrls: ["https://uromeeme.com/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["肛門菜花", "肛門性病", "https://uromeeme.com/%e6%80%a7%e7%97%85%e6%b2%bb%e7%99%82/"],
    forbidden: ["痔瘡微創"]
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

  for (const pattern of testCase.forbiddenPatterns ?? []) {
    if (pattern.test(testCase.reply)) {
      issues.push(`${testCase.name} matches forbidden pattern: ${pattern}`);
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
