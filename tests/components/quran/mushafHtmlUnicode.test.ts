import { generateUnicodeMushafHtml } from '../../../src/components/quran/mushafHtmlUnicode';
import type { MushafWord } from '../../../src/data/types';

const words: MushafWord[] = [
  {
    id: 1,
    surahNumber: 2,
    ayahNumber: 1,
    wordPosition: 1,
    pageNumber: 2,
    lineNumber: 3,
    codeV2: 'الٓمّٓۚ‏',
    charType: 'word',
  },
  {
    id: 2,
    surahNumber: 2,
    ayahNumber: 1,
    wordPosition: 2,
    pageNumber: 2,
    lineNumber: 3,
    codeV2: '١',
    charType: 'end',
  },
];

const fullPageWords: MushafWord[] = Array.from({ length: 15 }, (_, index) => ({
  id: index + 1,
  surahNumber: 2,
  ayahNumber: 25 + index,
  wordPosition: 1,
  pageNumber: 4,
  lineNumber: index + 1,
  codeV2: 'ٱلَّذِينَ',
  charType: 'word',
}));

const fullPageWordsWithSurahEnd: MushafWord[] = [
  ...Array.from({ length: 14 }, (_, index) => ({
    id: index + 1,
    surahNumber: 2,
    ayahNumber: 25 + index,
    wordPosition: 1,
    pageNumber: 604,
    lineNumber: index + 1,
    codeV2: 'ٱلَّذِينَ',
    charType: 'word' as const,
  })),
  {
    id: 15,
    surahNumber: 112,
    ayahNumber: 4,
    wordPosition: 1,
    pageNumber: 604,
    lineNumber: 15,
    codeV2: 'وَلَمْ',
    charType: 'word',
  },
  {
    id: 16,
    surahNumber: 112,
    ayahNumber: 4,
    wordPosition: 2,
    pageNumber: 604,
    lineNumber: 15,
    codeV2: 'يَكُن',
    charType: 'word',
  },
  {
    id: 17,
    surahNumber: 112,
    ayahNumber: 4,
    wordPosition: 3,
    pageNumber: 604,
    lineNumber: 15,
    codeV2: '٤',
    charType: 'end',
  },
];

