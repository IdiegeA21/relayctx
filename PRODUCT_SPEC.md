# RelayCTX

## AI Session & Context Continuity Extension

**Product name:** RelayCTX
**Pronunciation:** Relay C-T-X
**Meaning:** Relay Context
**Tagline:** Keep your AI sessions moving.

**Product category:** Browser extension / AI productivity tool

**Initial target:** Claude web application

**Future targets:** Codex, ChatGPT, Gemini and other browser-based AI development environments

**Initial architecture:** Browser-only, local-first

**AI requirement:** None

**Backend requirement for MVP:** None

**Primary technology:** TypeScript + React + Vite + Chrome Extension Manifest V3

---

# 1. Product Vision

RelayCTX is a browser extension designed to provide **continuity for long-running AI sessions**.

The initial product solves a simple but frustrating problem:

> A user gives an AI assistant a long-running task, leaves it working, and the AI eventually stops because it has reached an output limit, context/session boundary, or temporary usage limit.

Normally, the user has to return to the browser and manually continue the conversation.

RelayCTX automates that process for explicitly monitored tabs.

The user tells RelayCTX:

> **"Watch this tab."**

RelayCTX then monitors that specific AI session and, when safe and possible:

* detects when generation stops because of an output limit,
* automatically continues the generation,
* detects temporary usage/session exhaustion,
* waits for the appropriate reset period,
* resumes the session,
* enters `continue` when required,
* submits the continuation,
* continues monitoring,
* and notifies the user when the session reaches a stable completed state.

---

# 2. The Core Product Concept

RelayCTX is fundamentally a **session continuity layer**.

The initial implementation happens entirely inside the user's browser.

The user already has:

* their Claude account,
* their authenticated session,
* their conversation,
* their task,
* their browser.

RelayCTX does not need to reproduce any of those things.

It simply watches an explicitly authorized tab.

The fundamental flow is:

```text
USER
  │
  │ adds tab to Watch List
  ▼
RELAYCTX
  │
  │ monitors session
  ▼
AI SESSION
  │
  ├── generating
  │
  ├── output limit
  │       ↓
  │   automatically continue
  │
  ├── usage/session limit
  │       ↓
  │   wait for reset
  │       ↓
  │   automatically continue
  │
  └── stable completion
          ↓
       notify user
```

---

# 3. Most Important Product Rule

## Nothing happens until the user explicitly watches a tab.

Installing RelayCTX must NOT automatically monitor websites.

Opening Claude must NOT automatically activate automation.

Navigating to a supported website must NOT automatically activate automation.

Only this action activates RelayCTX:

```text
Add Current Tab to Watch List
```

Once a tab is added:

```text
WATCHED TAB
     ↓
MONITORING ACTIVE
     ↓
AUTOMATION PERMITTED
```

If a tab is removed from the Watch List:

```text
WATCHING
    ↓
STOPPED
    ↓
NO MORE AUTOMATION
```

This explicit opt-in model is fundamental to both safety and user trust.

---

# 4. Product Positioning

RelayCTX should NOT be positioned as:

> An AI agent.

It should NOT be positioned as:

> A Claude bot.

It should NOT be positioned as:

> A token manager.

It should NOT be positioned as:

> An AI that does your work.

Instead:

> **RelayCTX keeps AI sessions moving when they would otherwise stop.**

The product is an automation and continuity layer.

---

# 5. Why "CTX"

CTX is commonly understood by developers as shorthand for:

```text
Context
```

Therefore:

```text
RelayCTX
```

communicates:

```text
Relay + Context
```

This naming is intentionally broader than:

```text
ClaudeContinuer
TokenResumer
AutoContinue
SessionBot
```

because the long-term product may eventually work with:

* context boundaries,
* session boundaries,
* model handoffs,
* agent handoffs,
* conversation continuation,
* workflow continuity,
* cross-model continuation.

---

# 6. Long-Term Product Vision

The MVP is only the beginning.

Today:

```text
Claude
   ↓
RelayCTX
   ↓
Continue
```

Potential future:

```text
Claude
   ↓
RelayCTX
   ↓
Context boundary
   ↓
New session
   ↓
Continue
```

Further future:

```text
Agent A
   ↓
RelayCTX
   ↓
Context/state handoff
   ↓
Agent B
```

Potentially:

```text
Claude
      \
       \
Codex ---- RelayCTX ---- Gemini
       /
      /
ChatGPT
```

