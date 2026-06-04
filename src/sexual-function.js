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
    const officialFaqReply = answerOfficialShockwaveFaq(message);
    if (officialFaqReply) return officialFaqReply;

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

function answerOfficialShockwaveFaq(message) {
  if (/痛|疼痛|會不會痛|疼嗎/.test(message)) {
    return "官網 FAQ 說明，低能量震波治療過程多少會有些許刺痛；多數病患回饋痛感約像橡皮筋輕彈，若以 1–10 分量化約 0–1 分。醫師可依個人忍受程度調整發數、強度和頻率。";
  }

  if (/多久|幾次|時間|療程/.test(message)) {
    return "官網 FAQ 說明，低能量震波通常一週 1–2 次、一次約 10–15 分鐘，持續 4–6 次不等；有些人初次或第 2–3 次療程後就會感覺差異。";
  }

  if (/維持|效果.*多久|撐多久/.test(message)) {
    return "官網 FAQ 說明，低能量震波療程結束後，多數患者效果平均可維持 12–18 個月以上；若生活習慣較健康且無抽菸，成效可維持更久。";
  }

  if (/恢復期|恢復|休息|當天.*使用|開機/.test(message)) {
    return "官網 FAQ 說明，低能量震波沒有恢復期，單次療程完成後基本上可正常生活；除非有疼痛或不適感才需要暫停，否則當天就可以開機使用。";
  }

  if (/壯陽藥|威而鋼|犀利士|口服藥|搭配/.test(message)) {
    return "官網 FAQ 說明，低能量震波可以依個人需求與情況搭配壯陽口服藥；震波改善組織、結構與血流，口服藥協助血管擴張，兩者可互補。";
  }

  if (/副作用|腫脹|不適/.test(message)) {
    return "官網 FAQ 說明，低能量震波治療後無明顯副作用；極少數患者治療部位可能有些許腫脹或疼痛，約 3–5 天後會慢慢緩解，不影響日常生活。";
  }

  if (/不適合|哪些人|不能做|禁忌/.test(message)) {
    return "官網 FAQ 說明，完全無法勃起的重度功能障礙者、純心因性勃起功能障礙、嚴重神經損傷、有陰莖植入物、陰莖部位明顯傷口/感染/潰瘍、癌症或剛手術者，需由醫師確認是否適合低能量震波。";
  }

  if (/自費|健保|給付|費用/.test(message)) {
    return "官網 FAQ 說明，低能量震波屬自費療程，健保無給付；詳細療程效果與方式仍需以醫師親自說明為準。";
  }

  return null;
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
