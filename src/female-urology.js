const PHONE = "02-2511-9488";

export function answerFemaleUrologyQuestion(message) {
  if (!isFemaleUrologyQuestion(message)) return null;
  if (!asksSuitabilityPriceOrNextStep(message)) return null;

  return [
    "診所有提供女性泌尿、漏尿評估，也有美磁波鍛肌椅相關服務。",
    "是否適合療程需先由醫師評估漏尿原因；費用目前知識庫沒有公開明確數字。",
    `下一步可先電話 ${PHONE}，或留下姓名、電話與方便時段，請診所人員協助確認。`
  ].join("");
}

function isFemaleUrologyQuestion(message) {
  return /女性泌尿|漏尿|尿失禁|骨盆底肌|美磁波|鍛肌椅|高密度磁波/.test(message);
}

function asksSuitabilityPriceOrNextStep(message) {
  return /直接做|可以做|適合|費用|價格|價錢|多少錢|一次|療程|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}
