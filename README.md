# RelayCTX

**Keep your AI sessions moving.**

RelayCTX is a Chrome extension (Manifest V3) that watches Claude conversation
tabs you explicitly add to its Watch List, and — when safe and possible —
keeps them going past output-length limits and usage/session resets,
without you having to babysit the tab.

This is the **first working version** (MVP), built local-first with no
backend, no accounts, and no AI/LLM calls of its own. See
[`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) for the full product spec this was
built from, and [`PROGRESS.md`](./PROGRESS.md) for exactly what's
implemented vs. what's next.

## The one rule that matters

**Nothing is ever automated on a tab you haven't explicitly added to the
Watch List.** Installing the extension does nothing by itself. Opening
Claude does nothing by itself. Only clicking **"+ Add to Watch List"**
turns monitoring on for that specific tab, and **Stop** turns it back off
— immediately, including cancelling any pending resume timers.

## What it does

- You open a Claude conversation and click **+ Add to Watch List**.
- RelayCTX watches that tab (and any others you add) for:
  - **Output-length limits** — when a "Continue" / "Resume" / "Generate
    more" control appears, it verifies, clicks it, and confirms
    generation resumed.
  - **Usage/session limits** — when Claude says you've hit a temporary
    limit, RelayCTX parses the reset time if one is shown, waits (using a
    resilient alarm, not a fragile in-memory timer), re-verifies the
    limit has actually cleared, and only then types and submits
    `continue`.
  - **Completion** — once nothing needs continuing, it shows "Task
    appears complete" and sends a browser notification you can click to
    jump back to the tab.
- You can flip **Auto continue** off per session, or hit **Stop** to fully
  stop watching a tab at any time.

## What it deliberately does *not* do (yet)

No backend, no database, no accounts, no payments, no email/SMS, no cloud
sync, no AI API calls, no analytics, and no automation on any tab that
wasn't explicitly added. Conversation content is never read into
storage or sent anywhere — RelayCTX only inspects the DOM locally, in the
tab's own browser context, to determine session state.

## Design

The popup is a glassmorphism UI: frosted, translucent panels floating over
a soft gradient-mesh background, with a three-font system chosen for
actual legibility at popup scale rather than defaulting to the browser
stack:

- **Space Grotesk** — brand wordmark and card/section titles
- **Inter** — body copy, buttons, everything conversational
- **JetBrains Mono** — state labels, URLs, countdowns, anything "data"

All three are self-hosted (`@fontsource`, WOFF2/Latin-only — see
`src/popup/fonts.css`), so the popup never depends on network access to
render correctly, and the extension stays lean (~600KB total).

Each watched session keeps the "signal lamp" motif from v1: a glowing
left-edge rail whose color and motion encode state (amber pulsing while
generating, teal while waiting, red on error, green on completion).

## Multi-platform readiness

`SupportedPlatform` already covers Claude, ChatGPT, Codex, and Gemini.
Claude has a fully working adapter; the other three are registered with
**real domain matching** (so a user can already add one of those tabs to
the Watch List and see it listed) but **stubbed detection** — see
`src/platforms/stub-adapter.ts` for exactly what a real implementation
needs to replace, following the Claude adapter as the template. The popup
clearly marks these as "detection coming soon" and disables the
auto-continue toggle for them, so nothing is ever automated on an
unverified platform.

## Project structure

```
relayctx/
├── manifest.json              Manifest V3 config (copied into dist/ at build time)
├── popup.html                 Popup entry (built by Vite)
├── src/
│   ├── background/            Service worker: Watch List orchestration, alarms, notifications
│   ├── content/                Content script: DOM observation + safe, gated actions
│   ├── platforms/
│   │   ├── platform.interface.ts   Generic adapter contract
│   │   ├── stub-adapter.ts     Factory for unimplemented-platform stubs
│   │   ├── registry.ts         Registers all adapters (Claude + 3 stubs)
│   │   ├── claude/             Fully implemented — all Claude DOM knowledge
│   │   ├── chatgpt/            Stub — real domain match, no detection yet
│   │   ├── codex/              Stub — real domain match, no detection yet
│   │   └── gemini/             Stub — real domain match, no detection yet
│   ├── core/                   Platform-agnostic types, storage, state machine, automation engine
│   ├── popup/                  React popup UI (glassmorphism design, see below)
│   └── utils/
├── scripts/
│   ├── build-extension.mjs     Bundles background/content with esbuild, copies manifest + icons
│   └── generate-icons.mjs      Generates the icon set (no external assets)
└── public/icons/                Generated PNG icons
```

The architecture keeps a hard line between the **generic engine** (Watch
List, state machine, retry/confidence gating, alarms) and the **Claude
adapter** (selectors, DOM parsing, click/type actions) — see
`src/platforms/platform.interface.ts`. Adding Codex/ChatGPT/Gemini later
means writing a new adapter, not touching the engine.

## Building

Requires Node 20+.

```bash
npm install
npm run build
```

This runs `tsc -b` (type-check), `vite build` (popup), and
`scripts/build-extension.mjs` (bundles the background service worker and
content script with esbuild, copies `manifest.json` and the generated
icons). Output lands in `dist/` — that's the folder you load into Chrome.

Regenerate icons with `npm run icons` if you want to tweak
`scripts/generate-icons.mjs`.

## Loading it in Chrome

1. `npm install && npm run build`
2. Open `chrome://extensions`
3. Turn on **Developer mode** (top right)
4. Click **Load unpacked**
5. Select the `dist/` folder
6. Open a `claude.ai` conversation, click the RelayCTX toolbar icon, then
   **+ Add to Watch List**

## Development

```bash
npm run dev
```

Runs the Vite dev server for the **popup only** (background/content
scripts aren't hot-reloaded this way — after editing them, re-run
`npm run build` and click the reload icon for RelayCTX on
`chrome://extensions`).

## Notes on the Claude adapter

`src/platforms/claude/claude.selectors.ts` documents the exact signal
priority used to detect state (accessibility attributes → visible text →
structural fallbacks) and is the single place to update if Claude's UI
changes — see the comments there and in `claude.detector.ts` before
editing anything else. Detection is intentionally conservative: it
requires a minimum confidence score *and* several consecutive matching
reads (see `src/core/state-machine.ts`) before RelayCTX will act, and
every automated action is bounded to 3 retries with backoff — never an
infinite loop, never a blind click on an unidentified button.
