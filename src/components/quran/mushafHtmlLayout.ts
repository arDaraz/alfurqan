import type { MushafLine } from '../../data/types';
import type { MushafLayoutDescriptor } from '../../data/mushafLayouts';
import { getNightReadingPalette, type NightReadingMode } from '../../constants/nightReading';

export interface LayoutMushafHtmlOptions {
  layout: MushafLayoutDescriptor;
  pageNumber: number;
  lines: MushafLine[];
  fontBase64: string;
  surahNames: Record<number, string>;
  fontSizeScale?: number;
  nightReadingMode?: NightReadingMode;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function generateLayoutMushafHtml({
  layout,
  lines,
  fontBase64,
  surahNames,
  fontSizeScale = 1,
  nightReadingMode = 'off',
}: LayoutMushafHtmlOptions): string {
  const palette = getNightReadingPalette(nightReadingMode);
  const frameSvg = `<svg viewBox="0 0 440 56" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="${palette.accent}"><path d="M20 3h400l18 25-18 25H20L2 28Z" stroke-width="1.2"/><path d="M27 8h386l14 20-14 20H27L13 28Z" stroke-width=".55" opacity=".55"/></g><circle cx="17" cy="28" r="2" fill="${palette.accent}"/><circle cx="423" cy="28" r="2" fill="${palette.accent}"/></svg>`;

  const renderedLines = lines.map((line) => {
    if (line.lineType === 'surah_name') {
      const name = line.surahNumber ? surahNames[line.surahNumber] ?? '' : '';
      return `<div class="line special surahHeader" data-line="${line.lineNumber}">${frameSvg}<span class="surahName">${escapeHtml(name)}</span></div>`;
    }
    if (line.lineType === 'basmallah') {
      return `<div class="line special basmallah" data-line="${line.lineNumber}">بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِیْمِ</div>`;
    }
    if (line.lineType === 'empty' || line.words.length === 0) {
      return `<div class="line empty" data-line="${line.lineNumber}" aria-hidden="true"></div>`;
    }

    const tokens = line.words.map((word) => {
      const key = word.canonicalWordKey ?? `${word.surahNumber}:${word.ayahNumber}:${word.wordPosition}`;
      return `<span class="token ${word.charType}" data-s="${word.surahNumber}" data-a="${word.ayahNumber}" data-p="${word.wordPosition}" data-wk="${key}">${escapeHtml(word.codeV2)}</span>`;
    }).join('');
    return `<div class="line ayahLine ${line.isCentered ? 'centered' : 'justified'}" data-line="${line.lineNumber}"><div class="lineInner">${tokens}</div></div>`;
  }).join('\n');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,user-scalable=no">
<style>
@font-face{font-family:'IndoPakPack';src:url(data:font/woff2;base64,${fontBase64}) format('woff2');font-display:block}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:visible;background:${palette.background};color:${palette.foreground}}
body{padding:1.2vh 3.2vw;direction:rtl;-webkit-user-select:none;user-select:none;touch-action:pan-x}
#pageViewport{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:visible}
#pageCanvas{width:100%;height:100%;display:grid;grid-template-rows:repeat(${layout.linesPerPage},minmax(0,1fr));font-family:'IndoPakPack',serif;font-size:min(${(7.1 * fontSizeScale).toFixed(3)}vw,${(34 * fontSizeScale).toFixed(2)}px);font-feature-settings:'liga' 1,'calt' 1,'rlig' 1;text-rendering:optimizeLegibility}
.line{min-width:0;min-height:0;width:100%;height:100%;display:flex;align-items:center;overflow:visible;white-space:nowrap;line-height:1}
.lineInner{min-width:0;width:auto;display:flex;align-items:center;white-space:nowrap;direction:rtl}
.centered{justify-content:center}.centered .lineInner{justify-content:center;gap:.23em}
.justified .lineInner{width:100%;justify-content:space-between;gap:.08em}
.token{display:inline-flex;align-items:center;flex:0 0 auto;cursor:pointer;-webkit-tap-highlight-color:transparent;border-radius:4px;padding:.03em .015em}
.token.end{margin-inline-start:.03em}
.token.sel{background:${palette.selectedBackground};box-shadow:inset 0 0 0 1px ${palette.selectedBorder}}
.token.playing{background:${palette.selectedBackground};box-shadow:inset 0 0 0 1px ${palette.accent}}
.special{position:relative;justify-content:center;text-align:center}
.surahHeader svg{width:100%;height:88%;display:block}
.surahName{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:'IndoPakPack',serif;font-size:.58em;color:${palette.foreground}}
.basmallah{font-size:.72em}
</style>
</head>
<body>
<div id="pageViewport"><main id="pageCanvas" aria-label="${escapeHtml(layout.displayName.ar)}">${renderedLines}</main></div>
<script>
function naturalLineWidth(inner){
  var tokens=inner.querySelectorAll('.token'),width=0;
  tokens.forEach(function(token){width+=token.getBoundingClientRect().width});
  var gap=parseFloat(getComputedStyle(inner).columnGap)||0;
  return width+Math.max(0,tokens.length-1)*gap;
}
function fitPageFont(){
  var canvas=document.getElementById('pageCanvas');
  canvas.style.fontSize='';
  var available=canvas.clientWidth;
  var scale=1;
  document.querySelectorAll('.lineInner').forEach(function(inner){
    var naturalWidth=Math.max(inner.clientWidth,naturalLineWidth(inner));
    if(naturalWidth>0)scale=Math.min(scale,available/naturalWidth);
    var row=inner.parentElement;
    if(row&&row.clientHeight>0&&inner.scrollHeight>0){
      scale=Math.min(scale,(row.clientHeight*.94)/inner.scrollHeight);
    }
  });
  if(scale<1){
    var fontSize=parseFloat(getComputedStyle(canvas).fontSize);
    canvas.style.fontSize=(fontSize*scale)+'px';
  }
}
function fitAndAnnounce(){fitPageFont();postMsg({type:'ready'})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){requestAnimationFrame(fitAndAnnounce)});
window.addEventListener('load',fitAndAnnounce);window.addEventListener('resize',fitPageFont);

