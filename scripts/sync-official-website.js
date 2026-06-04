import fs from "node:fs/promises";
import path from "node:path";

const SITE_URL = "https://uromeeme.com";
const API_BASE = `${SITE_URL}/wp-json/wp/v2`;
const DATA_DIR = path.join(process.cwd(), "data");

const MEDICAL_CATEGORY_NAMES = new Set([
  "衛教天地",
  "男性健康",
  "性病疑難雜症",
  "泌尿手術醫學",
  "最新消息"
]);

const MEDIA_CATEGORY_NAMES = new Set([
  "臉書專欄",
  "案例心得",
  "文章採訪報導",
  "影音採訪報導"
]);

const SERVICE_DEFINITIONS = [
  {
    title: "包皮槍/包皮環切手術",
    aliases: ["雙主治包皮槍 5.0", "割包皮", "包皮槍", "精雕包皮手術", "包皮環切", "包莖", "包皮過長"],
    pageMatchers: [/包皮槍|割包皮|treatment1/i],
    homepageMatchers: [/包皮槍|包皮環切|割包皮/i],
    defaultDescription: "雙主治包皮槍 5.0、精雕包皮手術，割完都有筋膜摺疊微增粗的效果。",
    suitableQuestions: ["是否提供割包皮、包皮槍或包皮環切", "包皮過長、包莖想預約評估", "想了解手術特色、術後照護與官網連結"],
    escalationBoundary: "個人適不適合手術、切除範圍、麻醉、風險、術後異常、費用與當日快速通關名額，需電話或門診確認。"
  },
  {
    title: "無刀口男性結紮手術",
    aliases: ["男性無刀口結紮", "雷射無刀口結紮", "輸精管結紮", "結紮手術", "男性避孕"],
    pageMatchers: [/無刀口結紮|結紮手術/i],
    homepageMatchers: [/結紮/i],
    defaultDescription: "雷射無刀口結紮手術，當日可淋浴，無痛快速，15 分鐘讓您成為體貼紮男。",
    suitableQuestions: ["是否提供男性結紮", "想了解結紮流程、特色、恢復期", "想知道術後精液檢查或避孕注意事項"],
    escalationBoundary: "個人能否結紮、術前用藥、術後疼痛腫脹、費用與可預約時間，需診所人員或醫師確認。"
  },
  {
    title: "男性私密處微創手術",
    aliases: ["繫帶微整形", "龜頭減敏", "珍珠丘疹", "陰莖增大", "男性私密處醫美", "包皮繫帶"],
    pageMatchers: [/男性私密處|私密處醫美|繫帶|龜頭減敏|珍珠丘疹/i],
    homepageMatchers: [/男性私密處|陰莖增大|龜頭減敏/i],
    defaultDescription: "針對男性私密處外觀與功能需求，提供繫帶微整形、龜頭減敏、珍珠丘疹處理等微創手術諮詢。",
    suitableQuestions: ["是否提供男性私密處微創手術", "繫帶過短、珍珠丘疹或龜頭敏感想評估", "想了解有哪些私密處醫美項目"],
    escalationBoundary: "是否為菜花或其他病灶、能否當日處理、手術方式、恢復期、費用與照片判讀，需門診評估。"
  },
  {
    title: "攝護腺肥大治療",
    aliases: ["前列腺肥大", "攝護腺肥大", "雷射剜除", "綠光雷射", "Urolift", "水蒸氣消融", "Rezum", "夜尿", "頻尿"],
    pageMatchers: [/攝護腺肥大|水蒸氣消融|urolift|綠光|雷射剜除/i],
    homepageMatchers: [/攝護腺肥大|前列腺|水蒸氣消融|Urolift/i],
    defaultDescription: "雷射剜除手術、水蒸氣消融、綠光雷射汽化、Urolift 前列腺手術等攝護腺肥大治療。",
    suitableQuestions: ["是否治療攝護腺肥大", "頻尿、夜尿、尿流變細想看診", "想了解水蒸氣消融或其他攝護腺手術"],
    escalationBoundary: "尿不出來、發燒、血尿、劇痛需優先就醫；檢查報告、手術選擇、藥物調整、費用需由醫師評估。"
  },
  {
    title: "腎結石/輸尿管結石治療",
    aliases: ["腎結石", "輸尿管結石", "尿路結石", "體外震波碎石", "軟式輸尿管鏡", "鈥雷射碎石", "腎絞痛"],
    pageMatchers: [/腎結石|輸尿管結石|尿路結石|碎石|鈥雷射/i],
    homepageMatchers: [/腎結石|輸尿管結石|尿路結石/i],
    defaultDescription: "腎結石手術、腎結石治療、輸尿管結石治療。",
    suitableQuestions: ["是否提供腎結石或輸尿管結石治療", "想了解體外震波、軟式輸尿管鏡或鈥雷射碎石", "腰痛、血尿懷疑結石想知道下一步"],
    escalationBoundary: "血尿合併腰痛/側腹痛、發燒、劇痛、尿不出來時應急診或立即就醫；治療方式與費用需檢查後確認。"
  },
  {
    title: "匿名性病篩檢/治療",
    aliases: ["100% 匿名篩檢", "性病治療", "性病快篩", "菜花", "HPV", "梅毒", "淋病", "披衣菌", "愛滋篩檢"],
    pageMatchers: [/性病治療|匿名性病|匿名篩檢|菜花|HPV|梅毒|淋病|披衣菌/i],
    homepageMatchers: [/匿名性病|匿名篩檢|性病治療|HPV|梅毒|淋病|菜花/i],
    footerMatchers: [/匿名|性病|菜花|梅毒|淋病|披衣菌|愛滋/i],
    defaultDescription: "愛滋病、菜花(HPV)、梅毒、淋病、披衣菌等匿名性病篩檢與治療。",
    suitableQuestions: ["是否提供匿名性病篩檢或治療", "危險性行為後想篩檢", "菜花、梅毒、淋病、披衣菌等想預約"],
    escalationBoundary: "暴露時間、檢驗窗口期、用藥、病灶判斷、是否能當日處理與費用，需由診所人員或醫師確認。"
  },
  {
    title: "暴露愛滋病毒前預防性投藥 (PrEP)",
    aliases: ["PrEP", "愛滋事前預防", "暴露前預防性投藥", "事前投藥"],
    pageMatchers: [/prep|暴露愛滋病毒前|暴露前/i],
    homepageMatchers: [/PrEP|暴露愛滋病毒前|暴露前/i],
    defaultDescription: "穩定持續使用 PrEP 藥品，讓體內具足夠藥物濃度，可降低感染愛滋病毒風險。",
    suitableQuestions: ["是否提供 PrEP", "高風險行為前想諮詢預防性投藥", "想了解 PrEP 使用方式與門診評估"],
    escalationBoundary: "是否適合用藥、檢驗項目、腎功能、藥物交互作用、副作用與費用，需醫師評估。"
  },
  {
    title: "暴露愛滋病毒後預防性投藥 (PEP)",
    aliases: ["PEP", "愛滋事後預防", "暴露後預防性投藥", "黃金 72 小時", "事後投藥"],
    pageMatchers: [/pep|暴露愛滋病毒後|暴露後/i],
    homepageMatchers: [/PEP|暴露愛滋病毒後|暴露後/i],
    defaultDescription: "亡羊補牢猶未晚，把握黃金 72 小時用藥預防感染愛滋病毒。",
    suitableQuestions: ["是否提供 PEP", "危險性行為後擔心 HIV 暴露", "想知道是否需要盡快安排 PEP 評估"],
    escalationBoundary: "PEP 有時間敏感性，疑似暴露請盡快電話或門診/急診評估；是否用藥、副作用與費用需醫師確認。"
  },
  {
    title: "HPV、皮蛇疫苗施打",
    aliases: ["HPV 疫苗", "九價疫苗", "菜花疫苗", "皮蛇疫苗", "帶狀皰疹疫苗", "疫苗接種"],
    pageMatchers: [/疫苗|HPV|皮蛇|帶狀皰疹|九價/i],
    homepageMatchers: [/HPV|皮蛇|疫苗/i],
    defaultDescription: "官網主要診療項目列出 HPV、皮蛇疫苗施打。",
    suitableQuestions: ["是否提供 HPV 或皮蛇疫苗", "想確認疫苗庫存與預約", "想了解疫苗接種是否可快速通關"],
    escalationBoundary: "庫存、廠牌、劑次、費用、是否適合施打、懷孕/免疫狀況與過敏史需由診所人員或醫師確認。"
  },
  {
    title: "性功能障礙治療",
    aliases: ["勃起功能障礙", "陽痿", "不舉", "早洩", "遲射", "性慾低下", "硬度不夠"],
    pageMatchers: [/性功能障礙|勃起|陽痿|早洩|遲射|性慾/i],
    homepageMatchers: [/性功能障礙|勃起|早洩|陽痿|遲射/i],
    defaultDescription: "性慾低下／過高、勃起功能障礙、早洩、陽痿、遲射等。",
    suitableQuestions: ["是否看性功能障礙", "硬度不夠、容易軟、早洩想評估", "想了解藥物、檢查或治療方向"],
    escalationBoundary: "用藥、劑量、禁忌症、心血管風險、荷爾蒙檢查與個人治療選擇需門診評估。"
  },
  {
    title: "低能量震波治療",
    aliases: ["低能量體外震波", "線性震波", "德國聚焦型震波", "LI-ESWT", "Richard Wolf", "硬度治療"],
    pageMatchers: [/低能量震波|體外震波|LI-ESWT|Richard/i],
    homepageMatchers: [/低能量.*震波|體外震波|線性震波/i],
    defaultDescription: "可幫助血管新生，主要能改善血管性病因導致的男性性功能障礙。",
    suitableQuestions: ["是否提供低能量震波", "勃起硬度問題想了解震波治療", "想知道震波治療特色與流程"],
    escalationBoundary: "是否適合、療程次數、合併 PRP 或藥物、費用與效果預期，需醫師評估。"
  },
  {
    title: "男性泌尿道感染",
    aliases: ["男性尿道炎", "膀胱炎", "攝護腺炎", "睪丸炎", "副睪丸炎", "尿痛", "血尿", "排尿疼痛"],
    pageMatchers: [/男性泌尿道感染|尿道炎|膀胱炎|攝護腺炎|睪丸炎|副睪丸炎/i],
    homepageMatchers: [/男性泌尿道感染|尿道炎|膀胱炎|攝護腺炎/i],
    defaultDescription: "男性泌尿道感染、尿道炎、膀胱炎、攝護腺炎等問題可由泌尿科評估。",
    suitableQuestions: ["男性解尿疼痛、頻尿或分泌物想看診", "懷疑泌尿道感染或攝護腺炎", "想知道是否需要泌尿科檢查"],
    escalationBoundary: "發燒、腰痛、血尿、睪丸劇痛腫脹、尿不出來或嚴重不適需立即就醫；抗生素與檢驗需醫師判斷。"
  },
  {
    title: "女性泌尿道感染/漏尿",
    aliases: ["女性泌尿", "女性尿道炎", "女性膀胱炎", "漏尿", "尿失禁", "頻尿", "急尿"],
    pageMatchers: [/女性泌尿道感染|女性泌尿|漏尿|尿失禁/i],
    homepageMatchers: [/女性泌尿|漏尿|尿失禁/i],
    defaultDescription: "女性泌尿道感染、漏尿、尿失禁、頻尿、急尿等問題可評估。",
    suitableQuestions: ["女性反覆泌尿道感染想看診", "咳嗽大笑會漏尿想評估", "想知道該看泌尿科或婦產科"],
    escalationBoundary: "發燒、腰痛、血尿、懷孕、嚴重疼痛、藥物與檢驗判讀需醫師評估。"
  },
  {
    title: "美磁波鍛肌椅",
    aliases: ["高密度磁波治療", "鍛肌椅", "骨盆底肌", "美磁波", "尿失禁治療", "產後漏尿"],
    pageMatchers: [/高密度磁波|鍛肌椅|骨盆底肌|美磁波/i],
    homepageMatchers: [/美磁波|鍛肌椅|高密度磁波|骨盆底肌/i],
    defaultDescription: "強化骨盆底肌群、改善尿失禁、親密關係不協調。",
    suitableQuestions: ["是否提供美磁波鍛肌椅", "漏尿、尿失禁或骨盆底肌問題想評估", "想了解非手術治療方向"],
    escalationBoundary: "是否適合、療程安排、禁忌症、懷孕/植入物狀況與費用需診所或醫師確認。"
  },
  {
    title: "痔瘡/廔管/肛裂/肛門性病",
    aliases: ["各式肛門問題", "痔瘡", "廔管", "肛裂", "肛門性病", "大腸直腸", "肛門直腸外科"],
    pageMatchers: [/肛門|痔瘡|廔管|肛裂|大腸直腸/i],
    homepageMatchers: [/肛門|痔瘡|廔管|肛裂/i],
    defaultDescription: "痔瘡微創手術、廔管手術、肛裂手術、肛門性病診斷與治療。",
    suitableQuestions: ["是否看痔瘡、廔管、肛裂", "肛門性病或肛門病灶想評估", "想了解肛門直腸外科門診"],
    escalationBoundary: "大量出血、劇痛、發燒、膿瘍、病灶判斷、是否能當日處理與費用需醫師評估。"
  },
  {
    title: "客製化功能性修復點滴",
    aliases: ["功能性修復點滴", "客製化點滴", "免疫提升點滴", "護肝點滴", "疲勞修復", "術後修復點滴"],
    pageMatchers: [/客製化功能性修復點滴|功能性修復點滴|點滴/i],
    homepageMatchers: [/客製化功能性修復點滴|修復點滴|點滴/i],
    defaultDescription: "高效吸收，日常保健，緊急修復。",
    suitableQuestions: ["是否提供功能性修復點滴", "疲勞、術後修復、免疫保健想諮詢", "想了解有哪些點滴配方"],
    escalationBoundary: "是否適合施打、成分、過敏、慢性病、用藥、費用與可預約時段需醫師或診所人員確認。"
  },
  {
    title: "猛健樂門診",
    aliases: ["猛健樂", "Mounjaro", "Tirzepatide", "瘦瘦筆", "減重門診", "體重管理"],
    pageMatchers: [/猛健樂|Mounjaro|Tirzepatide|減重|體重管理/i],
    homepageMatchers: [/猛健樂|Mounjaro|減重|體重管理/i],
    defaultDescription: "作為飲食及運動療法之外的輔助治療，由專業醫師替您把關。",
    suitableQuestions: ["是否有猛健樂門診", "想諮詢減重或體重管理藥物", "想了解猛健樂適應症與門診流程"],
    escalationBoundary: "是否符合適應症、劑量、禁忌症、副作用、庫存、費用與追蹤計畫需醫師評估。"
  }
];

