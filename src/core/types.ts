/**
 * RelayCTX — Core Types
 *
 * Shared type definitions used across background, content, and popup.
 * Keep this file platform-agnostic. Platform-specific detail belongs in
 * src/platforms/<platform>/.
 */

export type SupportedPlatform = "claude";

/**
 * Explicit session states. Deliberately NOT a boolean `isRunning` flag —
 * RelayCTX must distinguish output-length exhaustion from usage/session
 * exhaustion, plus resuming/completed/error/stopped states.
 */
export const SessionState = {
  UNKNOWN: "UNKNOWN",
  GENERATING: "GENERATING",
  OUTPUT_LIMIT_REACHED: "OUTPUT_LIMIT_REACHED",
  WAITING_FOR_CONTINUE: "WAITING_FOR_CONTINUE",
  USAGE_LIMIT_REACHED: "USAGE_LIMIT_REACHED",
  WAITING_FOR_RESET: "WAITING_FOR_RESET",
  RESUMING: "RESUMING",
  COMPLETED: "COMPLETED",
  ERROR: "ERROR",
  STOPPED: "STOPPED",
  UNSUPPORTED_PAGE: "UNSUPPORTED_PAGE",
} as const;

export type SessionState = (typeof SessionState)[keyof typeof SessionState];

/** High level lifecycle status of a watched tab (drives the UI badge). */
export type SessionStatus =
  | "watching"
  | "paused"
  | "tab_closed"
  | "stopped";

export interface DetectionResult {
  state: SessionState;
  /** 0..1 confidence that `state` is correct. */
  confidence: number;
  /** Human-readable signals that led to this conclusion, for debugging. */
  evidence: string[];
  /** Absolute epoch ms when a reset/availability is expected, if known. */
  resetAt?: number | null;
  /** Short label describing the conversation, if it could be read safely. */
  title?: string | null;
}

export interface WatchSession {
  id: string;
  tabId: number;
  url: string;
  platform: SupportedPlatform;
  status: SessionStatus;
  automationEnabled: boolean;
  createdAt: number;
  updatedAt: number;
  lastDetectedState?: SessionState;
  lastConfidence?: number;
  lastEvidence?: string[];
  /** Absolute epoch ms for the next scheduled automation check. */
  nextActionAt?: number | null;
  lastActivityAt?: number;
  retryCount?: number;
  title?: string | null;
  lastError?: string | null;
}

export interface ExtensionSettings {
  notificationsEnabled: boolean;
  defaultAutomationEnabled: boolean;
}

export interface StorageSchema {
  sessions: WatchSession[];
  settings: ExtensionSettings;
}

export const DEFAULT_SETTINGS: ExtensionSettings = {
  notificationsEnabled: true,
  defaultAutomationEnabled: true,
};

/** Messages sent between popup <-> background <-> content script. */
export type ExtensionMessage =
  | { type: "START_WATCH"; tabId: number; url: string; title?: string }
  | { type: "STOP_WATCH"; tabId: number }
  | { type: "GET_SESSIONS" }
  | { type: "GET_SESSIONS_RESULT"; sessions: WatchSession[] }
  | { type: "SESSIONS_UPDATED"; sessions: WatchSession[] }
  | { type: "GET_CURRENT_TAB_INFO" }
  | {
      type: "CURRENT_TAB_INFO_RESULT";
      tabId: number | null;
      url: string | null;
      title: string | null;
      platform: SupportedPlatform | null;
      alreadyWatched: boolean;
    }
  | { type: "REQUEST_DETECTION"; tabId: number }
  | { type: "STATE_CHANGED"; tabId: number; result: DetectionResult }
  | { type: "PING_CONTENT" }
  | { type: "PONG_CONTENT"; platform: SupportedPlatform | null }
  | { type: "CONTINUE_GENERATION_CMD" }
  | { type: "SEND_CONTINUE_CMD"; message: string }
  | { type: "GET_SETTINGS" }
  | { type: "GET_SETTINGS_RESULT"; settings: ExtensionSettings }
  | { type: "SET_SETTINGS"; settings: ExtensionSettings }
  | { type: "SET_AUTOMATION_ENABLED"; tabId: number; enabled: boolean };

/** Response shape content scripts send back for REQUEST_DETECTION. */
export interface DetectionResponse {
  result: DetectionResult;
}

/** Response shape content scripts send back for action commands. */
export interface ActionResponse {
  ok: boolean;
}

export function isSupportedPlatformUrl(url: string): SupportedPlatform | null {
  try {
    const { hostname } = new URL(url);
    if (hostname === "claude.ai" || hostname.endsWith(".claude.ai")) {
      return "claude";
    }
    return null;
  } catch {
    return null;
  }
}
