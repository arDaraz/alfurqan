# AGENTS.md

This file provides guidance when working with code in this repository.

## Project Overview

Mushaf Al Furqan is a Qur'an reading and recitation practice app built with React Native (Expo SDK 57) targeting iOS and Android. It features authentic mushaf page rendering, ayah selection, bookmarking, and a bilingual Arabic/English interface with an Arabic-first RTL layout.

## Commands

```bash
npm start                    # Metro for an already-installed development build
npm run dev:port             # Show the PID/path that owns canonical port 8081
npm run dev:stop             # Stop Metro only when this checkout owns port 8081
npm run ios                  # Build, install, and run on the iOS Simulator
npm run ios:device           # Build, install, and run on a connected iPhone
npm run android              # Build, install, and run on an Android target
npm run ios:rebuild          # Regenerate iOS native files and perform a clean build
npm run ios:device:rebuild   # Regenerate and clean-build for a connected iPhone
npm run android:rebuild      # Regenerate Android native files and build
npm run native:sync          # Regenerate both ignored native projects without launching
npm run web                  # Limited fallback; SQLite/pager do not work correctly
npm test                     # Jest test suite
npm test -- --runInBand tests/constants/theme.test.ts # Run one test file
npm run lint                 # ESLint via Expo
npx tsc --noEmit             # TypeScript strict check
npx expo-doctor              # Expo dependency and configuration diagnostics
npm run seed                 # Rebuild quran.db from JSON sources
npm run seed:mushaf          # Populate mushaf_words table
```

## Development Workflow

- Follow `docs/DEVELOPMENT_SETUP.md` for the detailed, reproducible setup, authentication boundaries, Xcode runtime recovery, and verification procedure.
- This project uses `expo-dev-client`; do not use Expo Go.
- Use `npm run ios` for the first simulator run. It invokes Expo CLI, which generates native files when absent, compiles with Xcode, installs the app, and starts Metro.
- After the native development build is installed, use `npm start` for ordinary TypeScript, UI, style, and state changes. Fast Refresh does not require an Xcode rebuild.
- Every launch command uses port 8081. The project-local wrapper reuses this checkout's Metro, rejects a listener from another checkout, and never silently switches to 8082.
- Worktrees share Metro port 8081 and Simulator devices. Before switching worktrees, run `npm run dev:stop` in the old worktree, then `npm run dev:port` in the new one. Reuse the installed development build only when native inputs match; otherwise run `npm run ios` and expect it to replace the same bundle ID on that device.
- Use a separate named Simulator device when worktrees need isolated app binaries, MMKV state, or SQLite data. Separate devices still share the Mac's Metro port, so the default workflow supports one active worktree at a time.
- Use `npm run ios:device` for a connected physical iPhone. Do not invoke `xcodebuild` directly or add a separate phone-build script.
- Rebuild after an Expo SDK upgrade, native dependency change, `app.json` change, permission change, or config-plugin change.
- The generated `ios/` and `android/` directories are ignored. `app.json` and Expo config plugins are their source of truth.
- If Xcode reports that no destination matches because an iOS platform is missing, install the matching runtime in **Xcode > Settings > Components**, or run `xcodebuild -downloadPlatform iOS -architectureVariant arm64` on Apple Silicon.

## Mandatory Agent Launch Protocol

Every agent must use this protocol before launching or verifying the app. Do not guess which Metro server, worktree, native binary, or Simulator is active.

1. Confirm the checkout and branch with `pwd` and `git status -sb`.
2. Run `npm install` in this worktree when `node_modules` is absent or `package-lock.json` changed.
3. Run `npm run dev:port` **before** `npm start`, `npm run ios`, or `npm run android`.
4. If port 8081 belongs to another worktree, stop. Do not accept port 8082 and do not kill a generic Node process. Coordinate the handoff, then run `npm run dev:stop` from the worktree reported as the owner.
5. Choose exactly one launch path:
   - Native inputs unchanged and compatible development build already installed: `npm start`, then press `i` for iOS.
   - First run or native inputs changed: `npm run ios`.
   - Connected physical iPhone: `npm run ios:device`.
   - Android emulator/device: `npm run android`.
