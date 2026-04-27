# Recitation Audio Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement recitation audio playback as a sequence of user-visible vertical slices: each slice crosses data, engine, UI, and verification boundaries.

**Architecture:** Build the first slice as a complete popup-to-audio-to-mini-player flow, then add adjacent behaviors without leaving orphaned lower layers. The engine owns playback state and native audio, stores expose UI state, WebView highlight is one-way from the engine, and UI components stay render-focused.

**Tech Stack:** Expo SDK 55, React Native 0.83, TypeScript, Zustand, MMKV, `react-native-track-player`, `expo-file-system`, `react-native-webview`, Jest.

**Spec:** `docs/superpowers/specs/2026-04-27-recitation-design.md`

---

## Vertical Slicing Rules

- Every task must deliver a behavior that can be tested from a user entry point or a native/manual verification point.
- It is acceptable for a slice to introduce multiple files across layers when the result is a coherent user behavior.
- Do not create a full service layer in one task and leave it invisible until a later task.
- Each task ends with tests, a manual verification note, and a commit.
- Keep commits per slice. Do not batch multiple slices into one commit.

---

## File Map

| File | First Slice | Responsibility |
|---|---:|---|
| `package.json`, `package-lock.json` | 1 | Add direct playback/filesystem dependencies |
| `app.json` | 7 | Configure native background audio metadata |
| `src/data/reciters.ts` | 1 | Static reciter catalog and defaults |
| `src/data/quranRepository.ts` | 1 | Add `getSurahLastAyah`; Task 2 adds `getTopAyahForPage` |
| `src/services/everyAyahProvider.ts` | 1 | Build verified EveryAyah URLs |
| `src/services/ayahAudioCache.ts` | 1 | Persistent audio lookup/download path |
| `src/services/audioAdapter.ts` | 1 | Track-player wrapper and native remote event bridge |
| `src/services/recitationEngine.ts` | 1 | Playback state machine and WebView highlight dispatch |
| `src/stores/recitationStore.ts` | 1 | Ephemeral session state for UI |
| `src/stores/reciterStore.ts` | 5 | Persistent selected reciter and download state |
| `src/components/quran/MiniPlayerBar.tsx` | 1 | Persistent playback bar above toolbar |
| `src/components/quran/MushafBottomToolbar.tsx` | 2 | Bottom toolbar with playback entry point |
| `src/components/quran/PlayerSheet.tsx` | 4 | Expanded playback controls |
| `src/components/quran/ReciterPickerSheet.tsx` | 5 | Reciter selection UI |
| `src/components/quran/MushafReader.tsx` | 1 | Mount mini-player and toolbar; pass active page context |
| `src/components/quran/MushafPage.tsx` | 3 | Register active WebView for highlight |
| `src/components/quran/mushafHtml.ts` | 3 | Add `.playing` highlight protocol |
| `src/actions/ayahActions.ts` | 1 | Popup `play` entry point |
| `src/app/(tabs)/settings.tsx` | 5 | Reciter and saved recitations settings |
| `src/constants/strings.ts` | 1 | Recitation string namespace |
| `src/services/__tests__/recitationEngine.test.ts` | 1 | Engine behavior tests |
| `src/services/__tests__/everyAyahProvider.test.ts` | 1 | URL construction tests |
| `src/services/__tests__/ayahAudioCache.test.ts` | 1 | Persistent audio file tests |
| `src/stores/__tests__/reciterStore.test.ts` | 5 | Persistence/download lifecycle tests |

---

### Task 1: Popup Play Starts Real Audio And Shows Mini-Player

