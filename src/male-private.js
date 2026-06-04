const PHONE = "02-2511-9488";

export function answerMalePrivateSurgeryQuestion(message) {
  if (!isMalePrivateQuestion(message)) return null;

  const officialFaqReply = answerOfficialMalePrivateFaq(message);
  if (officialFaqReply) return officialFaqReply;

  if (!asksOutcomePriceOrNextStep(message)) return null;

  return [
    "診所有提供男性私密處微創、陰莖增大與龜頭減敏相關門診評估。",
    "這類治療不能保證尺寸、持久度或效果，是否適合、方式與風險都需要醫師評估；費用也需依評估後確認。",
    `下一步可先電話 ${PHONE}，或留下姓名、電話與方便時段，請診所人員協助安排諮詢。`
  ].join("");
}

function isMalePrivateQuestion(message) {
  return /男性私密|私密處微創|陰莖增大|龜頭減敏|龜頭.*敏感|GG\s*增大|持久|早洩|繫帶|包皮繫帶|珍珠丘疹/.test(message);
}

function answerOfficialMalePrivateFaq(message) {
  if (/繫帶|包皮繫帶/.test(message) && /是什麼|什麼是|意思|功能/.test(message)) {
    return "官網說明，這裡的繫帶微整形特指男性的包皮繫帶；包皮繫帶主要功能是固定並連接龜頭與包皮，勃起時會被拉長。";
  }

  if (/繫帶|包皮繫帶/.test(message) && /什麼情況|何時|需要|調整|切除|延長|放鬆/.test(message)) {
    return "官網說明，如果勃起時覺得繫帶疼痛或不適，或因性行為較激烈造成繫帶受傷，醫師會依情況評估；有需要時可考慮將繫帶切除或延長。";
  }

  if (/繫帶|包皮繫帶/.test(message) && /過短|太短|拉扯|疼痛|不適/.test(message)) {
    return "包皮繫帶過短時，勃起或性行為時可能出現拉扯、疼痛或不適；官網說明可由醫師評估是否需要繫帶切除或延長。";
  }

  if (/繫帶|包皮繫帶/.test(message) && /斷裂|裂開|斷掉|受傷/.test(message)) {
    return "官網說明，如果繫帶只是裂開，可評估延長或放鬆手術；如果已經完全斷掉，則可能需要手術將繫帶重新接上，縫合並固定在適當位置。";
  }

  if (/繫帶|包皮繫帶/.test(message) && /休息|多久|開機|性行為|DIY|自慰|恢復/.test(message)) {
    return "繫帶微整型手術後，無論性行為或 DIY 都建議至少休息 14 天；等縫線完全脫落、傷口完全癒合後，再恢復比較安全。";
  }

  if (/龜頭減敏|龜頭.*敏感/.test(message) && /原理|怎麼|如何|方式|治療|降低|減敏/.test(message)) {
    return "官網說明，龜頭減敏可透過在龜頭皮下注射填充物，形成自然保護膜，以降低龜頭敏感度；是否適合、材料與預期效果仍需由醫師評估。";
  }

  if (/珍珠丘疹/.test(message) && /是什麼|什麼是|怎麼判斷|菜花|性病|會傳染|原因|為什麼/.test(message)) {
    return "珍珠丘疹是常見於龜頭邊緣的一圈小顆粒，屬於良性生理變化，不是性病，也不會傳染；若外觀突然改變、疼痛、搔癢、紅腫或分泌物，建議現場讓醫師確認。";
  }

  return null;
}

function asksOutcomePriceOrNextStep(message) {
  return /保證|效果|變大|持久|適合|費用|價格|價錢|多少錢|風險|恢復|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}
