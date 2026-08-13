# Cross-Project Mobile Simulator Verification — Design

**Date:** 2026-05-29
**Status:** Approved (pre-implementation)
**Author:** brainstormed with Claude Code

## Problem

Claude can take iOS simulator screenshots via `xcrun simctl`, but that is *pixel*
visibility only: it can see a rendered frame but cannot reliably know which UI
elements exist, read their labels, or interact with them by element. There is no
Android coverage and no enforced verification step. The goal is **semantic
visibility** (the accessibility tree: element type, label, frame, tap target)
plus **precise interaction** (tap/type/swipe by element) across **iOS and
Android**, packaged so it works in *every* mobile project — not just Mushaf Al
Furqan — and so a UI change cannot be claimed complete until it has been verified
on a real simulator/emulator.

## Decisions (locked during brainstorming)

- **Platforms:** iOS **and** Android. A completion pass requires all required
  platforms for the task, not just whichever platform was easiest to run.
- **Tooling tier:** Full setup — assume/help install `idb` (iOS) and Android
  platform-tools (`adb`) so the real accessibility tree + precise taps are
  available from day one.
- **Invocation:** Auto **and gate completion** — a UI task cannot be claimed
  complete until the verifier returns a complete pass for the current UI state,
  required platform set, target screens, and assertions. Enforced behaviorally by
  the skill *and* physically by a `Stop` hook.
- **Architecture:** Approach 1 — a playbook **skill** (orchestrator, runs in the
  main thread) + an isolated **sub-agent** (executor) + a **`Stop` hook** (hard
  gate).
- **Scope:** All artifacts live at user level (`~/.claude/`) for cross-project
  reuse, with self-detection so they no-op in non-mobile repos.

## Architecture

```
main thread ──invokes──▶ verify-on-simulator (skill)   "what to check + gate"
                              │ dispatches
                              ▼
                         mobile-verifier (sub-agent)    "how to drive the device"
                              │ on pass, writes
                              ▼
                  .claude/mobile-verify/last-pass.json  (per-project proof)
                              ▲ reads
   Stop hook ── gate-mobile-verify.sh ─────────────────  "you can't claim done yet"
```

Two layers of visibility the system provides:

- **Semantic** (primary): the native accessibility tree — structured element
  data at tens of tokens, used for both assertions and element-precise taps.
- **Pixel** (fallback / human-facing): a screenshot, used when no a11y data
  exists (e.g. WebView content) and as the artifact a human reviews.

## Components

### 1. `~/.claude/skills/verify-on-simulator/SKILL.md` (orchestrator)

Runs in the main thread. Responsibilities:

- **Preflight:** detect whether `idb` / `idb_companion` and `adb` are installed.
  If missing, print the one-time install commands (see Prerequisites) and note
  which assertion modes can still run.
- **Target resolution:**
  - Platform set: default iOS + Android for cross-platform UI work; use one
    platform only when the user/task explicitly scopes the change to that
    platform. Prefer already-booted simulators/emulators within the required set.
  - Launch command: read the project `CLAUDE.md` "Verification" section and
    `package.json` scripts to find the run command (`npm run ios` / `npm run
    android`). If it cannot be determined, ask the user once.
  - Screen under test: derived from the change being verified (which route /
    component changed), with assertions to check.
- **Dispatch** the `mobile-verifier` sub-agent with: required platform set,
  launch command, target screens/routes, and the list of assertions.
- **Relay** the compact verdict back to the user.
- **On pass:** write `.claude/mobile-verify/last-pass.json` (the gate proof).
  The pass must include the required platform set, target screens, assertions,
  device metadata, verification mode, and app/build identity.

### 2. `~/.claude/agents/mobile-verifier.md` (executor sub-agent)

Tools: `Bash`, `Read`. Runs isolated so noisy output (full a11y trees, base64
screenshots) never enters the main context. Responsibilities:

- **iOS mechanics:** `xcrun simctl` for boot / install / launch / screenshot /
  `openurl` (deep link to a route); `idb ui describe-all` for the a11y tree,
  `idb ui tap|text|swipe` for interaction.