RelayCTX can eventually become a platform for **persistent AI workflows**, rather than merely a browser extension.

The architecture should therefore avoid unnecessary assumptions that the product will always be Claude-specific.

---

# 7. MVP Scope

The MVP should initially support:

## Platform

Claude web application.

## Browser

Chromium-based browsers supporting Manifest V3.

Initial development target:

* Google Chrome

Potentially compatible later:

* Microsoft Edge
* Brave
* Arc-based Chromium environments
* other Chromium browsers

---

# 8. MVP Required Features

The MVP must support:

* Chrome extension
* React popup
* TypeScript
* Manifest V3
* Current tab detection
* Add current tab to Watch List
* Remove watched tab
* Persistent Watch List
* Multiple watched tabs
* Claude platform detection
* Claude state monitoring
* Output-length continuation detection
* Automatic output continuation
* Usage/session exhaustion detection
* Reset/waiting-state detection
* Reset countdown where possible
* Automatic resume after reset
* Automatic `continue` message submission where required
* Conservative completion detection
* Browser notifications
* Safe failure
* Stop automation at any time

---

# 9. Explicitly Out of MVP Scope

Do NOT build:

* AI APIs
* Anthropic API integration
* OpenAI API integration
* LLM inference
* AI-powered DOM interpretation
* backend
* database
* authentication
* user accounts
* payments
* subscriptions
* SMS
* email
* cloud synchronization
* analytics
* multi-user functionality

These can be future features.

---

# 10. Core User Journey

## Step 1

User opens Claude.

Example:

```text
https://claude.ai/chat/xxxxxxxx
```

RelayCTX is installed but inactive.

---

## Step 2

User opens RelayCTX.

Popup:

```text
RELAYCTX

CURRENT TAB

Claude

[ + Add to Watch List ]

WATCH LIST

No active sessions
```

---

## Step 3

User clicks:

```text
+ Add to Watch List
```

RelayCTX:

1. obtains tab ID,
2. obtains tab URL,
3. determines supported platform,
4. creates a watch session,
5. stores the session,
6. starts monitoring,
7. activates the platform-specific content script.

---

# 11. Watch Session

Use a structure similar to:

```typescript
interface WatchSession {
  id: string;
  tabId: number;
  url: string;
  platform: SupportedPlatform;

  status: SessionStatus;

  automationEnabled: boolean;

  createdAt: number;
  updatedAt: number;

  lastDetectedState?: SessionState;

  nextActionAt?: number;

  lastActivityAt?: number;

  retryCount?: number;
}
```

The exact schema can evolve.

---

# 12. Watch List UI

Example:

```text
┌────────────────────────────────────┐
│ RelayCTX                           │
│ Keep your AI sessions moving.      │
│                                    │
│ CURRENT TAB                        │
│                                    │
│ Claude                             │
│ claude.ai/chat/...                 │
│                                    │
│ [ + Add to Watch List ]            │
│                                    │
├────────────────────────────────────┤
│ WATCH LIST                         │
│                                    │
│ Claude                             │
│ Refactoring authentication         │
│                                    │
│ ● Generating                       │
│                                    │
│ [ Open ]              [ Stop ]     │
└────────────────────────────────────┘
```

---

# 13. Session Card

Each watched session should have a compact card.

Generating:

```text
Claude
Refactoring authentication

● Generating

Auto Continue    ON

[Open Tab] [Stop]
```

Waiting:

```text
Claude
Building dashboard

⏳ Waiting for reset

42:17 remaining

[Open Tab] [Stop]
```

Resuming:

```text
Claude
Building dashboard

↻ Resuming...
```

Completed:

```text
Claude
Building dashboard

✓ Task appears complete

[Open Tab] [Stop]
```

Error:

```text
Claude
Building dashboard

! Automation paused

Claude UI could not be interpreted.

[Open Tab] [Stop]
```

---

# 14. Session States

Use explicit states.

```typescript
enum SessionState {
  UNKNOWN = "UNKNOWN",

  GENERATING = "GENERATING",

  OUTPUT_LIMIT_REACHED = "OUTPUT_LIMIT_REACHED",

  WAITING_FOR_CONTINUE = "WAITING_FOR_CONTINUE",

  USAGE_LIMIT_REACHED = "USAGE_LIMIT_REACHED",

  WAITING_FOR_RESET = "WAITING_FOR_RESET",

  RESUMING = "RESUMING",

  COMPLETED = "COMPLETED",

  ERROR = "ERROR",

  STOPPED = "STOPPED"
}
```

