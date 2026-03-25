# Ayah Selection Behavior Redesign — Spec

## Problem

The current ayah selection has two issues:
1. No clear way to deselect — on full pages there's no empty space to tap
2. Drag-to-select doesn't work — users expect to drag vertically across ayahs to select a range

## Redesigned Interaction Model

### Single Ayah (Tap)
1. User taps any word
2. That ayah highlights (gold), popup appears near the tap
3. Any previous selection is cleared first (always fresh)

### Range Selection (Long-press + Vertical Drag)
1. User long-presses (`LONG_PRESS_DELAY = 300`ms) on any word — enters selection drag mode
2. The initial ayah highlights immediately on long-press
3. User drags finger vertically — selection is always a **contiguous range from the start ayah to the current ayah** (by DOM order). If current ayah is above the start ayah, the range goes upward.
4. If user drags back up, the range shrinks (end ayah moves up to match finger position)
5. On finger lift (`touchend`) — selection is finalized, popup appears

### Deselect
- **Tap any already-selected ayah** → clears ALL selection, hides popup
- **Tap the X button on popup** → clears ALL selection, hides popup
- **Swipe to new page** → clears ALL selection via `injectJavaScript`

There is no partial deselect. Selection is either fresh or fully cleared.

### PagerView Coexistence
- Normal quick horizontal swipe → page turn (always works)
- Long-press + vertical drag → selection mode (PagerView does not interfere because the gesture starts with a hold, not a swipe)
- During drag selection, `e.preventDefault()` stops WebView-level scroll/swipe behavior
- **Android note:** If PagerView intercepts touch events before the WebView on Android, the fallback is to send a `postMessage` from WebView to RN when drag mode starts, and RN calls `pagerRef.current?.setScrollEnabled(false)` during drag, re-enabling on `touchend`. This is a known pattern for WebView-inside-PagerView on Android.

## Changes to WebView JavaScript

### Replace the click-based handler with touch-based handler

The current `document.body.addEventListener('click', ...)` is replaced with touch handlers.

**Constants:**
```javascript
var LONG_PRESS_DELAY = 300;
```

**State variables:**
```javascript
var sel = { active: false, startS: 0, startA: 0, endS: 0, endA: 0 };
var longPressTimer = null;
var isDragging = false;
var touchStartAyah = null;
```

**Touch handlers:**
- `touchstart`: Record touch target ayah, start `LONG_PRESS_DELAY` timer. If timer fires → enter drag mode, highlight the starting ayah.
- `touchmove`: If in drag mode, use `document.elementFromPoint(touch.clientX, touch.clientY)` to find the ayah under the finger. Selection is always a contiguous range from start ayah to current ayah. Use `requestAnimationFrame` gating to avoid jank (only process one touchmove per frame). Call `e.preventDefault()` to stop scroll.
- `touchend`: If drag mode → finalize selection, show popup via `postMessage`. If NOT drag mode (timer didn't fire) → treat as a tap: if tapped ayah is already selected → deselect all; else → select single ayah.
- `touchcancel`: Cancel long-press timer, clear drag state.

**`elementFromPoint` fallback:** If `elementFromPoint` returns null or a non-word element during drag, keep the previous selection state (don't flicker).

### Highlight logic

Since selection is always a contiguous range (start to current), use the existing `highlightRange(s1, a1, s2, a2)` approach — iterate all `[data-s]` spans, highlight those between start and end. No Set needed.

### `clearSelection()` remains a global function

`clearSelection()` must remain callable from `injectJavaScript('clearSelection();true;')` since `MushafPage.clearSelection` depends on it. It clears all `.sel` classes, resets `sel.active = false`, cancels any in-progress drag, and sends `{type:'deselect'}`.

### postMessage format (unchanged)
```json
{
  "type": "select",
  "startSurah": 2, "startAyah": 142,
  "endSurah": 2, "endAyah": 145,
  "x": 180, "y": 320
}
```

```json
{ "type": "deselect" }
```

## Changes to AyahPopup (React Native)

Add an **X close button** in the top-right corner of the popup container:
- `MaterialCommunityIcons` `close` icon, 16px icon size
- Minimum 32x32 hit target (using padding) for accessibility
- On press → calls `onDismiss` which clears selection
- Supplements (does not replace) the tap-on-selected-ayah dismiss mechanism

## Files Changed

| File | Change |
|------|--------|
| `src/components/quran/mushafHtml.ts` | Replace click handler with touch-based long-press + drag handler, contiguous range highlight |
| `src/components/quran/AyahPopup.tsx` | Add X close button with 32x32 hit target |

No new files. No new dependencies.

## What stays the same
- HTML structure (spans with `data-s`/`data-a`) — no change
- CSS highlight styles — no change
- `highlightRange()` function — reused (contiguous range model)
- MushafPage `onMessage`/`clearSelectionRef` — no change
- MushafReader selection state/popup rendering — no change
- postMessage protocol — no change
- Font scaling JS — no change
