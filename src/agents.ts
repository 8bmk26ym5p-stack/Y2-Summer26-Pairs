import type { AgentConfig, AgentId, ChatMessage } from "./types";

export const AGENTS: Record<AgentId, AgentConfig> = {
  bahaa: {
    id: "bahaa",
    name: "Bahaa",
    party: "Democratic Candidate",
    partyShort: "Democrat",
    description: "Sarcastic, concise, debate-oriented responses.",
    initials: "B",
    colors: {
      primary: "#1E3A8A",
      primaryRgb: "30, 58, 138",
      light: "#3B82F6",
      lightRgb: "59, 130, 246",
      border: "#93C5FD",
      bubbleBg: "#EFF6FF",
      gradient: "linear-gradient(135deg, #1E3A8A 0%, #3B5BDB 100%)",
    },
  },
  yousef: {
    id: "yousef",
    name: "Yousef",
    party: "Republican Candidate",
    partyShort: "Republican",
    description: "Formal, detailed, policy-focused responses.",
    initials: "Y",
    colors: {
      primary: "#9F1A1A",
      primaryRgb: "159, 26, 26",
      light: "#DC2626",
      lightRgb: "220, 38, 38",
      border: "#FCA5A5",
      bubbleBg: "#FEF2F2",
      gradient: "linear-gradient(135deg, #9F1A1A 0%, #D32020 100%)",
    },
  },
  mediator: {
    id: "mediator",
    name: "Sahar",
    party: "Neutral Moderator",
    partyShort: "Moderator",
    description: "Balanced, objective analysis that weighs both sides of every issue.",
    initials: "S",
    colors: {
      primary: "#0F766E",
      primaryRgb: "15, 118, 110",
      light: "#14B8A6",
      lightRgb: "20, 184, 166",
      border: "#5EEAD4",
      bubbleBg: "#F0FDFA",
      gradient: "linear-gradient(135deg, #0F766E 0%, #14B8A6 100%)",
    },
  },
};

export const AGENT_LIST: AgentConfig[] = [AGENTS.bahaa, AGENTS.yousef, AGENTS.mediator];

const EDGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const HEADERS: Record<string, string> = {
  "Content-Type": "application/json",
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
};

const ENDPOINTS: Record<AgentId, string> = {
  bahaa: "agent-bahaa",
  yousef: "agent-yousef",
  mediator: "agent-mediator",
};

export async function sendToAgent(
  agent: AgentId,
  history: ChatMessage[]
): Promise<string> {
  const messages = history.map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch(`${EDGE_BASE}/${ENDPOINTS[agent]}`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ messages }),
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      // ignore parse errors
    }
    throw new Error(detail);
  }

  const data = await res.json();
  if (typeof data?.reply !== "string") {
    throw new Error("Unexpected response shape from agent.");
  }
  return data.reply as string;
}