async function main() {
  const categories = await fetchAll("categories", {
    _fields: "id,name,slug,count"
  });
  const categoryById = new Map(categories.map((category) => [category.id, category]));

  const pages = await fetchAll("pages", {
    _fields: "link,title,date,slug,excerpt,content"
  });
  const posts = await fetchAll("posts", {
    _fields: "link,title,date,slug,categories,excerpt,content"
  });

  const normalizedPages = pages.map((page) => normalizePage(page));
  const normalizedPosts = posts.map((post) => normalizePost(post, categoryById));
  const homepageHtml = await fetchHomepageHtml(normalizedPages);
  const homepageCards = extractHomepageServiceCards(homepageHtml);
  const homepageFooterItems = extractHomepageFooterServiceItems(homepageHtml);

  const healthPosts = normalizedPosts.filter((post) =>
    post.categories.some((category) => MEDICAL_CATEGORY_NAMES.has(category))
  );
  const mediaPosts = normalizedPosts.filter((post) =>
    post.categories.some((category) => MEDIA_CATEGORY_NAMES.has(category))
  );

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, "official-service-pages.md"),
    renderServicePages(normalizedPages),
    "utf8"
  );
  await fs.writeFile(
    path.join(DATA_DIR, "official-treatment-services.md"),
    renderTreatmentServices({
      pages: normalizedPages,
      homepageCards,
      homepageFooterItems
    }),
    "utf8"
  );
  await fs.writeFile(
    path.join(DATA_DIR, "official-health-education-index.md"),
    renderPostIndex({
      title: "官網衛教天地與醫療文章索引",
      purpose:
        "本檔供 LINE 官方帳號檢索官網衛教天地、男性健康、性病疑難雜症、泌尿手術醫學與最新消息文章。回答時可引用文章主題與官網連結，但個人症狀、診斷、用藥、手術適應症與費用仍需電話或門診確認。",
      posts: healthPosts
    }),
    "utf8"
  );
  await fs.writeFile(
    path.join(DATA_DIR, "official-media-cases-index.md"),
    renderPostIndex({
      title: "官網媒體報導、案例心得與社群文章索引",
      purpose:
        "本檔供 LINE 官方帳號檢索官網媒體報導、案例心得、臉書專欄與影音採訪報導。這些內容適合回答「有沒有相關文章/影片/案例」或補充官方內容來源，不適合替使用者做個人化醫療判斷。",
      posts: mediaPosts
    }),
    "utf8"
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        categories: categories.length,
        pages: normalizedPages.length,
        posts: normalizedPosts.length,
        treatmentServices: SERVICE_DEFINITIONS.length,
        homepageServiceCards: homepageCards.length,
        homepageFooterItems: homepageFooterItems.length,
        healthPosts: healthPosts.length,
        mediaPosts: mediaPosts.length
      },
      null,
      2
    )
  );
}

