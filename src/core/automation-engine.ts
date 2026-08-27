/**
 * Automation Engine
 *
 * Runs in the background service worker. Given a DetectionResult reported
 * by a content script, decides whether RelayCTX should act, and if so,
 * instructs the content script to perform the action. This module never
 * touches the DOM directly.
 *
 * Safety rules enforced here (see spec sections 26, 32, 52):
 *  - Only acts on watched sessions with automationEnabled = true.
 *  - Only acts once confidence + stability thresholds are met.
 *  - Never sends "continue" without first having observed
 *    USAGE_LIMIT_REACHED -> WAITING_FOR_RESET -> a revalidated reset.
 *  - Bounded retries (MAX_RETRIES), never infinite loops.
 */
import {
  SessionState,
  type ActionResponse,
  type DetectionResponse,
  type DetectionResult,
  type ExtensionMessage,
  type WatchSession,
} from "./types";
import {
  MAX_RETRIES,
  RETRY_DELAYS_MS,
  meetsConfidenceThreshold,
  recordAndCheckStability,
} from "./state-machine";
import { getSessionByTabId } from "./storage";
import { updateSession } from "./session-manager";
import { scheduleResumeAlarm } from "../background/alarms";
import { notifyCompleted, notifyError } from "../background/notifications";
import { logger } from "../utils/logger";

const CONTINUE_MESSAGE = "continue";

function sendToTab<T>(tabId: number, message: ExtensionMessage): Promise<T | undefined> {
  return new Promise((resolve) => {
    chrome.tabs.sendMessage(tabId, message, (response: T | undefined) => {
      if (chrome.runtime.lastError) {
        resolve(undefined);
        return;
      }
      resolve(response);
    });
  });
}

async function retryWithBackoff(
  tabId: number,
  attempt: number,
  action: () => Promise<boolean>
): Promise<boolean> {
  if (attempt >= MAX_RETRIES) return false;

  const ok = await action();
  if (ok) return true;

  await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt] ?? 10_000));
  return retryWithBackoff(tabId, attempt + 1, action);
}

/** Entry point called by the background message handler for every
 * STATE_CHANGED report from a content script. */
export async function handleDetection(tabId: number, result: DetectionResult): Promise<void> {
  const session = await getSessionByTabId(tabId);
  if (!session || session.status !== "watching") return;

  await updateSession(tabId, {
    lastDetectedState: result.state,
    lastConfidence: result.confidence,
    lastEvidence: result.evidence,
    lastActivityAt: Date.now(),
    title: result.title ?? session.title,
  });

  if (!session.automationEnabled) return;
  if (!meetsConfidenceThreshold(result)) return;

  const stable = recordAndCheckStability(tabId, result);
  if (!stable) return;

  switch (result.state) {
    case SessionState.OUTPUT_LIMIT_REACHED:
      await handleOutputLimit(tabId, session);
      break;
    case SessionState.USAGE_LIMIT_REACHED:
      await handleUsageLimitDetected(tabId, session, result);
      break;
    case SessionState.WAITING_FOR_RESET:
      await handleWaitingForReset(tabId, session, result);
      break;
    case SessionState.COMPLETED:
      await handleCompletion(tabId, session);
      break;
    default:
      break;
  }
}

async function handleOutputLimit(tabId: number, session: WatchSession): Promise<void> {
  logger.info(`State: OUTPUT_LIMIT_REACHED (tab ${tabId})`);
  await updateSession(tabId, { lastDetectedState: SessionState.RESUMING });

  const succeeded = await retryWithBackoff(tabId, session.retryCount ?? 0, async () => {
    // Revalidate immediately before clicking — the DOM may have changed
    // since the original report was queued.
    const response = await sendToTab<DetectionResponse>(tabId, {
      type: "REQUEST_DETECTION",
      tabId,
    });
    if (response?.result?.state !== SessionState.OUTPUT_LIMIT_REACHED) return false;

    const actionResponse = await sendToTab<ActionResponse>(tabId, {
      type: "CONTINUE_GENERATION_CMD",
    });
    return Boolean(actionResponse?.ok);
  });

  if (succeeded) {
    logger.info(`Continuing generation (tab ${tabId})`);
    await updateSession(tabId, { retryCount: 0, lastError: null });
  } else {
    logger.error(`Continuation control could not be identified (tab ${tabId})`);
    await updateSession(tabId, {
      lastDetectedState: SessionState.ERROR,
      lastError: "Could not click the continuation control after retries.",
    });
    await notifyError(
      tabId,
      "RelayCTX couldn't find or click the continuation control.",
      session.title
    );
  }
}

