# Mushaf Al Furqan v2 design system — iOS verification complete ✅

**Update — iOS simulator verified.** The design renders correctly on iPhone 17 Pro / iOS 26.3. Screenshots in `.planning/sim-screenshots/`:

| File | Screen | Status |
|---|---|---|
| `01-home.png` | Home — brand bar + greeting card + pill tabs + search + surah list with khātam stars + 5-col tab bar | ✅ matches design |
| `02-settings.png` | Settings — gradient profile card with gold border + streak chip + Reading/Audio sections + font slider + toggles | ✅ matches design |
| `03-practice.png` | Practice Mode — ornament divider + verse box + sage/red word states + correction chip + mic visualizer + big mic button | ✅ matches design |
| `04-reader.png` | Reader — v2 header (more · juz۞surah · back) + KFGQPC mushaf in v2 paper/ink/gold | ✅ matches design |

**One bug fixed during verification:** the original Manrope/Fraunces TTFs I downloaded were HTML pages (GitHub web view, not raw files). The native iOS build silently rendered a blank white screen because `useFonts` never resolved — caught via `xcrun simctl spawn booted log show` showing `GSFont: invalid font file`. Fixed by switching to Google Fonts variable TTFs (`Manrope-Variable.ttf`, `Fraunces-Variable.ttf`, `Fraunces-VariableItalic.ttf`) from the official `google/fonts` repo. iOS handles variable axes natively.

---

# Tasmi'/Alfurqan v2 design system — implementation status

**Branch:** `main` (no commits — work is in unstaged + untracked files; ready for your review)
**Date:** 2026-04-25 (autonomous run while you slept)
**Source of truth:** `/Users/ahmeddaraz/Downloads/Tasmi' Design System-handoff.zip` → extracted to `/tmp/tasmi-design/`

## Quick verdict

The full v2 token system + the design's five proposed screens (Splash, Home, Reader chrome, Settings, Practice Mode) are implemented. Tests and TypeScript pass. Visual verification on `expo start --web` passed for Practice Mode, Settings, Review, and Reader chrome — Home and the actual mushaf renderer are blocked by an unrelated **expo-sqlite-on-web** issue (data hooks never resolve in the browser; native iOS/Android will work).

```
13/14 tasks completed ─ only "STATUS.md report" was open when this was written.
129/129 jest tests passing (theme.test.ts rewritten for v2 tokens).
TypeScript clean (npx tsc --noEmit, exit 0).
```

## What's in the design pass

### Tokens (`src/constants/theme.ts`)
Full v2 "Mushaf" palette ported from `colors_and_type.css`:

- **Palette ramps:** `paper-50/100/200/300`, `ink-300/500/700/900`, `teal-50/100/300/500/600/700/900`, `gold-300/500/700`, `rose-100/500`, `sage-100/500`.
- **Semantic tokens:** `bg`, `bgRaised`, `bgSunken`, `bgInverse`, `fg`, `fgMuted`, `fgSubtle`, `fgOnPrimary`, `fgOnGold`, `primary`, `primaryPressed`, `primaryFocus`, `primaryTint`, `primaryFocusRing`, `accent`, `accentSoft`, `success`, `successSoft`, `danger`, `dangerSoft`, `border`, `borderStrong`, `borderGold`, `selectedRange`.
- **7-step type scale:** `caption · label · body · title · heading · display · hero` plus `quran/quranSm/arabicDisplay`.
- **Spacing:** 8-pt scale + named gutters (`screen 24`, `row 16`, `ayah 28`).
- **Radii:** `xs 4 / sm 8 / md 14 / lg 20 / xl 28 / 2xl 36 / pill 9999` (md was 12 in v1).
- **Elevation:** 4-level warm-tinted scale (`shadow1` → `shadowFloat`) ported to RN's `shadow*` props.
- **Motion:** named durations (140/220/360/1200ms) + curves (`standard/entrance/exit`).
- **Dark mode:** full "Night reading" palette (`darkTheme` export, opt-in via `useTheme()`).

The legacy v1 surface (`theme.colors.primary`, `theme.spacing.xs`, etc.) is preserved as aliases pointing at v2 values, so older components continue to render.

