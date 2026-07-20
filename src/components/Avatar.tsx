import type { AgentConfig } from "../types";

interface AvatarProps {
  agent: AgentConfig;
  size?: number;
  ring?: boolean;
}

export default function Avatar({ agent, size = 44, ring = false }: AvatarProps) {
  return (
    <div
      className="avatar"
      style={{
        width: size,
        height: size,
        background: agent.colors.gradient,
        boxShadow: ring
          ? `0 0 0 3px var(--surface), 0 0 0 5px rgba(${agent.colors.primaryRgb}, 0.25)`
          : `0 2px 8px rgba(${agent.colors.primaryRgb}, 0.3)`,
        fontSize: size * 0.42,
      }}
      aria-hidden="true"
    >
      {agent.initials}
    </div>
  );
}
