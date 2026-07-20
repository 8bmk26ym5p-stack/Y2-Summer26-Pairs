import { useNavigate } from "react-router-dom";
import { AGENT_LIST } from "../agents";
import Avatar from "../components/Avatar";
import type { AgentConfig } from "../types";

export default function Landing() {
  const navigate = useNavigate();

  const openChat = (id: string) => navigate(`/chat/${id}`);

  return (
    <main className="landing">
      <header className="landing-header fade-in-up">
        <div className="landing-flag" aria-hidden="true">
          <span className="flag-stripe flag-blue" />
          <span className="flag-stripe flag-white" />
          <span className="flag-stripe flag-red" />
        </div>
        <h1 className="landing-title">AI Presidential Debate</h1>
        <p className="landing-subtitle">
          Choose an AI presidential candidate and discuss political topics.
        </p>
      </header>

      <section className="candidate-grid" aria-label="Choose a candidate">
        {AGENT_LIST.map((agent, idx) => (
          <CandidateCard
            key={agent.id}
            agent={agent}
            index={idx}
            onOpen={() => openChat(agent.id)}
          />
        ))}
      </section>

      <footer className="landing-footer fade-in">
        <p>Powered by Claude · Built for the AI Presidential Debate</p>
      </footer>
    </main>
  );
}

function CandidateCard({
  agent,
  index,
  onOpen,
}: {
  agent: AgentConfig;
  index: number;
  onOpen: () => void;
}) {
  return (
    <article
      className="candidate-card fade-in-up"
      style={{
        animationDelay: `${0.15 + index * 0.12}s`,
        ["--card-primary" as string]: agent.colors.primary,
        ["--card-primary-rgb" as string]: agent.colors.primaryRgb,
        ["--card-light-rgb" as string]: agent.colors.lightRgb,
        ["--card-border" as string]: agent.colors.border,
        ["--card-gradient" as string]: agent.colors.gradient,
      }}
    >
      <div className="candidate-accent" aria-hidden="true" />
      <div className="candidate-body">
        <div className="candidate-top">
          <Avatar agent={agent} size={64} ring />
          <div className="candidate-meta">
            <span
              className="candidate-party-tag"
              style={{ background: `rgba(${agent.colors.primaryRgb}, 0.1)`, color: agent.colors.primary }}
            >
              {agent.party}
            </span>
            <h2 className="candidate-name">{agent.name}</h2>
          </div>
        </div>
        <p className="candidate-desc">{agent.description}</p>
        <button
          className="candidate-cta"
          style={{ background: agent.colors.gradient }}
          onClick={onOpen}
          aria-label={`Chat with ${agent.name}`}
        >
          <span>Chat with {agent.name}</span>
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
    </article>
  );
}