Do not simplify this to:

```typescript
isRunning: boolean
```

because RelayCTX needs to distinguish multiple interruption mechanisms.

---

# 15. Two Major Interruption Types

RelayCTX must explicitly distinguish between:

## A. Output/message-length exhaustion

and:

## B. Usage/session exhaustion.

They are NOT the same event.

---

# 16. Output-Length Exhaustion

Typical flow:

```text
GENERATING
     ↓
AI reaches output maximum
     ↓
OUTPUT_LIMIT_REACHED
     ↓
continuation control appears
     ↓
RelayCTX detects control
     ↓
RelayCTX safely clicks it
     ↓
RESUMING
     ↓
GENERATING
```

Usually there is no waiting period.

---

# 17. Usage/Session Exhaustion

Typical flow:

```text
GENERATING
     ↓
usage/session limit reached
     ↓
USAGE_LIMIT_REACHED
     ↓
determine reset time
     ↓
WAITING_FOR_RESET
     ↓
countdown
     ↓
reset becomes available
     ↓
RESUMING
     ↓
enter "continue"
     ↓
submit
     ↓
GENERATING
```

This is the second major automation path.

---

# 18. Platform Adapter Architecture

RelayCTX must be platform-agnostic at the core.

Use:

```text
src/
  platforms/

    claude/
      claude.adapter.ts
      claude.detector.ts
      claude.actions.ts
      claude.selectors.ts
      claude.parser.ts

    codex/
      codex.adapter.ts

    chatgpt/
      chatgpt.adapter.ts
```

Only Claude needs to be implemented for MVP.

---

# 19. Platform Adapter Interface

Create an interface similar to:

```typescript
interface PlatformAdapter {
  platform: SupportedPlatform;

  canHandle(url: string): boolean;

  detectState(): Promise<DetectionResult>;

  detectOutputLimit(): Promise<boolean>;

  detectUsageLimit(): Promise<boolean>;

  detectCompletion(): Promise<boolean>;

  findContinuationControl(): HTMLElement | null;

  continueGeneration(): Promise<boolean>;

  findMessageInput(): HTMLElement | null;

  sendContinuationMessage(message: string): Promise<boolean>;

  detectResetTime(): Promise<number | null>;
}
```

The exact interface may be refined during implementation.

The architectural principle must remain:

> Generic automation logic must not know Claude-specific DOM details.

---

# 20. Claude Adapter

Claude is the initial platform.

The adapter should be responsible for all Claude-specific knowledge.

It should understand:

* Claude conversation UI
* generation state
* output continuation state
* usage limit state
* reset information
* continuation control
* message input
* submission mechanism
* completion indicators

Do not scatter Claude selectors throughout unrelated files.

---

# 21. Do Not Depend on Button Text

The implementation must NOT assume:

```typescript
button.innerText === "Continue"
```

The continuation UI may appear as:

```text
Continue
Resume
Generate more
↑
icon-only button
aria-label
tooltip
```

The detector should inspect multiple signals.

---

# 22. DOM Detection Signals

Inspect:

### Accessibility

```text
aria-label
aria-labelledby
role
title
```

### Visible content

```text
innerText
textContent
```

### Semantic elements

```text
button
[role="button"]
textarea
input
[contenteditable="true"]
```

### UI context

Inspect:

* parent container
* sibling elements
* nearby assistant message
* generation state
* loading indicators
* conversation controls
* disabled/enabled state

---

# 23. MutationObserver

The Claude content script should use a MutationObserver.

Conceptually:

```typescript
const observer = new MutationObserver(() => {
  scheduleStateDetection();
});

observer.observe(document.body, {
  childList: true,
  subtree: true,
  attributes: true
});
```

Do not run a complete expensive detection cycle on every DOM mutation.

Use debounce/throttle logic.

Example:

```text
DOM mutation
     ↓
250–500ms debounce
     ↓
state detection
```

The exact delay should be tested.

---

# 24. Selector Strategy

Prefer semantic selectors.

Priority:

```text
1. aria-label
2. role
3. title
4. stable data attributes
5. semantic DOM relationships
6. CSS selectors
```

Avoid brittle selectors such as:

