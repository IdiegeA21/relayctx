/**
 * Background Service Worker
 *
 * Responsible for: extension lifecycle, Watch List orchestration, tab
 * lifecycle, alarms, reset timers, notifications, and coordinating with
 * content scripts. Deliberately contains no platform-specific DOM
 * knowledge — that all lives in src/platforms/.
 */
import { isSupportedPlatformUrl, type ExtensionMessage, type WatchSession } from "../core/types";
import {
  listSessions,
  onSessionsChanged,
  startWatch,
  stopWatch,
  updateSession,
} from "../core/session-manager";
import { getSettings, saveSettings } from "../core/storage";
import { handleDetection, attemptScheduledResume } from "../core/automation-engine";
import { tabIdFromAlarmName } from "./alarms";
import { wireTabMonitor } from "./tab-monitor";
import { wireNotificationClicks } from "./notifications";
import { logger } from "../utils/logger";

logger.info("Service worker starting");

wireTabMonitor();
wireNotificationClicks();

function broadcastSessions(sessions: WatchSession[]) {
  chrome.runtime.sendMessage({ type: "SESSIONS_UPDATED", sessions } satisfies ExtensionMessage).catch(() => {
    // No popup listening — expected when the popup is closed.
  });
}
onSessionsChanged(broadcastSessions);

chrome.runtime.onMessage.addListener((message: ExtensionMessage, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse);
  return true; // keep the message channel open for the async response
});

async function handleMessage(
  message: ExtensionMessage,
  sender: chrome.runtime.MessageSender
): Promise<unknown> {
  switch (message.type) {
    case "GET_SESSIONS": {
      const sessions = await listSessions();
      return { type: "GET_SESSIONS_RESULT", sessions };
    }

    case "GET_CURRENT_TAB_INFO": {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || tab.id === undefined || !tab.url) {
        return {
          type: "CURRENT_TAB_INFO_RESULT",
          tabId: null,
          url: null,
          title: null,
          platform: null,
          alreadyWatched: false,
        };
      }
      const platform = isSupportedPlatformUrl(tab.url);
      const sessions = await listSessions();
      const alreadyWatched = sessions.some(
        (s) => s.tabId === tab.id && s.status !== "tab_closed"
      );
      return {
        type: "CURRENT_TAB_INFO_RESULT",
        tabId: tab.id,
        url: tab.url,
        title: tab.title ?? null,
        platform,
        alreadyWatched,
      };
    }

    case "START_WATCH": {
      const platform = isSupportedPlatformUrl(message.url);
      if (!platform) {
        logger.warn(`Refusing to watch unsupported URL for tab ${message.tabId}`);
        return { ok: false };
      }
      await startWatch(message.tabId, message.url, platform, message.title);
      // Ask the content script to run an immediate detection pass so the
      // popup doesn't show "Unknown" until the next mutation.
      chrome.tabs.sendMessage(message.tabId, { type: "REQUEST_DETECTION", tabId: message.tabId }, (response) => {
        if (chrome.runtime.lastError) return;
        if (response?.result) {
          void handleDetection(message.tabId, response.result);
        }
      });
      return { ok: true };
    }

    case "STOP_WATCH": {
      await stopWatch(message.tabId);
      return { ok: true };
    }

    case "STATE_CHANGED": {
      const tabId = sender.tab?.id ?? message.tabId;
      await handleDetection(tabId, message.result);
      return { ok: true };
    }

    case "GET_SETTINGS": {
      const settings = await getSettings();
      return { type: "GET_SETTINGS_RESULT", settings };
    }

    case "SET_SETTINGS": {
      await saveSettings(message.settings);
      return { ok: true };
    }

    case "SET_AUTOMATION_ENABLED": {
      await updateSession(message.tabId, { automationEnabled: message.enabled });
      return { ok: true };
    }

    default:
      return undefined;
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  const tabId = tabIdFromAlarmName(alarm.name);
  if (tabId === null) return;
  void attemptScheduledResume(tabId);
});
