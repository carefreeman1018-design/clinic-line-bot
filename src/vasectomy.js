const PHONE = "02-2511-9488";

export function answerVasectomyQuestion(message) {
  if (!isVasectomyQuestion(message)) return null;
  if (!asksSchedulePriceReversalOrSafety(message)) return null;

  if (asksPostVasectomyContraception(message)) {
    return [
      "結紮後不能馬上停止避孕。",
      "官網提醒輸精管與儲精囊可能還有殘存精子，需等殘存精子排出，並做精液檢查確認後，才能依醫師指示調整避孕方式。",
      `若要確認回診或檢查時程，可電話 ${PHONE} 詢問。`
    ].join("");
  }

  return [
    "診所有提供男性無刀口結紮手術評估。",
    "能不能當天安排、手術方式與費用，需由醫師術前評估並依當天時段確認。",
    "結紮屬於重大生育決定；之後可評估輸精管重接，但不能保證恢復生育。",
    `下一步可留下姓名、電話、方便時段與想諮詢結紮，或電話 ${PHONE} 確認。`
  ].join("");
}

function isVasectomyQuestion(message) {
  return /男性結紮|無刀口結紮|雷射結紮|輸精管結紮|避孕手術|結紮/.test(message);
}

function asksSchedulePriceReversalOrSafety(message) {
  return /今天|當天|直接做|看完就手術|快速通關|費用|價格|價錢|多少錢|保證|接回來|恢復|復原|可逆|後悔|避孕|無套|精液|驗精|殘存精子|預約|掛號|下一步|怎麼約|怎麼預約/.test(message);
}

function asksPostVasectomyContraception(message) {
  return /術後|做完|結紮後|馬上|立即|不用避孕|停止避孕|無套|精液|驗精|殘存精子/.test(message);
}
