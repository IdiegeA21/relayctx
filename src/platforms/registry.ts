/**
 * Platform Registry
 *
 * The Claude adapter is fully implemented. ChatGPT, Codex, and Gemini are
 * registered with real domain matching but stubbed detection (see
 * stub-adapter.ts) — a watched tab on one of those shows up in the Watch
 * List, but RelayCTX won't automate anything on it until that adapter's
 * `implemented` flag is flipped to true by a real implementation.
 */
import type { PlatformAdapter } from "./platform.interface";
import type { SupportedPlatform } from "../core/types";
import { claudeAdapter } from "./claude/claude.adapter";
import { chatgptAdapter } from "./chatgpt/chatgpt.adapter";
import { codexAdapter } from "./codex/codex.adapter";
import { geminiAdapter } from "./gemini/gemini.adapter";

export const platforms: PlatformAdapter[] = [
  claudeAdapter,
  chatgptAdapter,
  codexAdapter,
  geminiAdapter,
];

export function adapterForUrl(url: string): PlatformAdapter | null {
  return platforms.find((p) => p.canHandle(url)) ?? null;
}

export function adapterForPlatform(platform: SupportedPlatform): PlatformAdapter | null {
  return platforms.find((p) => p.platform === platform) ?? null;
}
