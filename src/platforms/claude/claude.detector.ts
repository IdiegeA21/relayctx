/**
 * Claude Detector
 *
 * Turns raw DOM signals into a structured DetectionResult. This module
 * only *reads* the page — it never clicks or types. Automated actions
 * live in claude.actions.ts and are gated on the confidence this module
 * produces (see spec sections 26–27, "Safety Rule").
 */
import { SessionState, type DetectionResult } from "../../core/types";
import {
  COMPOSER_SELECTORS,
  CONTINUATION_PHRASES,
  GENERATING_PHRASES,
  INTERACTIVE_SELECTOR,
  USAGE_LIMIT_PHRASES,
  matchesAnyPhrase,
  textOf,
} from "./claude.selectors";
import { parseResetTime } from "./claude.parser";

function findComposer(): HTMLElement | null {
  for (const selector of COMPOSER_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

function isElementVisible(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== "hidden" && style.display !== "none";
}

function findInteractiveMatches(phrases: string[]): { el: Element; phrase: string }[] {
  const found: { el: Element; phrase: string }[] = [];
  const candidates = document.querySelectorAll(INTERACTIVE_SELECTOR);

  candidates.forEach((el) => {
    if (!isElementVisible(el)) return;
    const text = textOf(el);
    if (!text) return;
    const phrase = matchesAnyPhrase(text, phrases);
    if (phrase) found.push({ el, phrase });
  });

  return found;
}

function isComposerActive(composer: HTMLElement | null): boolean {
  if (!composer) return false;
  if (composer instanceof HTMLTextAreaElement || composer instanceof HTMLInputElement) {
    return !composer.disabled;
  }
  return composer.getAttribute("aria-disabled") !== "true" && !composer.hasAttribute("disabled");
}

/**
 * Run the full detection pass. Read-only; safe to call frequently
 * (subject to the caller's own debouncing).
 */
export async function detectClaudeState(): Promise<DetectionResult> {
  const evidence: string[] = [];

  // 1. Usage/session limit — checked first since it's the most disruptive
  // state and can co-occur with a visually "idle" composer.
  const usageMatches = findInteractiveMatches(USAGE_LIMIT_PHRASES);
  const bodyText = document.body?.innerText?.toLowerCase() ?? "";
  const bodyHasUsagePhrase = matchesAnyPhrase(bodyText, USAGE_LIMIT_PHRASES);

  if (usageMatches.length > 0 || bodyHasUsagePhrase) {
    if (usageMatches.length > 0) {
      evidence.push(`Usage-limit phrase on control: "${usageMatches[0].phrase}"`);
    }
    if (bodyHasUsagePhrase) {
      evidence.push(`Usage-limit phrase in page text: "${bodyHasUsagePhrase}"`);
    }

    const resetAt = parseResetTime(document.body?.innerText ?? "");
    if (resetAt) {
      evidence.push("Parsed a reset/availability time from nearby text");
    }

    return {
      state: resetAt ? SessionState.WAITING_FOR_RESET : SessionState.USAGE_LIMIT_REACHED,
      confidence: usageMatches.length > 0 ? 0.75 : 0.55,
      evidence,
      resetAt: resetAt ?? null,
    };
  }

  // 2. Actively generating — a visible "stop" control is the strongest
  // signal Claude is mid-response.
  const generatingMatches = findInteractiveMatches(GENERATING_PHRASES);
  if (generatingMatches.length > 0) {
    evidence.push(`Generation-stop control visible: "${generatingMatches[0].phrase}"`);
    return {
      state: SessionState.GENERATING,
      confidence: 0.8,
      evidence,
    };
  }

  // 3. Output-length continuation control.
  const continuationMatches = findInteractiveMatches(CONTINUATION_PHRASES);
  if (continuationMatches.length > 0) {
    evidence.push(`Continuation control detected: "${continuationMatches[0].phrase}"`);
    evidence.push("Generation-stop control not present");
    return {
      state: SessionState.OUTPUT_LIMIT_REACHED,
      confidence: 0.6,
      evidence,
    };
  }

  // 4. Composer is present and enabled, nothing else pending -> looks
  // like a stable, completed state.
  const composer = findComposer();
  const composerActive = isComposerActive(composer);
  if (composer && composerActive) {
    evidence.push("Message composer present and enabled");
    evidence.push("No generation, continuation, or usage-limit signals found");
    return {
      state: SessionState.COMPLETED,
      confidence: 0.5,
      evidence,
    };
  }

  evidence.push("No confident signals matched");
  return {
    state: SessionState.UNKNOWN,
    confidence: 0.2,
    evidence,
  };
}
