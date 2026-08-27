/**
 * Session Manager
 *
 * Owns the Watch List. Runs in the background service worker. The popup
 * never writes storage directly — it always goes through messages handled
 * here, so there is a single source of truth.
 */
import type { SupportedPlatform, WatchSession } from "./types";
import {
  getSessionByTabId,
  getSessions,
  getSettings,
  removeSessionByTabId,
  saveSessions,
  upsertSession,
} from "./storage";
import { clearStability } from "./state-machine";
import { clearResumeAlarm } from "../background/alarms";
import { logger } from "../utils/logger";

type BroadcastFn = (sessions: WatchSession[]) => void;

let broadcast: BroadcastFn = () => {};

export function onSessionsChanged(fn: BroadcastFn) {
  broadcast = fn;
}

function makeSessionId(tabId: number): string {
  return `session-${tabId}-${Date.now()}`;
}

export async function listSessions(): Promise<WatchSession[]> {
  return getSessions();
}

export async function startWatch(
  tabId: number,
  url: string,
  platform: SupportedPlatform,
  title?: string | null
): Promise<WatchSession> {
  const settings = await getSettings();
  const now = Date.now();

  const existing = await getSessionByTabId(tabId);
  const session: WatchSession = existing
    ? { ...existing, status: "watching", updatedAt: now }
    : {
        id: makeSessionId(tabId),
        tabId,
        url,
        platform,
        status: "watching",
        automationEnabled: settings.defaultAutomationEnabled,
        createdAt: now,
        updatedAt: now,
        title: title ?? null,
        retryCount: 0,
      };

  const sessions = await upsertSession(session);
  broadcast(sessions);
  logger.info(`Tab ${tabId} added to Watch List`);
  return session;
}

export async function stopWatch(tabId: number): Promise<void> {
  clearStability(tabId);
  await clearResumeAlarm(tabId);
  const sessions = await removeSessionByTabId(tabId);
  broadcast(sessions);
  logger.info(`Tab ${tabId} removed from Watch List (automation disabled)`);
}

export async function markTabClosed(tabId: number): Promise<void> {
  const session = await getSessionByTabId(tabId);
  if (!session) return;
  clearStability(tabId);
  await clearResumeAlarm(tabId);
  session.status = "tab_closed";
  session.updatedAt = Date.now();
  const sessions = await upsertSession(session);
  broadcast(sessions);
  logger.info(`Tab ${tabId} closed; monitoring stopped`);
}

export async function markTabNavigatedAway(tabId: number, url: string): Promise<void> {
  const session = await getSessionByTabId(tabId);
  if (!session) return;
  session.status = "paused";
  session.url = url;
  session.updatedAt = Date.now();
  const sessions = await upsertSession(session);
  broadcast(sessions);
}

export async function markTabReturned(
  tabId: number,
  url: string,
  title?: string | null
): Promise<void> {
  const session = await getSessionByTabId(tabId);
  if (!session) return;
  if (session.status !== "paused") return;
  session.status = "watching";
  session.url = url;
  if (title) session.title = title;
  session.updatedAt = Date.now();
  const sessions = await upsertSession(session);
  broadcast(sessions);
}

export async function updateSession(
  tabId: number,
  patch: Partial<WatchSession>
): Promise<WatchSession | undefined> {
  const session = await getSessionByTabId(tabId);
  if (!session) return undefined;
  const updated: WatchSession = { ...session, ...patch, updatedAt: Date.now() };
  const sessions = await upsertSession(updated);
  broadcast(sessions);
  return updated;
}

export async function pruneClosedTabs(openTabIds: Set<number>): Promise<void> {
  const sessions = await getSessions();
  let changed = false;
  for (const s of sessions) {
    if (!openTabIds.has(s.tabId) && s.status !== "tab_closed") {
      s.status = "tab_closed";
      s.updatedAt = Date.now();
      changed = true;
    }
  }
  if (changed) {
    await saveSessions(sessions);
    broadcast(sessions);
  }
}
