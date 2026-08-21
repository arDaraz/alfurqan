# Unify the bookmark flow and remove unreachable code

## Problem Statement

Saving a bookmark behaves differently depending on where the reader saves it from, and the differences are invisible on screen.

Bookmarking an ayah from the reader popup shows a confirmation with an Undo action. Bookmarking the same ayah from search shows the same category sheet, then nothing. The bookmark cannot be undone. Deleting a bookmark by swiping it away on the bookmarks screen also cannot be undone.

Bookmarking from the reader popup silently moves the saved reading position, so the home screen offers to resume somewhere the reader never read. It does this when the category sheet opens, before any category is chosen, so cancelling the sheet still moves the position. Bookmarking from the reader toolbar does not move the position at all, although the two entry points look identical.

Underneath this, the app carries a large amount of code that no screen can reach. There are two ayah selection models and only one is live. There are two families of page lookup functions and the retired family still ships, including the one whose bug is recorded in a comment beside it. A styling library is wired into the build, named in the contributor documentation as the primary styling approach, and used by no module in the app. Contributors and agents reading this codebase have to work out which half is real before they can change anything.

## Solution

Every way of adding or removing a bookmark behaves the same way and can be undone.

A reader who saves a bookmark sees the same confirmation and the same Undo action whether they came from the reader popup, the reader toolbar, search, or a swipe on the bookmarks screen. Undo restores exactly what was there before, including each bookmark's original position in the list.

Saving a bookmark no longer moves the reading position. The home screen resumes where the reader actually read.

Separately, the code that no screen can reach is removed, and the contributor documentation is corrected to describe the styling approach the app actually uses. The retired page lookup functions are removed, and their test coverage moves onto the layout aware functions the app really calls, which have none today.

## User Stories

1. As a reader, I want to save a bookmark from search and undo it, so that a mistaken tap is not permanent.
2. As a reader, I want to save a bookmark from the reader popup and undo it, so that the behaviour I already rely on keeps working.
3. As a reader, I want to save a bookmark from the reader toolbar and undo it, so that the toolbar and the popup behave the same way.
4. As a reader, I want to swipe a bookmark away and undo it, so that an accidental swipe does not destroy a saved place.
5. As a reader, I want Undo to restore a bookmark to its original position in the bookmarks list, so that undoing does not silently reorder what I saved earlier.
6. As a reader, I want Undo to restore every category an ayah had, so that removing a bookmark from two categories at once can be reversed in one action.
7. As a reader, I want Undo to leave an ayah with no bookmark at all when it had none before, so that undoing a first save returns to a clean state.
8. As a reader, I want the confirmation message to describe what actually changed, so that I can tell a save from a removal without opening the bookmarks screen.
9. As a reader, I want the confirmation to name the surah, page, and juz of the ayah, so that I can confirm the right ayah was affected.
10. As a reader, I want saving a bookmark to leave my reading position untouched, so that the home screen resumes where I was reading.
11. As a reader, I want cancelling the category sheet to change nothing at all, so that opening a sheet by accident has no effect.
12. As a reader, I want the category sheet to show my current categories for that ayah whenever it opens, so that I can see what is already saved.
13. As a reader, I want the category sheet to reflect a change made elsewhere in the app, so that it never shows stale categories.
14. As a reader browsing search results, I want the bookmark control to reflect whether that ayah is already bookmarked, so that I do not save it twice.
15. As a reader, I want the confirmation to disappear on its own after a short time, so that it does not cover the text I am reading.
16. As a reader using the app in English, I want the confirmation and the category sheet in English, so that the interface matches my chosen language.
17. As a reader using the app in Arabic, I want the confirmation and the category sheet in Arabic, so that the interface matches my chosen language.
18. As a reader, I want the surah name in the category sheet in my chosen language, so that the sheet is readable in either language.
19. As a reader who has undone a save, I want the confirmation to disappear, so that I cannot undo the same action twice.
20. As a reader, I want bookmarks to survive closing and reopening the app, so that my saved places are not lost.
21. As a contributor, I want one module to own adding, removing, and reversing a bookmark, so that I can change the behaviour in one place.
22. As a contributor, I want a screen to supply only where the confirmation appears, not what it means, so that a new screen cannot introduce a fourth behaviour.
23. As a contributor, I want the bookmark transaction covered by tests that need no screen, so that the semantics are pinned without rendering scaffolding.
24. As a contributor, I want one test suite to assert the same wiring against every screen that offers bookmarking, so that the screens cannot drift apart again.
25. As a contributor adding a fifth place to bookmark from, I want to add it to one list and inherit the tests, so that coverage does not depend on remembering.
26. As a contributor, I want the reading store to enforce the snapshot rule rather than document it, so that a caller cannot get undo wrong.
27. As a contributor, I want the ayah action handler to stop carrying an optional callback for bookmarks, so that its interface describes only what it does.
28. As a contributor, I want the retired page lookup functions removed, so that I cannot call the one that returns a page for the wrong mushaf layout.
29. As a contributor, I want the layout aware page lookups covered by tests, so that the functions the app actually calls are the ones under test.
30. As a contributor, I want the unreachable reader and its private modules removed, so that there is one ayah selection model to understand.
31. As a contributor, I want the unreachable renderer adapters removed, so that the repository interface describes only what the app can reach.
32. As a contributor, I want persisted settings that nothing reads removed, so that the settings shape matches the settings that exist.
33. As a contributor, I want the unused styling library removed from the build, so that the toolchain matches the code.
34. As a contributor, I want the contributor documentation to name the styling approach the app actually uses, so that I do not start from a false premise.
35. As a contributor, I want both contributor documentation files to stay identical apart from their titles, so that guidance does not diverge by tool. **Superseded 21 August 2026.** `CLAUDE.md` was deleted in commit `e4fc8d0` and `AGENTS.md` is now the only agent guide, so there is no second file to keep in step.
36. As a contributor, I want both reader adapters to satisfy one shared props type, so that the compiler catches divergence between platforms. **Not delivered.** Each adapter still declares its own private `MushafReaderProps`.
37. As a contributor, I want the web reader adapter to describe what it renders, so that its documentation is not misleading. **Not delivered.** The docstring still describes chrome the adapter does not render.
38. As a maintainer, I want the settings store version raised when persisted fields are removed, so that existing installs migrate cleanly.
39. As a maintainer, I want an existing install to keep its bookmarks across this change, so that the cleanup costs no reader their data.
40. As a maintainer, I want the deletions to change no behaviour, so that a regression can only come from the bookmark work.