async function fetchAll(resource, params = {}) {
  const results = [];
  let page = 1;

  while (true) {
    const url = new URL(`${API_BASE}/${resource}`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }

    const response = await fetch(url);
    if (response.status === 400 && page > 1) break;
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
    }

    const batch = await response.json();
    results.push(...batch);

    const totalPages = Number(response.headers.get("x-wp-totalpages") || 1);
    if (page >= totalPages) break;
    page += 1;
  }

  return results;
}

async function fetchHomepageHtml(pages) {
  const homePage = pages.find((page) => page.link === `${SITE_URL}/`);
  const response = await fetch(SITE_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch homepage ${SITE_URL}: ${response.status} ${response.statusText}`);
  }

  const fullHtml = await response.text();
  return [homePage?.rawContent, fullHtml].filter(Boolean).join("\n");
}

function normalizePage(page) {
  const content = page.content?.rendered ?? "";
  return {
    type: "page",
    rawContent: content,
    title: cleanText(page.title?.rendered),
    date: formatDate(page.date),
    link: normalizeUrl(page.link),
    slug: decodeSlug(page.slug),
    excerpt: cleanText(page.excerpt?.rendered),
    headings: extractHeadings(content),
    contentHighlights: extractContentHighlights(content),
    keywords: extractKeywords([page.title?.rendered, page.excerpt?.rendered, content].join(" "))
  };
}

function normalizePost(post, categoryById) {
  const content = post.content?.rendered ?? "";
  const categories = (post.categories ?? [])
    .map((id) => categoryById.get(id)?.name)
    .filter(Boolean);

  return {
    type: "post",
    title: cleanText(post.title?.rendered),
    date: formatDate(post.date),
    link: normalizeUrl(post.link),
    slug: decodeSlug(post.slug),
    categories,
    excerpt: cleanText(post.excerpt?.rendered),
    headings: extractHeadings(content),
    contentHighlights: extractContentHighlights(content),
    keywords: extractKeywords([post.title?.rendered, post.excerpt?.rendered, content].join(" "))
  };
}

function renderServicePages(pages) {
  const relevantPages = pages.filter((page) => !["隱私權政策", "部落格"].includes(page.title));
  return [
    "# 官網服務頁與固定頁面索引",
    "",
    "資料來源：津久診所官網公開 WordPress API 與頁面內容",
    `同步日期：${new Date().toISOString().slice(0, 10)}`,
    "",
    "> 本檔供 LINE 官方帳號檢索官網服務頁、預約頁、品牌介紹、診所特色、醫師介紹與術後照護頁。回答時請優先給公開服務資訊、預約方式與官網連結；個人適應症、禁忌症、副作用、費用與療程安排仍需由醫師或診所人員確認。",
    "",
    "## 使用原則",
    "",
    "- 使用者問「有沒有提供某服務」時，可依對應頁面回答診所有該服務或可諮詢該項目。",
    "- 使用者問個人症狀、檢查報告、用藥、費用、禁忌症或手術安排時，請引導電話、線上掛號或門診評估。",
    "- 若使用者問官網文章或頁面連結，可提供對應官網網址。",
    "",
    ...relevantPages.map(renderPageEntry)
  ].join("\n");
}

function renderTreatmentServices({ pages, homepageCards, homepageFooterItems }) {
  const lines = [
    "# 官網診療項目總表",
    "",
    "資料來源：津久診所官網首頁、公開 WordPress API 與服務頁內容",
    `同步日期：${new Date().toISOString().slice(0, 10)}`,
    "",
    "> 本檔供 LINE 官方帳號檢索官網首頁列出的診療項目。可回答診所有提供哪些服務、對應服務頁、常見稱呼與公開服務重點；個人適應症、禁忌症、副作用、用藥、檢查報告、手術安排與費用仍需電話或門診確認。",
    "",
    "## 使用原則",
    "",
    "- 使用者問「有沒有做某項服務」時，可依下列項目回答診所有提供或可諮詢該項目。",
    "- 使用者問費用、是否適合、是否能當天處理、檢查報告、用藥、手術風險或療程安排時，請引導電話、官方 LINE、線上掛號或門診評估。",
    "- 若使用者出現急症風險，例如大量出血、發燒、劇痛、尿不出來、血尿合併腰痛或明顯感染，應優先建議立即就醫或急診。",
    ""
  ];

  for (const service of SERVICE_DEFINITIONS) {
    lines.push(renderTreatmentServiceEntry({
      service,
      pages,
      homepageCards,
      homepageFooterItems
    }));
  }

  return lines.join("\n").trimEnd() + "\n";
}

function renderTreatmentServiceEntry({ service, pages, homepageCards, homepageFooterItems }) {
  const matchedPages = findServicePages(service, pages);
  const cardDescriptions = findHomepageDescriptions(service, homepageCards);
  const footerMentions = findHomepageMentions(service, homepageFooterItems);
  const homepageDescriptions = uniqueCompact([
    ...cardDescriptions,
    ...footerMentions,
    service.defaultDescription
  ]);
  const highlights = uniqueCompact(matchedPages.flatMap((page) => page.contentHighlights)).slice(0, 8);
  const headings = uniqueCompact(matchedPages.flatMap((page) => page.headings)).slice(0, 14);
  const keywords = uniqueCompact([
    ...service.aliases,
    ...matchedPages.flatMap((page) => page.keywords)
  ]).slice(0, 28);

  return [
    `## ${service.title}`,
    "",
    `- 項目名稱：${service.title}`,
    `- 同義詞/使用者常問詞：${keywords.join("、")}`,
    matchedPages.length ? renderPageLinks(matchedPages) : "- 官網來源連結：官網首頁 https://uromeeme.com/",
    `- 首頁短描述：${homepageDescriptions.join(" / ")}`,
    headings.length ? `- 對應服務頁段落：${headings.join("、")}` : null,
    highlights.length ? renderHighlights("對應服務頁重點摘要", highlights) : null,
    renderList("適合回答的問題類型", service.suitableQuestions),
    `- 需要轉人工/門診/電話確認的邊界：${service.escalationBoundary}`,
    ""
  ]
    .filter(Boolean)
    .join("\n");
}