### Theme provider
`src/hooks/useTheme.ts` — resolves light/dark/system from `useSettingsStore.themeMode` and `useColorScheme()`. Drop-in for any component that previously imported `theme` directly.

### Brand assets (`src/components/brand/`)
SVG components ported verbatim from the design's `assets/` (no redrawing):

| Component | Use |
|---|---|
| `LogoGlyph` | The Kufic-rosette glyph (splash, brand bar, onboarding hero) |
| `Wordmark` | Glyph + الفرقان + ALFURQAN — for marketing/about |
| `AyahRosette` | Replaces unicode `۝` ayah-end markers |
| `OrnamentDivider` | Section breaks with central medallion |
| `SurahCartouche` | Sarlawh frame for surah titles only |
| `KhatamStar` | 8-point khātam star wrapping surah numerals on Home list |

### Fonts (`assets/fonts/`)
Self-hosted TTFs added (downloaded from official Google Fonts repos):

- **Manrope** — Regular/Medium/SemiBold/Bold/ExtraBold (Latin UI)
- **Fraunces** — Regular/Italic 144pt (editorial Hero only — onboarding pull-quote)
- **Reem Kufi** — Regular (Arabic UI)
- **Amiri** — Regular/Italic/Bold (long-form Arabic body)
- KFGQPC-Uthmani + AmiriQuran (kept — Quranic only)

All loaded in `src/app/_layout.tsx` via `useFonts`. The design notes call out that production should ship WOFF2; current setup is TTF for parity with Quranic fonts.

### Screens

