const PHONE = "02-2511-9488";

export function answerTesticularTorsionQuestion(message) {
  if (!isTesticularTorsionQuestion(message)) return null;

  return [
    "16 歲突然單側睪丸痛到走不了、陰囊腫，需警覺睪丸扭轉或其他急性陰囊問題，LINE 不能直接診斷。",
    "不建議先吃止痛藥拖到隔天；睪丸扭轉有缺血風險，官網衛教提到通常需要把握黃金六小時內處理。",
    `請現在就急診/立即就醫。診所是否能今天檢查或處理需由醫師評估與時段確認；可同時電話 ${PHONE} 確認最快方式。`
  ].join("");
}

function isTesticularTorsionQuestion(message) {
  if (/糖尿病|70\s*歲|七十歲|老人|長照|會陰|皮膚.*黑|變黑|發黑|黑色|腐臭|昏沉|意識|敗血|佛尼爾|Fournier/i.test(message)) {
    return false;
  }

  return (
    /睪丸|陰囊|蛋蛋|蛋疼/.test(message) &&
    /突然|剛剛|急|劇痛|很痛|痛到|走不了|腫|腫脹|運動後|青少年|16\s*歲|十六歲|扭轉/.test(message)
  );
}
