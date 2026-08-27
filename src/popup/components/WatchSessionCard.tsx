import { useEffect, useState } from "react";
import { SessionState, type WatchSession } from "../../core/types";
import { formatCountdown, shortenUrl } from "../../utils/url";

interface Props {
  session: WatchSession;
  onStop: (tabId: number) => void;
  onOpen: (tabId: number) => void;
  onToggleAutomation: (tabId: number, enabled: boolean) => void;
}

type Variant =
  | "generating"
  | "waiting"
  | "resuming"
  | "completed"
  | "error"
  | "paused"
  | "unknown";

function variantFor(session: WatchSession): Variant {
  if (session.status === "paused") return "paused";
  switch (session.lastDetectedState) {
    case SessionState.GENERATING:
      return "generating";
    case SessionState.OUTPUT_LIMIT_REACHED:
      return "generating";
    case SessionState.USAGE_LIMIT_REACHED:
    case SessionState.WAITING_FOR_RESET:
      return "waiting";
    case SessionState.RESUMING:
      return "resuming";
    case SessionState.COMPLETED:
      return "completed";
    case SessionState.ERROR:
      return "error";
    default:
      return "unknown";
  }
}

function statusLabel(session: WatchSession, now: number): string {
  if (session.status === "paused") return "Session paused — left Claude";

  switch (session.lastDetectedState) {
    case SessionState.GENERATING:
      return "● Generating";
    case SessionState.OUTPUT_LIMIT_REACHED:
      return "● Output limit — continuing";
    case SessionState.USAGE_LIMIT_REACHED:
      return "⏳ Usage limit reached";
    case SessionState.WAITING_FOR_RESET: {
      if (session.nextActionAt) {
        const remaining = session.nextActionAt - now;
        return `⏳ Waiting for reset · ${formatCountdown(remaining)}`;
      }
      return "⏳ Waiting for reset";
    }
    case SessionState.RESUMING:
      return "↻ Resuming…";
    case SessionState.COMPLETED:
      return "✓ Task appears complete";
    case SessionState.ERROR:
      return "! Automation paused";
    default:
      return "○ Watching — reading state…";
  }
}

export default function WatchSessionCard({ session, onStop, onOpen, onToggleAutomation }: Props) {
  const [now, setNow] = useState(Date.now());
  const variant = variantFor(session);
  const isWaiting = session.lastDetectedState === SessionState.WAITING_FOR_RESET;

  useEffect(() => {
    if (!isWaiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isWaiting]);

  return (
    <div className={`session-card session-card--${variant}`}>
      <div className="session-card__body">
        <span className="session-card__title">{session.title ?? "Claude conversation"}</span>
        <span className="session-card__status">{statusLabel(session, now)}</span>

        {session.lastDetectedState === SessionState.ERROR && session.lastError && (
          <span className="session-card__error">{session.lastError}</span>
        )}

        {session.status !== "paused" && session.lastDetectedState !== SessionState.ERROR && (
          <span className="session-card__meta">{shortenUrl(session.url, 34)}</span>
        )}

        <div className="toggle-row">
          <span className="toggle-row__label">Auto continue</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={session.automationEnabled}
              onChange={(e) => onToggleAutomation(session.tabId, e.target.checked)}
              aria-label="Toggle automatic continuation for this session"
            />
            <span className="switch__track" />
          </label>
        </div>
      </div>

      <div className="session-card__actions">
        <button className="btn btn--link btn--sm" onClick={() => onOpen(session.tabId)}>
          Open
        </button>
        <button className="btn btn--ghost btn--sm" onClick={() => onStop(session.tabId)}>
          Stop
        </button>
      </div>
    </div>
  );
}
