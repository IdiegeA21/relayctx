import type { PlatformAdapter } from "../platform.interface";
import type { DetectionResult, SupportedPlatform } from "../../core/types";
import { SessionState } from "../../core/types";
import { detectClaudeState } from "./claude.detector";
import {
  clickContinuationControl,
  findContinuationControl,
  findMessageInput,
  sendContinuationMessage,
} from "./claude.actions";
import { parseResetTime } from "./claude.parser";

class ClaudeAdapter implements PlatformAdapter {
  platform: SupportedPlatform = "claude";

  canHandle(url: string): boolean {
    try {
      const { hostname } = new URL(url);
      return hostname === "claude.ai" || hostname.endsWith(".claude.ai");
    } catch {
      return false;
    }
  }

  async detectState(): Promise<DetectionResult> {
    const result = await detectClaudeState();
    return { ...result, title: this.readTitle() };
  }

  async detectGenerating(): Promise<boolean> {
    const result = await detectClaudeState();
    return result.state === SessionState.GENERATING;
  }

  async detectOutputLimit(): Promise<boolean> {
    const result = await detectClaudeState();
    return result.state === SessionState.OUTPUT_LIMIT_REACHED;
  }

  async detectUsageLimit(): Promise<boolean> {
    const result = await detectClaudeState();
    return (
      result.state === SessionState.USAGE_LIMIT_REACHED ||
      result.state === SessionState.WAITING_FOR_RESET
    );
  }

  async detectCompletion(): Promise<boolean> {
    const result = await detectClaudeState();
    return result.state === SessionState.COMPLETED;
  }

  findContinuationControl(): HTMLElement | null {
    return findContinuationControl();
  }

  async continueGeneration(): Promise<boolean> {
    return clickContinuationControl();
  }

  findMessageInput(): HTMLElement | null {
    return findMessageInput();
  }

  async sendContinuationMessage(message: string): Promise<boolean> {
    return sendContinuationMessage(message);
  }

  async detectResetTime(): Promise<number | null> {
    return parseResetTime(document.body?.innerText ?? "");
  }

  readTitle(): string | null {
    // Best-effort only, for display in the popup. Never sent anywhere
    // beyond local chrome.storage.
    const heading = document.querySelector("h1, h2");
    const headingText = heading?.textContent?.trim();
    if (headingText) return headingText.slice(0, 80);

    const docTitle = document.title?.replace(/\s*[-|]\s*Claude.*$/i, "").trim();
    if (docTitle && docTitle.toLowerCase() !== "claude") return docTitle.slice(0, 80);

    return null;
  }
}

export const claudeAdapter = new ClaudeAdapter();