function renderPageLinks(pages) {
  return [
    "- 官網來源連結：",
    ...pages.map((page) => `  - ${page.title}：${page.link}`)
  ].join("\n");
}

function renderList(label, items) {
  return [`- ${label}：`, ...items.map((item) => `  - ${item}`)].join("\n");
}

function findServicePages(service, pages) {
  return pages
    .filter((page) => service.pageMatchers.some((pattern) => pattern.test([
      page.title,
      page.slug,
      page.link
    ].join("\n"))))
    .filter((page) => !["首頁", "部落格", "隱私權政策"].includes(page.title))
    .sort((a, b) => servicePageScore(service, b) - servicePageScore(service, a))
    .slice(0, 3);
}

function servicePageScore(service, page) {
  const text = [page.title, page.slug, page.link].join("\n");
  return service.pageMatchers.reduce((score, pattern) => score + (pattern.test(text) ? 2 : 0), 0);
}

function findHomepageDescriptions(service, homepageCards) {
  return homepageCards
    .filter((card) => service.homepageMatchers.some((pattern) => pattern.test(card.title)))
    .filter((card) => service.homepageMatchers.some((pattern) => pattern.test(card.description)))
    .map((card) => card.description);
}

function findHomepageMentions(service, homepageFooterItems) {
  const matchers = service.footerMatchers ?? service.homepageMatchers;
  return homepageFooterItems.filter((item) =>
    matchers.some((pattern) => pattern.test(item))
  );
}

