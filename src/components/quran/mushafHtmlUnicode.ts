import type { MushafWord } from '../../data/types';
import { surahHasBismillah } from '../../constants/quran';
import { isSurahEndingLine } from './surahLine';

export interface UnicodeMushafHtmlOptions {
  pageNumber: number;
  words: MushafWord[];
  fontBase64: string;
  fontFamily: string;
  fontFormat: 'woff2' | 'opentype';
  fontMimeType: 'font/woff2' | 'font/otf';
  fontFeatureSettings?: string;
  fontSizeScale?: number;
  maxFontSizePx?: number;
  compactTopPaddingVh?: number;
  compactLineMinHeightVh?: number;
  minimumLineScale?: number;
  lineFitWidthRatio?: number;
  surahNumber?: number;
  bismillahText?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateUnicodeMushafHtml(opts: UnicodeMushafHtmlOptions): string {
  const {
    words,
    fontBase64,
    fontFamily,
    fontFormat,
    fontMimeType,
    fontFeatureSettings = '"liga" 1, "calt" 1, "rlig" 1',
    fontSizeScale = 1,
    maxFontSizePx,
    compactTopPaddingVh = 9,
    compactLineMinHeightVh = 7.2,
    minimumLineScale = 0.88,
    lineFitWidthRatio = 0.96,
    surahNumber,
    bismillahText,
  } = opts;
  const lineMap = new Map<number, MushafWord[]>();

  for (const word of words) {
    const lineWords = lineMap.get(word.lineNumber) ?? [];
    lineWords.push(word);
    lineMap.set(word.lineNumber, lineWords);
  }

  const lines = Array.from(lineMap.keys()).sort((a, b) => a - b);
  const hasMultipleSurahs = new Set(words.map((word) => word.surahNumber)).size > 1;
  const isCompact = !hasMultipleSurahs && lines.length <= 8;
  const bodyClass = isCompact ? 'compact' : `full${hasMultipleSurahs ? ' multiSurah' : ''}`;

  const frameSvg = `<svg viewBox="0 0 400 50" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f5e6c8"/><stop offset="50%" stop-color="#efe0c0"/><stop offset="100%" stop-color="#f5e6c8"/></linearGradient></defs><rect x="8" y="4" width="384" height="42" rx="3" fill="url(#bg)" stroke="#B8965A" stroke-width="1"/><rect x="4" y="1" width="392" height="48" rx="5" fill="none" stroke="#B8965A" stroke-width="0.8"/><circle cx="24" cy="25" r="8" fill="none" stroke="#C8A96E" stroke-width="0.6"/><circle cx="24" cy="25" r="4" fill="none" stroke="#C8A96E" stroke-width="0.4"/><circle cx="376" cy="25" r="8" fill="none" stroke="#C8A96E" stroke-width="0.6"/><circle cx="376" cy="25" r="4" fill="none" stroke="#C8A96E" stroke-width="0.4"/><path d="M36,25 C40,18 44,15 50,15 C44,15 40,12 36,5" fill="none" stroke="#C8A96E" stroke-width="0.5"/><path d="M36,25 C40,32 44,35 50,35 C44,35 40,38 36,45" fill="none" stroke="#C8A96E" stroke-width="0.5"/><path d="M364,25 C360,18 356,15 350,15 C356,15 360,12 364,5" fill="none" stroke="#C8A96E" stroke-width="0.5"/><path d="M364,25 C360,32 356,35 350,35 C356,35 360,38 364,45" fill="none" stroke="#C8A96E" stroke-width="0.5"/></svg>`;
  const buildBanner = (sn: number, inSlot = false) =>
    `<div class="sb${inSlot ? ' slot' : ''}">${frameSvg}<span class="sn">surah${String(sn).padStart(3, '0')}</span></div>`;

  const buildBismillah = (inSlot = false) =>
    bismillahText ? `<div class="bsm${inSlot ? ' slot' : ''}">${escapeHtml(bismillahText)}</div>` : '';

  const buildLine = (lineNumber: number) => {
    const lineWords = lineMap.get(lineNumber)!;
    const isSurahEnd = isSurahEndingLine(lineWords);
    const lineClass = `line${isSurahEnd ? ' surahEnd' : ''}`;
    const lineAttrs = isSurahEnd ? ' data-surah-end="true"' : '';
    const text = lineWords
      .map((word) => {
        const textValue = escapeHtml(word.codeV2);
        if (word.charType === 'end') {
          return `<span class="num ayah" data-s="${word.surahNumber}" data-a="${word.ayahNumber}"><span class="numText">${textValue}</span></span>`;
        }
        const cls = 'ayah';
        return `<span class="${cls}" data-s="${word.surahNumber}" data-a="${word.ayahNumber}">${textValue}</span>`;
      })
      .join('');
    return `<div class="${lineClass}" data-line="${lineNumber}"${lineAttrs}><span class="lineInner">${text}</span></div>`;
  };

  let bodyContent: string;

  if (!isCompact && hasMultipleSurahs) {
    const slotOverrides = new Map<number, string>();
    const surahStarts: number[] = [];
    for (const word of words) {
      if (word.ayahNumber === 1 && word.wordPosition === 1 && !surahStarts.includes(word.surahNumber)) {
        surahStarts.push(word.surahNumber);
      }
    }

    for (const sn of surahStarts) {
      const firstLine = lines.find((lineNumber) =>
        lineMap.get(lineNumber)!.some((word) => word.surahNumber === sn && word.ayahNumber === 1)
      );
      if (!firstLine) continue;

      const emptyBefore: number[] = [];
      for (let slot = 1; slot < firstLine; slot++) {
        if (!lineMap.has(slot) && !slotOverrides.has(slot)) {
          emptyBefore.push(slot);
        }
      }

      const needsBismillah = surahHasBismillah(sn) && !!bismillahText;
      if (needsBismillah && emptyBefore.length >= 2) {
        slotOverrides.set(emptyBefore[emptyBefore.length - 2], buildBanner(sn, true));
        slotOverrides.set(emptyBefore[emptyBefore.length - 1], buildBismillah(true));
      } else if (emptyBefore.length >= 1) {
        slotOverrides.set(emptyBefore[emptyBefore.length - 1], buildBanner(sn, true));
      }
    }

    const slots: string[] = [];
    for (let slot = 1; slot <= 15; slot++) {
      if (lineMap.has(slot)) {
        slots.push(buildLine(slot));
      } else if (slotOverrides.has(slot)) {
        slots.push(slotOverrides.get(slot)!);
      } else {
        slots.push('<div class="empty"></div>');
      }
    }
    bodyContent = slots.join('\n');
  } else {
    const banner = surahNumber !== undefined ? buildBanner(surahNumber) : '';
    const bismillah = buildBismillah();
    const lineContent = lines.map(buildLine).join('\n');
    bodyContent = `${banner}${bismillah}${lineContent}`;
  }

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
@font-face{font-family:'${fontFamily}';src:url(data:${fontMimeType};base64,${fontBase64}) format('${fontFormat}');font-display:block}
@font-face{font-family:'SurahNames';src:url('https://static-cdn.tarteel.ai/qul/fonts/surah-names/v4/surah-name-v4.ttf') format('truetype');font-display:swap}
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;overflow:hidden}
body{width:100%;height:100%;background:#F5EEDB;color:#0E2724;font-family:'${fontFamily}',serif;font-feature-settings:${fontFeatureSettings};font-variant-ligatures:normal;text-rendering:optimizeLegibility;direction:rtl;display:flex;flex-direction:column;justify-content:center;padding:0 4vw;-webkit-user-select:none;user-select:none}
#content{width:100%;min-width:0;height:100%;display:flex;flex-direction:column;justify-content:center}
body.compact #content{justify-content:flex-start;padding-top:${compactTopPaddingVh}vh}
.sb{position:relative;text-align:center;direction:ltr;margin:0 2vw 2.4vh}
.sb svg{width:100%;height:auto;display:block}
.sb .sn{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'SurahNames';font-size:min(7vw,30px);color:#0E2724;white-space:nowrap}
.sb.slot{height:calc(100%/15);display:flex;align-items:center;justify-content:center;margin:0 2vw}
.sb.slot svg{width:100%;height:auto;display:block}
.bsm{text-align:center;margin:0.2vh 0 2.2vh;color:#0E2724;font-size:0.86em;white-space:nowrap}
.bsm.slot{height:calc(100%/15);display:flex;align-items:center;justify-content:center;margin:0}
.line{width:100%;height:calc(100%/15);display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:visible;min-width:0}
.empty{height:calc(100%/15)}
.lineInner{display:inline-flex;flex:0 0 auto;align-items:center;justify-content:center;gap:0.26em;white-space:nowrap;max-width:none;font-feature-settings:inherit;font-variant-ligatures:inherit;line-height:1.7}
body.compact .line{height:auto;min-height:${compactLineMinHeightVh}vh;margin:0.2vh 0}
.ayah{cursor:pointer;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;flex:0 0 auto;min-width:0}
.num{font-family:'Noto Naskh Arabic','Arial',serif;color:#B8923F;white-space:nowrap;width:1.32em;height:1.32em;border:1px solid #B8923F;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:0.54em;line-height:1;flex:0 0 auto;margin:0 0.08em}
.numText{transform:translateY(-0.02em)}
.ayah.sel{background:rgba(11,93,83,0.10);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(11,93,83,0.35)}
</style>
</head>
<body class="${bodyClass}">
<div id="content">${bodyContent}</div>
<script>
var fontSizeScale=${fontSizeScale};
var maxFontSizePx=${maxFontSizePx ?? 'null'};
var minimumLineScale=${minimumLineScale};
var lineFitWidthRatio=${lineFitWidthRatio};
var shouldJustifyFullLines=document.body.classList.contains('full')&&!document.body.classList.contains('multiSurah');
var minJustifyWidthRatio=0.84;
var fitTimer=0;
function getBaseFontSize(){
  var isCompact=document.body.classList.contains('compact');
  var compactMax=maxFontSizePx||34;
  var fullMax=maxFontSizePx||38;
  var base=isCompact?Math.min(compactMax,window.innerWidth*0.064):Math.min(fullMax,window.innerWidth*0.07);
  return Math.max(16,base*fontSizeScale);
}
function fitLines(){
  var lines=[].slice.call(document.querySelectorAll('.line'));
  var minScale=1;
  lines.forEach(function(line){
    var inner=line.querySelector('.lineInner');
    if(!inner)return;
    inner.style.transform='';
    inner.style.fontSize='';
    inner.style.width='';
    inner.style.justifyContent='';
    var cw=line.clientWidth*lineFitWidthRatio;
    var sw=inner.getBoundingClientRect().width;
    if(sw>cw&&sw>0&&cw>0)minScale=Math.min(minScale,cw/sw);
  });
  if(minScale<minimumLineScale){
    var content=document.getElementById('content');
    var current=parseFloat(content.style.fontSize)||getBaseFontSize();
    content.style.fontSize=Math.max(16,current*(minScale/minimumLineScale))+'px';
  }
  lines.forEach(function(line){
    var inner=line.querySelector('.lineInner');
    if(!inner)return;
    inner.style.transform='';
    inner.style.fontSize='';
    inner.style.width='';
    inner.style.justifyContent='';
    var cw=line.clientWidth*lineFitWidthRatio;
    var sw=inner.getBoundingClientRect().width;
    if(sw>cw&&sw>0&&cw>0){
      var scale=cw/sw;
      inner.style.fontSize=scale+'em';
    }else{
      var isSurahEndLine=line.dataset.surahEnd==='true';
      var itemCount=inner.children.length;
      if(shouldJustifyFullLines&&!isSurahEndLine&&itemCount>1&&sw<cw&&sw>=cw*minJustifyWidthRatio){
        inner.style.width=cw+'px';
        inner.style.justifyContent='space-between';
      }
    }
  });
}
function fitPage(){
  var content=document.getElementById('content');
  content.style.fontSize=getBaseFontSize()+'px';
  requestAnimationFrame(function(){
    fitLines();
    requestAnimationFrame(fitLines);
  });
}
function scheduleFit(){
  clearTimeout(fitTimer);
  fitTimer=setTimeout(fitPage,0);
}
if(document.fonts&&document.fonts.ready){
  document.fonts.ready.then(scheduleFit).catch(scheduleFit);
}else{
  scheduleFit();
}
window.addEventListener('load', scheduleFit);
window.addEventListener('resize', scheduleFit);
setTimeout(fitPage,200);
setTimeout(fitPage,800);
scheduleFit();

var sel={active:false,s:0,a:0};
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
function highlightAyah(s,a){
  document.querySelectorAll('.sel').forEach(function(e){e.classList.remove('sel')});
  document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]').forEach(function(e){e.classList.add('sel')});
}
function postMsg(data){
  if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));
}
document.body.addEventListener('touchend',function(e){
  var t=e.changedTouches[0];
  if(!t)return;
  var ay=getAyah(document.elementFromPoint(t.clientX,t.clientY));
  if(!ay)return;
  if(sel.active&&sel.s===ay.s&&sel.a===ay.a){clearSelection();return;}
  sel.active=true;sel.s=ay.s;sel.a=ay.a;
  highlightAyah(ay.s,ay.a);
  postMsg({type:'select',startSurah:ay.s,startAyah:ay.a,endSurah:ay.s,endAyah:ay.a,x:t.clientX,y:t.clientY});
});
</script>
</body>
</html>`;
}
