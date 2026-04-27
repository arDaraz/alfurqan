# Recitation (Audio Playback) — Design

**Status:** Approved (brainstorm)
**Date:** 2026-04-27
**Branch:** `alfurqan-voice-recitation`
**Mockups:** `docs/superpowers/mockups/recitation/01-idle.png` … `08-expanded-controls.png`
**Scope:** Approach 3 — full-featured audio playback with multi-reciter switching and per-surah offline downloads.

---

## 1. Overview

The "recitation" feature in this scope is **audio playback**: when the user selects an ayah (long-press → popup) and taps `تشغيل`, or taps the ▶ button in the bottom toolbar, pre-recorded Qari audio plays back. This is distinct from the live-microphone recitation loop in roadmap Phases 2–3, which is a separate future feature triggered by the green mic button.

### Goal

Deliver the full mockup state machine: tap-to-play, mini-player, expanded controls sheet, auto-advance, surah-loop mode, multi-reciter switching, per-surah offline download, lock-screen controls.

### Non-goals (v1)

- Live microphone recitation / ASR (Phase 2–3 work).
- Auto-page-flip to follow playback.
- Cross-surah auto-advance.
- Word-level highlight (we highlight per-ayah only; word-level is a future feature shared with the live-recitation work).
- Loop counts / per-ayah memorization repeat (the only loop mode is surah-loop).
- Cache eviction / storage caps.
- Carplay / Android Auto.

---

## 2. Resolved decisions

| Decision | Value |
|---|---|
| Audio source | Stream + on-disk cache via everyayah.com URL pattern |
| Default behavior | Auto-advance ayah-by-ayah to end of surah, then stop |
| Loop mode | Surah-loop: end of surah → ayah 1, indefinitely |
| Trigger range — popup | Selection's `{startSurah, startAyah, endAyah}` |
| Trigger range — toolbar ▶ | Current page's first ayah → end of surah |
| Page navigation | Does not affect playback (passive) |
| New play action while playing — popup | Replace session |
| New play action while playing — toolbar | No-op while playing; resume if paused |
| Highlight protocol | RN → WebView via `injectJavaScript`, new `.playing` CSS class |
| UI surface | Persistent mini-player above toolbar + tap-to-expand bottom sheet |
| Audio library | `react-native-track-player` (lock-screen + background built-in) |
| Reciter catalog | 5 hand-curated: Husary, Abdul Basit, Sudais, Minshawi, Al Banna |
| Default reciter | First in catalog (Husary) |
| Reciter persistence | MMKV via `zustand-mmkv-storage` |
| Session persistence | Ephemeral, in-memory only |
| Download model | Per-surah, sequential (efficiency improvements deferred) |
| Error categories (UI) | 3: network, audio-unavailable, storage |
| Auto-retry | 3 strikes per ayah, then transition to `idle` |

---

## 3. Architecture

Six isolated units. Each owns one job and exposes a small public surface.

```
┌─────────────────────────────────────────────────────────────┐
│   UI layer (RN-side)                                        │
│   ┌────────────────┐  ┌──────────────────┐                  │
│   │ MiniPlayerBar  │  │ PlayerSheet      │  (existing       │
│   │ (frames 03–07) │  │ (frame 08 modal) │   popup +        │
│   └────────┬───────┘  └────────┬─────────┘   toolbar reuse) │
│            └───────┬───────────┘                            │
│                    ▼                                        │
│   ┌──────────────────────────┐    ┌──────────────────────┐  │
│   │  recitationStore         │◄──►│  reciterStore        │  │
│   │  (zustand, ephemeral)    │    │  (zustand + MMKV,    │  │
│   │  session, mode, position │    │   selected reciter,  │  │
│   └──────────┬───────────────┘    │   download state)    │  │
│              │                    └──────────────────────┘  │
│              ▼                                              │
│   ┌──────────────────────────┐                              │
│   │  recitationEngine        │  one playback session,       │
│   │  (singleton service)     │  maintains queue & mode,     │
│   │                          │  emits highlight messages    │
│   └──┬─────────────────┬─────┘                              │
│      │                 │                                    │
│      ▼                 ▼                                    │
│   ┌──────────┐    ┌──────────────────┐                      │
│   │ audio    │    │ ayahAudioCache   │                      │
│   │ adapter  │    │  (file-system,   │                      │
│   │ (RNTP)   │    │   download mgr,  │                      │
│   │          │    │   URL→localpath) │                      │
│   └────┬─────┘    └────────┬─────────┘                      │
│        │              ┌────▼─────┐                          │
│        │              │ everyAyah│ URL builder              │
│        │              │ provider │                          │
│        │              └──────────┘                          │
└────────┼──────────────────────────────────────────────┬─────┘
         │                                              │
   native audio                                  WebView (MushafPage)
   (iOS AVAudio,                                 receives setPlayingAyah(s,a)
    Android Media-                               via injectJavaScript
    Session)
```

