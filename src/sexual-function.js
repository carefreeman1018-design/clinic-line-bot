const PHONE = "02-2511-9488";

export function answerSexualFunctionQuestion(message) {
  if (!isSexualFunctionQuestion(message)) return null;

  if (isPde5CardiacRiskQuestion(message)) {
    return [
      "有心臟病、胸悶時會含硝化甘油，又想使用威而鋼或犀利士，這是需要特別小心的用藥安全問題。",
      "硝化甘油/硝酸鹽類藥物不可自行和威而鋼、犀利士等 PDE5 抑制劑併用，可能造成危險低血壓；不能直接線上開藥或報價。",
      "胸悶發作時請優先依心臟科或急診指示處理，不要為了性功能藥延誤心血管評估。",
      `下一步：先帶目前用藥清單預約泌尿科或心臟科評估，或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

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
    "原因可能和血管、三高、壓力、心理、神經或生活因素有關，不能只靠訊息判斷或直接開藥。",
    `下一步：先預約泌尿科門診或電話 ${PHONE} 確認可評估時段。`
  ].join("");
}

function isSexualFunctionQuestion(message) {
  if (/男性私密|私密處微創|陰莖增大|龜頭減敏|龜頭.*敏感|GG\s*增大/.test(message)) return false;
  return /性功能障礙|勃起功能|勃起障礙|陽痿|不舉|硬度|容易軟|軟掉|早洩|遲射|持久|威而鋼|犀利士|PDE5|低能量震波|線性震波|震波治療|LI-ESWT|Piezowave/i.test(message);
}

function isShockwaveQuestion(message) {
  return /低能量震波|線性震波|震波治療|震波|LI-ESWT|Piezowave/i.test(message);
}

function isPde5CardiacRiskQuestion(message) {
  return (
    /威而鋼|犀利士|PDE5|性功能藥|壯陽藥/i.test(message) &&
    /硝化甘油|硝酸鹽|nitro|NTG|心臟病|胸悶|胸痛|血壓藥|低血壓/i.test(message)
  );
}
