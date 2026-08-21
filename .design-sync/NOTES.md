# design-sync notes

## What this repo is

Alfurqan is an Expo React Native app, not a web component library. There is no
Storybook, no `dist/`, and no published package. The design-sync converter
bundles for a browser, so the whole sync rests on `react-native-web` plus a
small set of shims under `.design-sync/shims/`. All 52 components bundle and
render.

## Running a sync

```sh
npx tsx .design-sync/gen.ts          # regenerate entry, prop types, tokens
node .ds-sync/package-build.mjs --config .design-sync/config.json \
  --node-modules ./node_modules --out ./ds-bundle
node .ds-sync/package-validate.mjs ./ds-bundle
```

`gen.ts` reads `componentSrcMap` from `.design-sync/config.json` and writes
three generated inputs, so adding a component means editing the config only:

- `.design-sync/generated/ds-entry.tsx` - the bundle entry
- `.design-sync/generated/tokens.css` - `src/constants/theme.ts` as CSS custom
  properties, wired in through `cfg.cssEntry`
- `dist/types/ds-props.d.ts` - one `<Name>Props` alias per component

Run `gen.ts` before every build. All three outputs are gitignored.

## Why `dist/types/ds-props.d.ts` exists

The converter reads props from a `<Name>Props` interface in the package's
`.d.ts` tree. These components declare a local `interface Props` instead, and
the repo ships no `.d.ts` at all. The generated file declares
`export type <Name>Props = ComponentProps<typeof import('...').<Name>>`, which
ts-morph resolves back to the real source types, JSDoc included. Nothing in
`src/` had to change.

`findTypesRoot` picks `dist/types` on its own, so no `types` field is added to
`package.json`. `dist/` is already gitignored.

## The shims

`.design-sync/tsconfig.ds-sync.json` holds every alias in `compilerOptions.paths`.
The converter feeds that file to its esbuild resolver, so no converter script is
forked. Keys are matched exactly, including relative ones.

| Alias | Why |
| --- | --- |
| `react-native` | `react-native-web`, plus `TurboModuleRegistry`, `requireNativeComponent`, `DrawerLayoutAndroid` and friends that RNW does not ship but libraries import at load |
| `react-native-svg` | `lib/module/elements.web.js`, the library's own web build |
| `react-native-mmkv` | in-memory map, so the zustand settings store constructs |
| `@expo/vector-icons` | the real Material Community glyph map and font, without the package's per-family `.ttf` imports (esbuild has no `.ttf` loader here) |
| `expo-router` | no-op navigation, which also keeps `react-native-screens` out of the graph |
| `expo-sqlite` | every query answers empty, so data-driven screens show their empty state |
| `expo-location` | permission reported as undetermined |
| `react-native/Libraries/...` | nine native-renderer internals that are imported but never called on the web |
| `codegenNativeComponent` / `codegenNativeCommands` | native host components become plain layout boxes |
| `react-native-safe-area-context` | zero insets and a passthrough provider; the real one throws "No safe area value available" with no native host to measure the window |
| `./webUtils` | reanimated's `webUtils.web.js`; without it every animated style throws |
| `./NativeLinearGradient` | expo-linear-gradient's `NativeLinearGradient.web.js`; the native file renders a `View` with no background, so every gradient came out blank |
| `../../assets/db/quran.db` | the SQLite asset only has to resolve |

`.design-sync/shims/process-polyfill.ts` is imported first by the generated
entry. It installs `process`, `global`, `__DEV__`, `ErrorUtils` and a
`globalThis.expo` whose `modules` proxy answers every native-module lookup.
Reading an unknown property gives `undefined` on purpose: that is the signal
expo-modules-core already checks before throwing its own error. Returning a
function instead broke `expo-file-system`, which reads
`documentDirectory` as a value.

## esbuild cannot do platform extensions

Metro resolves `./elements` to `elements.web.js`. esbuild does not, and the
converter exposes no `resolveExtensions` knob. Every `.web.js` file the build
needs is therefore aliased by its exact specifier in the tsconfig - today
`./webUtils` and `./NativeLinearGradient`.

