import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { AGENTS, sendToAgent } from "../agents";
import { loadHistory, saveMessage, resetHistory } from "../supabaseClient";
import { useToast } from "../context/ToastContext";
import Avatar from "../components/Avatar";
import TypingIndicator from "../components/TypingIndicator";
import type { AgentConfig, AgentId, ChatMessage } from "../types";

const SESSION_KEY = "apd.session_id";

function getOrCreateSession(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function Chat() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const agent: AgentConfig | undefined = agentId
    ? AGENTS[agentId as AgentId]
    : undefined;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  const sessionIdRef = useRef<string>(getOrCreateSession());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Keep latest showToast in a ref so the history effect doesn't depend on it.
  const showToastRef = useRef(showToast);
  showToastRef.current = showToast;

  // Invalid agent id → bounce to landing.
  useEffect(() => {
    if (!agent) navigate("/", { replace: true });
  }, [agent, navigate]);

  // Load history once per agent.
  useEffect(() => {
    if (!agent) return;
    let cancelled = false;
    setHistoryLoaded(false);
    setLoading(true);
    (async () => {
      try {
        const history = await loadHistory(sessionIdRef.current, agent.id);
        if (!cancelled) setMessages(history);
      } catch {
        if (!cancelled) showToastRef.current("Could not load chat history.", "error");
      } finally {
        if (!cancelled) {
          setHistoryLoaded(true);
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [agent]);

  // Autoscroll to newest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  // Focus input after history loads.
  useEffect(() => {
    if (historyLoaded && inputRef.current) inputRef.current.focus();
  }, [historyLoaded]);

  const handleSend = useCallback(async () => {
    if (!agent || sending) return;
    const text = input.trim();
    if (!text) return;

    setInput("");
    setSending(true);

    // Build the message list including the new user message, for the API call.
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      session_id: sessionIdRef.current,
      agent: agent.id,
      role: "user",
      content: text,
      created_at: new Date().toISOString(),
    };
    const upcoming = [...messages, userMsg];
    setMessages(upcoming);

    try {
      const reply = await sendToAgent(agent.id, upcoming);

      // Persist user + assistant messages. Best-effort: if save fails, the
      // reply is still visible; we surface a toast but keep the conversation.
      try {
        await saveMessage(sessionIdRef.current, agent.id, "user", text);
        const saved = await saveMessage(
          sessionIdRef.current,
          agent.id,
          "assistant",
          reply
        );
        const assistantMsg: ChatMessage =
          saved ??
          ({
            id: crypto.randomUUID(),
            session_id: sessionIdRef.current,
            agent: agent.id,
            role: "assistant",
            content: reply,
            created_at: new Date().toISOString(),
          });
        setMessages((prev) => [...prev, assistantMsg]);
      } catch {
        // Fallback: keep the assistant reply in local state only.
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          session_id: sessionIdRef.current,
          agent: agent.id,
          role: "assistant",
          content: reply,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
        showToast("Reply shown, but not saved to history.", "info");
      }
    } catch (err) {
      // Roll back the optimistic user message so the user can retry.
      setMessages(messages);
      setInput(text);
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      showToast(msg, "error");
    } finally {
      setSending(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [agent, input, messages, sending, showToast]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = useCallback(async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        return true;
      } catch {
        showToast("Could not copy to clipboard.", "error");
        return false;
      }
    }
  }, [showToast]);

  const requestExit = useCallback(() => {
    setShowExitModal(true);
  }, []);

  const confirmExit = useCallback(
    async (doReset: boolean) => {
      if (doReset && agent) {
        setResetting(true);
        try {
          await resetHistory(sessionIdRef.current, agent.id);
          setMessages([]);
        } catch {
          showToast("Could not reset history. Leaving anyway.", "error");
        } finally {
          setResetting(false);
        }
      }
      setShowExitModal(false);
      navigate("/");
    },
    [agent, navigate, showToast]
  );

  const dismissModal = useCallback(() => {
    setShowExitModal(false);
    requestAnimationFrame(() => inputRef.current?.focus());
  }, []);

  const handleExport = useCallback(() => {
    if (!agent || messages.length === 0) return;
    const date = new Date().toLocaleString();
    const lines: string[] = [
      "AI Presidential Debate",
      `Candidate: ${agent.name} (${agent.party})`,
      `Exported: ${date}`,
      "",
      "\u2500".repeat(40),
      "",
    ];
    for (const m of messages) {
      const speaker = m.role === "user" ? "You" : agent.name;
      lines.push(`[${speaker}]: ${m.content}`);
      lines.push("");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${agent.id}-debate-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [agent, messages]);

  if (!agent) return null;

  const c = agent.colors;

  return (
    <div
      className="chat-page"
      style={{
        ["--c-primary" as string]: c.primary,
        ["--c-primary-rgb" as string]: c.primaryRgb,
        ["--c-light-rgb" as string]: c.lightRgb,
        ["--c-border" as string]: c.border,
        ["--c-bubble-bg" as string]: c.bubbleBg,
        ["--c-gradient" as string]: c.gradient,
      }}
    >
      <header className="chat-header">
        <div className="chat-header-inner">
          <button
            className="back-btn"
            onClick={requestExit}
            aria-label="Back to candidates"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M15 18l-6-6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Back</span>
          </button>
          <div className="chat-header-meta">
            <Avatar agent={agent} size={40} ring />
            <div className="chat-header-text">
              <h2 className="chat-header-name">{agent.name}</h2>
              <span className="chat-header-party">{agent.partyShort}</span>
            </div>
          </div>
          <button
            className="export-btn"
            onClick={handleExport}
            disabled={loading || messages.length === 0}
            aria-label="Export conversation as text file"
            title="Export as .txt"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span>Export</span>
          </button>
        </div>
      </header>

      <div className="chat-scroll" ref={scrollRef}>
        <div className="chat-inner">
          {loading ? (
            <div className="chat-empty fade-in">
              <Avatar agent={agent} size={72} ring />
              <h3 className="chat-empty-title">Debating with {agent.name}</h3>
              <p className="chat-empty-sub">{agent.description}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="chat-empty fade-in">
              <Avatar agent={agent} size={72} ring />
              <h3 className="chat-empty-title">Start the debate</h3>
              <p className="chat-empty-sub">
                Ask {agent.name} about any political topic to begin.
              </p>
            </div>
          ) : (
            messages.map((m, i) => (
              <MessageBubble
                key={m.id}
                message={m}
                agent={agent}
                index={i}
                onCopy={handleCopy}
              />
            ))
          )}

          {sending && (
            <div className="msg-row msg-row--assistant slide-in-left">
              <Avatar agent={agent} size={36} />
              <TypingIndicator color={c.primary} colorRgb={c.primaryRgb} />
            </div>
          )}
        </div>
      </div>

      <footer className="chat-input-area">
        <div className="chat-input-inner">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask about politics…"
            value={input}
            rows={1}
            disabled={sending}
            onChange={(e) => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
            }}
            onKeyDown={handleKeyDown}
            aria-label="Message input"
          />
          <button
            className="chat-send"
            onClick={handleSend}
            disabled={sending || !input.trim()}
            style={{ background: c.gradient }}
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
        <p className="chat-input-hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift</kbd> + <kbd>Enter</kbd> for a new line
        </p>
      </footer>

      {showExitModal && (
        <div className="modal-overlay" onClick={dismissModal}>
          <div
            className="modal-card scale-in"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exit-modal-title"
          >
            <h3 id="exit-modal-title" className="modal-title">
              Leave this conversation?
            </h3>
            <p className="modal-body">
              Would you like to reset the chat with {agent.name}? This permanently
              deletes the conversation history.
            </p>
            <div className="modal-actions">
              <button className="modal-btn modal-btn--ghost" onClick={dismissModal} disabled={resetting}>
                Stay
              </button>
              <button
                className="modal-btn modal-btn--secondary"
                onClick={() => confirmExit(false)}
                disabled={resetting}
              >
                Leave, keep history
              </button>
              <button
                className="modal-btn modal-btn--primary"
                onClick={() => confirmExit(true)}
                disabled={resetting}
              >
                {resetting ? "Resetting…" : "Reset & leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  agent,
  index,
  onCopy,
}: {
  message: ChatMessage;
  agent: AgentConfig;
  index: number;
  onCopy: (text: string) => Promise<boolean>;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  const handleCopyClick = async () => {
    const ok = await onCopy(message.content);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      className={`msg-row ${isUser ? "msg-row--user slide-in-right" : "msg-row--assistant slide-in-left"}`}
      style={{ animationDelay: `${Math.min(index * 0.03, 0.2)}s` }}
    >
      {!isUser && <Avatar agent={agent} size={36} />}
      <div className={`msg-content ${isUser ? "msg-content--user" : "msg-content--assistant"}`}>
        <div
          className={`msg-bubble ${isUser ? "msg-bubble--user" : "msg-bubble--assistant"}`}
        >
          {isUser ? (
            <p className="msg-text">{message.content}</p>
          ) : (
            <div className="markdown msg-text">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>
        {!isUser && (
          <button
            className={`msg-copy-btn ${copied ? "msg-copy-btn--copied" : ""}`}
            onClick={handleCopyClick}
            aria-label={copied ? "Copied" : "Copy message"}
            title={copied ? "Copied!" : "Copy"}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2" />
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
