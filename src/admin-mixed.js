const PHONE = "02-2511-9488";

export function answerAdminMixedQuestion(message) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  if (asksTestosteroneBloodDrawOnly(normalized)) {
    return [
      "不能先保證不看醫師就能直接抽血。",
      "睪固酮/男性荷爾蒙檢查通常要由醫師或診所人員先確認檢驗項目、是否需看診/開單，以及採血安排。",
      `要不要空腹、是否建議早上抽、費用與當天能不能抽，請先電話 ${PHONE} 或到現場確認。`
    ].join("\n");
  }

  if (asksVaccineScreeningCounterProcessFee(normalized)) {
    const vaccineItems = asksSkinShinglesVaccine(normalized)
      ? "HPV 疫苗、皮蛇疫苗與匿名篩檢"
      : "HPV 疫苗與匿名篩檢";
    return [
      `可以先到櫃台或電話 ${PHONE} 問 ${vaccineItems}的流程/費用，不一定當天做。`,
      "是否同日可做、是否需看診/評估、疫苗庫存/備苗與篩檢流程，以診所現場與醫師/櫃台確認為準；不保證當天做或金額。"
    ].join("\n");
  }

  if (asksFeePaymentAtCounterWithoutVisit(normalized)) {
    return [
      "可以先到櫃台或請診所人員詢問費用與付款方式，不一定要先決定看診。",
      "但實際費用會依項目、當天流程與是否需要醫師評估而定，不能在 LINE 直接保證金額。",
      `刷卡/付款方式目前沒有明確公開資訊，不能保證一定可刷卡；建議先電話 ${PHONE}，或到現場櫃台確認後再決定。`
    ].join("\n");
  }

  if (asksMedicationBagRefillWithoutVisit(normalized)) {
    return [
      "不能先保證不用看診就能直接拿藥，也不能保證會開一樣的藥。",
      "可以帶上次藥袋、健保卡/身分證先到櫃台，請人員和醫師確認是否適合續拿或需要看診調整。",
      `若症狀變嚴重、發燒、劇烈疼痛、尿不出來、血尿變多或很不舒服，請不要只補藥，應由醫師評估；也可先電話 ${PHONE} 確認流程。`
    ].join("\n");
  }

  if (asksOnlineRegistrationForgotScreenshotCheckin(normalized)) {
    return [
      "如果已經線上掛號但忘記截圖，抵達後請先到 3 樓櫃台，請人員用姓名、電話或身分資料協助查詢並報到。",
      "建議帶健保卡；若是初診，也請帶身分證或其他證件，以及相關檢查資料或用藥資料。",
      "實際是否查得到掛號與能否完成報到，仍以櫃台現場確認為準。"
    ].join("\n");
  }

  if (asksOnlineRegistrationFirstVisitMissingHealthCard(normalized)) {
    return [
      "第一次來、已經線上掛號，到診後請先到 3 樓櫃台報到。",
      "健保卡忘帶能不能先報到，要以櫃台現場核對為準；可能影響健保身分、改自費或後續補件。",
      `先帶身分證給櫃台確認；不確定可先電話 ${PHONE}。`
    ].join("\n");
  }

  if (asksOnlineRegistrationLateArrival(normalized)) {
    return [
      "已線上掛號但可能晚到，不能先保證晚到 20 分鐘一定還看得到。",
      `建議先電話 ${PHONE} 通知並確認；現場會由櫃台依報到時間、醫師門診狀況、號碼/名額安排。`,
      "到診後仍請帶健保卡/身分證到 3 樓櫃台報到。"
    ].join("\n");
  }

  if (asksCheckinDeadlineOrAddOnNearClose(normalized)) {
    return [
      "不能先保證壓線到就一定看得到，也不能保證 17:00 後還能等加號。",
      "午診 13:30-17:00 是診間時段；最晚報到、能否加號或候補，要立刻電話或現場櫃台確認。",
      `如果已經快到診所，先到 3 樓櫃台問；也可先電話 ${PHONE}。`
    ].join("\n");
  }

  if (asksOnlineRegistrationCancellation(normalized)) {
    return [
      "臨時不能去，建議先取消或改期，避免占用名額。",
      `LINE bot 不保證能代你取消；最穩妥是打 ${PHONE} 請櫃台確認，或依原本線上掛號系統取消/改期。`
    ].join("\n");
  }

  if (asksOutsideHospitalReportForVisit(normalized)) {
    return [
      "可以，別家醫院或外院做的紙本、影像或檢查報告，可以帶來門診給醫師評估。",
      "不建議先在 LINE 傳個人醫療報告讓我們線上判讀；報告需要醫師搭配病史、症狀與現場評估一起看。",
      `若不確定要帶哪些資料，可先電話 ${PHONE} 或到櫃台確認；通常建議帶完整紙本報告、影像光碟/截圖、用藥資料與健保卡。`
    ].join("\n");
  }

  if (asksSharedRegistrationForTwoPatients(normalized)) {
    return [
      "兩位病人通常不要先假設可以共用同一個掛號號碼。",
      "每位病人多半需要各自的掛號資料、身分資料與健保卡，才能分別建立看診與病歷紀錄。",
      `如果想陪爸爸一起看，請先電話 ${PHONE} 或到櫃台請人員確認能否加掛另一位、安排相近時段或現場名額；實際流程以櫃台確認為準。`
    ].join("\n");
  }

  if (asksOnlineRegistrationChange(normalized)) {
    return [
      "已線上掛號但想改今天晚上，不能只靠 LINE 訊息直接保證改成功。",
      `請先電話 ${PHONE}，或到現場櫃台請人員查詢能否改晚診；名額與臨時異動以診所人員確認為準。`
    ].join("\n");
  }

  if (asksReportPickupProxy(normalized)) {
    return [
      "檢查報告涉及個人醫療資料，能不能只領報告、能不能由家人代領，都要先由櫃台或診所人員確認，不能在 LINE 直接保證。",
      `請病人或家人先電話 ${PHONE}，或到現場先問櫃台。`,
      "若現場確認可代領，通常請先準備病人身分證/健保卡或影本、代領人身分證，以及診所要求的授權或關係資料；實際文件以櫃台流程為準。",
      "如果報告需要醫師解釋，仍可能需要掛號回診或門診說明。"
    ].join("\n");
  }

  if (asksDoctorPreferenceOrDesignation(normalized)) {
    return [
      "可以先告知想指定醫師或偏好男醫師。",
      "但能否指定、當天是否由指定醫師看、是否可改掛/等候，要依門診表、名額與櫃台確認。",
      "當天只有其他醫師時，可先向櫃台詢問再決定；不能保證一定改到。"
    ].join("\n");
  }

  if (asksCompanyReceiptTitleTaxId(normalized)) {
    return [
      "公司報帳收據的抬頭、統編、格式、收據補印與能否補開，請以櫃台確認為準。",
      "收據不見能否補印、事後能否補上統編或改格式，都要由櫃台依就診/結帳資料與規定確認。",
      "最好掛號或結帳前先說，避免結帳後格式不能改。",
      `看完才想到、收據遺失或想事後補資料，也可以先問櫃台或電話 ${PHONE}，但不能保證可改或補開。`
    ].join("\n");
  }

  if (asksCertificateOrReceipt(normalized)) {
    if (asksCertificateOrReceiptAfterVisit(normalized)) {
      return [
        `看完才想到要保險收據或診斷證明，可先電話 ${PHONE} 或問櫃台能否補開。`,
        "診斷證明通常需醫師/病歷確認；能否隔天、本人或家人代辦、要帶證件或委託文件，都以診所回覆為準。"
      ].join("\n");
    }

    return [
      "看診時或結帳前，先跟櫃台或醫師說明需要診斷證明或收據。",
      "診斷證明需由醫師依實際看診內容評估後開立。",
      "費用、格式、能否補開，請讓櫃台現場或電話確認。"
    ].join("\n");
  }

  if (asksWheelchairDropoffAccess(normalized)) {
    return [
      "不能保證門口可臨停或下車，要依現場交通與大樓入口狀況。",
      `若想先讓家人到入口或請櫃台協助，建議先電話 ${PHONE} 確認。`,
      "診所所在大樓可搭電梯到 3 樓；入口或電梯位置不確定，也可先電話詢問。"
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

  if (asksCompanionPrivacyConsultRoom(normalized)) {
    return [
      "陪同進診間通常要看病人本人同意、醫師/現場人員安排，以及當下隱私需求。",
      "抵達時請先跟櫃台或護理人員說你是陪先生看診；若有私密問題，診所可以視情況讓病人單獨說明，或請陪同者先在外面等。",
      "不用覺得尷尬，私密問題是診所日常會處理的內容。"
    ].join("\n");
  }

  return null;
}

function asksOnlineRegistrationChange(message) {
  return /線上掛號|網路掛號|預約掛號|已經掛號|已掛號/.test(message)
    && /改|更改|換|調整/.test(message)
    && /今天|今晚|晚上|晚診|夜診/.test(message);
}

function asksTestosteroneBloodDrawOnly(message) {
  const hasTestosteroneCue = /睪固酮|睾固酮|男性荷爾蒙|低睪/.test(message);
  const hasBloodDrawCue = /抽血|採血|驗血|血液檢查|檢驗|檢查/.test(message);
  const asksDirectWithoutVisit = /只抽血|直接抽|先抽|不想.*看醫師|不想.*看醫生|不看醫師|不看醫生|不用看診|不想先看|可以.*抽|能不能.*抽|可不可以.*抽/.test(message);
  const asksTimingOrPrep = /空腹|早上|上午|幾點|當天|今天|費用|多少錢|需要.*準備|要不要/.test(message);

  return hasTestosteroneCue && hasBloodDrawCue && (asksDirectWithoutVisit || asksTimingOrPrep);
}

function asksOnlineRegistrationForgotScreenshotCheckin(message) {
  const mentionsOnlineRegistration = /線上掛號|網路掛號|預約掛號|已經掛號|已掛號|剛剛.*掛號/.test(message);
  const mentionsMissingScreenshot = /忘記截圖|沒截圖|沒有截圖|截圖.*忘|截圖.*不見|截圖.*遺失|截圖.*沒|沒拍照|沒有拍照/.test(message);
  const asksCheckinOrDocuments = /報到|到現場|現場|櫃台|櫃檯|健保卡|身分證|身份證|證件|要帶/.test(message);

  return mentionsOnlineRegistration && mentionsMissingScreenshot && asksCheckinOrDocuments;
}

function asksOnlineRegistrationFirstVisitMissingHealthCard(message) {
  const mentionsFirstVisit = /第一次去|第一次來|初診|第一次看/.test(message);
  const mentionsExistingRegistration = /線上掛號|網路掛號|預約掛號|已經掛號|已掛號|掛號了|有掛號/.test(message);
  const mentionsMissingHealthCard = /健保卡.*忘|忘.*健保卡|沒帶健保卡|沒有帶健保卡|健保卡.*家|健保卡不在/.test(message);
  const mentionsIdOrCheckin = /身分證|身份證|證件|報到|櫃台|櫃檯|看診/.test(message);

  return mentionsFirstVisit && mentionsExistingRegistration && mentionsMissingHealthCard && mentionsIdOrCheckin;
}

function asksOnlineRegistrationLateArrival(message) {
  const mentionsExistingRegistration = /線上掛號|網路掛號|預約掛號|已經掛號|已掛號|掛號了|有掛號/.test(message);
  const mentionsLateArrival = /晚到|遲到|會晚|可能晚|來不及|晚.*分鐘|遲.*分鐘|延誤|塞車/.test(message);
  const asksCanStillBeSeenOrCall = /看得到|還能看|還可以看|能不能看|可不可以看|會不會過號|過號|打電話|先電話|通知|確認/.test(message);

  return mentionsExistingRegistration && mentionsLateArrival && asksCanStillBeSeenOrCall;
}

function asksCheckinDeadlineOrAddOnNearClose(message) {
  const mentionsArrivalOrCheckin = /快到|快到了|快到診所|到診所|在路上|快結束|要結束|報到|掛號|現場/.test(message);
  const asksDeadlineOrAddOn = /最晚|幾點前|幾點以前|截止|壓線|過號|加號|候補|等加號|還能等|還可以等|超過/.test(message);
  const hasClinicTimeCue = /午診|下午|17:00|5:00|五點|診所/.test(message);

  return mentionsArrivalOrCheckin && asksDeadlineOrAddOn && hasClinicTimeCue;
}

function asksOnlineRegistrationCancellation(message) {
  const mentionsExistingRegistration = /線上掛號|網路掛號|預約掛號|已經掛號|已掛號|掛號了|有掛號/.test(message);
  const asksCancelOrReschedule = /取消|退掛|不能去|無法去|沒辦法去|不能到|無法到|改期|改時間|改約/.test(message);
  const asksLineOrPhone = /LINE|line|這裡|跟你說|打電話|電話|怎麼取消|要取消|要打/.test(message);

  return mentionsExistingRegistration && asksCancelOrReschedule && asksLineOrPhone;
}

function asksOutsideHospitalReportForVisit(message) {
  const hasOutsideSource = /別家|外院|外面|其他醫院|他院|別的醫院|健檢中心/.test(message);
  const hasReportCue = /報告|檢查結果|檢驗結果|影像|光碟|片子|檢查資料/.test(message);
  const asksBringOrSend = /拿來|帶來|帶去|給醫師看|給醫生看|醫師看|醫生看|先傳|傳.*LINE|LINE.*傳|可以.*看|需要.*傳/i.test(message);

  return hasOutsideSource && hasReportCue && asksBringOrSend;
}

function asksSharedRegistrationForTwoPatients(message) {
  const mentionsExistingRegistration = /線上掛號|網路掛號|預約掛號|已經掛號|已掛號|掛號了|有掛號/.test(message);
  const mentionsCompanionOrFamily = /陪|一起看|一起掛|同行|爸爸|爸|媽媽|媽|家人|另一位|兩個人|二個人|兩位|二位/.test(message);
  const asksSharedNumber = /同一個號|同一號|同一個掛號|同一筆|共用|一起用|用一個號|一個號碼|各自掛號|另外掛號|另外.*掛|加掛/.test(message);

  return mentionsExistingRegistration && mentionsCompanionOrFamily && asksSharedNumber;
}

function asksCertificateOrReceipt(message) {
  return /診斷證明|診斷書|證明書|就醫證明|收據|醫療收據|費用收據|發票/.test(message)
    && /開|申請|需要|要先|先跟誰說|找誰|補開|拿|領|可以/.test(message);
}

function asksCertificateOrReceiptAfterVisit(message) {
  return /隔天|明天|補開|補申請|才想到|本人|家人|代辦|委託/.test(message)
    && /診斷證明|診斷書|證明書|就醫證明|收據|醫療收據|費用收據|發票|保險/.test(message);
}

function asksFeePaymentAtCounterWithoutVisit(message) {
  const asksFeeOrPayment = /費用|價格|價錢|多少錢|報價|收費|付款|付錢|付費|刷卡|信用卡|現金/.test(message);
  const asksCounterOrStaff = /櫃台|櫃檯|現場|到診所|診所人員|工作人員|護理人員|行政|先問|詢問/.test(message);
  const wantsBeforeVisitDecision = /不想看診|不看診|不用看診|還不想看|先問|先知道|只是想先問|只想先問|問完再決定|再決定|能不能.*問|可以.*問/.test(message);

  return asksFeeOrPayment && asksCounterOrStaff && wantsBeforeVisitDecision;
}

function asksVaccineScreeningCounterProcessFee(message) {
  return /HPV\s*疫苗|HPV|九價|疫苗/i.test(message)
    && /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)
    && /流程|費用|價格|價錢|多少錢|同一天|同日|當天|今天|先問|詢問|櫃台|櫃檯|電話/.test(message);
}

