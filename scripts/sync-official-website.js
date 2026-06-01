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
    path.join(DATA_DIR, "official-health-education-index.md"),
    renderPostIndex({
      title: "官網衛教天地與醫療文章索引",
      purpose:
        "本檔供 LINE 官方帳號檢索官網衛教天地、男性健康、性病疑難雜症、泌尿手術醫學與最新消息文章。回答時可引用文章主題與官網連結，但個人症狀、診斷、用藥、手術適應症與費用仍需門診或官方 LINE 確認。",
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

function normalizePage(page) {
  return {
    type: "page",
    title: cleanText(page.title?.rendered),
    date: formatDate(page.date),
    link: normalizeUrl(page.link),
    slug: decodeSlug(page.slug),
    excerpt: cleanText(page.excerpt?.rendered),
    headings: extractHeadings(page.content?.rendered),
    keywords: extractKeywords([page.title?.rendered, page.excerpt?.rendered, page.content?.rendered].join(" "))
  };
}

function normalizePost(post, categoryById) {
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
    headings: extractHeadings(post.content?.rendered),
    keywords: extractKeywords([post.title?.rendered, post.excerpt?.rendered, post.content?.rendered].join(" "))
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
    "- 使用者問個人症狀、檢查報告、用藥、費用、禁忌症或手術安排時，請引導官方 LINE、電話或門診評估。",
    "- 若使用者問官網文章或頁面連結，可提供對應官網網址。",
    "",
    ...relevantPages.map(renderPageEntry)
  ].join("\n");
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
      "- 如果問題轉向個人症狀、治療選擇、費用或副作用，請改引導官方 LINE、電話或門診確認。"
    ];
  }

  return [
    "- 使用者詢問官網是否有某個疾病、手術、篩檢或衛教主題時，可提供對應文章連結。",
    "- 可用文章標題、分類、摘要與段落標題判斷主題方向，回答保持簡短並以門診評估作結。",
    "- 不要用文章索引替使用者診斷、保證療效、估費用或指定治療；需轉官方 LINE、電話或門診確認。"
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
