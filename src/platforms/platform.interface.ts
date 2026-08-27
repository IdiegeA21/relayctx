/**
 * Platform Adapter Interface
 *
 * Architectural principle: generic automation logic must never know
 * platform-specific DOM details. All of that knowledge lives inside each
 * adapter (e.g. src/platforms/claude/).
 *
 * MVP ships only the Claude adapter. `detectOutputLimit`,
 * `detectUsageLimit`, `findContinuationControl`, `continueGeneration`,
 * `sendContinuationMessage`, and `detectResetTime` are part of the
 * interface now so the automation engine (Phases 4+) can be built against
 * a stable contract, but the Claude adapter's MVP implementation focuses
 * on safe, read-only detection first per the "prove detection before
 * automating" development strategy.
 */
import type { DetectionResult, SupportedPlatform } from "../core/types";

export interface PlatformAdapter {
  platform: SupportedPlatform;

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
