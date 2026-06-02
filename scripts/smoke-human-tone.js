import { draftReply } from "../src/ai.js";
import { answerBasicInfoQuestion } from "../src/basic-info.js";
import { answerFemaleUrologyQuestion } from "../src/female-urology.js";
import { answerMalePrivateSurgeryQuestion } from "../src/male-private.js";
import { answerMaleUtiUrgentQuestion } from "../src/male-uti.js";
import { answerProstateQuestion } from "../src/prostate.js";
import { answerReportResultQuestion } from "../src/report-results.js";
import { answerPepVisitScheduleFollowUp } from "../src/schedule.js";
import { answerCircumcisionFastPassQuestion } from "../src/surgery.js";
import { answerStdTreatmentQuestion } from "../src/std-treatment.js";
import { answerStoneQuestion } from "../src/stone-treatment.js";
import { answerVasectomyQuestion } from "../src/vasectomy.js";
import { answerVaccineQuestion } from "../src/vaccines.js";
import { answerWoundCareQuestion } from "../src/wound-care.js";

const cases = [
  {
    name: "post circumcision swelling yellow discharge avoids diagnosis",
    reply: answerWoundCareQuestion("我割包皮第 5 天，龜頭有點水腫，釘子旁邊黃黃的，是不是流膿？可以洗澡或自己多擦藥膏嗎？不要貼連結，講重點。"),
    expected: ["術後第 5 天", "LINE 不能直接判斷", "前 2 週", "不要碰水", "不要自行加量", "拍清楚照片", "02-2511-9488", "盡快就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "確定是感染", "不是感染", "可以洗澡", "自己多擦", "不用回診"]
  },
  {
    name: "wart ointment duration avoids online prescription",
    reply: answerStdTreatmentQuestion("我覺得可能是菜花，藥膏要擦幾天？可以自己買來擦嗎？不要貼連結，講重點。"),
    expected: ["菜花", "HPV", "LINE 不能診斷", "藥膏要擦幾天", "自行買藥", "醫師確認", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以自己買", "擦 7 天", "擦七天", "擦兩週", "元"]
  },
  {
    name: "pep condom broke at 60 hours gives urgent next step and anonymous screening",
    reply: answerStdTreatmentQuestion("我昨天晚上保險套破掉，現在大概過了 60 小時，我是不是要吃 PEP？可以直接去拿藥嗎？我也想匿名驗性病，不要貼連結，請直接告訴我下一步。"),
    expected: ["60 小時", "72 小時", "今天盡快", "LINE 不能直接判斷或開藥", "匿名篩檢", "護理人員安排篩檢", "02-2511-9488", "儘速就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接去拿藥", "可以直接拿藥", "不用看診", "性病篩檢與治療需要依症狀"]
  },
  {
    name: "prep does not replace condoms or post-exposure pep",
    reply: answerStdTreatmentQuestion("我最近想開始吃 PrEP，是不是吃了就不用戴套，也不會得梅毒、淋病或菜花？如果昨天已經無套了，吃 PrEP 可以補救嗎？不要貼連結，請直接告訴我下一步。"),
    expected: ["PrEP 是暴露前預防", "不是已發生暴露後的補救", "不能預防梅毒、淋病、菜花", "PEP", "72 小時", "今天盡快", "LINE 不能直接判斷或開藥", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "吃了就不用戴套", "可以補救", "菜花 HPV 相關篩檢與治療評估"]
  },
  {
    name: "psa report cancer biopsy question avoids diagnosis",
    reply: answerReportResultQuestion("我健檢 PSA 偏高，這樣是不是攝護腺癌？要不要馬上切片？今天能看嗎？不要貼連結，講重點。"),
    expected: ["PSA", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "切片", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是癌症", "不是癌症", "立即急診", "尿不出來", "大量出血"]
  },
  {
    name: "prostate treatment choice cost and ejaculation avoids pep context",
    reply: answerProstateQuestion("我爸爸夜尿很多、尿流變細，聽說你們有水蒸氣消融或 Urolift。哪個比較適合？會不會影響射精？費用多少？不要貼連結，請直接告訴我下一步。"),
    expected: ["攝護腺肥大", "雷射剜除", "水蒸氣消融", "Urolift", "夜尿", "尿流變細", "影響射精", "費用", "醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "PEP", "72 小時", "可以保證", "元"]
  },
  {
    name: "pep memory does not intercept prostate follow-up",
    reply: answerPepVisitScheduleFollowUp(
      "我爸爸夜尿很多、尿流變細，聽說你們有水蒸氣消融或 Urolift。哪個比較適合？會不會影響射精？費用多少？不要貼連結，請直接告訴我下一步。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "male uti fever antibiotic same-day stays safe and useful",
    reply: answerMaleUtiUrgentQuestion("我尿尿很痛又發燒，可以先吃抗生素嗎？今天晚上能看嗎？不要貼連結，講重點。", new Date("2026-06-02T04:00:00Z")),
    expected: ["尿痛", "發燒", "不能建議先吃", "抗生素", "今天晚上", "李齊泰醫師", "18:00-20:30", "02-2511-9488", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃", "可以自行"]
  },
  {
    name: "female uti blood antibiotic same-day does not invent fever",
    reply: answerMaleUtiUrgentQuestion("我是女生，今天尿尿很痛、一直想尿，下腹也痛，尿裡好像有血。可以先吃家裡剩下的抗生素嗎？今天要看門診還是急診？不要貼連結，直接告訴我下一步。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["尿痛", "疑似血尿", "醫師評估", "不能建議先吃", "抗生素", "請不要自行服藥", "02-2511-9488", "血尿", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "尿痛合併發燒", "可以先吃", "可以自行"]
  },
  {
    name: "stone urgent pain hematuria gives er boundary without links",
    reply: answerStoneQuestion("我右腰痛到冒冷汗，尿有點紅，懷疑是腎結石或輸尿管結石。你們可以處理嗎？今天要去門診還是急診？不要貼連結，請直接告訴我下一步。"),
    expected: ["右腰痛到冒冷汗", "尿有點紅", "LINE 判斷", "腎結石", "輸尿管結石", "劇痛", "血尿", "優先急診", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "一定是結石"]
  },
  {
    name: "pep memory does not intercept stone urgent question",
    reply: answerPepVisitScheduleFollowUp(
      "我右腰痛到冒冷汗，尿有點紅，懷疑是腎結石或輸尿管結石。你們可以處理嗎？今天要去門診還是急診？不要貼連結，請直接告訴我下一步。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "vasectomy same-day price reversal keeps boundary without link",
    reply: answerVasectomyQuestion("我想做男性結紮，可以今天直接做嗎？以後如果後悔能保證接回來嗎？費用多少？不要貼連結，請講重點。"),
    expected: ["男性無刀口結紮", "當天", "費用", "不能保證恢復生育", "醫師術前評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "保證接回來", "一定", "元"]
  },
  {
    name: "vasectomy post-op contraception semen check stays on point",
    reply: answerVasectomyQuestion("我如果做完結紮，是不是馬上就可以不用避孕？之後要不要驗精液？請不要貼連結，直接講重點。"),
    expected: ["不能馬上停止避孕", "殘存精子", "精液檢查", "醫師指示", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "費用", "當天安排", "重接"]
  },
  {
    name: "male private surgery price outcome keeps boundary without link",
    reply: answerMalePrivateSurgeryQuestion("我想問陰莖增大或龜頭減敏，你們有做嗎？可以保證變大或比較持久嗎？費用多少？不要貼連結，講重點。"),
    expected: ["男性私密", "陰莖增大", "龜頭減敏", "不能保證", "費用", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "一定", "元"]
  },
  {
    name: "female urology muscle chair price keeps boundary without link",
    reply: answerFemaleUrologyQuestion("我咳嗽會漏尿，想問你們有美磁波鍛肌椅嗎？我可以直接做嗎？一次費用多少？不要貼連結，請講重點。"),
    expected: ["女性泌尿", "漏尿", "美磁波鍛肌椅", "醫師評估", "費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "直接做", "保證", "元"]
  },
  {
    name: "circumcision same-day surgery price gives next step without link",
    reply: answerCircumcisionFastPassQuestion("我想割包皮，今天能不能看完就手術？費用大概多少？不要貼連結，直接告訴我下一步。"),
    expected: ["割包皮", "快速通關", "費用", "醫師術前評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "保證", "一定可以", "元"]
  },
  {
    name: "hpv vaccine price allergy answers service and safety boundary",
    reply: answerVaccineQuestion("我想打九價 HPV 疫苗，你們有嗎？價錢多少？我有藥物過敏，能不能直接打？請回答重點就好。"),
    expected: ["HPV", "九價", "價格", "02-2511-9488", "個人狀況", "醫師或診所人員"],
    forbidden: ["傷口", "發燒", "尿不出來", "大量出血", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "hpv vaccine male prior sex dose same-day price stays bounded",
    reply: answerVaccineQuestion("我是男生，已經有過性行為，現在打九價 HPV 還有用嗎？要打幾劑？今天能直接打嗎？費用多少？不要貼連結，講重點。"),
    expected: ["HPV", "九價", "性行為", "劑數", "今天", "庫存", "價格", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接打", "一定", "元"]
  },
  {
    name: "pep concise answer suppresses extra link",
    reply: await draftReply({
      message: "我昨晚無套性行為後很焦慮，現在大概過了 30 小時。你們可以做 PEP 嗎？我能不能直接去拿藥？請講重點就好。",
      chunks: [
        {
          title: "PrEP、PEP 與匿名篩檢",
          content: "診所有提供 PEP 評估。PEP 需在暴露後 72 小時內盡快開始，但不能線上直接判斷或開藥，需由醫師評估後處理。",
          sourceUrls: ["https://uromeeme.com/pep/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["PEP", "72", "醫師"],
    forbidden: ["官網介紹：", "https://"]
  },
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
