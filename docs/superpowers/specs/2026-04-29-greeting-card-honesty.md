# Greeting Card Honesty — Specification

**Status:** Implementation-ready after vertical-slice rewrite
**Date:** 2026-04-29
**Source plan:** `docs/superpowers/plans/2026-04-29-greeting-card-honesty.md`
**Scope:** Home greeting card honesty, passive reading activity, last-read timestamp, and streak risk signal.

---

## 1. Overview

The Home greeting card currently presents fabricated habit and position data: a hardcoded 27-day streak, fixed Juz 3, and Ayat al-Kursi copy even for users who have never read in the app. This feature makes the card honest.

The greeting card must have two first-class states:

| State | Condition | User-facing behavior |
|---|---|---|
| Cold start | No complete persisted last-read activity | Invite the user to begin with Al-Fatihah |
| Continue | Complete persisted last-read activity exists | Show the real surah, ayah, juz, page, last-read time, and streak state |

The feature deliberately treats reading activity as separate from bookmarks. Bookmarks remain explicit user-managed saved ayahs. Last-read and streak updates are passive activity signals.

---

## 2. Goals

- Replace fake Home card progress with persisted reading activity.
- Save a full reading position: surah, ayah, juz, page, timestamp.
- Support both reader entry points: flowing `QuranReader` and native Mushaf `MushafReader`.
- Show a true cold-start card for new users.
- Show a compact relative "last read X ago" line for returning users.
- Track daily reading streaks using local calendar days.
- Replace the passive streak display with a risk hint when today's reading has not happened.
- Preserve Arabic-first RTL rendering rules and bilingual copy.

---

## 3. Non-Goals

- Daily goal ring.
- Khatm progress.
- Ayah translation preview.
- Hijri or prayer-time context.
- Milestone celebrations.
- Streak freezes.
- Weekly target mode.
- Bookmark management UI.
- Daily reminder scheduling.
- Review tab queues.
- Practice-session history.
- Tafsir, word-by-word, mic/ASR, and toolbar bookmark wiring.

These are separate product surfaces and should not be hidden inside this greeting-card scope.

---

## 4. Current Problems

| Problem | Current behavior | Required behavior |
|---|---|---|
| Fake progress | Home falls back to Al-Baqarah 255 and Juz 3 | Home shows cold-start until a real read exists |
| Fake streak | Home shows 27 days | Home shows persisted streak days |
| Missing timestamp | No last-read time exists | `lastReadAt` is persisted and displayed |
| Partial Mushaf progress | `MushafReader` stores only page | Mushaf page changes store surah, ayah, juz, page, timestamp |
| Partial flowing-reader progress | `QuranReader` stores only surah and ayah | Flowing-reader scroll stores surah, ayah, juz, page, timestamp |
| Bookmark confusion | Last-read can be mistaken for bookmark behavior | Reading progress never mutates `bookmarks` |

---

## 5. Data Model

### 5.1 `readingStore`

`src/stores/readingStore.ts` owns passive reading activity.

```ts
type ReadingState = {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadJuz: number | null;
  lastReadPage: number | null;
  lastReadAt: number | null;
  streakDays: number;
  streakLastReadDate: string | null;
  hasCompletedOnboarding: boolean;
  bookmarks: Bookmark[];
  setLastRead: (
    surah: number,
    ayah: number,
    juz: number,
    page: number,
    now?: Date
  ) => void;
  completeOnboarding: () => void;
  addBookmark: (surah: number, ayah: number) => void;
  removeBookmark: (surah: number, ayah: number) => void;
  toggleBookmark: (surah: number, ayah: number) => void;
};
```

### 5.2 Persistence

MMKV key remains `reading-store`.

New fields are additive. Existing users with only `lastReadSurah`, `lastReadAyah`, or `lastReadPage` are treated as incomplete continue data until a reader writes the full shape.

### 5.3 Local Date Key

