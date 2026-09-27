# RelayCTX — Build Progress

Tracking against the phased development order in `PRODUCT_SPEC.md`
(section 71). This is the state of the **first working version**.

## ✅ Done

- **v2 design pass**: glassmorphism UI — frosted glass panels, gradient-
  mesh backdrop, a proper three-font system (Space Grotesk / Inter /
  JetBrains Mono, self-hosted, WOFF2/Latin-only), and bigger, more legible
  type sizes throughout, replacing the flat dark v1 theme.
- **Multi-platform scaffolding**: `SupportedPlatform` now covers Claude,
  ChatGPT, Codex, and Gemini with real domain detection. Three stub
  adapters (`src/platforms/stub-adapter.ts` + one file each under
  `chatgpt/`, `codex/`, `gemini/`) are registered and safely do nothing —
  a user can add one of those tabs today and see it in the Watch List
  with a clear "detection coming soon" status and a disabled auto-continue
  toggle, but nothing is ever automated on them.
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

1. **Turn a stub adapter into a real one.** Pick ChatGPT, Codex, or
   Gemini, follow the checklist at the top of `src/platforms/stub-adapter.ts`,
   and mirror the Claude adapter's file shape (`<platform>.selectors.ts`,
   `.detector.ts`, `.actions.ts`, `.parser.ts`, `.adapter.ts`). Update
   `PLATFORM_IMPLEMENTED` in `src/popup/platform-meta.ts` once it's live
   so the popup stops showing "detection coming soon" for it.
2. Load `dist/` as an unpacked extension and add a real Claude tab to the
   Watch List.
3. Open the browser console for that tab and watch the `[RelayCTX]` logs
   as you trigger an output-limit response, to see what the detector
   actually reports.
4. Adjust `claude.selectors.ts` phrase lists / `claude.detector.ts`
   structural checks based on what you see — that's the one file+one
   file pairing meant to absorb Claude UI changes without touching
   anything else.
