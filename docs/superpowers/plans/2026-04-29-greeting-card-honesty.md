# Greeting Card Honesty Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Home greeting card truthful by replacing fabricated progress with real reading activity, a cold-start state, a last-read timestamp, and a streak risk hint.

**Architecture:** Deliver the feature as vertical slices. Each slice crosses persistence, repository lookup, reader events, Home UI, strings, tests, and native verification only as far as needed to ship one visible behavior. `readingStore` owns passive reading activity, `quranRepository` supplies Quran metadata, readers emit full last-read positions, and `GreetingCard` renders either cold-start or continue state from explicit props.

**Tech Stack:** React Native, Expo SDK 55, TypeScript, Zustand + MMKV, SQLite, Jest + `@testing-library/react-native`, NativeWind, expo-router.

**Spec:** `docs/superpowers/specs/2026-04-29-greeting-card-honesty.md`

---

## Vertical Slicing Rules

- Every task must produce a user-visible or directly verifiable behavior.
- Each slice may touch store, data, UI, strings, tests, and verification together when that is the smallest path to a coherent behavior.
- Do not build a complete lower layer and leave it invisible until a later task.
- Keep commits per slice so the branch can be reviewed behavior-by-behavior.
- Preserve bookmark semantics: passive reading activity must not create, rename, delete, or mutate `readingStore.bookmarks`.

---

## File Map

| File | First Slice | Responsibility |
|---|---:|---|
| `src/components/home/GreetingCard.tsx` | 1 | Render cold-start and continue variants from explicit props |
| `src/components/home/HomeView.tsx` | 1 | Choose card variant from persisted reading state; route Start/Resume |
| `src/constants/strings.ts` | 1 | Bilingual greeting labels, timestamp, juz/page, and streak-risk copy |
| `src/stores/readingStore.ts` | 2 | Persist full last-read position, timestamp, and streak state |
| `src/data/quranRepository.ts` | 2 | Lookup juz/page for a surah+ayah in one query |
| `src/components/quran/QuranReader.tsx` | 2 | Save full last-read position from scrolling text reader |
| `src/components/quran/MushafReader.tsx` | 2 | Save full last-read position from page reader |
| `src/utils/formatRelativeTime.ts` | 2 | Format compact AR/EN relative timestamps |
| `src/utils/__tests__/formatRelativeTime.test.ts` | 2 | Timestamp formatter tests |
| `src/stores/__tests__/readingStore.activity.test.ts` | 2 | Full-position and bookmark-preservation tests |
| `src/data/__tests__/quranRepository.juzPage.test.ts` | 2 | Repository lookup tests |
| `src/stores/__tests__/readingStore.streak.test.ts` | 3 | Habit-streak transition tests |

---

### Task 1: Cold-Start Home Shows A Start Card Instead Of Fake Progress

**Vertical behavior:** A new user with no reading activity sees a start-reading card. Home no longer fabricates Al-Baqarah 255, Juz 3, or a 27-day streak.

**Files:**
- Modify: `src/components/home/GreetingCard.tsx`
- Modify: `src/components/home/HomeView.tsx`
- Modify: `src/constants/strings.ts`

**Acceptance checks:**
- With `lastReadSurah === null`, Home renders `GreetingCard` with `variant="cold-start"`.
- Cold-start copy is `Begin with Al-Fatihah` / `ابدأ بسورة الفاتحة`.
- The primary button opens `/surah/1`.
- No Home file contains `STREAK_PLACEHOLDER`, `juzNumber={3}`, `Ayat al-Kursi`, or `Āyat al-Kursī`.

- [ ] **Step 1: Add cold-start strings**

Edit the Home section in `src/constants/strings.ts`.

Arabic block:

```ts
  greetingContinueLabel: 'تابع',
  greetingResume: 'استأنف',
  greetingStart: 'ابدأ',
  greetingBeginPrompt: 'ابدأ بسورة الفاتحة',
  greetingStreak: (n: number) => `سلسلة ${n} يوم`,
```

English block:

```ts
  greetingContinueLabel: 'Continue',
  greetingResume: 'Resume',
  greetingStart: 'Start',
  greetingBeginPrompt: 'Begin with Al-Fatihah',
  greetingStreak: (n: number) => `${n} day streak`,
```