```css
div:nth-child(4) > div:nth-child(2) > button
```

unless there is no alternative.

Document every important selector.

---

# 25. Detection Confidence

Detection should produce structured results.

```typescript
interface DetectionResult {
  state: SessionState;

  confidence: number;

  evidence: string[];
}
```

Example:

```typescript
{
  state: SessionState.OUTPUT_LIMIT_REACHED,

  confidence: 0.94,

  evidence: [
    "Continuation control detected",
    "Generation indicator no longer active",
    "Control is associated with assistant response"
  ]
}
```

This is useful for debugging and future reliability improvements.

---

# 26. Safety Rule

RelayCTX must never blindly click a generic button.

Potentially dangerous buttons could include:

```text
Continue
Confirm
Submit
Run
Deploy
Approve
Delete
Purchase
Send
```

The automation engine should only activate controls when the platform adapter has enough evidence that the action is specifically a safe generation continuation.

If confidence is insufficient:

```text
UNKNOWN
```

and do nothing.

---

# 27. Output Continuation Algorithm

When:

```text
OUTPUT_LIMIT_REACHED
```

is detected:

```text
1. Find continuation control.
2. Verify control exists.
3. Verify control is enabled.
4. Verify control belongs to generation UI.
5. Verify detection confidence.
6. Click.
7. Enter RESUMING.
8. Verify generation resumed.
9. Enter GENERATING.
10. Continue monitoring.
```

If verification fails, retry a bounded number of times.

Never endlessly click.

---

# 28. Usage Limit Detection

The detector should search for multiple signals.

Potential signals include:

* usage-related messaging
* temporary session exhaustion
* reset/countdown UI
* disabled generation controls
* retry controls
* known Claude limit indicators
* visible future availability time
* modal/dialog indicating temporary unavailability

Do not rely on one exact sentence.

---

# 29. Reset Time

If Claude exposes:

```text
Available again in 2 hours
```

or:

```text
Try again at 4:30 PM
```

RelayCTX should parse the information when reliably possible.

Store an absolute timestamp:

```typescript
nextActionAt: number;
```

Do not store only:

```text
"2 hours"
```

because the browser may:

* sleep,
* restart,
* suspend the service worker,
* close the popup.

Absolute timestamps make the system resilient.

---

# 30. Background Timing

Do not rely on:

```typescript
setTimeout(...)
```

for long periods.

Use the Chrome extension alarm system where appropriate.

Conceptually:

```text
session.nextActionAt
        ↓
Chrome alarm
        ↓
background service worker wakes
        ↓
check session
        ↓
attempt resume
```

The system must continue functioning when the popup is closed.

---

# 31. Automatic Resume

When the reset time has passed:

```text
1. Confirm watched session still exists.
2. Confirm tab still exists.
3. Confirm automation is enabled.
4. Confirm tab still belongs to Claude.
5. Reconnect/activate content script.
6. Re-detect current page state.
7. Confirm usage limit has cleared.
8. Locate message input.
9. Enter:
   
   continue

10. Submit.
11. Verify generation begins.
12. Set state to GENERATING.
```

---

# 32. Never Blindly Send "continue"

The extension must never periodically type:

```text
continue
```

just because a timer expired.

Before submitting:

```text
USAGE_LIMIT_REACHED
```

must have been detected previously.

Then:

```text
WAITING_FOR_RESET
```

must have been established.

Then the reset condition must be revalidated.

Only then:

```text
continue
```

may be sent.

---

# 33. Message Input

Claude may use:

* textarea
* contenteditable
* dynamically rendered input

The adapter must identify the actual active message composer.

Do not assume one fixed selector forever.

After entering the message, verify that the value actually changed before submitting.

---

# 34. Submission

The adapter should identify the appropriate submission action.

It may be:

* button
* keyboard shortcut
* form submission
* Enter key
* another platform-specific mechanism.

For safety, prefer the platform's normal user-visible submission mechanism.

---

# 35. Completion Detection

RelayCTX cannot know with absolute certainty that the user's underlying coding task is complete.

It can only determine that the AI session has reached a stable state where no continuation appears necessary.

Therefore use:

```text
Task appears complete
```

rather than:

```text
Task completed successfully
```

unless there is stronger evidence.

---

# 36. Completion Signals

Possible signals:

* generation stopped
* no continuation control
* no usage limit
* no reset state
* no loading indicator
* normal composer state restored
* assistant response appears finalized
* no known error

