const HOME_URL = "https://uromeeme.com/";
const APPOINTMENT_URL = "https://appointment.uromeeme.inncom.cloud/";
const LINE_ADD_FRIEND_URL = "https://lin.ee/qDUYijn";

export function answerBasicInfoQuestion(message) {
  const normalized = message.replace(/\s+/g, " ").trim();
  if (!normalized) return null;

  if (asksOfficialLineConflict(normalized)) {
    return [
      "目前知識庫中的官方 LINE ID 是 @455twnga，加好友連結是 https://lin.ee/qDUYijn。",
      "若 LINE VOOM 貼文另有 @uromeeme，建議以加好友連結、官方 LINE 最新公告或電話 02-2511-9488 確認。"
    ].join("\n");
  }

  if (/郵遞區號|郵編|104091/.test(normalized)) {
    return "診所地址郵遞區號是 104091，地址是台北市中山區松江路 276 號 3 樓。";
  }

  if (/院長|執行院長/.test(normalized) && /誰|哪位|是誰|叫什麼|介紹/.test(normalized)) {
    return "津久診所院長是陳偉傑醫師；羅詩修醫師是執行院長。";
  }

  if (asksParkingInfo(normalized)) {
    return buildParkingReply(normalized);
  }

  if (asksBasicInfoBundle(normalized)) {
    return buildBasicInfoBundleReply(normalized);
  }

  if (asksClinicAccess(normalized)) {
    return buildClinicAccessReply(normalized);
  }

  if (asksMrtAccess(normalized)) {
    return "捷運可搭到行天宮站 4 號出口，官網寫出站後右轉，步行約 40 秒可看到津久診所招牌，搭電梯上 3 樓。";
  }

  if (/公車|巴士|客運|站牌|怎麼搭車/.test(normalized)) {
    return [
      "可參考官網列出的公車站牌：",
      "捷運行天宮站（松江路）：109、1550A、203、214、214直、222、26、277、279、280、280直、41、49、5、5203A、612、676、9069、9069A、945、松江新生幹線、林口-台北長庚醫院、紅57。",
      "松江新村：214、214直、286副、49、9069、9069A、945。",
      "民權松江路口：1841、1841A、1842、1842A、225、225區、5250、5250A、617、617副、63、685、688、801、803、內科通勤專車18、敦化幹線、民權幹線、紅29、紅31。"
    ].join("\n");
  }

  if (/英文識別|英文名稱|英文名|UroMe|urome/i.test(normalized) && /診所|官方|寫|識別|名稱|是不是/.test(normalized)) {
    return "UroMe 是津久診所的英文識別。";
  }

  if (/官方\s*LINE|LINE\s*ID|line\s*id|@455twnga|加好友|lin\.ee/i.test(normalized)) {
    return `津久診所官方 LINE ID 是 @455twnga，加好友連結是 ${LINE_ADD_FRIEND_URL}。`;
  }

  if (asksWebsiteDistinction(normalized)) {
    return `官網首頁是 ${HOME_URL}，線上掛號網址是 ${APPOINTMENT_URL}，兩個網址不同，請不要混用。`;
  }

  if (asksPrivateConsultationAppointment(normalized)) {
    return [
      "可以，若是私密問題想安排看診，建議先電話 02-2511-9488 確認可預約時段，並告知希望安排較隱私的看診需求。",
      `也可以先用線上掛號：${APPOINTMENT_URL}`,
      "若是匿名篩檢或快速通關服務，建議先電話確認流程與當天名額。"
    ].join("\n");
  }

  if (asksSurgeryAppointment(normalized)) {
    return [
      `手術或快速通關預約可以先用線上掛號：${APPOINTMENT_URL}`,
      "也可以留下姓名、電話、想預約的項目與方便時段，診所人員再協助確認。",
      "電話：02-2511-9488"
    ].join("\n");
  }

  if (asksAppointmentSystem(normalized)) {
    return `官網「立即預約」頁有「預約掛號」入口，線上掛號系統網址是 ${APPOINTMENT_URL}。`;
  }

  if (/官網|官方網站|首頁|網站/.test(normalized) && /網址|連結|是哪|在哪|給我|提供/.test(normalized)) {
    return `津久診所官網首頁是 ${HOME_URL}。`;
  }

  if (/電話|打給|聯絡|聯絡方式|幾號/.test(normalized)) {
    return "診所電話是 02-2511-9488。";
  }

  if (/地址|在哪|位置|地點/.test(normalized) && /診所|津久|松江路|幾樓/.test(normalized)) {
    return "津久診所地址是 104091 台北市中山區松江路 276 號 3 樓。";
  }

  return null;
}

function asksMrtAccess(message) {
  return /行天宮|捷運|MRT|4\s*號出口|四號出口|步行|走路|交通/.test(message) && /多久|幾分|怎麼去|出口|步行|走路|交通/.test(message);
}

function asksParkingInfo(message) {
  return /停車|開車|車位|停車場|特約停車|停車優惠/.test(message);
}

