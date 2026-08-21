# Implementation notes

Spec: `docs/bookmark-flow-and-dead-code/spec.md`
Manual test report: `docs/bookmark-flow-and-dead-code/manual_test_report.md`
Tracker: https://github.com/arDaraz/alfurqan/issues/7
Branch: `bookmark-flow-and-dead-code`

## Decisions taken before implementation

Recorded from the design interview. Each was chosen by the repository owner.

| Decision | Choice | Reason |
| --- | --- | --- |
| Where the bookmark transaction lives | The reading store | The store already owns the bookmark list and the creation time argument that undo depends on. Putting the transaction there makes the snapshot rule enforceable instead of documented, and testable with no React. |
| Undo representation | Snapshot of the ayah's previous records | Replaces three parallel structures (added, removed, prior creation times). Restoration becomes an assignment rather than a set difference. |
| Who renders the sheet and the confirmation | The host screen, from props | A screen may choose placement. A screen may not choose semantics. Choosing semantics is the current defect. |
| Bookmark case in the ayah action handler | Removed, with its callbacks parameter | Once the reading position side effect is gone the case is a pass through plus a warning. Removing it deletes an optional parameter and a type. |
| Reading position update on bookmark | Removed | Saving a bookmark is not reading. It also fired when the sheet opened, so cancelling still moved the position. |
| Bookmarking from search | Gains the confirmation and undo | The two screens already show the same sheet. One of them losing undo reads as a defect. |
| Swipe to delete on the bookmarks screen | Routed through the same commit | It was the last path where a bookmark could be destroyed with no way back. |
| Web support | Retained | The web reader adapter is brought to a shared props type so the compiler catches divergence. Removing web support is a product decision, not a cleanup. |
| Test seams | Two, both existing | The reading store for semantics, the screens for wiring. |
| The bookmark flow module as a test seam | Deliberately not one | Testing it directly would let a screen wire it wrongly while the module's own tests passed, which is the failure being fixed. |
| Retired page lookup tests | Ported, not deleted | Their layout aware replacements, which the app actually calls, have no tests at all. |
| Styling library removal | Last, on its own | It touches the Babel and Metro configuration and so requires a native rebuild to prove. Isolating it keeps every earlier step provable without one. |

## Rejected alternatives

- **A hook as the single seam for the bookmark flow.** Rejected because the transaction would only be reachable by rendering, and the semantics deserve tests that no screen participates in.
- **Tracking added and removed categories for undo.** Rejected in favour of the snapshot. Two representations of the same fact invite drift, and the creation time map existed only to patch what the diff could not express.
- **Deleting web support.** Considered because a single adapter is a hypothetical seam rather than a real one. The owner chose to keep web and unify the props type instead.
- **Deleting the retired page lookup tests along with their functions.** Rejected because it would take page and juz resolution from thin coverage to none.
- **Creating a second worktree for this work.** Rejected because the project documentation states the supported model is one active worktree on the shared Metro port at a time, so a second worktree would create the port conflict the documentation warns about. A branch in the existing checkout satisfies the requirement not to work on the default branch.

  **Note added 21 August 2026.** The rule this rejection rests on is retired. The primary checkout keeps port 8081 and every linked worktree now gets its own stable port derived from repo plus branch, so several Metro servers can run at once. A second worktree would no longer create a port conflict. The current model is in `docs/DEVELOPMENT_SETUP.md` section 13.

## Findings during setup

### The application did not launch on the current default branch

Found while capturing a baseline before making any change.

**Symptom.** The application terminates at startup with a fatal error: `This app is missing usage descriptions, so location services will fail.` The stack begins at `EXBaseLocationRequester getPermissions`.

**Cause.** The location plugin is configured correctly in the application manifest with both permission strings. The generated native project predates the commit that added the prayer times and Qiblah feature together with that plugin, so the plugin never ran and the built property list contains no location usage keys. The project documentation already requires a rebuild after a configuration plugin change.