async function handleUsageLimitDetected(
  tabId: number,
  _session: WatchSession,
  result: DetectionResult
): Promise<void> {
  logger.info(`State: USAGE_LIMIT_REACHED (tab ${tabId})`);

  if (result.resetAt) {
    await scheduleResumeAlarm(tabId, result.resetAt);
    await updateSession(tabId, {
      lastDetectedState: SessionState.WAITING_FOR_RESET,
      nextActionAt: result.resetAt,
    });
  } else {
    // No parseable reset time — fall back to a periodic re-check rather
    // than an indefinite silent wait.
    const fallback = Date.now() + 15 * 60 * 1000;
    await scheduleResumeAlarm(tabId, fallback);
    await updateSession(tabId, {
      lastDetectedState: SessionState.WAITING_FOR_RESET,
      nextActionAt: fallback,
    });
  }
}

async function handleWaitingForReset(
  tabId: number,
  _session: WatchSession,
  result: DetectionResult
): Promise<void> {
  if (result.resetAt) {
    await scheduleResumeAlarm(tabId, result.resetAt);
    await updateSession(tabId, { nextActionAt: result.resetAt });
  }
}

/** Called when a resume alarm fires (see background/index.ts). Revalidates
 * before ever sending "continue". */
export async function attemptScheduledResume(tabId: number): Promise<void> {
  const session = await getSessionByTabId(tabId);
  if (!session || session.status !== "watching" || !session.automationEnabled) return;
  if (session.lastDetectedState !== SessionState.WAITING_FOR_RESET) return;

  logger.info(`Re-checking usage limit before resume (tab ${tabId})`);

  const response = await sendToTab<DetectionResponse>(tabId, {
    type: "REQUEST_DETECTION",
    tabId,
  });
  const result = response?.result;

  if (!result) {
    // Content script unreachable (tab discarded, navigated away, etc).
    // Reschedule a short re-check rather than giving up silently.
    await scheduleResumeAlarm(tabId, Date.now() + 5 * 60 * 1000);
    return;
  }

  const stillLimited =
    result.state === SessionState.USAGE_LIMIT_REACHED ||
    result.state === SessionState.WAITING_FOR_RESET;

  if (stillLimited) {
    const nextCheck = result.resetAt ?? Date.now() + 15 * 60 * 1000;
    await scheduleResumeAlarm(tabId, nextCheck);
    await updateSession(tabId, { nextActionAt: nextCheck });
    return;
  }

  logger.info(`Reset confirmed — resuming (tab ${tabId})`);
  await updateSession(tabId, { lastDetectedState: SessionState.RESUMING, nextActionAt: null });

  const succeeded = await retryWithBackoff(tabId, 0, async () => {
    const actionResponse = await sendToTab<ActionResponse>(tabId, {
      type: "SEND_CONTINUE_CMD",
      message: CONTINUE_MESSAGE,
    });
    return Boolean(actionResponse?.ok);
  });

  if (succeeded) {
    await updateSession(tabId, {
      lastDetectedState: SessionState.GENERATING,
      retryCount: 0,
      lastError: null,
    });
  } else {
    await updateSession(tabId, {
      lastDetectedState: SessionState.ERROR,
      lastError: 'Could not enter/submit "continue" after retries.',
    });
    await notifyError(tabId, 'RelayCTX could not resume the session automatically.', session.title);
  }
}

async function handleCompletion(tabId: number, session: WatchSession): Promise<void> {
  logger.info(`State: COMPLETED (tab ${tabId})`);
  await notifyCompleted(tabId, session.title);
}
