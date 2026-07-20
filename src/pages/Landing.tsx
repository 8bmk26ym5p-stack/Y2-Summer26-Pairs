import { useNavigate } from "react-router-dom";
import { AGENTS } from "../agents";
import Avatar from "../components/Avatar";
import type { AgentConfig } from "../types";

export default function Landing() {
  const navigate = useNavigate();
  const openChat = (id: string) => navigate(`/chat/${id}`);

  return (
    <main className="landing-sections" aria-label="Choose a debater">
      <Section agent={AGENTS.bahaa} side="left" onOpen={() => openChat("bahaa")} index={0} />
      <Section agent={AGENTS.mediator} side="center" onOpen={() => openChat("mediator")} index={1} />
      <Section agent={AGENTS.yousef} side="right" onOpen={() => openChat("yousef")} index={2} />
    </main>
  );
}

function Section({
  agent,
  side,
  index,
  onOpen,
}: {
  agent: AgentConfig;
  side: "left" | "center" | "right";
  index: number;
  onOpen: () => void;
}) {
  return (
    <section
      className={`debate-section debate-section--${side} fade-in`}
      style={{
        animationDelay: `${0.05 + index * 0.1}s`,
        ["--sec-primary" as string]: agent.colors.primary,
        ["--sec-primary-rgb" as string]: agent.colors.primaryRgb,
        ["--sec-light-rgb" as string]: agent.colors.lightRgb,
        ["--sec-border" as string]: agent.colors.border,
        ["--sec-bubble-bg" as string]: agent.colors.bubbleBg,
        ["--sec-gradient" as string]: agent.colors.gradient,
      }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      aria-label={`Open chat with ${agent.name}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="section-glow" aria-hidden="true" />
      <div className="section-content">
        <Avatar agent={agent} size={side === "center" ? 96 : 80} ring />
        <span
          className="section-party-tag"
          style={{ background: `rgba(${agent.colors.primaryRgb}, 0.12)`, color: agent.colors.primary }}
        >
          {agent.party}
        </span>
        <h2 className="section-name">{agent.name}</h2>
        <p className="section-desc">{agent.description}</p>
        <button
          className="section-cta"
          style={{ background: agent.colors.gradient }}
          aria-label={`Chat with ${agent.name}`}
        >
          <span>Start conversation</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
}