const multiSurahFullPageWords: MushafWord[] = [
  { id: 1, surahNumber: 112, ayahNumber: 1, wordPosition: 1, pageNumber: 604, lineNumber: 3, codeV2: 'قُلْ', charType: 'word' },
  { id: 2, surahNumber: 112, ayahNumber: 1, wordPosition: 2, pageNumber: 604, lineNumber: 3, codeV2: 'هُوَ', charType: 'word' },
  { id: 3, surahNumber: 112, ayahNumber: 1, wordPosition: 3, pageNumber: 604, lineNumber: 3, codeV2: '١', charType: 'end' },
  { id: 4, surahNumber: 112, ayahNumber: 2, wordPosition: 1, pageNumber: 604, lineNumber: 3, codeV2: 'اللَّهُ', charType: 'word' },
  { id: 5, surahNumber: 112, ayahNumber: 2, wordPosition: 2, pageNumber: 604, lineNumber: 3, codeV2: '٢', charType: 'end' },
  { id: 6, surahNumber: 112, ayahNumber: 3, wordPosition: 1, pageNumber: 604, lineNumber: 3, codeV2: 'لَمْ', charType: 'word' },
  { id: 7, surahNumber: 112, ayahNumber: 3, wordPosition: 2, pageNumber: 604, lineNumber: 3, codeV2: '٣', charType: 'end' },
  { id: 8, surahNumber: 112, ayahNumber: 4, wordPosition: 1, pageNumber: 604, lineNumber: 4, codeV2: 'وَلَمْ', charType: 'word' },
  { id: 9, surahNumber: 112, ayahNumber: 4, wordPosition: 2, pageNumber: 604, lineNumber: 4, codeV2: '٤', charType: 'end' },
  { id: 10, surahNumber: 113, ayahNumber: 1, wordPosition: 1, pageNumber: 604, lineNumber: 7, codeV2: 'قُلْ', charType: 'word' },
  { id: 11, surahNumber: 113, ayahNumber: 1, wordPosition: 2, pageNumber: 604, lineNumber: 7, codeV2: '١', charType: 'end' },
  { id: 12, surahNumber: 113, ayahNumber: 2, wordPosition: 1, pageNumber: 604, lineNumber: 7, codeV2: 'مِنْ', charType: 'word' },
  { id: 13, surahNumber: 113, ayahNumber: 2, wordPosition: 2, pageNumber: 604, lineNumber: 7, codeV2: '٢', charType: 'end' },
  { id: 14, surahNumber: 113, ayahNumber: 3, wordPosition: 1, pageNumber: 604, lineNumber: 7, codeV2: 'وَمِنْ', charType: 'word' },
  { id: 15, surahNumber: 113, ayahNumber: 3, wordPosition: 2, pageNumber: 604, lineNumber: 8, codeV2: '٣', charType: 'end' },
  { id: 16, surahNumber: 113, ayahNumber: 4, wordPosition: 1, pageNumber: 604, lineNumber: 8, codeV2: 'وَمِنْ', charType: 'word' },
  { id: 17, surahNumber: 113, ayahNumber: 4, wordPosition: 2, pageNumber: 604, lineNumber: 9, codeV2: '٤', charType: 'end' },
  { id: 18, surahNumber: 113, ayahNumber: 5, wordPosition: 1, pageNumber: 604, lineNumber: 9, codeV2: 'وَمِنْ', charType: 'word' },
  { id: 19, surahNumber: 113, ayahNumber: 5, wordPosition: 2, pageNumber: 604, lineNumber: 9, codeV2: '٥', charType: 'end' },
  { id: 20, surahNumber: 114, ayahNumber: 1, wordPosition: 1, pageNumber: 604, lineNumber: 12, codeV2: 'قُلْ', charType: 'word' },
  { id: 21, surahNumber: 114, ayahNumber: 1, wordPosition: 2, pageNumber: 604, lineNumber: 12, codeV2: '١', charType: 'end' },
];

