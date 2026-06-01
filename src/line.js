import crypto from "node:crypto";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";

export function verifyLineSignature(rawBody, signature, channelSecret) {
  if (!channelSecret || !signature) return false;

  const digest = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");

  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function replyText(replyToken, text, channelAccessToken) {
  if (!channelAccessToken) {
    console.log("[dry-run] LINE reply:", text);
    return;
  }

  const response = await fetch(LINE_REPLY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      replyToken,
      messages: [{ type: "text", text: truncateLineText(text) }]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE reply failed: ${response.status} ${body}`);
  }
}

function truncateLineText(text) {
  return text.length > 4900 ? `${text.slice(0, 4890)}...` : text;
}
