const PHONE = "02-2511-9488";

export function answerFournierGangreneQuestion(message) {
  if (!isFournierGangreneQuestion(message)) return null;

  const riskFactors = buildRiskFactorPhrase(message);
  const lead = riskFactors
    ? `${riskFactors}，又出現陰囊/會陰紅腫劇痛、皮膚變黑、發燒或昏沉`
    : "陰囊/會陰紅腫劇痛、皮膚變黑、發燒或昏沉";

  return [
    `${lead}，要高度警覺佛尼爾氏壞疽等快速惡化感染，光靠訊息無法診斷。`,
    "這種情況不建議等明天門診，也不適合只在線上問；可能有敗血症風險，常需要急診評估、廣效抗生素與緊急清創。",
    `請現在就急診/立即就醫。若要同步確認診所能否協助，請電話 ${PHONE}，但不要因此延誤急診處理。`
  ].join("");
}

function buildRiskFactorPhrase(message) {
  const factors = [];

  if (/70\s*歲|七十歲/.test(message)) factors.push("70 歲");
  else if (/老人|長照/.test(message)) factors.push("年長者");

  if (/糖尿病/.test(message)) factors.push("有糖尿病");
  if (/免疫/.test(message)) factors.push("免疫力較弱");

  return factors.join("、");
}

function isFournierGangreneQuestion(message) {
  return (
    /陰囊|會陰|生殖器|私密處|肛門附近/.test(message) &&
    /糖尿病|70\s*歲|七十歲|老人|長照|免疫|發燒|昏沉|意識|皮膚.*黑|變黑|發黑|黑色|腐臭|紅腫|很痛|劇痛/.test(message) &&
    /變黑|發黑|黑色|昏沉|意識|敗血|糖尿病|壞疽|佛尼爾|Fournier/i.test(message)
  );
}
