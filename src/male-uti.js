import { answerFixedScheduleQuestion } from "./schedule.js";
import { answerUrethralDischargeStdQuestion } from "./std-treatment.js";

const PHONE = "02-2511-9488";

export function answerMaleUtiUrgentQuestion(message, now = new Date()) {
  if (!isUtiQuestion(message) && !hasUpperUrinaryEmergency(message)) return null;
  if (isLikelyHematospermiaQuestion(message)) return null;
  if (isNonExclusiveDoctorChoiceQuestion(message)) {
    return [
      "一般頻尿或泌尿問題不一定要指定院長。",
      "陳偉傑醫師和羅詩修醫師都有一般泌尿門診；可以先依你方便的時段掛號。",
      `到診前請電話 ${PHONE} 確認名額與是否有臨時異動。`,
      "若發燒、尿不出來、血尿明顯或很不舒服，請盡快就醫。"
    ].join("");
  }
  if (asksDoctorChoiceForGeneralUrology(message)) return null;
  if (isScheduleOnlyUrologyQuestion(message)) {
    const requestedScheduleReply = answerFixedScheduleQuestion(message, now, []);
    if (requestedScheduleReply) return cleanScheduleReply(requestedScheduleReply, message);
  }

  if (!hasUrgentOrMedicationConcern(message)) {
    const officialReply = answerOfficialMaleUtiQuestion(message);
    if (officialReply) return officialReply;
  }

  if (!hasUrgentOrMedicationConcern(message)) return null;

  const urethralDischargeReply = answerUrethralDischargeStdQuestion(message);
  if (urethralDischargeReply) return urethralDischargeReply;

  if (isChronicProstatitisLikeQuestion(message)) {
    return [
      "會陰或下腹悶痛、尿尿不太順、射精後酸痛，可能和慢性攝護腺炎、骨盆疼痛症候群或其他泌尿問題有關，但不能只靠訊息診斷。",
      "不建議自行吃之前剩的抗生素；是否需要抗生素、止痛或其他治療，要由醫師依尿液檢查、症狀與必要檢查評估。",
      "這不等於一定是癌症；但若症狀持續幾週，建議掛泌尿科門診評估。",
      `以你描述若沒有高燒、尿不出來、血尿變多或劇烈疼痛，通常不需要先急診；可先電話 ${PHONE} 確認可評估時段。若上述症狀出現或明顯很不舒服，請急診/立即就醫。`
    ].join("");
  }

  if (hasUpperUrinaryEmergency(message)) {
    return [
      "血尿合併右腰/側腹劇痛和發燒，需要警覺腎臟或輸尿管感染、結石合併感染等急症風險，光靠訊息無法判斷原因。",
      "不建議只吃止痛藥撐到明天，也不要自行吃抗生素。",
      `請現在直接急診/立即就醫；若要同步確認診所能否協助，可電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  if (hasPainlessGrossHematuriaCancerConcern(message)) {
    return [
      "無痛肉眼血尿即使後來變正常，也不建議只觀察。",
      "這不等於一定是癌症，但中高年齡或有抽菸時，膀胱或泌尿道腫瘤、結石、感染等原因都需要排除，光靠訊息無法診斷。",
      `請盡快掛泌尿科做尿液、影像與必要時膀胱鏡等評估；若血尿很多、有血塊、尿不出來或明顯不舒服，請急診/立即就醫。門診可電話 ${PHONE}。`
    ].join("");
  }

  const parts = [
    buildSymptomSummary(message),
    "是否感染、該不該用抗生素，都需要醫師評估；請不要自行服藥或停藥。"
  ];

  if (asksAboutExistingMedication(message)) {
    parts.push("明天看診請把外院藥袋、藥名或目前用藥資料一起帶去，讓醫師判斷用藥是否需要調整。");
  }

  const scheduleReply = buildRequestedScheduleReply(message, now);
  if (scheduleReply) {
    parts.push(`${scheduleReply}到診前請電話 ${PHONE} 確認當天名額。`);
  } else {
    parts.push(`建議預約門診；也可先電話 ${PHONE} 確認可看診時段，或盡快到泌尿科就醫。`);
  }

  parts.push("若高燒、劇痛、尿不出來、血尿或明顯很不舒服，請直接急診/立即就醫。");

  return parts.join("");
}

function buildSymptomSummary(message) {
  if (hasPositiveFeverCue(message)) {
    return "尿痛合併發燒需要盡快由醫師評估。";
  }

  if (/血尿|尿.*血|尿.*紅/.test(message)) {
    return "尿痛合併疑似血尿需要盡快由醫師評估。";
  }

  return "尿痛、頻尿或急尿可能有不同原因，需要由醫師評估。";
}

function answerOfficialMaleUtiQuestion(message) {
  if (/抗生素|吃藥|藥物|藥/.test(message)) {
    return "男性泌尿道感染或發炎是否需要抗生素、消炎藥、用哪一種與療程多久，都需要醫師依症狀與檢查判斷；不建議自行服藥、停藥或只靠訊息決定用藥。";
  }

  if (/檢查|尿液|X光|超音波|膀胱鏡/.test(message)) {
    return "男性泌尿道症狀可由泌尿科進一步檢查，例如尿液檢查、X 光檢查尿結石、超音波檢查腎臟發炎或積水，必要時也可能安排膀胱鏡；實際需要哪些檢查需由醫師依症狀評估。";
  }

  if (/尿道炎/.test(message) && /原因|為什麼|怎麼|造成/.test(message)) {
    return "男性尿道炎常見於下泌尿道感染發炎，可能和不安全性行為、淋菌、非淋菌感染或其他細菌感染有關；實際原因需由醫師檢查判斷。";
  }

  if (/尿道炎/.test(message) && /症狀|會怎樣|表現/.test(message)) {
    return "男性尿道炎可能出現排尿灼熱疼痛、陰莖發癢或灼熱感、精液或尿液有血絲、陰莖分泌物或膿狀異物。";
  }

  if (/膀胱炎/.test(message) && /症狀|會怎樣|表現/.test(message)) {
    return "膀胱炎通常與細菌感染有關，可能有頻尿、尿急、下腹部不適、排尿疼痛或灼熱感，嚴重時可能出現血尿。";
  }

  if (/睪丸炎|副睪丸炎/.test(message) && /原因|為什麼|怎麼|造成/.test(message)) {
    return "急性睪丸炎或副睪丸炎可能與性行為接觸感染、尿道炎延伸、自身尿路感染，或攝護腺發炎延伸有關；需要醫師實際檢查確認。";
  }

  if (/睪丸炎|副睪丸炎/.test(message) && /症狀|會怎樣|表現|痛|腫/.test(message)) {
    return "睪丸炎或副睪丸炎可能出現睪丸紅腫灼熱感、睪丸脹痛、陰囊腫脹、發燒、發冷與全身無力；若急性睪丸疼痛或陰囊腫脹，請盡快就醫。";
  }

  if (/睪丸炎|副睪丸炎/.test(message) && /是什麼|差別|同一|一起/.test(message)) {
    return "睪丸炎是睪丸發炎，副睪丸炎是副睪丸發炎；官網提到睪丸炎通常可能合併副睪丸發炎，是否是哪一種需由醫師檢查判斷。";
  }

  if (/攝護腺炎/.test(message) && /分類|分哪|幾種|種類|類型/.test(message)) {
    return "攝護腺炎通常分為急性攝護腺炎、慢性細菌性攝護腺炎，以及非細菌性攝護腺炎，也稱慢性骨盆疼痛症候群 CPPS。";
  }

  if (/攝護腺炎/.test(message) && /症狀|會怎樣|表現/.test(message)) {
    return "攝護腺炎症狀可能包含發燒、頻尿、尿急、排尿疼痛、尿液滴瀝、排尿不順、感染部位疼痛、夜尿或射精疼痛等；症狀有時和其他泌尿疾病相似，需由醫師檢查確認。";
  }

  if (/攝護腺炎/.test(message) && /細菌|感染|原因|為什麼/.test(message)) {
    return "攝護腺炎不一定都是同一原因；官網提到可分為急性、慢性細菌性與非細菌性攝護腺炎，細菌感染可能由尿道或血流傳播至攝護腺，實際類型需檢查評估。";
  }

  if (/男性|男生|男/.test(message) && /泌尿道|尿路/.test(message) && /症狀|困擾/.test(message)) {
    return "男性泌尿道感染或發炎常見困擾包含頻尿、夜尿、小便無力、排尿疼痛、排尿困難，以及睪丸或私密處反覆疼痛；原因可能不同，需由醫師評估。";
  }

  if (/男性|男生|男/.test(message) && /泌尿道感染|尿道炎|膀胱炎|攝護腺炎|睪丸炎|副睪丸炎/.test(message) && /常見.*問題|有哪些.*問題|有什麼.*問題/.test(message)) {
    return "男性泌尿道感染相關常見問題包含攝護腺炎、睪丸炎、副睪丸炎、膀胱炎、尿道炎與泌尿道感染發炎；可由泌尿科依症狀評估。";
  }

  return null;
}

function isUtiQuestion(message) {
  return hasPositiveUrinationPainCue(message) || /尿道炎|膀胱炎|泌尿道感染|泌尿道症狀|泌尿道.*檢查|尿路感染|尿路症狀|攝護腺炎|睪丸炎|副睪丸炎|頻尿|尿急|會陰|骨盆.*痛|射精.*痛|射精.*酸/.test(message);
}

function hasUrgentOrMedicationConcern(message) {
  return /發燒|很痛|劇痛|血尿|尿不出來|排不出尿|抗生素|吃藥|藥|今天|晚上|夜診|晚診|現在|急/.test(message);
}

function asksAboutExistingMedication(message) {
  return /別家|外院|外面|其他醫院|他院|抗生素|藥袋|藥名|用藥|吃到一半|停藥|帶去|要帶/.test(message)
    && /抗生素|藥|藥袋|藥名|用藥/.test(message);
}

function hasUpperUrinaryEmergency(message) {
  const hasBloodUrine = /血尿|尿.*血|尿.*紅/.test(message);
  const hasFlankOrWaistPain = /腰.*痛|側腹.*痛|腰腹.*痛|右腰|左腰|腎絞痛|痛到|劇痛|很痛/.test(message);
  const hasFever = hasPositiveFeverCue(message);

  return hasBloodUrine && hasFlankOrWaistPain && hasFever;
}

function hasPainlessGrossHematuriaCancerConcern(message) {
  const hasGrossHematuria = /血尿|尿.*血|尿.*紅|尿裡.*紅|尿色.*紅|整杯.*紅|紅紅的/.test(message);
  const hasPainlessCue = /不會痛|不痛|無痛/.test(message);
  const hasCancerOrSmokingRisk = /癌|腫瘤|抽菸|抽煙|菸|煙|5[0-9]\s*歲|6[0-9]\s*歲|7[0-9]\s*歲/.test(message);

  return hasGrossHematuria && hasPainlessCue && hasCancerOrSmokingRisk;
}

function hasPositiveUrinationPainCue(message) {
  if (/尿尿不會痛|尿尿不痛|小便不會痛|小便不痛|排尿不會痛|排尿不痛|沒有尿痛|沒尿痛|無尿痛|尿尿沒有痛|尿尿沒痛/.test(message)) return false;
  return /尿尿.*痛|尿痛|排尿.*痛|小便.*痛/.test(message);
}

function hasPositiveFeverCue(message) {
  if (/沒有發燒|沒發燒|無發燒|不發燒|沒有高燒|沒高燒|無高燒/.test(message)) return false;
  return /發燒|高燒|體溫\s*3[89](?:\.\d)?|燒到\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);
}

function isLikelyHematospermiaQuestion(message) {
  return /血精|精液.*(血|紅|粉紅|咖啡色|褐色|茶色)|射精.*(血|紅|粉紅|咖啡色|褐色|茶色)|射出來.*(血|紅|粉紅|咖啡色|褐色|茶色)|精子.*(血|紅|粉紅|咖啡色|褐色|茶色)/.test(message);
}

function asksDoctorChoiceForGeneralUrology(message) {
  return /院長|醫師|醫生|掛他|掛誰|推薦唯一|不要推薦/.test(message)
    && /頻尿|夜尿|泌尿|一般泌尿|尿急|排尿/.test(message)
    && /今天|今晚|晚上|晚診|門診|看診|掛/.test(message);
}

function isChronicProstatitisLikeQuestion(message) {
  const hasPelvicOrProstateCue = /攝護腺炎|會陰|骨盆|射精.*痛|射精.*酸|陰囊.*悶|睪丸.*悶/.test(message);
  const hasChronicOrMedicationCue = /幾週|幾個禮拜|一陣子|慢性|悶痛|酸痛|抗生素|癌|急診|尿不太順/.test(message);

  return hasPelvicOrProstateCue && hasChronicOrMedicationCue;
}

function isScheduleOnlyUrologyQuestion(message) {
  return (
    hasExplicitScheduleRequest(message) &&
    !/尿痛|尿尿.*痛|小便.*痛|排尿.*痛|發燒|高燒|血尿|尿.*血|尿.*紅|尿不出|排不出尿|抗生素|吃藥|藥|很痛|劇痛|痛到/.test(message)
  );
}

function isNonExclusiveDoctorChoiceQuestion(message) {
  const hasUrologySymptom = /頻尿|夜尿|尿急|排尿|小便|尿尿/.test(message);
  const hasDoctorChoiceCue = /院長|醫師|醫生|哪位|誰|掛他|掛哪|推薦/.test(message);
  const hasNonExclusiveCue = /一定要|只能|唯一|不要推薦唯一|不一定|非要/.test(message);
  return hasUrologySymptom && hasDoctorChoiceCue && hasNonExclusiveCue;
}

function cleanScheduleReply(reply, message) {
  const hasAnalConcern = /肛門|痔瘡|廔管|瘻管|肛裂|便血|大便.*血|肛門.*痛|肛門.*腫/.test(message);
  const symptomPrefix = !hasAnalConcern && /頻尿|夜尿/.test(message) ? "頻尿/夜尿想看一般泌尿科的話，" : "";
  const walkInWaitlistNote = asksWalkInOrWaitlist(message)
    ? "線上掛號若已額滿，現場等候或候補不能先保證；可先電話 02-2511-9488，或到 3 樓櫃台確認現場名額。"
    : "";
  const cleanedReply = reply
    .replace(/臨時異動請以 LINE VOOM(?: \/ 官方 LINE)?、線上掛號或電話 02-2511-9488 確認。?/g, "到診前請電話 02-2511-9488 確認名額與時段。")
    .replace(/可查看 LINE VOOM(?: \/ 官方 LINE)?、線上掛號或電話 02-2511-9488 確認。?/g, "到診前請電話 02-2511-9488 確認名額與時段。");
  return [symptomPrefix + cleanedReply, walkInWaitlistNote].filter(Boolean).join("\n");
}

function asksWalkInOrWaitlist(message) {
  return /線上掛號.*滿|線上.*滿|掛號.*滿|額滿|現場等|候補|等候補|直接到現場等/.test(message);
}

function buildRequestedScheduleReply(message, now) {
  if (hasExplicitScheduleRequest(message)) {
    const requestedScheduleReply = answerFixedScheduleQuestion(message, now, []);
    if (requestedScheduleReply) {
      return `你問的時段可先參考：${requestedScheduleReply}`;
    }

    const scheduleOnlyQuestion = /今晚|今天晚上|晚上|夜診|晚診/.test(message)
      ? "今天晚上有診嗎？"
      : "今天有診嗎？";
    const scheduleReply = answerFixedScheduleQuestion(scheduleOnlyQuestion, now, []);
    if (scheduleReply) {
      const conciseSchedule = scheduleReply.split("。")[0];
      const scheduleLabel = scheduleOnlyQuestion === "今天晚上有診嗎？" ? "今天晚上時段" : "時段";
      return `你問的${scheduleLabel}可先參考：${conciseSchedule}。`;
    }
  }

  return null;
}

function hasExplicitScheduleRequest(message) {
  const hasDay = /今天|今日|明天|明日|後天|週[一二三四五六日]|周[一二三四五六日]|星期[一二三四五六日天]|禮拜[一二三四五六日天]/.test(message);
  const hasPeriod = /早上|上午|早診|下午|午診|晚上|晚診|夜診|09:30|9:30|13:30|1:30|18:00|6:00/.test(message);
  const hasScheduleIntent = /看診|門診|泌尿科|一般泌尿|有診|休診|停診|時段|掛號|掛錯|掛哪|改掛|該掛|預約|可以掛|能掛|能看|可以看|適合看|哪一診|哪診|跑錯/.test(message);

  return hasDay && hasPeriod && hasScheduleIntent;
}
