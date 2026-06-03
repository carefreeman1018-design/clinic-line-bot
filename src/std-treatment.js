const PHONE = "02-2511-9488";

export function answerStdTreatmentQuestion(message) {
  if (!isStdTreatmentQuestion(message)) return null;

  if (isAnonymousScreeningPrivacyQuestion(message)) {
    return answerAnonymousScreeningQuestion(message);
  }

  if (shouldPrioritizeWartQuestion(message)) {
    return answerWartQuestion(message);
  }

  if (isPepQuestion(message)) {
    return answerPepQuestion(message);
  }

  if (isPrepQuestion(message)) {
    return answerPrepQuestion(message);
  }

  if (isGenitalUlcerQuestion(message)) {
    return answerGenitalUlcerQuestion(message);
  }

  if (!asksMedicationDiagnosisOrTreatment(message)) return null;

  if (isWartQuestion(message)) {
    return answerWartQuestion(message);
  }

  return [
    "性病篩檢與治療需要依症狀、病灶與檢查結果由醫師判斷。",
    `LINE 不能線上診斷或開藥；建議預約門診，或電話 ${PHONE} 確認時段。`
  ].join("");
}

function isStdTreatmentQuestion(message) {
  return /PrEP|PEP|HIV|愛滋|暴露前|暴露後|保險套破|無套|高風險|菜花|尖銳濕疣|HPV(?!\s*疫苗)|梅毒|淋病|披衣菌|皰疹|疱疹|HSV|性病|病灶|私密處.*顆粒|肉芽|陰莖.*水泡|陰莖.*潰瘍|生殖器.*水泡|生殖器.*潰瘍|匿名.*篩檢|篩檢.*匿名/i.test(message);
}

function isAnonymousScreeningPrivacyQuestion(message) {
  return /匿名.*篩檢|篩檢.*匿名|匿名性病/.test(message) && /家人|知道|真名|姓名|身分|身份|報告|多久|隱私|保密/.test(message);
}

function answerAnonymousScreeningQuestion(_message) {
  return [
    "診所有提供匿名篩檢相關服務，會重視隱私；是否需填哪些資料、報告通知方式與多久可知道結果，需由現場護理人員依篩檢項目說明。",
    "LINE 不能保證完全不需任何資料，也不適合在這裡查個人報告。",
    `下一步：先電話 ${PHONE} 確認匿名篩檢流程與可評估時段，或到診後直接向護理人員說明你擔心被家人知道。`
  ].join("");
}

function isPrepQuestion(message) {
  if (/PEP|暴露後|保險套破/.test(message)) return false;
  return /PrEP|暴露前|伴侶.*HIV|HIV.*伴侶|愛滋.*伴侶|伴侶.*愛滋/i.test(message);
}

function isPepQuestion(message) {
  if (/不是問\s*PEP|不問\s*PEP|換問|另一件事/.test(message) && isWartQuestion(message)) return false;
  return /PEP|暴露後|保險套破|無套|高風險/i.test(message);
}

function shouldPrioritizeWartQuestion(message) {
  if (!isWartQuestion(message)) return false;
  if (/不是問\s*PEP|不問\s*PEP|換問|另一件事/.test(message)) return true;
  return /私密處|肉芽|病灶|顆粒|藥膏|擦幾天|擦多久|自己買|自己擦|伴侶/.test(message) && !/保險套破|無套|暴露後|高風險|PrEP/i.test(message);
}

function answerWartQuestion(message) {
  const partnerNote = /伴侶|另一半|男友|女友|配偶|對方/.test(message)
    ? "伴侶是否需要一起檢查或篩檢，也建議門診時一起詢問醫師。"
    : "";

  return [
    "診所有提供菜花 HPV 相關篩檢與治療評估。",
    "菜花需要看病灶與檢查結果，LINE 不能診斷，也不能直接回答藥膏要擦幾天；不要自行買藥、自己擦或使用伴侶剩下的藥膏。",
    partnerNote,
    `治療方式可能包含外用藥物、電燒、冷凍或雷射等，需由醫師確認後安排；可電話 ${PHONE} 預約或確認時段。`
  ].join("");
}