**Vertical behavior:** User selects an ayah, taps `تشغيل`, audio starts for that ayah, and a mini-player appears with loading/playing/paused/error state.

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/actions/ayahActions.ts`
- Modify: `src/components/quran/MushafReader.tsx`
- Modify: `src/constants/strings.ts`
- Modify: `src/data/quranRepository.ts`
- Create: `src/data/reciters.ts`
- Create: `src/services/everyAyahProvider.ts`
- Create: `src/services/ayahAudioCache.ts`
- Create: `src/services/audioAdapter.ts`
- Create: `src/services/recitationEngine.ts`
- Create: `src/stores/recitationStore.ts`
- Create: `src/components/quran/MiniPlayerBar.tsx`
- Test: `src/services/__tests__/everyAyahProvider.test.ts`
- Test: `src/services/__tests__/ayahAudioCache.test.ts`
- Test: `src/services/__tests__/recitationEngine.test.ts`

**Acceptance checks:**
- Popup `تشغيل` calls `recitationEngine.start` with `startSurah`, `startAyah`, and `stopAyah`.
- EveryAyah URL for Al-Fatiha ayah 1 is `https://everyayah.com/data/Husary_128kbps/001001.mp3`.
- Audio is stored under `FileSystem.documentDirectory/recitation/{reciterId}/{surah:03}/{ayah:03}.mp3`.
- Mini-player appears above the reader controls when state is not `idle`.
- Engine can enter `loading`, `playing`, `paused`, `error`, and `idle`.

- [x] **Step 1: Install native dependencies**

Run:

```bash
npx expo install expo-file-system
npm install react-native-track-player
```

Expected:
- `expo-file-system` is a direct dependency in `package.json`.
- `react-native-track-player` is a dependency in `package.json`.

- [x] **Step 2: Write provider tests**

Create `src/services/__tests__/everyAyahProvider.test.ts`:

```ts
import { urlForAyah } from '../everyAyahProvider';

describe('urlForAyah', () => {
  it('builds a flat EveryAyah ayah URL with padded surah and ayah', () => {
    expect(urlForAyah('Husary_128kbps', 1, 1)).toBe(
      'https://everyayah.com/data/Husary_128kbps/001001.mp3'
    );
  });

  it('does not allow ayah zero', () => {
    expect(() => urlForAyah('Husary_128kbps', 1, 0)).toThrow('ayah must be between 1 and 286');
  });
});
```

- [x] **Step 3: Implement reciter catalog and provider**

Create `src/data/reciters.ts` with the verified five-reciter catalog from the design. Create `src/services/everyAyahProvider.ts` with:

```ts
const EVERY_AYAH_BASE_URL = 'https://everyayah.com/data';

export function urlForAyah(reciterId: string, surah: number, ayah: number): string {
  if (surah < 1 || surah > 114) throw new Error('surah must be between 1 and 114');
  if (ayah < 1 || ayah > 286) throw new Error('ayah must be between 1 and 286');
  const file = `${String(surah).padStart(3, '0')}${String(ayah).padStart(3, '0')}.mp3`;
  return `${EVERY_AYAH_BASE_URL}/${reciterId}/${file}`;
}
```

- [x] **Step 4: Add repository helpers**

Modify `src/data/quranRepository.ts`:

```ts
export async function getSurahLastAyah(surahNumber: number): Promise<number> {
  const surah = await getSurahByNumber(surahNumber);
  if (!surah) throw new Error(`Surah ${surahNumber} not found`);
  return surah.ayahCount;
}
```

- [x] **Step 5: Write engine happy-path test**

Create `src/services/__tests__/recitationEngine.test.ts` with a mocked adapter/cache and the first visible behavior:

```ts
import { createRecitationEngineForTest } from '../recitationEngine';

describe('recitationEngine popup start', () => {
  it('loads the selected ayah and enters playing state', async () => {
    const events: string[] = [];
    const adapter = {
      load: jest.fn(async () => events.push('load')),
      play: jest.fn(async () => events.push('play')),
      pause: jest.fn(),
      stop: jest.fn(),
      seek: jest.fn(),
      setSpeed: jest.fn(),
    };
    const cache = {
      getLocalPath: jest.fn(async () => 'file:///recitation/Husary_128kbps/001/001.mp3'),
    };
    const engine = createRecitationEngineForTest({ adapter, cache });

    await engine.start({ surah: 1, startAyah: 1, stopAyah: 7, trigger: 'popup' });

    expect(cache.getLocalPath).toHaveBeenCalledWith('Husary_128kbps', 1, 1, expect.any(AbortSignal));
    expect(adapter.load).toHaveBeenCalled();
    expect(adapter.play).toHaveBeenCalled();
    expect(engine.getSnapshot()).toMatchObject({ state: 'playing', currentAyah: 1 });
    expect(events).toEqual(['load', 'play']);
  });
});
```

