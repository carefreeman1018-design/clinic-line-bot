const PHONE = "02-2511-9488";

export function answerSexualFunctionQuestion(message) {
  if (!isSexualFunctionQuestion(message)) return null;

  if (isShockwaveQuestion(message)) {
    return [
      "診所有提供性功能障礙評估與低能量震波治療。",
      "低能量震波主要評估用於血管性勃起功能障礙；不是所有硬度不穩、做到一半軟掉都適合，也不能保證療效。",
      "醫師需先判斷是心因性、血管性或混合性，再討論療程次數與費用。",
      `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

  return [
    "診所有提供性功能障礙評估與治療，包含勃起功能障礙、硬度不足、早洩、陽痿或遲射等問題。",
    "原因可能和血管、三高、壓力、心理、神經或生活因素有關，不能只用 LINE 判斷或直接開藥。",
    `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
  ].join("");
}

function isSexualFunctionQuestion(message) {
  return /性功能障礙|勃起功能|勃起障礙|陽痿|不舉|硬度|容易軟|軟掉|早洩|遲射|持久|低能量震波|線性震波|震波治療|LI-ESWT|Piezowave/i.test(message);
}

function isShockwaveQuestion(message) {
  return /低能量震波|線性震波|震波治療|震波|LI-ESWT|Piezowave/i.test(message);
}
