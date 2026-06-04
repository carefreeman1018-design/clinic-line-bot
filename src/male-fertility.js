const PHONE = "02-2511-9488";

export function answerMaleFertilityQuestion(message) {
  if (!isMaleFertilityQuestion(message)) return null;

  if (isVaricoceleQuestion(message)) {
    return [
      "備孕一年未成功、精液活動力偏低，又懷疑精索靜脈曲張，需由泌尿科把精液報告、理學檢查與陰囊超音波一起評估。",
      "診所有精索靜脈曲張評估與顯微精索靜脈曲張手術相關專長，但不能只靠訊息或單一報告直接安排手術、保證改善受孕，費用也需評估後確認。",
      `下一步：帶精液報告與既有檢查預約泌尿科門診；伴侶端也建議同步由婦產科/生殖醫學評估。可電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "備孕超過一年未成功或精液報告異常，建議由泌尿科評估男性因素，不能只靠訊息解讀個人報告或保證治療效果。",
    `下一步：帶精液報告與既有檢查預約門診；伴侶端也建議同步評估。可電話 ${PHONE} 確認可評估時段。`
  ].join("");
}

function isMaleFertilityQuestion(message) {
  if (/結紮|輸精管/.test(message)) return false;
  return /備孕|不孕|懷孕.*成功|精液報告|精液檢查|精蟲|精子|活動力|精索靜脈曲張/.test(message);
}

function isVaricoceleQuestion(message) {
  return /精索靜脈曲張|靜脈曲張|活動力|精液報告|精液檢查|不孕|備孕/.test(message);
}