Use multiple signals before declaring:

```text
COMPLETED
```

---

# 37. Browser Notifications

MVP notifications should use the browser notification API.

Example:

```text
RelayCTX

Claude session appears complete.

"Refactoring authentication"

[Open conversation]
```

Clicking the notification should open/focus the relevant tab.

---

# 38. Watch List Lifecycle

A session follows:

```text
NOT_WATCHED
      ↓
WATCHING
      ↓
GENERATING
      ↓
OUTPUT_LIMIT_REACHED
      ↓
RESUMING
      ↓
GENERATING
      ↓
USAGE_LIMIT_REACHED
      ↓
WAITING_FOR_RESET
      ↓
RESUMING
      ↓
GENERATING
      ↓
COMPLETED
```

The user can interrupt at any point:

```text
STOPPED
```

---

# 39. Stop Watching

Every watched tab must have:

```text
Stop
```

Stopping must:

* disable automation,
* stop monitoring,
* cancel associated alarms,
* prevent future continuation,
* prevent future automatic messages.

If the session is waiting for a reset, stopping it must also cancel future resume actions.

---

# 40. Tab Closed

If the watched tab is closed:

```text
TAB_CLOSED
```

RelayCTX should stop monitoring.

Do NOT reopen the tab automatically in MVP.

---

# 41. Tab Navigation

If the user adds:

```text
claude.ai/chat/123
```

and later navigates to:

```text
google.com
```

RelayCTX must detect that the watched tab is no longer on the supported platform.

Recommended behavior:

```text
Session paused

This tab is no longer on Claude.

[Stop Watching]
```

Do not automate unrelated pages.

---

# 42. Multiple Sessions

RelayCTX must support multiple watched tabs from the beginning.

Example:

```text
WATCH LIST

Claude — Authentication
● Generating

Claude — Dashboard
⏳ 38:21

Claude — API refactor
● Generating
```

Do not architect around a single global session.

---

# 43. Local Storage

Use:

```text
chrome.storage.local
```

for MVP.

Example:

```typescript
interface StorageSchema {
  sessions: WatchSession[];

  settings: ExtensionSettings;
}
```

Settings:

```typescript
interface ExtensionSettings {
  notificationsEnabled: boolean;

  defaultAutomationEnabled: boolean;
}
```

No database is required.

---

# 44. Recommended Project Structure

```text
relayctx/
│
├── src/
│   │
│   ├── background/
│   │   ├── index.ts
│   │   ├── alarms.ts
│   │   ├── tab-monitor.ts
│   │   └── notifications.ts
│   │
│   ├── content/
│   │   ├── index.ts
│   │   ├── observer.ts
│   │   └── bridge.ts
│   │
│   ├── popup/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── components/
│   │       ├── WatchList.tsx
│   │       ├── WatchSessionCard.tsx
│   │       ├── CurrentTab.tsx
│   │       └── EmptyState.tsx
│   │
│   ├── platforms/
│   │   ├── platform.interface.ts
│   │   │
│   │   └── claude/
│   │       ├── claude.adapter.ts
│   │       ├── claude.detector.ts
│   │       ├── claude.actions.ts
│   │       ├── claude.selectors.ts
│   │       └── claude.parser.ts
│   │
│   ├── core/
│   │   ├── session-manager.ts
│   │   ├── state-machine.ts
│   │   ├── automation-engine.ts
│   │   ├── storage.ts
│   │   └── types.ts
│   │
│   └── utils/
│       ├── debounce.ts
│       ├── logger.ts
│       └── url.ts
│
├── public/
│   └── icons/
│
├── manifest.json
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

The exact implementation can vary, but separation of concerns must be preserved.

---

# 45. Background Service Worker

Responsible for:

* extension lifecycle
* Watch List orchestration
* tab lifecycle
* alarms
* reset timers
* notifications
* state coordination
* communication with content scripts

The service worker should not contain Claude DOM selectors.

---

# 46. Content Script

Responsible for:

* DOM observation
* state detection
* control identification
* safe clicking
* message input
* message submission
* reporting state to the background service worker

It should not own global Watch List state.

---

# 47. Communication Architecture

```text
┌──────────────┐
│ RelayCTX     │
│ Popup        │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Background   │
│ Service      │
│ Worker       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Content      │
│ Script       │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Claude DOM   │
└──────────────┘
```

Use Chrome extension messaging.

---

# 48. Example Message Types

```typescript
type ExtensionMessage =
  | {
      type: "START_WATCH";
      tabId: number;
    }
  | {
      type: "STOP_WATCH";
      tabId: number;
    }
  | {
      type: "GET_STATE";
      tabId: number;
    }
  | {
      type: "STATE_CHANGED";
      tabId: number;
      result: DetectionResult;
    }
  | {
      type: "CONTINUE_GENERATION";
    }
  | {
      type: "SEND_CONTINUE";
    };
