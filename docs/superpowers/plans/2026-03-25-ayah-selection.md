# Ayah Selection & Context Popup — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable tap-to-select ayahs with gold highlighting and a native context popup with action buttons.

**Architecture:** WebView handles word-level span wrapping, tap detection, and highlight toggling. On selection, it sends ayah data + coordinates via `postMessage` to React Native. RN renders a floating `AyahPopup` component using `MaterialCommunityIcons`. Two-tap model for range selection (no drag, avoids PagerView swipe conflict).

**Tech Stack:** React Native, react-native-webview (postMessage/onMessage/injectJavaScript), @expo/vector-icons (MaterialCommunityIcons), TypeScript.

**Spec:** `docs/superpowers/specs/2026-03-25-ayah-selection-design.md`

---

### Task 1: Add types

**Files:**
- Modify: `src/data/types.ts`

- [ ] **Step 1: Add AyahSelection and AyahActionType to types.ts**

Add after the `PageMarker` interface (line 61):

```typescript
export interface AyahSelection {
  startSurah: number;
  startAyah: number;
  endSurah: number;
  endAyah: number;
}

export type AyahActionType = 'play' | 'tafsir' | 'bookmark' | 'copy' | 'share' | 'wordByWord';
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit 2>&1 | grep types.ts`
Expected: no errors from types.ts

- [ ] **Step 3: Commit**

```bash
git add src/data/types.ts
git commit -m "feat(ayah-selection): add AyahSelection and AyahActionType types"
```

---

### Task 2: Wrap words in selectable spans in mushafHtml.ts

**Files:**
- Modify: `src/components/quran/mushafHtml.ts`

This is the core HTML change. Every word becomes a `<span class="w" data-s data-a>`. The rub special case also gets data attributes.

- [ ] **Step 1: Update buildLine to wrap words in spans**

Replace the `buildLine` function (lines 44-55) with:

```typescript
  const buildLine = (line: MushafLine) => {
    const cls = line.isCentered ? 'lc' : 'l';
    const text = line.words.map((w) => {
      const ds = w.surahNumber;
      const da = w.ayahNumber;
      // Detect ۞ rub al-hizb glyph: first word of an ayah with space-separated code
      if (w.wordPosition === 1 && w.codeV2.includes(' ')) {
        const parts = w.codeV2.split(' ');
        return `<span class="rub" data-s="${ds}" data-a="${da}">۞</span> <span class="w" data-s="${ds}" data-a="${da}">${parts.slice(1).join(' ')}</span>`;
      }
      return `<span class="w" data-s="${ds}" data-a="${da}">${w.codeV2}</span>`;
    }).join(' ');
    return `<div class="${cls}">${text}</div>`;
  };
```

- [ ] **Step 2: Add highlight CSS**

In the `<style>` block, after the `.rub` rule (line 179), add:

```css
.w,.rub{cursor:pointer;-webkit-tap-highlight-color:transparent}
.w.sel,.rub.sel{background:rgba(184,150,90,0.25);border-radius:4px}
```

- [ ] **Step 3: Add selection JavaScript**

Replace the existing `<script>` block (lines 184-199) with the combined font-scaling + selection JS:

```javascript
document.fonts.ready.then(function(){
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    var els=document.querySelectorAll('.l');
    for(var i=0;i<els.length;i++){
      if(els[i].parentElement&&els[i].parentElement.classList.contains('group'))continue;
      var cw=els[i].clientWidth;
      var sw=els[i].scrollWidth;
      if(sw>0&&cw>0){
        var s=cw/sw;
        if(s>0.3&&s<1.5)els[i].style.transform='scaleX('+s+')';
      }
    }
  })});
});

// --- Ayah selection ---
var sel={active:false,startS:0,startA:0,endS:0,endA:0};
var debounce=0;

function getAyah(el){
  while(el&&!el.dataset.s)el=el.parentElement;
  if(!el||!el.dataset.s)return null;
  return{s:+el.dataset.s,a:+el.dataset.a};
}

function clearSelection(){
  document.querySelectorAll('.sel').forEach(function(e){e.classList.remove('sel')});
  sel.active=false;
  postMsg({type:'deselect'});
}

function highlightRange(s1,a1,s2,a2){
  document.querySelectorAll('.sel').forEach(function(e){e.classList.remove('sel')});
  var spans=document.querySelectorAll('[data-s]');
  var inRange=false,pastEnd=false;
  for(var i=0;i<spans.length;i++){
    var sp=spans[i],ss=+sp.dataset.s,sa=+sp.dataset.a;
    if(ss===s1&&sa===a1)inRange=true;
    if(inRange&&pastEnd&&!(ss===s2&&sa===a2)){inRange=false;break;}
    if(inRange)sp.classList.add('sel');
    if(ss===s2&&sa===a2)pastEnd=true;
  }
}

function postMsg(data){
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));
}

document.body.addEventListener('click',function(e){
  var now=Date.now();
  if(now-debounce<150)return;
  debounce=now;

  var ayah=getAyah(e.target);
  if(!ayah){clearSelection();return;}

  if(sel.active){
    // Second tap: same ayah = deselect, different = extend range
    if(ayah.s===sel.startS&&ayah.a===sel.startA&&ayah.s===sel.endS&&ayah.a===sel.endA){
      clearSelection();return;
    }
    // Extend range: determine order by DOM position
    var first=ayah,last={s:sel.startS,a:sel.startA};
    var spans=document.querySelectorAll('[data-s]');
    for(var i=0;i<spans.length;i++){
      var ss=+spans[i].dataset.s,sa=+spans[i].dataset.a;
      if(ss===sel.startS&&sa===sel.startA){first={s:sel.startS,a:sel.startA};last=ayah;break;}
      if(ss===ayah.s&&sa===ayah.a){first=ayah;last={s:sel.startS,a:sel.startA};break;}
    }
    sel.startS=first.s;sel.startA=first.a;sel.endS=last.s;sel.endA=last.a;
    highlightRange(first.s,first.a,last.s,last.a);
    postMsg({type:'select',startSurah:first.s,startAyah:first.a,endSurah:last.s,endAyah:last.a,x:e.clientX,y:e.clientY});
  } else {
    // First tap: select single ayah
    sel.active=true;
    sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
    highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
    postMsg({type:'select',startSurah:ayah.s,startAyah:ayah.a,endSurah:ayah.s,endAyah:ayah.a,x:e.clientX,y:e.clientY});
  }
});
```

- [ ] **Step 4: Remove unused markerElements variable**

Delete line 149-150 (`const markerElements = '';`).

- [ ] **Step 5: Verify HTML renders correctly**

Run: `npx tsc --noEmit 2>&1 | grep mushafHtml`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/quran/mushafHtml.ts
git commit -m "feat(ayah-selection): wrap words in selectable spans with highlight JS"
```

---

### Task 3: Wire up MushafPage with onMessage and clearSelection

**Files:**
- Modify: `src/components/quran/MushafPage.tsx`

- [ ] **Step 1: Update MushafPage to accept new props and handle messages**

Replace the entire file with:

```typescript
import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { useMushafPage } from '../../hooks/useMushafPage';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { ErrorState } from '../ui/ErrorState';
import { useStrings } from '../../constants/strings';

interface MushafPageProps {
  pageNumber: number;
  onSelectionEvent?: (data: unknown) => void;
  clearSelectionRef?: React.MutableRefObject<(() => void) | null>;
}

