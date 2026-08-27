/**
 * Notifications
 *
 * Thin wrapper over chrome.notifications. Clicking a notification focuses
 * the relevant tab. Never includes conversation content — title only.
 */
import { getSettings } from "../core/storage";

const notificationTabMap = new Map<string, number>();

export async function notifyCompleted(tabId: number, title?: string | null): Promise<void> {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const id = `relayctx-complete-${tabId}-${Date.now()}`;
  notificationTabMap.set(id, tabId);

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "RelayCTX",
    message: title
      ? `Claude session appears complete.\n"${title}"`
      : "Claude session appears complete.",
    priority: 1,
  });
}

export async function notifyError(tabId: number, message: string, title?: string | null): Promise<void> {
  const settings = await getSettings();
  if (!settings.notificationsEnabled) return;

  const id = `relayctx-error-${tabId}-${Date.now()}`;
  notificationTabMap.set(id, tabId);

  chrome.notifications.create(id, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "RelayCTX — Automation paused",
    message: title ? `${message}\n"${title}"` : message,
    priority: 1,
  });
}

export function wireNotificationClicks(): void {
  chrome.notifications.onClicked.addListener((id) => {
    const tabId = notificationTabMap.get(id);
    if (tabId === undefined) return;
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || !tab) return;
      chrome.tabs.update(tabId, { active: true });
      if (tab.windowId !== undefined) {
        chrome.windows.update(tab.windowId, { focused: true });
      }
    });
    chrome.notifications.clear(id);
    notificationTabMap.delete(id);
  });
}
