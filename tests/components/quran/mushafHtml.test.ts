import { generateMushafHtml } from '../../../src/components/quran/mushafHtml';
import type { MushafWord } from '../../../src/data/types';

const word = (
  id: number,
  surahNumber: number,
  ayahNumber: number,
  wordPosition: number,
  lineNumber: number,
  codeV2: string,
  charType: MushafWord['charType'] = 'word'
): MushafWord => ({
  id,
  surahNumber,
  ayahNumber,
  wordPosition,
  pageNumber: 604,
  lineNumber,
  codeV2,
  charType,
});

describe('generateMushafHtml', () => {
  it('centers a short line that contains the final ayah of a surah', () => {
    const words: MushafWord[] = [
      word(1, 112, 4, 1, 4, 'وَلَمْ'),
      word(2, 112, 4, 2, 4, 'يَكُن'),
      word(3, 112, 4, 3, 4, 'لَّهُ'),
      word(4, 112, 4, 4, 4, 'كُفُواً'),
      word(5, 112, 4, 5, 4, 'أَحَدٌ'),
      word(6, 112, 4, 6, 4, '٤', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="lc surahEnd" data-surah-end="true"><span class="lineInner"><span class="ayahRun" data-s="112" data-a="4"><span class="w" data-wk="112:4:1" data-p="1">وَلَمْ</span>');
    expect(html).toContain('<span class="w" data-wk="112:4:5" data-p="5">أَحَدٌ</span><span class="ayahMarker" data-wk="112:4:6" data-p="6">٤</span></span></span></div>');
    expect(html).not.toContain('<div class="l"><span class="w" data-s="112" data-a="4">وَلَمْ</span>');
  });

  it('keeps non-final short ayah lines on the normal scalable track', () => {
    const words: MushafWord[] = [
      word(1, 112, 3, 1, 3, 'لَمْ'),
      word(2, 112, 3, 2, 3, 'يَلِدْ'),
      word(3, 112, 3, 3, 3, 'وَلَمْ'),
      word(4, 112, 3, 4, 3, 'يُولَدْ'),
      word(5, 112, 3, 5, 3, '٣', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="l"><span class="lineInner"><span class="ayahRun" data-s="112" data-a="3"><span class="w" data-wk="112:3:1" data-p="1">لَمْ</span>');
    expect(html).not.toContain('data-surah-end="true"');
  });

  it('justifies surah endings unless the printed Madani line is explicitly centered', () => {
    const html = generateMushafHtml({
      pageNumber: 49,
      words: [
        word(1, 2, 286, 1, 15, 'وَاعْفُ'),
        word(2, 2, 286, 2, 15, 'عَنَّا'),
        word(3, 2, 286, 3, 15, '٢٨٦', 'end'),
      ],
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="l surahEnd" data-surah-end="true">');
    expect(html).not.toContain('<div class="lc surahEnd"');
  });

  it('selects ayah runs instead of individual words or ayah end markers', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [
        word(1, 112, 3, 1, 4, 'لَمْ'),
        word(2, 112, 3, 2, 4, 'يَلِدْ'),
        word(3, 112, 3, 3, 4, 'وَلَمْ'),
        word(4, 112, 3, 4, 4, 'يُولَدْ'),
        word(5, 112, 3, 5, 4, '٣', 'end'),
      ],
      fontBase64: 'font-data',
    });

    expect(html).toContain('<span class="ayahRun" data-s="112" data-a="3"><span class="w" data-wk="112:3:1" data-p="1">لَمْ</span><span class="w" data-wk="112:3:2" data-p="2">يَلِدْ</span>');
    expect(html).toContain('<span class="ayahMarker" data-wk="112:3:5" data-p="5">٣</span>');
    expect(html).toContain("var runs=document.querySelectorAll('.ayahRun[data-s]');");
    expect(html).not.toContain("var spans=document.querySelectorAll('[data-s]');");
    expect(html).not.toContain('class="w" data-s=');
    expect(html).not.toContain('class="ayahMarker" data-s=');
    expect(html).toContain('data-wk="112:3:1" data-p="1"');
  });

  it('distributes canonical QCF words across each normal line without glyph distortion', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [
        word(1, 114, 5, 1, 14, 'يُوَسْوِسُ'),
        word(2, 114, 5, 2, 14, 'فِي'),
        word(3, 114, 5, 3, 14, 'صُدُورِ'),
        word(4, 114, 5, 4, 14, 'النَّاسِ'),
        word(5, 114, 5, 5, 14, '٥', 'end'),
      ],
      fontBase64: 'font-data',
    });

    expect(html).toContain('.l{justify-content:stretch;transform-origin:center center}');
    expect(html).toContain('.lineInner{display:flex;align-items:center;direction:rtl;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}');
    expect(html).toContain('.l .lineInner{width:100%;justify-content:space-between}');
    expect(html).toContain('.lc .lineInner{width:auto;justify-content:center;gap:.18em}');
    expect(html).toContain('.ayahRun{display:contents}');
    expect(html).toContain('function naturalLineWidth(inner){');
    expect(html).toContain('function fitPageFont(){');
    expect(html).toContain("var targetAvailable=Math.max(0,available-(canvas.classList.contains('compact')?32:0))");
    expect(html).toContain('var naturalWidth=Math.max(inner.clientWidth,naturalLineWidth(inner))');
    expect(html).toContain("canvas.style.fontSize=(fontSize*scale)+'px'");
    expect(html).toContain('#pageViewport{width:100%;height:100%;display:flex;align-items:center;justify-content:center;overflow:visible}');
    expect(html).toContain('#pageCanvas{flex:none;width:100%;height:100%');
    expect(html).not.toContain('#pageCanvas.full{position:relative;left:8vw}');
    expect(html).not.toContain('canvas.style.transform');
    expect(html).not.toContain('scaleX(');
    expect(html).not.toContain('MAX_LINE_STRETCH');
  });

  it('opens the action menu for a tap as well as a long-press selection', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
    });

    expect(html).toContain("postMsg({type:'select',startSurah:sel.startS,startAyah:sel.startA,endSurah:sel.endS,endAyah:sel.endA,x:x,y:y,openMenu:true})");
    expect(html).toContain("postMsg({type:'select',startSurah:ayah.s,startAyah:ayah.a,endSurah:ayah.s,endAyah:ayah.a,x:tx,y:ty,openMenu:true})");
  });

  it('drops a pending long press once the touch travels past the swipe slop', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
    });

    expect(html).toContain('var MOVE_SLOP=10;');
    expect(html).toContain(
      'if(Math.abs(m.clientX-touchStartPoint.x)<=MOVE_SLOP&&Math.abs(m.clientY-touchStartPoint.y)<=MOVE_SLOP)return;'
    );
  });

  it('announces readiness once the page font has been applied', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
    });

    expect(html).toContain("function announceReady(){postMsg({type:'ready'})}");
  });

  it('applies the configured font size scale to QCF mushaf pages', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
      fontSizeScale: 1.2,
    });

    expect(html).toContain("body{background:#F5EEDB;color:#0E2724;font-family:'QCF';font-palette:--QcfSepia;font-size:8.4vw;");
    expect(html).toContain('.group .l,.group .lc{height:auto;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-size:inherit}');
    expect(html).toContain('.bsm{display:flex;align-items:center;justify-content:center;color:#0E2724;font-family:\'QCF1\';font-palette:--QcfBismillahSepia;font-size:min(6.6vw,28.8px);white-space:nowrap}');
  });

  it('keeps oversized QCF pages in fixed slots and scales the page font uniformly', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: Array.from({ length: 15 }, (_, index) =>
        word(index + 1, 114, index + 1, 1, index + 1, 'مِنَ')
      ),
      fontBase64: 'font-data',
      fontSizeScale: 1.4,
    });

    expect(html).toContain('html,body{width:100%;height:100%;max-width:100vw;overflow:visible}');
    expect(html).toContain('#pageCanvas{flex:none;width:100%;height:100%;direction:rtl;display:grid;grid-template-rows:repeat(15,minmax(0,1fr))');
    expect(html).toContain('.lineInner{display:flex;align-items:center;direction:rtl;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}');
    expect(html).toContain("scale=Math.min(scale,(row.clientHeight*.94)/inner.scrollHeight)");
    expect(html).toContain("canvas.style.fontSize=(fontSize*scale)+'px'");
    expect(html).not.toContain('canvas.style.transform');
    expect(html).not.toContain('scaleX(');
  });

  it('fits compact surah pages like Al-Fatihah and first Al-Baqarah instead of clipping them', () => {
    const html = generateMushafHtml({
      pageNumber: 2,
      surahNumber: 2,
      words: [
        word(1, 2, 1, 1, 3, 'الم'),
        word(2, 2, 2, 1, 4, 'ذَٰلِكَ'),
        word(3, 2, 2, 2, 4, 'الْكِتَابُ'),
        word(4, 2, 2, 3, 4, 'لَا'),
        word(5, 2, 2, 4, 4, 'رَيْبَ'),
        word(6, 2, 2, 5, 4, 'فِيهِ'),
        word(7, 2, 2, 6, 4, 'هُدًى'),
      ],
      fontBase64: 'font-data',
      fontSizeScale: 1.4,
    });

    expect(html).toContain('<div class="group">');
    expect(html).toContain('#pageCanvas.compact{display:flex;flex-direction:column;justify-content:center}');
    expect(html).not.toContain('scaleX(');
  });

  it('applies the selected night reading palette to QCF mushaf pages', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
      nightReadingMode: 'indigo',
    });

    expect(html).toContain('body{background:#0F1428;color:#E2E6F2;');
    expect(html).toContain('.rub{font-family:\'Noto Naskh Arabic\',serif;color:#C8A767;');
    expect(html).toContain('.ayahRun.sel>.w,.ayahRun.sel>.ayahMarker,.ayahRun.sel>.rub{background:rgba(123,152,214,0.22);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(123,152,214,0.45)}');
  });
});
