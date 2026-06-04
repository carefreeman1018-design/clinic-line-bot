const PHONE = "02-2511-9488";

export function answerFemaleUrologyQuestion(message, conversationHistory = []) {
  if (hasExplicitMaleSelfCue(message)) return null;
  if (hasMaleSpecificUrologyCue(message)) return null;
  if (hasAdministrativeIdCue(message) && !hasFemaleSpecificCue(message)) return null;
  if (!hasFemaleSpecificCue(message) && hasUpperUrinaryEmergencyCue(message)) return null;
  const isFemaleUrologyFollowUp = isFemaleUrologyFeeFollowUp(message, conversationHistory);
  if (!isFemaleUrologyQuestion(message) && !isFemaleUtiUrgentQuestion(message) && !isFemaleUrologyFollowUp) return null;
  if (!asksSuitabilityPriceOrNextStep(message) && !isFemaleUrologyFollowUp) return null;

  if (isFemaleUtiUrgentQuestion(message)) {
    return answerFemaleUtiUrgentQuestion(message);
  }

  if (asksUrologyOrGynecologyRoute(message)) {
    return [
      "女性頻尿、漏尿建議先看泌尿科/醫師找原因。",
      "泌尿科門診是做診斷評估，會看是否感染、膀胱過動、應力性尿失禁或其他問題。",
      "美磁波/磁波鍛肌椅偏向骨盆底訓練或輔助療程，不能取代診斷；適不適合要由醫師評估後決定。"
    ].join("");
  }

  const safetyNotes = buildSafetyNotes(message);

  return [
    "診所有提供女性泌尿、漏尿評估，也有美磁波鍛肌椅相關服務。",
    "是否適合療程需先由醫師評估漏尿原因；費用目前知識庫沒有公開明確數字。",
    safetyNotes,
    `下一步可先電話 ${PHONE}，或留下姓名、電話與方便時段，請診所人員協助確認。`
  ].filter(Boolean).join("");
}

function isFemaleUrologyQuestion(message) {
  return /女性泌尿|漏尿|尿失禁|骨盆底肌|美磁波|磁波|鍛肌椅|高密度磁波/.test(message);
}

function hasExplicitMaleSelfCue(message) {
  return /我是男生|我是男性|我是男的|我.*男生|我.*男性|我.*男的/.test(message);
}

function hasMaleSpecificUrologyCue(message) {
  return /攝護腺|前列腺|射精|精液|精子|睪丸|陰囊|龜頭|陰莖|包皮/.test(message);
}

function hasFemaleSpecificCue(message) {
  return /我是女生|我是女性|我是女的|我.*女生|我.*女性|女性泌尿|漏尿|尿失禁|骨盆底肌|美磁波|磁波|鍛肌椅|高密度磁波|懷孕|月經|產後|哺乳/.test(message);
}

function hasAdministrativeIdCue(message) {
  return /健保卡|身分證|身份證|證件|報到|櫃台|櫃檯|掛號|初診|第一次去|第一次來|第一次看/.test(message);
}

function hasUpperUrinaryEmergencyCue(message) {
  return hasPositiveBloodUrineCue(message) && hasPositiveBackPainCue(message) && hasPositiveFeverCue(message);
}

function asksSuitabilityPriceOrNextStep(message) {
  return /直接做|可以做|可以看|適合|費用|價格|價錢|多少錢|一次|療程|預約|掛號|掛哪|看哪|泌尿科|婦產科|下一步|怎麼約|怎麼預約|抗生素|吃藥|吃.*藥|急診|就醫/.test(message);
}

function asksUrologyOrGynecologyRoute(message) {
  return /泌尿科|婦產科|可以看|看哪|掛哪|差在哪|差別|不同/.test(message);
}

function isFemaleUrologyFeeFollowUp(message, conversationHistory) {
  if (!/費用|價格|價錢|多少錢|報價|範圍|一次|療程/.test(message)) return false;
  if (hasExplicitNonFemaleUrologyTopic(message)) return false;
  if (hasExplicitScheduleIntent(message)) return false;

  const recentText = [...conversationHistory]
    .slice(-8)
    .map((historyMessage) => historyMessage.content ?? "")
    .join("\n");

  return /女性泌尿|漏尿|尿失禁|頻尿|膀胱過動|應力性尿失禁|骨盆底肌|美磁波|磁波鍛肌椅|鍛肌椅|高密度磁波/.test(recentText);
}

function hasExplicitNonFemaleUrologyTopic(message) {
  return /HPV|九價|疫苗|匿名|篩檢|菜花|性病|結紮|包皮|攝護腺|前列腺|結石|痔瘡|肛門|猛健樂|點滴/.test(message);
}

function hasExplicitScheduleIntent(message) {
  return /排班|固定門診|時段|手術時段|一般泌尿|週[一二三四五六日天].*(早上|上午|下午|晚上|早診|午診|晚診|夜診)|周[一二三四五六日天].*(早上|上午|下午|晚上|早診|午診|晚診|夜診)|星期[一二三四五六日天].*(早上|上午|下午|晚上|早診|午診|晚診|夜診)|禮拜[一二三四五六日天].*(早上|上午|下午|晚上|早診|午診|晚診|夜診)|早診|午診|晚診|夜診/.test(message);
}

