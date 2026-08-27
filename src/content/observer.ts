/**
 * DOM Observer
 *
 * Watches the page for changes and triggers a debounced detection cycle.
 * Does not run a full detection pass on every single mutation — that
 * would be wasteful and janky on a busy chat UI.
 */
import { debounce } from "../utils/debounce";

const DEBOUNCE_MS = 400;

export function startObserving(onChange: () => void): () => void {
  const debounced = debounce(onChange, DEBOUNCE_MS);

  const observer = new MutationObserver(() => {
    debounced();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["disabled", "aria-disabled", "aria-label", "class"],
  });

  // Run one detection pass shortly after the page settles.
  debounced();

  return () => observer.disconnect();
}
