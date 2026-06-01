import fs from "node:fs/promises";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const MIN_DUPLICATE_TEXT_LENGTH = 48;

async function main() {
  const files = (await fs.readdir(DATA_DIR))
    .filter((filename) => filename.endsWith(".md"))
    .sort();

  const documents = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(DATA_DIR, filename);
      const raw = await fs.readFile(filePath, "utf8");
      return {
        filename,
        sourceUrls: extractSourceUrls(raw),
        blocks: extractContentBlocks(raw)
      };
    })
  );

  const duplicateSourceUrls = findDuplicates(
    documents.flatMap((document) =>
      document.sourceUrls.map((url) => ({
        key: normalizeUrl(url),
        value: url,
        location: document.filename
      }))
    )
  );

  const duplicateTextBlocks = findDuplicates(
    documents.flatMap((document) =>
      document.blocks.map((block) => ({
        key: normalizeText(block),
        value: block,
        location: document.filename
      }))
    )
  ).filter((duplicate) => duplicate.key.length >= MIN_DUPLICATE_TEXT_LENGTH);

  const issues = [];

  for (const duplicate of duplicateTextBlocks) {
    issues.push({
      type: "duplicate-text-block",
      locations: duplicate.locations,
      preview: duplicate.value.slice(0, 120)
    });
  }

  const result = {
    ok: issues.length === 0,
    checkedFiles: files.length,
    duplicateSourceUrls: duplicateSourceUrls.map((duplicate) => ({
      url: duplicate.value,
      locations: duplicate.locations
    })),
    issues
  };

  console.log(JSON.stringify(result, null, 2));
  if (issues.length > 0) process.exitCode = 1;
}

function extractSourceUrls(raw) {
  const urls = raw.match(/https?:\/\/[^\s)]+/g) ?? [];
  return [...new Set(urls)];
}

function extractContentBlocks(raw) {
  return raw
    .split(/\n{2,}/g)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !block.startsWith("#"))
    .filter((block) => !block.startsWith("資料來源"))
    .filter((block) => !block.startsWith("- 官網"))
    .filter((block) => !block.startsWith(">"))
    .filter((block) => !/^更新日期：/.test(block))
    .filter((block) => normalizeText(block).length >= MIN_DUPLICATE_TEXT_LENGTH);
}

function findDuplicates(items) {
  const seen = new Map();

  for (const item of items) {
    if (!item.key) continue;
    const current = seen.get(item.key) ?? {
      key: item.key,
      value: item.value,
      locations: []
    };

    if (!current.locations.includes(item.location)) {
      current.locations.push(item.location);
    }

    seen.set(item.key, current);
  }

  return [...seen.values()].filter((entry) => entry.locations.length > 1);
}

function normalizeText(text) {
  return text
    .replace(/[`*_>「」『』，。！？、；：,.!?;:\s]/g, "")
    .toLowerCase();
}

function normalizeUrl(url) {
  return url.replace(/^https:\/\/www\./, "https://").replace(/\/$/, "");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