### 3.1 Module responsibilities

| Unit | File | Public surface | Depends on |
|---|---|---|---|
| `recitationEngine` | `src/services/recitationEngine.ts` | `start, pause, resume, stop, seek, next, prev, setMode, setSpeed, setReciter` | adapter, cache, both stores |
| `recitationStore` | `src/stores/recitationStore.ts` | session state for UI; engine writes, UI reads | none |
| `reciterStore` | `src/stores/reciterStore.ts` | catalog + selected + downloads; persisted | MMKV |
| `audioAdapter` | `src/services/audioAdapter.ts` | thin RNTP wrapper: `load, play, pause, stop, seek, setSpeed, on{Progress,Ended,Error}` | `react-native-track-player` |
| `ayahAudioCache` | `src/services/ayahAudioCache.ts` | `getLocalPath, downloadSurah, bytesUsed, delete` | `expo-file-system`, provider |
| `everyAyahProvider` | `src/services/everyAyahProvider.ts` | `urlFor(reciterId, surah, ayah)` + reciter folder map | none |
| `MiniPlayerBar` | `src/components/quran/MiniPlayerBar.tsx` | render-only | `recitationStore`, engine |
| `PlayerSheet` | `src/components/quran/PlayerSheet.tsx` | render-only | `recitationStore`, engine, both stores |
| `ReciterPickerSheet` | `src/components/quran/ReciterPickerSheet.tsx` | render-only | `reciterStore`, engine |
| `mushafHtml.ts` (existing) | + `setPlayingAyah(s, a)` JS function and `.playing` CSS class | — | — |
| `ayahActions.ts` (existing) | `play` case calls `engine.start(...)` | — | — |
| Settings screen (existing) | + reciter row + saved-recitations row | — | — |

### 3.2 Why these boundaries

- The engine is the only stateful thing that touches the audio library. Swapping libraries is a single-file change.
- The cache and download manager share one code path (`getLocalPath`); a download is a sequential pre-warm of the cache, not a separate subsystem.
- The reciter store is independent of session state. Switching reciter mid-session reloads the same `currentAyah` from a new URL.
- Highlight is one-way push from engine → WebView. The WebView never asks. The WebView side is ~10 lines added to existing inline JS.

---

## 4. Data model

### 4.1 Reciter catalog (static)

`src/data/reciters.ts` — hand-curated list, shipped with the app, updated via app updates.

```ts
type Reciter = {
  id: string;              // matches everyayah folder, e.g. "Husary_128kbps"
  nameAr: string;          // "محمود خليل الحصري"
  nameEn: string;          // "Mahmoud Khalil Al-Husary"
  rivayahAr: string;       // "رواية حفص عن عاصم"
  bitrate: 64 | 128;
  bytesPerAyahAvg: number; // for download size estimation
};
```

Catalog (v1): Husary (default), Abdul Basit, Sudais, Minshawi, Al Banna. EveryAyah folder IDs to be confirmed during implementation.

### 4.2 `reciterStore` (persistent, MMKV)

```ts
type DownloadStatus = 'idle' | 'downloading' | 'complete' | 'error';
type SurahDownload = {
  ayahsTotal: number;
  ayahsCached: number;
  status: DownloadStatus;
  errorMessage?: string;
};

type ReciterState = {
  selectedReciterId: string;                   // default: 'Husary_128kbps'
  downloads: Record<string, Record<number, SurahDownload>>;
  selectReciter: (id: string) => void;
  startSurahDownload: (reciterId: string, surah: number) => Promise<void>;
  cancelSurahDownload: (reciterId: string, surah: number) => void;
  deleteSurahDownload: (reciterId: string, surah: number) => Promise<void>;
};
```

MMKV key: `reciter-store`. On launch, any download in `'downloading'` state is treated as `'idle'` (likely interrupted by app kill).

### 4.3 `recitationStore` (ephemeral)