This is the single most likely thing to bite a future sync, and it fails
quietly. The build stays green and the component still renders; only the part
the web file was responsible for goes missing - an animated style that throws,
a gradient that paints nothing. A dependency upgrade that adds another
platform-split module shows up the same way. When a component looks subtly
wrong rather than broken, check whether the library ships a `.web.js` sibling
that esbuild is stepping over.

## Repository change this sync required

Three regex literals held Arabic characters directly, in
`src/data/quranRepository.ts` and
`src/services/verification/quranTextNormalizer.ts`. esbuild's `charset: ascii`
escapes string literals but never regex bodies, so the bundle only worked in a
document that declared UTF-8; anywhere else the character class decoded wrong
and threw `Range out of order in character class`. They now use `\uXXXX`
escapes, which is the same pattern with no encoding dependency. The `src/data`
and `src/services/verification` suites pass.

## Known render warns

`[RENDER_THIN]` on a component with no authored preview is expected: the floor
card is a name and a sentence. Once its preview is authored the warn should
disappear. Warns not on this list are new.

## Content traps found while authoring previews

- **`KFGQPC-Uthmani` does not draw Arabic-Indic digits as digits.** It wraps each one in its own
  ayah-marker ornament, so `٣` and `١٢` come out as `③` and `⑫` or, at small sizes, as unreadable
  blobs. `U+066B`, the Arabic decimal separator, has no glyph at all. This is the app's real
  behaviour, and the app already works around it two ways: `src/components/home/widgets/NumeralText.tsx`
  gives digit runs `theme.fonts.arabicSerif` (Amiri), and `src/components/ui/InfoSheet.tsx` carries a
  `numeric` prop for the same reason.
  The rules that follow: Arabic body text takes `KFGQPC-Uthmani`; Arabic-Indic digits take `Amiri`;
  technical values the app itself writes in Latin digits (a version, a bitrate, a page count) stay
  Latin. Amiri also draws Arabic-Indic digits at roughly half their font size, so a numeral centred
  in a fixed box wants `fontSize` near `0.4 * boxSize`, scaled down further as the digit count grows -
  a react-native `View` clips its children on the web, so an oversized numeral is silently cut off.
- **A react-native `Modal` fills the whole preview card.** Its backdrop is `position: fixed` on the
  web, so it ignores any phone-width wrapper and reads as a desktop panel. The fix is
  `cfg.overrides.<Name>: {"cardMode": "single", "viewport": "390x800"}`, never a preview-side hack.
- **The store cannot be varied from a preview.** Components read `useSettingsStore` directly and the
  store is not a bundle export, so a component with no props renders exactly one state. Giving such
  a component props is the only way to show a second.
- **A capture cell clips at roughly 700px tall.** A screen-level preview needs a frame shorter than
  that, or its background runs off the bottom and the card reads as cut off. `HomeView` sits at
  600pt for this reason. A component that genuinely needs a full phone height wants a `viewport`
  override instead.
- Per-cell images at `ds-bundle/_screenshots/review/raw/<group>__<Name>__<Cell>.png` are the only
  practical way to judge small Arabic text. The combined sheet scales down far enough to hide glyph
  problems.

## Prop contracts that needed a hand-written override

`cfg.dtsPropsFor` carries eleven entries. Ten components referenced a domain type
(`Surah`, `Juz`, `InfoSheetRow`, `BookmarkCategory`, `PrayerDay`, `GeoPoint`, `AyahSelection`,
`AyahSearchResult`, and the react-navigation types behind `TabBar`) that the extractor named but
never defined in the emitted `.d.ts`, leaving the design agent with `surah: Surah` and no fields.
Those now carry the structure inline.

`ContinueReadingWidget` is the eleventh: its props are a discriminated union
(`ResumeProps | StartProps`) and the extractor collapsed it to the two shared members, dropping
`surahName`, `ayahNumber`, `juzNumber` and `pageNumber`. An interface body cannot hold a union, so
the override lists the resume fields as optional and documents the discriminant.