```

The exact protocol can evolve.

---

# 49. Permissions

Request only necessary permissions.

Likely MVP permissions:

```text
storage
tabs
alarms
notifications
scripting
```

Host permissions should be restricted to supported domains.

Do NOT automatically request:

```text
<all_urls>
```

unless technically necessary.

---

# 50. Privacy

RelayCTX should be local-first.

The MVP should not transmit conversation contents anywhere.

Do NOT collect:

* Claude conversation history
* prompts
* generated code
* source code
* authentication cookies
* session tokens
* passwords
* personal messages

The extension only inspects enough local DOM information to determine the session state and perform the explicitly authorized continuation.

---

# 51. Security Principle

RelayCTX must never:

* extract credentials,
* bypass authentication,
* steal cookies,
* access session tokens,
* send conversation data externally,
* automate unrelated websites,
* click arbitrary destructive controls.

The Watch List is the explicit authorization boundary.

---

# 52. Retry Policy

Automation must have bounded retries.

Example:

```typescript
const MAX_RETRIES = 3;
```

Possible retry schedule:

```text
Attempt 1
   ↓
1 second

Attempt 2
   ↓
3 seconds

Attempt 3
   ↓
10 seconds
```

If unsuccessful:

```text
ERROR
```

Notify the user.

Never create an infinite retry loop.

---

# 53. Logging

Development logging should be structured.

Example:

```text
[RelayCTX] Tab 123 added to Watch List

[RelayCTX] Platform detected: Claude

[RelayCTX] State: GENERATING

[RelayCTX] State: OUTPUT_LIMIT_REACHED

[RelayCTX] Continuation control detected

[RelayCTX] Continuing generation

[RelayCTX] State: GENERATING
```

Errors:

```text
[RelayCTX][ERROR]
Continuation control could not be identified
```

Do not log conversation content.

---

# 54. Development Phases

The coding agent should implement RelayCTX incrementally.

---

## PHASE 1 — Extension Skeleton

Build:

* Manifest V3
* React
* TypeScript
* Vite
* popup
* service worker
* content script
* basic Chrome messaging

Success:

```text
Extension installs.
Popup opens.
Current tab is displayed.
```

---

# 55. PHASE 2 — Watch List

Implement:

* current tab detection
* Add to Watch List
* Remove from Watch List
* storage
* multiple sessions
* tab ID tracking

Success:

```text
User adds Claude tab.

Popup shows:

● Watching
```

Closing/reopening popup must preserve the session.

---

# 56. PHASE 3 — Claude Detection

Implement Claude adapter.

Initially detect:

```text
GENERATING
OUTPUT_LIMIT_REACHED
WAITING_FOR_CONTINUE
USAGE_LIMIT_REACHED
UNKNOWN
```

Do not automate immediately.

First prove the state detector works.

Development/debug UI may display:

```text
Detected State:
OUTPUT_LIMIT_REACHED

Confidence:
0.94

Evidence:
- continuation control detected
- generation stopped
```

---

# 57. PHASE 4 — Output Continuation

Implement:

```text
OUTPUT_LIMIT_REACHED
        ↓
find continuation
        ↓
validate
        ↓
click
        ↓
verify
        ↓
GENERATING
```

This is the first major automation milestone.

---

# 58. PHASE 5 — Usage Limit Detection

Implement:

```text
USAGE_LIMIT_REACHED
```

and reset-time parsing.

Initially display:

```text
Usage limit reached.

Resume available in:

02:14:32
```

Do not automatically resume until detection is proven reliable.

---

# 59. PHASE 6 — Automatic Resume

Implement:

```text
WAITING_FOR_RESET
        ↓
alarm
        ↓
re-check
        ↓
confirm reset
        ↓
enter "continue"
        ↓
submit
        ↓
verify
        ↓
