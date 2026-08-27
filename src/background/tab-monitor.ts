/**
 * Tab Monitor
 *
 * Wires chrome.tabs lifecycle events to the session manager. Handles the
 * "tab closed" and "navigated away from a supported platform" cases (see
 * spec sections 40–41).
 */
import { isSupportedPlatformUrl } from "../core/types";
import {
  markTabClosed,
  markTabNavigatedAway,
  markTabReturned,
  pruneClosedTabs,
} from "../core/session-manager";
import { getSessions } from "../core/storage";
import { logger } from "../utils/logger";

export function wireTabMonitor(): void {
  chrome.tabs.onRemoved.addListener((tabId) => {
    void markTabClosed(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!changeInfo.url) return;
    void handleUrlChange(tabId, changeInfo.url, tab.title ?? null);
  });

  // Catch tabs that were closed while the service worker was asleep.
  chrome.runtime.onStartup?.addListener(() => {
    void reconcileOpenTabs();
  });
  void reconcileOpenTabs();
}

async function handleUrlChange(tabId: number, url: string, title: string | null): Promise<void> {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.tabId === tabId);
  if (!session) return;

  const platform = isSupportedPlatformUrl(url);
  if (!platform) {
    logger.info(`Tab ${tabId} navigated away from a supported platform`);
    await markTabNavigatedAway(tabId, url);
    return;
  }

  if (session.status === "paused") {
    await markTabReturned(tabId, url, title);
  }
}

async function reconcileOpenTabs(): Promise<void> {
  chrome.tabs.query({}, (tabs) => {
    const openIds = new Set(tabs.map((t) => t.id).filter((id): id is number => id !== undefined));
    void pruneClosedTabs(openIds);
  });
}
