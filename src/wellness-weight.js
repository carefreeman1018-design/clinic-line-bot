const PHONE = "02-2511-9488";

export function answerWellnessWeightQuestion(message) {
  if (!isWellnessWeightQuestion(message)) return null;

  if (isMounjaroQuestion(message)) {
    const historyNote = /甲狀腺癌|甲狀腺.*癌|胰臟炎|胰腺炎|胰臟/.test(message)
      ? "有甲狀腺癌病史、家族史或曾胰臟炎時，更需要門診讓醫師確認風險與是否適合。"
      : "";

    return [
      "診所有猛健樂門診。猛健樂屬於體重管理輔助療法，不能在線上判斷是否適合或直接安排施打。",
      "是否適合需要醫師依 BMI、共病、目前用藥與身體狀況評估；正在吃糖尿病藥或擔心副作用，也要在門診先確認。",
      historyNote,
      "不能保證會瘦幾公斤，療效與副作用都需依個人狀況追蹤。",
      `費用與當天能否安排需由診所確認。下一步：先電話 ${PHONE} 確認可評估時段，並帶目前用藥資訊。`
    ].join("");
  }

  return [
    "診所有提供客製化功能性修復點滴。",
    "官網列出的方向包含免疫提升防護、元氣護肝保健、排毒疲勞解酒與術後修復。",
    "不能保證打完一定恢復精神；是否適合、配方、風險與今天能不能施打，都需要醫師評估並由專業醫療人員操作。",
    `費用需依評估後確認。下一步：先電話 ${PHONE} 確認可諮詢時段。`
  ].join("");
}

function isWellnessWeightQuestion(message) {
  return /猛健樂|Mounjaro|Tirzepatide|減重|體重管理|瘦瘦筆|功能性修復點滴|保健點滴|術後修復點滴|點滴/i.test(message);
}

function isMounjaroQuestion(message) {
  return /猛健樂|Mounjaro|Tirzepatide|減重|體重管理|瘦瘦筆|BMI/i.test(message);
}
