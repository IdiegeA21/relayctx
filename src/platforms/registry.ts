/**
 * Platform Registry
 *
 * MVP registers only the Claude adapter. Future platforms (Codex,
 * ChatGPT, Gemini) plug in here without changing the generic engine.
 */
import type { PlatformAdapter } from "./platform.interface";
import type { SupportedPlatform } from "../core/types";
import { claudeAdapter } from "./claude/claude.adapter";

export const platforms: PlatformAdapter[] = [claudeAdapter];

export function adapterForUrl(url: string): PlatformAdapter | null {
  return platforms.find((p) => p.canHandle(url)) ?? null;
}

export function adapterForPlatform(platform: SupportedPlatform): PlatformAdapter | null {
  return platforms.find((p) => p.platform === platform) ?? null;
}
