/**
 * Claude Parser
 *
 * Best-effort parsing of human-readable reset/availability text into an
 * absolute epoch-millisecond timestamp. Absolute timestamps are stored
 * (never a relative "2 hours" string) because the service worker can be
 * suspended, the browser can sleep/restart, and the popup can be closed —
 * see spec section 29.
 *
 * Parsing is intentionally conservative: if the text can't be confidently
 * parsed, return null rather than guessing.
 */
import { RESET_TIME_PATTERNS } from "./claude.selectors";

/** Parse phrases like "2 hours", "45 minutes", "1 hour 30 minutes". */
function parseRelativeDuration(text: string): number | null {
  const hourMatch = text.match(/(\d+)\s*hour/);
  const minuteMatch = text.match(/(\d+)\s*min/);
  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;
  if (hours === 0 && minutes === 0) return null;
  return (hours * 60 + minutes) * 60 * 1000;
}

/** Parse a clock time like "4:30 PM" into today's (or tomorrow's) epoch ms. */
function parseClockTime(text: string): number | null {
  const match = text.match(/(\d{1,2}):(\d{2})\s*(am|pm)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) return null;

  const now = new Date();
  const candidate = new Date(now);
  candidate.setHours(hours, minutes, 0, 0);

  if (candidate.getTime() <= now.getTime()) {
    candidate.setDate(candidate.getDate() + 1);
  }

  return candidate.getTime();
}

/**
 * Attempt to find and parse a reset time within a block of nearby text.
 * Returns an absolute epoch-ms timestamp, or null if nothing reliable
 * was found.
 */
export function parseResetTime(nearbyText: string): number | null {
  for (const pattern of RESET_TIME_PATTERNS) {
    const match = nearbyText.match(pattern);
    if (!match) continue;

    const fragment = match[1].trim();

    const relative = parseRelativeDuration(fragment);
    if (relative !== null) {
      return Date.now() + relative;
    }

    const clock = parseClockTime(fragment);
    if (clock !== null) {
      return clock;
    }
  }

  return null;
}