export function MushafPage({ pageNumber, onSelectionEvent, clearSelectionRef }: MushafPageProps) {
  const { html, loading, error, retry } = useMushafPage(pageNumber);
  const strings = useStrings();
  const webViewRef = useRef<WebView>(null);

  // Attach clearSelection to the ref so parent can call it
  const clearSelection = useCallback(() => {
    webViewRef.current?.injectJavaScript('clearSelection();true;');
  }, []);

  React.useEffect(() => {
    if (clearSelectionRef) clearSelectionRef.current = clearSelection;
  }, [clearSelectionRef, clearSelection]);

  const handleMessage = useCallback((event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      onSelectionEvent?.(data);
    } catch {}
  }, [onSelectionEvent]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (error || !html) {
    const errorMessage = error === 'font_load_error'
      ? strings.mushafFontLoadError
      : strings.mushafPageLoadError;
    return <ErrorState message={errorMessage} onRetry={retry} />;
  }

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={styles.webview}
        scrollEnabled={false}
        javaScriptEnabled={true}
        originWhitelist={['*']}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onMessage={handleMessage}
        accessibilityLabel={`Mushaf page ${pageNumber}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep MushafPage`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/quran/MushafPage.tsx
git commit -m "feat(ayah-selection): add onMessage and clearSelection to MushafPage"
```

---

### Task 4: Create AyahPopup component

**Files:**
- Create: `src/components/quran/AyahPopup.tsx`

- [ ] **Step 1: Create the popup component**

```typescript
import React from 'react';
import { View, Text, Pressable, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { AyahSelection, AyahActionType } from '../../data/types';

interface AyahPopupProps {
  selection: AyahSelection;
  x: number;
  y: number;
  onAction: (action: AyahActionType, selection: AyahSelection) => void;
  onDismiss: () => void;
}

const POPUP_HEIGHT = 72;
const POPUP_WIDTH = 280;
const ARROW_SIZE = 8;

const actions: Array<{ key: AyahActionType; icon: string; label: string }> = [
  { key: 'play', icon: 'play', label: 'تشغيل' },
  { key: 'tafsir', icon: 'book-open-variant', label: 'تفسير' },
  { key: 'bookmark', icon: 'bookmark-outline', label: 'حفظ' },
  { key: 'copy', icon: 'content-copy', label: 'نسخ' },
  { key: 'share', icon: 'share-variant', label: 'مشاركة' },
  { key: 'wordByWord', icon: 'abjad-arabic', label: 'كلمة' },
];

export function AyahPopup({ selection, x, y, onAction, onDismiss }: AyahPopupProps) {
  const screenWidth = Dimensions.get('window').width;
  const showBelow = y < POPUP_HEIGHT + ARROW_SIZE + 20;
  const top = showBelow ? y + ARROW_SIZE + 10 : y - POPUP_HEIGHT - ARROW_SIZE - 10;
  const clampedLeft = Math.max(8, Math.min(x - POPUP_WIDTH / 2, screenWidth - POPUP_WIDTH - 8));

  return (
    <View style={[styles.container, { top, left: clampedLeft }]} pointerEvents="box-none">
      {/* Arrow */}
      <View style={[
        styles.arrow,
        showBelow ? styles.arrowUp : styles.arrowDown,
        { left: Math.max(20, x - clampedLeft - ARROW_SIZE) },
      ]} />
      {/* Actions row */}
      <View style={styles.popup}>
        {actions.map((a) => (
          <Pressable
            key={a.key}
            style={styles.actionBtn}
            onPress={() => onAction(a.key, selection)}
          >
            <MaterialCommunityIcons name={a.icon as any} size={20} color="#5C4033" />
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  popup: {
    flexDirection: 'row',
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#B8965A',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  actionLabel: {
    fontSize: 9,
    color: '#5C4033',
    marginTop: 2,
    fontWeight: '500' as const,
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE,
    borderRightWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  arrowUp: {
    top: -ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderBottomColor: '#B8965A',
  },
  arrowDown: {
    bottom: -ARROW_SIZE,
    borderTopWidth: ARROW_SIZE,
    borderTopColor: '#B8965A',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep AyahPopup`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/quran/AyahPopup.tsx
git commit -m "feat(ayah-selection): create AyahPopup context menu component"
```

---

### Task 5: Wire up MushafReader with popup and selection state

**Files:**
- Modify: `src/components/quran/MushafReader.tsx`

- [ ] **Step 1: Update MushafReader to manage selection state and render popup**

Replace the entire file with:

```typescript
import React, { useCallback, useRef, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import PagerView, { type PagerViewOnPageSelectedEvent } from 'react-native-pager-view';
import { MushafPage } from './MushafPage';
import { PageIndicator } from './PageIndicator';
import { AyahPopup } from './AyahPopup';
import { useReadingStore } from '../../stores/readingStore';
import type { AyahSelection, AyahActionType } from '../../data/types';

const TOTAL_PAGES = 604;
const PAGE_RENDER_BUFFER = 2;

interface MushafReaderProps {
  initialPage: number;
  onPageChange?: (pageNumber: number) => void;
  onAyahAction?: (action: AyahActionType, selection: AyahSelection) => void;
}

export function MushafReader({ initialPage, onPageChange, onAyahAction }: MushafReaderProps) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const pagerRef = useRef<PagerView>(null);
  const setLastReadPage = useReadingStore((s) => s.setLastReadPage);

  // Selection state
  const [selection, setSelection] = useState<AyahSelection | null>(null);
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const clearSelectionRef = useRef<(() => void) | null>(null);

  const handlePageSelected = useCallback(
    (event: PagerViewOnPageSelectedEvent) => {
      const pageNumber = event.nativeEvent.position + 1;
      setCurrentPage(pageNumber);
      setLastReadPage(pageNumber);
      onPageChange?.(pageNumber);
      // Clear selection on page change
      setSelection(null);
      clearSelectionRef.current?.();
    },
    [setLastReadPage, onPageChange]
  );

  const handleSelectionEvent = useCallback((data: any) => {
    if (data.type === 'select') {
      setSelection({
        startSurah: data.startSurah,
        startAyah: data.startAyah,
        endSurah: data.endSurah,
        endAyah: data.endAyah,
      });
      setPopupPos({ x: data.x, y: data.y });
    } else if (data.type === 'deselect') {
      setSelection(null);
    }
  }, []);

  const handleAction = useCallback((action: AyahActionType, sel: AyahSelection) => {
    onAyahAction?.(action, sel);
    // Dismiss popup after action (except for range-related actions)
    setSelection(null);
    clearSelectionRef.current?.();
  }, [onAyahAction]);

  const handleDismiss = useCallback(() => {
    setSelection(null);
    clearSelectionRef.current?.();
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage - 1}
        offscreenPageLimit={1}
        layoutDirection="rtl"
        onPageSelected={handlePageSelected}
      >
        {Array.from({ length: TOTAL_PAGES }, (_, index) => {
          const pageNumber = index + 1;
          const isNearby = Math.abs(pageNumber - currentPage) <= PAGE_RENDER_BUFFER;
          return (
            <View key={`page-${pageNumber}`} style={styles.pageContainer}>
              {isNearby ? (
                <MushafPage
                  pageNumber={pageNumber}
                  onSelectionEvent={pageNumber === currentPage ? handleSelectionEvent : undefined}
                  clearSelectionRef={pageNumber === currentPage ? clearSelectionRef : undefined}
                />
              ) : (
                <View style={styles.placeholder}>
                  <ActivityIndicator size="small" color="#C8A96E" />
                </View>
              )}
            </View>
          );
        })}
      </PagerView>

      {/* Ayah context popup overlay */}
      {selection && (
        <AyahPopup
          selection={selection}
          x={popupPos.x}
          y={popupPos.y}
          onAction={handleAction}
          onDismiss={handleDismiss}
        />
      )}

      <PageIndicator currentPage={currentPage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F2',
  },
  pager: {
    flex: 1,
  },
  pageContainer: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAF8F2',
  },
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep -E "MushafReader|MushafPage|AyahPopup"`
Expected: no errors from these files

- [ ] **Step 3: Commit**

```bash
git add src/components/quran/MushafReader.tsx
git commit -m "feat(ayah-selection): wire up selection state and AyahPopup in MushafReader"
```

---

### Task 6: Clear HTML cache and test end-to-end

**Files:**
- Modify: `src/hooks/useMushafPage.ts` (clear stale cache on startup)

- [ ] **Step 1: Clear the HTML cache to pick up new span-wrapped HTML**

The LRU cache in `useMushafPage.ts` caches old HTML (without spans). Users need to restart the app to clear the in-memory cache. No code change needed — the cache is in-memory and clears on restart.

- [ ] **Step 2: Run type check on full project**

Run: `npx tsc --noEmit --pretty 2>&1 | head -30`
Expected: no new errors from our modified files

- [ ] **Step 3: Manual test checklist**

Open the app in the simulator and verify:
1. Words on the Mushaf page are tappable — tapping a word highlights all words in that ayah (gold)
2. Tapping a different ayah while one is selected extends the range (both ayahs highlighted)
3. Tapping outside any word deselects all
4. The context popup appears near the tapped position with 6 icon buttons
5. Tapping an action button in the popup triggers the callback (check console logs)
6. Swiping to a new page dismisses the popup and clears highlights
7. The `۞` rub marker is still visible and tappable
8. Font scaling still works correctly (text fits within lines)

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat(ayah-selection): complete v1 ayah selection with context popup"
```
