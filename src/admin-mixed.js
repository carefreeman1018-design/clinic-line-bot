const PHONE = "02-2511-9488";

export function answerAdminMixedQuestion(message) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  if (asksOnlineRegistrationChange(normalized)) {
    return [
      "已線上掛號但想改今天晚上，不能只靠 LINE 訊息直接保證改成功。",
      `請先電話 ${PHONE}，或到現場櫃台請人員查詢能否改晚診；名額與臨時異動以診所人員確認為準。`
    ].join("\n");
  }

  if (asksRouteWithArrivalRegistration(normalized)) {
    return [
      "行天宮站 4 號出口出站右轉，步行約 40 秒，搭電梯到 3 樓。",
      "到現場先到櫃台報到；若還沒掛號或初診資料未建，櫃台會協助確認掛號流程。"
    ].join("\n");
  }

  if (asksAnonymousScreeningPaymentOrId(normalized)) {
    return [
      "匿名篩檢可到診後向護理人員詢問流程與項目。",
      "刷卡/付款方式知識庫沒有明確公開，不能保證可刷卡；請電話或現場確認。",
      "是否需健保卡或身分證會依篩檢項目與現場流程說明，不能先保證完全不用證件。"
    ].join("\n");
  }

  if (asksOnsiteNextStepForVaccineScreeningRegistration(normalized)) {
    return [
      "你已在診所外，先進去到櫃台或護理站，直接說：想問 HPV 疫苗、匿名篩檢，並需要掛號。",
      "請人員先確認今天名額、疫苗庫存、篩檢流程與費用；不能先保證今天三項都能完成。"
    ].join("\n");
  }

  return null;
}

function asksOnlineRegistrationChange(message) {
  return /線上掛號|網路掛號|預約掛號|已經掛號|已掛號/.test(message)
    && /改|更改|換|調整/.test(message)
    && /今天|今晚|晚上|晚診|夜診/.test(message);
}

function asksRouteWithArrivalRegistration(message) {
  return /第一次去|初診|第一次到|第一次看/.test(message)
    && /行天宮|捷運|MRT|怎麼走|怎麼到|路線|交通/.test(message)
    && /報到|掛號|先/.test(message);
}

function asksAnonymousScreeningPaymentOrId(message) {
  return /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)
    && /刷卡|信用卡|付款|付錢|健保卡|身分證|身份證|證件/.test(message);
}

function asksOnsiteNextStepForVaccineScreeningRegistration(message) {
  return /診所外面|診所門口|已經到|在現場|到現場|我現在在診所/.test(message)
    && /HPV\s*疫苗|九價|疫苗/i.test(message)
    && /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)
    && /掛號|下一步|先做什麼|怎麼做|怎麼辦/.test(message);
}
