const PHONE = "02-2511-9488";

export function answerStoneQuestion(message) {
  if (!isStoneQuestion(message)) return null;

  if (hasUpperUrinaryEmergency(message)) {
    return [
      "血尿或尿色發紅合併腰痛/側腹痛和發燒，需要警覺腎臟或輸尿管感染、結石合併感染等急症風險，光靠訊息無法判斷原因。",
      "不建議先吃止痛藥或家裡抗生素撐到明天，也不能先安排體外震波、鈥雷射碎石或報費用。",
      `請現在直接急診/立即就醫；若要同步確認診所能否協助，可電話 ${PHONE}，但不要因此延誤處理。`
    ].join("");
  }

  if (hasUrgentStoneConcern(message)) {
    return [
      "右腰痛到冒冷汗、尿有點紅，不能只靠訊息判斷是不是腎結石或輸尿管結石。",
      "診所有提供腎結石與輸尿管結石評估治療，但劇痛、血尿、發燒、尿不出來或明顯不舒服時，請優先急診/立即就醫。",
      "不建議只先吃止痛藥等到明天；是否能做體外震波、鈥雷射碎石或其他處置，以及費用，都需要醫師檢查評估後確認。",
      `若症狀可等待門診，也請先電話 ${PHONE} 確認最快可看診時段。`
    ].join("");
  }

  const officialReply = answerOfficialStoneQuestion(message);
  if (officialReply) return officialReply;

  return [
    "診所有提供腎結石與輸尿管結石評估治療。",
    "治療會依結石大小、位置與症狀決定，可能包含藥物、體外震波碎石、軟式輸尿管鏡加鈥雷射碎石等方式；建議由泌尿科醫師檢查後評估。"
  ].join("");
}

function answerOfficialStoneQuestion(message) {
  if (/包含|有哪些.*結石|種類|腎結石.*輸尿管.*膀胱|尿路結石.*是什麼/.test(message)) {
    return "尿路結石包含腎結石、輸尿管結石與膀胱結石；多數結石在腎臟形成，往下掉到輸尿管或膀胱後，可能造成不同位置的結石症狀。";
  }

  if (/形成|原因|為什麼|怎麼.*來|怎麼.*形成/.test(message) && /結石|腎結石|尿路/.test(message)) {
    return "尿路結石多與尿液中的礦物質與鹽分沉積成固體結晶有關；簡單說就是尿液太濃、太少，尿中物質沉澱形成結晶，長期凝集後變成結石。";
  }

  if (/不同位置|掉到|位置/.test(message) && /症狀|會怎樣|差別|位置/.test(message)) {
    return "結石在泌尿道移動時，會因掉進不同部位卡住而造成不同症狀，例如腎結石、輸尿管結石或膀胱結石；症狀與位置、大小和是否阻塞有關。";
  }

  if (/症狀|會怎樣|血尿|腎絞痛|腰痛|排尿痛|頻尿/.test(message)) {
    return "腎結石或輸尿管結石可能造成腰腹部疼痛、腎絞痛、血尿、頻尿、排尿困難或排尿疼痛；若合併感染，可能有發燒或腎臟發炎風險。";
  }

  if (/喝水|水分|1500|2000|預防/.test(message)) {
    return "預防尿路結石通常會提醒補充水分；衛福部建議成人一天約需攝取 1500 到 2000 c.c. 水分。但若有心腎疾病或限水需求，仍要依醫師指示。";
  }

  if (/0\.?4|0\.4|小於.*公分|多小.*排/.test(message)) {
    return "官網提到，在腎臟中尺寸小於 0.4 公分的結石，較容易順著輸尿管排出體外；若大於此尺寸，就較容易阻塞在輸尿管中並引發疼痛。";
  }

  if (/高風險|危險族群|好發|容易|哪些人/.test(message)) {
    return "尿路結石好發於 20 到 40 歲中年男性，也和飲食偏甜、偏鹹、高普林、高蛋白，以及水分攝取不足等因素有關。";
  }

  if (/體外震波|ESWL/.test(message)) {
    return "體外震波碎石適用於部分較小的結石，官網資料提到常以 X 光或超音波定位，再從體外擊碎；是否適合仍需依結石大小、位置與狀況由醫師評估。";
  }

  if (/軟式輸尿管鏡|鈥雷射|雷射碎石|FURS/.test(message)) {
    return "軟式輸尿管鏡加高能量鈥雷射碎石，是透過尿道、膀胱、輸尿管到腎臟定位結石，再以雷射碎石；是否適合需由醫師依結石大小與位置評估。";
  }

  if (/治療方式|怎麼治療|怎麼處理|有哪些治療|手術/.test(message)) {
    return "尿路結石治療會依結石大小、位置與嚴重程度決定，常見方向包含藥物與保守治療、體外震波碎石、軟式輸尿管鏡加高能量鈥雷射碎石，以及經皮穿腎取石術。";
  }

  return null;
}

function isStoneQuestion(message) {
  return /腎結石|輸尿管結石|尿路結石|膀胱結石|結石|腎絞痛|腰痛|右腰痛|左腰痛|腰腹痛|體外震波|軟式輸尿管鏡|鈥雷射|碎石|尿.*紅|血尿/i.test(message);
}

function hasUrgentStoneConcern(message) {
  return /冒冷汗|劇痛|很痛|痛到|血尿|尿.*紅|發燒|尿不出來|排不出尿|急診|今天|現在|急|明顯不舒服/i.test(message);
}

function hasUpperUrinaryEmergency(message) {
  const hasBloodUrine = /血尿|尿.*血|尿.*紅|尿裡.*紅|尿色.*紅/.test(message);
  const hasFlankOrWaistPain = /腰.*痛|側腹.*痛|腰腹.*痛|右腰|左腰|腎絞痛|痛到|劇痛|很痛/.test(message);
  const hasFever = /發燒|高燒|體溫\s*3[89](?:\.\d)?|燒到\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);

  return hasBloodUrine && hasFlankOrWaistPain && hasFever;
}