var selection=null,longPressTimer=null,startPoint=null,moved=false,longPressed=false;
function tokenAt(x,y){var el=document.elementFromPoint(x,y);return el&&el.closest?el.closest('.token[data-wk]'):null}
function clearSelection(){document.querySelectorAll('.sel').forEach(function(el){el.classList.remove('sel')});selection=null;postMsg({type:'deselect'})}
function highlight(s,a){document.querySelectorAll('.sel').forEach(function(el){el.classList.remove('sel')});document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]').forEach(function(el){el.classList.add('sel')})}
function postMsg(data){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data))}
function selectToken(token,x,y,openMenu){var s=+token.dataset.s,a=+token.dataset.a;selection={s:s,a:a};highlight(s,a);postMsg({type:'select',startSurah:s,startAyah:a,endSurah:s,endAyah:a,wordPosition:+token.dataset.p,canonicalWordKey:token.dataset.wk,x:x,y:y,openMenu:openMenu})}
function setPlayingAyah(s,a){document.querySelectorAll('.playing').forEach(function(el){el.classList.remove('playing')});if(s==null||a==null)return;document.querySelectorAll('[data-s="'+s+'"][data-a="'+a+'"]').forEach(function(el){el.classList.add('playing')})}
window.clearSelection=clearSelection;window.setPlayingAyah=setPlayingAyah;
document.body.addEventListener('touchstart',function(event){var touch=event.touches[0];if(!touch)return;var token=tokenAt(touch.clientX,touch.clientY);if(!token)return;startPoint={x:touch.clientX,y:touch.clientY,token:token};moved=false;longPressed=false;longPressTimer=setTimeout(function(){longPressTimer=null;if(startPoint&&!moved){longPressed=true;selectToken(startPoint.token,startPoint.x,startPoint.y,true)}},450)},{passive:true});
document.body.addEventListener('touchmove',function(event){if(!startPoint)return;var touch=event.touches[0];if(!touch)return;if(Math.abs(touch.clientX-startPoint.x)>10||Math.abs(touch.clientY-startPoint.y)>10){moved=true;if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null}}},{passive:true});
document.body.addEventListener('touchend',function(event){if(longPressTimer){clearTimeout(longPressTimer);longPressTimer=null}if(!startPoint||moved){startPoint=null;longPressed=false;return}if(longPressed){startPoint=null;longPressed=false;return}var touch=event.changedTouches[0],token=startPoint.token;startPoint=null;if(selection&&selection.s===+token.dataset.s&&selection.a===+token.dataset.a){clearSelection();return}selectToken(token,touch?touch.clientX:0,touch?touch.clientY:0,true)},{passive:true});
document.body.addEventListener('touchcancel',function(){if(longPressTimer)clearTimeout(longPressTimer);longPressTimer=null;startPoint=null;moved=false;longPressed=false},{passive:true});
</script>
</body>
</html>`;
}
