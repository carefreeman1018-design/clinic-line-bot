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
  },
  {
    name: "round14 mixed HPV vaccine anonymous screening keeps service names",
    message: "Round14-3：我想同一天問 HPV 疫苗跟匿名篩檢，可以先到櫃台問流程跟費用，不一定當天做嗎？不要保證，短一點。",
    expected: ["HPV 疫苗", "匿名篩檢", "櫃台", "02-2511-9488", "流程/費用", "不一定當天做", "是否同日可做", "看診/評估", "備苗", "篩檢流程", "醫師/櫃台確認為準", "不保證當天做或金額"],
    forbidden: ["付款方式", "刷卡", "信用卡", "https://", "lin.ee", "官網介紹：", "保證今天一定能做", "保證金額"]
  },
  {
    name: "round16 monday night confirms general urology without appointment link",
    message: "Round16-2：那週一晚上呢？一樣是一般泌尿嗎，誰看？請短一點。",
    routedOnly: true,
    expected: ["週一晚診", "一般泌尿門診", "羅詩修醫師", "18:00-20:30", "臨時異動/名額", "電話或現場確認"],
    forbidden: ["https://", "lin.ee", "appointment", "線上掛號", "不是一般泌尿"]
  },
  {
    name: "round16 mixed HPV shingles anonymous screening keeps all items",
    message: "Round16-3：我同一天想問 HPV 疫苗、皮蛇疫苗跟匿名篩檢，可以只先問流程和費用，不一定做嗎？講重點。",
    expected: ["HPV 疫苗", "皮蛇疫苗", "匿名篩檢", "流程/費用", "不一定當天做", "是否同日可做", "看診/評估", "備苗", "篩檢流程", "醫師/櫃台確認為準", "不保證當天做或金額"],
    forbidden: ["https://", "lin.ee", "官網介紹：", "保證今天一定能做", "保證金額"]
  },
  {
    name: "round17 past line voom stop keeps services natural and not overpromised",
    message: "Round17-3：我看到之前 LINE VOOM 有寫 5/19 晚上李齊泰醫師停診，那天如果只是匿名篩檢或打疫苗還能去嗎？請不要貼連結，短一點。",
    routedOnly: true,
    expected: ["5/19 是過去 LINE VOOM 公告", "李齊泰醫師", "停診一次", "匿名篩檢", "疫苗接種服務照常", "最新安排請以最新公告或電話確認"],
    forbidden: ["100%匿名篩檢", "https://", "lin.ee", "可查看 LINE VOOM"]
  },
  {
    name: "round17 tomorrow friday night urinary frequency recommends general urology slots",
    message: "Round17-4：明天晚上如果不是一般泌尿，我頻尿要改掛哪個時段？不要列一堆。",
    routedOnly: true,
    expected: ["明天（週五）晚診", "18:00-20:30", "手術時段", "不是一般門診", "週五可改一般門診時段", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師"],
    forbidden: ["已線上掛號", "不能直接幫你改", "請用原本線上掛號系統", "https://", "lin.ee"]
  },
  {
    name: "online registration forgot screenshot answers check-in without link",
    message: "我剛剛線上掛號了但忘記截圖，到現場怎麼報到？要帶健保卡嗎？",
    expected: ["3 樓櫃台", "姓名", "電話", "身分資料", "報到", "健保卡", "初診", "現場確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "保證"]
  },
  {
    name: "round14 first visit registered missing health card checks in at counter",
    message: "Round14-1：我第一次去，已經線上掛號，但健保卡忘在家，只有身分證，可以先報到看診嗎？講重點。",
    expected: ["第一次", "已經線上掛號", "3 樓櫃台", "報到", "健保卡忘帶", "櫃台現場核對為準", "健保身分", "自費", "補件", "身分證", "02-2511-9488"],
    forbidden: ["女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "費用目前知識庫", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "online registration late arrival answers counter flow without link",
    message: "我已經線上掛號早診，但可能會晚到 20 分鐘，還看得到嗎？要不要先打電話？請講重點。",
    expected: ["已線上掛號", "晚到", "不能先保證", "20 分鐘", "02-2511-9488", "通知並確認", "報到時間", "醫師門診狀況", "號碼/名額", "健保卡/身分證", "3 樓櫃台報到"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round14 online registration cancellation avoids appointment link",
    message: "Round14-2：我臨時不能去，線上掛號要取消嗎？可以直接在 LINE 跟你說取消，還是要打電話？不要貼連結。",
    expected: ["臨時不能去", "建議先取消或改期", "LINE bot 不保證", "代你取消", "02-2511-9488", "櫃台確認", "線上掛號系統取消/改期"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿"]
  },
  {
    name: "two patients should not assume one registration number",
    message: "我已經線上掛號了，但想陪我爸一起看，兩個人可以用同一個號嗎？還是要各自掛號？",
    expected: ["不要先假設", "共用同一個掛號號碼", "每位病人", "各自的掛號資料", "身分資料", "健保卡", "爸爸", "加掛另一位", "相近時段", "櫃台確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "medication bag refill without visit avoids doctor schedule routing",
    message: "我上次的藥吃完了，等一下只拿藥袋給櫃台看，可以不看診直接拿一樣的藥嗎？",
    expected: ["不能先保證", "不用看診", "直接拿藥", "一樣的藥", "藥袋", "健保卡", "身分證", "櫃台", "醫師確認", "適合續拿", "需要看診調整", "發燒", "劇烈疼痛", "尿不出來", "02-2511-9488"],
    forbidden: ["固定門診", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "早診", "午診", "晚診", "https://", "lin.ee", "官網介紹：", "可以不看診"]
  },
  {
    name: "round14 certificate receipt after visit gives short admin boundary",
    message: "Round14-5：如果我看完才想到要保險收據和診斷證明，可以隔天補開嗎？要本人去嗎？不要講太長。",
    expected: ["保險收據", "診斷證明", "電話 02-2511-9488", "櫃台", "補開", "醫師/病歷確認", "隔天", "本人", "家人代辦", "證件", "委託文件", "診所回覆為準"],
    forbidden: ["女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "醫療診斷"]
  },
  {
    name: "round15 wheelchair dropoff avoids guaranteed parking or entrance",
    message: "Round15-1：我爸坐輪椅，我可以先在門口讓他下車再去停車嗎？電梯入口好找嗎？不要保證。",
    expected: ["不能保證門口可臨停或下車", "現場交通", "大樓入口狀況", "家人到入口", "櫃台協助", "02-2511-9488", "搭電梯到 3 樓", "入口或電梯位置不確定", "電話詢問"],
    forbidden: ["保證可停", "保證可以停", "一定可以臨停", "一定可臨停", "一定可下車", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "round15 doctor designation preference asks counter before deciding",
    message: "Round15-3：我看泌尿問題可以指定男醫師嗎？如果當天只有別的醫師，可以先問櫃台再決定嗎？短一點。",
    expected: ["想指定醫師", "偏好男醫師", "能否指定", "當天是否由指定醫師看", "是否可改掛/等候", "門診表", "名額", "櫃台確認", "其他醫師", "先向櫃台詢問再決定", "不能保證一定改到"],
    forbidden: ["固定門診表目前有", "想查哪位的時段", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "round15 company receipt title tax id before checkout",
    message: "Round15-5：公司報帳要收據抬頭或統編，可以看完才請櫃台開嗎？還是掛號時要先說？",
    expected: ["公司報帳", "收據", "抬頭", "統編", "格式", "能否補開", "櫃台確認", "掛號或結帳前先說", "結帳後格式不能改", "看完才想到", "02-2511-9488", "不能保證可改或補開"],
    forbidden: ["診斷證明", "醫師/病歷確認", "本人", "家人代辦", "委託文件", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "friday surgery schedule keeps counter fee question",
    message: "我週五晚上下班才有空，看到好像是手術時段，那可以看一般泌尿或只去問費用嗎？不要貼連結。",
    routedOnly: true,
    expected: ["週五", "晚診", "18:00-20:30", "手術時段", "不是一般門診", "週五可改一般門診時段", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師", "只想先問費用或付款方式", "電話 02-2511-9488", "櫃台", "實際費用", "依項目", "評估", "流程", "LINE 不能保證價格", "一定可刷卡"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "friday surgery schedule beats female urology fee follow-up history",
    message: "重測二 Round13-1：我週五晚上下班才有空，看到好像是手術時段，那可以看一般泌尿或只去問費用嗎？不要貼連結。",
    routedOnly: true,
    conversationHistory: [
      { role: "assistant", content: "女性頻尿、漏尿建議先看泌尿科/醫師找原因。泌尿科門診是做診斷評估，會看是否感染、膀胱過動、應力性尿失禁或其他問題。美磁波/磁波鍛肌椅偏向骨盆底訓練或輔助療程，不能取代診斷；適不適合要由醫師評估後決定。" }
    ],
    expected: ["週五", "晚診", "18:00-20:30", "手術時段", "不是一般門診", "週五可改一般門診時段", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師", "只想先問費用或付款方式", "電話 02-2511-9488", "櫃台", "實際費用", "依項目", "評估", "流程", "LINE 不能保證價格", "一定可刷卡"],
    forbidden: ["女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "骨盆底", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  }
];

const issues = [];

for (const testCase of cases) {
  const directReply = answerAdminMixedQuestion(testCase.message) ?? "";
  const { reply } = await buildReplyAndMatches(testCase.message, [], testCase.conversationHistory ?? []);

  if (!testCase.routedOnly && directReply !== reply) {
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
