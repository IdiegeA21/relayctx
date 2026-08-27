# RelayCTX — Build Progress

Tracking against the phased development order in `PRODUCT_SPEC.md`
(section 71). This is the state of the **first working version**.

## ✅ Done

- **Phase 1 — Extension Skeleton**: Manifest V3, React + TypeScript +
  Vite popup, background service worker, content script, Chrome
  messaging wired end to end.
- **Phase 2 — Watch List**: current-tab detection, Add/Remove/Stop,
  `chrome.storage.local` persistence, multiple simultaneous watched
  tabs, tab-closed and navigated-away handling, popup close/reopen
  preserves state.
- **Phase 3 — Claude Detection**: `claude.detector.ts` reads DOM signals
  (accessibility attributes → visible text → structural fallbacks, never
  exact button text alone) into a structured `DetectionResult` with a
  confidence score and evidence list.
- **Phase 4 — Output Continuation**: implemented and gated — requires a
  confidence threshold *and* two consecutive matching detections before
  RelayCTX revalidates and clicks the continuation control, with a
  bounded 3-attempt retry/backoff.
- **Phase 5 — Usage Limit Detection**: `claude.parser.ts` parses visible
  reset text ("available again in 2 hours", "try again at 4:30 PM") into
  an absolute timestamp; falls back to a 15-minute recheck if no time can
  be parsed.
- **Phase 6 — Automatic Resume**: uses `chrome.alarms` (survives service
  worker suspension / browser sleep) rather than `setTimeout`. On firing,
  re-verifies the limit has actually cleared *before* ever typing or
  submitting `continue` — never a blind timer-triggered send.
- **Phase 7 — Completion**: conservative multi-signal completion
  detection + `chrome.notifications`, click-to-focus the tab.
- **Safety rails required throughout**: automation only on watched tabs,
  automation-enabled toggle per session, bounded retries (never
  infinite), no blind clicks on unidentified controls, no conversation
  content ever leaves the tab / gets logged.

## 🚧 Not yet done — Phase 8 (Reliability)

This is real-DOM, real-Claude-UI testing that can only happen against
the live product, which is why the spec puts it last and treats it as
its own phase:

- Verifying selectors against the *current* production Claude UI (the
  detector's phrase lists and structural fallbacks are informed guesses
  documented in `claude.selectors.ts` — they need a pass against the
  real DOM).
- Popup-closed / browser-minimized / inactive-tab behavior under real
  conditions.
- Multiple watched tabs running concurrently for real.
- Page refresh, tab navigation, browser restart, extension reload,
  service-worker suspension — the code paths exist (`tab-monitor.ts`,
  alarm-based resume) but need real-world confirmation.
- Tuning the confidence/stability thresholds in
  `src/core/state-machine.ts` once real false-positive/negative rates
  are visible.

## Explicitly out of scope for this version

Backend, database, accounts, payments, email/SMS, cloud sync, analytics,
AI/LLM API calls — all per spec section 9. Nothing here should be added
until Phase 8 has been run against the real product.

## Suggested next session

1. Load `dist/` as an unpacked extension and add a real Claude tab to the
   Watch List.
2. Open the browser console for that tab and watch the `[RelayCTX]` logs
   as you trigger an output-limit response, to see what the detector
   actually reports.
3. Adjust `claude.selectors.ts` phrase lists / `claude.detector.ts`
   structural checks based on what you see — that's the one file+one
   file pairing meant to absorb Claude UI changes without touching
   anything else.
