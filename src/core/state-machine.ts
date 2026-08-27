/**
 * State Machine Helpers
 *
 * Pure, platform-agnostic logic for deciding whether a DetectionResult is
 * trustworthy enough to act on. No chrome.* APIs here — this module is
 * unit-testable in isolation and shared by the background automation
 * engine.
 */
import { SessionState, type DetectionResult } from "./types";

/** Minimum confidence required before RelayCTX will act on a state. */
export const CONFIDENCE_THRESHOLDS: Partial<Record<SessionState, number>> = {
  [SessionState.OUTPUT_LIMIT_REACHED]: 0.55,
  [SessionState.USAGE_LIMIT_REACHED]: 0.5,
  [SessionState.WAITING_FOR_RESET]: 0.5,
  [SessionState.COMPLETED]: 0.45,
};

/** How many consecutive identical detections are required before RelayCTX
 * treats a state as stable enough to act on. Prevents acting on a single
 * noisy DOM read. */
export const STABILITY_REQUIRED: Partial<Record<SessionState, number>> = {
  [SessionState.OUTPUT_LIMIT_REACHED]: 2,
  [SessionState.USAGE_LIMIT_REACHED]: 2,
  [SessionState.COMPLETED]: 3,
};

export const MAX_RETRIES = 3;
export const RETRY_DELAYS_MS = [1_000, 3_000, 10_000];

export function meetsConfidenceThreshold(result: DetectionResult): boolean {
  const threshold = CONFIDENCE_THRESHOLDS[result.state];
  if (threshold === undefined) return true; // states with no gate (e.g. GENERATING)
  return result.confidence >= threshold;
}

export function stabilityRequiredFor(state: SessionState): number {
  return STABILITY_REQUIRED[state] ?? 1;
}

interface StabilityEntry {
  state: SessionState;
  count: number;
}

/**
 * In-memory (per service-worker lifetime) stability tracker. Losing this
 * on service-worker suspension is safe — RelayCTX simply re-accumulates
 * confirmations, which only delays action, never causes an incorrect one.
 */
const stabilityMap = new Map<number, StabilityEntry>();

/** Record a detection and report whether the state is now considered stable. */
export function recordAndCheckStability(tabId: number, result: DetectionResult): boolean {
  const required = stabilityRequiredFor(result.state);
  const existing = stabilityMap.get(tabId);

  if (existing && existing.state === result.state) {
    existing.count += 1;
  } else {
    stabilityMap.set(tabId, { state: result.state, count: 1 });
  }

  const entry = stabilityMap.get(tabId)!;
  return entry.count >= required;
}

export function clearStability(tabId: number): void {
  stabilityMap.delete(tabId);
}
