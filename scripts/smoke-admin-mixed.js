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
    name: "round19 general visit vaccine payment method avoids vaccine service routing",
    message: "Round19-1：看診或打疫苗可以刷卡、行動支付嗎？如果只能現金我就先去領錢。不要貼連結。",
    expected: ["付款方式", "刷卡", "行動支付", "現金", "不能在 LINE 直接保證", "02-2511-9488", "現場櫃台確認"],
    forbidden: ["HPV", "皮蛇", "匿名篩檢", "疫苗庫存", "庫存", "備苗", "醫療評估", "醫師評估", "看診/評估", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "round14 mixed HPV vaccine anonymous screening keeps service names",
    message: "Round14-3：我想同一天問 HPV 疫苗跟匿名篩檢，可以先到櫃台問流程跟費用，不一定當天做嗎？不要保證，短一點。",
    expected: ["HPV 疫苗", "匿名篩檢", "櫃台", "02-2511-9488", "流程/費用", "不一定當天做", "是否同日可做", "看診/評估", "備苗", "篩檢流程", "醫師/櫃台確認為準", "不保證當天做或金額"],
    forbidden: ["付款方式", "刷卡", "信用卡", "https://", "lin.ee", "官網介紹：", "保證今天一定能做", "保證金額"]
  },
  {
    name: "round19 circumcision counter fee asks admin flow without surgery risk",
    message: "Round19-4：我只是想先到櫃台問割包皮大概費用，不一定今天看診，可以嗎？如果要看診再說也可以。",
    expected: ["櫃台", "電話 02-2511-9488", "割包皮/包皮槍", "大概費用", "流程", "不一定今天看診", "實際費用", "依項目", "醫師評估", "現場流程確認", "LINE 或櫃台初問不能保證最後金額", "決定要看診", "現場安排掛號"],
    forbidden: ["手術評估", "快速通關", "出血", "血栓", "抗凝血", "抗血小板", "自行停藥", "心血管病史", "當天看診後手術", "留下姓名", "方便時段", "https://", "lin.ee", "官網介紹："]
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
    name: "round22 tomorrow friday night urinary schedule beats symptom education",
    message: "Round22-2：那明天晚上呢？一樣是一般泌尿嗎？我只想問頻尿，不想跑錯。短一點。",
    routedOnly: true,
    expected: ["頻尿/夜尿想看一般泌尿科", "明天（週五）晚診", "18:00-20:30", "手術時段", "不是一般門診", "週五可改一般門診時段", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師", "02-2511-9488"],
    forbidden: ["尿痛、頻尿或急尿可能有不同原因", "是否感染、該不該用抗生素", "抗生素", "高燒、劇痛、尿不出來、血尿或明顯很不舒服", "急診/立即就醫", "https://", "appointment", "線上掛號系統"]
  },
  {
    name: "round22 friday afternoon general urology doctor compared with dean",
    message: "Round22-3：那週五下午看一般泌尿的是誰？他跟院長專長差在哪？不要列太多。",
    routedOnly: true,
    expected: ["週五午診", "一般泌尿", "羅詩修醫師", "13:30-17:00", "院長是陳偉傑醫師", "羅醫師可先看一般泌尿/排尿相關問題", "陳院長", "男性私密/手術相關專長"],
    forbidden: ["週五午診（13:30-17:00）沒有陳偉傑醫師門診", "週五下午是陳偉傑", "週五午診是陳偉傑", "羅詩修醫師沒有", "沒有羅詩修醫師", "主治專長：", "精雕微創包皮槍手術、無刀口結紮手術、男性私密整形/陰莖增大手術", "https://", "appointment"]
  },
  {
    name: "round22 friday morning afternoon general urology does not hard pick doctor",
    message: "Round22-5：如果我只有明天早上或下午能去，頻尿想先看一般泌尿，院長跟羅醫師我要掛誰比較適合？不要幫我硬選。",
    routedOnly: true,
    expected: ["明天（週五）", "早診是院長陳偉傑醫師", "09:30-12:30", "午診是羅詩修醫師", "13:30-17:00", "頻尿/一般泌尿", "依自己能到的時段", "不硬選某一位", "名額與臨時異動", "電話或現場確認"],
    forbidden: ["主治專長：", "精雕微創包皮槍手術", "無刀口結紮手術", "男性私密整形/陰莖增大手術", "週五午診（13:30-17:00）是羅詩修醫師門診", "唯一", "一定掛", "抗生素", "高燒、劇痛、尿不出來、血尿或明顯很不舒服", "https://", "appointment"]
  },
  {
    name: "round24 tomorrow friday afternoon urology hpv blood report same number",
    message: "Round24-3：我明天下午想看一般泌尿，順便問 HPV 疫苗和抽血報告，可以同一個號處理嗎？不要貼連結。",
    expected: ["明天（週五）", "午診/下午", "13:30-17:00", "一般泌尿門診", "羅詩修醫師", "報到", "3 樓櫃台", "同一天想看一般泌尿", "詢問 HPV 疫苗", "抽血報告", "同一個號能否處理", "是否需分開掛號", "疫苗庫存/費用", "報告是否需醫師判讀或回診", "現場醫師/櫃台確認", "不能保證同日施打或同一號一定處理"],
    forbidden: ["這題我先幫你請醫師或診所人員確認", "確認後會再回覆你", "檢查報告需要醫師搭配病史", "官網列出診所有提供 HPV、皮蛇疫苗施打", "皮蛇疫苗", "https://", "lin.ee", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round24 tomorrow friday afternoon report vaccine can register urology",
    message: "Round24-4：那明天下午是哪位醫師？我如果只是問報告和疫苗，不想做治療，掛一般泌尿可以嗎？短一點。",
    expected: ["明天（週五）", "午診/下午", "一般泌尿", "羅詩修醫師", "13:30-17:00", "只是問報告和疫苗", "可先掛一般泌尿", "3 樓櫃台", "是否需看診", "能否同日處理", "疫苗/報告流程", "櫃台和醫師確認為準"],
    forbidden: ["這題我先幫你請醫師或診所人員確認", "確認後會再回覆你", "檢查報告需要醫師搭配病史", "官網列出診所有提供 HPV、皮蛇疫苗施打", "皮蛇疫苗", "https://", "lin.ee", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round24 tomorrow friday afternoon direct clinic time doctor ignores report context",
    message: "Round24-5：我只是想確認明天下午門診時間和醫師，跟前面報告問題無關。請直接回答。",
    expected: ["明天（週五）", "午診/下午", "13:30-17:00", "羅詩修醫師", "名額與臨時異動", "電話 02-2511-9488", "現場確認"],
    forbidden: ["這題我先幫你請醫師或診所人員確認", "確認後會再回覆你", "檢查報告需要醫師搭配病史", "報告需要醫師判讀", "報告", "https://", "lin.ee", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round18 near lunch clinic end asks counter deadline not doctor schedule",
    message: "Round18-1：我快到診所了，但午診快結束，最晚幾點前報到？如果超過 17:00 還能等加號嗎？請直接說。",
    expected: ["不能先保證", "壓線", "一定看得到", "17:00 後", "等加號", "午診 13:30-17:00", "診間時段", "最晚報到", "能否加號或候補", "電話", "現場櫃台確認", "快到診所", "3 樓櫃台", "02-2511-9488"],
    forbidden: ["固定門診", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "可先參考固定門診", "https://", "lin.ee"]
  },
  {
    name: "online registration forgot screenshot answers check-in without link",
    message: "我剛剛線上掛號了但忘記截圖，到現場怎麼報到？要帶健保卡嗎？",
    expected: ["3 樓櫃台", "姓名", "電話", "身分資料", "報到", "健保卡", "初診", "現場確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "保證"]
  },
  {
    name: "round21 phone dying registration proof unavailable counter lookup without link",
    message: "Round21-2：我手機快沒電，線上掛號的簡訊或截圖可能拿不出來，到櫃台還能查得到嗎？要報姓名還是電話？",
    expected: ["手機沒電", "簡訊", "截圖", "拿不出來", "3 樓櫃台", "姓名", "電話", "身分資料", "健保卡/身分證", "實際是否查得到掛號", "櫃台現場確認為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "固定門診", "陳偉傑醫師", "醫師專長", "地址", "捷運", "一定查得到", "保證查得到"]
  },
  {
    name: "round19 online registration wrong birthday phone counter correction without link",
    message: "Round19-3：我線上掛號時生日或電話好像填錯了，到現場可以改資料嗎？會不會找不到掛號？",
    expected: ["線上掛號", "生日", "電話", "填錯", "影響櫃台查詢", "健保卡/身分證", "3 樓櫃台", "核對", "協助查詢或修正資料", "不能保證一定找得到", "02-2511-9488"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "可直接線上修改", "一定可找到", "一定查得到"]
  },
  {
    name: "round20 online registration nickname mismatch counter correction without link",
    message: "Round20-1：我線上掛號時用暱稱，跟健保卡姓名不一樣，到現場會找不到嗎？可以請櫃台改嗎？",
    expected: ["線上掛號", "暱稱", "健保卡姓名", "不一樣", "影響櫃台查詢", "健保卡/身分證", "3 樓櫃台", "核對", "協助查詢或修正資料", "不能保證一定找得到", "02-2511-9488"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "可直接線上修改", "一定可找到", "一定查得到", "地址", "捷運", "固定門診", "醫師專長"]
  },
  {
    name: "round20 same day urology and shingles vaccine asks counter before vaccine routing",
    message: "Round20-3：我同一天想看泌尿科又順便問皮蛇疫苗，要分開掛號嗎？還是報到時先跟櫃台說？不要貼連結。",
    expected: ["報到", "3 樓櫃台", "同一天想看泌尿科", "詢問皮蛇疫苗", "是否需要分開掛號", "能不能同日處理", "疫苗庫存/費用", "醫師評估", "現場流程", "醫師/櫃台確認", "不能先保證同一天可以施打"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "只要確認庫存", "建議電話確認庫存", "官網列出", "適合性", "醫師專長", "固定門診"]
  },
  {
    name: "round20 missing wallet health card id near clinic avoids route answer",
    message: "Round20-4：我快到診所才發現錢包忘了，健保卡和身分證都不在身上，還能先報到嗎？還是要改天？請講重點。",
    expected: ["不能先保證", "健保卡/身分證", "可報到", "身份核對", "健保身分確認", "付款流程", "快到現場", "3 樓櫃台", "02-2511-9488", "補件", "改自費", "改天"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "地址", "捷運", "行天宮", "4 號出口", "現場排號", "固定門診", "醫師專長"]
  },
  {
    name: "round20 child stroller space family waiting avoids doctor schedule",
    message: "Round20-5：我看診時會帶一個小孩和推車，診間或候診區放得下嗎？如果不方便，我可以請家人在外面等嗎？",
    expected: ["診間", "候診區", "推車", "不能在 LINE 先保證", "到場先問櫃台", "02-2511-9488", "當天動線與空間", "家人", "外面等", "陪進診間", "現場安排", "病人需求", "需要協助", "告知櫃台"],
    forbidden: ["https://", "appointment", "預約掛號", "立即預約", "地址", "捷運", "固定門診", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "醫師專長", "疫苗庫存"]
  },
  {
    name: "round21 spouse visit status cannot be looked up in line",
    message: "Round21-4：我先生去看診但手機沒接，我可以在 LINE 問他有沒有報到或看完了嗎？你們可以幫我查一下嗎？",
    expected: ["報到", "看完", "個人就醫資訊", "不能直接在 LINE 幫家人查或透露", "病人本人聯絡診所", "身份確認/授權流程", "電話 02-2511-9488", "現場詢問", "安全或緊急狀況", "不能揭露就醫狀態"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "固定門診", "陳偉傑醫師", "醫師專長", "地址", "捷運", "已報到", "已看完", "還沒報到", "還沒看完"]
  },
  {
    name: "round14 first visit registered missing health card checks in at counter",
    message: "Round14-1：我第一次去，已經線上掛號，但健保卡忘在家，只有身分證，可以先報到看診嗎？講重點。",
    expected: ["第一次", "已經線上掛號", "3 樓櫃台", "報到", "健保卡忘帶", "櫃台現場核對為準", "健保身分", "自費", "補件", "身分證", "02-2511-9488"],
    forbidden: ["女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "費用目前知識庫", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round23 first visit health card read failure stays counter admin",
    message: "Round23-1：我第一次來但健保卡讀不到，能先自費看嗎？之後可以補健保退費嗎？不要保證。",
    expected: ["第一次看診", "健保卡讀不到", "系統", "卡片", "健保身分確認問題", "不能在 LINE 先保證", "先自費看診", "補健保", "退費", "補件", "3 樓櫃台", "現場健保身分與規定確認", "身分證/健保卡", "02-2511-9488"],
    forbidden: ["男性泌尿", "退尿", "美磁波", "磁波鍛肌椅", "女性泌尿", "漏尿", "公開費用未知", "費用目前知識庫", "知識庫沒有公開", "醫療療程", "療程", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
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
    expected: ["收據", "診斷證明", "電話 02-2511-9488", "櫃台", "補申請/補開", "醫師/病歷", "資料確認", "隔天", "本人", "家人代辦", "證件", "委託文件", "診所回覆為準"],
    forbidden: ["女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "醫療診斷"]
  },
  {
    name: "round23 diagnosis certificate medical summary after visit includes both",
    message: "Round23-4：看完診才想到要診斷證明或病歷摘要，可以隔天再申請嗎？需要本人去嗎？不要貼連結。",
    expected: ["診斷證明", "病歷摘要", "電話 02-2511-9488", "櫃台", "隔天補申請/補開", "醫師/病歷", "資料確認", "本人", "家人代辦", "證件", "委託文件", "費用", "處理時間", "櫃台/診所回覆為準"],
    forbidden: ["保險收據", "女性泌尿", "美磁波", "磁波鍛肌椅", "漏尿", "男性泌尿", "退尿", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "官網介紹："]
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
    name: "round18 lost receipt reprint and tax id after checkout stays admin",
    message: "Round18-4：上次看診的收據不見了，可以補印嗎？如果公司要統編，能不能後來再補上？請不要貼連結。",
    expected: ["收據", "補印", "公司報帳", "統編", "補上", "格式", "能否補開", "櫃台確認", "收據不見", "事後能否補上統編", "就診/結帳資料", "規定確認", "掛號或結帳前先說", "不能保證可改或補開"],
    forbidden: ["診斷證明", "醫師/病歷確認", "本人", "家人代辦", "委託文件", "https://", "appointment", "線上掛號系統", "預約掛號", "立即預約"]
  },
  {
    name: "round21 urine test process fee counter ask without registration overpromise",
    message: "Round21-5：我只是路過想先問尿液檢查流程和費用，不想留下資料或掛號，可以只問櫃台嗎？請短一點。",
    expected: ["櫃台", "電話 02-2511-9488", "尿液檢查流程/費用", "不一定先掛號", "實際檢查", "報告", "醫師判讀", "病歷/收費", "可能需要掛號與基本資料", "能否只問且不留資料", "現場櫃台為準"],
    forbidden: ["https://", "appointment", "線上掛號系統", "預約掛號", "立即預約", "固定門診", "陳偉傑醫師", "醫師專長", "地址", "捷運", "保證可以完全不留資料", "完全不用留下資料", "一定不用掛號", "尿路感染", "血尿", "頻尿"]
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
