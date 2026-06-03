const PHONE = "02-2511-9488";

export function answerHematospermiaQuestion(message) {
  if (!isHematospermiaQuestion(message)) return null;

  const repeatedNote = /兩次|2\s*次|反覆|一直|每次|好幾次|多次/.test(message)
    ? "已經出現不只一次，建議安排泌尿科門診評估。"
    : "如果只是單次、量少且沒有其他症狀，可先觀察，但仍建議留意是否再發生。";
  const emergencyQuestionWithLowRedFlags =
    /急診|馬上就醫|立刻就醫|立即就醫/.test(message) &&
    /沒有發燒|沒發燒|無發燒|不太痛|沒有.*痛|沒.*痛|無.*痛/.test(message);
  const nextStepNote = emergencyQuestionWithLowRedFlags
    ? "以你描述沒有發燒、明顯疼痛或排尿困難，通常不需要先急診，但建議安排泌尿科門診評估。"
    : repeatedNote;

  return [
    "精液有血/血精不等於一定是癌症，但 LINE 也不能直接排除感染、發炎、攝護腺或其他原因。",
    nextStepNote,
    `若合併血尿、尿痛、發燒、會陰或睪丸疼痛、排尿困難、血量變多，請盡快就醫；若要安排門診或確認時段，可電話 ${PHONE}。`
  ].join("");
}

function isHematospermiaQuestion(message) {
  return /血精|精液.*血|精液.*紅|射精.*血|射精.*紅|精子.*血|精子.*紅/.test(message);
}