function buildParkingReply(message = "") {
  const lines = [
    "開車可參考官網列出的附近停車場，但診所公開資料沒有明確確認特約停車或診所停車優惠，不能當作一定有停車折抵。",
    "台灣聯通停車場－將捷二場（停車塔）：台北市中山區松江路 336 號。",
    "聯邦佳佳大樓停車場（地下平面停車場）：台北市中山區松江路 235 巷 22 號。"
  ];

  if (/臨停|暫停|門口|先上樓|先.*問|下車/.test(message)) {
    lines.push("門口能否臨停或先下車要看現場交通與大樓入口狀況，不能先保證；建議先電話 02-2511-9488 或到場依現場規定。");
  }

  return lines.join("\n");
}

function asksClinicAccess(message) {
  return /診所|津久|你們|現場|門診/.test(message) && /如何去|怎麼去|怎麼走|怎麼到|交通|路線|地址|位置|在哪|到診/.test(message);
}

function buildClinicAccessReply(message) {
  const lines = [
    "津久診所地址是 104091 台北市中山區松江路 276 號 3 樓。",
    "捷運可搭到行天宮站 4 號出口，出站後右轉，步行約 40 秒可看到津久診所招牌，搭電梯上 3 樓。"
  ];

  if (asksArrivalFlow(message)) {
    lines.push("到現場先到櫃台說明：已掛號就報到；未掛號先問現場掛號與名額。");
  }

  return lines.join("\n");
}

function asksWebsiteDistinction(message) {
  return /官網|官方網站|首頁/.test(message) && /線上掛號|掛號網址|appointment|預約連結/i.test(message);
}

function asksPrivateConsultationAppointment(message) {
  return /私密診療室|私密診療|私密看診|隱私看診|隱密看診|私密問題|泌密會客室/.test(message)
    && /預約|掛號|怎麼約|如何約|怎麼排|安排|諮詢|看診/.test(message);
}

function asksBasicInfoBundle(message) {
  const requestedItems = [
    /官方\s*LINE|LINE\s*ID|line\s*id|@455twnga|加好友|lin\.ee/i,
    /電話|打給|聯絡|聯絡方式|幾號/,
    /地址|位置|地點|幾樓|診所在哪|津久在哪|松江路在哪/,
    /線上掛號|預約掛號|預約連結|掛號連結|appointment|掛號網址|掛號系統|線上預約|網路掛號/i
  ].filter((pattern) => pattern.test(message)).length;

  return requestedItems >= 2;
}

function buildBasicInfoBundleReply(message) {
  const lines = [];

  if (asksAddressInfo(message)) {
    lines.push("診所地址是 104091 台北市中山區松江路 276 號 3 樓。");
  }

  if (asksMrtAccess(message) || asksRouteInBundle(message)) {
    lines.push("捷運行天宮站 4 號出口，出站後右轉，步行約 40 秒可看到招牌，搭電梯上 3 樓。");
  }

  if (/電話|打給|聯絡|聯絡方式|幾號/.test(message)) {
    lines.push("診所電話是 02-2511-9488。");
  }

  if (/官方\s*LINE|LINE\s*ID|line\s*id|@455twnga|加好友|lin\.ee/i.test(message)) {
    lines.push(`津久診所官方 LINE ID 是 @455twnga。`);
    lines.push(`加好友連結是 ${LINE_ADD_FRIEND_URL}。`);
  }

  if (/線上掛號|預約掛號|預約連結|掛號連結|appointment|掛號網址|掛號系統|線上預約|網路掛號/i.test(message)) {
    lines.push(`官網「立即預約」頁有「預約掛號」入口，線上掛號系統網址是 ${APPOINTMENT_URL}。`);
  }

  return lines.join("\n");
}

function asksAddressInfo(message) {
  return /地址|位置|地點|幾樓|診所在哪|津久在哪|松江路在哪/.test(message);
}

function asksRouteInBundle(message) {
  return /行天宮|捷運|MRT|出口|怎麼走|怎麼到|路線|門口|到門口/.test(message);
}

function asksArrivalFlow(message) {
  return /報到|先掛號|先.*掛號|現場掛號|第一次去|初診|到現場/.test(message);
}

function asksSurgeryAppointment(message) {
  return /手術|割包皮|包皮|結紮|匿名篩檢|疫苗|快速通關/.test(message) && /預約|掛號|怎麼約|如何約|怎麼排|安排/.test(message);
}

function asksAppointmentSystem(message) {
  return /線上掛號|預約掛號|預約連結|掛號連結|appointment|掛號網址|掛號系統|線上預約|網路掛號/i.test(message)
    || (/掛號|預約/.test(message) && /在哪|哪裡|網址|連結|系統|入口|給我|提供|怎麼用|如何使用/.test(message));
}

function asksOfficialLineConflict(message) {
  return /@455twnga/i.test(message) && /@uromeeme/i.test(message);
}