function asksSkinShinglesVaccine(message) {
  return /皮蛇疫苗|帶狀皰疹疫苗/.test(message);
}

function asksMedicationBagRefillWithoutVisit(message) {
  const hasMedicationCue = /藥袋|藥吃完|吃完藥|上次.*藥|之前.*藥|原本.*藥|一樣的藥|同樣的藥|續藥|補藥|拿藥|取藥|開藥/.test(message);
  const asksDirectRefill = /直接拿|只拿|拿一樣|開一樣|不用看診|不看診|不用回診|不回診|可以.*拿|能不能.*拿|可不可以.*拿/.test(message);
  const asksCounterPath = /櫃台|櫃檯|藥袋|健保卡|身分證|身份證|等一下|等等|現場|到診所|給.*看/.test(message);

  return hasMedicationCue && asksDirectRefill && asksCounterPath;
}

function asksReportPickupProxy(message) {
  if (/匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message)) return false;
  if (/別家|外院|外面|其他醫院|他院|拿來|帶來|給醫師看|給醫生看|醫師看|醫生看|先傳/.test(message)) return false;

  const hasReportCue = /報告|檢查結果|檢驗結果/.test(message);
  const asksPickupOrProxy = /代拿|代領|家人|親友|本人|不看診|不用看診|只拿|只領|要帶什麼|帶什麼|證件|授權/.test(message)
    || /(?:報告|檢查結果|檢驗結果).{0,12}(?:拿|領|取|怎麼拿|怎麼領|如何拿|如何領)/.test(message)
    || /(?:拿|領|取).{0,12}(?:報告|檢查結果|檢驗結果)/.test(message);

  return hasReportCue && asksPickupOrProxy;
}

