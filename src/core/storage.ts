/**
 * Thin wrapper around chrome.storage.local.
 *
 * MVP explicitly uses local storage only — no backend, no database, no
 * cloud sync. See spec sections 43 and 66.
 */
import type { ExtensionSettings, StorageSchema, WatchSession } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const SESSIONS_KEY = "sessions";
const SETTINGS_KEY = "settings";

export async function getSessions(): Promise<WatchSession[]> {
  const result = await chrome.storage.local.get(SESSIONS_KEY);
  return (result[SESSIONS_KEY] as WatchSession[]) ?? [];
}

export async function saveSessions(sessions: WatchSession[]): Promise<void> {
  await chrome.storage.local.set({ [SESSIONS_KEY]: sessions });
}

export async function getSettings(): Promise<ExtensionSettings> {
  const result = await chrome.storage.local.get(SETTINGS_KEY);
  return {
    ...DEFAULT_SETTINGS,
    ...((result[SETTINGS_KEY] as ExtensionSettings) ?? {}),
  };
}

export async function saveSettings(settings: ExtensionSettings): Promise<void> {
  await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
}

export async function getAll(): Promise<StorageSchema> {
  const [sessions, settings] = await Promise.all([getSessions(), getSettings()]);
  return { sessions, settings };
}

export async function upsertSession(session: WatchSession): Promise<WatchSession[]> {
  const sessions = await getSessions();
  const idx = sessions.findIndex((s) => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  await saveSessions(sessions);
  return sessions;
}

export async function removeSessionByTabId(tabId: number): Promise<WatchSession[]> {
  const sessions = await getSessions();
  const next = sessions.filter((s) => s.tabId !== tabId);
  await saveSessions(next);
  return next;
}

export async function getSessionByTabId(tabId: number): Promise<WatchSession | undefined> {
  const sessions = await getSessions();
  return sessions.find((s) => s.tabId === tabId);
}
