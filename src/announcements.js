import fs from "node:fs";

const LINE_VOOM_ANNOUNCEMENTS_PATH = new URL("../data/line-voom-announcements.md", import.meta.url);
const DOCTOR_NAMES = ["陳偉傑醫師", "羅詩修醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師", "蔡曜州醫師"];
const ANNOUNCEMENT_INTENT_PATTERN = /LINE\s*VOOM|VOOM|公告|停診|休診|公休|休假|連假|正常看診|照常看診|有診|看診|營業/i;
const CONFIRMATION_TEXT = "實際可掛號狀態仍請以官方 LINE、線上掛號或電話 02-2511-9488 確認。";

export function answerLineVoomAnnouncementQuestion(message) {
  if (!ANNOUNCEMENT_INTENT_PATTERN.test(message)) return null;

  const requestedDates = extractRequestedMonthDays(message);
  if (requestedDates.length === 0) return null;

  const requestedDoctor = DOCTOR_NAMES.find((doctor) => message.includes(doctor));
  const posts = loadLineVoomPosts();
  const matchingPost = posts.find((post) => {
    if (!requestedDates.every((date) => post.monthDays.has(date))) return false;
    if (requestedDoctor && !post.content.includes(requestedDoctor)) return false;
    return true;
  });

  if (!matchingPost) return null;

  return buildAnnouncementReply(matchingPost, requestedDates, requestedDoctor);
}

function loadLineVoomPosts() {
  let raw;
  try {
    raw = fs.readFileSync(LINE_VOOM_ANNOUNCEMENTS_PATH, "utf8");
  } catch {
    return [];
  }

  const blocks = raw.match(/###\s+\d{4}\/\d{2}\/\d{2}[\s\S]*?(?=\n###\s+\d{4}\/\d{2}\/\d{2}|\n*$)/g) ?? [];
  return blocks.map((content) => ({
    content,
    monthDays: new Set(extractRequestedMonthDays(content))
  }));
}

function buildAnnouncementReply(post, requestedDates, requestedDoctor) {
  const dateText = requestedDates.join(" 到 ");
  const doctorText = requestedDoctor ? `${requestedDoctor}` : "診所";
  const serviceNote = extractServiceNote(post.content);

  if (/正常看診|照常看診/.test(post.content)) {
    return [`我查到 LINE VOOM 公告：${dateText} ${doctorText}正常看診。`, CONFIRMATION_TEXT].join("\n");
  }

  if (/公休|一起休息|休公休/.test(post.content) && !requestedDoctor) {
    return [`我查到 LINE VOOM 公告：${dateText} 診所有公休/休息公告。`, CONFIRMATION_TEXT].join("\n");
  }

  if (/停診|休診/.test(post.content)) {
    const lines = [`我查到 LINE VOOM 公告：${dateText} ${doctorText}停診一次。`];
    if (serviceNote) lines.push(serviceNote);
    lines.push(CONFIRMATION_TEXT);
    return lines.join("\n");
  }

  return [`我查到 LINE VOOM 公告提到 ${dateText}，建議以公告內容與官方 LINE 確認細節。`, CONFIRMATION_TEXT].join("\n");
}

function extractServiceNote(content) {
  const match = content.match(/\*?\s*(100%匿名篩檢[^\n]*)/);
  if (!match) return null;
  return match[1].replace(/\*+/g, "").trim();
}

function extractRequestedMonthDays(text) {
  const dates = [];
  const numericMatches = text.matchAll(/(?:20\d{2}[/-])?(\d{1,2})[/-](\d{1,2})/g);
  for (const match of numericMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  const chineseMatches = text.matchAll(/(\d{1,2})月(\d{1,2})[日號]?/g);
  for (const match of chineseMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  return [...new Set(dates)];
}

function normalizeMonthDay(month, day) {
  return `${Number(month)}/${Number(day)}`;
}