- [ ] **Step 2: Convert `GreetingCard` to a cold-start capable contract**

In `src/components/home/GreetingCard.tsx`, replace the current `Props` interface with:

```ts
type ContinueProps = {
  variant: 'continue';
  surahName: string;
  ayahNumber: number;
  juzNumber: number;
  streakDays: number;
  onResume: () => void;
};

type ColdStartProps = {
  variant: 'cold-start';
  onStart: () => void;
};

type Props = ContinueProps | ColdStartProps;
```

Replace the function signature and the top-of-body derived values with:

```ts
export function GreetingCard(props: Props) {
  const theme = useTheme();
  const strings = useStrings();
  const isArabic = useSettingsStore((s) => s.language) === 'ar';
  const styles = createStyles(theme, isArabic);

  if (props.variant === 'cold-start') {
    return (
      <LinearGradient
        colors={[theme.palette.teal[700], theme.palette.teal[500], theme.palette.teal[500]]}
        locations={[0, 0.55, 1]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.card}
      >
        <CardGlow theme={theme} styles={styles} />
        <Text style={styles.label}>{strings.greetingContinueLabel}</Text>
        <Text style={styles.title}>{strings.greetingBeginPrompt}</Text>
        <View style={styles.cta}>
          <Pressable onPress={props.onStart} accessibilityRole="button" accessibilityLabel={strings.greetingStart}>
            {({ pressed }) => (
              <View style={[styles.btn, pressed && styles.btnPressed]}>
                <Svg width={12} height={12} viewBox="0 0 24 24" fill={theme.semantic.fgOnGold}>
                  <Path d={isArabic ? 'M16 5v14L5 12z' : 'M8 5v14l11-7z'} />
                </Svg>
                <Text style={styles.btnText}>{strings.greetingStart}</Text>
              </View>
            )}
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  const title = isArabic
    ? `سورة ${props.surahName} ‏· الآية ‏﴿${toArabicIndic(props.ayahNumber)}﴾`
    : `Surah ${props.surahName} · Ayah ${props.ayahNumber}`;
  const subtitle = isArabic
    ? `الجزء ${toArabicIndic(props.juzNumber)}`
    : `Juz ${props.juzNumber}`;
```

Add this helper below `GreetingCard` so the glow remains shared by both branches:

```tsx
function CardGlow({
  theme,
  styles,
}: {
  theme: ReturnType<typeof useTheme>;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Svg style={styles.glow} width={180} height={180} viewBox="0 0 180 180" pointerEvents="none">
      <Defs>
        <SvgRadialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor={theme.semantic.accentSoft} stopOpacity={0.18} />
          <Stop offset="60%" stopColor={theme.semantic.accentSoft} stopOpacity={0} />
        </SvgRadialGradient>
      </Defs>
      <Circle cx={90} cy={90} r={90} fill="url(#glowGrad)" />
    </Svg>
  );
}
```

In the continue branch JSX, replace the inline glow SVG with:

```tsx
      <CardGlow theme={theme} styles={styles} />
```

Also update remaining continue props from destructured variables to `props.surahName`, `props.streakDays`, and `props.onResume`.

- [ ] **Step 3: Wire HomeView to cold-start routing**

In `src/components/home/HomeView.tsx`, remove:

```ts
const STREAK_PLACEHOLDER = 27;
```

Add a start handler near `handleResume`:

```ts
  const handleStart = useCallback(() => {
    router.push('/surah/1');
  }, [router]);
```

Replace the greeting JSX with a cold-start-only branch for this slice:

```tsx
      {!hideGreeting && <GreetingCard variant="cold-start" onStart={handleStart} />}
```

Continue state returns in Task 2 only after the app can write a complete real position.

- [ ] **Step 4: Run type-check and placeholder scan**

Run:

```bash
npx tsc --noEmit
rg -n "STREAK_PLACEHOLDER|juzNumber=\\{3\\}|Ayat al-Kursi|Āyat al-Kursī" src/components/home src/constants/strings.ts
```