Streak math uses local date keys in `YYYY-MM-DD` format.

```ts
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

This avoids UTC cutover surprises for a daily habit feature.

---

## 6. Repository Contract

Add one helper to `src/data/quranRepository.ts`:

```ts
export async function getJuzAndPageForAyah(
  surahNumber: number,
  ayahNumber: number
): Promise<{ juz: number; page: number }>;
```

Expected query:

```sql
SELECT juz_number, page_number
FROM ayahs
WHERE surah_number = ? AND ayah_number = ?
```

Behavior:

- Return `{ juz, page }` for existing ayahs.
- Throw `No juz/page found for surah X, ayah Y` when no row exists.
- Use the existing bundled SQLite database, not API calls.

---

## 7. Reader Event Contracts

### 7.1 Flowing Text Reader

`src/components/quran/QuranReader.tsx`

Trigger:

- Existing debounced scroll handler chooses the closest ayah.

Required update:

1. Lookup `{ juz, page }` with `getJuzAndPageForAyah(surahNumber, closestAyah)`.
2. Call `setLastRead(surahNumber, closestAyah, juz, page)`.
3. If lookup fails, leave the reader usable and skip the activity update.

### 7.2 Mushaf Page Reader

`src/components/quran/MushafReader.tsx`

Trigger:

- Page selection changes through the native pager.
- Playback-driven page changes may also call the same page-change path.

Required update:

1. Lookup top ayah with existing `getTopAyahForPage(pageNumber)`.
2. Lookup `{ juz }` with `getJuzAndPageForAyah(surahNumber, ayahNumber)`.
3. Call `setLastRead(surahNumber, ayahNumber, juz, pageNumber)`.
4. Remove the reader's dependency on `setLastReadPage`.

---

## 8. Home Card Behavior

### 8.1 Variant Selection

`src/components/home/HomeView.tsx` computes:

```ts
const hasLastRead =
  lastReadSurah !== null &&
  lastReadAyah !== null &&
  lastReadJuz !== null &&
  lastReadPage !== null &&
  lastReadAt !== null;
```

If `hasLastRead` is false, render:

```tsx
<GreetingCard variant="cold-start" onStart={handleStart} />
```

If `hasLastRead` is true, render:

```tsx
<GreetingCard
  variant="continue"
  surahName={surahNames.get(lastReadSurah) ?? fallbackName}
  ayahNumber={lastReadAyah}
  juzNumber={lastReadJuz}
  pageNumber={lastReadPage}
  lastReadAt={lastReadAt}
  streakDays={streakDays}
  streakAtRisk={streakAtRisk}
  onResume={handleResume}
/>
```

### 8.2 Cold-Start Card

Cold-start content:

| Element | English | Arabic |
|---|---|---|
| Label | Continue | تابع |
| Title | Begin with Al-Fatihah | ابدأ بسورة الفاتحة |
| Button | Start | ابدأ |

Button action:

- Route to `/surah/1`.

Cold-start must not render:

- Ayah title.
- Juz/page subtitle.
- Timestamp.
- Streak chip.
- Streak risk.

### 8.3 Continue Card

Continue content:

| Element | English example | Arabic example |
|---|---|---|
| Label | Continue | تابع |
| Title | Surah Al-Baqarah · Ayah 255 | سورة البقرة · الآية ﴿٢٥٥﴾ |
| Subtitle | Juz 3 · Page 42 | الجزء ٣ · صفحة ٤٢ |
| Timestamp | Last read just now | آخر قراءة الآن |
| Button | Resume | استأنف |
| Streak | 1 day streak | سلسلة ١ يوم |

Resume action:

- Route to `/surah/${lastReadSurah}`.

---

## 9. Streak Behavior

### 9.1 Transition Rules

| Previous state | New read date | Result |
|---|---|---|
| No previous streak | Any date | `streakDays = 1` |
| Same local date | Same day | Keep existing streak, minimum `1` |
| Consecutive local date | Next day | `streakDays + 1` |
| Skipped local date | More than one day later | `streakDays = 1` |

### 9.2 Risk Hint

Home computes:

```ts
const streakAtRisk =
  streakDays > 0 &&
  streakLastReadDate !== null &&
  streakLastReadDate !== todayLocalDateKey();