- [x] **Step 6: Implement recitation store and engine minimum**

Create `src/stores/recitationStore.ts` with `PlaybackState`, `PlaybackRange`, `PlaybackMode`, and a Zustand store matching the design. Create `src/services/recitationEngine.ts` with:
- singleton export `recitationEngine`
- test factory `createRecitationEngineForTest`
- methods `start`, `pause`, `resume`, `stop`, `retry`, `seek`, `next`, `prev`, `setMode`, `setSpeed`, `setReciter`, `registerActivePageWebView`
- `loadToken` stale callback protection
- current default reciter `Husary_128kbps`

- [x] **Step 7: Implement audio adapter and cache minimum**

Create `src/services/ayahAudioCache.ts` with `getLocalPath(reciterId, surah, ayah, signal)`. Use `FileSystem.documentDirectory`, nested local layout, in-flight promise dedup, non-zero-size validation, and EveryAyah URL construction.

Create `src/services/audioAdapter.ts` with a thin Track Player wrapper:
- `setup()`
- `load({ uri, title, artist, artwork })`
- `play()`
- `pause()`
- `stop()`
- `seek(seconds)`
- `setSpeed(speed)`

- [x] **Step 8: Wire popup play**

Modify `src/actions/ayahActions.ts` so `play` awaits `getSurahLastAyah(startSurah)` and calls:

```ts
recitationEngine.start({
  surah: startSurah,
  startAyah,
  stopAyah,
  trigger: 'popup',
  selectedEndSurah: endSurah,
  selectedEndAyah: endAyah,
});
```

- [x] **Step 9: Add mini-player**

Create `src/components/quran/MiniPlayerBar.tsx`:
- render nothing when `state === 'idle'`
- show play/pause, stop, current ayah label, reciter avatar
- call `recitationEngine.pause`, `resume`, and `stop`
- show per-ayah progress width from `positionSeconds / durationSeconds`
- show error copy when `state === 'error'`

Mount it in `src/components/quran/MushafReader.tsx` above the future toolbar area so the popup slice has visible feedback.

- [x] **Step 10: Run tests**

Run:

```bash
npm test -- src/services/__tests__/everyAyahProvider.test.ts src/services/__tests__/ayahAudioCache.test.ts src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 11: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Select ayah 1 on Al-Fatiha.
- Tap `تشغيل`.
- Mini-player appears and audio starts or enters a clear recoverable error state if simulator networking/audio setup fails.

Note: not run in this worktree because no native `ios/` project is generated; automated Jest and TypeScript checks passed for the slice.

- [x] **Step 12: Commit**

```bash
git add package.json package-lock.json src/actions/ayahActions.ts src/components/quran/MushafReader.tsx src/components/quran/MiniPlayerBar.tsx src/constants/strings.ts src/data/quranRepository.ts src/data/reciters.ts src/services src/stores/recitationStore.ts
git commit -m "feat(recitation): play selected ayah with mini player"
```

---

### Task 2: Toolbar Play Starts Current Page Recitation

**Vertical behavior:** User can tap the bottom toolbar play button without selecting an ayah; playback starts from the visually topmost ayah on the current page and mini-player updates.

**Files:**
- Modify: `src/data/quranRepository.ts`
- Modify: `src/components/quran/MushafReader.tsx`
- Modify: `src/components/quran/MushafScreenLayout.tsx`
- Create: `src/components/quran/MushafBottomToolbar.tsx`
- Test: `src/data/__tests__/quranRepository.recitation.test.ts`

**Acceptance checks:**
- `getTopAyahForPage(pageNumber)` returns the first distinct ayah ordered by `line_number, id`.
- Toolbar play is a no-op while playing, resumes when paused, and starts a new page-based session when idle/error.
- The green mic remains non-audio and does not call `recitationEngine.start`.
- Toolbar and mini-player do not overlap `PageIndicator`.

- [x] **Step 1: Write repository test**

Create `src/data/__tests__/quranRepository.recitation.test.ts` and mock the database query to verify `getTopAyahForPage(2)` returns the first ordered row.

- [x] **Step 2: Implement `getTopAyahForPage`**

Add to `src/data/quranRepository.ts`:

```ts
export async function getTopAyahForPage(pageNumber: number): Promise<{ surahNumber: number; ayahNumber: number }> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ surah_number: number; ayah_number: number }>(
    `SELECT surah_number, ayah_number
     FROM mushaf_words
     WHERE page_number = ?
     GROUP BY surah_number, ayah_number
     ORDER BY MIN(line_number), MIN(id)
     LIMIT 1`,
    [pageNumber]
  );
  if (!row) throw new Error(`No ayah found for page ${pageNumber}`);
  return { surahNumber: row.surah_number, ayahNumber: row.ayah_number };
}
```

- [x] **Step 3: Create toolbar component**

Create `src/components/quran/MushafBottomToolbar.tsx` with RTL slots:
- info
- list/menu
- centered green mic
- playback
- bookmark

The playback button receives `onPlayPress` and reads `recitationStore.state` to choose icon state.

- [x] **Step 4: Wire toolbar to page playback**

Modify `MushafReader` to track `currentPage`, render `MushafBottomToolbar`, and call:

```ts
const topAyah = await getTopAyahForPage(currentPage);
const stopAyah = await getSurahLastAyah(topAyah.surahNumber);
await recitationEngine.start({
  surah: topAyah.surahNumber,
  startAyah: topAyah.ayahNumber,
  stopAyah,
  trigger: 'toolbar',
});
```

- [x] **Step 5: Run tests**

Run:

```bash
npm test -- src/data/__tests__/quranRepository.recitation.test.ts src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Open any Mushaf page.
- Tap toolbar play.
- Mini-player starts from the first visible ayah on that page.
- Tap toolbar play while playing and confirm no duplicate session starts.
- Pause from mini-player, then tap toolbar play and confirm it resumes.

Note: not run in this worktree because no native `ios/` project is generated; automated Jest and TypeScript checks passed for the slice.

- [x] **Step 7: Commit**

```bash
git add src/data/quranRepository.ts src/data/__tests__/quranRepository.recitation.test.ts src/components/quran/MushafBottomToolbar.tsx src/components/quran/MushafReader.tsx src/components/quran/MushafScreenLayout.tsx
git commit -m "feat(recitation): start page playback from toolbar"
```

---

### Task 3: Playback Highlight Follows Current Ayah Across Page Flips

**Vertical behavior:** While audio plays, the current ayah receives `.playing` styling in the active WebView; swiping pages does not stop audio and highlights only if the playing ayah exists on the new page.

**Files:**
- Modify: `src/components/quran/mushafHtml.ts`
- Modify: `src/components/quran/MushafPage.tsx`
- Modify: `src/components/quran/MushafReader.tsx`
- Modify: `src/services/recitationEngine.ts`
- Test: `src/services/__tests__/recitationEngine.test.ts`

**Acceptance checks:**
- `window.setPlayingAyah(s, a)` adds `.playing` to all matching spans.
- `setPlayingAyah(null, null)` clears `.playing`.
- Active WebView ref registration resends current ayah on page change.
- Audio continues during page swipe.

- [x] **Step 1: Add WebView highlight JS and CSS**

Modify `mushafHtml.ts` style block:

```css
.w.playing,.rub.playing{background:rgba(218,165,32,0.30);border-radius:4px;transition:background 120ms ease}
```

Add the JS function after selection helpers:

```js
function setPlayingAyah(s,a){
  document.querySelectorAll('.playing').forEach(function(e){e.classList.remove('playing')});
  if(s==null||a==null)return;
  var spans=document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]');
  for(var i=0;i<spans.length;i++)spans[i].classList.add('playing');
}
window.setPlayingAyah=setPlayingAyah;
```

- [x] **Step 2: Expose active WebView registration**

Modify `MushafPage.tsx` to accept `isActive?: boolean`. When `isActive` and WebView exists, call `recitationEngine.registerActivePageWebView(webViewRef)`. On inactive/unmount, unregister only if this page owns the active ref.

- [x] **Step 3: Pass active state from reader**

Modify `MushafReader.tsx` so the current page receives `isActive={pageNumber === currentPage}`.

- [x] **Step 4: Add engine highlight tests**

Extend `recitationEngine.test.ts`:
- starting playback injects `setPlayingAyah(1, 1)`
- advancing ayah injects `setPlayingAyah(1, 2)`
- stopping injects `setPlayingAyah(null, null)`
- registering a new active page while playing reinjects the current ayah

- [x] **Step 5: Run tests**

Run:

```bash
npm test -- src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Start Al-Fatiha playback.
- Confirm current ayah has gold `.playing` highlight.
- Swipe to a page that does not contain the ayah.
- Confirm audio continues and no stale highlight is shown.

Note: not run in this worktree because no native `ios/` project is generated; automated Jest and TypeScript checks passed for the slice.

- [x] **Step 7: Commit**

```bash
git add src/components/quran/mushafHtml.ts src/components/quran/MushafPage.tsx src/components/quran/MushafReader.tsx src/services/recitationEngine.ts src/services/__tests__/recitationEngine.test.ts
git commit -m "feat(recitation): highlight playing ayah in mushaf"
```

---

### Task 4: Expanded Player Sheet Controls Playback End-To-End

**Vertical behavior:** User taps the mini-player, opens the expanded sheet, and controls seek, next, previous, stop, pause/resume, speed, and repeat mode from the sheet.

**Files:**
- Modify: `src/components/quran/MiniPlayerBar.tsx`
- Modify: `src/services/recitationEngine.ts`
- Modify: `src/stores/recitationStore.ts`
- Create: `src/components/quran/PlayerSheet.tsx`
- Test: `src/services/__tests__/recitationEngine.test.ts`

**Acceptance checks:**
- Sheet opens from mini-player label/avatar.
- Seek calls `engine.seek(seconds)`.
- Speed cycles `0.75 -> 1 -> 1.25 -> 1.5 -> 0.75`.
- Repeat toggles `continuous` and `loop-surah`.
- Next/previous honor boundaries in design Section 5.4.

- [x] **Step 1: Add engine transport tests**

Extend `recitationEngine.test.ts` for:
- `next()` advances current ayah while below `stopAyah`
- `next()` at `stopAyah` stops in continuous mode
- `next()` at `stopAyah` loops to ayah 1 in loop mode
- `prev()` at ayah 1 is a no-op
- `seek()` during loading applies pending seek after load
- `pause()` during loading ends in paused state

- [x] **Step 2: Complete transport implementation**

Modify `recitationEngine.ts` to satisfy the tests and update `recitationStore` for `mode`, `speed`, `positionSeconds`, and `durationSeconds`.

- [x] **Step 3: Create `PlayerSheet`**

Create `src/components/quran/PlayerSheet.tsx` with:
- close button
- reciter avatar/name
- now-playing ayah card using `getAyahTextRange`
- seek bar with `mm:ss / mm:ss`
- transport row
- mode strip for info, speed, download, repeat

- [x] **Step 4: Wire mini-player to sheet**

Modify `MiniPlayerBar.tsx` to open `PlayerSheet` when label or avatar is pressed.

- [x] **Step 5: Run tests**

Run:

```bash
npm test -- src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 6: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Start playback.
- Open sheet.
- Pause/resume, seek, next, previous, speed cycle, repeat toggle, and stop all update audio and mini-player state.