```ts
type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
type PlaybackMode = 'continuous' | 'loop-surah';
type ErrorCategory = 'network' | 'audio-unavailable' | 'storage' | null;

type Range = {
  surah: number;
  startAyah: number;
  endAyah: number;     // user's original selection upper bound; kept for highlight nuance
};

type RecitationState = {
  state: PlaybackState;
  range: Range | null;
  currentAyah: number | null;
  mode: PlaybackMode;
  positionSeconds: number;
  durationSeconds: number;
  speed: 0.75 | 1 | 1.25 | 1.5;
  errorCategory: ErrorCategory;
  errorMessage: string | null;

  // engine-only mutations
  _setState, _setCurrentAyah, _setProgress, _setError;
  // user-facing
  setMode, setSpeed;
};
```

Engine is the only writer of `state`, `currentAyah`, `positionSeconds`, `durationSeconds`, `errorCategory`. UI reads.

### 4.4 Range semantics

| Trigger | `range` value |
|---|---|
| Popup `تشغيل` with selection {S, A, B} | `{surah: S, startAyah: A, endAyah: B}` |
| Popup with single ayah | `{surah: S, startAyah: A, endAyah: A}` |
| Toolbar ▶ with no popup | `{surah: topAyahSurah, startAyah: topAyahNumber, endAyah: surahLastAyah(topAyahSurah)}` |

**`topAyahSurah` / `topAyahNumber` definition:** the visually topmost ayah on the currently visible Mushaf page, found by scanning `[data-s][data-a]` spans in DOM order and taking the first one. Mushaf pages frequently contain ayahs from multiple surahs (e.g., the end of one surah followed by the start of the next); we always pick the first surah encountered top-to-bottom and start from its first ayah on that page. This data is already available to RN via the existing per-page metadata used by `MushafReader`.

Playback queue is always `currentAyah → end of surah`. `endAyah` is preserved for selection-aware highlight nuance (a future v2 feature can dim highlight outside the original selection range).

### 4.5 Cache file layout

```
{FileSystem.cacheDirectory}/recitation/
  {reciterId}/
    {surah:03}/
      {ayah:03}.mp3
```

---

## 5. Recitation engine — state machine

### 5.1 States and events

**States:** `idle`, `loading`, `playing`, `paused`, `error`.

**Events:** `START(range)`, `PAUSE`, `RESUME`, `STOP`, `SEEK(seconds)`, `NEXT`, `PREV`, `SET_RECITER(id)`, `AYAH_ENDED`.

### 5.2 Transition table

| State \ Event | START | PAUSE | RESUME | STOP | SEEK | NEXT | PREV | SET_RECITER | AYAH_ENDED |
|---|---|---|---|---|---|---|---|---|---|
| **idle** | → loading, set range, load `currentAyah` | — | — | — | — | — | — | persist new id | — |
| **loading** | replace range, restart load | (queued) | — | → idle, abort | queue via `pendingSeek` | — | — | restart load with new url | (impossible) |
| **playing** | replace range, → loading | → paused, adapter.pause | — | → idle, adapter.stop | adapter.seek | advance currentAyah, → loading | retreat currentAyah, → loading | → loading at same ayah, new url | apply mode rule below |
| **paused** | replace range, → loading | — | → playing, adapter.play | → idle | adapter.seek | advance, → loading | retreat, → loading | → loading at same ayah | — |
| **error** | retry: → loading | — | — | → idle | — | — | — | → loading | — |

### 5.3 The auto-advance / loop rule

```
on AYAH_ENDED in playing:
  let last = surahLastAyah(range.surah)
  if currentAyah < last:
      currentAyah += 1
      → loading
  else:                                  // hit end of surah
      if mode === 'loop-surah':
          currentAyah = 1
          → loading
      else:
          → idle, adapter.stop, clear range
```

### 5.4 Race safety: `loadToken`

The engine holds `private loadToken: number`. Every call to `load()` increments it. All `audioAdapter` callbacks (`onProgress`, `onEnded`, `onError`) capture the token at registration time and no-op if their captured token is stale. This prevents:

- Late `onEnded` from a previous track triggering an extra advance.
- Reciter-swap mid-load applying the old URL's load result.

### 5.5 Pending seek and pending pause

The engine holds two "pending" flags consumed on load completion:

