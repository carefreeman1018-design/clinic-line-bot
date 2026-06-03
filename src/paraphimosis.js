const PHONE = "02-2511-9488";

export function answerParaphimosisQuestion(message) {
  if (!isParaphimosisQuestion(message)) return null;

  return [
    "你描述的包皮卡在龜頭後面、龜頭腫紫很痛或尿不太出來，可能有嵌頓性包莖/血流受阻風險，光靠訊息無法診斷。",
    "不建議自己硬推，也不建議等到明天再掛號；若腫紫、劇痛、尿不出來或越來越腫，請立即就醫或急診處理。",
    `診所是否能今天現場處理需由醫師評估與當天時段確認；現在請先電話 ${PHONE} 確認最快可處理方式。`
  ].join("");
}

function isParaphimosisQuestion(message) {
  return (
    /嵌頓|包皮嵌|包皮.*卡|卡在龜頭|包皮.*推不回|包皮.*回不去|翻.*包皮.*回不去|包皮.*翻.*回不去/.test(message) ||
    /包皮/.test(message) && /龜頭/.test(message) && /腫紫|紫黑|發黑|血流|缺血|尿不出來|尿不太出來|很痛|劇痛/.test(message)
  );
}
