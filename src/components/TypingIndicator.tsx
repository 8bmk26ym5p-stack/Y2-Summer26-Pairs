interface TypingIndicatorProps {
  color: string;
  colorRgb: string;
}

export default function TypingIndicator({ color, colorRgb }: TypingIndicatorProps) {
  return (
    <div className="typing-bubble" style={{ borderColor: `rgba(${colorRgb}, 0.3)` }}>
      <div className="typing-dots" aria-label="Assistant is typing">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="typing-dot"
            style={{
              background: color,
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      <span className="typing-label" style={{ color: `rgb(${colorRgb})` }}>
        Thinking…
      </span>
    </div>
  );
}