describe('generateUnicodeMushafHtml', () => {
  it('embeds a WOFF2 IndoPak font as a data URI', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'IndopakNastaleeq',
      fontFormat: 'woff2',
      fontMimeType: 'font/woff2',
    });

    expect(html).toContain("@font-face{font-family:'IndopakNastaleeq'");
    expect(html).toContain("src:url(data:font/woff2;base64,font-data) format('woff2')");
  });

  it('renders ayah end words as visible IndoPak verse markers', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'digitalkhatt-indopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('<span class="num ayah" data-s="2" data-a="1"><span class="numText">١</span></span>');
  });

  it('enables required OpenType shaping features for Digital Khatt IndoPak', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      fontFeatureSettings: '"liga" 1, "calt" 1, "rlig" 1',
    });

    expect(html).toContain('font-feature-settings:"liga" 1, "calt" 1, "rlig" 1');
    expect(html).toContain('font-variant-ligatures:normal');
  });

  it('wraps each line in a measurable inner run and fits after WebView font loading', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('<div class="line" data-line="3"><span class="lineInner">');
    expect(html).toContain('inner.getBoundingClientRect().width');
    expect(html).toContain("inner.style.fontSize=scale+'em'");
    expect(html).toContain("window.addEventListener('load', scheduleFit)");
    expect(html).toContain('setTimeout(fitPage,200)');
  });

  it('prevents Unicode line runs from shrinking before they are measured', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('.lineInner{display:inline-flex;flex:0 0 auto;');
    expect(html).toContain('.ayah{cursor:pointer;-webkit-tap-highlight-color:transparent;display:inline-flex;align-items:center;flex:0 0 auto');
  });

  it('keeps a safety margin when fitting complex Arabic glyph outlines', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      lineFitWidthRatio: 0.9,
    });

    expect(html).toContain('var lineFitWidthRatio=0.9;');
    expect(html).toContain('var cw=line.clientWidth*lineFitWidthRatio;');
  });

  it('applies the configured Unicode font size scale to the WebView fitter', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      fontSizeScale: 1.25,
    });

    expect(html).toContain('var fontSizeScale=1.25;');
  });

  it('keeps the Unicode page content constrained to the WebView width', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('#content{width:100%;max-width:100%;overflow-x:hidden;min-width:0;min-height:100vh;height:auto;');
  });

  it('lets oversized Unicode pages scroll vertically instead of overlapping lines', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 4,
      words: fullPageWords,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      fontSizeScale: 1.4,
    });

    expect(html).toContain('html,body{min-height:100%;max-width:100vw;overflow-x:hidden;overflow-y:auto');
    expect(html).toContain('#content{width:100%;max-width:100%;overflow-x:hidden;min-width:0;min-height:100vh;height:auto;');
    expect(html).toContain('max-width:100vw;overflow-x:hidden;');
    expect(html).toContain('.line{width:100%;max-width:100%;min-height:max(calc(100vh/15),2em);height:auto;');
    expect(html).toContain('overflow:hidden;');
    expect(html).toContain('.sb.slot{min-height:max(calc(100vh/15),2em);height:auto;');
  });

  it('justifies shorter lines on full Unicode mushaf pages only', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 4,
      words: fullPageWords,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain("var shouldJustifyFullLines=document.body.classList.contains('full')&&!document.body.classList.contains('multiSurah');");
    expect(html).toContain('var minJustifyWidthRatio=0.84;');
    expect(html).toContain("inner.style.width=cw+'px'");
    expect(html).toContain("inner.style.justifyContent='space-between'");
    expect(html).toContain('if(shouldJustifyFullLines&&!isSurahEndLine&&itemCount>1&&sw<cw&&sw>=cw*minJustifyWidthRatio)');
  });

  it('does not justify a short final-ayah line at the end of a surah', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 604,
      words: fullPageWordsWithSurahEnd,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('<div class="line surahEnd" data-line="15" data-surah-end="true"><span class="lineInner">');
    expect(html).toContain("var isSurahEndLine=line.dataset.surahEnd==='true';");
    expect(html).toContain('if(shouldJustifyFullLines&&!isSurahEndLine&&itemCount>1&&sw<cw&&sw>=cw*minJustifyWidthRatio)');
  });

  it('does not justify short lines on multi-surah full pages', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 604,
      words: multiSurahFullPageWords,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('<body class="full multiSurah">');
    expect(html).toContain("var shouldJustifyFullLines=document.body.classList.contains('full')&&!document.body.classList.contains('multiSurah');");
  });

  it('renders surah banners and Bismillah before every surah start on multi-surah pages', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 604,
      words: multiSurahFullPageWords,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      surahNumber: 112,
      bismillahText: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ',
    });

    expect(html).toContain('<span class="sn">surah112</span>');
    expect(html).toContain('<span class="sn">surah113</span>');
    expect(html).toContain('<span class="sn">surah114</span>');
    expect((html.match(/class="bsm/g) ?? []).length).toBe(3);
    expect((html.match(/class="sb slot"/g) ?? []).length).toBe(3);
  });

  it('does not justify compact Unicode mushaf pages', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
    });

    expect(html).toContain('<body class="compact">');
    expect(html).toContain("var shouldJustifyFullLines=document.body.classList.contains('full')&&!document.body.classList.contains('multiSurah');");
  });

  it('applies the selected night reading palette to Unicode mushaf pages', () => {
    const html = generateUnicodeMushafHtml({
      pageNumber: 2,
      words,
      fontBase64: 'font-data',
      fontFamily: 'DigitalKhattIndopak',
      fontFormat: 'opentype',
      fontMimeType: 'font/otf',
      nightReadingMode: 'sepia',
    });

    expect(html).toContain('body{width:100%;max-width:100vw;overflow-x:hidden;min-height:100%;height:auto;background:#1F1814;color:#F0DAB0;');
    expect(html).toContain('.num{font-family:\'Noto Naskh Arabic\',\'Arial\',serif;color:#E0B265;');
    expect(html).toContain('.ayah.sel{background:rgba(200,150,74,0.18);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(200,150,74,0.38)}');
  });
});