6. Verify that `npm run dev:port` reports the **current worktree path**, confirm the intended Simulator/device, and visually inspect the native app. For iOS, capture a screenshot with `xcrun simctl io booted screenshot /tmp/alfurqan-screen.png`.

Agents must not use Expo Go, direct `npx expo start`, automatic port fallback, direct `xcodebuild` launch commands, or a web browser as substitutes for this workflow. If a launch command or port policy changes, update `README.md`, `AGENTS.md`, `CLAUDE.md`, and `docs/DEVELOPMENT_SETUP.md` together.

The supported coordination model is **one active worktree/Metro server on port 8081 at a time**. Separate Simulator devices isolate the native binary and app data but do not remove the shared Metro-port conflict. See the worktree decision table and handoff procedure in `docs/DEVELOPMENT_SETUP.md#13-developing-with-git-worktrees`.

## Architecture

### Routing (Expo Router, file-based)
- `src/app/_layout.tsx` — Root layout, RTL lock, font loading, onboarding guard
- `src/app/(tabs)/` — Bottom tab bar: Home, Search, Bookmarks, Settings + center FAB for Practice
- `src/app/surah/[id].tsx` / `src/app/juz/[id].tsx` — Dynamic reader routes
- `src/app/practice.tsx` — Practice mode modal (recitation engine drives playback; mic capture is a demo toggle)
- `src/app/onboarding.tsx` — First-run carousel, gates access via `hasCompletedOnboarding`

### State (Zustand + MMKV)
- `src/stores/settingsStore.ts` — Language, theme, Quran font scale, mushaf layout, night reading, home widgets, prayer settings
- `src/stores/readingStore.ts` — Last-read position, onboarding flag, bookmarks
- `src/stores/reciterStore.ts` — Selected reciter and per-surah audio download state
- `src/stores/recitationStore.ts` — Transient recitation session state (not persisted)

The persisted stores use `react-native-mmkv` (faster than AsyncStorage).

### Data Layer (SQLite)
- `src/data/database.ts` — DB init, bundled-asset import; reimports the asset when the content schema version or layout manifest is stale
- `src/data/mushafLayouts.ts` — Mushaf layout registry (page counts, fonts; default `indopak-15-line-hafs`)
- `src/data/quranRepository.ts` — SQL queries (surahs, ayahs, juz, mushaf words, markers)
- `src/data/types.ts` — Shared TypeScript interfaces (Surah, Ayah, Juz, MushafWord, Bookmark, etc.)
- `assets/db/quran.db` — Bundled SQLite database

### Mushaf Renderer
- `src/components/quran/MushafReader.tsx` — Native page-by-page swiper (`react-native-pager-view`, RTL, page count from the active mushaf layout)
- `src/components/quran/MushafReader.web.tsx` — Web fallback (pager-view is native-only)
- `src/components/quran/mushafHtml.ts` — Generates HTML/CSS for WebView rendering of individual pages
- `src/hooks/useMushafPage.ts` — Loads + caches mushaf page HTML (LRU, up to 12 pages)

### Design System
- `src/constants/theme.ts` — Full v2 token system: palette (paper/ink/teal/gold/sage/rose), semantic tokens (light + dark), spacing (8pt scale), radii, motion, elevation, fonts
- `src/constants/strings.ts` — Bilingual i18n object (ar + en), accessed via `useStrings()`
- `src/constants/quran.ts` — Qur'an constants (surah bismillah rules, quarter labels, revelation types)

### Key Hooks
- `useTheme()` — Resolves light/dark/system theme to semantic tokens
- `useSurahList()` / `useJuzList()` — Async fetch all surahs/juz
- `useBookmarkFlow()` — Bookmark save/undo flow shared by reader surfaces
- `usePrayerTimes()` — Prayer times for the home band (via `adhan`)

## RTL Layout — Critical Gotcha

The app globally forces RTL via `I18nManager.forceRTL(true)` in `_layout.tsx`. Under this mode, React Native **flips** `textAlign` values:

- `textAlign: 'right'` renders on the **physical left** (wrong for Arabic)
- `textAlign: 'left'` renders on the **physical right** (correct for Arabic)

