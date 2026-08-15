import type { MushafWord, MushafLine, PageMarker } from '../../data/types';
import { surahHasBismillah } from '../../constants/quran';
import { getNightReadingPalette, type NightReadingMode } from '../../constants/nightReading';
import { isSurahEndingLine } from './surahLine';
import { isMadaniCenterAlignedLine } from './madaniLineLayout';

export interface BismillahData {
  codes: string; // QCF v2 codes for Bismillah from page 1
  fontBase64: string; // Page 1 font data
}

export interface MushafHtmlOptions {
  pageNumber: number;
  words: MushafWord[];
  fontBase64: string;
  fontSizeScale?: number;
  surahNumber?: number;
  bismillah?: BismillahData;
  markers?: PageMarker[];
  nightReadingMode?: NightReadingMode;
  surahNames?: Record<number, string>;
}

function cssNumber(value: number): string {
  return Number(value.toFixed(3)).toString();
}

export function generateMushafHtml(opts: MushafHtmlOptions): string {
  const {
    words,
    fontBase64,
    fontSizeScale = 1,
    surahNumber,
    bismillah,
    nightReadingMode = 'off',
    surahNames = {},
  } = opts;
  const palette = getNightReadingPalette(nightReadingMode);
  const bodyFontVw = cssNumber(7 * fontSizeScale);
  const bismillahFontVw = cssNumber(5.5 * fontSizeScale);
  const bismillahFontPx = cssNumber(24 * fontSizeScale);
  const lineMap = new Map<number, MushafWord[]>();
  for (const word of words) {
    const existing = lineMap.get(word.lineNumber);
    if (existing) {
      existing.push(word);
    } else {
      lineMap.set(word.lineNumber, [word]);
    }
  }

  const lines: MushafLine[] = [];
  const sortedKeys = Array.from(lineMap.keys()).sort((a, b) => a - b);
  for (const lineNum of sortedKeys) {
    const lineWords = lineMap.get(lineNum)!;
    const isCentered = isMadaniCenterAlignedLine(opts.pageNumber, lineNum);
    lines.push({ lineNumber: lineNum, words: lineWords, isCentered });
  }

  const isSurahStart = surahNumber !== undefined;
  const isFullPage = lines.length >= 9;
  const frameSvg = `<svg viewBox="0 0 440 80" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${palette.accent}" stroke-linejoin="miter"><path d="M 22,6 L 418,6 L 440,40 L 418,74 L 22,74 L 0,40 Z" stroke-width="1.3"/><path d="M 28,12 L 412,12 L 432,40 L 412,68 L 28,68 L 8,40 Z" stroke-width=".6" opacity=".55"/></g><g transform="translate(12 40)"><rect x="-8" y="-8" width="16" height="16" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width="1.1" transform="rotate(45)"/><circle r="1.8" fill="${palette.accent}"/></g><g transform="translate(428 40)"><rect x="-8" y="-8" width="16" height="16" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width="1.1" transform="rotate(45)"/><circle r="1.8" fill="${palette.accent}"/></g><g transform="translate(220 6)"><rect x="-4" y="-4" width="8" height="8" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width=".9" transform="rotate(45)"/></g><g transform="translate(220 74)"><rect x="-4" y="-4" width="8" height="8" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width=".9" transform="rotate(45)"/></g></svg>`;

  const buildLine = (line: MushafLine) => {
    const isSurahEnd = isSurahEndingLine(line.words);
    const cls = `${line.isCentered ? 'lc' : 'l'}${isSurahEnd ? ' surahEnd' : ''}`;
    const attrs = isSurahEnd ? ' data-surah-end="true"' : '';
    const parts: string[] = [];
    let runSurah: number | null = null;
    let runAyah: number | null = null;
    let runTokens: string[] = [];

    const flushRun = () => {
      if (runSurah === null || runAyah === null || runTokens.length === 0) return;
      parts.push(`<span class="ayahRun" data-s="${runSurah}" data-a="${runAyah}">${runTokens.join('')}</span>`);
      runSurah = null;
      runAyah = null;
      runTokens = [];
    };

    for (const w of line.words) {
      if (runSurah !== w.surahNumber || runAyah !== w.ayahNumber) {
        flushRun();
        runSurah = w.surahNumber;
        runAyah = w.ayahNumber;
      }

      if (w.charType === 'end') {
        runTokens.push(
          `<span class="ayahMarker" data-wk="${w.canonicalWordKey ?? `${w.surahNumber}:${w.ayahNumber}:${w.wordPosition}`}" data-p="${w.wordPosition}">${w.codeV2}</span>`
        );
        continue;
      }

      // Detect ۞ rub al-hizb glyph: first word of an ayah with space-separated code
      if (w.wordPosition === 1 && w.codeV2.includes(' ')) {
        const codeParts = w.codeV2.split(' ');
        runTokens.push(
          `<span class="rub">۞</span><span class="w" data-wk="${w.canonicalWordKey ?? `${w.surahNumber}:${w.ayahNumber}:${w.wordPosition}`}" data-p="${w.wordPosition}">${codeParts.slice(1).join(' ')}</span>`
        );
      } else {
        runTokens.push(
          `<span class="w" data-wk="${w.canonicalWordKey ?? `${w.surahNumber}:${w.ayahNumber}:${w.wordPosition}`}" data-p="${w.wordPosition}">${w.codeV2}</span>`
        );
      }
    }

    flushRun();
    const text = parts.join('');
    return `<div class="${cls}"${attrs}><span class="lineInner">${text}</span></div>`;
  };

  const buildBanner = (surah: number, inSlot = false) =>
    `<div class="sb${inSlot ? ' slot' : ''}">${frameSvg}<span class="sn">${surahNames[surah] ?? ''}</span></div>`;

  const buildBismillah = (inSlot = false) =>
    `<div class="bsm${inSlot ? ' slot' : ''}">${bismillah?.codes ?? ''}</div>`;

  // Include page 1 font face if bismillah data is available
  const bismillahFontFace = bismillah
    ? `@font-face{font-family:'QCF1';src:url(data:font/woff2;base64,${bismillah.fontBase64});font-display:block}`
    : '';

  let bodyContent: string;

  if (isSurahStart && !isFullPage) {
    // Compact layout (e.g., Al-Fatiha, Al-Baqarah) — single surah, centered
    const hasBismillah = surahHasBismillah(surahNumber!) && !!bismillah;
    const banner = buildBanner(surahNumber!);
    const bsm = hasBismillah ? buildBismillah() : '';
    const textLines = lines.map(buildLine).join('\n');
    bodyContent = `<div class="group">\n${banner}\n${bsm}\n${textLines}\n</div>`;
  } else {
    // Full 15-slot layout — handles multiple surahs, trailing banners
    const slotOverrides = new Map<number, string>();

    // Find all distinct surah starts (ayah 1) on this page
    const surahStarts: number[] = [];
    for (const word of words) {
      if (word.ayahNumber === 1 && word.wordPosition === 1 && !surahStarts.includes(word.surahNumber)) {
        surahStarts.push(word.surahNumber);
      }
    }

    // For each surah start, assign banner + bismillah to empty slots before it
    for (const sn of surahStarts) {
      const firstLine = lines.find(
        (l) => l.words.some((w) => w.surahNumber === sn && w.ayahNumber === 1)
      );
      if (!firstLine) continue;

      // Collect unassigned empty slots before this surah's first line
      const emptyBefore: number[] = [];
      for (let s = 1; s < firstLine.lineNumber; s++) {
        if (!lines.find((l) => l.lineNumber === s) && !slotOverrides.has(s)) {
          emptyBefore.push(s);
        }
      }

      const needsBismillah = surahHasBismillah(sn) && !!bismillah;

      if (emptyBefore.length >= 2) {
        // 2+ empty slots: banner + bismillah (use last two, closest to text)
        slotOverrides.set(emptyBefore[emptyBefore.length - 2], buildBanner(sn, true));
        if (needsBismillah) {
          slotOverrides.set(emptyBefore[emptyBefore.length - 1], buildBismillah(true));
        }
      } else if (emptyBefore.length === 1) {
        // 1 empty slot: banner was on previous page, bismillah only
        if (needsBismillah) {
          slotOverrides.set(emptyBefore[0], buildBismillah(true));
        }
      }
    }

    // Trailing banner: if page ends before line 15, show next surah's banner
    const maxLineWithData = Math.max(...lines.map((l) => l.lineNumber));
    if (maxLineWithData < 15) {
      const lastSurahOnPage = Math.max(...words.map((w) => w.surahNumber));
      const nextSurah = lastSurahOnPage + 1;
      if (nextSurah <= 114) {
        const trailingSlot = maxLineWithData + 1;
        if (!slotOverrides.has(trailingSlot)) {
          slotOverrides.set(trailingSlot, buildBanner(nextSurah, true));
        }
      }
    }

    const slots: string[] = [];
    for (let slot = 1; slot <= 15; slot++) {
      const line = lines.find((l) => l.lineNumber === slot);
      if (line) {
        slots.push(buildLine(line));
      } else if (slotOverrides.has(slot)) {
        slots.push(slotOverrides.get(slot)!);
      } else {
        slots.push('<div class="empty"></div>');
      }
    }
    bodyContent = slots.join('\n');
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
@font-face{font-family:'QCF';src:url(data:font/woff2;base64,${fontBase64});font-display:block}
${bismillahFontFace}
@font-palette-values --QcfSepia{font-family:'QCF';base-palette:2}
@font-palette-values --QcfBismillahSepia{font-family:'QCF1';base-palette:2}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;max-width:100vw;overflow:visible}
body{background:${palette.background};color:${palette.foreground};font-family:'QCF';font-palette:--QcfSepia;font-size:${bodyFontVw}vw;direction:rtl;padding:1vh 4vw;-webkit-user-select:none;user-select:none;position:relative;touch-action:pan-x}
#pageViewport{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:visible}
#pageCanvas{flex:none;width:100%;height:100%;direction:rtl;display:grid;grid-template-rows:repeat(15,minmax(0,1fr))}
#pageCanvas.compact{display:flex;flex-direction:column;justify-content:center}
.l,.lc,.empty{min-height:0;height:100%;width:100%;max-width:100%;overflow:visible;display:flex;align-items:center;white-space:nowrap;line-height:1.05}
.l{justify-content:stretch;transform-origin:center center}
.lc{justify-content:center;transform-origin:center center}
.lineInner{display:flex;align-items:center;direction:rtl;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}
.l .lineInner{width:100%;justify-content:space-between}
.lc .lineInner{width:auto;justify-content:center;gap:.18em}
.ayahRun{display:contents}
.w,.ayahMarker,.rub{display:inline-flex;align-items:center;flex:0 0 auto}
.group{height:100%;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:1vh}
.group .l,.group .lc{height:auto;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-size:inherit}
.sb{position:relative;text-align:center;direction:ltr;margin:0 0 0.5vh}
.sb svg{width:100%;height:auto;display:block}
.sb .sn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Geeza Pro','Arial',serif;font-size:min(5.2vw,22px);color:${palette.foreground};white-space:nowrap}
.sb.slot{min-height:0;height:100%;display:flex;align-items:center;justify-content:center;margin:0}
.sb.slot svg{width:100%;height:auto;max-height:100%}
.bsm{display:flex;align-items:center;justify-content:center;color:${palette.foreground};font-family:'QCF1';font-palette:--QcfBismillahSepia;font-size:min(${bismillahFontVw}vw,${bismillahFontPx}px);white-space:nowrap}
.bsm.slot{min-height:0;height:100%}
.rub{font-family:'Noto Naskh Arabic',serif;color:${palette.accent};font-size:1.8em;line-height:0.5;vertical-align:middle}
.ayahRun,.w,.ayahMarker,.rub{cursor:pointer;-webkit-tap-highlight-color:transparent}
.ayahRun.sel>.w,.ayahRun.sel>.ayahMarker,.ayahRun.sel>.rub{background:${palette.selectedBackground};border-radius:4px;box-shadow:inset 0 0 0 1px ${palette.selectedBorder}}
.ayahRun.playing>.w,.ayahRun.playing>.ayahMarker,.ayahRun.playing>.rub{background:${palette.selectedBackground};border-radius:4px;box-shadow:inset 0 0 0 1px ${palette.accent};transition:background 120ms ease,box-shadow 120ms ease}
</style>
</head>
<body>
<div id="pageViewport"><div id="pageCanvas" class="${isFullPage ? 'full' : 'compact'}">${bodyContent}</div></div>
<script>
function naturalLineWidth(inner){
  var tokens=inner.querySelectorAll('.w,.ayahMarker,.rub'),width=0;
  tokens.forEach(function(token){width+=token.getBoundingClientRect().width});
  var gap=parseFloat(getComputedStyle(inner).columnGap)||0;
  return width+Math.max(0,tokens.length-1)*gap;
}
function fitPageFont(){
  var canvas=document.getElementById('pageCanvas'),available=canvas.clientWidth,scale=1;
  var targetAvailable=Math.max(0,available-(canvas.classList.contains('compact')?32:0));
  canvas.style.fontSize='';
  document.querySelectorAll('.lineInner').forEach(function(inner){
    var naturalWidth=Math.max(inner.clientWidth,naturalLineWidth(inner));
    if(naturalWidth>0)scale=Math.min(scale,targetAvailable/naturalWidth);
    var row=inner.parentElement;
    if(canvas.classList.contains('full')&&row&&row.clientHeight>0&&inner.scrollHeight>0){
      scale=Math.min(scale,(row.clientHeight*.94)/inner.scrollHeight);
    }
  });
  if(scale<1){
    var fontSize=parseFloat(getComputedStyle(canvas).fontSize);
    canvas.style.fontSize=(fontSize*scale)+'px';
  }
}
function announceReady(){postMsg({type:'ready'})}
function fitAndAnnounce(){fitPageFont();announceReady()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){requestAnimationFrame(fitAndAnnounce)});
window.addEventListener('load',fitAndAnnounce);window.addEventListener('resize',fitPageFont);

