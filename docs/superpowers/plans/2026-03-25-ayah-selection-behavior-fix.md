# Ayah Selection Behavior Fix — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix ayah selection UX — tap to select/deselect, long-press + vertical drag for range, X button on popup.

**Architecture:** Replace the click-based handler in `mushafHtml.ts` with touch-based handlers (touchstart/touchmove/touchend). Long-press timer (300ms) distinguishes tap from drag. `highlightRange()` and `clearSelection()` are reused. Add X close button to `AyahPopup.tsx`.

**Tech Stack:** WebView inline JavaScript (touch events), React Native (AyahPopup component).

**Spec:** `docs/superpowers/specs/2026-03-25-ayah-selection-behavior-fix.md`

---

### Task 1: Replace click handler with touch-based selection JS

**Files:**
- Modify: `src/components/quran/mushafHtml.ts`

The existing `getAyah()`, `clearSelection()`, `highlightRange()`, and `postMsg()` functions (lines 205-232) stay unchanged. Only the click event listener (lines 201-265) and its state variables are replaced.

- [ ] **Step 1: Replace the selection state and event handler**

In `src/components/quran/mushafHtml.ts`, find the entire block from `// --- Ayah selection ---` (line 201) through `});` (line 265, the closing of the click listener). Replace it with:

```javascript
// --- Ayah selection ---
var sel={active:false,startS:0,startA:0,endS:0,endA:0};
var LONG_PRESS_DELAY=300;
var longPressTimer=null;
var isDragging=false;
var touchStartAyah=null;
var rafPending=false;

function getAyah(el){
  while(el&&!el.dataset.s)el=el.parentElement;
  if(!el||!el.dataset.s)return null;
  return{s:+el.dataset.s,a:+el.dataset.a};
}

function clearSelection(){
  document.querySelectorAll('.sel').forEach(function(e){e.classList.remove('sel')});
  sel.active=false;
  isDragging=false;
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
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

function orderByDom(a,b){
  // Return [first, last] in DOM order
  var spans=document.querySelectorAll('[data-s]');
  for(var i=0;i<spans.length;i++){
    var ss=+spans[i].dataset.s,sa=+spans[i].dataset.a;
    if(ss===a.s&&sa===a.a)return[a,b];
    if(ss===b.s&&sa===b.a)return[b,a];
  }
  return[a,b];
}

document.body.addEventListener('touchstart',function(e){
  var t=e.touches[0];
  if(!t)return;
  var ayah=getAyah(document.elementFromPoint(t.clientX,t.clientY));
  if(!ayah){return;}
  touchStartAyah=ayah;
  longPressTimer=setTimeout(function(){
    // Long-press fired: enter drag mode
    isDragging=true;
    sel.active=true;
    sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
    highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
  },LONG_PRESS_DELAY);
},{passive:true});

document.body.addEventListener('touchmove',function(e){
  if(!isDragging){
    // Finger moved before long-press fired: cancel long-press
    if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
    return;
  }
  e.preventDefault();
  if(rafPending)return;
  // Snapshot touch coordinates BEFORE rAF (TouchEvent may be recycled)
  var t=e.touches[0];
  if(!t)return;
  var cx=t.clientX,cy=t.clientY;
  rafPending=true;
  requestAnimationFrame(function(){
    rafPending=false;
    var el=document.elementFromPoint(cx,cy);
    var ayah=getAyah(el);
    if(!ayah)return; // keep previous state if no ayah under finger
    // Use touchStartAyah as stable anchor (never changes during drag)
    var ordered=orderByDom(touchStartAyah,ayah);
    sel.startS=ordered[0].s;sel.startA=ordered[0].a;
    sel.endS=ordered[1].s;sel.endA=ordered[1].a;
    highlightRange(sel.startS,sel.startA,sel.endS,sel.endA);
  });
},{passive:false});

document.body.addEventListener('touchend',function(e){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  if(isDragging){
    // Drag ended: finalize selection, show popup
    isDragging=false;
    var t=e.changedTouches[0];
    var x=t?t.clientX:0,y=t?t.clientY:0;
    postMsg({type:'select',startSurah:sel.startS,startAyah:sel.startA,endSurah:sel.endS,endAyah:sel.endA,x:x,y:y});
    return;
  }
  // Normal tap
  if(!touchStartAyah)return;
  var ayah=touchStartAyah;
  touchStartAyah=null;
  var t2=e.changedTouches[0];
  var tx=t2?t2.clientX:0,ty=t2?t2.clientY:0;

  if(sel.active){
    // Tap on already-selected ayah: deselect all
    var isSelected=false;
    var spans=document.querySelectorAll('[data-s="'+ayah.s+'"][data-a="'+ayah.a+'"]');
    for(var i=0;i<spans.length;i++){if(spans[i].classList.contains('sel')){isSelected=true;break;}}
    if(isSelected){clearSelection();return;}
  }
  // Fresh single-ayah select (clears any previous)
  sel.active=true;
  sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
  highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
  postMsg({type:'select',startSurah:ayah.s,startAyah:ayah.a,endSurah:ayah.s,endAyah:ayah.a,x:tx,y:ty});
});

document.body.addEventListener('touchcancel',function(){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  isDragging=false;
  touchStartAyah=null;
});
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep mushafHtml`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/quran/mushafHtml.ts
git commit -m "feat(ayah-selection): replace click handler with touch-based long-press + drag selection"
```

---

### Task 2: Add X close button to AyahPopup

**Files:**
- Modify: `src/components/quran/AyahPopup.tsx`

- [ ] **Step 1: Add close button to the popup**

In `src/components/quran/AyahPopup.tsx`, replace the return JSX (lines 33-55) with:

```tsx
  return (
    <View style={[styles.container, { top, left: clampedLeft }]} pointerEvents="box-none">
      {/* Arrow */}
      <View style={[
        styles.arrow,
        showBelow ? styles.arrowUp : styles.arrowDown,
        { left: Math.max(20, x - clampedLeft - ARROW_SIZE) },
      ]} />
      {/* Popup body */}
      <View style={styles.popup}>
        {/* X close button */}
        <Pressable onPress={onDismiss} style={styles.closeBtn} hitSlop={8}>
          <MaterialCommunityIcons name="close" size={16} color="#9CA3AF" />
        </Pressable>
        {/* Actions row */}
        <View style={styles.actionsRow}>
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
    </View>
  );
