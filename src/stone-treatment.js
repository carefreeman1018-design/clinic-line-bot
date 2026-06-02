const PHONE = "02-2511-9488";

export function answerStoneQuestion(message) {
  if (!isStoneQuestion(message)) return null;

  if (hasUrgentStoneConcern(message)) {
    return [
      "右腰痛到冒冷汗、尿有點紅，不能只用 LINE 判斷是不是腎結石或輸尿管結石。",
      "診所有提供腎結石與輸尿管結石評估治療，但劇痛、血尿、發燒、尿不出來或明顯不舒服時，請優先急診/立即就醫。",
      "不建議只先吃止痛藥等到明天；是否能做體外震波、鈥雷射碎石或其他處置，以及費用，都需要醫師檢查評估後確認。",
      `若症狀可等待門診，也請先電話 ${PHONE} 確認最快可看診時段。`
    ].join("");
  }

  return [
    "診所有提供腎結石與輸尿管結石評估治療。",
    "治療會依結石大小、位置與症狀決定，可能包含藥物、體外震波碎石、軟式輸尿管鏡加鈥雷射碎石等方式；建議由泌尿科醫師檢查後評估。"
  ].join("");
}

function isStoneQuestion(message) {
  return /腎結石|輸尿管結石|尿路結石|膀胱結石|腎絞痛|腰痛|右腰痛|左腰痛|腰腹痛|體外震波|軟式輸尿管鏡|鈥雷射|碎石|尿.*紅|血尿/i.test(message);
}

function hasUrgentStoneConcern(message) {
  return /冒冷汗|劇痛|很痛|痛到|血尿|尿.*紅|發燒|尿不出來|排不出尿|急診|今天|現在|急|明顯不舒服/i.test(message);
}
