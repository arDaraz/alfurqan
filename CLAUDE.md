# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Mushaf Al Furqan is a Qur'an reading and recitation practice app built with React Native (Expo SDK 55) targeting iOS and Android. It features authentic mushaf page rendering, ayah selection, bookmarking, and a bilingual Arabic/English interface with an Arabic-first RTL layout.

## Commands

```bash
npm start              # Expo dev server (press i for iOS, a for Android)
npm run ios            # Build + run on iOS simulator
npm run android        # Build + run on Android emulator
npm run web            # Start web dev server (limited — SQLite/pager don't work on web)
npm test               # Jest test suite
npm test -- --testPathPattern="theme" # Run a single test file
npm run lint           # ESLint via expo-lint
npx tsc --noEmit       # TypeScript strict check
npm run seed           # Rebuild quran.db from JSON sources
npm run seed:mushaf    # Populate mushaf_words table
```

## Architecture

### Routing (Expo Router, file-based)
- `src/app/_layout.tsx` — Root layout, RTL lock, font loading, onboarding guard
- `src/app/(tabs)/` — Bottom tab bar: Home, Surahs, Review, Settings + center FAB for Practice
- `src/app/surah/[id].tsx` / `src/app/juz/[id].tsx` — Dynamic reader routes
- `src/app/practice.tsx` — Practice mode modal (UI only, backend not wired)
- `src/app/onboarding.tsx` — First-run carousel, gates access via `hasCompletedOnboarding`

### State (Zustand + MMKV)
- `src/stores/settingsStore.ts` — Language, theme, font scale, tashkeel, qari, mushaf font
- `src/stores/readingStore.ts` — Last-read position, onboarding flag, bookmarks
- `src/stores/selectionStore.ts` — Transient ayah range selection (not persisted)

Each store uses `react-native-mmkv` for persistence (faster than AsyncStorage).

### Data Layer (SQLite)
- `src/data/database.ts` — DB init, asset import, v2 schema migration (checks for `mushaf_words` table)
- `src/data/quranRepository.ts` — SQL queries (surahs, ayahs, juz, mushaf words, markers)
- `src/data/types.ts` — Shared TypeScript interfaces (Surah, Ayah, Juz, MushafWord, Bookmark, etc.)
- `assets/db/quran.db` — Bundled SQLite database

### Mushaf Renderer
- `src/components/quran/MushafReader.tsx` — Native page-by-page swiper (`react-native-pager-view`, RTL, 604 pages)
- `src/components/quran/MushafReader.web.tsx` — Web fallback (pager-view is native-only)
- `src/components/quran/mushafHtml.ts` — Generates HTML/CSS for WebView rendering of individual pages
- `src/hooks/useMushafPage.ts` — Loads + caches mushaf page HTML (LRU, up to 10 pages)

### Design System
- `src/constants/theme.ts` — Full v2 token system: palette (paper/ink/teal/gold/sage/rose), semantic tokens (light + dark), spacing (8pt scale), radii, motion, elevation, fonts
- `src/constants/strings.ts` — Bilingual i18n object (ar + en), accessed via `useStrings()`
- `src/constants/quran.ts` — Qur'an constants (surah bismillah rules, quarter labels, revelation types)

### Key Hooks
- `useTheme()` — Resolves light/dark/system theme to semantic tokens
- `useQuranText(surahNumber)` — Async fetch ayahs for a surah
- `useSurahList()` / `useJuzList()` — Async fetch all surahs/juz
- `useSearch()` — Filter surahs by name or number

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

NativeWind (Tailwind for React Native) via `className` props is the primary styling approach. Custom theme colors and spacing are extended in `tailwind.config.js` (mirrors `theme.ts` palette). Some components use inline `style` with `useTheme()` for runtime-resolved dark mode values.

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
1. Run the app: `npm run ios` (or `expo start` then press `i`)
2. Take a simulator screenshot: `xcrun simctl io booted screenshot /tmp/screen.png`
3. Read the screenshot with the Read tool to visually inspect the result

Key things that **don't work on web** (do not use web for verification):
- `expo-sqlite` hooks never resolve (home screen hangs forever)
- `react-native-pager-view` (mushaf reader) is native-only
- RTL text alignment, font metrics, and shadows all differ on RN-web vs native

## Testing

Jest with `jest-expo` preset. Tests use `@testing-library/react-native`. Run single tests with `npm test -- --testPathPattern="<pattern>"`. The `jest.setup.js` polyfills `globalThis.__ExpoImportMetaRegistry` for Expo SDK 55 compatibility.

## Experiments

`app.json` enables `typedRoutes` (compile-time route checking) and `reactCompiler` (React Compiler).