```

When true, the continue card replaces the passive streak chip with:

| English | Arabic |
|---|---|
| Read today to keep your streak | احفظ سلسلتك اليوم |

The hint is not shown in cold-start state.

---

## 10. Relative Time

Create `src/utils/formatRelativeTime.ts`.

Public contract:

```ts
export function formatRelativeTime(
  nowMs: number,
  thenMs: number,
  language: 'ar' | 'en'
): string;
```

English output:

| Delta | Output |
|---|---|
| `< 60s` | `just now` |
| `< 60m` | `5m ago` |
| `< 24h` | `3h ago` |
| `1d` | `yesterday` |
| `> 1d` | `4d ago` |

Arabic output:

| Delta | Output |
|---|---|
| `< 60s` | `الآن` |
| `< 60m` | `منذ ٥ د` |
| `< 24h` | `منذ ٣ س` |
| `1d` | `أمس` |
| `> 1d` | `منذ ٤ ي` |

Use `toArabicIndic` for Arabic numbers.

---

## 11. RTL And Visual Requirements

- Preserve the project rule for Arabic in forced RTL mode: `textAlign: 'left'` plus `writingDirection: 'rtl'`.
- Arabic card text should land on the physical right.
- Latin text should use `writingDirection: 'ltr'`.
- Arabic button arrow points left.
- English button arrow points right.
- The card keeps the existing teal gradient and soft gold glow.
- The cold-start branch should not feel visually empty; it keeps the same card shell and CTA rhythm.

---

## 12. Test Requirements

### 12.1 Store Tests

`src/stores/__tests__/readingStore.activity.test.ts`

- Full last-read position is cached.
- `lastReadAt` is stored as `Date.getTime()`.
- Reading activity does not mutate bookmarks.

`src/stores/__tests__/readingStore.streak.test.ts`

- First read starts at `1`.
- Same-day read does not increment.
- Consecutive day increments.
- Skipped day resets to `1`.

### 12.2 Repository Tests

`src/data/__tests__/quranRepository.juzPage.test.ts`

- Al-Baqarah 255 returns `{ juz: 3, page: 42 }`.
- Al-Fatihah 1 returns `{ juz: 1, page: 1 }`.
- Unknown ayah throws.

### 12.3 Utility Tests

`src/utils/__tests__/formatRelativeTime.test.ts`

- English compact relative times.
- Arabic compact relative times with Arabic-Indic digits.

---

## 13. Native Verification Requirements

This is a native app. Verify in the iOS simulator.

Required screenshots:

| Screenshot | Scenario |
|---|---|
| `/tmp/greeting-cold-start.png` | No complete last-read state |
| `/tmp/greeting-continue-surah.png` | Flowing reader writes last-read |
| `/tmp/greeting-continue-mushaf.png` | Mushaf reader writes last-read |
| `/tmp/greeting-ar.png` | Arabic RTL rendering |
| `/tmp/greeting-at-risk.png` | Stale streak risk hint |

Commands:

```bash
npm run ios
xcrun simctl io booted screenshot /tmp/greeting-cold-start.png
```

Do not use web verification for final signoff. Web differs in SQLite behavior, pager support, RTL text alignment, font metrics, and shadows.

---

## 14. Completion Criteria

- No source file contains `STREAK_PLACEHOLDER`.
- No Home greeting card path hardcodes Juz 3.
- No greeting card copy hardcodes Ayat al-Kursi.
- No reader progress path uses `setLastReadPage`.
- `npm test` passes.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- iOS simulator screenshots verify cold-start, continue, Arabic RTL, and streak risk states.
