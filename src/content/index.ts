/**
 * Content Script Entry
 *
 * Runs on every claude.ai page (per manifest.json), but stays completely
 * passive until the tab is explicitly added to the Watch List — this file
 * only sets up detection reporting and command handling; it never decides
 * on its own to click or type anything.
 */
import { adapterForUrl } from "../platforms/registry";
import { startObserving } from "./observer";
import { reportStateChange, wireCommandListener } from "./bridge";
import { logger } from "../utils/logger";

function init() {
  const adapter = adapterForUrl(location.href);
  if (!adapter) return;

  logger.info(`Platform detected: ${adapter.platform}`);

  // A content script doesn't know its own tab ID; the background script
  // fills it in from the message sender, so we can pass a placeholder.
  const PLACEHOLDER_TAB_ID = -1;

  wireCommandListener(adapter);
  startObserving(reportStateChange(PLACEHOLDER_TAB_ID, adapter));
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
