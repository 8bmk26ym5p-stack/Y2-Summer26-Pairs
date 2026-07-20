export type AgentId = "bahaa" | "yousef";

export interface ChatMessage {
  id: string;
  session_id: string;
  agent: AgentId;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface AgentConfig {
  id: AgentId;
  name: string;
  party: string;
  partyShort: string;
  description: string;
  colors: {
    primary: string;
    primaryRgb: string;
    light: string;
    lightRgb: string;
    border: string;
    bubbleBg: string;
    gradient: string;
  };
  initials: string;
}

export type ToastVariant = "error" | "info";
export interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}
