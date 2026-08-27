/**
 * Alarms
 *
 * Long waits (usage-limit resets) must survive service-worker suspension,
 * browser sleep, and popup close — so we use chrome.alarms rather than
 * setTimeout, and store the absolute resume time on the session itself.
 */
import { logger } from "../utils/logger";

function alarmName(tabId: number): string {
  return `relayctx-resume-${tabId}`;
}

export async function scheduleResumeAlarm(tabId: number, whenEpochMs: number): Promise<void> {
  const name = alarmName(tabId);
  chrome.alarms.create(name, { when: whenEpochMs });
  logger.info(`Scheduled resume alarm for tab ${tabId} at ${new Date(whenEpochMs).toISOString()}`);
}

export async function clearResumeAlarm(tabId: number): Promise<void> {
  await chrome.alarms.clear(alarmName(tabId));
}

export function tabIdFromAlarmName(name: string): number | null {
  const match = name.match(/^relayctx-resume-(\d+)$/);
  if (!match) return null;
  return parseInt(match[1], 10);
}