GENERATING
```

---

# 60. PHASE 7 — Completion

Implement conservative completion detection.

Then browser notification:

```text
RelayCTX

Claude session appears complete.

[Open conversation]
```

---

# 61. PHASE 8 — Reliability

Test:

* popup closed
* browser minimized
* inactive tab
* multiple watched tabs
* page refresh
* tab navigation
* browser restart
* service worker suspension
* extension reload
* Claude UI changes
* missing continuation control
* missing reset time
* manual user interaction
* stopping automation during countdown
* closing watched tab

---

# 62. Important Development Strategy

Do NOT attempt to solve every possible Claude UI variation immediately.

Build a working implementation against the current production UI.

Then structure the implementation so selectors and detection rules can be updated independently.

The goal is:

```text
Claude UI knowledge
        ↓
Claude Adapter
        ↓
Generic RelayCTX Engine
```

Not:

```text
Claude selectors
        ↓
every part of application
```

---

# 63. Future Platform Support

After Claude is reliable:

```text
RelayCTX Platform Registry

ClaudeAdapter
CodexAdapter
ChatGPTAdapter
GeminiAdapter
```

Example:

```typescript
const platforms = [
  new ClaudeAdapter(),
  new CodexAdapter(),
  new ChatGPTAdapter()
];
```

The generic engine should remain unchanged.

---

# 64. Future Email Notifications

Not part of MVP.

Potential future architecture:

```text
RelayCTX Extension
        ↓
RelayCTX Backend
        ↓
Notification Service
        ↓
Email
```

The user could eventually configure:

```text
Notify me when:

☑ Task appears complete
☑ Automation failed
☑ Usage limit detected
☑ Session resumed
```

---

# 65. Future SMS Notifications

Also not MVP.

Potential future flow:

```text
RelayCTX
    ↓
Backend
    ↓
SMS provider
    ↓
User phone
```

Only introduce this once the core product has proven demand.

---

# 66. Future Cloud Synchronization

Eventually:

```text
Browser A
    ↓
RelayCTX Cloud
    ↓
Browser B
```

Could synchronize:

* watched sessions
* preferences
* notification settings
* history

But local-first should remain the MVP architecture.

---

# 67. Future Session History

Potential future feature:

```text
HISTORY

Claude
Authentication refactor

Started:
10:32 AM

Automatic continuations:
4

Usage waits:
2

Completed:
2:47 PM
```

Useful metrics could include:

* total session duration
* automatic continuations
* time spent waiting
* interruptions avoided
* automation failures

---

# 68. Future RelayCTX Platform

The long-term vision should not be limited to browser button automation.

Potential future product:

```text
RelayCTX

AI Session Continuity Platform
```

Capabilities could eventually include:

* context handoff
* session continuation
* model-to-model handoff
* agent-to-agent handoff
* context compression
* context persistence
* workflow resumption
* API-based session continuity
* developer SDK
* enterprise AI workflow persistence

The browser extension is simply the first interface.

---

# 69. Future Product Architecture

Potential long-term architecture:

```text
                       RELAYCTX
                           │
             ┌─────────────┼─────────────┐
             │             │             │
          Browser        Cloud          API
          Extension       Platform       SDK
             │             │             │
             └─────────────┼─────────────┘
                           │
                    Session Engine
                           │
                 ┌─────────┼─────────┐
                 │         │         │
              Claude     Codex    ChatGPT
```

This is why the product name must not be tied to:

* Chrome
* Claude
* tokens
* buttons
* `continue`
* context windows alone.

RelayCTX remains relevant as the product expands.

---

# 70. MVP Success Criteria

RelayCTX MVP is considered successful when:

## Watch List

* [ ] User installs extension.
* [ ] User opens Claude.
* [ ] User adds the current tab.
* [ ] Tab appears in Watch List.
* [ ] Monitoring begins.
* [ ] User can stop monitoring.
* [ ] Stopping disables all future automation.

## Output Limit

* [ ] Claude reaches output limit.
* [ ] RelayCTX detects the state.
* [ ] Correct continuation control is identified.
* [ ] RelayCTX safely clicks it.
* [ ] Claude resumes.
* [ ] Monitoring continues.

## Usage Limit

* [ ] Usage exhaustion is detected.
* [ ] Reset time is detected where possible.
* [ ] Countdown is displayed.
* [ ] Popup can be closed without cancelling the process.
* [ ] Browser/service-worker interruptions are handled.
* [ ] Reset is revalidated.
* [ ] `continue` is entered.
* [ ] Message is submitted.
* [ ] Claude resumes.

## Completion

* [ ] Stable completion state is detected.
* [ ] User receives notification.
* [ ] User can open the relevant tab.

## Safety

* [ ] Unwatched tabs are never automated.
* [ ] Generic buttons are never blindly clicked.
* [ ] Arbitrary messages are never sent.
* [ ] Unrelated websites are never automated.
* [ ] Conversation content is never transmitted externally.
* [ ] User can stop automation at any time.

---

# 71. Exact Development Order

The coding agent should follow this sequence:

```text
1. Scaffold RelayCTX
        ↓