function buildSafetyNotes(message) {
  const notes = [];

  if (hasPositiveFeverCue(message) || hasPositiveBloodUrineCue(message) || hasPositiveBackPainCue(message) || /嚴重疼痛|劇痛|很痛/.test(message)) {
    notes.push("若有發燒、血尿、腰痛或嚴重疼痛，需盡快就醫或先電話確認，不建議只等線上回覆。");
  }

  if (hasPositiveUrinationPainCue(message) || /泌尿道感染|感染/.test(message)) {
    notes.push("有尿痛時需先評估是否感染，不能只線上判斷或直接安排療程。");
  }

  if (/懷孕|月經.*晚|月經.*沒來|可能有孕|不確定有沒有孕/.test(message)) {
    notes.push("若可能懷孕，也要先讓醫師或診所人員確認是否適合。");
  }

  if (/今天|直接做|直接安排/.test(message) && notes.length > 0) {
    notes.push("今天能不能直接做，需確認上述狀況後再安排。");
  }

  if (/急診/.test(message) && notes.length === 0 && hasLowRiskNegatedSymptomCue(message)) {
    notes.push("以你描述沒有尿痛、發燒、腰痛或血尿，通常不需要先急診；但是否適合美磁波或其他療程仍需門診評估漏尿原因。");
  }

  return notes.join("");
}

function isFemaleUtiUrgentQuestion(message) {
  return (
    (hasPositiveUrinationPainCue(message) || /泌尿道感染|膀胱炎/.test(message)) &&
    (hasPositiveFeverCue(message) || hasPositiveBloodUrineCue(message) || hasPositiveBackPainCue(message) || /懷孕|月經.*晚|月經.*沒來|不確定有沒有孕|可能有孕|抗生素|吃藥/.test(message))
  );
}

function answerFemaleUtiUrgentQuestion(message) {
  const symptoms = ["尿痛"];
  if (hasPositiveBloodUrineCue(message)) symptoms.push("尿紅/血尿");
  if (hasPositiveBackPainCue(message)) symptoms.push("腰痠/腰痛");
  if (hasPositiveFeverCue(message)) symptoms.push("發燒");

  const hasPregnancyCue = /懷孕|月經.*晚|月經.*沒來|不確定有沒有孕|可能有孕/.test(message);
  const pregnancyNote = hasPregnancyCue
    ? "加上月經晚或不確定是否懷孕，要先當成可能泌尿道感染或孕期感染風險；"
    : "要先評估是否為泌尿道感染；";
  const medicationAssessment = hasPregnancyCue
    ? "感染、是否懷孕與適合用藥"
    : "感染與適合用藥";

  const treatmentDelay = /漏尿|美磁波|鍛肌椅|高密度磁波|療程/.test(message)
    ? "今天先不要坐美磁波鍛肌椅；漏尿或療程問題先延後，"
    : "";

  return [
    `${symptoms.join("、")}，${pregnancyNote}光靠訊息無法診斷。`,
    `${treatmentDelay}不要自行吃家裡剩的抗生素；現在要由醫師評估${medicationAssessment}。`,
    `請現在電話 ${PHONE} 確認最快可評估時段；若高燒、腰痛加劇、血尿變多、明顯不舒服、尿不出來或診所無法即時安排，請直接急診/立即就醫。`
  ].join("");
}

function hasPositiveUrinationPainCue(message) {
  if (/尿尿不會痛|尿尿不痛|解尿不會痛|解尿不痛|排尿不會痛|排尿不痛|沒有尿痛|沒尿痛|無尿痛|尿尿沒有痛|尿尿沒痛/.test(message)) return false;
  return /尿痛|尿尿.*痛|解尿.*痛|排尿.*痛/.test(message);
}

function hasPositiveFeverCue(message) {
  if (/沒有發燒|沒發燒|無發燒|不發燒|沒有高燒|沒高燒|無高燒/.test(message)) return false;
  return /發燒|高燒|體溫\s*3[89](?:\.\d)?|燒到\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);
}

function hasPositiveBackPainCue(message) {
  if (/沒有(?:發燒|高燒)?(?:或|、|和|跟)?腰痛|沒(?:有)?(?:發燒|高燒)?(?:或|、|和|跟)?腰痛|無(?:發燒|高燒)?(?:或|、|和|跟)?腰痛|腰不痛|腰沒有痛|腰沒痛|沒有(?:發燒|高燒)?(?:或|、|和|跟)?腰痠|沒(?:有)?(?:發燒|高燒)?(?:或|、|和|跟)?腰痠|無(?:發燒|高燒)?(?:或|、|和|跟)?腰痠/.test(message)) return false;
  return /腰痛|腰.*痛|腰.*痠/.test(message);
}

function hasPositiveBloodUrineCue(message) {
  if (/沒有(?:尿血|血尿)|沒(?:有)?(?:尿血|血尿)|無(?:尿血|血尿)|尿沒有血|尿沒血|尿不紅/.test(message)) return false;
  return /血尿|尿.*血|尿.*紅/.test(message);
}

function hasLowRiskNegatedSymptomCue(message) {
  return /不會痛|不痛|沒有發燒|沒發燒|無發燒|沒有(?:發燒|高燒)?(?:或|、|和|跟)?腰痛|腰不痛|沒有(?:尿血|血尿)|尿不紅/.test(message);
}
