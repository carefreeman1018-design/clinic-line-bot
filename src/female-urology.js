const PHONE = "02-2511-9488";

export function answerFemaleUrologyQuestion(message, conversationHistory = []) {
  const officialUtiInfoReply = answerOfficialUtiInfoQuestion(message);
  if (officialUtiInfoReply) return officialUtiInfoReply;

  if (hasExplicitMaleSelfCue(message)) return null;
  if (hasMaleSpecificUrologyCue(message)) return null;
  if (hasAdministrativeIdCue(message) && !hasFemaleSpecificCue(message)) return null;
  if (!hasFemaleSpecificCue(message) && hasUpperUrinaryEmergencyCue(message)) return null;
  const isFemaleUrologyFollowUp = isFemaleUrologyFeeFollowUp(message, conversationHistory);
  if (!isFemaleUrologyQuestion(message) && !isFemaleUtiUrgentQuestion(message) && !isFemaleUrologyFollowUp) return null;
  const officialMagneticFaqReply = answerOfficialMagneticChairFaq(message);
  if (officialMagneticFaqReply) return officialMagneticFaqReply;
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
    "是否適合療程需先由醫師評估漏尿原因；費用需依評估與療程安排確認。",
    safetyNotes,
    `下一步可先電話 ${PHONE}，或留下姓名、電話與方便時段，請診所人員協助確認。`
  ].filter(Boolean).join("");
}

function answerOfficialUtiInfoQuestion(message) {
  if (/女生.*反覆.*泌尿道|女性.*反覆.*泌尿道|泌尿道.*反覆感染/.test(message)) {
    return [
      "女性泌尿道反覆感染常和生活習慣、生理結構或其他問題有關。",
      "常見誘因包含長時間忍尿、喝水太少、親密行為或避孕方式不當、私密處清潔方式不正確、更年期後風險上升；也可能和廔管或結石等狀況有關。",
      "如果反覆發作，建議到泌尿科評估原因，再決定治療和預防方式。"
    ].join("");
  }

  if (/泌尿道感染.*原因|尿道炎.*原因|感染.*原因|為什麼.*泌尿道.*感染|泌尿道.*怎麼造成/.test(message)) {
    return [
      "泌尿道感染常見原因包含大腸桿菌、淋病雙球菌、披衣菌、單純皰疹病毒、巨細胞病毒等感染。",
      "生活習慣也會增加風險，例如長時間忍尿、喝水太少、親密行為或避孕方式不當、私密處清潔方式不正確；更年期後感染機率也會提高。",
      "若已經有尿痛、頻尿、發燒、血尿或腰痛，就建議直接看診評估，不要只靠訊息判斷。"
    ].join("");
  }

  return null;
}

function answerOfficialMagneticChairFaq(message) {
  if (!/美磁波|磁波|鍛肌椅|高密度磁波/.test(message)) return null;

  if (/原理|是什麼|怎麼|如何|作用/.test(message)) {
    return "高密度磁波治療是透過鍛肌椅的雙感應線圈產生超高密度磁場，使體內產生渦電流引發神經去極化，讓肌肉收縮、放鬆，以改善骨盆底與患處循環，重建骨盆底肌與制尿系統的力量和耐力。";
  }

  if (/自我評估|哪些.*困擾|什麼.*困擾|適合.*評估|漏尿|尿失禁|夜尿|骨盆底肌/.test(message)) {
    return [
      "高密度磁波治療可評估的骨盆底肌相關困擾包含：女性產後或未生產但咳嗽、打噴嚏、大笑會漏尿/尿失禁，夜尿影響睡眠，泌尿或生殖系統反覆感染，或私密處不適影響親密關係與生活。",
      "男性若因前列腺手術、缺乏運動、體重過重、長期便秘、經常提重物、慢性咳嗽等造成慢性骨盆腔疼痛、大小便失禁、排便困難、無法控制肛門排氣、頻尿急尿或性功能表現受影響，也可由醫師評估。"
    ].join("");
  }

  if (/痛|疼痛|會不會痛/.test(message)) {
    return "高密度磁波治療不會有疼痛感；多數人會感覺盆底肌肉收縮，治療部位可能有麻麻的電流感，通常不會不適，稍微休息後即可解除。";
  }

  if (/維持|效果.*多久|撐多久/.test(message)) {
    return "臨床研究顯示治療後 5–6 個月仍有 75% 患者維持良好盆底肌效果；高風險族群或已有症狀者，可評估持續治療或搭配凱格爾運動保養。";
  }

  if (/多久|幾次|療程|有效/.test(message)) {
    return "高密度磁波每次療程 30 分鐘、每週 2 次，間隔 2–5 天；建議做 4–6 次並最好在 3 週內完成，有些人做 1–2 次後就會感覺差異。";
  }

  if (/準備|穿什麼|金屬|手機/.test(message)) {
    return "治療前著寬鬆衣褲即可；需移除治療部位周邊金屬配件，手機也不可直接靠近儀器。";
  }

  if (/訓練球|凱格爾|差別|不同/.test(message)) {
    return "高密度磁波鍛肌椅是非侵入性且無須更衣的療程，可精準刺激淺層到深層肌肉；盆底肌訓練球則需自行置入陰道，練習不易且有感染或損傷風險。";
  }

  if (/電磁波|輻射|放射線|安全/.test(message)) {
    return "高密度磁波治療使用的電磁能只用於引發骨盆底肌收縮，不具放射線；治療周圍電磁波甚至低於生活環境中的其他電磁波，且產品通過衛署醫器輸字第 036902 號認證，安全無虞。";
  }

  if (/自費|健保|給付|費用/.test(message)) {
    return "高密度磁波治療屬自費項目，健保無給付；詳細療程效果與方式仍需以醫師親自說明為準。";
  }

  return null;
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
    `建議預約門診；也請現在電話 ${PHONE} 確認最快可評估時段。若高燒、腰痛加劇、血尿變多、明顯不舒服、尿不出來或診所無法即時安排，請直接急診/立即就醫。`
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