**Action.** Regenerated the native project and rebuilt. The regenerated property list contains all three location usage keys carrying the strings from the manifest, and the application now launches and renders the home screen. This is a prerequisite for any visual verification and is not part of the spec.

**No code change is required.** The generated native directory is not tracked, so a fresh checkout regenerates it correctly. Only a working copy whose native directory predates the prayer times commit is affected. Anyone hitting the crash should regenerate rather than look for a fault in the application code.

### A test fails only under load

The bookmark undo suite for the mushaf reader screen failed twice while a native build was compiling on the same machine, then passed on every later run, including three consecutive runs on its own.

**Cause.** The suite renders a whole screen and waits for an assertion to become true. Under processor contention the wait expires before the render settles. The assertions themselves are sound.

**Action.** No separate fix. The spec already moves these five assertions to the reading store, where they need no render and no waiting, which removes the timing dependency rather than lengthening the timeout.

### The simulator environment note held in agent memory was out of date

It recorded that this machine had lost its only simulator runtime and that the developer directory had to be overridden. Both are now false: two runtimes are present and the developer directory resolves to the full toolchain without an override. The note was removed so it cannot mislead a later session.

## Verification log

Filled in as each step lands.

| Step | Checks | Result |
| --- | --- | --- |
| Baseline before any change | Build, install, launch | Build succeeded. Launch failed with the location usage description error described above. |
| Baseline after regenerating the native project | Build, install, launch, screenshot | Launches and renders the home screen in full. Type check clean. 56 suites, 316 tests pass. |
| Remove the unreachable reader | Type check, tests, lint | Clean. 54 suites, 307 tests pass. |
| Remove retired repository code | Type check, tests, lint | Clean. 54 suites, 300 tests pass. |
| Remove settings, locale and audio dead code | Type check, tests, lint, launch and screenshot | Clean. 54 suites, 300 tests pass. Home screen renders identically and persisted reading position, streak and Qiblah survive the settings migration. |
| Bookmark flow across every entry point | Manual test on the simulator, then re-verification of each fix | Recorded in `manual_test_report.md`. Seven reproducible defects found, all fixed and re-verified on the device. |

Log closed 21 August 2026. The branch merged as pull request #8, merge commit `bfb6d3a`.

## Defects found and fixed while building the bookmark flow

### A slow surah lookup could retarget the sheet

The sheet opens immediately and fills in the surah name when the lookup returns. Written the obvious way, that second update overwrites whatever is on screen. A reader who opens the sheet for one ayah, dismisses it and opens another quickly enough would see the first ayah's name against the second ayah. The update now applies only when the sheet still holds the ayah the lookup was for.

## Known gap, carried over rather than introduced

If the page and juz lookup fails after a commit, no confirmation appears, so the commit stands with no way to undo it. The previous implementation behaved the same way. It is recorded here because the new flow makes it a single place to fix rather than three.

## Defects found by manual testing on the simulator

An agent drove the simulator and exercised every feature. It found seven reproducible bugs. All seven are fixed and re-verified on the device. Four were mine, three were older.

### Undo did not restore, and the tests could not have caught it

The reversal was written inside a React state updater. Updaters must be pure. This project builds with the React compiler, so the updater could run during render or more than once, and the restore was dropped. Bookmarking from a search result or deleting by swipe therefore could not be undone, while the automated tests passed, because the test renderer calls an updater exactly once.

The store write now happens outside the updater. A regression test renders the flow under strict mode, which double-invokes updaters and reproduces the original failure.

The lesson worth keeping: a passing suite did not mean the code was correct, because the test environment did not reproduce the condition that broke it. Only running the real application found this.

### The reader confirmation was present but unreachable

The confirmation and the category sheet were rendered inside the reader body, as siblings of the native pager. A native pager paints over its own siblings, so both were in the accessibility tree, and invisible, and a tap meant for Undo reached the Quran page underneath. They are now rendered outside that body, with an explicit stacking order.

### The header and the visible page disagreed after a page turn

