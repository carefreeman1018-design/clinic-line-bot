const PHONE = "02-2511-9488";

export function answerUrologyProcedureAftercareQuestion(message) {
  if (!isUrologyProcedureAftercareQuestion(message)) return null;

  if (isCystoscopyAftercareQuestion(message)) {
    const caution = hasFeverChillsCue(message)
      ? "你提到發冷，這比單純血絲或短暫刺痛更需要警覺感染或發燒風險；不建議只多喝水觀察。"
      : "膀胱鏡後短暫尿尿刺痛或少量血絲可能會出現，但 LINE 不能判斷是否仍屬正常範圍。";

    return [
      "膀胱鏡後尿尿刺痛、尿中血絲需要看症狀變化與嚴重度。",
      caution,
      `請現在先量體溫並電話 ${PHONE} 聯絡診所/回診確認；若發燒或畏寒加劇、血尿變多、有血塊、尿不出來、疼痛加劇或明顯不舒服，請急診/立即就醫。`
    ].join("");
  }

  return null;
}

function isUrologyProcedureAftercareQuestion(message) {
  return /膀胱鏡|輸尿管鏡|碎石後|震波後|檢查後|做完.*檢查/.test(message);
}

function isCystoscopyAftercareQuestion(message) {
  return /膀胱鏡/.test(message) && /尿|血|刺痛|痛|發冷|發燒|畏寒|寒顫|血塊|尿不出|多喝水|觀察/.test(message);
}

function hasFeverChillsCue(message) {
  return /發冷|畏寒|寒顫|發燒|高燒|體溫\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);
}
