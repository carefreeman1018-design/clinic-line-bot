import fs from "node:fs/promises";

const DEFAULT_VOOM_URL =
  "https://linevoom.line.me/user/_dSPK5oF-CvsqFetilXhgKCCZmDAXN2oLLLhsP7U";
const DEFAULT_OUTPUT_PATH = "data/line-voom-announcements.md";
const DEFAULT_KEYWORDS = [
  "休診",
  "停診",
  "公休",
  "休假",
  "正常看診",
  "照常看診",
  "門診",
  "連假"
];

export async function syncLineVoomAnnouncements({
  voomUrl = process.env.LINE_VOOM_URL || DEFAULT_VOOM_URL,
  outputPath = process.env.LINE_VOOM_OUTPUT || DEFAULT_OUTPUT_PATH,
  keywords = parseKeywords(process.env.LINE_VOOM_KEYWORDS)
} = {}) {
  const html = await fetchText(voomUrl);
  const nextData = parseNextData(html);
  const posts = extractPosts(nextData);
  const announcementPosts = posts
    .filter((post) => matchesKeywords(post.text, keywords))
    .sort((a, b) => b.createdTime - a.createdTime);

  if (announcementPosts.length === 0) {
    throw new Error(`No LINE VOOM announcements matched: ${keywords.join(", ")}`);
  }

  const markdown = renderMarkdown({
    voomUrl,
    keywords,
    generatedAt: new Date(),
    posts: announcementPosts
  });

  await fs.writeFile(outputPath, markdown, "utf8");
  return {
    outputPath,
    postCount: announcementPosts.length
  };
}

async function main() {
  const result = await syncLineVoomAnnouncements();
  console.log(`Wrote ${result.postCount} LINE VOOM announcement(s) to ${result.outputPath}`);
}

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml",
      "accept-language": "zh-TW,zh;q=0.9,en;q=0.8",
      "user-agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
    }
  });

  if (!response.ok) {
    throw new Error(`LINE VOOM request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

function parseNextData(html) {
  const match = html.match(
    /<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/
  );

  if (!match) {
    throw new Error("LINE VOOM page did not contain __NEXT_DATA__ JSON");
  }

  return JSON.parse(match[1]);
}

function extractPosts(root) {
  const posts = [];
  const seenPostIds = new Set();

  visit(root, (value) => {
    const post = value?.post;
    if (!post?.postInfo?.postId || typeof post?.contents?.text !== "string") return;

    const postId = post.postInfo.postId;
    if (seenPostIds.has(postId)) return;
    seenPostIds.add(postId);

    posts.push({
      postId,
      createdTime: Number(post.postInfo.createdTime || 0),
      updatedTime: Number(post.postInfo.updatedTime || 0),
      text: normalizeText(post.contents.text),
      media: post.contents.media ?? []
    });
  });

  return posts;
}

function visit(value, callback) {
  if (!value || typeof value !== "object") return;

  callback(value);

  if (Array.isArray(value)) {
    for (const item of value) visit(item, callback);
    return;
  }

  for (const item of Object.values(value)) visit(item, callback);
}

function matchesKeywords(text, keywordList) {
  return keywordList.some((keyword) => text.includes(keyword));
}

function parseKeywords(value) {
  return (value || DEFAULT_KEYWORDS.join(","))
    .split(",")
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\u00a0/g, " ")
    .trim();
}

function renderMarkdown({ voomUrl, keywords, generatedAt, posts }) {
  const lines = [
    "# LINE VOOM 最新公告",
    "",
    `更新日期：${formatDateTime(generatedAt)}`,
    "",
    `資料來源：${voomUrl}`,
    "",
    `篩選關鍵字：${keywords.join("、")}`,
    "",
    "> 這份檔案由 `npm run sync:voom` 自動產生。若 LINE VOOM 頁面結構改版或抓取失敗，請先保留人工維護的 `data/doctor-schedule.md` 作為備援。",
    "",
    "## 回覆規則",
    "",
    "使用者詢問醫師休診、停診、公休、連假是否看診、某日是否照常營業時，請優先參考本檔案。",
    "",
    "若公告日期已過，仍可告知「我查到過去公告」，但不要把過去公告當成未來門診狀態。",
    "",
    "若沒有查到相關日期或醫師，請建議使用者以線上掛號頁、LINE 或電話 02-2511-9488 確認。",
    "",
    "## 最新 LINE VOOM 公告"
  ];

  for (const post of posts) {
    lines.push("");
    lines.push(`### ${formatDateTime(new Date(post.createdTime))} 公告`);
    lines.push("");
    lines.push(`LINE VOOM post ID：${post.postId}`);
    lines.push("");
    lines.push(post.text);
  }

  lines.push("");
  return lines.join("\n");
}

function formatDateTime(date) {
  return new Intl.DateTimeFormat("zh-TW", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).format(date);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
