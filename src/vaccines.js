const PHONE = "02-2511-9488";

export function answerVaccineQuestion(message) {
  if (!isVaccineQuestion(message)) return null;

  const parts = [];

  if (isHpvVaccineQuestion(message)) {
    parts.push("官網列出診所有提供 HPV 疫苗施打，也有提到 HPV 九價疫苗。");
  }

  if (isSkinShinglesVaccineQuestion(message)) {
    parts.push("官網主要診療項目有列出皮蛇疫苗施打。");
  }

  if (parts.length === 0) {
    parts.push("官網列出診所有提供 HPV、皮蛇疫苗施打。");
  }

  if (asksPriceOrStock(message)) {
    parts.push(`價格、庫存與可預約時段目前知識庫沒有公開明確數字，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  if (asksPersonalSuitability(message)) {
    parts.push("是否適合施打、已發生性行為後是否仍適合、劑數/間隔與今天能不能直接打，需由醫師或診所人員依個人狀況與庫存評估。");
  } else if (!asksPriceOrStock(message)) {
    parts.push(`是否適合、庫存與費用，建議電話 ${PHONE} 或由診所人員確認。`);
  }

  return parts.join("");
}

function isVaccineQuestion(message) {
  return /HPV\s*疫苗|九價|子宮頸癌疫苗|皮蛇疫苗|帶狀皰疹疫苗|疫苗/.test(message);
}

function isHpvVaccineQuestion(message) {
  return /HPV\s*疫苗|九價|子宮頸癌疫苗/.test(message);
}

function isSkinShinglesVaccineQuestion(message) {
  return /皮蛇疫苗|帶狀皰疹疫苗/.test(message);
}

function asksPriceOrStock(message) {
  return /價錢|價格|費用|多少錢|幾多錢|庫存|有貨|現貨|名額|預約時段|可預約|今天|直接打|馬上打/.test(message);
}

function asksPersonalSuitability(message) {
  return /過敏|懷孕|備孕|慢性病|免疫|吃藥|用藥|藥物|適合|能不能|可不可以|可以直接打|直接打|馬上打|今天.*打|副作用|禁忌|性行為|有用|有效|幾劑|幾針|劑數|間隔|時程/.test(message);
}