- `private pendingSeek: number | null` — set when `seek()` is called during `loading`. Applied via `adapter.seek()` after the load lands.
- `private pendingPause: boolean` — set when `pause()` is called during `loading`. If true on load completion, the engine transitions directly to `paused` and does **not** call `adapter.play()`. If false, the engine auto-plays as normal.

Both flags reset to their default (`null` / `false`) on every `START`, `STOP`, or successful load completion that consumes them. Both clear if the user calls `RESUME` (since RESUME implies they want to play).

### 5.6 Error handling and retry

- Adapter and cache errors map to `ErrorCategory`:
  - `cache.network` → `network`
  - `cache.http`, `adapter.load` → `audio-unavailable`
  - `cache.disk` → `storage`
  - `cache.aborted` → silent, no error category
  - Mid-playback `adapter.playback` → toast + auto-retry once
- Per-ayah retry counter: 3 strikes, then → `error` state with `errorCategory` set.
- "Retry" UI action calls `engine.retry()` which re-issues the current load.

### 5.7 Reciter swap

`setReciter(newId)`:

1. `reciterStore.selectReciter(newId)` (persist).
2. If state is `idle`, done.
3. Else: increment `loadToken`, abort in-flight cache fetch, re-call `load()` with new URL. Preserve `currentAyah`. Resulting state is `loading` → `playing` (or `paused` if previous was paused).

### 5.8 Engine does not handle

- Pages — pure UI concern.
- Selection vs cursor — resolved at the call site (popup vs toolbar).
- Download manager — `reciterStore.startSurahDownload` calls `cache.downloadSurah` directly.
- Background audio / lock screen — RNTP handles natively.

---

## 6. Highlight protocol

### 6.1 RN → WebView

```ts
// engine method
private highlightInWebView(surah: number | null, ayah: number | null) {
  this.activePageWebViewRef.current?.injectJavaScript(
    `window.setPlayingAyah(${surah ?? 'null'}, ${ayah ?? 'null'}); true;`
  );
}
```

### 6.2 WebView side — `mushafHtml.ts` additions

```js
function setPlayingAyah(s, a) {
  document.querySelectorAll('.playing').forEach(function(e){
    e.classList.remove('playing');
  });
  if (s == null || a == null) return;
  var spans = document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]');
  for (var i=0; i<spans.length; i++) spans[i].classList.add('playing');
}
window.setPlayingAyah = setPlayingAyah;
```

### 6.3 CSS

```css
.w.playing, .rub.playing {
  background: rgba(218, 165, 32, 0.30);   /* more saturated than .sel */
  border-radius: 4px;
  transition: background 120ms ease;
}
```

`.playing` and `.sel` coexist independently. If both apply, `.playing` wins by virtue of being the more saturated color.

### 6.4 Page-cross behavior

- Engine targets the **currently visible page's WebView** via a ref registered/unregistered as the user swipes pages.
- Page flip alone does not affect playback. New page registers; engine re-sends the current `(surah, ayah)`; if the new page contains those spans, it highlights, otherwise it doesn't.
- No auto-page-flip in v1.

### 6.5 Cleanup

Engine sends `setPlayingAyah(null, null)` on transition to `idle`.

### 6.6 Performance

- One `injectJavaScript` per ayah change (every 4–8s typically), not per progress tick.
- `setPlayingAyah` is O(spans on page) — ~150 max — negligible.

---

## 7. UI surface

### 7.1 New: `MiniPlayerBar`

`src/components/quran/MiniPlayerBar.tsx` — frames 03–07.

- Mounts only when `recitationStore.state !== 'idle'`.
- Slot layout (matching mockup): play/pause, stop, ayah-label text, reciter avatar.
- Tap on label or avatar opens `PlayerSheet`.
- `Animated.View` slide-up entry / slide-down exit (~200ms).
- Top edge styling reflects state: pulse during `loading`, thin gold line during `paused`, error band during `error`.
- Sits above the existing bottom toolbar, not replacing it.

### 7.2 New: `PlayerSheet`

`src/components/quran/PlayerSheet.tsx` — frame 08 bottom-sheet modal.

