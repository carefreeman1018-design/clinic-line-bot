const PHONE = "02-2511-9488";

export function answerPriapismQuestion(message) {
  if (!isPriapismQuestion(message)) return null;

  return [
    "你描述的勃起快 5 小時退不下來又陰莖疼痛，可能有持續勃起造成缺血風險，光靠訊息無法診斷。",
    "不建議只冰敷、睡覺或等待自行消退；若已超過數小時、疼痛或越來越不舒服，請立即就醫或急診處理。",
    `診所是否能今天現場處理需由醫師評估與當天時段確認；現在請先電話 ${PHONE} 確認最快處理方式。`
  ].join("");
}

function isPriapismQuestion(message) {
  return (
    /威而鋼|犀利士|壯陽藥|勃起|硬.*退不|退不下來|退不掉|持續勃起|陰莖.*痛/.test(message) &&
    /([4-9]|[一二三四五六七八九十])\s*(個)?\s*小時|數小時|很久|整晚|一整晚|退不下來|退不掉/.test(message)
  );
}