// --- Ayah selection ---
var sel={active:false,startS:0,startA:0,endS:0,endA:0};
var LONG_PRESS_DELAY=300;
// A touch that travels further than this is a page swipe, not a selection. Leaving
// the pending long press armed let the reader eat the swipe the pager needed.
var MOVE_SLOP=10;
var longPressTimer=null;
var isDragging=false;
var touchStartAyah=null;
var touchStartPoint=null;
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
  touchStartAyah=null;
  touchStartPoint=null;
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  postMsg({type:'deselect'});
}

function setPlayingAyah(s,a){
  document.querySelectorAll('.playing').forEach(function(e){e.classList.remove('playing')});
  if(s==null||a==null)return;
  var spans=document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]');
  for(var i=0;i<spans.length;i++)spans[i].classList.add('playing');
}
window.setPlayingAyah=setPlayingAyah;

function highlightRange(s1,a1,s2,a2){
  document.querySelectorAll('.sel').forEach(function(e){e.classList.remove('sel')});
  var runs=document.querySelectorAll('.ayahRun[data-s]');
  var inRange=false,pastEnd=false;
  for(var i=0;i<runs.length;i++){
    var sp=runs[i],ss=+sp.dataset.s,sa=+sp.dataset.a;
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
  var runs=document.querySelectorAll('.ayahRun[data-s]');
  for(var i=0;i<runs.length;i++){
    var ss=+runs[i].dataset.s,sa=+runs[i].dataset.a;
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
  touchStartPoint={x:t.clientX,y:t.clientY};
  longPressTimer=setTimeout(function(){
    isDragging=true;
    sel.active=true;
    sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
    highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
  },LONG_PRESS_DELAY);
},{passive:true});

document.body.addEventListener('touchmove',function(e){
  if(!isDragging){
    var m=e.touches[0];
    if(!m||!touchStartPoint)return;
    // Small jitter keeps the long press armed. A real swipe cancels it and is
    // left untouched so the native pager can turn the page.
    if(Math.abs(m.clientX-touchStartPoint.x)<=MOVE_SLOP&&Math.abs(m.clientY-touchStartPoint.y)<=MOVE_SLOP)return;
    if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
    touchStartAyah=null;
    touchStartPoint=null;
    return;
  }
  e.preventDefault();
  if(rafPending)return;
  var t=e.touches[0];
  if(!t)return;
  var cx=t.clientX,cy=t.clientY;
  rafPending=true;
  requestAnimationFrame(function(){
    rafPending=false;
    var el=document.elementFromPoint(cx,cy);
    var ayah=getAyah(el);
    if(!ayah)return;
    var ordered=orderByDom(touchStartAyah,ayah);
    sel.startS=ordered[0].s;sel.startA=ordered[0].a;
    sel.endS=ordered[1].s;sel.endA=ordered[1].a;
    highlightRange(sel.startS,sel.startA,sel.endS,sel.endA);
  });
},{passive:false});

document.body.addEventListener('touchend',function(e){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  if(isDragging){
    isDragging=false;
    touchStartPoint=null;
    var t=e.changedTouches[0];
    var x=t?t.clientX:0,y=t?t.clientY:0;
    postMsg({type:'select',startSurah:sel.startS,startAyah:sel.startA,endSurah:sel.endS,endAyah:sel.endA,x:x,y:y,openMenu:true});
    return;
  }
  if(!touchStartAyah)return;
  var ayah=touchStartAyah;
  touchStartAyah=null;
  touchStartPoint=null;
  var t2=e.changedTouches[0];
  var tx=t2?t2.clientX:0,ty=t2?t2.clientY:0;

  if(sel.active){
    var isSelected=false;
    var spans=document.querySelectorAll('.ayahRun[data-s="'+ayah.s+'"][data-a="'+ayah.a+'"]');
    for(var i=0;i<spans.length;i++){if(spans[i].classList.contains('sel')){isSelected=true;break;}}
    if(isSelected){clearSelection();return;}
  }
  sel.active=true;
  sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
  highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
  postMsg({type:'select',startSurah:ayah.s,startAyah:ayah.a,endSurah:ayah.s,endAyah:ayah.a,x:tx,y:ty,openMenu:true});
});

document.body.addEventListener('touchcancel',function(){
  if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
  isDragging=false;
  touchStartAyah=null;
  touchStartPoint=null;
});
</script>
</body>
</html>`;
}
