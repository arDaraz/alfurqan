import type { MushafWord, MushafLine, PageMarker } from '../../data/types';
import { surahHasBismillah } from '../../constants/quran';
import { getNightReadingPalette, type NightReadingMode } from '../../constants/nightReading';
import { isSurahEndingLine } from './surahLine';

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
  } = opts;
  const palette = getNightReadingPalette(nightReadingMode);
  const bodyFontVw = cssNumber(7 * fontSizeScale);
  const compactFontVw = cssNumber(7 * fontSizeScale);
  const compactFontPx = cssNumber(28 * fontSizeScale);
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
    const isSurahEnd = isSurahEndingLine(lineWords);
    const isCentered =
      isSurahEnd ||
      lineWords.length <= 2 &&
      lineWords.every((w) => w.charType !== 'word');
    lines.push({ lineNumber: lineNum, words: lineWords, isCentered });
  }

  const isSurahStart = surahNumber !== undefined;
  const isFullPage = lines.length >= 9;
  const surahCode = surahNumber !== undefined
    ? `surah${String(surahNumber).padStart(3, '0')}`
    : '';

  const frameSvg = `<svg viewBox="0 0 440 80" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${palette.accent}" stroke-linejoin="miter"><path d="M 22,6 L 418,6 L 440,40 L 418,74 L 22,74 L 0,40 Z" stroke-width="1.3"/><path d="M 28,12 L 412,12 L 432,40 L 412,68 L 28,68 L 8,40 Z" stroke-width=".6" opacity=".55"/></g><g transform="translate(12 40)"><rect x="-8" y="-8" width="16" height="16" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width="1.1" transform="rotate(45)"/><circle r="1.8" fill="${palette.accent}"/></g><g transform="translate(428 40)"><rect x="-8" y="-8" width="16" height="16" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width="1.1" transform="rotate(45)"/><circle r="1.8" fill="${palette.accent}"/></g><g transform="translate(220 6)"><rect x="-4" y="-4" width="8" height="8" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width=".9" transform="rotate(45)"/></g><g transform="translate(220 74)"><rect x="-4" y="-4" width="8" height="8" fill="${palette.ornamentFill}" stroke="${palette.accent}" stroke-width=".9" transform="rotate(45)"/></g></svg>`;

  const buildLine = (line: MushafLine) => {
    const isSurahEnd = isSurahEndingLine(line.words);
    const cls = line.isCentered ? `lc${isSurahEnd ? ' surahEnd' : ''}` : 'l';
    const attrs = isSurahEnd ? ' data-surah-end="true"' : '';
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
    return `<div class="${cls}"${attrs}><span class="lineInner">${text}</span></div>`;
  };

  const buildBanner = (code: string, inSlot = false) =>
    `<div class="sb${inSlot ? ' slot' : ''}">${frameSvg}<span class="sn">${code}</span></div>`;

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
    const banner = buildBanner(surahCode);
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

      const code = `surah${String(sn).padStart(3, '0')}`;
      const needsBismillah = surahHasBismillah(sn) && !!bismillah;

      if (emptyBefore.length >= 2) {
        // 2+ empty slots: banner + bismillah (use last two, closest to text)
        slotOverrides.set(emptyBefore[emptyBefore.length - 2], buildBanner(code, true));
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
          const code = `surah${String(nextSurah).padStart(3, '0')}`;
          slotOverrides.set(trailingSlot, buildBanner(code, true));
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
@font-face{font-family:'SurahNames';src:url('https://static-cdn.tarteel.ai/qul/fonts/surah-names/v4/surah-name-v4.ttf') format('truetype');font-display:swap}
${bismillahFontFace}
@font-palette-values --QcfSepia{font-family:'QCF';base-palette:2}
@font-palette-values --QcfBismillahSepia{font-family:'QCF1';base-palette:2}
*{margin:0;padding:0;box-sizing:border-box}
html{min-height:100%;max-width:100vw;overflow-x:hidden;overflow-y:auto;-webkit-overflow-scrolling:touch}
body{width:100%;max-width:100vw;overflow-x:hidden;min-height:100%;height:auto;background:${palette.background};color:${palette.foreground};font-family:'QCF';font-palette:--QcfSepia;font-size:${bodyFontVw}vw;direction:rtl;display:flex;flex-direction:column;padding:0 4vw max(12vh,72px);-webkit-user-select:none;user-select:none;position:relative}
.l,.lc,.empty{min-height:max(calc(100vh/15),2.2em);height:auto;width:100%;max-width:100%;overflow:hidden;display:flex;align-items:center;white-space:nowrap;transform-origin:right center;line-height:1.2}
.l{justify-content:center;transform-origin:center center}
.lc{justify-content:center;transform-origin:center center}
.lineInner{display:inline-block;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}
.group{min-height:100vh;display:flex;flex-direction:column;justify-content:center;align-items:stretch;gap:1vh;margin-bottom:10vh}
.group .l,.group .lc{height:auto;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-size:min(${compactFontVw}vw,${compactFontPx}px)}
.sb{position:relative;text-align:center;direction:ltr;margin:0 0 0.5vh}
.sb svg{width:100%;height:auto;display:block}
.sb .sn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'SurahNames';font-size:min(6.5vw,28px);color:${palette.foreground};white-space:nowrap}
.sb.slot{min-height:max(calc(100vh/15),2.2em);height:auto;display:flex;align-items:center;justify-content:center;margin:0}
.sb.slot svg{width:100%;height:auto;max-height:100%}
.bsm{display:flex;align-items:center;justify-content:center;color:${palette.foreground};font-family:'QCF1';font-palette:--QcfBismillahSepia;font-size:min(${bismillahFontVw}vw,${bismillahFontPx}px);white-space:nowrap}
.bsm.slot{min-height:max(calc(100vh/15),2.2em);height:auto}
.rub{font-family:'Noto Naskh Arabic',serif;color:${palette.accent};font-size:1.8em;line-height:0.5;vertical-align:middle}
.w,.rub{cursor:pointer;-webkit-tap-highlight-color:transparent}
.w.sel,.rub.sel{background:${palette.selectedBackground};border-radius:4px;box-shadow:inset 0 0 0 1px ${palette.selectedBorder}}
</style>
</head>
<body>
${bodyContent}
<script>
document.fonts.ready.then(function(){
  requestAnimationFrame(function(){requestAnimationFrame(function(){
    var els=document.querySelectorAll('.l,.lc');
    for(var i=0;i<els.length;i++){
      var inner=els[i].querySelector('.lineInner');
      if(!inner)continue;
      inner.style.transform='';
      els[i].style.justifyContent='';
      var cw=els[i].clientWidth;
      var sw=inner.scrollWidth||inner.getBoundingClientRect().width;
      if(sw>0&&cw>0){
        var s=cw/sw;
        if(s>0.3&&s<1)inner.style.transform='scaleX('+s+')';
        else els[i].style.justifyContent='center';
      }
    }
  })});
});

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
    isDragging=true;
    sel.active=true;
    sel.startS=ayah.s;sel.startA=ayah.a;sel.endS=ayah.s;sel.endA=ayah.a;
    highlightRange(ayah.s,ayah.a,ayah.s,ayah.a);
  },LONG_PRESS_DELAY);
},{passive:true});

document.body.addEventListener('touchmove',function(e){
  if(!isDragging){
    if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null;}
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
    var t=e.changedTouches[0];
    var x=t?t.clientX:0,y=t?t.clientY:0;
    postMsg({type:'select',startSurah:sel.startS,startAyah:sel.startA,endSurah:sel.endS,endAyah:sel.endA,x:x,y:y});
    return;
  }
  if(!touchStartAyah)return;
  var ayah=touchStartAyah;
  touchStartAyah=null;
  var t2=e.changedTouches[0];
  var tx=t2?t2.clientX:0,ty=t2?t2.clientY:0;

  if(sel.active){
    var isSelected=false;
    var spans=document.querySelectorAll('[data-s="'+ayah.s+'"][data-a="'+ayah.a+'"]');
    for(var i=0;i<spans.length;i++){if(spans[i].classList.contains('sel')){isSelected=true;break;}}
    if(isSelected){clearSelection();return;}
  }
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
</script>
</body>
</html>`;
}