Expected:
- TypeScript passes.
- `rg` returns no matches.

- [ ] **Step 5: Native smoke verification**

Run:

```bash
npm run ios
xcrun simctl io booted screenshot /tmp/greeting-cold-start.png
```

Expected:
- Home card says `Begin with Al-Fatihah` / `ابدأ بسورة الفاتحة`.
- Button says `Start` / `ابدأ`.
- No streak number appears in cold-start state.
- Tapping the button opens Surah 1.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/GreetingCard.tsx src/components/home/HomeView.tsx src/constants/strings.ts
git commit -m "feat(home): show honest cold-start greeting card"
```

---

### Task 2: Continue Card Shows Real Last-Read Juz, Page, And Timestamp

**Vertical behavior:** After a user reads in either the flowing-text reader or the Mushaf reader, Home shows the real surah, ayah, juz, page, and relative last-read time for that position.

**Files:**
- Modify: `src/stores/readingStore.ts`
- Modify: `src/data/quranRepository.ts`
- Modify: `src/components/quran/QuranReader.tsx`
- Modify: `src/components/quran/MushafReader.tsx`
- Modify: `src/components/home/GreetingCard.tsx`
- Modify: `src/components/home/HomeView.tsx`
- Modify: `src/constants/strings.ts`
- Create: `src/utils/formatRelativeTime.ts`
- Test: `src/utils/__tests__/formatRelativeTime.test.ts`
- Test: `src/stores/__tests__/readingStore.activity.test.ts`
- Test: `src/data/__tests__/quranRepository.juzPage.test.ts`

**Acceptance checks:**
- `setLastRead` stores `surah`, `ayah`, `juz`, `page`, and `lastReadAt` in one update.
- `QuranReader` and `MushafReader` both call the new full-position update.
- Home continue card subtitle reads `Juz 3 · Page 42` / `الجزء ٣ · صفحة ٤٢` for Al-Baqarah 255.
- Home continue card shows `Last read just now` / `آخر قراءة الآن`.
- `setLastReadPage` is not used for reader progress anymore.

- [ ] **Step 1: Write reading activity tests**

Create `src/stores/__tests__/readingStore.activity.test.ts`:

```ts
import { useReadingStore } from '../readingStore';

function reset() {
  useReadingStore.setState({
    lastReadSurah: null,
    lastReadAyah: null,
    lastReadPage: null,
    lastReadJuz: null,
    lastReadAt: null,
    hasCompletedOnboarding: false,
    bookmarks: [],
  });
}

describe('readingStore activity', () => {
  beforeEach(reset);

  it('caches a full reading position transactionally', () => {
    const now = new Date('2026-04-29T12:00:00');

    useReadingStore.getState().setLastRead(2, 255, 3, 42, now);

    expect(useReadingStore.getState()).toMatchObject({
      lastReadSurah: 2,
      lastReadAyah: 255,
      lastReadJuz: 3,
      lastReadPage: 42,
      lastReadAt: now.getTime(),
    });
  });

  it('does not create or mutate bookmarks when reading activity changes', () => {
    useReadingStore.getState().addBookmark(18, 10);
    const before = useReadingStore.getState().bookmarks;

    useReadingStore.getState().setLastRead(2, 255, 3, 42, new Date('2026-04-29T12:00:00'));

    expect(useReadingStore.getState().bookmarks).toEqual(before);
  });
});
```

- [ ] **Step 2: Write repository lookup tests**

Create `src/data/__tests__/quranRepository.juzPage.test.ts`:

```ts
import { getJuzAndPageForAyah } from '../quranRepository';

describe('getJuzAndPageForAyah', () => {
  it('returns juz 3 page 42 for Al-Baqarah 255', async () => {
    await expect(getJuzAndPageForAyah(2, 255)).resolves.toEqual({ juz: 3, page: 42 });
  });

  it('returns juz 1 page 1 for Al-Fatihah 1', async () => {
    await expect(getJuzAndPageForAyah(1, 1)).resolves.toEqual({ juz: 1, page: 1 });
  });

  it('throws for an unknown ayah', async () => {
    await expect(getJuzAndPageForAyah(1, 999)).rejects.toThrow(/no juz\/page/i);
  });
});
```

- [ ] **Step 3: Write relative-time tests**

Create `src/utils/__tests__/formatRelativeTime.test.ts`:

```ts
import { formatRelativeTime } from '../formatRelativeTime';

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const NOW = new Date('2026-04-29T12:00:00').getTime();

