const PHONE = "02-2511-9488";

export function answerFemaleUrologyQuestion(message) {
  if (hasExplicitMaleSelfCue(message)) return null;
  if (!isFemaleUrologyQuestion(message) && !isFemaleUtiUrgentQuestion(message)) return null;
  if (!asksSuitabilityPriceOrNextStep(message)) return null;

  if (isFemaleUtiUrgentQuestion(message)) {
    return answerFemaleUtiUrgentQuestion(message);
  }

  if (asksUrologyOrGynecologyRoute(message)) {
    return [
      "女性漏尿和頻尿可以先掛泌尿科門診評估。",
      "診所會評估是否需要轉介婦產科或其他專科；建議先預約泌尿科門診，由醫師檢查後判斷下一步。"
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
  return /女性泌尿|漏尿|尿失禁|骨盆底肌|美磁波|鍛肌椅|高密度磁波/.test(message);
}

function hasExplicitMaleSelfCue(message) {
  return /我是男生|我是男性|我是男的|我.*男生|我.*男性|我.*男的/.test(message);
}

function asksSuitabilityPriceOrNextStep(message) {
  return /直接做|可以做|可以看|適合|費用|價格|價錢|多少錢|一次|療程|預約|掛號|掛哪|看哪|泌尿科|婦產科|下一步|怎麼約|怎麼預約|抗生素|吃藥|吃.*藥|急診|就醫/.test(message);
}

function asksUrologyOrGynecologyRoute(message) {
  return /泌尿科|婦產科|可以看|看哪|掛哪/.test(message);
}

function buildSafetyNotes(message) {
  const notes = [];

  if (/發燒|高燒|血尿|尿.*血|尿.*紅|腰痛|腰.*痛|腰.*痠|嚴重疼痛|劇痛|很痛/.test(message)) {
    notes.push("若有發燒、血尿、腰痛或嚴重疼痛，需盡快就醫或先電話確認，不建議只等線上回覆。");
  }

  if (/尿痛|尿尿.*痛|解尿.*痛|排尿.*痛|泌尿道感染|感染/.test(message)) {
    notes.push("有尿痛時需先評估是否感染，不能只線上判斷或直接安排療程。");
  }

  if (/懷孕|月經.*晚|月經.*沒來|可能有孕|不確定有沒有孕/.test(message)) {
    notes.push("若可能懷孕，也要先讓醫師或診所人員確認是否適合。");
  }

  if (/今天|直接做|直接安排/.test(message) && notes.length > 0) {
    notes.push("今天能不能直接做，需確認上述狀況後再安排。");
  }

  return notes.join("");
}

function isFemaleUtiUrgentQuestion(message) {
  return (
    /尿痛|尿尿.*痛|解尿.*痛|排尿.*痛|泌尿道感染|膀胱炎/.test(message) &&
    /發燒|高燒|血尿|尿.*血|尿.*紅|腰痛|腰.*痛|腰.*痠|懷孕|月經.*晚|月經.*沒來|不確定有沒有孕|可能有孕|抗生素|吃藥/.test(message)
  );
}

function answerFemaleUtiUrgentQuestion(message) {
  const symptoms = ["尿痛"];
  if (/血尿|尿.*血|尿.*紅/.test(message)) symptoms.push("尿紅/血尿");
  if (/腰痛|腰.*痛|腰.*痠/.test(message)) symptoms.push("腰痠/腰痛");
  if (/發燒|高燒/.test(message)) symptoms.push("發燒");

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
