const PHONE = "02-2511-9488";

export function answerFemaleUrologyQuestion(message) {
  if (!isFemaleUrologyQuestion(message)) return null;
  if (!asksSuitabilityPriceOrNextStep(message)) return null;

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

function asksSuitabilityPriceOrNextStep(message) {
  return /直接做|可以做|適合|費用|價格|價錢|多少錢|一次|療程|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}

function buildSafetyNotes(message) {
  const notes = [];

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
