const PHONE = "02-2511-9488";

export function answerWellnessWeightQuestion(message) {
  if (!isWellnessWeightQuestion(message)) return null;

  if (isMounjaroQuestion(message)) {
    return [
      "診所有猛健樂門診。猛健樂屬於體重管理輔助療法，不能在線上判斷是否適合或直接安排施打。",
      "是否適合需要醫師依 BMI、共病、目前用藥與身體狀況評估；正在吃糖尿病藥或擔心副作用，也要在門診先確認。",
      `費用與當天能否安排需由診所確認。下一步：先電話 ${PHONE} 確認可評估時段，並帶目前用藥資訊。`
    ].join("");
  }

  return [
    "診所有提供客製化功能性修復點滴。",
    `是否適合需由醫師評估健康狀況與需求；可先電話 ${PHONE} 確認可諮詢時段。`
  ].join("");
}

function isWellnessWeightQuestion(message) {
  return /猛健樂|Mounjaro|Tirzepatide|減重|體重管理|瘦瘦筆|功能性修復點滴|保健點滴|術後修復點滴|點滴/i.test(message);
}

function isMounjaroQuestion(message) {
  return /猛健樂|Mounjaro|Tirzepatide|減重|體重管理|瘦瘦筆|BMI|糖尿病|一針|打針|直接打|副作用/i.test(message);
}