- **Android mechanics:** `emulator` / `adb` for boot / install / launch; `adb
  shell uiautomator dump` for the a11y XML hierarchy (bounds + text +
  resource-id); `adb shell input tap|text|swipe` for interaction.
  Android interaction is element-derived coordinate interaction: the verifier
  finds the intended node in the hierarchy, computes a safe center point from its
  bounds, taps/types/swipes at that coordinate, then re-reads the hierarchy to
  confirm the expected state changed.
- **Android element matching rules:** prefer exact `resource-id`, then exact
  visible text/content description, then normalized label match scoped by class
  and bounds. If multiple nodes match, fail with an ambiguity report rather than
  guessing. Escape shell text input and retry after scrolling only when the
  target assertion declares the element may be off-screen.
- **Drive** to every target screen, run the assertions against the a11y tree
  whenever semantic data is available, take one screenshot per screen/platform as
  the human-facing artifact.
- **Return** a compact verdict only: `PASS`/`FAIL`, each assertion's result, and
  the screenshot path. Never dump the raw tree or image bytes.
- **On complete pass:** write the proof marker (so the agent works even when
  invoked directly, not only via the skill). A partial platform pass may update
  an intermediate result file, but must not satisfy the Stop hook.

### 3. `~/.claude/hooks/gate-mobile-verify.sh` + `Stop` entry in `~/.claude/settings.json` (hard gate)

A `Stop` hook (registered in **user** settings, since it must apply across
projects). Logic:

1. Read hook JSON from stdin. If `stop_hook_active` is true → apply the loop
   guard behavior in Error Handling.
2. **No-op (exit 0)** unless the current repo looks like a mobile app. Detection
   checks root and first-level workspace packages for:
   - Expo config: `app.json`, `app.config.js`, `app.config.ts`, or `expo` config
     in `package.json`;
   - mobile dependencies: `expo`, `react-native`, `@react-native/*`, or
     `expo-router`;
   - native folders: `ios/` or `android/`.
3. Compute `ui_diff_hash` = hash of tracked **and untracked** UI-affecting files,
   using a project-configurable path set. Defaults:
   - `src/app/**`, `app/**`, `src/components/**`, `components/**`;
   - `src/constants/**`, `src/hooks/**`, `src/stores/**`, `src/navigation/**`;
   - `assets/**`, `app.json`, `app.config.*`, `package.json`,
     `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`;
   - `ios/**` and `android/**` when present.
   If the hash input is empty → **release** (no UI-affecting change to verify).
4. Resolve the required proof from the current task:
   - required platforms: iOS and Android by default for cross-platform UI
     changes, or the explicit platform when the user/task scopes the change to
     one platform;
   - target screens/routes/components affected by the diff;
   - assertions that prove the visible behavior changed or remained intact.
5. Read `.claude/mobile-verify/last-pass.json`. Release only if it exists and
   all of the following match the current state:
   - `ui_diff_hash`;
   - required platform set and passed platform set;
   - target screens/routes;
   - assertion IDs and expected values;
   - app identity/build identity;
   - verification mode allowed by each assertion.
   Otherwise the proof is stale or incomplete.
6. Otherwise → **block** with a reason instructing Claude to run
   `verify-on-simulator` before claiming completion.

## Data Flow — the gate proof

`.claude/mobile-verify/last-pass.json` (per project, git-ignored):

```json
{
  "schema_version": 1,
  "ui_diff_hash": "<sha256 of tracked + untracked UI-affecting inputs>",
  "commit": "<HEAD sha>",
  "app": {
    "name": "<package/app name>",
    "bundle_id": "<iOS bundle id or Android application id>",
    "build_id": "<native build id or package version + lockfile hash>"
  },
  "required_platforms": ["ios", "android"],
  "passed_platforms": ["ios", "android"],
  "devices": {
    "ios": {
      "name": "iPhone 17 Pro Max",
      "os": "<runtime>",
      "udid": "<simulator id>"
    },
    "android": {
      "name": "<avd name>",
      "api": "<api level>",
      "serial": "<emulator serial>"
    }
  },
  "targets": [
    {
      "id": "bookmarks-tab",
      "route": "/(tabs)/bookmarks",
      "assertions": [
        {
          "id": "bookmarks-title-visible",
          "mode": "semantic",
          "expected": "Bookmarks"
        }
      ]
    }
  ],
  "artifacts": {
    "ios": ["<screenshot paths>"],
    "android": ["<screenshot paths>"]
  },
  "degraded": false,
  "degraded_reason": null,
  "timestamp": "<ISO-8601>"
}
```

