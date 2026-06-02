import fs from "node:fs/promises";
import { draftReply } from "../src/ai.js";
import { answerLineVoomAnnouncementQuestion } from "../src/announcements.js";
import { answerBasicInfoQuestion } from "../src/basic-info.js";
import { answerDoctorInfoQuestion } from "../src/doctors.js";
import { loadKnowledge, retrieveRelevantChunks, shouldEscalate as shouldEscalateMessage } from "../src/knowledge.js";
import { answerFixedScheduleQuestion, answerPepVisitScheduleFollowUp } from "../src/schedule.js";

const DEFAULT_ROUNDS = 3;

const OFFICIAL_SERVICE_TERMS = [
  "包皮槍",
  "無刀口男性結紮手術",
  "男性私密處微創手術",
  "攝護腺肥大治療",
  "腎結石",
  "輸尿管結石",
  "男性泌尿道感染",
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
  ["如果我是頻尿要看一般泌尿科，週三晚陳嘉哲那診不要掛，對嗎？", ["對", "週三晚診", "陳嘉哲醫師", "不是一般泌尿科門診"]],
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
  },
  {
    question: "那我今天下午或晚上要掛哪個時段比較適合？可以直接到現場嗎？不要貼連結，跟我說下一步就好。",
    now: new Date("2026-06-02T04:00:00+08:00"),
    conversationHistory: [
      {
        role: "user",
        content: "我昨晚無套性行為後很焦慮，現在大概過了 30 小時。你們可以做 PEP 嗎？我能不能直接去拿藥？"
      },
      {
        role: "assistant",
        content: "PEP 需在暴露後72小時內盡快開始，但不能直接拿藥，必須先由醫師評估後開立。"
      }
    ],
    expectedTerms: ["PEP", "越早評估", "今天（週二）", "羅詩修醫師", "李齊泰醫師", "不能直接", "02-2511-9488"],
    forbiddenTerms: ["https://", "官網介紹"]
  }
];

