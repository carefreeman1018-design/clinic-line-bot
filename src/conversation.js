import { supabase } from "./supabase.js";

const CONVERSATION_TABLE = process.env.SUPABASE_CONVERSATION_TABLE || "line_conversation_messages";
const MAX_CONVERSATION_MESSAGES_PER_USER = Number(process.env.MAX_CONVERSATION_MESSAGES_PER_USER || 40);
const inMemoryConversationByUser = new Map();

export function isConversationMemoryConfigured() {
  return Boolean(supabase);
}

export async function loadConversationHistory(lineUserId) {
  if (!lineUserId) return [];
  if (!supabase) return loadInMemoryConversationHistory(lineUserId);

  const { data, error } = await supabase
    .from(CONVERSATION_TABLE)
    .select("role, content")
    .eq("line_user_id", lineUserId)
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(MAX_CONVERSATION_MESSAGES_PER_USER);

  if (error) {
    console.error("Supabase conversation history load failed:", error);
    return loadInMemoryConversationHistory(lineUserId);
  }

  return [...data]
    .reverse()
    .map((message) => ({
      role: message.role,
      content: message.content
    }));
}

export async function rememberConversationExchange(lineUserId, userMessage, assistantMessage) {
  if (!lineUserId) return;

  const rows = [
    {
      line_user_id: lineUserId,
      role: "user",
      content: userMessage
    },
    {
      line_user_id: lineUserId,
      role: "assistant",
      content: assistantMessage
    }
  ];

  if (!supabase) {
    rememberInMemoryConversationRows(lineUserId, rows);
    return;
  }

  const { error } = await supabase.from(CONVERSATION_TABLE).insert(rows);

  if (error) {
    console.error("Supabase conversation history save failed:", error);
    rememberInMemoryConversationRows(lineUserId, rows);
  }
}

export async function rememberConversationMessage(lineUserId, role, content) {
  if (!lineUserId || !["user", "assistant"].includes(role) || !content) return;

  const rows = [
    {
      line_user_id: lineUserId,
      role,
      content
    }
  ];

  if (!supabase) {
    rememberInMemoryConversationRows(lineUserId, rows);
    return;
  }

  const { error } = await supabase.from(CONVERSATION_TABLE).insert(rows);

  if (error) {
    console.error("Supabase conversation message save failed:", error);
    rememberInMemoryConversationRows(lineUserId, rows);
  }
}

function loadInMemoryConversationHistory(lineUserId) {
  return inMemoryConversationByUser.get(lineUserId) ?? [];
}

function rememberInMemoryConversationRows(lineUserId, rows) {
  const current = inMemoryConversationByUser.get(lineUserId) ?? [];
  const next = [
    ...current,
    ...rows.map((row) => ({
      role: row.role,
      content: row.content
    }))
  ].slice(-MAX_CONVERSATION_MESSAGES_PER_USER);

  inMemoryConversationByUser.set(lineUserId, next);
}