Written by the verifier (or skill) only on a complete passing verdict; read by
the `Stop` hook. The hash binds a pass to an *exact* UI-affecting state, while
the platform, target, assertion, app, and mode fields bind it to what was
actually verified. Any further UI edit, target change, assertion change,
platform requirement change, app/build change, or degraded-mode mismatch
invalidates the proof and re-triggers the gate.

## Error Handling / Escape Hatches

- **Loop guard:** the hook honors `stop_hook_active` to prevent impossible
  infinite loops, but it must not silently convert an incomplete proof into a
  pass. On the first block it returns JSON with `decision: "block"` and a clear
  reason. If `stop_hook_active` is true and the proof is still incomplete, it
  releases only with an explicit failure message for the user and without
  writing or accepting a pass marker. The final assistant message must state that
  simulator verification did not complete.
- **No simulator/emulator booted:** the verifier boots one (`simctl boot` /
  `emulator @<avd>`). If it cannot, it returns `FAIL` with the reason; the gate
  then surfaces to the user via the loop guard.
- **WebView content:** `idb`'s native a11y tree does **not** see inside a
  WebView's DOM. For screens whose body is a WebView (e.g. Mushaf Al Furqan's
  `MushafReader`), the verifier may use screenshot/visual assertions for the
  WebView body; native chrome around the WebView remains tree-visible. Semantic
  assertions for WebView body content remain unmet unless a project-specific DOM
  bridge exists.
- **Tooling missing:** preflight degrades only the affected assertion modes and
  prints install commands. Screenshot-only verification may satisfy assertions
  explicitly marked `mode: "screenshot"` or `mode: "visual"`, but it must not
  satisfy semantic assertions. A degraded run records `degraded: true`,
  `degraded_reason`, and which assertions were not semantically verified. For
  native UI tasks, degraded screenshot-only results require explicit user
  acknowledgement before the assistant may claim the work is verified.

## Prerequisites

- **iOS:** `brew install facebook/fb/idb-companion` + `pipx install fb-idb`
- **Android:** `brew install --cask android-platform-tools` (or via the Android
  Studio SDK manager)

`xcrun simctl` is already available; the dev machine currently has an
`iPhone 17 Pro Max` simulator booted.

## Testing

- **Agent + skill (live dry-run):** against the booted `iPhone 17 Pro Max` +
  Mushaf Al Furqan — launch, navigate to the Bookmarks tab, assert a known
  label, return a verdict. Confirms the full happy path on iOS.
- **Agent + skill (Android dry-run):** against a booted Android emulator +
  Mushaf Al Furqan — launch, navigate to the same target screen, parse
  `uiautomator` hierarchy, assert the same known label, interact with one element
  via hierarchy-derived bounds, return a verdict.
- **Hook (unit tests):** drive `gate-mobile-verify.sh` in a temp dir and assert:
  - blocks when a UI diff exists with no matching marker;
  - releases when the marker's full proof matches the current required proof;
  - blocks when only one of two required platforms has passed;
  - blocks when platform coverage matches but target screens/assertions differ;
  - blocks when semantic assertions are present but the marker is degraded to
    screenshot-only;
  - includes untracked UI files in the hash;
  - invalidates when theme/assets/config/package/native files change;
  - releases (no-op) in a non-mobile repo;
  - detects Expo apps using `app.config.ts` and monorepo package locations;
  - releases with an explicit failure message when `stop_hook_active` is true
    and proof is still incomplete, without accepting or writing a pass marker;
  - releases when the UI diff is empty.
- **Fixture tests:** include Android hierarchy XML fixtures and iOS `idb`
  hierarchy fixtures for exact match, ambiguous match, off-screen match, and
  WebView fallback cases.

## Out of Scope (YAGNI)

- Physical device support (simulators/emulators only for now).
- Recording flows / video artifacts.
- CI integration (this is a local dev-loop tool).
- Computer-vision element detection (a11y tree + coordinate fallback only).