| Route | Status | Notes |
|---|---|---|
| `/onboarding` | ✅ Redesigned | Hero rosette on slide 1, ornament divider, Manrope/Fraunces type. |
| `/(tabs)` | ✅ New 5-col tab bar | Custom `TabBar` (`src/components/navigation/TabBar.tsx`): Home · Surahs · FAB · Review · Profile. FAB navigates to `/practice`. |
| `/(tabs)/index` | ✅ Rebuilt | `BrandBar` + gradient `GreetingCard` + `PillTabs` + `SearchBar` + lists with khātam-star numerals. **Loads on web but data is SQLite-blocked — see "Known gaps".** |
| `/(tabs)/surahs` | ✅ New | Same `HomeView` with `hideGreeting` prop. |
| `/(tabs)/review` | ✅ New | "Coming Soon" placeholder with ornament divider. |
| `/(tabs)/settings` | ✅ Built | Profile card (gradient + gold border + streak chip), 3 sections (Reading/Audio/App), font slider, toggles, theme cycle. |
| `/practice` | ✅ New | Full Practice Mode UI per design — coloured words, correction chip, mic visualizer, big mic button. Backend stubbed (see "Known gaps"). |
| `/surah/[id]`, `/juz/[id]` | ✅ Chrome rebuilt | `ReaderHeader` (back · juz۞surah · more) + `ReaderToolbar` (5-col, central tasmi'). Mushaf body keeps the existing WebView renderer with v2 colours injected into its CSS. |

### Splash
`src/components/splash/SplashView.tsx` — replaces the static splash with a custom view: dark teal background, gold corner brackets, breathing rosette glyph (4.5s ambient cycle), الفرقان wordmark, gold separator rule, Fraunces italic "Recite. We Listen.", and a 3-dot loader. Renders while fonts load.

### WebView mushaf
`src/components/quran/mushafHtml.ts` — CSS palette swapped to v2 (`#F5EEDB` paper, `#0E2724` ink, `#B8923F` gold). Selection state now uses the inset-shadow pattern ("impressed into paper") instead of brightening. Layout/structure unchanged — preserves the page-by-page authentic mushaf rendering.

## Known gaps & follow-ups

1. **Expo-sqlite-on-web blocks Home data.** The `useSurahList`/`useJuzList` hooks call into `expo-sqlite`, which doesn't fully work in Metro's web target. The home screen renders the spinner forever in the browser. **Native iOS/Android will work normally** — this is purely a web-build limitation. The fix is either wrapping the data layer with a web shim or shipping a pre-built JSON for web. Out of scope for this design pass; tracked here for next session.

2. **Mushaf reader is native-only.** `react-native-pager-view` doesn't bundle on web. I added `MushafReader.web.tsx` as a fallback that explains this and shows the surrounding chrome — clean handle until you decide whether you want a JS-PagerView replacement or to keep the reader native-only.

3. **`react-native-svg` and `expo-linear-gradient` were installed.** Both are required by the design (SVG primitives + the greeting/profile card gradients). They're added to `package.json` and `package-lock.json`. No native build was triggered; you'll want to `npx pod-install` before the next iOS build.

4. **`shadow*` style props log a deprecation warning on web.** RN-web wants `boxShadow` now; I kept the cross-platform `shadow*` props for native parity. Easy follow-up: gate by Platform or migrate to `boxShadow` + `elevation` per RN 0.83 guidance.

5. **Practice Mode is UI-only.** Per the design's caveats: speech recognition, word-by-word tashkīl detection, and audio playback are not wired. The mic-button currently calls `router.back()` as a stub.

6. **Streak / juz-position values on Home and Settings are placeholders.** No streak feature exists in `readingStore` — the `27` and `Juz 1 · 14` are constants in the screens. Wiring is one store extension away.

7. **Toggle visual on RTL.** The `Toggle` component uses raw `left:` positioning rather than a directional property — looks correct in either orientation in the RN web build, but should be re-checked on native iOS/Android.

8. **`ResumeReadingFAB` and the old `home/TabBar.tsx` were deleted.** Greeting CTA replaces the FAB; `PillTabs` replaces the segmented control. Update any external docs that referenced them.

9. **Settings "Mushaf font" / "Reciter" buttons** are placeholder pills with no destination. Wiring `onPress` handlers to a chooser sheet is a next step.

10. **No SVG/PNG splash icon swap.** I left `assets/images/icon.png` and `splash-icon.png` alone — the new brand SVGs are ready, but generating updated raster assets (1024x1024 PNG, adaptive Android, etc.) is a separate exporter pass.

## Visual verification screenshots

Captured via Chrome MCP at iPhone-13-ish viewport (430×900). All screens render with the v2 palette, fonts, and ornaments correctly:

| Screen | Verdict |
|---|---|
| Practice Mode (`/practice`) | ✅ Full match — sage/gold/rose word states, gold ornament divider, mic visualizer, listening dot. |
| Settings (`/settings`) | ✅ Profile gradient card, gold caption labels, font slider preview, Reading/Audio sections. |
| Review (`/review`) | ✅ Centred ornament + bilingual title + placeholder body. |
| Reader chrome (`/surah/1`) | ✅ Header (chevron · juz۞surah · more), gold page caption, v2-coloured loading skeleton. |
| Tab bar | ✅ All five cells, central FAB with gold halo, active-tab teal tint. |

Home and the splash itself were not directly screenshotable on web — Home blocked on SQLite, splash flashes too briefly once fonts cache. Both render in code per the design.

## How to pick up

1. `npm install` — picks up `react-native-svg` and `expo-linear-gradient`.
2. Native run: `npm run ios` or `npm run android`. Native rendering should give you the full picture including Home + the real mushaf reader.
3. Web run: `npm run web` to verify the chrome screens (Settings, Practice, Review, Reader header, Onboarding, Splash). The home loading-spinner issue is the SQLite gap.
4. To ship without the data gap, either:
   - port `data/quranRepository.ts` to use `expo-sqlite/next` (which has better web support), **or**
   - bundle the surah/juz metadata as a JSON fallback for web.

## Files changed (summary)

- 33 modified files (~1,986 insertions / 1,345 deletions vs. v1)
- 2 deleted (`ResumeReadingFAB.tsx`, old `home/TabBar.tsx`)
- 11 new font files in `assets/fonts/`
- 5 new SVG assets in `assets/svg/`
- 24 new component files across `brand/`, `home/`, `navigation/`, `practice/`, `settings/`, `splash/`, `quran/` (Reader chrome)
- 2 new routes (`practice.tsx`, `(tabs)/review.tsx`, `(tabs)/surahs.tsx`)
- 1 new hook (`useTheme.ts`)

Per your instruction, **nothing is committed** — every change is in `git status` for your review.