function extractHomepageServiceCards(html = "") {
  const cards = [];
  const cardPattern = /<h4[^>]*>([\s\S]*?)<\/h4>\s*<p[^>]*>([\s\S]*?)(?:<\/p>|<style>)/gi;

  for (const match of html.matchAll(cardPattern)) {
    const title = cleanText(match[1]);
    const description = cleanText(match[2]);
    if (!title || !description) continue;
    if (!isTreatmentServiceText(`${title}\n${description}`)) continue;
    cards.push({ title, description });
  }

  return dedupeObjects(cards, (card) => `${card.title}:${card.description}`);
}

function extractHomepageFooterServiceItems(html = "") {
  const text = cleanText(html);
  const start = text.indexOf("主要診療項目");
  if (start === -1) return [];

  const endCandidates = [
    text.indexOf("門診時間表", start),
    text.indexOf("預約掛號", start),
    text.indexOf("陳偉傑", start)
  ].filter((index) => index > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : start + 1200;
  const section = text.slice(start, end);

  return section
    .split(/[•／]/)
    .map((item) => item.replace(/^主要診療項目/, "").trim())
    .filter((item) => item.length >= 3)
    .filter(isTreatmentServiceText)
    .map((item) => item.replace(/\s+/g, " "));
}

function isTreatmentServiceText(text) {
  return /包皮|結紮|私密|攝護腺|前列腺|結石|匿名|篩檢|HPV|皮蛇|疫苗|PrEP|PEP|性病|性功能|震波|女性泌尿|漏尿|鍛肌椅|肛門|痔瘡|廔管|肛裂|點滴|猛健樂/i.test(text);
}

function renderPostIndex({ title, purpose, posts }) {
  const grouped = groupByPrimaryCategory(posts);
  const lines = [
    `# ${title}`,
    "",
    "資料來源：津久診所官網公開 WordPress API 與文章內容",
    `同步日期：${new Date().toISOString().slice(0, 10)}`,
    "",
    `> ${purpose}`,
    "",
    "## 使用原則",
    "",
    ...renderPostUsagePrinciples(title),
    ""
  ];

  for (const [category, categoryPosts] of grouped) {
    lines.push(`## ${category}`, "");
    for (const post of categoryPosts) {
      lines.push(renderPostEntry(post), "");
    }
  }

  return lines.join("\n").trimEnd() + "\n";
}

function renderPostUsagePrinciples(title) {
  if (title.includes("媒體")) {
    return [
      "- 使用者詢問報導、影片、案例心得、社群專欄或醫師上節目內容時，可提供對應官網連結。",
      "- 這類內容主要作為延伸閱讀或品牌內容來源；不要把個案心得當成使用者本人的療效承諾。",
      "- 如果問題轉向個人症狀、治療選擇、費用或副作用，請改引導電話或門診確認。"
    ];
  }

  return [
    "- 使用者詢問官網是否有某個疾病、手術、篩檢或衛教主題時，可提供對應文章連結。",
    "- 可用文章標題、分類、摘要與段落標題判斷主題方向，回答保持簡短並以門診評估作結。",
    "- 不要用文章索引替使用者診斷、保證療效、估費用或指定治療；需轉電話或門診確認。"
  ];
}

function renderPageEntry(page) {
  return [
    `## ${page.title}`,
    "",
    `- 官網頁面：${page.link}`,
    `- 更新日期：${page.date}`,
    `- 網址代稱：${page.slug}`,
    page.excerpt ? `- 官網摘要：${page.excerpt}` : null,
    page.headings.length ? `- 頁面段落：${page.headings.join("、")}` : null,
    page.contentHighlights.length ? renderHighlights("頁面內容重點", page.contentHighlights) : null,
    page.keywords.length ? `- 相關關鍵字：${page.keywords.join("、")}` : null,
    ""
  ]
    .filter(Boolean)
    .join("\n");
}

function renderPostEntry(post) {
  return [
    `### ${post.title}`,
    "",
    `- 官網文章：${post.link}`,
    `- 發布日期：${post.date}`,
    `- 分類：${post.categories.join("、") || "未分類"}`,
    post.excerpt ? `- 官網摘要：${post.excerpt}` : null,
    post.headings.length ? `- 文章段落：${post.headings.join("、")}` : null,
    post.contentHighlights.length ? renderHighlights("文章內容重點", post.contentHighlights) : null,
    post.keywords.length ? `- 相關關鍵字：${post.keywords.join("、")}` : null
  ]
    .filter(Boolean)
    .join("\n");
}

function groupByPrimaryCategory(posts) {
  const grouped = new Map();

  for (const post of posts) {
    const category = post.categories[0] || "未分類";
    const entries = grouped.get(category) || [];
    entries.push(post);
    grouped.set(category, entries);
  }

  return [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b, "zh-Hant"));
}