- Sections (top → bottom):
  - Header: close X, "قيد التشغيل" label.
  - Reciter avatar + name + qira'a (read from catalog).
  - Now-playing ayah card: surah · ayah-number + actual Arabic text (via existing `getAyahTextRange`).
  - Seek bar with `mm:ss / mm:ss`. Drag → `engine.seek()`.
  - Transport row: prev (◀|), stop (■), play/pause (●), next (|▶), reciter-switcher (👤 → opens `ReciterPickerSheet`).
  - Mode strip: info, speed, download, repeat. Repeat toggles `mode`. Speed cycles `0.75 → 1 → 1.25 → 1.5`. Download starts/cancels surah download for current `range.surah`. Info opens a small reciter-info modal.

### 7.3 New: `ReciterPickerSheet`

`src/components/quran/ReciterPickerSheet.tsx`.

- Opened from `PlayerSheet` reciter-switcher and from Settings.
- 5 reciter cards: avatar, name (locale-aware), qira'a, downloaded-status badge.
- Tap → `reciterStore.selectReciter(id)`, plus `engine.setReciter(id)` if a session is active.

### 7.4 Toolbar wiring (`MushafScreenLayout`)

- Toolbar ▶ button:
  - If `state === 'playing'`: no-op.
  - If `state === 'paused'`: `engine.resume()`.
  - Else: resolve `topAyahSurah` and `topAyahNumber` for the visible page (per Section 4.4), then `engine.start({surah: topAyahSurah, startAyah: topAyahNumber, endAyah: surahLastAyah(topAyahSurah)})`.
- Mount `<MiniPlayerBar />` directly above the toolbar in the layout.

### 7.5 `ayahActions.ts` — `play` case

```ts
case 'play': {
  recitationEngine.start({
    surah: startSurah,
    startAyah,
    endAyah,
  });
  break;
}
```

While playing, this replaces the session.

### 7.6 Settings screen additions

`src/app/(tabs)/settings.tsx`:

- **Row "القارئ"** — shows current reciter name; tap → `ReciterPickerSheet`.
- **Row "التلاوات المحفوظة"** — shows total cache size; tap → list of downloaded surahs by reciter with delete affordances.

### 7.7 Strings

New `recitation` namespace in `src/constants/strings.ts`. Examples: `recitation.loading`, `recitation.paused`, `recitation.nowPlaying`, `recitation.repeatOn`, `recitation.errorNetwork`, `recitation.errorAudioUnavailable`, `recitation.errorStorage`, `recitation.downloadStart`, etc.

### 7.8 What this section does not touch

- The MushafPage WebView only gets the `setPlayingAyah` script + `.playing` CSS (Section 6).
- The existing `RangeSelectionBar` is unchanged.
- Onboarding gets no recitation copy in v1.

---

## 8. Offline cache, downloads, errors

### 8.1 `ayahAudioCache.getLocalPath`

Idempotent. Returns local path; downloads if missing. Two parallel calls for the same path race-write to `.tmp` then rename — collisions resolve to one winner. Errors classify as `network | http | disk | aborted`.

### 8.2 Per-surah download

Sequential loop:

```ts
for (let ayah = 1; ayah <= total; ayah++) {
  if (signal.aborted) throw new CacheError('aborted');
  await getLocalPath(reciterId, surah, ayah, signal);
  cached++;
  onProgress(cached, total);
}
```

State writes via `reciterStore.startSurahDownload`:

```
status: 'idle' → 'downloading' → 'complete'
                              ↘ 'error'
                              ↘ 'idle' (cancel)
```

### 8.3 Cache + playback share one path

The engine never special-cases "downloaded vs not." `cache.getLocalPath` decides. A download in flight on surah X and a play action on surah X share files via dedup'd `getLocalPath`.

### 8.4 Storage estimate UI

`bytesPerAyahAvg × ayahCount` shown in the download confirmation dialog. Post-download size via `FileSystem.getInfoAsync` summed across surah dir.

### 8.5 Eviction

**v1: none.** Manual delete from settings only. Safety floor: refuse new download if `getFreeDiskStorageAsync()` < 100 MB.

### 8.6 Error categories (UI)

| Category | Surface | Copy (ar) | Action |
|---|---|---|---|
| `network` | Mini-player band; sheet banner | `لا يوجد اتصال بالإنترنت — جرّب لاحقًا أو نزّل السورة` | "Retry" → `engine.retry()` |
| `audio-unavailable` | Toast + idle | `لا تتوفر هذه التلاوة لهذا القارئ` | "Choose another reciter" → `ReciterPickerSheet` |
| `storage` | Modal | `لا توجد مساحة كافية` | "Manage storage" → settings |

Cancelled is silent. Mid-playback glitches auto-retry once before surfacing.

