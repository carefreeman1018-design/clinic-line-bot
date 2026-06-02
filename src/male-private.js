const PHONE = "02-2511-9488";

export function answerMalePrivateSurgeryQuestion(message) {
  if (!isMalePrivateQuestion(message)) return null;
  if (!asksOutcomePriceOrNextStep(message)) return null;

  return [
    "診所有提供男性私密處微創、陰莖增大與龜頭減敏相關門診評估。",
    "這類治療不能保證尺寸、持久度或效果，是否適合、方式與風險都需要醫師評估；費用也需依評估後確認。",
    `下一步可先電話 ${PHONE}，或留下姓名、電話與方便時段，請診所人員協助安排諮詢。`
  ].join("");
}

function isMalePrivateQuestion(message) {
  return /男性私密|私密處微創|陰莖增大|龜頭減敏|龜頭.*敏感|GG\s*增大|持久|早洩/.test(message);
}

function asksOutcomePriceOrNextStep(message) {
  return /保證|效果|變大|持久|適合|費用|價格|價錢|多少錢|風險|恢復|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}