Note: not run in this worktree because no native `ios/` project is generated; automated Jest and TypeScript checks passed for the slice.

- [x] **Step 7: Commit**

```bash
git add src/components/quran/MiniPlayerBar.tsx src/components/quran/PlayerSheet.tsx src/services/recitationEngine.ts src/stores/recitationStore.ts src/services/__tests__/recitationEngine.test.ts
git commit -m "feat(recitation): add expanded player controls"
```

---

### Task 5: Reciter Switching Works From Sheet And Settings

**Vertical behavior:** User changes reciter from the player sheet or settings; the choice persists, and an active session reloads the same ayah with the new reciter.

**Files:**
- Modify: `src/components/quran/PlayerSheet.tsx`
- Modify: `src/app/(tabs)/settings.tsx`
- Modify: `src/services/recitationEngine.ts`
- Create: `src/stores/reciterStore.ts`
- Create: `src/components/quran/ReciterPickerSheet.tsx`
- Test: `src/stores/__tests__/reciterStore.test.ts`
- Test: `src/services/__tests__/recitationEngine.test.ts`

**Acceptance checks:**
- Selected reciter persists under MMKV key `reciter-store`.
- Picker shows all five verified reciters.
- Switching while idle only changes persistence.
- Switching while playing reloads the current ayah and resumes prior play/pause intent.

- [ ] **Step 1: Write reciter store tests**

Create `src/stores/__tests__/reciterStore.test.ts` for:
- default selected reciter is `Husary_128kbps`
- `selectReciter('Minshawy_Murattal_128kbps')` persists selection
- persisted `downloading` states hydrate as `idle`

- [ ] **Step 2: Implement reciter store**

Create `src/stores/reciterStore.ts` with selected reciter, catalog selectors, download metadata shape, MMKV persistence, and hydration cleanup.

- [ ] **Step 3: Add engine reciter swap tests**

Extend `recitationEngine.test.ts`:
- `setReciter` while idle persists only
- `setReciter` while playing reloads same ayah from new reciter
- `setReciter` while paused reloads and remains paused

- [ ] **Step 4: Implement `setReciter`**

Modify `recitationEngine.ts` to abort in-flight load, increment `loadToken`, preserve `currentAyah`, and reload with the new reciter.

- [ ] **Step 5: Create reciter picker**

Create `ReciterPickerSheet.tsx` with cards for the five catalog entries, locale-aware names, qira'a text, avatar initials, and downloaded-status badge.

- [ ] **Step 6: Wire sheet and settings**

