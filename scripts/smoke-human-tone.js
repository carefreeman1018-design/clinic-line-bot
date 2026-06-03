import { draftReply } from "../src/ai.js";
import { answerAnalColorectalQuestion } from "../src/anal-colorectal.js";
import { answerLineVoomAnnouncementQuestion } from "../src/announcements.js";
import { answerBasicInfoQuestion } from "../src/basic-info.js";
import { answerFemaleUrologyQuestion } from "../src/female-urology.js";
import { answerFournierGangreneQuestion } from "../src/fournier-gangrene.js";
import { answerHematospermiaQuestion } from "../src/hematospermia.js";
import { answerMaleFertilityQuestion } from "../src/male-fertility.js";
import { answerMalePrivateSurgeryQuestion } from "../src/male-private.js";
import { answerMaleUtiUrgentQuestion } from "../src/male-uti.js";
import { answerParaphimosisQuestion } from "../src/paraphimosis.js";
import { answerPenileFractureQuestion } from "../src/penile-fracture.js";
import { answerPriapismQuestion } from "../src/priapism.js";
import { answerProstateQuestion } from "../src/prostate.js";
import { answerReportResultQuestion } from "../src/report-results.js";
import { answerFixedScheduleQuestion, answerPepVisitScheduleFollowUp } from "../src/schedule.js";
import { answerSexualFunctionQuestion } from "../src/sexual-function.js";
import { answerCircumcisionFastPassQuestion } from "../src/surgery.js";
import { answerStdTreatmentQuestion } from "../src/std-treatment.js";
import { answerStoneQuestion } from "../src/stone-treatment.js";
import { answerTesticularTorsionQuestion } from "../src/testicular-torsion.js";
import { answerVasectomyQuestion } from "../src/vasectomy.js";
import { answerVaccineQuestion } from "../src/vaccines.js";
import { answerWellnessWeightQuestion } from "../src/wellness-weight.js";
import { answerWoundCareQuestion } from "../src/wound-care.js";

async function buildTestReply(message, conversationHistory = []) {
  process.env.NODE_ENV = "test";
  const { buildReplyAndMatches } = await import("../src/index.js");
  const { reply } = await buildReplyAndMatches(message, [], conversationHistory);
  return reply;
}

