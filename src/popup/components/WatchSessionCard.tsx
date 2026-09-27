import { useEffect, useState } from "react";
import { SessionState, type WatchSession } from "../../core/types";
import { formatCountdown, shortenUrl } from "../../utils/url";
import { PLATFORM_COLOR_VAR, PLATFORM_IMPLEMENTED, PLATFORM_LABEL, PLATFORM_MONOGRAM } from "../platform-meta";

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
  | "unknown"
  | "unsupported";

function variantFor(session: WatchSession, implemented: boolean): Variant {
  if (!implemented) return "unsupported";
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

function statusLabel(session: WatchSession, implemented: boolean, now: number): string {
  if (!implemented) return "○ Detection coming soon";
  if (session.status === "paused") return `Session paused — left ${PLATFORM_LABEL[session.platform]}`;

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
  const implemented = PLATFORM_IMPLEMENTED[session.platform];
  const variant = variantFor(session, implemented);
  const isWaiting = session.lastDetectedState === SessionState.WAITING_FOR_RESET;

  useEffect(() => {
    if (!isWaiting) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [isWaiting]);

  return (
    <div className={`session-card session-card--${variant}`}>
      <div className="session-card__body">
        <div className="session-card__heading">
          <span
            className="session-card__icon"
            style={{ color: PLATFORM_COLOR_VAR[session.platform] }}
          >
            {PLATFORM_MONOGRAM[session.platform]}
          </span>
          <span className="session-card__title">{session.title ?? "Untitled conversation"}</span>
        </div>

        <span className="session-card__status">{statusLabel(session, implemented, now)}</span>

        {implemented && session.lastDetectedState === SessionState.ERROR && session.lastError && (
          <span className="session-card__error">{session.lastError}</span>
        )}

        {implemented && session.status !== "paused" && session.lastDetectedState !== SessionState.ERROR && (
          <span className="session-card__meta">{shortenUrl(session.url, 34)}</span>
        )}

        {!implemented && (
          <span className="session-card__meta">
            {PLATFORM_LABEL[session.platform]} adapter not built yet — nothing is automated here.
          </span>
        )}

        <div className="toggle-row">
          <span className="toggle-row__label">Auto continue</span>
          <label className="switch">
            <input
              type="checkbox"
              checked={implemented && session.automationEnabled}
              disabled={!implemented}
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
