# Ayah Selection & Context Popup — Design Spec

## Overview

Add tap-to-select and tap-to-extend-range interaction to the Mushaf WebView pages. A floating context popup (rendered in React Native) appears near the selection with actions: play audio, tafsir, bookmark, copy, share, word-by-word.

## Approach

**Hybrid (WebView selection + RN popup):** Selection logic and highlighting happen inside the WebView. On selection, the WebView sends ayah data + tap coordinates via `postMessage` to React Native. RN renders a native floating popup at those coordinates using `MaterialCommunityIcons` — the same icon library used throughout the app.

This ensures a single icon library and consistent design language across the entire app.

## HTML Structure

Currently, `buildLine` in `mushafHtml.ts` emits words as bare text (`w.codeV2`). This changes to wrapping **every word** in a span with ayah metadata, including `end` and `pause` char types (so ayah-end markers highlight with their ayah):

```html
<span class="w" data-s="2" data-a="142">ﱁ</span>
<span class="w" data-s="2" data-a="142">ﱂ</span>
<span class="w" data-s="2" data-a="143">ﱃ</span>
```

- `data-s` = surah number
- `data-a` = ayah number
- `.w` class = base word styling with tap target

### Rub el Hizb Special Case

Words with `wordPosition === 1` whose `codeV2` contains a space are split: the first part is the `۞` glyph, the rest is the word. Both parts are wrapped in separate spans sharing the same `data-s`/`data-a`:

```html
<span class="rub" data-s="2" data-a="26">۞</span>
<span class="w" data-s="2" data-a="26">ﱩ</span>
```

The tap handler selects ayahs when tapping any element with `data-s`/`data-a` attributes (both `.w` and `.rub` spans).

## Interaction Model

### Single Ayah (Tap)
1. User taps any word/rub span
2. JS reads `data-s` and `data-a` from the target
3. All spans with matching `data-s:data-a` receive `.sel` CSS class (gold highlight)
4. JS sends `postMessage` with ayah data + tap coordinates to RN
5. RN renders the context popup at the received coordinates

### Range Selection (Tap-Start, Tap-End)

**No drag gesture** — drag conflicts with PagerView's horizontal swipe for page navigation.

Instead, a two-tap model:
1. First tap selects start ayah (highlighted, RN popup shows)
2. User taps a second ayah while popup is visible → range extends from start to the second tap
3. All ayahs between start and end get `.sel` class
4. JS sends updated range + new coordinates to RN; popup repositions
5. Tapping the same already-selected ayah deselects it

This avoids any gesture conflict with PagerView's swipe navigation.

### Deselect
- Tap anywhere outside a word span → JS clears `.sel` from all spans, sends `{type:"deselect"}` to RN → RN hides popup
- Swiping to a new page → `MushafReader` calls `clearSelection()` via `webViewRef.injectJavaScript()` on page change, and hides the RN popup

### Edge Cases
- **Ayahs spanning multiple lines:** All matching spans get highlighted regardless of which `<div class="l">` they are in
- **Range across surahs:** Selection tracks by DOM order, so crossing a surah boundary works naturally
- **Range across pages:** Not supported. Page navigation clears any active selection. This is a non-goal for v1.
- **Popup near edges:** RN positions popup above the tap point; if too close to the top, places it below. Horizontal position clamped to screen bounds.
- **Rapid double-tap:** JS debounces taps (~150ms) to prevent select/deselect flicker.

## Context Popup (React Native Component)

### Visual Design
- Native `View` with `position: absolute`, rendered as an overlay inside `MushafReader`
- Gold/amber themed: `#B8965A` border, `#FFF8F0` background, slight shadow
- Small arrow/caret pointing toward the selected text (flips when popup is below)
- Horizontal row of `Pressable` icon buttons with Arabic labels
- RTL layout

### Menu Items

| MaterialCommunityIcons name | Label | Action Key |
|-----------------------------|-------|------------|
| `play` | تشغيل | `play` |
| `book-open-variant` | تفسير | `tafsir` |
| `bookmark-outline` | حفظ | `bookmark` |
| `content-copy` | نسخ | `copy` |
| `share-variant` | مشاركة | `share` |
| `abjad-arabic` | كلمة | `wordByWord` |

