import { supabase } from "./supabase.js";

const SETTINGS_TABLE = process.env.SUPABASE_SETTINGS_TABLE || "bot_settings";
const BOT_ENABLED_KEY = "bot_enabled";
let inMemoryBotEnabled = true;

export function isSettingsStoreConfigured() {
  return Boolean(supabase);
}

export async function getBotEnabled() {
  if (!supabase) return inMemoryBotEnabled;

  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", BOT_ENABLED_KEY)
    .maybeSingle();

  if (error) {
    console.error("Supabase bot setting load failed:", error);
    return inMemoryBotEnabled;
  }

  const enabled = data?.value?.enabled;
  if (typeof enabled !== "boolean") return inMemoryBotEnabled;

  inMemoryBotEnabled = enabled;
  return enabled;
}

export async function setBotEnabled(enabled) {
  inMemoryBotEnabled = enabled;
  if (!supabase) return enabled;

  const { error } = await supabase.from(SETTINGS_TABLE).upsert(
    {
      key: BOT_ENABLED_KEY,
      value: { enabled },
      updated_at: new Date().toISOString()
    },
    { onConflict: "key" }
  );

  if (error) {
    console.error("Supabase bot setting save failed:", error);
  }

  return enabled;
}

export async function getStringListSetting(key, fallback = []) {
  if (!supabase) return fallback;

  const { data, error } = await supabase
    .from(SETTINGS_TABLE)
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    console.error(`Supabase setting load failed for ${key}:`, error);
    return fallback;
  }

  const value = data?.value;
  const ids = Array.isArray(value?.ids) ? value.ids : Array.isArray(value) ? value : null;
  if (!ids) return fallback;

  return ids.map((item) => String(item).trim()).filter(Boolean);
}