const PEP_CONTEXT_NEGATIVE_CASES = [
  {
    question: "我包皮手術後第二天，紗布上有一點血，今天要不要拆掉重新包？可以洗澡嗎？不要貼連結，請講重點。",
    conversationHistory: [
      {
        role: "assistant",
        content: "PEP 需在暴露後72小時內盡快開始，但不能直接拿藥，必須先由醫師評估後開立。"
      }
    ],
    forbiddenTerms: ["PEP", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
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
  },
  {
    question: "陳偉傑醫師學歷和經歷",
    conversationHistory: [],
    expectedTerms: ["陳偉傑醫師", "臺北醫學大學臨床醫學研究所博士候選人", "長庚大學醫學士", "Rezūm 水蒸氣消融術原廠認證醫師"]
  },
  {
    question: "陳嘉哲醫師有什麼證照？",
    conversationHistory: [],
    expectedTerms: ["陳嘉哲醫師", "臺灣外科醫學會專科醫師", "臺灣大腸直腸外科醫學會專科醫師"]
  },
  {
    question: "那羅醫生呢",
    conversationHistory: [
      {
        role: "user",
        content: "這位醫生的專業是什麼"
      },
      {
        role: "assistant",
        content: "陳偉傑醫師主治專長：精雕微創包皮槍手術、無刀口結紮手術、男性排尿障礙。"
      }
    ],
    expectedTerms: ["羅詩修醫師", "男性/女性排尿障礙", "攝護腺水蒸氣消融手術", "性傳染病檢測/治療"]
  },
  {
    question: "那其他醫師呢？不要再列羅詩修。",
    conversationHistory: [
      {
        role: "assistant",
        content: "羅詩修醫師主治專長：精雕微創包皮槍手術、無刀口結紮手術、男性/女性排尿障礙。"
      }
    ],
    expectedTerms: ["其他醫師主治專長", "陳偉傑醫師", "李齊泰醫師", "吳致寬醫師", "陳嘉哲醫師"],
    forbiddenTerms: ["羅詩修醫師"]
  }
];

const LINE_OVERRIDE_QUESTIONS = [
  ["2026/5/19 星期二晚上李齊泰醫師有看診嗎", ["line-voom-announcements.md", "5/19", "李齊泰醫師"]],
  ["5/22 到 5/25 有公休嗎", ["line-voom-announcements.md", "5/22", "5/25", "公休"]]
];

const LINE_ANNOUNCEMENT_REPLY_CASES = [
  ["2026/5/19 週二晚上李齊泰醫師有看診嗎？請依 LINE VOOM 公告回答。", ["5/19", "李齊泰醫師", "停診一次", "100%匿名篩檢"]],
  {
    question: "我看到 5/19 晚上李齊泰醫師停診，那天如果只是要做匿名篩檢或打疫苗，還能去嗎？請簡短回答。",
    expectedTerms: ["5/19", "李齊泰醫師", "停診一次", "100%匿名篩檢", "疫苗接種服務照常營業"],
    forbiddenTerms: ["官方 LINE", "線上掛號"]
  },
  {
    question: "那 5/19 這個停診是只有那一次，還是李齊泰醫師每個週二晚上都停診？請直接說。",
    expectedTerms: ["5/19", "李齊泰醫師", "停診一次", "不是每週都停診"],
    forbiddenTerms: ["100%匿名篩檢", "疫苗接種服務照常營業", "官方 LINE", "線上掛號"]
  },
  ["5/22 到 5/25 診所有沒有公休公告？", ["5/22 到 5/25", "公休"]],
  ["2026/4/14 李齊泰醫師晚上是否停診一次？", ["4/14", "李齊泰醫師", "停診一次"]],
  ["2025/5/30 端午連假是否正常看診？", ["5/30", "正常看診"]],
  ["2025/5/28 晚上陳嘉哲醫師是否停診一次？", ["5/28", "陳嘉哲醫師", "停診一次"]],
  ["H18-01：2025/5/28 晚上陳嘉哲醫師有門診嗎？請依 LINE VOOM 公告回答。", ["5/28", "陳嘉哲醫師", "停診一次"]],
  ["H19-02：那 2025/5/30 和 2025/6/1 呢？端午連假公告說哪一天正常、哪一天仍是公休日？", ["5/30", "正常看診", "6/1", "公休日"]],
  ["H22-03 LINE VOOM 有沒有公告 2026/4/23 到 2026/4/25 津久診所公休？如果有，請說明日期與內容。", ["4/23 到 4/25", "公休"]]
];

const BASIC_INFO_CASES = [
  {
    question: "津久診所在哪裡？捷運怎麼去？",
    source: "clinic-info.md",
    expectedTerms: ["松江路 276 號 3 樓", "行天宮站", "4 號出口", "40 秒"]
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
    expectedTerms: ["台灣聯通停車場", "聯邦佳佳大樓停車場"]
  },
  {
    question: "坐公車去津久診所可以在哪站下？",
    source: "clinic-info.md",
    expectedTerms: ["捷運行天宮站", "松江新村", "民權松江路口"]
  }
];

const BASIC_INFO_REPLY_CASES = [
  ["我人在松江路附近，診所地址的郵遞區號是 104091 嗎？", ["104091", "松江路 276 號 3 樓"]],
  ["如果從行天宮站 4 號出口出來，官網說步行大約多久？", ["行天宮站", "4 號出口", "步行約 40 秒"]],
  ["開車去附近可以停哪裡？", ["台灣聯通停車場", "聯邦佳佳大樓停車場"]],
  ["H24-11 如果我開車去津久診所，官網列出的兩個附近停車場名稱和地址是什麼？", ["台灣聯通停車場－將捷二場", "松江路 336 號", "聯邦佳佳大樓停車場", "松江路 235 巷 22 號"]],
  ["坐公車要在哪一站下車？", ["捷運行天宮站", "松江新村", "民權松江路口"]],
  ["診所英文識別 UroMe 是不是官方資料裡寫的？", ["UroMe", "英文識別"]],
  ["掛號系統在哪", ["https://appointment.uromeeme.inncom.cloud/", "預約掛號"]],
  ["如何預約手術", ["https://appointment.uromeeme.inncom.cloud/", "留下姓名", "02-2511-9488"]],
  ["官網首頁和線上掛號網址是同一個網站嗎？請不要混在一起。", ["https://uromeeme.com/", "https://appointment.uromeeme.inncom.cloud/", "不同"]],
  ["官方 LINE ID、加好友連結、電話各是什麼？", ["@455twnga", "https://lin.ee/qDUYijn", "02-2511-9488"]],
  ["請問津久診所的地址、電話、官方 LINE ID 和線上掛號連結分別是什麼？", ["松江路 276 號 3 樓", "02-2511-9488", "@455twnga", "https://appointment.uromeeme.inncom.cloud/"]],
  ["官方 LINE ID 是 @455twnga，VOOM 貼文又寫 @uromeeme，客服該怎麼回答？", ["@455twnga", "https://lin.ee/qDUYijn", "@uromeeme"]]
];

const PROCEDURE_RETRIEVAL_CASES = [
  {
    question: "我想問割包皮",
    source: "circumcision.md",
    expectedTerms: ["包皮槍 5.0", "包皮環切手術", "術前評估"]
  },
  {
    question: "包皮過長需要割嗎？",
    source: "circumcision.md",
    expectedTerms: ["包皮過長", "造成困擾", "由泌尿科醫師看診評估"]
  },
  {
    question: "小孩包莖可以處理嗎？",
    source: "circumcision.md",
    expectedTerms: ["包皮或龜頭反覆發炎", "嵌頓性包莖", "醫師專業診斷"]
  },
  {
    question: "男生尿道炎你們有看嗎？",
    source: "male-uti.md",
    expectedTerms: ["男性泌尿道感染", "攝護腺炎", "膀胱炎", "尿道炎"]
  },
  {
    question: "你們有 HPV 疫苗和皮蛇疫苗嗎？",
    source: "vaccines.md",
    expectedTerms: ["HPV", "皮蛇疫苗", "官方 LINE"]
  },
  {
    question: "包皮手術後怎麼換藥？",
    source: "wound-care.md",
    expectedTerms: ["清、擦、噴、塗", "生理食鹽水", "官方 LINE"]
  },
  {
    question: "官網有菜花肉芽長怎樣的衛教嗎？",
    source: "official-health-education-index.md",
    expectedTerms: ["菜花長怎樣", "菜花肉芽", "官網文章"]
  },
  {
    question: "有新聞挖挖哇老人愛愛大補帖那支影片嗎？",
    source: "official-media-cases-index.md",
    expectedTerms: ["新聞挖挖哇", "老人愛愛大補帖", "官網文章"]
  },
  {
    question: "割包皮術後復原要多久的官網文章在哪？",
    source: "official-health-education-index.md",
    expectedTerms: ["割包皮術後復原", "術後傷口照護", "官網文章"]
  }
];

const GREETING_NO_RETRIEVAL_CASES = ["Hi", "你好", "您好"];

const SERVICE_QUESTION_TEMPLATES = [
  "診所有提供{term}嗎？",
  "我想問津久有沒有做{term}",
  "{term}可以在你們診所諮詢嗎？"
];

const SERVICE_CASE_ALIASES = new Map([
  ["包皮槍", ["包皮槍", "包皮環切"]],
  ["包皮槍手術", ["包皮槍", "包皮環切"]],
  ["無刀口男性結紮手術", ["男性結紮"]],
  ["男性私密處微創手術", ["陰莖增大", "龜頭減敏"]],
  ["攝護腺肥大治療", ["攝護腺肥大", "雷射剜除", "水蒸氣消融", "綠光雷射", "Urolift"]],
  ["腎結石", ["腎結石", "輸尿管結石"]],
  ["男性泌尿道感染", ["男性泌尿道感染", "攝護腺炎", "尿道炎"]],
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

const SERVICE_CASE_SOURCES = new Map([
  ["包皮槍", ["clinic-info.md", "circumcision.md"]],
  ["包皮槍手術", ["clinic-info.md", "circumcision.md"]],
  ["無刀口男性結紮手術", ["clinic-info.md", "vasectomy.md"]],
  ["男性私密處微創手術", ["clinic-info.md", "male-private-surgery.md"]],
  ["攝護腺肥大治療", ["clinic-info.md", "prostate.md"]],
  ["腎結石", ["clinic-info.md", "stone-treatment.md"]],
  ["男性泌尿道感染", ["clinic-info.md", "male-uti.md"]],
  ["100% 匿名篩檢", ["clinic-info.md", "std-prep-pep.md"]],
  ["HPV", ["clinic-info.md", "std-prep-pep.md", "vaccines.md"]],
  ["皮蛇疫苗", ["clinic-info.md", "vaccines.md"]],
  ["PrEP", ["clinic-info.md", "std-prep-pep.md"]],
  ["PEP", ["clinic-info.md", "std-prep-pep.md"]],
  ["性功能障礙治療", ["clinic-info.md", "sexual-function-shockwave.md"]],
  ["低能量震波治療", ["clinic-info.md", "sexual-function-shockwave.md"]],
  ["女性泌尿道問題", ["clinic-info.md", "female-urology-muscle-chair.md"]],
  ["美磁波鍛肌椅", ["clinic-info.md", "female-urology-muscle-chair.md"]],
  ["痔瘡微創手術", ["clinic-info.md", "anal-colorectal.md"]],
  ["客製化功能性修復點滴", ["clinic-info.md", "wellness-weight.md"]],
  ["猛健樂門診", ["clinic-info.md", "wellness-weight.md"]]
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
  ["H20-05：2026/6/6 是週六，津久診所晚上有一般門診嗎？如果沒有，週六哪個時段有診？", ["週六", "晚診", "休診", "09:30-12:30", "羅詩修醫師"], []],
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

  for (const { question, conversationHistory, expectedTerms, forbiddenTerms = [], now } of CONTEXTUAL_SCHEDULE_CASES) {
    const reply = answerPepVisitScheduleFollowUp(
      question,
      now ?? new Date("2026-06-01T00:00:00+08:00"),
      conversationHistory
    ) || answerFixedScheduleQuestion(
      question,
      now ?? new Date("2026-06-01T00:00:00+08:00"),
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

  for (const { question, conversationHistory, forbiddenTerms } of PEP_CONTEXT_NEGATIVE_CASES) {
    const reply = answerPepVisitScheduleFollowUp(question, new Date("2026-06-02T04:00:00+08:00"), conversationHistory);
    caseResults.push({
      type: "pep-context-negative",
      question,
      ok: !reply
    });

    if (reply) {
      issues.push(formatIssue(round, `PEP 脈絡不應攔截新主題：${question}`));
      for (const term of forbiddenTerms) {
        if (reply.includes(term)) {
          issues.push(formatIssue(round, `PEP 新主題誤答包含「${term}」：${question}`));
        }
      }
    }
  }

  for (const { question, conversationHistory, expectedTerms, forbiddenTerms = [] } of DOCTOR_INFO_CASES) {
    const reply = answerDoctorInfoQuestion(question, conversationHistory);
    caseResults.push(checkReplyCase({ round, type: "doctor-info", question, reply, expectedTerms, forbiddenTerms, issues }));
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

  for (const testCase of LINE_ANNOUNCEMENT_REPLY_CASES) {
    const { question, expectedTerms, forbiddenTerms = [] } = Array.isArray(testCase)
      ? { question: testCase[0], expectedTerms: testCase[1] }
      : testCase;
    const reply = answerLineVoomAnnouncementQuestion(question);
    caseResults.push(checkReplyCase({ round, type: "line-announcement-reply", question, reply, expectedTerms, forbiddenTerms, issues }));
  }

  for (const testCase of BASIC_INFO_CASES) {
    caseResults.push(checkRetrievalCase({ round, type: "basic-info", chunks, issues, ...testCase }));
  }

  for (const [question, expectedTerms] of BASIC_INFO_REPLY_CASES) {
    const reply = answerBasicInfoQuestion(question);
    caseResults.push(checkReplyCase({ round, type: "basic-info-reply", question, reply, expectedTerms, issues }));
  }

  for (const testCase of PROCEDURE_RETRIEVAL_CASES) {
    caseResults.push(checkRetrievalCase({ round, type: "procedure-retrieval", chunks, issues, ...testCase }));
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

  for (const question of ["我想問割包皮", "PEP 72小時內可以諮詢嗎", "低能量震波適合嗎"]) {
    const chunksForQuestion = retrieveRelevantChunks(chunks, question, 4);
    const reply = await draftReply({
      message: question,
      chunks: chunksForQuestion,
      shouldEscalate: false
    });

    caseResults.push(
      checkReplyCase({
        round,
        type: "official-link-reply",
        question,
        reply,
        expectedTerms: ["官網介紹：", "https://uromeeme.com/"],
        issues
      })
    );
  }

  for (const question of buildGeneratedQuestionList()) {
    const chunksForQuestion = retrieveRelevantChunks(chunks, question, 4);
    const reply =
      answerBasicInfoQuestion(question) ||
      answerLineVoomAnnouncementQuestion(question) ||
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
      sources: SERVICE_CASE_SOURCES.get(term) ?? ["clinic-info.md"],
      expectedTerms: SERVICE_CASE_ALIASES.get(term) ?? [term]
    }))
  );
}

function buildGeneratedQuestionList() {
  return [
    ...BASIC_INFO_CASES.map(({ question }) => question),
    ...PROCEDURE_RETRIEVAL_CASES.map(({ question }) => question),
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

function checkRetrievalCase({ round, type, chunks, question, source, sources, expectedTerms, issues }) {
  const matches = retrieveRelevantChunks(chunks, question, 4);
  const matchText = matches.map((chunk) => `${chunk.source}\n${chunk.content}`).join("\n");
  const expectedSources = sources ?? (source ? [source] : []);
  const hasExpectedSource = expectedSources.length === 0 || matches.some((chunk) => expectedSources.includes(chunk.source));
  const missingTerms = expectedTerms.filter((term) => !matchText.includes(term));

  if (!hasExpectedSource) {
    issues.push(formatIssue(round, `${type} 檢索沒有命中 ${expectedSources.join(" 或 ")}：${question}`));
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
