/**
 * Bridge
 *
 * Handles chrome.runtime messaging on the content-script side. Reports
 * detected state to the background service worker and responds to
 * commands (detect / continue / send-continue) issued by the automation
 * engine.
 */
import type { ExtensionMessage } from "../core/types";
import type { PlatformAdapter } from "../platforms/platform.interface";
import { logger } from "../utils/logger";

export function reportStateChange(tabId: number, adapter: PlatformAdapter) {
  return async () => {
    try {
      const result = await adapter.detectState();
      const message: ExtensionMessage = { type: "STATE_CHANGED", tabId, result };
      chrome.runtime.sendMessage(message).catch(() => {
        // Background may not be ready yet; safe to ignore.
      });
    } catch (err) {
      logger.error("Detection cycle failed", err);
    }
  };
}

export function wireCommandListener(adapter: PlatformAdapter) {
  chrome.runtime.onMessage.addListener(
    (message: ExtensionMessage, _sender, sendResponse) => {
      handleCommand(message, adapter).then(sendResponse);
      return true;
    }
  );
}

async function handleCommand(message: ExtensionMessage, adapter: PlatformAdapter): Promise<unknown> {
  switch (message.type) {
    case "PING_CONTENT":
      return { type: "PONG_CONTENT", platform: adapter.platform };

    case "REQUEST_DETECTION": {
      const result = await adapter.detectState();
      return { result };
    }

    case "CONTINUE_GENERATION_CMD": {
      const ok = await adapter.continueGeneration();
      return { ok };
    }

    case "SEND_CONTINUE_CMD": {
      const ok = await adapter.sendContinuationMessage(message.message);
      return { ok };
    }

    default:
      return undefined;
  }
}