function extractHeadings(html = "") {
  return [
    ...new Set(
      [...html.matchAll(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/gi)]
        .map((match) => cleanText(match[1]))
        .filter((heading) => heading && !isBoilerplate(heading))
    )
  ].slice(0, 18);
}

function extractContentHighlights(html = "") {
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  const paragraphs = decodeHtmlEntities(text)
    .split(/\n+/)
    .map((paragraph) => paragraph.replace(/\s+/g, " ").trim())
    .filter(isUsefulHighlight);

  const highlights = [];
  const seen = new Set();

  for (const paragraph of paragraphs) {
    const normalized = paragraph.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);

    highlights.push(truncateHighlight(paragraph));
    if (highlights.length >= 12) break;
  }

  return highlights;
}

function isUsefulHighlight(text) {
  if (text.length < 24) return false;
  if (text.length > 900) return false;
  if (isBoilerplate(text)) return false;
  if (/^(上一篇|下一篇|分享此文|相關文章|延伸閱讀|參考資料|read more)$/i.test(text)) return false;
  if (/^(line|facebook|instagram|youtube)$/i.test(text)) return false;
  if (/^\d+$/.test(text)) return false;
  return true;
}

function truncateHighlight(text) {
  return text.length > 360 ? `${text.slice(0, 357)}...` : text;
}