Older than this work, and the most involved to fix.

The reader mounts three pages at a time and the pager sits on the middle one. That window was centred on the page being read, so it slid on every turn, including while a swipe was still settling. The pager's children therefore changed underneath the gesture, and the index the code read on page-select no longer referred to the children the pager actually held. The header ended up one page away from the content, repeated turns stalled, and alternating turns eventually left the page blank.

A first attempt delayed the correction by one frame. It fixed forward turns and left backward turns broken, which is the signature of treating a symptom: it only helped whichever direction won the race.

The window is now centred by its own state, separate from the page being read. A swipe updates the header at once and leaves the window alone. The window recentres only when the pager reports that scrolling has gone idle. Jumps that are not swipes still recentre immediately, because there is no gesture to disturb.

### Smaller fixes

The surah index action opened Home, because it pushed the tab group rather than the tab holding the index. A test asserted the wrong destination, so the defect was pinned as correct behaviour; that test was corrected too. The deletion confirmation used the saved title. The settings switch used a physical margin and rendered backwards in English. The font size label was locked to the Quran font and right-to-left.

## Left for the owner to decide

The tafsir and word-by-word actions are stubs that close the popup and do nothing. The tester recommends hiding them rather than labelling them, on the grounds that an active control which does nothing is a dead end in the main reading flow. That is a product decision, so nothing was changed.

## Corrections to the spec found during implementation

### The retired section was not entirely retired

The comment introducing the retired repository adapters claimed the product reader never calls them. That was wrong. One font accessor in that block is called by the live layout font function, which the reader uses for the default mushaf. The type checker caught it. That accessor was kept and moved next to its only caller as a private function, since nothing outside the module needs it.

This is worth noting beyond this change: a prose comment asserting that code is unreachable is not evidence. The compiler is.

### The unused styling library was changing how the application looked

The spec treated the styling library as inert: wired into the build, used by no module, safe to delete. It was not inert.

Before the removal, the bookmarks button in the home brand bar rendered as a bare icon. After the removal, it renders with the rounded background and hairline border. The brand bar styles that button with an unconditional background colour and a one pixel border, so the appearance after the removal is the one the source asks for, and the appearance before it was wrong.

The cause is the library's compiler plugin, which rewrote every element in the project through its own JSX source. On this button the style is written in the callback form that receives the pressed state, and the plugin dropped the background the stylesheet supplied.

Two things follow. Removing the library fixed a visual defect rather than causing one. And an unused dependency that rewrites every element in the project is not inert, so "nothing imports it" is not sufficient reason to consider it harmless. Everything else on the home screen renders identically before and after.

The spec listed the non-hook language string accessor as having no callers. It has no production caller, but the strings test uses it, and it is the only way to read strings without rendering a React hook. It was kept. Removing it would have forced that test to render, which is a worse test for no gain.

## Spec items not delivered

Recorded 21 August 2026, after the merge, so the gap stays visible.

**The "Reader adapters" section of the spec was not implemented.** That covers user stories 36 and 37.

- Story 36, one shared props type for both reader adapters. Not delivered. `src/components/quran/MushafReader.tsx` line 34 and `src/components/quran/MushafReader.web.tsx` line 8 each still declare their own private `MushafReaderProps`. The two types differ, and nothing makes the compiler catch the divergence. The decision table above and the rejected alternative about deleting web support both assume this landed. It did not.
- Story 37, correcting the web adapter's documentation. Not delivered. The docstring at `src/components/quran/MushafReader.web.tsx` lines 14 to 18 still says the placeholder loads the header and toolbar chrome for review. The component renders a divider, a title, a page indicator, and a caption. There is no chrome.

**User story 35 lapsed rather than failed.** It asked that both contributor documentation files stay identical apart from their titles. `CLAUDE.md` was deleted after this work merged, in commit `e4fc8d0`, and `AGENTS.md` is now the only agent guide. There is no second file to keep in step, so the story no longer has a subject.
