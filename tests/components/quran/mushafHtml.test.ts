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
      word(1, 112, 4, 1, 5, 'وَلَمْ'),
      word(2, 112, 4, 2, 5, 'يَكُن'),
      word(3, 112, 4, 3, 5, 'لَّهُ'),
      word(4, 112, 4, 4, 5, 'كُفُواً'),
      word(5, 112, 4, 5, 5, 'أَحَدٌ'),
      word(6, 112, 4, 6, 5, '٤', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="lc surahEnd" data-surah-end="true"><span class="lineInner"><span class="w" data-s="112" data-a="4">وَلَمْ</span>');
    expect(html).toContain('<span class="w" data-s="112" data-a="4">أَحَدٌ</span> <span class="w" data-s="112" data-a="4">٤</span></span></div>');
    expect(html).not.toContain('<div class="l"><span class="w" data-s="112" data-a="4">وَلَمْ</span>');
  });

  it('keeps non-final short ayah lines on the normal scalable track', () => {
    const words: MushafWord[] = [
      word(1, 112, 3, 1, 4, 'لَمْ'),
      word(2, 112, 3, 2, 4, 'يَلِدْ'),
      word(3, 112, 3, 3, 4, 'وَلَمْ'),
      word(4, 112, 3, 4, 4, 'يُولَدْ'),
      word(5, 112, 3, 5, 4, '٣', 'end'),
    ];

    const html = generateMushafHtml({
      pageNumber: 604,
      words,
      fontBase64: 'font-data',
    });

    expect(html).toContain('<div class="l"><span class="lineInner"><span class="w" data-s="112" data-a="3">لَمْ</span>');
    expect(html).not.toContain('data-surah-end="true"');
  });

  it('centers measured QCF lines instead of stretching short lines', () => {
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

    expect(html).toContain('.l{justify-content:center;transform-origin:center center}');
    expect(html).toContain('.lineInner{display:inline-block;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}');
    expect(html).toContain("var inner=els[i].querySelector('.lineInner');");
    expect(html).toContain("inner.style.transform='scaleX('+s+')'");
    expect(html).not.toContain("els[i].style.transform='scaleX('+s+')'");
    expect(html).toContain("else els[i].style.justifyContent='center'");
    expect(html).not.toContain('MAX_LINE_STRETCH');
  });

  it('applies the configured font size scale to QCF mushaf pages', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
      fontSizeScale: 1.2,
    });

    expect(html).toContain("body{width:100%;max-width:100vw;overflow-x:hidden;min-height:100%;height:auto;background:#F5EEDB;color:#0E2724;font-family:'QCF';font-palette:--QcfSepia;font-size:8.4vw;");
    expect(html).toContain('.group .l,.group .lc{height:auto;display:flex;align-items:center;justify-content:center;white-space:nowrap;font-size:min(8.4vw,33.6px)}');
    expect(html).toContain('.bsm{display:flex;align-items:center;justify-content:center;color:#0E2724;font-family:\'QCF1\';font-palette:--QcfBismillahSepia;font-size:min(6.6vw,28.8px);white-space:nowrap}');
  });

  it('lets oversized QCF pages scroll vertically instead of clipping lines', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: Array.from({ length: 15 }, (_, index) =>
        word(index + 1, 114, index + 1, 1, index + 1, 'مِنَ')
      ),
      fontBase64: 'font-data',
      fontSizeScale: 1.4,
    });

    expect(html).toContain('html{min-height:100%;max-width:100vw;overflow-x:hidden;overflow-y:auto');
    expect(html).toContain('body{width:100%;max-width:100vw;overflow-x:hidden;min-height:100%;height:auto;');
    expect(html).toContain('max-width:100vw;overflow-x:hidden;');
    expect(html).toContain('.l,.lc,.empty{min-height:max(calc(100vh/15),2.2em);height:auto;');
    expect(html).toContain('width:100%;max-width:100%;overflow:hidden;');
    expect(html).toContain('.lineInner{display:inline-block;white-space:nowrap;max-width:none;transform-origin:center center;line-height:1.2}');
    expect(html).toContain('.sb.slot{min-height:max(calc(100vh/15),2.2em);height:auto;');
    expect(html).toContain("var els=document.querySelectorAll('.l,.lc');");
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
    expect(html).toContain("var inner=els[i].querySelector('.lineInner');");
    expect(html).not.toContain("parentElement&&els[i].parentElement.classList.contains('group')");
  });

  it('applies the selected night reading palette to QCF mushaf pages', () => {
    const html = generateMushafHtml({
      pageNumber: 604,
      words: [word(1, 114, 6, 1, 15, 'مِنَ')],
      fontBase64: 'font-data',
      nightReadingMode: 'indigo',
    });

    expect(html).toContain('body{width:100%;max-width:100vw;overflow-x:hidden;min-height:100%;height:auto;background:#0F1428;color:#E2E6F2;');
    expect(html).toContain('.rub{font-family:\'Noto Naskh Arabic\',serif;color:#C8A767;');
    expect(html).toContain('.w.sel,.rub.sel{background:rgba(123,152,214,0.22);border-radius:4px;box-shadow:inset 0 0 0 1px rgba(123,152,214,0.45)}');
  });
});
