import fs from "node:fs";

const LINE_VOOM_ANNOUNCEMENTS_PATH = new URL("../data/line-voom-announcements.md", import.meta.url);
const DOCTOR_NAMES = ["陳偉傑醫師", "羅詩修醫師", "吳致寬醫師", "李齊泰醫師", "陳嘉哲醫師", "蔡曜州醫師"];
const ANNOUNCEMENT_INTENT_PATTERN = /LINE\s*VOOM|VOOM|公告|停診|休診|公休|休假|連假|正常看診|照常看診|有診|看診|門診|營業/i;
const CONFIRMATION_TEXT = "如要確認當天名額，可電話 02-2511-9488。";
const PAST_ANNOUNCEMENT_CONFIRMATION_TEXT = "今天/最新安排請以最新公告或電話確認。";

export function answerLineVoomAnnouncementQuestion(message) {
  const normalizedMessage = stripTestQuestionPrefix(message);
  if (!ANNOUNCEMENT_INTENT_PATTERN.test(normalizedMessage)) return null;

  const requestedDates = extractRequestedMonthDays(normalizedMessage);
  if (requestedDates.length === 0) return null;
  if (asksCurrentScheduleWithPastAnnouncement(normalizedMessage, requestedDates)) return null;

  const requestedDoctor = DOCTOR_NAMES.find((doctor) => normalizedMessage.includes(doctor));
  const posts = loadLineVoomPosts();
  const matchingPost = posts.find((post) => {
    if (!requestedDates.every((date) => post.monthDays.has(date))) return false;
    if (requestedDoctor && !post.content.includes(requestedDoctor)) return false;
    return true;
  });

  if (!matchingPost) return null;

  return buildAnnouncementReply(matchingPost, requestedDates, requestedDoctor, normalizedMessage);
}

function asksCurrentScheduleWithPastAnnouncement(message, requestedDates) {
  if (!/(這週|本週|下週|今天|明天|後天)/.test(message)) {
    return false;
  }

  return requestedDates.some((date) => isPastMonthDay(date, new Date()));
}

function isPastMonthDay(date, now) {
  const [month, day] = date.split("/").map(Number);
  const nowParts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "numeric",
    day: "numeric"
  }).formatToParts(now);
  const values = Object.fromEntries(nowParts.map((part) => [part.type, Number(part.value)]));
  const requested = Date.UTC(values.year, month - 1, day);
  const today = Date.UTC(values.year, values.month - 1, values.day);
  return requested < today;
}

function stripTestQuestionPrefix(message) {
  return message.replace(/^\s*[A-Z]{1,4}\d{1,3}[-_]\d{1,3}(?:\s*[：:]|\s+)/i, "");
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

function buildAnnouncementReply(post, requestedDates, requestedDoctor, message) {
  const dateText = requestedDates.join(" 到 ");
  const doctorText = requestedDoctor ? `${requestedDoctor}` : "診所";
  const serviceNote = extractServiceNote(post.content);
  const confirmationText = wantsBriefReply(message) ? "" : CONFIRMATION_TEXT;
  const isPastAnnouncement = requestedDates.some((date) => isPastMonthDay(date, new Date()));

  if (/正常看診|照常看診/.test(post.content)) {
    const mixedScheduleReply = buildMixedNormalAndHolidayReply(post.content, requestedDates, doctorText);
    if (mixedScheduleReply) return compactLines([mixedScheduleReply, confirmationText]);

    return compactLines([`我查到 LINE VOOM 公告：${dateText} ${doctorText}正常看診。`, confirmationText]);
  }

  if (/公休|一起休息|休公休/.test(post.content) && !requestedDoctor) {
    return compactLines([`我查到 LINE VOOM 公告：${dateText} 診所有公休/休息公告。`, confirmationText]);
  }

  if (/停診|休診/.test(post.content)) {
    if (asksWhetherTemporaryChangeIsRecurring(message)) {
      return `${dateText} 是${doctorText}停診一次，不是每週都停診。固定門診仍請以門診表與最新公告為準。`;
    }

    const lines = [
      isPastAnnouncement
        ? `${dateText} 是過去 LINE VOOM 公告：${doctorText}停診一次。`
        : `我查到 LINE VOOM 公告：${dateText} ${doctorText}停診一次。`
    ];
    if (serviceNote) lines.push(isPastAnnouncement ? `當時公告寫：${serviceNote}。` : serviceNote);
    if (isPastAnnouncement) lines.push(PAST_ANNOUNCEMENT_CONFIRMATION_TEXT);
    lines.push(confirmationText);
    return compactLines(lines);
  }

  return compactLines([`我查到 LINE VOOM 公告提到 ${dateText}，建議以公告內容確認細節。`, confirmationText]);
}

function compactLines(lines) {
  return lines.filter(Boolean).join("\n");
}

function wantsBriefReply(message) {
  return /簡短|短一點|不要講太長|一句話|直接回答/.test(message);
}

function asksWhetherTemporaryChangeIsRecurring(message) {
  return /只有|那一次|一次|每週|每個|固定|都停|長期|以後/.test(message) &&
    /停診|休診|公休|停/.test(message);
}

function buildMixedNormalAndHolidayReply(content, requestedDates, doctorText) {
  const normalDates = requestedDates.filter((date) => dateLineMatches(content, date, /正常看診|照常看診|照原營業時間看診/));
  const holidayDates = requestedDates.filter((date) => dateLineMatches(content, date, /公休日|公休|休息/) && !normalDates.includes(date));

  if (normalDates.length === 0 || holidayDates.length === 0) return null;

  return [
    `我查到 LINE VOOM 公告：${normalDates.join("、")} ${doctorText}正常看診。`,
    `${holidayDates.join("、")} 照常為公休日。`
  ].join("\n");
}

function dateLineMatches(content, date, pattern) {
  const [month, day] = date.split("/");
  const datePattern = new RegExp(`${month}\\s*/\\s*0?${day}(?:\\D|$)`);
  return content
    .split("\n")
    .some((line) => datePattern.test(line) && pattern.test(line));
}

function extractServiceNote(content) {
  const match = content.match(/\*?\s*(100%匿名篩檢[^\n]*)/);
  if (!match) return null;
  return match[1]
    .replace(/\*+/g, "")
    .replace(/100%/g, "")
    .replace(/服務照常營業/g, "服務照常")
    .trim();
}

function extractRequestedMonthDays(text) {
  const dates = [];
  const numericMatches = text.matchAll(/(?:^|[^\dA-Za-z])(?:20\d{2}[/-])?(\d{1,2})[/-](\d{1,2})(?=$|[^\d])/g);
  for (const match of numericMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  const chineseMatches = text.matchAll(/(\d{1,2})月(\d{1,2})[日號]?/g);
  for (const match of chineseMatches) dates.push(normalizeMonthDay(match[1], match[2]));

  return [...new Set(dates)];
}

function normalizeMonthDay(month, day) {
  return `${Number(month)}/${Number(day)}`;
}
