# Home screen revamp — implementation notes

Source design: Claude Design project `e68e4c41-10ba-4dbe-8d0b-4014fa4d93e4`, file
`Al Furqan Home - New.dc.html`, plus `Design System Update.dc.html` (amendment 1).

## Decisions

**Layout 1a (Day band).** The user chose it over 1b (Mosaic) and over shipping both behind a
setting. Prayer band is the day's anchor and the only gradient on the screen. Under it: Qiblah and
Streak two-up, then Continue Reading, then Khatam. Tasmīʿ is a widget too but ships off.

**Real data, new dependencies.** The user chose real prayer times and a live Qiblah needle over
mock values.

- `adhan@^4.4.4` — offline prayer-time and Qibla math. Pure JS, no native code.
- `expo-location@~55.1.12` — coordinates, reverse geocode for the city name, and the compass.

`expo-sensors` was installed first and then removed. `Location.watchHeadingAsync` already returns a
true-north heading and handles device orientation, so a raw magnetometer read would have been more
code for a worse result.

**The old home is obsolete.** The user confirmed the surah/juz list leaves Home. It became the
Search tab's resting state (`SurahBrowser`), so a reader still reaches any surah without typing.
`SearchInput` lost `autoFocus`, because a keyboard would have covered that list on entry.

**Khatam progress is derived, not stored.** `lastReadJuz / 30`. No new state, and it moves on its
own as the reader advances.

**Streak week pips are derived too.** `weekActivity(streakDays, streakLastReadDate)` reports which
of the last seven days fall inside the current run. No per-day reading log is kept.

**`longestStreak` is new state** on `readingStore` (version 3). Existing installs migrate by seeding
it from the current `streakDays`, since no history exists to reconstruct a real record from.

## Rejected

**Widget reordering.** Settings screen `1d` shows an "Arrange widgets / ترتيب الودجات" row that
opens a drag-to-reorder list. Not built. Layout 1a is not a flat list — Qiblah and Streak are a
two-up pair — so a linear order would not describe the surface. The toggles are built and do drive
Home. Reordering is worth revisiting if the user wants both 1a and 1b arrangements.

**A second search field.** The old Home had a surah-name filter above the list. The Search tab
already has an input directly above the browser, so a second one was dropped.

## Design-system amendment applied

Three semantic aliases added to `src/constants/theme.ts`, light and dark:
`widgetSurface` (= `bgRaised`), `railSurface` (= `bgSunken`), `qiblahNorth` (= `accent`).

The Clock Numerals Rule is enforced in `src/utils/clock.ts` and every widget: clock times, bearings
and counts render in Amiri (Arabic-Indic) or Manrope (Latin), never KFGQPC-Uthmani, which wraps
digits in ayah-marker ornaments. Prayer *names* stay in Quranic script.

The One Anchor Rule holds: the prayer band is the only gradient on Home. Continue Reading is a plain
widget card in this layout.

## Files

New:

- `src/services/prayerTimes.ts`
- `src/utils/clock.ts`
- `src/hooks/usePrayerTimes.ts`
- `src/hooks/useCompassHeading.ts`
- `src/components/home/widgets/{WidgetCard,PrayerBand,QiblahWidget,StreakWidget,ContinueReadingWidget,KhatamWidget,TasmeeWidget}.tsx`
- `src/components/settings/HomeWidgetsGroup.tsx`
- `src/components/search/SurahBrowser.tsx`

Rewritten: `src/components/home/HomeView.tsx`.

Deleted: `src/components/home/GreetingCard.tsx`, `src/components/home/SearchBar.tsx`,
`src/hooks/useSearch.ts` and its test.

## Verification

- `npx tsc --noEmit` — clean.
- `npm test` — see the run recorded below.
- `npm run lint` — no new warnings; every remaining warning predates this change.
- iOS simulator — see below.
