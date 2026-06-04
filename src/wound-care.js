const PHONE = "02-2511-9488";

export function answerWoundCareQuestion(message) {
  if (!isWoundCareQuestion(message)) return null;
  if (/結紮|輸精管/.test(message)) return null;

  const officialCircumcisionAftercareReply = answerOfficialCircumcisionAftercareQuestion(message);
  if (officialCircumcisionAftercareReply) return officialCircumcisionAftercareReply;

  if (isOutsideSurgeryWoundQuestion(message)) {
    return [
      "外院手術後傷口有紅、腫或不舒服，建議先掛門診讓醫師實際看傷口；到場也可先跟 3 樓櫃台說明是外院術後想評估傷口。",
      "請帶外院手術資料、出院或術後說明、目前用藥/藥袋和健保卡，方便醫師判斷。",
      `若紅腫快速加劇、明顯流膿、發燒、傷口裂開、大量出血或很痛，請不要等 LINE 回覆，直接急診/立即就醫；也可先電話 ${PHONE} 確認可看診時段。`
    ].join("");
  }

  if (hasPossibleWoundAbnormality(message)) {
    const surgeryDay = resolveSurgeryDay(message);
    return [
      `${surgeryDay}水腫、出血或釘子旁黃黃的狀況，光靠訊息無法判斷是否為感染或流膿。`,
      "前 2 週傷口建議不要碰水；藥膏與換藥方式也不要自行加量或亂改。",
      `請先拍清楚照片傳給診所或直接回診/電話 ${PHONE} 確認。若疼痛加劇、明顯流膿、發燒、傷口裂開、排尿困難或大量出血，請盡快就醫。`
    ].join("");
  }

  if (/洗澡|碰水/.test(message)) {
    if (/割包皮|包皮槍|包皮環切/.test(message)) {
      return [
        "割包皮術後前 7 天請擦澡。",
        "之後只要能讓患處碰不到水，例如用保鮮膜包覆患處，即可洗澡；若傷口有紅腫、流膿、出血變多或不確定狀況，請先拍照傳給診所或回診確認。"
      ].join("");
    }

    return [
      "官網提醒前 2 週傷口建議最好不要碰到水。",
      "之後仍要看傷口狀況，若不確定是否能碰水，請拍照傳給診所或回診確認。"
    ].join("");
  }

  if (/換藥|藥膏|包紮/.test(message)) {
    return [
      "包皮術後通常依醫囑一天換藥一次、約兩週，薄擦藥膏後包紮。",
      "若不確定傷口狀況或想改藥膏用法，請先拍照傳給診所或回診確認。"
    ].join("");
  }

  return null;
}

function answerOfficialCircumcisionAftercareQuestion(message) {
  if (!/割包皮|包皮槍|包皮環切|包皮術後|術後/.test(message)) return null;
  if (hasUrgentWoundCue(message)) return null;

  if (/尿尿|小便|排尿|漏尿|亂噴/.test(message) && /亂噴|漏尿|正常|控制/.test(message)) {
    return "官網術後注意事項提到，有瘀青、尿尿亂噴或漏尿都是正常的；可以坐著尿，會比較好控制。若出現尿不出來、明顯疼痛加劇或大量出血，請直接聯絡診所或盡快就醫。";
  }

  if (/龜頭/.test(message) && /脹|腫|水腫|不舒服|處理|怎麼辦/.test(message)) {
    return "官網術後注意事項提到，龜頭很脹不舒服時，可以一小時擠壓一次、一次 5–10 秒，幫助換血；一小時內最多一次。若脹痛明顯惡化、發紫發黑、發燒或尿不出來，請直接聯絡診所或盡快就醫。";
  }

  if (/紗布|拆|包到|回診/.test(message) && /兩天|2\s*天|前兩天|回診|不要拆|可以拆/.test(message)) {
    return "官網術後注意事項提到，紗布前兩天不要拆，包到回診；回診前只需要吃口服藥，不需要換藥，所以藥膏也先不需要用。若紗布大量滲血或傷口明顯惡化，請直接聯絡診所。";
  }

  if (/出血|流血|滲血|止血|加壓/.test(message) && /怎麼|處理|先|可以|要/.test(message)) {
    return `官網術後注意事項提到，若有出血，可以加壓傷口處直到止血。若出血量多、持續止不住、疼痛加劇或有其他明顯惡化，請不要等線上回覆，直接聯絡診所 ${PHONE} 或盡快就醫。`;
  }

  return null;
}

function hasUrgentWoundCue(message) {
  return /大量出血|血流不止|止不住|發燒|尿不出來|尿不出|劇痛|痛到|越來越痛|發紫|紫黑|發黑|傷口裂開|明顯流膿|流膿|感染|惡化/.test(message);
}

function isWoundCareQuestion(message) {
  if (/包皮|割包皮|包皮槍|傷口|釘子|紗布|換藥|包紮/.test(message)) return true;
  return /術後|手術後/.test(message) && /水腫|流膿|膿|出血|滲血|裂開|洗澡|碰水|換藥|傷口/.test(message);
}

function isOutsideSurgeryWoundQuestion(message) {
  return /別家|外院|外面|其他醫院|他院|別的醫院/.test(message)
    && /手術|開刀|術後|做.*手術/.test(message)
    && /傷口|紅|腫|流膿|膿|出血|滲血|裂開|很痛|疼痛|發燒/.test(message);
}

function hasPossibleWoundAbnormality(message) {
  return /流膿|膿|黃黃|感染|發燒|裂開|出血|血|很痛|疼痛加劇|排尿困難|尿不出來|水腫|腫|不確定|正常嗎|是不是/.test(message);
}

function resolveSurgeryDay(message) {
  const numericDay = message.match(/第\s*(\d{1,2})\s*天/);
  if (numericDay) return `術後第 ${numericDay[1]} 天`;

  const chineseDay = message.match(/第\s*([一二三四五六七八九十])\s*天/);
  if (chineseDay) return `術後第 ${chineseDay[1]} 天`;

  return "術後";
}
