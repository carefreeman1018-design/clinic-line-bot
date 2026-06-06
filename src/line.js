import crypto from "node:crypto";

const LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply";
const LINE_PUSH_URL = "https://api.line.me/v2/bot/message/push";
const LINE_CONTENT_URL = "https://api-data.line.me/v2/bot/message";

export function verifyLineSignature(rawBody, signature, channelSecret) {
  if (!channelSecret || !signature) return false;

  const digest = crypto
    .createHmac("sha256", channelSecret)
    .update(rawBody)
    .digest("base64");

  const expected = Buffer.from(digest);
  const actual = Buffer.from(signature);
  if (expected.length !== actual.length) return false;

  return crypto.timingSafeEqual(expected, actual);
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

export async function pushText(to, text, channelAccessToken) {
  if (!channelAccessToken) {
    console.log("[dry-run] LINE push:", { to, text });
    return;
  }

  const response = await fetch(LINE_PUSH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${channelAccessToken}`
    },
    body: JSON.stringify({
      to,
      messages: [{ type: "text", text: truncateLineText(text) }]
    })
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE push failed: ${response.status} ${body}`);
  }
}

export async function getMessageContent(messageId, channelAccessToken) {
  if (!channelAccessToken) {
    throw new Error("LINE channel access token is required to get message content.");
  }

  const response = await fetch(`${LINE_CONTENT_URL}/${encodeURIComponent(messageId)}/content`, {
    headers: {
      Authorization: `Bearer ${channelAccessToken}`
    }
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`LINE content download failed: ${response.status} ${body}`);
  }

  return {
    contentType: response.headers.get("content-type") || "application/octet-stream",
    buffer: Buffer.from(await response.arrayBuffer())
  };
}

function truncateLineText(text) {
  return text.length > 4900 ? `${text.slice(0, 4890)}...` : text;
}