describe('formatRelativeTime', () => {
  it('formats English compact relative time', () => {
    expect(formatRelativeTime(NOW, NOW - 30_000, 'en')).toBe('just now');
    expect(formatRelativeTime(NOW, NOW - 5 * minute, 'en')).toBe('5m ago');
    expect(formatRelativeTime(NOW, NOW - 3 * hour, 'en')).toBe('3h ago');
    expect(formatRelativeTime(NOW, NOW - day, 'en')).toBe('yesterday');
    expect(formatRelativeTime(NOW, NOW - 4 * day, 'en')).toBe('4d ago');
  });

  it('formats Arabic compact relative time with Arabic-Indic digits', () => {
    expect(formatRelativeTime(NOW, NOW - 30_000, 'ar')).toBe('الآن');
    expect(formatRelativeTime(NOW, NOW - 5 * minute, 'ar')).toBe('منذ ٥ د');
    expect(formatRelativeTime(NOW, NOW - 3 * hour, 'ar')).toBe('منذ ٣ س');
    expect(formatRelativeTime(NOW, NOW - day, 'ar')).toBe('أمس');
    expect(formatRelativeTime(NOW, NOW - 4 * day, 'ar')).toBe('منذ ٤ ي');
  });
});
```

- [ ] **Step 4: Run tests to confirm the slice starts red**

Run:

```bash
npm test -- --testPathPattern="readingStore.activity|quranRepository.juzPage|formatRelativeTime"
```

Expected:
- Tests fail because `lastReadJuz`, `lastReadAt`, `getJuzAndPageForAyah`, and `formatRelativeTime` do not exist yet.

- [ ] **Step 5: Extend `readingStore` to store full position**

In `src/stores/readingStore.ts`, replace the relevant `ReadingState` fields and signatures:

```ts
interface ReadingState {
  lastReadSurah: number | null;
  lastReadAyah: number | null;
  lastReadPage: number | null;
  lastReadJuz: number | null;
  lastReadAt: number | null;
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
}
```

Replace the initial state and progress methods with:

```ts
      lastReadSurah: null,
      lastReadAyah: null,
      lastReadPage: null,
      lastReadJuz: null,
      lastReadAt: null,
      hasCompletedOnboarding: false,
      bookmarks: [],
      setLastRead: (surah, ayah, juz, page, now = new Date()) =>
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadAt: now.getTime(),
        }),
```

Remove `setLastReadPage` from the interface and store object.

- [ ] **Step 6: Add the repository helper**

In `src/data/quranRepository.ts`, add near `getPageForAyah`:

```ts
export async function getJuzAndPageForAyah(
  surahNumber: number,
  ayahNumber: number
): Promise<{ juz: number; page: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ juz_number: number; page_number: number }>(
    'SELECT juz_number, page_number FROM ayahs WHERE surah_number = ? AND ayah_number = ?',
    [surahNumber, ayahNumber]
  );
  if (!row) throw new Error(`No juz/page found for surah ${surahNumber}, ayah ${ayahNumber}`);
  return { juz: row.juz_number, page: row.page_number };
}
```

- [ ] **Step 7: Add the relative-time utility**

Create `src/utils/formatRelativeTime.ts`:

```ts
import { toArabicIndic } from './arabic';

export function formatRelativeTime(
  nowMs: number,
  thenMs: number,
  language: 'ar' | 'en'
): string {
  const diff = Math.max(0, nowMs - thenMs);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (language === 'ar') {
    if (seconds < 60) return 'الآن';
    if (minutes < 60) return `منذ ${toArabicIndic(minutes)} د`;
    if (hours < 24) return `منذ ${toArabicIndic(hours)} س`;
    if (days === 1) return 'أمس';
    return `منذ ${toArabicIndic(days)} ي`;
  }

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}
```

- [ ] **Step 8: Wire both readers to the full-position update**

In `src/components/quran/QuranReader.tsx`, add:

```ts
import { getJuzAndPageForAyah } from '../../data/quranRepository';
```

Replace `setLastRead(surahNumber, closestAyah);` with:

```ts
        getJuzAndPageForAyah(surahNumber, closestAyah)
          .then(({ juz, page }) => setLastRead(surahNumber, closestAyah, juz, page))
          .catch(() => undefined);