2. Manifest V3
        ↓
3. React popup
        ↓
4. Current tab detection
        ↓
5. Watch List
        ↓
6. Local storage
        ↓
7. Background service worker
        ↓
8. Content script
        ↓
9. Claude adapter
        ↓
10. Claude state detection
        ↓
11. Output continuation
        ↓
12. Usage-limit detection
        ↓
13. Reset timer
        ↓
14. Automatic resume
        ↓
15. Completion detection
        ↓
16. Browser notifications
        ↓
17. Reliability testing
```

Do not begin with backend infrastructure.

Do not begin with notifications.

Do not begin with accounts.

Do not begin with payments.

The core automation must work first.

---

# 72. Coding Agent Rules

The implementation agent must:

1. Inspect the repository before changing anything.
2. Determine the current package manager.
3. Reuse existing infrastructure where appropriate.
4. Avoid unnecessary dependencies.
5. Use TypeScript.
6. Keep platform-specific logic isolated.
7. Maintain strict typing.
8. Build incrementally.
9. Type-check after major changes.
10. Build the extension after major milestones.
11. Do not weaken TypeScript settings to hide errors.
12. Do not introduce a backend for MVP.
13. Do not introduce AI APIs.
14. Do not introduce LLM inference.
15. Do not introduce authentication.
16. Do not introduce payments.
17. Do not introduce email/SMS.
18. Prefer safe failure over unsafe automation.
19. Log state transitions during development.
20. Document Claude-specific selectors.
21. Keep the generic automation engine platform-independent.
22. Ensure every automation action is associated with an explicitly watched tab.
23. Never automate an unknown state.
24. Never use infinite retries.
25. Never transmit conversation contents externally.

---

# 73. First Milestone

Before implementing any automated clicking, the first working version should provide:

```text
┌──────────────────────────────────────┐
│ RelayCTX                             │
│ Keep your AI sessions moving.        │
│                                      │
│ CURRENT TAB                          │
│                                      │
│ Claude                               │
│ claude.ai/chat/...                   │
│                                      │
│ [ + Add to Watch List ]              │
│                                      │
├──────────────────────────────────────┤
│ WATCH LIST                           │
│                                      │
│ Claude                               │
│ ● Monitoring                         │
│ State: Generating                    │
│                                      │
│ [ Open ]          [ Stop ]           │
└──────────────────────────────────────┘
```

Once this works:

> Build the Claude state detector.

Do not build the entire product before testing the first real browser interaction.

---

# 74. Core Engineering Philosophy

RelayCTX should be:

**Local-first.**

**AI-token-free.**

**Explicitly user-authorized.**

**Platform-adapter based.**

**Safe by default.**

**Conservative when uncertain.**

**Resilient to browser/service-worker interruptions.**

**Simple for the user.**

**Extensible for future platforms.**

---

# 75. Final Product Definition

RelayCTX is not fundamentally a "Continue button automation tool."

It is:

> **A session continuity layer that keeps long-running AI workflows moving beyond interruptions.**

The browser extension is the first implementation.

The initial automation is simple:

```text
WATCH TAB
    ↓
MONITOR SESSION
    ↓
DETECT INTERRUPTION
    ↓
RELAY CONTINUATION
    ↓
WAIT IF NECESSARY
    ↓
RESUME
    ↓
MONITOR
    ↓
NOTIFY
```

The long-term vision is:

```text
AI WORKFLOW
     ↓
RELAYCTX
     ↓
CONTEXT / SESSION CONTINUITY
     ↓
PERSISTENT AI WORKFLOW
```

**Product name: RelayCTX**

**Tagline: Keep your AI sessions moving.**