Re-check both groups after any change to `src/data/types.ts` or to a component's props.

## What a browser cannot show, and what that means for a card

The shims answer honestly rather than inventing data, so several components render a real empty or
error state rather than a populated one. Each is the component's own behaviour with nothing behind
it, and each is graded on whether that state is well presented.

- `MushafPage` builds its page from the SQLite database and draws it in a `WebView`. Neither
  exists here, so it renders the content-pack error. Both mushaf layouts fail to the same message,
  so it holds one cell.
- `MushafReader` resolves to `MushafReader.web.tsx`, the repo's own web implementation, which draws
  an explanatory panel instead of the pager. `MushafScreenLayout` is aliased to the same file, so
  the reader screen shows that panel under a real header instead of the native error.
- `SurahBrowser` and `SearchScreen.Idle` show an empty list, because the surah and juz queries
  answer `[]`. The browser has no designed empty state - a blank list is what it does with no rows.
  `SearchScreen.Searched` and `BookmarksScreen` do have designed empty states and present well.
- `BookmarkRow`'s scripture line comes from `getAyahPreview`, not a prop, so that band stays blank.
  Everything else on the card is prop-driven and fully populated.
- `QiblahWidget` shows its no-heading state, since location permission is reported as undetermined.

## Wrapper sizes an absolutely-positioned component needs

The wrapper height decides whether the component is cut off, so these are worth keeping:

- `BookmarkCategorySheet`: 380x320, `position: relative`, `overflow: hidden`. It sits at
  `bottom: 70`; at 260 the edit variants clip.
- `BookmarkSavedSnackbar`: 380x170, `position: relative`. The 70pt of paper beneath it is where the
  reader's bottom toolbar sits.
- `AyahPopup`: 396x320, `position: relative`. The popup is a fixed 380 wide and clamps its own left
  edge to 8, so a 380 wrapper overflows. `x = 198` centres the tail; `y >= 97` flips the popup above
  the tap point, `y < 97` puts it below.
- `MushafBottomToolbar` needs `#F5EEDB` behind it - it only draws its own raised card.

## Seeding a store from a preview

`.design-sync/generated/ds-entry.tsx` exports the four zustand stores alongside the components, so a
preview can call `useRecitationStore.setState({...})` before rendering. `MiniPlayerBar` returns
`null` while playback is idle and had no reachable state at all before this; it now shows playing,
paused, loading and error. `PlayerSheet` uses the same trick. Without it, any component that reads a
store and takes no props can only ever show one cell.

**A seeded store cannot hold two states on one card.** The store is global, so when several cells
mount on the same page the last `setState` wins and every cell renders identically - the per-cell
review sheets still look right, which makes this easy to miss. `package-validate` catches it as
`variants render identically`. `MiniPlayerBar` and `PlayerSheet` therefore use
`cfg.overrides.<Name>: {"cardMode": "single", "primaryStory": "Playing"}`: the card shows one true
state, and the other states stay in the preview source, reachable one at a time through
`?story=<Export>`.

## Re-sync risks

- The alias table is pinned to file paths inside `node_modules`. An upgrade of
  `react-native-svg`, `react-native-reanimated` or `react-native-web` can move
  or rename them. Check every alias target still exists after a dependency bump.
- The repo has no committed lockfile, so `node_modules` is whatever the last
  install produced. A different install can shift those paths.
- `src/constants/theme.ts` feeds `tokens.css` through `gen.ts`. A rename in the
  theme silently renames a CSS custom property, and anything written against the
  old name in `.design-sync/conventions.md` goes stale. Re-run the conventions
  validation pass after a theme change.
- The `expo.modules` proxy makes every Expo native API silently do nothing. A
  component that starts depending on a real device API will render, but empty.
- Fonts are copied from `assets/fonts/`. Family names in
  `.design-sync/styles/fonts.css` must keep matching the keys `useFonts` uses in
  `src/app/_layout.tsx`.
