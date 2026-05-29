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

- **Platforms:** iOS **and** Android.
- **Tooling tier:** Full setup — assume/help install `idb` (iOS) and Android
  platform-tools (`adb`) so the real accessibility tree + precise taps are
  available from day one.
- **Invocation:** Auto **and gate completion** — a UI task cannot be claimed
  complete until the verifier returns a pass. Enforced behaviorally by the skill
  *and* physically by a `Stop` hook.
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
                  .claude/mobile-verify/last-pass.json  (per-project marker)
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
  that this run will degrade to screenshot-only.
- **Target resolution:**
  - Platform: default iOS (use the booted simulator); Android when explicitly
    requested or when no iOS simulator is available.
  - Launch command: read the project `CLAUDE.md` "Verification" section and
    `package.json` scripts to find the run command (`npm run ios` / `npm run
    android`). If it cannot be determined, ask the user once.
  - Screen under test: derived from the change being verified (which route /
    component changed), with assertions to check.
- **Dispatch** the `mobile-verifier` sub-agent with: platform, launch command,
  target screen/route, and the list of assertions.
- **Relay** the compact verdict back to the user.
- **On pass:** write `.claude/mobile-verify/last-pass.json` (the gate marker).

### 2. `~/.claude/agents/mobile-verifier.md` (executor sub-agent)

Tools: `Bash`, `Read`. Runs isolated so noisy output (full a11y trees, base64
screenshots) never enters the main context. Responsibilities:

- **iOS mechanics:** `xcrun simctl` for boot / install / launch / screenshot /
  `openurl` (deep link to a route); `idb ui describe-all` for the a11y tree,
  `idb ui tap|text|swipe` for interaction.
- **Android mechanics:** `emulator` / `adb` for boot / install / launch; `adb
  shell uiautomator dump` for the a11y XML hierarchy (bounds + text +
  resource-id); `adb shell input tap|text|swipe` for interaction.
- **Drive** to the target screen, run the assertions against the a11y tree, take
  one screenshot as the human-facing artifact.
- **Return** a compact verdict only: `PASS`/`FAIL`, each assertion's result, and
  the screenshot path. Never dump the raw tree or image bytes.
- **On pass:** write the marker (so the agent works even when invoked directly,
  not only via the skill).

### 3. `~/.claude/hooks/gate-mobile-verify.sh` + `Stop` entry in `~/.claude/settings.json` (hard gate)

A `Stop` hook (registered in **user** settings, since it must apply across
projects). Logic:

1. Read hook JSON from stdin. If `stop_hook_active` is true → **release**
   (loop guard, see Error Handling).
2. **No-op (exit 0)** unless the current repo looks like a mobile app: presence
   of `app.json` plus an `expo` or `react-native` dependency in `package.json`.
3. Compute `ui_diff_hash` = hash of `git diff` restricted to UI paths
   (`src/app/**`, `src/components/**`, and `*.tsx`). If the diff is empty →
   **release** (no UI change to verify).
4. Read `.claude/mobile-verify/last-pass.json`. If it exists and its
   `ui_diff_hash` matches the current hash → **release** (already verified this
   exact UI state).
5. Otherwise → **block** with a reason instructing Claude to run
   `verify-on-simulator` before claiming completion.

## Data Flow — the gate marker

`.claude/mobile-verify/last-pass.json` (per project, git-ignored):

```json
{
  "ui_diff_hash": "<sha256 of `git diff` over UI paths>",
  "commit": "<HEAD sha>",
  "platform": "ios" | "android",
  "timestamp": "<ISO-8601>"
}
```

Written by the verifier (or skill) on a passing verdict; read by the `Stop`
hook. The hash binds a pass to an *exact* UI diff, so any further UI edit
invalidates it and re-triggers the gate.

## Error Handling / Escape Hatches

- **Loop guard:** the hook honors `stop_hook_active`. It blocks **once** firmly;
  if it has already blocked in the current cycle, it releases and surfaces the
  failure to the user rather than stalling forever. This is how the "gate
  completion" choice avoids an infinite stall.
- **No simulator/emulator booted:** the verifier boots one (`simctl boot` /
  `emulator @<avd>`). If it cannot, it returns `FAIL` with the reason; the gate
  then surfaces to the user via the loop guard.
- **WebView content:** `idb`'s native a11y tree does **not** see inside a
  WebView's DOM. For screens whose body is a WebView (e.g. Mushaf Al Furqan's
  `MushafReader`), the verifier auto-falls back to screenshot-only assertions;
  native chrome around the WebView remains tree-visible.
- **Tooling missing:** preflight degrades the run to screenshot-only and prints
  install commands; the gate still functions (a screenshot-based pass is still a
  pass for that run).

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
- **Hook (unit tests):** drive `gate-mobile-verify.sh` in a temp dir and assert:
  - blocks when a UI diff exists with no matching marker;
  - releases when a marker's `ui_diff_hash` matches;
  - releases (no-op) in a non-mobile repo;
  - releases when `stop_hook_active` is true;
  - releases when the UI diff is empty.

## Out of Scope (YAGNI)

- Physical device support (simulators/emulators only for now).
- Recording flows / video artifacts.
- CI integration (this is a local dev-loop tool).
- Computer-vision element detection (a11y tree + coordinate fallback only).
```