```

- [ ] **Step 2: Update styles — add closeBtn and actionsRow**

Replace the `popup` and `actionBtn` styles and add the new ones. The full styles block becomes:

```typescript
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  popup: {
    backgroundColor: '#FFF8F0',
    borderWidth: 1,
    borderColor: '#B8965A',
    borderRadius: 10,
    paddingTop: 2,
    paddingBottom: 6,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  closeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 16,
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

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit 2>&1 | grep AyahPopup`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/quran/AyahPopup.tsx
git commit -m "feat(ayah-selection): add X close button to AyahPopup"
```

---

### Task 3: Verify end-to-end

**Files:** None (verification only)

- [ ] **Step 1: Full type check**

Run: `npx tsc --noEmit --pretty 2>&1 | head -20`
Expected: only pre-existing errors (FlashList estimatedItemSize, LoadingSkeleton cursor)

- [ ] **Step 2: Verify clearSelection is still a global function**

Run: `grep -n 'function clearSelection' src/components/quran/mushafHtml.ts`
Expected: one match showing `function clearSelection(){`

- [ ] **Step 3: Verify highlightRange is preserved**

Run: `grep -n 'function highlightRange' src/components/quran/mushafHtml.ts`
Expected: one match

- [ ] **Step 4: Verify touch handlers are registered**

Run: `grep -c 'addEventListener.*touch' src/components/quran/mushafHtml.ts`
Expected: 4 (touchstart, touchmove, touchend, touchcancel)

- [ ] **Step 5: Verify X button exists in AyahPopup**

Run: `grep 'close' src/components/quran/AyahPopup.tsx`
Expected: matches for `closeBtn` style and `"close"` icon name

- [ ] **Step 6: Manual test checklist**

Open the app in the simulator and verify:
1. **Tap** a word → single ayah highlights gold, popup appears with X button
2. **Tap the same selected ayah** → deselects, popup disappears
3. **Tap a different unselected ayah** while one is selected → previous clears, new one selects
4. **Long-press (hold ~300ms) + drag down** → range of ayahs highlights as finger moves
5. **Drag back up** → range shrinks (unhighlights ayahs finger left)
6. **Lift finger** after drag → popup appears for the range
7. **Tap X button** on popup → clears selection
8. **Swipe to new page** → clears selection
9. **Horizontal swipe** (quick) → page turns normally, no accidental selection
10. Font scaling still works correctly
