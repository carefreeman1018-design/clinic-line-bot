const PHONE = "02-2511-9488";

export function answerPenileFractureQuestion(message) {
  if (!isPenileFractureQuestion(message)) return null;

  return [
    "你描述性行為中陰莖突然啪一聲、馬上軟掉，接著腫脹、瘀青或明顯疼痛，要高度懷疑陰莖折斷/白膜破裂等急症，LINE 不能診斷。",
    "不建議只冰敷或等到明天；這種情況通常需要急診泌尿科評估，延誤可能影響之後勃起或彎曲狀況。",
    `請現在直接急診/立即就醫。若要同步確認診所能否協助，可電話 ${PHONE}，但不要因此延誤急診處理。`
  ].join("");
}

function isPenileFractureQuestion(message) {
  return (
    /陰莖|老二|下體|GG|生殖器/.test(message) &&
    /啪|喀|折|斷|彎掉|撞到|拗到|扭到|突然.*軟|馬上.*軟|立刻.*軟/.test(message) &&
    /腫|瘀青|瘀血|很痛|劇痛|疼痛|軟掉|變形|彎/.test(message)
  );
}