Note: verify `abjad-arabic` exists in the bundled `@expo/vector-icons` version at implementation time. Fallback: `translate`.

### Copy Action
The Uthmani text is not available in QCF codes, so RN looks up `text_uthmani` from the database and copies to clipboard. Will need `expo-clipboard` added as a dependency when wired up.

## Coordinate System

The WebView JS sends `event.clientX`/`event.clientY` as `x`/`y` in the postMessage. These are relative to the WebView viewport.

The RN popup overlay must be positioned within a container that exactly matches the WebView's bounds. If the WebView has a vertical offset (due to header, PageIndicator, etc.), the y-coordinate must be adjusted. Implementation should use `onLayout` on the WebView container to compute this offset if needed.

## Message Protocol

### WebView → React Native (selection events)

```json
{
  "type": "select",
  "startSurah": 2, "startAyah": 142,
  "endSurah": 2, "endAyah": 145,
  "x": 180, "y": 320
}
```

```json
{
  "type": "deselect"
}
```

JS guards against missing `window.ReactNativeWebView` before calling `postMessage`.

### React Native → WebView (clear selection on page change)

```js
webViewRef.current.injectJavaScript('clearSelection();true;')
```

The RN side receives messages via `WebViewMessageEvent` from `react-native-webview`.

## Types

```typescript
export interface AyahSelection {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export type AyahActionType = 'play' | 'tafsir' | 'bookmark' | 'copy' | 'share' | 'wordByWord';
```

## Highlight Styling

```css
.w, .rub { cursor: pointer; -webkit-tap-highlight-color: transparent; }
.w.sel, .rub.sel { background: rgba(184, 150, 90, 0.25); border-radius: 4px; }
```

Golden semi-transparent overlay matching the Mushaf's amber theme.

## JavaScript Placement

Selection JS is baked into the HTML string generated by `mushafHtml.ts`. This is consistent with the existing pattern (surah banner SVG, font scaling JS are already inline). The JS is small (tap handler + highlight toggle + postMessage) and the HTML cache in `useMushafPage.ts` (10-entry LRU) remains appropriate.

No popup HTML/CSS in the WebView — the popup is a native RN component.

## Ref Pattern

`MushafPage` uses the **callback prop pattern** (not `forwardRef`):
- Receives `onMessage` callback prop from `MushafReader`
- Receives a `clearSelectionRef` (mutable ref object) that `MushafPage` attaches its internal `clearSelection` function to

This avoids `forwardRef` ceremony for a simple parent-child relationship.

## Files Changed

| File | Change |
|------|--------|
| `src/components/quran/mushafHtml.ts` | Wrap all words in `<span class="w" data-s data-a>`, add selection JS (tap handler, highlight, postMessage, clearSelection), highlight CSS |
| `src/components/quran/MushafPage.tsx` | Add WebView ref, `onMessage` handler (`WebViewMessageEvent`), accept `clearSelectionRef` prop |
| `src/components/quran/MushafReader.tsx` | Render `AyahPopup` overlay, manage selection state, clear selection on page change, pass `onAyahAction` up |
| `src/components/quran/AyahPopup.tsx` | **New file** — floating context popup with `MaterialCommunityIcons` buttons |
| `src/data/types.ts` | Add `AyahSelection`, `AyahActionType` types |

One new file (`AyahPopup.tsx`). No new dependencies for v1.

## V1 Scope

### Included
- Word-level span wrapping with ayah metadata (all char types)
- Tap to select single ayah with gold highlight
- Tap-to-extend range selection (two-tap model)
- Tap outside to deselect, page change clears selection
- Native RN context popup with `MaterialCommunityIcons`
- `postMessage` for selection events, `injectJavaScript` for clear
- Action callbacks forwarded from `MushafReader`

### Placeholder (wired in later phases)
- Audio playback
- Tafsir/translation view
- Word-by-word view
- Share (native share sheet, needs `expo-sharing`)
- Bookmark persistence
- Copy (needs `expo-clipboard` + Uthmani text lookup from DB via new `getAyahsByRange` repo function)

## Non-Goals
- Bottom sheet (using context popup instead)
- Audio player UI
- Tafsir rendering
- Range selection via drag gesture
- Range selection across pages
- Accessibility (ARIA roles, VoiceOver) — future enhancement
