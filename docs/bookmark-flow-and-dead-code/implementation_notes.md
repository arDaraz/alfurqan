# Implementation notes

Spec: `docs/bookmark-flow-and-dead-code/spec.md`
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
