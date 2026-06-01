import "dotenv/config";
import express from "express";
import { draftReply } from "./ai.js";
import { loadKnowledge, retrieveRelevantChunks, shouldEscalate } from "./knowledge.js";
import { replyText, verifyLineSignature } from "./line.js";

const app = express();
const port = Number(process.env.PORT || 3000);
const channelSecret = process.env.LINE_CHANNEL_SECRET;
const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const debugToken = process.env.DEBUG_TEST_TOKEN;

app.use(
  express.json({
    verify: (req, _res, buffer) => {
      req.rawBody = buffer;
    }
  })
);

app.get("/", (_req, res) => {
  res.json({
    name: "clinic-line-bot",
    status: "ok",
    webhook: "/webhook"
  });
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    lineConfigured: Boolean(channelSecret && channelAccessToken),
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.post("/debug/draft-reply", async (req, res) => {
  if (!debugToken || req.header("authorization") !== `Bearer ${debugToken}`) {
    return res.status(404).json({ error: "Not found" });
  }

  const message = String(req.body.message ?? "").trim();
  if (!message) return res.status(400).json({ error: "message is required" });

  const chunks = await loadKnowledge();
  const relevantChunks = retrieveRelevantChunks(chunks, message);
  const reply = await draftReply({
    message,
    chunks: relevantChunks,
    shouldEscalate: shouldEscalate(message)
  });

  res.json({
    reply,
    matches: relevantChunks.map((chunk) => ({
      source: chunk.source,
      title: chunk.title,
      score: chunk.score
    }))
  });
});

app.post("/webhook", async (req, res) => {
  const signature = req.header("x-line-signature");

  if (!verifyLineSignature(req.rawBody, signature, channelSecret)) {
    return res.status(401).json({ error: "Invalid LINE signature" });
  }

  res.status(200).end();

  const events = req.body.events ?? [];
  await Promise.allSettled(events.map(handleLineEvent));
});

async function handleLineEvent(event) {
  if (event.type !== "message" || event.message?.type !== "text") return;

  try {
    const message = event.message.text.trim();
    const chunks = await loadKnowledge();
    const relevantChunks = retrieveRelevantChunks(chunks, message);
    const reply = await draftReply({
      message,
      chunks: relevantChunks,
      shouldEscalate: shouldEscalate(message)
    });

    await safeReplyText(event.replyToken, reply);
  } catch (error) {
    console.error(error);
    await safeReplyText(
      event.replyToken,
      "不好意思，系統剛剛沒有順利查到資料。請您稍後再試，或留下問題讓診所人員協助回覆。"
    );
  }
}

async function safeReplyText(replyToken, message) {
  try {
    await replyText(replyToken, message, channelAccessToken);
  } catch (error) {
    console.error(error);
  }
}

app.listen(port, () => {
  console.log(`Clinic LINE bot listening on port ${port}`);
});
