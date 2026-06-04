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
  if (/繫帶|包皮繫帶/.test(message) && /休息|多久|開機|性行為|DIY|自慰|恢復/.test(message)) {
    return "繫帶微整型手術後，無論性行為或 DIY 都建議至少休息 14 天；等縫線完全脫落、傷口完全癒合後，再恢復比較安全。";
  }

  if (/珍珠丘疹/.test(message) && /是什麼|什麼是|怎麼判斷|菜花|性病|會傳染|原因|為什麼/.test(message)) {
    return "珍珠丘疹是常見於龜頭邊緣的一圈小顆粒，屬於良性生理變化，不是性病，也不會傳染；若外觀突然改變、疼痛、搔癢、紅腫或分泌物，建議現場讓醫師確認。";
  }

  return null;
}

function asksOutcomePriceOrNextStep(message) {
  return /保證|效果|變大|持久|適合|費用|價格|價錢|多少錢|風險|恢復|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}
