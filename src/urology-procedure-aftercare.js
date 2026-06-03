const PHONE = "02-2511-9488";

export function answerUrologyProcedureAftercareQuestion(message) {
  if (!isUrologyProcedureAftercareQuestion(message)) return null;

  if (isCystoscopyAftercareQuestion(message)) {
    const hasFeverChills = hasPositiveFeverChillsCue(message);
    const hasClots = hasPositiveBloodClotCue(message);
    const hasRetention = hasPositiveUrinaryRetentionCue(message);
    const hasUrinationPain = hasPositiveUrinationPainCue(message);
    const hasBloodTinge = /尿.*粉紅|粉紅.*尿|尿.*紅|血絲|少量.*血|一點.*血/.test(message);

    if (!hasFeverChills && !hasClots && !hasRetention && hasBloodTinge && hasNegatedFeverChillsCue(message) && hasNegatedBloodClotCue(message) && hasCanUrinateCue(message)) {
      return [
        "膀胱鏡後少量粉紅尿或血絲可能會出現，但仍要看量、變化和是否有其他症狀。",
        "以你描述沒有發燒、血塊，而且尿得出來，通常不需要先急診；可依術後說明補充水分並觀察變化。",
        `若血尿變多、有血塊、尿不出來、發燒畏寒、疼痛加劇或明顯不舒服，請急診/立即就醫。若不確定是否正常，請電話 ${PHONE} 聯絡診所/回診確認。`
      ].join("");
    }

    const symptomSummary = hasUrinationPain
      ? "膀胱鏡後尿尿刺痛、尿中血絲需要看症狀變化與嚴重度。"
      : "膀胱鏡後尿中血絲或尿色變粉紅，需要看症狀變化與嚴重度。";
    const caution = hasFeverChills
      ? "你提到發冷，這比單純血絲或短暫刺痛更需要警覺感染或發燒風險；不建議只多喝水觀察。"
      : "膀胱鏡後短暫尿尿刺痛或少量血絲可能會出現，但仍要看嚴重度與變化才知道是否正常。";

    return [
      symptomSummary,
      caution,
      `請現在先量體溫並電話 ${PHONE} 聯絡診所/回診確認；若發燒或畏寒加劇、血尿變多、有血塊、尿不出來、疼痛加劇或明顯不舒服，請急診/立即就醫。`
    ].join("");
  }

  if (isUreteroscopyLithotripsyAftercareQuestion(message)) {
    const retentionCaution = hasUrinaryRetentionCue(message)
      ? "你提到尿變少或幾乎尿不出來，合併腹部/腰部脹痛時需要警覺尿液滯留、輸尿管阻塞或術後併發症風險。"
      : "輸尿管鏡或碎石後若血尿、腰痛變明顯，需要看症狀變化與嚴重度。";
    const feverCaution = hasFeverChillsCue(message)
      ? "另外有發燒或畏寒時，也要警覺感染或結石合併感染風險。"
      : "";

    return [
      "輸尿管鏡/碎石後出現血尿、腰痛或排尿明顯變少，不能只靠訊息判斷是否正常。",
      retentionCaution,
      feverCaution,
      `不建議只喝很多水、先吃止痛藥或等到明天；請現在先回診聯絡或電話 ${PHONE} 確認能否即時協助，若幾乎尿不出來、腹部或腰痛加劇、發燒畏寒、血尿變多、有血塊或明顯不舒服，請急診/立即就醫。`
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

function isUreteroscopyLithotripsyAftercareQuestion(message) {
  const hasProcedure = /輸尿管鏡|軟式輸尿管鏡|碎石後|做完.*碎石|震波後|鈥雷射/.test(message);
  const hasAftercareSymptom = /尿.*紅|血尿|血|腰痛|腰.*痛|腹.*痛|脹痛|尿不出|排不出尿|幾乎尿不出|尿變少|尿量.*少|發燒|發冷|畏寒|血塊|多喝水|止痛藥|等明天|回診/.test(message);
  return hasProcedure && hasAftercareSymptom;
}

function hasUrinaryRetentionCue(message) {
  return /尿不出|排不出尿|幾乎尿不出|尿變少|尿量.*少|尿很少|下腹脹|肚子.*脹|腹.*脹/.test(message);
}

function hasFeverChillsCue(message) {
  return /發冷|畏寒|寒顫|發燒|高燒|體溫\s*3[89](?:\.\d)?|38(?:\.\d)?|39(?:\.\d)?/.test(message);
}

function hasPositiveUrinationPainCue(message) {
  if (/尿尿不會痛|尿尿不痛|小便不會痛|小便不痛|排尿不會痛|排尿不痛|沒有尿痛|沒尿痛|無尿痛|尿尿沒有痛|尿尿沒痛/.test(message)) return false;
  return /尿尿.*痛|尿痛|排尿.*痛|小便.*痛|刺痛/.test(message);
}

function hasPositiveFeverChillsCue(message) {
  if (hasNegatedFeverChillsCue(message)) return false;
  return hasFeverChillsCue(message);
}

function hasPositiveBloodClotCue(message) {
  if (hasNegatedBloodClotCue(message)) return false;
  return /血塊/.test(message);
}

function hasPositiveUrinaryRetentionCue(message) {
  if (hasCanUrinateCue(message)) return false;
  return hasUrinaryRetentionCue(message);
}

function hasNegatedFeverChillsCue(message) {
  return /沒有發燒|沒發燒|無發燒|不發燒|沒有發冷|沒發冷|無發冷|沒有畏寒|沒畏寒|無畏寒/.test(message);
}

function hasNegatedBloodClotCue(message) {
  return /沒有血塊|沒血塊|無血塊/.test(message);
}

function hasCanUrinateCue(message) {
  return /尿得出來|尿得出|可以尿|有尿出來|沒有尿不出|沒尿不出|無尿不出/.test(message);
}
