/**
 * Platform Adapter Interface
 *
 * Architectural principle: generic automation logic must never know
 * platform-specific DOM details. All of that knowledge lives inside each
 * adapter (e.g. src/platforms/claude/).
 *
 * MVP ships a fully working Claude adapter plus three registered but
 * unimplemented stubs (ChatGPT, Codex, Gemini) — see
 * src/platforms/registry.ts. Their `canHandle` correctly recognizes the
 * real domains, so a user can already add one of those tabs to the Watch
 * List, but `implemented` is false and every detect method safely
 * reports "unknown" until someone fills in that adapter's selectors the
 * same way claude.selectors.ts / claude.detector.ts do. The automation
 * engine and popup both check `implemented` before doing anything with a
 * session, so a stub adapter can never trigger automation or mislead the
 * user into thinking detection is live.
 */
import type { DetectionResult, SupportedPlatform } from "../core/types";

export interface PlatformAdapter {
  platform: SupportedPlatform;

  /** Human-readable name for UI display (e.g. "ChatGPT", "Codex"). */
  displayName: string;

  /** False for stub adapters — detection/automation are not implemented
   * yet, even though `canHandle` may already recognize the platform's
   * domain. The popup and automation engine both gate on this. */
  implemented: boolean;

  /** Does this adapter know how to handle the given page URL? */
  canHandle(url: string): boolean;

  /** Inspect the current DOM and report the detected session state. */
  detectState(): Promise<DetectionResult>;

  /** Is the assistant response currently mid-generation? */
  detectGenerating(): Promise<boolean>;

  /** Has an output-length continuation control appeared? */
  detectOutputLimit(): Promise<boolean>;

  /** Has a usage/session limit message appeared? */
  detectUsageLimit(): Promise<boolean>;

  /** Does the page look like a stable, finished conversation? */
  detectCompletion(): Promise<boolean>;

  /** Locate the continuation control, if present and safe to use. */
  findContinuationControl(): HTMLElement | null;

  /** Click the continuation control. Returns true if the click was issued. */
  continueGeneration(): Promise<boolean>;

  /** Locate the active message composer. */
  findMessageInput(): HTMLElement | null;

  /** Type and submit a continuation message via the normal UI. */
  sendContinuationMessage(message: string): Promise<boolean>;

  /** Parse a visible reset/availability time, if present. Absolute epoch ms. */
  detectResetTime(): Promise<number | null>;

  /** Best-effort, safely-read conversation title for display purposes only. */
  readTitle(): string | null;
}