const cases = [
  {
    name: "possible pregnancy uti fever blocks muscle chair and leftover antibiotics",
    reply: answerFemaleUrologyQuestion("我是女生，月經晚了快一週不確定有沒有懷孕，這兩天尿尿很痛、尿有點紅，今天腰痠痛又發燒，但我本來也有漏尿，想問能不能今天直接坐美磁波鍛肌椅？可以先吃家裡剩的抗生素嗎？我有點緊張，先跟我說下一步。"),
    expected: ["尿痛", "尿紅", "腰痠", "發燒", "月經晚", "不確定是否懷孕", "泌尿道感染", "孕期感染", "LINE 不能診斷", "先不要坐美磁波鍛肌椅", "不要自行吃家裡剩的抗生素", "漏尿或療程問題先延後", "醫師評估", "適合用藥", "02-2511-9488", "急診", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃", "可以直接坐", "今天能不能直接做，需確認上述狀況後再安排", "費用目前知識庫沒有公開明確數字", "女性泌尿/漏尿和美磁波費用可以之後再確認"]
  },
  {
    name: "post vasectomy swelling fever beats torsion route",
    reply:
      answerWoundCareQuestion("我做完男性結紮第 2 天，陰囊越來越腫，瘀青範圍變大，傷口還有一點滲血，現在很痛又有點發燒。可以冰敷吃止痛藥等明天嗎？還是要現在回診或急診？我有點緊張，先跟我說下一步。") ||
      answerVasectomyQuestion("我做完男性結紮第 2 天，陰囊越來越腫，瘀青範圍變大，傷口還有一點滲血，現在很痛又有點發燒。可以冰敷吃止痛藥等明天嗎？還是要現在回診或急診？我有點緊張，先跟我說下一步。") ||
      answerTesticularTorsionQuestion("我做完男性結紮第 2 天，陰囊越來越腫，瘀青範圍變大，傷口還有一點滲血，現在很痛又有點發燒。可以冰敷吃止痛藥等明天嗎？還是要現在回診或急診？我有點緊張，先跟我說下一步。"),
    expected: ["結紮後第 2 天", "陰囊越來越腫", "瘀青變大", "傷口滲血", "很痛", "發燒", "不能只用 LINE 判斷", "術後血腫", "感染", "持續出血", "不建議", "冰敷", "止痛藥", "等到明天", "02-2511-9488", "急診", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "16 歲", "睪丸扭轉", "黃金六小時", "可以冰敷", "可以等明天", "男性無刀口結紮手術評估", "前 2 週", "釘子旁黃黃", "不要碰水"]
  },
  {
    name: "pde5 cardiac nitrate risk blocks direct medication",
    reply: answerSexualFunctionQuestion("我 58 歲，最近勃起硬度不太夠，想問能不能今天直接拿威而鋼或犀利士。我有心臟病，胸悶時會含硝化甘油，血壓藥也在吃。你們可以直接開藥嗎？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["心臟病", "胸悶", "硝化甘油", "威而鋼", "犀利士", "硝酸鹽", "不可自行", "PDE5 抑制劑", "危險低血壓", "LINE 不能直接開藥或報價", "心血管評估", "用藥清單", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以今天直接拿", "可以直接開藥", "費用", "診所有提供性功能障礙評估與治療，包含勃起功能障礙"]
  },
  {
    name: "genital blister ulcer gives STD evaluation and medication boundary",
    reply: answerStdTreatmentQuestion("我陰莖上這兩天冒出一排小水泡，今天有點破皮潰瘍、很刺痛，還有點發燒。朋友說可能是皰疹，也可能是梅毒，叫我自己先擦藥膏或吃剩下的抗生素。我的伴侶也需要檢查嗎？我有點緊張，先跟我說下一步。"),
    expected: ["陰莖水泡", "破皮潰瘍", "刺痛", "皰疹", "梅毒", "LINE 不能只靠文字診斷或開藥", "不建議自己先擦藥膏", "吃剩下的抗生素", "伴侶", "檢查或篩檢", "發燒", "今天儘快就醫", "性病篩檢/治療門診", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先擦", "可以先吃", "自行買藥", "性病篩檢與治療需要依症狀、病灶與檢查結果由醫師判斷。LINE 不能線上診斷或開藥；建議預約門診"]
  },
  {
    name: "fournier gangrene risk beats testicular torsion route",
    reply:
      answerFournierGangreneQuestion("我爸 70 歲有糖尿病，今天陰囊和會陰部突然紅腫很痛，有一塊皮膚變黑，還發燒、整個人有點昏沉。這可以等明天門診嗎？你們今天能不能直接處理？我有點緊張，先跟我說下一步。") ||
      answerTesticularTorsionQuestion("我爸 70 歲有糖尿病，今天陰囊和會陰部突然紅腫很痛，有一塊皮膚變黑，還發燒、整個人有點昏沉。這可以等明天門診嗎？你們今天能不能直接處理？我有點緊張，先跟我說下一步。"),
    expected: ["70 歲", "糖尿病", "陰囊", "會陰", "皮膚變黑", "發燒", "昏沉", "佛尼爾氏壞疽", "快速惡化感染", "LINE 不能診斷", "不建議等明天門診", "敗血症", "急診", "立即就醫", "廣效抗生素", "緊急清創", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "16 歲", "睪丸扭轉", "黃金六小時", "可以等明天", "先預約門診"]
  },
  {
    name: "fournier warning does not invent age or diabetes",
    reply: answerFournierGangreneQuestion("我陰囊跟會陰這兩天腫起來很痛，皮膚有點變黑，今天還發燒。這可以明天再去掛號嗎？還是先去急診？"),
    expected: ["陰囊", "會陰", "皮膚變黑", "發燒", "佛尼爾氏壞疽", "快速惡化感染", "LINE 不能診斷", "不建議等明天門診", "敗血症", "急診", "立即就醫", "廣效抗生素", "緊急清創", "02-2511-9488"],
    forbidden: ["70 歲", "糖尿病", "官網介紹：", "https://", "lin.ee", "16 歲", "睪丸扭轉", "黃金六小時", "可以等明天", "先預約門診"]
  },
  {
    name: "teen sudden testicular pain gives torsion emergency boundary",
    reply:
      answerTesticularTorsionQuestion("我兒子 16 歲，剛剛運動後突然左邊睪丸痛到走不了，陰囊也有點腫，沒有明顯外傷。可以先吃止痛藥觀察到明天嗎？你們今天能不能直接檢查或處理？我有點緊張，先跟我說下一步。") ||
      answerMaleUtiUrgentQuestion("我兒子 16 歲，剛剛運動後突然左邊睪丸痛到走不了，陰囊也有點腫，沒有明顯外傷。可以先吃止痛藥觀察到明天嗎？你們今天能不能直接檢查或處理？我有點緊張，先跟我說下一步。"),
    expected: ["16 歲", "突然單側睪丸痛", "陰囊腫", "睪丸扭轉", "急性陰囊", "LINE 不能直接診斷", "不建議", "止痛藥", "拖到隔天", "缺血風險", "黃金六小時", "急診", "立即就醫", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃止痛藥", "觀察到明天", "先預約門診", "不用急診"]
  },
  {
    name: "adult sudden testicular pain preserves stated age",
    reply: answerTesticularTorsionQuestion("我 28 歲，今天下午突然左邊睪丸很痛，走路會痛，陰囊有點腫。可以先吃止痛藥睡一晚明天再看嗎？"),
    expected: ["28 歲", "突然單側睪丸痛", "陰囊腫", "走路受影響", "睪丸扭轉", "急性陰囊", "LINE 不能直接診斷", "不建議", "止痛藥", "拖到隔天", "缺血風險", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["16 歲", "十六歲", "官網介紹：", "https://", "lin.ee", "可以先吃止痛藥", "睡一晚", "明天再看", "先預約門診", "不用急診"]
  },
  {
    name: "priapism after erectile medication gives urgent boundary",
    reply:
      answerPriapismQuestion("我昨晚吃了朋友給的威而鋼，現在已經勃起快 5 個小時還退不下來，陰莖很痛。我可以先冰敷或睡一覺等它退嗎？你們今天能不能直接幫我處理？我有點緊張，先跟我說下一步。") ||
      answerSexualFunctionQuestion("我昨晚吃了朋友給的威而鋼，現在已經勃起快 5 個小時還退不下來，陰莖很痛。我可以先冰敷或睡一覺等它退嗎？你們今天能不能直接幫我處理？我有點緊張，先跟我說下一步。"),
    expected: ["勃起快 5 小時", "退不下來", "陰莖疼痛", "持續勃起", "缺血風險", "LINE 不能直接診斷", "不建議只冰敷", "睡覺", "等待自行消退", "立即就醫", "急診", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "先預約泌尿科門診", "可以先冰敷", "等它退", "不用急診", "低能量震波"]
  },
  {
    name: "penile fracture warning beats sexual function route",
    reply:
      answerPenileFractureQuestion("剛剛做愛時陰莖突然啪一聲，馬上軟掉，現在腫起來又瘀青很痛。我可以先冰敷等明天再看嗎？") ||
      answerSexualFunctionQuestion("剛剛做愛時陰莖突然啪一聲，馬上軟掉，現在腫起來又瘀青很痛。我可以先冰敷等明天再看嗎？"),
    expected: ["陰莖突然啪一聲", "馬上軟掉", "腫脹", "瘀青", "明顯疼痛", "陰莖折斷", "白膜破裂", "急症", "LINE 不能診斷", "不建議只冰敷", "等到明天", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "性功能障礙評估與治療", "先預約泌尿科門診", "低能量震波", "可以先冰敷", "可以等明天", "不用急診"]
  },
  {
    name: "paraphimosis urgent question beats wound care memory",
    reply:
      answerParaphimosisQuestion("我昨晚性行為後包皮翻下來卡在龜頭後面，現在龜頭腫紫、很痛，尿也有點尿不出來。我可以自己硬推回去或等明天再掛號嗎？你們今天能不能直接處理？我有點緊張，先跟我說下一步。") ||
      answerWoundCareQuestion("我昨晚性行為後包皮翻下來卡在龜頭後面，現在龜頭腫紫、很痛，尿也有點尿不出來。我可以自己硬推回去或等明天再掛號嗎？你們今天能不能直接處理？我有點緊張，先跟我說下一步。"),
    expected: ["包皮卡在龜頭", "龜頭腫紫", "很痛", "尿不太出來", "嵌頓性包莖", "LINE 不能直接診斷", "不建議自己硬推", "不建議等到明天", "立即就醫", "急診", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "術後", "釘子", "前 2 週", "不要碰水", "拍清楚照片", "可以自己硬推", "等明天"]
  },
  {
    name: "stone fever pain medication and same-day lithotripsy boundary",
    reply: answerStoneQuestion("我現在左腰痛到冒冷汗，尿有點紅，還有發燒，怕是輸尿管結石。可以先吃止痛藥等明天嗎？你們今天能不能直接幫我體外震波或鈥雷射碎石？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["尿色發紅", "腰痛", "側腹痛", "發燒", "腎臟", "輸尿管", "感染", "結石合併感染", "LINE 不能判斷", "急診", "立即就醫", "不建議", "止痛藥", "撐到明天", "體外震波", "鈥雷射碎石", "費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃", "等明天", "今天能直接", "可以直接", "元"]
  },
  {
    name: "prostate treatment preserves ejaculation catheter same-day boundary",
    reply: answerProstateQuestion("我爸爸 72 歲，夜尿很多、尿流很細，想問攝護腺肥大治療。Rezum 水蒸氣、Urolift、綠光雷射或雷射剜除哪個最好？可以保證保留射精、不用插尿管嗎？今天能不能直接做？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["攝護腺肥大", "雷射剜除", "水蒸氣消融", "綠光雷射", "Urolift", "醫師", "攝護腺大小", "症狀", "身體狀況", "不能直接判斷", "不能先保證", "保留射精", "不用插尿管", "今天", "直接手術", "費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "哪個最好", "可以保證", "不用評估", "可以直接做", "元"]
  },
  {
    name: "prostate question after circumcision context does not inherit old topic",
    reply: await buildTestReply(
      "我爸夜尿很多、尿流越來越細，想問攝護腺肥大。水蒸氣、Urolift、綠光雷射哪個比較適合？可以保證不插尿管、保留射精嗎？今天能直接處理嗎？",
      [
        { role: "user", content: "我想做割包皮手術，有推薦的醫生嗎？" },
        { role: "assistant", content: "割包皮/包皮槍可先掛泌尿科或男性門診評估。" },
        { role: "user", content: "那今天如果要先諮詢包皮槍，這幾位醫師分別是什麼時段？" },
        { role: "assistant", content: "今天（週二）可先參考這幾位有包皮手術相關專長的門診。" }
      ]
    ),
    expected: ["攝護腺肥大", "水蒸氣消融", "綠光雷射", "Urolift", "醫師", "攝護腺大小", "症狀", "身體狀況", "不能直接判斷", "不能先保證", "保留射精", "不用插尿管", "02-2511-9488"],
    forbidden: ["割包皮", "包皮槍", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "官網介紹：", "https://", "lin.ee", "可以保證"]
  },
  {
    name: "acute urinary retention beats prostate procedure pricing",
    reply: answerProstateQuestion("我爸 78 歲，本來就攝護腺肥大，今天從早上開始幾乎尿不出來，下腹脹到很痛、一直冒冷汗。他想問可不可以撐到明天門診，順便直接做 Urolift 或水蒸氣消融？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["幾乎尿不出來", "下腹脹痛", "冒冷汗", "急性尿液滯留", "泌尿道阻塞", "LINE 不能直接診斷", "不建議撐到明天", "不能先安排 Urolift", "水蒸氣消融", "費用", "導尿", "急診", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "先預約泌尿科門診", "確認可評估時段", "可以撐到明天", "可以直接做", "元"]
  },
  {
    name: "urinary retention follow-up beats fixed schedule",
    reply: await buildTestReply(
      "那如果他今天幾乎尿不出來，下腹脹到很痛，還一直冒冷汗，這樣可以明天再去門診嗎？",
      [
        { role: "user", content: "我爸最近晚上一直起來尿，尿也變細，想了解攝護腺肥大。" },
        { role: "assistant", content: "攝護腺肥大治療需由醫師依攝護腺大小與症狀評估。" }
      ]
    ),
    expected: ["幾乎尿不出來", "下腹脹痛", "冒冷汗", "急性尿液滯留", "泌尿道阻塞", "LINE 不能直接診斷", "不建議撐到明天", "導尿", "急診", "立即就醫"],
    forbidden: ["固定門診", "早診", "午診", "晚診", "羅詩修醫師", "陳偉傑醫師", "先預約泌尿科門診", "明天再去門診", "可以明天", "https://", "官網介紹："]
  },
  {
    name: "vaccine memory does not intercept acute urinary retention",
    reply:
      answerVaccineQuestion("我爸 78 歲，本來就攝護腺肥大，今天從早上開始幾乎尿不出來，下腹脹到很痛、一直冒冷汗。他想問可不可以撐到明天門診，順便直接做 Urolift 或水蒸氣消融？費用多少？我有點緊張，先跟我說下一步。", [
        { role: "user", content: "我想問九價 HPV 疫苗和皮蛇疫苗，今天能不能一起打？費用多少？" },
        { role: "assistant", content: "官網列出診所有提供 HPV 疫苗施打，也有提到 HPV 九價疫苗。官網主要診療項目有列出皮蛇疫苗施打。" }
      ]) || answerProstateQuestion("我爸 78 歲，本來就攝護腺肥大，今天從早上開始幾乎尿不出來，下腹脹到很痛、一直冒冷汗。他想問可不可以撐到明天門診，順便直接做 Urolift 或水蒸氣消融？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["急性尿液滯留", "不建議撐到明天", "急診", "立即就醫", "導尿"],
    forbidden: ["HPV 疫苗", "九價", "皮蛇疫苗", "疫苗施打", "兩種疫苗", "庫存"]
  },
  {
    name: "mounjaro thyroid pancreatitis history and weight loss promise stays bounded",
    reply: answerWellnessWeightQuestion("我 BMI 大概 29，想問猛健樂減重。我有在吃糖尿病藥，家人有甲狀腺癌病史，之前也曾經胰臟發炎。你們可以今天直接打一針嗎？能保證瘦幾公斤？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["猛健樂門診", "體重管理輔助療法", "不能在線上判斷", "直接安排施打", "BMI", "共病", "糖尿病藥", "甲狀腺癌", "胰臟炎", "確認風險", "不能保證", "瘦幾公斤", "費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以今天直接打", "可以直接打一針", "保證瘦", "元"]
  },
  {
    name: "mounjaro postpartum breastfeeding leftover pen blocks dose advice",
    reply: answerWellnessWeightQuestion("我產後還在餵母奶，朋友有剩下的猛健樂藥筆，我可以先自己打一點點試試看嗎？你們可以直接告訴我最低劑量嗎？"),
    expected: ["猛健樂門診", "產後", "哺乳", "朋友剩下的藥筆", "不能直接施打", "不建議自行使用", "不能在線上告訴你最低劑量", "mg", "醫師評估後開立", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以今天直接打", "可以自行", "2.5 mg", "5 mg", "費用", "BMI", "共病", "不能保證會瘦幾公斤", "元"]
  },
  {
    name: "mounjaro post-injection vomiting abdominal pain blocks next dose",
    reply: answerWellnessWeightQuestion("我上週打猛健樂後這幾天一直噁心，有吐兩次，肚子也悶痛。下一針還可以照打嗎？需要先回診嗎？"),
    expected: ["猛健樂門診", "施打後", "噁心", "嘔吐", "腹痛", "下一針不要自行照打", "不要自行調劑量", "回診", "醫師評估", "延後", "調整或停用", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "費用", "BMI", "共病", "體重管理輔助療法", "不能保證會瘦幾公斤", "可以照打", "自行調整劑量", "元"]
  },
  {
    name: "wellness drip beats vaccine memory follow-up",
    reply:
      answerWellnessWeightQuestion("我最近熬夜很累、喝酒也比較多，想打那種護肝跟免疫提升的點滴。你們可以保證打完就恢復精神嗎？今天能不能直接打？費用多少？我有點緊張，先跟我說下一步。") ||
      answerVaccineQuestion("我最近熬夜很累、喝酒也比較多，想打那種護肝跟免疫提升的點滴。你們可以保證打完就恢復精神嗎？今天能不能直接打？費用多少？我有點緊張，先跟我說下一步。", [
        { role: "user", content: "我想打 HPV 疫苗，也想問皮蛇疫苗，今天能不能直接打？" }
      ]),
    expected: ["客製化功能性修復點滴", "免疫提升", "元氣護肝", "排毒疲勞解酒", "不能保證", "今天能不能施打", "醫師評估", "費用", "02-2511-9488"],
    forbidden: ["HPV", "皮蛇疫苗", "庫存", "劑數", "可以保證", "保證恢復", "https://", "lin.ee"]
  },
  {
    name: "vaccine memory ignores wellness drip question",
    reply: answerVaccineQuestion("我最近熬夜很累、喝酒也比較多，想打那種護肝跟免疫提升的點滴。你們可以保證打完就恢復精神嗎？今天能不能直接打？費用多少？我有點緊張，先跟我說下一步。", [
      { role: "user", content: "我想打 HPV 疫苗，也想問皮蛇疫苗，今天能不能直接打？" }
    ]) ?? "",
    expected: [""],
    forbidden: ["HPV", "皮蛇疫苗", "疫苗施打", "庫存", "劑數"]
  },
  {
    name: "anal wart hemorrhoid same-night procedure keeps boundary",
    reply: answerAnalColorectalQuestion("我肛門附近長了幾顆小肉芽，會癢也有點痛，朋友說可能是菜花但我也怕是痔瘡。今天晚上可以直接看完就電燒或做痔瘡手術嗎？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["肛門性病", "肛門直腸外科", "肛門菜花", "LINE 判斷", "當天直接電燒", "痔瘡", "手術", "不能先保證", "費用", "醫師評估", "今天晚上", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接電燒", "可以直接做", "元", "HPV 疫苗", "PEP", "72 小時"]
  },
  {
    name: "line voom outage notice takes priority over hpv vaccine service",
    reply:
      answerLineVoomAnnouncementQuestion("我看到 LINE VOOM 說 2026/5/19 晚上李齊泰醫師停診。那天如果我只是要做匿名篩檢或打 HPV 疫苗，還可以去嗎？我在外面不方便看長文，簡短回答。") ||
      answerVaccineQuestion("我看到 LINE VOOM 說 2026/5/19 晚上李齊泰醫師停診。那天如果我只是要做匿名篩檢或打 HPV 疫苗，還可以去嗎？我在外面不方便看長文，簡短回答。"),
    expected: ["5/19", "李齊泰醫師", "停診一次", "100%匿名篩檢", "疫苗接種服務照常營業"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "價格", "庫存", "劑數", "是否適合施打", "需由醫師或診所人員"]
  },
  {
    name: "anal bleeding pain hemorrhoid surgery routes to colorectal clinic",
    reply: answerAnalColorectalQuestion("我大便後看到鮮紅色血，肛門很痛，旁邊好像有一顆腫塊。這是不是痔瘡？你們可以直接做痔瘡微創手術嗎？今天要掛哪一科？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["肛門直腸外科", "痔瘡", "廔管", "肛裂", "痔瘡微創手術評估", "不能只用 LINE 判斷", "不能保證當天直接手術", "02-2511-9488", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是痔瘡", "可以直接做", "元", "PEP", "72 小時"]
  },
  {
    name: "pep memory does not intercept anal colorectal question",
    reply: answerPepVisitScheduleFollowUp(
      "我大便後看到鮮紅色血，肛門很痛，旁邊好像有一顆腫塊。這是不是痔瘡？你們可以直接做痔瘡微創手術嗎？今天要掛哪一科？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "post circumcision swelling yellow discharge avoids diagnosis",
    reply: answerWoundCareQuestion("我割包皮第 5 天，龜頭有點水腫，釘子旁邊黃黃的，是不是流膿？可以洗澡或自己多擦藥膏嗎？我在外面不方便看長文，先講重點。"),
    expected: ["術後第 5 天", "LINE 不能直接判斷", "前 2 週", "不要碰水", "不要自行加量", "拍清楚照片", "02-2511-9488", "盡快就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "確定是感染", "不是感染", "可以洗澡", "自己多擦", "不用回診"]
  },
  {
    name: "post circumcision day three wound care beats surgery booking",
    reply:
      answerWoundCareQuestion("我割包皮第 3 天，釘子附近黃黃的、龜頭有點腫，紗布也有一點血。這是不是感染？我可以今天洗澡、自己多擦藥膏嗎？我現在有點慌，先跟我說該怎麼做。") ||
      answerCircumcisionFastPassQuestion("我割包皮第 3 天，釘子附近黃黃的、龜頭有點腫，紗布也有一點血。這是不是感染？我可以今天洗澡、自己多擦藥膏嗎？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["術後第 3 天", "LINE 不能直接判斷", "感染", "前 2 週", "不要碰水", "不要自行加量", "拍清楚照片", "02-2511-9488", "盡快就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "快速通關", "當天看診後手術", "手術評估", "實際費用", "可以洗澡", "自己多擦"]
  },
  {
    name: "wart ointment duration avoids online prescription",
    reply: answerStdTreatmentQuestion("我覺得可能是菜花，藥膏要擦幾天？可以自己買來擦嗎？我在外面不方便看長文，先講重點。"),
    expected: ["菜花", "HPV", "LINE 不能診斷", "藥膏要擦幾天", "自行買藥", "醫師確認", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以自己買", "擦 7 天", "擦七天", "擦兩週", "元"]
  },
  {
    name: "wart medication question is not routed to wound care",
    reply:
      answerWoundCareQuestion("我私密處長了幾顆小肉芽，朋友說可能是菜花。你可以直接看文字判斷是不是嗎？藥膏要擦幾天、能不能自己買來擦？伴侶需要一起檢查嗎？我現在有點慌，先跟我說該怎麼做。") ||
      answerStdTreatmentQuestion("我私密處長了幾顆小肉芽，朋友說可能是菜花。你可以直接看文字判斷是不是嗎？藥膏要擦幾天、能不能自己買來擦？伴侶需要一起檢查嗎？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["菜花", "HPV", "LINE 不能診斷", "藥膏要擦幾天", "自行買藥", "伴侶", "醫師", "醫師確認", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "術後", "水腫", "前 2 週", "不要碰水", "換藥方式", "擦 7 天", "擦兩週"]
  },
  {
    name: "partner wart leftover ointment and same-day cautery stay bounded",
    reply: answerStdTreatmentQuestion("我男友前幾天被說是菜花，我自己陰道口也摸到小肉芽。可以先擦他剩下的藥膏嗎？今天去能不能直接電燒？"),
    expected: ["菜花", "HPV", "看病灶", "LINE 不能診斷", "不要自行買藥", "自己擦", "伴侶剩下的藥膏", "伴侶", "檢查或篩檢", "電燒", "醫師確認後安排", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先擦", "可以直接電燒", "保證", "元"]
  },
  {
    name: "wart topic that negates pep does not trigger pep answer",
    reply: answerStdTreatmentQuestion("我剛剛不是問 PEP 了，現在換問另一件事：私密處長小肉芽，朋友說可能是菜花。只看文字可以判斷嗎？藥膏要擦幾天、能不能自己買？伴侶要不要一起檢查？我有點緊張，先跟我說下一步。"),
    expected: ["菜花", "HPV", "LINE 不能診斷", "藥膏要擦幾天", "自行買藥", "伴侶", "醫師", "02-2511-9488"],
    forbidden: ["PEP 需", "72 小時", "保險套破", "無套", "暴露後", "官網介紹：", "https://", "lin.ee", "擦 7 天", "擦兩週"]
  },
  {
    name: "pep condom broke at 60 hours gives urgent next step and anonymous screening",
    reply: answerStdTreatmentQuestion("我昨天晚上保險套破掉，現在大概過了 60 小時，我是不是要吃 PEP？可以直接去拿藥嗎？我也想匿名驗性病，我現在有點慌，先跟我說該怎麼做。"),
    expected: ["60 小時", "72 小時", "今天盡快", "LINE 不能直接判斷或開藥", "匿名篩檢", "護理人員安排篩檢", "先讓醫師評估 PEP 較優先", "02-2511-9488", "儘速就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "官方 LINE", "可以直接去拿藥", "可以直接拿藥", "不用看診", "性病篩檢與治療需要依症狀"]
  },
  {
    name: "anonymous screening privacy question stays focused",
    reply: answerStdTreatmentQuestion("我想做匿名性病篩檢，但很怕被家人知道。去津久檢查需要用真名嗎？報告大概多久會知道？") || answerReportResultQuestion("我想做匿名性病篩檢，但很怕被家人知道。去津久檢查需要用真名嗎？報告大概多久會知道？"),
    expected: ["匿名篩檢", "重視隱私", "需由現場護理人員", "篩檢項目", "LINE 不能保證", "完全不需任何資料", "不適合", "查個人報告", "家人知道", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "檢查報告需要醫師搭配病史", "症狀與檢查結果一起判讀", "PSA", "攝護腺", "保證隱私", "100% 絕對匿名", "絕對不會知道"]
  },
  {
    name: "pep first question beats same-day schedule routing",
    reply: await buildTestReply("我昨晚跟朋友無套，現在大概過了 20 小時，很怕 HIV。津久今天可以處理 PEP 嗎？我是第一次遇到，不知道現在該先掛號還是直接去。"),
    expected: ["20 小時", "72 小時", "今天盡快", "LINE 不能直接判斷或開藥", "PEP 不能預防其他性病", "02-2511-9488", "儘速就醫"],
    forbidden: ["今天（週二）固定門診", "早診", "午診", "晚診", "LINE VOOM", "官方 LINE", "https://", "lin.ee"]
  },
  {
    name: "pep after 80 hours acknowledges missed window and blocks prep rescue",
    reply: answerStdTreatmentQuestion("我上週六晚上保險套破掉，現在大概已經過了 80 小時，很擔心 HIV。這樣還能吃 PEP 嗎？如果超過時間，可以改吃 PrEP 補救嗎？我今晚能不能直接拿藥，順便做匿名篩檢？我有點緊張，先跟我說下一步。"),
    expected: ["80 小時", "已超過", "PEP 黃金 72 小時", "醫師判斷", "PrEP 是暴露前預防", "不是已發生暴露後的補救", "LINE 不能直接判斷或開藥", "不能保證今晚直接拿藥", "匿名篩檢", "護理人員安排篩檢", "02-2511-9488", "儘速就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "官方 LINE", "80 小時仍在", "可以改吃 PrEP 補救", "可以直接拿藥", "可以今晚直接拿藥", "今晚可以直接拿藥", "不用看診"]
  },
  {
    name: "pep schedule follow-up does not intercept new 80-hour prep rescue question",
    reply: answerPepVisitScheduleFollowUp(
      "我上週六晚上保險套破掉，現在大概已經過了 80 小時，很擔心 HIV。這樣還能吃 PEP 嗎？如果超過時間，可以改吃 PrEP 補救嗎？我今晚能不能直接拿藥，順便做匿名篩檢？我有點緊張，先跟我說下一步。",
      new Date("2026-06-02T12:00:00+08:00"),
      [
        { role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" },
        { role: "assistant", content: "60 小時仍在 72 小時內，PEP 需要由醫師評估。" }
      ]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP 是越早評估越好", "今天（週二）", "李齊泰醫師", "晚診"]
  },
  {
    name: "prep does not replace condoms or post-exposure pep",
    reply: answerStdTreatmentQuestion("我最近想開始吃 PrEP，是不是吃了就不用戴套，也不會得梅毒、淋病或菜花？如果昨天已經無套了，吃 PrEP 可以補救嗎？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["PrEP 是暴露前預防", "不是已發生暴露後的補救", "不能預防梅毒、淋病、菜花", "PEP", "72 小時", "今天盡快", "LINE 不能直接判斷或開藥", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "吃了就不用戴套", "可以補救", "菜花 HPV 相關篩檢與治療評估"]
  },
  {
    name: "prep partner hiv positive keeps condoms and sti screening",
    reply: answerStdTreatmentQuestion("我伴侶是 HIV 陽性但穩定治療，我想開始吃 PrEP。吃了是不是就不用保險套？可以順便不用驗梅毒、淋病、菜花嗎？我有點緊張，先跟我說下一步。"),
    expected: ["PrEP 是 HIV 暴露前預防", "醫師評估", "並非 100% 有效", "不代表可以完全不用保險套", "不能預防梅毒、淋病、菜花", "定期篩檢", "伴侶為 HIV 感染者", "HIV 陰性", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "菜花 HPV 相關篩檢與治療評估", "吃了就不用保險套", "就不用保險套", "不用驗"]
  },
  {
    name: "prep after exposure and possible hiv infection stays safe",
    reply: answerStdTreatmentQuestion("我昨天無套，現在大概 40 小時，很擔心 HIV。朋友說吃 PrEP 就好，如果我其實已經感染 HIV 也可以吃嗎？你們能不能直接給藥？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["40 小時", "72 小時", "PrEP 是暴露前預防", "不是已發生暴露後的補救", "若已感染 HIV", "PrEP 不適用", "醫師評估治療", "LINE 不能直接判斷或開藥", "02-2511-9488", "儘速就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "吃 PrEP 就好", "可以直接給藥", "可以直接拿藥", "不用看診"]
  },
  {
    name: "pep follow-up tonight doctor and anonymous screening keeps context",
    reply: answerPepVisitScheduleFollowUp(
      "那我如果今晚去，是先做匿名篩檢還是先給醫師評估 PEP？今天晚上是哪位醫師？我需要先打電話嗎？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T12:00:00+08:00"),
      [
        { role: "user", content: "我昨天無套，現在大概 40 小時，很擔心 HIV。朋友說吃 PrEP 就好，能不能直接給藥？" },
        { role: "assistant", content: "40 小時仍在 72 小時內，PEP 需要由醫師評估，LINE 不能直接開藥。" }
      ]
    ),
    expected: ["PEP 是越早評估越好", "匿名篩檢", "先讓醫師評估 PEP 較優先", "今天（週二）", "晚診", "18:00-20:30", "李齊泰醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "PrEP 是暴露前預防", "午診"]
  },
  {
    name: "pep urgent next-step follow-up beats fixed schedule and avoids official line",
    reply: answerPepVisitScheduleFollowUp(
      "那我現在是先掛今天哪個時段，還是直接去急診？我人在台北，我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T08:00:00+08:00"),
      [
        { role: "user", content: "我昨晚保險套破掉，現在大概 18 小時，很怕 HIV。你們可以直接讓我拿 PEP 嗎？我也想匿名篩檢。" },
        { role: "assistant", content: "18 小時仍在 72 小時內，PEP 需要由醫師評估，LINE 不能直接開藥。" }
      ]
    ) || answerFixedScheduleQuestion(
      "那我現在是先掛今天哪個時段，還是直接去急診？我人在台北，我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T08:00:00+08:00")
    ),
    expected: ["PEP 是越早評估越好", "今天（週二）", "午診", "13:30-17:00", "羅詩修醫師", "晚診", "18:00-20:30", "李齊泰醫師", "02-2511-9488", "盡快到診"],
    forbidden: ["https://", "lin.ee", "官方 LINE", "LINE VOOM", "早診（09:30-12:30）：陳偉傑醫師"]
  },
  {
    name: "pep memory does not intercept wart partner medication question",
    reply: answerPepVisitScheduleFollowUp(
      "我私密處長了幾顆小肉芽，朋友說可能是菜花。你可以看文字先判斷是不是嗎？藥膏要擦幾天、能不能自己買來擦？伴侶需要一起檢查嗎？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T12:00:00+08:00"),
      [
        { role: "user", content: "我昨晚保險套破掉，現在大概 14 小時，很擔心 HIV，想問 PEP。" },
        { role: "assistant", content: "14 小時仍在 72 小時內，PEP 需要由醫師評估，LINE 不能直接開藥。" }
      ]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "psa report cancer biopsy question avoids diagnosis",
    reply: answerReportResultQuestion("我健檢 PSA 偏高，這樣是不是攝護腺癌？要不要馬上切片？今天能看嗎？我在外面不方便看長文，先講重點。"),
    expected: ["PSA", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "切片", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是癌症", "不是癌症", "立即急診", "尿不出來", "大量出血"]
  },
  {
    name: "hematospermia cancer worry is not routed as report review",
    reply:
      answerHematospermiaQuestion("我這兩次射精都有一點紅紅的，好像精液有血，尿尿沒有痛。這是不是癌症？可以先觀察嗎？") ||
      answerReportResultQuestion("我這兩次射精都有一點紅紅的，好像精液有血，尿尿沒有痛。這是不是癌症？可以先觀察嗎？"),
    expected: ["精液有血", "血精", "不等於一定是癌症", "LINE", "不能直接排除", "感染", "發炎", "攝護腺", "不只一次", "泌尿科門診", "血尿", "尿痛", "發燒", "疼痛", "排尿困難", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "檢查報告需要醫師搭配病史", "不是癌症", "就是癌症", "不用看診", "可以放心"]
  },
  {
    name: "varicocele fertility report blocks direct surgery pricing",
    reply:
      answerMaleFertilityQuestion("我備孕一年都沒成功，精液報告活動力偏低，醫師說可能有精索靜脈曲張。你們可以直接手術嗎？費用大概多少？") ||
      answerReportResultQuestion("我備孕一年都沒成功，精液報告活動力偏低，醫師說可能有精索靜脈曲張。你們可以直接手術嗎？費用大概多少？"),
    expected: ["備孕一年未成功", "精液活動力偏低", "精索靜脈曲張", "泌尿科", "精液報告", "理學檢查", "陰囊超音波", "顯微精索靜脈曲張手術", "不能只用 LINE", "單一報告", "直接安排手術", "保證改善受孕", "費用", "評估後確認", "伴侶端", "婦產科", "生殖醫學", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "檢查報告需要醫師搭配病史", "可以直接手術", "直接報費用", "保證懷孕", "元"]
  },
  {
    name: "psa live-style report review does not mention bph procedures",
    reply: answerReportResultQuestion("健檢說我 PSA 6.8 偏高，我很怕是不是攝護腺癌。津久可以幫我看報告嗎？需要直接做切片嗎？"),
    expected: ["PSA", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "檢查報告", "切片", "醫師評估", "泌尿科門診", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是癌症", "不是癌症", "水蒸氣", "Urolift", "雷射", "攝護腺肥大治療", "費用", "保證", "直接做"]
  },
  {
    name: "psa report with enlarged prostate stays report routed",
    reply:
      answerReportResultQuestion("我健檢 PSA 4.8，超音波說攝護腺有點大，爸爸以前有攝護腺癌。這是不是代表我也癌症？這樣要不要回診看報告？") ||
      answerProstateQuestion("我健檢 PSA 4.8，超音波說攝護腺有點大，爸爸以前有攝護腺癌。這是不是代表我也癌症？這樣要不要回診看報告？"),
    expected: ["PSA", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "檢查報告", "切片", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是癌症", "不是癌症", "雷射剜除", "綠光雷射", "費用", "可以直接做", "可以安排治療"]
  },
  {
    name: "psa report with bph procedure request blocks skipping biopsy",
    reply:
      answerReportResultQuestion("我健檢 PSA 5.2，超音波說攝護腺有點大，爸爸有攝護腺癌病史。這是不是代表我也癌症？我可以今天直接做水蒸氣消融或 Urolift，順便不要切片嗎？費用多少？我有點緊張，先跟我說下一步。") ||
      answerProstateQuestion("我健檢 PSA 5.2，超音波說攝護腺有點大，爸爸有攝護腺癌病史。這是不是代表我也癌症？我可以今天直接做水蒸氣消融或 Urolift，順便不要切片嗎？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["PSA", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "病史", "切片", "醫師評估", "水蒸氣消融", "Urolift", "不能用來取代", "癌症風險評估", "不能用來保證跳過必要切片", "費用", "門診評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "就是癌症", "不是癌症", "可以今天直接做", "可以不用切片", "元"]
  },
  {
    name: "psa report follow-up says clinic review before surgery",
    reply: answerReportResultQuestion(
      "那我是不是先不要掛手術，先掛一般泌尿科看報告比較對？我很怕被直接安排手術，請先不用給我一堆資料。",
      [
        { role: "user", content: "我健檢 PSA 變成 7.8，超音波說攝護腺比較大。我是不是已經是攝護腺癌？可以不要切片、直接做水蒸氣或 Urolift 嗎？" },
        { role: "assistant", content: "PSA 偏高不等於一定是攝護腺癌，是否需要切片與治療需由醫師評估。" }
      ]
    ),
    expected: ["對", "先掛泌尿科門診", "PSA", "超音波", "檢查報告", "不要先把自己排成手術", "不等於一定是攝護腺癌", "不能只用 LINE 判斷", "切片", "醫師評估", "水蒸氣消融", "Urolift", "不能用來取代", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接安排手術", "不用切片", "就是癌症", "不是癌症"]
  },
  {
    name: "prostate treatment choice cost and ejaculation avoids pep context",
    reply: answerProstateQuestion("我爸爸夜尿很多、尿流變細，聽說你們有水蒸氣消融或 Urolift。哪個比較適合？會不會影響射精？費用多少？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["攝護腺肥大", "雷射剜除", "水蒸氣消融", "Urolift", "夜尿", "尿流變細", "影響射精", "費用", "醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "PEP", "72 小時", "可以保證", "元"]
  },
  {
    name: "pep memory does not intercept prostate follow-up",
    reply: answerPepVisitScheduleFollowUp(
      "我爸爸夜尿很多、尿流變細，聽說你們有水蒸氣消融或 Urolift。哪個比較適合？會不會影響射精？費用多少？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "male uti fever antibiotic same-day stays safe and useful",
    reply: answerMaleUtiUrgentQuestion("我尿尿很痛又發燒，可以先吃抗生素嗎？今天晚上能看嗎？我在外面不方便看長文，先講重點。", new Date("2026-06-02T04:00:00Z")),
    expected: ["尿痛", "發燒", "不能建議先吃", "抗生素", "今天晚上", "李齊泰醫師", "18:00-20:30", "02-2511-9488", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃", "可以自行"]
  },
  {
    name: "hematuria flank pain fever prioritizes er over clinic schedule",
    reply: answerMaleUtiUrgentQuestion("我今天尿尿有血，右邊腰很痛，剛剛量體溫 38.5。可是我明天才有空，可以先吃止痛藥撐到明天再去嗎？我現在有點慌，先跟我說該怎麼辦。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["血尿", "右腰", "發燒", "腎臟", "輸尿管", "感染", "結石合併感染", "LINE 不能判斷", "不建議", "止痛藥", "撐到明天", "不要自行吃抗生素", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "今天晚上", "晚診", "可先參考", "門診", "李齊泰醫師", "18:00-20:30", "可以先吃止痛藥", "可以撐到明天"]
  },
  {
    name: "male urinary symptoms respect requested wednesday colorectal schedule",
    reply: answerMaleUtiUrgentQuestion("我最近頻尿、夜尿，想看一般泌尿科。週三晚上可以掛嗎？我看到週三晚診有陳嘉哲醫師，那一診適合看頻尿嗎？如果不適合，那週三該改掛哪一診？", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["頻尿", "週三", "晚診", "18:00-20:30", "陳嘉哲醫師", "肛門直腸外科", "不是一般泌尿科門診", "週三可改一般門診時段", "午診", "13:30-17:00", "吳致寬醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "今天（週二）", "李齊泰醫師", "想看泌尿科請換個時段。", "晚診（18:00-20:30）：陳嘉哲醫師（肛門直腸外科門診）"]
  },
  {
    name: "male urinary wednesday night question gives alternative without explicit ask",
    reply: answerMaleUtiUrgentQuestion("我頻尿、夜尿，週三晚上可以掛泌尿科嗎？還是那診不是一般泌尿？", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["頻尿", "週三", "晚診", "18:00-20:30", "陳嘉哲醫師", "肛門直腸外科", "不是一般泌尿科門診", "週三可改一般門診時段", "午診", "13:30-17:00", "吳致寬醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "今天（週二）", "李齊泰醫師", "想看泌尿科請換個時段。", "晚診（18:00-20:30）：陳嘉哲醫師（肛門直腸外科門診）"]
  },
  {
    name: "urinary follow-up with wednesday alternative does not fall back to today",
    reply: answerMaleUtiUrgentQuestion("如果我是頻尿夜尿，週三晚上不適合，那週三該改掛哪一診？", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["頻尿", "週三", "晚診", "18:00-20:30", "陳嘉哲醫師", "肛門直腸外科", "不是一般泌尿科門診", "週三可改一般門診時段", "午診", "13:30-17:00", "吳致寬醫師", "02-2511-9488"],
    forbidden: ["今天（週二）", "今天晚上", "李齊泰醫師", "想看泌尿科請換個時段。", "晚診（18:00-20:30）：陳嘉哲醫師（肛門直腸外科門診）"]
  },
  {
    name: "night urinary schedule routing does not trigger prostate treatment answer",
    reply:
      answerAnalColorectalQuestion("我下週想看頻尿和夜尿，但不要掛到肛門直腸外科，週三可以掛哪個時段？請短一點。") ||
      answerProstateQuestion("我下週想看頻尿和夜尿，但不要掛到肛門直腸外科，週三可以掛哪個時段？請短一點。") ||
      answerFixedScheduleQuestion("我下週想看頻尿和夜尿，但不要掛到肛門直腸外科，週三可以掛哪個時段？請短一點。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["週三", "可改一般門診時段", "午診", "13:30-17:00", "吳致寬醫師"],
    forbidden: ["肛門直腸外科，可評估痔瘡", "肛門疾病", "痔瘡微創手術", "攝護腺肥大", "雷射剜除", "水蒸氣消融", "綠光雷射", "Urolift", "LINE 不能直接判斷或報價", "今天（週二）", "李齊泰醫師", "https://"]
  },
  {
    name: "past voom holiday does not override current friday clinic and route",
    reply: answerFixedScheduleQuestion("我看到你們之前 LINE VOOM 有 5/22-5/25 公休，那我這週五晚上想從行天宮站過去看泌尿科，還有診嗎？如果週五晚上不能看一般門診，改哪個時段比較適合？我在外面看手機，順便跟我說捷運怎麼走。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["5/22 到 5/25", "過去 LINE VOOM 公告", "週五", "晚診", "18:00-20:30", "手術時段", "不是一般門診", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師", "行天宮站", "4 號出口", "步行約 40 秒", "3 樓"],
    forbidden: ["https://", "lin.ee", "5/22 到 5/25 診所有公休/休息公告。", "可查看 LINE VOOM"]
  },
  {
    name: "past voom holiday wednesday colorectal gives urology alternative",
    reply: answerFixedScheduleQuestion("我看到 LINE VOOM 之前有寫 5/22 到 5/25 公休，我明天晚上想去看頻尿和夜尿。明天晚上還有開嗎？那一診是不是一般泌尿科？我現在只想知道該掛哪個時段。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["5/22 到 5/25", "過去 LINE VOOM 公告", "明天", "週三", "晚診", "18:00-20:30", "陳嘉哲醫師", "肛門直腸外科", "不是一般泌尿科門診", "週三可改一般門診時段", "午診", "13:30-17:00", "吳致寬醫師", "02-2511-9488"],
    forbidden: ["https://", "lin.ee", "5/22 到 5/25 診所有公休/休息公告。", "想看泌尿科請換個時段。", "晚診（18:00-20:30）：陳嘉哲醫師（肛門直腸外科門診）"]
  },
  {
    name: "schedule follow-up keeps previous wednesday and correct afternoon doctor",
    reply: answerFixedScheduleQuestion(
      "那如果我改下午去呢？剛剛那個日期的下午是不是泌尿科？是哪位醫師？先不用給我一堆資料。",
      new Date("2026-06-02T08:00:00+08:00"),
      [
        {
          role: "user",
          content: "我看到 LINE VOOM 之前有寫 5/22 到 5/25 休診，那明天 6/3（三）晚上還有開嗎？如果我是泌尿科問題，可以晚上去看嗎？我現在只想知道時段跟科別。"
        },
        {
          role: "assistant",
          content: "5/22 到 5/25 是過去 LINE VOOM 公告。明天（週三）晚診（18:00-20:30）是陳嘉哲醫師（肛門直腸外科門診），不是一般泌尿科門診。"
        }
      ]
    ),
    expected: ["週三", "午診", "13:30-17:00", "吳致寬醫師"],
    forbidden: ["羅詩修醫師", "陳嘉哲醫師", "肛門直腸外科", "https://", "官網介紹："]
  },
  {
    name: "female uti blood antibiotic same-day does not invent fever",
    reply: answerMaleUtiUrgentQuestion("我是女生，今天尿尿很痛、一直想尿，下腹也痛，尿裡好像有血。可以先吃家裡剩下的抗生素嗎？今天要看門診還是急診？我現在有點慌，先跟我說該怎麼做。", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["尿痛", "疑似血尿", "醫師評估", "不能建議先吃", "抗生素", "請不要自行服藥", "02-2511-9488", "血尿", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "尿痛合併發燒", "可以先吃", "可以自行"]
  },
  {
    name: "painless gross hematuria smoker answers cancer concern",
    reply: answerMaleUtiUrgentQuestion("我 55 歲男生，有抽菸，今天尿尿突然整杯紅紅的但不會痛，後來又變正常。這樣可以先觀察嗎？會不會是癌症？", new Date("2026-06-03T09:50:00+08:00")),
    expected: ["無痛肉眼血尿", "變正常", "不建議只觀察", "不等於一定是癌症", "抽菸", "膀胱", "泌尿道腫瘤", "結石", "感染", "需要排除", "LINE 不能診斷", "泌尿科", "尿液", "影像", "膀胱鏡", "血塊", "尿不出來", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "不能判斷是否感染", "請不要自行服藥", "今天晚上", "晚診", "就是癌症", "不是癌症", "可以先觀察"]
  },
  {
    name: "stone urgent pain hematuria gives er boundary without links",
    reply: answerStoneQuestion("我右腰痛到冒冷汗，尿有點紅，懷疑是腎結石或輸尿管結石。你們可以處理嗎？今天要去門診還是急診？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["右腰痛到冒冷汗", "尿有點紅", "LINE 判斷", "腎結石", "輸尿管結石", "劇痛", "血尿", "優先急診", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "一定是結石"]
  },
  {
    name: "stone red urine flank fever prioritizes er over waiting",
    reply: answerStoneQuestion("我尿裡有紅紅的，左腰痛到站不太直，體溫 38.7。今天工作走不開，可以先吃止痛藥和家裡抗生素，明天再看嗎？我現在有點慌，只講最安全的下一步。"),
    expected: ["尿色發紅", "腰痛", "側腹痛", "發燒", "腎臟", "輸尿管", "感染", "結石合併感染", "LINE 不能判斷", "不建議", "止痛藥", "家裡抗生素", "撐到明天", "急診", "立即就醫", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "若症狀可等待門診", "確認最快可看診時段", "今天晚上", "晚診", "門診", "可以先吃止痛藥", "明天再看"]
  },
  {
    name: "pep memory does not intercept stone urgent question",
    reply: answerPepVisitScheduleFollowUp(
      "我右腰痛到冒冷汗，尿有點紅，懷疑是腎結石或輸尿管結石。你們可以處理嗎？今天要去門診還是急診？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "vasectomy same-day price reversal keeps boundary without link",
    reply: answerVasectomyQuestion("我想做男性結紮，可以今天直接做嗎？以後如果後悔能保證接回來嗎？費用多少？我在外面不方便看長文，請講重點。"),
    expected: ["男性無刀口結紮", "當天", "費用", "不能保證恢復生育", "醫師術前評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "保證接回來", "一定", "元"]
  },
  {
    name: "vasectomy post-op contraception semen check stays on point",
    reply: answerVasectomyQuestion("我如果做完結紮，是不是馬上就可以不用避孕？之後要不要驗精液？我在外面不方便看長文，先講重點。"),
    expected: ["不能馬上停止避孕", "殘存精子", "精液檢查", "醫師指示", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "費用", "當天安排", "重接"]
  },
  {
    name: "vasectomy consult follow-up lists today suitable doctors",
    reply: answerVasectomyQuestion("那如果我想先諮詢結紮，今天可以看哪位醫師？要掛早上、下午還是晚上比較適合？", new Date("2026-06-02T08:00:00+08:00")),
    expected: ["今天（週二）", "可先諮詢結紮", "早診", "09:30-12:30", "陳偉傑醫師", "午診", "13:30-17:00", "羅詩修醫師", "晚診", "18:00-20:30", "李齊泰醫師", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "只能當天安排", "手術方式與費用", "不能保證恢復生育", "留下姓名"]
  },
  {
    name: "vasectomy sexual function concern avoids semen check mixup",
    reply: answerVasectomyQuestion("男性結紮會不會讓性慾變低、勃起變差，或射精量變少？我很怕做完影響性能力。我在外面不方便看長文，請講重點和下一步。"),
    expected: ["不會阻斷男性荷爾蒙", "仍會射精", "通常不會明顯影響性慾", "勃起功能", "射精感", "精液量", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "不能馬上停止避孕", "殘存精子", "精液檢查", "低能量震波", "性功能障礙評估"]
  },
  {
    name: "male private surgery price outcome keeps boundary without link",
    reply: answerMalePrivateSurgeryQuestion("我想問陰莖增大或龜頭減敏，你們有做嗎？可以保證變大或比較持久嗎？費用多少？我在外面不方便看長文，先講重點。"),
    expected: ["男性私密", "陰莖增大", "龜頭減敏", "不能保證", "費用", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "一定", "元"]
  },
  {
    name: "sexual function route does not intercept male private surgery",
    reply:
      answerSexualFunctionQuestion("我想問陰莖增大跟龜頭減敏，想要變大一點也比較持久。你們可以保證效果嗎？今天能不能直接做？費用多少？我現在有點慌，先跟我說該怎麼做。") ??
      "",
    expected: [""],
    forbidden: ["性功能障礙", "硬度不足", "早洩", "陽痿", "直接開藥"]
  },
  {
    name: "male private surgery beats sexual function wording",
    reply:
      answerMalePrivateSurgeryQuestion("我想問陰莖增大跟龜頭減敏，想要變大一點也比較持久。你們可以保證效果嗎？今天能不能直接做？費用多少？我現在有點慌，先跟我說該怎麼做。") ||
      answerSexualFunctionQuestion("我想問陰莖增大跟龜頭減敏，想要變大一點也比較持久。你們可以保證效果嗎？今天能不能直接做？費用多少？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["男性私密", "陰莖增大", "龜頭減敏", "不能保證", "尺寸", "持久度", "效果", "費用", "醫師評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "性功能障礙評估與治療", "直接開藥", "可以保證", "元"]
  },
  {
    name: "shockwave ed question avoids links guarantee and price",
    reply: answerSexualFunctionQuestion("我最近硬度不太穩，做到一半容易軟掉，聽說低能量震波可以改善。你們有做嗎？可以保證有效嗎？要做幾次、費用多少？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["性功能障礙", "低能量震波", "血管性勃起功能障礙", "不是所有", "不能保證療效", "心因性", "血管性", "混合性", "療程次數與費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "保證有效", "一定有效", "元"]
  },
  {
    name: "pep memory does not intercept shockwave ed question",
    reply: answerPepVisitScheduleFollowUp(
      "我最近硬度不太穩，做到一半容易軟掉，聽說低能量震波可以改善。你們有做嗎？可以保證有效嗎？要做幾次、費用多少？我現在有點慌，先跟我說該怎麼做。",
      new Date("2026-06-02T06:00:00+08:00"),
      [{ role: "user", content: "我昨天無套，現在 60 小時，想問 PEP 能不能直接拿藥" }]
    ) ?? "",
    expected: [""],
    forbidden: ["PEP", "72 小時", "羅詩修醫師", "李齊泰醫師", "午診", "晚診"]
  },
  {
    name: "female urology muscle chair price keeps boundary without link",
    reply: answerFemaleUrologyQuestion("我咳嗽會漏尿，想問你們有美磁波鍛肌椅嗎？我可以直接做嗎？一次費用多少？我在外面不方便看長文，請講重點。"),
    expected: ["女性泌尿", "漏尿", "美磁波鍛肌椅", "醫師評估", "費用", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "直接做", "保證", "元"]
  },
  {
    name: "female urinary frequency routes to urology without link",
    reply: answerFemaleUrologyQuestion("女性漏尿和頻尿可以看泌尿科嗎？還是要去婦產科？"),
    expected: ["女性漏尿", "頻尿", "泌尿科門診", "評估", "婦產科", "醫師", "下一步"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "%e5", "%E5"]
  },
  {
    name: "female urology muscle chair pregnancy uti safety boundary",
    reply: answerFemaleUrologyQuestion("我咳嗽會漏尿，想做美磁波鍛肌椅，但這兩天尿尿有點痛，而且月經也晚了不確定有沒有懷孕。今天可以直接做療程嗎？一次費用多少？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["尿痛", "月經晚", "不確定是否懷孕", "泌尿道感染", "LINE 不能診斷", "先不要坐美磁波鍛肌椅", "漏尿或療程問題先延後", "醫師評估", "適合用藥", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接做", "今天可以直接做", "保證", "元", "費用目前知識庫沒有公開明確數字"]
  },
  {
    name: "female possible pregnancy uti blocks leftover antibiotics without schedule detour",
    reply: answerFemaleUrologyQuestion("我這兩天尿尿很痛，今天還有一點血尿，月經也晚了幾天不確定是不是懷孕。家裡有之前剩的抗生素，可以先吃嗎？"),
    expected: ["尿痛", "尿紅/血尿", "月經晚", "不確定是否懷孕", "泌尿道感染", "孕期感染", "LINE 不能診斷", "不要自行吃家裡剩的抗生素", "醫師評估", "是否懷孕", "適合用藥", "02-2511-9488", "急診", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以先吃", "可以自行", "今天（週三）", "晚診", "陳嘉哲", "肛門直腸外科", "男性泌尿"]
  },
  {
    name: "female urology hematuria fever back pain urgent boundary",
    reply: answerFemaleUrologyQuestion("我是女生，這兩天尿尿會痛、尿有一點血，今天腰也痠痛好像有發燒，但我本來也有漏尿。可以今天直接坐美磁波鍛肌椅嗎？我有點緊張，先跟我說下一步。"),
    expected: ["尿痛", "血尿", "腰痠", "發燒", "LINE 不能診斷", "先不要坐美磁波鍛肌椅", "漏尿或療程問題先延後", "醫師評估", "適合用藥", "02-2511-9488", "急診", "立即就醫"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接坐", "可以今天直接", "保證", "元", "費用目前知識庫沒有公開明確數字"]
  },
  {
    name: "circumcision same-day surgery price gives next step without link",
    reply: answerCircumcisionFastPassQuestion("我想割包皮，今天能不能看完就手術？費用大概多少？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["割包皮", "快速通關", "費用", "醫師術前評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "保證", "一定可以", "元"]
  },
  {
    name: "circumcision recommended doctor lists relevant urologists",
    reply: answerCircumcisionFastPassQuestion("我想做割包皮手術，有推薦的醫生嗎？"),
    expected: ["陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "包皮槍", "包皮環切", "術前評估", "02-2511-9488"],
    forbidden: ["目前知識庫沒有指定", "沒有指定「推薦醫師」名單", "官網介紹：", "https://", "lin.ee", "一定最好"]
  },
  {
    name: "circumcision recommendation full route stays local and link-free",
    reply: await buildTestReply("我想做割包皮手術，有推薦的醫生嗎？"),
    expected: ["陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師", "包皮槍", "包皮環切", "術前評估", "02-2511-9488"],
    forbidden: ["目前知識庫沒有指定", "沒有指定「推薦醫師」名單", "官網介紹：", "https://", "lin.ee", "一定最好"]
  },
  {
    name: "circumcision doctor follow-up checks today slots",
    reply: answerCircumcisionFastPassQuestion(
      "好 幫我查",
      [
        { role: "user", content: "我想做割包皮手術，有推薦的醫生嗎？" },
        { role: "assistant", content: "割包皮/包皮槍可先掛泌尿科或男性門診評估。官網雙主治包皮槍流程提到陳偉傑醫師、羅詩修醫師；醫師專長資料也列李齊泰醫師、吳致寬醫師有包皮手術相關專長。" }
      ],
      new Date("2026-06-02T22:00:00+08:00")
    ),
    expected: ["今天（週二）", "早診", "陳偉傑醫師", "午診", "羅詩修醫師", "晚診", "李齊泰醫師", "02-2511-9488", "術前評估"],
    forbidden: ["目前知識庫沒有指定", "推薦醫師」名單", "官網介紹：", "https://", "lin.ee", "官方 LINE"]
  },
  {
    name: "circumcision recommendation fallback does not add link",
    reply: await draftReply({
      message: "我想做割包皮手術，有推薦的醫生嗎？",
      chunks: [
        {
          title: "割包皮與雙主治包皮槍 5.0",
          content: "若使用者問「割包皮有推薦醫師嗎」「包皮槍要看哪位醫生」「可以先掛哪位醫師」，不要回答「目前知識庫沒有指定推薦醫師名單」。可以回答：割包皮/包皮槍可先掛泌尿科或男性門診評估。官網雙主治包皮槍流程提到陳偉傑醫師、羅詩修醫師；醫師專長資料也列李齊泰醫師有包皮槍包皮環切手術、吳致寬醫師有精雕包皮環切手術。",
          sourceUrls: ["https://uromeeme.com/treatment1/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "吳致寬醫師"],
    forbidden: ["目前知識庫沒有指定", "推薦醫師」名單", "官網介紹：", "https://", "lin.ee"]
  },
  {
    name: "circumcision direct schedule wording checks today slots",
    reply: answerCircumcisionFastPassQuestion(
      "那今天如果要先諮詢包皮槍，這幾位醫師分別是什麼時段？",
      [
        { role: "user", content: "如果我是想做包皮槍，津久有哪幾位醫師可以先諮詢？" },
        { role: "assistant", content: "官網雙主治包皮槍流程提到陳偉傑醫師、羅詩修醫師；醫師專長資料也列李齊泰醫師、吳致寬醫師有包皮手術相關專長。" }
      ],
      new Date("2026-06-02T22:00:00+08:00")
    ),
    expected: ["今天（週二）", "早診", "陳偉傑醫師", "午診", "羅詩修醫師", "晚診", "李齊泰醫師", "02-2511-9488", "術前評估"],
    forbidden: ["目前知識庫沒有指定", "推薦醫師」名單", "官網介紹：", "https://", "lin.ee", "官方 LINE"]
  },
  {
    name: "circumcision cardiac stent blood thinner blocks self stopping medication",
    reply: answerCircumcisionFastPassQuestion("我想今天做包皮槍割包皮，因為工作不好請假。我有心臟支架，平常吃阿斯匹靈跟保栓通，能不能今晚先自己停藥、明天直接手術？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["包皮槍", "心臟支架", "阿斯匹靈", "保栓通", "抗凝血", "抗血小板", "不建議自行停藥", "不能先保證明天直接手術", "心血管病史", "出血", "血栓", "費用", "醫師術前評估", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以自己停藥", "先自己停藥", "可以明天直接手術", "可以直接手術", "元"]
  },
  {
    name: "urinary schedule question after circumcision context does not inherit surgery doctors",
    reply: await buildTestReply("我週三晚上想去看頻尿跟夜尿，週三晚上的診是一般泌尿科嗎？如果不是，週三還有哪個時段比較適合？", [
      { role: "user", content: "我割包皮第 5 天，釘子旁邊有點黃黃的，水腫也還沒退。" },
      { role: "assistant", content: "術後第 5 天水腫、出血或釘子旁黃黃的狀況，LINE 不能直接判斷是否為感染或流膿。" },
      { role: "user", content: "我想做割包皮手術，有推薦的醫生嗎？" },
      { role: "assistant", content: "割包皮/包皮槍可先掛泌尿科或男性門診評估。" }
    ]),
    expected: ["週三", "晚診", "陳嘉哲醫師", "肛門直腸外科", "不是一般泌尿科門診", "週三可改一般門診時段", "午診", "吳致寬醫師", "02-2511-9488"],
    forbidden: ["包皮手術相關專長", "包皮槍", "陳偉傑醫師", "羅詩修醫師", "李齊泰醫師", "可以。今天", "LINE 不能判斷是否感染", "抗生素", "急診", "立即就醫", "官方 LINE", "LINE VOOM", "官網介紹：", "https://", "lin.ee"]
  },
  {
    name: "hpv vaccine price allergy answers service and safety boundary",
    reply: answerVaccineQuestion("我想打九價 HPV 疫苗，你們有嗎？價錢多少？我有藥物過敏，能不能直接打？請回答重點就好。"),
    expected: ["HPV", "九價", "價格", "02-2511-9488", "LINE 不能直接判斷", "過敏史", "個人狀況", "醫師或診所人員"],
    forbidden: ["傷口", "發燒", "尿不出來", "大量出血", "https://", "lin.ee", "官網介紹："]
  },
  {
    name: "hpv shingles vaccine pregnancy allergy same-day boundary",
    reply: answerVaccineQuestion("我想今天直接打九價 HPV 疫苗，順便問皮蛇疫苗。我月經晚了幾天不確定有沒有懷孕，也曾經打疫苗過敏起疹子。今天可以直接打嗎？兩種能同一天打嗎？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["HPV", "九價", "皮蛇疫苗", "價格", "庫存", "LINE 不能直接判斷", "是否懷孕", "過敏史", "兩種疫苗能否同一天打", "今天能不能直接打", "醫師或診所人員", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接打", "兩種可以同一天打", "費用是", "價格是", "元"]
  },
  {
    name: "hpv vaccine current warts does not imply treatment",
    reply: answerVaccineQuestion("我私密處最近長了幾顆小肉芽，朋友說可能是菜花。如果我今天打九價 HPV 疫苗，這些菜花會不會直接好？伴侶要不要一起打？我也想順便打皮蛇疫苗，兩種可以同一天打嗎？費用多少？我有點緊張，先跟我說下一步。"),
    expected: ["HPV", "九價", "菜花", "肉芽", "不能用來治療", "病灶", "醫師", "篩檢與治療", "皮蛇疫苗", "價格", "庫存", "兩種疫苗能否同一天打", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "會直接好", "可以治療", "可以直接打", "兩種可以同一天打", "費用是", "價格是", "元"]
  },
  {
    name: "hpv wart vaccine live-style answer stays concise",
    reply: answerVaccineQuestion("我私密處最近長了幾顆像肉芽的東西，朋友說可能是菜花。如果我今天打九價 HPV 疫苗，這些會自己消掉嗎？伴侶需要一起檢查嗎？"),
    expected: ["HPV", "九價", "不能用來治療", "菜花", "肉芽病灶", "醫師看病灶", "篩檢與治療", "伴侶", "檢查或篩檢", "02-2511-9488"],
    forbidden: ["皮蛇疫苗", "價格", "庫存", "劑數", "間隔", "兩種疫苗", "懷孕", "備孕", "過敏史", "已發生性行為後是否仍適合", "官網介紹：", "https://", "lin.ee", "會自己消掉", "可以治療"]
  },
  {
    name: "hpv vaccine partner positive does not promise wart prevention or treatment",
    reply: answerVaccineQuestion("我女朋友檢查說 HPV 陽性，我自己沒有長東西。那我是不是打 HPV 疫苗就不用擔心菜花？如果已經感染，疫苗能治療嗎？"),
    expected: ["HPV", "九價", "降低", "菜花風險", "不是保證", "不會感染", "長菜花", "已感染 HPV", "不能處理既有感染", "醫師或診所人員", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "不用擔心", "保證完全", "可以治療", "能治療", "一定不會", "目前有疑似菜花"]
  },
  {
    name: "hpv partner wart vaccine reply stays concise and avoids repeated phone",
    reply: answerVaccineQuestion("我男朋友最近說他有菜花，我目前沒症狀，想打 HPV 九價，打了是不是就不用檢查？今天可以直接打嗎？"),
    expected: ["HPV", "九價", "降低", "菜花風險", "不能取代檢查", "醫師或診所人員", "性病篩檢", "施打", "LINE 不能直接判斷", "今天能不能直接打", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "打了就不用檢查", "不用檢查", "一定不會", "完全不會", "目前有疑似菜花"],
    forbiddenPatterns: [/02-2511-9488.*02-2511-9488/]
  },
  {
    name: "hpv vaccine male prior sex dose same-day price stays bounded",
    reply: answerVaccineQuestion("我是男生，已經有過性行為，現在打九價 HPV 還有用嗎？要打幾劑？今天能直接打嗎？費用多少？我在外面不方便看長文，先講重點。"),
    expected: ["HPV", "九價", "性行為", "劑數", "今天", "庫存", "價格", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接打", "一定", "元"]
  },
  {
    name: "vaccine follow-up remembers hpv and skin shingles context",
    reply: answerVaccineQuestion(
      "那我老公也可以一起打嗎？他 42 歲、有過敏史，想跟我同一天打。我有點緊張，先跟我說下一步。",
      [
        {
          role: "user",
          content: "我想今天打九價 HPV 疫苗，也想問皮蛇疫苗。我已經有過性行為、最近在備孕，而且以前藥物過敏。今天能不能直接打？價格多少？我現在有點慌，先跟我說該怎麼做。"
        },
        {
          role: "assistant",
          content: "官網列出診所有提供 HPV 疫苗施打，也有提到 HPV 九價疫苗。官網主要診療項目有列出皮蛇疫苗施打。是否適合施打需由醫師或診所人員評估。"
        }
      ]
    ),
    expected: ["HPV", "九價", "皮蛇疫苗", "價格", "庫存", "過敏", "今天能不能直接打", "醫師或診所人員", "02-2511-9488"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以一起打", "可以直接打", "保證", "元"]
  },
  {
    name: "mounjaro diabetes medication price same-day stays bounded",
    reply: answerWellnessWeightQuestion("我想問猛健樂減重門診，BMI 大概 27，也有在吃糖尿病藥。今天能不能直接打？一針多少錢？副作用怎麼辦？我現在有點慌，先跟我說該怎麼做。"),
    expected: ["猛健樂門診", "體重管理", "不能在線上判斷", "直接安排施打", "BMI", "糖尿病藥", "副作用", "費用", "02-2511-9488", "用藥資訊"],
    forbidden: ["官網介紹：", "https://", "lin.ee", "可以直接打", "今天可以打", "保證瘦", "元"]
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
    name: "explicit no-link wording suppresses official website link",
    reply: await draftReply({
      message: "那一診是哪位醫師？我手機訊號有點差，先給文字就好。",
      chunks: [
        {
          title: "門診與醫師介紹",
          content: "週三下午 13:30-17:00 是吳致寬醫師門診。",
          sourceUrls: ["https://uromeeme.com/about-us/"]
        }
      ],
      shouldEscalate: false
    }),
    expected: ["醫師"],
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
    reply: answerBasicInfoQuestion("我從行天宮捷運站要去你們診所，能不能只告訴我怎麼走？我手機訊號有點差，先給文字就好。"),
    expected: ["行天宮站", "4 號出口", "步行約 40 秒", "3 樓"],
    forbidden: ["https://", "contact-us", "appointment", "官網介紹"]
  },
  {
    name: "clinic access bundle includes address route and phone without link",
    reply: answerBasicInfoQuestion("我等一下要去診所，請直接告訴我地址、捷運要從哪個出口出來、到門口怎麼走，還有電話多少。我等一下要出門了，越短越好。"),
    expected: ["松江路 276 號 3 樓", "行天宮站", "4 號出口", "右轉", "步行約 40 秒", "02-2511-9488"],
    forbidden: ["https://", "contact-us", "appointment", "官網介紹", "官網", "官方 LINE"]
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