Modify `PlayerSheet.tsx` reciter button to open `ReciterPickerSheet`. Replace the current minimal `settings.tsx` screen with settings rows for `القارئ` and `التلاوات المحفوظة`; only the reciter row needs to be functional in this slice.

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- src/stores/__tests__/reciterStore.test.ts src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 8: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Change reciter from settings, close/reopen app screen, and confirm choice remains.
- Start playback, switch reciter from sheet, and confirm the current ayah continues under the new reciter.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(tabs\)/settings.tsx src/components/quran/PlayerSheet.tsx src/components/quran/ReciterPickerSheet.tsx src/services/recitationEngine.ts src/stores/reciterStore.ts src/stores/__tests__/reciterStore.test.ts src/services/__tests__/recitationEngine.test.ts
git commit -m "feat(recitation): switch and persist reciters"
```

---

### Task 6: Per-Surah Offline Download And Saved Recitations Management

**Vertical behavior:** User downloads the current surah from the player sheet, sees progress, plays cached ayahs offline, and deletes saved recitations from settings.

**Files:**
- Modify: `src/services/ayahAudioCache.ts`
- Modify: `src/stores/reciterStore.ts`
- Modify: `src/components/quran/PlayerSheet.tsx`
- Modify: `src/app/(tabs)/settings.tsx`
- Test: `src/services/__tests__/ayahAudioCache.test.ts`
- Test: `src/stores/__tests__/reciterStore.test.ts`

**Acceptance checks:**
- Download state moves `idle -> downloading -> complete`.
- Cancel moves `downloading -> idle` and aborts the active controller.
- Storage errors surface as `storage`.
- Settings shows total saved size and allows deleting a reciter/surah download.
- Offline playback uses existing local files without network.

- [ ] **Step 1: Extend cache tests**

Add tests for:
- local hit returns without download
- missing file downloads to unique temp file then moves
- zero-byte file is deleted and refetched once
- parallel same ayah requests share one promise
- `deleteSurahDownload` removes the nested surah directory

- [ ] **Step 2: Complete cache implementation**

Update `ayahAudioCache.ts` with:
- `downloadSurah(reciterId, surah, signal, onProgress)`
- `bytesUsed(reciterId?, surah?)`
- `deleteSurah(reciterId, surah)`
- free disk floor check before surah download

- [ ] **Step 3: Extend reciter store tests**

Add tests for:
- successful download progress
- cancel aborts and returns to idle
- error sets `status: 'error'` with message
- delete clears state and file data

- [ ] **Step 4: Implement download actions**

Update `reciterStore.ts`:
- module-local `Map<string, AbortController>`
- `startSurahDownload`
- `cancelSurahDownload`
- `deleteSurahDownload`
- `bytesUsed` selector or async helper for settings

- [ ] **Step 5: Wire player sheet download button**

Modify `PlayerSheet.tsx` mode strip download button:
- idle: start download for current `range.surah`
- downloading: cancel
- complete: show downloaded badge
- error: retry download

- [ ] **Step 6: Wire saved recitations settings**

Modify `settings.tsx` saved recitations row to show total size. Tapping it opens a list grouped by reciter with surah rows and delete affordances.

- [ ] **Step 7: Run tests**

Run:

```bash
npm test -- src/services/__tests__/ayahAudioCache.test.ts src/stores/__tests__/reciterStore.test.ts
```

Expected: all tests pass.

- [ ] **Step 8: Manual verification**

Run:

```bash
npx expo run:ios
```

Expected:
- Download Al-Fatiha.
- Disable network in simulator.
- Play Al-Fatiha successfully.
- Delete saved Al-Fatiha in settings.
- With network still disabled, playback of that ayah shows network error.

- [ ] **Step 9: Commit**

```bash
git add src/services/ayahAudioCache.ts src/stores/reciterStore.ts src/components/quran/PlayerSheet.tsx src/app/\(tabs\)/settings.tsx src/services/__tests__/ayahAudioCache.test.ts src/stores/__tests__/reciterStore.test.ts
git commit -m "feat(recitation): manage offline surah downloads"
```

---

### Task 7: Background Audio And Lock-Screen Controls

**Vertical behavior:** User starts playback, backgrounds the app, sees Now Playing metadata, and controls playback from lock screen/Control Center.

**Files:**
- Modify: `app.json`
- Modify: `src/services/audioAdapter.ts`
- Modify: `src/services/recitationEngine.ts`
- Test: `src/services/__tests__/recitationEngine.test.ts`

**Acceptance checks:**
- iOS app config includes background audio.
- Android foreground service metadata is configured.
- Lock screen metadata shows current surah/ayah and reciter.
- Remote play, pause, stop, seek, next, previous call engine methods.
- Audio survives app backgrounding.

- [ ] **Step 1: Configure app.json**

Modify `app.json`:
- add iOS background audio mode
- add Android foreground service notification metadata required by `react-native-track-player`

- [ ] **Step 2: Register remote events**

Modify `audioAdapter.ts` bootstrap to map Track Player remote events:
- remote play -> `recitationEngine.resume()`
- remote pause -> `recitationEngine.pause()`
- remote stop -> `recitationEngine.stop()`
- remote seek -> `recitationEngine.seek(seconds)`
- remote next -> `recitationEngine.next()`
- remote previous -> `recitationEngine.prev()`

- [ ] **Step 3: Add metadata update path**

Ensure every adapter load sets title, artist, and artwork:
- title: `الفاتحة - الآية ١`
- artist: selected reciter name
- artwork: bundled lock-screen artwork asset

- [ ] **Step 4: Run tests**

Run:

```bash
npm test -- src/services/__tests__/recitationEngine.test.ts
```

Expected: all tests pass.

- [ ] **Step 5: Rebuild and manually verify native behavior**

Run:

```bash
npx expo run:ios
```

Expected:
- Start playback.
- Background the app.
- Control Center shows ayah and reciter.
- Pause/resume from Control Center updates in-app state when app returns foreground.
- Next/previous from Control Center changes ayah.

- [ ] **Step 6: Commit**

```bash
git add app.json src/services/audioAdapter.ts src/services/recitationEngine.ts src/services/__tests__/recitationEngine.test.ts
git commit -m "feat(recitation): support background playback controls"
```

---

### Task 8: Mockup Parity And Native UAT Hardening

**Vertical behavior:** The complete recitation flow matches frames 01-08, handles native error cases, and has a clear release-quality verification record.

**Files:**
- Modify: `src/components/quran/MiniPlayerBar.tsx`
- Modify: `src/components/quran/MushafBottomToolbar.tsx`
- Modify: `src/components/quran/PlayerSheet.tsx`
- Modify: `src/components/quran/ReciterPickerSheet.tsx`
- Modify: `src/constants/strings.ts`
- Create: `docs/superpowers/verification/2026-04-27-recitation-audio-uat.md`

**Acceptance checks:**
- Frames 01-08 are manually checked against implementation.
- Network off, uncached ayah shows network error and retry.
- Network off, cached ayah plays.
- Reciter swap mid-playback preserves current ayah.
- Page swipe during audio has no visible stale selection/highlight.
- Text does not overlap on small iPhone simulator viewport.

- [ ] **Step 1: Create UAT checklist**

Create `docs/superpowers/verification/2026-04-27-recitation-audio-uat.md` with sections:
- Build details
- Device/simulator
- Frame parity checks 01-08
- Audio playback checks
- Offline/download checks
- Background audio checks
- Known limitations from v1 non-goals

- [ ] **Step 2: Polish mockup parity**

Adjust component styling for:
- mini-player height and bottom progress line
- loading ring
- paused gold line
- error band
- expanded sheet height and safe-area padding
- repeat selected tile
- RTL transport semantics

- [ ] **Step 3: Verify strings**

Ensure `src/constants/strings.ts` has Arabic and English recitation strings for every visible label, error, and action introduced by the feature.

- [ ] **Step 4: Run automated checks**

Run:

```bash
npm test
npx tsc --noEmit
```

Expected: all tests and type checks pass.

- [ ] **Step 5: Run native UAT**

Run:

```bash
npx expo run:ios
```

Fill the UAT checklist with pass/fail notes and exact failures fixed in this task.

- [ ] **Step 6: Commit**

```bash
git add src/components/quran/MiniPlayerBar.tsx src/components/quran/MushafBottomToolbar.tsx src/components/quran/PlayerSheet.tsx src/components/quran/ReciterPickerSheet.tsx src/constants/strings.ts docs/superpowers/verification/2026-04-27-recitation-audio-uat.md
git commit -m "test(recitation): verify audio playback uat"
```

---

## Coverage Review

| Requirement | Covered By |
|---|---|
| Popup tap-to-play | Task 1 |
| Mini-player | Task 1, Task 8 |
| Toolbar play from current page | Task 2 |
| Auto-advance and loop mode | Task 4 |
| Highlight protocol | Task 3 |
| Reciter switching | Task 5 |
| Offline per-surah download | Task 6 |
| Saved recitations settings | Task 6 |
| Expanded controls sheet | Task 4 |
| Background audio and lock screen | Task 7 |
| Mockup parity 01-08 | Task 8 |

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-27-recitation-audio-vertical-slices.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per vertical slice, review between slices, fast iteration.
2. **Inline Execution** - execute slices in this session using `superpowers:executing-plans`, with checkpoints after each slice.