function renderHighlights(label, highlights) {
  return [`- ${label}：`, ...highlights.map((highlight) => `  - ${highlight}`)].join("\n");
}

function extractKeywords(text) {
  const cleaned = cleanText(text);
  const keywordPatterns = [
    /包皮槍|割包皮|包皮環切|包莖|包皮過長|水腫|術後照護/g,
    /結紮|輸精管|避孕|精液檢查/g,
    /攝護腺肥大|攝護腺發炎|水蒸氣消融|雷射剜除|綠光雷射|Urolift|夜尿|頻尿/g,
    /腎結石|輸尿管結石|體外震波|軟式輸尿管鏡|鈥雷射/g,
    /泌尿道感染|尿道炎|膀胱炎|睪丸炎|副睪丸炎|血尿|排尿疼痛/g,
    /性病|匿名篩檢|菜花|HPV|梅毒|淋病|披衣菌|愛滋|PrEP|PEP/g,
    /陽痿|早洩|不舉|性功能障礙|低能量震波|勃起|硬度/g,
    /女性泌尿|漏尿|尿失禁|骨盆底肌|鍛肌椅|高密度磁波/g,
    /痔瘡|廔管|肛裂|肛門性病|大腸直腸/g,
    /功能性修復點滴|猛健樂|Tirzepatide|減重|體重管理|疫苗|皮蛇/g
  ];

  const keywords = new Set();
  for (const pattern of keywordPatterns) {
    for (const match of cleaned.matchAll(pattern)) {
      keywords.add(match[0]);
    }
  }

  return [...keywords].slice(0, 24);
}

function uniqueCompact(items) {
  return [...new Set(items.map((item) => String(item ?? "").trim()).filter(Boolean))];
}

function dedupeObjects(items, keyFn) {
  const seen = new Set();
  const deduped = [];

  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

function cleanText(html = "") {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function decodeHtmlEntities(text = "") {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&apos;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#038;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function normalizeUrl(url) {
  return url?.replace(/\\\//g, "/") ?? "";
}

function decodeSlug(slug = "") {
  try {
    return decodeURIComponent(slug);
  } catch {
    return slug;
  }
}

function formatDate(dateString) {
  if (!dateString) return "未知";
  return dateString.slice(0, 10);
}

function isBoilerplate(text) {
  return /copyright|all rights reserved|依《醫療機構網際網路資訊管理辦法》|津久診所$/i.test(text);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