```

In `src/components/quran/MushafReader.tsx`, replace:

```ts
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);
```

with:

```ts
  const setLastRead = useReadingStore((s) => s.setLastRead);
```

Update the existing import to include `getJuzAndPageForAyah`:

```ts
import {
  getJuzAndPageForAyah,
  getPageForAyah,
  getSurahLastAyah,
  getTopAyahForPage,
} from '../../data/quranRepository';
```

Inside `applyPageChange`, replace `setLastReadPage(pageNumber);` with:

```ts
      getTopAyahForPage(pageNumber)
        .then(({ surahNumber, ayahNumber }) =>
          getJuzAndPageForAyah(surahNumber, ayahNumber).then(({ juz }) =>
            setLastRead(surahNumber, ayahNumber, juz, pageNumber)
          )
        )
        .catch(() => undefined);
```

Update the dependency array from `[setLastReadPage, onPageChange]` to:

```ts
    [setLastRead, onPageChange]
```

- [ ] **Step 9: Add continue-card strings and timestamp UI**

In `src/constants/strings.ts`, add:

```ts
  greetingJuzPage: (juz: string, page: string) => `الجزء ${juz} · صفحة ${page}`,
  greetingLastReadAgo: (rel: string) => `آخر قراءة ${rel}`,
```

and:

```ts
  greetingJuzPage: (juz: number, page: number) => `Juz ${juz} · Page ${page}`,
  greetingLastReadAgo: (rel: string) => `Last read ${rel}`,
```

In `src/components/home/GreetingCard.tsx`, extend `ContinueProps`:

```ts
  pageNumber: number;
  lastReadAt: number;
```

Import the formatter:

```ts
import { formatRelativeTime } from '../../utils/formatRelativeTime';
```

Replace the continue `subtitle` expression with:

```ts
  const subtitle = isArabic
    ? strings.greetingJuzPage(toArabicIndic(props.juzNumber), toArabicIndic(props.pageNumber))
    : strings.greetingJuzPage(props.juzNumber, props.pageNumber);
  const relative = formatRelativeTime(Date.now(), props.lastReadAt, isArabic ? 'ar' : 'en');
```

Add the timestamp below the subtitle:

```tsx
      <Text style={styles.timestamp}>{strings.greetingLastReadAgo(relative)}</Text>