## Implementation Decisions

### Bookmark transaction

- The reading store owns the reversible bookmark transaction. It gains an operation that commits the set of categories an ayah should end up with, and an operation that reverses a previous commit.
- A commit returns an undo token. The token is a snapshot of the ayah's bookmark records as they were before the commit, including each record's creation time. Reversing a commit replaces the ayah's records with the snapshot.
- The snapshot replaces the previous approach of tracking added categories, removed categories, and a separate map of prior creation times. One snapshot expresses the same thing and makes restoration an assignment rather than a set difference.
- The commit type that the category sheet used to compute is removed. The sheet reports only the categories the reader ended up with.
- The existing single category add, remove, and toggle operations stay. They serve callers that do not need reversal.
- The persisted shape of the bookmark list does not change, so the reading store's version is unchanged.

### Bookmark flow

- A single flow module sits between the screens and the store. It owns the transient state of the category sheet and the confirmation, and the asynchronous lookups needed to describe an ayah in the confirmation: its surah name, mushaf page, and juz for the active mushaf layout.
- The flow module reads the current categories for an ayah while subscribing to the bookmark list, so the category sheet is reactive by construction. Today two screens subscribe in a way that the store's own documentation warns against.
- Screens receive rendering props from the flow module and render the category sheet and the confirmation themselves. A screen chooses placement. A screen does not choose semantics.
- Three screens adopt the flow module: the mushaf reader screen, the search screen, and the bookmarks screen. The bookmarks screen routes its swipe to delete through the same commit, so a swipe becomes reversible.

### Ayah actions

- The ayah action handler loses its bookmark case and its optional callbacks parameter. With the reading position side effect removed, the case was a pass through to a callback plus a warning for the missing callback path.
- Screens route the bookmark action to the flow module at the point where they already branch on the action type. The bookmark action type itself is unchanged, because the reader popup still offers it.
- The reading position update is removed from the bookmark path entirely. Saving a bookmark is not reading.
- The reader toolbar routes through the same flow module entry point as the reader popup, so the two entry points stop behaving differently.

### Removal of unreachable code

Removed in this order, each independently verifiable:

1. The unreachable reader and its private modules: the reader itself, its ayah text, ayah end marker, bismillah, range selection bar, surah header banner, and page indicator modules, its selection store, and its text loading hook. The live reader keeps ayah selection in local state and does not use the selection store.
2. The retired renderer adapters in the Qur'an repository, together with the retired page lookup functions and the exports that no caller reaches. The tests covering the retired page lookups are rewritten to cover the layout aware functions the app uses, which currently have no tests.
3. The audio remote handler registration, whose body is a comment, together with its handler type and the call that constructs every handler for it. The empty search result module, the language string accessor with no callers, and the device language helper with no callers. The reciter and tashkeel settings fields that nothing reads, with the settings store version raised and a migration branch added.
4. The unused styling library, last and on its own, because it touches the Babel and Metro configuration and therefore requires a native rebuild to prove. This includes its dependencies, its configuration file, its global stylesheet, its type declarations, its Babel preset and JSX source setting, its Metro wrapper, its Jest transform pattern, and the stylesheet import in the root layout.
5. The contributor documentation, corrected to describe the stylesheet and theme hook approach the app actually uses. The two contributor documentation files stay identical apart from their titles. **Superseded 21 August 2026.** The documentation correction landed. The two-file rule did not survive: `CLAUDE.md` was deleted in commit `e4fc8d0` and `AGENTS.md` is now the only agent guide.

