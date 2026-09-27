/**
 * Stub Adapter Factory
 *
 * Produces a safe, do-nothing PlatformAdapter for a platform whose real
 * detection logic hasn't been written yet. `canHandle` is real (so users
 * can already add these tabs to the Watch List and see them listed), but
 * every detection method reports UNKNOWN / false / null — which the
 * automation engine already treats as "do nothing" per the safety rule
 * in claude.detector.ts. `implemented: false` also lets the popup show a
 * clear "detection not yet available" message instead of implying
 * RelayCTX is watching when it isn't really.
 *
 * To turn a stub into a real adapter, follow the Claude adapter as the
 * template:
 *   1. Copy the folder shape: <platform>.selectors.ts, .detector.ts,
 *      .actions.ts, .parser.ts, .adapter.ts (see src/platforms/claude/).
 *   2. Write real DOM signals in <platform>.selectors.ts — accessibility
 *      attributes first, then visible text, then structural fallbacks.
 *      Never key off exact button text alone.
 *   3. Implement detectState() to return real confidence + evidence.
 *   4. Only then implement continueGeneration / sendContinuationMessage,
 *      and only ever call them from behind the same confidence +
 *      stability gates core/state-machine.ts already enforces.
 *   5. Replace the stub in src/platforms/registry.ts and set
 *      `implemented: true`.
 * Do not skip straight to automation — Phase 3 (read-only detection)
 * should be proven against the real product first, exactly as the
 * Claude adapter was.
 */
import type { PlatformAdapter } from "./platform.interface";
import { SessionState, type DetectionResult, type SupportedPlatform } from "../core/types";

interface StubConfig {
  platform: SupportedPlatform;
  displayName: string;
  canHandle: (url: string) => boolean;
}

export function createStubAdapter(config: StubConfig): PlatformAdapter {
  return {
    platform: config.platform,
    displayName: config.displayName,
    implemented: false,

    canHandle: config.canHandle,

    async detectState(): Promise<DetectionResult> {
      return {
        state: SessionState.UNKNOWN,
        confidence: 0,
        evidence: [`Detection not yet implemented for ${config.displayName}`],
        title: this.readTitle(),
      };
    },

    async detectGenerating() {
      return false;
    },
    async detectOutputLimit() {
      return false;
    },
    async detectUsageLimit() {
      return false;
    },
    async detectCompletion() {
      return false;
    },

    findContinuationControl() {
      return null;
    },
    async continueGeneration() {
      return false;
    },

    findMessageInput() {
      return null;
    },
    async sendContinuationMessage() {
      return false;
    },

    async detectResetTime() {
      return null;
    },

    readTitle() {
      const docTitle = document.title?.trim();
      return docTitle && docTitle.length > 0 ? docTitle.slice(0, 80) : null;
    },
  };
}
