# Al Furqan iOS manual test report

Tested on 21 August 2026 using the already-running `iPhone 17 Pro` simulator on iOS 26.5. The app was tested from branch `bookmark-flow-and-dead-code` with the existing Metro server and installed development build. Metro was not restarted and the app was not rebuilt.

## Re-verification summary

Re-verified on 21 August 2026 after the updated JavaScript was already running. The app was not rebuilt and Metro was not restarted.

All six fixes from the earlier re-verification remain fixed:

| Finding | Status | Re-verification result |
| --- | --- | --- |
| Reader bookmark confirmation and Undo | Fixed | The confirmation is visible above the Mushaf and receives taps. Undo restored the prior state from both the bottom toolbar bookmark button and the ayah popup bookmark action. The Mushaf underneath did not receive either Undo tap. |
| Undo from reader, search, and swipe-delete | Fixed | Reader and search Undo restored the exact prior categories. Swipe-delete Undo restored the deleted older bookmark below the newer bookmark. The older bookmark did not move to the top, which confirms that its original `createdAt` and list position were preserved. |
| Deletion confirmation title | Fixed | Arabic showed `تم حذف الإشارة`. English showed `Bookmark removed`. |
| Reader Surah index navigation | Fixed | `فهرس السور` and `Surah index` both opened the Search tab with the surah list. Neither action opened Home. |
| Settings switch knob direction | Fixed | Arabic on and off states used the correct physical sides. English on placed the knob on the physical right and off placed it on the physical left. Arabic did not regress. |
| Font-size row language styling | Fixed | Arabic kept its Quran font and right-to-left layout. English used the Latin font and left-to-right layout for `Quran text size`. |

Pager idle-recenter verdict: **Fixed.** The final approach kept the header and Mushaf content in sync through measured forward, backward, alternating, rapid, edge, and non-swipe jump tests. No turn stalled or rendered a blank body. A 30 FPS recording showed no visible jump, flicker, or snap-back when the window recentered after the pager became idle.

Test bookmarks were removed after re-verification. Both bookmark category tabs are empty. The app language, appearance, night reading mode, font size, reciter, home widgets, bookmark sort order, and reading position were restored. The app was left on Al-Baqarah 2:253, page 42, juz 3, with no active playback.

## Resolved pager bug

### Reader page metadata now matches the displayed Mushaf page

Prerequisites:

- Open Al-Baqarah page 42.

Steps:

1. Set the app language to Arabic.
2. Open Al-Baqarah page 42.
3. Swipe forward eight times, comparing the header and displayed page after every turn.
4. Swipe backward eight times, making the same comparison after every turn.
5. Alternate directions ten times with short delays, including quick reversals.
6. Run 12 rapid forward turns followed immediately by 12 rapid backward turns.
7. Test inward and outward turns at pages 1 and 604.
8. Open reader pages through Continue Reading, an Arabic search result, a bookmark row, and playback follow.
9. Record the alternating and rapid sequences at 30 FPS and inspect the transitions.

Expected result:

The header, page number, juz, and displayed ayahs all describe the same Mushaf page.

Actual result:

The issue did not reproduce. The pager passed every requested sequence:

- Eight consecutive forward turns moved from page 42 through page 50. The header and rendered page matched after every turn. The surah name changed from Al-Baqarah to Aal-E-Imran on page 50, and juz 3 remained correct.
- Eight consecutive backward turns moved from page 50 through page 42. Every turn advanced exactly one page. The previous backward stall did not recur.
- Ten quick alternating turns moved repeatedly between pages 42 and 43. The header and content matched after every reversal.
- The rapid sequence completed 12 forward turns from page 42 to page 54, followed immediately by 12 backward turns to page 42. The recenter could not be outrun. No page repeated, stalled, drifted, or became blank.
- Page 1 stayed clamped after two outward turns. An inward turn opened page 2 with Al-Baqarah and juz 1, and the return restored page 1 with Al-Fatihah.
- Page 604 stayed clamped after two outward turns. An inward turn opened page 603 with Al-Kafirun and juz 30, and the return restored page 604 with Al-Ikhlas.
- Continue Reading reopened Al-Ikhlas 1 on page 604. The Al-Baqarah 2:254 search result opened page 42. The Al-Ikhlas 1 bookmark row opened page 604.
- Playback follow moved the reader to Aal-E-Imran 3:2 on page 50. The player ayah, header page, surah, juz, and rendered ayahs all agreed.
- Both 30 FPS recordings showed normal horizontal page motion. No visible jump, flicker, snap-back, blank body, or loading skeleton appeared during the inspected alternating and rapid sequences.

No fresh bug screenshot was added because the bug no longer reproduced.

## Tafsir and word-by-word recommendation