function answerPrepQuestion(message) {
  const partnerNote = /伴侶|另一半|男友|女友|配偶|對方/.test(message)
    ? "伴侶為 HIV 感染者時可以諮詢 PrEP，但仍需先確認自己 HIV 陰性並由醫師評估。"
    : "";

  return [
    "PrEP 是 HIV 暴露前預防，需經醫師評估後使用，並非 100% 有效。",
    "吃 PrEP 也不代表可以完全不用保險套；PrEP 不能預防梅毒、淋病、菜花等其他性病，仍建議搭配保險套並定期篩檢。",
    partnerNote,
    `下一步：預約 PrEP 諮詢或先電話 ${PHONE} 確認可評估時段。`
  ].join("");
}

function answerPepQuestion(message) {
  const hoursMatch = message.match(/(\d{1,2})\s*小時/);
  const hours = hoursMatch ? Number(hoursMatch[1]) : null;
  const spelledHours = /四十\s*小時/.test(message) ? 40 : /六十\s*小時/.test(message) ? 60 : null;
  const elapsedHours = hours ?? spelledHours;
  const prefix = elapsedHours !== null && elapsedHours <= 72
    ? `${elapsedHours} 小時仍在官網提醒的 72 小時內，`
    : elapsedHours !== null && elapsedHours > 72
      ? `${elapsedHours} 小時已超過官網提醒的 PEP 黃金 72 小時，是否仍有可評估處置需由醫師判斷，`
      : "PEP 需把握風險行為後 72 小時內，";

  const prepClarification = /PrEP/i.test(message)
    ? "PrEP 是暴露前預防，不是已發生暴露後的補救；PrEP 也不能預防梅毒、淋病、菜花等其他性病。"
    : "";

  const hivInfectionBoundary = /已經感染|感染\s*HIV|HIV\s*感染|HIV.*陽性|陽性.*HIV|確診.*HIV/i.test(message)
    ? "若已感染 HIV，PrEP 不適用，需先檢測並由醫師評估治療。"
    : "";

  const anonymousScreening = /匿名|篩檢|驗性病|性病/.test(message)
    ? "匿名篩檢可一起詢問，到診後由護理人員安排篩檢；若仍在 PEP 時效內，先讓醫師評估 PEP 較優先。"
    : "PEP 不能預防其他性病，是否需要篩檢也請一起讓醫師評估。";

  return [
    prepClarification,
    hivInfectionBoundary,
    `${prefix}請今天盡快聯絡診所或到門診/急診由醫師評估；LINE 不能直接判斷或開藥，也不能保證今晚直接拿藥。`,
    anonymousScreening,
    `下一步：先電話 ${PHONE} 確認最快可評估時段；若診所無法即時安排，請儘速就醫。`
  ].join("");
}

function isGenitalUlcerQuestion(message) {
  return (
    /陰莖|龜頭|包皮|生殖器|私密處/.test(message) &&
    /水泡|皰疹|疱疹|HSV|破皮|潰瘍|刺痛|梅毒|硬下疳/i.test(message)
  );
}

function answerGenitalUlcerQuestion(message) {
  const partnerNote = /伴侶|另一半|男友|女友|配偶|對方/.test(message)
    ? "伴侶也建議一起評估是否需要檢查或篩檢，先避免性行為或至少全程保險套，降低傳染風險。"
    : "";
  const urgentNote = /發燒|很痛|刺痛|劇痛|化膿|擴大|越來越/.test(message)
    ? "已經有發燒或明顯疼痛，建議今天儘快就醫評估。"
    : "建議儘快門診評估。";

  return [
    "陰莖水泡、破皮潰瘍或刺痛可能和皰疹、梅毒或其他感染有關，但 LINE 不能只靠文字診斷或開藥。",
    "不建議自己先擦藥膏或吃剩下的抗生素，可能影響判斷或延誤治療。",
    partnerNote,
    `${urgentNote}下一步：預約性病篩檢/治療門診，或先電話 ${PHONE} 確認最快可評估時段。`
  ].join("");
}

function isWartQuestion(message) {
  return /菜花|尖銳濕疣|HPV(?!\s*疫苗)|肉芽|私密處.*顆粒/i.test(message);
}

function asksMedicationDiagnosisOrTreatment(message) {
  return /藥膏|藥|抗生素|擦幾天|擦多久|自己買|自己擦|治療|處理|處方|診斷|是不是|看起來|費用|價格|多少錢|多久會好|復發/.test(message);
}
