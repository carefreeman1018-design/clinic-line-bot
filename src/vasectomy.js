const PHONE = "02-2511-9488";

export function answerVasectomyQuestion(message) {
  if (!isVasectomyQuestion(message)) return null;

  if (isPostVasectomyUrgentQuestion(message)) {
    return [
      "結紮後第 2 天陰囊越來越腫、瘀青變大、傷口滲血，又很痛或發燒，不能只用 LINE 判斷。",
      "這可能需要排除術後血腫、感染或持續出血；不建議只冰敷、吃止痛藥等到明天。",
      `請現在先電話 ${PHONE} 聯絡診所確認最快處理方式；若聯絡不上、腫痛快速加劇、發燒或出血變多，請直接急診/立即就醫。`
    ].join("");
  }

  if (!asksSchedulePriceReversalOrSafety(message)) return null;

  if (asksSexualFunctionImpact(message)) {
    return [
      "官網說明輸精管結紮不會阻斷男性荷爾蒙運作。",
      "手術後仍會射精，通常不會明顯影響性慾、勃起功能、射精感或精液量；但個人狀況仍建議門診由醫師評估與說明。",
      `下一步：先預約男性結紮諮詢，或電話 ${PHONE} 確認可評估時段。`
    ].join("");
  }

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
  return /今天|當天|直接做|看完就手術|快速通關|費用|價格|價錢|多少錢|保證|接回來|恢復|復原|可逆|後悔|避孕|無套|精液|驗精|殘存精子|性慾|勃起|性能力|射精|射精量|荷爾蒙|預約|掛號|下一步|怎麼約|怎麼預約|術後|做完|傷口|陰囊|瘀青|發燒|滲血|出血|血腫|很痛|急診|回診/.test(message);
}

function asksPostVasectomyContraception(message) {
  return /術後|做完|結紮後|馬上|立即|不用避孕|停止避孕|無套|精液|驗精|殘存精子/.test(message);
}

function asksSexualFunctionImpact(message) {
  return /性慾|勃起|性能力|射精量|射精感|荷爾蒙|精液量|影響.*射精|影響.*性/.test(message);
}

function isPostVasectomyUrgentQuestion(message) {
  return (
    /結紮|輸精管/.test(message) &&
    /術後|做完|第\s*\d{1,2}\s*天|第\s*[一二三四五六七八九十]\s*天/.test(message) &&
    /陰囊|傷口|睪丸/.test(message) &&
    /越來越腫|腫|瘀青|滲血|出血|血腫|很痛|疼痛|發燒|化膿|流膿|急診|回診/.test(message)
  );
}
