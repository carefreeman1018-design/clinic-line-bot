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

  if (asksCertificateOrReceipt(normalized)) {
    return [
      "看診時或結帳前，先跟櫃台或醫師說明需要診斷證明或收據。",
      "診斷證明需由醫師依實際看診內容評估後開立。",
      "費用、格式、能否補開，請讓櫃台現場或電話確認。"
    ].join("\n");
  }

  if (asksWheelchairElevatorAccess(normalized)) {
    return [
      "可以從行天宮站 4 號出口附近，進診所所在大樓後搭電梯到 3 樓。",
      `行動不便可先電話 ${PHONE} 告知；抵達後請櫃台協助動線或上下樓需求。`,
      "如果入口或電梯位置不確定，也建議先電話確認。"
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
      "如果你已經在外面，先上 3 樓到櫃台或護理站說：想問匿名篩檢跟 HPV。",
      "要不要抽號或掛號、今天名額、疫苗庫存、篩檢流程和費用，現場人員會幫你確認；不能先保證今天都能做。"
    ].join("\n");
  }

  return null;
}

function asksOnlineRegistrationChange(message) {
  return /線上掛號|網路掛號|預約掛號|已經掛號|已掛號/.test(message)
    && /改|更改|換|調整/.test(message)
    && /今天|今晚|晚上|晚診|夜診/.test(message);
}

function asksCertificateOrReceipt(message) {
  return /診斷證明|診斷書|證明書|就醫證明|收據|醫療收據|費用收據|發票/.test(message)
    && /開|申請|需要|要先|先跟誰說|找誰|補開|拿|領|可以/.test(message);
}

function asksWheelchairElevatorAccess(message) {
  return /輪椅|行動不便|行動不方便|走路不方便|長輩|老人家|爸爸|媽媽/.test(message)
    && /電梯|上去|上樓|到\s*3\s*樓|到三樓|無障礙|怎麼走|入口|動線/.test(message);
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
  return /診所外面|診所門口|已經到|在現場|到現場|我現在在診所|人在外面|我在外面|在外面|外面/.test(message)
    && /HPV\s*疫苗|HPV|九價|疫苗/i.test(message)
    && /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)
    && /掛號|抽號|號碼牌|下一步|先做什麼|怎麼做|怎麼辦|先去哪|先問誰|不想看長文|長文|簡短/.test(message);
}
