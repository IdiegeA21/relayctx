/**
 * Platform display metadata for the popup UI. Deliberately separate from
 * src/platforms/registry.ts — that registry's adapters touch the DOM and
 * belong in the content-script bundle, not here. Keep this in sync with
 * the `implemented` flag on each adapter when a new one goes live.
 */
import type { SupportedPlatform } from "../core/types";

export const PLATFORM_LABEL: Record<SupportedPlatform, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  codex: "Codex",
  gemini: "Gemini",
};

/** Two-letter monogram shown in place of each product's real logo (which
 * RelayCTX doesn't have rights to reproduce). */
export const PLATFORM_MONOGRAM: Record<SupportedPlatform, string> = {
  claude: "CL",
  chatgpt: "GP",
  codex: "CX",
  gemini: "GM",
};

export const PLATFORM_COLOR_VAR: Record<SupportedPlatform, string> = {
  claude: "var(--accent-violet)",
  chatgpt: "var(--accent-teal)",
  codex: "var(--accent-amber)",
  gemini: "var(--accent-sky)",
};

/** Mirrors each adapter's `implemented` flag (see stub-adapter.ts). Only
 * Claude has real detection today. */
export const PLATFORM_IMPLEMENTED: Record<SupportedPlatform, boolean> = {
  claude: true,
  chatgpt: false,
  codex: false,
  gemini: false,
};