Tafsir and Word by word remain deliberate stubs. Both actions close the popup without showing content or a message.

Recommendation: hide both actions for now. An active action promises a result, so replacing silence with `Not available yet` still leaves a dead-end control in the main reading flow. Show the actions again when each action has useful content. If the features must remain visible for a near release, disable them and label them as coming soon instead of allowing a tap that closes the popup.

## Tested and working

### Home

- San Francisco prayer band, next prayer countdown, and all five prayer times displayed.
- Qiblah compass displayed a 19 degree heading to the Kaaba.
- Reading streak, longest streak, and weekly indicators displayed.
- Continue Reading resumed the exact saved surah, ayah, juz, and page.
- Khatam progress and Tasmee entry displayed.
- The top-left bookmark button opened Bookmarks.
- Saving a bookmark did not change Continue Reading. After saving Al-Baqarah 2:3, Home still resumed Al-Baqarah 2:1 on page 2.

### Reader

- Eight consecutive forward turns and eight consecutive backward turns kept the header, surah, juz, and rendered page in sync from page 42 through page 50 and back.
- Ten alternating turns and 24 rapid turns completed without drift, stalls, repeated pages, or blank content.
- First-page and last-page clamping worked, including turning one page away from each end and back.
- Continue Reading, a search result, a bookmark row, and playback follow each opened the correct page.
- Page recentering after the pager became idle produced no visible jump, flicker, or snap-back in 30 FPS recordings.
- Tapping an ayah opened the selection popup.
- Popup Play, Copy, Share, and Bookmark actions responded. Share opened the native iOS share sheet.
- The bookmark sheet opened from both reader entry points.
- Bookmark confirmations were visible above the native pager from both reader entry points. Undo received the tap and restored the exact prior categories.
- Cancelling the bookmark category sheet changed nothing.
- Bottom Play, Practice, and Info actions responded.
- The Info sheet showed surah, juz, page, layout, and attribution data.
- Surah index opened Search in both Arabic and English.

### Bookmarks

- Reading and Recitation tabs switched correctly.
- Oldest-first and newest-first sorting changed the order of two bookmarks correctly.
- Swiping revealed Delete.
- Swipe-delete Undo restored the deleted bookmark to its original position. An older bookmark remained below the newer bookmark.
- Tapping a bookmark row opened the correct reader page.
- Removing one category preserved the other category.

### Search

- Surah and juz tabs displayed their lists, including opening juz 3 at page 42.
- An Arabic ayah phrase pasted from the app returned Al-Baqarah 2:254.
- Per-result Play and Pause responded.
- Per-result Copy updated the simulator clipboard and was successfully pasted back into Search.
- Opening a result navigated to page 42.
- The bookmark category sheet and confirmation appeared correctly.
- Search-result Undo restored the prior unbookmarked category state.

### Settings

- Arabic and English language changes applied and were restored to Arabic.
- Light, dark, and system appearance modes applied and were restored to Light.
- Night reading enabled and disabled correctly. Classical, sepia, pure ink, and indigo palettes all selected and updated their descriptions. Classical was restored before disabling night reading.
- The Quran text slider changed from 58% to 74% and was restored exactly to 58%.
- The Mushaf layout picker displayed Madani and IndoPak options, and closing it preserved Madani.
- The reciter picker changed from Husary to Abdul Basit and was restored to Husary.
- Prayer times, Qiblah, Continue Reading, streak, Khatam, and Tasmee home widget switches changed state and were restored to enabled.
- Switch knob direction was correct in Arabic and English for both on and off states.
- The Arabic font-size label kept its Quran styling. The English label used the Latin font and left-to-right direction.
- Saved Recitations expanded to its correct empty state.

### Playback

- Ayah playback started from both the reader and a search result.
- Mini player Play, Pause, Resume, and Stop responded.
- The player sheet opened and closed.
- Speed changed from 1x to 1.25x and was restored.
- Loop enabled and disabled.
- Previous and Next moved between ayahs.
- Seeking moved playback to the selected position.
- Reciter switching worked and was restored to Husary.

### Practice and Tasmee

- Home, reader toolbar, and center tab entries opened Practice.
- Listening started and stopped.
- Reference playback started, paused, and resumed.
- Skip correction updated the feedback state.
- The practice back action returned to the prior screen.

## Known issues acknowledged, not reported as new

- A bookmark commit cannot be undone when the page or juz lookup fails and no confirmation is shown. This was not fault-injected because doing so would require an unsafe database or app-data change.

## Coverage limits

- Onboarding was not reset. No safe in-app reset was available, and wiping app data would have violated the test constraint.
- The IndoPak layout option was visually inspected, but the automation accessibility tree did not expose either layout card as an actionable control. Madani remained selected and no app data was changed to force the alternate layout.
