import { useToast } from "../context/ToastContext";

export default function ToastContainer() {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" role="alert" aria-live="assertive">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.variant}`}
          onClick={() => dismissToast(t.id)}
        >
          <span className="toast-icon">{t.variant === "error" ? "!" : "i"}</span>
          <span className="toast-message">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