### 8.7 Retry semantics

- Network retry is per-ayah, not per-surah.
- 3 strikes per ayah → `error` state.
- Cache poisoning self-heals: invalid file (size 0 or RNTP load failure) → delete + re-fetch once.

### 8.8 Background audio + lock screen

RNTP handles automatically once configured:

- `app.json`: `UIBackgroundModes: ['audio']` (iOS), foreground service config (Android).
- RNTP `setupPlayer` capabilities: `Play, Pause, Stop, SeekTo, SkipToNext, SkipToPrevious`.
- Track metadata set on every `adapter.load()` so lock screen reflects current ayah + reciter.

---

## 9. Future improvements — efficiency

Tracked here so the v1 trade-offs are explicit. None of these require redesign — all fit behind the existing `cache.getLocalPath` / `downloadSurah` / engine interfaces.

1. **Prefetch ayah N+1** while ayah N plays — eliminates loading flicker on auto-advance. Highest user-visible win.
2. **Parallel downloads** with concurrency cap (e.g., 4) — sequential is the simplest correct version.
3. **Background prefetch on Wi-Fi** — opportunistic surah pre-download when a session starts.
4. **Multi-bitrate selection** — lower bitrate on cellular, higher on Wi-Fi.
5. **Cache eviction (LRU)** with configurable size cap.
6. **Partial-file resumption** for surahs > 50 MB.
7. **Cache index in MMKV** — avoid `getInfoAsync` lookups on every play.
8. **Auto-page-flip** as a settings toggle to follow playback across page boundaries.
9. **Word-level highlight** — once Phase 2/3 word-timing data exists, reuse the highlight protocol.

---

## 10. Testing strategy

### 10.1 Engine FSM unit tests (load-bearing)

`src/services/__tests__/recitationEngine.test.ts`. Mocked adapter + cache. ~30 tests covering all transition cells, the `AYAH_ENDED` rule branches, race safety (stale `loadToken`), pending-seek, 3-strikes retry, cache-poisoning self-heal, reciter-swap.

### 10.2 Cache tests

`src/services/__tests__/ayahAudioCache.test.ts`. Mocked `expo-file-system`. Path construction, hit/miss, race-write dedup, abort, error classification.

### 10.3 Reciter store tests

`src/stores/__tests__/reciterStore.test.ts`. `selectReciter`, download lifecycle, cancel, recovery from `'downloading'` persisted state.

### 10.4 Light integration test

Engine + real cache (tmp dir) + mock adapter — verifies the happy-path wiring across the three.

### 10.5 Manual native verification (UAT)

Per the project's `Native-only verification` rule (iOS sim). Per-plan checklist:

- Frame-by-frame match against `docs/superpowers/mockups/recitation/01-08`.
- Lock-screen Now Playing controls work.
- Audio survives backgrounding and phone-call interruption.
- Audio + page-swipe simultaneously: no jank.
- Network off, ayah cached → plays.
- Network off, ayah not cached → `network` error with retry.
- Reciter swap mid-playback: no audio gap > 1s, `currentAyah` preserved.

### 10.6 What we do not unit-test

`react-native-track-player`, `expo-file-system`, WebView injection internals, React component rendering. All covered by either trust-the-library or manual UAT.

### 10.7 Test naming

Follow existing convention from `bookmark.test.ts` and `ayahActions.test.ts`: `describe` per public method, `it` per scenario, plain English.

---

## 11. Implementation sequencing (suggested for the plan phase)

Not part of this design — captured here as a hint to the writing-plans phase.

1. Provider + cache + RNTP adapter + tests.
2. Engine FSM + tests (against mock adapter).
3. Stores (reciter, recitation) + persistence + tests.
4. WebView highlight protocol (mushafHtml additions + page-ref registration).
5. MiniPlayerBar + toolbar wiring + popup wiring.
6. PlayerSheet + ReciterPickerSheet.
7. Settings screen rows.
8. Download manager + storage UI in settings.
9. Background audio + lock-screen config.
10. UAT pass on iOS sim with mockup parity check.

Each step ends with green tests where applicable + a green native verification checklist where applicable.

---

## 12. Open questions

None blocking. Items deferred to implementation:

- EveryAyah folder IDs for the 5 chosen reciters (a 5-minute web check during plan #1).
- Exact Android foreground-service icon and notification text.
- Lock-screen artwork asset (small mosque/Quran icon).
