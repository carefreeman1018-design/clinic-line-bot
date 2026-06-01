import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CONVERSATION_TABLE = process.env.SUPABASE_CONVERSATION_TABLE || "line_conversation_messages";
const MAX_IN_MEMORY_MESSAGES_PER_USER = 40;
const inMemoryConversationByUser = new Map();

const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      })
    : null;

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
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    console.error("Supabase conversation history load failed:", error);
    return loadInMemoryConversationHistory(lineUserId);
  }

  return data.map((message) => ({
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
  ].slice(-MAX_IN_MEMORY_MESSAGES_PER_USER);

  inMemoryConversationByUser.set(lineUserId, next);
}
