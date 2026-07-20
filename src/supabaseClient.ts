import { createClient } from "@supabase/supabase-js";
import type { ChatMessage, AgentId } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.error("Missing Supabase env vars. Check .env for VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function loadHistory(sessionId: string, agent: AgentId): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, session_id, agent, role, content, created_at")
    .eq("session_id", sessionId)
    .eq("agent", agent)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function saveMessage(
  sessionId: string,
  agent: AgentId,
  role: "user" | "assistant",
  content: string
): Promise<ChatMessage | null> {
  const { data, error } = await supabase
    .from("messages")
    .insert({ session_id: sessionId, agent, role, content })
    .select("id, session_id, agent, role, content, created_at")
    .maybeSingle();

  if (error) throw error;
  return data as ChatMessage | null;
}