function asksDoctorPreferenceOrDesignation(message) {
  const asksUrologyOrVisit = /泌尿|一般泌尿|看診|門診|醫師|醫生/.test(message);
  const asksPreference = /指定|男醫師|男性醫師|男醫生|偏好.*男|想找.*男|指定.*醫師|指定.*醫生/.test(message);
  const asksCounterDecision = /櫃台|櫃檯|當天|別的醫師|其他醫師|改掛|等候|名額|先問|再決定/.test(message);

  return asksUrologyOrVisit && asksPreference && asksCounterDecision;
}

function asksCompanyReceiptTitleTaxId(message) {
  return /公司|報帳|報銷|核銷|抬頭|統編|統一編號/.test(message)
    && /抬頭|統編|統一編號|格式|補開|補印|補上|補加|結帳|掛號/.test(message)
    && /收據|發票|開|補印/.test(message);
}

function asksWheelchairDropoffAccess(message) {
  const hasMobilityCue = /輪椅|行動不便|行動不方便|走路不方便|長輩|老人家|爸爸|爸|媽媽|媽/.test(message);
  const hasDropoffCue = /門口|臨停|下車|停車|入口|電梯|先讓.*下|先在.*下/.test(message);
  const hasUncertaintyCue = /可以|可不可以|能不能|好找|不要保證|不保證|先電話|確認/.test(message);

  return hasMobilityCue && hasDropoffCue && hasUncertaintyCue;
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

function asksCompanionPrivacyConsultRoom(message) {
  return /陪|陪同|陪診|陪看|陪伴|一起進|進診間|陪.*看診/.test(message)
    && /先生|老公|丈夫|太太|老婆|妻子|配偶|伴侶|另一半|男友|女友|家人|媽媽|爸爸/.test(message)
    && /診間|看診|門診|私密|隱私|尷尬|單獨|外面等|一起進|陪同/.test(message);
}
