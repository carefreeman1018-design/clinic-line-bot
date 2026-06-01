const HOME_URL = "https://uromeeme.com/";
const CONTACT_URL = "https://uromeeme.com/contact-us/";
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

  if (asksMrtAccess(normalized)) {
    return "捷運可搭到行天宮站，從 4 號出口出站後步行約 1 分鐘。";
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

  if (asksSurgeryAppointment(normalized)) {
    return [
      `手術預約建議先加官方 LINE 諮詢：${LINE_ADD_FRIEND_URL}`,
      `若要一般預約掛號，官網「立即預約」頁的「預約掛號」入口是 ${APPOINTMENT_URL}。`,
      `官網立即預約頁：${CONTACT_URL}`
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

  if (/停車|開車|車位|停車場/.test(normalized)) {
    return "開車前往的話，診所旁邊有收費停車場。";
  }

  return null;
}

function asksMrtAccess(message) {
  return /行天宮|捷運|MRT|4\s*號出口|四號出口|步行|走路|交通/.test(message) && /多久|幾分|怎麼去|出口|步行|走路|交通/.test(message);
}

function asksWebsiteDistinction(message) {
  return /官網|官方網站|首頁/.test(message) && /線上掛號|掛號網址|appointment|預約連結/i.test(message);
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