**Pattern for new components:**
- Container: `flexDirection: 'row'` (mirrors automatically in RTL)
- Arabic text: `textAlign: 'left'` + `writingDirection: 'rtl'` → lands on physical right
- Latin text in Arabic context: `textAlign: 'left'` + `writingDirection: 'ltr'`
- LTR-ordered subviews (tab bar, streak counters): `flexDirection: 'row-reverse'` to opt out of the RTL flip

## Styling

`StyleSheet.create` is the styling approach, paired with `useTheme()` for runtime-resolved light and dark values. The common pattern is a `createStyles(theme, isArabic)` factory at the bottom of the file, called from the component. Take every colour, spacing, radius, and type value from the theme tokens rather than writing a literal.

Path alias: `@/*` maps to `src/*`, `@/assets/*` maps to `assets/*`.

## Design System Scales (`src/constants/theme.ts`)

The theme exposes ready-made scales — always use these instead of hardcoded values. Access via `useTheme()`:

**`theme.spacing`** — 8pt scale: `2xs(2)` `xs(4)` `sm(8)` `md(16)` `lg(24)` `xl(32)` `2xl(48)` `3xl(64)` `4xl(96)`
**`theme.gutter`** — Named gutters: `screen(24)` `row(16)` `ayah(28)`
**`theme.radii`** — Border radii: `xs(4)` `sm(8)` `md(14)` `lg(20)` `xl(28)` `2xl(36)` `pill(9999)`
**`theme.typeScale`** — Typography presets (size + lineHeight + tracking):
- `caption(12)` `label(14)` `body(17)` `title(22)` `heading(28)` `display(40)` `hero(56)`
- `quran(30)` `quranSm(24)` `arabicDisplay(44)`

**`theme.motion`** — Animation timing: durations `fast(140ms)` `base(220ms)` `slow(360ms)` `ambient(1200ms)` + easing curves `standard` `entrance` `exit`
**`theme.elevation`** — Shadow presets: `shadow1` `shadow2` `shadow3` `shadowFloat` (warm-tinted, with Android elevation)
**`theme.fonts`** — Font family names: `arabic` `arabicMedium` `arabicSemiBold` `arabicBold` `arabicSerif` `quran` `quranSerif` `latin` `latinDisplay`
**`theme.semantic`** — Colors by purpose (auto light/dark): `bg` `bgRaised` `bgSunken` `fg` `fgMuted` `fgSubtle` `primary` `accent` `success` `danger` `border` `borderStrong` `selectedRange` etc.
**`theme.palette`** — Raw color ramps: `paper` `ink` `teal` `gold` `rose` `sage` (prefer `semantic` tokens; use `palette` only when you need a specific ramp stop)

## Verification

This is a **native mobile app**. Always verify UI changes on the iOS simulator, not in a web browser.

**How to verify:**
1. Launch through the Mandatory Agent Launch Protocol above: `npm run dev:port` first, then `npm run ios` (first run or native changes) or `npm start` (JS-only changes)
2. Take a simulator screenshot: `xcrun simctl io booted screenshot /tmp/alfurqan-screen.png`
3. Read the screenshot with the Read tool to visually inspect the result

**Screenshots and recordings never enter the repository.** Write them to a
scratch directory outside the working tree, or to `/tmp`, and reference them by
absolute path while the task is open. A report records what was seen in words,
because the words survive and the file does not. Images and video are ignored by
`.gitignore` everywhere except `assets/` and `.github/`, so committing one takes
`git add -f`. If that seems necessary, it is a decision to raise, not a step to
take: this repository already accumulated 71 stray captures across four invented
folders that way.

Key things that **don't work on web** (do not use web for verification):
- `expo-sqlite` hooks never resolve (home screen hangs forever)
- `react-native-pager-view` (mushaf reader) is native-only
- RTL text alignment, font metrics, and shadows all differ on RN-web vs native

## Testing

Jest with the `jest-expo` preset. Tests use `@testing-library/react-native`. Run a single file with `npm test -- --runInBand <path>`. The `jest.setup.js` polyfills Expo's import-meta registry for the test environment.

## Experiments

`app.json` enables `typedRoutes` (compile-time route checking) and `reactCompiler` (React Compiler).

## Agent skills

### Issue tracker

Issues live as GitHub issues in `arDaraz/alfurqan`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default triage labels, each label string equal to its role name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `CONTEXT.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
