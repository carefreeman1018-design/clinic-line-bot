const PHONE = "02-2511-9488";

export function answerCircumcisionFastPassQuestion(message) {
  if (!isCircumcisionQuestion(message)) return null;
  if (!asksFastPassPriceOrNextStep(message)) return null;

  return [
    "診所有提供割包皮/包皮槍手術評估，也有快速通關服務可協助確認。",
    "但能不能當天看診後手術、以及實際費用，需依醫師術前評估、手術方式與當天時段安排確認。",
    `下一步請留下姓名、電話、方便時段與想做的項目，或直接電話 ${PHONE} 確認。`
  ].join("");
}

function isCircumcisionQuestion(message) {
  return /割包皮|包皮槍|包皮環切|包莖|包皮過長/.test(message);
}

function asksFastPassPriceOrNextStep(message) {
  return /今天|當天|看完就手術|看診.*手術|快速通關|費用|價格|價錢|多少錢|下一步|怎麼約|怎麼預約|預約|掛號/.test(message);
}
