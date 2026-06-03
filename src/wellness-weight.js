const PHONE = "02-2511-9488";

export function answerWellnessWeightQuestion(message) {
  if (!isWellnessWeightQuestion(message)) return null;

  if (isMounjaroQuestion(message)) {
    const hasPregnancyOrBreastfeeding = /懷孕|備孕|哺乳|餵奶|母奶|產後|月經.*晚|可能.*孕|pregnan|breastfeeding|postpartum/i.test(message);
    const asksSelfUseOrDose = /朋友|剩下|剩的|自己.*打|自行.*打|自己.*用|自行.*用|劑量|最低劑量|幾.*mg|多少.*mg|dose|leftover|lowest dose|myself/i.test(message);
    const hasPostInjectionSideEffects = /打.*後|打完|上週.*打|已經.*打|下一針|下次.*打/i.test(message) && /噁心|想吐|嘔吐|吐|肚子痛|肚子.*悶|腹痛|胃痛|拉肚子|腹瀉|脫水|吃不下/i.test(message);

    if (hasPregnancyOrBreastfeeding && asksSelfUseOrDose) {
      return [
        "診所有猛健樂門診，但你正在產後/哺乳，又想用朋友剩下的藥筆，這種情況不能直接施打。",
        "不建議自行使用，也不能在線上告訴你最低劑量或 mg 用法；是否適合需由醫師評估後開立。",
        `下一步請先電話 ${PHONE} 確認可評估時段，並帶目前用藥與產後/哺乳狀況。`
      ].join("");
    }

    if (hasPostInjectionSideEffects) {
      return [
        "診所有猛健樂門診。你已經施打後有持續噁心、嘔吐或腹痛，下一針不要自行照打，也不要自行調劑量。",
        "需先回診或電話確認，由醫師評估是否要延後、調整或停用；若腹痛明顯加劇、持續吐到喝不下、發燒、脫水或冒冷汗，請直接急診/立即就醫。",
        `下一步請先電話 ${PHONE} 確認可回診評估時段，並帶目前用藥與施打日期。`
      ].join("");
    }

    const historyNote = /甲狀腺癌|甲狀腺.*癌|胰臟炎|胰腺炎|胰臟/.test(message)
      ? "有甲狀腺癌病史、家族史或曾胰臟炎時，更需要門診讓醫師確認風險與是否適合。"
      : "";
    const pregnancyNote = hasPregnancyOrBreastfeeding
      ? "若正在懷孕、備孕、哺乳或產後狀態，需先由醫師確認是否適合，不能直接安排施打。"
      : "";
    const selfUseNote = asksSelfUseOrDose
      ? "不建議使用朋友剩下的藥筆，也不能在線上提供起始劑量或 mg 用法；用藥需由醫師評估與開立。"
      : "";

    return [
      "診所有猛健樂門診。猛健樂屬於體重管理輔助療法，不能在線上判斷是否適合或直接安排施打。",
      "是否適合需要醫師依 BMI、共病、目前用藥與身體狀況評估；正在吃糖尿病藥或擔心副作用，也要在門診先確認。",
      historyNote,
      pregnancyNote,
      selfUseNote,
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