```

Add this style:

```ts
    timestamp: {
      fontFamily: theme.fonts.latin,
      fontSize: 11,
      color: theme.palette.paper[50],
      opacity: 0.6,
      marginTop: 4,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
```

- [ ] **Step 10: Wire HomeView continue state to real fields**

In `src/components/home/HomeView.tsx`, add selectors:

```ts
  const lastReadJuz = useReadingStore((s) => s.lastReadJuz);
  const lastReadPage = useReadingStore((s) => s.lastReadPage);
  const lastReadAt = useReadingStore((s) => s.lastReadAt);
```

Add this derived value before the return:

```ts
  const hasLastRead =
    lastReadSurah !== null &&
    lastReadAyah !== null &&
    lastReadJuz !== null &&
    lastReadPage !== null &&
    lastReadAt !== null;
```

Replace the greeting block with:

```tsx
      {!hideGreeting && (
        hasLastRead ? (
          <GreetingCard
            variant="continue"
            surahName={surahNames.get(lastReadSurah) ?? (isArabic ? 'الفاتحة' : 'Al-Fatihah')}
            ayahNumber={lastReadAyah}
            juzNumber={lastReadJuz}
            pageNumber={lastReadPage}
            lastReadAt={lastReadAt}
            streakDays={0}
            onResume={handleResume}
          />
        ) : (
          <GreetingCard variant="cold-start" onStart={handleStart} />
        )
      )}
```

- [ ] **Step 11: Run slice tests and static checks**

Run:

```bash
npm test -- --testPathPattern="readingStore.activity|quranRepository.juzPage|formatRelativeTime"
npx tsc --noEmit
rg -n "setLastReadPage|juzNumber=\\{3\\}|Ayat al-Kursi|Āyat al-Kursī" src
```

Expected:
- The targeted tests pass.
- TypeScript passes.
- `rg` finds no matches.

- [ ] **Step 12: Native verification**

Run:

```bash
npm run ios
xcrun simctl io booted screenshot /tmp/greeting-continue.png
```

Expected:
- Scroll in a Surah or swipe in the Mushaf reader, return Home, and see the real position.
- Al-Baqarah 255 displays `Juz 3 · Page 42` / `الجزء ٣ · صفحة ٤٢`.
- Timestamp appears under the subtitle.
- Resume still opens the last-read Surah route.

- [ ] **Step 13: Commit**

```bash
git add src/stores/readingStore.ts src/data/quranRepository.ts src/components/quran/QuranReader.tsx src/components/quran/MushafReader.tsx src/components/home/GreetingCard.tsx src/components/home/HomeView.tsx src/constants/strings.ts src/utils/formatRelativeTime.ts src/utils/__tests__/formatRelativeTime.test.ts src/stores/__tests__/readingStore.activity.test.ts src/data/__tests__/quranRepository.juzPage.test.ts
git commit -m "feat(home): show real last-read position in greeting card"
```

---

### Task 3: Streak Signal Reflects Reading Habit Risk

**Vertical behavior:** Reading today starts or preserves the streak. Reading on a consecutive local day increments it. Returning to Home on a later local day replaces the passive streak chip with an active risk hint until the user reads again.

**Files:**
- Modify: `src/stores/readingStore.ts`
- Modify: `src/components/home/GreetingCard.tsx`
- Modify: `src/components/home/HomeView.tsx`
- Modify: `src/constants/strings.ts`
- Test: `src/stores/__tests__/readingStore.streak.test.ts`

**Acceptance checks:**
- First read sets `streakDays` to `1`.
- Same-day reading does not increment the streak.
- Consecutive local-day reading increments the streak.
- Skipping a local day resets the next read to `1`.
- Home shows a risk hint when `streakLastReadDate` is before today.

- [ ] **Step 1: Write streak tests**

Create `src/stores/__tests__/readingStore.streak.test.ts`:

```ts
import { useReadingStore } from '../readingStore';

function reset() {
  useReadingStore.setState({
    lastReadSurah: null,
    lastReadAyah: null,
    lastReadPage: null,
    lastReadJuz: null,
    lastReadAt: null,
    streakDays: 0,
    streakLastReadDate: null,
    hasCompletedOnboarding: false,
    bookmarks: [],
  });
}

const day = (iso: string) => new Date(`${iso}T12:00:00`);

describe('readingStore streak', () => {
  beforeEach(reset);

  it('starts at 1 on first read', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));

    expect(useReadingStore.getState()).toMatchObject({
      streakDays: 1,
      streakLastReadDate: '2026-04-29',
    });
  });

  it('does not increment on same-day re-read', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 256, 3, 42, day('2026-04-29'));

    expect(useReadingStore.getState().streakDays).toBe(1);
  });

  it('increments on a consecutive local day', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 260, 3, 42, day('2026-04-30'));

    expect(useReadingStore.getState().streakDays).toBe(2);
  });

  it('resets after a skipped local day', () => {
    useReadingStore.getState().setLastRead(2, 255, 3, 42, day('2026-04-29'));
    useReadingStore.getState().setLastRead(2, 260, 3, 42, day('2026-05-01'));

    expect(useReadingStore.getState().streakDays).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm red**

Run:

```bash
npm test -- --testPathPattern="readingStore.streak"
```

Expected:
- Tests fail because streak fields and date logic do not exist yet.

- [ ] **Step 3: Add local-date streak logic to `readingStore`**

In `src/stores/readingStore.ts`, add fields to the interface:

```ts
  streakDays: number;
  streakLastReadDate: string | null;
```

Add helpers above `useReadingStore`:

```ts
function localDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function nextStreak(previousDays: number, previousDate: string | null, today: string): number {
  if (previousDate === today) return previousDays || 1;
  if (previousDate === null) return 1;

  const previousMs = new Date(`${previousDate}T00:00:00`).getTime();
  const todayMs = new Date(`${today}T00:00:00`).getTime();
  const diffDays = Math.round((todayMs - previousMs) / 86_400_000);

  return diffDays === 1 ? previousDays + 1 : 1;
}
```

Add initial state:

```ts
      streakDays: 0,
      streakLastReadDate: null,
```

Replace `setLastRead` with:

```ts
      setLastRead: (surah, ayah, juz, page, now = new Date()) => {
        const today = localDateKey(now);
        const { streakDays, streakLastReadDate } = get();
        set({
          lastReadSurah: surah,
          lastReadAyah: ayah,
          lastReadJuz: juz,
          lastReadPage: page,
          lastReadAt: now.getTime(),
          streakDays: nextStreak(streakDays, streakLastReadDate, today),
          streakLastReadDate: today,
        });
      },
```

- [ ] **Step 4: Add streak-risk strings and card prop**

In `src/constants/strings.ts`, add:

```ts
  greetingStreakAtRisk: 'احفظ سلسلتك اليوم',
```

and:

```ts
  greetingStreakAtRisk: 'Read today to keep your streak',
```

In `src/components/home/GreetingCard.tsx`, add to `ContinueProps`:

```ts
  streakAtRisk: boolean;
```

Replace the streak JSX with:

```tsx
        {props.streakAtRisk ? (
          <Text style={styles.streakRisk}>{strings.greetingStreakAtRisk}</Text>
        ) : isArabic ? (
          <Text style={styles.streakLabel}>{strings.greetingStreak(props.streakDays)}</Text>
        ) : (
          <View style={styles.streak}>
            <Text style={styles.streakNum}>{props.streakDays}</Text>
            <Text style={styles.streakLabel}>day streak</Text>
          </View>
        )}
```

Add this style:

```ts
    streakRisk: {
      fontFamily: isArabic ? theme.fonts.quran : theme.fonts.latin,
      fontSize: 12,
      fontWeight: isArabic ? 'normal' : '700',
      color: theme.semantic.accent,
      textAlign: 'left',
      writingDirection: isArabic ? 'rtl' : 'ltr',
    },
```

- [ ] **Step 5: Compute risk in HomeView**

In `src/components/home/HomeView.tsx`, add selectors:

```ts
  const streakDays = useReadingStore((s) => s.streakDays);
  const streakLastReadDate = useReadingStore((s) => s.streakLastReadDate);
```

Add this helper in the module, above `HomeView`:

```ts
function todayLocalDateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
```

Add this derived value before the return:

```ts
  const streakAtRisk =
    streakDays > 0 &&
    streakLastReadDate !== null &&
    streakLastReadDate !== todayLocalDateKey();
```

Pass real streak props:

```tsx
            streakDays={streakDays}
            streakAtRisk={streakAtRisk}
```

- [ ] **Step 6: Run slice tests and static checks**

Run:

```bash
npm test -- --testPathPattern="readingStore.streak|readingStore.activity"
npx tsc --noEmit
```

Expected:
- Streak and activity tests pass.
- TypeScript passes.

- [ ] **Step 7: Native verification**

Run:

```bash
npm run ios
xcrun simctl io booted screenshot /tmp/greeting-streak.png
```

Expected:
- After reading once today, Home shows `1 day streak` / `سلسلة ١ يوم`.
- Manually set `streakLastReadDate` to yesterday in dev state, reload Home, and the streak chip is replaced by `Read today to keep your streak` / `احفظ سلسلتك اليوم`.
- Remove any dev-only state mutation before committing.

- [ ] **Step 8: Commit**

```bash
git add src/stores/readingStore.ts src/components/home/GreetingCard.tsx src/components/home/HomeView.tsx src/constants/strings.ts src/stores/__tests__/readingStore.streak.test.ts
git commit -m "feat(home): surface streak risk in greeting card"
```

---

### Task 4: End-To-End Native Verification And Regression Cleanup

**Vertical behavior:** The feature is verified as a native mobile workflow across cold-start, flowing reader, Mushaf reader, English, Arabic RTL, and stale-streak states.

**Files:**
- Modify only files already touched in Tasks 1-3 if verification exposes layout or behavior defects.

**Acceptance checks:**
- `npm test` passes.
- `npx tsc --noEmit` passes.
- `npm run lint` passes.
- iOS simulator screenshots exist for cold-start, continue, Arabic RTL, and streak-risk states.
- Search confirms no fake greeting-card data remains.

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
npm test
npx tsc --noEmit
npm run lint
```

Expected:
- All commands complete successfully.

- [ ] **Step 2: Run fake-data and old-API scans**

Run:

```bash
rg -n "STREAK_PLACEHOLDER|juzNumber=\\{3\\}|Ayat al-Kursi|Āyat al-Kursī|setLastReadPage" src
```

Expected:
- No matches.

- [ ] **Step 3: Verify cold-start on iOS**

Run:

```bash
npm run ios
xcrun simctl io booted screenshot /tmp/greeting-cold-start.png
```

Expected:
- New install or cleared reading store shows the cold-start card.
- The card has no fabricated ayah, juz, page, timestamp, or streak.
- Start opens `/surah/1`.

- [ ] **Step 4: Verify continue from flowing reader**

In the iOS simulator, open a Surah route and scroll until the debounced last-read update fires. Return Home and capture:

```bash
xcrun simctl io booted screenshot /tmp/greeting-continue-surah.png
```

Expected:
- Home shows the same surah/ayah that the flowing reader saved.
- Juz/page line is derived from `ayahs`.
- Timestamp appears below the subtitle.

- [ ] **Step 5: Verify continue from Mushaf reader**

Swipe to a different Mushaf page, return Home, and capture:

```bash
xcrun simctl io booted screenshot /tmp/greeting-continue-mushaf.png
```

Expected:
- Home shows the top ayah for the page.
- Page number matches the swiped Mushaf page.
- Resume still opens the last-read Surah.

- [ ] **Step 6: Verify Arabic RTL**

Switch language to Arabic in Settings, return Home, and capture:

```bash
xcrun simctl io booted screenshot /tmp/greeting-ar.png
```

Expected:
- Arabic text lands on the physical right using the project RTL rule.
- Juz/page digits are Arabic-Indic.
- Resume/Start button arrow points left in Arabic.

- [ ] **Step 7: Verify stale streak risk**

Temporarily set `streakDays` to `3` and `streakLastReadDate` to yesterday in dev state, reload Home, and capture:

```bash
xcrun simctl io booted screenshot /tmp/greeting-at-risk.png
```

Expected:
- The passive streak chip is replaced by the risk hint.
- After reading again, the card returns to the normal streak state.
- No dev-only mutation remains in source.

- [ ] **Step 8: Commit verification fixes if needed**

If verification required source tweaks, run:

```bash
git add src/components/home/GreetingCard.tsx src/components/home/HomeView.tsx src/stores/readingStore.ts src/data/quranRepository.ts src/components/quran/QuranReader.tsx src/components/quran/MushafReader.tsx src/constants/strings.ts src/utils/formatRelativeTime.ts
git commit -m "fix(home): polish greeting card verification issues"
```

If no source tweaks were needed, skip this commit.

---

## Self-Review Checklist

- [ ] The plan links to `docs/superpowers/specs/2026-04-29-greeting-card-honesty.md`.
- [ ] Each task delivers a visible or directly verifiable behavior.
- [ ] No task is only "store layer", "data layer", or "UI layer".
- [ ] Cold-start removes fake Home progress before the continue behavior is built.
- [ ] Full last-read state is saved from both `QuranReader` and `MushafReader`.
- [ ] Bookmark behavior is explicitly protected by tests.
- [ ] Streak behavior is tested separately from full-position persistence.
- [ ] Arabic RTL and iOS simulator verification are included.
- [ ] The final scans catch old fake data and removed APIs.
