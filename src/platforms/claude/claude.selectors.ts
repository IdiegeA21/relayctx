/**
 * Claude Selectors
 *
 * All Claude-specific DOM knowledge is documented here so it can be
 * updated independently of the generic RelayCTX engine when Claude's UI
 * changes. Do not depend on exact button text alone — Claude's UI wording
 * can change ("Continue", "Resume", "Generate more", an icon-only button,
 * etc). Signals are layered: accessibility attributes first, then visible
 * text, then structural/CSS fallbacks.
 *
 * Selector priority (see spec section 24):
 *   1. aria-label / aria-labelledby
 *   2. role
 *   3. title
 *   4. stable data-* attributes
 *   5. semantic DOM relationships
 *   6. CSS selectors (last resort)
 */

/** Elements that are plausibly interactive controls. */
export const INTERACTIVE_SELECTOR =
  'button, [role="button"], a[href], [contenteditable="true"], textarea, input';

/** The main message composer. Claude has historically used a
 * contenteditable rich-text box inside the chat input area. Fall back to
 * a textarea if present. */
export const COMPOSER_SELECTORS = [
  'div[contenteditable="true"][role="textbox"]',
  'div[contenteditable="true"]',
  'textarea[placeholder]',
  "textarea",
];

/** Phrases that plausibly indicate a "keep generating / hit output limit"
 * continuation control. Matched case-insensitively against aria-label,
 * title, and visible text. This list is intentionally broad — the
 * detector still requires structural evidence before treating a match as
 * high confidence. */
export const CONTINUATION_PHRASES = [
  "continue generating",
  "continue response",
  "generate more",
  "keep going",
  "resume generating",
  "continue",
  "resume",
];

/** Phrases that plausibly indicate usage/session exhaustion. */
export const USAGE_LIMIT_PHRASES = [
  "usage limit",
  "message limit",
  "you've reached your limit",
  "you have reached your limit",
  "limit reached",
  "try again later",
  "try again at",
  "available again",
  "resets at",
  "reset at",
  "come back",
];

/** Phrases that plausibly indicate active generation. */
export const GENERATING_PHRASES = ["stop generating", "stop response", "stop"];

/** Regexes for parsing a visible reset time out of nearby text. */
export const RESET_TIME_PATTERNS: RegExp[] = [
  /available again (?:at|in)\s+([^.\n]+)/i,
  /try again (?:at|in)\s+([^.\n]+)/i,
  /resets? (?:at|in)\s+([^.\n]+)/i,
  /come back (?:at|in)\s+([^.\n]+)/i,
];

export function textOf(el: Element): string {
  const aria = el.getAttribute("aria-label") ?? "";
  const title = el.getAttribute("title") ?? "";
  const visible = (el as HTMLElement).innerText ?? el.textContent ?? "";
  return `${aria} ${title} ${visible}`.trim().toLowerCase();
}

export function matchesAnyPhrase(text: string, phrases: string[]): string | null {
  const lower = text.toLowerCase();
  for (const phrase of phrases) {
    if (lower.includes(phrase)) return phrase;
  }
  return null;
}
