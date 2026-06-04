const PHONE = "02-2511-9488";

export function answerTesticularMassQuestion(message) {
  if (!isTesticularMassQuestion(message)) return null;

  return [
    "摸到睪丸或陰囊附近有硬塊，不一定就是癌症，但 LINE 訊息沒辦法判斷是什麼。",
    "建議盡快掛泌尿科門診，讓醫師實際檢查；是否需要陰囊超音波、抽血或後續治療，現場評估後才知道。",
    `如果突然劇痛、陰囊快速腫大、發燒、噁心想吐或痛到走不了，請直接急診/立即就醫。一般門診時段可先電話 ${PHONE} 確認。`
  ].join("\n");
}

function isTesticularMassQuestion(message) {
  if (/結紮|輸精管|術後|手術後|做完.*手術|傷口|滲血|出血|瘀青|血腫/.test(message)) {
    return false;
  }

  const hasTesticularContext = /睪丸|陰囊|蛋蛋/.test(message);
  const hasMassCue = /硬塊|腫塊|一顆|一粒|摸到|長一顆|凸起|硬硬|結節/.test(message);
  const asksRiskOrDecision = /癌|腫瘤|超音波|抽血|開刀|手術|切除|判斷|是不是|需要|要不要|怎麼辦|正常嗎/.test(message);

  return hasTesticularContext && hasMassCue && asksRiskOrDecision;
}
