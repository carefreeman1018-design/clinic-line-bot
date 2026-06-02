const PHONE = "02-2511-9488";

export function answerCircumcisionFastPassQuestion(message) {
  if (!isCircumcisionQuestion(message)) return null;
  if (!asksFastPassPriceOrNextStep(message)) return null;

  const parts = [
    "診所有提供割包皮/包皮槍手術評估，也有快速通關服務可協助確認。",
  ];

  if (hasBloodThinnerOrCardiacRisk(message)) {
    parts.push("你有心臟支架且正在吃阿斯匹靈、保栓通或其他抗凝血/抗血小板藥時，不建議自行停藥，也不能先保證明天直接手術。");
    parts.push("需由醫師確認心血管病史、目前用藥與出血/血栓風險後，再決定能否手術、是否需調整藥物與時段。");
  }

  parts.push("能不能當天看診後手術、以及實際費用，需依醫師術前評估、手術方式與當天時段安排確認。");
  parts.push(`下一步請留下姓名、電話、方便時段與想做的項目；若有心臟病史或用藥，請一併提供，或直接電話 ${PHONE} 確認。`);

  return parts.join("");
}

function isCircumcisionQuestion(message) {
  return /割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(message);
}

function asksFastPassPriceOrNextStep(message) {
  return /今天|當天|看完就手術|看診.*手術|快速通關|費用|價格|價錢|多少錢|下一步|怎麼約|怎麼預約|預約|掛號/.test(message);
}

function hasBloodThinnerOrCardiacRisk(message) {
  return /抗凝血|抗血小板|阿斯匹靈|阿司匹靈|保栓通|Plavix|clopidogrel|warfarin|華法林|Xarelto|拜瑞妥|Eliquis|艾必克凝|Pradaxa|心臟支架|支架|心臟病|中風|血栓|自行停藥|自己停藥|停藥/.test(message);
}