### Reader adapters

**Not delivered. Noted 21 August 2026, after pull request #8 merged.** Nothing in this section was implemented. The text below is kept as written so the gap stays visible.

- The native and web reader adapters share one exported props type. The web adapter accepts the full set and uses the properties it can honour on a platform with no pager. **Not delivered.** `src/components/quran/MushafReader.tsx` line 34 and `src/components/quran/MushafReader.web.tsx` line 8 each declare a separate private `MushafReaderProps`.
- The web adapter's documentation is corrected to describe what it renders. It currently claims to render playback and toolbar chrome that it does not render. **Not delivered.** The docstring at `src/components/quran/MushafReader.web.tsx` lines 14 to 18 still makes that claim.
- Web support is retained. Delivered.

## Testing Decisions

A good test here asserts what a reader can observe: which bookmarks exist after an action, what the confirmation says, and whether Undo restores the prior state. It does not assert which function was called or how state is held. Tests that reach a behaviour by stubbing out the modules around it are the pattern being removed, not extended.

Two seams, both existing.

**The reading store.** All transaction semantics test here, with no React and no rendering scaffolding. Coverage:

- Committing a first category, then reversing it, leaves the ayah with no bookmark.
- Reversing a commit restores each record's original creation time, so list order is preserved.
- Reversing a commit that replaced one category with another restores only the original.
- Reversing a commit that removed two categories restores both.
- Reversing a commit that added a category to an ayah that already had one restores the single original.

Prior art: the reading store already has separate suites for bookmarks, streak, and activity. These follow the same shape. The five assertions above exist today inside a screen suite that needs a large block of module fakes to reach them; they move here and the fakes go.

**The screens.** One suite, parameterized over every screen that offers bookmarking, asserting the same wiring for each: requesting a bookmark opens the category sheet, committing shows the confirmation, and the confirmation's Undo reverses the commit. Adding a fourth screen later means adding it to the list, and it inherits the assertions.

Prior art: the search screen and bookmarks screen suites already render a screen and assert on visible elements.

Deliberately not a seam: the bookmark flow module. It is an implementation detail behind the screen seam. Testing it directly would allow a screen to wire it incorrectly while its own tests stayed green, which is the failure this work exists to prevent.

The removals need no new seam. The type checker, the linter, and the existing suite carry them. The rewritten page lookup tests reuse the repository suite's existing approach of substituting the database.

The shared reader props type is checked by the type checker. It needs no test.

## Out of Scope

- Reordering, renaming, or adding bookmark categories.
- Any change to how bookmarks are stored on disk, or any migration of existing bookmark data.
- The recitation verification modules, which have no caller yet but are a deliberate work in progress with a product specification behind them.
- Removing web support. The web reader adapter is brought to the shared props type and kept.
- The duplicated mushaf page and juz resolution that runs twice on every page turn.
- The untyped message protocol between the reader and its embedded page renderer.
- The playback engine's interface, and the several places that each re-derive its state machine.
- The repeated right to left and bilingual style handling across the interface.
- The colour palette duplication and the modules that render light chrome in dark mode.
- Introducing a substitutable database seam for the content pack code that currently has no tests.
- Consolidating the two test directories.

## Further Notes

The removals and the bookmark work are independent and can be reviewed separately, but the removals should land first. They shrink the repository interface that the bookmark flow calls into, and they leave the bookmark work as the only source of behaviour change, which makes any regression easy to attribute.

The styling library removal is the only step that requires a native rebuild. Capturing a working simulator screenshot before that step gives a baseline to compare against, so an unrelated build or runtime problem cannot be mistaken for a regression introduced here.

Two user visible defects outside this scope were found in the same area and are recorded here so they are not lost. The settings toggle uses a physical margin for its knob and renders inverted when the app is in English. The font size row hardcodes the Qur'an font and right to left direction, so its English label renders in Arabic type and the wrong direction.

**Both fixed 21 August 2026 in the same pull request, commit `6fab23c`.** The knob now uses a start relative margin. The font size row picks its font and direction from the app language. Both were re-verified on the simulator in `manual_test_report.md`.

Nothing enforces that the English and Arabic string sets stay in step. The type that would check it is cast away, and no test asserts key parity. At the time of writing the two sets match at 138 top level keys each.
