/**
 * Claude Actions
 *
 * The only module allowed to perform automated interaction with the
 * Claude DOM (clicking, typing, submitting). Every action here must be
 * preceded by a detection pass with sufficient confidence — this module
 * does not itself decide *when* to act; the automation engine does.
 */
import { logger } from "../../utils/logger";
import {
  COMPOSER_SELECTORS,
  CONTINUATION_PHRASES,
  INTERACTIVE_SELECTOR,
  matchesAnyPhrase,
  textOf,
} from "./claude.selectors";

export function findContinuationControl(): HTMLElement | null {
  const candidates = document.querySelectorAll<HTMLElement>(INTERACTIVE_SELECTOR);
  for (const el of Array.from(candidates)) {
    const text = textOf(el);
    if (!text) continue;
    if (!matchesAnyPhrase(text, CONTINUATION_PHRASES)) continue;

    const isDisabled =
      el.getAttribute("aria-disabled") === "true" ||
      el.hasAttribute("disabled") ||
      (el as HTMLButtonElement).disabled === true;
    if (isDisabled) continue;

    return el;
  }
  return null;
}

export async function clickContinuationControl(): Promise<boolean> {
  const control = findContinuationControl();
  if (!control) {
    logger.warn("Continuation control could not be identified");
    return false;
  }
  control.click();
  logger.info("Clicked continuation control");
  return true;
}

export function findMessageInput(): HTMLElement | null {
  for (const selector of COMPOSER_SELECTORS) {
    const el = document.querySelector<HTMLElement>(selector);
    if (el) return el;
  }
  return null;
}

/**
 * Type a message into the composer using the normal user-visible input
 * mechanism, then verify the value actually changed before returning.
 */
function setComposerValue(el: HTMLElement, message: string): boolean {
  if (el instanceof HTMLTextAreaElement || el instanceof HTMLInputElement) {
    const nativeSetter = Object.getOwnPropertyDescriptor(
      el instanceof HTMLTextAreaElement
        ? window.HTMLTextAreaElement.prototype
        : window.HTMLInputElement.prototype,
      "value"
    )?.set;
    nativeSetter?.call(el, message);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    return el.value === message;
  }

  if (el.getAttribute("contenteditable") === "true") {
    el.focus();
    el.textContent = message;
    el.dispatchEvent(new InputEvent("input", { bubbles: true }));
    return (el.textContent ?? "").includes(message);
  }

  return false;
}

/** Locate a submit control near the composer (button, not blind Enter). */
function findSubmitControl(composer: HTMLElement): HTMLElement | null {
  const form = composer.closest("form");
  const scope: ParentNode = form ?? document;
  const buttons = scope.querySelectorAll<HTMLElement>('button, [role="button"]');

  for (const btn of Array.from(buttons)) {
    const text = textOf(btn);
    if (/send|submit/.test(text)) {
      const isDisabled =
        btn.getAttribute("aria-disabled") === "true" ||
        (btn as HTMLButtonElement).disabled === true;
      if (!isDisabled) return btn;
    }
  }
  return null;
}

export async function sendContinuationMessage(message: string): Promise<boolean> {
  const composer = findMessageInput();
  if (!composer) {
    logger.warn("Message composer could not be identified");
    return false;
  }

  const valueSet = setComposerValue(composer, message);
  if (!valueSet) {
    logger.warn("Composer value did not change after write attempt");
    return false;
  }

  // Prefer the platform's normal submit button; fall back to Enter only
  // if no button-based mechanism can be found.
  const submitControl = findSubmitControl(composer);
  if (submitControl) {
    submitControl.click();
    logger.info("Submitted continuation message via submit control");
    return true;
  }

  composer.dispatchEvent(
    new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true })
  );
  logger.info("Submitted continuation message via Enter key fallback");
  return true;
}
